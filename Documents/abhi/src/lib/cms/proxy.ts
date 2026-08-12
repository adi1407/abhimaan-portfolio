import { NextResponse } from "next/server";

export async function proxyToFastApi(req: Request) {
  const api = process.env.API_URL ?? "http://127.0.0.1:8000";
  const src = new URL(req.url);
  const dest = `${api}${src.pathname}${src.search}`;
  const headers = new Headers(req.headers);
  headers.delete("host");
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  try {
    const res = await fetch(dest, init);
    const out = new Headers(res.headers);
    return new NextResponse(res.body, { status: res.status, headers: out });
  } catch {
    return NextResponse.json(
      { error: "API is down. Start Docker or add Supabase keys." },
      { status: 503 },
    );
  }
}
