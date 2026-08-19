"""FastAPI 앱에서 OpenAPI 문서를 생성해 docs/api/openapi.yaml로 내보냅니다.

문서와 구현이 어긋나는 것을 막기 위해, 명세는 손으로 쓰지 않고 앱에서 생성합니다.

    python scripts/export_openapi.py           # 파일 갱신
    python scripts/export_openapi.py --check   # 최신 상태인지 검사 (CI용)
"""

from __future__ import annotations

import argparse
import pathlib
import sys

import yaml

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.app.main import app  # noqa: E402

OUTPUT_PATH = pathlib.Path("docs/api/openapi.yaml")

HEADER = """# 이 파일은 scripts/export_openapi.py 로 자동 생성됩니다.
# 직접 수정하지 말고 backend/app 의 모델을 고친 뒤 다시 생성해 주세요.
"""


def render() -> str:
    document = app.openapi()

    return HEADER + yaml.safe_dump(
        document,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
        width=100,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    rendered = render()

    if args.check:
        current = OUTPUT_PATH.read_text(encoding="utf-8") if OUTPUT_PATH.exists() else ""

        if current != rendered:
            print(
                "docs/api/openapi.yaml 이 최신 상태가 아닙니다. "
                "`python scripts/export_openapi.py` 를 실행해 주세요.",
                file=sys.stderr,
            )
            return 1

        print("OpenAPI 명세가 구현과 일치합니다.")
        return 0

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(rendered, encoding="utf-8")
    print(f"{OUTPUT_PATH} 갱신 완료")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
