import { ChatResponse } from "../types";

function detect(msg: string, keywords: string[]): boolean {
  const lower = msg.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function evictionResponse(jurisdiction: string): ChatResponse {
  const jname = jurisdiction === "lagos" ? "Lagos" : jurisdiction === "federal" ? "federal" : `${jurisdiction.charAt(0).toUpperCase() + jurisdiction.slice(1)}`;
  const statute = jurisdiction === "lagos" ? "Lagos Tenancy Law 2011" : "Recovery of Premises Act (Cap R4 LFN 2004)";
  const section = jurisdiction === "lagos" ? "Section 13(1)(b)" : "Section 7(1)";
  void jname;

  return {
    user_facing_response: `I understand this must be very stressful — but you have strong legal protection here.\n\nUnder ${statute}, ${section}, a landlord **cannot** evict a yearly tenant with less than **six months' written notice** — regardless of late payment. A one-week notice is entirely illegal.\n\nHere's what the law says and what you should do next:`,
    relevant_statutes: [
      {
        statute_name: statute,
        section: `${section} — Notice to Quit`,
        text: `A landlord shall not recover possession of a premises let for a yearly tenancy except by giving not less than six months' notice to quit in writing. No forfeiture clause in a tenancy agreement shall override this minimum statutory notice period.`,
        jurisdiction: jurisdiction === "lagos" ? "lagos" : "federal",
        relevance_score: 0.97,
        applies_because: `You are a tenant and your landlord served a one-week quit notice. This section sets the minimum lawful notice period for yearly tenants, which is six months.`,
      },
      {
        statute_name: "Rent Control and Recovery of Residential Premises Law",
        section: "Section 4 — Unlawful Eviction",
        text: `Any landlord who attempts to recover possession of residential premises otherwise than in accordance with this Law commits an offence and shall be liable on conviction to a fine or imprisonment.`,
        jurisdiction: "federal",
        relevance_score: 0.88,
        applies_because: "Your landlord's one-week notice violates the minimum notice requirement, making any eviction attempt unlawful.",
      },
    ],
    reasoning: {
      position_summary: `Your position is very strong. The one-week quit notice is unlawful under ${statute}. Your landlord cannot legally evict you on this notice alone.`,
      strength: "strong",
      supporting_argument: `Under ${statute} ${section}, the minimum notice for a yearly tenancy is six months. Late payment of rent does not reduce this notice period. Even if your tenancy agreement says otherwise, the statutory minimum overrides the contract.`,
      counter_arguments: [
        "Landlord may argue the tenancy is monthly rather than yearly — clarify what your rent cycle is.",
        "Landlord may cite a forfeiture clause in the agreement — but Nigerian courts have consistently held that statutory notice minimums override forfeiture clauses.",
      ],
      recommended_action: "send_demand_letter",
      user_facing_explanation: "Your landlord broke the law by giving you only one week. You are entitled to at least six months' notice. We have prepared a formal response letter you can send today.",
    },
    escalation: {
      escalation_needed: false,
      urgency: "within_week",
      reasons: [],
      recommended_routes: [],
      user_facing_message: "No immediate escalation needed. Send the demand letter and document all communication with your landlord.",
    },
    drafted_document: {
      document_type: "formal_response",
      suggested_filename: `Response_to_Illegal_Quit_Notice_${new Date().toISOString().slice(0,10)}.pdf`,
      document_markdown: `# FORMAL RESPONSE TO NOTICE TO QUIT\n\n**Date:** ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}\n\n**To:**\nThe Landlord / Property Owner\n[Landlord's Address]\n\n**Re: Response to Purported Notice to Quit — [Your Address]**\n\n---\n\nWhereas I received on [Date] a purported Notice to Quit requiring me to vacate the above-mentioned premises within one (1) week;\n\nI write to formally inform you that the said notice is **null and void** and of no legal effect, for the following reasons:\n\n1. Pursuant to **${statute}, ${section}**, a landlord shall not recover possession of premises let on a yearly tenancy except by giving not less than **six (6) months' notice to quit** in writing.\n\n2. The fact of a delayed rental payment does not extinguish my statutory right to the minimum notice period.\n\n3. Any attempt to forcibly evict me will constitute an actionable wrong, for which I shall seek all available legal remedies.\n\n**Demand:** You are hereby required to withdraw the said notice immediately.\n\nYours faithfully,\n\n_______________________________\n[Your Full Name]\n[Your Address]\n[Your Phone Number]\n[Date]\n`,
      key_points_summary: `• Formally declares the one-week notice null and void under ${statute} ${section}\n• Asserts your right to minimum six months' notice\n• Warns against forcible eviction\n• Demands the landlord withdraw the notice immediately`,
    },
  };
}

function salaryResponse(): ChatResponse {
  return {
    user_facing_response: `Your employer is in clear breach of Nigerian labour law. An employee cannot legally be denied their wages for more than 30 days — three months of withheld salary is a serious violation.\n\nHere is what the law says and your strongest options:`,
    relevant_statutes: [
      {
        statute_name: "Labour Act (Cap L1 LFN 2004)",
        section: "Section 7(1) — Payment of Wages",
        text: `An employer shall pay to each worker employed by him wages earned by that worker not later than the last day of the period to which the wages relate unless otherwise agreed. Any failure to pay wages constitutes an offence.`,
        jurisdiction: "federal",
        relevance_score: 0.96,
        applies_because: "Your employer has withheld three months of salary, directly violating the obligation to pay wages at the end of each pay period.",
      },
      {
        statute_name: "Labour Act (Cap L1 LFN 2004)",
        section: "Section 9(1) — Unlawful Deductions",
        text: `No deduction shall be made from a worker's wages except in accordance with this Act. An employer who without lawful justification withholds wages due to a worker shall be guilty of an offence.`,
        jurisdiction: "federal",
        relevance_score: 0.89,
        applies_because: "Withholding salary without a lawful reason constitutes an unlawful deduction under this section.",
      },
    ],
    reasoning: {
      position_summary: "Your position is strong. Three months of unpaid salary is a clear breach of the Labour Act. You are entitled to your full unpaid wages plus potential damages.",
      strength: "strong",
      supporting_argument: "Under Section 7(1) of the Labour Act, wages must be paid at the end of each pay period. Three months of non-payment is both a civil breach and a criminal offence.",
      counter_arguments: [
        "Employer may claim financial difficulty — this is not a legal defence for non-payment of wages.",
        "Employer may claim you owe a debt to the company — this can only be offset with written agreement.",
      ],
      recommended_action: "send_demand_letter",
      user_facing_explanation: "You are owed your salary. Send the demand letter first — many employers pay when formally confronted. If ignored, file at the Ministry of Labour (free) or National Industrial Court.",
    },
    escalation: {
      escalation_needed: false,
      urgency: "within_24h",
      reasons: [],
      recommended_routes: [
        { organization: "Ministry of Labour and Employment", why: "Free mediation service — file a complaint to trigger an official investigation.", contact: "09-523 6036" },
      ],
      user_facing_message: "If the demand letter is ignored, escalate to the Ministry of Labour. Their mediation is free and employers take it seriously.",
    },
    drafted_document: {
      document_type: "demand_letter",
      suggested_filename: `Salary_Demand_Letter_${new Date().toISOString().slice(0,10)}.pdf`,
      document_markdown: `# FORMAL DEMAND FOR UNPAID WAGES\n\n**Date:** ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}\n\n**To:**\n[Employer Name / HR Manager]\n[Company Name]\n[Company Address]\n\n**Re: Formal Demand for Payment of Salary Arrears**\n\n---\n\nI write formally to demand immediate payment of my outstanding salary arrears now totalling **three (3) months'** wages.\n\n**Legal Basis:**\n1. Pursuant to **Labour Act (Cap L1 LFN 2004), Section 7(1)**, wages must be paid not later than the last day of the period to which they relate.\n2. Under **Section 9(1)**, withholding wages without lawful justification constitutes an offence.\n\n**Demand:** Pay all outstanding wages within **seven (7) calendar days** of this letter.\n\nFailure to comply will result in a Ministry of Labour complaint and National Industrial Court proceedings.\n\nYours faithfully,\n\n_______________________________\n[Your Full Name]\n[Your Job Title]\n[Your Contact Number]\n[Date]\n`,
      key_points_summary: `• Formally demands three months of unpaid salary\n• Cites Labour Act Section 7(1)\n• Sets a 7-day deadline for payment\n• Threatens Ministry of Labour complaint`,
    },
  };
}

function policeResponse(): ChatResponse {
  return {
    user_facing_response: `What happened to you is illegal. Demanding a bribe is a criminal offence under Nigerian law. You have very clear rights here.\n\nHere is exactly what the law says and what you can do:`,
    relevant_statutes: [
      {
        statute_name: "Police Act 2020",
        section: "Section 24 — Misconduct",
        text: `A police officer who demands or accepts any bribe, gratification or consideration for performing or omitting to perform a duty commits a grave act of misconduct and shall be subject to dismissal and criminal prosecution.`,
        jurisdiction: "federal",
        relevance_score: 0.98,
        applies_because: "The officers demanded a bribe in exchange for allowing you to proceed.",
      },
      {
        statute_name: "Independent Corrupt Practices and Other Related Offences Act (ICPC Act)",
        section: "Section 8 — Soliciting Bribe",
        text: `Any public officer who, directly or indirectly, corruptly asks for, receives or obtains any property or benefit of any kind for himself or any other person shall be guilty of an offence and liable on conviction to imprisonment for not less than five years.`,
        jurisdiction: "federal",
        relevance_score: 0.93,
        applies_because: "Police officers are public officers. Demanding a bribe is an ICPC offence carrying a minimum 5-year prison sentence.",
      },
    ],
    reasoning: {
      position_summary: "You were a victim of police corruption. You have a right to report this to the Police Service Commission, the ICPC, or the NHRC.",
      strength: "strong",
      supporting_argument: "Under the Police Act 2020 and the ICPC Act, demanding a bribe is both a police misconduct offence and a criminal offence.",
      counter_arguments: [
        "Officers may deny the incident — document everything now while your memory is fresh.",
        "If you paid the bribe under duress, you are not liable — you were a victim of extortion.",
      ],
      recommended_action: "file_complaint",
      user_facing_explanation: "You did not have to pay — and if you did, you were extorted. Document the time, location, badge numbers, and any witnesses.",
    },
    escalation: {
      escalation_needed: true,
      urgency: "within_week",
      reasons: ["Police misconduct — formal complaint recommended"],
      recommended_routes: [
        { organization: "CLEEN Foundation", why: "Specialised in police conduct violations — they provide free support for complaints.", contact: "01-291 5782" },
        { organization: "Independent Corrupt Practices Commission (ICPC)", why: "The ICPC investigates bribery by public officers including police.", contact: "0800-CALL-ICPC (0800-2255-4272)" },
      ],
      user_facing_message: "You can report this. CLEEN Foundation and the ICPC handle these cases specifically.",
    },
    drafted_document: {
      document_type: "complaint",
      suggested_filename: `Police_Misconduct_Complaint_${new Date().toISOString().slice(0,10)}.pdf`,
      document_markdown: `# FORMAL COMPLAINT OF POLICE MISCONDUCT\n\n**Date:** ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}\n\n**To:**\nThe Commissioner of Police\n[State] State Police Command\n\n**Re: Formal Complaint Against Police Officers for Solicitation of Bribe**\n\n---\n\nI, [Your Full Name], formally lodge a complaint against officers of this command who solicited a bribe from me on [Date] at [Location].\n\n**Facts:**\nOn [Date] at approximately [Time], I was stopped by officers [Badge Numbers] at [Location]. The officers demanded [Amount] as a "settlement" without any lawful basis.\n\nThis constitutes solicitation of a bribe contrary to Section 24 of the Police Act 2020 and Section 8 of the ICPC Act.\n\n**Relief Sought:** Full investigation, disciplinary and criminal action, and written confirmation of receipt.\n\nYours faithfully,\n\n_______________________________\n[Your Full Name]\n[Your Address]\n[Your Phone Number]\n\n*cc: CLEEN Foundation, ICPC*\n`,
      key_points_summary: `• Documents the bribery incident with date and location\n• Cites Police Act 2020 Section 24 and ICPC Act Section 8\n• Requests investigation and disciplinary action\n• Carbon-copied to CLEEN Foundation and ICPC`,
    },
  };
}

function contractReviewResponse(): ChatResponse {
  return {
    user_facing_response: `I can perform an adversarial review of your tenancy agreement. Upload the document using the paperclip button below and I will:\n\n1. **Extract every clause** and cross-reference it against Nigerian statute\n2. **Flag clauses that are illegal, predatory, or unenforceable**\n3. **Highlight clauses that protect you** and those that favour the landlord\n\nWhile you upload, here are the most common illegal clauses in Nigerian tenancy agreements:`,
    relevant_statutes: [
      {
        statute_name: "Lagos Tenancy Law 2011",
        section: "Section 4 — Prohibited Provisions",
        text: `Any provision in a tenancy agreement that purports to waive a tenant's statutory rights under this Law shall be void and of no effect.`,
        jurisdiction: "lagos",
        relevance_score: 0.91,
        applies_because: "This makes unenforceable any clause that tries to take away your statutory rights as a tenant.",
      },
      {
        statute_name: "Rent Control and Recovery of Residential Premises Law",
        section: "Section 2 — Unlawful Premiums",
        text: `No person shall, as a condition of the grant or continuance of a tenancy of any premises, require the payment of any premium, fine or other like sum in addition to the rent.`,
        jurisdiction: "federal",
        relevance_score: 0.85,
        applies_because: "Landlords cannot legally charge agency fees or caution fees beyond the agreed rent.",
      },
    ],
    reasoning: {
      position_summary: "Ready to review your agreement. Common issues include: waiver of notice rights, illegal premium charges, unilateral rent increase clauses, and excessive penalty clauses.",
      strength: "moderate",
      supporting_argument: "Nigerian courts have consistently struck down tenancy clauses that waive statutory notice periods, impose illegal fees, or allow unilateral mid-tenancy rent increases.",
      counter_arguments: [
        "If you have already signed and moved in, challenging clauses becomes harder.",
        "Some clauses may be legal at federal level but illegal under specific state laws.",
      ],
      recommended_action: "gather_evidence",
      user_facing_explanation: "Upload the agreement for a full clause-by-clause review.",
    },
    escalation: {
      escalation_needed: false,
      urgency: "none",
      reasons: [],
      recommended_routes: [],
      user_facing_message: "Upload your agreement whenever ready.",
    },
  };
}

function generalResponse(message: string): ChatResponse {
  void message;
  return {
    user_facing_response: `Thank you for reaching out to TheLaaw. I've reviewed your situation and here's an initial assessment.\n\nTo give you the most accurate legal information, could you clarify:\n\n1. **Which state** are you in? (select your jurisdiction in the sidebar)\n2. **When did this happen** — and are there any upcoming deadlines or court dates?\n3. **Do you have any written documents** related to this situation?\n\nOnce I have this information, I can retrieve the relevant Nigerian statutes and give you a precise assessment.`,
    relevant_statutes: [],
    reasoning: {
      position_summary: "Awaiting clarifying information to properly assess your legal position under Nigerian law.",
      strength: "moderate",
      supporting_argument: "Nigerian law provides protections across tenancy, labour, consumer rights, and police conduct matters.",
      counter_arguments: ["More facts needed before a full assessment can be made."],
      recommended_action: "gather_evidence",
      user_facing_explanation: "Provide the details above and I'll research the exact statutes that apply.",
    },
    escalation: {
      escalation_needed: false,
      urgency: "none",
      reasons: [],
      recommended_routes: [],
      user_facing_message: "",
    },
  };
}

export async function getMockResponse(message: string, jurisdiction: string): Promise<ChatResponse> {
  await delay(2800 + Math.random() * 1200);

  const isEviction = detect(message, ["evict", "quit notice", "pack out", "landlord", "tenancy", "rent", "house", "accommodation", "vacate", "leave my room"]);
  const isSalary   = detect(message, ["salary", "wage", "pay", "employer", "payment", "unpaid", "withheld", "job", "dismiss", "terminate", "sack", "fired", "employment"]);
  const isPolice   = detect(message, ["police", "officer", "bribe", "arrest", "stop and search", "extort", "warrant", "detention", "custody"]);
  const isContract = detect(message, ["contract", "agreement", "review", "sign", "upload", "document", "clause"]);

  if (isEviction) return evictionResponse(jurisdiction);
  if (isSalary)   return salaryResponse();
  if (isPolice)   return policeResponse();
  if (isContract) return contractReviewResponse();
  return generalResponse(message);
}
