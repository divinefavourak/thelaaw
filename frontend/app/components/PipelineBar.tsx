"use client";

import { AgentStep, AgentName } from "../types";

interface PipelineBarProps {
  steps: AgentStep[];
  isLoading: boolean;
}

const AGENT_LABELS: Record<AgentName, string> = {
  intake:     "Intake",
  research:   "Research",
  reasoning:  "Reasoning",
  drafting:   "Drafting",
  escalation: "Escalation",
};

export default function PipelineBar({ steps, isLoading }: PipelineBarProps) {
  if (steps.length === 0) return null;

  const doneCount   = steps.filter((s) => s.status === "done").length;
  const runningStep = steps.find((s) => s.status === "running");
  const allDone     = doneCount === steps.length && !isLoading;

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 40,
        borderBottom: "1px solid var(--border-1)",
        background: "var(--bg-surface)",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* Stage pills + connectors */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((step, i) => {
          const isDone    = step.status === "done";
          const isRunning = step.status === "running";
          const isLast    = i === steps.length - 1;
          const label     = AGENT_LABELS[step.agent] ?? step.agent;

          return (
            <div key={step.agent} style={{ display: "flex", alignItems: "center" }}>
              {/* Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: isDone
                    ? "rgba(40,201,138,.08)"
                    : isRunning
                    ? "rgba(201,168,76,.1)"
                    : "transparent",
                  border: `1px solid ${
                    isDone
                      ? "rgba(40,201,138,.22)"
                      : isRunning
                      ? "rgba(201,168,76,.3)"
                      : "transparent"
                  }`,
                  transition: "all 300ms ease",
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: isDone
                      ? "var(--green)"
                      : isRunning
                      ? "var(--gold-base)"
                      : "var(--border-3)",
                    boxShadow: isRunning
                      ? "0 0 6px rgba(201,168,76,.7)"
                      : undefined,
                    animation: isRunning ? "goldPulse 1.5s ease infinite" : undefined,
                    transition: "background 300ms ease, box-shadow 300ms ease",
                  }}
                />
                {/* Label */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".01em",
                    whiteSpace: "nowrap",
                    color: isDone
                      ? "var(--green)"
                      : isRunning
                      ? "var(--gold-bright)"
                      : "var(--text-400)",
                    transition: "color 300ms ease",
                  }}
                >
                  {isDone ? `✓ ${label}` : label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  style={{
                    width: 18,
                    height: 1,
                    flexShrink: 0,
                    background:
                      i < doneCount
                        ? "rgba(40,201,138,.28)"
                        : "var(--border-1)",
                    transition: "background 400ms ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right-side status */}
      {isLoading && runningStep && (
        <span
          style={{
            fontSize: 11,
            color: "var(--gold-bright)",
            fontWeight: 600,
            fontStyle: "italic",
            animation: "pulse 1.8s ease infinite",
          }}
        >
          {runningStep.label}…
        </span>
      )}
      {allDone && (
        <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>
          Done
        </span>
      )}
    </div>
  );
}
