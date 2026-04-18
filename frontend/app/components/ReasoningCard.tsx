"use client";
import { ReasoningResult } from "../types";

interface ReasoningCardProps { reasoning: ReasoningResult; }

const strengthMap = {
  strong:   { label: "Strong Position",   color: "#3ddb8a", bar: "#3ddb8a",   pct: "88%",  bg: "rgba(61,219,138,.07)",  border: "rgba(61,219,138,.2)"  },
  moderate: { label: "Moderate Position", color: "#7b9ff5", bar: "#7b9ff5",   pct: "55%",  bg: "rgba(123,159,245,.07)", border: "rgba(123,159,245,.2)" },
  weak:     { label: "Weak Position",     color: "#e06070", bar: "#e06070",   pct: "22%",  bg: "rgba(224,96,112,.07)",   border: "rgba(224,96,112,.2)"  },
};

export default function ReasoningCard({ reasoning }: ReasoningCardProps) {
  const s = strengthMap[reasoning.strength] ?? strengthMap.moderate;

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
        <span style={{ fontSize: 14 }}>⚖️</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--c-reasoning)" }}>
          Legal Analysis
        </span>
      </div>

      <div style={{ background: "var(--bg-card)", padding: "14px" }}>
        {/* Strength meter */}
        <div style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: s.bg,
          border: `1px solid ${s.border}`,
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-300)", fontWeight: 600 }}>Position Strength</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.label}</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "var(--bg-void)" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: s.pct,
              background: s.bar,
              boxShadow: `0 0 8px ${s.color}66`,
              transition: "width 800ms cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
        </div>

        {/* Summary */}
        <Section label="Summary">
          <p style={{ fontSize: 13, color: "var(--text-200)", lineHeight: 1.7 }}>{reasoning.position_summary}</p>
        </Section>

        {/* Supporting argument */}
        <Section label="Your Legal Standing">
          <p style={{ fontSize: 13, color: "var(--text-300)", lineHeight: 1.7 }}>{reasoning.supporting_argument}</p>
        </Section>

        {/* Counter-arguments */}
        {reasoning.counter_arguments?.length > 0 && (
          <Section label="Possible Counter-Arguments">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {reasoning.counter_arguments.map((ca, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--red)", flexShrink: 0, fontSize: 12, marginTop: 1 }}>↳</span>
                  <p style={{ fontSize: 12, color: "var(--text-300)", lineHeight: 1.6 }}>{ca}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recommended action */}
        {reasoning.recommended_action && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 10,
            background: "var(--bg-elevated)", border: "1px solid var(--border-2)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(201,168,76,.12)",
              border: "1px solid rgba(201,168,76,.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>💡</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 2 }}>
                Recommended Action
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-bright)", textTransform: "capitalize" }}>
                {reasoning.recommended_action.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 6 }}>
        {label}
      </p>
      {children}
    </div>
  );
}
