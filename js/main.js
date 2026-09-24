// DTLL Group site script. Careers: live CMS jobs, deep links, apply form. Showcase: cinematic scroll + CMS media slots.
const fallbackJobs = [
  {id:"db-driver",title:"Delivery Driver",store:"doughbros",location:"Mount Gambier Marketplace",type:"Casual / Part-time",description:"Evenings, 4–9pm. Get hot food to Mount Gambier on time, every time.\n\nWhat you need\n- Own reliable car and current driver’s licence\n- Availability 4–9pm during evening trade"},
  {id:"db-kitchen",title:"Kitchen Crew",store:"doughbros",location:"Mount Gambier Marketplace",type:"Casual / Part-time",description:"Pizza, prep and the line. Training provided."},
  {id:"pp-driver",title:"Delivery Driver",store:"paradise",location:"205 Commercial St W",type:"Casual / Part-time",description:"Evenings, 4–9pm. Deliver Paradise across Mount Gambier."},
  {id:"nk-chef",title:"Chef — Full-time",store:"nalou",location:"82 Commercial St W",type:"Full-time",description:"Run service across Nalou by day and Nalou by Night."}
];
const BRAND = {doughbros:"DoughBros", paradise:"Paradise", nalou:"Nalou", all:"All brands"};
const BRAND_FULL = {doughbros:"DoughBros", paradise:"Paradise Pizzas", nalou:"Nalou Kitchen", all:"DTLL Group / any"};
const BRAND_ALIASES = {doughbros:"doughbros", db:"doughbros", dough:"doughbros", paradise:"paradise", pp:"paradise", nalou:"nalou", nk:"nalou", group:"all", all:"all"};
// Preview hosts (not the Worker) read the live API cross-origin.
const API_BASE = /(^|\.)dtll\.org$|workers\.dev$|^localhost$|^127\./.test(location.hostname) ? "" : "https://dtll.org";

let jobs = [];
let jobsReady = false;
let lastFocus = null;
const generalJob = {id:"general",title:"General application",store:"all",location:"Mount Gambier",type:"",description:"Don’t see the right title? Send a general application across Dough Bros, Paradise Pizzas and Nalou Kitchen and we’ll route it to the right venue."};

function $(s,r=document){return r.querySelector(s)}
function $all(s,r=document){return [...r.querySelectorAll(s)]}
function escapeHtml(value){
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function slugify(s){return String(s||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function jobSlug(j){return slugify(`${j.store==="all"?"group":j.store}-${j.title.split(/[—–(/]/)[0]}`)}
function toggleNav(){
  const l=$(".nav-links"), b=$(".nav-toggle"); if(!l) return;
  const open=l.classList.toggle("open"); if(b) b.setAttribute("aria-expanded", String(open));
}

// ---------- Description parsing ----------
const HEADING_RE = /^(what you[’']?ll do|what you need|what we offer|what you get|the role|about (the role|you|us)|perks|requirements|responsibilities|you[’']?ll need|nice to have)\s*:?\s*$/i;
function parseDescription(text){
  const lines = String(text||"").replace(/\r/g,"").split("\n").map(l=>l.trim());
  const blocks = []; let cur = {heading:null, items:[], paras:[]};
  const push = () => { if(cur.heading || cur.items.length || cur.paras.length) blocks.push(cur); };
  for(const line of lines){
    if(!line) continue;
    if(HEADING_RE.test(line) || (/:$/.test(line) && line.length < 40)){ push(); cur = {heading:line.replace(/:$/,""), items:[], paras:[]}; continue; }
    const bullet = /^[-•*·]\s*/.test(line);
    const clean = line.replace(/^[-•*·]\s*/,"");
    if(cur.heading || bullet) cur.items.push(clean); else cur.paras.push(clean);
  }
  push();
  return blocks;
}
function summaryOf(job){
  const blocks = parseDescription(job.description || job.body || job.summary);
  const intro = blocks.find(b=>!b.heading && b.paras.length);
  if(intro) return intro.paras.map(p=>/[.!?…]$/.test(p)?p:p+".").join(" ");
  const first = blocks[0]; return first ? (first.items[0] || "") : "";
}
function descriptionHtml(job){
  const blocks = parseDescription(job.description || job.body || job.summary);
  return blocks.map(b => `${b.heading?`<h4>${escapeHtml(b.heading)}</h4>`:""}${b.paras.map(p=>`<p>${escapeHtml(p)}</p>`).join("")}${b.items.length?`<ul>${b.items.map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul>`:""}`).join("");
}

// ---------- Jobs ----------
function mapJob(j){
  const store = BRAND[j.store] ? j.store : "all";
  const description = j.description || [j.summary, j.body].filter(Boolean).join("\n\n");
  return {id:j.id, title:j.title, store, brand:BRAND[store], location:j.location || j.location_label || "", type:j.type || j.employment_type || "", description};
}
function matchesFilter(job, filter){
  if(filter==="All") return true;
  if(filter==="Group") return job.store==="all";
  return BRAND[job.store]===filter || job.store==="all";
}
function isDriver(job){return /driver|delivery/i.test(job.title)}
function renderJobs(filter="All"){
  const list=$("#job-list"); if(!list) return;
  if(!jobsReady){ list.innerHTML = '<div class="job-skel"></div><div class="job-skel"></div><div class="job-skel"></div>'; return; }
  const filtered=jobs.filter(j=>matchesFilter(j, filter));
  if(!filtered.length){ list.innerHTML='<p class="job-empty">No open roles here right now. Send a general application below — we keep good people on file.</p>'; return; }
  list.innerHTML=filtered.map((j,i)=>`<button class="job" data-id="${escapeHtml(j.id)}" data-store="${escapeHtml(j.store)}" type="button" aria-label="${escapeHtml(j.title)} at ${escapeHtml(BRAND_FULL[j.store])} — view and apply">
    <div class="job-top"><span class="job-brand">${escapeHtml(j.store==="all"?"DTLL Group":BRAND_FULL[j.store])}</span>${i<4 && filter==="All" && j.store!=="all"?'<span class="job-hot">Hiring now</span>':""}</div>
    <h3>${escapeHtml(j.title)}</h3>
    <div class="meta"><span>${escapeHtml(j.type)}</span><span>${escapeHtml(j.location)}</span></div>
    <p class="job-sum">${escapeHtml(summaryOf(j))}</p>
    <span class="job-cta">View &amp; apply →</span></button>`).join("");
  $all(".job",list).forEach(el=>el.addEventListener("click",()=>openJob(el.dataset.id, true)));
}
function setFilter(filter){
  $all(".filter").forEach(b=>{const on=b.dataset.filter===filter; b.classList.toggle("active",on); b.setAttribute("aria-selected",String(on));});
  renderJobs(filter);
}
function findJob(id){ if(!id || id==="general") return generalJob; return jobs.find(j=>j.id===id) || generalJob; }

// Resolve ?role=driver&brand=paradise, ?role=paradise-delivery-driver, #role-slug.
function resolveDeepLink(){
  const q = new URLSearchParams(location.search);
  const brandRaw = (q.get("brand")||q.get("venue")||"").toLowerCase();
  const brand = BRAND_ALIASES[brandRaw] || "";
  let role = (q.get("role")||q.get("job")||decodeURIComponent(location.hash.replace(/^#/,""))||"").toLowerCase();
  if(role==="roles") role="";
  return {brand, role};
}
function findByDeepLink({brand, role}){
  if(!role) return null;
  const direct = jobs.find(j=>j.id===role || jobSlug(j)===role);
  if(direct) return direct;
  const words = slugify(role).split("-").filter(w=>w && !BRAND_ALIASES[w]);
  const brandFromRole = slugify(role).split("-").map(w=>BRAND_ALIASES[w]).find(Boolean);
  const b = brand || brandFromRole || "";
  const pool = jobs.filter(j=>!b || j.store===b);
  const score = j => words.reduce((n,w)=>n + (slugify(j.title).includes(w.replace(/s$/,""))?1:0),0);
  const best = pool.map(j=>[score(j),j]).filter(([s])=>s>0).sort((a,c)=>c[0]-a[0])[0];
  return best ? best[1] : null;
}

// ---------- Modal + form ----------
function openJob(id, updateUrl){
  const job = typeof id === "object" ? id : findJob(id);
  lastFocus = document.activeElement;
  $("#modal-brand").textContent = job.store==="all" ? "DTLL Group" : BRAND_FULL[job.store];
  $("#modal-title").textContent = job.title;
  $("#modal-meta").textContent = [job.type, job.location].filter(Boolean).join(" · ");
  $("#modal-body").innerHTML = descriptionHtml(job);
  $("#job-field").value = `${job.title} — ${BRAND_FULL[job.store]}`;
  const subj = $("#subject-field"); if(subj) subj.value = `New application — ${job.title} (${BRAND_FULL[job.store]})`;
  const brandSel = $("#brand-field"); if(brandSel) brandSel.value = BRAND_FULL[job.store];
  const dc = $("#driver-check"); if(dc){ const d = isDriver(job); dc.hidden = !d; dc.querySelector("input").required = d; }
  const m = $("#job-modal"); m.classList.add("open"); m.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>{ const c=$(".close", m); if(c) c.focus(); }, 30);
  if(updateUrl && job.id!=="general" && history.replaceState){
    const u = new URL(location.href); u.search = ""; u.searchParams.set("role", jobSlug(job)); u.hash="";
    history.replaceState(null, "", u.pathname + u.search);
  }
  $("#job-modal").dataset.slug = job.id==="general" ? "" : jobSlug(job);
}
function closeModal(){
  const m=$("#job-modal"); if(!m || !m.classList.contains("open")) return;
  m.classList.remove("open"); m.setAttribute("aria-hidden","true"); document.body.style.overflow="";
  if(history.replaceState && /[?&]role=/.test(location.search)){ const u=new URL(location.href); u.searchParams.delete("role"); history.replaceState(null,"",u.pathname+(u.search||"")); }
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}
function trapFocus(e){
  const m=$("#job-modal"); if(!m || !m.classList.contains("open") || e.key!=="Tab") return;
  const f=$all('button,input:not([type="hidden"]):not(.hp),select,textarea,a[href]',m).filter(el=>!el.closest("[hidden]"));
  if(!f.length) return; const first=f[0], last=f[f.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault(); last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault(); first.focus();}
}
function initApplyForm(){
  const form=$("#apply-form"); if(!form) return;
  const q=new URLSearchParams(location.search);
  const src=[q.get("utm_source"),q.get("utm_medium"),q.get("utm_campaign"),q.get("ref")].filter(Boolean).join(" / ") || (document.referrer ? new URL(document.referrer).hostname : "direct");
  const sf=$("#source-field"); if(sf) sf.value=src;
  const nf=$("#next-field"); if(nf && API_BASE==="") nf.value = `${location.origin}/careers?applied=1`;
  form.addEventListener("submit",e=>{
    const files=[...form.querySelectorAll('input[type="file"]')].flatMap(i=>[...i.files]);
    const total=files.reduce((n,f)=>n+f.size,0);
    if(total>10*1024*1024){ e.preventDefault(); alert("Please keep your files under 10MB combined."); return; }
    const btn=$("#submit-btn"); if(btn){ btn.disabled=true; btn.textContent="Sending…"; }
  });
  const copy=$("#copy-link");
  if(copy) copy.addEventListener("click", async ()=>{
    const slug=$("#job-modal").dataset.slug; const url=`https://dtll.org/careers${slug?`?role=${slug}`:""}`;
    try{ await navigator.clipboard.writeText(url); copy.textContent="Link copied — send it to a mate"; }
    catch(_){ copy.textContent=url; }
    setTimeout(()=>{copy.textContent="Copy link to this role"},2600);
  });
}
function initAppliedBanner(){
  const b=$("#applied-banner"); if(!b) return;
  if(new URLSearchParams(location.search).get("applied")==="1"){ b.hidden=false; if(history.replaceState) history.replaceState(null,"",location.pathname); }
  const c=$(".applied-close",b); if(c) c.addEventListener("click",()=>{b.hidden=true});
}
async function loadLiveJobs(){
  if(!$("#job-list")) return;
  try{
    const res=await fetch(`${API_BASE}/api/jobs`,{cache:"no-store",headers:{accept:"application/json"}});
    if(!res.ok) throw new Error("jobs");
    const data=await res.json();
    if(!Array.isArray(data.jobs)) throw new Error("jobs");
    jobs=data.jobs.map(mapJob);
  }catch(_err){
    jobs=fallbackJobs.map(mapJob);
  }
  jobsReady=true;
  const count=$("#role-count"); if(count && jobs.length) count.textContent = `See ${jobs.length} open role${jobs.length===1?"":"s"}`;
  const ticker=$("#ticker");
  if(ticker && jobs.length){ const names=[...new Set(jobs.map(j=>`${j.title.split(/ — | \/ /)[0]} · ${j.store==="all"?"Group":BRAND[j.store]}`))]; const row=names.map(n=>`<span>${escapeHtml(n)}</span>`).join(""); ticker.innerHTML=row+row; }
  const link=resolveDeepLink();
  const filter = link.brand ? (link.brand==="all"?"Group":BRAND[link.brand]) : "All";
  setFilter(filter);
  const job=findByDeepLink(link);
  if(job) openJob(job, false);
  else if(link.role && link.role!=="general") { const r=$("#roles"); if(r) r.scrollIntoView(); }
}

// ---------- Home hiring band (live roles) ----------
async function loadHomeRoles(){
  const box=$("#home-roles"); if(!box) return;
  try{
    const res=await fetch(`${API_BASE}/api/jobs`,{cache:"no-store",headers:{accept:"application/json"}});
    if(!res.ok) return;
    const data=await res.json(); if(!Array.isArray(data.jobs)) return;
    const list=data.jobs.map(mapJob).filter(j=>j.store!=="all").slice(0,4);
    if(!list.length) return;
    box.innerHTML=list.map(j=>`<a href="/careers?role=${encodeURIComponent(jobSlug(j))}"><b>${escapeHtml(j.title)}</b><span>${escapeHtml(BRAND_FULL[j.store])}</span></a>`).join("");
  }catch(_){ /* keep static roles */ }
}

// ---------- Showcase ----------
function initCinematic(){
  const chapters=$all("[data-chapter]");
  if(!chapters.length) return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply=()=>{
    if(reduce.matches){ chapters.forEach(ch=>ch.style.setProperty("--p","1")); return; }
    const vh=window.innerHeight||1;
    chapters.forEach(ch=>{
      const r=ch.getBoundingClientRect();
      const span=Math.max(ch.offsetHeight-vh,1);
      const p=Math.min(1,Math.max(0,-r.top/span));
      ch.style.setProperty("--p",p.toFixed(4));
    });
  };
  let ticking=false;
  const onScroll=()=>{ if(ticking) return; ticking=true; requestAnimationFrame(()=>{apply(); ticking=false}); };
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll,{passive:true});
  if(reduce.addEventListener) reduce.addEventListener("change",apply);
  apply();
}
function applyOverlays(slots){
  $all("[data-overlay]").forEach(el=>{
    const item=slots[el.dataset.overlay];
    if(!item) return;
    const kicker=el.querySelector("[data-overlay-kicker], .kicker, .hero-kicker");
    const title=el.querySelector("[data-overlay-title], h1.mega, h2.mega, header h1, h1");
    const body=el.querySelector("[data-overlay-body], .mega-sub, .sub");
    if(kicker && item.overlay_subtitle) kicker.textContent=item.overlay_subtitle;
    if(title && item.overlay_title) title.textContent=item.overlay_title;
    if(body && item.overlay_body) body.textContent=item.overlay_body;
  });
}
async function applyMediaSlots(){
  const slotted=$all("[data-slot]");
  const overlays=$all("[data-overlay]");
  if(!slotted.length && !overlays.length) return;
  try{
    const res=await fetch(`${API_BASE}/api/media`,{cache:"no-store",headers:{accept:"application/json"}});
    if(!res.ok) return;
    const data=await res.json();
    const slots=data.slots || {};
    slotted.forEach(img=>{
      const item=slots[img.dataset.slot];
      if(!item || !item.public_url) return;
      const next = API_BASE && item.public_url.startsWith("/") ? API_BASE + item.public_url : item.public_url;
      if(next && img.getAttribute("src")!==next) img.src=next;
    });
    applyOverlays(slots);
  }catch(_err){ /* static media + HTML copy already present */ }
}

document.addEventListener("DOMContentLoaded",()=>{
  const toggle=$(".nav-toggle"); if(toggle) toggle.addEventListener("click",toggleNav);
  $all(".nav-links a").forEach(a=>a.addEventListener("click",()=>{const l=$(".nav-links"); if(l) l.classList.remove("open")}));
  renderJobs();
  $all(".filter").forEach(btn=>btn.addEventListener("click",()=>setFilter(btn.dataset.filter)));
  $all("[data-jump]").forEach(btn=>btn.addEventListener("click",()=>{ setFilter(btn.dataset.jump); const r=$("#roles"); if(r) r.scrollIntoView({behavior:"smooth"}); }));
  $all("[data-general]").forEach(btn=>btn.addEventListener("click",()=>openJob("general")));
  const backdrop=$("#job-modal"); if(backdrop) backdrop.addEventListener("click",e=>{if(e.target===backdrop) closeModal()});
  const closeBtn=$(".modal .close"); if(closeBtn) closeBtn.addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); trapFocus(e); });
  initApplyForm();
  initAppliedBanner();
  initCinematic();
  loadLiveJobs();
  loadHomeRoles();
  applyMediaSlots();
});
