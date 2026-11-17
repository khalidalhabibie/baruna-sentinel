import {isConfigured,response} from './_lib/pilot-service.js';
export default function handler(req,res){
 if(req.method!=='GET')return response(res,405,{ok:false,error:'GET only'});
 return response(res,200,{schema:'baruna-aoi-service-status-v1',backendConfigured:isConfigured(),
  storage:'Upstash Redis REST (single-operator pilot)',requiresOperatorToken:true,
  registrationMode:isConfigured()?'OPERATOR_ONLY':'BROWSER_LOCAL_ONLY',
  currentScope:'Semarang Coastal',riskRankingAvailable:false,realTimeMonitoringAvailable:false});
}