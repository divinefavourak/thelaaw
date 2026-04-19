"use client";
import { DraftedDocument } from "../types";

interface DocumentCardProps { doc: DraftedDocument; }

const docTypeLabels: Record<string, { label: string; icon: string }> = {
  demand_letter:   { label: "Demand Letter",      icon: "📩" },
  complaint:       { label: "Formal Complaint",    icon: "📋" },
  formal_response: { label: "Formal Response",     icon: "📜" },
  grievance:       { label: "Workplace Grievance", icon: "🗂️" },
};

export default function DocumentCard({ doc }: DocumentCardProps) {
  const meta = docTypeLabels[doc.document_type] ?? { label: doc.document_type, icon: "📄" };

  const handleDownload = () => {
    if (doc.pdf_url) {
      const a = document.createElement("a");
      a.href = doc.pdf_url;
      a.download = doc.suggested_filename;
      a.target = "_blank";
      a.click();
      return;
    }
    // Fallback: plain text export
    const blob = new Blob([doc.document_markdown], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.suggested_filename.replace(/\.(pdf|docx)$/, ".txt");
    a.click();
    URL.revokeObjectURL(url);
  };

  const keyPoints = doc.key_points_summary
    ? doc.key_points_summary.split(/\n|•|-/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="anim-scale-in" style={{
      borderRadius: 14,
      border: "1px solid rgba(47,196,184,.22)",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(47,196,184,.06)",
    }}>
      {/* Top band */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        background: "rgba(47,196,184,.06)",
        borderBottom: "1px solid rgba(47,196,184,.13)",
      }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: "rgba(47,196,184,.12)",
          border: "1px solid rgba(47,196,184,.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>{meta.icon}</div>

        {/* Labels */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--c-drafting)", marginBottom: 2 }}>
            Document Ready
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-100)", marginBottom: 2 }}>{meta.label}</p>
          <p style={{ fontSize: 10, color: "var(--text-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.suggested_filename}
          </p>
        </div>

        {/* Download button */}
        <button
          id="download-document-btn"
          onClick={handleDownload}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--gold-base), var(--gold-bright))",
            border: "none", cursor: "pointer",
            color: "var(--bg-void)", fontSize: 12, fontWeight: 700,
            flexShrink: 0,
            boxShadow: "var(--shadow-gold)",
            transition: "all var(--t-base)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-gold-lg)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-gold)"; }}
        >
          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v4h16v-4M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          Download .docx
        </button>
      </div>

      {/* Key points */}
      {keyPoints.length > 0 && (
        <div style={{ padding: "12px 14px", background: "var(--bg-card)", borderBottom: "1px solid var(--border-1)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-400)", marginBottom: 8 }}>
            What this letter does
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {keyPoints.map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(47,196,184,.12)", border: "1px solid rgba(47,196,184,.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--c-drafting)", fontSize: 9, fontWeight: 800, marginTop: 1,
                }}>✓</div>
                <p style={{ fontSize: 12, color: "var(--text-300)", lineHeight: 1.6 }}>{pt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview accordion */}
      <div style={{ background: "var(--bg-card)", padding: "10px 14px" }}>
        <details>
          <summary style={{
            fontSize: 11, fontWeight: 600,
            color: "var(--text-400)", cursor: "pointer",
            listStyle: "none", display: "flex", alignItems: "center", gap: 6,
            userSelect: "none",
            transition: "color var(--t-fast)",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--gold-bright)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-400)"; }}
          >
            <svg style={{ width: 12, height: 12 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L13.414 9a1 1 0 010 1.414l-4.707 4.707a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Preview document text
          </summary>
          <div style={{
            marginTop: 10,
            borderRadius: 8,
            background: "var(--bg-void)",
            border: "1px solid var(--border-1)",
            padding: "12px",
            maxHeight: 220,
            overflowY: "auto",
          }}>
            <pre style={{ fontSize: 11, color: "var(--text-300)", whiteSpace: "pre-wrap", fontFamily: "var(--font-geist-mono, monospace)", lineHeight: 1.65 }}>
              {doc.document_markdown}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
