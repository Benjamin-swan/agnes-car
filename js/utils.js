// utils.js — 포맷, 날짜, 예측 로직

// ---------- 포맷 ----------
export const fmtNum = (n) => (n == null || isNaN(n)) ? "-" : Math.round(n).toLocaleString("ko-KR");
export const fmtKm = (n) => fmtNum(n) + " km";
export const fmtWon = (n) => (n == null || isNaN(n)) ? "-" : "₩" + Math.round(n).toLocaleString("ko-KR");
export const fmtL = (n) => (n == null || isNaN(n)) ? "-" : (Math.round(n * 100) / 100).toLocaleString("ko-KR") + " ℓ";
export const fmtEff = (n) => (n == null || isNaN(n)) ? "-" : (Math.round(n * 10) / 10).toFixed(1) + " km/ℓ";

export function fmtDate(str, opt = {}) {
  if (!str) return "-";
  const d = new Date(str + (str.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d)) return str;
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  if (opt.short) return `${m}.${day}`;
  if (opt.ym) return `${y}.${String(m).padStart(2, "0")}`;
  return `${y}. ${m}. ${day}.`;
}
export function relDays(str) {
  const days = daysBetween(str, todayISO());
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

// ---------- 날짜 계산 ----------
export function todayISO() {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}
export function addMonths(dateStr, months) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ---------- 일평균 주행거리 추정 ----------
// 주행거리가 기록된 항목 2건 이상이면 (최신-최초)/경과일. 아니면 fallback.
export function estimateKmPerDay(state) {
  const pts = state.records
    .filter(r => typeof r.mileage === "number" && r.date)
    .map(r => ({ km: r.mileage, date: r.date }))
    .sort((a, b) => a.date.localeCompare(b.date));
  // 차량 기준점도 포함
  if (state.vehicle.currentMileage && state.vehicle.currentMileageDate) {
    pts.push({ km: state.vehicle.currentMileage, date: state.vehicle.currentMileageDate });
  }
  if (pts.length < 2) return state.vehicle.fallbackKmPerDay || 40;
  const first = pts[0], last = pts[pts.length - 1];
  const days = daysBetween(first.date, last.date);
  const dkm = last.km - first.km;
  if (days <= 0 || dkm <= 0) return state.vehicle.fallbackKmPerDay || 40;
  const rate = dkm / days;
  return Math.max(1, Math.min(rate, 500)); // 이상치 방어
}

// 오늘 기준 예측 주행거리
export function predictedMileage(state) {
  const base = state.vehicle.currentMileage || 0;
  const baseDate = state.vehicle.currentMileageDate || todayISO();
  const kmpd = estimateKmPerDay(state);
  const days = Math.max(0, daysBetween(baseDate, todayISO()));
  return { value: Math.round(base + kmpd * days), kmPerDay: kmpd, extraKm: Math.round(kmpd * days), days };
}

// ---------- 소모품 상태 계산 ----------
// 각 schedule 항목에 대해 마지막 교체(=records의 resets)를 찾아 잔여/상태 판정
export function computeMaintStatus(state) {
  const pred = predictedMileage(state);
  const today = todayISO();

  return state.schedule
    .filter(s => !s.hidden)
    .map(s => {
      // 마지막으로 이 항목을 리셋한 정비 기록
      const last = state.records
        .filter(r => Array.isArray(r.resets) && r.resets.includes(s.key))
        .sort((a, b) => (b.date.localeCompare(a.date)) || ((b.mileage || 0) - (a.mileage || 0)))[0];

      const lastMileage = last ? last.mileage : (state.vehicle.initialMileage ?? null);
      const lastDate = last ? last.date : (state.vehicle.initialMileageDate ?? null);

      // km 기준 진행/잔여
      let kmRatio = null, kmRemain = null, kmDue = null;
      if (s.km && lastMileage != null) {
        const used = pred.value - lastMileage;
        kmRemain = s.km - used;
        kmRatio = used / s.km;
        kmDue = lastMileage + s.km;
      }
      // 개월 기준 진행/잔여
      let moRatio = null, daysRemain = null, dueDate = null;
      if (s.months && lastDate) {
        dueDate = addMonths(lastDate, s.months);
        daysRemain = daysBetween(today, dueDate);
        const total = s.months * 30.44;
        const usedDays = daysBetween(lastDate, today);
        moRatio = usedDays / total;
      }

      // 더 임박한 쪽(진행률 높은 쪽) 채택
      const ratio = Math.max(kmRatio ?? 0, moRatio ?? 0);
      const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));

      const never = !last;
      let status;
      if (never) status = "unknown";       // 교체 이력 없음 → 판정 보류
      else if (ratio >= 1) status = "danger";
      else if (ratio >= 0.85) status = "warn";
      else status = "ok";

      return {
        ...s, last, lastMileage, lastDate,
        kmRemain: never ? null : kmRemain,
        kmDue, daysRemain: never ? null : daysRemain, dueDate,
        ratio, pct, status, never,
      };
    })
    // 정렬: danger > warn > ok > unknown, 그 안에서 임박순
    .sort((a, b) => {
      const rank = { danger: 3, warn: 2, ok: 1, unknown: 0 };
      return (rank[b.status] - rank[a.status]) || (b.ratio - a.ratio);
    });
}

// ---------- 통계 ----------
export function monthlySpend(state, monthsBack = 6) {
  const buckets = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                   label: `${d.getMonth() + 1}월`,
                   maintenance: 0, fuel: 0, wash: 0, purchase: 0, total: 0 });
  }
  const idx = Object.fromEntries(buckets.map((b, i) => [b.ym, i]));
  state.records.forEach(r => {
    const ym = (r.date || "").slice(0, 7);
    if (ym in idx) {
      const b = buckets[idx[ym]];
      const c = Number(r.cost) || 0;
      if (r.type in b) b[r.type] += c;
      b.total += c;
    }
  });
  return buckets;
}

// 연비 추이: 주유 기록에서 구간 연비 계산 (직전 주유 대비 주행거리 / 주유량)
export function fuelTrend(state) {
  const fuels = state.records
    .filter(r => r.type === "fuel" && typeof r.mileage === "number" && r.liters > 0)
    .sort((a, b) => a.mileage - b.mileage);
  const out = [];
  for (let i = 1; i < fuels.length; i++) {
    const dist = fuels[i].mileage - fuels[i - 1].mileage;
    if (dist > 0) {
      out.push({ date: fuels[i].date, mileage: fuels[i].mileage, eff: dist / fuels[i].liters });
    }
  }
  return out;
}

export function totalSpend(state) {
  const t = { maintenance: 0, fuel: 0, wash: 0, purchase: 0, total: 0 };
  state.records.forEach(r => {
    const c = Number(r.cost) || 0;
    if (r.type in t) t[r.type] += c;
    t.total += c;
  });
  return t;
}

// ---------- 카테고리 메타 ----------
export const CAT = {
  maintenance: { label: "정비", icon: "🔧", color: "var(--cat-maint)", cls: "cat-maint-bg" },
  fuel:        { label: "주유", icon: "⛽", color: "var(--cat-fuel)", cls: "cat-fuel-bg" },
  wash:        { label: "세차", icon: "🫧", color: "var(--cat-wash)", cls: "cat-wash-bg" },
  purchase:    { label: "부품구매", icon: "📦", color: "var(--cat-part)", cls: "cat-part-bg" },
};

export function recordTitle(r) {
  if (r.type === "maintenance") return (r.items && r.items[0]) ? (r.items.length > 1 ? `${r.items[0]} 외 ${r.items.length - 1}건` : r.items[0]) : "정비";
  if (r.type === "fuel") return r.station ? `주유 · ${r.station}` : "주유";
  if (r.type === "wash") return r.washType ? `세차 · ${r.washType}` : "세차";
  if (r.type === "purchase") return r.itemName || "부품 구매";
  return "기록";
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
