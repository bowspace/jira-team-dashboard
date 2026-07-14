import { parseCSV } from './parseCSV';

export const ROADMAP_SHEET_ID = import.meta.env.VITE_ROADMAP_DB_LINK || '1QLy9ruxc2qUP47kkxWnw6ip1NQ5wz1Ay2a_VSPWkIhc';
export const ROADMAP_GID = import.meta.env.VITE_ROADMAP_GID || '0';
export const ROADMAP_SCRIPT_URL = import.meta.env.VITE_ROADMAP_SCRIPT_URL
    || 'https://script.google.com/macros/s/AKfycbxiRmuqWnj5kNw3F8cIWflmWTNsGNa8goo6Utbc4EB6wkHS2BvknSLMcCnpBZOah8sM/exec';
export const ROADMAP_REFRESH_MS = 60000;
export const ROADMAP_TOKEN_KEY = 'roadmap_edit_token';

export const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const TH_MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export const byOrder = (a, b) => (parseFloat(a.order || 0) - parseFloat(b.order || 0));

export function toDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    let m = /^Date\((\d+),(\d+),(\d+)/.exec(v);
    if (m) return new Date(+m[1], +m[2], +m[3]);
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return null;
}

export function fmtD(d) {
    return d ? d.getDate() + ' ' + TH_M[d.getMonth()] : '';
}

// date_label ถ้ามี (กัน Sheets แปลงเป็น date ให้ format กลับ) ไม่งั้นสร้างจาก start–end
export function labelOf(r) {
    if (r.date_label) {
        const d = toDate(r.date_label);
        return d && /^Date\(/.test(r.date_label) ? fmtD(d) : r.date_label;
    }
    const s = toDate(r.start), e = toDate(r.end);
    if (s && e) return fmtD(s) + ' – ' + fmtD(e);
    if (s) return fmtD(s);
    return '';
}

// เรียงตามวันที่จริง (start มาก่อน prod_date) — order ใช้เป็น tie-breaker เมื่อวันที่เท่ากันหรือไม่มีวันที่ทั้งคู่
export function byDate(a, b) {
    const da = toDate(a.start) || toDate(a.prod_date);
    const db = toDate(b.start) || toDate(b.prod_date);
    if (da && db && da.getTime() !== db.getTime()) return da - db;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return byOrder(a, b);
}

export function startOfWeek(d) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function isoWeek(d) {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
    const w1 = new Date(t.getFullYear(), 0, 4);
    return 1 + Math.round(((t - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

export function projList(data) {
    // ทุกโปรเจคที่ประกาศไว้ (type=project) มาก่อนตามลำดับ order — รวมโปรเจคที่ยังไม่มี timeline/state/channel
    // เพื่อให้เพิ่มรายการแรกให้โปรเจคใหม่ได้ (ไม่งั้น dropdown ในฟอร์มจะไม่มีโปรเจคที่เพิ่งสร้าง)
    // จากนั้นต่อด้วย orphan keys (แถวข้อมูลที่ไม่มี meta) — วิวที่ต้องกรองเฉพาะที่มีข้อมูลจะ .filter() เองอยู่แล้ว
    const metas = data.filter(r => r.type === 'project').sort(byOrder);
    const keys = [...new Set(data.filter(r => r.project && r.type && r.type !== 'project').map(r => r.project))];
    const ordered = [...metas.map(m => m.project), ...keys.filter(k => !metas.some(m => m.project === k))];
    return [...new Set(ordered)];
}

export function projName(data, p) {
    if (p === '__all__') return 'ทุกโปรเจค';
    const m = data.find(r => r.type === 'project' && r.project === p);
    return m ? m.title : p;
}

// selectedProjects: array of project keys — empty array = ทุกโปรเจค (all)
export function inProj(r, selectedProjects) {
    return selectedProjects.length === 0 || selectedProjects.includes(r.project);
}

/* ---- per-project color coding (แยกสีตามโปรเจคเมื่อดู "ทุกโปรเจค") ---- */
export const PROJECT_PALETTE = [
    { light: 'text-indigo-700 bg-indigo-50 border-indigo-200', dark: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30', dot: 'bg-indigo-500', chip: 'bg-indigo-500' },
    { light: 'text-purple-700 bg-purple-50 border-purple-200', dark: 'text-purple-300 bg-purple-500/15 border-purple-500/30', dot: 'bg-purple-500', chip: 'bg-purple-500' },
    { light: 'text-pink-700 bg-pink-50 border-pink-200', dark: 'text-pink-300 bg-pink-500/15 border-pink-500/30', dot: 'bg-pink-500', chip: 'bg-pink-500' },
    { light: 'text-cyan-700 bg-cyan-50 border-cyan-200', dark: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30', dot: 'bg-cyan-500', chip: 'bg-cyan-500' },
    { light: 'text-orange-700 bg-orange-50 border-orange-200', dark: 'text-orange-300 bg-orange-500/15 border-orange-500/30', dot: 'bg-orange-500', chip: 'bg-orange-500' },
    { light: 'text-teal-700 bg-teal-50 border-teal-200', dark: 'text-teal-300 bg-teal-500/15 border-teal-500/30', dot: 'bg-teal-500', chip: 'bg-teal-500' },
    { light: 'text-rose-700 bg-rose-50 border-rose-200', dark: 'text-rose-300 bg-rose-500/15 border-rose-500/30', dot: 'bg-rose-500', chip: 'bg-rose-500' },
    { light: 'text-lime-700 bg-lime-50 border-lime-200', dark: 'text-lime-300 bg-lime-500/15 border-lime-500/30', dot: 'bg-lime-500', chip: 'bg-lime-500' },
];

export function projectColorIndex(data, project) {
    const list = projList(data);
    const idx = list.indexOf(project);
    return idx >= 0 ? idx % PROJECT_PALETTE.length : 0;
}

export function dateVal(v) {
    const d = toDate(v);
    if (!d) return '';
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

export function stateRefOpts(data, project) {
    return data.filter(r => r.type === 'state' && r.project === project).sort(byOrder).map(s => s.code).filter(Boolean);
}

/* ---- schema ฟอร์มราย type ---- */
export const REQUIRED = {
    timeline: ['project', 'title', 'status'],
    state: ['project', 'code', 'title', 'status'],
    channel: ['project', 'channel', 'state_ref', 'status'],
    project: ['project', 'title'],
};

export const FORMS = {
    timeline: {
        title: 'รายการ (Timeline)', fields: [
            ['project', 'โปรเจค', 'sel-project', true], ['code', 'Code เช่น Deploy #1', 'text', false],
            ['title', 'ชื่อ', 'text', true], ['status', 'สถานะ', 'sel-status', true],
            ['health', 'Health', 'sel-health', false], ['health_note', 'เหตุผล health', 'text', false],
            ['start', 'เริ่ม', 'date', false], ['end', 'สิ้นสุด', 'date', false], ['prod_date', 'วันขึ้น Prod', 'date', false],
            ['date_label', 'ป้ายวันที่ (override)', 'text', false], ['items', 'ฟีเจอร์', 'textarea', false],
            ['note', 'หมายเหตุ', 'text', false], ['order', 'ลำดับ', 'number', false],
            ['state_ref', 'ผูกกับ Rollout State', 'sel-timeline-stateref', false]],
    },
    state: {
        title: 'State (Rollout)', fields: [
            ['project', 'โปรเจค', 'sel-project', true], ['code', 'S-code เช่น S1', 'text', true],
            ['title', 'ชื่อ', 'text', true], ['system', 'ระบบ', 'sel-system', false], ['version', 'เวอร์ชัน', 'text', false],
            ['status', 'สถานะ', 'sel-status', true], ['health', 'Health', 'sel-health', false],
            ['health_note', 'เหตุผล health', 'text', false], ['start', 'เริ่ม', 'date', false], ['end', 'สิ้นสุด', 'date', false],
            ['date_label', 'ป้ายวันที่ (override)', 'text', false], ['order', 'ลำดับ', 'number', false]],
    },
    channel: {
        title: 'Channel (เซลล์ Rollout)', fields: [
            ['project', 'โปรเจค', 'sel-project', true], ['channel', 'ชื่อ Channel (แถว)', 'text', true],
            ['state_ref', 'อ้าง State', 'sel-stateref', true], ['status', 'สถานะ', 'sel-status-carry', true],
            ['date_label', 'ป้ายวันที่', 'text', false], ['order', 'ลำดับ', 'number', false]],
    },
    project: {
        title: 'โปรเจค', fields: [
            ['project', 'key (อังกฤษ)', 'text', true], ['title', 'ชื่อแสดงผล', 'text', true],
            ['note', 'คำอธิบาย', 'text', false], ['order', 'ลำดับ', 'number', false]],
    },
};

/* ---- Timeline <-> State sync (bidirectional via state_ref) ---- */
export const SYNCED_TIMELINE_STATE_FIELDS = ['title', 'status', 'health', 'health_note', 'start', 'end', 'date_label'];
export const NEW_STATE_OPTION = '__new__';

/* ---- validate / merge (pure) ---- */
export function validateRow(type, row) {
    return (REQUIRED[type] || []).filter(k => !(row[k] && String(row[k]).trim()));
}

export function mergeResponse(data, mode, id, row) {
    if (mode === 'add') {
        return row ? [...data, row] : data;
    }
    if (mode === 'update') {
        const i = data.findIndex(r => r.id === id);
        if (i >= 0) {
            const next = data.slice();
            next[i] = row || next[i];
            return next;
        }
        return row ? [...data, row] : data;
    }
    if (mode === 'delete') {
        return data.filter(r => r.id !== id);
    }
    return data;
}

/* ---- gviz JSONP loader (เลี่ยง CORS — fetch+out:csv โดน block สำหรับชีตนี้) ---- */
function rowsFromGviz(table) {
    const labels = table.cols.map(c => (c.label || '').trim());
    return table.rows.map(r => {
        const o = {};
        labels.forEach((lab, i) => {
            if (!lab) return;
            const cell = r.c ? r.c[i] : null;
            let v = (cell && cell.v != null) ? cell.v : '';
            if (typeof v === 'boolean') v = v ? 'TRUE' : '';
            o[lab] = v instanceof Date ? v : ('' + v).trim();
        });
        return o;
    }).filter(o => o.project && o.type);
}

let jsonpCounter = 0;
export function fetchRoadmapData(sheetId = ROADMAP_SHEET_ID, gid = ROADMAP_GID, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const cbName = `__roadmap_gviz_${Date.now()}_${jsonpCounter++}`;
        const script = document.createElement('script');
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('เชื่อมชีตไม่ได้ (timeout)'));
        }, timeoutMs);
        function cleanup() {
            try { delete window[cbName]; } catch { window[cbName] = undefined; }
            if (script.parentNode) script.parentNode.removeChild(script);
            clearTimeout(timer);
        }
        window[cbName] = (resp) => {
            if (settled) return;
            settled = true;
            try {
                if (!resp || !resp.table || resp.status !== 'ok') throw new Error('อ่านชีตไม่สำเร็จ');
                const rows = rowsFromGviz(resp.table);
                if (!rows.length) throw new Error('ชีตยังเป็นรูปแบบเก่าหรือไม่มีข้อมูล');
                resolve(rows);
            } catch (e) {
                reject(e);
            } finally {
                cleanup();
            }
        };
        script.onerror = () => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('โหลดชีตไม่สำเร็จ'));
        };
        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${cbName}&gid=${gid}&headers=1&cb=${Date.now()}`;
        document.body.appendChild(script);
    });
}

/* ---- POST ไป Apps Script Web App (text/plain เลี่ยง CORS preflight) ---- */
export async function roadmapApiPost(scriptUrl, token, payload) {
    if (!scriptUrl) throw new Error('ยังไม่ได้ตั้ง SCRIPT_URL — deploy Apps Script ก่อน');
    let res;
    try {
        res = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ token: token || '', ...payload }),
        });
    } catch (e) {
        throw new Error('เชื่อมต่อ Apps Script ไม่ได้: ' + e.message);
    }
    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error('อ่านคำตอบจาก script ไม่ได้');
    }
    if (!data.ok) throw new Error(data.error || 'ไม่สำเร็จ');
    return data;
}

/* ---- fallback dataset (แสดงเมื่อยังเชื่อมชีตไม่ได้) — คัดลอกจาก it_roadmap/assets/app.js ---- */
const FALLBACK_CSV = `"id","project","type","code","title","system","version","status","health","health_note","channel","state_ref","start","end","prod_date","date_label","items","note","order"
"aic-p01","ai-chatbot","project","","AI Chatbot","","","","","","","","","","","","","CS Automation — Bot & Hub","1"
"crm-p01","crm","project","","CRM V2","","","","","","","","","","","","","Single Source of Truth","2"
"aic-t01","ai-chatbot","timeline","PREP","Discovery & Design","","","release","","","","","2026-05-01","2026-05-31","","พ.ค. 2026","Requirement ติดตามพัสดุ (ทั่วไป / SLA / ไม่เคลื่อนไหว / เซ็นรับ) | Requirement การเข้ารับ + ประสานแอดมิน","⚠️ Issue: API Mysave ไม่มีข้อมูลพนักงานเข้ารับ จนกว่าพัสดุจะถูกจัดส่ง","1"
"aic-t02","ai-chatbot","timeline","Bot #1","Tracking Bot","","","release","","","","","2026-06-01","2026-06-11","2026-06-12","","Confirm Template Reply | Setup Production DB | Bot Mysave (Prod)","","2"
"aic-t03","ai-chatbot","timeline","Imprv","Improvement","","","release","","","","","2026-06-13","2026-06-15","2026-06-16","","พัสดุต่างประเทศ | พัสดุตีกลับ / ยกเลิก | พัสดุ Dropoff · ส่งต่อ Admin","→ ถัดไป: Bot Easypost","3"
"aic-t04","ai-chatbot","timeline","Deploy #1","Chat Hub (Full) — รวมแชท + Rich Chat","","","inprogress","onplan","","","","2026-07-01","2026-07-07","2026-07-08","","Login / Auth | Connect Line Channel | Invite Agent | Chatlog: Text + File + Image | Reply Message | Chat Search / Rename | Customer Tag (VIP / 5★ / Premium …)","","4"
"aic-t05","ai-chatbot","timeline","Deploy #2","Hub #2 — Integration","","","plan","onplan","","","","2026-07-15","2026-07-21","2026-07-22","","Ticket Escalation | Integrate CS Bot (เชื่อม Bot เข้า Hub)","","5"
"aic-t06","ai-chatbot","timeline","Deploy #3","Improvement Bot — New Flow","","","plan","onplan","","","","2026-07-29","2026-08-04","2026-08-05","","พัสดุต่างประเทศ | พัสดุตีกลับ / การยกเลิกพัสดุ | พัสดุ Dropoff","","6"
"aic-t07","ai-chatbot","timeline","Deploy #4","Hub #3 — Auto Routing & Insight","","","plan","onplan","","","","2026-08-12","2026-08-18","2026-08-19","","Auto Assign | Dashboard (ภาพรวมเคส / คิว) | Performance Tracking (SLA / เวลาตอบ)","รอบงานหนักสุดของ ส.ค.","7"
"aic-t08","ai-chatbot","timeline","Deploy #5","Quality & Advanced Insight","","","plan","onplan","","","","2026-08-26","2026-09-01","2026-09-02","","Feedback / Survey | Dashboard เชิงลึก / รายงานส่งออก (Export)","","8"
"aic-t09","ai-chatbot","timeline","Deploy #6","FAQ & Scale","","","plan","onplan","","","","2026-09-09","2026-09-15","2026-09-16","","FAQ + Q/A แยกตาม Platform | เปิดหลาย OA Channel","","9"
"aic-t10","ai-chatbot","timeline","Q4","Stabilize & Optimize","","","plan","","","","","2026-10-01","2026-12-31","","ต.ค.–ธ.ค.","ปรับเสถียร / แก้บั๊ก | วัดผล KPI เทียบเป้า | เก็บงานค้าง: Easypost · unlimited tag","รายละเอียดยังไม่ระบุ (TBD)","10"
"aic-s01","ai-chatbot","state","S1","Tracking","bot","V0.1.0","release","onplan","","","","2026-06-12","","","12 มิ.ย.","","","1"
"aic-s02","ai-chatbot","state","S2","Pilot Test","hub","V0.1.0","inprogress","onplan","","","","2026-07-01","2026-07-10","","1 – 10 ก.ค.","","","2"
"aic-s03","ai-chatbot","state","S3","Full Rollout","hub","V0.1.0","plan","onplan","","","","2026-07-10","","","10 ก.ค.","","","3"
"aic-s04","ai-chatbot","state","S4","Integrate Bot","both","V0.2.0","plan","onplan","","","","2026-07-22","2026-08-31","","22 ก.ค. – ส.ค.","","","4"
"aic-s05","ai-chatbot","state","S5","Facebook","hub","V0.3.0","plan","risk","รอ FB App Review","","","","","","~ก.ย.","","","5"
"aic-s06","ai-chatbot","state","S6","FAQ","bot","V0.2.0","plan","onplan","","","","","","","~ก.ย.","","","6"
"aic-c01","ai-chatbot","channel","","","","","release","","","💚 LINE OA Mysave","S1","","","","12 มิ.ย.","","","1"
"aic-c02","ai-chatbot","channel","","","","","inprogress","","","💚 LINE OA Mysave","S2","","","","Pilot ถึง 10 ก.ค.","","","1"
"aic-c03","ai-chatbot","channel","","","","","carry","","","💚 LINE OA Mysave","S3","","","","ใช้งานต่อเนื่อง","","","1"
"aic-c04","ai-chatbot","channel","","","","","plan","","","💚 LINE OA Mysave","S4","","","","ส.ค.","","","1"
"aic-c05","ai-chatbot","channel","","","","","plan","","","💚 LINE OA Mysave","S6","","","","~ก.ย.","","","1"
"aic-c06","ai-chatbot","channel","","","","","inprogress","","","💚 LINE OA EasyPost","S2","","","","Pilot ถึง 10 ก.ค.","","","2"
"aic-c07","ai-chatbot","channel","","","","","carry","","","💚 LINE OA EasyPost","S3","","","","ใช้งานต่อเนื่อง","","","2"
"aic-c08","ai-chatbot","channel","","","","","plan","","","💚 LINE OA EasyPost","S4","","","","ต้น ส.ค.","","","2"
"aic-c09","ai-chatbot","channel","","","","","plan","","","💚 LINE OA EasyPost","S6","","","","~ก.ย.","","","2"
"aic-c10","ai-chatbot","channel","","","","","plan","","","💚 LINE OA Shippop","S3","","","","10 ก.ค.","","","3"
"aic-c11","ai-chatbot","channel","","","","","plan","","","💚 LINE OA Shippop","S4","","","","กลาง ส.ค.","","","3"
"aic-c12","ai-chatbot","channel","","","","","plan","","","💚 LINE OA Shippop","S6","","","","~ก.ย.","","","3"
"aic-c13","ai-chatbot","channel","","","","","plan","","","💚 LINE OA อื่น ๆ","S3","","","","10 ก.ค.","","","4"
"aic-c14","ai-chatbot","channel","","","","","plan","","","💚 LINE OA อื่น ๆ","S4","","","","ปลาย ส.ค.","","","4"
"aic-c15","ai-chatbot","channel","","","","","plan","","","💚 LINE OA อื่น ๆ","S6","","","","~ก.ย.","","","4"
"aic-c16","ai-chatbot","channel","","","","","plan","","","💙 Facebook Pages","S5","","","","~ก.ย.","","","5"
"aic-c17","ai-chatbot","channel","","","","","plan","","","💙 Facebook Pages","S6","","","","~Q4","","","5"
"crm-t01","crm","timeline","Phase #1","Foundation & Core CRM","","","release","","","","","2026-06-18","2026-06-30","2026-07-01","","Lead create + import | Customer 360 | Activities | Call log + Note","","1"
"crm-t02","crm","timeline","Go-live #1","Productivity & Integration","","","inprogress","onplan","","","","2026-07-01","2026-07-15","","","Call log + Voice-to-Text | Webhook to TQM | Telephony | Lead Dashboard","","2"
"crm-t03","crm","timeline","Go-live #2","Dashboard & AI Insight","","","plan","onplan","","","","2026-08-01","2026-08-31","","~ส.ค.","AI Insight | Dashboard เชิงลึก | เชื่อม LINE OA / Social","","3"
"crm-t04","crm","timeline","Go-live #3","Service & Performance","","","plan","onplan","","","","2026-09-01","2026-09-30","","~ก.ย.","Ticket Escalate | Clock-in | KPI Config","","4"
"crm-s01","crm","state","S1","Pilot Wave 1","crm","V1.0","release","onplan","","","","2026-07-01","","","1 ก.ค.","","","1"
"crm-s02","crm","state","S2","Training #1","crm","V1.0","release","onplan","","","","2026-07-03","","","3 ก.ค.","","","2"
"crm-s03","crm","state","S3","Wave 2","crm","V1.0","inprogress","onplan","","","","2026-07-07","2026-07-10","","7 – 10 ก.ค.","","","3"
"crm-s04","crm","state","S4","ทุกแผนก","crm","V1.0","plan","onplan","","","","","","","~ปลาย ก.ค.","","","4"
"crm-c01","crm","channel","","","","","release","","","👥 BD","S1","","","","1 ก.ค.","","","1"
"crm-c02","crm","channel","","","","","release","","","👥 BD","S2","","","","3 ก.ค.","","","1"
"crm-c03","crm","channel","","","","","carry","","","👥 BD","S4","","","","ใช้งานต่อเนื่อง","","","1"
"crm-c04","crm","channel","","","","","release","","","👥 KA","S1","","","","1 ก.ค.","","","2"
"crm-c05","crm","channel","","","","","release","","","👥 KA","S2","","","","3 ก.ค.","","","2"
"crm-c06","crm","channel","","","","","carry","","","👥 KA","S4","","","","ใช้งานต่อเนื่อง","","","2"
"crm-c07","crm","channel","","","","","release","","","👥 Telesale","S2","","","","3 ก.ค.","","","3"
"crm-c08","crm","channel","","","","","inprogress","","","👥 Telesale","S3","","","","7 – 10 ก.ค.","","","3"
"crm-c09","crm","channel","","","","","carry","","","👥 Telesale","S4","","","","ใช้งานต่อเนื่อง","","","3"
"crm-c10","crm","channel","","","","","plan","","","👥 แผนกอื่น ๆ","S4","","","","~ปลาย ก.ค.","","","4"`;

function toObjects(rows) {
    if (!rows.length) return [];
    const h = rows[0].map(x => x.trim());
    return rows.slice(1).filter(r => r.some(c => c !== '')).map(r => {
        const o = {};
        h.forEach((k, i) => { o[k] = (r[i] || '').trim(); });
        return o;
    });
}

export function getRoadmapFallbackData() {
    return toObjects(parseCSV(FALLBACK_CSV));
}
