# ZPL Designer

브라우저에서 라벨을 시각적으로(WYSIWYG) 디자인하고 그 결과를 **ZPL II 코드**로
추출하는 라벨 디자이너 툴. 설치 없이 동작하며 모든 데이터는 로컬(IndexedDB)에만 저장된다.

## 주요 기능

- **디자인 요소**: 텍스트, 1D 바코드(Code128/39/93·EAN·UPC·ITF·Codabar·MSI),
  2D 코드(QR·Data Matrix·PDF417·Aztec·MaxiCode), 선, 박스, 원, 타원, 대각선,
  이미지(1비트 디더링), 테이블
- **캔버스**: dot 정확도 렌더링, 줌/팬, 눈금자, 그리드·스냅, 마키 선택
- **편집**: 이동·크기·회전(90° 스냅), 다중 선택, 정렬·분배, 그룹, z-순서,
  잠금/숨김, 복사/붙여넣기, 실행취소/재실행
- **ZPL 출력**: 실시간 코드 생성·복사·다운로드, 주석/인코딩/변수치환 옵션
- **ZPL 가져오기**: 기존 ZPL 코드를 캔버스 요소로 역파싱
- **데이터 바인딩**: `{{변수}}` 플레이스홀더, 샘플 미리보기, CSV 데이터 머지
- **프린터 프로필**: DPI(203/300/600)·라벨 크기·미디어·농도·속도·수량
- **템플릿**: 배송 라벨·가격표·자산 태그·주소 라벨 등 내장 템플릿
- **검증**: 인쇄 영역 이탈, 바코드 데이터, 호환성, 이미지 용량 경고
- **플러그인 코드 생성**: `CodeGenerator` 인터페이스 기반 — ZPL II 외 TSPL 생성기 포함
- **인쇄 미리보기**: Labelary 연동 실측 프리뷰
- **저장**: IndexedDB 자동저장, 프로젝트 JSON 입출력, 다크/라이트 테마

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:5173
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` | Vitest 단위 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run typecheck` | 타입 체크 |

## 기술 스택

React 19 · TypeScript · Vite · Konva.js(react-konva) · Zustand · Dexie(IndexedDB)
· bwip-js(바코드) · PapaParse(CSV)

## 프로젝트 구조

```
src/
  types.ts            도메인 모델          codegen/   ZPL/TSPL 코드 생성기
  units.ts            단위/DPI 변환        parser/    ZPL 역파서
  factory.ts          요소 팩토리          barcodes/  바코드 렌더·검증
  validation.ts       설계 검증            image/     이미지 디더링
  state/              Zustand 스토어       persistence/ IndexedDB·파일 IO
  templates/          내장 템플릿          components/ UI(캔버스·패널·모달)
```

## 문서

- [제품 요구사항 정의서 (PRD)](docs/PRD.md)
- [구현 작업 체크리스트](docs/IMPLEMENTATION_PLAN.md)
- [테스트 시나리오 & 환경 가이드](docs/TEST_SCENARIOS.md)

## 테스트 & DevTools MCP

레포 루트 `.mcp.json`에 공식 `chrome-devtools-mcp`가 등록되어 있어, Claude Code가
실제 브라우저로 앱을 구동·검사할 수 있다. 자세한 내용은
[docs/TEST_SCENARIOS.md](docs/TEST_SCENARIOS.md) 참고.
