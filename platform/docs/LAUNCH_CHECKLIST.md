# 다음 운영 단계

1. `node scripts/preflight.mjs`로 현재 설정 상태 확인. 값이나 비밀키는 출력하지 않는다. `--production`은 필요한 조건 누락 시 실패한다. 설정 존재는 실제 연결 검증과 다르다.
2. 본인 소유 Docker 지원 호스팅 계정 연결. 저장소 브랜치 `hankan-operations`, 루트 디렉터리 `platform`, Dockerfile 사용. 유료 생성은 비용 조건을 별도로 정하기 전 실행하지 않는다.
3. 실제 HTTPS 주소를 APP_URL에, 지속 볼륨과 DB를 배포 환경에 설정한다. Supabase 사용 시 DATABASE_URL은 보호된 서버 변수로만 입력한다.
4. 검증한 발신 도메인과 메일 제공자를 설정하고 본인 주소로 실제 수신 검증한다. ChatGPT의 Gmail 앱 연결은 이 서버의 메일 인증 설정과 별개다.
5. 공개 주소에서 테스트 신청·로그인·진단·승인·한글 PDF·재시작을 확인한 뒤 테스트 자료를 분리한다.

## SQLite와 비공개 파일 백업

```bash
python3 scripts/backup.py backup --data .data --archive /안전한경로/새백업.tar.gz
python3 scripts/backup.py restore --data /비어있는/복구폴더 --archive /안전한경로/새백업.tar.gz
```

백업에는 고객 데이터가 들어간다. 공개하거나 커밋하지 않는다. 초기 자격증명 파일은 포함하지 않는다. 복구는 새 빈 디렉터리만 허용하며 운영 폴더를 덮어쓰지 않는다. 백업 중 첨부 변경이 일어나지 않도록 점검시간에 워커·업로드를 중지한다. PostgreSQL에는 이 SQLite 도구 대신 관리형 백업/pg_dump와 별도 파일 백업이 필요하다.
