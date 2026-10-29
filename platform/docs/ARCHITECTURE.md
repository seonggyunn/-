# 아키텍처와 결정

## 기존 작업 보존
상위 저장소의 상품자료 정리 소개·sales.html·모의 포트폴리오, `/workspace/ai-sales-system` Python/GAS 영업 도구는 변경하지 않았다. 새 요구사항은 사업장 온라인 운영 플랫폼이므로 `platform/`에 Next.js 앱을 추가했다. 기존 연락 동의를 새 서비스의 마케팅 동의로 재사용하지 않는다.

## 구성
- `src/app`: 공개 경로와 운영 화면, Node.js API route handler. 모든 운영 API는 서버에서 세션/역할/조직을 확인한다.
- `src/server/service.ts`: 업무 전이·진단·승인·보고서·계약과 동의.
- `src/server/db.ts`: Node24 SQLite 개발 대안과 pg PostgreSQL 어댑터. PostgreSQL에는 RLS와 직접 브라우저 접근 차단도 적용한다.
- `src/server/storage.ts`: 비공개 증빙과 PDF 저장. 조직별 해시 디렉터리와 난수 파일명. 모든 다운로드에 로그인·소유 조직 확인.
- `src/server/notifications.ts`: 영속 outbox. PREVIEW/PENDING/SENDING/ACCEPTED/FAILED/UNKNOWN을 구분한다.
- `src/integrations/providers.ts`: 네이버·구글 수동 어댑터. Google API/미래 네이버 공식 어댑터는 비활성 실패 처리.
- `src/reports`: HTML 이스케이프, Chromium PDF. 외부 네트워크 로딩을 차단한 직접 작성 HTML만 렌더한다.
- `scripts`: 초기 계정, 데이터 정리, 워커, 배포, 격리 DB·브라우저 검사.

## 저장소와 인증
22개 테이블: 필수18개 도메인 테이블에 세션·속도제한·증빙파일·PDF작업 등을 포함한다. 사용자 문서의 필수 표는 모두 존재한다. ID는 UUID이며 조직키·외래키·고유 인덱스를 사용한다. 일반 웹 사용자는 DB에 직접 접근하지 않으며 Supabase anon/authenticated에 테이블 권한을 부여하지 않는다. 백엔드 보호 DB역할의 SQL 접근은 org_id로 다시 제한한다. 향후 고객 포털에는 별도 인증·RLS 정책·권한 검사가 필요하다.

관리자 인증은 서버 scrypt 해시·난수 세션 토큰의 SHA256 저장·8시간 만료·HttpOnly/SameSite=Lax 쿠키다. 운영 HTTPS에서는 Secure 쿠키. 초기 비밀번호는 공개 기본값 없이 임의 생성하며 private파일에만 저장한다. 비밀번호 변경은 모든 기존 세션을 폐기한다. customer 역할은 운영 API에 접근할 수 없다.

## 원자성·반복 실행
신청·동의·업무·알림은 하나의 트랜잭션으로 기록한다. 동일 날짜/고객/사업장/내용은 해시로 중복 방지한다. 월간 점검과 후속 업무는 dedupe_key 고유키를 쓴다. PDF 작업과 알림은 DB에 남아 재기동 후 처리 가능하다. 알림은 조건부 UPDATE로 한 워커만 가져가며 결과 불명 시 재발송하지 않는다. 외부 API 전달과 DB 갱신을 하나의 트랜잭션으로 보장하지는 못한다. 제공자 수락은 수신함 도착 증거가 아니다.

## 배포 선택
Node24와 Chromium·Noto CJK를 포함한 지속 실행 Docker 서버를 기준으로 한다. 서버리스 무료 플랜의 파일시스템·실행시간·PDF제약 때문에 무조건 무료 배포 가능하다고 가정하지 않는다. 운영 PostgreSQL은 Supabase 연결을 지원하지만 실제 프로젝트 자격증명이 없으므로 라이브 Supabase 검증은 미완료다. 로컬 PostgreSQL17에서 어댑터·스키마·RLS를 실제 검증했다.
