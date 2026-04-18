export type AgentName = "intake" | "research" | "reasoning" | "drafting" | "escalation";
export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentStep {
  agent: AgentName;
  status: AgentStatus;
  label: string;
  detail?: string;
  startedAt?: number;
  completedAt?: number;
}

export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "audio" | "document" | "pdf";

export interface Citation {
  statute_name: string;
  section: string;
  text: string;
  jurisdiction: string;
  relevance_score: number;
  applies_because: string;
}

export interface EscalationRoute {
  organization: string;
  why: string;
  contact: string;
}

export interface DraftedDocument {
  document_type: "demand_letter" | "complaint" | "formal_response" | "grievance";
  suggested_filename: string;
  document_markdown: string;
  key_points_summary: string;
  pdf_url?: string;
}

export interface ReasoningResult {
  position_summary: string;
  strength: "strong" | "moderate" | "weak";
  supporting_argument: string;
  counter_arguments: string[];
  recommended_action: string;
  user_facing_explanation: string;
}

export interface EscalationResult {
  escalation_needed: boolean;
  urgency: "immediate" | "within_24h" | "within_week" | "none";
  reasons: string[];
  recommended_routes: EscalationRoute[];
  user_facing_message: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: Date;
  agentSteps?: AgentStep[];
  citations?: Citation[];
  reasoning?: ReasoningResult;
  escalation?: EscalationResult;
  draftedDocument?: DraftedDocument;
  audioUrl?: string;
  fileName?: string;
  isStreaming?: boolean;
}

export interface ChatPayload {
  message: string;
  session_id: string;
  message_type: "text" | "audio" | "image";
  base64_audio?: string;
  base64_image?: string;
}

export interface ChatResponse {
  user_facing_response: string;
  extracted_facts?: Record<string, unknown>;
  clarifying_questions?: string[];
  relevant_statutes?: Citation[];
  reasoning?: ReasoningResult;
  escalation?: EscalationResult;
  drafted_document?: DraftedDocument;
  agent_trace?: AgentStep[];
}

export type JurisdictionOption =
  | "federal"
  | "lagos" | "ogun" | "oyo" | "osun" | "ondo" | "ekiti"
  | "anambra" | "enugu" | "imo" | "abia" | "ebonyi"
  | "rivers" | "delta" | "edo" | "bayelsa" | "akwa_ibom" | "cross_river"
  | "kano" | "kaduna" | "katsina" | "sokoto" | "zamfara" | "jigawa" | "kebbi"
  | "borno" | "adamawa" | "gombe" | "bauchi" | "yobe" | "taraba"
  | "fct" | "kogi" | "kwara" | "niger" | "benue" | "plateau" | "nasarawa";

export const JURISDICTION_LABELS: Record<JurisdictionOption, string> = {
  federal:     "Federal (All States)",
  lagos:       "Lagos State",
  ogun:        "Ogun State",
  oyo:         "Oyo State",
  osun:        "Osun State",
  ondo:        "Ondo State",
  ekiti:       "Ekiti State",
  anambra:     "Anambra State",
  enugu:       "Enugu State",
  imo:         "Imo State",
  abia:        "Abia State",
  ebonyi:      "Ebonyi State",
  rivers:      "Rivers State",
  delta:       "Delta State",
  edo:         "Edo State",
  bayelsa:     "Bayelsa State",
  akwa_ibom:   "Akwa Ibom State",
  cross_river: "Cross River State",
  kano:        "Kano State",
  kaduna:      "Kaduna State",
  katsina:     "Katsina State",
  sokoto:      "Sokoto State",
  zamfara:     "Zamfara State",
  jigawa:      "Jigawa State",
  kebbi:       "Kebbi State",
  borno:       "Borno State",
  adamawa:     "Adamawa State",
  gombe:       "Gombe State",
  bauchi:      "Bauchi State",
  yobe:        "Yobe State",
  taraba:      "Taraba State",
  fct:         "FCT Abuja",
  kogi:        "Kogi State",
  kwara:       "Kwara State",
  niger:       "Niger State",
  benue:       "Benue State",
  plateau:     "Plateau State",
  nasarawa:    "Nasarawa State",
};

export const AGENT_META: Record<AgentName, { label: string; color: string; icon: string; description: string }> = {
  intake:     { label: "Intake Agent",     color: "agent-intake",     icon: "🔍", description: "Classifying your situation and extracting key facts" },
  research:   { label: "Research Agent",   color: "agent-research",   icon: "📚", description: "Querying Nigerian statutes database" },
  reasoning:  { label: "Reasoning Agent",  color: "agent-reasoning",  icon: "⚖️", description: "Building your legal argument" },
  drafting:   { label: "Drafting Agent",   color: "agent-drafting",   icon: "✍️", description: "Preparing your formal document" },
  escalation: { label: "Escalation Agent", color: "agent-escalation", icon: "🚨", description: "Checking for urgent referrals" },
};
