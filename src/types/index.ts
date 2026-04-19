// ─── API / Response Types ────────────────────────────────────────────────────

export interface ResearchInsight {
  finding:    string;
  citationId: string;
  snippet:    string;
}

export interface ClinicalTrial {
  nctId:     string;
  title:     string;
  status:    string;
  location:  string;
  url:       string;
}

export interface ResponseData {
  conditionOverview: string;
  researchInsights:  ResearchInsight[];
  clinicalTrials:    ClinicalTrial[];
  disclaimer:        string;
}

export interface MetaData {
  totalRetrieved:    number;
  afterDeduplication:number;
  filteredForLLM:    number;
  processingTimeMs:  number;
  sourceCounts: {
    PubMed:         number;
    OpenAlex:       number;
    ClinicalTrials: number;
  };
}

export interface ApiResponse {
  success:    boolean;
  sessionId:  string;
  data:       ResponseData;
  meta:       MetaData;
  error?:     string;
}

// ─── Streaming / SSE Types ───────────────────────────────────────────────────

/**
 * All possible named pipeline stages emitted by the backend SSE endpoint.
 * Ordered: they arrive chronologically in this sequence.
 */
export type StreamStage =
  | 'idle'
  | 'intent_extracted'
  | 'retrieval_started'
  | 'source_completed'
  | 'deduplication_done'
  | 'ranking_done'
  | 'reranking_done'
  | 'llm_started'
  | 'llm_completed'
  | 'guardrails_done'
  | 'complete'
  | 'error';

/**
 * Accumulative reactive state built as SSE events arrive.
 * Fields are undefined until the corresponding event fires.
 */
export interface StreamProgress {
  /** Current pipeline stage (latest event received). */
  stage: StreamStage;

  // ── intent_extracted ──────────────────────────────────────────────────
  disease?:      string;
  intent?:       string;
  searchString?: string;

  // ── retrieval_started ─────────────────────────────────────────────────
  sources?: string[];

  // ── source_completed (accumulates — fires up to 3×) ───────────────────
  sourceCounts: {
    PubMed:         number;
    OpenAlex:       number;
    ClinicalTrials: number;
  };
  /** Errors keyed by source name. */
  sourceErrors: Record<string, string>;
  /** How many source_completed events have been received so far (0–3). */
  completedSources: number;

  // ── deduplication_done ────────────────────────────────────────────────
  totalRetrieved?:     number;
  afterDeduplication?: number;

  // ── ranking_done ──────────────────────────────────────────────────────
  filteredForLLM?: number;

  // ── reranking_done ────────────────────────────────────────────────────
  rankingCount?:    number;
  semanticEnabled?: boolean;

  // ── llm_started ───────────────────────────────────────────────────────
  llmModel?: string;
  llmDocs?:  number;

  // ── llm_completed ─────────────────────────────────────────────────────
  rawInsightCount?: number;

  // ── guardrails_done ───────────────────────────────────────────────────
  finalInsightCount?: number;

  // ── complete (filled from meta) ───────────────────────────────────────
  processingTimeMs?: number;
}

/** A parsed SSE message coming off the wire. */
export interface SSEEvent {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data:  Record<string, any>;
}

// ─── Chat / Store Types ──────────────────────────────────────────────────────

export interface UserMessage {
  id:        string;
  role:      'user';
  content:   string;
  timestamp: number;
}

export interface AssistantMessage {
  id:        string;
  role:      'assistant';
  content:   string;   // original query — used for download filename
  data:      ResponseData;
  meta:      MetaData;
  timestamp: number;
}

export interface ErrorMessage {
  id:        string;
  role:      'error';
  content:   string;
  timestamp: number;
}

export type Message = UserMessage | AssistantMessage | ErrorMessage;

// ─── Request Types ───────────────────────────────────────────────────────────

export interface QueryRequest {
  query:      string;
  sessionId?: string;
}
