// app.js — 라우터 + 앱 쉘
import { store } from "./store.js";
import { icons, confirmSheet, closeSheet } from "./ui.js";
import { todayISO, fmtDate } from "./utils.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderAdd } from "./views/add.js";
import { renderHistory } from "./views/history.js";
import { renderSettings } from "./views/settings.js";

const TABS = [
  { key: "dashboard", label: "홈",   icon: icons.home },
  { key: "history",   label: "이력", icon: icons.history },
  { key: "add",       label: "등록", icon: icons.add },
  { key: "settings",  label: "설정", icon: icons.settings },
];

const TITLES = {
  dashboard: () => `<div><div class="sub">${fmtDate(todayISO())}</div><h1>아그네스</h1></div>`,
  history: () => `<h1>통합 이력</h1>`,
  add: () => `<h1>정비 · 활동 등록</h1>`,
  settings: () => `<h1>설정</h1>`,
};

let current = { route: "dashboard", params: {} };
let customTitle = null;

const app = document.getElementById("app");

function ctx() {
  return {
    navigate,
    rerender: () => render(),
    confirm: confirmSheet,
    setTitle: (t) => { customTitle = t; paintAppbar(); },
    params: current.params,
  };
}

function navigate(route, params = {}) {
  closeSheet();
  current = { route, params };
  customTitle = null;
  window.scrollTo({ top: 0 });
  render();
  history.replaceState(null, "", "#" + route);
}

function paintAppbar() {
  const bar = document.getElementById("appbar");
  const titleHTML = customTitle ? `<h1>${customTitle}</h1>` : (TITLES[current.route] || TITLES.dashboard)();
  const showBack = current.route === "add";
  bar.innerHTML = `
    ${showBack ? `<button class="icon-btn" id="backBtn" aria-label="뒤로">${icons.back}</button>` : `<div>${titleHTML}</div>`}
    ${showBack ? `<div style="flex:1; text-align:left">${titleHTML}</div>` : ""}
    <div class="appbar-actions"></div>
  `;
  const back = document.getElementById("backBtn");
  if (back) back.onclick = () => navigate("history");
}

function paintNav() {
  const nav = document.getElementById("bottomNav");
  nav.innerHTML = TABS.map(t => `
    <button class="nav-btn" data-route="${t.key}" aria-current="${current.route === t.key ? "page" : "false"}">
      ${t.icon}<span>${t.label}</span>
    </button>`).join("");
  nav.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => {
    if (b.dataset.route === current.route && current.route !== "add") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    navigate(b.dataset.route);
  });
}

function render() {
  const screen = document.getElementById("screen");
  const c = ctx();
  paintAppbar();
  paintNav();
  // 뷰 렌더
  const fresh = document.createElement("div");
  fresh.className = "screen";
  fresh.id = "screen";
  screen.replaceWith(fresh);
  const map = { dashboard: renderDashboard, add: renderAdd, history: renderHistory, settings: renderSettings };
  (map[current.route] || renderDashboard)(fresh, c);
}

// 해시 앵커(#history 등) 클릭 대응
window.addEventListener("hashchange", () => {
  const r = location.hash.replace("#", "");
  if (TABS.some(t => t.key === r) && r !== current.route) navigate(r);
});

// 부팅
store.init();
const initial = location.hash.replace("#", "");
if (TABS.some(t => t.key === initial)) current.route = initial;
render();
