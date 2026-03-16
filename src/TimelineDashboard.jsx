import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Users, Briefcase, Layers, Calendar, Settings2, ZoomIn, ZoomOut, CheckCircle, Info, X } from 'lucide-react';

const JIRA_BASE = 'https://jira2.my-group.net/browse';
const DAY_MS = 86400000;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 52;
const HEADER_HEIGHT_WITH_WEEKS = 68;

// ISO week number
const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / DAY_MS) + 1) / 7);
};
const MIN_COL_WIDTH = 40;

const ZOOM_PRESETS = {
    day: { colWidth: 40, min: 20, max: 80, label: 'Day' },
    month: { colWidth: 6, min: 2, max: 20, label: 'Month' },
    quarter: { colWidth: 2, min: 1, max: 8, label: 'Quarter' },
};

const STATUS_COLORS = {
    'Done': { bg: 'bg-emerald-500', hex: '#10b981' },
    'In Progress': { bg: 'bg-blue-500', hex: '#3b82f6' },
    'To Do': { bg: 'bg-slate-400', hex: '#94a3b8' },
    'QA In Progress': { bg: 'bg-amber-500', hex: '#f59e0b' },
    'Wait for PROD': { bg: 'bg-purple-500', hex: '#a855f7' },
    "Won't Fix/Pending": { bg: 'bg-slate-300', hex: '#cbd5e1' },
};

const getStatusGroup = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'done' || s === 'closed' || s === 'resolved') return 'Done';
    if (s.includes('qa') || s.includes('review') || s.includes('testing')) return 'QA In Progress';
    if (s.includes('prod') || s.includes('deploy') || s.includes('release') || s.includes('wait')) return 'Wait for PROD';
    if (s === 'to do' || s === 'open' || s === 'backlog' || s === 'new') return 'To Do';
    if (s.includes("won't") || s.includes('pending') || s.includes('cancel')) return "Won't Fix/Pending";
    return 'In Progress';
};

const getStatusColor = (status) => STATUS_COLORS[getStatusGroup(status)] || STATUS_COLORS['In Progress'];

const formatDateFull = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// All available fixed columns
const ALL_COLUMNS = [
    { key: 'id', label: 'Issue Key', minWidth: 100, defaultWidth: 110, getValue: (task) => task.id },
    { key: 'summary', label: 'Summary', minWidth: 100, defaultWidth: 180, getValue: (task) => task.summary },
    { key: 'assignee', label: 'Assignee', minWidth: 80, defaultWidth: 120, getValue: (task) => task.assignee },
    { key: 'status', label: 'Status', minWidth: 70, defaultWidth: 90, getValue: (task) => task.status },
    { key: 'startDate', label: 'Start Date', minWidth: 80, defaultWidth: 90, getValue: (task) => formatDateFull(task.startDate) },
    { key: 'dueDate', label: 'Target End', minWidth: 80, defaultWidth: 90, getValue: (task) => formatDateFull(task.dueDate) },
    { key: 'endDate', label: 'End Date', minWidth: 80, defaultWidth: 90, getValue: (task) => formatDateFull(task.endDate) },
    { key: 'project', label: 'Project', minWidth: 80, defaultWidth: 100, getValue: (task) => task.project },
    { key: 'epicName', label: 'Epic', minWidth: 80, defaultWidth: 120, getValue: (task) => task.epicName || '-' },
    { key: 'priority', label: 'Priority', minWidth: 60, defaultWidth: 80, getValue: (task) => task.priority || '-' },
    { key: 'devTime', label: 'Dev Days', minWidth: 60, defaultWidth: 70, getValue: (task) => task.devTime },
    { key: 'delayDays', label: 'Delay Days', minWidth: 60, defaultWidth: 70, getValue: (task) => task.delayDays },
];

const DEFAULT_VISIBLE_COLS = ['id', 'summary', 'assignee', 'startDate', 'dueDate'];

export default function TimelineDashboard({ dark, lang, filteredData, epicMap, t, minDelay, dateType }) {
    const [groupBy, setGroupBy] = useState('assignee');
    const [zoomLevel, setZoomLevel] = useState('month');
    const [zoomScale, setZoomScale] = useState(ZOOM_PRESETS.month.colWidth);
    const [tooltip, setTooltip] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [visibleCols, setVisibleCols] = useState(() => {
        try {
            const saved = localStorage.getItem('timeline-columns');
            return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLS;
        } catch { return DEFAULT_VISIBLE_COLS; }
    });
    const [colWidths, setColWidths] = useState(() => {
        try {
            const saved = localStorage.getItem('timeline-col-widths');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const [showColSettings, setShowColSettings] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [resizing, setResizing] = useState(null);
    const scrollRef = useRef(null);
    const containerRef = useRef(null);
    const headerScrollRef = useRef(null);
    const colSettingsRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    const colWidth = zoomScale;

    // When zoom level changes, reset scale to preset default
    const changeZoomLevel = (level) => {
        setZoomLevel(level);
        setZoomScale(ZOOM_PRESETS[level].colWidth);
    };

    const zoomIn = () => setZoomScale(prev => Math.min(prev + (zoomLevel === 'day' ? 5 : zoomLevel === 'month' ? 2 : 1), ZOOM_PRESETS[zoomLevel].max));
    const zoomOut = () => setZoomScale(prev => Math.max(prev - (zoomLevel === 'day' ? 5 : zoomLevel === 'month' ? 2 : 1), ZOOM_PRESETS[zoomLevel].min));

    // Track container width for ensuring timeline fills visible area
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => { for (const e of entries) setContainerWidth(e.contentRect.width); });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Persist column choices
    useEffect(() => { localStorage.setItem('timeline-columns', JSON.stringify(visibleCols)); }, [visibleCols]);
    useEffect(() => { localStorage.setItem('timeline-col-widths', JSON.stringify(colWidths)); }, [colWidths]);

    // Close column settings on outside click
    useEffect(() => {
        const handler = (e) => {
            if (colSettingsRef.current && !colSettingsRef.current.contains(e.target)) setShowColSettings(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleGroup = (name) => setCollapsedGroups(prev => ({ ...prev, [name]: !prev[name] }));

    const toggleCol = (key) => {
        setVisibleCols(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 1) return prev;
                return prev.filter(k => k !== key);
            }
            return [...prev, key];
        });
    };

    const getColWidth = (key) => {
        if (colWidths[key]) return colWidths[key];
        const col = ALL_COLUMNS.find(c => c.key === key);
        return col ? col.defaultWidth : 100;
    };

    const totalFixedWidth = useMemo(() => visibleCols.reduce((sum, key) => sum + getColWidth(key), 0), [visibleCols, colWidths]);

    // Column resize handlers
    const handleResizeStart = useCallback((e, colKey) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = getColWidth(colKey);
        const col = ALL_COLUMNS.find(c => c.key === colKey);
        const minW = col ? col.minWidth : MIN_COL_WIDTH;

        const onMouseMove = (ev) => {
            const delta = ev.clientX - startX;
            setColWidths(prev => ({ ...prev, [colKey]: Math.max(minW, startWidth + delta) }));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setResizing(null);
        };
        setResizing(colKey);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [colWidths]);

    // Delay-filtered data
    const rangeFilteredData = useMemo(() => {
        if (minDelay === '') return filteredData;
        const min = parseInt(minDelay, 10);
        if (isNaN(min)) return filteredData;
        if (min === 0) return filteredData.filter(d => d.delayDays === 0 || d.devTime === d.delayDays);
        return filteredData.filter(d => {
            const realDelay = (d.devTime === d.delayDays) ? 0 : d.delayDays;
            return realDelay <= min;
        });
    }, [filteredData, minDelay]);

    // Grouped & sorted data
    const { groups, rangeStart, rangeEnd, totalDays, dateColumns } = useMemo(() => {
        const tasks = rangeFilteredData.filter(d => d.startDate && d.endDate);
        if (tasks.length === 0) return { groups: [], rangeStart: new Date(), rangeEnd: new Date(), totalDays: 1, dateColumns: [] };

        const groupMap = {};
        tasks.forEach(task => {
            let key;
            if (groupBy === 'assignee') key = task.assignee || 'Unassigned';
            else if (groupBy === 'project') key = task.project || 'Unknown';
            else if (groupBy === 'status') key = getStatusGroup(task.status);
            else key = task.epicName || task.epicLink || 'No Epic';
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(task);
        });

        const sortedGroups = Object.keys(groupMap).sort().map(name => ({
            name,
            tasks: groupMap[name].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        }));

        let minDate = Infinity, maxDate = -Infinity;
        tasks.forEach(tk => {
            const s = new Date(tk.startDate).getTime();
            const e = new Date(tk.endDate).getTime();
            const d = new Date(tk.dueDate).getTime();
            if (s < minDate) minDate = s;
            if (e > maxDate) maxDate = e;
            if (d > maxDate) maxDate = d;
        });
        // Extend timeline to at least end of month+2 from today to fill visible area
        const now = new Date();
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 3, 0).getTime();
        if (endOfNextMonth > maxDate) maxDate = endOfNextMonth;
        // Also ensure today is included
        const todayMs = now.getTime();
        if (todayMs > maxDate) maxDate = todayMs;

        const padding = 3 * DAY_MS;
        const rStart = new Date(minDate - padding);
        let rEnd = new Date(maxDate + padding);

        // Extend range so the timeline fills the visible container width
        const visibleTimelineWidth = containerWidth - totalFixedWidth;
        if (visibleTimelineWidth > 0 && colWidth > 0) {
            const minDays = Math.ceil(visibleTimelineWidth / colWidth);
            const currentDays = Math.ceil((rEnd - rStart) / DAY_MS);
            if (currentDays < minDays) {
                rEnd = new Date(rStart.getTime() + minDays * DAY_MS);
            }
        }

        const tDays = Math.ceil((rEnd - rStart) / DAY_MS);
        const cols = [];
        for (let i = 0; i < tDays; i++) {
            cols.push(new Date(rStart.getTime() + i * DAY_MS));
        }
        return { groups: sortedGroups, rangeStart: rStart, rangeEnd: rEnd, totalDays: tDays, dateColumns: cols };
    }, [rangeFilteredData, groupBy, containerWidth, totalFixedWidth, colWidth]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPx = ((new Date(todayStr).getTime() - rangeStart.getTime()) / DAY_MS) * colWidth;
    const totalWidth = totalDays * colWidth;
    const showWeekRow = zoomLevel === 'day' && dateType === 'weekly';
    const headerHeight = showWeekRow ? HEADER_HEIGHT_WITH_WEEKS : HEADER_HEIGHT;

    // Auto-scroll to today on mount/zoom change
    useEffect(() => {
        if (scrollRef.current && todayPx > 0) {
            const visibleWidth = scrollRef.current.clientWidth - totalFixedWidth;
            const scrollTarget = Math.max(0, todayPx - visibleWidth / 3);
            scrollRef.current.scrollLeft = scrollTarget;
            if (headerScrollRef.current) headerScrollRef.current.scrollLeft = scrollTarget;
        }
    }, [todayPx, colWidth, totalFixedWidth]);

    // Sync horizontal scroll from body to header + auto-show/hide scrollbar
    const scrollTimerRef = useRef(null);
    const handleScroll = useCallback(() => {
        if (scrollRef.current && headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
        }
        // Show scrollbar during scroll, fade after 1.2s idle
        if (scrollRef.current) {
            scrollRef.current.classList.add('is-scrolling');
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
            scrollTimerRef.current = setTimeout(() => {
                if (scrollRef.current) scrollRef.current.classList.remove('is-scrolling');
            }, 1200);
        }
    }, []);

    const getLeftPx = (dateStr) => ((new Date(dateStr).getTime() - rangeStart.getTime()) / DAY_MS) * colWidth;
    const getWidthPx = (startStr, endStr) => Math.max(colWidth * 0.5, ((new Date(endStr).getTime() - new Date(startStr).getTime()) / DAY_MS) * colWidth);

    const handleBarHover = (e, task) => {
        const tooltipW = 260;
        const tooltipH = 220;
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        let fx = e.clientX + 12;
        let fy = e.clientY + 12;
        // Flip left if overflows right
        if (fx + tooltipW > viewW) fx = e.clientX - tooltipW - 8;
        // Flip above if overflows bottom
        if (fy + tooltipH > viewH) fy = e.clientY - tooltipH - 8;
        setTooltip({ task, fixedX: Math.max(4, fx), fixedY: Math.max(4, fy) });
    };

    const panel = `rounded-xl shadow-sm border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;

    const groupByOptions = [
        { value: 'assignee', label: t.assignee || 'Assignee', icon: Users },
        { value: 'project', label: 'Project', icon: Briefcase },
        { value: 'epic', label: 'Epic', icon: Layers },
        { value: 'status', label: t.status || 'Status', icon: CheckCircle },
    ];

    const getColLabel = (key) => {
        const map = {
            id: t.issueKey || 'Issue Key', summary: t.summary || 'Summary',
            assignee: t.assignee || 'Assignee', status: t.status || 'Status',
            startDate: 'Start Date', dueDate: t.dueDate || 'Target End',
            endDate: t.endDate || 'End Date', project: 'Project', epicName: 'Epic',
            priority: 'Priority', devTime: t.devDays || 'Dev Days', delayDays: t.delayDays || 'Delay Days',
        };
        return map[key] || key;
    };

    // Render date header
    const renderDateHeader = () => {
        if (zoomLevel === 'day') {
            // Build week groups for the week row
            const weeks = [];
            if (showWeekRow) {
                let cur = null;
                dateColumns.forEach((d) => {
                    const wk = getISOWeek(d);
                    const yr = d.getFullYear();
                    const key = `${yr}-W${wk}`;
                    if (cur?.key !== key) { cur = { key, week: wk, days: 0 }; weeks.push(cur); }
                    cur.days++;
                });
            }

            const dayRow = dateColumns.map((d, i) => {
                const isFirstOfMonth = d.getDate() === 1;
                const isToday = d.toISOString().split('T')[0] === todayStr;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isMonday = d.getDay() === 1;
                return (
                    <div key={i} className={`shrink-0 flex flex-col items-center justify-center text-[10px] border-r ${
                        isToday ? 'bg-red-500/10 font-bold' : isWeekend ? (dark ? 'bg-slate-700/30' : 'bg-slate-50') : ''
                    } ${dark ? 'border-slate-700/50 text-slate-400' : 'border-slate-100 text-slate-500'}`} style={{ width: colWidth }}>
                        {(isFirstOfMonth || i === 0) && (
                            <span className={`font-semibold ${isToday ? (dark ? 'text-red-400' : 'text-red-600') : ''}`}>
                                {d.toLocaleString(lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' })}
                            </span>
                        )}
                        <span className={isToday ? (dark ? 'text-red-400' : 'text-red-600') : isMonday ? 'font-semibold' : ''}>
                            {d.getDate()}
                        </span>
                    </div>
                );
            });

            if (showWeekRow) {
                return (
                    <div className="flex flex-col" style={{ width: totalWidth }}>
                        {/* Week row */}
                        <div className="flex" style={{ height: 16 }}>
                            {weeks.map((w) => (
                                <div key={w.key}
                                    className={`shrink-0 flex items-center justify-center text-[9px] font-semibold border-r border-b ${
                                        dark ? 'border-slate-700/50 text-blue-400 bg-slate-800/80' : 'border-slate-200 text-blue-600 bg-slate-50/80'
                                    }`}
                                    style={{ width: w.days * colWidth }}>
                                    W{w.week}
                                </div>
                            ))}
                        </div>
                        {/* Day row */}
                        <div className="flex" style={{ flex: 1 }}>
                            {dayRow}
                        </div>
                    </div>
                );
            }

            return dayRow;
        }
        if (zoomLevel === 'month') {
            const months = [];
            let cur = null;
            dateColumns.forEach((d) => {
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                if (cur?.key !== key) { cur = { key, date: d, days: 0 }; months.push(cur); }
                cur.days++;
            });
            return months.map((m) => {
                const now = new Date();
                const isCurrent = now.getFullYear() === m.date.getFullYear() && now.getMonth() === m.date.getMonth();
                return (
                    <div key={m.key} className={`shrink-0 flex items-center justify-center text-xs font-medium border-r ${
                        isCurrent ? 'bg-red-500/10' : ''
                    } ${dark ? 'border-slate-700/50 text-slate-300' : 'border-slate-200 text-slate-600'}`} style={{ width: m.days * colWidth }}>
                        {m.date.toLocaleString(lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', year: '2-digit' })}
                    </div>
                );
            });
        }
        // Quarter
        const quarters = [];
        let curQ = null;
        dateColumns.forEach((d) => {
            const q = Math.floor(d.getMonth() / 3) + 1;
            const key = `${d.getFullYear()}-Q${q}`;
            if (curQ?.key !== key) { curQ = { key, year: d.getFullYear(), q, days: 0 }; quarters.push(curQ); }
            curQ.days++;
        });
        return quarters.map((q) => {
            const now = new Date();
            const isCurrent = now.getFullYear() === q.year && Math.floor(now.getMonth() / 3) + 1 === q.q;
            return (
                <div key={q.key} className={`shrink-0 flex items-center justify-center text-xs font-medium border-r ${
                    isCurrent ? 'bg-red-500/10' : ''
                } ${dark ? 'border-slate-700/50 text-slate-300' : 'border-slate-200 text-slate-600'}`} style={{ width: q.days * colWidth }}>
                    Q{q.q} {q.year}
                </div>
            );
        });
    };

    const activeCols = useMemo(() => visibleCols.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean), [visibleCols]);

    // Render a task bar with delay visualization
    const renderTaskBar = (task) => {
        const startMs = new Date(task.startDate).getTime();
        const endMs = new Date(task.endDate).getTime();
        const dueMs = new Date(task.dueDate).getTime();
        // If devTime equals delayDays, the task was completed instantly relative to its timeline — not a real delay
        const isDelayed = task.delayDays > 0 && task.devTime !== task.delayDays;
        const statusColor = getStatusColor(task.status);
        const barLeft = getLeftPx(task.startDate);
        const barTotalWidth = getWidthPx(task.startDate, task.endDate);

        if (isDelayed && dueMs > startMs && endMs > dueMs) {
            // Split bar: on-time portion + delay portion
            const onTimeWidth = getWidthPx(task.startDate, task.dueDate);
            const delayWidth = Math.max(4, barTotalWidth - onTimeWidth);

            return (
                <div
                    key={task.id}
                    className={`relative border-b ${dark ? 'border-slate-700/50' : 'border-slate-50'}`}
                    style={{ height: ROW_HEIGHT }}
                >
                    {/* Due date diamond marker */}
                    <div className="absolute z-[1] pointer-events-none" style={{ left: getLeftPx(task.dueDate) - 4, top: 2 }}>
                        <div className="w-2 h-2 rotate-45 bg-red-500 border border-red-600" />
                    </div>

                    {/* On-time portion */}
                    <div
                        className={`absolute rounded-l cursor-pointer transition-all hover:brightness-110 hover:shadow-md ${statusColor.bg}`}
                        style={{ left: barLeft, width: Math.max(4, onTimeWidth), top: 5, height: ROW_HEIGHT - 10 }}
                        onMouseEnter={(e) => handleBarHover(e, task)}
                        onMouseMove={(e) => handleBarHover(e, task)}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {onTimeWidth > 50 && (
                            <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate">
                                {task.id}
                            </span>
                        )}
                    </div>

                    {/* Delay portion (striped red) */}
                    <div
                        className="absolute rounded-r cursor-pointer transition-all hover:brightness-110 hover:shadow-md"
                        style={{
                            left: barLeft + Math.max(4, onTimeWidth),
                            width: delayWidth,
                            top: 5,
                            height: ROW_HEIGHT - 10,
                            background: dark
                                ? 'repeating-linear-gradient(135deg, #ef4444, #ef4444 3px, #dc2626 3px, #dc2626 6px)'
                                : 'repeating-linear-gradient(135deg, #f87171, #f87171 3px, #ef4444 3px, #ef4444 6px)',
                        }}
                        onMouseEnter={(e) => handleBarHover(e, task)}
                        onMouseMove={(e) => handleBarHover(e, task)}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {delayWidth > 30 && onTimeWidth <= 50 && (
                            <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate">
                                {task.id}
                            </span>
                        )}
                    </div>

                    {/* Delay badge */}
                    {delayWidth > 3 && (
                        <div
                            className="absolute flex items-center pointer-events-none"
                            style={{ left: barLeft + Math.max(4, onTimeWidth) + delayWidth + 4, top: 7, height: ROW_HEIGHT - 14 }}
                        >
                            <span className="text-[9px] font-bold text-red-500 whitespace-nowrap">
                                +{task.delayDays}d
                            </span>
                        </div>
                    )}
                </div>
            );
        }

        // Non-delayed or fully delayed bar (normal render)
        return (
            <div
                key={task.id}
                className={`relative border-b ${dark ? 'border-slate-700/50' : 'border-slate-50'}`}
                style={{ height: ROW_HEIGHT }}
            >
                {/* Due date diamond marker (only in day zoom) */}
                {task.dueDate && zoomLevel === 'day' && !isDelayed && (
                    <div className="absolute z-[1] pointer-events-none" style={{ left: getLeftPx(task.dueDate) - 4, top: 2 }}>
                        <div className={`w-2 h-2 rotate-45 ${dark ? 'bg-slate-500 border-slate-400' : 'bg-slate-400 border-slate-500'} border`} />
                    </div>
                )}
                {/* Task bar */}
                <div
                    className={`absolute rounded cursor-pointer transition-all hover:brightness-110 hover:shadow-md ${statusColor.bg} ${isDelayed ? 'ring-2 ring-red-500/60' : ''}`}
                    style={{ left: barLeft, width: Math.max(4, barTotalWidth), top: 5, height: ROW_HEIGHT - 10 }}
                    onMouseEnter={(e) => handleBarHover(e, task)}
                    onMouseMove={(e) => handleBarHover(e, task)}
                    onMouseLeave={() => setTooltip(null)}
                >
                    {barTotalWidth > 50 && (
                        <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium text-white truncate">
                            {task.id}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3 mt-4">
            {/* Controls bar */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Group by */}
                        <span className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t.groupBy || 'Group by'}:
                        </span>
                        {groupByOptions.map(opt => {
                            const Icon = opt.icon;
                            const active = groupBy === opt.value;
                            return (
                                <button key={opt.value} onClick={() => setGroupBy(opt.value)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        active ? 'bg-blue-500 text-white' : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}>
                                    <Icon size={13} />
                                    {opt.label}
                                </button>
                            );
                        })}

                        <div className={`w-px h-5 mx-1 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

                        {/* Zoom level presets */}
                        <span className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Zoom:
                        </span>
                        {Object.entries(ZOOM_PRESETS).map(([key, { label }]) => (
                            <button key={key} onClick={() => changeZoomLevel(key)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    zoomLevel === key ? 'bg-blue-500 text-white' : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}>
                                {label}
                            </button>
                        ))}

                        {/* Zoom in/out fine control */}
                        <div className="flex items-center gap-0.5">
                            <button onClick={zoomOut} title="Zoom out"
                                className={`p-1 rounded transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <ZoomOut size={14} />
                            </button>
                            <span className={`text-[10px] min-w-[2rem] text-center tabular-nums ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {zoomScale}px
                            </span>
                            <button onClick={zoomIn} title="Zoom in"
                                className={`p-1 rounded transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                                <ZoomIn size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Column settings */}
                        <div className="relative" ref={colSettingsRef}>
                            <button onClick={() => setShowColSettings(prev => !prev)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    showColSettings ? 'bg-blue-500 text-white' : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}>
                                <Settings2 size={13} />
                                {t.columns || 'Columns'}
                            </button>
                            {showColSettings && (
                                <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg shadow-lg border p-2 min-w-[200px] ${
                                    dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                                }`}>
                                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 px-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {t.visibleColumns || 'Visible Columns'}
                                    </p>
                                    {ALL_COLUMNS.map(col => (
                                        <label key={col.key} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                                            dark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                                        }`}>
                                            <input type="checkbox" checked={visibleCols.includes(col.key)} onChange={() => toggleCol(col.key)}
                                                className="rounded border-slate-300 text-blue-500 focus:ring-blue-500" />
                                            {getColLabel(col.key)}
                                        </label>
                                    ))}
                                    <div className={`border-t mt-1.5 pt-1.5 px-2 ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                                        <button onClick={() => { setVisibleCols(DEFAULT_VISIBLE_COLS); setColWidths({}); }}
                                            className="text-[10px] text-blue-500 hover:text-blue-400">
                                            {t.reset || 'Reset'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Today button */}
                        <button onClick={() => {
                            if (scrollRef.current) {
                                const visW = scrollRef.current.clientWidth - totalFixedWidth;
                                scrollRef.current.scrollTo({ left: Math.max(0, todayPx - visW / 3), behavior: 'smooth' });
                            }
                        }} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            dark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}>
                            <Calendar size={13} />
                            {t.today || 'Today'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Gantt Chart */}
            {groups.length === 0 ? (
                <div className={`${panel} p-12 text-center`}>
                    <Calendar size={48} className={`mx-auto mb-3 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.noData || 'No tasks to display'}</p>
                </div>
            ) : (
                <div className={`${panel} overflow-hidden`} ref={containerRef} style={{ position: 'relative' }}>
                    {/* Sticky column headers row */}
                    <div className="flex" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                        <div className={`shrink-0 flex border-b border-r ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                            style={{ width: totalFixedWidth, height: headerHeight }}>
                            {activeCols.map((col) => (
                                <div key={col.key}
                                    className={`relative flex items-center px-2 text-xs font-semibold uppercase tracking-wider select-none ${dark ? 'text-slate-400' : 'text-slate-500'}`}
                                    style={{ width: getColWidth(col.key), minWidth: col.minWidth }}>
                                    <span className="truncate">{getColLabel(col.key)}</span>
                                    <div className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group flex items-center justify-center hover:bg-blue-500/30 ${resizing === col.key ? 'bg-blue-500/40' : ''}`}
                                        onMouseDown={(e) => handleResizeStart(e, col.key)}>
                                        <div className={`w-px h-4 ${dark ? 'bg-slate-600 group-hover:bg-blue-400' : 'bg-slate-300 group-hover:bg-blue-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div ref={headerScrollRef} className="flex-1 overflow-hidden relative"
                            style={{ height: headerHeight }}>
                            <div className={`flex border-b ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                style={{ width: totalWidth, height: headerHeight, position: 'relative' }}>
                                {renderDateHeader()}
                                {/* Today marker in header */}
                                {todayPx > 0 && todayPx < totalWidth && (
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[2] pointer-events-none" style={{ left: todayPx }}>
                                        <div className="absolute -top-0 -left-2.5 bg-red-500 text-white text-[9px] px-1 rounded-b font-bold">
                                            {t.today || 'Today'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable body — single vertical scroll */}
                    <div ref={scrollRef} className="overflow-auto thin-scrollbar"
                        onScroll={handleScroll}
                        style={{ maxHeight: 'calc(100vh - 370px)' }}>
                        <div className="flex" style={{ minWidth: totalFixedWidth + totalWidth }}>
                            {/* Left: Fixed columns body */}
                            <div className={`shrink-0 border-r sticky left-0 z-10 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                                style={{ width: totalFixedWidth }}>
                                {groups.map(group => (
                                    <div key={group.name}>
                                        <button onClick={() => toggleGroup(group.name)}
                                            className={`w-full text-left px-2 flex items-center gap-1.5 text-xs font-semibold border-b transition-colors ${
                                                dark ? 'border-slate-700 text-slate-200 hover:bg-slate-700/50 bg-slate-750' : 'border-slate-100 text-slate-700 hover:bg-slate-50 bg-slate-50'
                                            }`} style={{ height: ROW_HEIGHT }}>
                                            <span className={`text-[9px] transition-transform ${collapsedGroups[group.name] ? '' : 'rotate-90'}`}>▶</span>
                                            {groupBy === 'status' && (
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${(STATUS_COLORS[group.name] || STATUS_COLORS['In Progress']).bg}`} />
                                            )}
                                            <span className="truncate">{group.name}</span>
                                            <span className={`ml-auto text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{group.tasks.length}</span>
                                        </button>
                                        {!collapsedGroups[group.name] && group.tasks.map(task => (
                                            <div key={task.id}
                                                className={`flex items-center border-b text-xs ${dark ? 'border-slate-700/50' : 'border-slate-50'}`}
                                                style={{ height: ROW_HEIGHT }}>
                                                {activeCols.map(col => (
                                                    <div key={col.key}
                                                        className={`px-2 truncate ${
                                                            col.key === 'id' ? `font-mono ${dark ? 'text-blue-400' : 'text-blue-600'}`
                                                            : col.key === 'status' ? 'flex items-center gap-1'
                                                            : col.key === 'delayDays' && task.delayDays > 0 && task.devTime !== task.delayDays ? 'text-red-500 font-medium'
                                                            : dark ? 'text-slate-400' : 'text-slate-500'
                                                        }`}
                                                        style={{ width: getColWidth(col.key), minWidth: col.minWidth }}
                                                        title={String(col.getValue(task))}>
                                                        {col.key === 'id' ? (
                                                            <a href={`${JIRA_BASE}/${task.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{task.id}</a>
                                                        ) : col.key === 'status' ? (
                                                            <><span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(task.status).bg}`} />
                                                            <span className="truncate">{task.status}</span></>
                                                        ) : col.getValue(task)}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Right: Timeline body */}
                            <div style={{ width: totalWidth, position: 'relative' }}>
                                {groups.map(group => (
                                    <div key={group.name}>
                                        <div className={`border-b ${dark ? 'bg-slate-750 border-slate-700' : 'bg-slate-50 border-slate-100'}`} style={{ height: ROW_HEIGHT }} />
                                        {!collapsedGroups[group.name] && group.tasks.map(task => renderTaskBar(task))}
                                    </div>
                                ))}

                                {/* Today line (badge is in sticky header) */}
                                {todayPx > 0 && todayPx < totalWidth && (
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[5] pointer-events-none" style={{ left: todayPx }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tooltip — uses fixed positioning for reliable placement */}
                    {tooltip && (
                        <div className={`fixed z-50 pointer-events-none rounded-lg shadow-lg border p-3 text-xs max-w-xs ${
                            dark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                        }`} style={{ left: tooltip.fixedX, top: tooltip.fixedY }}>
                            <a href={`${JIRA_BASE}/${tooltip.task.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-sm mb-1.5 text-blue-400 hover:underline pointer-events-auto block">{tooltip.task.id}</a>
                            <div className={`mb-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{tooltip.task.summary}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.assignee || 'Assignee'}:</span>
                                <span className="font-medium">{tooltip.task.assignee}</span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.status || 'Status'}:</span>
                                <span className="font-medium flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(tooltip.task.status).bg}`} />
                                    {tooltip.task.status}
                                </span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Start:</span>
                                <span>{formatDateFull(tooltip.task.startDate)}</span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.dueDate || 'Target End'}:</span>
                                <span>{formatDateFull(tooltip.task.dueDate)}</span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.lastUpdated || 'Updated'}:</span>
                                <span>{formatDateFull(tooltip.task.endDate)}</span>
                                {['Done', 'Wait PROD'].includes(tooltip.task.status) && (
                                    <>
                                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.devDays || 'Dev'}:</span>
                                        <span>{tooltip.task.devTime} {t.days || 'days'}</span>
                                    </>
                                )}
                                {tooltip.task.delayDays > 0 && tooltip.task.devTime !== tooltip.task.delayDays && (
                                    <>
                                        <span className="text-red-400">{t.delayDays || 'Delay'}:</span>
                                        <span className="text-red-400 font-medium">{tooltip.task.delayDays} {t.days || 'days'}</span>
                                    </>
                                )}
                                {tooltip.task.epicName && (
                                    <>
                                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Epic:</span>
                                        <span className="truncate">{tooltip.task.epicName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Legend — below Gantt chart */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-2">
                {Object.entries(STATUS_COLORS).map(([name, { hex }]) => (
                    <div key={name} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: hex }} />
                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{name}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(135deg, #f87171, #f87171 2px, #ef4444 2px, #ef4444 4px)' }} />
                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.delayed || 'Delayed'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rotate-45 bg-red-500 border border-red-600" />
                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{t.dueDate || 'Target End'}</span>
                </div>
                <button
                    onClick={() => setShowInfo(true)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-500/20 transition-colors ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    title={lang === 'th' ? 'รายละเอียดการคำนวณ' : 'Calculation details'}
                >
                    <Info size={14} />
                </button>
                <span className={`ml-auto ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {rangeFilteredData.length} {t.tasks || 'tasks'}
                </span>
            </div>

            {/* Info Modal — Per-Status Behavior */}
            {showInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowInfo(false)}>
                    <div className={`relative max-w-lg w-full mx-4 rounded-xl shadow-2xl border p-5 ${dark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                        onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowInfo(false)} className={`absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-500/20 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-bold mb-1">{lang === 'th' ? 'การคำนวณ Timeline' : lang === 'zh' ? '时间线计算逻辑' : 'Timeline Calculation'}</h3>
                        <p className={`text-xs mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {lang === 'th' ? 'ข้อมูลที่ใช้ในการแสดง Bar Chart และการคำนวณ Delay' : lang === 'zh' ? '条形图显示和延迟计算所用的数据字段' : 'Data fields used for bar chart display and delay calculation'}
                        </p>

                        {/* Field Mapping */}
                        <div className={`text-xs rounded-lg border p-3 mb-3 ${dark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="font-semibold mb-1.5">{lang === 'th' ? 'แหล่งข้อมูล (Jira Fields)' : lang === 'zh' ? '数据来源 (Jira字段)' : 'Data Source (Jira Fields)'}</div>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Start Date:</span>
                                <span>Target Start → Created</span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Target Date:</span>
                                <span>Target End → Due Date → Updated</span>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Updated Date:</span>
                                <span>Updated (Jira)</span>
                            </div>
                            <div className={`mt-2 pt-2 border-t ${dark ? 'border-slate-600' : 'border-slate-300'}`}>
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Dev Days</span> = Updated − Start &nbsp;|&nbsp;
                                <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Delay</span> = max(0, Updated − Target Date)
                            </div>
                        </div>

                        {/* Per-Status Table */}
                        <div className="text-xs">
                            <div className="font-semibold mb-1.5">{lang === 'th' ? 'พฤติกรรมตามสถานะ' : lang === 'zh' ? '各状态行为' : 'Per-Status Behavior'}</div>
                            <table className="w-full">
                                <thead>
                                    <tr className={dark ? 'text-slate-400' : 'text-slate-500'}>
                                        <th className="text-left py-1 pr-2 font-medium">Status</th>
                                        <th className="text-left py-1 pr-2 font-medium">Bar</th>
                                        <th className="text-left py-1 font-medium">{lang === 'th' ? 'แสดงผล' : lang === 'zh' ? '显示' : 'Display'}</th>
                                    </tr>
                                </thead>
                                <tbody className={`${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {[
                                        { status: 'Done', color: STATUS_COLORS['Done']?.hex, desc: lang === 'th' ? 'Updated = วันที่เสร็จ, แสดง Dev Days + Delay ถ้ามี' : 'Updated ≈ completion date, shows Dev Days + Delay if any' },
                                        { status: 'Wait PROD', color: STATUS_COLORS['Wait PROD']?.hex, desc: lang === 'th' ? 'เหมือน Done — งานเสร็จแล้ว รอ deploy' : 'Same as Done — work finished, awaiting deploy' },
                                        { status: 'In Progress', color: STATUS_COLORS['In Progress']?.hex, desc: lang === 'th' ? 'Updated = อัพเดทล่าสุด, อาจแสดง Delay ที่ไม่ถูกต้อง' : 'Updated = last edit, may show misleading delay' },
                                        { status: 'QA In Progress', color: STATUS_COLORS['QA In Progress']?.hex, desc: lang === 'th' ? 'เหมือน In Progress — กำลัง QA' : 'Same as In Progress — under QA' },
                                        { status: 'To Do', color: STATUS_COLORS['To Do']?.hex, desc: lang === 'th' ? 'Bar สั้น, ปกติไม่แสดง Delay' : 'Short bar, usually no delay shown' },
                                        { status: 'Backlog', color: STATUS_COLORS['Backlog']?.hex, desc: lang === 'th' ? 'เหมือน To Do — ยังไม่เริ่มทำ' : 'Same as To Do — not started' },
                                    ].map(({ status, color, desc }) => (
                                        <tr key={status} className={`border-t ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                                            <td className="py-1.5 pr-2 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="py-1.5 pr-2 whitespace-nowrap">Start → Updated</td>
                                            <td className="py-1.5">{desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Delay note */}
                        <div className={`mt-3 text-xs flex items-start gap-2 rounded-lg border p-2.5 ${dark ? 'bg-red-900/20 border-red-800/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <div className="w-3 h-3 mt-0.5 shrink-0 rounded-sm" style={{ background: 'repeating-linear-gradient(135deg, #f87171, #f87171 2px, #ef4444 2px, #ef4444 4px)' }} />
                            <div>
                                <span className="font-medium">{lang === 'th' ? 'Delay Bar แสดงเมื่อ:' : lang === 'zh' ? '延迟条显示条件：' : 'Delay bar shown when:'}</span>{' '}
                                {lang === 'th'
                                    ? 'delayDays > 0 และ devTime ≠ delayDays (ป้องกัน false positive เมื่อ startDate ≈ targetDate)'
                                    : lang === 'zh'
                                    ? 'delayDays > 0 且 devTime ≠ delayDays（防止 startDate ≈ targetDate 时的误报）'
                                    : 'delayDays > 0 AND devTime ≠ delayDays (prevents false positives when startDate ≈ targetDate)'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
