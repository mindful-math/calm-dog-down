/**
 * dog-calm-down local server
 * Sends HTML email with embedded chart image + optional Twilio SMS
 *
 * Usage:
 *   npm install nodemailer twilio
 *   node server.js
 *
 * The browser app POSTs JSON to http://localhost:3747/report
 */

require('dotenv').config();
const http       = require('http');
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const PORT       = 3747;
const DATA_DIR   = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const CHART_DIR  = path.join(DATA_DIR, 'charts');
const AUDIO_DIR  = path.join(DATA_DIR, 'audio');
const PHRASES_FILE = path.join(DATA_DIR, 'phrases.json');
if (!fs.existsSync(CHART_DIR)) fs.mkdirSync(CHART_DIR);
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

// SMTP config — edit these or use env vars
// For Gmail: enable 2FA, create an App Password at
// https://myaccount.google.com/apppasswords
const SMTP = {
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587') === 465,
  connectionTimeout: 15000, // Increased to 15s
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(SMTP);

function buildHtmlEmail(data) {
  const rows = (data.entries || []).slice(-50).map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${new Date(e.timestamp).toLocaleTimeString()}</td>
      <td>${e.level}</td>
      <td>${e.pitch ? e.pitch + ' Hz' : '—'}</td>
      <td>${e.gap ? e.gap + 's' : '—'}</td>
      <td>${e.phrase}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, sans-serif; background:#0f0f0d; color:#e8e8e0; padding:32px; }
  h1 { font-size:24px; font-weight:600; margin:0 0 4px; }
  .sub { color:#666; font-size:13px; margin-bottom:24px; }
  .stats { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .stat { background:#17171480; border:1px solid #2a2a26; border-radius:10px; padding:14px 20px; text-align:center; }
  .num { font-size:28px; font-weight:600; color:#c8f050; }
  .lbl { font-size:11px; color:#666; margin-top:4px; }
  img.chart { width:100%; max-width:640px; border-radius:8px; margin:0 0 20px; display:block; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { text-align:left; color:#666; padding:6px 10px; border-bottom:1px solid #26272a; font-weight:400; }
  td { padding:6px 10px; border-bottom:1px solid #191a1c; color:#999; }
</style>
</head>
<body>
<h1>${data.dog === 'your dog' ? 'Dog' : data.dog} calm down report</h1>
<p class="sub">${data.label} · ${new Date(data.timestamp).toLocaleString()}</p>
<div class="stats">
  <div class="stat"><div class="num">${data.totalBarks}</div><div class="lbl">Total barks</div></div>
  <div class="stat"><div class="num">${data.reportBarks}</div><div class="lbl">Session barks</div></div>
  <div class="stat"><div class="num">${data.avgLevel}</div><div class="lbl">Average level</div></div>
  <div class="stat"><div class="num">${data.avgGap}s</div><div class="lbl">Average gap between barks</div></div>
</div>
<img class="chart" src="cid:barkchartcid" alt="bark chart">
<table>
  <thead><tr><th>#</th><th>time</th><th>level</th><th>pitch</th><th>gap</th><th>phrase</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

async function handleReport(data) {
  console.log(`[report] processing ${data.label} report for ${data.dog} (to: ${data.to})`);
  try {
    // Save chart PNG from dataURL
    const chartFilename = `chart-${Date.now()}.png`;
    const chartPath = path.join(CHART_DIR, chartFilename);
    if (data.chartPng) {
      const base64 = data.chartPng.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(chartPath, Buffer.from(base64, 'base64'));
    }

    // Email channel
    if (data.channel !== 'sms') {
      if (!SMTP.auth.user || !SMTP.auth.pass) {
        console.log(`[email] skipped: no SMTP credentials configured`);
      } else {
        const html = buildHtmlEmail(data);
        const dog = data.dog || 'Dog';
        await transporter.sendMail({
          from: SMTP.auth.user,
          to: data.to,
          subject: `${dog} bark report — ${new Date().toLocaleTimeString()}`,
          html,
          attachments: data.chartPng ? [{
            filename: 'bark-chart.png',
            path: chartPath,
            cid: 'barkchartcid',
          }] : [],
        });
        console.log(`[email] sent to ${data.to}`);
      }
    }

    // SMS channel (Twilio)
    if (data.channel === 'sms' || (data.twilio && data.twilio.to)) {
      const t = data.twilio;
      if (t && t.sid && t.token && t.from && t.to) {
        const twilio = require('twilio')(t.sid, t.token);
        const body =
          `${data.dog} bark report\n` +
          `Total: ${data.totalBarks} | This period: ${data.reportBarks}\n` +
          `Avg level: ${data.avgLevel} | Avg gap: ${data.avgGap}s\n` +
          `Chart saved locally: charts/${chartFilename}`;
        await twilio.messages.create({ from: t.from, to: t.to, body });
        console.log(`[sms] sent to ${t.to}`);
      }
    }
  } catch (err) {
    console.error(`[report] failed to send ${data.label} report for ${data.dog}: ${err.message}`);
    throw err;
  }
}

async function requestHandler(req, res) {
  const { method, url } = req;

  // Override writeHead to log the status code
  const originalWriteHead = res.writeHead;
  res.writeHead = function(statusCode, ...args) {
    console.log(`[${statusCode}] ${method} ${url}`);
    return originalWriteHead.apply(this, [statusCode, ...args]);
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      elevenLabsKey: process.env.ELEVEN_LABS_KEY || '',
      groqApiKey: process.env.GROQ_API_KEY || '',
      voiceId: process.env.VOICE_ID || '',
      smtpUser: process.env.SMTP_USER || ''
    }));
    return;
  }

  if (req.method === 'GET' && req.url === '/test-smtp') {
    try {
      await transporter.verify();
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ ok: true, message: 'SMTP connection successful!' }));
    } catch (err) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ ok: false, error: err.message, code: err.code }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/report') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await handleReport(data);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok: true }));
      } catch(err) {
        console.error(err);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/phrases')) {
    const dog = req.url.split('?')[1]?.split('=')[1] || 'default';
    const allPhrases = fs.existsSync(PHRASES_FILE) ? JSON.parse(fs.readFileSync(PHRASES_FILE, 'utf8')) : {};
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(allPhrases[dog] || []));
    return;
  }

  if (req.method === 'POST' && req.url === '/phrases') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { dog, phrases } = JSON.parse(body);
        const allPhrases = fs.existsSync(PHRASES_FILE) ? JSON.parse(fs.readFileSync(PHRASES_FILE, 'utf8')) : {};
        allPhrases[dog] = phrases;
        fs.writeFileSync(PHRASES_FILE, JSON.stringify(allPhrases, null, 2));
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: true }));
      } catch(err) {
        console.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/audio') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, data } = JSON.parse(body);
        const filePath = path.join(AUDIO_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: true }));
      } catch(err) {
        console.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/audio')) {
    const filename = req.url.split('?')[1]?.split('=')[1];
    if (!filename) {
      res.writeHead(400); res.end('Missing filename'); return;
    }
    const filePath = path.join(AUDIO_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, {'Content-Type': 'audio/webm'});
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404); res.end('Audio not found');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/suggest-phrases') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { dogName, apiKey } = JSON.parse(body);
        const { generateText } = await import('ai');
        const { createGroq } = await import('@ai-sdk/groq');
        
        const groqProvider = createGroq({ apiKey: apiKey || process.env.GROQ_API_KEY });
        const { text } = await generateText({
          model: groqProvider('llama-3.3-70b-versatile'),
          system: 'You are a dog behavior expert. Provide a list of short, calming phrases to say to a dog to help them settle down. Return only the phrases, one per line, no numbering, no bullets, no introductory text.',
          prompt: `The dog's name is ${dogName}. Give me 10 calming phrases.`,
        });
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(text.trim());
      } catch (err) {
        console.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/test-groq-key') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { apiKey } = JSON.parse(body);
        const { generateText } = await import('ai');
        const { createGroq } = await import('@ai-sdk/groq');
        
        const groqProvider = createGroq({ apiKey: apiKey || process.env.GROQ_API_KEY });
        await generateText({
          model: groqProvider('llama-3.3-70b-versatile'),
          prompt: 'hi',
        });
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(401, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/tts-google')) {
    const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const text = urlParams.get('text') || '';
    const lang = urlParams.get('lang') || 'en';
    
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    
    try {
      const response = await fetch(googleUrl);
      if (!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': arrayBuffer.byteLength
      });
      res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Google TTS Proxy Error:', err);
      res.writeHead(500);
      res.end('TTS Proxy Error');
    }
    return;
  }

  res.writeHead(404); res.end('not found');
}

const server = http.createServer(requestHandler);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`dog-calm-down server running on http://localhost:${PORT}`);
    console.log('Waiting for reports from the browser app...');
  });
}

module.exports = { requestHandler };
