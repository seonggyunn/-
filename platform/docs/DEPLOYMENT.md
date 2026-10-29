# 재현 가능한 배포

## Node 서버
Node24와 Chromium, Noto CJK가 있는 지속 실행 서버에서 `npm ci`, `npm run build`를 실행한다. `.env.local`은 서버전용이며 `.env.example`의 값 이름을 참고한다. 로컬 CLI도 `.env.local`을 읽는다. 테스트는 SKIP_ENV_FILES로 운영 설정을 읽지 않는다.

```bash
npm run db:migrate
ADMIN_EMAIL=본인이메일 npm run admin:create
APP_HOST=127.0.0.1 PORT=3000 npm start
```

start wrapper는 DB·파일 경로를 절대경로로 만들어 관리자 생성과 standalone 서버가 같은 DB를 사용하게 한다. 프로세스는 systemd/호스팅의 자동재시작을 설정한다. HTTPS리버스프록시앞에서는실제APP_URL과공개원격IP헤더정리여부를확인한다.

## Docker: Git 체크아웃만으로 빌드
```bash
docker build -t hankan-operations:local .
docker run -d --name hankan-operations -p 127.0.0.1:3000:3000 -v hankan-data:/app/data hankan-operations:local
docker exec -e ADMIN_EMAIL=본인이메일 hankan-operations node provision-runtime.mjs
```

다단계 Dockerfile이 npm ci·프로덕션 빌드·정적자산과 Playwright 동적자산을 묶고, 비root사용자로 Node·Chromium·한글글꼴을 실행한다. 초기자격증명은컨테이너 `/app/data/initial-admin.json`을운영자가비공개로확인한다. 컨테이너이미지에는운영DB·초기비밀번호를포함하지않는다.

현재 클라우드의 프록시 DNS가 Docker 빌드에 전달되지 않는 경우 `python3 scripts/docker-build.py`를 사용한다. 기존프록시의같은주소를해석해등록하고호스트신뢰CA를빌드전용으로전달한다. TLS검증·패키지서명을끄지않는다. 일반호스팅은이도움스크립트없이표준dockerbuild가가능하다.

## 저비용 Git 배포
Docker를지원하는본인소유호스팅에서저장소의Root Directory를 `platform`으로지정하고Dockerfile을사용한다. 계정/요금제·Node24·Chromium자원·지속볼륨·HTTPS조건을확인한뒤설정한다. 무료서버리스플랜이이구성을항상지원한다고가정하지않는다. SQLite운영은단일인스턴스와지속볼륨이필수다. 확장배포는PostgreSQL과공유사설스토리지가필요하다. 현재로컬스토리지만구현되어있어여러앱인스턴스가서로다른디스크를쓰면안된다.

## 워커
CLI환경에서1분간격 `npm run worker`를스케줄한다. PDF작업과메일 outbox를처리하므로메일자격증명은같은보호환경에둔다. 매일일반문의 retention을실행하고계약/승인/증빙·백업정리는별도정책으로관리한다. 현재Docker런타임에는웹서버·초기계정도구만포함한다. 워커는전체체크아웃CLI에서별도실행하거나운영자설정화면의처리버튼을사용한다.

## 공개 배포 후 필수 확인
- 공개주소·HTTPS·쿠키Secure·다른조직/익명접근차단
- 본인용 테스트신청1건→DB보존→관리자로그인→진단·승인검증→한글PDF
- 설정한메일의실제수신/실패/불명상태,재시도중복방지
- 재시작후DB·증빙파일보존,백업복구,스케줄러동작
- 테스트자료가운영KPI에포함되지않도록격리또는정리

현재이체크리스트를공개운영URL에서완료한상태는아니다. 실제호스팅·Supabase·메일·Google/Naver API자격증명이없어공개배포와외부변경을주장하지않는다.
