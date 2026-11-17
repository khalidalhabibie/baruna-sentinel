import {isConfigured,authorize,redisFromEnv,monitorAoi,readBody,response,fail} from './_lib/pilot-service.js';
export default async function handler(req,res){
 if(!isConfigured())return response(res,503,{ok:false,error:'Cloud AOI belum dikonfigurasi.'});
 if(!authorize(req))return response(res,401,{ok:false,error:'Token operator tidak valid.'});
 if(req.method!=='POST')return response(res,405,{ok:false,error:'POST diperlukan'},{Allow:'POST'});
 try{
  const body=await readBody(req);
  const result=await monitorAoi(redisFromEnv(),body.id);
  return response(res,200,{ok:true,record:result.item,monitorEvent:result.event||null,change:result.change,skipped:result.skipped});
 }catch(e){return fail(res,e);}
}