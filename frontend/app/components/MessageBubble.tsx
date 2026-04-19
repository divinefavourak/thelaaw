"use client";

import { Message } from "../types";
import CitationsCard from "./CitationsCard";
import ReasoningCard from "./ReasoningCard";
import DocumentCard from "./DocumentCard";
import EscalationCard from "./EscalationCard";

interface MessageBubbleProps {
  message: Message;
  showPipeline?: boolean; // kept for compat; pipeline is now in the top bar
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="anim-fade-up" style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{
          background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright))",
          color: "var(--bg-void)",
          padding: "11px 16px",
          borderRadius: "18px 18px 4px 18px",
          fontSize: 14,
          lineHeight: 1.55,
          fontWeight: 500,
          boxShadow: "var(--shadow-gold)",
          wordBreak: "break-word",
        }}>
          {message.type === "document" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{message.fileName ?? "Document"}</p>
                <p style={{ fontSize: 11, opacity: .7 }}>Uploaded for review</p>
              </div>
            </div>
          ) : message.type === "audio" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Voice message</span>
            </div>
          ) : (
            <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
          )}
        </div>
        <span style={{ fontSize: 10, color: "var(--text-400)", paddingRight: 4 }}>{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="anim-fade-up" style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
      <div style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, boxShadow: "var(--shadow-gold)", border: "2px solid var(--border-3)",
      }}>
        <span style={{ color: "var(--bg-void)", fontWeight: 900 }}>⚖</span>
      </div>

      <div style={{ flex: 1, maxWidth: "calc(100% - 50px)", display: "flex", flexDirection: "column", gap: 4 }}>
        {message.isStreaming && !message.content && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "var(--bg-card)", border: "1px solid var(--border-2)",
            borderRadius: "18px 18px 18px 4px", padding: "12px 16px", marginBottom: 2,
          }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}

        {message.content && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-2)",
            borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
            boxShadow: "var(--shadow-sm)", wordBreak: "break-word",
          }}>
            <div className="prose-chat" style={{ fontSize: 14, color: "var(--text-100)", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: message.content }} />
            {message.isStreaming && (
              <span style={{ display: "inline-block", width: 2, height: 16, background: "var(--gold-base)", borderRadius: 2, marginLeft: 2, animation: "typingDot 1s ease infinite", verticalAlign: "text-bottom" }} />
            )}
          </div>
        )}

        {!message.isStreaming && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {message.escalation && <EscalationCard escalation={message.escalation} />}
            {message.citations && <CitationsCard citations={message.citations} />}
            {message.reasoning && <ReasoningCard reasoning={message.reasoning} />}
            {message.draftedDocument && <DocumentCard doc={message.draftedDocument} />}
          </div>
        )}

        <span style={{ fontSize: 10, color: "var(--text-400)", paddingLeft: 4 }}>
          TheLaaw · {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function MessageBubble({ message, showPipeline }: MessageBubbleProps) {
  if (message.role === "user") return <UserBubble message={message} />;
  return <AssistantBubble message={message} />;
}
