# Shruviq — Enterprise Intelligence Architecture

**Version:** 2.0.0  
**Branch:** `feature/enterprise-ai-agent`  
**Architecture Pattern:** Enterprise Customer Intelligence Platform

---

## Overview

Shruviq is an **Enterprise Customer Experience Intelligence Platform that transforms customer conversations into actionable business intelligence**. It is **not** a chatbot, Gemini wrapper, or basic sentiment analyzer. Every customer interaction feeds a continuously-improving organizational knowledge engine that makes the entire business smarter over time.

---

## Architecture Philosophy

```
Customer Feedback
       ↓
Validation & Input
       ↓
Customer Intelligence Agent  ← The Brain
       ↓                ↓
Context Builder     Memory Adapter (Hindsight)
       ↓                ↓
Prompt Builder  ← Retrieves relevant org knowledge
       ↓
Enterprise Runtime (cascadeflow)
       ↓
Provider Registry
       ↓
LLM Provider (Groq / OpenAI / Claude / Gemini / ...)
       ↓
Response Normalization
       ↓
Recommendation Engine
       ↓
Organizational Memory Update
       ↓
Structured Response to Controller
       ↓
Analytics & Dashboard
```

---

## Directory Structure

```
server/
├── ai/
│   ├── config/
│   │   └── aiConfig.js              # ALL configuration — models, providers, thresholds
│   ├── agent/
│   │   └── CustomerIntelligenceAgent.js   # Central AI brain — ONLY entry point
│   ├── context/
│   │   └── ContextBuilder.js        # Assembles org context + memory retrieval
│   ├── prompts/
│   │   └── PromptBuilder.js         # Dynamic prompt assembly — no hardcoded prompts
│   ├── memory/
│   │   └── MemoryAdapter.js         # Organizational knowledge (Hindsight)
│   ├── runtime/
│   │   └── EnterpriseRuntime.js     # cascadeflow — execution OS
│   ├── providers/
│   │   ├── ProviderInterface.js     # Abstract contract all providers must implement
│   │   ├── ProviderRegistry.js      # Registry — add providers here only
│   │   └── GroqProvider.js          # Groq adapter (only file importing groq-sdk)
│   ├── recommendations/
│   │   └── RecommendationEngine.js  # Structured business recommendations
│   ├── observability/
│   │   └── ObservabilityLogger.js   # Execution logging, cost tracking, metrics
│   └── AIService.js                 # Thin layer between controllers and Agent
├── controllers/
│   ├── analyzeController.js         # HTTP handler only — no AI logic
│   └── apiController.js             # Status, AI stats, memory stats, intelligence
└── routes/
    └── api.js                       # Route definitions
```

---

## Core Principles

### 1. Single Entry Point
Controllers ONLY call `AIService`. The `AIService` calls the `CustomerIntelligenceAgent`. **No controller imports Groq, OpenAI, Claude, or any LLM SDK.**

### 2. Provider Abstraction
Adding a new LLM provider requires:
1. Create a class implementing `ProviderInterface`
2. Register it in `ProviderRegistry`
3. Change `AI_PROVIDER` env var

Zero business logic changes.

### 3. Organizational Memory (Hindsight)
Memory is **not** conversation history. It is **Organizational Knowledge** that accumulates over time:
- Scoped to `organizationId` (cross-org isolation enforced)
- Categorized by business domain
- Semantically retrieved (keyword similarity, future: vector embeddings)
- Deduplicated and reinforced (recurring issues accumulate weight)
- Never stores raw prompts — stores platform knowledge

### 4. Enterprise Runtime (cascadeflow)
The runtime owns:
- Provider selection
- Retry logic (exponential backoff)
- Fallback provider strategy
- Timeout enforcement
- Response normalization
- Execution metadata

### 5. Configuration-First
Nothing is hardcoded. Models, temperatures, retry counts, memory thresholds, recommendation categories — all from `aiConfig.js` which reads environment variables.

---

## Data Flow per Request

### Voice Feedback (Full Pipeline)

```
FeedbackCapture.jsx
  → POST /api/analyze { audioBase64, organizationId, template }
  → analyzeController (validates only)
  → AIService.analyzeFeedback()
  → CustomerIntelligenceAgent.analyzeFeedback()
      → EnterpriseRuntime.transcribe() [Whisper via Groq]
      → ContextBuilder.build()
          → MemoryAdapter.retrieve() [relevant org knowledge]
          → Industry detection
      → PromptBuilder.buildSystemPrompt() [org + memory + template ctx]
      → PromptBuilder.buildUserPrompt() [feedback text]
      → EnterpriseRuntime.execute()
          → ProviderRegistry.getActive() → GroqProvider
          → GroqProvider.chat() [with retries + timeout]
          → EnterpriseRuntime._normalizeResponse()
      → RecommendationEngine.generate()
          → Memory update (MemoryAdapter.store())
      → Structured AgentResponse
  → JSON response to frontend
  → FeedbackCapture stores to Firestore (with enhanced fields)
```

---

## Structured Response Format

Every `/api/analyze` response now includes:

```json
{
  "success": true,
  "text": "Customer's feedback text",
  "sentiment": "negative",
  "emotion": "frustrated",
  "score": 25,
  "topics": ["slow service", "rude staff"],
  "summary": "Customer experienced poor service...",
  "priority": "high",
  "urgency": "within_24h",
  "riskLevel": "high",
  "businessImpact": "Risk of customer churn...",
  "detectedLanguage": "en",
  "confidence": 0.92,
  "recurringPattern": true,
  "memoryContextUsed": true,
  "recommendation": {
    "id": "rec_abc123",
    "title": "High Priority Concern — Slow Service",
    "category": "service_quality",
    "severity": "high",
    "recommendation": "Immediate staff review required...",
    "immediateActions": ["Review shift staffing", "Speak to manager"],
    "shortTermActions": ["Staff training program"],
    "longTermImprovements": ["Process optimization"]
  },
  "_meta": {
    "executionId": "exec_abc123",
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "latencyMs": 842,
    "totalProcessingMs": 1203,
    "memoriesUsed": 3,
    "retries": 0,
    "fallbackUsed": false
  }
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Platform health + active provider info |
| `POST` | `/api/analyze` | Main intelligence pipeline (voice + text) |
| `GET` | `/api/ai/stats` | Observability: execution metrics, tokens, cost |
| `GET` | `/api/ai/memory/:orgId` | Memory stats for an organization |
| `POST` | `/api/ai/intelligence` | Org-level intelligence report |

---

## Organizational Memory (Hindsight)

### Memory Categories
- `customer_experience`
- `service_quality`
- `product_quality`
- `staff_behavior`
- `cleanliness`
- `pricing`
- `operational`
- `safety`
- `general`

### How Memory Works
1. **After every successful AI execution**, `RecommendationEngine.generate()` calls `MemoryAdapter.store()`
2. **Before AI executes**, `ContextBuilder.build()` calls `MemoryAdapter.retrieve()`
3. Retrieved memories are embedded in the system prompt — the LLM knows about recurring patterns
4. **Deduplication**: Highly similar memories are merged (reinforcement count increases)
5. **Eviction**: When org memory cap is reached, oldest entries are evicted

### Example: Progressive Intelligence
```
Week 1: Customer A complains about slow service → Memory stored
Week 2: Customer B complains about slow service → Memory reinforced (x2)
Week 3: Customer C complains → AI prompt already contains:
  "[Memory] Recurring Pattern: 'slow service' appeared 2 times.
   Past Recommendation: Review shift staffing during peak hours."
  → AI generates more targeted, context-aware recommendations
```

---

## Provider Registry

Currently registered:
- ✅ `groq` — Llama 3.3 70B + Whisper Large V3 Turbo

Ready to register (implementation pending):
- `openai` — GPT-4o Mini
- `gemini` — Gemini 1.5 Flash
- `claude` — Claude 3 Haiku
- `openrouter` — Any model via OpenRouter

Switching providers:
```bash
# In server/.env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## Observability

Every execution logs:
- Execution ID (traceable through logs)
- Provider + Model
- Latency (ms)
- Token usage (prompt + completion)
- Estimated cost (USD)
- Retry count
- Fallback usage
- Memory retrieval time + count
- Recommendation generation time
- Organization + Branch

Access via: `GET /api/ai/stats`

---

## Future Extension Points (Prepared, not implemented)

### Multi-Agent Architecture
```
CustomerIntelligenceAgent
  → OperationsAgent
  → CustomerExperienceAgent
  → RiskDetectionAgent
  → BranchPerformanceAgent
  → ExecutiveInsightsAgent
  → NotificationAgent
```

### Runtime Plugins (cascadeflow)
- Safety Layer
- PII Redaction
- Prompt Guard
- Language Detection + Translation
- Request Caching
- Streaming Support
- Moderation Layer

### Memory Upgrades
- Vector embeddings (pgvector / Pinecone / Weaviate)
- Cross-branch knowledge sharing
- Memory expiry + reinforcement scoring
- Outcome tracking (did the recommendation work?)

---

## Security

- Organization context is **required** for every AI execution
- Memory is **strictly scoped** to `organizationId` — no cross-org data leakage
- Organization A can **never** access Organization B's memories, recommendations, or analytics
- Every execution validates org context before processing

---

## Environment Variables

See `server/.env.example` for the complete reference.

Key variables:
```bash
AI_PROVIDER=groq           # Switch provider platform-wide
GROQ_API_KEY=gsk_...       # Groq API key
MEMORY_ENABLED=true        # Enable/disable organizational memory
AI_FALLBACK_PROVIDER=      # Optional fallback if primary fails
```

---

*This document was generated as part of the enterprise architecture sprint.*  
*Next sprint: Executive Insights Agent + multi-agent orchestration.*
