// charts.js — 의존성 없는 SVG 차트
import { fmtWon, fmtEff, fmtDate } from "./utils.js";

const CAT_COLORS = {
  maintenance: "#1B6B4C", fuel: "#3B7DD8", wash: "#2AA6B8", purchase: "#8A6BC2",
};
const CAT_LABEL = { maintenance: "정비", fuel: "주유", wash: "세차", purchase: "부품" };

// 누적 막대 차트 (월별 지출)
export function stackedBarChart(buckets) {
  const max = Math.max(1, ...buckets.map(b => b.total));
  const W = 320, H = 150, padB = 22, padT = 8, gap = 10;
  const n = buckets.length;
  const bw = (W - gap * (n - 1)) / n;
  const chartH = H - padB - padT;
  const cats = ["maintenance", "fuel", "wash", "purchase"];

  let bars = "";
  buckets.forEach((b, i) => {
    const x = i * (bw + gap);
    let y = H - padB;
    if (b.total === 0) {
      bars += `<rect x="${x}" y="${H - padB - 3}" width="${bw}" height="3" rx="1.5" fill="var(--surface-2)"/>`;
    } else {
      cats.forEach(cat => {
        const v = b[cat];
        if (v > 0) {
          const h = (v / max) * chartH;
          y -= h;
          bars += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${CAT_COLORS[cat]}"><title>${CAT_LABEL[cat]} ${fmtWon(v)}</title></rect>`;
        }
      });
    }
    bars += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-3)">${b.label}</text>`;
    if (b.total > 0) {
      bars += `<text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-2)">${compactWon(b.total)}</text>`;
    }
  });

  // 상단 라운드 처리를 위해 rect 위에 마스크 대신 단순화(각 막대 최상단 살짝 라운드는 생략)
  const svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 지출 그래프">${bars}</svg>`;
  const legend = `<div class="chart-legend">${cats.map(c => `<span class="lg"><span class="sw" style="background:${CAT_COLORS[c]}"></span>${CAT_LABEL[c]}</span>`).join("")}</div>`;
  return `<div class="chart-wrap">${svg}</div>${legend}`;
}

// 라인 차트 (연비 추이)
export function lineChart(points) {
  if (!points.length) return `<div class="chart-empty">주유 기록이 2건 이상 쌓이면 연비 추이가 표시됩니다.</div>`;
  const W = 320, H = 150, padB = 22, padT = 14, padL = 6, padR = 6;
  const vals = points.map(p => p.eff);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  min = Math.max(0, min - (max - min) * 0.15);
  max = max + (max - min) * 0.15;
  const chartW = W - padL - padR, chartH = H - padB - padT;
  const n = points.length;
  const x = i => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const y = v => padT + chartH - ((v - min) / (max - min)) * chartH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.eff).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const dots = points.map((p, i) =>
    `<circle cx="${x(i).toFixed(1)}" cy="${y(p.eff).toFixed(1)}" r="3.5" fill="#fff" stroke="${CAT_COLORS.fuel}" stroke-width="2"><title>${fmtDate(p.date)} · ${fmtEff(p.eff)}</title></circle>`
  ).join("");
  const labels = points.map((p, i) =>
    `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-3)">${fmtDate(p.date, { short: true })}</text>`
  ).join("");
  const avg = vals.reduce((a, b) => a + b, 0) / n;
  const avgY = y(avg);

  const svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="연비 추이 그래프">
    <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CAT_COLORS.fuel}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${CAT_COLORS.fuel}" stop-opacity="0"/>
    </linearGradient></defs>
    <line x1="${padL}" y1="${avgY.toFixed(1)}" x2="${W - padR}" y2="${avgY.toFixed(1)}" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="${W - padR}" y="${(avgY - 4).toFixed(1)}" text-anchor="end" font-size="9" font-weight="700" fill="var(--text-3)">평균 ${fmtEff(avg)}</text>
    <path d="${area}" fill="url(#fg)"/>
    <path d="${line}" fill="none" stroke="${CAT_COLORS.fuel}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}${labels}
  </svg>`;
  return `<div class="chart-wrap">${svg}</div>`;
}

function compactWon(n) {
  if (n >= 10000) return (Math.round(n / 1000) / 10).toFixed(n % 10000 === 0 ? 0 : 1).replace(/\.0$/, "") + "만";
  if (n >= 1000) return (Math.round(n / 100) / 10) + "천";
  return String(n);
}
