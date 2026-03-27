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

const http       = require('http');
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const PORT       = 3747;
const CHART_DIR  = path.join(__dirname, 'charts');
if (!fs.existsSync(CHART_DIR)) fs.mkdirSync(CHART_DIR);

// SMTP config — edit these or use env vars
// For Gmail: enable 2FA, create an App Password at
// https://myaccount.google.com/apppasswords
const SMTP = {
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'you@gmail.com',
    pass: process.env.SMTP_PASS || 'your app password',
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
  // Save chart PNG from dataURL
  const chartFilename = `chart-${Date.now()}.png`;
  const chartPath = path.join(CHART_DIR, chartFilename);
  if (data.chartPng) {
    const base64 = data.chartPng.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(chartPath, Buffer.from(base64, 'base64'));
  }

  // Email channel
  if (data.channel !== 'sms') {
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
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

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

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`dog-calm-down server running on http://localhost:${PORT}`);
  console.log('Waiting for reports from the browser app...');
});
