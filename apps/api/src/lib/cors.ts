import type { Env } from "../env";

export function originAllowed(env: Env, request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  // We never combine wildcard with credentials — that's a silent footgun.
  if (env.ALLOWED_ORIGIN === "*") return true;
  return origin === env.ALLOWED_ORIGIN;
}

export function corsHeaders(env: Env, request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  const allowed = originAllowed(env, request);
  const credentials = env.ALLOWED_ORIGIN !== "*";
  return {
    "access-control-allow-origin": allowed ? origin || env.ALLOWED_ORIGIN : env.ALLOWED_ORIGIN,
    ...(credentials ? { "access-control-allow-credentials": "true" } : {}),
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    vary: "origin",
  };
}

export function json(
  body: unknown,
  init: ResponseInit & { env?: Env; request?: Request } = {},
): Response {
  const { env, request, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("content-type", "application/json");
  if (env && request) {
    for (const [k, v] of Object.entries(corsHeaders(env, request))) headers.set(k, String(v));
  }
  return new Response(JSON.stringify(body), { ...rest, headers });
}

export function preflight(env: Env, request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(env, request) });
}

/** State-changing requests must come from a known Origin. */
export function requireOrigin(env: Env, request: Request): Response | null {
  if (env.ALLOWED_ORIGIN === "*") return null;
  const origin = request.headers.get("origin");
  if (!origin || origin !== env.ALLOWED_ORIGIN) {
    return json({ error: "bad_origin" }, { status: 403, env, request });
  }
  return null;
}
