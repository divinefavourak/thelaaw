"use client";

import { JurisdictionOption } from "../types";

interface SidebarProps {
  jurisdiction: JurisdictionOption;
  onJurisdictionChange: (j: JurisdictionOption) => void;
  onNewSession: () => void;
  showPipeline: boolean;
  onTogglePipeline: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// All 36 states + FCT, grouped for the select
const JURISDICTION_GROUPS: { label: string; options: { value: JurisdictionOption; label: string }[] }[] = [
  {
    label: "General",
    options: [{ value: "federal", label: "Federal (All States)" }],
  },
  {
    label: "South West",
    options: [
      { value: "lagos", label: "Lagos State" },
      { value: "ogun", label: "Ogun State" },
      { value: "oyo", label: "Oyo State" },
      { value: "osun", label: "Osun State" },
      { value: "ondo", label: "Ondo State" },
      { value: "ekiti", label: "Ekiti State" },
    ],
  },
  {
    label: "South East",
    options: [
      { value: "anambra", label: "Anambra State" },
      { value: "enugu", label: "Enugu State" },
      { value: "imo", label: "Imo State" },
      { value: "abia", label: "Abia State" },
      { value: "ebonyi", label: "Ebonyi State" },
    ],
  },
  {
    label: "South South",
    options: [
      { value: "rivers", label: "Rivers State" },
      { value: "delta", label: "Delta State" },
      { value: "edo", label: "Edo State" },
      { value: "bayelsa", label: "Bayelsa State" },
      { value: "akwa_ibom", label: "Akwa Ibom State" },
      { value: "cross_river", label: "Cross River State" },
    ],
  },
  {
    label: "North West",
    options: [
      { value: "kano", label: "Kano State" },
      { value: "kaduna", label: "Kaduna State" },
      { value: "katsina", label: "Katsina State" },
      { value: "sokoto", label: "Sokoto State" },
      { value: "zamfara", label: "Zamfara State" },
      { value: "jigawa", label: "Jigawa State" },
      { value: "kebbi", label: "Kebbi State" },
    ],
  },
  {
    label: "North East",
    options: [
      { value: "borno", label: "Borno State" },
      { value: "adamawa", label: "Adamawa State" },
      { value: "gombe", label: "Gombe State" },
      { value: "bauchi", label: "Bauchi State" },
      { value: "yobe", label: "Yobe State" },
      { value: "taraba", label: "Taraba State" },
    ],
  },
  {
    label: "North Central",
    options: [
      { value: "fct", label: "FCT Abuja" },
      { value: "kogi", label: "Kogi State" },
      { value: "kwara", label: "Kwara State" },
      { value: "niger", label: "Niger State" },
      { value: "benue", label: "Benue State" },
      { value: "plateau", label: "Plateau State" },
      { value: "nasarawa", label: "Nasarawa State" },
    ],
  },
];

const quickPrompts = [
  { icon: "🏠", label: "Illegal Eviction", text: "My landlord just served me a one-week quit notice because I was late on rent. What are my rights?" },
  { icon: "💼", label: "Salary Withheld", text: "My employer has not paid my salary for 3 months and is ignoring my messages. What can I do legally?" },
  { icon: "👮", label: "Police Bribe", text: "Police stopped me on the road and demanded a bribe. What are my rights?" },
  { icon: "📄", label: "Contract Review", text: "I want to upload a tenancy agreement for adversarial review before signing it." },
  { icon: "🔨", label: "Wrongful Dismissal", text: "I was terminated without notice or severance pay. Is this legal and what can I claim?" },
  { icon: "🏭", label: "Unpaid Overtime", text: "My employer forces me to work overtime without extra pay. Is that legal in Nigeria?" },
];

export default function Sidebar({
  jurisdiction,
  onJurisdictionChange,
  onNewSession,
  showPipeline,
  onTogglePipeline,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`} style={{
      width: 256,
      flexShrink: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-1)",
      overflowY: "auto",
    }}>
      {/* ── Logo ─────────────────────────── */}
      <div style={{ padding: "22px 18px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="icon-btn desktop-hide"
              style={{ marginLeft: "auto", order: 99 }}
              aria-label="Close menu"
            >
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            boxShadow: "var(--shadow-gold), 0 2px 8px rgba(0,0,0,.4)",
          }}>
            <span style={{ color: "var(--bg-void)", fontWeight: 900 }}>⚖</span>
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1, color: "var(--text-100)" }}>
              The<span style={{ color: "var(--gold-bright)" }}>Laaw</span>
            </h1>
            <p style={{ fontSize: 10, color: "var(--text-400)", marginTop: 2, letterSpacing: ".04em", textTransform: "uppercase" }}>
              Legal Rights Companion
            </p>
          </div>
        </div>

        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8,
          background: "rgba(34,214,105,.06)", border: "1px solid rgba(34,214,105,.15)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--green)",
            boxShadow: "0 0 8px rgba(34,214,105,.6)",
          }} />
          <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>5-Agent Pipeline Active</span>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-1)", margin: "0 0 12px", flexShrink: 0 }} />

      {/* ── New Chat ─────────────────────── */}
      <div style={{ padding: "0 14px 12px", flexShrink: 0 }}>
        <button
          id="new-session-btn"
          onClick={onNewSession}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 16px", borderRadius: 12,
            border: "1px solid var(--border-3)", background: "transparent",
            cursor: "pointer", color: "var(--gold-bright)", fontSize: 13, fontWeight: 600,
            transition: "all var(--t-base)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,.08)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-3)"; }}
        >
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* ── Jurisdiction ─────────────────── */}
      <div style={{ padding: "0 14px 12px", flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 7 }}>
          Jurisdiction
        </p>
        <div style={{ position: "relative" }}>
          <select
            id="jurisdiction-select"
            value={jurisdiction}
            onChange={(e) => onJurisdictionChange(e.target.value as JurisdictionOption)}
            style={{
              width: "100%", appearance: "none",
              background: "var(--bg-elevated)", border: "1px solid var(--border-2)",
              borderRadius: 10, padding: "9px 32px 9px 12px",
              fontSize: 13, color: "var(--text-100)", cursor: "pointer", outline: "none",
              transition: "border-color var(--t-base)",
            }}
            onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--gold-base)"; }}
            onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border-2)"; }}
          >
            {JURISDICTION_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label} style={{ background: "var(--bg-elevated)", color: "var(--text-400)", fontSize: 11 }}>
                {group.options.map(({ value, label }) => (
                  <option key={value} value={value} style={{ background: "var(--bg-elevated)", color: "var(--text-100)" }}>
                    {label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-400)", pointerEvents: "none" }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* ── Agent trace toggle ────────────── */}
      <div style={{ padding: "0 14px 12px", flexShrink: 0 }}>
        <button
          id="toggle-pipeline-btn"
          onClick={onTogglePipeline}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 12px", borderRadius: 10, cursor: "pointer",
            border: `1px solid ${showPipeline ? "var(--border-3)" : "var(--border-1)"}`,
            background: showPipeline ? "rgba(201,168,76,.06)" : "transparent",
            transition: "all var(--t-base)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: showPipeline ? "var(--gold-bright)" : "var(--text-300)" }}>
            <span>🔬</span> Agent Trace
          </span>
          <div style={{
            width: 34, height: 18, borderRadius: 99, position: "relative",
            background: showPipeline ? "var(--gold-base)" : "var(--bg-void)",
            border: "1px solid var(--border-2)", transition: "background var(--t-base)",
          }}>
            <div style={{
              position: "absolute", top: 2, left: showPipeline ? 16 : 2,
              width: 12, height: 12, borderRadius: "50%", background: "white",
              transition: "left var(--t-base)", boxShadow: "0 1px 4px rgba(0,0,0,.3)",
            }} />
          </div>
        </button>
      </div>

      <div style={{ height: 1, background: "var(--border-1)", margin: "0 14px 12px", flexShrink: 0 }} />

      {/* ── Quick prompts ─────────────────── */}
      <div style={{ flex: 1, padding: "0 14px", overflowY: "auto" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 8 }}>
          Quick Start
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              id={`quick-prompt-${i}`}
              onClick={() => {
                const input = document.getElementById("chat-input") as HTMLTextAreaElement | null;
                if (input) {
                  input.value = qp.text;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                  input.focus();
                }
              }}
              className="nav-item"
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{qp.icon}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: 12, color: "inherit" }}>{qp.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────── */}
      <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--border-1)", flexShrink: 0 }}>

        {/* WhatsApp CTA */}
        <a
          id="whatsapp-cta"
          href="https://wa.me/2348000000000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 11,
            background: "rgba(37,211,102,.08)",
            border: "1px solid rgba(37,211,102,.22)",
            textDecoration: "none",
            marginBottom: 10,
            transition: "background var(--t-base), border-color var(--t-base)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,.16)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(37,211,102,.45)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(37,211,102,.08)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(37,211,102,.22)";
          }}
        >
          {/* WhatsApp icon with pulse dot */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg
              viewBox="0 0 24 24"
              style={{ width: 22, height: 22, fill: "#25D366" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.054 23.447a.75.75 0 00.91.91l5.585-1.479A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 01-4.953-1.355l-.355-.213-3.676.972.986-3.594-.232-.368A9.713 9.713 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            {/* Live pulse dot */}
            <span style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#25D366",
              boxShadow: "0 0 0 0 rgba(37,211,102,.7)",
              animation: "whatsapp-pulse 2s ease-out infinite",
            }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#25D366", lineHeight: 1.2, marginBottom: 1 }}>
              Chat here
            </p>
            <p style={{ fontSize: 10, color: "var(--text-400)", lineHeight: 1.3 }}>
              Talk to us on WhatsApp
            </p>
          </div>

          {/* Arrow */}
          <svg
            style={{ width: 13, height: 13, color: "#25D366", marginLeft: "auto", flexShrink: 0, opacity: 0.7 }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* Pulse keyframe injected inline */}
        <style>{`
          @keyframes whatsapp-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(37,211,102,.7); }
            70%  { box-shadow: 0 0 0 6px rgba(37,211,102,0); }
            100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
          }
        `}</style>

        <div style={{ padding: "9px 11px", borderRadius: 9, background: "rgba(201,168,76,.04)", border: "1px solid var(--border-1)" }}>
          <p style={{ fontSize: 11, color: "var(--text-400)", lineHeight: 1.6 }}>
            TheLaaw provides <em style={{ color: "var(--text-300)" }}>legal information</em>, not advice. For active proceedings, consult a qualified lawyer.
          </p>
        </div>
        <p style={{ fontSize: 9, color: "var(--text-500)", marginTop: 8, textAlign: "center", letterSpacing: ".05em" }}>
          CLAUDE AI HACKATHON 2026
        </p>
      </div>
    </aside>
  );
}
