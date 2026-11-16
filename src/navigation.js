/* BARUNA product navigation. Route workspaces without conflating independent datasets. */
(function(){
  "use strict";
  const PAGES=new Set(["why","guide","projects","overview","detail","assessment","compare","analyst"]);
  const LABELS={why:"Workspace",guide:"Panduan",projects:"Projects",overview:"Overview",detail:"Project detail",assessment:"Inspection assessment",compare:"Evidence compare",analyst:"GNSS Lab"};
  const $=id=>document.getElementById(id);
  const pageFromLegacy=view=>view==="analyst"?"analyst":"detail";
  let selectedProject="semarang-port";

  function readRoute(){
    const query=new URLSearchParams(window.location.search);
    const desired=query.get("page")||(query.get("view")==="analyst"?"analyst":"why");
    return {page:PAGES.has(desired)?desired:"why",project:query.get("project")||"semarang-port"};
  }
  function setPage(page,{updateUrl=false,scroll=false,replace=false}={}){
    if(!PAGES.has(page))return false;
    const legacyView=page==="analyst"?"analyst":"decision";
    document.body.dataset.page=page;
    document.body.dataset.view=legacyView;
    document.body.dataset.project=selectedProject;
    for(const button of document.querySelectorAll("[data-pw-page]")){
      const active=button.dataset.pwPage===page;
      if(button.tagName==="BUTTON"){
        button.setAttribute("aria-current",active?"page":"false");
        if(button.id==="view-decision"||button.id==="view-analyst")button.setAttribute("aria-pressed",String(active));
      }
    }
    const select=$("pw-project-switch");
    if(select&&Array.from(select.options).some(o=>o.value===selectedProject))select.value=selectedProject;
    document.title="BARUNA Sentinel | "+LABELS[page];
    if(updateUrl){
      const url=new URL(window.location.href);
      url.searchParams.delete("view");
      if(page==="why")url.searchParams.delete("page");
      else url.searchParams.set("page",page);
      if(selectedProject==="semarang-port")url.searchParams.delete("project");
      else url.searchParams.set("project",selectedProject);
      const method=replace?"replaceState":"pushState";
      window.history[method]({page,project:selectedProject},"",url.pathname+url.search);
    }
    window.dispatchEvent(new CustomEvent("baruna:pagechange",{detail:{page,project:selectedProject}}));
    window.dispatchEvent(new CustomEvent("baruna:viewchange",{detail:{view:legacyView}}));
    if(scroll){
      const target=page==="detail"?$("pw-page-detail"):
        page==="analyst"?$("pw-shell"):$("pw-shell");
      (target||$("top"))?.scrollIntoView({behavior:"smooth",block:"start"});
    }
    const live=$("live-region");
    if(live)live.textContent=LABELS[page]+" opened for "+selectedProject+".";
    return true;
  }
  function selectProject(id,{page="overview",updateUrl=true,scroll=true}={}){
    if(typeof id!=="string"||!/^(semarang-port|csem-history|bako-observations|draft-[a-zA-Z0-9-]+)$/.test(id))return false;
    selectedProject=id;
    return setPage(PAGES.has(page)?page:"overview",{updateUrl,scroll});
  }
  function setView(view,options={}){
    return setPage(pageFromLegacy(view),options);
  }
  function init(){
    const {page,project}=readRoute();
    if(/^(semarang-port|csem-history|bako-observations|draft-[a-zA-Z0-9-]+)$/.test(project))selectedProject=project;
    document.addEventListener("click",event=>{
      const pageTarget=event.target.closest("[data-pw-page]");
      if(pageTarget){
        event.preventDefault();
        setPage(pageTarget.dataset.pwPage,{updateUrl:true,scroll:true});
        return;
      }
      const projectTarget=event.target.closest("[data-pw-open]");
      if(projectTarget){
        event.preventDefault();
        selectProject(projectTarget.dataset.pwOpen);
        return;
      }
      const legacyTarget=event.target.closest("[data-switch-view]");
      if(legacyTarget){
        event.preventDefault();
        setView(legacyTarget.dataset.switchView,{updateUrl:true,scroll:true});
      }
    });
    $("pw-project-switch")?.addEventListener("change",event=>selectProject(event.target.value));
    window.addEventListener("popstate",()=>{
      const next=readRoute();
      selectedProject=next.project;
      setPage(next.page,{updateUrl:false,scroll:false});
    });
    setPage(page);
  }
  window.BarunaNavigation=Object.freeze({
    setPage,selectProject,setView,
    getPage:()=>document.body.dataset.page,
    getProject:()=>selectedProject
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
