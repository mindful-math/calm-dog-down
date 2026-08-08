# dog-calm-down

Detects your dog barking via microphone, plays back your recorded (or AI-cloned) voice. Adapts which phrase to use based on what quiets them fastest.

*notes*: 

1. voice clone is in a **broken** state right now so just add typed phrases for now (sorry).
2. Local data caching is supported; the app will prompt you to load previous bark history on startup.
3. I have only bothered testing SMTP (not very secure IK... but this is just a dog report...). Twilio is a nice alternative if you aren't a dinosaur like myself.

![UI](/assets/ui.png)

![Email](/assets/email.png)

## Requirements

- Modern browser (Chrome/Edge recommended for best Web Audio + MediaRecorder support)
- Node.js >= 18 (for email/SMS reports)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (2FA must be enabled)
- Optional: [ElevenLabs](https://elevenlabs.io) API key for voice cloning
- Optional: [Twilio](https://twilio.com) account for SMS alerts

## Quick start

```bash
npm install nodemailer twilio
```

Edit the SMTP block at the top of `server.js`:

```js
const SMTP = {
  auth: {
    user: 'you@gmail.com',
    pass: 'your-16-char-app-password',  // NOT your Gmail password
  },
};
```

Or use environment variables:

```bash
SMTP_USER=you@gmail.com SMTP_PASS=xxxx node server.js
```

### Docker
Alternatively, run the server using Docker:

```bash
# Build the image
docker build -t dog-calm-down .

# Run the container
docker run -p 3747:3747 -e SMTP_USER=you@gmail.com -e SMTP_PASS=xxxx dog-calm-down
# or alternatively (add them to an env file if you don't care): source .env && docker run -p 3747:3747 
```

Then open `index.html` in your browser. The server must be running for reports to send.

## Features

### Voice setup

**Record mode** - record each calming phrase yourself; type the text in the box, hit record, speak, hit stop.

**AI clone mode** - record >=30 s of your natural voice, paste your ElevenLabs key, click *clone + generate*. The app clones your voice and generates phrases automatically (or you supply your own, one per line). Generated clips are tagged `ai` in the list.

### Adaptive phrase selection ($\varepsilon$-greedy bandit)

The app tracks how long it takes for your dog to bark again after each phrase is played. Phrases that produce longer silences get a higher score. After enough trials it exploits the best-scoring phrase most of the time (85%) and still explores randomly (15%) to keep learning. Effectiveness scores are shown as a bar chart and persist across sessions.

### Reports

**Email** - the local Node server sends a styled HTML email with the bark-level chart embedded as an image, plus a summary table. Set a schedule (30 min, 1 hour, etc.) and it fires automatically while the tab is open.

**SMS** - Twilio credentials are entered in the app (stored in-memory only). The server sends a text summary; the chart PNG is saved to `./charts/` locally.

### Chart export

Use *export chart png* to download the bark chart as a PNG at any time.

## File overview

```
index.html   — the full browser app
server.js    — local Node server (email + SMS)
charts/      — chart PNGs saved at each report (created automatically)
```

## Privacy

- ElevenLabs and Twilio credentials are **never stored** (in-memory only, cleared on page reload).
- The bark log is saved to `localStorage` in your browser only. You will be prompted to load this cache when you start the app.
- All audio stays on your device; no audio is uploaded except the voice sample to ElevenLabs when you explicitly click *clone + generate*.
