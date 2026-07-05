// ui.js — 공용 UI 헬퍼 (토스트, 바텀시트, 확인)

export function toast(msg, kind = "") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.innerHTML = (kind === "ok" ? "✓ " : kind === "warn" ? "⚠ " : "") + escapeText(msg);
  wrap.appendChild(t);
  setTimeout(() => { t.style.transition = "opacity .25s, transform .25s"; t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 260); }, 2200);
}

// 바텀시트. contentHTML 문자열 + onMount(el) 콜백
export function openSheet(contentHTML, onMount) {
  closeSheet();
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grab"></div>${contentHTML}</div>`;
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeSheet(); });
  const sheet = backdrop.querySelector(".sheet");
  if (onMount) onMount(sheet);
  return sheet;
}
export function closeSheet() {
  const b = document.querySelector(".sheet-backdrop");
  if (b) { b.remove(); document.body.style.overflow = ""; }
}

// 확인 대화상자 (Promise<boolean>)
export function confirmSheet({ title, message, confirmText = "확인", danger = false }) {
  return new Promise((resolve) => {
    openSheet(`
      <h2>${escapeText(title)}</h2>
      <p class="muted" style="margin-bottom:20px; font-size:15px; line-height:1.55">${escapeText(message)}</p>
      <div style="display:flex; gap:12px">
        <button class="btn btn-ghost" data-act="cancel">취소</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-act="ok">${escapeText(confirmText)}</button>
      </div>`, (sheet) => {
      sheet.querySelector('[data-act="cancel"]').onclick = () => { closeSheet(); resolve(false); };
      sheet.querySelector('[data-act="ok"]').onclick = () => { closeSheet(); resolve(true); };
    });
  });
}

function escapeText(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 아이콘 (인라인 SVG, 하단 탭바 등)
export const icons = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>`,
  add: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M12 8.5v7M8.5 12h7"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>`,
  chev: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`,
};
