# 구현 작업 체크리스트

PRD(`docs/PRD.md`) 전체 구현 진행 상황. 모듈 단위로 세분화하여 누락을 방지한다.

## A. 프로젝트 셋업
- [x] A1. package.json + 의존성 설치
- [x] A2. tsconfig / vite.config / playwright.config
- [x] A3. index.html / manifest / .gitignore / .mcp.json

## B. 도메인 & 유틸
- [x] B1. `src/types.ts` — 도메인 모델
- [x] B2. `src/units.ts` — 단위/DPI 변환
- [x] B3. `src/ids.ts` — ID 생성
- [x] B4. `src/factory.ts` — 요소 기본값 팩토리

## C. 코드 생성 (codegen) — CodeGenerator 플러그인 아키텍처
- [x] C1. `src/codegen/types.ts` — CodeGenerator 인터페이스
- [x] C2. `src/codegen/zpl.ts` — ZPL II 생성기 (전 요소 + 라벨 설정)
- [x] C3. `src/codegen/tspl.ts` — TSPL 생성기 (플러그인 확장 데모)
- [x] C4. `src/codegen/index.ts` — 생성기 레지스트리

## D. ZPL 가져오기 (역파싱)
- [x] D1. `src/parser/zplParser.ts` — ZPL → 요소 복원

## E. 바코드 / 이미지 처리
- [x] E1. `src/barcodes/render.ts` — bwip-js 캔버스 렌더(전 심볼)
- [x] E2. `src/barcodes/validate.ts` — 심볼별 데이터 유효성
- [x] E3. `src/image/process.ts` — 디더링→1비트→^GFA + 미리보기

## F. 검증 & 경고
- [x] F1. `src/validation.ts` — 영역 이탈/바코드/호환성/용량 경고

## G. 상태 관리
- [x] G1. `src/state/history.ts` — undo/redo 헬퍼
- [x] G2. `src/state/store.ts` — Zustand 스토어(전 액션)

## H. 영속화
- [x] H1. `src/persistence/db.ts` — Dexie(IndexedDB)
- [x] H2. `src/persistence/projectIo.ts` — JSON 입출력 / 다운로드 유틸

## I. 템플릿
- [x] I1. `src/templates/index.ts` — 내장 템플릿 5종

## J. UI — 애플리케이션 셸
- [x] J1. `src/main.tsx` / `src/App.tsx` / `src/index.css`
- [x] J2. `src/components/Toolbar.tsx` — 상단 메뉴/툴바

## K. UI — 캔버스
- [x] K1. `src/components/canvas/DesignCanvas.tsx` — Stage/줌/팬/스냅/Transformer
- [x] K2. `src/components/canvas/ElementNode.tsx` — 요소별 Konva 렌더
- [x] K3. `src/components/canvas/Rulers.tsx` — 눈금자/그리드

## L. UI — 패널
- [x] L1. `src/components/ToolPalette.tsx` — 좌측 도구 팔레트
- [x] L2. `src/components/PropertyPanel.tsx` — 요소별 속성 폼
- [x] L3. `src/components/LayersPanel.tsx` — 레이어 트리
- [x] L4. `src/components/ZplPanel.tsx` — ZPL 코드 패널(복사/다운로드)
- [x] L5. `src/components/LabelSettingsPanel.tsx` — 라벨/프린터 설정
- [x] L6. `src/components/DataBindingPanel.tsx` — 변수/CSV 머지

## M. UI — 모달
- [x] M1. `src/components/TemplateGallery.tsx`
- [x] M2. `src/components/ImportDialog.tsx` — ZPL 가져오기
- [x] M3. `src/components/PreviewModal.tsx` — 인쇄 미리보기(+CSV 다중)
- [x] M4. `src/components/SettingsDialog.tsx` — 설정/테마

## N. 상호작용
- [x] N1. `src/hooks/useKeyboardShortcuts.ts` — 단축키
- [x] N2. `src/components/ContextMenu.tsx` — 우클릭 컨텍스트 메뉴

## O. 테스트 & MCP
- [x] O1. `.mcp.json` — chrome-devtools-mcp
- [x] O2. `tests/unit/*` — codegen/parser/units/validation/store 단위 테스트(30개)
- [x] O3. `tests/e2e/designer.spec.ts` — Playwright E2E 시나리오
- [x] O4. `docs/TEST_SCENARIOS.md` — 테스트 환경 & 시나리오 문서

## P. 마무리
- [x] P1. `npm run build` 통과
- [x] P2. `npm run test` 통과 (30/30)
- [x] P3. dev 서버 구동 + 모듈 변환 스모크 확인
- [x] P4. README 갱신
- [x] P5. 커밋 & 푸시

## Q. PRD v1.1+ 보강 기능 (후속 구현)
- [x] Q1. 오브젝트 스냅 + 정렬 가이드선 (드래그 시 요소·라벨·가이드 가장자리 스냅)
- [x] Q2. 사용자 가이드라인 (눈금자 클릭 생성, 드래그 이동, 더블클릭 삭제)
- [x] Q3. 배경 추적 이미지 (업로드·투명도·표시 토글, ZPL 제외)
- [x] Q4. 캔버스 인라인 텍스트 편집 (더블클릭 → 오버레이 textarea)
- [x] Q5. 그래픽 심볼(^GS) 요소 (®/©/™/UL/CSA)
- [x] Q6. GS1-128 (Code 128 모드 D, FNC1)
- [x] Q7. 이미지 프린터 메모리 저장 (~DG 다운로드 / ^XG 호출)
- [x] Q8. 카운터(^SN)·날짜/시간 동적 텍스트 필드
- [x] Q9. ZPL 코드 양방향 편집 (코드 패널 편집 → 역파싱 → 캔버스 갱신)
- [x] Q10. 단위 테스트 38개 통과 / 빌드 통과

## 비고
- E2E(Playwright) 및 chrome-devtools-mcp는 코드/설정 완비. 단, 본 샌드박스는
  네트워크 정책상 브라우저 바이너리 다운로드(Playwright CDN·Google·snap)가 모두
  차단되어 브라우저 런타임 실행은 로컬 환경에서 수행해야 한다
  (`npm run test:e2e:install && npm run test:e2e`).
- 남은 항목: PWA 서비스 워커(오프라인), UI 영어 번역, 멀티 라벨.
