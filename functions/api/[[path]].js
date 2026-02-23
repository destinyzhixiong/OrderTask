export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);

  // 兼容 params.path: string | string[] | undefined
  const rawPath = params?.path;
  const path = Array.isArray(rawPath)
    ? rawPath.join("/")
    : (rawPath || "");

  // 处理斜杠，避免 // 和丢路径
  const origin = (env.API_ORIGIN || "").replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");

  // ⚠️ 如果你的 API_ORIGIN 已经包含 /api，就不要再加 /api
  const upstreamUrl = `${origin}/${cleanPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("X-Forwarded-Proto", "https");
  headers.set("Host", new URL(env.API_ORIGIN).host);


  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : request.body;

  const resp = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: "follow"
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.delete("content-length");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
}
