import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { Calendar, Users, Briefcase, AlertTriangle, CheckCircle, Clock, Filter, Activity, Layers, Sun, Moon, RefreshCw, ChevronDown, X } from 'lucide-react';

// --- Multi-select dropdown component ---
function MultiSelect({ options, selected, onChange, label, dark, epicMap }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allSelected = selected.length === 0;
    const toggleOption = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(v => v !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };
    const selectAll = () => onChange([]);

    const displayLabel = allSelected ? label : selected.length === 1
        ? (epicMap && selected[0] ? `${selected[0]} - ${epicMap[selected[0]]?.summary?.slice(0, 20) || ''}` : selected[0])
        : `${selected.length} selected`;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm border min-w-[130px] max-w-[200px] ${
                    dark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                } ${!allSelected ? 'ring-2 ring-blue-500/40' : ''}`}
            >
                <span className="truncate flex-1 text-left">{displayLabel}</span>
                {!allSelected && (
                    <X size={14} className="shrink-0 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); selectAll(); }} />
                )}
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className={`absolute z-50 mt-1 w-64 max-h-64 overflow-y-auto rounded-lg border shadow-lg ${
                    dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
                }`}>
                    <label className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b ${
                        dark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'
                    }`}>
                        <input type="checkbox" checked={allSelected} onChange={selectAll} className="rounded" />
                        <span className="text-sm font-medium">{label}</span>
                    </label>
                    {options.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${
                            dark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                        }`}>
                            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} className="rounded" />
                            <span className="text-sm truncate">
                                {epicMap && epicMap[opt] ? `${opt} - ${epicMap[opt]?.summary?.slice(0, 30)}` : opt}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- i18n ---
const translations = {
    th: {
        title: 'IT Team Performance Dashboard',
        subtitle: 'วิเคราะห์ระยะเวลาการพัฒนาและ Performance ของทีม (อ้างอิง Jira Task)',
        loading: 'กำลังโหลดข้อมูล Jira Task...',
        dataSource: 'แหล่งข้อมูล',
        filters: 'ตัวกรอง',
        weekly: 'รายสัปดาห์',
        monthly: 'รายเดือน',
        quarter: 'รายไตรมาส',
        all: 'ทั้งหมด',
        allProjects: 'ทุกโปรเจกต์',
        allAssignees: 'ผู้รับผิดชอบทั้งหมด',
        allReporters: 'ผู้แจ้งทั้งหมด',
        allVersions: 'ทุกเวอร์ชั่น',
        allEpics: 'ทุก Epic',
        clearFilters: 'ล้างตัวกรอง',
        totalTasks: 'จำนวนงานทั้งหมด',
        tasks: 'งาน',
        onTimeRate: 'อัตราการส่งงานตรงเวลา',
        avgDevTime: 'เวลาพัฒนาเฉลี่ย / งาน',
        days: 'วัน',
        avgDelay: 'ระยะเวลา Delay เฉลี่ย',
        epicSummary: 'สรุปตาม Epic',
        epicCol: 'Epic',
        epicName: 'ชื่อ Epic',
        status: 'สถานะ',
        totalTasksCol: 'งานทั้งหมด',
        completed: 'เสร็จแล้ว',
        progress: 'ความคืบหน้า',
        onTime: 'ตรงเวลา',
        avgDevDays: 'Dev เฉลี่ย (วัน)',
        avgDelayDays: 'Delay เฉลี่ย (วัน)',
        targetEnd: 'กำหนดเสร็จ',
        projectPerf: 'Performance จำแนกตามโปรเจกต์',
        individualPerf: 'Performance รายบุคคล (Assignee)',
        onTimeRatio: 'สัดส่วนงานที่เสร็จตรงเวลา',
        trendTitle: 'แนวโน้มจำนวนงานและ Delay',
        taskDetails: 'รายละเอียดงาน (Task Details)',
        showing: 'แสดงผล',
        of: '/',
        items: 'รายการ',
        issueKey: 'รหัสงาน',
        summary: 'ชื่องาน (Summary)',
        assignee: 'ผู้รับผิดชอบ',
        dueDate: 'วันที่กำหนด',
        endDate: 'วันที่เสร็จ',
        devDays: 'Dev (วัน)',
        delayDays: 'Delay (วัน)',
        reportedBy: 'แจ้งโดย',
        showingFirst50: 'กำลังแสดง 50 รายการแรกจากทั้งหมด',
        chartAvgDev: 'เวลาพัฒนาเฉลี่ย (วัน)',
        chartAvgDelay: 'Delay เฉลี่ย (วัน)',
        chartTasks: 'จำนวนงานที่ทำ',
        chartCompletedTasks: 'งานที่เสร็จ (Task)',
        pieOnTime: 'ตรงเวลา / เสร็จก่อน',
        pieDelayed: 'ล่าช้า (Delay)',
    },
    en: {
        title: 'IT Team Performance Dashboard',
        subtitle: 'Analyze development time and team performance (based on Jira Tasks)',
        loading: 'Loading Jira Task data...',
        dataSource: 'Data Source',
        filters: 'Filters',
        weekly: 'Weekly',
        monthly: 'Monthly',
        quarter: 'Quarterly',
        all: 'All',
        allProjects: 'All Projects',
        allAssignees: 'All Assignees',
        allReporters: 'All Reporters',
        allVersions: 'All Versions',
        allEpics: 'All Epics',
        clearFilters: 'Clear filters',
        totalTasks: 'Total Tasks',
        tasks: 'tasks',
        onTimeRate: 'On-Time Delivery Rate',
        avgDevTime: 'Avg Dev Time / Task',
        days: 'days',
        avgDelay: 'Avg Delay',
        epicSummary: 'Epic Summary',
        epicCol: 'Epic',
        epicName: 'Epic Name',
        status: 'Status',
        totalTasksCol: 'Total Tasks',
        completed: 'Completed',
        progress: 'Progress',
        onTime: 'On Time',
        avgDevDays: 'Avg Dev (days)',
        avgDelayDays: 'Avg Delay (days)',
        targetEnd: 'Target End',
        projectPerf: 'Performance by Project',
        individualPerf: 'Individual Performance (Assignee)',
        onTimeRatio: 'On-Time Completion Ratio',
        trendTitle: 'Task & Delay Trend',
        taskDetails: 'Task Details',
        showing: 'Showing',
        of: '/',
        items: 'items',
        issueKey: 'Issue Key',
        summary: 'Summary',
        assignee: 'Assignee',
        dueDate: 'Target Date',
        endDate: 'Completed Date',
        devDays: 'Dev (days)',
        delayDays: 'Delay (days)',
        reportedBy: 'By',
        showingFirst50: 'Showing first 50 of',
        chartAvgDev: 'Avg Dev Time (days)',
        chartAvgDelay: 'Avg Delay (days)',
        chartTasks: 'Tasks Done',
        chartCompletedTasks: 'Completed Tasks',
        pieOnTime: 'On Time / Early',
        pieDelayed: 'Delayed',
    },
    zh: {
        title: 'IT团队绩效仪表板',
        subtitle: '分析开发时间和团队绩效（基于 Jira 任务）',
        loading: '正在加载 Jira 任务数据...',
        dataSource: '数据源',
        filters: '筛选',
        weekly: '按周',
        monthly: '按月',
        quarter: '按季度',
        all: '全部',
        allProjects: '所有项目',
        allAssignees: '所有负责人',
        allReporters: '所有报告人',
        allVersions: '所有版本',
        allEpics: '所有 Epic',
        clearFilters: '清除筛选',
        totalTasks: '任务总数',
        tasks: '个任务',
        onTimeRate: '按时交付率',
        avgDevTime: '平均开发时间 / 任务',
        days: '天',
        avgDelay: '平均延迟时间',
        epicSummary: 'Epic 汇总',
        epicCol: 'Epic',
        epicName: 'Epic 名称',
        status: '状态',
        totalTasksCol: '总任务',
        completed: '已完成',
        progress: '进度',
        onTime: '按时',
        avgDevDays: '平均开发（天）',
        avgDelayDays: '平均延迟（天）',
        targetEnd: '截止日期',
        projectPerf: '按项目绩效',
        individualPerf: '个人绩效（负责人）',
        onTimeRatio: '按时完成比例',
        trendTitle: '任务与延迟趋势',
        taskDetails: '任务详情',
        showing: '显示',
        of: '/',
        items: '条',
        issueKey: '任务编号',
        summary: '任务名称',
        assignee: '负责人',
        dueDate: '目标日期',
        endDate: '完成日期',
        devDays: '开发（天）',
        delayDays: '延迟（天）',
        reportedBy: '报告人',
        showingFirst50: '显示前 50 条，共',
        chartAvgDev: '平均开发时间（天）',
        chartAvgDelay: '平均延迟（天）',
        chartTasks: '完成任务数',
        chartCompletedTasks: '已完成任务',
        pieOnTime: '按时 / 提前完成',
        pieDelayed: '延迟',
    }
};

const LANG_OPTIONS = [
    { code: 'th', label: 'TH', flag: '🇹🇭' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'zh', label: 'CN', flag: '🇨🇳' }
];

const DATE_LOCALES = { th: 'th-TH', en: 'en-US', zh: 'zh-CN' };

// --- Date helpers ---
const formatDate = (dateString, lang = 'th') => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(DATE_LOCALES[lang] || 'th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getMonthYear = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getQuarter = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const q = Math.floor(date.getMonth() / 3) + 1;
    return `Q${q}-${date.getFullYear()}`;
};

const getWeek = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `W${String(weekNum).padStart(2, '0')}-${date.getFullYear()}`;
};

const getWeekRange = (weekStr) => {
    if (!weekStr || weekStr === '-') return weekStr;
    const match = weekStr.match(/^W(\d+)-(\d+)$/);
    if (!match) return weekStr;
    const weekNum = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    const jan1 = new Date(year, 0, 1);
    const dayOffset = jan1.getDay();
    const weekStart = new Date(year, 0, 1 + (weekNum - 1) * 7 - dayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(weekStart)}-${fmt(weekEnd)}`;
};

// --- CSV Parser ---
const parseCSV = (str) => {
    const arr = [];
    let quote = false;
    let row = 0, col = 0;
    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c + 1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';
        if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === ',' && !quote) { ++col; continue; }
        if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc === '\n' && !quote) { ++row; col = 0; continue; }
        if (cc === '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
};

const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    if (!trimmed) return null;
    if (trimmed.includes('-')) return new Date(trimmed);
    const parts = trimmed.split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        let year = parseInt(dateParts[2], 10);
        if (year < 100) year += 2000;
        return new Date(year, month, day);
    }
    return new Date(trimmed);
};

const SHEET_ID = '1ZeJOK6BkHtVX97CDSFcWqODJzBqVmRXx6UO0Q9QbDLk';
const JIRA_BASE = 'https://jira2.my-group.net/browse';

const fetchSheet = async (sheetName) => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    return parseCSV(text);
};

// Generate candidate quarter sheet names: Q1-2025 through Q4 of current year +1
const generateQuarterSheetNames = () => {
    const now = new Date();
    const endYear = now.getFullYear() + 1;
    const startYear = 2025;
    const names = [];
    for (let y = startYear; y <= endYear; y++) {
        for (let q = 1; q <= 4; q++) {
            names.push(`Q${q}-${y}`);
        }
    }
    return names;
};

const findCol = (headers, name) => headers.indexOf(name);

// --- Chart theme colors ---
const chartTheme = (dark) => ({
    grid: dark ? '#334155' : '#e2e8f0',
    tick: dark ? '#94a3b8' : undefined,
    tooltip: dark
        ? { backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }
        : { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
    tooltipLabel: dark ? '#e2e8f0' : undefined,
    tooltipItem: dark ? '#cbd5e1' : undefined,
});

export default function App() {
    const [lang, setLang] = useState(() => localStorage.getItem('dashboard-lang') || 'th');
    const [dark, setDark] = useState(() => localStorage.getItem('dashboard-dark') === 'true');
    const t = translations[lang];
    const ct = chartTheme(dark);

    const [data, setData] = useState([]);
    const [epicMap, setEpicMap] = useState({});
    const [loadedSheets, setLoadedSheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dataSourceInfo, setDataSourceInfo] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const REFRESH_INTERVAL = 60_000; // 60 seconds

    const [filters, setFilters] = useState({
        dateType: 'quarter',
        dateValues: [],   // empty = all
        assignees: [],
        reporters: [],
        projects: [],
        fixVersions: [],
        epicLinks: []
    });

    const switchLang = (code) => {
        setLang(code);
        localStorage.setItem('dashboard-lang', code);
    };

    const toggleDark = () => {
        setDark(prev => {
            localStorage.setItem('dashboard-dark', String(!prev));
            return !prev;
        });
    };

    const parseTaskSheet = (parsed, sheetName, epics) => {
        if (!parsed || parsed.length <= 1) return [];
        const headers = parsed[0];
        const idx = {
            id: findCol(headers, 'Issue key'),
            project: findCol(headers, 'Project name'),
            assignee: findCol(headers, 'Assignee'),
            reporter: findCol(headers, 'Reporter'),
            status: findCol(headers, 'Status'),
            created: findCol(headers, 'Created'),
            updated: findCol(headers, 'Updated'),
            fixVersion: findCol(headers, 'Fix Version/s'),
            targetEnd: findCol(headers, 'Custom field (Target end)'),
            targetStart: findCol(headers, 'Custom field (Target start)'),
            dueDate: findCol(headers, 'Due Date'),
            summary: findCol(headers, 'Summary'),
            epicLink: findCol(headers, 'Custom field (Epic Link)'),
            issueType: findCol(headers, 'Issue Type'),
            priority: findCol(headers, 'Priority')
        };
        const items = [];
        for (let i = 1; i < parsed.length; i++) {
            const row = parsed[i];
            if (!row[idx.id]) continue;
            const targetStartRaw = row[idx.targetStart] || row[idx.created];
            const endDateRaw = row[idx.updated];
            const dueDateRaw = row[idx.targetEnd] || row[idx.dueDate] || row[idx.updated];
            const startDate = parseDateStr(targetStartRaw) || new Date();
            const endDate = parseDateStr(endDateRaw) || new Date();
            const dueDateObj = parseDateStr(dueDateRaw) || endDate;
            const actualDevTime = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const delayDays = Math.max(0, Math.ceil((endDate - dueDateObj) / (1000 * 60 * 60 * 24)));
            const epicLinkVal = row[idx.epicLink] || '';
            const endDateISO = endDate.toISOString();
            items.push({
                id: row[idx.id],
                project: row[idx.project] || 'Unknown',
                assignee: row[idx.assignee] || 'Unassigned',
                reporter: row[idx.reporter] || 'Unknown',
                fixVersion: row[idx.fixVersion] || 'N/A',
                status: row[idx.status] || 'Open',
                summary: row[idx.summary] || '-',
                issueType: row[idx.issueType] || '',
                priority: row[idx.priority] || '',
                epicLink: epicLinkVal,
                epicName: epics[epicLinkVal]?.summary || '',
                sheetName,
                startDate: startDate.toISOString().split('T')[0],
                dueDate: dueDateObj.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                devTime: actualDevTime > 0 ? actualDevTime : 1,
                delayDays,
                month: getMonthYear(endDateISO),
                quarter: getQuarter(endDateISO),
                week: getWeek(endDateISO)
            });
        }
        return items;
    };

    const loadData = useCallback(async (isInitial = false) => {
        if (!isInitial) setRefreshing(true);
        try {
            // Fetch Epic sheet (always)
            const epicParsed = await fetchSheet('Epic');
            const epics = {};
            if (epicParsed && epicParsed.length > 1) {
                const epicHeaders = epicParsed[0];
                const eIdx = {
                    id: findCol(epicHeaders, 'Issue key'),
                    status: findCol(epicHeaders, 'Status'),
                    summary: findCol(epicHeaders, 'Summary'),
                    assignee: findCol(epicHeaders, 'Assignee'),
                    targetStart: findCol(epicHeaders, 'Custom field (Target start)'),
                    targetEnd: findCol(epicHeaders, 'Custom field (Target end)')
                };
                for (let i = 1; i < epicParsed.length; i++) {
                    const row = epicParsed[i];
                    if (!row[eIdx.id]) continue;
                    epics[row[eIdx.id]] = {
                        id: row[eIdx.id],
                        status: row[eIdx.status] || '',
                        summary: row[eIdx.summary] || '',
                        assignee: row[eIdx.assignee] || '',
                        targetStart: row[eIdx.targetStart] || '',
                        targetEnd: row[eIdx.targetEnd] || ''
                    };
                }
            }
            setEpicMap(epics);

            // Fetch all quarter sheets in parallel
            const quarterNames = generateQuarterSheetNames();
            const quarterResults = await Promise.all(
                quarterNames.map(name => fetchSheet(name).then(parsed => ({ name, parsed })))
            );

            // Collect tasks from all sheets that returned data
            const allTasks = [];
            const foundSheets = [];
            for (const { name, parsed } of quarterResults) {
                if (!parsed || parsed.length <= 1) continue;
                const tasks = parseTaskSheet(parsed, name, epics);
                if (tasks.length > 0) {
                    allTasks.push(...tasks);
                    foundSheets.push(name);
                }
            }

            // Deduplicate by Issue key (keep the entry from the latest sheet)
            const seen = new Map();
            for (const task of allTasks) {
                seen.set(task.id, task);
            }

            setData(Array.from(seen.values()));
            setLoadedSheets(foundSheets);
            setDataSourceInfo('Google Sheet (Live)');
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading data:', error);
            if (isInitial) {
                setDataSourceInfo('Error loading data');
                setData([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load + auto-refresh every 60s
    useEffect(() => {
        loadData(true);
        const interval = setInterval(() => loadData(false), REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [loadData]);

    const filterOptions = useMemo(() => {
        const opts = { weeks: new Set(), months: new Set(), quarters: new Set(), assignees: new Set(), reporters: new Set(), projects: new Set(), fixVersions: new Set(), epicLinks: new Set() };
        data.forEach(item => {
            if (item.week && item.week !== '-') opts.weeks.add(item.week);
            if (item.month && item.month !== '-') opts.months.add(item.month);
            if (item.quarter && item.quarter !== '-') opts.quarters.add(item.quarter);
            if (item.assignee && item.assignee !== 'Unassigned') opts.assignees.add(item.assignee);
            if (item.reporter && item.reporter !== 'Unknown') opts.reporters.add(item.reporter);
            if (item.project && item.project !== 'Unknown') opts.projects.add(item.project);
            if (item.fixVersion && item.fixVersion !== 'N/A') opts.fixVersions.add(item.fixVersion);
            if (item.epicLink) opts.epicLinks.add(item.epicLink);
        });
        return {
            weeks: Array.from(opts.weeks).sort(),
            months: Array.from(opts.months).sort(),
            quarters: Array.from(opts.quarters).sort(),
            assignees: Array.from(opts.assignees).sort(),
            reporters: Array.from(opts.reporters).sort(),
            projects: Array.from(opts.projects).sort(),
            fixVersions: Array.from(opts.fixVersions).sort(),
            epicLinks: Array.from(opts.epicLinks).sort()
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (filters.dateValues.length > 0) {
                const dateField = filters.dateType === 'weekly' ? item.week : filters.dateType === 'monthly' ? item.month : item.quarter;
                if (!filters.dateValues.includes(dateField)) return false;
            }
            if (filters.assignees.length > 0 && !filters.assignees.includes(item.assignee)) return false;
            if (filters.reporters.length > 0 && !filters.reporters.includes(item.reporter)) return false;
            if (filters.projects.length > 0 && !filters.projects.includes(item.project)) return false;
            if (filters.fixVersions.length > 0 && !filters.fixVersions.includes(item.fixVersion)) return false;
            if (filters.epicLinks.length > 0 && !filters.epicLinks.includes(item.epicLink)) return false;
            return true;
        });
    }, [data, filters]);

    const metrics = useMemo(() => {
        const total = filteredData.length;
        let totalDevTime = 0, totalDelayDays = 0, delayedTasksCount = 0;
        filteredData.forEach(item => {
            totalDevTime += item.devTime || 0;
            if (item.delayDays > 0) { totalDelayDays += item.delayDays; delayedTasksCount++; }
        });
        return {
            total,
            completed: filteredData.filter(d => d.status === 'Done').length,
            avgDevTime: total ? (totalDevTime / total).toFixed(1) : 0,
            avgDelay: total ? (totalDelayDays / total).toFixed(1) : 0,
            onTimeRate: total ? (((total - delayedTasksCount) / total) * 100).toFixed(0) : 0,
            delayedTasksCount
        };
    }, [filteredData]);

    const epicSummary = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            if (!item.epicLink) return;
            if (!stats[item.epicLink]) {
                const epic = epicMap[item.epicLink];
                stats[item.epicLink] = { epicKey: item.epicLink, epicName: epic?.summary || item.epicLink, epicStatus: epic?.status || '-', epicAssignee: epic?.assignee || '-', epicTargetEnd: epic?.targetEnd || '', total: 0, done: 0, totalDevTime: 0, totalDelay: 0, delayedCount: 0 };
            }
            const s = stats[item.epicLink];
            s.total++;
            if (item.status === 'Done') s.done++;
            s.totalDevTime += item.devTime;
            if (item.delayDays > 0) { s.totalDelay += item.delayDays; s.delayedCount++; }
        });
        return Object.values(stats).map(s => ({
            ...s,
            progress: s.total ? Math.round((s.done / s.total) * 100) : 0,
            avgDevTime: s.total ? parseFloat((s.totalDevTime / s.total).toFixed(1)) : 0,
            avgDelay: s.total ? parseFloat((s.totalDelay / s.total).toFixed(1)) : 0,
            onTimeRate: s.total ? Math.round(((s.total - s.delayedCount) / s.total) * 100) : 0
        })).sort((a, b) => b.total - a.total);
    }, [filteredData, epicMap]);

    const projectStats = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            if (!stats[item.project]) stats[item.project] = { project: item.project, devTime: 0, delayDays: 0, count: 0 };
            stats[item.project].devTime += item.devTime;
            stats[item.project].delayDays += item.delayDays;
            stats[item.project].count++;
        });
        return Object.values(stats).map(s => ({ project: s.project, avgDevTime: parseFloat((s.devTime / s.count).toFixed(1)), avgDelay: parseFloat((s.delayDays / s.count).toFixed(1)) }));
    }, [filteredData]);

    const assigneeStats = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            if (!stats[item.assignee]) stats[item.assignee] = { assignee: item.assignee, tasks: 0, delayDays: 0 };
            stats[item.assignee].tasks++;
            stats[item.assignee].delayDays += item.delayDays;
        });
        return Object.values(stats).map(s => ({ assignee: s.assignee, tasks: s.tasks, avgDelay: parseFloat((s.delayDays / s.tasks).toFixed(1)) }));
    }, [filteredData]);

    const delayPieData = [
        { name: t.pieOnTime, value: metrics.total - metrics.delayedTasksCount },
        { name: t.pieDelayed, value: metrics.delayedTasksCount }
    ];

    const trendData = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            if (item.month === '-') return;
            if (!stats[item.month]) stats[item.month] = { month: item.month, tasks: 0, delay: 0 };
            stats[item.month].tasks++;
            stats[item.month].delay += item.delayDays;
        });
        return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month)).map(s => ({ ...s, avgDelay: parseFloat((s.delay / s.tasks).toFixed(1)) }));
    }, [filteredData]);

    const dateOptions = filters.dateType === 'weekly' ? filterOptions.weeks : filters.dateType === 'monthly' ? filterOptions.months : filterOptions.quarters;

    const resetFilters = () => setFilters({ dateType: 'quarter', dateValues: [], assignees: [], reporters: [], projects: [], fixVersions: [], epicLinks: [] });
    const hasActiveFilters = filters.dateValues.length > 0 || filters.assignees.length > 0 || filters.reporters.length > 0 || filters.projects.length > 0 || filters.fixVersions.length > 0 || filters.epicLinks.length > 0;

    if (loading) {
        return <div className={`flex h-screen items-center justify-center ${dark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{t.loading}</div>;
    }

    // --- Reusable class helpers ---
    const card = `p-6 rounded-xl shadow-sm border border-l-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
    const panel = `rounded-xl shadow-sm border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
    const selectClass = `rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none border ${dark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`;
    const thClass = `px-4 py-3 font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`;
    const tdClass = `px-4 py-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`;

    return (
        <div className={`min-h-screen p-6 font-sans transition-colors ${dark ? 'dark bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
                        <Activity className="text-blue-500" size={32} />
                        {t.title}
                    </h1>
                    <p className={`mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDark}
                        className={`p-2 rounded-lg border shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {dark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    {/* Language Switcher */}
                    <div className={`flex items-center gap-1 rounded-lg p-0.5 border shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        {LANG_OPTIONS.map(lo => (
                            <button
                                key={lo.code}
                                onClick={() => switchLang(lo.code)}
                                className={`px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                                    lang === lo.code
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : dark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{lo.flag}</span> {lo.label}
                            </button>
                        ))}
                    </div>
                    {/* Refresh */}
                    <button
                        onClick={() => loadData(false)}
                        disabled={refreshing}
                        className={`p-2 rounded-lg border shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'} ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh data"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    {/* Data Source */}
                    <div className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 border shadow-sm ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${dataSourceInfo.includes('Live') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {t.dataSource}: <a href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 hover:text-blue-400 hover:underline">{dataSourceInfo}</a>
                        {lastUpdated && (
                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className={`${panel} p-4 mb-8 flex flex-wrap gap-3 items-center`}>
                <div className={`flex items-center gap-2 font-medium mr-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Filter size={20} />
                    {t.filters}:
                </div>

                <div className={`flex items-center gap-1 rounded-md p-0.5 ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    {[
                        { key: 'weekly', label: t.weekly },
                        { key: 'monthly', label: t.monthly },
                        { key: 'quarter', label: t.quarter }
                    ].map(dt => (
                        <button
                            key={dt.key}
                            onClick={() => setFilters(prev => ({ ...prev, dateType: dt.key, dateValues: [] }))}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                filters.dateType === dt.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : dark ? 'text-slate-400 hover:bg-slate-600' : 'text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {dt.label}
                        </button>
                    ))}
                </div>

                <MultiSelect options={dateOptions} selected={filters.dateValues} onChange={(v) => setFilters(prev => ({ ...prev, dateValues: v }))} label={t.all} dark={dark} />
                <MultiSelect options={filterOptions.projects} selected={filters.projects} onChange={(v) => setFilters(prev => ({ ...prev, projects: v }))} label={t.allProjects} dark={dark} />
                <MultiSelect options={filterOptions.assignees} selected={filters.assignees} onChange={(v) => setFilters(prev => ({ ...prev, assignees: v }))} label={t.allAssignees} dark={dark} />
                <MultiSelect options={filterOptions.reporters} selected={filters.reporters} onChange={(v) => setFilters(prev => ({ ...prev, reporters: v }))} label={t.allReporters} dark={dark} />
                <MultiSelect options={filterOptions.fixVersions} selected={filters.fixVersions} onChange={(v) => setFilters(prev => ({ ...prev, fixVersions: v }))} label={t.allVersions} dark={dark} />
                <MultiSelect options={filterOptions.epicLinks} selected={filters.epicLinks} onChange={(v) => setFilters(prev => ({ ...prev, epicLinks: v }))} label={t.allEpics} dark={dark} epicMap={epicMap} />

                {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-sm text-blue-500 hover:text-blue-400 underline ml-auto">
                        {t.clearFilters}
                    </button>
                )}
            </div>

            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: t.totalTasks, value: metrics.total, unit: t.tasks, color: 'blue', icon: Briefcase },
                    { label: t.onTimeRate, value: `${metrics.onTimeRate}%`, unit: '', color: 'emerald', icon: CheckCircle },
                    { label: t.avgDevTime, value: metrics.avgDevTime, unit: t.days, color: 'purple', icon: Clock },
                    { label: t.avgDelay, value: metrics.avgDelay, unit: t.days, color: 'rose', icon: AlertTriangle },
                ].map(({ label, value, unit, color, icon: Icon }) => (
                    <div key={label} className={`${card} border-l-${color}-500`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                                <h3 className={`text-3xl font-bold mt-2 ${dark ? 'text-white' : 'text-slate-800'}`}>{value} {unit && <span className={`text-sm font-normal ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{unit}</span>}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${dark ? `bg-${color}-500/20` : `bg-${color}-50`}`}><Icon className={`text-${color}-500`} size={24} /></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Epic Summary */}
            {epicSummary.length > 0 && (
                <div className={`${panel} overflow-hidden mb-8`}>
                    <div className={`p-6 border-b ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                            <Layers size={20} className="text-indigo-500" /> {t.epicSummary} ({epicSummary.length} Epics)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                                <tr>
                                    <th className={thClass}>{t.epicCol}</th>
                                    <th className={thClass}>{t.epicName}</th>
                                    <th className={thClass}>{t.status}</th>
                                    <th className={`${thClass} text-center`}>{t.totalTasksCol}</th>
                                    <th className={`${thClass} text-center`}>{t.completed}</th>
                                    <th className={`${thClass} text-center`}>{t.progress}</th>
                                    <th className={`${thClass} text-center`}>{t.onTime}</th>
                                    <th className={`${thClass} text-center`}>{t.avgDevDays}</th>
                                    <th className={`${thClass} text-center`}>{t.avgDelayDays}</th>
                                    <th className={thClass}>{t.targetEnd}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {epicSummary.map((epic) => (
                                    <tr key={epic.epicKey} className={`border-b transition-colors ${dark ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                        <td className={`${tdClass} font-medium`}>
                                            <a href={`${JIRA_BASE}/${epic.epicKey}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:underline">{epic.epicKey}</a>
                                        </td>
                                        <td className={tdClass}><div className="truncate max-w-[250px]" title={epic.epicName}>{epic.epicName}</div></td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                epic.epicStatus === 'Done' ? 'bg-emerald-500/20 text-emerald-400' :
                                                epic.epicStatus === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                                                dark ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'
                                            }`}>{epic.epicStatus}</span>
                                        </td>
                                        <td className={`${tdClass} text-center font-medium`}>{epic.total}</td>
                                        <td className={`${tdClass} text-center text-emerald-500 font-medium`}>{epic.done}</td>
                                        <td className={tdClass}>
                                            <div className="flex items-center gap-2">
                                                <div className={`flex-1 rounded-full h-2 min-w-[60px] ${dark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                                                    <div className={`h-2 rounded-full ${epic.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${epic.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-medium w-10 text-right">{epic.progress}%</span>
                                            </div>
                                        </td>
                                        <td className={`${tdClass} text-center`}><span className={epic.onTimeRate >= 70 ? 'text-emerald-500' : 'text-rose-500'}>{epic.onTimeRate}%</span></td>
                                        <td className={`${tdClass} text-center`}>{epic.avgDevTime}</td>
                                        <td className={`${tdClass} text-center`}>{epic.avgDelay > 0 ? <span className="text-rose-500 font-bold">{epic.avgDelay}</span> : <span className="text-emerald-500">0</span>}</td>
                                        <td className={`${tdClass} text-sm`}>{epic.epicTargetEnd ? formatDate(parseDateStr(epic.epicTargetEnd)?.toISOString()?.split('T')[0], lang) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <Briefcase size={20} className="text-blue-500" /> {t.projectPerf}
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={projectStats} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                <XAxis dataKey="project" tick={{ fontSize: 12, fill: ct.tick }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: ct.tick }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: ct.tick }} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="avgDevTime" name={t.chartAvgDev} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="avgDelay" name={t.chartAvgDelay} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <Users size={20} className="text-purple-500" /> {t.individualPerf}
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assigneeStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={ct.grid} />
                                <XAxis type="number" tick={{ fontSize: 12, fill: ct.tick }} />
                                <YAxis dataKey="assignee" type="category" tick={{ fontSize: 12, fill: ct.tick }} width={80} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="tasks" name={t.chartTasks} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="avgDelay" name={t.chartAvgDelay} fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <CheckCircle size={20} className="text-emerald-500" /> {t.onTimeRatio}
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={delayPieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    <Cell fill="#10b981" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <Calendar size={20} className="text-indigo-500" /> {t.trendTitle}
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: ct.tick }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: ct.tick }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: ct.tick }} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="tasks" name={t.chartCompletedTasks} fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                <Line yAxisId="right" type="monotone" dataKey="avgDelay" name={t.chartAvgDelay} stroke="#f59e0b" strokeWidth={3} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className={`${panel} overflow-hidden`}>
                <div className={`p-6 border-b flex justify-between items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>{t.taskDetails}</h3>
                    <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.showing} {Math.min(filteredData.length, 50)} {t.of} {filteredData.length} {t.items}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                            <tr>
                                <th className={`${thClass} py-4`}>{t.issueKey}</th>
                                <th className={`${thClass} py-4`}>Sheet</th>
                                <th className={`${thClass} py-4`}>{t.summary}</th>
                                <th className={`${thClass} py-4`}>{t.epicCol}</th>
                                <th className={`${thClass} py-4`}>{t.assignee}</th>
                                <th className={`${thClass} py-4`}>{t.status}</th>
                                <th className={`${thClass} py-4`}>{t.dueDate}</th>
                                <th className={`${thClass} py-4`}>{t.endDate}</th>
                                <th className={`${thClass} py-4 text-center`}>{t.devDays}</th>
                                <th className={`${thClass} py-4 text-center`}>{t.delayDays}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.slice(0, 50).map((item, index) => (
                                <tr key={index} className={`border-b transition-colors ${dark ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                    <td className={`${tdClass} font-medium`}>
                                        <a href={`${JIRA_BASE}/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:underline">{item.id}</a>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${dark ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{item.sheetName}</span>
                                    </td>
                                    <td className={tdClass}>
                                        <div className="truncate max-w-[200px] lg:max-w-xs" title={item.summary}>{item.summary}</div>
                                        <div className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{item.project} • {item.fixVersion}</div>
                                    </td>
                                    <td className={tdClass}>
                                        {item.epicLink ? (
                                            <div>
                                                <a href={`${JIRA_BASE}/${item.epicLink}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline">{item.epicLink}</a>
                                                <div className={`text-xs truncate max-w-[120px] ${dark ? 'text-slate-500' : 'text-slate-400'}`} title={item.epicName}>{item.epicName}</div>
                                            </div>
                                        ) : <span className={dark ? 'text-slate-600' : 'text-slate-300'}>-</span>}
                                    </td>
                                    <td className={tdClass}>
                                        <div>{item.assignee}</div>
                                        <div className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t.reportedBy}: {item.reporter}</div>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            item.status.toLowerCase() === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>{item.status}</span>
                                    </td>
                                    <td className={tdClass}>{formatDate(item.dueDate, lang)}</td>
                                    <td className={tdClass}>{formatDate(item.endDate, lang)}</td>
                                    <td className={`${tdClass} text-center`}>{item.devTime}</td>
                                    <td className={`${tdClass} text-center`}>
                                        {item.delayDays > 0 ? <span className="text-rose-500 font-bold">+{item.delayDays}</span> : <span className="text-emerald-500">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredData.length > 50 && (
                    <div className={`p-4 text-center text-sm border-t ${dark ? 'text-slate-500 bg-slate-800/50 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                        {t.showingFirst50} {filteredData.length} {t.items}
                    </div>
                )}
            </div>
        </div>
    );
}
