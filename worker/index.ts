import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

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
  storage_path: string | null;
  public_url: string;
  updated_at: string;
}

const STORES = new Set(["doughbros", "paradise", "nalou", "all"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=30" : "no-store",
    },
  });
}

function errorJson(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function anonClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function userClient(env: Env, jwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function privilegedClient(env: Env, jwt: string): SupabaseClient {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return userClient(env, jwt);
}

function adminDomain(env: Env): string {
  return (env.ADMIN_EMAIL_DOMAIN || "lnmd.com.au").toLowerCase();
}

function isAdminEmail(email: string | undefined, env: Env): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === adminDomain(env);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<{ user: User; jwt: string } | Response> {
  const jwt = bearerToken(request);
  if (!jwt) return errorJson("Sign in required.", 401);

  const { data, error } = await anonClient(env).auth.getUser(jwt);
  if (error || !data.user) return errorJson("Session expired. Sign in again.", 401);
  if (!isAdminEmail(data.user.email, env)) {
    return errorJson(`Only @${adminDomain(env)} emails can use admin.`, 403);
  }
  return { user: data.user, jwt };
}

function publicJob(row: JobRow) {
  const [summary, ...rest] = row.description.split(/\n\n+/);
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
    body: rest.join("\n\n") || row.description,
    description: row.description,
    active: row.active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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

async function listPublicJobs(env: Env): Promise<Response> {
  const { data, error } = await anonClient(env)
    .from("site_jobs")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return errorJson(error.message, 500);
  return json({ jobs: ((data || []) as JobRow[]).map(publicJob) });
}

async function listPublicMedia(env: Env): Promise<Response> {
  const { data, error } = await anonClient(env)
    .from("site_media")
    .select("*")
    .order("slot_key", { ascending: true });

  if (error) return errorJson(error.message, 500);
  const slots: Record<string, { title: string; public_url: string; updated_at: string }> = {};
  for (const row of (data || []) as MediaRow[]) {
    slots[row.slot_key] = {
      title: row.title,
      public_url: row.public_url,
      updated_at: row.updated_at,
    };
  }
  return json({ slots });
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

async function adminListJobs(env: Env, jwt: string): Promise<Response> {
  const { data, error } = await privilegedClient(env, jwt)
    .from("site_jobs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return errorJson(error.message, 500);
  return new Response(JSON.stringify({ jobs: ((data || []) as JobRow[]).map(publicJob) }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function adminCreateJob(env: Env, jwt: string, request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = readJobInput(body);
  if (parsed instanceof Response) return parsed;
  if (!parsed.title || !parsed.store) return errorJson("Title and store are required.", 400);

  const { data: last } = await privilegedClient(env, jwt)
    .from("site_jobs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    title: parsed.title,
    store: parsed.store,
    location_label: parsed.location_label || "",
    employment_type: parsed.employment_type || "",
    description: parsed.description || "",
    active: parsed.active ?? true,
    sort_order: parsed.sort_order ?? ((last?.sort_order as number | undefined) || 0) + 10,
  };

  const { data, error } = await privilegedClient(env, jwt).from("site_jobs").insert(row).select("*").single();
  if (error) return errorJson(error.message, 500);
  return json({ job: publicJob(data as JobRow) }, 201);
}

async function adminUpdateJob(env: Env, jwt: string, id: string, request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = readJobInput(body);
  if (parsed instanceof Response) return parsed;
  if (Object.keys(parsed).length === 0) return errorJson("Nothing to update.", 400);

  const { data, error } = await privilegedClient(env, jwt)
    .from("site_jobs")
    .update(parsed)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return errorJson(error.message, 500);
  if (!data) return errorJson("Job not found.", 404);
  return json({ job: publicJob(data as JobRow) });
}

async function adminReorderJobs(env: Env, jwt: string, request: Request): Promise<Response> {
  const body = (await request.json()) as { ids?: string[] };
  const ids = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return errorJson("ids must be an array of job ids.", 400);
  }

  const client = privilegedClient(env, jwt);
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await client.from("site_jobs").update({ sort_order: (i + 1) * 10 }).eq("id", ids[i]);
    if (error) return errorJson(error.message, 500);
  }
  return adminListJobs(env, jwt);
}

async function adminListMedia(env: Env, jwt: string): Promise<Response> {
  const { data, error } = await privilegedClient(env, jwt)
    .from("site_media")
    .select("*")
    .order("slot_key", { ascending: true });

  if (error) return errorJson(error.message, 500);
  return new Response(JSON.stringify({ media: data || [] }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function adminUploadMedia(env: Env, jwt: string, request: Request): Promise<Response> {
  const form = await request.formData();
  const slotKey = String(form.get("slot_key") || "").trim();
  const title = String(form.get("title") || "").trim();
  const file = form.get("file");

  if (!slotKey) return errorJson("slot_key is required.", 400);
  if (!(file instanceof File)) return errorJson("Choose an image file.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return errorJson("Keep images under 8MB.", 400);
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return errorJson("Use a JPG, PNG, WEBP or GIF.", 400);
  }

  const client = privilegedClient(env, jwt);
  const ext = extensionFor(file);
  const path = `${slotKey}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  const uploaded = await client.storage.from("dtll-site-media").upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (uploaded.error) return errorJson(uploaded.error.message, 500);

  const { data: pub } = client.storage.from("dtll-site-media").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { data: existing } = await client.from("site_media").select("id").eq("slot_key", slotKey).maybeSingle();
  const payload = {
    slot_key: slotKey,
    title: title || slotKey,
    storage_path: path,
    public_url: publicUrl,
  };

  let row: MediaRow | null = null;
  if (existing?.id) {
    const { data, error } = await client.from("site_media").update(payload).eq("id", existing.id).select("*").single();
    if (error) return errorJson(error.message, 500);
    row = data as MediaRow;
  } else {
    const { data, error } = await client.from("site_media").insert(payload).select("*").single();
    if (error) return errorJson(error.message, 500);
    row = data as MediaRow;
  }

  return json({ media: row });
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (path === "/api/config" && method === "GET") {
    return json({
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
      adminEmailDomain: adminDomain(env),
    });
  }

  if (path === "/api/jobs" && method === "GET") return listPublicJobs(env);
  if (path === "/api/media" && method === "GET") return listPublicMedia(env);

  if (path === "/api/admin/session" && method === "GET") {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;
    return new Response(
      JSON.stringify({ email: auth.user.email, domain: adminDomain(env) }),
      { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } },
    );
  }

  if (path.startsWith("/api/admin/")) {
    const auth = await requireAdmin(request, env);
    if (auth instanceof Response) return auth;

    if (path === "/api/admin/jobs" && method === "GET") return adminListJobs(env, auth.jwt);
    if (path === "/api/admin/jobs" && method === "POST") return adminCreateJob(env, auth.jwt, request);
    if (path === "/api/admin/jobs/reorder" && method === "PUT") {
      return adminReorderJobs(env, auth.jwt, request);
    }

    const jobMatch = /^\/api\/admin\/jobs\/([0-9a-f-]{36})$/i.exec(path);
    if (jobMatch && (method === "PUT" || method === "PATCH")) {
      return adminUpdateJob(env, auth.jwt, jobMatch[1], request);
    }

    if (path === "/api/admin/media" && method === "GET") return adminListMedia(env, auth.jwt);
    if (path === "/api/admin/media" && method === "POST") return adminUploadMedia(env, auth.jwt, request);

    return errorJson("Not found.", 404);
  }

  return errorJson("Not found.", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/admin") {
      return Response.redirect(`${url.origin}/admin/`, 302);
    }
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "GET,POST,PUT,PATCH,OPTIONS",
          },
        });
      }
      try {
        const response = await handleApi(request, env);
        const headers = new Headers(response.headers);
        headers.set("access-control-allow-origin", "*");
        return new Response(response.body, { status: response.status, headers });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Server error.";
        return errorJson(message, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
