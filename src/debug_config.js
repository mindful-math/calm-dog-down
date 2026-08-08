const http = require('http');
const { exec } = require('child_process');

const PORT = 3747;

// Start server
const serverProc = exec('node server.js');

setTimeout(() => {
  http.get(`http://localhost:${PORT}/config`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Config Response:', data);
      serverProc.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Error fetching config:', err);
    serverProc.kill();
    process.exit(1);
  });
}, 3000);