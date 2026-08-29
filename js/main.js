const jobs = [
  {id:"pizza-maker-db",title:"Pizza Maker",brand:"DoughBros",location:"Mount Gambier Marketplace",type:"Full-time / Part-time",summary:"Hand-stretch, top and bake our slow-rise pizzas at pace.",body:"You’ll live on the make line: stretch dough, load toppings evenly, run the oven and keep tickets moving on Friday nights. Training provided."},
  {id:"kitchen-hand-pp",title:"Kitchen Hand / Prep",brand:"Paradise Pizzas",location:"205 Commercial St W",type:"Casual",summary:"Prep, wash, pack and keep the line stocked.",body:"Paradise runs hot from lunch through late. Prep veg, portion toppings, pack orders, keep boards clean."},
  {id:"foh-db",title:"Front of House / Counter",brand:"DoughBros",location:"Mount Gambier Marketplace",type:"Casual / Part-time",summary:"Take orders, run the counter, look after walk-ins.",body:"First face people see. Phone and counter orders, pickup, keep the front tidy."},
  {id:"barista-nalou",title:"Barista",brand:"Nalou Kitchen",location:"82 Commercial St W",type:"Part-time / Full-time",summary:"Long coffees, tight milk, a room that starts the day.",body:"Nalou is coffee first. Consistent shots, proper milk, morning rush. Commercial machine experience required."},
  {id:"foh-nalou",title:"Floor / Wait Staff",brand:"Nalou Kitchen",location:"82 Commercial St W",type:"Casual",summary:"Brunch floor that turns into dinner.",body:"Breakfast, lunch and selected night shifts. RSA a plus for night service."},
  {id:"cook-nalou-night",title:"Cook — Nalou by Night",brand:"Nalou Kitchen",location:"82 Commercial St W",type:"Part-time evenings",summary:"Burgers and dinner plates when the lights dim.",body:"Tuesday–Saturday nights. Grill, pass and plate. Commercial kitchen experience required."},
  {id:"driver",title:"Delivery Driver",brand:"DoughBros & Paradise",location:"Mount Gambier",type:"Casual evenings",summary:"Hot food, on time, across town.",body:"Current licence, reliable car. Bags supplied. Fuel contribution as per store policy."},
  {id:"supervisor",title:"Shift Supervisor",brand:"All brands",location:"Mount Gambier",type:"Full-time",summary:"Run a shift: people, tickets, quality and close-down.",body:"Open or close, set the pace, coach juniors, protect food quality. Path into store management."},
  {id:"store-manager",title:"Store Manager",brand:"DoughBros / Paradise",location:"Mount Gambier",type:"Full-time",summary:"P&L, people, product.",body:"Rostering, food cost, hiring, service standards. Multi-site hospitality management preferred."}
];
function $(s,r=document){return r.querySelector(s)}
function $all(s,r=document){return [...r.querySelectorAll(s)]}
function toggleNav(){const l=$(".nav-links"); if(l) l.classList.toggle("open")}
function renderJobs(filter="All"){
  const list=$("#job-list"); if(!list) return;
  const filtered=jobs.filter(j=>filter==="All"||j.brand.includes(filter)||(filter==="Group"&&j.brand==="All brands"));
  list.innerHTML=filtered.map(j=>`<button class="job" data-id="${j.id}" type="button"><div><h3>${j.title}</h3><div class="meta"><span class="pill">${j.brand}</span><span>${j.location}</span><span>${j.type}</span></div><p style="margin-top:10px;color:#6e6e73;font-size:15px">${j.summary}</p></div><span class="btn" style="pointer-events:none;padding:8px 16px;font-size:14px">Apply</span></button>`).join("");
  $all(".job",list).forEach(el=>el.addEventListener("click",()=>openJob(el.dataset.id)));
}
function openJob(id){
  const job=jobs.find(j=>j.id===id); if(!job) return;
  $("#modal-title").textContent=job.title;
  $("#modal-meta").textContent=`${job.brand} · ${job.location} · ${job.type}`;
  $("#modal-body").textContent=job.body;
  $("#job-field").value=`${job.title} — ${job.brand}`;
  $("#job-modal").classList.add("open");
  document.body.style.overflow="hidden";
}
function closeModal(){const m=$("#job-modal"); if(m) m.classList.remove("open"); document.body.style.overflow=""}
function initApplyForm(){
  const form=$("#apply-form"); if(!form) return;
  form.addEventListener("submit",e=>{
    const files=[...form.querySelectorAll('input[type="file"]')].flatMap(i=>[...i.files]);
    const total=files.reduce((n,f)=>n+f.size,0);
    if(total>10*1024*1024){
      e.preventDefault();
      alert("Please keep resume and cover letter under 10MB combined.");
    }
  });
}
function initCinematic(){
  const chapters=$all("[data-chapter]");
  if(!chapters.length) return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply=()=>{
    if(reduce.matches){
      chapters.forEach(ch=>ch.style.setProperty("--p","1"));
      return;
    }
    const vh=window.innerHeight||1;
    chapters.forEach(ch=>{
      const r=ch.getBoundingClientRect();
      const span=Math.max(ch.offsetHeight-vh,1);
      const p=Math.min(1,Math.max(0,-r.top/span));
      ch.style.setProperty("--p",p.toFixed(4));
    });
  };
  let ticking=false;
  const onScroll=()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{apply(); ticking=false});
  };
  window.addEventListener("scroll",onScroll,{passive:true});
  window.addEventListener("resize",onScroll,{passive:true});
  if(reduce.addEventListener) reduce.addEventListener("change",apply);
  apply();
}
document.addEventListener("DOMContentLoaded",()=>{
  const toggle=$(".nav-toggle"); if(toggle) toggle.addEventListener("click",toggleNav);
  renderJobs();
  $all(".filter").forEach(btn=>btn.addEventListener("click",()=>{$all(".filter").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); renderJobs(btn.dataset.filter)}));
  const backdrop=$("#job-modal"); if(backdrop) backdrop.addEventListener("click",e=>{if(e.target===backdrop) closeModal()});
  const closeBtn=$(".close"); if(closeBtn) closeBtn.addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape") closeModal()});
  initApplyForm();
  initCinematic();
});
