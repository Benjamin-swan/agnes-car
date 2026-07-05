// views/history.js — 통합 이력 조회 (타임라인 + 필터 + 상세)
import { store } from "../store.js";
import { CAT, fmtNum, fmtWon, fmtL, fmtEff, fmtDate, escapeHtml, recordTitle } from "../utils.js";
import { openSheet, closeSheet, toast } from "../ui.js";

let activeFilter = "all";

export function renderHistory(root, ctx) {
  if (ctx.params && ctx.params.filter) activeFilter = ctx.params.filter;
  const s = store.get();
  const filters = [
    ["all", "전체"], ["maintenance", "정비"], ["fuel", "주유"], ["wash", "세차"], ["purchase", "부품구매"],
  ];

  const list = [...s.records]
    .filter(r => activeFilter === "all" || r.type === activeFilter)
    .sort((a, b) => (b.date.localeCompare(a.date)) || (b.createdAt || "").localeCompare(a.createdAt || ""));

  // 월별 그룹
  const groups = {};
  list.forEach(r => { const ym = (r.date || "").slice(0, 7); (groups[ym] = groups[ym] || []).push(r); });
  const ymKeys = Object.keys(groups).sort().reverse();

  root.innerHTML = `
    <div class="chips" style="margin-bottom:8px; overflow-x:auto; flex-wrap:nowrap; padding-bottom:4px">
      ${filters.map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${k === activeFilter}">${l}</button>`).join("")}
    </div>
    ${list.length === 0
      ? `<div class="empty"><div class="ic">🗂️</div><div class="t">해당 기록이 없어요</div><div class="d">+ 버튼으로 기록을 추가해보세요</div></div>`
      : ymKeys.map(ym => `
        <div class="section-label">${fmtDate(ym + "-01", { ym: true })} · ${sumWon(groups[ym])}</div>
        <div class="card"><div class="timeline">${groups[ym].map(row).join("")}</div></div>
      `).join("")}
  `;

  root.querySelectorAll(".chip[data-f]").forEach(b => b.onclick = () => { activeFilter = b.dataset.f; renderHistory(root, ctx); });
  root.querySelectorAll(".tl-item[data-id]").forEach(el => el.onclick = () => openDetail(el.dataset.id, ctx));

  if (ctx.params && ctx.params.focus) {
    const el = root.querySelector(`.tl-item[data-id="${ctx.params.focus}"]`);
    if (el) { el.scrollIntoView({ block: "center" }); openDetail(ctx.params.focus, ctx); ctx.params.focus = null; }
  }
}

function row(r) {
  const cat = CAT[r.type] || CAT.maintenance;
  const cost = Number(r.cost) > 0 ? `<span class="tl-cost tnum">${fmtWon(r.cost)}</span>` : "";
  const meta = [`${fmtDate(r.date, { short: true })}`];
  if (r.mileage) meta.push(`${fmtNum(r.mileage)}km`);
  if (r.type === "fuel" && r.liters) meta.push(`${r.liters}ℓ`);
  if (r.type === "purchase" && r.installStatus) meta.push(r.installStatus);
  return `
    <div class="tl-item" data-id="${r.id}">
      <div class="tl-icon ${cat.cls}">${cat.icon}</div>
      <div class="tl-body">
        <div class="tl-title"><span>${escapeHtml(recordTitle(r))}</span>${cost}</div>
        <div class="tl-meta">${meta.map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div>
        ${r.memo ? `<div class="tl-memo">${escapeHtml(r.memo)}</div>` : ""}
      </div>
    </div>`;
}

function openDetail(id, ctx) {
  const r = store.getRecord(id);
  if (!r) return;
  const cat = CAT[r.type];
  const rows = [];
  rows.push(["날짜", fmtDate(r.date)]);
  if (r.mileage) rows.push(["주행거리", fmtNum(r.mileage) + " km"]);
  if (r.type === "maintenance") {
    if (r.items && r.items.length) rows.push(["정비 항목", r.items.map(escapeHtml).join("<br>")]);
    if (r.resets && r.resets.length) rows.push(["교체 소모품", r.resets.map(k => escapeHtml(scheduleName(k))).join(", ")]);
    if (r.shop) rows.push(["정비소", escapeHtml(r.shop)]);
  }
  if (r.type === "fuel") {
    if (r.liters) rows.push(["주유량", fmtL(r.liters)]);
    if (r.pricePerLiter) rows.push(["리터당", fmtWon(r.pricePerLiter)]);
    if (r.station) rows.push(["주유소", escapeHtml(r.station)]);
  }
  if (r.type === "wash") {
    if (r.washType) rows.push(["종류", escapeHtml(r.washType)]);
    if (r.product) rows.push(["내용", escapeHtml(r.product)]);
  }
  if (r.type === "purchase") {
    if (r.vendor) rows.push(["구매처", escapeHtml(r.vendor)]);
    if (r.installStatus) rows.push(["장착 여부", escapeHtml(r.installStatus)]);
  }
  if (Number(r.cost) > 0) rows.push(["비용", fmtWon(r.cost)]);
  if (r.memo) rows.push(["메모", escapeHtml(r.memo)]);

  const convertBtn = (r.type === "purchase" && r.installStatus === "미장착")
    ? `<button class="btn btn-ghost" id="convertBtn">🔧 장착 완료 → 정비 기록으로 전환</button>` : "";

  openSheet(`
    <h2><span class="tl-icon ${cat.cls}" style="display:inline-grid;width:28px;height:28px;font-size:14px;border-radius:8px;vertical-align:-7px;margin-right:6px">${cat.icon}</span>${escapeHtml(recordTitle(r))}</h2>
    <div style="margin-bottom:18px">
      ${rows.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join("")}
    </div>
    ${convertBtn}
    <div style="display:flex; gap:12px; margin-top:12px">
      <button class="btn btn-danger" id="delBtn">삭제</button>
      <button class="btn btn-primary" id="editBtn">수정</button>
    </div>
  `, (sheet) => {
    sheet.querySelector("#editBtn").onclick = () => { closeSheet(); ctx.navigate("add", { editId: r.id }); };
    sheet.querySelector("#delBtn").onclick = async () => {
      const ok = await ctx.confirm({ title: "기록 삭제", message: "이 기록을 삭제할까요?", confirmText: "삭제", danger: true });
      if (ok) { store.deleteRecord(r.id); closeSheet(); toast("삭제했어요", "ok"); ctx.rerender(); }
    };
    const cb = sheet.querySelector("#convertBtn");
    if (cb) cb.onclick = () => {
      closeSheet();
      // 부품 구매 → 정비 등록 프리필
      ctx.navigate("add", { preset: { type: "maintenance", itemName: r.itemName }, fromPurchase: r.id });
      // 원 구매기록은 '자가장착'으로 표시
      store.updateRecord(r.id, { installStatus: "자가장착" });
      toast("정비 기록으로 전환 중… 항목을 확인하세요", "ok");
    };
  });
}

function scheduleName(key) {
  const s = store.schedule.find(x => x.key === key);
  return s ? s.name : key;
}
function sumWon(list) {
  const t = list.reduce((a, r) => a + (Number(r.cost) || 0), 0);
  return t > 0 ? fmtWon(t) : "-";
}
