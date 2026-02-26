# CloudBread 프론트엔드 인수인계 (다음 세션용)

## 1) 현재 상태 요약
- 기준 커밋: `295ee0c` (원격 `origin/main`까지 푸시 완료 상태)
- 현재 워킹트리: **추가 리팩토링 작업이 로컬에만 존재** (아직 커밋 안 됨)
  - `M apps/frontend/src/App.tsx`
  - `?? apps/frontend/src/features/diagram/*` (신규 분리 파일들)
- 최근 검증 결과(로컬 리팩토링 상태 기준):
  - `npm run build` 성공
  - `npm run lint` 성공

## 2) 프로젝트 목표/범위 (현재 구현 기준)
- Save/Load 백엔드 연동은 아직 미구현 (의도적으로 제외)
- 프론트 핵심 기능 구현 완료:
  - SVG 아이콘 팔레트 드래그 -> 캔버스 노드 배치
  - 노드 이동, 노드 라벨/색상 수정
  - 소스(파란) + 타깃(빨강) 선택 후 `Connect`/`Disconnect`
  - 360도 방향 기반 직선 화살표(커스텀 엣지)
  - PNG Export, PDF(브라우저 print) Export
  - 점형 그리드 배경/커서 커스터마이징

## 3) 중요 구현 포인트 (다음 세션에서 맥락 유지 필수)
- 연결 UX 규칙:
  - 첫 클릭 노드 = 소스(파란 테두리)
  - 이후 클릭 노드들 = 타깃(연한 빨강, 다중 선택 가능)
  - `Connect`/`Disconnect` 실행 후 선택 상태 초기화
- 화살표 렌더 방식:
  - React Flow 기본 핸들 선 연결이 아니라, `floating` 커스텀 엣지에서
    노드 사각 경계 교차점 계산으로 시작/도착점 결정
  - 따라서 노드 상대 위치에 따라 모든 방향으로 자연스럽게 연결됨
- React Flow 에러 #008 회피:
  - 각 노드에 `id="floating"` source/target hidden handle 유지 필요
  - 엣지에 `sourceHandle/targetHandle = "floating"` 지정 필요

## 4) 코드 구조 (리팩토링 후)
- 진입:
  - `apps/frontend/src/App.tsx`
- 기능 모듈:
  - `apps/frontend/src/features/diagram/types.ts`
  - `apps/frontend/src/features/diagram/constants.ts`
  - `apps/frontend/src/features/diagram/reactflowConfig.ts`
  - `apps/frontend/src/features/diagram/utils/svg.ts`
  - `apps/frontend/src/features/diagram/utils/edge.ts`
  - `apps/frontend/src/features/diagram/utils/export.ts`
  - `apps/frontend/src/features/diagram/components/IconNode.tsx`
  - `apps/frontend/src/features/diagram/components/FloatingStraightEdge.tsx`
  - `apps/frontend/src/features/diagram/components/Palette.tsx`
  - `apps/frontend/src/features/diagram/components/NodeControlsPanel.tsx`

## 5) 성능/유지보수 리팩토링(이미 반영됨, 로컬 변경)
- 팔레트 preview src 사전 계산 (`constants.ts`)
- 팔레트 lookup O(1) (`PALETTE_BY_KEY`)
- 타깃 선택 `Set` 활용으로 조회 비용 감소
- 노드 role 변경 시 실제 변경 노드만 새 객체 생성
- 동일 라벨/색상 재입력 시 불필요 state 업데이트 방지
- `Palette`, `NodeControlsPanel`, `IconNode`를 `memo`로 래핑

## 6) 실행/검증 명령
```bash
cd /home/mere7410/CS397/CloudBread/apps/frontend
npm run dev
# 또는
npm run build
npm run lint
```

## 7) 다음 세션 권장 작업 순서
1. 로컬 리팩토링 변경을 먼저 커밋/푸시할지 결정
2. 사용자 요청 시 Save/Load API 연동 추가
3. Export 결과물에 엣지/스타일 정확도 점검 (필요 시 export 로직 보정)
4. 선택 UX 고도화(예: Shift 다중 선택, 선택 해제 제스처) 여부 확인

## 8) 주의사항
- `apps/` 루트의 옛 `package.json`, `package-lock.json`, `node_modules`는 이미 삭제된 상태가 맞음.
- 프론트 의존성은 `apps/frontend` 기준으로만 관리해야 함.
- React Flow 관련 경고가 다시 보이면, 먼저 hidden handle + edge handle id 설정이 유지되는지 확인할 것.
