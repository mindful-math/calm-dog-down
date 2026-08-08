# System Patterns: Dog Calm-Down

## Architecture

```mermaid
graph TD
    subgraph Browser
        UI[Vanilla JS UI]
        Audio[Web Audio API]
        Bandit[Epsilon-Greedy Bandit]
        Storage[(LocalStorage)]
    end

    subgraph NodeServer[Local Node.js Server]
        API[HTTP Server]
        FS[(Local File System)]
    end

    subgraph ExternalServices[External Services]
        ElevenLabs[ElevenLabs API]
        xAI[xAI Grok API]
        SMTP[SMTP/Gmail]
        Twilio[Twilio SMS]
    end

    UI <--> Audio
    UI <--> Bandit
    Bandit <--> Storage
    UI <--> API
    API <--> FS
    UI --> ElevenLabs
    API --> xAI
    API --> SMTP
    API --> Twilio
```

The system follows a **Client-Server architecture** where the heavy lifting of audio processing and decision-making happens in the browser, and the server acts as a notification gateway.

## Key Algorithms & Patterns

### $\varepsilon$-Greedy Multi-Armed Bandit
Used to optimize phrase selection:
- **Exploration ($\varepsilon = 0.15$)**: 15% of the time, a random phrase is played to discover if it has become more effective.
- **Exploitation**: 85% of the time, the phrase with the highest average "reward" is played.
- **Reward Function**: The reward is the time elapsed (gap) between the current bark and the previous bark. Longer gaps indicate a more effective calming phrase.

### Audio Processing Pattern
- **Bark Detection**: Calculates the average volume level from the frequency data. If the level exceeds a user-defined threshold, a bark is triggered.
- **Pitch Detection**: Uses a basic peak-finding algorithm in the frequency domain to estimate the bark's pitch.
- **Dynamic Playback**: Implements a sine-wave volume oscillation during playback to make the voice sound more natural/less robotic.

## Data Flow

```mermaid
sequenceDiagram
    participant Mic as Microphone
    participant Analyser as Audio Analyser
    participant Bandit as Bandit Logic
    participant Speaker as Speakers
    participant Log as LocalStorage

    Mic->>Analyser: Audio Stream
    Analyser->>Analyser: Check Threshold
    Note over Analyser: Bark Detected!
    Analyser->>Bandit: Request Phrase
    Bandit->>Bandit: Epsilon-Greedy Selection
    Bandit->>Speaker: Play Audio Clip
    Note over Speaker: Dog Hears Voice
    Speaker-->>Analyser: Wait for next bark
    Analyser->>Log: Calculate Gap (Reward)
    Log->>Bandit: Update Phrase Score
```

1. **Detection**: Mic $\rightarrow$ Analyser $\rightarrow$ Threshold Check $\rightarrow$ Bark Event.
2. **Action**: Bark Event $\rightarrow$ Bandit Selection $\rightarrow$ Audio Playback.
3. **Learning**: Next Bark $\rightarrow$ Calculate Gap $\rightarrow$ Update Bandit Score $\rightarrow$ Save to `localStorage`.
4. **Reporting**: Schedule/Manual Trigger $\rightarrow$ Build Payload (including Chart PNG) $\rightarrow$ POST to `/report` $\rightarrow$ Email/SMS.
