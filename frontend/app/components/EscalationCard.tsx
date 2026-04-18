"use client";
import { EscalationResult } from "../types";

interface EscalationCardProps { escalation: EscalationResult; }

const urgencyMap = {
  immediate:   { label: "IMMEDIATE ACTION REQUIRED", icon: "🚨", accent: "var(--red)",    bg: "rgba(224,86,86,.08)",   border: "rgba(224,86,86,.3)" },
  within_24h:  { label: "Action Needed Within 24 Hours", icon: "⚠️", accent: "var(--c-reasoning)", bg: "rgba(123,159,245,.07)", border: "rgba(123,159,245,.22)" },
  within_week: { label: "Act Within This Week",    icon: "📋", accent: "var(--gold-bright)", bg: "rgba(95,163,240,.06)", border: "rgba(95,163,240,.18)" },
  none:        { label: "No Urgency",              icon: "ℹ️", accent: "var(--text-300)",  bg: "var(--bg-elevated)",   border: "var(--border-2)" },
};

export default function EscalationCard({ escalation }: EscalationCardProps) {
  if (!escalation.escalation_needed) return null;
  const u = urgencyMap[escalation.urgency] ?? urgencyMap.within_week;

  return (
    <div className="anim-scale-in" style={{
      borderRadius: 14,
      border: `1px solid ${u.border}`,
      overflow: "hidden",
      boxShadow: escalation.urgency === "immediate" ? "0 4px 24px rgba(224,86,86,.15)" : "var(--shadow-sm)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        background: u.bg,
        borderBottom: `1px solid ${u.border}`,
      }}>
        <span style={{ fontSize: 16 }}>{u.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: u.accent }}>
          {u.label}
        </span>
      </div>

      <div style={{ background: "var(--bg-card)", padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* User message */}
        <p style={{ fontSize: 13, color: "var(--text-200)", lineHeight: 1.7 }}>
          {escalation.user_facing_message}
        </p>

        {/* Reasons */}
        {escalation.reasons?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 8 }}>
              Why we're flagging this
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {escalation.reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: u.accent, fontWeight: 800, flexShrink: 0, fontSize: 12, marginTop: 1 }}>•</span>
                  <p style={{ fontSize: 12, color: "var(--text-300)", lineHeight: 1.6 }}>{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral routes */}
        {escalation.recommended_routes?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 8 }}>
              Where to Get Help
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {escalation.recommended_routes.map((route, i) => (
                <div key={i} style={{
                  padding: "12px",
                  borderRadius: 10,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-2)",
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-100)", marginBottom: 4 }}>
                    {route.organization}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-300)", lineHeight: 1.5, marginBottom: route.contact ? 6 : 0 }}>
                    {route.why}
                  </p>
                  {route.contact && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg style={{ width: 12, height: 12, color: "var(--gold-bright)", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span style={{ fontSize: 12, color: "var(--gold-bright)", fontWeight: 600 }}>{route.contact}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
