# ADR 0001: 기술 스택

- 상태: 부분 승인됨
- 작성일: 2026-07-30
- 수정일: 2026-08-02

## 배경

길담 MVP는 모바일 우선 웹 화면, 검증된 코스 데이터, 추천 서비스 계층과
향후 실제 API로 교체 가능한 구조가 필요합니다.

## 기본 원칙

본 프로젝트는 모바일 웹 MVP를 빠르게 구현하고, 추후 실제 추천 API로 교체하기
쉬운 구조를 목표로 합니다. 기존 저장소에 기술 스택이 구성되어 있다면 특별한
문제가 없는 한 이를 우선 유지합니다.

## Frontend

- React
- TypeScript
- Vite
- React Router

## Styling

- CSS Modules
- CSS Custom Properties 기반 디자인 토큰
- 모바일 퍼스트 반응형 구현

Tailwind CSS 또는 다른 스타일링 방식이 기존 저장소에 이미 적용되어 있다면
새로운 방식을 혼합하지 않고 기존 방식을 유지합니다.

## State

- 화면 내부 상태: React `useState`
- 여행 조건 공유: React Context
- 새로고침 및 뒤로 가기 복원: `sessionStorage`
- Redux, Zustand 등 별도 전역 상태 라이브러리는 현재 MVP에 사용하지 않습니다.

## Data

- 초기 구현은 TypeScript mock data를 사용합니다.
- UI 컴포넌트는 mock data를 직접 참조하지 않습니다.
- 데이터 조회는 service layer를 통해 수행합니다.
- 추후 실제 API 연동 시 service layer 내부 구현만 교체합니다.
- API 요청에는 기본 `fetch`를 사용합니다.

## Backend

- FastAPI
- Pydantic response model
- Uvicorn

백엔드는 검증된 코스 조회와 추천 API를 담당합니다. 현재 코스 상세 API는
MVP seed data를 사용하며, 실제 코스 DB가 확정되면 데이터 저장소만 교체합니다.
지도 연결은 Kakao 지도 URL을 우선 사용합니다.

## Testing

- Vitest
- React Testing Library
- Python `unittest`
- 핵심 사용자 흐름과 예외 상태 위주로 테스트합니다.

## Deployment

- Vercel
- 정적 프론트엔드 배포를 우선합니다.

## Constraints

- 기획에 없는 라이브러리를 임의로 추가하지 않습니다.
- 새로운 의존성 추가가 필요하면 목적과 대안을 먼저 설명합니다.
- 기존 기술 스택과 충돌하는 새로운 프레임워크를 도입하지 않습니다.
- 모바일 반응형과 접근성을 별도 후속 작업이 아니라 초기 구현부터 적용합니다.

## 미결정 항목

- 프론트엔드 패키지 관리자
- API 계약 관리 또는 코드 생성 방식

미결정 항목을 합의하면 이 문서를 갱신하고 관련 설치 및 검증 명령을
`README.md`와 CI에 추가합니다.
