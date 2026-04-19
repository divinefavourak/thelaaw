import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const res = await fetch(`${BACKEND}/review`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/review]", err);
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
