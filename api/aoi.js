import {isConfigured,authorize,redisFromEnv,listAois,upsertAoi,deleteAoi,getHistory,readBody,response,fail} from './_lib/pilot-service.js';
export default async function handler(req,res){
 if(req.method==='OPTIONS')return response(res,405,{ok:false,error:'CORS tidak diaktifkan untuk API privat.'},{Allow:'GET, POST, DELETE'});
 if(!isConfigured())return response(res,503,{ok:false,error:'Cloud AOI belum dikonfigurasi; data lokal tetap tersedia.'});
 if(!authorize(req))return response(res,401,{ok:false,error:'Token operator tidak valid.'},{'WWW-Authenticate':'Bearer realm="baruna-aoi"'});
 try{
  const redis=redisFromEnv();
  if(req.method==='GET'){
   const url=new URL(req.url,'https://sentinel.ourdo.id');
   const id=url.searchParams.get('history');
   if(id){const records=await listAois(redis);if(!records.some(x=>x.id===id))return response(res,404,{ok:false,error:'AOI tidak ditemukan'});
    return response(res,200,{ok:true,history:await getHistory(redis,id)});}
   return response(res,200,{ok:true,records:await listAois(redis)});
  }
  if(req.method==='POST')return response(res,201,{ok:true,record:await upsertAoi(redis,await readBody(req))});
  if(req.method==='DELETE'){
   const id=new URL(req.url,'https://sentinel.ourdo.id').searchParams.get('id');
   return response(res,200,{ok:true,deleted:await deleteAoi(redis,id)});
  }
  return response(res,405,{ok:false,error:'Method tidak didukung'},{Allow:'GET, POST, DELETE'});
 }catch(e){return fail(res,e);}
}