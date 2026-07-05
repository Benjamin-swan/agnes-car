# 🚗 아그네스 · 차량 관리 웹서비스

2018 기아 스포티지 2.0 디젤(애칭 **아그네스**) 단 한 대를 위한 개인 차량 정비·관리 노트.
정비 이력 기록, 소모품 교체 시기 예측, 주유·세차·부품 기록, 지출·연비 통계를 한 화면에서 관리합니다.

> 프론트엔드 전용 · 백엔드 없음 · 데이터는 브라우저(localStorage)에 저장 · GitHub Pages 배포

## ✨ 주요 기능
- **대시보드**: 예측 주행거리(일평균 기반), 소모품 상태바(정상/주의/교체), 이달 지출, 최근 활동, 연비 추이
- **등록**: 정비·주유·세차·부품 카테고리별 가변 폼. 주행거리 역전 경고, 리터당 단가·연비 자동 계산
- **이력**: 월별 타임라인 + 유형 필터. 부품 구매 → 정비 기록 전환(자가 장착 UX)
- **설정**: 차량 프로필·교체 주기 커스텀 편집, **JSON 백업 내보내기/가져오기**
- 모바일 우선 · PWA(홈 화면 추가) 지원

## 🎨 디자인 / 규칙
- 디자인 시스템: [`DESIGN.md`](DESIGN.md) (클린 미니멀 라이트 · 딥그린 #1B6B4C)
- 작업 규칙: [`CLAUDE.md`](CLAUDE.md) · 기획/진행: [`PLAN.md`](PLAN.md)
- 원본 자료: [`source_materials/`](source_materials) (정비 이력·주기표·사용설명서)

## 🛠 기술
순수 HTML/CSS/JavaScript (ES Modules). 빌드 스텝·의존성 없음. 차트도 자체 SVG로 구현.

## ▶️ 로컬 실행
```bash
# 저장소 폴더에서
python3 -m http.server 8765
# 브라우저에서 http://localhost:8765 접속
```
> ES Module을 쓰므로 `file://` 직접 열기가 아닌 로컬 서버로 열어야 합니다.

## 🚀 GitHub Pages 배포
1. GitHub에 새 저장소 생성 (예: `agnes-car`)
2. 이 폴더를 push:
   ```bash
   git init
   git add .
   git commit -m "feat: 아그네스 차량 관리 앱"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/agnes-car.git
   git push -u origin main
   ```
3. GitHub 저장소 → **Settings → Pages** → Source: `main` 브랜치 `/ (root)` → Save
4. 잠시 후 `https://<USERNAME>.github.io/agnes-car/` 로 접속

## 💾 데이터 보관 안내
모든 기록은 **접속한 브라우저에만** 저장됩니다. 기기·브라우저를 바꾸거나 캐시를 지우면 사라지므로,
**설정 → 데이터 백업 → JSON 내보내기**로 주기적으로 백업하세요. 복원은 같은 화면에서 가져오기로 합니다.

---
🚗 오직 아그네스만을 위한 정비 노트 · v1.0
