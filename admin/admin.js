const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let supabase = null;
let session = null;
let jobs = [];
let media = [];
let config = null;

const loginPanel = $("#login-panel");
const appPanel = $("#app-panel");
const who = $("#who");
const signOut = $("#sign-out");
const loginStatus = $("#login-status");
const editorStatus = $("#editor-status");

function setStatus(el, message, kind = "") {
  if (!el) return;
  el.textContent = message || "";
  el.className = `admin-status ${kind}`.trim();
}

function authHeaders() {
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function loadConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Could not load admin config.");
  config = await res.json();
  supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

function showLoggedOut() {
  loginPanel.hidden = false;
  appPanel.hidden = true;
  who.hidden = true;
  signOut.hidden = true;
}

function showLoggedIn(email) {
  loginPanel.hidden = true;
  appPanel.hidden = false;
  who.hidden = false;
  signOut.hidden = false;
  who.textContent = email;
}

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  if (!session) {
    showLoggedOut();
    return false;
  }
  try {
    const me = await api("/api/admin/session");
    showLoggedIn(me.email);
    return true;
  } catch (err) {
    setStatus(loginStatus, err.message, "err");
    showLoggedOut();
    return false;
  }
}

async function loadJobs() {
  const data = await api("/api/admin/jobs");
  jobs = data.jobs || [];
  renderJobs();
}

async function loadMedia() {
  const data = await api("/api/admin/media");
  media = data.media || [];
  renderMedia();
}

function renderJobs() {
  const list = $("#job-admin-list");
  if (!jobs.length) {
    list.innerHTML = `<p class="admin-hint">No jobs yet. Create one.</p>`;
    return;
  }
  list.innerHTML = jobs.map((job, index) => `
    <article class="admin-job ${job.active ? "" : "archived"}" data-id="${job.id}">
      <div class="admin-sort">
        <button type="button" data-move="-1" ${index === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
        <button type="button" data-move="1" ${index === jobs.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
      </div>
      <div>
        <h3>${escapeHtml(job.title)}</h3>
        <div class="meta">
          <span class="pill">${escapeHtml(job.brand)}</span>
          <span>${escapeHtml(job.location_label || "")}</span>
          <span>${escapeHtml(job.employment_type || "")}</span>
          <span>${job.active ? "Live" : "Archived"}</span>
        </div>
      </div>
      <div class="admin-actions">
        <button type="button" data-edit>Edit</button>
        <button type="button" data-archive>${job.active ? "Archive" : "Unarchive"}</button>
      </div>
    </article>
  `).join("");

  $$(".admin-job", list).forEach((el) => {
    const id = el.dataset.id;
    el.querySelector("[data-edit]").addEventListener("click", () => openEditor(jobs.find((j) => j.id === id)));
    el.querySelector("[data-archive]").addEventListener("click", () => toggleArchive(id));
    $$("[data-move]", el).forEach((btn) => {
      btn.addEventListener("click", () => moveJob(id, Number(btn.dataset.move)));
    });
  });
}

function mediaSrc(item) {
  const url = item.public_url || "";
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/${url.replace(/^\/+/, "")}`;
}

function renderMedia() {
  const list = $("#media-admin-list");
  list.innerHTML = media.map((item) => `
    <article class="admin-media" data-slot="${escapeHtml(item.slot_key)}">
      <img src="${escapeHtml(mediaSrc(item))}" alt="${escapeHtml(item.title || item.slot_key)}" />
      <form>
        <div class="slot">${escapeHtml(item.slot_key)}</div>
        <h3>${escapeHtml(item.title || item.slot_key)}</h3>
        <label>Replace image
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        </label>
        <button class="btn" type="submit">Upload</button>
        <p class="admin-status" data-status></p>
      </form>
    </article>
  `).join("");

  $$(".admin-media", list).forEach((card) => {
    const form = $("form", card);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = form.querySelector('input[type="file"]').files[0];
      const status = $("[data-status]", card);
      if (!file) {
        setStatus(status, "Choose a file first.", "err");
        return;
      }
      const body = new FormData();
      body.append("slot_key", card.dataset.slot);
      body.append("title", $("h3", card).textContent);
      body.append("file", file);
      setStatus(status, "Uploading…");
      try {
        const data = await api("/api/admin/media", { method: "POST", body });
        const img = $("img", card);
        img.src = `${data.media.public_url}?t=${Date.now()}`;
        setStatus(status, "Updated. Public pages will show this on the next load.", "ok");
      } catch (err) {
        setStatus(status, err.message, "err");
      }
    });
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function openEditor(job) {
  $("#editor-title").textContent = job ? "Edit job" : "New job";
  $("#job-id").value = job?.id || "";
  $("#job-title").value = job?.title || "";
  $("#job-store").value = job?.store || "doughbros";
  $("#job-type").value = job?.employment_type || "";
  $("#job-location").value = job?.location_label || "";
  $("#job-description").value = job?.description || "";
  $("#job-active").checked = job ? !!job.active : true;
  setStatus(editorStatus, "");
  $("#job-editor").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeEditor() {
  $("#job-editor").classList.remove("open");
  document.body.style.overflow = "";
}

async function toggleArchive(id) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  await api(`/api/admin/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify({ active: !job.active }),
  });
  await loadJobs();
}

async function moveJob(id, delta) {
  const index = jobs.findIndex((j) => j.id === id);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= jobs.length) return;
  const ids = jobs.map((j) => j.id);
  const [moved] = ids.splice(index, 1);
  ids.splice(next, 0, moved);
  await api("/api/admin/jobs/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
  await loadJobs();
}

$$(".admin-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".admin-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $("#tab-jobs").hidden = btn.dataset.tab !== "jobs";
    $("#tab-media").hidden = btn.dataset.tab !== "media";
  });
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("#login-email").value.trim().toLowerCase();
  const domain = config?.adminEmailDomain || "lnmd.com.au";
  if (!email.endsWith(`@${domain}`)) {
    setStatus(loginStatus, `Use a @${domain} email.`, "err");
    return;
  }
  setStatus(loginStatus, "Sending link…");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/admin/` },
  });
  if (error) {
    setStatus(loginStatus, error.message, "err");
    return;
  }
  setStatus(loginStatus, "Check your inbox for the magic link.", "ok");
});

$("#sign-out").addEventListener("click", async () => {
  await supabase.auth.signOut();
  session = null;
  showLoggedOut();
});

$("#new-job").addEventListener("click", () => openEditor(null));
$(".close", $("#job-editor")).addEventListener("click", closeEditor);
$("#job-editor").addEventListener("click", (event) => {
  if (event.target.id === "job-editor") closeEditor();
});

$("#job-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#job-id").value;
  const payload = {
    title: $("#job-title").value.trim(),
    store: $("#job-store").value,
    employment_type: $("#job-type").value.trim(),
    location_label: $("#job-location").value.trim(),
    description: $("#job-description").value.trim(),
    active: $("#job-active").checked,
  };
  setStatus(editorStatus, "Saving…");
  try {
    if (id) {
      await api(`/api/admin/jobs/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/api/admin/jobs", { method: "POST", body: JSON.stringify(payload) });
    }
    closeEditor();
    await loadJobs();
  } catch (err) {
    setStatus(editorStatus, err.message, "err");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadConfig();
  } catch (err) {
    setStatus(loginStatus, err.message, "err");
    return;
  }
  supabase.auth.onAuthStateChange(async (_event, next) => {
    session = next;
    if (next && appPanel.hidden) {
      const ok = await refreshSession();
      if (ok) {
        await loadJobs();
        await loadMedia();
      }
    }
  });
  const ok = await refreshSession();
  if (ok) {
    await loadJobs();
    await loadMedia();
  }
});
