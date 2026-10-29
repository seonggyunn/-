# 검증 보고 — 2026-10-29

## 결과

| 검사 | 결과 | 범위 |
|---|---|---|
| TypeScript | 통과 | 앱·서버·테스트·스크립트 |
| ESLint | 통과 | src/scripts/tests |
| SQLite 단위·통합 | 25개 통과 | 접수/동의/역할/테넌트/업무/승인/보고서/실패/계약/연락철회 |
| 기본 test 명령의 PostgreSQL 항목 | 1개 건너뜀 | 별도 테스트 옵션 필요. 아래에서 실제 실행 |
| 실제 PostgreSQL17 | 5개 통과 | 실제 pg 어댑터·스키마·조직격리·업무·RLS·불변이력 |
| next build | 통과 | 경고 없는 production bundle + standalone 자산 |
| 실제 Chromium E2E | 통과 | 공개10경로·모바일·신청저장·관리자로그인·진단·인증PDF |
| 한글 PDF | 통과 | 실제 pdftotext 결과의 한글 제목/상호, 글꼴 매핑 확인 |
| Docker 이미지 빌드 | 통과 | Git소스만으로 npm ci→빌드→비root런타임 |
| Docker smoke | 통과 | 실제 컨테이너 관리자발급·로그인·신청·진단·한글PDF·재시작보존 |
| 의존성 점검 | 생산 의존성 취약점0 | npm audit --omit=dev 실행 시점 결과 |
| 비공개 배포물 검사 | 통과 | standalone에 .data/초기계정파일/.env 없음 |
| 실제 공개운영·외부메일·API변경·수금 | 미실행 | 필요한 실제 계정과 자격증명 미연결 |

## 실행 명령

`npm ci`, `npm run db:migrate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, `RUN_POSTGRES_TEST=1 npx tsx --test tests/postgres.test.ts`, `npm audit --omit=dev`, `python3 scripts/docker-build.py`, `python3 scripts/docker-smoke.py`.

프로비저닝은 `ADMIN_EMAIL`을 지정한 `npm run admin:create`로 확인했다. 초기 비밀번호는 출력하지 않았으며 실제 로컬 계정으로 로그인·로그아웃을 확인했다. 운영 DB의 실제 신청수0·MRR0을 확인했다.

## 확인된 동작

1. 유효 신청·동의3종·진단업무·고객 접수확인 알림이 하나의 트랜잭션으로 저장됨.
2. 잘못된 입력·동의누락·중복신청·다른조직ID·고객역할 운영접근을 차단함.
3. 허용 전이만 저장되며 활동이력 수정/삭제를 DB에서 거부함.
4. 승인 없는 실행, 권한증빙 없는 확인완료, 중복 실행은 거부됨. 수동 기록을 외부 API 성공으로 표현하지 않음.
5. 보고서 버전과 비공개 증빙/PDF가 실제 저장·다운로드됨. PDF한글 추출에 성공함.
6. 메일키 없으면 PREVIEW. 제공자 결과불명은 UNKNOWN으로 남아 재발송하지 않음. 연락철회 후 외부호출을 하지 않음.
7. 활성월계약의점검업무와완료후후속업무가반복실행에중복되지않음. MRR과실제입금을구분함.
8. production standalone 서버와 컨테이너에서 브라우저/API 동작을 확인함. 테스트 DB와 실제 운영 DB를 분리함.

## 개발 중 발견·수정한 문제

- standalone 요청 URL의 내부 호스트와 실제 Host 차이로 정상 문의가403이 되는 문제를 수정하고 외부 Origin 거부는 유지했다.
- Playwright의 browsers.json 등 동적자산이 누락되는 문제를 postbuild 전체패키지복사로 해결했다.
- 동적파일경로추적이비공개자료를배포물에포함할수있는경고를해결하고제외목록과실제검사를추가했다.
- Docker의기존프록시DNS해석과신뢰CA를지원하는빌드도움스크립트를추가했다. 검증·서명을끄지않았다.
- CLI관리자 생성과 standalone이서로다른상대DB경로를쓰지않도록start wrapper에서절대경로를지정했다.

## 화면과 산출물

[데스크톱 화면](screenshots/home-desktop.png), [모바일 화면](screenshots/home-mobile.png), [테스트 보고서 PDF](examples/test-audit-report.pdf).

화면은 실행된 앱에서 촬영했다. 예시 PDF의 공방·담당자·신청은 격리된 브라우저 테스트용 모의자료이며 실제 고객 실적이 아니다. 실제 외부 메일은 보내지 않았다. Docker 임시 컨테이너는 검증 후 제거했다.
