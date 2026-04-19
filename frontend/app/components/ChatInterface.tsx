"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import {
  Message,
  AgentStep,
  AgentName,
  JurisdictionOption,
  ChatResponse,
} from "../types";
import { sendChatMessage, uploadDocument, transcribeAudio } from "../lib/api";
import { getMockResponse } from "../lib/mockResponses";
import MessageBubble from "./MessageBubble";
import Sidebar from "./Sidebar";

// Native UUID — no external dep
const uuidv4 = () => crypto.randomUUID();

// ─── Agent pipeline simulation ────────────────────────────────────────────────
const AGENT_SEQUENCE: AgentName[] = ["intake", "research", "reasoning", "drafting", "escalation"];
const AGENT_LABELS: Record<AgentName, string> = {
  intake: "Classifying your situation",
  research: "Searching Nigerian statutes",
  reasoning: "Building your legal argument",
  drafting: "Preparing document draft",
  escalation: "Running safety check",
};
function buildInitialSteps(): AgentStep[] {
  return AGENT_SEQUENCE.map((agent) => ({ agent, status: "idle", label: AGENT_LABELS[agent] }));
}
async function simulatePipeline(onUpdate: (steps: AgentStep[]) => void): Promise<void> {
  const steps = buildInitialSteps();
  for (let i = 0; i < steps.length; i++) {
    steps[i] = { ...steps[i], status: "running", startedAt: Date.now() };
    onUpdate([...steps]);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    steps[i] = { ...steps[i], status: "done", completedAt: Date.now() };
    onUpdate([...steps]);
  }
}

// ─── Text → safe HTML ─────────────────────────────────────────────────────────
function textToHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ─── Empty / welcome state ────────────────────────────────────────────────────
function EmptyState({ onQuickPrompt }: { onQuickPrompt: (t: string) => void }) {
  const examples = [
    {
      icon: "🏠",
      title: "Eviction Notice",
      body: "My landlord gave me one week to leave because I was late on rent last month. Is that legal?",
    },
    {
      icon: "💼",
      title: "Withheld Salary",
      body: "My employer hasn't paid me in 3 months. What legal options do I have?",
    },
    {
      icon: "👮",
      title: "Police Misconduct",
      body: "Police officers stopped me and demanded a bribe on Third Mainland Bridge. What are my rights?",
    },
  ];

  return (
    <div className="anim-fade-in" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "40px 32px",
      textAlign: "center",
    }}>
      {/* Hero icon */}
      <div
        className="float"
        style={{
          width: 80, height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, var(--gold-base) 0%, var(--gold-bright) 55%, var(--gold-cream) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
          marginBottom: 24,
          boxShadow: "var(--shadow-gold-lg), 0 0 60px rgba(201,168,76,.15)",
          border: "2px solid var(--border-4)",
        }}
      >
        <span style={{ color: "var(--bg-void)", fontWeight: 900 }}>⚖</span>
      </div>

      {/* Headline */}
      <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 12 }}>
        Welcome to{" "}
        <span style={{
          background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright), var(--gold-cream))",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "shimmer 3s linear infinite",
        }}>
          TheLaaw
        </span>
      </h2>
      <p style={{ fontSize: 15, color: "var(--text-300)", maxWidth: 380, lineHeight: 1.7, marginBottom: 36 }}>
        Your AI-powered legal rights companion. Describe your situation in{" "}
        <strong style={{ color: "var(--text-200)", fontWeight: 600 }}>English, Pidgin, or Yoruba</strong>{" "}
        — backed by the Nigerian statute.
      </p>

      {/* Agent badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
        {[
          { label: "Intake", color: "var(--c-intake)", bg: "var(--blue-dim)" },
          { label: "Research", color: "var(--c-research)", bg: "var(--green-dim)" },
          { label: "Reasoning", color: "var(--c-reasoning)", bg: "var(--purple-dim)" },
          { label: "Drafting", color: "var(--c-drafting)", bg: "var(--orange-dim)" },
          { label: "Escalation", color: "var(--c-escalation)", bg: "var(--red-dim)" },
        ].map((a) => (
          <span key={a.label} style={{
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 99,
            background: a.bg,
            color: a.color,
            border: `1px solid ${a.color}44`,
          }}>{a.label}</span>
        ))}
      </div>

      {/* Example cards */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 4 }}>
          Try asking
        </p>
        {examples.map((ex, i) => (
          <button
            key={i}
            id={`empty-suggestion-${i}`}
            onClick={() => onQuickPrompt(ex.body)}
            className="anim-fade-up"
            style={{
              animationDelay: `${i * 80}ms`,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--border-2)",
              background: "var(--bg-card)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all var(--t-base)",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.border = "1px solid var(--border-4)";
              btn.style.background = "var(--bg-hover)";
              btn.style.transform = "translateY(-1px)";
              btn.style.boxShadow = "var(--shadow-gold)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.border = "1px solid var(--border-2)";
              btn.style.background = "var(--bg-card)";
              btn.style.transform = "translateY(0)";
              btn.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>{ex.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-100)", marginBottom: 4 }}>{ex.title}</p>
              <p style={{ fontSize: 12, color: "var(--text-300)", lineHeight: 1.5 }}>{ex.body}</p>
            </div>
            <svg style={{ width: 14, height: 14, color: "var(--text-400)", flexShrink: 0, marginTop: 2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Voice recorder hook ──────────────────────────────────────────────────────
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        setAudioBlob(new Blob(chunks.current, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(100);
      mrRef.current = mr;
      setIsRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  }, []);

  const stop = useCallback(() => { mrRef.current?.stop(); setIsRecording(false); }, []);
  const clear = useCallback(() => setAudioBlob(null), []);
  return { isRecording, audioBlob, start, stop, clear };
}

// ─── Main ChatInterface ───────────────────────────────────────────────────────
export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [jurisdiction, setJurisdiction] = useState<JurisdictionOption>("lagos");
  const [showPipeline, setShowPipeline] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceRecorder();

  // Client-only session ID (avoids SSR hydration mismatch)
  useEffect(() => { setSessionId(uuidv4()); }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // ─── Core send ────────────────────────────────────────────────────────────
  const processAndSend = useCallback(
    async (
      userContent: string,
      messageType: "text" | "audio" | "document" = "text",
      file?: File,
      fileName?: string
    ) => {
      if ((!userContent && !file) || isLoading) return;

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        type: messageType === "document" ? "document" : messageType === "audio" ? "audio" : "text",
        content: userContent,
        timestamp: new Date(),
        fileName,
      };

      const assistantId = uuidv4();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        type: "text",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        agentSteps: buildInitialSteps(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setInputText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      if (showPipeline) {
        simulatePipeline((steps) =>
          setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, agentSteps: steps } : m))
        );
      }

      try {
        let data: ChatResponse;

        // ── Try real backend first ──────────────────────────────────────────
        try {
          if (messageType === "document" && file) {
            data = await uploadDocument(file, sessionId);
          } else {
            const apiType: "text" | "audio" | "image" = messageType === "audio" ? "audio" : "text";
            data = await sendChatMessage({ message: userContent, session_id: sessionId, message_type: apiType });
          }
        } catch {
          // ── Backend unreachable — use mock engine ──────────────────────────
          data = await getMockResponse(userContent, jurisdiction);
        }

        const responseText = data.clarifying_questions?.length
          ? data.clarifying_questions.join("\n")
          : data.user_facing_response;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                ...m,
                content: textToHtml(responseText),
                isStreaming: false,
                citations: data.relevant_statutes,
                reasoning: data.reasoning,
                escalation: data.escalation,
                draftedDocument: data.drafted_document,
                agentSteps: data.agent_trace ?? m.agentSteps,
              }
              : m
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: `Something went wrong: ${msg}` }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, showPipeline, jurisdiction]
  );

  const handleSend = () => {
    const text = inputText.trim();
    if (text) processAndSend(text, "text");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickPrompt = (text: string) => {
    setInputText(text);
    textareaRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    if (voice.isRecording) voice.stop(); else voice.start();
  };

  useEffect(() => {
    if (!voice.audioBlob) return;
    const blob = voice.audioBlob;
    voice.clear();
    (async () => {
      try {
        // Transcribe first, then send as text so the pipeline sees the words
        const { transcript } = await transcribeAudio(blob, sessionId);
        if (transcript) {
          processAndSend(transcript, "text");
        } else {
          // Fallback: send raw audio as base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const b64 = (reader.result as string).split(",")[1];
            processAndSend("[Voice message]", "audio");
            sendChatMessage({ message: "[Voice message]", session_id: sessionId, message_type: "audio", base64_audio: b64 });
          };
          reader.readAsDataURL(blob);
        }
      } catch {
        processAndSend("[Voice message]", "audio");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.audioBlob]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndSend(`Please review this document: ${file.name}`, "document", file, file.name);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processAndSend(`Please review this document: ${file.name}`, "document", file, file.name);
  };

  const handleNewSession = () => {
    setMessages([]);
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100%", background: "var(--bg-void)" }}>
      <Sidebar
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
        onNewSession={handleNewSession}
        showPipeline={showPipeline}
        onTogglePipeline={() => setShowPipeline((v) => !v)}
      />

      {/* ── Main pane ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>

        {/* Top bar */}
        <header
          className="glass"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 58,
            borderBottom: "1px solid var(--border-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 8px rgba(34,214,105,.8)",
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)" }}>Live</span>
            </div>

            <div style={{ width: 1, height: 16, background: "var(--border-2)" }} />

            {/* Session ID */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg style={{ width: 12, height: 12, color: "var(--text-400)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span style={{ fontSize: 12, color: "var(--text-400)" }}>
                Session{" "}
                <code style={{ fontSize: 11, color: "var(--gold-bright)", fontFamily: "var(--font-geist-mono, monospace)", background: "rgba(201,168,76,.1)", padding: "1px 5px", borderRadius: 4 }}>
                  {sessionId ? sessionId.slice(0, 8) : "———"}
                </code>
              </span>
            </div>

            <div style={{ width: 1, height: 16, background: "var(--border-2)" }} />

            {/* Jurisdiction */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg style={{ width: 12, height: 12, color: "var(--text-400)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span style={{ fontSize: 12, color: "var(--text-300)", textTransform: "capitalize" }}>
                {jurisdiction === "federal" ? "Federal" : `${jurisdiction.charAt(0).toUpperCase() + jurisdiction.slice(1)} State`}
              </span>
            </div>
          </div>

          {/* Right: message count + icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {messages.length > 0 && (
              <span style={{
                fontSize: 11, color: "var(--text-400)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-2)",
                padding: "2px 8px", borderRadius: 99,
              }}>
                {messages.filter((m) => m.role === "user").length} message{messages.filter((m) => m.role === "user").length !== 1 ? "s" : ""}
              </span>
            )}
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, boxShadow: "var(--shadow-gold)",
            }}>
              <span style={{ color: "var(--bg-void)", fontWeight: 900 }}>⚖</span>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            position: "relative",
            background: isDragging
              ? "rgba(201,168,76,.03)"
              : undefined,
            outline: isDragging ? "2px dashed var(--border-4)" : undefined,
            outlineOffset: "-8px",
            borderRadius: isDragging ? 16 : undefined,
            transition: "all var(--t-base)",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {messages.length === 0 ? (
            <EmptyState onQuickPrompt={handleQuickPrompt} />
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} showPipeline={showPipeline} />
            ))
          )}

          {/* Drop overlay */}
          {isDragging && (
            <div className="anim-scale-in" style={{
              position: "absolute", inset: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <div style={{
                background: "var(--bg-elevated)",
                border: "2px solid var(--gold-base)",
                borderRadius: 20,
                padding: "32px 48px",
                textAlign: "center",
                boxShadow: "var(--shadow-gold-lg)",
              }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>📄</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--gold-bright)" }}>Drop to upload document</p>
                <p style={{ fontSize: 12, color: "var(--text-300)", marginTop: 4 }}>PDF, DOC, DOCX, TXT supported</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ──────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: "14px 24px 18px",
          borderTop: "1px solid var(--border-1)",
          background: "var(--bg-surface)",
        }}>
          {/* Recording banner */}
          {voice.isRecording && (
            <div className="anim-fade-in" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", marginBottom: 10,
              borderRadius: 10,
              background: "var(--red-dim)",
              border: "1px solid rgba(224,86,86,.3)",
            }}>
              <div className="recording" style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--red)", flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "var(--red)", fontWeight: 600 }}>Recording voice message — tap the mic to stop</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--text-400)" }}>Speak in English, Pidgin, or Yoruba</span>
            </div>
          )}

          {/* Input box */}
          <div className="input-wrap" style={{ position: "relative" }}>
            <div style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              background: "var(--bg-input)",
              borderRadius: 17,
              padding: "10px 10px 10px 14px",
            }}>
              {/* Upload button */}
              <button
                id="upload-file-btn"
                type="button"
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Upload document for review"
                title="Upload document"
                style={{ marginBottom: 1, width: 32, height: 32 }}
              >
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} id="file-upload-input" />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                id="chat-input"
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading || voice.isRecording}
                placeholder={
                  voice.isRecording
                    ? "Listening…"
                    : isLoading
                      ? "Analysing your situation…"
                      : "Describe your situation — English, Pidgin, or Yoruba…"
                }
                style={{
                  flex: 1,
                  background: "transparent",
                  resize: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: voice.isRecording ? "var(--red)" : "var(--text-100)",
                  lineHeight: 1.6,
                  minHeight: 24,
                  maxHeight: 160,
                  scrollbarWidth: "none",
                  opacity: isLoading ? .6 : 1,
                  transition: "color var(--t-base), opacity var(--t-base)",
                }}
              />

              {/* Voice button */}
              <button
                id="voice-btn"
                type="button"
                className={`icon-btn${voice.isRecording ? " active" : ""}`}
                onClick={handleVoiceToggle}
                disabled={isLoading}
                aria-label={voice.isRecording ? "Stop recording" : "Start voice recording"}
                title={voice.isRecording ? "Stop recording" : "Record voice message"}
                style={{ marginBottom: 1, width: 32, height: 32 }}
              >
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Send button */}
              <button
                id="send-btn"
                type="button"
                className="icon-btn gold"
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || voice.isRecording}
                aria-label="Send message"
                style={{ marginBottom: 1, width: 36, height: 36, borderRadius: 12 }}
              >
                {isLoading ? (
                  <svg style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
