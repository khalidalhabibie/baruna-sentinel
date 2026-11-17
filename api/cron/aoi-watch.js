import {isConfigured,authorize,redisFromEnv,listAois,monitorAoi,response} from '../_lib/pilot-service.js';
/** Daily UTC Vercel Cron: source catalogue checks only, no on-asset deformation. */
export default async function handler(req,res){
 if(req.method!=='GET')return response(res,405,{ok:false,error:'GET only'},{Allow:'GET'});
 if(!isConfigured()||!process.env.CRON_SECRET||process.env.CRON_SECRET.length<32)
  return response(res,200,{ok:true,skipped:true,reason:'BACKEND_NOT_CONFIGURED'});
 if(!authorize(req,process.env,true))return response(res,401,{ok:false,error:'Not authorized'});
 try{
  const redis=redisFromEnv();const records=await listAois(redis);
  const outcomes=[];
  for(const item of records){
   try{const result=await monitorAoi(redis,item.id);outcomes.push({id:item.id,skipped:result.skipped,newScenes:result.change?.newTotal||0});}
   catch(e){outcomes.push({id:item.id,error:'MONITOR_ERROR'});}
  }
  return response(res,outcomes.some(x=>x.error)?207:200,{ok:!outcomes.some(x=>x.error),count:outcomes.length,outcomes});
 }catch(e){return response(res,503,{ok:false,error:'Scheduled source check failed; old evidence unchanged'});}
}