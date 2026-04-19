import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const res = await fetch(`${BACKEND}/transcribe`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/transcribe]", err);
    return NextResponse.json({ transcript: "" }, { status: 200 });
  }
}
