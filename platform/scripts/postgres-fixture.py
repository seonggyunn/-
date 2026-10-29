"""Create/start an isolated local test DB. Never accepts a production connection."""
import os,secrets,subprocess,pathlib,sys
name='hankan-platform-pg-test'
if len(sys.argv)>1 and sys.argv[1]=='stop':raise SystemExit(subprocess.run(['docker','stop',name]).returncode)
p=pathlib.Path('.data');p.mkdir(exist_ok=True,mode=0o700);file=p/'postgres-test-url'
existing=subprocess.run(['docker','inspect','--format','{{.Config.Image}}',name],capture_output=True,text=True)
if existing.returncode==0:
 if existing.stdout.strip()!='postgres:17-alpine' or not file.is_file():raise SystemExit('테스트 컨테이너/자격증명 상태를 수동 확인하세요. 덮어쓰지 않았습니다.')
 subprocess.run(['docker','start',name],check=True,stdout=subprocess.DEVNULL)
else:
 password=secrets.token_urlsafe(24);env=os.environ.copy();env['POSTGRES_PASSWORD']=password
 subprocess.run(['docker','run','--detach','--name',name,'--label','com.hankan.fixture=true','--env','POSTGRES_PASSWORD','--publish','127.0.0.1:55439:5432','postgres:17-alpine'],env=env,check=True,stdout=subprocess.DEVNULL)
 file.write_text('postgresql://postgres:'+password+'@127.0.0.1:55439/postgres');file.chmod(0o600)
print('로컬 PostgreSQL 테스트 준비 완료. 실제 자격증명은 출력하지 않습니다.')
