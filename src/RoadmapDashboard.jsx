import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import {
    Calendar, CalendarDays, CalendarRange, Rocket, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Home, Folder,
    CircleCheck, AlertTriangle, OctagonAlert, Check, MapPin, Pencil, Trash2, Plus, X, Lock, Unlock, Route, Settings,
    GripVertical, Copy,
} from 'lucide-react';
import {
    ROADMAP_SHEET_ID, ROADMAP_GID, ROADMAP_SCRIPT_URL, ROADMAP_REFRESH_MS, ROADMAP_TOKEN_KEY,
    TH_MF, byOrder, byDate, toDate, fmtD, labelOf, startOfWeek, isoWeek,
    projList, projName, inProj, dateVal, stateRefOpts,
    PROJECT_PALETTE, projectColorIndex,
    FORMS, validateRow, mergeResponse, SYNCED_TIMELINE_STATE_FIELDS, NEW_STATE_OPTION,
    fetchRoadmapData, roadmapApiPost, getRoadmapFallbackData,
} from './utils/roadmap';

/* ================= style helpers ================= */
function statusAccent(dark, status) {
    const map = {
        draft: {
            text: dark ? 'text-slate-400' : 'text-slate-500', bg: dark ? 'bg-slate-500/10' : 'bg-slate-100',
            border: dark ? 'border-slate-500/30' : 'border-slate-300', borderL: 'border-l-slate-400',
            chip: 'bg-slate-500', dot: 'bg-slate-500',
        },
        plan: {
            text: dark ? 'text-amber-400' : 'text-amber-600', bg: dark ? 'bg-amber-500/10' : 'bg-amber-50',
            border: dark ? 'border-amber-500/30' : 'border-amber-200', borderL: 'border-l-amber-500',
            chip: 'bg-amber-500', dot: 'bg-amber-500',
        },
        inprogress: {
            text: dark ? 'text-blue-400' : 'text-blue-600', bg: dark ? 'bg-blue-500/10' : 'bg-blue-50',
            border: dark ? 'border-blue-500/30' : 'border-blue-200', borderL: 'border-l-blue-500',
            chip: 'bg-blue-500', dot: 'bg-blue-500',
        },
        release: {
            text: dark ? 'text-emerald-400' : 'text-emerald-600', bg: dark ? 'bg-emerald-500/10' : 'bg-emerald-50',
            border: dark ? 'border-emerald-500/30' : 'border-emerald-200', borderL: 'border-l-emerald-500',
            chip: 'bg-emerald-500', dot: 'bg-emerald-500',
        },
    };
    return map[(status || 'plan').toLowerCase()] || map.plan;
}

const healthStyle = (dark, kind) => ({
    onplan: dark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    risk: dark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-200',
    delay: dark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200',
}[kind] || '');

function HealthBadge({ dark, health, note, okLabel }) {
    if (!health) return null;
    const map = {
        onplan: { icon: CircleCheck, label: okLabel || 'ON PLAN' },
        risk: { icon: AlertTriangle, label: 'RISK' },
        delay: { icon: OctagonAlert, label: 'DELAY' },
    };
    const m = map[(health || '').toLowerCase()];
    if (!m) return null;
    const Icon = m.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${healthStyle(dark, (health || '').toLowerCase())}`}>
            <Icon size={11} /> {m.label}{note ? ` · ${note}` : ''}
        </span>
    );
}

function SysTag({ system }) {
    if (!system) return null;
    const known = {
        bot: { label: 'CS BOT', cls: 'bg-emerald-600' },
        hub: { label: 'CS HUB', cls: 'bg-blue-600' },
        both: { label: 'HUB × BOT', cls: 'bg-violet-600' },
    };
    const k = known[(system || '').toLowerCase()];
    return (
        <span className={`text-[8.5px] font-extrabold tracking-wide px-1.5 py-0.5 rounded text-white whitespace-nowrap ${k ? k.cls : 'bg-slate-500'}`}>
            {k ? k.label : system.toUpperCase()}
        </span>
    );
}

function ProjectChip({ dark, label, colorIdx = 0 }) {
    const c = PROJECT_PALETTE[colorIdx % PROJECT_PALETTE.length];
    return (
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded whitespace-nowrap border ${dark ? c.dark : c.light}`}>
            {label}
        </span>
    );
}

function ProjectMultiSelect({ dark, data, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const options = projList(data);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!options.length) return null;

    const allSelected = selected.length === 0;
    const toggleOption = (opt) => {
        if (selected.includes(opt)) onChange(selected.filter(v => v !== opt));
        else onChange([...selected, opt]);
    };
    const selectAll = () => onChange([]);

    const displayLabel = allSelected
        ? 'ทุกโปรเจค'
        : selected.length === 1
            ? projName(data, selected[0])
            : `${selected.length} โปรเจค`;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-lg border shadow-sm min-w-[130px] max-w-[220px] ${dark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} ${!allSelected ? 'ring-2 ring-blue-500/40' : ''}`}
            >
                <span className="truncate flex-1 text-left">{displayLabel}</span>
                {!allSelected && (
                    <X size={14} className="shrink-0 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); selectAll(); }} />
                )}
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className={`absolute z-50 mt-1 w-56 max-h-72 overflow-y-auto rounded-lg border shadow-lg ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                    <label className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b ${dark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={allSelected} onChange={selectAll} className="rounded accent-blue-500" />
                        <span className={`text-[12.5px] font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>ทุกโปรเจค</span>
                    </label>
                    {options.map(opt => (
                        <label key={opt} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${dark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} className="rounded accent-blue-500" />
                            <span className={`text-[12.5px] truncate ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{projName(data, opt)}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

function CardTools({ dark, disabled, onEdit, onDelete, onDuplicate }) {
    return (
        <span className="inline-flex gap-1 ml-auto">
            {onDuplicate && (
                <button
                    onClick={onDuplicate} disabled={disabled} title="ทำสำเนา"
                    className={`w-6 h-6 rounded-md border inline-flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                ><Copy size={12} /></button>
            )}
            <button
                onClick={onEdit} disabled={disabled} title="แก้ไข"
                className={`w-6 h-6 rounded-md border inline-flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            ><Pencil size={12} /></button>
            <button
                onClick={onDelete} disabled={disabled} title="ลบ"
                className={`w-6 h-6 rounded-md border inline-flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40' : 'border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
            ><Trash2 size={12} /></button>
        </span>
    );
}

/* ================= WEEKLY ================= */
function WeeklyCard({ dark, r, showProject, data, editMode, onEdit, onDelete, onDuplicate, extra }) {
    const s = toDate(r.start), e = toDate(r.end), p = toDate(r.prod_date);
    const range = r.date_label ? labelOf(r) : (s ? (e ? `${fmtD(s)} – ${fmtD(e)}` : fmtD(s)) : '');
    const feats = (r.items || '').split('|').map(x => x.trim()).filter(Boolean);
    const shown = feats.slice(0, 4);
    const accent = statusAccent(dark, r.status);
    const draggable = editMode && !!r.id;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: r.id || `nodrag-${r.project}-${r.code}-${r.title}`, disabled: !draggable });
    const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 60 : undefined } : undefined;
    return (
        <div ref={setNodeRef} style={dragStyle} className={`group relative rounded-lg border border-l-4 p-2.5 ${accent.borderL} ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${isDragging ? 'opacity-60 shadow-lg' : ''}`}>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {draggable && (
                    <span
                        {...attributes} {...listeners} title="ลากเพื่อย้าย column"
                        className={`shrink-0 cursor-grab active:cursor-grabbing touch-none rounded p-0.5 transition-opacity pointer-coarse:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                    ><GripVertical size={14} /></span>
                )}
                {showProject && <ProjectChip dark={dark} label={projName(data, r.project)} colorIdx={projectColorIndex(data, r.project)} />}
                <span className={`text-[9.5px] font-bold text-white px-1.5 py-0.5 rounded whitespace-nowrap ${accent.chip}`}>{r.code || '•'}</span>
                {range && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-blue-300 bg-blue-500/10 border-blue-500/30' : 'text-blue-800 bg-blue-50 border-blue-200'}`}>
                        <CalendarRange size={11} /> {range}
                    </span>
                )}
                {editMode && <CardTools dark={dark} disabled={!r.id} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onDuplicate={() => onDuplicate(r)} />}
            </div>
            <div className={`text-[12.5px] font-bold leading-tight mb-1 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{r.title}</div>
            <div className="flex gap-1 flex-wrap my-1">
                {p && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-200'}`}>
                        <Rocket size={11} /> Prod {fmtD(p)}
                    </span>
                )}
                {extra}
            </div>
            {r.health && <div className="my-0.5"><HealthBadge dark={dark} health={r.health} note={r.health_note} /></div>}
            {shown.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                    {shown.map((f, i) => (
                        <li key={i} className={`text-[10.8px] leading-snug pl-3 relative ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <span className={`absolute left-0 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>{f}
                        </li>
                    ))}
                </ul>
            )}
            {feats.length > 4 && <div className={`text-[10px] italic mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>+ อีก {feats.length - 4} รายการ</div>}
        </div>
    );
}

function KanbanColumn({ dark, id, droppable, title, count, dotClass, children }) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });
    return (
        <div
            ref={droppable ? setNodeRef : undefined}
            className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${isOver ? (dark ? 'ring-2 ring-blue-500/60' : 'ring-2 ring-blue-400/70') : ''}`}
        >
            <div className={`flex items-center gap-2 px-3.5 py-2.5 border-b font-extrabold text-[13px] ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                {title}
                <span className={`ml-auto text-[11px] font-semibold px-2 rounded-full border ${dark ? 'border-slate-600 bg-slate-700 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>{count}</span>
            </div>
            <div className="p-2.5 flex flex-col gap-2 min-h-[110px]">
                {children.length ? children : (
                    <div className={`text-[11.5px] italic text-center py-6 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>— ไม่มีรายการ —</div>
                )}
            </div>
        </div>
    );
}

function WeeklyView({ dark, data, projects, editMode, weekOffset, setWeekOffset, onEdit, onDelete, onDuplicate, onDropCard }) {
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
    const ws = useMemo(() => { const w = startOfWeek(today); w.setDate(w.getDate() + weekOffset * 7); return w; }, [today, weekOffset]);
    const we = useMemo(() => { const w = new Date(ws); w.setDate(w.getDate() + 6); w.setHours(23, 59, 59, 0); return w; }, [ws]);

    const rows = useMemo(() => data.filter(r => r.type === 'timeline' && inProj(r, projects)), [data, projects]);
    const inWeek = d => d && d >= ws && d <= we;
    const overlaps = r => { const s = toDate(r.start), e = toDate(r.end) || toDate(r.prod_date) || s; return s && s <= we && e >= ws; };

    const { rel, prog, plan } = useMemo(() => {
        const used = new Set();
        const rel = rows.filter(r => { const ok = inWeek(toDate(r.prod_date)); if (ok) used.add(r); return ok; });
        const prog = rows.filter(r => !used.has(r) && (r.status || '').toLowerCase() === 'inprogress' && overlaps(r) && (used.add(r), true));
        const plan = rows.filter(r => !used.has(r) && (r.status || '').toLowerCase() === 'plan' && overlaps(r));
        return { rel, prog, plan };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, ws, we]);

    const showProject = projects.length !== 1;
    const card = (r) => <WeeklyCard key={r.id || `${r.project}-${r.code}-${r.title}`} dark={dark} r={r} showProject={showProject} data={data} editMode={editMode} onEdit={() => onEdit('timeline', r)} onDelete={() => onDelete(r)} onDuplicate={() => onDuplicate(r)} />;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    );

    const columnOf = (r) => (rel.includes(r) ? 'release' : prog.includes(r) ? 'inprogress' : plan.includes(r) ? 'plan' : null);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;
        const targetStatus = over.id;
        const row = rows.find(r => r.id === active.id);
        if (!row) return;
        if (columnOf(row) === targetStatus) return; // dropped back on its own column — no-op

        const patch = { status: targetStatus };
        let needsFields = null;

        if (targetStatus === 'release') {
            if (!inWeek(toDate(row.prod_date))) needsFields = ['prod_date'];
        } else {
            // Release membership checks prod_date FIRST, regardless of status — a prod_date still in this
            // week would pull the card straight back into Release even after the status change. Clear it.
            if (inWeek(toDate(row.prod_date))) patch.prod_date = '';
            if (!overlaps({ ...row, ...patch })) needsFields = ['start', 'end'];
        }
        onDropCard(row, patch, needsFields, needsFields ? { min: dateVal(ws), max: dateVal(we) } : null);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div>
                <div className={`flex items-center justify-center gap-3 rounded-xl border shadow-sm p-2.5 mb-3.5 flex-wrap ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setWeekOffset(o => o - 1)} className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center ${dark ? 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-blue-500/10 hover:text-blue-400' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}><ChevronLeft size={16} /></button>
                    <div className="text-center min-w-[220px]">
                        <div className={`text-[15px] font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{fmtD(ws)} – {fmtD(we)} {we.getFullYear()}</div>
                        <div className={`text-[10px] font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>สัปดาห์ที่ {isoWeek(ws)}{weekOffset === 0 ? ' · สัปดาห์นี้' : ''}</div>
                    </div>
                    <button onClick={() => setWeekOffset(o => o + 1)} className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center ${dark ? 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-blue-500/10 hover:text-blue-400' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}><ChevronRight size={16} /></button>
                    <button onClick={() => setWeekOffset(0)} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${dark ? 'text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'}`}><Home size={13} /> สัปดาห์นี้</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <KanbanColumn dark={dark} id="plan" droppable={editMode} title="Plan — ตามแผนสัปดาห์นี้" count={plan.length} dotClass="bg-amber-500">{plan.map(card)}</KanbanColumn>
                    <KanbanColumn dark={dark} id="inprogress" droppable={editMode} title="In Progress — กำลังทำ" count={prog.length} dotClass="bg-blue-500">{prog.map(card)}</KanbanColumn>
                    <KanbanColumn dark={dark} id="release" droppable={editMode} title="Release — ขึ้น Prod" count={rel.length} dotClass="bg-emerald-500">{rel.map(card)}</KanbanColumn>
                </div>

                <div className={`mt-3.5 text-center text-[12px] rounded-lg border p-2 ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <b>สรุปสัปดาห์:</b> <Rocket size={13} className="inline -mt-0.5" /> ขึ้น Prod <b>{rel.length}</b> · <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 align-middle mx-0.5" /> กำลังทำ <b>{prog.length}</b> · <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 align-middle mx-0.5" /> ตามแผน <b>{plan.length}</b> รายการ
                </div>
                <div className={`text-center text-[10.5px] mt-3 pb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    การ์ดจัดกลุ่มอัตโนมัติจากวันที่ในชีต · เลื่อน <ChevronLeft size={11} className="inline" /><ChevronRight size={11} className="inline" /> เพื่อดูรายงานย้อนหลัง/ล่วงหน้า{editMode && <> · ลากการ์ดเพื่อย้าย column</>}
                </div>
            </div>
        </DndContext>
    );
}

/* ================= OVERVIEW ================= */
function RelCard({ dark, r, showProject, data, editMode, onEdit, onDelete, onDuplicate }) {
    const st = (r.status || 'plan').toLowerCase();
    const s = toDate(r.start), e = toDate(r.end), p = toDate(r.prod_date);
    const lbl = r.date_label ? labelOf(r) : (s && e ? `${fmtD(s)} – ${fmtD(e)}` : (s ? fmtD(s) : ''));
    const feats = (r.items || '').split('|').map(x => x.trim()).filter(Boolean);
    const accent = statusAccent(dark, st);
    return (
        <div className={`rounded-lg border border-l-4 p-2 ${accent.borderL} ${dark ? (st === 'inprogress' ? 'bg-blue-500/5' : 'bg-slate-800') + ' border-slate-700' : (st === 'inprogress' ? 'bg-blue-50/40' : 'bg-white') + ' border-slate-200'}`}>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {showProject && <ProjectChip dark={dark} label={projName(data, r.project)} colorIdx={projectColorIndex(data, r.project)} />}
                <span className={`text-[9.5px] font-bold text-white px-1.5 py-0.5 rounded whitespace-nowrap ${accent.chip}`}>{r.code || '•'}</span>
                {lbl && (
                    <span className={`inline-flex items-center gap-1 text-[8.8px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-blue-300 bg-blue-500/10 border-blue-500/30' : 'text-blue-800 bg-blue-50 border-blue-200'}`}>
                        <CalendarRange size={10} /> {lbl}
                    </span>
                )}
                {editMode && <CardTools dark={dark} disabled={!r.id} onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} onDuplicate={() => onDuplicate(r)} />}
            </div>
            <div className={`text-[11.8px] font-bold leading-tight mb-1 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{r.title}</div>
            <div className="flex gap-1 flex-wrap my-0.5">
                {p && (
                    <span className={`inline-flex items-center gap-1 text-[8.8px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-200'}`}>
                        <Rocket size={10} /> {fmtD(p)}
                    </span>
                )}
                {r.health && st !== 'release' && <HealthBadge dark={dark} health={r.health} note={r.health_note} />}
            </div>
            {feats.length > 0 && (
                <ul className="mt-0.5 space-y-0.5">
                    {feats.map((f, i) => (
                        <li key={i} className={`text-[10.5px] leading-snug pl-3 relative ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <span className={`absolute left-0 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>{f}
                        </li>
                    ))}
                </ul>
            )}
            {r.note && <div className={`text-[9.8px] italic mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{r.note}</div>}
        </div>
    );
}

function OverviewView({ dark, data, projects, editMode, ovMode, setOvMode, onEdit, onDelete, onDuplicate }) {
    const rows = useMemo(() => data.filter(r => r.type === 'timeline' && inProj(r, projects)).sort(byDate), [data, projects]);
    const showProject = projects.length !== 1;
    const today = new Date();
    const curKey = today.getFullYear() * 12 + today.getMonth();
    const keyOf = r => { const d = toDate(r.start) || toDate(r.prod_date); return d ? d.getFullYear() * 12 + d.getMonth() : null; };

    const SegBtn = ({ active, onClick, children }) => (
        <button onClick={onClick} className={`px-4 py-1.5 text-[12px] font-bold transition-colors ${active ? 'bg-blue-600 text-white' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{children}</button>
    );

    const bar = (
        <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
            <span className={`text-[13px] font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>มุมมอง:</span>
            <div className={`flex rounded-lg border overflow-hidden shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <SegBtn active={ovMode === 'month'} onClick={() => setOvMode('month')}>รายเดือน</SegBtn>
                <SegBtn active={ovMode === 'quarter'} onClick={() => setOvMode('quarter')}>รายไตรมาส</SegBtn>
            </div>
        </div>
    );

    const foot = (
        <div className={`text-center text-[10.5px] mt-3 pb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            คอลัมน์สร้างจากข้อมูลจริงในชีต · <b className={dark ? 'text-emerald-400' : 'text-emerald-600'}>เขียว</b>=ผ่านแล้ว · <b className={dark ? 'text-blue-400' : 'text-blue-600'}>น้ำเงิน</b>=ปัจจุบัน · <b className={dark ? 'text-amber-400' : 'text-amber-600'}>ส้ม</b>=ข้างหน้า
        </div>
    );

    if (ovMode === 'month') {
        const keys = [...new Set(rows.map(keyOf).filter(k => k != null))].sort((a, b) => a - b);
        if (!keys.length) {
            return <div>{bar}<EmptyState dark={dark} text="ไม่มีข้อมูล timeline ของโปรเจคนี้" />{foot}</div>;
        }
        return (
            <div>
                {bar}
                <div className="flex flex-col md:grid md:grid-flow-col md:auto-cols-[minmax(225px,1fr)] gap-3 overflow-x-auto pb-1.5">
                    {keys.map(k => {
                        const y = Math.floor(k / 12), m = k % 12, q = 'Q' + (Math.floor(m / 3) + 1);
                        const cls = k < curKey ? 'past' : (k === curKey ? 'now' : 'next');
                        const accentColor = cls === 'past' ? 'border-t-emerald-500' : cls === 'now' ? 'border-t-blue-500' : 'border-t-amber-500';
                        const chipColor = cls === 'past' ? 'bg-emerald-500' : cls === 'now' ? 'bg-blue-500' : 'bg-amber-500';
                        const items = rows.filter(r => keyOf(r) === k);
                        return (
                            <div key={k} className={`rounded-xl border border-t-4 shadow-sm overflow-hidden min-w-0 ${accentColor} ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${cls === 'now' ? 'ring-2 ring-blue-500/25' : ''}`}>
                                <div className={`flex items-center gap-1.5 px-3 py-2 border-b ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className={`text-[13px] font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{TH_MF[m]}</span>
                                    <span className={`text-[8.5px] font-bold text-white px-1.5 py-0.5 rounded-full ${chipColor}`}>{q}</span>
                                    {cls === 'now' && <span className={`ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${dark ? 'text-blue-300 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>เดือนนี้</span>}
                                </div>
                                <div className="p-2.5 flex flex-col gap-2">
                                    {items.map(r => <RelCard key={r.id || `${r.project}-${r.code}-${r.title}`} dark={dark} r={r} showProject={showProject} data={data} editMode={editMode} onEdit={() => onEdit('timeline', r)} onDelete={() => onDelete(r)} onDuplicate={() => onDuplicate(r)} />)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {foot}
            </div>
        );
    }

    // quarter mode
    const qKey = r => { const d = toDate(r.start) || toDate(r.prod_date); return d ? `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}` : null; };
    const curQ = `${today.getFullYear()}-Q${Math.floor(today.getMonth() / 3) + 1}`;
    const keys = [...new Set(rows.map(qKey).filter(Boolean))].sort();
    if (!keys.length) return <div>{bar}<EmptyState dark={dark} text="ไม่มีข้อมูล timeline ของโปรเจคนี้" />{foot}</div>;

    return (
        <div>
            {bar}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))' }}>
                {keys.map(k => {
                    const items = rows.filter(r => qKey(r) === k);
                    const rel = items.filter(r => (r.status || '').toLowerCase() === 'release').length;
                    const prog = items.filter(r => (r.status || '').toLowerCase() === 'inprogress').length;
                    const draft = items.filter(r => (r.status || '').toLowerCase() === 'draft').length;
                    const plan = items.length - rel - prog - draft;
                    const pct = items.length ? Math.round((rel / items.length) * 100) : 0;
                    const cls = k < curQ ? 'past' : (k === curQ ? 'now' : 'next');
                    const accentColor = cls === 'past' ? 'border-t-emerald-500' : cls === 'now' ? 'border-t-blue-500' : 'border-t-slate-400';
                    return (
                        <div key={k} className={`rounded-xl border border-t-4 shadow-sm overflow-hidden ${accentColor} ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${cls === 'now' ? 'ring-2 ring-blue-500/25' : ''}`}>
                            <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                                <span className={`text-[15px] font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{k.replace('-', ' · ')}</span>
                                {cls === 'now' && <span className={`ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${dark ? 'text-blue-300 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>ไตรมาสนี้</span>}
                            </div>
                            <div className="p-3.5">
                                <div className={`text-[10.5px] font-bold mb-1.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>ความคืบหน้า {rel}/{items.length} รายการ ({pct}%)</div>
                                <div className={`h-2 rounded-md overflow-hidden mb-2 ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                    <div className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex gap-2 flex-wrap text-[10.5px] font-bold mb-2">
                                    <span className={`px-2 py-0.5 rounded-full border ${dark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>Release {rel}</span>
                                    <span className={`px-2 py-0.5 rounded-full border ${dark ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>กำลังทำ {prog}</span>
                                    <span className={`px-2 py-0.5 rounded-full border ${dark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>แผน {plan}</span>
                                    {draft > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full border ${dark ? 'text-slate-400 bg-slate-500/10 border-slate-500/30' : 'text-slate-600 bg-slate-100 border-slate-300'}`}>Draft {draft}</span>
                                    )}
                                </div>
                                {showProject ? (
                                    projList(data).filter(pk => items.some(r => r.project === pk)).map((pk, gi) => {
                                        const groupItems = items.filter(r => r.project === pk);
                                        const idx = projectColorIndex(data, pk);
                                        const c = PROJECT_PALETTE[idx];
                                        return (
                                            <div key={pk} className={gi > 0 ? `mt-2.5 pt-2.5 border-t ${dark ? 'border-slate-700/60' : 'border-slate-100'}` : ''}>
                                                <div className={`flex items-center gap-1.5 text-[10px] font-extrabold mb-1 ${dark ? c.dark.split(' ')[0] : c.light.split(' ')[0]}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {projName(data, pk)}
                                                </div>
                                                <ul className="space-y-1">
                                                    {groupItems.map(r => <QuarterItemRow key={r.id || r.title} dark={dark} r={r} />)}
                                                </ul>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <ul className="space-y-1">
                                        {items.map(r => <QuarterItemRow key={r.id || r.title} dark={dark} r={r} />)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {foot}
        </div>
    );
}

function QuarterItemRow({ dark, r }) {
    const p = toDate(r.prod_date);
    const accent = statusAccent(dark, r.status);
    return (
        <li className={`text-[11px] flex gap-1.5 items-baseline ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className={`text-[9px] font-bold rounded px-1.5 whitespace-nowrap text-white ${accent.chip}`}>{r.code || '•'}</span>
            <span className="flex-1">{r.title}</span>
            <span className={`text-[9.5px] whitespace-nowrap ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{p ? <><Rocket size={10} className="inline" /> {fmtD(p)}</> : labelOf(r)}</span>
        </li>
    );
}

function EmptyState({ dark, text }) {
    return (
        <div className={`text-center rounded-xl border border-dashed p-8 text-[13px] ${dark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>{text}</div>
    );
}

/* ================= CONFIG (project list) ================= */
function ConfigView({ dark, data, editMode, onEdit, onDelete }) {
    const projects = useMemo(() => data.filter(r => r.type === 'project').sort(byOrder), [data]);
    if (!projects.length) {
        return <EmptyState dark={dark} text='ยังไม่มีโปรเจค — กด "+ เพิ่มโปรเจค" ที่แถบเครื่องมือโหมดแก้ไขด้านบน' />;
    }
    const countChip = (n, label) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-slate-300 bg-slate-700/50 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>{n} {label}</span>
    );
    return (
        <div className="flex flex-col gap-2.5">
            {projects.map(p => {
                const idx = projectColorIndex(data, p.project);
                const c = PROJECT_PALETTE[idx];
                const counts = {
                    timeline: data.filter(r => r.type === 'timeline' && r.project === p.project).length,
                    state: data.filter(r => r.type === 'state' && r.project === p.project).length,
                    channel: data.filter(r => r.type === 'channel' && r.project === p.project).length,
                };
                return (
                    <div key={p.id || p.project} className={`rounded-xl border shadow-sm p-3.5 flex items-center gap-3 flex-wrap ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[14px] font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{p.title || p.project}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${dark ? 'text-slate-400 bg-slate-900 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>{p.project}</span>
                            </div>
                            {p.note && <div className={`text-[11.5px] mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{p.note}</div>}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {countChip(counts.timeline, 'รายการ')}
                            {countChip(counts.state, 'State')}
                            {countChip(counts.channel, 'Channel')}
                        </div>
                        {editMode && <CardTools dark={dark} disabled={!p.id} onEdit={() => onEdit(p)} onDelete={() => onDelete(p)} />}
                    </div>
                );
            })}
        </div>
    );
}

/* ================= ROLLOUT ================= */
function RolloutProject({ dark, data, p, editMode, onEditRow, onDeleteRow, onAddState, onAddChannel, onEditCell }) {
    const states = useMemo(() => data.filter(r => r.type === 'state' && r.project === p).sort(byOrder), [data, p]);
    if (!states.length) return null;
    const chRows = data.filter(r => r.type === 'channel' && r.project === p);
    const chans = [];
    chRows.slice().sort(byOrder).forEach(r => { if (r.channel && !chans.includes(r.channel)) chans.push(r.channel); });
    const curIdx = states.findIndex(s => (s.status || '').toLowerCase() === 'inprogress');
    const relCnt = states.filter(s => (s.status || '').toLowerCase() === 'release').length;
    const worst = states.some(s => (s.health || '') === 'delay') ? 'delay' : (states.some(s => (s.health || '') === 'risk') ? 'risk' : 'onplan');
    const meta = data.find(r => r.type === 'project' && r.project === p);

    return (
        <div className={`rounded-xl border shadow-sm overflow-hidden mb-4 ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center gap-3 px-4 py-3 border-b flex-wrap ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                <Folder size={18} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                <div>
                    <div className={`text-[16px] font-bold ${dark ? 'text-slate-100' : 'text-slate-800'}`}>{projName(data, p)} — Rollout Roadmap</div>
                    <div className={`text-[10.5px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{meta ? meta.note : ''}</div>
                </div>
                <div className="ml-auto flex items-center gap-2.5 flex-wrap">
                    <HealthBadge dark={dark} health={worst} />
                    <span className={`text-[11px] font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>คืบหน้า <b className={dark ? 'text-emerald-400' : 'text-emerald-600'}>{relCnt}</b>/{states.length} State</span>
                    {editMode && (
                        <span className="inline-flex gap-1.5">
                            <button onClick={() => onEditRow('project', meta)} disabled={!meta?.id} title="แก้ไขโปรเจค" className={`w-6 h-6 rounded-md border inline-flex items-center justify-center disabled:opacity-30 ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'}`}><Pencil size={12} /></button>
                            <button onClick={() => onAddState(p)} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> State</button>
                            <button onClick={() => onAddChannel(p)} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> Channel</button>
                        </span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: `155px repeat(${states.length}, minmax(146px, 1fr))`, minWidth: `${155 + states.length * 146}px` }}>
                    <div className={`flex items-end px-3 pt-3.5 pb-2.5 text-[10px] font-bold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Channel ╲ State</div>
                    {states.map((s, i) => {
                        const st = (s.status || 'plan').toLowerCase();
                        const cls = st === 'release' ? 'done' : (st === 'inprogress' ? 'cur' : 'plan');
                        return (
                            <div key={s.id || s.code} className={`relative text-center px-1.5 pt-5.5 pb-3 ${cls === 'cur' ? (dark ? 'bg-blue-500/10' : 'bg-blue-50/60') : ''}`}>
                                {i > 0 && (
                                    <div className={`absolute top-[35px] h-[3.5px] rounded z-[1] ${cls === 'plan' ? `border-t-[3.5px] border-dashed ${dark ? 'border-slate-600' : 'border-slate-300'}` : 'bg-emerald-500'}`} style={{ left: 'calc(-50% + 15px)', width: 'calc(100% - 30px)' }} />
                                )}
                                {cls === 'cur' && (
                                    <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-white bg-blue-500 px-2 py-0.5 rounded-full whitespace-nowrap z-[3] inline-flex items-center gap-1"><MapPin size={10} /> ตอนนี้</span>
                                )}
                                <div className={`relative z-[2] w-[27px] h-[27px] rounded-full mx-auto flex items-center justify-center ${
                                    cls === 'done' ? 'bg-emerald-500 text-white' : cls === 'cur' ? 'bg-blue-500 text-white animate-pulse' : `border-2 border-dashed ${dark ? 'border-slate-600 text-slate-600' : 'border-slate-300 text-slate-400'}`
                                }`}>
                                    {cls === 'done' && <Check size={15} />}
                                </div>
                                <div className="mt-1.5 flex gap-1 justify-center flex-wrap">
                                    <SysTag system={s.system} />
                                    {s.version && <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${dark ? 'text-slate-400 bg-slate-700 border-slate-600' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>{s.version}</span>}
                                </div>
                                <div className={`mt-1 text-[12.5px] font-bold leading-tight ${cls === 'plan' ? (dark ? 'text-slate-500' : 'text-slate-500') : (dark ? 'text-slate-100' : 'text-slate-800')}`}>{s.title}</div>
                                <div className={`mt-1 text-[10.5px] font-bold ${cls === 'done' ? (dark ? 'text-emerald-400' : 'text-emerald-600') : cls === 'cur' ? (dark ? 'text-blue-400' : 'text-blue-600') : (dark ? 'text-slate-500' : 'text-slate-400')}`}>{labelOf(s)}</div>
                                <div className="mt-1">
                                    {st === 'release'
                                        ? <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${healthStyle(dark, 'onplan')}`}><Check size={11} /> ตามแผน</span>
                                        : <HealthBadge dark={dark} health={s.health} note={s.health_note} />}
                                </div>
                                {editMode && (
                                    <div className="flex gap-1 justify-center mt-1.5">
                                        <button onClick={() => onEditRow('state', s)} disabled={!s.id} title="แก้ไข State" className={`w-6 h-6 rounded-md border inline-flex items-center justify-center disabled:opacity-30 ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'}`}><Pencil size={11} /></button>
                                        <button onClick={() => onDeleteRow(s)} disabled={!s.id} title="ลบ State" className={`w-6 h-6 rounded-md border inline-flex items-center justify-center disabled:opacity-30 ${dark ? 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600'}`}><Trash2 size={11} /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {chans.map(ch => (
                        <React.Fragment key={ch}>
                            <div className={`flex items-center gap-1.5 px-3 py-2.5 text-[11.8px] font-bold border-t ${dark ? 'text-slate-200 border-slate-700 bg-slate-800/60' : 'text-slate-800 border-slate-200 bg-slate-50'}`}>{ch}</div>
                            {states.map((s, i) => {
                                const cell = chRows.find(r => r.channel === ch && r.state_ref === s.code);
                                const hl = i === curIdx;
                                const clickable = editMode;
                                const base = `flex items-center justify-center px-1.5 py-2 border-t text-[10.8px] font-bold text-center ${dark ? 'border-slate-700' : 'border-slate-200'} ${hl ? (dark ? 'bg-blue-500/10' : 'bg-blue-50/60') : ''} ${clickable ? 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500 hover:-outline-offset-2 rounded' : ''}`;
                                if (!cell) return <div key={s.id || s.code} className={`${base} ${dark ? 'text-slate-700' : 'text-slate-300'}`} onClick={clickable ? () => onEditCell(p, ch, s.code) : undefined}>—</div>;
                                const st = (cell.status || 'plan').toLowerCase();
                                const lbl = labelOf(cell);
                                let content;
                                if (st === 'release') content = <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}><Check size={11} /> {lbl}</span>;
                                else if (st === 'inprogress') content = <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'}`}><span className="w-1.5 h-1.5 rounded-full bg-current" /> {lbl}</span>;
                                else if (st === 'carry') content = <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[10px] ${dark ? 'text-emerald-500/70' : 'text-emerald-700/70'}`}><Check size={11} /> {lbl || 'ใช้งานต่อเนื่อง'}</span>;
                                else content = <span className={`px-2 py-0.5 rounded-full border whitespace-nowrap ${dark ? 'text-slate-300 bg-slate-700/50 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>{lbl}</span>;
                                return <div key={s.id || s.code} className={base} onClick={clickable ? () => onEditCell(p, ch, s.code) : undefined}>{content}</div>;
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RolloutView({ dark, data, projects, editMode, onEditRow, onDeleteRow, onAddState, onAddChannel, onEditCell }) {
    const projs = (projects.length === 0 ? projList(data) : projects).filter(p => data.some(r => r.type === 'state' && r.project === p));
    const legendItem = (dotCls, label) => (
        <span className="inline-flex items-center gap-1.5"><span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${dotCls}`} /><b>{label}</b></span>
    );
    return (
        <div>
            <div className={`flex gap-3.5 flex-wrap items-center rounded-xl border shadow-sm px-3.5 py-2.5 mb-3.5 text-[11.5px] ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                {legendItem('bg-emerald-500 text-white', 'เสร็จแล้ว')}
                {legendItem('bg-blue-500 ring-[3px] ring-blue-500/25', 'กำลังทำ')}
                {legendItem(`border-2 border-dashed ${dark ? 'border-slate-600' : 'border-slate-300'}`, 'ถัดไป')}
                <span className={`w-px h-4 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <HealthBadge dark={dark} health="onplan" />
                <HealthBadge dark={dark} health="risk" />
                <HealthBadge dark={dark} health="delay" />
                <span className={`w-px h-4 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <span className="inline-flex items-center gap-1.5"><SysTag system="bot" /> <SysTag system="hub" /> <SysTag system="both" /> ระบบของแต่ละ State</span>
            </div>
            {projs.length
                ? projs.map(p => <RolloutProject key={p} dark={dark} data={data} p={p} editMode={editMode} onEditRow={onEditRow} onDeleteRow={onDeleteRow} onAddState={onAddState} onAddChannel={onAddChannel} onEditCell={onEditCell} />)
                : <EmptyState dark={dark} text="โปรเจคนี้ยังไม่มีข้อมูล Rollout — เพิ่มแถว type=state / type=channel ในชีตได้เลย" />}
            <div className={`text-center text-[10.5px] mt-1 pb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                <b>บน:</b> State timeline เส้นเดียวของโปรเจค · <b>ล่าง:</b> ตาราง Channel/กลุ่ม — คอลัมน์ตรงกับ State · คอลัมน์ฟ้า = State ปัจจุบัน
            </div>
        </div>
    );
}

/* ================= MODALS ================= */
function ModalShell({ dark, onClose, maxWidth = 'max-w-[520px]', children }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className={`relative w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden ${dark ? 'bg-slate-800' : 'bg-white'}`}>
                {children}
            </div>
        </div>
    );
}

function PasswordModal({ dark, onClose, onSubmit, verifying, error }) {
    const [pwd, setPwd] = useState('');
    return (
        <ModalShell dark={dark} onClose={onClose} maxWidth="max-w-[380px]">
            <div className={`flex items-center gap-2 px-4.5 py-3.5 border-b font-bold text-[14px] ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                <Lock size={16} /> เข้าโหมดแก้ไข
                <button onClick={onClose} className={`ml-auto w-7 h-7 rounded-lg border inline-flex items-center justify-center ${dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}><X size={15} /></button>
            </div>
            <div className="p-4.5 flex flex-col gap-2.5">
                <label className={`text-[11px] font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>รหัสโหมดแก้ไข</label>
                <input
                    type="password" autoFocus value={pwd} onChange={e => setPwd(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && pwd) onSubmit(pwd); }}
                    className={`text-[13px] px-2.5 py-2 rounded-lg border w-full ${dark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                />
                {error && <div className={`text-[12px] font-semibold rounded-lg border px-2.5 py-2 ${dark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200'}`}>{error}</div>}
            </div>
            <div className={`flex gap-2 items-center px-4.5 py-3.5 border-t ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                <span className="flex-1" />
                <button onClick={onClose} className={`text-[12.5px] font-bold rounded-lg border px-4 py-2 ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>ยกเลิก</button>
                <button onClick={() => pwd && onSubmit(pwd)} disabled={verifying || !pwd} className="text-[12.5px] font-bold rounded-lg px-4 py-2 bg-blue-600 text-white hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {verifying ? <RefreshCw size={14} className="animate-spin" /> : <Unlock size={14} />} เข้าโหมดแก้ไข
                </button>
            </div>
        </ModalShell>
    );
}

function DeleteConfirmModal({ dark, label, note, onClose, onConfirm, deleting }) {
    return (
        <ModalShell dark={dark} onClose={onClose} maxWidth="max-w-[380px]">
            <div className="p-5">
                <div className={`text-[14px] font-bold mb-1.5 ${dark ? 'text-slate-100' : 'text-slate-800'}`}>ยืนยันการลบ</div>
                <div className={`text-[13px] ${dark ? 'text-slate-400' : 'text-slate-600'}`}>ต้องการลบ "{label}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</div>
                {note && (
                    <div className={`mt-2.5 text-[11.5px] rounded-lg border px-2.5 py-2 ${dark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>{note}</div>
                )}
            </div>
            <div className={`flex gap-2 items-center px-5 py-3.5 border-t ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                <span className="flex-1" />
                <button onClick={onClose} className={`text-[12.5px] font-bold rounded-lg border px-4 py-2 ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>ยกเลิก</button>
                <button onClick={onConfirm} disabled={deleting} className="text-[12.5px] font-bold rounded-lg px-4 py-2 bg-red-600 text-white hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} ลบ
                </button>
            </div>
        </ModalShell>
    );
}

const DRAG_TARGET_LABEL = { plan: 'Plan', inprogress: 'In Progress', release: 'Release' };
const DRAG_FIELD_LABEL = { prod_date: 'วันขึ้น Prod', start: 'เริ่ม', end: 'สิ้นสุด' };

function DragDateModal({ dark, row, patch, needsFields, weekRange, onClose, onConfirm, saving, error }) {
    const targetStatus = patch.status;
    const [values, setValues] = useState(() => {
        const init = {};
        needsFields.forEach(f => {
            init[f] = dateVal(row[f]) || (f === 'prod_date' && weekRange ? weekRange.min : '');
        });
        return init;
    });
    const canConfirm = needsFields.every(f => values[f]);
    return (
        <ModalShell dark={dark} onClose={onClose} maxWidth="max-w-[380px]">
            <div className={`flex items-center gap-2 px-4.5 py-3.5 border-b font-bold text-[14px] ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                <CalendarRange size={16} /> ย้ายไปที่ {DRAG_TARGET_LABEL[targetStatus] || targetStatus}
                <button onClick={onClose} className={`ml-auto w-7 h-7 rounded-lg border inline-flex items-center justify-center ${dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}><X size={15} /></button>
            </div>
            <div className="p-4.5 flex flex-col gap-3">
                <div className={`text-[11.5px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    "{row.title}" ยังไม่มีวันที่ที่จะทำให้ปรากฏใน {DRAG_TARGET_LABEL[targetStatus] || targetStatus} — กรุณากำหนดก่อนย้าย
                </div>
                {error && <div className={`text-[12px] font-semibold rounded-lg border px-2.5 py-2 ${dark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200'}`}>{error}</div>}
                {needsFields.map(f => (
                    <div key={f} className="flex flex-col gap-1">
                        <label className={`text-[11px] font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{DRAG_FIELD_LABEL[f] || f}</label>
                        <input
                            type="date" value={values[f] || ''} onChange={e => setValues(v => ({ ...v, [f]: e.target.value }))}
                            min={f === 'prod_date' && weekRange ? weekRange.min : undefined}
                            max={f === 'prod_date' && weekRange ? weekRange.max : undefined}
                            className={`text-[13px] px-2.5 py-2 rounded-lg border w-full ${dark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                        />
                    </div>
                ))}
            </div>
            <div className={`flex gap-2 items-center px-4.5 py-3.5 border-t ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                <span className="flex-1" />
                <button onClick={onClose} className={`text-[12.5px] font-bold rounded-lg border px-4 py-2 ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>ยกเลิก</button>
                <button onClick={() => onConfirm(values)} disabled={saving || !canConfirm} className="text-[12.5px] font-bold rounded-lg px-4 py-2 bg-blue-600 text-white hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} ยืนยันย้าย
                </button>
            </div>
        </ModalShell>
    );
}

function FormField({ dark, name, label, kind, required, value, onChange, options, getOptionLabel }) {
    const inputCls = `text-[13px] px-2.5 py-2 rounded-lg border w-full ${dark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`;
    let input;
    if (kind === 'textarea') {
        input = <textarea value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} min-h-[62px] resize-y`} />;
    } else if (kind === 'date') {
        input = <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />;
    } else if (kind === 'number') {
        input = <input type="number" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />;
    } else if (kind.startsWith('sel-')) {
        input = (
            <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
                {!options.length && <option value="">— ไม่มีตัวเลือก —</option>}
                {options.map(o => <option key={o} value={o}>{getOptionLabel ? getOptionLabel(o) : (o || '—')}</option>)}
            </select>
        );
    } else {
        input = <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputCls} />;
    }
    const hint = name === 'items' ? 'คั่นแต่ละฟีเจอร์ด้วยเครื่องหมาย |' : (kind === 'text' && name === 'project' ? 'key อังกฤษ เช่น ai-chatbot' : '');
    return (
        <div className="flex flex-col gap-1">
            <label className={`text-[11px] font-bold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{label}{required && <span className="text-red-500"> *</span>}</label>
            {input}
            {hint && <span className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</span>}
        </div>
    );
}

function optionsFor(kind, data, project) {
    if (kind === 'sel-status') return ['draft', 'plan', 'inprogress', 'release'];
    if (kind === 'sel-status-carry') return ['plan', 'inprogress', 'release', 'carry'];
    if (kind === 'sel-health') return ['', 'onplan', 'risk', 'delay'];
    if (kind === 'sel-system') return ['', 'bot', 'hub', 'both'];
    if (kind === 'sel-stateref') return stateRefOpts(data, project);
    if (kind === 'sel-project') return projList(data);
    if (kind === 'sel-timeline-stateref') return ['', ...stateRefOpts(data, project), NEW_STATE_OPTION];
    return [];
}

function optionLabelFor(kind, data, project) {
    if (kind === 'sel-project') return (key) => key ? projName(data, key) : '—';
    if (kind === 'sel-timeline-stateref') return (v) => {
        if (v === NEW_STATE_OPTION) return '+ สร้าง State ใหม่';
        if (!v) return 'ไม่ผูก';
        const s = data.find(r => r.type === 'state' && r.project === project && r.code === v);
        return s && s.title ? `[${v}] ${s.title}` : v;
    };
    return undefined;
}

function RoadmapFormModal({ dark, data, formModal, values, setValues, error, saving, onClose, onSubmit, onDelete }) {
    const spec = FORMS[formModal.type];
    const isEdit = formModal.mode === 'update';
    return (
        <ModalShell dark={dark} onClose={onClose}>
            <div className={`flex items-center gap-2 px-4.5 py-3.5 border-b font-bold text-[14px] ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                {isEdit ? <Pencil size={15} /> : <Plus size={15} />} {isEdit ? 'แก้ไข' : 'เพิ่ม'} {spec.title}
                <button onClick={onClose} className={`ml-auto w-7 h-7 rounded-lg border inline-flex items-center justify-center ${dark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}><X size={15} /></button>
            </div>
            <div className="p-4.5 flex flex-col gap-3 max-h-[62vh] overflow-y-auto">
                {error && <div className={`text-[12px] font-semibold rounded-lg border px-2.5 py-2 ${dark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200'}`}>{error}</div>}
                {spec.fields.map(([name, label, kind, required]) => (
                    <FormField
                        key={name} dark={dark} name={name} label={label} kind={kind} required={required}
                        value={values[name] ?? ''}
                        onChange={v => setValues(prev => (
                            name === 'project' && prev.project !== v && 'state_ref' in prev
                                ? { ...prev, project: v, state_ref: '' }
                                : { ...prev, [name]: v }
                        ))}
                        options={kind.startsWith('sel-') ? optionsFor(kind, data, values.project) : undefined}
                        getOptionLabel={kind.startsWith('sel-') ? optionLabelFor(kind, data, values.project) : undefined}
                    />
                ))}
                {formModal.type === 'timeline' && values.state_ref && values.state_ref !== NEW_STATE_OPTION && (
                    <div className={`text-[10.5px] rounded-lg border px-2.5 py-2 ${dark ? 'text-blue-300 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
                        ชื่อ / สถานะ / Health / วันที่ ของ State นี้จะอัปเดตตามรายการนี้อัตโนมัติ
                    </div>
                )}
                {formModal.type === 'timeline' && values.state_ref === NEW_STATE_OPTION && (
                    <div className={`rounded-lg border p-3 flex flex-col gap-3 ${dark ? 'border-slate-600 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                        <div className={`text-[10.5px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>ชื่อ / สถานะ / Health / วันที่ จะคัดลอกจากรายการนี้ให้อัตโนมัติ — กรอกเฉพาะข้อมูลที่ State มีเพิ่ม</div>
                        <FormField
                            dark={dark} name="_new_state_code" label="Code State ใหม่ เช่น S7" kind="text" required
                            value={values._new_state_code ?? ''} onChange={v => setValues(prev => ({ ...prev, _new_state_code: v }))}
                        />
                        <FormField
                            dark={dark} name="system" label="ระบบ" kind="sel-system" required={false}
                            value={values.system ?? ''} onChange={v => setValues(prev => ({ ...prev, system: v }))}
                            options={optionsFor('sel-system', data)} getOptionLabel={optionLabelFor('sel-system', data)}
                        />
                        <FormField
                            dark={dark} name="version" label="เวอร์ชัน" kind="text" required={false}
                            value={values.version ?? ''} onChange={v => setValues(prev => ({ ...prev, version: v }))}
                        />
                    </div>
                )}
            </div>
            <div className={`flex gap-2 items-center px-4.5 py-3.5 border-t ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                {isEdit && (
                    <button onClick={onDelete} className={`text-[12.5px] font-bold rounded-lg border px-3.5 py-2 inline-flex items-center gap-1.5 ${dark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}><Trash2 size={14} /> ลบ</button>
                )}
                <span className="flex-1" />
                <button onClick={onClose} className={`text-[12.5px] font-bold rounded-lg border px-4 py-2 ${dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}>ยกเลิก</button>
                <button onClick={onSubmit} disabled={saving} className="text-[12.5px] font-bold rounded-lg px-4 py-2 bg-blue-600 text-white hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
                </button>
            </div>
        </ModalShell>
    );
}

/* ================= MAIN ================= */
export default function RoadmapDashboard({ dark }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sourceStatus, setSourceStatus] = useState('loading'); // loading | live | fallback
    const [sourceMsg, setSourceMsg] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const [projects, setProjects] = useState([]); // selected project keys — empty = ทุกโปรเจค
    const [activeTab, setActiveTab] = useState('weekly');
    const [ovMode, setOvMode] = useState('month');
    const [weekOffset, setWeekOffset] = useState(0);

    const [editMode, setEditMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const [formModal, setFormModal] = useState(null); // { type, id, mode }
    const [formValues, setFormValues] = useState({});
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
    const [deleting, setDeleting] = useState(false);

    const [dragModal, setDragModal] = useState(null); // { row, targetStatus, needsFields }
    const [dragSaving, setDragSaving] = useState(false);
    const [dragError, setDragError] = useState('');

    const load = useCallback(async (isInitial) => {
        if (!isInitial) setRefreshing(true);
        try {
            const rows = await fetchRoadmapData(ROADMAP_SHEET_ID, ROADMAP_GID);
            setData(rows);
            setSourceStatus('live');
            setSourceMsg(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        } catch (e) {
            setData(prev => (prev.length ? prev : getRoadmapFallbackData()));
            setSourceStatus('fallback');
            setSourceMsg(e.message || 'เชื่อมชีตไม่ได้');
        } finally {
            setLastUpdated(new Date());
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(true);
        const interval = setInterval(() => load(false), ROADMAP_REFRESH_MS);
        return () => clearInterval(interval);
    }, [load]);

    const projectOptions = useMemo(() => projList(data), [data]);
    useEffect(() => {
        // prune selections that no longer exist (e.g. project deleted) — falls back to "ทุกโปรเจค" if none remain
        setProjects(prev => {
            const filtered = prev.filter(p => projectOptions.includes(p));
            return filtered.length === prev.length ? prev : filtered;
        });
    }, [projectOptions]);

    const hasRollout = data.some(r => r.type === 'state' && inProj(r, projects));
    useEffect(() => { if (!hasRollout && activeTab === 'rollout') setActiveTab('weekly'); }, [hasRollout, activeTab]);

    const token = () => localStorage.getItem(ROADMAP_TOKEN_KEY) || '';

    // pushes the shared fields (title/status/health/dates) from a just-saved timeline/state row onto its linked row on the other side, if any
    const syncLinkedRow = async (updatedRow) => {
        let target = null;
        if (updatedRow.type === 'timeline' && updatedRow.state_ref) {
            target = data.find(r => r.type === 'state' && r.project === updatedRow.project && r.code === updatedRow.state_ref);
        } else if (updatedRow.type === 'state') {
            target = data.find(r => r.type === 'timeline' && r.project === updatedRow.project && r.state_ref === updatedRow.code);
        }
        if (!target || !target.id) return;
        const syncRow = {};
        SYNCED_TIMELINE_STATE_FIELDS.forEach(f => { syncRow[f] = updatedRow[f]; });
        const syncRes = await roadmapApiPost(ROADMAP_SCRIPT_URL, token(), { action: 'update', id: target.id, row: syncRow });
        setData(d => mergeResponse(d, 'update', target.id, syncRes.row));
    };

    const enterEdit = async (pwd) => {
        localStorage.setItem(ROADMAP_TOKEN_KEY, pwd);
        setVerifying(true);
        setPasswordError('');
        try {
            await roadmapApiPost(ROADMAP_SCRIPT_URL, pwd, { action: 'verify' });
            setEditMode(true);
            setShowPasswordModal(false);
        } catch (e) {
            // 'bad_request' = deployment เก่ายังไม่มี action verify แต่ token ผ่านแล้ว → อนุญาตให้เข้า
            if (e.message === 'bad_request') {
                setEditMode(true);
                setShowPasswordModal(false);
            } else {
                localStorage.removeItem(ROADMAP_TOKEN_KEY);
                setPasswordError('เข้าโหมดแก้ไขไม่ได้: ' + e.message);
            }
        } finally {
            setVerifying(false);
        }
    };
    const exitEdit = () => setEditMode(false);

    const openForm = (type, existing, prefill) => {
        const spec = FORMS[type];
        if (!spec) return;
        const merged = { ...(existing || {}), ...(prefill || {}) };
        if (type !== 'project' && !merged.project) merged.project = projects.length === 1 ? projects[0] : (projectOptions[0] || '');
        if ((type === 'timeline' || type === 'channel') && !existing && !merged.status) merged.status = 'plan';
        const initial = {};
        spec.fields.forEach(([name]) => {
            initial[name] = (name === 'start' || name === 'end' || name === 'prod_date') ? dateVal(merged[name]) : (merged[name] ?? '');
        });
        setFormValues(initial);
        setFormError('');
        setFormModal({ type, id: existing ? existing.id : '', mode: existing ? 'update' : 'add' });
    };
    const closeForm = () => { setFormModal(null); setFormError(''); };

    const submitForm = async () => {
        if (!formModal) return;
        const spec = FORMS[formModal.type];
        const row = { type: formModal.type };
        spec.fields.forEach(([name]) => { row[name] = (formValues[name] ?? '').toString().trim(); });

        const creatingNewState = formModal.type === 'timeline' && row.state_ref === NEW_STATE_OPTION;
        if (creatingNewState && !(formValues._new_state_code || '').trim()) {
            setFormError('กรอก Code ของ State ใหม่ด้วย');
            return;
        }

        const missing = validateRow(formModal.type, row);
        if (missing.length) { setFormError('กรอกไม่ครบ: ' + missing.join(', ')); return; }

        setSaving(true);
        setFormError('');
        try {
            // 1) linking a brand-new state: create it first so we have its real code before saving the timeline row
            if (creatingNewState) {
                const newCode = formValues._new_state_code.trim();
                const existingStates = data.filter(r => r.type === 'state' && r.project === row.project);
                const nextOrder = String(Math.max(0, ...existingStates.map(s => parseFloat(s.order) || 0)) + 1);
                const stateRow = {
                    type: 'state', project: row.project, code: newCode,
                    system: (formValues.system || '').trim(), version: (formValues.version || '').trim(), order: nextOrder,
                };
                SYNCED_TIMELINE_STATE_FIELDS.forEach(f => { stateRow[f] = row[f]; });
                const stateRes = await roadmapApiPost(ROADMAP_SCRIPT_URL, token(), { action: 'add', row: stateRow });
                setData(d => mergeResponse(d, 'add', null, stateRes.row));
                row.state_ref = newCode;
            }

            // 2) save the row itself
            const payload = formModal.mode === 'update' ? { action: 'update', id: formModal.id, row } : { action: 'add', row };
            const res = await roadmapApiPost(ROADMAP_SCRIPT_URL, token(), payload);
            setData(d => mergeResponse(d, formModal.mode, formModal.id, res.row));

            // 3) bidirectional sync: push the shared fields to the linked row on the other side
            if (!creatingNewState) await syncLinkedRow(row);

            closeForm();
        } catch (e) {
            setFormError('บันทึกไม่สำเร็จ: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // drag-and-drop: writes status (+ date fields when supplied), then syncs to a linked State if any
    const applyDragStatusChange = async (row, patch) => {
        setDragError('');
        try {
            const res = await roadmapApiPost(ROADMAP_SCRIPT_URL, token(), { action: 'update', id: row.id, row: patch });
            setData(d => mergeResponse(d, 'update', row.id, res.row));
            await syncLinkedRow({ ...row, ...patch });
            return true;
        } catch (e) {
            setDragError('ย้ายรายการไม่สำเร็จ: ' + e.message);
            return false;
        }
    };

    const onDropCard = (row, patch, needsFields, weekRange) => {
        if (!needsFields) {
            applyDragStatusChange(row, patch);
        } else {
            setDragError('');
            setDragModal({ row, patch, needsFields, weekRange });
        }
    };

    const confirmDragDate = async (values) => {
        if (!dragModal) return;
        setDragSaving(true);
        const ok = await applyDragStatusChange(dragModal.row, { ...dragModal.patch, ...values });
        setDragSaving(false);
        if (ok) setDragModal(null);
    };

    // duplicate: opens the Timeline add form pre-filled from the source row (id and linked State cleared)
    const duplicateRow = (r) => {
        const { id, state_ref, ...rest } = r;
        openForm('timeline', null, { ...rest, state_ref: '' });
    };

    const buildDeleteTarget = (r) => {
        let note = '';
        if (r.type === 'project') {
            const childCount = data.filter(x => x.project === r.project && x.type !== 'project').length;
            if (childCount > 0) note = `หมายเหตุ: มี ${childCount} รายการ (Timeline/State/Channel) ของโปรเจคนี้ที่ยังอยู่ในระบบ — จะไม่ถูกลบไปด้วย เพียงแต่จะไม่มีชื่อโปรเจคแสดงจนกว่าจะเพิ่มโปรเจคนี้กลับมา`;
        }
        return { id: r.id, label: r.title || r.channel || r.code || r.id, note };
    };
    const requestDelete = (r) => {
        if (!r?.id) return;
        setDeleteTarget(buildDeleteTarget(r));
    };
    const requestDeleteFromForm = () => {
        if (!formModal?.id) return;
        const r = data.find(x => x.id === formModal.id);
        setDeleteTarget(r ? buildDeleteTarget(r) : { id: formModal.id, label: formModal.id, note: '' });
    };
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await roadmapApiPost(ROADMAP_SCRIPT_URL, token(), { action: 'delete', id: deleteTarget.id });
            setData(d => mergeResponse(d, 'delete', deleteTarget.id));
            setDeleteTarget(null);
            closeForm();
        } catch (e) {
            setFormError('ลบไม่สำเร็จ: ' + e.message);
        } finally {
            setDeleting(false);
        }
    };

    const editCell = (proj, ch, stateCode) => {
        const cur = data.find(r => r.type === 'channel' && r.project === proj && r.channel === ch && r.state_ref === stateCode);
        if (cur) openForm('channel', cur);
        else openForm('channel', null, { project: proj, channel: ch, state_ref: stateCode, status: 'plan' });
    };

    const briefTitle = projects.length === 0
        ? 'Roadmap Dashboard — ทุกโปรเจค'
        : projects.length === 1
            ? (projName(data, projects[0]) || 'Roadmap Dashboard')
            : `Roadmap Dashboard — ${projects.length} โปรเจค`;

    const TABS = [
        { key: 'weekly', label: 'Weekly Report', icon: Calendar, accent: 'blue' },
        { key: 'overview', label: 'Overview', icon: CalendarDays, accent: 'amber' },
        ...(hasRollout ? [{ key: 'rollout', label: 'Rollout', icon: Rocket, accent: 'emerald' }] : []),
        { key: 'config', label: 'Config', icon: Settings, accent: 'purple' },
    ];
    const tabAccentClasses = {
        blue: dark ? 'border-t-blue-500 text-slate-100' : 'border-t-blue-500 text-slate-800',
        amber: dark ? 'border-t-amber-500 text-slate-100' : 'border-t-amber-500 text-slate-800',
        emerald: dark ? 'border-t-emerald-500 text-slate-100' : 'border-t-emerald-500 text-slate-800',
        purple: dark ? 'border-t-purple-500 text-slate-100' : 'border-t-purple-500 text-slate-800',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <RefreshCw size={40} className="animate-spin mx-auto mb-4 text-blue-500" />
                    <p className={dark ? 'text-slate-400' : 'text-slate-600'}>กำลังโหลดข้อมูล Roadmap...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`sticky top-0 z-40 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 pb-3 ${dark ? 'bg-slate-900/95 backdrop-blur-sm' : 'bg-slate-50/95 backdrop-blur-sm'}`}>
                <div className="mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
                            <Route className="text-blue-500" size={28} />
                            {briefTitle}
                        </h1>
                        <p className={`mt-1 text-sm md:text-base ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Roadmap · Live from Google Sheet</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <ProjectMultiSelect dark={dark} data={data} selected={projects} onChange={setProjects} />
                        <button
                            onClick={editMode ? exitEdit : () => { setPasswordError(''); setShowPasswordModal(true); }}
                            className={`text-[12.5px] font-bold px-3 py-2 rounded-lg border shadow-sm inline-flex items-center gap-1.5 transition-colors ${
                                editMode
                                    ? (dark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700')
                                    : (dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100')
                            }`}
                        >
                            {editMode ? <Unlock size={14} /> : <Pencil size={14} />} {editMode ? 'ออกจากโหมดแก้ไข' : 'แก้ไข'}
                        </button>
                        <button
                            onClick={() => load(false)} disabled={refreshing}
                            className={`p-2 rounded-lg border shadow-sm transition-colors ${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'} ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Refresh"
                        >
                            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        <div className={`hidden md:flex text-sm px-3.5 py-2 rounded-lg items-center gap-2 border shadow-sm ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200'}`}>
                            <span className={`w-2 h-2 rounded-full ${sourceStatus === 'live' ? 'bg-emerald-500' : sourceStatus === 'fallback' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                            {sourceStatus === 'live' ? `Live · ${sourceMsg}` : sourceStatus === 'fallback' ? sourceMsg : 'กำลังโหลด…'}
                        </div>
                    </div>
                </div>

                {!ROADMAP_SCRIPT_URL && editMode && (
                    <div className={`mb-2 text-[11.5px] font-semibold rounded-lg border px-3 py-2 inline-flex items-center gap-1.5 ${dark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                        <AlertTriangle size={13} /> ยังไม่ได้ตั้ง SCRIPT_URL — เพิ่ม/แก้/ลบจะยังบันทึกไม่ได้
                    </div>
                )}

                {dragError && !dragModal && (
                    <div className={`mb-2 text-[11.5px] font-semibold rounded-lg border px-3 py-2 flex items-center gap-1.5 ${dark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200'}`}>
                        <AlertTriangle size={13} /> {dragError}
                        <button onClick={() => setDragError('')} className="ml-auto shrink-0"><X size={13} /></button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {TABS.map(tb => {
                        const Icon = tb.icon;
                        const active = activeTab === tb.key;
                        return (
                            <button
                                key={tb.key} onClick={() => setActiveTab(tb.key)}
                                className={`text-[12.5px] font-bold px-4 py-2 rounded-t-lg border border-b-0 border-t-[3px] inline-flex items-center gap-1.5 transition-colors ${
                                    active
                                        ? `${tabAccentClasses[tb.accent]} ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
                                        : `border-t-transparent ${dark ? 'text-slate-500 bg-slate-900 border-slate-800 hover:text-slate-300' : 'text-slate-400 bg-slate-100 border-slate-200 hover:text-slate-600'}`
                                }`}
                            >
                                <Icon size={15} /> {tb.label}
                            </button>
                        );
                    })}
                </div>

                {editMode && (
                    <div className={`flex items-center gap-2 flex-wrap mt-2.5 rounded-lg border px-3 py-2.5 ${dark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                        <span className={`text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap ${dark ? 'text-amber-400' : 'text-amber-700'}`}><Pencil size={12} /> โหมดแก้ไข</span>
                        <button onClick={() => openForm('timeline')} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> เพิ่มรายการ</button>
                        <button onClick={() => openForm('state')} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> เพิ่ม State</button>
                        <button onClick={() => openForm('channel')} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> เพิ่ม Channel</button>
                        <button onClick={() => openForm('project')} className="text-[11.5px] font-bold text-white bg-blue-600 hover:brightness-110 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5"><Plus size={13} /> เพิ่มโปรเจค</button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className={`rounded-b-xl rounded-tr-xl border p-3.5 md:p-4 ${dark ? 'bg-slate-800/40 border-slate-700' : 'bg-white/60 border-slate-200'}`}>
                {activeTab === 'weekly' && (
                    <WeeklyView
                        dark={dark} data={data} projects={projects} editMode={editMode}
                        weekOffset={weekOffset} setWeekOffset={setWeekOffset}
                        onEdit={(type, r) => openForm(type, r)} onDelete={requestDelete}
                        onDuplicate={duplicateRow} onDropCard={onDropCard}
                    />
                )}
                {activeTab === 'overview' && (
                    <OverviewView
                        dark={dark} data={data} projects={projects} editMode={editMode}
                        ovMode={ovMode} setOvMode={setOvMode}
                        onEdit={(type, r) => openForm(type, r)} onDelete={requestDelete}
                        onDuplicate={duplicateRow}
                    />
                )}
                {activeTab === 'rollout' && hasRollout && (
                    <RolloutView
                        dark={dark} data={data} projects={projects} editMode={editMode}
                        onEditRow={(type, r) => openForm(type, r)} onDeleteRow={requestDelete}
                        onAddState={(p) => openForm('state', null, { project: p })}
                        onAddChannel={(p) => openForm('channel', null, { project: p })}
                        onEditCell={editCell}
                    />
                )}
                {activeTab === 'config' && (
                    <ConfigView dark={dark} data={data} editMode={editMode} onEdit={(r) => openForm('project', r)} onDelete={requestDelete} />
                )}
            </div>

            {showPasswordModal && (
                <PasswordModal dark={dark} onClose={() => setShowPasswordModal(false)} onSubmit={enterEdit} verifying={verifying} error={passwordError} />
            )}
            {formModal && (
                <RoadmapFormModal
                    dark={dark} data={data} formModal={formModal} values={formValues} setValues={setFormValues}
                    error={formError} saving={saving} onClose={closeForm} onSubmit={submitForm} onDelete={requestDeleteFromForm}
                />
            )}
            {deleteTarget && (
                <DeleteConfirmModal dark={dark} label={deleteTarget.label} note={deleteTarget.note} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
            )}
            {dragModal && (
                <DragDateModal
                    dark={dark} row={dragModal.row} patch={dragModal.patch} needsFields={dragModal.needsFields} weekRange={dragModal.weekRange}
                    saving={dragSaving} error={dragError} onClose={() => setDragModal(null)} onConfirm={confirmDragDate}
                />
            )}
        </div>
    );
}
