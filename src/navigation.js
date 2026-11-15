/* Standalone view navigation: works even if the GIS analysis module fails to initialize. */
(function () {
  "use strict";
  const ALLOWED = new Set(["decision", "analyst"]);
  const DISPLAY = {decision:"Evidence Review",analyst:"GNSS Analyst"};
  const $ = id => document.getElementById(id);
  function setView(view, options = {}) {
    if(!ALLOWED.has(view)) return;
    document.body.dataset.view = view;
    for(const name of ALLOWED) {
      const button=$("view-"+name);
      if(!button) continue;
      const selected=name===view;
      button.setAttribute("aria-pressed",String(selected));
      button.setAttribute("aria-current",selected?"page":"false");
    }
    document.title="BARUNA Sentinel | "+DISPLAY[view];
    window.dispatchEvent(new CustomEvent("baruna:viewchange",{detail:{view}}));
    if(options.updateUrl) {
      const url=new URL(window.location.href);
      if(view==="decision") url.searchParams.delete("view");
      else url.searchParams.set("view","analyst");
      window.history.replaceState({view}, "", url.pathname+url.search+url.hash);
    }
    if(options.scroll) {
      const target=view==="decision"?$("case-workspace"):$("analyst-intro");
      (target || $("top"))?.scrollIntoView({behavior:"smooth",block:"start"});
    }
    if($("live-region")) $("live-region").textContent =
      view==="decision"?"Evidence Review selected: choose a sector and export a verification brief.":
      "GNSS Analyst selected: independent station records, observation QC and source provenance.";
  }
  function initialView() {
    const param=new URLSearchParams(window.location.search).get("view");
    return ALLOWED.has(param)?param:"decision";
  }
  function init() {
    for(const view of ALLOWED) $("view-"+view)?.addEventListener("click",()=>setView(view,{updateUrl:true,scroll:true}));
    document.addEventListener("click",event=>{
      const target=event.target.closest("[data-switch-view]");
      if(target) setView(target.dataset.switchView,{updateUrl:true,scroll:true});
    });
    window.addEventListener("popstate",()=>setView(initialView()));
    setView(initialView());
  }
  window.BarunaNavigation=Object.freeze({setView});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
