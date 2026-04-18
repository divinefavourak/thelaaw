"use client";
import { Citation } from "../types";

interface CitationsCardProps { citations: Citation[]; }

export default function CitationsCard({ citations }: CitationsCardProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="anim-scale-in" style={{
      borderRadius: 14,
      border: "1px solid var(--border-2)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border-1)",
      }}>
        <span style={{ fontSize: 14 }}>📚</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--c-research)" }}>
          Statute Citations
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 10, fontWeight: 600,
          padding: "2px 8px", borderRadius: 99,
          background: "var(--green-dim)",
          color: "var(--c-research)",
          border: "1px solid rgba(34,214,105,.2)",
        }}>
          {citations.length} source{citations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Citations */}
      <div style={{ background: "var(--bg-card)" }}>
        {citations.map((c, i) => (
          <div key={i} style={{
            padding: "14px",
            borderBottom: i < citations.length - 1 ? "1px solid var(--border-1)" : undefined,
            transition: "background var(--t-fast)",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            {/* Statute + jurisdiction */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-bright)", marginBottom: 2 }}>{c.statute_name}</p>
                <p style={{ fontSize: 11, color: "var(--blue)", fontWeight: 500 }}>{c.section}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                background: c.jurisdiction === "federal" ? "rgba(201,168,76,.12)" : "var(--blue-dim)",
                color: c.jurisdiction === "federal" ? "var(--gold-bright)" : "var(--blue)",
                border: `1px solid ${c.jurisdiction === "federal" ? "rgba(201,168,76,.25)" : "rgba(80,153,232,.25)"}`,
                textTransform: "uppercase",
              }}>
                {c.jurisdiction}
              </span>
            </div>

            {/* Quote */}
            <blockquote style={{
              borderLeft: "2px solid var(--gold-dim)",
              paddingLeft: 12, margin: "8px 0",
              fontSize: 12, fontStyle: "italic",
              color: "var(--text-300)", lineHeight: 1.65,
            }}>
              {c.text}
            </blockquote>

            {/* Applies because */}
            <p style={{ fontSize: 11, color: "var(--text-400)", lineHeight: 1.5, marginBottom: 8 }}>
              <span style={{ color: "var(--text-300)", fontWeight: 600, fontStyle: "normal" }}>Why this applies: </span>
              {c.applies_because}
            </p>

            {/* Relevance bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 99, background: "var(--bg-void)" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${Math.round(c.relevance_score * 100)}%`,
                  background: "linear-gradient(90deg, var(--gold-dim), var(--gold-bright))",
                  transition: "width 600ms ease",
                }} />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-400)", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(c.relevance_score * 100)}% relevant
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
