"""Use the existing proxy and trust bundle in sandboxed Docker without weakening TLS."""
import os,socket,subprocess,urllib.parse,ssl,pathlib
args=['docker','build','--build-arg','HTTP_PROXY','--build-arg','HTTPS_PROXY','--build-arg','http_proxy','--build-arg','https_proxy']
seen=set()
for name in ['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy']:
 value=os.environ.get(name)
 if not value:continue
 hostname=urllib.parse.urlsplit(value).hostname
 if hostname and hostname not in seen:
  seen.add(hostname);args+=['--add-host',hostname+':'+socket.gethostbyname(hostname)]
ca=os.environ.get('SSL_CERT_FILE') or ssl.get_default_verify_paths().cafile
if ca and pathlib.Path(ca).is_file():args+=['--secret','id=build_ca,src='+ca]
args+=['-t','hankan-operations:local','.'];env=os.environ.copy();env.setdefault('DOCKER_CONFIG','/tmp/hankan-docker-config')
raise SystemExit(subprocess.run(args,env=env).returncode)
