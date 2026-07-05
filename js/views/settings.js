// views/settings.js — 차량 프로필, 교체 주기, 백업, 정보
import { store } from "../store.js";
import { fmtNum, fmtEff, escapeHtml } from "../utils.js";
import { openSheet, closeSheet, toast } from "../ui.js";

export function renderSettings(root, ctx) {
  const v = store.vehicle;
  root.innerHTML = `
    <div class="section-label">차량 프로필</div>
    <div class="card">
      <div class="kv"><span class="k">차량명</span><span class="v">${escapeHtml(v.name)}</span></div>
      <div class="kv"><span class="k">차종</span><span class="v">${escapeHtml(v.model)}</span></div>
      <div class="kv"><span class="k">연식</span><span class="v">${v.year}년식</span></div>
      <div class="kv"><span class="k">원동기 / 배기량</span><span class="v">${escapeHtml(v.engine || "-")}</span></div>
      <div class="kv"><span class="k">연료</span><span class="v">${escapeHtml(v.fuelType)}</span></div>
      <div class="kv"><span class="k">공인 연비</span><span class="v">${fmtEff(v.officialEfficiency)}</span></div>
      <div class="kv"><span class="k">번호판</span><span class="v">${escapeHtml(v.plate || "미등록")}</span></div>
      <div class="divider"></div>
      <button class="btn btn-outline btn-sm" id="editProfile" style="width:100%">프로필 편집</button>
    </div>

    <div class="section-label">소모품 교체 주기</div>
    <div class="card" id="schedCard">
      ${store.schedule.filter(s => !s.hidden).map(schedRow).join("")}
    </div>

    <div class="section-label">데이터 백업</div>
    <div class="card">
      <p class="muted" style="font-size:13px; margin-bottom:14px; line-height:1.5">모든 데이터는 이 브라우저에만 저장됩니다. 기기 변경·초기화에 대비해 정기적으로 백업하세요.</p>
      <button class="btn btn-ghost" id="exportBtn" style="margin-bottom:10px">⬇ JSON으로 내보내기 (백업)</button>
      <button class="btn btn-ghost" id="importBtn">⬆ JSON 가져오기 (복원)</button>
      <input type="file" id="importFile" accept="application/json,.json" hidden />
    </div>

    <div class="section-label">관리</div>
    <div class="card">
      <button class="btn btn-outline" id="resetSeed" style="margin-bottom:10px">기본 데이터로 재설정</button>
      <button class="btn btn-danger" id="clearAll">전체 데이터 삭제</button>
    </div>

    <div class="section-label">정보 · 참고 자료</div>
    <div class="card">
      <a class="list-link" href="https://ownersmanual.kia.com/manual/%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80?projCode=QL&year=2018&langCode=ko_KR&countryCode=A99&content=ownersmanual" target="_blank" rel="noopener">사용설명서 (기아 공식)<span class="chev">↗</span></a>
      <a class="list-link" href="https://ownersmanual.kia.com/manual/%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80?projCode=QL&year=2018&langCode=ko_KR&countryCode=A99&content=warninglights" target="_blank" rel="noopener">경고등 · 심볼 안내<span class="chev">↗</span></a>
      <div class="kv" style="border-top:1px solid var(--border); margin-top:6px; padding-top:14px"><span class="k">앱 버전</span><span class="v">아그네스 v1.0</span></div>
    </div>
    <p class="muted" style="text-align:center; font-size:12px; margin-top:20px">🚗 오직 아그네스만을 위한 정비 노트</p>
  `;

  root.querySelector("#editProfile").onclick = () => openProfileSheet(ctx);
  root.querySelectorAll(".sched-edit").forEach(b => b.onclick = () => openSchedSheet(b.dataset.key, ctx));

  root.querySelector("#exportBtn").onclick = doExport;
  root.querySelector("#importBtn").onclick = () => root.querySelector("#importFile").click();
  root.querySelector("#importFile").onchange = (e) => doImport(e, ctx);

  root.querySelector("#resetSeed").onclick = async () => {
    const ok = await ctx.confirm({ title: "기본 데이터로 재설정", message: "현재 데이터를 지우고 초기 정비 이력·주기로 되돌립니다. 계속할까요?", confirmText: "재설정", danger: true });
    if (ok) { store.resetAll(); toast("기본 데이터로 재설정했어요", "ok"); ctx.rerender(); }
  };
  root.querySelector("#clearAll").onclick = async () => {
    const ok = await ctx.confirm({ title: "전체 데이터 삭제", message: "모든 기록이 사라집니다. 백업을 먼저 받아두는 걸 권장해요. 정말 삭제할까요?", confirmText: "삭제", danger: true });
    if (ok) { store.hardClear(); toast("삭제 후 기본 상태로 초기화했어요", "ok"); ctx.rerender(); }
  };
}

function schedRow(s) {
  const parts = [];
  if (s.km) parts.push(`${fmtNum(s.km)}km`);
  if (s.months) parts.push(`${s.months}개월`);
  return `
    <div class="list-link">
      <div>
        <div style="font-weight:700">${escapeHtml(s.name)}</div>
        <div class="muted" style="font-size:12px">${parts.join(" / ") || "주기 미설정"}${s.note ? " · " + escapeHtml(s.note) : ""}</div>
      </div>
      <button class="btn btn-ghost btn-sm sched-edit" data-key="${s.key}">편집</button>
    </div>`;
}

function openProfileSheet(ctx) {
  const v = store.vehicle;
  openSheet(`
    <h2>프로필 편집</h2>
    <div class="field"><label>차량명</label><input class="input" id="p_name" value="${escapeHtml(v.name)}" /></div>
    <div class="field"><label>차종</label><input class="input" id="p_model" value="${escapeHtml(v.model)}" /></div>
    <div class="input-group">
      <div class="field"><label>연식</label><input class="input tnum" id="p_year" type="number" value="${v.year}" /></div>
      <div class="field"><label>공인 연비 (km/ℓ)</label><input class="input tnum" id="p_eff" type="number" step="0.1" value="${v.officialEfficiency}" /></div>
    </div>
    <div class="field"><label>연료</label><input class="input" id="p_fuel" value="${escapeHtml(v.fuelType)}" /></div>
    <div class="field"><label>번호판</label><input class="input" id="p_plate" value="${escapeHtml(v.plate || "")}" placeholder="예: 12가 3456" /></div>
    <button class="btn btn-primary" id="p_save">저장</button>
  `, (sheet) => {
    sheet.querySelector("#p_save").onclick = () => {
      store.updateVehicle({
        name: val(sheet, "#p_name") || "아그네스",
        model: val(sheet, "#p_model"),
        year: Number(val(sheet, "#p_year")) || v.year,
        officialEfficiency: Number(val(sheet, "#p_eff")) || v.officialEfficiency,
        fuelType: val(sheet, "#p_fuel"),
        plate: val(sheet, "#p_plate"),
      });
      closeSheet(); toast("프로필을 저장했어요", "ok"); ctx.rerender();
    };
  });
}

function openSchedSheet(key, ctx) {
  const s = store.schedule.find(x => x.key === key);
  if (!s) return;
  openSheet(`
    <h2>${escapeHtml(s.name)} 주기</h2>
    <div class="input-group">
      <div class="field"><label>주행거리 주기</label><div class="input-affix"><input class="input tnum" id="s_km" type="number" value="${s.km ?? ""}" placeholder="없음" /><span class="affix">km</span></div></div>
      <div class="field"><label>기간 주기</label><div class="input-affix"><input class="input tnum" id="s_mo" type="number" value="${s.months ?? ""}" placeholder="없음" /><span class="affix">개월</span></div></div>
    </div>
    <div class="field"><label>메모</label><input class="input" id="s_note" value="${escapeHtml(s.note || "")}" /></div>
    <div class="hint" style="margin-bottom:16px">운전 습관에 맞게 자유롭게 조정하세요. 둘 중 먼저 도래하는 기준으로 알림이 뜹니다.</div>
    <button class="btn btn-primary" id="s_save">저장</button>
  `, (sheet) => {
    sheet.querySelector("#s_save").onclick = () => {
      store.updateScheduleItem(key, {
        km: val(sheet, "#s_km") ? Number(val(sheet, "#s_km")) : null,
        months: val(sheet, "#s_mo") ? Number(val(sheet, "#s_mo")) : null,
        note: val(sheet, "#s_note"),
      });
      closeSheet(); toast("주기를 저장했어요", "ok"); ctx.rerender();
    };
  });
}

function doExport() {
  const json = store.exportJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const d = new Date().toISOString().slice(0, 10);
  a.href = url; a.download = `agnes-backup-${d}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("백업 파일을 내려받았어요", "ok");
}

function doImport(e, ctx) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const ok = await ctx.confirm({ title: "백업 복원", message: "현재 데이터를 백업 파일 내용으로 덮어씁니다. 계속할까요?", confirmText: "복원", danger: true });
    if (!ok) { e.target.value = ""; return; }
    try {
      store.importJSON(reader.result);
      toast("백업을 복원했어요", "ok");
      ctx.rerender();
    } catch (err) {
      toast("가져오기 실패: " + err.message, "warn");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
}

const val = (root, sel) => (root.querySelector(sel).value || "").trim();
