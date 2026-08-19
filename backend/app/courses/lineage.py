"""Track #1 원자료와 길담 데이터 사용처를 잇는 데이터 계보 레지스트리.

이 모듈은 데이터셋의 *존재*와 프로젝트의 *실제 사용*을 분리해 관리합니다.
주제개요서나 기획서에 이름이 있다는 이유만으로 ``TRACEABLE_USED`` 로 표시하지
않습니다. 원본 레코드 키와 변환 경로가 확보된 데이터만 사용 실적으로 인정합니다.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any, Iterable, Literal, TypedDict

LineageUsageStatus = Literal[
    "TRACEABLE_USED",
    "REFERENCE_ONLY",
    "EVIDENCE_REQUIRED",
    "DEFERRED",
    "OUT_OF_SCOPE_MVP",
]

TRACK1_CATALOG_VERSION = "2026-TRACK1"
LINEAGE_SCHEMA_VERSION = "1.0"

SHEET_SNAPSHOT: dict[str, Any] = {
    "spreadsheetId": "1o8xeUEJzt0rai4_Wn73idVLke4meesglSrSWscN5i6E",
    "title": "남도길담 관광·교통 데이터베이스",
    "url": (
        "https://docs.google.com/spreadsheets/d/"
        "1o8xeUEJzt0rai4_Wn73idVLke4meesglSrSWscN5i6E/edit"
    ),
    "snapshotDate": "2026-08-19",
    "schemaVersion": "3.1",
    "tabs": [
        {"name": "00_가이드", "gid": 2100000001, "recordKey": "코스ID"},
        {"name": "검증 현황", "gid": 2100000003, "recordKey": "코스ID 또는 데이터셋ID"},
        {"name": "변경 이력", "gid": 2100000005, "recordKey": "변경일+대상"},
        {"name": "Track1 데이터 계보", "gid": 2100000006, "recordKey": "데이터셋ID"},
        {"name": "TourAPI 장소 매핑", "gid": 2100000009, "recordKey": "장소ID"},
        {"name": "A-DS01 설명 근거", "gid": 2100000010, "recordKey": "장소ID+원본키"},
        {"name": "A-DS11 지역선정 근거", "gid": 2100000011, "recordKey": "지역+지표+기간"},
        {"name": "후보 장소", "gid": 0, "recordKey": "장소ID"},
        {"name": "로컬 설명", "gid": 2100000002, "recordKey": "장소ID"},
        {"name": "교통 구간", "gid": 920830765, "recordKey": "구간ID"},
        {"name": "코스 일정", "gid": 752940061, "recordKey": "코스ID+순서"},
        {"name": "코스 요약", "gid": 1446142256, "recordKey": "코스ID"},
        {"name": "대체·보류 코스", "gid": 2100000004, "recordKey": "코스ID"},
        {"name": "개발 JSON", "gid": 624299136, "recordKey": "코스ID+버전"},
        {"name": "검증 링크", "gid": 1845620134, "recordKey": "구분+대상+URL"},
        {"name": "식사 후보", "gid": 1900000001, "recordKey": "후보ID"},
        {"name": "백엔드 연동 기준", "gid": 2100000007, "recordKey": "시트 원천+backend field"},
        {"name": "추천 시나리오 QA", "gid": 2100000008, "recordKey": "시나리오ID"},
    ],
}


class Track1Dataset(TypedDict):
    id: str
    name: str
    provider: str
    dataType: str
    catalogUrl: str
    topicOutlinePage: int
    suggestedUse: str


class UsageDecision(TypedDict):
    proposalRole: str
    proposalPages: list[int]
    usageStatus: LineageUsageStatus
    currentDecision: str
    targetSheetTabs: list[str]
    codeConsumers: list[str]
    apiFields: list[str]
    uiSurfaces: list[str]
    sourceRecordKeys: list[str]
    sourceSnapshot: dict[str, Any] | None
    analysisResults: list[str]
    nextEvidence: list[str]


# 주제개요서 물리 페이지 2~3의 19개 데이터셋을 빠짐없이 등록합니다.
TRACK1_SOURCE_REGISTRY: tuple[Track1Dataset, ...] = (
    {
        "id": "A-DS01",
        "name": "관광 특화 말뭉치 데이터",
        "provider": "AI-Hub",
        "dataType": "텍스트",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71714",
        "topicOutlinePage": 2,
        "suggestedUse": "문화관광 설명·감성 추천·RAG 기반 관광 안내",
    },
    {
        "id": "A-DS02",
        "name": "관광 KVQA 데이터(서부권)",
        "provider": "AI-Hub",
        "dataType": "텍스트·이미지",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71608",
        "topicOutlinePage": 2,
        "suggestedUse": "관광지 이미지 기반 질의응답·멀티모달 안내",
    },
    {
        "id": "A-DS03",
        "name": "관광분야 이미지-텍스트 쌍 데이터",
        "provider": "AI-Hub",
        "dataType": "이미지",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71725",
        "topicOutlinePage": 2,
        "suggestedUse": "시간표·안내도·이정표 설명과 관광 이미지 캡션",
    },
    {
        "id": "A-DS04",
        "name": "관광지 소개 다국어 번역 데이터",
        "provider": "AI-Hub",
        "dataType": "텍스트·이미지",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71428",
        "topicOutlinePage": 2,
        "suggestedUse": "외국인 대상 다국어 관광 안내",
    },
    {
        "id": "A-DS05",
        "name": "국내 여행로그 데이터(서부권)",
        "provider": "AI-Hub",
        "dataType": "텍스트·이미지",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71582",
        "topicOutlinePage": 2,
        "suggestedUse": "여행자 유형·방문 경험·활동 패턴 분석",
    },
    {
        "id": "A-DS06",
        "name": "관광 음식메뉴판 데이터",
        "provider": "AI-Hub",
        "dataType": "텍스트·이미지",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71553",
        "topicOutlinePage": 2,
        "suggestedUse": "음식 설명·메뉴판 OCR·음식명 번역",
    },
    {
        "id": "A-DS07",
        "name": "전시 공연 도슨트 데이터",
        "provider": "AI-Hub",
        "dataType": "텍스트",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71323",
        "topicOutlinePage": 2,
        "suggestedUse": "전시·공연 해설과 문화예술 질의응답",
    },
    {
        "id": "A-DS08",
        "name": "문화유산 유적 3D 데이터",
        "provider": "AI-Hub",
        "dataType": "3D",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71353",
        "topicOutlinePage": 2,
        "suggestedUse": "문화유산 3D 해설·가상관람",
    },
    {
        "id": "A-DS09",
        "name": "한국 골목길 이미지 및 3D 데이터",
        "provider": "AI-Hub",
        "dataType": "3D",
        "catalogUrl": "https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71586",
        "topicOutlinePage": 2,
        "suggestedUse": "골목길·문화거리 공간 체험과 콘텐츠 생성",
    },
    {
        "id": "A-DS10",
        "name": "한국 전통 문양 데이터",
        "provider": "AI-Hub",
        "dataType": "이미지",
        "catalogUrl": "https://www.aihub.or.kr/aihubdata/data/view.do?dataSetSn=71809",
        "topicOutlinePage": 2,
        "suggestedUse": "전통문양 해설과 참여형 콘텐츠 생성",
    },
    {
        "id": "A-DS11",
        "name": "지역별 관광 현황",
        "provider": "한국관광데이터랩",
        "dataType": "관광통계·텍스트",
        "catalogUrl": "https://datalab.visitkorea.or.kr/datalab/portal/loc/getAreaDataForm.do",
        "topicOutlinePage": 3,
        "suggestedUse": "지역별 방문 흐름·체류 특성과 수요 분석",
    },
    {
        "id": "A-DS12",
        "name": "문화관광축제 현황",
        "provider": "한국관광데이터랩",
        "dataType": "축제관광·텍스트",
        "catalogUrl": "https://datalab.visitkorea.or.kr/datalab/portal/fes/getFesDataForm.do",
        "topicOutlinePage": 3,
        "suggestedUse": "축제·행사 안내와 방문 경험 분석",
    },
    {
        "id": "A-DS13",
        "name": "TourAPI 관광정보",
        "provider": "한국관광공사",
        "dataType": "Open API",
        "catalogUrl": "https://api.visitkorea.or.kr/",
        "topicOutlinePage": 3,
        "suggestedUse": "관광지·문화시설 검색과 신뢰 기반 안내",
    },
    {
        "id": "A-DS14",
        "name": "광주관광명소",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "관광·텍스트",
        "catalogUrl": "https://www.data.go.kr/data/15133527/fileData.do",
        "topicOutlinePage": 3,
        "suggestedUse": "광주 문화관광 장소 해설·추천·검색",
    },
    {
        "id": "A-DS15",
        "name": "남도여행길잡이_축제 정보",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "축제관광·Open API",
        "catalogUrl": "https://www.data.go.kr/data/15132609/openapi.do",
        "topicOutlinePage": 3,
        "suggestedUse": "전남 축제·행사 안내와 행사형 콘텐츠",
    },
    {
        "id": "A-DS16",
        "name": "문화관광 해설사 현황",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "문화관광·텍스트",
        "catalogUrl": "https://www.data.go.kr/data/15129811/fileData.do?recommendDataYn=Y",
        "topicOutlinePage": 3,
        "suggestedUse": "문화해설·현장 해설 연계",
    },
    {
        "id": "A-DS17",
        "name": "문화노선도",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "문화교통·Open API",
        "catalogUrl": "https://www.data.go.kr/data/15109231/openapi.do",
        "topicOutlinePage": 3,
        "suggestedUse": "문화시설 연계 탐방과 사용자 동선",
    },
    {
        "id": "A-DS18",
        "name": "전라남도_지정 관광지 현황",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "관광·텍스트",
        "catalogUrl": "https://www.data.go.kr/data/15081178/fileData.do",
        "topicOutlinePage": 3,
        "suggestedUse": "전남 지정 관광지 검증·해설·검색",
    },
    {
        "id": "A-DS19",
        "name": "전라남도 관광자원 드론영상",
        "provider": "공공데이터포털 등록 데이터",
        "dataType": "관광 콘텐츠",
        "catalogUrl": "https://www.data.go.kr/data/15097759/openapi.do?recommendDataYn=Y",
        "topicOutlinePage": 3,
        "suggestedUse": "이미지·영상 기반 전시·체험 콘텐츠",
    },
)


def _decision(
    *,
    role: str = "NOT_SELECTED",
    proposal_pages: Iterable[int] = (),
    status: LineageUsageStatus = "OUT_OF_SCOPE_MVP",
    decision: str,
    sheet_tabs: Iterable[str] = (),
    code_consumers: Iterable[str] = (),
    api_fields: Iterable[str] = (),
    ui_surfaces: Iterable[str] = (),
    source_record_keys: Iterable[str] = (),
    source_snapshot: dict[str, Any] | None = None,
    analysis_results: Iterable[str] = (),
    next_evidence: Iterable[str] = (),
) -> UsageDecision:
    return {
        "proposalRole": role,
        "proposalPages": list(proposal_pages),
        "usageStatus": status,
        "currentDecision": decision,
        "targetSheetTabs": list(sheet_tabs),
        "codeConsumers": list(code_consumers),
        "apiFields": list(api_fields),
        "uiSurfaces": list(ui_surfaces),
        "sourceRecordKeys": list(source_record_keys),
        "sourceSnapshot": source_snapshot,
        "analysisResults": list(analysis_results),
        "nextEvidence": list(next_evidence),
    }


# 초기 기획서의 약속(물리 페이지 7~9)과 현재 스냅샷의 증거 상태를 분리합니다.
# 현재 시트에는 A-DS 식별자·원본 레코드 키가 한 건도 없으므로 사용 실적을
# 과장하지 않습니다.
TRACK1_USAGE_DECISIONS: dict[str, UsageDecision] = {
    "A-DS01": _decision(
        role="CORE",
        proposal_pages=(7, 8, 9),
        status="EVIDENCE_REQUIRED",
        decision="로컬 설명은 존재하지만 AI-Hub 원문 레코드와 변환 로그가 없어 A-DS01 사용으로 인정하지 않습니다.",
        sheet_tabs=("로컬 설명",),
        code_consumers=("backend.app.courses.data.COURSE_DETAILS[].localPoints",),
        api_fields=("CourseDetailResponse.localPoints",),
        ui_surfaces=("코스 상세 > 로컬 포인트",),
        next_evidence=("AI-Hub 원본 레코드 키", "원문 해시", "요약·검수 기록"),
    ),
    "A-DS02": _decision(decision="이미지 질의응답은 현재 MVP 범위 밖입니다."),
    "A-DS03": _decision(
        role="AUXILIARY",
        proposal_pages=(7, 8, 11),
        status="DEFERRED",
        decision="장면 프롬프트는 현재 공식 관광정보 기반 수동 검수본이며 A-DS03 이미지-텍스트 데이터를 사용하지 않습니다.",
        sheet_tabs=("로컬 설명",),
        code_consumers=("backend.app.courses.data.COURSE_DETAILS[].scenePrompts",),
        api_fields=("CourseDetailResponse.scenePrompts",),
        ui_surfaces=("코스 상세 > 오늘 담아볼 장면",),
        next_evidence=("사용 이미지 레코드 키", "캡션 파생 규칙", "검수 결과"),
    ),
    "A-DS04": _decision(decision="다국어 관광 안내는 현재 MVP 범위 밖입니다."),
    "A-DS05": _decision(
        role="AUXILIARY",
        proposal_pages=(7, 8, 9),
        status="DEFERRED",
        decision="검증된 광주 출발 무차량 표본이 없어 여행로그 점수를 추천식에서 의도적으로 제외했습니다.",
        code_consumers=("backend.app.recommendations.service.RANKING_WEIGHTS",),
        api_fields=("RecommendationScoreBreakdown",),
        ui_surfaces=("추천 결과 > 점수 근거",),
        next_evidence=("분석 대상 레코드 키", "표본 포함·제외 기준", "오프라인 분석 결과"),
    ),
    "A-DS06": _decision(
        role="AUXILIARY",
        proposal_pages=(7, 8, 11),
        status="DEFERRED",
        decision="현재 식사 후보는 지도·사용자 검증 자료이며 메뉴판 OCR/번역 데이터는 사용하지 않습니다.",
        sheet_tabs=("식사 후보",),
        code_consumers=("backend.app.courses.data.COURSE_DETAILS[].localFood",),
        api_fields=("CourseDetailResponse.localFood",),
        ui_surfaces=("코스 상세 > 지역 음식",),
        next_evidence=("메뉴판 레코드 키", "음식명 정규화 규칙", "출력 문구 검수 기록"),
    ),
    "A-DS07": _decision(decision="AI 도슨트·전시 질의응답은 현재 MVP 범위 밖입니다."),
    "A-DS08": _decision(decision="3D 문화유산 가상관람은 현재 MVP 범위 밖입니다."),
    "A-DS09": _decision(decision="골목길 3D 체험은 현재 MVP 범위 밖입니다."),
    "A-DS10": _decision(decision="전통문양 생성 콘텐츠는 현재 MVP 범위 밖입니다."),
    "A-DS11": _decision(
        role="CORE",
        proposal_pages=(7, 8),
        status="EVIDENCE_REQUIRED",
        decision="담양·나주·목포 선정 주장은 있으나 통계 추출값·기준기간·분석 산출물이 저장소와 시트에 없습니다.",
        next_evidence=("통계 지표명", "기준기간", "지역별 추출값", "지역 선정 의사결정표"),
    ),
    "A-DS12": _decision(decision="축제·계절 코스는 현재 MVP 범위 밖입니다."),
    "A-DS13": _decision(
        role="CORE",
        proposal_pages=(7, 8, 9),
        status="EVIDENCE_REQUIRED",
        decision=(
            "TourAPI 조회 프록시는 백엔드에 연결됐지만, 현재 코스별 장소에는 "
            "TourAPI contentId·API 응답 스냅샷이 없어 A-DS13 직접 사용을 "
            "아직 증명할 수 없습니다."
        ),
        sheet_tabs=("후보 장소", "로컬 설명"),
        code_consumers=(
            "backend.app.tour_api.client.TourApiClient",
            "backend.app.main.search_tour_places",
            "backend.app.courses.data.COURSE_DETAILS[].itinerary",
        ),
        api_fields=(
            "TourApiListResponse.items[].contentId",
            "CourseDetailResponse.itinerary",
            "CourseDetailResponse.localPoints",
        ),
        ui_surfaces=("코스 상세 > 코스 순서", "코스 상세 > 로컬 포인트"),
        next_evidence=(
            "코스별 TourAPI contentId 대응표",
            "사용 API 필드",
            "응답 스냅샷 해시",
        ),
    ),
    "A-DS14": _decision(decision="광주 목적지 코스는 현재 MVP 범위 밖이며 광주는 출발 거점으로만 사용합니다."),
    "A-DS15": _decision(decision="축제·행사 연계는 현재 MVP 범위 밖입니다."),
    "A-DS16": _decision(decision="현장 문화해설사 연계는 현재 MVP 범위 밖입니다."),
    "A-DS17": _decision(
        role="PIPELINE_REFERENCE",
        proposal_pages=(8,),
        status="DEFERRED",
        decision="현재 교통은 지자체 BIS·예매처·지도 조사로 검증하며 문화노선도 원본 레코드는 연결하지 않았습니다.",
        sheet_tabs=("교통 구간", "코스 일정"),
        code_consumers=("backend.app.courses.feasibility",),
        api_fields=("ReturnFeasibilityModel",),
        ui_surfaces=("코스 상세 > 귀가 가능성", "코스 상세 > 코스 순서"),
        next_evidence=("문화노선도 레코드 키", "구간ID 대응표", "노선 데이터 기준일"),
    ),
    "A-DS18": _decision(
        role="CORE",
        proposal_pages=(7, 8),
        status="REFERENCE_ONLY",
        decision="공식 CSV 35행을 MVP 3개 지역으로 필터링한 결과 나주호·담양호 2행뿐이고 현재 코스 장소와 일치하지 않아, 후보군 범위 확인에만 사용하고 장소 출처로 연결하지 않았습니다.",
        code_consumers=("backend.app.courses.lineage.TRACK1_USAGE_DECISIONS",),
        api_fields=("DataLineageResponse.track1Datasets[A-DS18]",),
        source_record_keys=("나주시|나주호|2000-03-22", "담양군|담양호|1977-08-16"),
        source_snapshot={
            "datasetVersion": "전남광주통합특별시_지정 관광지 현황_20260618",
            "publishedDate": "2026-06-18",
            "checkedDate": "2026-08-19",
            "rowCount": 35,
            "byteLength": 2734,
            "encoding": "CP949",
            "sha256": "2ce74b739b8f3adab8695b536332d82bc75218055f6785d2e93fc71a981a913b",
            "license": "공공저작물 출처표시 제1유형",
            "downloadUrl": "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003658834&fileDetailSn=1&insertDataPrcus=N",
        },
        analysis_results=(
            "MVP 지역 일치 원본행: 나주시 나주호, 담양군 담양호",
            "목포시 일치 원본행: 0건",
            "현재 주력 코스 장소명과 직접 일치: 0건",
        ),
        next_evidence=("새 후보로 채택할 때 장소ID 대응표", "필드 단위 사용처"),
    ),
    "A-DS19": _decision(decision="드론 영상 기반 콘텐츠는 현재 MVP 범위 밖입니다."),
}


# 시트의 마지막 교통 구간을 안정적인 구간ID로 연결합니다. 행 번호는 이동할 수
# 있으므로 사용하지 않습니다.
RETURN_SEGMENT_REFERENCES: dict[str, str] = {
    "DY_LOW_01": "DY_LOW_01-S2",
    "DY_NORMAL_01": "DY_LOW_01-S2",  # 시트에서 저도보 코스 귀가 구간을 공유
    "NJ_LOW_01": "NJ_LOW_01-S2",
    "NJ_NORMAL_01": "NJ_NORMAL_01-S4",
    "MP_LOW_01": "MP_LOW_01-S2",
    "MP_NORMAL_02": "MP_NORMAL_02-S2",
    "MP_NORMAL_01": "MP_NORMAL_01-S4",
}


FEATURE_LINEAGE: tuple[dict[str, Any], ...] = (
    {
        "id": "COURSE_ELIGIBILITY",
        "name": "추천 후보·노출 판정",
        "sheetSelectors": [
            "코스 요약[코스ID]",
            "대체·보류 코스[코스ID]",
            "개발 JSON[코스ID]",
        ],
        "snapshotFields": [
            "id",
            "departurePoint",
            "applicableDays",
            "timeType",
            "publishable",
            "exposureTier",
            "isPrimary",
        ],
        "transformation": "스키마 검증 후 출발지·요일·시간·노출 정책 하드 필터",
        "codeConsumers": [
            "backend.app.courses.schema",
            "backend.app.courses.exposure",
            "backend.app.recommendations.service._collect_exclusion_reasons",
        ],
        "apiFields": ["RecommendationResponse.courses", "RecommendationResponse.exclusions"],
        "uiSurfaces": ["추천 결과", "조건별 결과 없음 안내"],
    },
    {
        "id": "RETURN_READINESS",
        "name": "총시간·귀가 교통 준비도",
        "sheetSelectors": ["교통 구간[구간ID]", "코스 일정[코스ID]", "코스 요약[코스ID]"],
        "snapshotFields": ["totalMinutes", "schedule.returnTransport", "itinerary"],
        "transformation": "최악 소요시간 산술과 배차형·계획회차·예약형 교통 모델을 분리 판정",
        "codeConsumers": ["backend.app.courses.feasibility.evaluate_return_feasibility"],
        "apiFields": ["ReturnFeasibilityModel"],
        "uiSurfaces": ["추천 카드 > 귀가 상태", "코스 상세 > 귀가 가능성 안내"],
    },
    {
        "id": "FATIGUE",
        "name": "이동 피로도",
        "sheetSelectors": ["코스 요약[코스ID]", "교통 구간[코스ID]"],
        "snapshotFields": ["walkingMinutes", "transferCount", "roundTripTransitMinutes"],
        "transformation": "도보 0.40 + 환승 0.35 + 왕복교통 0.25 가중합; 시트값과 다르면 보수 등급 선택",
        "codeConsumers": ["backend.app.courses.fatigue", "backend.app.courses.service.resolve_fatigue"],
        "apiFields": ["fatigueLevel", "fatigueScore", "fatigueExplanation"],
        "uiSurfaces": ["추천 카드 > 이동 수치", "코스 상세 > 피로도 산식"],
    },
    {
        "id": "RECOMMENDATION_RANKING",
        "name": "설명 가능한 추천 순위",
        "sheetSelectors": ["코스 요약[코스ID]", "식사 후보[코스ID]", "로컬 설명[장소ID]"],
        "snapshotFields": ["preferences", "localFood", "localPoints", "scenePrompts"],
        "transformation": "취향·이동부담·귀가여유·지역자원 범주·기록 적합도 가중합",
        "codeConsumers": ["backend.app.recommendations.service._build_score_breakdown"],
        "apiFields": ["recommendationScore", "scoreBreakdown", "recommendationReasons"],
        "uiSurfaces": ["추천 결과 순서", "추천 근거 상세"],
    },
    {
        "id": "LOCAL_CONTEXT",
        "name": "지역 음식·로컬 포인트·기록 장면",
        "sheetSelectors": ["식사 후보[후보ID]", "로컬 설명[장소ID]", "후보 장소[장소ID]"],
        "snapshotFields": ["localFood", "localPoints", "scenePrompts", "sources"],
        "transformation": "공식·사용자 검증 자료를 사람이 사전 검수해 정적 스냅샷으로 제공",
        "codeConsumers": ["backend.app.courses.service.build_course_detail"],
        "apiFields": ["localFood", "localPoints", "scenePrompts", "sources"],
        "uiSurfaces": ["코스 상세 > 지역 음식·로컬 포인트·오늘 담아볼 장면·데이터 근거"],
    },
)


def _merged_track1_catalog() -> list[dict[str, Any]]:
    return [
        {**dataset, **TRACK1_USAGE_DECISIONS[dataset["id"]]}
        for dataset in TRACK1_SOURCE_REGISTRY
    ]


def collect_lineage_problems() -> list[str]:
    """레지스트리의 누락·중복·허위 사용 표시를 검사합니다."""

    problems: list[str] = []
    ids = [dataset["id"] for dataset in TRACK1_SOURCE_REGISTRY]
    expected = [f"A-DS{number:02d}" for number in range(1, 20)]

    if ids != expected:
        problems.append("Track #1 dataset registry must contain A-DS01..A-DS19 in order")

    if len(ids) != len(set(ids)):
        problems.append("Track #1 dataset IDs must be unique")

    if set(TRACK1_USAGE_DECISIONS) != set(ids):
        problems.append("every Track #1 dataset must have exactly one usage decision")

    tab_names = [tab["name"] for tab in SHEET_SNAPSHOT["tabs"]]
    tab_gids = [tab["gid"] for tab in SHEET_SNAPSHOT["tabs"]]
    if len(tab_names) != 18 or len(tab_names) != len(set(tab_names)):
        problems.append("sheet snapshot must register all 18 tab names exactly once")
    if len(tab_gids) != len(set(tab_gids)):
        problems.append("sheet tab GIDs must be unique")
    if not all(tab.get("recordKey") for tab in SHEET_SNAPSHOT["tabs"]):
        problems.append("every sheet tab needs a stable record key description")

    for dataset in _merged_track1_catalog():
        if dataset["usageStatus"] == "TRACEABLE_USED":
            required_lists = (
                "sourceRecordKeys",
                "targetSheetTabs",
                "codeConsumers",
                "apiFields",
                "uiSurfaces",
            )
            missing = [field for field in required_lists if not dataset[field]]
            if missing:
                problems.append(
                    f"{dataset['id']} cannot be TRACEABLE_USED without {', '.join(missing)}"
                )
        if dataset["usageStatus"] == "REFERENCE_ONLY" and (
            not dataset["sourceRecordKeys"] or not dataset["sourceSnapshot"]
        ):
            problems.append(
                f"{dataset['id']} REFERENCE_ONLY needs record keys and snapshot evidence"
            )

    if set(RETURN_SEGMENT_REFERENCES) != {
        "DY_LOW_01",
        "DY_NORMAL_01",
        "NJ_LOW_01",
        "NJ_NORMAL_01",
        "MP_LOW_01",
        "MP_NORMAL_02",
        "MP_NORMAL_01",
    }:
        problems.append("return segment crosswalk must cover all managed courses")

    return problems


def _supplementary_sources(courses: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for course in courses:
        for source in course.get("sources", []):
            url = source.get("url")
            if not url:
                continue
            item = grouped.setdefault(
                url,
                {
                    "label": source.get("label", ""),
                    "url": url,
                    "courseIds": [],
                    "checkedDates": [],
                    "verificationStatuses": [],
                    "sourceClass": "SUPPLEMENTARY_SOURCE",
                },
            )
            item["courseIds"].append(course["id"])
            item["checkedDates"].append(source.get("checkedDate", ""))
            item["verificationStatuses"].append(
                source.get("verificationStatus", "")
            )

    for item in grouped.values():
        for field in ("courseIds", "checkedDates", "verificationStatuses"):
            item[field] = sorted(set(value for value in item[field] if value))

    return sorted(grouped.values(), key=lambda item: (item["label"], item["url"]))


def build_lineage_report(courses: Iterable[dict[str, Any]]) -> dict[str, Any]:
    """API와 발표 자료에서 공통으로 사용할 계보 보고서를 만듭니다."""

    course_rows = list(courses)
    datasets = _merged_track1_catalog()
    supplementary = _supplementary_sources(course_rows)
    counts: dict[str, int] = defaultdict(int)

    for dataset in datasets:
        counts[dataset["usageStatus"]] += 1

    selected = [
        dataset
        for dataset in datasets
        if dataset["proposalRole"] in {"CORE", "AUXILIARY"}
    ]
    claimable = [
        dataset["id"]
        for dataset in datasets
        if dataset["usageStatus"] == "TRACEABLE_USED"
    ]
    problems = collect_lineage_problems()

    return {
        "schemaVersion": LINEAGE_SCHEMA_VERSION,
        "catalogVersion": TRACK1_CATALOG_VERSION,
        "policy": (
            "원본 레코드 키→시트 안정 ID→코드→API/UI 경로가 모두 있어야 "
            "Track #1 데이터 사용 실적으로 인정합니다."
        ),
        "sheetSnapshot": SHEET_SNAPSHOT,
        "summary": {
            "catalogDatasetCount": len(datasets),
            "proposalSelectedCount": len(selected),
            "traceableUsedCount": counts["TRACEABLE_USED"],
            "referenceOnlyCount": counts["REFERENCE_ONLY"],
            "evidenceRequiredCount": counts["EVIDENCE_REQUIRED"],
            "deferredCount": counts["DEFERRED"],
            "outOfScopeCount": counts["OUT_OF_SCOPE_MVP"],
            "supplementarySourceCount": len(supplementary),
            "claimableTrack1DatasetIds": claimable,
            "lineageInvalidCount": len(problems),
            "registryStatus": "VALID" if not problems else "INVALID",
            "claimReadiness": (
                "READY_TO_CLAIM"
                if selected and all(
                    dataset["usageStatus"] == "TRACEABLE_USED"
                    for dataset in selected
                    if dataset["proposalRole"] == "CORE"
                )
                else "EVIDENCE_GAPS"
            ),
        },
        "track1Datasets": datasets,
        "featureLineage": list(FEATURE_LINEAGE),
        "supplementarySources": supplementary,
        "knownGaps": [
            "현재 Google Sheets에는 A-DS 식별자·원본 레코드 키·원본 스냅샷 해시가 없습니다.",
            "A-DS18은 공식 CSV로 후보군 범위만 감사했으며 현재 코스 장소의 직접 출처는 아닙니다.",
            "A-DS13 장소 contentId, A-DS01 원문·요약 로그, A-DS11 지역선정 분석표 순으로 보완해야 합니다.",
        ],
        "diagnostics": problems,
    }


def _main() -> int:
    import json
    import sys

    from backend.app.courses.data import COURSE_DETAILS

    report = build_lineage_report(COURSE_DETAILS)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))

    if report["diagnostics"]:
        print(json.dumps(report["diagnostics"], ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
