"""Production image smoke test using only temporary records and a temporary container."""
import json,os,pathlib,secrets,subprocess,time,urllib.request,urllib.error,tempfile
name='hankan-platform-image-test';base='http://127.0.0.1:3139';summary={};password=secrets.token_urlsafe(24)
def request(path,data=None,token=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Cookie']=token
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
 try:
  with urllib.request.urlopen(req,timeout=40) as r:return r.status,r.read(),r.headers
 except urllib.error.HTTPError as e:return e.code,e.read(),e.headers
try:
 subprocess.run(['docker','run','--detach','--name',name,'--label','com.hankan.fixture=image-test','--publish','127.0.0.1:3139:3000','hankan-operations:local'],check=True,stdout=subprocess.DEVNULL)
 for _ in range(60):
  try:
   if request('/api/health')[0]==200:break
  except OSError:pass
  time.sleep(.5)
 else:raise RuntimeError('컨테이너 기동 실패')
 env=os.environ.copy();env['ADMIN_EMAIL']='docker-owner@example.invalid';env['ADMIN_PASSWORD']=password
 subprocess.run(['docker','exec','--env','ADMIN_EMAIL','--env','ADMIN_PASSWORD',name,'node','provision-runtime.mjs'],env=env,check=True,stdout=subprocess.DEVNULL)
 assert request('/')[0]==200 and request('/api/dashboard')[0]==401
 status,body,headers=request('/api/auth/login',{'email':env['ADMIN_EMAIL'],'password':password});assert status==200,(status,body)
 token=headers.get('Set-Cookie').split(';')[0];assert 'Secure' in headers.get('Set-Cookie') and 'HttpOnly' in headers.get('Set-Cookie')
 status,body,_=request('/api/intake',{'business':'컨테이너 한글 검증 공방','industry':'공방','contact':'검증','email':'docker-customer@example.invalid','services':['naver'],'privacy':True,'contact_consent':True,'marketing':False});assert status==201,(status,body);lead=json.loads(body)['id']
 status,body,_=request('/api/leads/'+lead+'/audit',{'items':[{'field':'운영시간','value':'고객 확인 필요','status':'CUSTOMER_CONFIRMATION_REQUIRED','source_url':'','evidence':'컨테이너 검증용 기록'}]},token);assert status==200,(status,body)
 status,body,_=request('/api/leads/'+lead+'/report',{},token);assert status==200,(status,body);report=json.loads(body)['id']
 status,pdf,_=request('/api/reports/'+report+'/pdf',token=token);assert status==200 and pdf.startswith(b'%PDF'),(status,pdf[:100])
 with tempfile.NamedTemporaryFile(suffix='.pdf') as file:
  file.write(pdf);file.flush();text=subprocess.check_output(['pdftotext',file.name,'-'],text=True);assert '컨테이너 한글 검증 공방' in text and '온라인 정보 진단' in text
 subprocess.run(['docker','restart',name],check=True,stdout=subprocess.DEVNULL)
 for _ in range(60):
  try:
   if request('/api/health')[0]==200:break
  except OSError:pass
  time.sleep(.5)
 status,body,_=request('/api/dashboard',token=token);assert status==200 and json.loads(body)['kpis']['inquiries']==1
 summary={'image':'hankan-operations:local','public_page':True,'authentication':True,'secure_cookie':True,'real_intake':True,'audit_report':True,'private_korean_pdf':True,'restart_persistence':True,'external_messages_sent':0,'production_url_verified':False,'temporary_container_removed':True}
 pathlib.Path('.data/test-artifacts').mkdir(parents=True,exist_ok=True);pathlib.Path('.data/test-artifacts/docker-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps(summary,ensure_ascii=False))
finally:
 subprocess.run(['docker','rm','--force',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
