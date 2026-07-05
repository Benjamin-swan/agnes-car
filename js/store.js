// store.js — localStorage 데이터 계층 + JSON 백업 import/export
import { buildSeedState, SCHEMA_VERSION } from "./seed.js";

const KEY = "agnes_car_data_v1";

let state = null;
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.error("[store] load 실패, 시드로 초기화", e);
    return buildSeedState();
  }
}

// 스키마 마이그레이션 (데이터 파괴 금지)
function migrate(data) {
  if (!data.schemaVersion) data.schemaVersion = 1;
  // 향후 버전 업 시 여기에 단계별 마이그레이션 추가
  data.schemaVersion = SCHEMA_VERSION;
  data.vehicle = data.vehicle || {};
  data.records = Array.isArray(data.records) ? data.records : [];
  data.schedule = Array.isArray(data.schedule) ? data.schedule : [];
  data.settings = data.settings || {};
  return data;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error("[store] 저장 실패 (용량 초과 가능)", e);
    throw e;
  }
}

export const store = {
  init() {
    state = load();
    return state;
  },
  get() { return state; },
  get vehicle() { return state.vehicle; },
  get records() { return state.records; },
  get schedule() { return state.schedule; },

  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  _emit() { listeners.forEach(fn => fn(state)); },

  save() { persist(); this._emit(); },

  // ---- 차량 프로필 ----
  updateVehicle(patch) {
    Object.assign(state.vehicle, patch);
    this.save();
  },
  // 현재 주행거리 갱신 (기준점 이동)
  setCurrentMileage(mileage, dateStr) {
    state.vehicle.currentMileage = mileage;
    state.vehicle.currentMileageDate = dateStr || todayStr();
    this.save();
  },

  // ---- 기록 CRUD ----
  addRecord(rec) {
    const record = { id: uid(), createdAt: new Date().toISOString(), ...rec };
    state.records.push(record);
    // 최신 주행거리 자동 반영 (역전 아닌 경우)
    if (typeof record.mileage === "number" && record.mileage >= (state.vehicle.currentMileage || 0)) {
      state.vehicle.currentMileage = record.mileage;
      state.vehicle.currentMileageDate = record.date;
    }
    this.save();
    return record;
  },
  updateRecord(id, patch) {
    const r = state.records.find(x => x.id === id);
    if (r) { Object.assign(r, patch); this.save(); }
    return r;
  },
  deleteRecord(id) {
    state.records = state.records.filter(x => x.id !== id);
    this.save();
  },
  getRecord(id) { return state.records.find(x => x.id === id); },

  // ---- 교체 주기 ----
  updateScheduleItem(key, patch) {
    const s = state.schedule.find(x => x.key === key);
    if (s) { Object.assign(s, patch); this.save(); }
  },

  // ---- 백업 ----
  exportJSON() {
    return JSON.stringify(state, null, 2);
  },
  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !("vehicle" in parsed)) {
      throw new Error("올바른 백업 파일이 아닙니다.");
    }
    state = migrate(parsed);
    this.save();
  },
  resetAll() {
    state = buildSeedState();
    this.save();
  },
  hardClear() {
    localStorage.removeItem(KEY);
    state = buildSeedState();
    this.save();
  },
};

// ---- helpers ----
export function uid() {
  return "r-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}
export function todayStr(d = new Date()) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}
