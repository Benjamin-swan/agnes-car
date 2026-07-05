// views/add.js — 정비/활동 등록 (카테고리별 가변 폼). editId 있으면 수정 모드.
import { store, todayStr } from "../store.js";
import { CAT, fmtNum, fmtWon, fmtEff, escapeHtml } from "../utils.js";
import { toast } from "../ui.js";

export function renderAdd(root, ctx) {
  const editing = ctx.params && ctx.params.editId ? store.getRecord(ctx.params.editId) : null;
  const preset = ctx.params && ctx.params.preset;
  let cat = editing ? editing.type : (preset && preset.type) || "maintenance";

  // 폼 상태
  const draft = editing ? JSON.parse(JSON.stringify(editing)) : blankDraft(cat, preset);

  root.innerHTML = `
    <div class="cat-seg" id="catSeg">
      ${["maintenance", "fuel", "wash", "purchase"].map(c => `
        <button class="cat-opt" data-cat="${c}" aria-pressed="${c === cat}">
          <span class="ic ${CAT[c].cls}">${CAT[c].icon}</span>${CAT[c].label}
        </button>`).join("")}
    </div>
    <form id="recForm" autocomplete="off"></form>
  `;

  const form = root.querySelector("#recForm");
  const segBtns = root.querySelectorAll(".cat-opt");

  function renderFields() {
    form.innerHTML = fieldsFor(cat, draft) + `
      <div style="display:flex; gap:12px; margin-top:8px">
        ${editing ? `<button type="button" class="btn btn-danger" id="delBtn">삭제</button>` : ""}
        <button type="submit" class="btn btn-primary">${editing ? "수정 저장" : "기록 저장"}</button>
      </div>`;
    bindFields(form, cat, draft);
    if (editing) form.querySelector("#delBtn").onclick = async () => {
      const ok = await ctx.confirm({ title: "기록 삭제", message: "이 기록을 삭제할까요? 되돌릴 수 없어요.", confirmText: "삭제", danger: true });
      if (ok) { store.deleteRecord(editing.id); toast("삭제했어요", "ok"); ctx.navigate("history"); }
    };
  }

  segBtns.forEach(b => b.onclick = () => {
    if (editing) { toast("수정 중에는 유형을 바꿀 수 없어요"); return; }
    cat = b.dataset.cat;
    segBtns.forEach(x => x.setAttribute("aria-pressed", x.dataset.cat === cat));
    Object.assign(draft, blankDraft(cat), { date: draft.date, mileage: draft.mileage });
    renderFields();
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const rec = collect(cat, draft, form);
    if (!rec) return;
    if (editing) { store.updateRecord(editing.id, rec); toast("수정했어요", "ok"); }
    else { store.addRecord(rec); toast(`${CAT[cat].label} 기록을 저장했어요`, "ok"); }
    ctx.navigate("history");
  };

  ctx.setTitle(editing ? "기록 수정" : "정비 · 활동 등록");
  renderFields();
}

function blankDraft(cat, preset) {
  const base = { date: todayStr(), mileage: store.vehicle.currentMileage || "", cost: "", memo: "" };
  if (preset && preset.itemName) base.itemName = preset.itemName;
  if (cat === "maintenance") return { ...base, items: [], shop: "", resets: [] };
  if (cat === "fuel") return { ...base, liters: "", station: "" };
  if (cat === "wash") return { ...base, washType: "자동세차", product: "" };
  if (cat === "purchase") return { ...base, itemName: base.itemName || "", vendor: "", installStatus: "미장착" };
  return base;
}

function maxMileage() {
  let mx = store.vehicle.currentMileage || 0;
  store.records.forEach(r => { if (typeof r.mileage === "number" && r.mileage > mx) mx = r.mileage; });
  return mx;
}

// ---- 공통 필드 ----
function commonTop(draft) {
  return `
    <div class="input-group">
      <div class="field">
        <label>날짜</label>
        <input class="input" name="date" type="date" value="${draft.date || todayStr()}" max="${todayStr()}" required />
      </div>
      <div class="field">
        <label>주행거리</label>
        <div class="input-affix"><input class="input tnum" name="mileage" type="number" inputmode="numeric" value="${draft.mileage ?? ""}" placeholder="${fmtNum(store.vehicle.currentMileage)}" /><span class="affix">km</span></div>
      </div>
    </div>
    <div id="mileageWarn"></div>`;
}
function costField(label = "비용", req = false) {
  return `<div class="field">
      <label>${label}</label>
      <div class="input-affix"><input class="input tnum" name="cost" type="number" inputmode="numeric" placeholder="0" /><span class="affix">원</span></div>
      ${req ? "" : `<div class="hint">모르면 비워두세요 (통계에서 제외)</div>`}
    </div>`;
}
function memoField() {
  return `<div class="field"><label>메모</label><textarea class="input" name="memo" placeholder="정비소, 특이사항 등"></textarea></div>`;
}

function fieldsFor(cat, d) {
  if (cat === "maintenance") return maintenanceFields(d);
  if (cat === "fuel") return fuelFields(d);
  if (cat === "wash") return washFields(d);
  if (cat === "purchase") return purchaseFields(d);
  return "";
}

function maintenanceFields(d) {
  const sched = store.schedule.filter(s => !s.hidden);
  return commonTop(d) + `
    <div class="field">
      <label>정비 항목</label>
      <div class="input-affix">
        <input class="input" id="itemInput" placeholder="예: 엔진오일 교환 (입력 후 Enter)" />
      </div>
      <div class="tag-input-list" id="itemTags"></div>
      <div class="hint">여러 항목을 추가할 수 있어요</div>
    </div>
    <div class="field">
      <label>교체한 소모품 (상태 초기화)</label>
      <div class="hint" style="margin:0 0 8px">체크한 소모품의 교체 주기가 이 정비 기준으로 리셋됩니다.</div>
      <div class="chips" id="resetChips">
        ${sched.map(s => `<button type="button" class="chip" data-key="${s.key}" aria-pressed="false">${escapeHtml(s.name)}</button>`).join("")}
      </div>
    </div>
    <div class="field"><label>정비소</label><input class="input" name="shop" placeholder="예: 기아 오토큐" /></div>
    ${costField("정비 비용")}
    ${memoField()}`;
}

function fuelFields(d) {
  return commonTop(d) + `
    <div class="input-group">
      <div class="field"><label>주유량</label><div class="input-affix"><input class="input tnum" name="liters" type="number" inputmode="decimal" step="0.01" placeholder="0" /><span class="affix">ℓ</span></div></div>
      <div class="field"><label>주유 금액</label><div class="input-affix"><input class="input tnum" name="cost" type="number" inputmode="numeric" placeholder="0" /><span class="affix">원</span></div></div>
    </div>
    <div id="fuelCalc"></div>
    <div class="field"><label>주유소</label><input class="input" name="station" placeholder="예: SK 알뜰주유소" /></div>
    ${memoField()}`;
}

function washFields(d) {
  const types = ["손세차", "자동세차", "셀프세차", "스팀세차"];
  return commonTop(d) + `
    <div class="field"><label>세차 종류</label>
      <select class="select" name="washType">${types.map(t => `<option${t === d.washType ? " selected" : ""}>${t}</option>`).join("")}</select>
    </div>
    <div class="field"><label>사용 용품 / 내용</label><input class="input" name="product" placeholder="예: 손세차 + 발수코팅" /></div>
    ${costField("세차 비용")}
    ${memoField()}`;
}

function purchaseFields(d) {
  const st = ["미장착", "자가장착", "정비소 장착"];
  return commonTop(d) + `
    <div class="field"><label>품목명</label><input class="input" name="itemName" value="${escapeHtml(d.itemName || "")}" placeholder="예: 와이퍼, 에어컨 필터" required /></div>
    <div class="field"><label>구매처</label><input class="input" name="vendor" placeholder="예: 쿠팡, 부품몰" /></div>
    ${costField("구매 금액")}
    <div class="field"><label>장착 여부</label>
      <select class="select" name="installStatus">${st.map(t => `<option${t === d.installStatus ? " selected" : ""}>${t}</option>`).join("")}</select>
      <div class="hint">미장착으로 저장 후, 이력 화면에서 “장착 완료 → 정비 기록 전환”이 가능해요</div>
    </div>
    ${memoField()}`;
}

// ---- 필드 바인딩 (동적 계산, 태그, 칩) ----
function bindFields(form, cat, draft) {
  // 값 복원
  Object.entries(draft).forEach(([k, val]) => {
    const el = form.elements[k];
    if (el && typeof val !== "object") el.value = val ?? "";
  });

  // 주행거리 역전 경고
  const mEl = form.elements["mileage"];
  const warnBox = form.querySelector("#mileageWarn");
  const mx = maxMileage();
  if (mEl) mEl.oninput = () => {
    const val = Number(mEl.value);
    warnBox.innerHTML = (val && val < mx)
      ? `<div class="inline-warn">⚠ 기존 최고 기록(${fmtNum(mx)}km)보다 낮아요. 확인해 주세요.</div>` : "";
  };

  if (cat === "maintenance") {
    // 태그 입력
    const input = form.querySelector("#itemInput");
    const tagsBox = form.querySelector("#itemTags");
    draft.items = draft.items || [];
    const drawTags = () => {
      tagsBox.innerHTML = draft.items.map((t, i) => `<span class="tag">${escapeHtml(t)}<button type="button" data-i="${i}">×</button></span>`).join("");
      tagsBox.querySelectorAll("button").forEach(b => b.onclick = () => { draft.items.splice(+b.dataset.i, 1); drawTags(); });
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); const v = input.value.trim(); if (v) { draft.items.push(v); input.value = ""; drawTags(); } }
    };
    input.onblur = () => { const v = input.value.trim(); if (v) { draft.items.push(v); input.value = ""; drawTags(); } };
    drawTags();

    // 리셋 칩
    draft.resets = draft.resets || [];
    form.querySelectorAll("#resetChips .chip").forEach(chip => {
      const on = draft.resets.includes(chip.dataset.key);
      chip.setAttribute("aria-pressed", on);
      chip.onclick = () => {
        const k = chip.dataset.key;
        const idx = draft.resets.indexOf(k);
        if (idx >= 0) draft.resets.splice(idx, 1); else draft.resets.push(k);
        chip.setAttribute("aria-pressed", draft.resets.includes(k));
      };
    });
  }

  if (cat === "fuel") {
    const litersEl = form.elements["liters"], costEl = form.elements["cost"];
    const calc = form.querySelector("#fuelCalc");
    const eff = store.vehicle.officialEfficiency;
    const upd = () => {
      const l = Number(litersEl.value), c = Number(costEl.value);
      if (l > 0 && c > 0) {
        const ppl = c / l;
        calc.innerHTML = `<div class="inline-info">리터당 ${fmtWon(ppl)} · 공인연비 기준 약 ${fmtNum(l * eff)}km 주행 가능</div>`;
      } else calc.innerHTML = "";
    };
    litersEl.oninput = upd; costEl.oninput = upd; upd();
  }
}

// ---- 수집/검증 ----
function collect(cat, draft, form) {
  const f = form.elements;
  const date = f["date"].value || todayStr();
  const mileage = f["mileage"] && f["mileage"].value ? Number(f["mileage"].value) : null;
  const cost = f["cost"] && f["cost"].value ? Number(f["cost"].value) : 0;
  const memo = f["memo"] ? f["memo"].value.trim() : "";
  const rec = { type: cat, date, mileage, cost, memo };

  if (cat === "maintenance") {
    // 미제출 태그 반영
    const pending = form.querySelector("#itemInput").value.trim();
    if (pending) { draft.items.push(pending); }
    if (!draft.items.length) { toast("정비 항목을 1개 이상 입력하세요"); return null; }
    rec.items = draft.items;
    rec.shop = f["shop"].value.trim();
    rec.resets = draft.resets || [];
  } else if (cat === "fuel") {
    const liters = f["liters"].value ? Number(f["liters"].value) : null;
    if (!liters || liters <= 0) { toast("주유량(ℓ)을 입력하세요"); return null; }
    rec.liters = liters;
    rec.station = f["station"].value.trim();
    rec.pricePerLiter = cost && liters ? Math.round((cost / liters) * 10) / 10 : null;
  } else if (cat === "wash") {
    rec.washType = f["washType"].value;
    rec.product = f["product"].value.trim();
  } else if (cat === "purchase") {
    const itemName = f["itemName"].value.trim();
    if (!itemName) { toast("품목명을 입력하세요"); return null; }
    rec.itemName = itemName;
    rec.vendor = f["vendor"].value.trim();
    rec.installStatus = f["installStatus"].value;
  }
  return rec;
}
