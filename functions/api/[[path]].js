export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);

  const rawPath = params?.path;
  const path = Array.isArray(rawPath)
    ? rawPath.join("/")
    : (rawPath || "");

  const origin = (env.API_ORIGIN || "").replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const upstreamPath = cleanPath ? `/${cleanPath}` : "";
  const upstreamUrl = `${origin}${upstreamPath}${url.search}`;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": url.origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  headers.set("X-Forwarded-Proto", "https");
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") || "");
  headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") || "");

  // ====================== 修复 1003 错误关键 ======================
  // 这里不能填 IP！必须填域名，我直接帮你写好
  headers.set("Host", "ordertask.pages.dev");

  const originalContentType = request.headers.get("Content-Type");
  if (originalContentType) {
    headers.set("Content-Type", originalContentType);
  }

  headers.set("Origin", url.origin);
  headers.set("Referer", url.href);

  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const requestClone = request.clone();
    body = requestClone.body;
  }

  try {
    const resp = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "follow",
    });

    const respHeaders = new Headers(resp.headers);
    respHeaders.delete("content-length");
    respHeaders.set("Access-Control-Allow-Origin", url.origin);
    respHeaders.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "转发失败",
      msg: error.message,
      url: upstreamUrl
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
