// seed.js — 아그네스 초기 데이터
// source_materials/자동차 정비 이력.md, 자동차 정기점검 주기표.md 근거.

export const SCHEMA_VERSION = 1;

// 차량 프로필 (자동차 등록증 근거)
export const seedVehicle = {
  name: "아그네스",
  model: "더 SUV 스포티지 2.0 디젤 DPF (QL)",
  year: 2018,
  fuelType: "경유",
  officialEfficiency: 13.3,     // km/ℓ
  engine: "T4HA · 1,995cc · 4기통",
  registeredAt: "2017-08-08",
  plate: "",
  // 최신 주행거리 기준점
  currentMileage: 125090,
  currentMileageDate: "2026-07-02",
  initialMileage: 99700,
  initialMileageDate: "2021-12-21",
  fallbackKmPerDay: 40,          // 기록 부족 시 일평균 추정 기본값
};

// 소모품 교체 주기 프리셋 (정기점검 주기표 근거)
// km: 교체 주행거리 주기 / months: 교체 개월 주기 (둘 중 먼저 도래 기준)
export const seedSchedule = [
  { key: "engine_oil",    name: "엔진오일",          km: 8000,   months: 6,  category: "maintenance", note: "디젤 가혹조건 기준 8,000km" },
  { key: "cabin_filter",  name: "실내 항균 필터",     km: 15000,  months: 12, category: "maintenance", note: "에어컨 필터" },
  { key: "tire_rotation", name: "타이어 위치교환",    km: 20000,  months: null, category: "maintenance", note: "" },
  { key: "wheel_align",   name: "휠 얼라인먼트",      km: 20000,  months: null, category: "maintenance", note: "편마모·쏠림 시 즉시" },
  { key: "air_cleaner",   name: "에어클리너",         km: 40000,  months: null, category: "maintenance", note: "" },
  { key: "brake_oil",     name: "브레이크 오일",      km: 40000,  months: 24, category: "maintenance", note: "DOT-4 권장" },
  { key: "fuel_filter",   name: "연료필터",           km: 40000,  months: null, category: "maintenance", note: "디젤 CRD" },
  { key: "drive_belt",    name: "구동벨트",           km: 40000,  months: null, category: "maintenance", note: "" },
  { key: "mission_oil",   name: "자동변속기오일",     km: 40000,  months: null, category: "maintenance", note: "" },
  { key: "brake_pad",     name: "브레이크 패드",      km: 55000,  months: null, category: "maintenance", note: "수시 점검" },
  { key: "battery",       name: "배터리",             km: 60000,  months: 36, category: "maintenance", note: "" },
  { key: "brake_disc",    name: "브레이크 디스크 로터", km: 80000, months: null, category: "maintenance", note: "패드 2회 교체 시 1회" },
  { key: "timing",        name: "타이밍벨트·워터펌프", km: 90000,  months: 60, category: "maintenance", note: "" },
  { key: "coolant",       name: "부동액",             km: 100000, months: 60, category: "maintenance", note: "" },
  { key: "ac_gas",        name: "에어컨 가스",        km: null,   months: 24, category: "maintenance", note: "2년마다 주입 권장" },
  { key: "ac_condenser",  name: "에어컨 콘덴서",      km: null,   months: null, category: "maintenance", note: "성능 저하 시 점검", hidden: true },
];

// 정비 이력 (정비 명세서 근거). resets = 해당 정비가 초기화하는 소모품 key
export const seedRecords = [
  {
    id: "seed-1", type: "maintenance", date: "2021-12-21", mileage: 99700, cost: 0,
    shop: "기아 오토큐", items: ["휠 얼라인먼트 조정"], resets: ["wheel_align"], memo: "",
  },
  {
    id: "seed-2", type: "maintenance", date: "2021-12-21", mileage: 99753, cost: 0,
    shop: "기아 오토큐", items: ["배터리 어셈블리", "와이퍼 블레이드(운전석/조수석)"], resets: ["battery"], memo: "",
  },
  {
    id: "seed-3", type: "maintenance", date: "2022-03-17", mileage: 101910, cost: 0,
    shop: "기아 오토큐",
    items: ["댐퍼 풀리·크랭크샤프트 풀리 교환", "엔진오일·필터류 교환", "에어클리너 필터", "자동변속기오일 교환", "드라이브 벨트 세트(V리브드·텐셔너·아이들러)"],
    resets: ["engine_oil", "air_cleaner", "mission_oil", "drive_belt"], memo: "",
  },
  {
    id: "seed-4", type: "maintenance", date: "2023-05-20", mileage: 109380, cost: 0,
    shop: "기아 오토큐",
    items: ["서미스터 점검·진단", "엔진오일·오일필터·에어클리너 교체", "에어컨 이베퍼레이터 점검"],
    resets: ["engine_oil", "air_cleaner"], memo: "",
  },
  {
    id: "seed-5", type: "maintenance", date: "2025-08-04", mileage: 121179, cost: 0,
    shop: "기아 오토큐",
    items: ["에어컨 냉매 회수·충전", "콘덴서 어셈블리(쿨러)", "누기 원인 분석"],
    resets: ["ac_gas"], memo: "에어컨 성능 저하 대응",
  },
  {
    id: "seed-6", type: "maintenance", date: "2025-08-22", mileage: 121887, cost: 0,
    shop: "기아 오토큐",
    items: ["엔진오일 교환 (ZIC X7 LS 5W30 6L)", "에어필터·오일필터", "자동변속기오일 (ZIC ATF Multi)", "연료필터 ASSY 교환", "브레이크 오일 교환"],
    resets: ["engine_oil", "air_cleaner", "mission_oil", "fuel_filter", "brake_oil"], memo: "",
  },
  {
    id: "seed-7", type: "maintenance", date: "2026-07-02", mileage: 125090, cost: 0,
    shop: "기아 오토큐",
    items: ["KDS 고장코드 분석", "리어 휠 허브(양쪽)", "허브&베어링 어셈블리-리어"],
    resets: [], memo: "",
  },
];

export function buildSeedState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    vehicle: { ...seedVehicle },
    schedule: seedSchedule.map(s => ({ ...s })),
    records: seedRecords.map(r => ({ ...r })),
    settings: { seeded: true, createdAt: new Date().toISOString() },
  };
}
