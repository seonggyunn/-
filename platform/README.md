# 한칸 운영실 — 소상공인 온라인 운영 플랫폼

이 프로젝트 개발은 기존 대화·저장소에서 계속 진행한다. 새 채팅이 필요한 작업이 아니다. 기존 상품표 정리 소개와 샘플은 상위 폴더에, 기존 Python 영업 도구는 `/workspace/ai-sales-system`에 보존했다. 이 앱은 **네이버 플레이스·구글 비즈니스 프로필·홈페이지 정보 관리 대행**을 위한 별도 서비스다.

## 시작

Node.js24, npm, Chromium, 합법적으로 배포되는 Noto CJK 글꼴이 필요하다. 현재 클라우드에는 설치되어 있다. Gmail 비밀번호를 관리자 로그인에 쓰지 않는다.

```bash
cd /workspace/-/platform
npm ci
npm run db:migrate
ADMIN_EMAIL=운영자이메일 npm run admin:create
npm run dev
```

비밀번호를 지정하지 않으면 `.data/initial-admin.json`에 무작위 초기 계정 정보를 권한0600으로 저장한다. 공개 기본 비밀번호는 없다. 해당 파일을 공유·커밋하지 않는다. 운영자는 `/admin/login`에서 로그인한 뒤 설정에서 비밀번호를 변경할 수 있다. API는 HttpOnly 세션과 서버 측 역할·조직 검사를 사용한다. `ADMIN_ROLE=operator`는 운영자, `customer`는 향후 포털용으로 운영 API 접근이 거부된다.

## 로컬에서 검증한 기능

- 한국어 공개 페이지10개, 실제 무료 진단 신청·중복 방지·동의 분리·저장 확인
- 로그인·로그아웃·세션 만료·비밀번호 변경·초기 관리자 발급
- 고객·신청·담당자·기한·내부 메모·업무 상태·불변 활동 이력·CSV 내보내기
- 구조화 수동 진단과 근거 URL, 미확인 상태 분리
- 변경별 사업장 관리권한·고객 승인 증빙·철회·수동 작업 및 결과 재확인
- 버전별 보고서·한글 PDF·인증 다운로드·비공개 증빙파일(1MB)
- 알림 아웃박스, 로컬 미리보기, 제공자 어댑터와 중복 방지
- 월간 계약·MRR·수동 입금상태·월간 업무 스케줄·완료 후 후속 업무
- AI가 없는 환경의 편집 가능한 템플릿; API 설정 시 출력 스키마 검증
- PostgreSQL/Supabase용22개 테이블 마이그레이션과 직접 REST 접근 차단 RLS

실제 네이버·구글 수정, 외부 메일 전달, 온라인 입금 검증, 공개 도메인 배포를 완료한 상태는 아니다. 실제 Google Business Profile API와 네이버 공식 API 제공자는 비활성화했다.

## 프로덕션 빌드와 실행

```bash
npm run build
APP_HOST=127.0.0.1 PORT=3000 npm start
```

빌드 후 정적 자산과 Playwright의 동적 자산을 standalone 묶음으로 복사한다. `.data`, 비밀값, 개발 테스트 자료를 배포물에 넣지 않는다. `npm start`는 standalone 서버를 실행한다. 공개 운영은 HTTPS·실제 APP_URL·지속 DB/파일 볼륨·백업을 설정한 후 별도 검증해야 한다. 자세한 절차는 [배포 가이드](docs/DEPLOYMENT.md).

## 검사

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

PostgreSQL 검사는 별도 격리 DB와 `RUN_POSTGRES_TEST=1`이 필요하다. [검증 보고](docs/TEST_REPORT.md), [DB 가이드](docs/DATABASE.md)를 확인한다. 테스트의 모의 데이터·메일 전송 실험은 운영 DB와 분리했다.

## 운영

```bash
npm run worker
npx tsx scripts/manage.ts retention
```

worker는 월간·기한 업무→PDF 작업→알림을 한 번 처리한다. 실제 운영에서는1분 간격 스케줄러로 실행한다. 임의 비밀번호·CAPTCHA·플랫폼 제한을 우회하지 않는다. 미연결 이메일은 PREVIEW이며 발송으로 표시하지 않는다.

- [아키텍처](docs/ARCHITECTURE.md)
- [관리자 업무 안내](docs/OPERATIONS.md)
- [보안·보관·복구](docs/SECURITY.md)
- [실제 자동화 범위와 남은 연결](docs/STATUS.md)
- [요구사항 원문](docs/PROJECT_SPEC.md)
