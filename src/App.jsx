import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Line, ReferenceLine, ScatterChart, Scatter, LineChart
} from 'recharts';
import { Calendar, Users, Briefcase, AlertTriangle, CheckCircle, Clock, Filter, Activity, Layers, Sun, Moon, RefreshCw, ChevronDown, X, Target, Bug, TrendingUp, Shield, Zap, Info } from 'lucide-react';

// --- Helper: check if status counts as "done" ---
const isDone = (status) => {
    const s = (status || '').toLowerCase();
    return s === 'done' || s === "won't fix" || s === 'wont fix';
};

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

// --- Info Popover Component ---
function InfoPopover({ dark, lines }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative inline-block ml-auto">
            <button
                onClick={() => setOpen(!open)}
                className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'} ${open ? dark ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-500' : ''}`}
                title="Calculation Info"
            >
                <Info size={18} />
            </button>
            {open && (
                <div className={`absolute right-0 top-full mt-2 z-50 w-96 max-h-96 overflow-y-auto rounded-xl border shadow-xl p-4 text-sm ${
                    dark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                    {lines.map((line, i) => (
                        line.startsWith('##') ? (
                            <h4 key={i} className={`font-bold mt-3 mb-1 ${i === 0 ? 'mt-0' : ''} ${dark ? 'text-white' : 'text-slate-800'}`}>{line.replace(/^##\s*/, '')}</h4>
                        ) : line.startsWith('`') ? (
                            <code key={i} className={`block my-1 px-2 py-1 rounded text-xs font-mono ${dark ? 'bg-slate-700 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>{line.replace(/`/g, '')}</code>
                        ) : line === '---' ? (
                            <hr key={i} className={`my-2 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />
                        ) : (
                            <p key={i} className={`my-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{line}</p>
                        )
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
        // KPI Scorecard
        kpiScorecard: 'KPI Scorecard',
        kpiBizDelivery: 'การส่งมอบงานตามกำหนด',
        kpiAiEfficiency: 'ประสิทธิภาพ AI Tool',
        kpiBugFix: 'การแก้ไข Bug',
        kpiTarget: 'เป้าหมาย',
        kpiCurrent: 'ปัจจุบัน',
        kpiWeight: 'น้ำหนัก',
        kpiIndividual: 'KPI รายบุคคล',
        kpiWeightedScore: 'คะแนนรวม',
        kpiDevImprovement: 'Dev Time ดีขึ้น',
        kpiBugFixRate: 'อัตราแก้ Bug ตรงเวลา',
        kpiAvgSprint: 'Sprint เฉลี่ย',
        kpiNA: 'N/A',
        // Bug Analysis
        bugAnalysis: 'วิเคราะห์ Bug',
        bugByPriority: 'จำนวน Bug ตาม Priority',
        bugFixTimeByPriority: 'เวลาแก้ Bug ตาม Priority',
        bugTimeliness: 'อัตราแก้ Bug ตรงเวลา',
        bugByAssignee: 'Bug ตามผู้รับผิดชอบ',
        bugCount: 'จำนวน Bug',
        bugOnTime: 'แก้ตรงเวลา',
        bugTotal: 'Bug ทั้งหมด',
        bugSlaLine: 'SLA (1 วัน)',
        // Efficiency Trend
        efficiencyTrend: 'แนวโน้มประสิทธิภาพ',
        devTimeTrend: 'แนวโน้ม Dev Time รายบุคคล (รายเดือน)',
        qoqComparison: 'เปรียบเทียบ Q-over-Q',
        prevQAvg: 'ไตรมาสก่อน (เฉลี่ย)',
        currQAvg: 'ไตรมาสนี้ (เฉลี่ย)',
        improvement: 'ปรับปรุง %',
        timeSpentAnalysis: 'วิเคราะห์เวลาที่ใช้',
        avgTimeSpent: 'เวลาที่ใช้เฉลี่ย',
        workRatio: 'Work Ratio',
        // Delay Risk
        delayRisk: 'วิเคราะห์ความเสี่ยง Delay',
        delayByPriority: 'Delay ตาม Priority',
        delaySeverity: 'ระดับความรุนแรง Delay',
        highPriorityAlerts: 'แจ้งเตือน Delay งาน Priority สูง',
        delayOnTime: 'ตรงเวลา',
        delay1to3: '1-3 วัน',
        delay3to7: '3-7 วัน',
        delay7plus: '7+ วัน',
        // Sprint Tracking
        sprintTracking: 'Sprint Tracking',
        sprintDistribution: 'การกระจาย Sprint Count',
        sprintByPerson: 'Sprint Count เฉลี่ยตามบุคคล',
        sprintByProject: 'Sprint Count ตามโปรเจกต์',
        multiSprintTasks: 'งานที่ข้าม Sprint (3+)',
        sprintVsDelay: 'Sprint Count vs Delay',
        sprintCount: 'จำนวน Sprint',
        sprintNames: 'ชื่อ Sprint',
        taskCount: 'จำนวนงาน',
        avgSprintCount: 'Sprint เฉลี่ย',
        avgDelaySprint: 'Delay เฉลี่ย',
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
        kpiScorecard: 'KPI Scorecard',
        kpiBizDelivery: 'Business Delivery',
        kpiAiEfficiency: 'AI Tool Efficiency',
        kpiBugFix: 'Bug Fixing',
        kpiTarget: 'Target',
        kpiCurrent: 'Current',
        kpiWeight: 'Weight',
        kpiIndividual: 'Individual KPI Performance',
        kpiWeightedScore: 'Weighted Score',
        kpiDevImprovement: 'Dev Time Improvement',
        kpiBugFixRate: 'Bug Fix Timeliness',
        kpiAvgSprint: 'Avg Sprint',
        kpiNA: 'N/A',
        bugAnalysis: 'Bug Analysis',
        bugByPriority: 'Bug Count by Priority',
        bugFixTimeByPriority: 'Bug Fix Time by Priority',
        bugTimeliness: 'Bug Fix Timeliness Rate',
        bugByAssignee: 'Bugs by Assignee',
        bugCount: 'Bug Count',
        bugOnTime: 'On-Time',
        bugTotal: 'Total Bugs',
        bugSlaLine: 'SLA (1 day)',
        efficiencyTrend: 'Efficiency Trend',
        devTimeTrend: 'Per-Person Dev Time Trend (Monthly)',
        qoqComparison: 'Q-over-Q Comparison',
        prevQAvg: 'Prev Q Avg',
        currQAvg: 'Curr Q Avg',
        improvement: 'Improvement %',
        timeSpentAnalysis: 'Time Spent Analysis',
        avgTimeSpent: 'Avg Time Spent',
        workRatio: 'Work Ratio',
        delayRisk: 'Delay Risk Analysis',
        delayByPriority: 'Delay by Priority',
        delaySeverity: 'Delay Severity Distribution',
        highPriorityAlerts: 'High-Priority Delay Alerts',
        delayOnTime: 'On Time',
        delay1to3: '1-3 days',
        delay3to7: '3-7 days',
        delay7plus: '7+ days',
        sprintTracking: 'Sprint Tracking',
        sprintDistribution: 'Sprint Count Distribution',
        sprintByPerson: 'Avg Sprint Count by Person',
        sprintByProject: 'Sprint Count by Project',
        multiSprintTasks: 'Multi-Sprint Tasks (3+)',
        sprintVsDelay: 'Sprint Count vs Delay',
        sprintCount: 'Sprint Count',
        sprintNames: 'Sprint Names',
        taskCount: 'Task Count',
        avgSprintCount: 'Avg Sprint',
        avgDelaySprint: 'Avg Delay',
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
        kpiScorecard: 'KPI 记分卡',
        kpiBizDelivery: '业务交付',
        kpiAiEfficiency: 'AI 工具效率',
        kpiBugFix: 'Bug 修复',
        kpiTarget: '目标',
        kpiCurrent: '当前',
        kpiWeight: '权重',
        kpiIndividual: '个人 KPI 绩效',
        kpiWeightedScore: '加权得分',
        kpiDevImprovement: '开发时间改善',
        kpiBugFixRate: 'Bug 修复及时率',
        kpiAvgSprint: '平均 Sprint',
        kpiNA: 'N/A',
        bugAnalysis: 'Bug 分析',
        bugByPriority: '按优先级 Bug 数量',
        bugFixTimeByPriority: '按优先级 Bug 修复时间',
        bugTimeliness: 'Bug 修复及时率',
        bugByAssignee: '按负责人 Bug 分布',
        bugCount: 'Bug 数量',
        bugOnTime: '按时',
        bugTotal: 'Bug 总数',
        bugSlaLine: 'SLA (1天)',
        efficiencyTrend: '效率趋势',
        devTimeTrend: '个人开发时间趋势（按月）',
        qoqComparison: '季度环比对比',
        prevQAvg: '上季度平均',
        currQAvg: '本季度平均',
        improvement: '改善 %',
        timeSpentAnalysis: '时间消耗分析',
        avgTimeSpent: '平均时间消耗',
        workRatio: '工作比率',
        delayRisk: '延迟风险分析',
        delayByPriority: '按优先级延迟',
        delaySeverity: '延迟严重程度分布',
        highPriorityAlerts: '高优先级延迟警告',
        delayOnTime: '按时',
        delay1to3: '1-3天',
        delay3to7: '3-7天',
        delay7plus: '7+天',
        sprintTracking: 'Sprint 追踪',
        sprintDistribution: 'Sprint 数量分布',
        sprintByPerson: '个人平均 Sprint 数',
        sprintByProject: '按项目 Sprint 数',
        multiSprintTasks: '跨 Sprint 任务 (3+)',
        sprintVsDelay: 'Sprint 数 vs 延迟',
        sprintCount: 'Sprint 数',
        sprintNames: 'Sprint 名称',
        taskCount: '任务数',
        avgSprintCount: '平均 Sprint',
        avgDelaySprint: '平均延迟',
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

// Generate candidate quarter sheet names: Q1-2025 through current quarter only
const generateQuarterSheetNames = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    const startYear = 2025;
    const names = [];
    for (let y = startYear; y <= currentYear; y++) {
        const maxQ = y === currentYear ? currentQ : 4;
        for (let q = 1; q <= maxQ; q++) {
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
            priority: findCol(headers, 'Priority'),
            parent: findCol(headers, 'Parent') >= 0 ? findCol(headers, 'Parent') : findCol(headers, 'Parent id')
        };
        // Find all Sprint columns (Y-AJ, all named "Sprint")
        const sprintIndices = headers.reduce((acc, h, i) => {
            if (h && h.trim() === 'Sprint') acc.push(i);
            return acc;
        }, []);
        // Find Time Spent and Work Ratio columns
        const timeSpentIdx = headers.findIndex(h => h && h.trim().includes('Time Spent'));
        const workRatioIdx = headers.findIndex(h => h && h.trim() === 'Work Ratio');

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
            // Parse sprint columns
            const sprints = sprintIndices.map(si => row[si]?.trim()).filter(Boolean);
            const sprintCount = sprints.length;
            // Parse time spent and work ratio
            const timeSpent = timeSpentIdx >= 0 ? parseFloat(row[timeSpentIdx]) || 0 : 0;
            const workRatioVal = workRatioIdx >= 0 ? parseFloat(row[workRatioIdx]) || 0 : 0;

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
                parent: (idx.parent >= 0 ? row[idx.parent] : '') || '',
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
                week: getWeek(endDateISO),
                sprintCount,
                sprints,
                timeSpent,
                workRatio: workRatioVal
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

            // Build parent-child relationships and assign weights
            const childrenOf = {};
            for (const task of seen.values()) {
                if (task.parent) {
                    if (!childrenOf[task.parent]) childrenOf[task.parent] = [];
                    childrenOf[task.parent].push(task.id);
                }
            }
            for (const task of seen.values()) {
                if (task.issueType === 'Epic') {
                    task.weight = 0;
                } else if (childrenOf[task.id]) {
                    // Parent task with subtasks -> weight 0 (subtasks carry the score)
                    task.weight = 0;
                    task.subtaskIds = childrenOf[task.id];
                } else if (task.parent && childrenOf[task.parent]) {
                    // Subtask -> weight = 1/N
                    task.weight = 1 / childrenOf[task.parent].length;
                } else {
                    // Standalone task
                    task.weight = 1;
                }
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
            if (item.issueType === 'Epic') return false;
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
        let totalWeight = 0, completedWeight = 0, totalDevTime = 0, totalDelayDays = 0, delayedWeight = 0;
        filteredData.forEach(item => {
            const w = item.weight || 0;
            totalWeight += w;
            if (isDone(item.status)) completedWeight += w;
            totalDevTime += (item.devTime || 0) * w;
            if (item.delayDays > 0) { totalDelayDays += item.delayDays * w; delayedWeight += w; }
        });
        return {
            total: Math.round(totalWeight),
            completed: Math.round(completedWeight),
            avgDevTime: totalWeight ? (totalDevTime / totalWeight).toFixed(1) : 0,
            avgDelay: totalWeight ? (totalDelayDays / totalWeight).toFixed(1) : 0,
            onTimeRate: totalWeight ? (((totalWeight - delayedWeight) / totalWeight) * 100).toFixed(0) : 0,
            delayedTasksCount: Math.round(delayedWeight)
        };
    }, [filteredData]);

    const epicSummary = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            if (!item.epicLink) return;
            const w = item.weight || 0;
            if (!stats[item.epicLink]) {
                const epic = epicMap[item.epicLink];
                stats[item.epicLink] = { epicKey: item.epicLink, epicName: epic?.summary || item.epicLink, epicStatus: epic?.status || '-', epicAssignee: epic?.assignee || '-', epicTargetEnd: epic?.targetEnd || '', total: 0, done: 0, totalDevTime: 0, totalDelay: 0, delayedCount: 0 };
            }
            const s = stats[item.epicLink];
            s.total += w;
            if (isDone(item.status)) s.done += w;
            s.totalDevTime += item.devTime * w;
            if (item.delayDays > 0) { s.totalDelay += item.delayDays * w; s.delayedCount += w; }
        });
        return Object.values(stats).map(s => ({
            ...s,
            total: Math.round(s.total),
            done: Math.round(s.done),
            progress: s.total ? Math.round((s.done / s.total) * 100) : 0,
            avgDevTime: s.total ? parseFloat((s.totalDevTime / s.total).toFixed(1)) : 0,
            avgDelay: s.total ? parseFloat((s.totalDelay / s.total).toFixed(1)) : 0,
            onTimeRate: s.total ? Math.round(((s.total - s.delayedCount) / s.total) * 100) : 0
        })).sort((a, b) => b.total - a.total);
    }, [filteredData, epicMap]);

    const projectStats = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (!stats[item.project]) stats[item.project] = { project: item.project, devTime: 0, delayDays: 0, count: 0 };
            stats[item.project].devTime += item.devTime * w;
            stats[item.project].delayDays += item.delayDays * w;
            stats[item.project].count += w;
        });
        return Object.values(stats).map(s => ({ project: s.project, avgDevTime: s.count ? parseFloat((s.devTime / s.count).toFixed(1)) : 0, avgDelay: s.count ? parseFloat((s.delayDays / s.count).toFixed(1)) : 0 }));
    }, [filteredData]);

    const assigneeStats = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (!stats[item.assignee]) stats[item.assignee] = { assignee: item.assignee, tasks: 0, delayDays: 0 };
            stats[item.assignee].tasks += w;
            stats[item.assignee].delayDays += item.delayDays * w;
        });
        return Object.values(stats).map(s => ({ assignee: s.assignee, tasks: Math.round(s.tasks), avgDelay: s.tasks ? parseFloat((s.delayDays / s.tasks).toFixed(1)) : 0 }));
    }, [filteredData]);

    const delayPieData = [
        { name: t.pieOnTime, value: metrics.total - metrics.delayedTasksCount },
        { name: t.pieDelayed, value: metrics.delayedTasksCount }
    ];

    const trendData = useMemo(() => {
        const stats = {};
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (item.month === '-') return;
            if (!stats[item.month]) stats[item.month] = { month: item.month, tasks: 0, delay: 0 };
            stats[item.month].tasks += w;
            stats[item.month].delay += item.delayDays * w;
        });
        return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month)).map(s => ({ ...s, tasks: Math.round(s.tasks), avgDelay: s.tasks ? parseFloat((s.delay / s.tasks).toFixed(1)) : 0 }));
    }, [filteredData]);

    // --- KPI Scorecard Metrics ---
    const kpiMetrics = useMemo(() => {
        let totalWeight = 0, delayedWeight = 0;
        filteredData.forEach(d => { const w = d.weight || 0; totalWeight += w; if (d.delayDays > 0) delayedWeight += w; });
        const onTimeRate = totalWeight ? ((totalWeight - delayedWeight) / totalWeight) * 100 : 0;

        // Bug fix timeliness (weighted)
        const bugs = filteredData.filter(d => d.issueType === 'Bug');
        let bugWeight = 0, onTimeBugWeight = 0;
        bugs.forEach(b => { const w = b.weight || 0; bugWeight += w; if (b.devTime <= 1) onTimeBugWeight += w; });
        const bugFixRate = bugWeight ? (onTimeBugWeight / bugWeight) * 100 : 100;

        // Q-over-Q efficiency (weighted)
        const quarters = [...new Set(filteredData.map(d => d.quarter).filter(q => q !== '-'))].sort();
        let efficiencyImprovement = null;
        if (quarters.length >= 2) {
            const currQ = quarters[quarters.length - 1];
            const prevQ = quarters[quarters.length - 2];
            let currDevSum = 0, currW = 0, prevDevSum = 0, prevW = 0;
            filteredData.forEach(d => {
                const w = d.weight || 0;
                if (d.quarter === currQ) { currDevSum += d.devTime * w; currW += w; }
                if (d.quarter === prevQ) { prevDevSum += d.devTime * w; prevW += w; }
            });
            const currAvg = currW ? currDevSum / currW : 0;
            const prevAvg = prevW ? prevDevSum / prevW : 0;
            if (prevAvg > 0) efficiencyImprovement = ((prevAvg - currAvg) / prevAvg) * 100;
        }

        return { onTimeRate, bugFixRate, efficiencyImprovement, bugTotal: Math.round(bugWeight), bugOnTime: Math.round(onTimeBugWeight) };
    }, [filteredData]);

    // --- Individual KPI Table ---
    const individualKPI = useMemo(() => {
        const byPerson = {};
        const quarters = [...new Set(filteredData.map(d => d.quarter).filter(q => q !== '-'))].sort();
        const currQ = quarters.length >= 1 ? quarters[quarters.length - 1] : null;
        const prevQ = quarters.length >= 2 ? quarters[quarters.length - 2] : null;

        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (!byPerson[item.assignee]) byPerson[item.assignee] = { totalW: 0, delayedW: 0, bugW: 0, bugOnTimeW: 0, sprintSum: 0, currDevSum: 0, currW: 0, prevDevSum: 0, prevW: 0 };
            const p = byPerson[item.assignee];
            p.totalW += w;
            if (item.delayDays > 0) p.delayedW += w;
            if (item.issueType === 'Bug') { p.bugW += w; if (item.devTime <= 1) p.bugOnTimeW += w; }
            p.sprintSum += (item.sprintCount || 0) * w;
            if (currQ && item.quarter === currQ) { p.currDevSum += item.devTime * w; p.currW += w; }
            if (prevQ && item.quarter === prevQ) { p.prevDevSum += item.devTime * w; p.prevW += w; }
        });

        return Object.entries(byPerson).map(([name, d]) => {
            const total = d.totalW;
            const onTimeRate = total ? ((total - d.delayedW) / total) * 100 : 0;
            const bugFixRate = d.bugW ? (d.bugOnTimeW / d.bugW) * 100 : 100;
            const avgSprint = total ? d.sprintSum / total : 0;

            const currAvg = d.currW ? d.currDevSum / d.currW : null;
            const prevAvg = d.prevW ? d.prevDevSum / d.prevW : null;
            let devImprovement = null;
            let efficiencyScore = 0;
            if (prevAvg !== null && prevAvg > 0 && currAvg !== null) {
                devImprovement = ((prevAvg - currAvg) / prevAvg) * 100;
                efficiencyScore = Math.min(devImprovement / 15, 1.0);
                if (efficiencyScore < 0) efficiencyScore = 0;
            } else {
                efficiencyScore = 0.5;
            }

            const weightedScore = (onTimeRate / 100 * 0.30) + (efficiencyScore * 0.25) + (1.0 * 0.15) + (1.0 * 0.15) + (bugFixRate / 100 * 0.15);

            return { name, total: Math.round(total), onTimeRate, devImprovement, bugFixRate, bugTotal: Math.round(d.bugW), avgSprint, weightedScore, currAvg, prevAvg };
        }).sort((a, b) => b.weightedScore - a.weightedScore);
    }, [filteredData]);

    // --- Bug Analysis ---
    const bugAnalysisData = useMemo(() => {
        const bugs = filteredData.filter(d => d.issueType === 'Bug');
        // By priority (weighted)
        const byPriority = {};
        bugs.forEach(b => {
            const w = b.weight || 0;
            const p = b.priority || 'None';
            if (!byPriority[p]) byPriority[p] = { priority: p, count: 0, totalDev: 0 };
            byPriority[p].count += w;
            byPriority[p].totalDev += b.devTime * w;
        });
        const priorityData = Object.values(byPriority).map(p => ({ ...p, count: Math.round(p.count), avgDev: p.count ? parseFloat((p.totalDev / p.count).toFixed(1)) : 0 }));

        // By assignee (weighted)
        const byAssignee = {};
        bugs.forEach(b => {
            const w = b.weight || 0;
            if (!byAssignee[b.assignee]) byAssignee[b.assignee] = { assignee: b.assignee, count: 0 };
            byAssignee[b.assignee].count += w;
        });
        const assigneeData = Object.values(byAssignee).map(a => ({ ...a, count: Math.round(a.count) })).sort((a, b) => b.count - a.count);

        return { bugs, priorityData, assigneeData };
    }, [filteredData]);

    // --- Efficiency Trend (per person per month) ---
    const efficiencyTrendData = useMemo(() => {
        const byPersonMonth = {};
        const allMonths = new Set();
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (item.month === '-') return;
            allMonths.add(item.month);
            const key = `${item.assignee}|${item.month}`;
            if (!byPersonMonth[key]) byPersonMonth[key] = { total: 0, count: 0 };
            byPersonMonth[key].total += item.devTime * w;
            byPersonMonth[key].count += w;
        });
        const months = [...allMonths].sort();
        const assignees = [...new Set(filteredData.map(d => d.assignee))];
        const chartData = months.map(month => {
            const point = { month };
            assignees.forEach(a => {
                const key = `${a}|${month}`;
                const d = byPersonMonth[key];
                point[a] = d && d.count ? parseFloat((d.total / d.count).toFixed(1)) : null;
            });
            return point;
        });
        return { chartData, assignees };
    }, [filteredData]);

    // --- Q-over-Q per person ---
    const qoqData = useMemo(() => {
        const quarters = [...new Set(filteredData.map(d => d.quarter).filter(q => q !== '-'))].sort();
        if (quarters.length < 2) return [];
        const currQ = quarters[quarters.length - 1];
        const prevQ = quarters[quarters.length - 2];
        const byPerson = {};
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (!byPerson[item.assignee]) byPerson[item.assignee] = { currDevSum: 0, currW: 0, prevDevSum: 0, prevW: 0 };
            if (item.quarter === currQ) { byPerson[item.assignee].currDevSum += item.devTime * w; byPerson[item.assignee].currW += w; }
            if (item.quarter === prevQ) { byPerson[item.assignee].prevDevSum += item.devTime * w; byPerson[item.assignee].prevW += w; }
        });
        return Object.entries(byPerson).map(([name, d]) => {
            const prevAvg = d.prevW ? d.prevDevSum / d.prevW : null;
            const currAvg = d.currW ? d.currDevSum / d.currW : null;
            let improvement = null;
            if (prevAvg && prevAvg > 0 && currAvg !== null) improvement = ((prevAvg - currAvg) / prevAvg) * 100;
            return { name, prevAvg: prevAvg ? parseFloat(prevAvg.toFixed(1)) : null, currAvg: currAvg ? parseFloat(currAvg.toFixed(1)) : null, improvement: improvement !== null ? parseFloat(improvement.toFixed(1)) : null };
        }).filter(d => d.prevAvg !== null || d.currAvg !== null);
    }, [filteredData]);

    // --- Delay Risk ---
    const delayRiskData = useMemo(() => {
        // By priority with severity buckets (weighted)
        const byPriority = {};
        filteredData.forEach(item => {
            const w = item.weight || 0;
            const p = item.priority || 'None';
            if (!byPriority[p]) byPriority[p] = { priority: p, onTime: 0, d1to3: 0, d3to7: 0, d7plus: 0 };
            if (item.delayDays === 0) byPriority[p].onTime += w;
            else if (item.delayDays <= 3) byPriority[p].d1to3 += w;
            else if (item.delayDays <= 7) byPriority[p].d3to7 += w;
            else byPriority[p].d7plus += w;
        });
        const priorityData = Object.values(byPriority).map(p => ({
            ...p, onTime: Math.round(p.onTime), d1to3: Math.round(p.d1to3), d3to7: Math.round(p.d3to7), d7plus: Math.round(p.d7plus)
        }));

        // Severity distribution (weighted)
        let onTime = 0, d1to3 = 0, d3to7 = 0, d7plus = 0;
        filteredData.forEach(item => {
            const w = item.weight || 0;
            if (item.delayDays === 0) onTime += w;
            else if (item.delayDays <= 3) d1to3 += w;
            else if (item.delayDays <= 7) d3to7 += w;
            else d7plus += w;
        });
        const severityData = [
            { name: t.delayOnTime, value: Math.round(onTime) },
            { name: t.delay1to3, value: Math.round(d1to3) },
            { name: t.delay3to7, value: Math.round(d3to7) },
            { name: t.delay7plus, value: Math.round(d7plus) }
        ].filter(d => d.value > 0);

        // High priority alerts
        const alerts = filteredData
            .filter(d => ['Highest', 'High', 'Critical'].includes(d.priority) && d.delayDays > 0)
            .sort((a, b) => b.delayDays - a.delayDays)
            .slice(0, 20);

        return { priorityData, severityData, alerts };
    }, [filteredData, t]);

    // --- Sprint Tracking ---
    const sprintTrackingData = useMemo(() => {
        const tasksWithSprints = filteredData.filter(d => d.sprintCount > 0);

        // Distribution (weighted)
        const distMap = {};
        tasksWithSprints.forEach(d => {
            const w = d.weight || 0;
            const bucket = d.sprintCount >= 5 ? '5+' : String(d.sprintCount);
            distMap[bucket] = (distMap[bucket] || 0) + w;
        });
        const distribution = ['1', '2', '3', '4', '5+'].map(k => ({ sprint: k, count: Math.round(distMap[k] || 0) }));

        // By person (weighted)
        const byPerson = {};
        filteredData.forEach(d => {
            const w = d.weight || 0;
            if (!byPerson[d.assignee]) byPerson[d.assignee] = { total: 0, count: 0 };
            byPerson[d.assignee].total += (d.sprintCount || 0) * w;
            byPerson[d.assignee].count += w;
        });
        const personData = Object.entries(byPerson).map(([name, d]) => ({
            assignee: name, avgSprint: d.count ? parseFloat((d.total / d.count).toFixed(1)) : 0
        })).sort((a, b) => b.avgSprint - a.avgSprint);

        // By project (weighted)
        const byProject = {};
        filteredData.forEach(d => {
            const w = d.weight || 0;
            if (!byProject[d.project]) byProject[d.project] = { total: 0, count: 0 };
            byProject[d.project].total += (d.sprintCount || 0) * w;
            byProject[d.project].count += w;
        });
        const projectData = Object.entries(byProject).map(([name, d]) => ({
            project: name, avgSprint: d.count ? parseFloat((d.total / d.count).toFixed(1)) : 0
        })).sort((a, b) => b.avgSprint - a.avgSprint);

        // Multi-sprint tasks (individual rows, no weighting)
        const multiSprint = filteredData
            .filter(d => d.sprintCount >= 3)
            .sort((a, b) => b.sprintCount - a.sprintCount)
            .slice(0, 30);

        // Sprint vs Delay correlation (weighted)
        const sprintDelayMap = {};
        filteredData.forEach(d => {
            const w = d.weight || 0;
            const bucket = d.sprintCount >= 5 ? '5+' : String(d.sprintCount || 0);
            if (!sprintDelayMap[bucket]) sprintDelayMap[bucket] = { totalDelay: 0, count: 0 };
            sprintDelayMap[bucket].totalDelay += d.delayDays * w;
            sprintDelayMap[bucket].count += w;
        });
        const sprintDelayData = ['0', '1', '2', '3', '4', '5+'].map(k => ({
            sprint: k, avgDelay: sprintDelayMap[k] && sprintDelayMap[k].count ? parseFloat((sprintDelayMap[k].totalDelay / sprintDelayMap[k].count).toFixed(1)) : 0, count: Math.round(sprintDelayMap[k]?.count || 0)
        })).filter(d => d.count > 0);

        return { distribution, personData, projectData, multiSprint, sprintDelayData, hasData: tasksWithSprints.length > 0 };
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
                                                isDone(epic.epicStatus) ? 'bg-emerald-500/20 text-emerald-400' :
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

            {/* ===== KPI SCORECARD ===== */}
            <div className={`${panel} overflow-hidden mb-8`}>
                <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <Target size={20} className="text-amber-500" /> {t.kpiScorecard}
                    </h3>
                    <InfoPopover dark={dark} lines={[
                        '## KPI Scorecard',
                        'Traffic-light cards for 3 active KPIs:',
                        '---',
                        '## Business Delivery (30%)',
                        '`On-Time Rate = ((total - delayed) / total) * 100`',
                        'Target: >= 92%',
                        '---',
                        '## AI Tool Efficiency (25%)',
                        '`Improvement = ((prevQ_avg - currQ_avg) / prevQ_avg) * 100`',
                        'Compares avg dev time between current and previous quarter.',
                        'Target: >= 15%',
                        '---',
                        '## Bug Fixing (15%)',
                        '`Bug Fix Rate = (onTimeBugs / totalBugs) * 100`',
                        'On-time bug = devTime <= 1 day',
                        'Target: >= 95%',
                        '---',
                        '## Color Logic',
                        'Green: >= target',
                        'Yellow: >= target - 10%',
                        'Red: < target - 10%',
                    ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                    {[
                        { label: t.kpiBizDelivery, weight: '30%', target: 92, current: parseFloat(kpiMetrics.onTimeRate.toFixed(1)), unit: '%' },
                        { label: t.kpiAiEfficiency, weight: '25%', target: 15, current: kpiMetrics.efficiencyImprovement !== null ? parseFloat(kpiMetrics.efficiencyImprovement.toFixed(1)) : null, unit: '%' },
                        { label: t.kpiBugFix, weight: '15%', target: 95, current: parseFloat(kpiMetrics.bugFixRate.toFixed(1)), unit: '%' },
                    ].map(kpi => {
                        const isNA = kpi.current === null;
                        const color = isNA ? 'slate' : kpi.current >= kpi.target ? 'emerald' : kpi.current >= kpi.target - 10 ? 'amber' : 'rose';
                        return (
                            <div key={kpi.label} className={`rounded-lg border-2 p-4 ${
                                color === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/5' :
                                color === 'amber' ? 'border-amber-500/40 bg-amber-500/5' :
                                color === 'rose' ? 'border-rose-500/40 bg-rose-500/5' :
                                dark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{kpi.label}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{t.kpiWeight}: {kpi.weight}</span>
                                </div>
                                <div className={`text-3xl font-bold ${
                                    color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : color === 'rose' ? 'text-rose-500' : dark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    {isNA ? t.kpiNA : `${kpi.current}${kpi.unit}`}
                                </div>
                                <div className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {t.kpiTarget}: {kpi.target}{kpi.unit}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ===== INDIVIDUAL KPI TABLE ===== */}
            <div className={`${panel} overflow-hidden mb-8`}>
                <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <Users size={20} className="text-blue-500" /> {t.kpiIndividual}
                    </h3>
                    <InfoPopover dark={dark} lines={[
                        '## Weighted KPI Score (per person)',
                        '`score = (onTimeRate/100 * 0.30) + (efficiencyScore * 0.25) + (1.0 * 0.15) + (1.0 * 0.15) + (bugFixRate/100 * 0.15)`',
                        '---',
                        '## On-Time Rate',
                        '`((tasks - delayed) / tasks) * 100`',
                        'Green >= 92%, Yellow >= 82%, Red < 82%',
                        '---',
                        '## Dev Time Improvement',
                        '`((prevQ_avg - currQ_avg) / prevQ_avg) * 100`',
                        '`efficiencyScore = min(improvement / 15, 1.0)`',
                        'Green >= 15%, Yellow >= 5%, Red < 5%',
                        '---',
                        '## Bug Fix Rate',
                        '`(onTimeBugs / totalBugs) * 100`',
                        'On-time = devTime <= 1 day. Green >= 95%',
                        '---',
                        '## KPI 3 & 4',
                        'Default to 100% (not yet in Jira)',
                    ]} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                            <tr>
                                <th className={thClass}>{t.assignee}</th>
                                <th className={`${thClass} text-center`}>{t.totalTasksCol}</th>
                                <th className={`${thClass} text-center`}>{t.onTimeRate}</th>
                                <th className={`${thClass} text-center`}>{t.kpiDevImprovement}</th>
                                <th className={`${thClass} text-center`}>{t.kpiBugFixRate}</th>
                                <th className={`${thClass} text-center`}>{t.kpiAvgSprint}</th>
                                <th className={`${thClass} text-center`}>{t.kpiWeightedScore}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {individualKPI.map(p => (
                                <tr key={p.name} className={`border-b transition-colors ${dark ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                    <td className={`${tdClass} font-medium`}>{p.name}</td>
                                    <td className={`${tdClass} text-center`}>{p.total}</td>
                                    <td className={`${tdClass} text-center`}>
                                        <span className={p.onTimeRate >= 92 ? 'text-emerald-500 font-bold' : p.onTimeRate >= 82 ? 'text-amber-500' : 'text-rose-500'}>{p.onTimeRate.toFixed(0)}%</span>
                                    </td>
                                    <td className={`${tdClass} text-center`}>
                                        {p.devImprovement !== null ? (
                                            <span className={p.devImprovement >= 15 ? 'text-emerald-500 font-bold' : p.devImprovement >= 5 ? 'text-amber-500' : 'text-rose-500'}>{p.devImprovement.toFixed(1)}%</span>
                                        ) : <span className={dark ? 'text-slate-500' : 'text-slate-400'}>{t.kpiNA}</span>}
                                    </td>
                                    <td className={`${tdClass} text-center`}>
                                        {p.bugTotal > 0 ? (
                                            <span className={p.bugFixRate >= 95 ? 'text-emerald-500 font-bold' : p.bugFixRate >= 85 ? 'text-amber-500' : 'text-rose-500'}>{p.bugFixRate.toFixed(0)}%</span>
                                        ) : <span className={dark ? 'text-slate-500' : 'text-slate-400'}>-</span>}
                                    </td>
                                    <td className={`${tdClass} text-center`}>{p.avgSprint.toFixed(1)}</td>
                                    <td className={`${tdClass} text-center`}>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            p.weightedScore >= 0.85 ? 'bg-emerald-500/20 text-emerald-400' :
                                            p.weightedScore >= 0.70 ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-rose-500/20 text-rose-400'
                                        }`}>{(p.weightedScore * 100).toFixed(0)}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== BUG ANALYSIS ===== */}
            {bugAnalysisData.bugs.length > 0 && (
                <div className={`${panel} overflow-hidden mb-8`}>
                    <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                            <Bug size={20} className="text-rose-500" /> {t.bugAnalysis} ({bugAnalysisData.bugs.length} {t.bugTotal})
                        </h3>
                        <InfoPopover dark={dark} lines={[
                            '## Bug Analysis',
                            'Filters tasks where Issue Type = "Bug"',
                            '---',
                            '## Bug Count by Priority',
                            'Groups bugs by Priority field, counts each.',
                            '---',
                            '## Bug Fix Time by Priority',
                            '`avgDevTime = sum(devTime) / count per priority`',
                            'Red reference line at 1 day (SLA proxy)',
                            '---',
                            '## Bug Timeliness Rate',
                            '`rate = (bugs with devTime <= 1 day) / totalBugs * 100`',
                            'Target: >= 95%',
                            'Note: 2hr/8hr SLA approximated as <= 1 day (daily granularity)',
                            '---',
                            '## Bug by Assignee',
                            'Count of bugs per person, sorted descending.',
                        ]} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        {/* Bug Count by Priority */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.bugByPriority}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bugAnalysisData.priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                        <XAxis dataKey="priority" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="count" name={t.bugCount} fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Bug Fix Time by Priority */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.bugFixTimeByPriority}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bugAnalysisData.priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                        <XAxis dataKey="priority" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="avgDev" name={t.chartAvgDev} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="5 5" label={{ value: t.bugSlaLine, fill: ct.tick || '#666', fontSize: 11 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Bug Timeliness Rate */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.bugTimeliness}</h4>
                            <div className={`rounded-lg border p-6 text-center ${dark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                                <div className={`text-5xl font-bold ${kpiMetrics.bugFixRate >= 95 ? 'text-emerald-500' : kpiMetrics.bugFixRate >= 85 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {kpiMetrics.bugFixRate.toFixed(0)}%
                                </div>
                                <div className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {kpiMetrics.bugOnTime} {t.bugOnTime} / {kpiMetrics.bugTotal} {t.bugTotal}
                                </div>
                                <div className={`mt-1 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {t.kpiTarget}: 95%
                                </div>
                            </div>
                        </div>
                        {/* Bug by Assignee */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.bugByAssignee}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bugAnalysisData.assigneeData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={ct.grid} />
                                        <XAxis type="number" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis dataKey="assignee" type="category" tick={{ fontSize: 12, fill: ct.tick }} width={80} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="count" name={t.bugCount} fill="#f43f5e" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EFFICIENCY TREND ===== */}
            <div className={`${panel} overflow-hidden mb-8`}>
                <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <TrendingUp size={20} className="text-green-500" /> {t.efficiencyTrend}
                    </h3>
                    <InfoPopover dark={dark} lines={[
                        '## Dev Time Trend (Monthly)',
                        'One line per assignee showing avg dev time per month.',
                        '`avgDevTime = sum(devTime) / taskCount per person per month`',
                        '---',
                        '## Q-over-Q Comparison',
                        'Compares average dev time between the two most recent quarters.',
                        '`improvement = ((prevQ_avg - currQ_avg) / prevQ_avg) * 100`',
                        'Positive % = faster development (good).',
                        'Green >= 15%, Yellow >= 5%, Red < 5%',
                    ]} />
                </div>
                <div className="p-6 space-y-6">
                    {/* Per-Person Dev Time Trend */}
                    <div>
                        <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.devTimeTrend}</h4>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={efficiencyTrendData.chartData} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: ct.tick }} />
                                    <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                    <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    {efficiencyTrendData.assignees.map((a, i) => {
                                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
                                        return <Line key={a} type="monotone" dataKey={a} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />;
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Q-over-Q Comparison Table */}
                    {qoqData.length > 0 && (
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.qoqComparison}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                                        <tr>
                                            <th className={thClass}>{t.assignee}</th>
                                            <th className={`${thClass} text-center`}>{t.prevQAvg}</th>
                                            <th className={`${thClass} text-center`}>{t.currQAvg}</th>
                                            <th className={`${thClass} text-center`}>{t.improvement}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {qoqData.map(d => (
                                            <tr key={d.name} className={`border-b ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                                                <td className={`${tdClass} font-medium`}>{d.name}</td>
                                                <td className={`${tdClass} text-center`}>{d.prevAvg ?? '-'} {d.prevAvg !== null ? t.days : ''}</td>
                                                <td className={`${tdClass} text-center`}>{d.currAvg ?? '-'} {d.currAvg !== null ? t.days : ''}</td>
                                                <td className={`${tdClass} text-center`}>
                                                    {d.improvement !== null ? (
                                                        <span className={d.improvement >= 15 ? 'text-emerald-500 font-bold' : d.improvement >= 5 ? 'text-amber-500' : 'text-rose-500'}>
                                                            {d.improvement > 0 ? '+' : ''}{d.improvement}%
                                                        </span>
                                                    ) : <span className={dark ? 'text-slate-500' : 'text-slate-400'}>{t.kpiNA}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== DELAY RISK ANALYSIS ===== */}
            <div className={`${panel} overflow-hidden mb-8`}>
                <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                        <AlertTriangle size={20} className="text-amber-500" /> {t.delayRisk}
                    </h3>
                    <InfoPopover dark={dark} lines={[
                        '## Delay Risk Analysis',
                        '`delayDays = max(0, endDate - dueDate) in days`',
                        '---',
                        '## Delay by Priority (Stacked Bar)',
                        'Groups tasks by priority, stacked by severity:',
                        'On-time (0 days), 1-3 days, 3-7 days, 7+ days',
                        '---',
                        '## Delay Severity Distribution (Donut)',
                        'Proportion of all tasks in each delay bucket.',
                        '---',
                        '## High-Priority Alerts',
                        'Tasks with Priority = Highest/High/Critical AND delayDays > 0',
                        'Sorted by delay days descending, max 20 shown.',
                    ]} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Delay by Priority (Stacked) */}
                    <div>
                        <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.delayByPriority}</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={delayRiskData.priorityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                    <XAxis dataKey="priority" tick={{ fontSize: 12, fill: ct.tick }} />
                                    <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                    <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="onTime" name={t.delayOnTime} stackId="a" fill="#10b981" />
                                    <Bar dataKey="d1to3" name={t.delay1to3} stackId="a" fill="#f59e0b" />
                                    <Bar dataKey="d3to7" name={t.delay3to7} stackId="a" fill="#f97316" />
                                    <Bar dataKey="d7plus" name={t.delay7plus} stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Delay Severity (Pie) */}
                    <div>
                        <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.delaySeverity}</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={delayRiskData.severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {delayRiskData.severityData.map((entry, i) => (
                                            <Cell key={i} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][i % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={ct.tooltip} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                {/* High Priority Alerts Table */}
                {delayRiskData.alerts.length > 0 && (
                    <div className="px-6 pb-6">
                        <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.highPriorityAlerts}</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                                    <tr>
                                        <th className={thClass}>{t.issueKey}</th>
                                        <th className={thClass}>{t.summary}</th>
                                        <th className={thClass}>{t.assignee}</th>
                                        <th className={`${thClass} text-center`}>Priority</th>
                                        <th className={`${thClass} text-center`}>{t.delayDays}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {delayRiskData.alerts.map((item, i) => (
                                        <tr key={i} className={`border-b ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                                            <td className={`${tdClass} font-medium`}>
                                                <a href={`${JIRA_BASE}/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{item.id}</a>
                                            </td>
                                            <td className={tdClass}><div className="truncate max-w-[200px]" title={item.summary}>{item.summary}</div></td>
                                            <td className={tdClass}>{item.assignee}</td>
                                            <td className={`${tdClass} text-center`}>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    item.priority === 'Highest' || item.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>{item.priority}</span>
                                            </td>
                                            <td className={`${tdClass} text-center text-rose-500 font-bold`}>+{item.delayDays}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== SPRINT TRACKING ===== */}
            {sprintTrackingData.hasData && (
                <div className={`${panel} overflow-hidden mb-8`}>
                    <div className={`p-6 border-b flex items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-800'}`}>
                            <Zap size={20} className="text-cyan-500" /> {t.sprintTracking}
                        </h3>
                        <InfoPopover dark={dark} lines={[
                            '## Sprint Tracking',
                            '`sprintCount = number of non-empty Sprint columns (Y-AJ)`',
                            '1 sprint = normal, 2 = carried once, 3+ = needs attention',
                            '---',
                            '## Sprint Count Distribution',
                            'How many tasks span 1, 2, 3, 4, or 5+ sprints.',
                            '---',
                            '## Avg Sprint Count by Person',
                            '`avg(sprintCount) per assignee`',
                            'Lower is better (tasks completed in fewer sprints).',
                            '---',
                            '## Sprint Count vs Delay',
                            'Correlation: do tasks spanning more sprints tend to have more delays?',
                            '`avgDelay per sprint bucket`',
                            '---',
                            '## Multi-Sprint Tasks (3+)',
                            'Tasks carried over 3+ sprints, sorted by sprint count.',
                        ]} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        {/* Sprint Count Distribution */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.sprintDistribution}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sprintTrackingData.distribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                        <XAxis dataKey="sprint" tick={{ fontSize: 12, fill: ct.tick }} label={{ value: t.sprintCount, position: 'insideBottom', offset: -5, fontSize: 11, fill: ct.tick || '#666' }} />
                                        <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="count" name={t.taskCount} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Avg Sprint Count by Person */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.sprintByPerson}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sprintTrackingData.personData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={ct.grid} />
                                        <XAxis type="number" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis dataKey="assignee" type="category" tick={{ fontSize: 12, fill: ct.tick }} width={80} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="avgSprint" name={t.avgSprintCount} fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Sprint Count by Project */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.sprintByProject}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sprintTrackingData.projectData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                        <XAxis dataKey="project" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis tick={{ fontSize: 12, fill: ct.tick }} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Bar dataKey="avgSprint" name={t.avgSprintCount} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        {/* Sprint Count vs Delay */}
                        <div>
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.sprintVsDelay}</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={sprintTrackingData.sprintDelayData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
                                        <XAxis dataKey="sprint" tick={{ fontSize: 12, fill: ct.tick }} label={{ value: t.sprintCount, position: 'insideBottom', offset: -5, fontSize: 11, fill: ct.tick || '#666' }} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: ct.tick }} />
                                        <Tooltip contentStyle={ct.tooltip} labelStyle={{ color: ct.tooltipLabel }} itemStyle={{ color: ct.tooltipItem }} />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar yAxisId="left" dataKey="count" name={t.taskCount} fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={30} />
                                        <Line yAxisId="right" type="monotone" dataKey="avgDelay" name={t.avgDelaySprint} stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    {/* Multi-Sprint Tasks Table */}
                    {sprintTrackingData.multiSprint.length > 0 && (
                        <div className="px-6 pb-6">
                            <h4 className={`text-sm font-semibold mb-3 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{t.multiSprintTasks}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className={`text-xs uppercase ${dark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                                        <tr>
                                            <th className={thClass}>{t.issueKey}</th>
                                            <th className={thClass}>{t.summary}</th>
                                            <th className={thClass}>{t.assignee}</th>
                                            <th className={`${thClass} text-center`}>{t.sprintCount}</th>
                                            <th className={thClass}>{t.sprintNames}</th>
                                            <th className={`${thClass} text-center`}>{t.devDays}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sprintTrackingData.multiSprint.map((item, i) => (
                                            <tr key={i} className={`border-b ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                                                <td className={`${tdClass} font-medium`}>
                                                    <a href={`${JIRA_BASE}/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{item.id}</a>
                                                </td>
                                                <td className={tdClass}><div className="truncate max-w-[200px]" title={item.summary}>{item.summary}</div></td>
                                                <td className={tdClass}>{item.assignee}</td>
                                                <td className={`${tdClass} text-center`}>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">{item.sprintCount}</span>
                                                </td>
                                                <td className={tdClass}>
                                                    <div className="truncate max-w-[200px] text-xs" title={item.sprints.join(', ')}>{item.sprints.join(', ')}</div>
                                                </td>
                                                <td className={`${tdClass} text-center`}>{item.devTime}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table - show only parent tasks and standalone tasks (no subtasks) */}
            {(() => {
                const tableData = filteredData.filter(d => !d.parent);
                // Build subtask info for parent tasks
                const subtaskInfoMap = {};
                filteredData.forEach(d => {
                    if (d.parent) {
                        if (!subtaskInfoMap[d.parent]) subtaskInfoMap[d.parent] = { total: 0, done: 0, totalDevTime: 0, totalDelay: 0, delayedCount: 0 };
                        const s = subtaskInfoMap[d.parent];
                        s.total++;
                        if (isDone(d.status)) s.done++;
                        s.totalDevTime += d.devTime;
                        if (d.delayDays > 0) { s.totalDelay += d.delayDays; s.delayedCount++; }
                    }
                });
                return (
            <div className={`${panel} overflow-hidden`}>
                <div className={`p-6 border-b flex justify-between items-center ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>{t.taskDetails}</h3>
                    <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t.showing} {Math.min(tableData.length, 50)} {t.of} {tableData.length} {t.items}</span>
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
                                <th className={`${thClass} py-4`}>{t.progress}</th>
                                <th className={`${thClass} py-4`}>{t.dueDate}</th>
                                <th className={`${thClass} py-4`}>{t.endDate}</th>
                                <th className={`${thClass} py-4 text-center`}>{t.devDays}</th>
                                <th className={`${thClass} py-4 text-center`}>{t.delayDays}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.slice(0, 50).map((item, index) => {
                                const subInfo = subtaskInfoMap[item.id];
                                const hasSubtasks = !!subInfo;
                                const subProgress = hasSubtasks ? Math.round((subInfo.done / subInfo.total) * 100) : null;
                                const aggDevTime = hasSubtasks && subInfo.total ? parseFloat((subInfo.totalDevTime / subInfo.total).toFixed(1)) : item.devTime;
                                const aggDelay = hasSubtasks && subInfo.total ? parseFloat((subInfo.totalDelay / subInfo.total).toFixed(1)) : item.delayDays;
                                return (
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
                                            isDone(item.status) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>{item.status}</span>
                                    </td>
                                    <td className={tdClass}>
                                        {hasSubtasks ? (
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                                <div className={`flex-1 h-2 rounded-full ${dark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                                                    <div className={`h-2 rounded-full ${subProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${subProgress}%` }}></div>
                                                </div>
                                                <span className="text-xs font-medium whitespace-nowrap">{subInfo.done}/{subInfo.total}</span>
                                            </div>
                                        ) : (
                                            <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-300'}`}>-</span>
                                        )}
                                    </td>
                                    <td className={tdClass}>{formatDate(item.dueDate, lang)}</td>
                                    <td className={tdClass}>{formatDate(item.endDate, lang)}</td>
                                    <td className={`${tdClass} text-center`}>{hasSubtasks ? aggDevTime : item.devTime}</td>
                                    <td className={`${tdClass} text-center`}>
                                        {(hasSubtasks ? aggDelay : item.delayDays) > 0 ? <span className="text-rose-500 font-bold">+{hasSubtasks ? aggDelay : item.delayDays}</span> : <span className="text-emerald-500">-</span>}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {tableData.length > 50 && (
                    <div className={`p-4 text-center text-sm border-t ${dark ? 'text-slate-500 bg-slate-800/50 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                        {t.showingFirst50} {tableData.length} {t.items}
                    </div>
                )}
            </div>
                );
            })()}
        </div>
    );
}
