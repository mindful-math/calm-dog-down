# Environment Variables

This project uses environment variables to manage sensitive keys and configuration. These should be defined in a `.env` file in the root directory.

## Required Variables

| Variable | Purpose | Description |
| :--- | :--- | :--- |
| `SMTP_USER` | Email Reports | The email address used to send reports (e.g., your Gmail address). |
| `SMTP_PASS` | Email Reports | The app-specific password for the SMTP user. |

## Optional Variables

| Variable | Default | Purpose | Description |
| :--- | :--- | :--- | :--- |
| `ELEVEN_LABS_KEY` | `""` | TTS & Voice Cloning | Required only if using ElevenLabs for AI voice cloning/TTS instead of local recordings. |
| `GROQ_API_KEY` | `""` | Phrase Suggestion | Required only if using Groq for AI-generated phrase suggestions. |
| `VOICE_ID` | `""` | Default Voice | The ElevenLabs Voice ID to be pre-populated in the UI. |
| `SMTP_HOST` | `smtp.gmail.com` | Email Server | The hostname of the SMTP server. |
| `SMTP_PORT` | `587` | Email Port | The port of the SMTP server. |

## Setup Instructions

1. Create a `.env` file in the root directory.
2. Add the required variables:
   ```env
   ELEVEN_LABS_KEY=your_elevenlabs_key
   GROQ_API_KEY=your_groq_key
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   VOICE_ID=your_voice_id
   ```
3. If using Gmail, ensure you have 2FA enabled and use an **App Password** instead of your primary password.