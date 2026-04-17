import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Briefcase, CheckCircle, Clock, Filter, Shield, RefreshCw, ChevronDown, X, ArrowUpDown } from 'lucide-react';
import { parseCSV } from './utils/parseCSV';

// --- MultiSelect (copied from App.jsx) ---
function MultiSelect({ options, selected, onChange, label, dark }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allSelected = selected.length === 0;
    const toggleOption = (opt) => {
        if (selected.includes(opt)) onChange(selected.filter(v => v !== opt));
        else onChange([...selected, opt]);
    };
    const selectAll = () => onChange([]);

    const displayLabel = allSelected ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

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
                            <span className="text-sm truncate">{opt}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Chart theme ---
const chartTheme = (dark) => ({
    grid: dark ? '#334155' : '#e2e8f0',
    tick: dark ? '#94a3b8' : undefined,
    tooltip: dark
        ? { backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }
        : { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
    tooltipLabel: dark ? '#e2e8f0' : undefined,
    tooltipItem: dark ? '#cbd5e1' : undefined,
});

// --- Translations ---
const translations = {
    th: {
        title: 'Platform Support Dashboard',
        subtitle: 'วิเคราะห์ข้อมูล Support Ticket จากแพลตฟอร์ม',
        loading: 'กำลังโหลดข้อมูล Support Ticket...',
        dataSource: 'แหล่งข้อมูล',
        filters: 'ตัวกรอง',
        totalCases: 'จำนวนเคสทั้งหมด',
        cases: 'เคส',
        resolvedRate: 'อัตราการแก้ไขสำเร็จ',
        avgResolution: 'เวลาแก้ไขเฉลี่ย',
        hours: 'ชม.',
        slaCompliance: 'SLA Compliance',
        casesByType: 'เคสจำแนกตามประเภท',
        casesByPlatform: 'เคสจำแนกตามแพลตฟอร์ม',
        resolutionDist: 'การกระจายเวลาแก้ไข',
        workloadByAssignee: 'ปริมาณงานรายบุคคล',
        slaPerformance: 'SLA Performance',
        ticketDetails: 'รายละเอียด Ticket',
        allQuarters: 'ทุกไตรมาส',
        allPlatforms: 'ทุกแพลตฟอร์ม',
        allTypes: 'ทุกประเภท',
        allPriorities: 'ทุกความเร่งด่วน',
        allEvalPriorities: 'IT Priority ทั้งหมด',
        allAssignees: 'ผู้รับผิดชอบทั้งหมด',
        allStatuses: 'ทุกสถานะ',
        allCauses: 'ทุกสาเหตุ',
        requestNo: 'Request No.',
        type: 'ประเภท',
        platform: 'แพลตฟอร์ม',
        titleCol: 'หัวข้อ',
        assignee: 'ผู้รับผิดชอบ',
        evaluatedPriority: 'IT Priority',
        estimatedFixTime: 'เวลาแก้ไข (Est.)',
        cause: 'สาเหตุ',
        status: 'สถานะ',
        duration: 'ระยะเวลา',
        created: 'สร้างเมื่อ',
        completed: 'เสร็จเมื่อ',
        count: 'จำนวน',
        avgTime: 'เวลาเฉลี่ย (ชม.)',
        noData: 'ไม่มีข้อมูล',
        clear: 'ล้าง',
        reset: 'รีเซ็ต',
        applyFilters: 'ใช้ตัวกรอง',
        approvedPerTotal: 'สำเร็จ / ทั้งหมด',
        refreshData: 'รีเฟรชข้อมูล',
        showingFirst: 'แสดง',
        of: 'จาก',
        priorityComparison: 'เปรียบเทียบ Priority (Requestor vs IT)',
        requestorPriority: 'Requestor Priority',
        itPriority: 'IT Priority',
        rootCauseBreakdown: 'สัดส่วนสาเหตุของปัญหา',
        rootCauseSla: 'สาเหตุ × SLA ตาม Priority',
        withinSla: 'ภายใน SLA',
        overSla: 'เกิน SLA',
    },
    en: {
        title: 'Platform Support Dashboard',
        subtitle: 'Analyze support ticket data from platforms',
        loading: 'Loading support ticket data...',
        dataSource: 'Data Source',
        filters: 'Filters',
        totalCases: 'Total Cases',
        cases: 'cases',
        resolvedRate: 'Resolved Rate',
        avgResolution: 'Avg Resolution Time',
        hours: 'hrs',
        slaCompliance: 'SLA Compliance',
        casesByType: 'Cases by Feedback Type',
        casesByPlatform: 'Cases by Platform',
        resolutionDist: 'Resolution Time Distribution',
        workloadByAssignee: 'Workload by Assignee',
        slaPerformance: 'SLA Performance',
        ticketDetails: 'Ticket Details',
        allQuarters: 'All Quarters',
        allPlatforms: 'All Platforms',
        allTypes: 'All Types',
        allPriorities: 'All Priorities',
        allEvalPriorities: 'All IT Priorities',
        allAssignees: 'All Assignees',
        allStatuses: 'All Statuses',
        allCauses: 'All Causes',
        requestNo: 'Request No.',
        type: 'Type',
        platform: 'Platform',
        titleCol: 'Title',
        assignee: 'Assignee',
        evaluatedPriority: 'IT Priority',
        estimatedFixTime: 'Est. Fix Time',
        cause: 'Cause',
        status: 'Status',
        duration: 'Duration',
        created: 'Created',
        completed: 'Completed',
        count: 'Count',
        avgTime: 'Avg Time (hrs)',
        noData: 'No data',
        clear: 'Clear',
        reset: 'Reset',
        applyFilters: 'Apply Filters',
        approvedPerTotal: 'Completed / Total',
        refreshData: 'Refresh data',
        showingFirst: 'Showing',
        of: 'of',
        priorityComparison: 'Priority Comparison (Requestor vs IT)',
        requestorPriority: 'Requestor Priority',
        itPriority: 'IT Priority',
        rootCauseBreakdown: 'Root Cause Breakdown',
        rootCauseSla: 'Root Cause × SLA by Priority',
        withinSla: 'Within SLA',
        overSla: 'Over SLA',
    },
    zh: {
        title: 'Platform Support Dashboard',
        subtitle: '分析平台支持工单数据',
        loading: '正在加载支持工单数据...',
        dataSource: '数据源',
        filters: '筛选',
        totalCases: '总工单数',
        cases: '工单',
        resolvedRate: '解决率',
        avgResolution: '平均解决时间',
        hours: '小时',
        slaCompliance: 'SLA 合规率',
        casesByType: '按类型分类',
        casesByPlatform: '按平台分类',
        resolutionDist: '解决时间分布',
        workloadByAssignee: '个人工作量',
        slaPerformance: 'SLA 表现',
        ticketDetails: '工单详情',
        allQuarters: '所有季度',
        allPlatforms: '所有平台',
        allTypes: '所有类型',
        allPriorities: '所有优先级',
        allEvalPriorities: '所有IT优先级',
        allAssignees: '所有负责人',
        allStatuses: '所有状态',
        allCauses: '所有原因',
        requestNo: '请求编号',
        type: '类型',
        platform: '平台',
        titleCol: '标题',
        assignee: '负责人',
        evaluatedPriority: 'IT优先级',
        estimatedFixTime: '预计修复时间',
        cause: '原因',
        status: '状态',
        duration: '耗时',
        created: '创建时间',
        completed: '完成时间',
        count: '数量',
        avgTime: '平均时间 (小时)',
        noData: '暂无数据',
        clear: '清除',
        reset: '重置',
        applyFilters: '应用筛选',
        approvedPerTotal: '已完成 / 总数',
        refreshData: '刷新数据',
        showingFirst: '显示',
        of: '/',
        priorityComparison: '优先级对比 (请求者 vs IT)',
        requestorPriority: '请求者优先级',
        itPriority: 'IT优先级',
        rootCauseBreakdown: '根本原因分布',
        rootCauseSla: '根本原因 × SLA按优先级',
        withinSla: 'SLA内',
        overSla: '超出SLA',
    },
};

// --- Mobile Filter Sheet (accordion-style) ---
function MobileFilterSheet({ dark, onClose, onClear, hasFilters, totalActive, sections, setFilters, t }) {
    const [expandedSection, setExpandedSection] = useState(null);

    return (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={`relative mt-auto max-h-[85vh] flex flex-col rounded-t-2xl ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className={`w-10 h-1 rounded-full ${dark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                </div>
                {/* Header */}
                <div className={`flex items-center justify-between px-5 pb-3 border-b ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className={dark ? 'text-slate-400' : 'text-slate-500'} />
                        <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.filters}</h3>
                        {totalActive > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">{totalActive}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasFilters && (
                            <button onClick={onClear} className="text-sm text-blue-500 font-medium px-2 py-1">{t.reset}</button>
                        )}
                        <button onClick={onClose} className={`p-1.5 rounded-full ${dark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
                {/* Sections */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {sections.map(section => {
                        const isExpanded = expandedSection === section.key;
                        const selectedCount = section.selected?.length || 0;
                        const toggleItem = (opt) => {
                            if (section.selected.includes(opt)) setFilters(prev => ({ ...prev, [section.key]: section.selected.filter(v => v !== opt) }));
                            else setFilters(prev => ({ ...prev, [section.key]: [...section.selected, opt] }));
                        };

                        return (
                            <div key={section.key} className={`border-b ${dark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                <button
                                    onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 ${dark ? 'active:bg-slate-700' : 'active:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{section.title}</span>
                                        {selectedCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-500 text-xs font-bold">{selectedCount}</span>
                                        )}
                                    </div>
                                    <ChevronDown size={16} className={`transition-transform ${dark ? 'text-slate-500' : 'text-slate-400'} ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="px-5 pb-3 space-y-0.5">
                                        <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${dark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                                            <input type="checkbox" checked={selectedCount === 0} onChange={() => setFilters(prev => ({ ...prev, [section.key]: [] }))} className="w-4.5 h-4.5 rounded accent-blue-500" />
                                            <span className={`text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{section.title}</span>
                                        </label>
                                        <div className="max-h-52 overflow-y-auto">
                                            {section.options.map(opt => (
                                                <label key={opt} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${dark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                                                    <input type="checkbox" checked={section.selected.includes(opt)} onChange={() => toggleItem(opt)} className="w-4.5 h-4.5 rounded accent-blue-500" />
                                                    <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Apply button */}
                <div className={`p-4 border-t ${dark ? 'border-slate-700' : 'border-slate-200'}`} style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
                    <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm active:bg-blue-700 transition-colors">
                        {t.applyFilters} {totalActive > 0 ? `(${totalActive})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Constants ---
const SHEET_ID = import.meta.env.VITE_SUPPORT_DB_LINK || '18a2xbNrbGxEaxK8KGCZhbWueqXpMrgxJgspIW42aIn0';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const SLA_TIERS = [
    { key: '<1h', max: 1, color: '#10b981', label: '< 1h' },
    { key: '1-4h', max: 4, color: '#3b82f6', label: '1-4h' },
    { key: '4-24h', max: 24, color: '#f59e0b', label: '4-24h' },
    { key: '24-72h', max: 72, color: '#f97316', label: '24-72h' },
    { key: '>72h', max: Infinity, color: '#ef4444', label: '> 72h' },
];
const SLA_THRESHOLDS = {
    P0: 4,    // P0 = within 4 hours
    P1: 8,    // P1 = within 8 hours
    P2: 240,  // P2 = within 10 days (240 hours)
};
const DEFAULT_SLA_THRESHOLD = 24;

const getSlaThreshold = (evaluatedPriority) => {
    if (!evaluatedPriority) return DEFAULT_SLA_THRESHOLD;
    if (evaluatedPriority.startsWith('P0')) return SLA_THRESHOLDS.P0;
    if (evaluatedPriority.startsWith('P1')) return SLA_THRESHOLDS.P1;
    if (evaluatedPriority.startsWith('P2')) return SLA_THRESHOLDS.P2;
    return DEFAULT_SLA_THRESHOLD;
};

// --- Quarter generation: Q4-2025 through current quarter ---
const generateQuarterNames = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    const names = [];
    // Start from Q4-2025
    let startYear = 2025, startQ = 4;
    for (let y = startYear; y <= currentYear; y++) {
        const fromQ = y === startYear ? startQ : 1;
        const toQ = y === currentYear ? currentQ : 4;
        for (let q = fromQ; q <= toQ; q++) {
            names.push(`Q${q}-${y}`);
        }
    }
    return names;
};

// --- Parse duration "HH:MM:SS" to float hours ---
const parseDuration = (str) => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(':');
    if (parts.length !== 3) return null;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return h + m / 60 + s / 3600;
};

// --- Format hours human-readable ---
const formatDuration = (hours) => {
    if (hours == null || isNaN(hours)) return '-';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
    const days = Math.floor(hours / 24);
    const remainHours = Math.floor(hours % 24);
    return `${days}d ${remainHours}h`;
};

// --- Get SLA tier for a duration ---
const getSlaTier = (hours) => {
    if (hours == null) return null;
    for (const tier of SLA_TIERS) {
        if (hours < tier.max) return tier;
    }
    return SLA_TIERS[SLA_TIERS.length - 1];
};

// --- Normalize Chinese status values to English ---
const STATUS_MAP = {
    '审批中': 'Running',
    '已撤销': 'Terminated',
    '已拒绝': 'Rejected',
    '已通过': 'Approved',
};
const normalizeStatus = (rawStatus, approvalResult) => {
    if (rawStatus === '已结束') {
        if (approvalResult === 'Rejected') return 'Rejected';
        return 'Completed';
    }
    return STATUS_MAP[rawStatus] || rawStatus;
};

const NO_PRIORITY = 'No Priority';
const UNASSIGNED = 'Unassigned';

// --- Status badge colors ---
const statusColors = {
    'Completed': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400' },
    'Running': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400' },
    'Terminated': { bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-600 dark:text-slate-400' },
    'Rejected': { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-400' },
};

// --- Fallback data ---
const fallbackData = [
    { requestNo: 'DEMO-001', type: 'Bug', priority: 'P0 เคสด่วน', evaluatedPriority: 'P0 เร่งด่วน', platform: 'Web', title: 'Demo ticket', assignee: 'Demo User', estimatedFixTime: '', cause: '', created: '2025-10-01', completed: '2025-10-01', status: 'Completed', duration: '02:30:00', creator: 'Demo', department: 'IT', quarter: 'Q4-2025' },
];

// --- Fetch sheet data ---
// In-flight request cache: concurrent calls for the same sheet share one fetch
// (guards against StrictMode double-mount and overlapping auto-refresh).
const inFlightSheets = new Map();
const fetchSheet = (sheetName) => {
    const cached = inFlightSheets.get(sheetName);
    if (cached) return cached;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const promise = (async () => {
        const response = await fetch(url);
        if (!response.ok) return null;
        const text = await response.text();
        return parseCSV(text);
    })().finally(() => inFlightSheets.delete(sheetName));
    inFlightSheets.set(sheetName, promise);
    return promise;
};

const findCol = (headers, name) => {
    const idx = headers.findIndex(h => h && h.trim() === name);
    return idx;
};

const findColIncludes = (headers, name) => {
    const idx = headers.findIndex(h => h && h.trim().includes(name));
    return idx;
};

const parseSheetData = (parsed, quarterName) => {
    if (!parsed || parsed.length <= 1) return [];
    const headers = parsed[0].map(h => (h || '').trim());

    const idx = {
        requestNo: findCol(headers, 'Request No.') >= 0 ? findCol(headers, 'Request No.') : findColIncludes(headers, 'Request'),
        type: findColIncludes(headers, 'ประเภทปัญหา') >= 0 ? findColIncludes(headers, 'ประเภทปัญหา') : findColIncludes(headers, 'Type'),
        priority: findColIncludes(headers, 'ความเร่งด่วน') >= 0 ? findColIncludes(headers, 'ความเร่งด่วน') : findColIncludes(headers, 'Priority'),
        evaluatedPriority: findColIncludes(headers, 'ความสำคัญที่ประเมิน') >= 0 ? findColIncludes(headers, 'ความสำคัญที่ประเมิน') : findColIncludes(headers, 'Evaluated Priority'),
        platform: findColIncludes(headers, 'แพลตฟอร์ม') >= 0 ? findColIncludes(headers, 'แพลตฟอร์ม') : findColIncludes(headers, 'Platform'),
        title: findColIncludes(headers, 'หัวข้อปัญหา') >= 0 ? findColIncludes(headers, 'หัวข้อปัญหา') : findColIncludes(headers, 'Title'),
        assignee: findCol(headers, 'Assignee') >= 0 ? findCol(headers, 'Assignee') : findColIncludes(headers, 'Assignee'),
        estimatedFixTime: findColIncludes(headers, 'Estimated Fix Time'),
        cause: findColIncludes(headers, 'สาเหตุของปัญหา') >= 0 ? findColIncludes(headers, 'สาเหตุของปัญหา') : findColIncludes(headers, 'Cause'),
        created: findColIncludes(headers, '创建时间') >= 0 ? findColIncludes(headers, '创建时间') : findColIncludes(headers, 'Created'),
        completed: findColIncludes(headers, '完成时间') >= 0 ? findColIncludes(headers, '完成时间') : findColIncludes(headers, 'Completed'),
        status: findColIncludes(headers, '审批状态') >= 0 ? findColIncludes(headers, '审批状态') : findColIncludes(headers, 'Status'),
        approvalResult: findColIncludes(headers, '审批结果') >= 0 ? findColIncludes(headers, '审批结果') : findColIncludes(headers, 'Approval'),
        duration: findColIncludes(headers, '耗时') >= 0 ? findColIncludes(headers, '耗时') : findColIncludes(headers, 'Duration'),
        creator: findColIncludes(headers, '创建人') >= 0 ? findColIncludes(headers, '创建人') : findColIncludes(headers, 'Creator'),
        department: findColIncludes(headers, '创建人部门') >= 0 ? findColIncludes(headers, '创建人部门') : findColIncludes(headers, 'Department'),
    };

    const records = [];
    for (let i = 1; i < parsed.length; i++) {
        const r = parsed[i];
        if (!r || r.length < 2) continue;
        const requestNo = (r[idx.requestNo] || '').trim();
        if (!requestNo) continue;

        const durationStr = (r[idx.duration] || '').trim();
        const durationHours = parseDuration(durationStr);

        const rawStatus = (r[idx.status] || '').trim();
        const approvalResult = (r[idx.approvalResult] || '').trim();

        records.push({
            requestNo,
            type: (r[idx.type] || '').trim(),
            priority: (r[idx.priority] || '').trim(),
            evaluatedPriority: (r[idx.evaluatedPriority] || '').trim(),
            platform: (r[idx.platform] || '').trim(),
            title: (r[idx.title] || '').trim(),
            assignee: (r[idx.assignee] || '').trim(),
            estimatedFixTime: (r[idx.estimatedFixTime] || '').trim(),
            cause: (r[idx.cause] || '').trim(),
            created: (r[idx.created] || '').trim(),
            completed: (r[idx.completed] || '').trim(),
            status: normalizeStatus(rawStatus, approvalResult),
            durationStr,
            durationHours,
            creator: (r[idx.creator] || '').trim(),
            department: (r[idx.department] || '').trim(),
            quarter: quarterName,
        });
    }
    return records;
};

// ============================================================
// Main Component
// ============================================================
export default function SupportDashboard({ dark, lang }) {
    const t = translations[lang] || translations.th;
    const ct = useMemo(() => chartTheme(dark), [dark]);
    const axisTick = useMemo(() => ({ fill: ct.tick }), [ct.tick]);
    const axisTick12 = useMemo(() => ({ fill: ct.tick, fontSize: 12 }), [ct.tick]);
    const axisTick11 = useMemo(() => ({ fill: ct.tick, fontSize: 11 }), [ct.tick]);
    const tooltipLabelStyle = useMemo(() => ({ color: ct.tooltipLabel }), [ct.tooltipLabel]);
    const tooltipItemStyle = useMemo(() => ({ color: ct.tooltipItem }), [ct.tooltipItem]);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dataSourceInfo, setDataSourceInfo] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const REFRESH_INTERVAL = 60_000;

    const [filters, setFilters] = useState({
        quarters: [],
        platforms: [],
        types: [],
        priorities: [],
        evaluatedPriorities: [],
        assignees: [],
        statuses: [],
        causes: [],
    });

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [tableSort, setTableSort] = useState({ key: null, dir: 'desc' });
    const toggleSort = (key) => setTableSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });

    const sortData = (arr, sortState, getVal) => {
        if (!sortState.key) return arr;
        return [...arr].sort((a, b) => {
            const va = getVal(a, sortState.key), vb = getVal(b, sortState.key);
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
            return sortState.dir === 'asc' ? cmp : -cmp;
        });
    };

    // --- Load data ---
    const loadData = useCallback(async (isInitial = true) => {
        if (!isInitial) setRefreshing(true);
        try {
            const quarterNames = generateQuarterNames();
            const results = await Promise.allSettled(
                quarterNames.map(async (qName) => {
                    const parsed = await fetchSheet(qName);
                    return { qName, records: parseSheetData(parsed, qName) };
                })
            );

            const allRecords = [];
            const loadedQuarters = [];
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value.records.length > 0) {
                    allRecords.push(...result.value.records);
                    loadedQuarters.push(result.value.qName);
                }
            }

            if (allRecords.length > 0) {
                setData(allRecords);
                setDataSourceInfo(`Live (${loadedQuarters.join(', ')})`);
            } else {
                setData(fallbackData);
                setDataSourceInfo('Fallback');
            }
            setLastUpdated(new Date());
        } catch {
            setData(fallbackData);
            setDataSourceInfo('Fallback');
            setLastUpdated(new Date());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData(true);
        const interval = setInterval(() => loadData(false), REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [loadData]);

    // --- Filter options ---
    const filterOptions = useMemo(() => ({
        quarters: [...new Set(data.map(d => d.quarter))].filter(Boolean).sort(),
        platforms: [...new Set(data.map(d => d.platform))].filter(Boolean).sort(),
        types: [...new Set(data.map(d => d.type))].filter(Boolean).sort(),
        priorities: [...new Set(data.map(d => d.priority || NO_PRIORITY))].sort(),
        evaluatedPriorities: [...new Set(data.map(d => d.evaluatedPriority || NO_PRIORITY))].sort(),
        assignees: [...new Set(data.map(d => d.assignee || UNASSIGNED))].sort(),
        statuses: [...new Set(data.map(d => d.status))].filter(Boolean).sort(),
        causes: [...new Set(data.map(d => d.cause).filter(Boolean))].sort(),
    }), [data]);

    // --- Filtered data ---
    const filtered = useMemo(() => {
        return data.filter(d => {
            if (filters.quarters.length && !filters.quarters.includes(d.quarter)) return false;
            if (filters.platforms.length && !filters.platforms.includes(d.platform)) return false;
            if (filters.types.length && !filters.types.includes(d.type)) return false;
            if (filters.priorities.length && !filters.priorities.includes(d.priority || NO_PRIORITY)) return false;
            if (filters.evaluatedPriorities.length && !filters.evaluatedPriorities.includes(d.evaluatedPriority || NO_PRIORITY)) return false;
            if (filters.assignees.length && !filters.assignees.includes(d.assignee || UNASSIGNED)) return false;
            if (filters.statuses.length && !filters.statuses.includes(d.status)) return false;
            if (filters.causes.length && !filters.causes.includes(d.cause)) return false;
            return true;
        });
    }, [data, filters]);

    // --- KPI calculations ---
    const kpis = useMemo(() => {
        const total = filtered.length;
        const resolved = filtered.filter(d => d.status === 'Completed').length;
        const resolvedRate = total > 0 ? (resolved / total * 100) : 0;
        const withDuration = filtered.filter(d => d.durationHours != null);
        const avgResolution = withDuration.length > 0
            ? withDuration.reduce((s, d) => s + d.durationHours, 0) / withDuration.length
            : 0;
        const withinSla = withDuration.filter(d => {
            const threshold = getSlaThreshold(d.evaluatedPriority);
            return d.durationHours <= threshold;
        }).length;
        const slaCompliance = withDuration.length > 0 ? (withinSla / withDuration.length * 100) : 0;

        return { total, resolvedRate, avgResolution, slaCompliance };
    }, [filtered]);

    // --- Chart data: Cases by Type ---
    const typeChartData = useMemo(() => {
        const map = {};
        filtered.forEach(d => {
            const key = d.type || 'Unknown';
            map[key] = (map[key] || 0) + 1;
        });
        const total = filtered.length;
        return Object.entries(map).map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round(value / total * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value);
    }, [filtered]);

    // --- Chart data: Cases by Platform ---
    const platformChartData = useMemo(() => {
        const map = {};
        filtered.forEach(d => {
            const key = d.platform || 'Unknown';
            map[key] = (map[key] || 0) + 1;
        });
        const total = filtered.length;
        return Object.entries(map).map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round(value / total * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value);
    }, [filtered]);

    // --- Chart data: Resolution Time Distribution ---
    const resolutionDistData = useMemo(() => {
        const buckets = SLA_TIERS.map(tier => ({ name: tier.label, count: 0, color: tier.color }));
        filtered.forEach(d => {
            if (d.durationHours == null) return;
            const tier = getSlaTier(d.durationHours);
            if (tier) {
                const idx = SLA_TIERS.indexOf(tier);
                buckets[idx].count++;
            }
        });
        const total = buckets.reduce((s, b) => s + b.count, 0);
        return buckets.map(b => ({ ...b, pct: total > 0 ? Math.round(b.count / total * 1000) / 10 : 0 }));
    }, [filtered]);

    // --- Chart data: Workload by Assignee ---
    const assigneeChartData = useMemo(() => {
        const map = {};
        filtered.forEach(d => {
            const key = d.assignee || UNASSIGNED;
            if (!map[key]) map[key] = { name: key, count: 0, totalHours: 0, withDuration: 0 };
            map[key].count++;
            if (d.durationHours != null) {
                map[key].totalHours += d.durationHours;
                map[key].withDuration++;
            }
        });
        const all = Object.values(map);
        const total = all.reduce((s, a) => s + a.count, 0);
        return all
            .map(a => ({ ...a, avgHours: a.withDuration > 0 ? Math.round(a.totalHours / a.withDuration * 10) / 10 : 0, pct: total > 0 ? Math.round(a.count / total * 1000) / 10 : 0 }))
            .filter(a => a.count >= 5)
            .sort((a, b) => b.count - a.count);
    }, [filtered]);

    // --- SLA Performance by Assignee ---
    const slaByAssignee = useMemo(() => {
        const map = {};
        filtered.forEach(d => {
            const key = d.assignee || UNASSIGNED;
            if (!map[key]) map[key] = { name: key };
            if (d.durationHours != null) {
                const tier = getSlaTier(d.durationHours);
                if (tier) {
                    map[key][tier.key] = (map[key][tier.key] || 0) + 1;
                }
            }
        });
        return Object.values(map)
            .filter(a => {
                const total = SLA_TIERS.reduce((s, t) => s + (a[t.key] || 0), 0);
                return total >= 5;
            })
            .sort((a, b) => {
                const totalA = SLA_TIERS.reduce((s, t) => s + (a[t.key] || 0), 0);
                const totalB = SLA_TIERS.reduce((s, t) => s + (b[t.key] || 0), 0);
                return totalB - totalA;
            });
    }, [filtered]);

    // --- Chart data: Priority Comparison (Requestor vs IT) ---
    const priorityComparisonData = useMemo(() => {
        const levels = ['P0', 'P1', 'P2'];
        const totalReq = filtered.filter(d => d.priority).length;
        const totalIt = filtered.filter(d => d.evaluatedPriority).length;
        return levels.map(level => {
            const requestor = filtered.filter(d => d.priority && d.priority.startsWith(level)).length;
            const it = filtered.filter(d => d.evaluatedPriority && d.evaluatedPriority.startsWith(level)).length;
            return {
                name: level, requestor, it,
                requestorPct: totalReq > 0 ? Math.round(requestor / totalReq * 1000) / 10 : 0,
                itPct: totalIt > 0 ? Math.round(it / totalIt * 1000) / 10 : 0,
            };
        });
    }, [filtered]);

    // --- Chart data: Root Cause Breakdown ---
    const causeChartData = useMemo(() => {
        const withCause = filtered.filter(d => d.cause);
        if (withCause.length === 0) return [];
        const map = {};
        withCause.forEach(d => {
            map[d.cause] = (map[d.cause] || 0) + 1;
        });
        const total = withCause.length;
        return Object.entries(map)
            .map(([name, value]) => ({ name, value, pct: Math.round(value / total * 1000) / 10 }))
            .sort((a, b) => b.value - a.value);
    }, [filtered]);

    // --- Chart data: Root Cause × SLA by Priority ---
    const causeSlaData = useMemo(() => {
        const withCauseAndDuration = filtered.filter(d => d.cause && d.durationHours != null);
        if (withCauseAndDuration.length === 0) return [];
        const map = {};
        withCauseAndDuration.forEach(d => {
            if (!map[d.cause]) map[d.cause] = { name: d.cause, withinSla: 0, overSla: 0 };
            const threshold = getSlaThreshold(d.evaluatedPriority);
            if (d.durationHours <= threshold) map[d.cause].withinSla++;
            else map[d.cause].overSla++;
        });
        return Object.values(map).map(d => {
            const total = d.withinSla + d.overSla;
            return { ...d, withinSlaPct: total > 0 ? Math.round(d.withinSla / total * 1000) / 10 : 0, overSlaPct: total > 0 ? Math.round(d.overSla / total * 1000) / 10 : 0 };
        }).sort((a, b) => (b.withinSla + b.overSla) - (a.withinSla + a.overSla));
    }, [filtered]);

    // --- Table data ---
    const tableData = useMemo(() => {
        const getVal = (row, key) => {
            if (key === 'durationHours') return row.durationHours ?? -1;
            return row[key] || '';
        };
        return sortData(filtered, tableSort, getVal).slice(0, 50);
    }, [filtered, tableSort]);

    // --- Clear filters ---
    const clearFilters = () => setFilters({ quarters: [], platforms: [], types: [], priorities: [], evaluatedPriorities: [], assignees: [], statuses: [], causes: [] });
    const hasFilters = Object.values(filters).some(f => f.length > 0);

    // --- Styles ---
    const card = `p-6 rounded-xl shadow-sm border border-l-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
    const panel = `rounded-xl shadow-sm border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;
    const thClass = `px-4 py-3 font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`;
    const tdClass = `px-4 py-3 ${dark ? 'text-slate-300' : 'text-slate-600'}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <RefreshCw size={40} className="animate-spin mx-auto mb-4 text-blue-500" />
                    <p className={dark ? 'text-slate-400' : 'text-slate-600'}>{t.loading}</p>
                </div>
            </div>
        );
    }

    const SortHeader = ({ label, sortKey, className = '' }) => (
        <th
            className={`${thClass} cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700 ${className}`}
            onClick={() => toggleSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown size={14} className="opacity-40" />
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            {/* Sticky Header + Filters */}
            <div className={`sticky top-0 z-40 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-4 ${dark ? 'bg-slate-900/95 backdrop-blur-sm' : 'bg-slate-50/95 backdrop-blur-sm'}`}>
            {/* Header */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
                        <Shield className="text-amber-500" size={28} />
                        {t.title}
                    </h1>
                    <p className={`mt-1 text-sm md:text-base ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
                </div>
                <div className="mt-3 md:mt-0 flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => loadData(false)}
                        disabled={refreshing}
                        className={`p-2 rounded-lg border shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'} ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={t.refreshData}
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    {/* Mobile Filter Button */}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className={`md:hidden relative p-2 rounded-lg border shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Filter size={20} />
                        {hasFilters && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                {Object.values(filters).reduce((n, f) => n + f.length, 0)}
                            </span>
                        )}
                    </button>
                    <div className={`hidden md:flex text-sm px-4 py-2 rounded-lg items-center gap-2 border shadow-sm ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200'}`}>
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

            {/* Desktop Filters — hidden on mobile */}
            <div className={`hidden md:flex ${panel} p-4 flex-wrap gap-3 items-center`}>
                <div className={`flex items-center gap-2 font-medium mr-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Filter size={20} />
                    {t.filters}:
                </div>
                <MultiSelect options={filterOptions.quarters} selected={filters.quarters} onChange={v => setFilters(f => ({ ...f, quarters: v }))} label={t.allQuarters} dark={dark} />
                <MultiSelect options={filterOptions.platforms} selected={filters.platforms} onChange={v => setFilters(f => ({ ...f, platforms: v }))} label={t.allPlatforms} dark={dark} />
                <MultiSelect options={filterOptions.types} selected={filters.types} onChange={v => setFilters(f => ({ ...f, types: v }))} label={t.allTypes} dark={dark} />
                <MultiSelect options={filterOptions.priorities} selected={filters.priorities} onChange={v => setFilters(f => ({ ...f, priorities: v }))} label={t.allPriorities} dark={dark} />
                <MultiSelect options={filterOptions.evaluatedPriorities} selected={filters.evaluatedPriorities} onChange={v => setFilters(f => ({ ...f, evaluatedPriorities: v }))} label={t.allEvalPriorities} dark={dark} />
                <MultiSelect options={filterOptions.assignees} selected={filters.assignees} onChange={v => setFilters(f => ({ ...f, assignees: v }))} label={t.allAssignees} dark={dark} />
                <MultiSelect options={filterOptions.statuses} selected={filters.statuses} onChange={v => setFilters(f => ({ ...f, statuses: v }))} label={t.allStatuses} dark={dark} />
                {filterOptions.causes.length > 0 && <MultiSelect options={filterOptions.causes} selected={filters.causes} onChange={v => setFilters(f => ({ ...f, causes: v }))} label={t.allCauses} dark={dark} />}
                {hasFilters && (
                    <button onClick={clearFilters} className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        <X size={14} /> {t.clear}
                    </button>
                )}
            </div>
            </div>

            {/* Mobile Filter Modal */}
            {showFilterModal && (() => {
                const totalActive = Object.values(filters).reduce((n, f) => n + f.length, 0);
                const filterSections = [
                    { title: t.allQuarters, key: 'quarters', options: filterOptions.quarters, selected: filters.quarters },
                    { title: t.allPlatforms, key: 'platforms', options: filterOptions.platforms, selected: filters.platforms },
                    { title: t.allTypes, key: 'types', options: filterOptions.types, selected: filters.types },
                    { title: t.allPriorities, key: 'priorities', options: filterOptions.priorities, selected: filters.priorities },
                    { title: t.allEvalPriorities, key: 'evaluatedPriorities', options: filterOptions.evaluatedPriorities, selected: filters.evaluatedPriorities },
                    { title: t.allAssignees, key: 'assignees', options: filterOptions.assignees, selected: filters.assignees },
                    { title: t.allStatuses, key: 'statuses', options: filterOptions.statuses, selected: filters.statuses },
                    ...(filterOptions.causes.length > 0 ? [{ title: t.allCauses, key: 'causes', options: filterOptions.causes, selected: filters.causes }] : []),
                ];
                return <MobileFilterSheet dark={dark} onClose={() => setShowFilterModal(false)} onClear={clearFilters} hasFilters={hasFilters} totalActive={totalActive} sections={filterSections} setFilters={setFilters} t={t} />;
            })()}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${card} border-l-blue-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t.totalCases}</span>
                        <Briefcase className="text-blue-500" size={24} />
                    </div>
                    <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{kpis.total.toLocaleString()}</div>
                    <div className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t.cases}</div>
                </div>
                <div className={`${card} border-l-emerald-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t.resolvedRate}</span>
                        <CheckCircle className="text-emerald-500" size={24} />
                    </div>
                    <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{kpis.resolvedRate.toFixed(1)}%</div>
                    <div className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t.approvedPerTotal}</div>
                </div>
                <div className={`${card} border-l-purple-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t.avgResolution}</span>
                        <Clock className="text-purple-500" size={24} />
                    </div>
                    <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{kpis.avgResolution.toFixed(1)}</div>
                    <div className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{t.hours}</div>
                </div>
                <div className={`${card} border-l-amber-500`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t.slaCompliance}</span>
                        <Shield className="text-amber-500" size={24} />
                    </div>
                    <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{kpis.slaCompliance.toFixed(1)}%</div>
                    <div className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>P0≤{SLA_THRESHOLDS.P0}h · P1≤{SLA_THRESHOLDS.P1}h · P2≤{SLA_THRESHOLDS.P2/24}d</div>
                </div>
            </div>

            {/* Charts 2x2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases by Type */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.casesByType}</h3>
                    {typeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={typeChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis type="number" tick={axisTick} />
                                <YAxis dataKey="name" type="category" width={150} tick={axisTick12} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => [`${value} (${props.payload.pct}%)`, t.count]} />
                                <Bar dataKey="value" name={t.count} fill="#3b82f6" radius={[0, 4, 4, 0]} label={({ x, y, width, height, value, index }) => <text x={x + width + 4} y={y + height / 2} dy={4} fill={ct.tick || '#64748b'} fontSize={11}>{value} ({typeChartData[index]?.pct}%)</text>} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>

                {/* Cases by Platform */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.casesByPlatform}</h3>
                    {platformChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={platformChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent, value }) => `${name} ${value} (${(percent * 100).toFixed(1)}%)`}>
                                    {platformChartData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => [`${value} (${props.payload.pct}%)`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>

                {/* Resolution Time Distribution */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.resolutionDist}</h3>
                    {resolutionDistData.some(d => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={resolutionDistData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis dataKey="name" tick={axisTick} />
                                <YAxis tick={axisTick} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => [`${value} (${props.payload.pct}%)`, t.count]} />
                                <Bar dataKey="count" name={t.count} radius={[4, 4, 0, 0]} label={({ x, y, width, value, index }) => value > 0 ? <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={ct.tick || '#64748b'} fontSize={11}>{value} ({resolutionDistData[index]?.pct}%)</text> : null}>
                                    {resolutionDistData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>

                {/* Workload by Assignee */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.workloadByAssignee}</h3>
                    {assigneeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={assigneeChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis dataKey="name" tick={axisTick11} angle={-30} textAnchor="end" height={60} />
                                <YAxis yAxisId="left" tick={axisTick} />
                                <YAxis yAxisId="right" orientation="right" tick={axisTick} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => { if (name === t.count) return [`${value} (${props.payload.pct}%)`, name]; return [value, name]; }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="count" name={t.count} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="avgHours" name={t.avgTime} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>
            </div>

            {/* Priority Comparison + Root Cause Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Comparison */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.priorityComparison}</h3>
                    {priorityComparisonData.some(d => d.requestor > 0 || d.it > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityComparisonData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis dataKey="name" tick={axisTick} />
                                <YAxis tick={axisTick} />
                                <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => { if (name === t.requestorPriority) return [`${value} (${props.payload.requestorPct}%)`, name]; return [`${value} (${props.payload.itPct}%)`, name]; }} />
                                <Legend />
                                <Bar dataKey="requestor" name={t.requestorPriority} fill="#3b82f6" radius={[4, 4, 0, 0]} label={({ x, y, width, value, index }) => value > 0 ? <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#3b82f6" fontSize={11}>{value} ({priorityComparisonData[index]?.requestorPct}%)</text> : null} />
                                <Bar dataKey="it" name={t.itPriority} fill="#f59e0b" radius={[4, 4, 0, 0]} label={({ x, y, width, value, index }) => value > 0 ? <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#f59e0b" fontSize={11}>{value} ({priorityComparisonData[index]?.itPct}%)</text> : null} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>

                {/* Root Cause Breakdown */}
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.rootCauseBreakdown}</h3>
                    {causeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={causeChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis type="number" tick={axisTick} />
                                <YAxis dataKey="name" type="category" width={180} tick={axisTick11} />
                                <Tooltip
                                    contentStyle={ct.tooltip}
                                    labelStyle={tooltipLabelStyle}
                                    itemStyle={tooltipItemStyle}
                                    formatter={(value, name, props) => [`${value} (${props.payload.pct}%)`, t.count]}
                                />
                                <Bar dataKey="value" name={t.count} fill="#8b5cf6" radius={[0, 4, 4, 0]} label={({ x, y, width, height, value, index }) => <text x={x + width + 4} y={y + height / 2} dy={4} fill={ct.tick || '#64748b'} fontSize={11}>{value} ({causeChartData[index]?.pct}%)</text>}>
                                    {causeChartData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
                </div>
            </div>

            {/* Root Cause × SLA */}
            {causeSlaData.length > 0 && (
                <div className={`${panel} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.rootCauseSla}</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                            <span className={dark ? 'text-slate-300' : 'text-slate-600'}>{t.withinSla}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="w-3 h-3 rounded-sm bg-red-500"></span>
                            <span className={dark ? 'text-slate-300' : 'text-slate-600'}>{t.overSla}</span>
                        </div>
                        <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>(P0≤{SLA_THRESHOLDS.P0}h · P1≤{SLA_THRESHOLDS.P1}h · P2≤{SLA_THRESHOLDS.P2/24}d)</span>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(250, causeSlaData.length * 50)}>
                        <BarChart data={causeSlaData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                            <XAxis type="number" tick={axisTick} />
                            <YAxis dataKey="name" type="category" width={180} tick={axisTick11} />
                            <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => { const pctKey = name === t.withinSla ? 'withinSlaPct' : 'overSlaPct'; return [`${value} (${props.payload[pctKey]}%)`, name]; }} />
                            <Legend />
                            <Bar dataKey="withinSla" name={t.withinSla} stackId="sla" fill="#10b981" />
                            <Bar dataKey="overSla" name={t.overSla} stackId="sla" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* SLA Performance Panel */}
            <div className={`${panel} p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{t.slaPerformance}</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                    {SLA_TIERS.map(tier => (
                        <div key={tier.key} className="flex items-center gap-1.5 text-sm">
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: tier.color }}></span>
                            <span className={dark ? 'text-slate-300' : 'text-slate-600'}>{tier.label}</span>
                        </div>
                    ))}
                </div>
                {slaByAssignee.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(300, slaByAssignee.length * 40)}>
                        <BarChart data={slaByAssignee} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                            <XAxis type="number" tick={axisTick} />
                            <YAxis dataKey="name" type="category" width={120} tick={axisTick12} />
                            <Tooltip contentStyle={ct.tooltip} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => { const total = SLA_TIERS.reduce((s, tier) => s + (props.payload[tier.key] || 0), 0); const pct = total > 0 ? Math.round(value / total * 1000) / 10 : 0; return [`${value} (${pct}%)`, name]; }} />
                            <Legend />
                            {SLA_TIERS.map(tier => (
                                <Bar key={tier.key} dataKey={tier.key} name={tier.label} stackId="sla" fill={tier.color} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-center py-12 text-slate-400">{t.noData}</p>}
            </div>

            {/* Ticket Details Table */}
            <div className={`${panel} p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {t.ticketDetails}
                    <span className={`text-sm font-normal ml-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        ({Math.min(filtered.length, 50)} / {filtered.length})
                    </span>
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`border-b ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <SortHeader label={t.requestNo} sortKey="requestNo" />
                                <SortHeader label={t.type} sortKey="type" />
                                <SortHeader label={t.platform} sortKey="platform" />
                                <th className={`${thClass} max-w-[200px]`}>{t.titleCol}</th>
                                <SortHeader label={t.assignee} sortKey="assignee" />
                                <SortHeader label={t.evaluatedPriority} sortKey="evaluatedPriority" />
                                <SortHeader label={t.estimatedFixTime} sortKey="estimatedFixTime" />
                                <SortHeader label={t.status} sortKey="status" />
                                <SortHeader label={t.duration} sortKey="durationHours" />
                                <SortHeader label={t.created} sortKey="created" />
                                <SortHeader label={t.completed} sortKey="completed" />
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, i) => {
                                const sc = statusColors[row.status] || statusColors['Terminated'];
                                return (
                                    <tr key={`${row.requestNo}-${i}`} className={`border-b ${dark ? 'border-slate-700/50 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <td className={`${tdClass} font-mono text-xs`}>{row.requestNo}</td>
                                        <td className={tdClass}>{row.type}</td>
                                        <td className={tdClass}>{row.platform}</td>
                                        <td className={`${tdClass} max-w-[200px] truncate`} title={row.title}>{row.title}</td>
                                        <td className={tdClass}>{row.assignee}</td>
                                        <td className={`${tdClass} text-xs`}>{row.evaluatedPriority || '-'}</td>
                                        <td className={`${tdClass} text-xs`}>{row.estimatedFixTime || '-'}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} font-mono text-xs`}>{formatDuration(row.durationHours)}</td>
                                        <td className={`${tdClass} text-xs`}>{row.created}</td>
                                        <td className={`${tdClass} text-xs`}>{row.completed}</td>
                                    </tr>
                                );
                            })}
                            {tableData.length === 0 && (
                                <tr>
                                    <td colSpan={11} className={`${tdClass} text-center py-8`}>{t.noData}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
