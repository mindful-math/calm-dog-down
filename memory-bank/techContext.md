# Tech Context: Dog Calm-Down

## Technology Stack

```mermaid
graph LR
    subgraph Frontend
        JS[Vanilla JS ES6+]
        WA[Web Audio API]
        MR[MediaRecorder API]
        CV[Canvas API]
        LS[LocalStorage]
    end

    subgraph Backend
        Node[Node.js 18]
        HTTP[Native http module]
        NM[nodemailer 8.0.4]
        TW[twilio 5.13.1]
        DV[dotenv]
        AI[ai / @ai-sdk/xai]
    end

    subgraph External
        EL[ElevenLabs]
        XAI[xAI Grok]
        SMTP[Gmail SMTP]
        SMS[Twilio SMS]
    end

    JS --> WA
    JS --> MR
    JS --> CV
    JS --> LS
    JS --> HTTP
    HTTP --> NM
    HTTP --> TW
    HTTP --> AI
    NM --> SMTP
    TW --> SMS
    AI --> XAI
    JS --> EL
```

## Dependency Versions
- **Node.js**: 18 (Pinned in Dockerfile)
- **nodemailer**: 8.0.4 (Pinned)
- **twilio**: 5.13.1 (Pinned)

## Key Technical Decisions
- **Vanilla JS**: Minimal overhead, direct API access.
- **Client-Side Audio**: Low latency, privacy.
- **$\varepsilon$-Greedy Bandit**: Simple RL for phrase optimization.
- **Local Node Server**: Required for SMTP/SMS gateway.