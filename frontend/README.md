# Frontend

길담의 홈, 여행 조건 입력, 추천 결과, 코스 상세와 각 상태 화면을 담당합니다.

## 기술 스택

- React
- TypeScript
- Vite
- React Router
- Vitest
- React Testing Library
- CSS Modules

## 명령어

```sh
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
```

화면 데이터는 `services`를 통해 받고, mock 데이터는 UI 컴포넌트에서 직접
가져오지 않습니다.

## 백엔드 연동

추천 결과 화면은 FastAPI 백엔드의 `POST /api/recommendations`를 호출하고,
코스 상세 화면은 `GET /api/courses/{course_id}`를 호출합니다.
로컬 개발에서는 Vite dev server가 `/api` 요청을 `http://127.0.0.1:8001`로
프록시합니다. 현재 Windows 로컬 환경에서 8000 포트 접근이 막히는 경우가 있어,
기본 프록시 포트는 `http://127.0.0.1:8001`로 설정되어 있습니다.

```sh
# backend
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001

# frontend
cd frontend
npm run dev
```

백엔드 포트가 다르면 프론트 실행 전에 `VITE_API_PROXY_TARGET`을 설정합니다.

```powershell
$env:VITE_API_PROXY_TARGET="http://127.0.0.1:8002"
npm run dev
```

배포 환경처럼 브라우저가 백엔드 주소를 직접 호출해야 하면 `VITE_API_BASE_URL`에
API base URL을 설정합니다.
