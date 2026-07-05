# 🔗 아그네스 차량 관리 — 접속 링크 모음

## 🌐 라이브 사이트 (배포)
| 용도 | 주소 |
|---|---|
| **앱 접속 (여기 클릭)** | https://benjamin-swan.github.io/agnes-car/ |
| 소스 저장소 (GitHub) | https://github.com/Benjamin-swan/agnes-car |
| 배포 워크플로 (Actions) | https://github.com/Benjamin-swan/agnes-car/actions |
| Pages 설정 | https://github.com/Benjamin-swan/agnes-car/settings/pages |

> 📱 아이폰 Safari에서 위 앱 주소를 연 뒤 **공유 → 홈 화면에 추가**하면 앱처럼 쓸 수 있습니다.

## 💻 로컬 실행 (내 컴퓨터에서 개발/미리보기)
ES Module을 쓰므로 파일을 직접 여는 게 아니라 **로컬 서버**로 열어야 합니다.

```bash
# 프로젝트 폴더에서 실행
cd ~/Desktop/SVP/car_manual
python3 -m http.server 8765
```
| 용도 | 주소 |
|---|---|
| 로컬 미리보기 | http://localhost:8765/ |
| (같은 뜻) | http://127.0.0.1:8765/ |

서버 종료: 터미널에서 `Ctrl + C`

## 📖 참고 (기아 공식 사용설명서)
| 용도 | 주소 |
|---|---|
| 스포티지 2018 사용설명서 | https://ownersmanual.kia.com/manual/%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80?projCode=QL&year=2018&langCode=ko_KR&countryCode=A99&content=ownersmanual |
| 경고등 · 심볼 안내 | https://ownersmanual.kia.com/manual/%EC%8A%A4%ED%8F%AC%ED%8B%B0%EC%A7%80?projCode=QL&year=2018&langCode=ko_KR&countryCode=A99&content=warninglights |

## 💾 데이터 백업
- 백업 파일 보관 폴더 + 사용설명서: [`backups/백업-사용법.md`](backups/백업-사용법.md)
- 앱에서 `설정 → 데이터 백업 → JSON으로 내보내기` 한 파일을 `backups/` 폴더에 보관하세요.
- 개인정보 보호: `backups/*.json`은 공개 저장소에 올라가지 않도록 막혀 있어 내 컴퓨터에만 남습니다.

## 🚀 수정 후 재배포
`main` 브랜치에 push하면 GitHub Actions가 자동으로 다시 배포합니다.
```bash
git add .
git commit -m "수정 내용"
git push
```
배포 진행 상황은 위 "배포 워크플로(Actions)" 링크에서 확인할 수 있습니다.

---
🚗 오직 아그네스만을 위한 정비 노트
