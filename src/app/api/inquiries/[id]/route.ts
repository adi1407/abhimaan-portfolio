import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/inquiries/auth";
import { deleteInquiry, markInquiryRead } from "@/lib/inquiries/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { read?: boolean } = {};
  try {
    body = (await request.json()) as { read?: boolean };
  } catch {
    body = {};
  }

  const item = await markInquiryRead(id, body.read !== false);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteInquiry(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
