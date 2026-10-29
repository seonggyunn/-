# 한칸 운영실 개발 지침

- Node.js24, Next.js App Router, TypeScript, Zod를 사용한다. 로컬 SQLite / 운영 PostgreSQL은 동일 서비스 계층을 통과한다.
- 모든 운영 데이터 조회·수정은 서버에서 세션과 org_id를 확인한다. 고객 역할에 운영 API를 열지 않는다.
- 외부 프로필 변경은 권한·변경별 승인·증빙 없이는 실행하지 않는다. 수동 기록과 API 검증을 구분한다.
- API 성공·메일 전달·입금·고객 실적을 만들어내지 않는다. 로컬 알림은 PREVIEW이고 제공자 접수는 ACCEPTED다.
- 비밀값과 실제 고객자료는 .data/ 또는 안전한 환경변수에만 둔다. .next/standalone에 .data가 포함되지 않는지 검사한다.
- 운영자 문구는 한국어로 쓴다. 원문 증빙과 AI 제안을 분리하고 새 AI 공급자 출력은 Zod로 검증한다.
- 최소 검사: npm run typecheck, npm run lint, npm test, npm run build, npm run test:e2e.
- PostgreSQL 검증은 격리된 테스트 DB로만 실행한다. 실제 계정·메일·프로필에 테스트 변경을 하지 않는다.
- Docker 빌드에서 프록시·TLS·패키지 서명 검증을 유지한다. 공개 배포에는 실제 계정과 HTTPS·지속 저장소가 필요하다.
