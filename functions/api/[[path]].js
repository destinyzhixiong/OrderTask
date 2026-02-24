/**
 * Cloudflare Pages Functions - API 转发代理
 * 适配 POST/OPTIONS/GET 等请求，解决 403/530 错误
 */
export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);

  // ===================== 1. 路径处理 =====================
  // 兼容 params.path 可能的类型：string | string[] | undefined
  const rawPath = params?.path;
  const path = Array.isArray(rawPath)
    ? rawPath.join("/")
    : (rawPath || "");

  // 处理斜杠，避免拼接出 // 或丢失路径
  const origin = (env.API_ORIGIN || "").replace(/\/+$/, ""); // 移除 origin 末尾斜杠
  const cleanPath = path.replace(/^\/+/, ""); // 移除路径开头斜杠
  const upstreamPath = cleanPath ? `/${cleanPath}` : ""; // 保证路径拼接正确
  const upstreamUrl = `${origin}${upstreamPath}${url.search}`; // 最终转发地址

  // ===================== 2. OPTIONS 预检请求处理（POST 跨域必处理） =====================
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": url.origin, // 允许当前前端域名跨域
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // 支持的请求方法
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept", // 允许的请求头
        "Access-Control-Max-Age": "86400", // 预检请求缓存 1 天，减少重复请求
        "Vary": "Origin", // 兼容不同源的跨域请求
      },
    });
  }

  // ===================== 3. 请求头配置 =====================
  const headers = new Headers(request.headers);

  // 删除可能导致冲突的头信息
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  // 设置转发标识，让后端能识别真实请求信息
  headers.set("X-Forwarded-Proto", "https"); // 标识协议为 HTTPS
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") || ""); // 真实客户端 IP
  headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") || ""); // 真实客户端 IP

  // 正确设置 Host 头（针对 IP:端口 形式的 API_ORIGIN）
  if (env.API_ORIGIN) {
    try {
      const originUrl = new URL(env.API_ORIGIN);
      headers.set("Host", `${originUrl.hostname}${originUrl.port ? `:${originUrl.port}` : ""}`);
    } catch (e) {
      // 解析失败时直接使用固定 Host（适配你的服务器地址）
      headers.set("Host", "43.128.226.215:5000");
    }
  }

  // 保留前端原始的 Content-Type（POST 请求核心，后端会校验）
  const originalContentType = request.headers.get("Content-Type");
  if (originalContentType) {
    headers.set("Content-Type", originalContentType);
  }

  // 模拟 Origin/Referer，避免后端因防盗链返回 403
  headers.set("Origin", url.origin);
  headers.set("Referer", url.href);

  // ===================== 4. 请求体处理（重点适配 POST） =====================
  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      // 克隆请求，避免请求体流被消耗（流只能读取一次）
      const requestClone = request.clone();

      // 根据 Content-Type 处理不同格式的请求体
      if (originalContentType?.includes("application/json")) {
        // JSON 格式：解析后重新序列化，确保格式正确
        body = JSON.stringify(await requestClone.json());
      } else if (originalContentType?.includes("form")) {
        // 表单格式：直接传递 FormData
        body = await requestClone.formData();
      } else {
        // 二进制/其他格式：直接传递原始 body
        body = requestClone.body;
      }
    } catch (e) {
      console.error("读取请求体失败:", e);
      return new Response(JSON.stringify({
        code: 400,
        message: "请求体解析失败，请检查请求格式",
        error: e.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": url.origin
        }
      });
    }
  }

  // ===================== 5. 转发请求到目标服务器 =====================
  try {
    const resp = await fetch(upstreamUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: "manual", // 关闭自动重定向，避免 530 错误
      cf: {
        cacheTtl: 0, // 禁用缓存，确保实时请求
        cacheEverything: false,
        // 可选：如果目标服务器在国内，可设置地区加速
        // region: "cn"
      },
    });

    // ===================== 6. 处理响应并返回 =====================
    const respHeaders = new Headers(resp.headers);

    // 删除可能导致冲突的响应头
    respHeaders.delete("content-length");
    respHeaders.delete("transfer-encoding");

    // 添加跨域响应头
    respHeaders.set("Access-Control-Allow-Origin", url.origin);
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

    // 返回最终响应
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (error) {
    // 捕获转发失败的错误，返回详细信息便于排查
    console.error("请求转发失败:", error);
    return new Response(JSON.stringify({
      code: 500,
      message: "API 转发失败",
      upstreamUrl: upstreamUrl,
      method: request.method,
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": url.origin
      }
    });
  }
}
