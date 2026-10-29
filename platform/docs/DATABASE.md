# 데이터베이스 설정

## 로컬 SQLite
`npm run db:migrate`로 스키마를 만든다. 기본 `.data/operations.sqlite`는 Git·Docker context·배포 묶음에서 제외한다. Node24 내장 SQLite를 사용하므로 별도 네이티브 모듈 빌드가 필요 없다. 운영 파일은 백업 절차에 따라 보관한다.

## Supabase PostgreSQL / 일반 PostgreSQL
1. 본인 소유 프로젝트의 서버 전용 PostgreSQL 연결 주소를 `DATABASE_URL`에 안전하게 설정한다. 공개 JS 환경변수로 설정하지 않는다.
2. SQL 편집기 또는 보호된 마이그레이션 환경에서 `202610290001_operations.sql`, `202610290002_private_access.sql` 순서로 적용한다. 일반 PostgreSQL에도 적용 가능하다.
3. `npm run db:migrate`를 실행한다. 서버 초기화도 스키마·RLS·익명 접근 차단을 적용한다. 실행 역할은 자신의 스키마를 관리할 수 있어야 한다.
4. `ADMIN_EMAIL`과 초기 계정 명령으로 운영자를 만든다. 실제 사업장 고객은 public 폼으로 접수된다.

Supabase REST용 anon 키나 사용자 JWT를 이 백엔드 DB연결 자격증명으로 쓰지 않는다. 보호된 DB 소유자/백엔드 역할은 RLS를 우회할 수 있어 서버의 조직 필터가 추가로 필요하다. 브라우저 직접 DB/Storage API 연동은 하지 않았다. 원격 연결은 제공자의 올바른 CA·TLS 설정을 사용하고 인증서 검증을 끄지 않는다.

## 실제 PostgreSQL 테스트 재현
```bash
python3 scripts/postgres-fixture.py
RUN_POSTGRES_TEST=1 npx tsx --test tests/postgres.test.ts
python3 scripts/postgres-fixture.py stop
```
fixture는 127.0.0.1:55439에만 노출되는 `postgres:17-alpine` 컨테이너다. 자격증명은 `.data/postgres-test-url`에 비공개 저장한다. 매번 별도 테스트 DB를 만들고 끝나면 제거한다. 지정된 로컬 포트가 아니면 테스트를 거부한다. 운영 DB를 테스트용으로 사용하지 않는다.

## 보관과 조직 해지
`npx tsx scripts/manage.ts retention`은 30일 지난 미거래 NEW/REJECTED/CANCELLED 신청의 연락정보·메모·알림 내용을 익명화한다. 동의·활동·계약 이력은 별도 보관 근거에 따라 관리한다. 첨부 파일, 승인 증빙, 백업과 이미 보낸 메일은 이 명령만으로 모두 삭제되지 않는다. 실제 고객 삭제/해지 요청에는 해당 조직·리드 자료목록과 증빙보관 근거를 확인한 뒤 운영자가 처리하고 기록한다. 대량 삭제 API를 공개하지 않았다.
