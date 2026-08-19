# 길담

차 없이 광주에서 전남으로 당일치기 여행을 떠날 수 있을지 판단하고,
검증된 지역 경험과 기록 소재를 연결하는 문화관광 큐레이터입니다.

## 기준 문서

- 제품 범위와 UX: [`docs/Gildam_PRODUCT_SPEC.md`](docs/Gildam_PRODUCT_SPEC.md)
- 프로젝트 작업 규칙: [`AGENTS.md`](AGENTS.md)
- 기여 방법: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 기술 결정: [`docs/architecture/`](docs/architecture/)
- API 계약: [`docs/api/openapi.yaml`](docs/api/openapi.yaml) (자동 생성)
- 데이터 연동 기준: [`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md)
- Track #1 데이터 계보: [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md)
- 백엔드 구현 설명서: [`docs/backend/IMPLEMENTATION_GUIDE.md`](docs/backend/IMPLEMENTATION_GUIDE.md)

제품 동작을 변경할 때는 코드보다 제품 명세를 먼저 수정합니다.

## 저장소 구조

```text
Gildam/
├─ frontend/    사용자 화면과 클라이언트 로직
├─ backend/     코스와 추천 API
├─ docs/        제품 명세, 기술 결정, API 계약, 데이터 연동 기준
├─ scripts/     API 명세 생성 등 유지보수 스크립트
└─ .github/     Pull Request와 CI 설정
```

## 개발 환경

프론트엔드는 React, TypeScript, Vite를 사용합니다. 백엔드는 FastAPI를 사용하며
추천 계산 로직과 코스 상세 API를 분리해 관리합니다.

백엔드 실행:

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

프론트엔드 실행:

```bash
cd frontend
npm install
npm run dev
```

## 검사

```bash
# 백엔드
python -m backend.app.courses.schema
python -m backend.app.courses.lineage
python -m unittest discover -s backend/tests -t . -p "test_*.py"
python scripts/export_openapi.py --check

# 프론트엔드
cd frontend && npm run lint && npm run typecheck && npm run test:run && npm run build
```

## 데이터 원칙

이 저장소에는 **가상의 코스 데이터가 없습니다.** 화면에 나오는 모든 코스와 숫자는
관리 스프레드시트(기준일 2026-08-06, schema v3.1)에서 온 값입니다. 주력 6개는
내부 시연용이며 아직 모두 `publishable=FALSE`입니다.

- 시간 안에 돌아올 수 없는 코스는 추천하지 않습니다. INTERNAL 데모에서는 토요일 운행·
  이용일 귀가편 등 미확인 항목을 2차 확인 경고로 표시하고, PUBLIC은 공개 승인 코스만 허용합니다.
- 검증이 끝나지 않은 코스(`BLOCKED`)는 어떤 조건 조합에서도, 직접 URL로도 노출되지 않습니다.
- 조건에 맞는 코스가 없으면 기준을 낮춰 채우지 않고, 어떤 조건을 바꾸면 몇 개를 볼 수
  있는지 계산해서 알려줍니다.
- 추천 순위와 피로도는 요소별 기여도까지 응답에 담아 근거를 설명합니다.
- Track #1 데이터는 원본 레코드 키까지 연결된 항목만 실제 사용으로 표시하고,
  증거 필요·보류·MVP 범위 밖 상태를 별도로 공개합니다.

자세한 내용은 [`docs/DATA_INTEGRATION.md`](docs/DATA_INTEGRATION.md)를 참고하세요.
