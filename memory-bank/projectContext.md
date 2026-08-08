# Project Context: Dog Calm-Down

## Overview
`dog-calm-down` is an intelligent dog barking mitigation system. It monitors ambient noise via a microphone, detects barking events, and automatically plays back calming voice phrases to quiet the dog. The system learns over time which phrases are most effective using a reinforcement learning approach.

## Problem Statement
Dog barking can be disruptive to the owner and neighbors. While training is the long-term solution, there is a need for a tool that can provide immediate, consistent, and personalized calming responses when the owner is unavailable or unable to intervene.

## Core Goals
- **Automated Bark Mitigation**: Reduce dog barking without requiring constant human intervention.
- **Adaptive Learning**: Use data-driven insights to determine which calming phrases work best for a specific dog.
- **Personalized Experience**: Allow users to record their own voice or use AI-cloned versions of their voice for better effectiveness.
- **Monitoring & Reporting**: Provide analytics on barking patterns and send periodic reports via email or SMS.

## Why this Solution?
- **Personalization**: Dogs respond better to familiar voices. By allowing recording or AI cloning, the system mimics the owner's presence.
- **Adaptability**: Not every phrase works for every dog. The use of a Multi-Armed Bandit algorithm ensures the system optimizes for the most effective calming phrase based on actual results (time until next bark).
- **Visibility**: Barking patterns are often invisible to the owner. The analytics and reporting provide a data-driven view of the dog's behavior.

## Key Features
- **Bark Detection**: Real-time audio analysis with adjustable sensitivity thresholds.
- **$\varepsilon$-Greedy Bandit Algorithm**: An adaptive selection mechanism that balances exploring new phrases and exploiting the most successful ones.
- **Voice Integration**: 
    - Manual recording of phrases.
    - AI voice cloning via ElevenLabs.
    - AI-suggested phrases via xAI (Grok).
- **Reporting System**: 
    - Local Node.js server for handling notifications.
    - HTML email reports with embedded bark-level charts.
    - SMS alerts via Twilio.
- **Analytics Dashboard**: Visualizations of bark frequency, intensity, and phrase effectiveness.

## User Experience (UX)
- **Setup**: A simple three-step process:
    1. **Voice Setup**: Record phrases or use AI to clone voice.
    2. **Sensitivity**: Adjust thresholds to avoid false positives (e.g., doorbells) and set response volume/cooldown.
    3. **Listen**: Start the active monitoring mode.
- **Feedback**: Real-time visual feedback via a mic level meter and "bark detected" flashes.
- **Analytics**: A bark log and a bar chart showing the effectiveness of different phrases.
- **Notifications**: Automated reports sent to the owner via email or SMS, providing a summary of the dog's activity.

## Constraints & Assumptions
- **Browser-Based**: The main application runs in a browser, requiring the tab to remain open for active monitoring.
- **Local Server**: A Node.js server is required for sending emails and SMS, as browsers cannot perform these actions directly for security reasons.
- **Hardware**: Requires a functioning microphone and speakers.
- **Privacy**: Audio is processed locally; only voice samples for cloning are sent to ElevenLabs.

## Target Audience
Dog owners who want a technical solution to manage their dog's barking behavior, especially when they are not in the room.