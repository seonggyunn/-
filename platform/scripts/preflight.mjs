import{existsSync}from'node:fs';import{loadEnvFile}from'node:process';
if(existsSync('.env.local'))loadEnvFile('.env.local');
const checks={node24:Number(process.versions.node.split('.')[0])===24,productionBuild:existsSync('.next/standalone/server.js'),chromium:existsSync(process.env.CHROMIUM_PATH||'/usr/bin/chromium'),publicHttps:Boolean(process.env.APP_URL?.startsWith('https://')),postgresConfigured:Boolean(process.env.DATABASE_URL),mailConfigured:Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),adminProvisioned:existsSync('.data/initial-admin.json')};
console.log(JSON.stringify({checks,credentialsPrinted:false,remoteConnectionsVerified:false},null,2));
if(process.argv.includes('--production')&&Object.values(checks).some(x=>!x))process.exitCode=1;
