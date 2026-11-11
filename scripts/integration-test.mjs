// Local integration checks. Uses disposable example.invalid accounts and removes all fixtures.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac,randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const env=Object.fromEntries(readFileSync(new URL('../backend/.env',import.meta.url),'utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const key=Buffer.from(env.JWT_SECRET_KEY,'base64');
const suffix=randomUUID().slice(0,8),owner=`ec-test-${suffix}@example.invalid`,admin=`ec-admin-${suffix}@example.invalid`;
const token=(email,role='ROLE_USER',use='access')=>{const now=Math.floor(Date.now()/1000);const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),p=Buffer.from(JSON.stringify({sub:email,role,token_use:use,iat:now,exp:now+600})).toString('base64url');return `${h}.${p}.${createHmac('sha256',key).update(`${h}.${p}`).digest('base64url')}`;};
const userToken=token(owner),adminToken=token(admin,'ROLE_ADMIN');let checks=0;
async function request(port,path,{auth,method='GET',body,headers={},status=200}={}){const response=await fetch(`http://localhost:${port}/api/v1${path}`,{method,headers:{...(auth?{Authorization:`Bearer ${auth}`}:{ }),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...headers},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});const text=await response.text();assert.equal(response.status,status,`${method} ${path}: ${text}`);checks++;if(!text)return null;const data=JSON.parse(text);return data.status==='SUCCESS'?data.data:data;}
function sql(database,statement){return execFileSync('docker',['exec','-i','postgresql','sh','-c','psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1','sh',database],{input:statement,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
const batchIds=[];let fixtureAsset,fixtureMetric;
try{
 for(const email of [owner,admin])await request(8084,'/auth/register',{method:'POST',status:201,body:{firstName:'Integration',lastName:'Fixture',email,phone:'0901234567',password:`EcTest!${randomUUID()}aA1`,confirmPassword:'unused'}});
 sql('auth_service',`UPDATE users SET role='ROLE_ADMIN' WHERE email='${admin}';`);
 await request(8083,'/reports');await request(8083,'/reports/mine',{status:401});
 await request(8083,'/admin/reports',{auth:userToken,status:403});
 await request(8083,'/reports/mine',{auth:token(owner,'ROLE_USER','otp'),status:401});
 await request(8083,'/reports/mine',{auth:token(owner,'ROLE_USER','refresh'),status:401});
 const watch=await request(8083,'/watch-areas',{auth:userToken,method:'POST',body:{name:'Integration fixture',latitude:16.0544,longitude:108.2022,radiusKm:1}});assert.ok(watch.length);
 const payload={reportType:'FLOOD',reportDescription:'Integration fixture — temporary test',latitude:16.0544,longitude:108.2022,addressText:'Integration fixture',eventStartTime:new Date(Date.now()-60000).toISOString(),details:{estimatedDepthCm:30}};
 const send=async(payload,key)=>{const body=new FormData();body.append('request',new Blob([JSON.stringify(payload)],{type:'application/json'}));return request(8083,'/reports',{auth:userToken,method:'POST',body,headers:{'Idempotency-Key':key}});};
 const idempotency=randomUUID();const first=await send(payload,idempotency),duplicate=await send(payload,idempotency);assert.equal(first.id,duplicate.id);assert.equal(first.incident_state,'ACTIVE');assert.equal(first.event_end_time,null);
 const mine=await request(8083,'/reports/mine',{auth:userToken});assert.equal(mine.total,1);
 const verified=await request(8083,`/admin/reports/${first.id}`,{auth:adminToken,method:'PATCH',body:{status:'VERIFIED',state:'ACTIVE',note:'Integration fixture verified',version:first.version}});assert.equal(verified.status,'VERIFIED');
 await request(8083,`/admin/reports/${first.id}`,{auth:adminToken,method:'PATCH',body:{status:'VERIFIED',state:'RESOLVED',note:'Stale write must fail',version:first.version},status:409});
 const notifications=await request(8083,'/notifications',{auth:userToken});assert.ok(notifications.some(item=>item.report_id===first.id));
 const contribution=new FormData();contribution.append('note','Integration fixture community update');await request(8083,`/reports/${first.id}/updates`,{auth:userToken,method:'POST',body:contribution});
 const resolved=await request(8083,`/admin/reports/${first.id}`,{auth:adminToken,method:'PATCH',body:{status:'VERIFIED',state:'RESOLVED',note:'Integration fixture resolved',version:verified.version}});assert.ok(resolved.event_end_time);assert.equal(resolved.status,'VERIFIED');
 const active=await request(8083,'/reports?state=ACTIVE');assert.ok(!active.items.some(item=>item.id===first.id));
 const second=await send(payload,randomUUID());await request(8083,`/admin/reports/${second.id}`,{auth:adminToken,method:'PATCH',body:{mergedInto:first.id,note:'Integration fixture duplicate',version:second.version}});
 const merged=await request(8083,`/reports/${second.id}`);assert.equal(merged.merged_into,first.id);
 const catalog=await request(8082,'/metric/catalog');assert.ok(catalog.assets.length);const asset=catalog.assets[0];const metrics=await request(8082,`/metric/by-asset/${asset.id}`);const metric=metrics[0];
 const csv=`assetId,metricId,recordTime,value,unit\n${asset.id},${metric.id},2099-01-01T00:00:00,1,WRONG_UNIT\n`;
 const form=new FormData();form.append('file',new Blob([csv],{type:'text/csv'}),'fixture.csv');form.append('source','Integration fixture only');
 const preview=await request(8081,'/admin/data-imports/preview',{auth:adminToken,method:'POST',body:form});batchIds.push(preview.id);assert.equal(preview.valid,false);
 await request(8081,`/admin/data-imports/${preview.id}/commit`,{auth:adminToken,method:'POST',status:400});
 await request(8081,'/admin/data-imports',{auth:userToken,status:403});
 fixtureAsset=Number(sql('collector_data_service',`INSERT INTO assets(name,asset_type) VALUES ('Integration fixture ${suffix}','TEST') RETURNING id;`).match(/\n\s*(\d+)\s*\n/)?.[1]);
 fixtureMetric=Number(sql('collector_data_service',`INSERT INTO metrics(name,category,unit) VALUES ('Integration fixture ${suffix}','TEST','test-unit') RETURNING id;`).match(/\n\s*(\d+)\s*\n/)?.[1]);
 assert.ok(fixtureAsset && fixtureMetric);
 const validForm=new FormData();validForm.append('source','Integration fixture — removed after test');validForm.append('file',new Blob([`assetId,metricId,recordTime,value,unit\n${fixtureAsset},${fixtureMetric},2020-01-01T00:00:00,12.5,test-unit\n`],{type:'text/csv'}),'valid-fixture.csv');
 const valid=await request(8081,'/admin/data-imports/preview',{auth:adminToken,method:'POST',body:validForm});assert.equal(valid.valid,true);batchIds.push(valid.id);
 const committed=await request(8081,`/admin/data-imports/${valid.id}/commit`,{auth:adminToken,method:'POST'});assert.equal(committed.inserted,1);
 const retried=await request(8081,`/admin/data-imports/${valid.id}/commit`,{auth:adminToken,method:'POST'});assert.equal(retried.inserted,1);
 console.log(`PASS: ${checks} HTTP checks; create/retry, ownership, token purpose, moderator access, optimistic locking, merge, notifications, resolution, catalog and CSV validation.`);
} finally {
 sql('citizen_report_service',`DELETE FROM incident_notifications WHERE owner_email IN ('${owner}','${admin}') OR report_id IN (SELECT id FROM reports WHERE owner_email='${owner}'); DELETE FROM incident_events WHERE report_id IN (SELECT id FROM reports WHERE owner_email='${owner}'); UPDATE reports SET merged_into=NULL WHERE owner_email='${owner}'; DELETE FROM reports WHERE owner_email='${owner}'; DELETE FROM watch_areas WHERE owner_email IN ('${owner}','${admin}');`);
 sql('collector_data_service',`DELETE FROM data_import_batches WHERE owner_email IN ('${owner}','${admin}');`);
 if(fixtureAsset)sql('collector_data_service',`DELETE FROM observations WHERE asset_id=${fixtureAsset};DELETE FROM assets WHERE id=${fixtureAsset};`);
 if(fixtureMetric)sql('collector_data_service',`DELETE FROM metrics WHERE id=${fixtureMetric};`);
 sql('auth_service',`DELETE FROM users WHERE email IN ('${owner}','${admin}');`);
 console.log('Removed disposable integration fixtures.');
}
