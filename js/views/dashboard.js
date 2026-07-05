// views/dashboard.js — 홈(대시보드)
import { store, todayStr } from "../store.js";
import {
  fmtKm, fmtNum, fmtWon, fmtDate, relDays, escapeHtml,
  predictedMileage, computeMaintStatus, monthlySpend, totalSpend,
  CAT, recordTitle,
} from "../utils.js";
import { stackedBarChart, lineChart } from "../charts.js";
import { fuelTrend } from "../utils.js";
import { openSheet, closeSheet, toast } from "../ui.js";

export function renderDashboard(root, ctx) {
  const s = store.get();
  const v = s.vehicle;
  const pred = predictedMileage(s);
  const maint = computeMaintStatus(s);
  const attention = maint.filter(m => m.status === "danger" || m.status === "warn");
  const top = (attention.length ? attention : maint).slice(0, 4);
  const recent = [...s.records].sort((a, b) => (b.date.localeCompare(a.date)) || (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 4);
  const month = monthlySpend(s, 6);
  const thisYm = todayStr().slice(0, 7);
  const thisMonth = month.find(m => m.ym === thisYm) || { total: 0, maintenance: 0, fuel: 0, wash: 0, purchase: 0 };

  root.innerHTML = `
    <div class="hero">
      <div class="car-name">🚗 ${escapeHtml(v.name)}</div>
      <div class="car-model">${escapeHtml(v.model)} · ${v.year}년식</div>
      <div class="mileage">
        <div class="label">현재 주행거리 (예측)</div>
        <div><span class="num tnum">${fmtNum(pred.value)}</span><span class="unit">km</span></div>
        <div class="est">📍 실측 ${fmtKm(v.currentMileage)} (${fmtDate(v.currentMileageDate, { short: true })}) · +${fmtNum(pred.extraKm)}km 추정 · 일 ${fmtNum(pred.kmPerDay)}km</div>
      </div>
      <button class="hero-update" id="btnUpdateMileage">주행거리 갱신</button>
    </div>

    <div class="stat-row">
      <div class="stat"><div class="k">이달 지출</div><div class="v tnum">${compactWon(thisMonth.total)}</div></div>
      <div class="stat"><div class="k">교체 임박</div><div class="v tnum">${attention.length}<small> 건</small></div></div>
      <div class="stat"><div class="k">누적 기록</div><div class="v tnum">${s.records.length}<small> 건</small></div></div>
    </div>

    <div class="section-label">소모품 상태 <a class="muted" style="text-transform:none;letter-spacing:0;font-weight:600" href="#settings">주기 설정 ›</a></div>
    <div class="card" id="maintCard">
      ${top.map(maintRow).join("") || `<div class="chart-empty">표시할 소모품이 없습니다.</div>`}
    </div>

    <div class="section-label">이달의 지출 · 최근 6개월</div>
    <div class="card">
      ${totalSpend(s).total === 0
        ? `<div class="chart-empty">정비·주유·부품 기록에 비용을 입력하면<br>월별 지출 그래프가 채워집니다.</div>`
        : stackedBarChart(month)}
    </div>

    ${fuelTrend(s).length ? `
    <div class="section-label">연비 추이</div>
    <div class="card">${lineChart(fuelTrend(s))}</div>` : ""}

    <div class="section-label">최근 활동 <a class="muted" style="text-transform:none;letter-spacing:0;font-weight:600" href="#history">전체 보기 ›</a></div>
    <div class="card">
      ${recent.length ? `<div class="timeline">${recent.map(timelineRow).join("")}</div>`
        : `<div class="empty"><div class="ic">🗒️</div><div class="t">아직 기록이 없어요</div><div class="d">+ 버튼으로 첫 기록을 남겨보세요</div></div>`}
    </div>
  `;

  root.querySelector("#btnUpdateMileage").onclick = () => openMileageSheet(ctx);
  root.querySelectorAll(".tl-item[data-id]").forEach(el => {
    el.onclick = () => ctx.navigate("history", { focus: el.dataset.id });
  });
}

function maintRow(m) {
  const dotColor = { danger: "var(--danger)", warn: "var(--warn)", ok: "var(--ok)", unknown: "var(--text-3)" }[m.status];
  const stCls = m.status === "danger" ? "st-danger" : m.status === "warn" ? "st-warn" : m.status === "ok" ? "st-ok" : "";
  const fillCls = m.status === "danger" ? "fill-danger" : m.status === "warn" ? "fill-warn" : "fill-ok";
  const badge = m.status === "danger" ? `<span class="pill-badge badge-danger">교체 요망</span>`
    : m.status === "warn" ? `<span class="pill-badge badge-warn">주의</span>`
    : m.status === "unknown" ? `<span class="pill-badge" style="background:var(--surface-2);color:var(--text-3)">기록 필요</span>`
    : `<span class="pill-badge badge-ok">정상</span>`;

  let remainText = "";
  if (m.never) remainText = `<span class="muted">기록 필요</span>`;
  else {
    const parts = [];
    if (m.kmRemain != null) parts.push(m.kmRemain >= 0 ? `${fmtNum(m.kmRemain)}km` : `${fmtNum(-m.kmRemain)}km 초과`);
    if (m.daysRemain != null) parts.push(m.daysRemain >= 0 ? `${fmtNum(m.daysRemain)}일` : `${fmtNum(-m.daysRemain)}일 초과`);
    remainText = parts.join(" · ");
  }
  const sub = m.never
    ? `주기 ${m.km ? fmtNum(m.km) + "km" : ""}${m.km && m.months ? " / " : ""}${m.months ? m.months + "개월" : ""}`
    : `최근 ${m.lastMileage != null ? fmtNum(m.lastMileage) + "km" : ""}${m.lastDate ? " · " + fmtDate(m.lastDate, { ym: true }) : ""}`;

  return `
    <div class="maint-item">
      <div class="maint-head">
        <div class="maint-name"><span class="dot" style="background:${dotColor}"></span>${escapeHtml(m.name)}</div>
        <div class="maint-remain ${stCls}">${remainText}</div>
      </div>
      <div class="bar-track"><div class="bar-fill ${fillCls}" style="width:${m.never ? 0 : m.pct}%"></div></div>
      <div class="maint-head"><div class="maint-sub">${sub}</div>${badge}</div>
    </div>`;
}

function timelineRow(r) {
  const cat = CAT[r.type] || CAT.maintenance;
  const cost = Number(r.cost) > 0 ? `<span class="tl-cost tnum">${fmtWon(r.cost)}</span>` : "";
  const meta = [];
  if (r.mileage) meta.push(`${fmtNum(r.mileage)}km`);
  meta.push(relDays(r.date));
  if (r.type === "fuel" && r.liters) meta.push(`${r.liters}ℓ`);
  return `
    <div class="tl-item" data-id="${r.id}">
      <div class="tl-icon ${cat.cls}">${cat.icon}</div>
      <div class="tl-body">
        <div class="tl-title"><span>${escapeHtml(recordTitle(r))}</span>${cost}</div>
        <div class="tl-meta">${meta.map(x => `<span>${escapeHtml(x)}</span>`).join("")}</div>
      </div>
    </div>`;
}

function openMileageSheet(ctx) {
  const v = store.vehicle;
  openSheet(`
    <h2>주행거리 갱신</h2>
    <div class="field">
      <label>현재 주행거리 (km)</label>
      <div class="input-affix"><input class="input tnum" id="mkm" type="number" inputmode="numeric" value="${v.currentMileage}" /><span class="affix">km</span></div>
      <div class="hint">직전 실측 ${fmtKm(v.currentMileage)} · ${fmtDate(v.currentMileageDate)}</div>
      <div id="mwarn"></div>
    </div>
    <div class="field">
      <label>측정 날짜</label>
      <input class="input" id="mdate" type="date" value="${todayStr()}" max="${todayStr()}" />
    </div>
    <button class="btn btn-primary" id="msave">저장</button>
  `, (sheet) => {
    const kmEl = sheet.querySelector("#mkm");
    const warn = sheet.querySelector("#mwarn");
    kmEl.oninput = () => {
      const val = Number(kmEl.value);
      warn.innerHTML = (val && val < v.currentMileage)
        ? `<div class="inline-warn">⚠ 직전 실측(${fmtNum(v.currentMileage)}km)보다 낮습니다. 주행거리는 보통 줄지 않아요.</div>` : "";
    };
    sheet.querySelector("#msave").onclick = () => {
      const val = Number(kmEl.value);
      const date = sheet.querySelector("#mdate").value || todayStr();
      if (!val || val <= 0) { toast("주행거리를 입력하세요"); return; }
      store.setCurrentMileage(val, date);
      closeSheet();
      toast("주행거리를 갱신했어요", "ok");
      ctx.rerender();
    };
  });
}

function compactWon(n) {
  if (!n) return "₩0";
  if (n >= 10000) return "₩" + (Math.round(n / 1000) / 10).toString().replace(/\.0$/, "") + "만";
  return "₩" + n.toLocaleString("ko-KR");
}
