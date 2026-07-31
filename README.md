# 길담

차 없이 광주에서 전남으로 당일치기 여행을 떠날 수 있을지 판단하고,
검증된 지역 경험과 기록 소재를 연결하는 문화관광 큐레이터입니다.

## 기준 문서

- 제품 범위와 UX: [`docs/Gildam_PRODUCT_SPEC.md`](docs/Gildam_PRODUCT_SPEC.md)
- 프로젝트 작업 규칙: [`AGENTS.md`](AGENTS.md)
- 기여 방법: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 기술 결정: [`docs/architecture/`](docs/architecture/)
- API 계약: [`docs/api/openapi.yaml`](docs/api/openapi.yaml)

제품 동작을 변경할 때는 코드보다 제품 명세를 먼저 수정합니다.

## 저장소 구조

```text
Gildam/
├─ frontend/    사용자 화면과 클라이언트 로직
├─ backend/     코스와 추천 API
├─ docs/        제품 명세, 기술 결정, API 계약
└─ .github/     Pull Request와 CI 설정
```

## 개발 환경

프론트엔드와 백엔드 기술 스택은 아직 결정되지 않았습니다. 결정 전에는
프레임워크별 초기화 파일이나 실행 명령을 임의로 추가하지 않습니다.
