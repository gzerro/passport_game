import { createHmac } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
const platformApiBaseUrl = process.env.PLATFORM_API_BASE_URL ?? '';
const platformApiSecret = process.env.PLATFORM_API_SECRET ?? '';
const distDir = path.resolve(process.cwd(), 'dist');

const platformRoutes = new Map([
  ['/api/player/info', '/player/info'],
  ['/api/bet/create', '/bet/create'],
  ['/api/bet/settle', '/bet/settle'],
  ['/api/bet/cancel', '/bet/cancel'],
  ['/api/bet/rollback', '/bet/rollback'],
]);

const quickGameSchedule = [
  ['options', 'Опционы'],
  ['passport', 'Паспорт'],
  ['call', 'Звонок'],
  ['sarcophagus', 'Саркофаг'],
  ['rocket', 'Ракета'],
];

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const setCorsHeaders = (response) => {
  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Auth-Signature');
};

const sendJson = (response, statusCode, payload) => {
  setCorsHeaders(response);
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const sendText = (response, statusCode, message) => {
  setCorsHeaders(response);
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
};

const readRequestBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 256 * 1024) {
      throw new Error('Request body too large');
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const signBody = (body) =>
  createHmac('sha256', platformApiSecret).update(body).digest('hex');

const makePlatformUrl = (platformPath) => {
  const base = platformApiBaseUrl.endsWith('/') ? platformApiBaseUrl : `${platformApiBaseUrl}/`;
  return new URL(platformPath.replace(/^\//, ''), base);
};

const mockPlatformResponse = (platformPath, payload) => {
  if (platformPath === '/player/info') {
    return {
      id: payload.playerId ?? 'demo-player',
      balance: 1_000_000,
      currency: payload.currency ?? 'RUB',
    };
  }

  return {
    createdAt: new Date().toISOString(),
    processedTxId: `mock-${payload.txId ?? Date.now()}`,
  };
};

const forwardToPlatform = async (platformPath, payload) => {
  if (!platformApiBaseUrl) {
    return {
      statusCode: 200,
      body: mockPlatformResponse(platformPath, payload),
    };
  }

  if (!platformApiSecret) {
    return {
      statusCode: 500,
      body: { message: 'PLATFORM_API_SECRET is required when PLATFORM_API_BASE_URL is set' },
    };
  }

  const body = JSON.stringify(payload);
  const platformResponse = await fetch(makePlatformUrl(platformPath), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Signature': signBody(body),
    },
    body,
  });

  const responseText = await platformResponse.text();

  try {
    return {
      statusCode: platformResponse.status,
      body: responseText ? JSON.parse(responseText) : {},
    };
  } catch {
    return {
      statusCode: platformResponse.status,
      body: { message: responseText || platformResponse.statusText },
    };
  }
};

const handlePlatformProxy = async (request, response, platformPath) => {
  if (request.method !== 'POST') {
    sendJson(response, 405, { message: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = await readRequestBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    const platformResult = await forwardToPlatform(platformPath, payload);
    sendJson(response, platformResult.statusCode, platformResult.body);
  } catch (error) {
    sendJson(response, 400, { message: error instanceof Error ? error.message : 'Invalid request' });
  }
};

const buildSchedule = () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return quickGameSchedule.map(([gameId, matchName], index) => ({
    eventId: `${gameId}-demo`,
    gameId,
    matchName,
    matchStartTime: new Date(now).toISOString(),
    matchEndTime: new Date(now + dayMs).toISOString(),
    federation: 'Quick Games Demo',
    tournamentId: 1000 + index,
    tournamentName: 'Demo быстрых игр',
    tournamentStartTime: new Date(now).toISOString(),
    tournamentEndTime: new Date(now + dayMs).toISOString(),
  }));
};

const handleSchedule = (response) => {
  sendJson(response, 200, buildSchedule());
};

const serveStaticFile = async (requestUrl, response) => {
  if (!existsSync(distDir)) {
    sendText(response, 404, 'Build directory not found. Run npm run build first.');
    return;
  }

  const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
  const filePath = path.resolve(distDir, `.${pathname}`);

  if (!filePath.startsWith(distDir)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  const finalPath = existsSync(filePath) && statSync(filePath).isFile()
    ? filePath
    : path.join(distDir, 'index.html');

  try {
    const stat = statSync(finalPath);
    const extension = path.extname(finalPath);
    const contentType = mimeTypes.get(extension) ?? 'application/octet-stream';

    setCorsHeaders(response);
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });
    createReadStream(finalPath).pipe(response);
  } catch {
    const fallbackHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
    setCorsHeaders(response);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(fallbackHtml);
  }
};

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const platformPath = platformRoutes.get(requestUrl.pathname);

  if (platformPath) {
    await handlePlatformProxy(request, response, platformPath);
    return;
  }

  if (requestUrl.pathname === '/getschedule' || requestUrl.pathname === '/api/getschedule') {
    handleSchedule(response);
    return;
  }

  await serveStaticFile(requestUrl, response);
});

server.listen(port, host, () => {
  console.log(`Provider adapter listening on http://${host}:${port}`);
});
