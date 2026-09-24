import { PAGE_ORDER, SLOT_BY_KEY, SLOT_CATALOG, type SlotDef } from "./slots";

interface JobRow {
  id: string;
  title: string;
  store: "doughbros" | "paradise" | "nalou" | "all";
  location_label: string;
  employment_type: string;
  description: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface MediaRow {
  id: string;
  slot_key: string;
  title: string;
  page?: string;
  storage_path: string | null;
  public_url: string;
  overlay_title?: string;
  overlay_subtitle?: string;
  overlay_body?: string;
  sort_order?: number;
  updated_at: string;
}

interface PublicSlot {
  slot_key: string;
  page: string;
  page_label: string;
  label: string;
  title: string;
  public_url: string;
  overlay_title: string;
  overlay_subtitle: string;
  overlay_body: string;
  sort_order: number;
  updated_at: string | null;
}

interface AuthUser {
  id: string;
  email?: string;
}

const STORES = new Set(["doughbros", "paradise", "nalou", "all"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const HTML_PAGES: Record<string, string> = {
  "/": "/index.html",
  "/index.html": "/index.html",
  "/careers": "/careers.html",
  "/careers.html": "/careers.html",
  "/pizzas": "/pizzas.html",
  "/pizzas.html": "/pizzas.html",
  "/pasta": "/pasta.html",
  "/pasta.html": "/pasta.html",
  "/coffee": "/coffee.html",
  "/coffee.html": "/coffee.html",
  "/cookies": "/cookies.html",
  "/cookies.html": "/cookies.html",
  "/admin": "/admin/index.html",
  "/admin/": "/admin/index.html",
  "/admin/index.html": "/admin/index.html",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

function restHeaders(env: Env, jwt?: string): HeadersInit {
  const key = jwt && env.SUPABASE_SERVICE_ROLE_KEY ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;
  const auth = jwt && !env.SUPABASE_SERVICE_ROLE_KEY ? jwt : key;
  return {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${auth}`,
    "content-type": "application/json",
  };
}

function writeHeaders(env: Env, jwt: string): HeadersInit {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    };
  }
  return {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${jwt}`,
    "content-type": "application/json",
    Prefer: "return=representation",
  };
}

function adminDomain(env: Env): string {
  return (env.ADMIN_EMAIL_DOMAIN || "lnmd.com.au").toLowerCase();
}

function isAdminEmail(email: string | undefined, env: Env): boolean {
  if (!email) return false;
  return email.split("@")[1]?.toLowerCase() === adminDomain(env);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

async function rest<T>(env: Env, path: string, init: RequestInit = {}): Promise<{ data: T; status: number; error?: string }> {
  const url = `${env.SUPABASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let parsed: T | { message?: string; error?: string } | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as T;
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    const err = parsed && typeof parsed === "object" ? (parsed as { message?: string; error?: string }) : null;
    return {
      data: (Array.isArray(parsed) ? [] : null) as T,
      status: response.status,
      error: err?.message || err?.error || text || `Supabase ${response.status}`,
    };
  }
  return { data: parsed as T, status: response.status };
}

async function requireAdmin(request: Request, env: Env): Promise<{ user: AuthUser; jwt: string } | Response> {
  const jwt = bearerToken(request);
  if (!jwt) return errorJson("Sign in required.", 401);

  const { data, status } = await rest<AuthUser>(env, "/auth/v1/user", {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (status !== 200 || !data?.id) return errorJson("Session expired. Sign in again.", 401);
  if (!isAdminEmail(data.email, env)) {
    return errorJson("Not authorized.", 403);
  }
  return { user: data, jwt };
}

function storeLabel(store: string): string {
  switch (store) {
    case "doughbros":
      return "DoughBros";
    case "paradise":
      return "Paradise";
    case "nalou":
      return "Nalou";
    default:
      return "All brands";
  }
}

const HEADING_RE = /^(what you[’']?ll do|what you need|what we offer|what you get|the role|about (the role|you|us)|perks|requirements|responsibilities|you[’']?ll need|nice to have)\s*:?\s*$/i;

function splitDescription(description: string): { summary: string; body: string } {
  const text = (description || "").replace(/\r/g, "");
  const lines = text.split("\n").map((l) => l.trim());
  const intro: string[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (intro.length) break;
      continue;
    }
    if (HEADING_RE.test(line) || /^[-•*]/.test(line)) break;
    intro.push(line);
  }
  const summary = intro.join(" ");
  return { summary: summary || lines.find(Boolean) || "", body: text };
}

function publicJob(row: JobRow) {
  const { summary, body } = splitDescription(row.description);
  return {
    id: row.id,
    title: row.title,
    store: row.store,
    brand: storeLabel(row.store),
    location: row.location_label,
    location_label: row.location_label,
    type: row.employment_type,
    employment_type: row.employment_type,
    summary: summary || row.title,
    body: body || row.description,
    description: row.description,
    active: row.active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function readJobInput(body: Record<string, unknown>): Partial<JobRow> | Response {
  const out: Partial<JobRow> = {};
  if (typeof body.title === "string") out.title = body.title.trim();
  if (typeof body.store === "string") {
    const store = body.store.trim().toLowerCase();
    if (!STORES.has(store)) return errorJson("Store must be doughbros, paradise, nalou, or all.", 400);
    out.store = store as JobRow["store"];
  }
  if (typeof body.location_label === "string") out.location_label = body.location_label.trim();
  if (typeof body.employment_type === "string") out.employment_type = body.employment_type.trim();
  if (typeof body.description === "string") out.description = body.description.trim();
  if (typeof body.active === "boolean") out.active = body.active;
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    out.sort_order = Math.round(body.sort_order);
  }
  return out;
}

function mergeSlot(def: SlotDef, row?: MediaRow | null): PublicSlot {
  return {
    slot_key: def.slot_key,
    page: def.page,
    page_label: def.page_label,
    label: def.label,
    title: row?.title || def.label,
    public_url: row?.public_url || def.default_url,
    overlay_title: row?.overlay_title ?? def.overlay_title,
    overlay_subtitle: row?.overlay_subtitle ?? def.overlay_subtitle,
    overlay_body: row?.overlay_body ?? def.overlay_body,
    sort_order: row?.sort_order ?? def.sort,
    updated_at: row?.updated_at || null,
  };
}

function catalogMedia(rows: MediaRow[] | null): PublicSlot[] {
  const byKey = new Map((rows || []).map((row) => [row.slot_key, row]));
  return SLOT_CATALOG.map((def) => mergeSlot(def, byKey.get(def.slot_key)));
}

async function listPublicJobs(env: Env): Promise<Response> {
  const { data, error } = await rest<JobRow[]>(
    env,
    "/rest/v1/site_jobs?active=eq.true&select=*&order=sort_order.asc&order=created_at.asc",
    { headers: restHeaders(env) },
  );
  if (error) return errorJson(error, 500);
  return json({ jobs: (data || []).map(publicJob), source: "cms" });
}

async function listPublicMedia(env: Env): Promise<Response> {
  const { data, error } = await rest<MediaRow[]>(
    env,
    "/rest/v1/site_media?select=*&order=page.asc&order=sort_order.asc&order=slot_key.asc",
    { headers: restHeaders(env) },
  );
  if (error) return errorJson(error, 500);
  const media = catalogMedia(data);
  const slots: Record<string, PublicSlot> = {};
  for (const item of media) slots[item.slot_key] = item;
  return json({ slots, media });
}

async function adminListJobs(env: Env, jwt: string): Promise<Response> {
  const { data, error } = await rest<JobRow[]>(
    env,
    "/rest/v1/site_jobs?select=*&order=sort_order.asc&order=created_at.asc",
    { headers: writeHeaders(env, jwt) },
  );
  if (error) return errorJson(error, 500);
  return json({ jobs: (data || []).map(publicJob) });
}

async function adminCreateJob(env: Env, jwt: string, request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = readJobInput(body);
  if (parsed instanceof Response) return parsed;
  if (!parsed.title || !parsed.store) return errorJson("Title and store are required.", 400);

  const last = await rest<JobRow[]>(
    env,
    "/rest/v1/site_jobs?select=sort_order&order=sort_order.desc&limit=1",
    { headers: writeHeaders(env, jwt) },
  );
  const nextOrder = parsed.sort_order ?? ((last.data?.[0]?.sort_order || 0) + 10);
  const row = {
    title: parsed.title,
    store: parsed.store,
    location_label: parsed.location_label || "",
    employment_type: parsed.employment_type || "",
    description: parsed.description || "",
    active: parsed.active ?? true,
    sort_order: nextOrder,
  };
  const { data, error } = await rest<JobRow[]>(env, "/rest/v1/site_jobs", {
    method: "POST",
    headers: writeHeaders(env, jwt),
    body: JSON.stringify(row),
  });
  if (error) return errorJson(error, 500);
  const created = Array.isArray(data) ? data[0] : (data as unknown as JobRow);
  return json({ job: publicJob(created) }, 201);
}

async function adminUpdateJob(env: Env, jwt: string, id: string, request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = readJobInput(body);
  if (parsed instanceof Response) return parsed;
  if (Object.keys(parsed).length === 0) return errorJson("Nothing to update.", 400);

  const { data, error } = await rest<JobRow[]>(env, `/rest/v1/site_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: writeHeaders(env, jwt),
    body: JSON.stringify(parsed),
  });
  if (error) return errorJson(error, 500);
  const updated = Array.isArray(data) ? data[0] : (data as unknown as JobRow);
  if (!updated) return errorJson("Job not found.", 404);
  return json({ job: publicJob(updated) });
}

async function adminReorderJobs(env: Env, jwt: string, request: Request): Promise<Response> {
  const body = (await request.json()) as { ids?: string[] };
  const ids = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return errorJson("ids must be an array of job ids.", 400);
  }
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await rest(env, `/rest/v1/site_jobs?id=eq.${encodeURIComponent(ids[i])}`, {
      method: "PATCH",
      headers: writeHeaders(env, jwt),
      body: JSON.stringify({ sort_order: (i + 1) * 10 }),
    });
    if (error) return errorJson(error, 500);
  }
  return adminListJobs(env, jwt);
}

async function adminListMedia(env: Env, jwt: string): Promise<Response> {
  const { data, error } = await rest<MediaRow[]>(
    env,
    "/rest/v1/site_media?select=*&order=page.asc&order=sort_order.asc",
    { headers: writeHeaders(env, jwt) },
  );
  if (error) return errorJson(error, 500);
  const media = catalogMedia(data);
  const pages = PAGE_ORDER.map((page) => ({
    page,
    label: media.find((item) => item.page === page)?.page_label || page,
    slots: media.filter((item) => item.page === page),
  }));
  return json({ media, pages });
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

async function upsertMedia(env: Env, jwt: string, slotKey: string, payload: Record<string, unknown>): Promise<MediaRow | Response> {
  const existing = await rest<MediaRow[]>(
    env,
    `/rest/v1/site_media?slot_key=eq.${encodeURIComponent(slotKey)}&select=*`,
    { headers: writeHeaders(env, jwt) },
  );
  if (existing.error) return errorJson(existing.error, 500);
  if (existing.data?.[0]?.id) {
    const updated = await rest<MediaRow[]>(env, `/rest/v1/site_media?id=eq.${existing.data[0].id}`, {
      method: "PATCH",
      headers: writeHeaders(env, jwt),
      body: JSON.stringify(payload),
    });
    if (updated.error) return errorJson(updated.error, 500);
    return updated.data?.[0] || existing.data[0];
  }
  const inserted = await rest<MediaRow[]>(env, "/rest/v1/site_media", {
    method: "POST",
    headers: writeHeaders(env, jwt),
    body: JSON.stringify(payload),
  });
  if (inserted.error) return errorJson(inserted.error, 500);
  return inserted.data?.[0] || null as unknown as MediaRow;
}

async function adminUploadMedia(env: Env, jwt: string, request: Request): Promise<Response> {
  const form = await request.formData();
  const slotKey = String(form.get("slot_key") || "").trim();
  const file = form.get("file");
  const def = SLOT_BY_KEY.get(slotKey);
  if (!def) return errorJson("Unknown image slot.", 400);
  if (!(file instanceof File)) return errorJson("Choose an image file.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return errorJson("Keep images under 8MB.", 400);
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return errorJson("Use a JPG, PNG, WEBP or GIF.", 400);
  }

  const ext = extensionFor(file);
  const path = `${slotKey}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const contentType = file.type || "image/jpeg";
  const authKey = env.SUPABASE_SERVICE_ROLE_KEY || jwt;
  const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  const upload = await fetch(`${env.SUPABASE_URL}/storage/v1/object/dtll-site-media/${path}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${authKey}`,
      "content-type": contentType,
      "x-upsert": "false",
    },
    body: bytes,
  });
  if (!upload.ok) {
    await upload.text();
    return errorJson("Upload failed.", 500);
  }

  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/dtll-site-media/${path}`;
  const overlayTitle = form.has("overlay_title") ? String(form.get("overlay_title") || "") : undefined;
  const overlaySubtitle = form.has("overlay_subtitle") ? String(form.get("overlay_subtitle") || "") : undefined;
  const overlayBody = form.has("overlay_body") ? String(form.get("overlay_body") || "") : undefined;
  const payload: Record<string, unknown> = {
    slot_key: slotKey,
    title: def.label,
    page: def.page,
    sort_order: def.sort,
    storage_path: path,
    public_url: publicUrl,
  };
  if (overlayTitle !== undefined) payload.overlay_title = overlayTitle;
  if (overlaySubtitle !== undefined) payload.overlay_subtitle = overlaySubtitle;
  if (overlayBody !== undefined) payload.overlay_body = overlayBody;

  const row = await upsertMedia(env, jwt, slotKey, payload);
  if (row instanceof Response) return row;
  return json({ media: mergeSlot(def, row) });
}

async function adminUpdateMedia(env: Env, jwt: string, slotKey: string, request: Request): Promise<Response> {
  const def = SLOT_BY_KEY.get(slotKey);
  if (!def) return errorJson("Unknown image slot.", 400);
  const body = (await request.json()) as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    slot_key: slotKey,
    title: def.label,
    page: def.page,
    sort_order: def.sort,
  };
  if (typeof body.overlay_title === "string") payload.overlay_title = body.overlay_title;
  if (typeof body.overlay_subtitle === "string") payload.overlay_subtitle = body.overlay_subtitle;
  if (typeof body.overlay_body === "string") payload.overlay_body = body.overlay_body;
  if (typeof body.public_url === "string" && body.public_url.trim()) {
    payload.public_url = body.public_url.trim();
  }
  const existing = await rest<MediaRow[]>(
    env,
    `/rest/v1/site_media?slot_key=eq.${encodeURIComponent(slotKey)}&select=id,public_url`,
    { headers: writeHeaders(env, jwt) },
  );
  if (!existing.data?.[0] && !payload.public_url) {
    payload.public_url = def.default_url;
  }

  if (
    payload.overlay_title === undefined &&
    payload.overlay_subtitle === undefined &&
    payload.overlay_body === undefined &&
    typeof body.public_url !== "string"
  ) {
    return errorJson("Nothing to update.", 400);
  }

  const row = await upsertMedia(env, jwt, slotKey, payload);
  if (row instanceof Response) return row;
  return json({ media: mergeSlot(def, row) });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  const readMethod = method === "GET" || method === "HEAD";

  if (path === "/api/health" && readMethod) {
    const started = Date.now();
    try {
      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/site_jobs?select=id&limit=1`,
        {
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
          signal: AbortSignal.timeout(8_000),
        },
      );
      const text = await response.text();
      return json({
        ok: response.ok,
        status: response.status,
        ms: Date.now() - started,
        preview: text.slice(0, 120),
      });
    } catch (err) {
      return json(
        { ok: false, ms: Date.now() - started, error: err instanceof Error ? err.message : String(err) },
        500,
      );
    }
  }

  if (path === "/api/config" && readMethod) {
    return json({
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
    });
  }

  if (path === "/api/jobs" && readMethod) return listPublicJobs(env);
  if (path === "/api/media" && readMethod) return listPublicMedia(env);

  if (path === "/api/admin/session" && readMethod) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    return json({ email: auth.user.email });
  }

  if (path.startsWith("/api/admin/")) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    if (path === "/api/admin/jobs" && readMethod) return adminListJobs(env, auth.jwt);
    if (path === "/api/admin/jobs" && method === "POST") return adminCreateJob(env, auth.jwt, request);
    if (path === "/api/admin/jobs/reorder" && method === "PUT") {
      return adminReorderJobs(env, auth.jwt, request);
    }

    const jobMatch = /^\/api\/admin\/jobs\/([0-9a-f-]{36})$/i.exec(path);
    if (jobMatch && (method === "PUT" || method === "PATCH")) {
      return adminUpdateJob(env, auth.jwt, jobMatch[1], request);
    }

    if (path === "/api/admin/media" && readMethod) return adminListMedia(env, auth.jwt);
    if (path === "/api/admin/media" && method === "POST") return adminUploadMedia(env, auth.jwt, request);

    const mediaMatch = /^\/api\/admin\/media\/([a-z0-9-]+)$/i.exec(path);
    if (mediaMatch && (method === "PUT" || method === "PATCH")) {
      return adminUpdateMedia(env, auth.jwt, mediaMatch[1], request);
    }

    return errorJson("Not found.", 404);
  }

  return errorJson("Not found.", 404);
}

function assetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

async function serveAsset(request: Request, env: Env, pathname?: string): Promise<Response> {
  const res = await env.ASSETS.fetch(pathname ? assetRequest(request, pathname) : request);
  const headers = new Headers(res.headers);
  const dest = pathname || new URL(request.url).pathname;
  if (/\.(html|js|css)$/i.test(dest) || dest === "/" || dest in HTML_PAGES) {
    headers.set("cache-control", "no-store");
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

// ---------- Short links for social posts, QR codes and SMS ----------
const SHORT_LINKS: Record<string, string> = {
  "/jobs": "/careers",
  "/hiring": "/careers",
  "/apply": "/careers",
  "/drivers": "/careers?role=driver",
  "/db-drivers": "/careers?brand=doughbros&role=driver",
  "/doughbros-drivers": "/careers?brand=doughbros&role=driver",
  "/db-kitchen": "/careers?brand=doughbros&role=kitchen",
  "/kitchen": "/careers?brand=doughbros&role=kitchen",
  "/paradise-drivers": "/careers?brand=paradise&role=driver",
  "/pp-drivers": "/careers?brand=paradise&role=driver",
  "/chef": "/careers?brand=nalou&role=chef",
  "/nalou-chef": "/careers?brand=nalou&role=chef",
};

const BRAND_FULL: Record<string, string> = {
  doughbros: "DoughBros",
  paradise: "Paradise Pizzas",
  nalou: "Nalou Kitchen",
  all: "DTLL Group",
};
const BRAND_ALIAS: Record<string, string> = { doughbros: "doughbros", db: "doughbros", paradise: "paradise", pp: "paradise", nalou: "nalou", nk: "nalou", group: "all", all: "all" };
const BRAND_IMAGE: Record<string, string> = {
  doughbros: "/media/doughbros-shop-01.jpg",
  paradise: "/media/paradise-shop-02.jpg",
  nalou: "/media/nalou-food-01.jpg",
  all: "/media/careers-line.jpg",
};
const STREET: Record<string, string> = {
  paradise: "205 Commercial St W",
  nalou: "82 Commercial St W",
};

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function jobSlug(j: JobRow): string {
  return slugify(`${j.store === "all" ? "group" : j.store}-${j.title.split(/[—–(/]/)[0]}`);
}
function findRole(jobsList: JobRow[], brandRaw: string, roleRaw: string): JobRow | null {
  const role = slugify(roleRaw);
  if (!role) return null;
  const direct = jobsList.find((j) => j.id === roleRaw || jobSlug(j) === role);
  if (direct) return direct;
  const parts = role.split("-");
  const brand = BRAND_ALIAS[brandRaw.toLowerCase()] || parts.map((w) => BRAND_ALIAS[w]).find(Boolean) || "";
  const words = parts.filter((w) => w && !BRAND_ALIAS[w]).map((w) => w.replace(/s$/, ""));
  let best: JobRow | null = null;
  let bestScore = 0;
  for (const j of jobsList) {
    if (brand && j.store !== brand) continue;
    const t = slugify(j.title);
    const score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      best = j;
      bestScore = score;
    }
  }
  return best;
}
function employmentTypes(label: string): string[] {
  const l = (label || "").toLowerCase();
  const out: string[] = [];
  if (l.includes("full")) out.push("FULL_TIME");
  if (l.includes("part")) out.push("PART_TIME");
  if (l.includes("casual")) out.push("PART_TIME", "TEMPORARY");
  return [...new Set(out.length ? out : ["PART_TIME"])];
}
function htmlDescription(text: string): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (text || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[-•*]/.test(l) ? `<li>${esc(l.replace(/^[-•*]\s*/, ""))}</li>` : `<p>${esc(l)}</p>`))
    .join("");
}
function jobPosting(j: JobRow, origin: string) {
  const posted = (j.created_at || new Date().toISOString()).slice(0, 10);
  const valid = new Date(Date.parse(j.updated_at || j.created_at || new Date().toISOString()) + 60 * 86400000).toISOString();
  const street = STREET[j.store] || (j.location_label && /\d/.test(j.location_label) ? j.location_label : undefined);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: j.title,
    description: htmlDescription(j.description) || j.title,
    datePosted: posted,
    validThrough: valid,
    employmentType: employmentTypes(j.employment_type),
    directApply: true,
    url: `${origin}/careers?role=${jobSlug(j)}`,
    identifier: { "@type": "PropertyValue", name: "DTLL Group", value: j.id },
    hiringOrganization: { "@type": "Organization", name: BRAND_FULL[j.store] || "DTLL Group", sameAs: origin, logo: `${origin}/favicon.svg` },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(street ? { streetAddress: street } : {}),
        addressLocality: "Mount Gambier",
        addressRegion: "SA",
        postalCode: "5290",
        addressCountry: "AU",
      },
    },
  };
}
class SetAttr {
  constructor(private attr: string, private value: string) {}
  element(el: Element) {
    el.setAttribute(this.attr, this.value);
  }
}
class SetText {
  constructor(private value: string) {}
  element(el: Element) {
    el.setInnerContent(this.value);
  }
}
class AppendHead {
  constructor(private html: string) {}
  element(el: Element) {
    el.append(this.html, { html: true });
  }
}

async function serveCareers(request: Request, env: Env): Promise<Response> {
  const res = await serveAsset(request, env, "/careers.html");
  if (!res.ok) return res;
  const url = new URL(request.url);
  let active: JobRow[] = [];
  try {
    const { data, error } = await rest<JobRow[]>(
      env,
      "/rest/v1/site_jobs?active=eq.true&select=*&order=sort_order.asc&order=created_at.asc",
      { headers: restHeaders(env), signal: AbortSignal.timeout(4_000) },
    );
    if (!error && Array.isArray(data)) active = data;
  } catch {
    active = [];
  }
  const origin = url.origin.includes("dtll.org") ? "https://dtll.org" : url.origin;
  const ld = active.map((j) => jobPosting(j, origin));
  let rw = new HTMLRewriter();
  if (ld.length) {
    const safe = JSON.stringify(ld).replace(/</g, "\\u003c");
    rw = rw.on("head", new AppendHead(`<script type="application/ld+json">${safe}</script>`));
  }
  const role = findRole(active, url.searchParams.get("brand") || "", url.searchParams.get("role") || "");
  const brandOnly = BRAND_ALIAS[(url.searchParams.get("brand") || "").toLowerCase()];
  if (role || brandOnly) {
    const store = role ? role.store : brandOnly;
    const brand = BRAND_FULL[store] || "DTLL Group";
    const title = role ? `${brand} is hiring: ${role.title}` : `${brand} is hiring in Mount Gambier`;
    const desc = role
      ? `${role.employment_type} · ${role.location_label || "Mount Gambier"}. ${splitDescription(role.description).summary}`.slice(0, 200)
      : `Open roles at ${brand}, Mount Gambier. Apply online in a few minutes.`;
    const canonical = role ? `${origin}/careers?role=${jobSlug(role)}` : `${origin}/careers?brand=${store}`;
    rw = rw
      .on("title", new SetText(`${title} | DTLL Group`))
      .on('meta[name="description"]', new SetAttr("content", desc))
      .on('meta[property="og:title"]', new SetAttr("content", title))
      .on('meta[property="og:description"]', new SetAttr("content", desc))
      .on('meta[property="og:url"]', new SetAttr("content", canonical))
      .on('meta[property="og:image"]', new SetAttr("content", `${origin}${BRAND_IMAGE[store] || BRAND_IMAGE.all}`));
  }
  return rw.transform(res);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const rawPath = url.pathname;
    const path = rawPath.replace(/\/+$/, "") || "/";

    if (rawPath.startsWith("/api/") || path.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "GET,HEAD,POST,PUT,PATCH,OPTIONS",
          },
        });
      }
      try {
        const response = await handleApi(request, env);
        const headers = new Headers(response.headers);
        headers.set("access-control-allow-origin", "*");
        if (request.method.toUpperCase() === "HEAD") {
          return new Response(null, { status: response.status, headers });
        }
        return new Response(response.body, { status: response.status, headers });
      } catch {
        return errorJson("Server error.", 500);
      }
    }

    const short = SHORT_LINKS[path.toLowerCase()];
    if (short) {
      const target = new URL(short, url.origin);
      url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
      return Response.redirect(target.toString(), 302);
    }

    const htmlPath = HTML_PAGES[rawPath] || HTML_PAGES[path];
    if (htmlPath === "/careers.html" && request.method.toUpperCase() === "GET") {
      return serveCareers(request, env);
    }
    if (htmlPath) {
      return serveAsset(request, env, htmlPath);
    }

    return serveAsset(request, env);
  },
} satisfies ExportedHandler<Env>;
