"use client";

import { AgentStep, AGENT_META } from "../types";

interface AgentPipelineProps {
  steps: AgentStep[];
  isVisible: boolean;
}

const agentColor: Record<string, string> = {
  intake:     "var(--c-intake)",
  research:   "var(--c-research)",
  reasoning:  "var(--c-reasoning)",
  drafting:   "var(--c-drafting)",
  escalation: "var(--c-escalation)",
};

export default function AgentPipeline({ steps, isVisible }: AgentPipelineProps) {
  if (!isVisible || steps.length === 0) return null;

  const doneCount = steps.filter((s) => s.status === "done").length;
  const totalCount = steps.length;
  const runningStep = steps.find((s) => s.status === "running");

  return (
    <div className="anim-scale-in mb-3 overflow-hidden rounded-xl"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-2)",
        boxShadow: "0 4px 24px rgba(0,0,0,.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border-1)" }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: runningStep ? "var(--gold-base)" : doneCount === totalCount ? "var(--green)" : "var(--text-400)",
          animation: runningStep ? "goldPulse 1.5s ease infinite" : undefined,
          boxShadow: runningStep ? "0 0 8px var(--gold-glow-strong)" : undefined,
        }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-300)" }}>
          {runningStep ? (
            <span className="shimmer">{AGENT_META[runningStep.agent].label}</span>
          ) : doneCount === totalCount ? (
            <span style={{ color: "var(--green)" }}>All agents completed</span>
          ) : (
            "Agent Pipeline"
          )}
        </span>
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: "var(--bg-void)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${(doneCount / totalCount) * 100}%`,
            background: "linear-gradient(90deg, var(--gold-base), var(--gold-bright))",
            transition: "width 400ms ease",
          }} />
        </div>
        <span style={{ fontSize: 10, color: "var(--text-400)", fontVariantNumeric: "tabular-nums" }}>
          {doneCount}/{totalCount}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", padding: "12px 14px", gap: 0, overflowX: "auto" }}>
        {steps.map((step, i) => {
          const meta = AGENT_META[step.agent];
          const isRunning = step.status === "running";
          const isDone = step.status === "done";
          const isIdle = step.status === "idle";
          const col = agentColor[step.agent];
          const isLast = i === steps.length - 1;

          return (
            <div key={step.agent} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                minWidth: 80,
                opacity: isIdle ? 0.28 : 1,
                transition: "opacity 300ms ease",
              }}>
                <div
                  className={isRunning ? "gold-pulse" : ""}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15,
                    background: isDone ? "rgba(40,201,138,.12)" : isRunning ? "rgba(58,128,204,.15)" : "var(--bg-void)",
                    border: `1.5px solid ${isDone ? "rgba(40,201,138,.4)" : isRunning ? "var(--gold-base)" : "var(--border-2)"}`,
                    boxShadow: isRunning ? `0 0 16px ${col}44` : isDone ? "0 0 8px rgba(40,201,138,.2)" : "none",
                    transition: "all 300ms ease",
                  }}
                >
                  {isDone ? (
                    <svg style={{ width: 14, height: 14, color: "var(--green)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isRunning ? (
                    <svg style={{ width: 14, height: 14, color: "var(--gold-bright)", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <span style={{ opacity: .5 }}>{meta.icon}</span>
                  )}
                </div>
                <p style={{
                  fontSize: 10, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap",
                  color: isDone ? "var(--green)" : isRunning ? "var(--gold-bright)" : "var(--text-400)",
                  transition: "color 300ms ease",
                }}>
                  {isDone ? "✓ " : ""}{meta.label.replace(" Agent", "")}
                </p>
              </div>

              {!isLast && (
                <div style={{
                  width: 20, height: 1, margin: "0 2px", marginBottom: 16, flexShrink: 0,
                  background: i < steps.findIndex(s => s.status === "idle")
                    ? "linear-gradient(90deg, rgba(40,201,138,.4), var(--border-2))"
                    : "var(--border-1)",
                  transition: "background 400ms ease",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
