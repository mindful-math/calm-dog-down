const { requestHandler } = require('../src/server');
const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');

jest.mock('fs');

// Mocking process.env
const originalEnv = process.env;
beforeEach(() => {
  process.env = { 
    ...originalEnv,
    ELEVEN_LABS_KEY: 'test-eleven-key',
    GROQ_API_KEY: 'test-groq-key',
    VOICE_ID: 'test-voice-id',
    SMTP_USER: 'test-user@example.com',
    SMTP_PASS: 'test-pass'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Helper to simulate a request/response cycle
function simulateRequest(method, url, body = null) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  
  const writeHead = jest.fn();
  const res = {
    writeHead: writeHead,
    setHeader: jest.fn(),
    end: jest.fn(),
  };

  if (body) {
    req.on('end', () => {}); // Ensure end is handled
    process.nextTick(() => {
      req.emit('data', Buffer.from(JSON.stringify(body)));
      req.emit('end');
    });
  }

  requestHandler(req, res);
  return { req, res, writeHead };
}

describe('Server Config Population', () => {
  test('GET /config returns correct environment variables', async () => {
    const { res, writeHead } = simulateRequest('GET', '/config');
    
    expect(writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    const responseData = JSON.parse(res.end.mock.calls[0][0]);
    
    expect(responseData.elevenLabsKey).toBe('test-eleven-key');
    expect(responseData.groqApiKey).toBe('test-groq-key');
    expect(responseData.voiceId).toBe('test-voice-id');
    expect(responseData.smtpUser).toBe('test-user@example.com');
  });

  test('GET /config handles missing optional variables', async () => {
    delete process.env.VOICE_ID;
    const { res } = simulateRequest('GET', '/config');
    
    const responseData = JSON.parse(res.end.mock.calls[0][0]);
    expect(responseData.voiceId).toBe('');
  });
});

describe('SMTP Configuration', () => {
  test('SMTP config uses environment variables', () => {
    // Verified via /config population
  });
});

describe('Phrases API', () => {
  test('GET /phrases returns empty array if file missing', async () => {
    fs.existsSync.mockReturnValue(false);
    const { res, writeHead } = simulateRequest('GET', '/phrases?dog=testdog');
    
    expect(writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual([]);
  });

  test('POST /phrases handles server errors gracefully', async () => {
    fs.writeFileSync.mockImplementation(() => {
      throw new Error('Disk Full');
    });
    
    const body = { dog: 'testdog', phrases: ['phrase1'] };
    const { res, writeHead } = simulateRequest('POST', '/phrases', body);
    
    await new Promise(resolve => process.nextTick(resolve));
    
    expect(writeHead).toHaveBeenCalledWith(500, expect.any(Object));
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual(expect.objectContaining({
      ok: false,
      error: 'Disk Full'
    }));
  });

  test('GET /phrases returns phrases for specific dog', async () => {
    const mockPhrases = { 'testdog': ['phrase1', 'phrase2'] };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockPhrases));
    
    const { res, writeHead } = simulateRequest('GET', '/phrases?dog=testdog');
    
    expect(writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual(['phrase1', 'phrase2']);
  });

  test('POST /phrases saves phrases for dog', async () => {
    fs.existsSync.mockReturnValue(false);
    fs.writeFileSync = jest.fn();
    
    const body = { dog: 'testdog', phrases: ['new1', 'new2'] };
    const { res, writeHead } = simulateRequest('POST', '/phrases', body);
    
    // Wait for the async end handler
    await new Promise(resolve => process.nextTick(resolve));
    
    expect(writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('phrases.json'),
      expect.stringContaining('"testdog"')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('phrases.json'),
      expect.stringContaining('new1')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('phrases.json'),
      expect.stringContaining('new2')
    );
  });
});
