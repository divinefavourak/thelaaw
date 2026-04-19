import { ChatPayload, ChatResponse } from "../types";

// Empty string → relative paths → Next.js API routes → backend proxy
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function sendChatMessage(payload: ChatPayload): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function uploadDocument(file: File, sessionId: string): Promise<ChatResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("session_id", sessionId);
  const res = await fetch(`${BASE}/api/review`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function transcribeAudio(blob: Blob, sessionId: string): Promise<{ transcript: string }> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  form.append("session_id", sessionId);
  const res = await fetch(`${BASE}/api/transcribe`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
