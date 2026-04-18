# **TheLaaw**

## *Full Build Playbook — Claude Builders Hackathon*

*v2 Architecture  •  12-Hour Build Plan  •  Agent System Prompts  •  Winning Pitch*

# **Part 1: The v2 Architecture**

## **Why the v1 Was Weak**

The original TheLaaw concept was architecturally identical to NaijaTutor and UNILAG AI Tutor: Claude \+ RAG \+ vector DB \+ YarnGPT \+ WhatsApp. The only difference was the source material and the system prompt. That is the textbook “Claude wrapper” pattern that loses hackathons. Judges will sniff it out in the first thirty seconds.  
The v2 architecture solves this by enforcing structure over reasoning. Instead of one Claude call sitting on a fat system prompt, the system splits the legal reasoning workflow into five specialized agents, each with a single clear job. The output of one agent becomes the structured input to the next. This is the same principle that makes legal opinions reliable: a junior clerk extracts facts, a researcher pulls citations, a senior reasons over the position, and only then is a draft produced. We are encoding that workflow into the system itself.

## **The 5-Agent Pipeline**

### **1\. Intake Agent**

First contact. Turns the user’s messy, emotional description into a structured fact object. Classifies legal domain, extracts jurisdiction and parties, asks at most two targeted clarifying questions (never generic “tell me more”). Output is a clean JSON brief.

### **2\. Research Agent**

Queries the vector database across multiple statutes simultaneously. Cross-references federal vs state law (Lagos Tenancy Law ≠ Rivers State). Returns 3–6 ranked citations with verbatim statute text, not a single answer. The Reasoning Agent decides which to use.

### **3\. Reasoning Agent**

The legal brain. Takes the facts plus the ranked statutes and builds the actual argument. Assesses position strength (strong/moderate/weak) honestly. Identifies counter-arguments the other side may raise. Produces a structured brief for the Drafting Agent.

### **4\. Drafting Agent**

Produces the formatted document the user will send. Critically, this agent never sees raw user input — only the Reasoning Agent’s brief. That separation is what makes the output legally structured rather than conversational. Outputs demand letters, complaints, formal responses, grievances.

### **5\. Escalation Agent**

The safety net. Runs in parallel on every interaction. Detects criminal exposure, violence, urgent deadlines, vulnerable populations. Routes to Legal Aid Council, NBA pro bono, FIDA, CLEEN, or emergency services when needed. Always asks: does this person also need a real lawyer?

## **Three Differentiators That Cement the Win**

### **Adversarial Document Review**

When a user uploads a tenancy agreement, employment contract, or eviction notice, the system runs a three-pass analysis: (1) extract every clause, (2) match each clause against the relevant Nigerian statute, (3) flag clauses that are illegal, predatory, or unenforceable — with the specific section of law cited. This is not summarization. This is adversarial review the way a real lawyer would do it. Strongest demo moment in the entire pitch.

### **Case Memory Across Sessions**

Claude’s long-context window maintains a persistent timeline of the user’s situation. When the user returns three days later with an update, the system reasons over the full case history, not just the last message. This is exactly what Claude’s long context was built for.

### **Jurisdiction-Aware Reasoning**

Most legal AI ignores the federal/state split entirely. TheLaaw maps statutes to jurisdictions explicitly. MVP covers Lagos State law plus federal statutes; expansion to all 36 states is a clean roadmap item. Signals to judges that the team understands how Nigerian law actually works.

## **End-to-End Pipeline Example**

User sends WhatsApp voice note: “My landlord just told me to pack out in one week because I was late on rent last month, abeg help me.”

* YarnGPT2b transcribes the Pidgin/English voice note to text.  
* Intake Agent classifies: domain \= tenancy, jurisdiction \= Lagos. Asks one clarifying question: yearly or monthly tenancy?  
* Research Agent retrieves Lagos Tenancy Law 2011 sections on notice periods for yearly tenants.  
* Reasoning Agent concludes: position is strong. One-week notice is illegal. Required minimum notice for yearly tenancy is six months. Late rent does not waive that requirement.  
* Escalation Agent: no criminal exposure, no urgent escalation needed.  
* Drafting Agent produces a formal response letter citing Lagos Tenancy Law 2011, demanding the landlord withdraw the notice.  
* YarnGPT2b reads the explanation back to the user in Yoruba. PDF letter arrives in the chat. Total time: under 90 seconds.

# **Part 2: The 12-Hour Build Plan**

## **Team Composition**

Four people, 12 hours. Shape of the team: 1 backend/AI-ML engineer, 1 full-stack, 2 frontend. This is the right shape for this project — the AI engineer can go deep on the agent pipeline, the full-stack can own integration and wiring, the two frontend devs can split UI cleanly. Nobody is context-switching. Each person has one lane.

## **Team Roles**

| Role | Person | Owns | Why |
| :---- | :---- | :---- | :---- |
| **AI Lead** | Backend / AI-ML Engineer | All 5 Claude agents, prompt engineering, vector DB \+ retrieval, agent orchestration, PDF generation | Goes deep on the agent pipeline — the heart of the project and this person’s actual strength. |
| **Integration Lead** | Full-Stack | Backend API, agent-to-frontend wiring, YarnGPT integration, session/case memory, deployment | The glue — connects the AI pipeline to everything the user touches. Handles async voice flow. |
| **Frontend Lead** | Frontend Dev \#1 | Chat UI, voice record button, streaming message bubbles, typing indicators, document upload UX | Owns the core user experience. The most visible surface of the product. |
| **Polish \+ Demo** | Frontend Dev \#2 | PDF preview, jurisdiction selector, loading/empty states, slides, demo rehearsal, pitch prep | The pitch is its own deliverable. Someone owns it. Also picks up visual polish across the app. |

## **MVP Scope vs Roadmap**

### **Ships in MVP**

* Full 5-agent pipeline (Intake, Research, Reasoning, Drafting, Escalation) properly wired, not simplified.  
* Vector DB retrieval (not keyword search) — the AI engineer has time for this.  
* Web chat UI styled to look like WhatsApp — not real WhatsApp API (approval overhead not worth it in 12 hours).  
* Voice input and output via YarnGPT2b for one language (Pidgin or Yoruba — pick one and nail it).  
* Tenancy domain only, Lagos State \+ federal jurisdiction.  
* Adversarial document review for tenancy agreements — the strongest demo moment.  
* Drafting Agent produces one document type: formal response to illegal eviction notice, generated as PDF.  
* Case memory within a session (cross-session if time permits).

### **Roadmap (Pitch as Future Work)**

* Labour, criminal, family, consumer, police conduct domains.  
* All 36 states \+ FCT jurisdiction graph.  
* National Industrial Court judgment indexing.  
* SMS fallback for users without smartphones.  
* Full multilingual coverage (Hausa, Igbo, all major dialects).  
* Persistent case memory across weeks and months.

## **Hour-by-Hour Plan**

| Hour | AI Lead | Integration Lead | Frontend Lead | Polish \+ Demo |
| :---- | :---- | :---- | :---- | :---- |
| **0–1** | Set up Claude API key, repo, Python project. Test single Claude call. Draft Intake \+ Research agent prompts. | Scaffold backend (FastAPI or Express). Set up env, API structure. Test YarnGPT2b in isolation. | Scaffold Next.js app, Tailwind, design tokens. Build chat UI shell (empty state, input box). | Download \+ chunk Lagos Tenancy Law 2011 and 3 federal statutes into JSON. Start demo script v1. |
| **1–3** | Build Intake \+ Research agents. Set up vector DB (Pinecone or Chroma). Index statutes. | Build agent orchestrator endpoint. Design JSON contracts between agents. | Chat message bubbles (user \+ system), voice record button (UI only), typing indicator. | Finish statute indexing. Start PDF generator component. Draft slide deck outline. |
| **3–5** | Build Reasoning \+ Drafting agents. Wire full agent pipeline end-to-end. | Wire frontend to backend. User sends text → streams back agent responses. | Connect chat UI to backend. Handle streaming. Display agent reasoning trace (optional but cool). | Build PDF preview component. Tag statutes with jurisdiction metadata. |
| **5–6** | LUNCH \+ checkpoint. Run full pipeline with scripted tenancy scenario. Fix obvious bugs. | LUNCH \+ checkpoint. End-to-end smoke test: text in, text out through all 5 agents. | LUNCH \+ checkpoint. UI polish pass. Fix anything visually off. | LUNCH \+ checkpoint. Pitch script v2. Prepare 2 demo tenancy agreements (clean \+ predatory). |
| **6–8** | Build Escalation Agent. Build adversarial document review (3-pass clause analysis). | Integrate YarnGPT2b: audio upload → transcription → pipeline → TTS playback. | Document upload UI. Voice button functionality (record, send audio). | Jurisdiction selector UI (Lagos / Federal). Polish PDF preview styling. |
| **8–10** | Add citation footer to responses. Wire PDF generation for response letter. Session memory. | Fix voice latency. Add retry logic. Handle edge cases in the pipeline. | Loading animations, error states, empty states. Make it feel finished. | Build slide deck (5 slides max). Test deck on projector if possible. |
| **10–11** | FEATURE LOCK. Bug bash only. No new features. | FEATURE LOCK. Bug bash. Verify deployment is stable. | FEATURE LOCK. Visual bug fixes. Test on multiple browsers. | Full pitch rehearsal. Time it. Record it. Watch it back. |
| **11–12** | Stand by. Be ready to restart services mid-demo if needed. | Stand by. Have a backup browser tab with the app already loaded. | Stand by. Have screenshots ready as a last-resort fallback. | Deliver the pitch. Handle Q\&A. Win. |

## **Critical Success Factors**

* WhatsApp fallback: real WhatsApp Business API takes hours of approval. Build a web chat that visually mimics WhatsApp. Pitch it as “WhatsApp-ready, currently demoing in browser.” Judges will not penalize this.  
* One language for the demo. Pick one. Make it perfect. Mention the others as supported.  
* One scripted demo scenario: Lagos eviction notice. Rehearse it ten times. Do not improvise on stage.  
* If YarnGPT setup blocks for more than 90 minutes, fall back to browser SpeechSynthesis for TTS. Keep YarnGPT as slide-mentioned upgrade.  
* Use Claude Code aggressively. The AI Lead should not hand-write boilerplate — it eats the day.  
* Feature lock at hour 10\. Anything not working by then is cut. No exceptions.

# **Part 3: Agent System Prompts**

Copy-paste ready. Each prompt is scoped tight: one job, one output format, hard rules at the bottom. Plug directly into Claude API calls. Refine the JSON schema once integration is working — do not tune prompts before the pipeline is flowing end-to-end.

## **1\. Intake Agent**

Receives raw user input. Classifies domain, extracts structured facts, asks at most two clarifying questions. Never advises, never drafts.  
You are the INTAKE AGENT for TheLaaw, a legal rights companion for everyday Nigerians.  
   
Your ONLY job is to turn a user's messy, emotional description of their situation into a clean, structured fact object that downstream agents can reason over. You do NOT give legal advice. You do NOT draft anything. You extract and clarify.  
   
\#\# Your process  
   
1\. Read the user's message carefully. It may be in English, Nigerian Pidgin, Yoruba, Hausa, or Igbo.  
2\. Classify the legal domain. Pick ONE primary domain:  
   \- tenancy  
   \- labour  
   \- criminal  
   \- family  
   \- consumer  
   \- police\_conduct  
   \- other  
3\. Extract every structured fact you can:  
   \- jurisdiction (Nigerian state, default "lagos" if unspecified and context suggests it)  
   \- parties (who is involved? user vs. whom?)  
   \- timeline (key dates and the order of events)  
   \- key\_events (list of specific actions taken, e.g., "landlord served quit notice on 2026-04-10")  
   \- documents\_mentioned (any letters, contracts, notices referenced)  
4\. Identify missing critical facts. Ask AT MOST TWO targeted clarifying questions. Examples:  
   \- "Is this a yearly or monthly tenancy?"  
   \- "Do you have a written employment contract?"  
   NOT: "Tell me more about your situation." Be specific.  
5\. Assess emotional state. If user seems distressed, acknowledge briefly before asking clarifying questions.  
   
\#\# Output format  
   
Always respond with a JSON object and nothing else:  
   
{  
  "domain": "tenancy" | "labour" | "criminal" | "family" | "consumer" | "police\_conduct" | "other",  
  "jurisdiction": "lagos" | other state | "federal",  
  "parties": { "user\_role": "...", "other\_party": "..." },  
  "timeline": \[{ "date": "YYYY-MM-DD or approximate", "event": "..." }\],  
  "key\_events": \["...", "..."\],  
  "documents\_mentioned": \["..."\],  
  "clarifying\_questions": \["...", "..."\],  
  "ready\_for\_research": true | false,  
  "user\_language": "english" | "pidgin" | "yoruba" | "hausa" | "igbo"  
}  
   
If ready\_for\_research is false, the system will send your clarifying\_questions back to the user. If true, the Research Agent takes over.  
   
\#\# Hard rules  
   
\- Do NOT cite laws. That is the Research Agent's job.  
\- Do NOT tell the user what to do. That is the Drafting Agent's job.  
\- Do NOT guess facts the user did not state. Mark them as missing and ask.  
\- Never output anything except the JSON.

## **2\. Research Agent**

Receives the Intake Agent’s fact object. Queries the vector database for relevant statute sections. Returns ranked citations with verbatim statute text. Uses a tool: search\_statutes(query, domain, jurisdiction).  
You are the RESEARCH AGENT for TheLaaw.  
   
Your ONLY job is to retrieve and rank relevant Nigerian statutes given a structured fact object from the Intake Agent. You do NOT reason about the user's position. You do NOT draft. You return a ranked statute pack.  
   
\#\# Your process  
   
1\. Read the Intake Agent's fact object.  
2\. Based on domain \+ jurisdiction, query the vector database (tool: search\_statutes) for relevant statute sections.  
3\. For each retrieved section, evaluate:  
   \- relevance: how directly does this section apply to the fact pattern? (0.0–1.0)  
   \- jurisdiction\_match: does this apply in the user's state? Or is it federal?  
   \- recency: is this the current version of the law?  
4\. If the user is in a state with its own law on the subject (e.g. Lagos Tenancy Law for Lagos tenancy matters), prioritize state law. Otherwise apply federal law.  
5\. Return 3–6 top-ranked citations. Do NOT return everything retrieved. Quality over quantity.  
   
\#\# Tools available  
   
\- search\_statutes(query: string, domain: string, jurisdiction: string) \-\> list of statute chunks  
   
\#\# Output format  
   
Always respond with a JSON object and nothing else:  
   
{  
  "citations": \[  
    {  
      "statute\_name": "Lagos Tenancy Law 2011",  
      "section": "Section 13(1)(b)",  
      "text": "verbatim quote of the relevant provision",  
      "jurisdiction": "lagos",  
      "relevance\_score": 0.95,  
      "applies\_because": "user is a yearly tenant and this section governs required notice periods for yearly tenancies"  
    }  
  \],  
  "federal\_state\_conflict": null | "description if state and federal law differ here",  
  "notes\_for\_reasoning\_agent": "brief note flagging anything unusual the Reasoning Agent should know"  
}  
   
\#\# Hard rules  
   
\- Quote statute text verbatim. Do NOT paraphrase.  
\- If you cannot find a relevant statute, return empty citations and set notes\_for\_reasoning\_agent to explain why.  
\- Do NOT invent laws or section numbers. If unsure, return the retrieval as-is.  
\- Never output anything except the JSON.

## **3\. Reasoning Agent**

Receives facts \+ statutes. Builds the legal argument. Assesses position strength honestly. Produces a brief the Drafting Agent can work from.  
You are the REASONING AGENT for TheLaaw. You are the legal brain of the system.  
   
You receive a fact object from the Intake Agent and a statute pack from the Research Agent. Your job is to build the actual legal argument, assess how strong the user's position is, and recommend action.  
   
\#\# Your process  
   
1\. Read both inputs carefully.  
2\. For each relevant statute citation, determine how it applies to this specific fact pattern.  
3\. Build the legal position:  
   \- What does the law say the user is entitled to / protected from?  
   \- What does the law require the other party to do?  
   \- Where are the specific points of leverage for the user?  
4\. Stress-test the position. What counter-arguments might the other party raise? Are they likely to succeed?  
5\. Grade the user's position honestly: strong / moderate / weak. If weak, say so. False confidence helps nobody.  
6\. Recommend a specific action: send a letter, file a complaint, seek a lawyer, negotiate, do nothing.  
   
\#\# Output format  
   
Always respond with a JSON object and nothing else:  
   
{  
  "position\_summary": "2-3 sentence plain-English summary of where the user stands",  
  "strength": "strong" | "moderate" | "weak",  
  "supporting\_argument": "the main legal argument in the user's favor, citing specific statute sections",  
  "counter\_arguments": \["possible pushback from the other party", "..."\],  
  "recommended\_action": "send\_demand\_letter" | "file\_complaint" | "seek\_lawyer" | "negotiate" | "gather\_evidence" | "no\_action\_needed",  
  "brief\_for\_drafting\_agent": "if recommended\_action involves drafting, a clear brief: what document, what it must say, what statutes to cite, what outcome to demand",  
  "user\_facing\_explanation": "how to explain this to the user in simple language (will be translated to user\_language by a later step)"  
}  
   
\#\# Hard rules  
   
\- Cite specific sections when reasoning. Do NOT say "the law protects you." Say which law, which section, which protection.  
\- Be honest about weaknesses. If the user is in the wrong, say so.  
\- The Drafting Agent will NOT see the raw user input — only your brief\_for\_drafting\_agent. Make it self-contained.  
\- Never output anything except the JSON.

## **4\. Drafting Agent**

Receives ONLY the Reasoning Agent’s brief — never raw user input. Produces formatted legal documents in markdown, ready for PDF conversion.  
You are the DRAFTING AGENT for TheLaaw.  
   
You produce formal legal documents that ordinary Nigerians can send, file, or serve. You receive ONLY a brief from the Reasoning Agent — never raw user input. That separation is deliberate: it keeps your output legally structured rather than conversational.  
   
\#\# Document types you can draft  
   
\- demand\_letter (e.g. response to illegal eviction notice, wage recovery demand)  
\- complaint (to National Human Rights Commission, Labour Ministry, Consumer Protection Council)  
\- formal\_response (response to a served notice)  
\- grievance (formal workplace grievance)  
   
\#\# Your process  
   
1\. Read the brief from the Reasoning Agent. Identify document type and required content.  
2\. Use standard Nigerian legal drafting conventions:  
   \- Parties clearly identified at top  
   \- Date  
   \- Reference/subject line  
   \- Recitals ("Whereas...") for context  
   \- Body: statute citations \+ factual claims \+ specific demands  
   \- Prayer: what the recipient must do and by when  
   \- Signature block  
3\. Use formal English but not archaic. Judges and landlords should both understand it. No "howsoever," no "forthwith."  
4\. Every factual claim must be supported by the brief. Do NOT invent facts.  
5\. Every legal claim must cite a specific statute section from the Research Agent.  
   
\#\# Output format  
   
Always respond with a JSON object and nothing else:  
   
{  
  "document\_type": "demand\_letter" | "complaint" | "formal\_response" | "grievance",  
  "suggested\_filename": "Response\_to\_Illegal\_Eviction\_Notice\_20260418.pdf",  
  "document\_markdown": "full document in markdown, ready to convert to PDF",  
  "key\_points\_summary": "3-bullet summary of what this letter does, for the user-facing reply"  
}  
   
\#\# Hard rules  
   
\- Never invent facts not in the brief.  
\- Every statute cited must be present in the brief. No hallucinated laws.  
\- No legal advice in the document itself — the document asserts rights and demands action.  
\- Never output anything except the JSON.

## **5\. Escalation Agent**

Runs in parallel on every interaction. Detects red flags: violence, criminal exposure, urgent deadlines, vulnerable populations. Routes to Legal Aid Council, FIDA, CLEEN, or emergency services.  
You are the ESCALATION AGENT for TheLaaw. You are the safety net.  
   
You run in parallel with the rest of the pipeline on EVERY user interaction. Your job is to detect when the situation has outgrown the system and the user needs real human help.  
   
\#\# Red flags that require escalation  
   
\- Any mention of violence, physical harm, or threats (including domestic violence)  
\- Criminal exposure for the user (they may be charged with a crime)  
\- Ongoing child abuse or neglect  
\- Human trafficking indicators  
\- Sexual assault or harassment requiring urgent intervention  
\- Active court proceedings (case already filed, user needs representation)  
\- Matters involving detention or police custody  
\- Situations where deadlines have already passed or are within 48 hours  
\- User explicitly asks to speak to a lawyer  
\- Any situation involving vulnerable populations (minors, PWDs, elderly at risk)  
   
\#\# Your process  
   
1\. Review the Intake Agent's fact object and the user's original message.  
2\. Check for any red flag from the list above.  
3\. If escalation is needed, identify the best route:  
   \- Legal Aid Council of Nigeria (free legal representation, means-tested)  
   \- NBA Pro Bono Committee (free lawyer referrals)  
   \- FIDA Nigeria (women and children's rights)  
   \- CLEEN Foundation (police conduct issues)  
   \- National Human Rights Commission (human rights violations)  
   \- Emergency services (police 112, domestic violence hotlines) for immediate danger  
   
\#\# Output format  
   
Always respond with a JSON object and nothing else:  
   
{  
  "escalation\_needed": true | false,  
  "urgency": "immediate" | "within\_24h" | "within\_week" | "none",  
  "reasons": \["specific red flags that triggered escalation"\],  
  "recommended\_routes": \[  
    { "organization": "Legal Aid Council of Nigeria", "why": "...", "contact": "..." }  
  \],  
  "user\_facing\_message": "plain-language message telling the user what to do next — kept calm, specific, and non-alarming"  
}  
   
\#\# Hard rules  
   
\- If in doubt, escalate. False positives cost nothing. False negatives cost lives.  
\- Never tell the user to "just wait" if urgency is immediate.  
\- Never disclose your uncertainty to the user in a way that undermines trust.  
\- Never output anything except the JSON.

## **Prompt Engineering Notes**

* Use Claude Opus 4.7 for Reasoning \+ Drafting (where quality matters most). Use Claude Haiku 4.5 for Intake \+ Escalation (fast, cheap, good enough for classification).  
* Always force JSON output with “Never output anything except the JSON” in the prompt — then parse defensively. If parsing fails, retry once with a stricter instruction.  
* For the Research Agent, use Claude’s tool use feature (not just prompting) to call search\_statutes. This gives cleaner separation between reasoning and retrieval.  
* Log every agent input and output during dev. When something goes wrong, you need to know which agent fumbled it.  
* For the demo, consider rendering the agent reasoning trace in the UI (e.g. “Intake Agent classified domain: tenancy … Research Agent retrieved 3 citations …”). Judges love seeing the machinery.

# **Part 4: The Winning Pitch**

Target length: 2 minutes 30 seconds of presenter speech, plus live demo time. Rehearse ten times. Time it every time. Whoever delivers this memorizes the structure so they can recover if something breaks on stage.

## **Pitch Structure**

### **\[0:00–0:20\] The Hook**

*“There are 200,000 lawyers in Nigeria. For 220 million people. Most of you in this room will never actually meet a lawyer when you need one. That means when your landlord serves you a one-week quit notice tomorrow, when police stop you on Third Mainland Bridge, when your employer withholds your salary — you are on your own. You don’t know what the law says. The person threatening you is counting on that.”*  
Delivery note: slow, steady, eye contact with judges. This is the hook — make them feel it.

### **\[0:20–0:35\] The Setup**

*“We built TheLaaw. A Claude-powered legal rights companion that fits in a WhatsApp chat. You speak your situation — in Pidgin, Yoruba, English — and it tells you what the law actually says, cites the specific statute, and drafts the letter you need to send. Let me show you.”*

### **\[0:35–1:45\] Live Demo — The Lagos Eviction Scenario**

Switch to the app. Send the voice note (pre-recorded is fine if live audio is risky):  
*“My landlord just tell me say make I pack out for one week because I late with rent last month. Abeg help me.”*  
While the pipeline runs, narrate:

* “Intake Agent just classified this as a Lagos tenancy matter.”  
* “Research Agent pulled Lagos Tenancy Law 2011, Section 13 — notice periods.”  
* “Reasoning Agent concluded the position is strong — a one-week notice is illegal for a yearly tenant.”  
* “Drafting Agent produced a formal response letter the user can send the landlord today.”

End with YarnGPT speaking the explanation back in Yoruba and the PDF letter appearing in chat. Let that moment land.

### **\[1:45–2:05\] Architecture Moment**

*“Everything you just saw is five specialized Claude agents working together. Intake, Research, Reasoning, Drafting, Escalation. Each has one job. The Drafting Agent never sees raw user input — it only gets a structured brief from Reasoning. That separation is why the output is legally structured instead of conversational. This is not a Claude wrapper. This is how a junior legal team actually works, encoded into the system.”*  
Show the 5-agent pipeline slide briefly.

### **\[2:05–2:25\] The Wow Moment**

*“One more thing. Users don’t just get drafts. They can upload any contract they’ve been asked to sign.”*  
Upload a predatory tenancy agreement. Three-pass clause analysis runs. Illegal/predatory clauses get flagged with statute citations.  
*“Adversarial review. Clause by clause, matched against Nigerian statute. This clause is illegal under Section 8 of Lagos Tenancy Law. This one is predatory. This one is unenforceable.”*

### **\[2:25–2:40\] Roadmap \+ Close**

*“Today we cover tenancy, Lagos. Next: labour, criminal, family, all 36 states, SMS for users without smartphones, court judgment indexing. TheLaaw is the lawyer ordinary Nigerians never had. Thank you.”*

## **Expected Judge Questions — Prepared Answers**

### **“What happens if Claude hallucinates a law?”**

Answer: “Great question. That’s exactly why we separated retrieval from reasoning. The Research Agent returns verbatim statute text from our indexed database — it cannot invent a law because it can only quote what’s indexed. The Reasoning Agent then reasons over those specific citations, and every answer shows the exact section number so users can verify. If no relevant statute exists, the Escalation Agent routes them to a real lawyer.”

### **“Is this giving legal advice? Isn’t that illegal without a license?”**

Answer: “TheLaaw provides legal information, not legal advice — the distinction matters legally. Every response carries that disclaimer. When a matter becomes serious enough to need advice, the Escalation Agent routes the user to Legal Aid Council, NBA pro bono, or FIDA. We’re extending access to what the law already says publicly, not replacing lawyers.”

### **“How is this different from ChatGPT?”**

Answer: “ChatGPT is trained on mostly US and UK law. Ask it about Lagos Tenancy Law and it will confidently give you wrong answers. We’re grounded entirely in Nigerian statutes with jurisdiction tagging — Lagos Tenancy Law, not general ‘landlord-tenant law.’ And we don’t just explain — we draft the letter, cite the section, and know when to escalate.”

### **“How do you make money?”**

Answer: “Three paths. One, B2B licensing to Legal Aid Council and state governments — they already have mandates and budgets for legal access programs. Two, Nigerian Bar Association pro bono committees as a lawyer-referral channel. Three, corporate CSR partnerships — companies like MTN, Access Bank, and Flutterwave fund legal literacy for underserved communities. The core product stays free for end users.”

### **“Why Claude specifically?”**

Answer: “Two reasons. First, Claude’s long context lets us hold entire statute packs plus full case history in memory — critical for jurisdiction-aware reasoning. Second, Claude’s structured output and instruction-following let us enforce strict JSON schemas between agents, which is what keeps the pipeline reliable instead of conversational. Other models could substitute for pieces of it, but the 5-agent architecture needs what Claude is best at.”

## **Delivery Checklist**

* One person delivers the whole pitch — not team handoffs. Cleaner and faster.  
* Pre-record the demo voice note. Live recording mid-pitch adds risk with zero upside.  
* Have a backup laptop with the app already loaded. Have screenshots in slides as last resort.  
* If the pipeline breaks live, keep narrating confidently: “And this is where the Reasoning Agent would…” — switch to slides. Do not apologize visibly.  
* End strong. “The lawyer ordinary Nigerians never had” is the line. Don’t mumble it.