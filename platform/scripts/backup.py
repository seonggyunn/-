"""Private SQLite/file snapshot. Contains customer data: never publish the archive."""
import argparse,datetime,pathlib,sqlite3,tempfile,tarfile,os
p=argparse.ArgumentParser();p.add_argument('command',choices=['backup','restore']);p.add_argument('--data',default='.data');p.add_argument('--archive',required=True);a=p.parse_args();root=pathlib.Path(a.data).resolve();archive=pathlib.Path(a.archive).resolve()
if a.command=='backup':
 source=root/'operations.sqlite'
 if not source.is_file():raise SystemExit('SQLite DB가 없습니다. PostgreSQL에는 관리형 백업/pg_dump를 사용하세요.')
 archive.parent.mkdir(parents=True,exist_ok=True)
 fd=os.open(archive,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with tempfile.TemporaryDirectory() as temp:
  snap=pathlib.Path(temp)/'operations.sqlite'
  with sqlite3.connect(source) as db,sqlite3.connect(snap) as dest:db.backup(dest)
  with os.fdopen(fd,'wb') as out,tarfile.open(fileobj=out,mode='w:gz') as tar:
   tar.add(snap,arcname='operations.sqlite')
   private=root/'private'
   if private.exists():
    for file in private.rglob('*'):
     if file.is_symlink():raise SystemExit('심볼릭 링크가 있어 백업을 중단합니다.')
     if file.is_file():tar.add(file,arcname=str(file.relative_to(root)))
 print('비공개 백업 생성 완료. 고객자료 포함: 공유·Git 커밋 금지.')
else:
 if root.exists() and any(root.iterdir()):raise SystemExit('비어 있는 새 복구 디렉터리만 허용합니다. 기존 자료를 덮어쓰지 않습니다.')
 root.mkdir(parents=True,exist_ok=True,mode=0o700)
 with tarfile.open(archive,'r:gz') as tar:
  members=tar.getmembers()
  for member in members:
   path=pathlib.PurePosixPath(member.name)
   if path.is_absolute() or '..' in path.parts or not member.isfile() or (member.name!='operations.sqlite' and path.parts[0]!='private'):raise SystemExit('안전하지 않은 백업 경로 또는 파일형식입니다.')
  tar.extractall(root,filter='data')
 for file in root.rglob('*'):
  if file.is_file():file.chmod(0o600)
 with sqlite3.connect(root/'operations.sqlite') as db:
  if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise SystemExit('DB 무결성 확인 실패')
 print('새 디렉터리에 복구·SQLite 무결성 확인 완료. 운영 전 로그인·파일 접근도 확인하세요.')
