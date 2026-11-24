import type {
  AgentRunRecord,
  EscalationRecord,
  Ticket,
  TicketFeedbackRecord,
  TicketMessage,
} from "./model";

// Illustrative interface content aligned with SDLC specifications.
export const demoTickets: Ticket[] = [
  {
    id: "TA-2841",
    title: "VPN disconnects every few minutes",
    description:
      "My VPN connection drops every few minutes while I’m on remote calls. I’ve restarted the client, but the session handshake keeps dropping. IP address was 192.168.1.45 and user was [PII_MASKED_EMAIL].",
    category: "Network / VPN",
    priority: "High",
    status: "ANALYZING",
    final_decision: "REQUEST_MORE_INFORMATION",
    created: "Today, 9:42 AM",
    updated: "12 min ago",
    employee: "Morgan Lee",
    risk: "Medium",
  },
  {
    id: "TA-2838",
    title: "Cannot access the finance shared drive",
    description:
      "Getting error 0x80070035 'Network path not found' when trying to mount \\\\corp-storage\\finance. Contact phone [PII_MASKED_PHONE]. Need permission verified.",
    category: "Account / Access",
    priority: "Medium",
    status: "WAITING_FOR_USER",
    final_decision: "REQUEST_MORE_INFORMATION",
    created: "Today, 8:16 AM",
    updated: "38 min ago",
    employee: "Morgan Lee",
    risk: "Low",
  },
  {
    id: "TA-2829",
    title: "Outlook search is not returning recent mail",
    description:
      "Outlook search index is missing emails from the last 7 days. Cached Exchange mode is active, Windows 11 Enterprise.",
    category: "Email / Outlook",
    priority: "Low",
    status: "SOLUTION_SUGGESTED",
    final_decision: "SOLUTION_SUGGESTED",
    created: "Yesterday, 3:28 PM",
    updated: "Yesterday",
    employee: "Jamie Chen",
    risk: "Low",
  },
  {
    id: "TA-2817",
    title: "Laptop display flickers during video calls",
    description:
      "Primary screen turns black for 2-3 seconds whenever Zoom or Teams video hardware acceleration is engaged. Dell Latitude 5540.",
    category: "Hardware",
    priority: "High",
    status: "ESCALATED",
    final_decision: "ESCALATED",
    created: "Yesterday, 11:05 AM",
    updated: "24 min ago",
    employee: "Alex Rivera",
    team: "Workplace IT",
    risk: "High",
  },
  {
    id: "TA-2806",
    title: "Design application crashes on export",
    description:
      "Figma desktop and Illustrator crash when rendering 4K vectors. Cleared local cache, verified GPU driver version 551.86.",
    category: "Software / Applications",
    priority: "Medium",
    status: "RESOLVED",
    final_decision: "SOLUTION_SUGGESTED",
    created: "Nov 21, 10:13 AM",
    updated: "Nov 21",
    employee: "Taylor Brooks",
    risk: "Low",
  },
  {
    id: "TA-2798",
    title: "Suspicious sign-in alert on work account",
    description:
      "Received an anomalous Okta authentication challenge from an unrecognized ISP in Frankfurt at 03:14 UTC. I did not initiate this login.",
    category: "Account / Access",
    priority: "Critical",
    status: "ESCALATED",
    final_decision: "ESCALATED",
    created: "Nov 20, 4:51 PM",
    updated: "Nov 20",
    employee: "Jordan Patel",
    team: "Security Operations",
    risk: "High",
  },
];

export const demoTicketMessages: Record<string, TicketMessage[]> = {
  "TA-2841": [
    {
      id: "msg-101",
      ticket_id: "TA-2841",
      sender: "user",
      message:
        "My VPN connection drops every few minutes while I’m on remote calls. I’ve restarted the client, but the session handshake keeps dropping.",
      created_at: "Today, 9:42 AM",
      pii_masked: true,
    },
    {
      id: "msg-102",
      ticket_id: "TA-2841",
      sender: "agent",
      message:
        "Hello Morgan. I have analyzed your VPN issue. To retrieve the exact troubleshooting procedure from our network knowledge base, could you confirm:\n1. Are you using GlobalProtect or Cisco AnyConnect?\n2. Does this occur on your home Wi-Fi or when tethering via mobile hotspot?",
      created_at: "Today, 9:43 AM",
    },
    {
      id: "msg-103",
      ticket_id: "TA-2841",
      sender: "user",
      message:
        "I'm using GlobalProtect v6.1 on my home fiber Wi-Fi. My teammate on the same subnet isn't having issues.",
      created_at: "Today, 9:46 AM",
    },
    {
      id: "msg-104",
      ticket_id: "TA-2841",
      sender: "agent",
      message:
        "Thank you. Evaluating evidence from ChromaDB knowledge base (Document: 'KB-NET-402: GlobalProtect MTU Clamping on Fiber Routers'). Re-running contextual analysis...",
      created_at: "Today, 9:47 AM",
    },
  ],
  "TA-2838": [
    {
      id: "msg-201",
      ticket_id: "TA-2838",
      sender: "user",
      message:
        "Cannot access \\\\corp-storage\\finance. Prompt says 'Access Denied - Permission Required'.",
      created_at: "Today, 8:16 AM",
      pii_masked: true,
    },
    {
      id: "msg-202",
      ticket_id: "TA-2838",
      sender: "agent",
      message:
        "Hello Morgan. According to our Active Directory group policy records, the 'Finance-Restricted' share requires manager authorization from your department head. Did you submit an access request through the employee portal?",
      created_at: "Today, 8:18 AM",
    },
  ],
  "TA-2829": [
    {
      id: "msg-301",
      ticket_id: "TA-2829",
      sender: "user",
      message:
        "Outlook search is not returning recent mail from the past week. Search returns 'We're having trouble fetching results'.",
      created_at: "Yesterday, 3:28 PM",
    },
    {
      id: "msg-302",
      ticket_id: "TA-2829",
      sender: "agent",
      message:
        "Based on knowledge document 'KB-MAIL-109: Windows 11 Outlook Index Rebuild', here are the recommended troubleshooting steps:\n\n1. In Outlook, go to File > Options > Search.\n2. Click 'Indexing Options', select 'Microsoft Outlook', and click 'Advanced'.\n3. Under Troubleshooting, click 'Rebuild'.\n4. Keep Outlook open while the index status updates.\n\nPlease confirm once completed whether your search results return.",
      created_at: "Yesterday, 3:30 PM",
    },
  ],
};

export const demoAgentRuns: AgentRunRecord[] = [
  {
    id: "run-904",
    ticket_id: "TA-2841",
    decision: "REQUEST_MORE_INFORMATION",
    confidence: 0.88,
    retrieval_score: 0.82,
    latency_ms: 642,
    tools_invoked: ["pii_masking", "rag_retriever", "context_risk_evaluator"],
    created_at: "Today, 9:47 AM",
  },
  {
    id: "run-903",
    ticket_id: "TA-2838",
    decision: "REQUEST_MORE_INFORMATION",
    confidence: 0.94,
    retrieval_score: 0.91,
    latency_ms: 518,
    tools_invoked: ["pii_masking", "historical_ticket_search", "rag_retriever"],
    created_at: "Today, 8:18 AM",
  },
  {
    id: "run-902",
    ticket_id: "TA-2829",
    decision: "SOLUTION_SUGGESTED",
    confidence: 0.96,
    retrieval_score: 0.95,
    latency_ms: 720,
    tools_invoked: ["rag_retriever", "evidence_evaluator"],
    created_at: "Yesterday, 3:30 PM",
  },
  {
    id: "run-901",
    ticket_id: "TA-2798",
    decision: "ESCALATED",
    confidence: 0.99,
    retrieval_score: 0.89,
    latency_ms: 410,
    tools_invoked: ["pii_masking", "context_risk_evaluator", "human_escalation_router"],
    created_at: "Nov 20, 4:51 PM",
  },
];

export const demoEscalations: EscalationRecord[] = [
  {
    id: "esc-101",
    ticket_id: "TA-2798",
    reason: "Critical risk security anomaly: Unauthorized foreign IP authentication attempt.",
    assigned_team: "Security Operations",
    status: "OPEN",
    created_at: "Nov 20, 4:51 PM",
  },
  {
    id: "esc-102",
    ticket_id: "TA-2817",
    reason:
      "Hardware GPU display failure requiring physical workstation inspection or replacement.",
    assigned_team: "Workplace IT",
    status: "IN_PROGRESS",
    created_at: "Yesterday, 11:05 AM",
  },
];

export const demoFeedback: TicketFeedbackRecord[] = [
  {
    id: "fb-01",
    ticket_id: "TA-2806",
    rating: 5,
    feedback:
      "The GPU driver update and vector cache clear resolved the crash immediately. Excellent!",
    created_at: "Nov 21, 10:45 AM",
  },
];

export const weeklyVolume = [
  { day: "Mon", tickets: 24 },
  { day: "Tue", tickets: 31 },
  { day: "Wed", tickets: 27 },
  { day: "Thu", tickets: 39 },
  { day: "Fri", tickets: 34 },
  { day: "Sat", tickets: 12 },
  { day: "Sun", tickets: 9 },
];
