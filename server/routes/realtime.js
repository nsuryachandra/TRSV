import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Store active SSE connections
let clients = [];

/**
 * 1. SSE Stream Endpoint
 * Dashboards connect here to listen for live operational telemetry.
 * NOTE: SSE connections bypass Express CORS middleware, so we set CORS headers manually.
 */
router.get('/stream', requireAuth, (req, res) => {
  // Manually set CORS headers — SSE connections bypass express cors() middleware
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://trsv-union.onrender.com',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.includes('onrender.com');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Set headers required for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering on Render
  res.flushHeaders(); // Ensure headers are sent immediately

  // Send initial connection heartbeat
  res.write('data: {"type": "CONNECTED", "message": "Enterprise SSE Stream Active"}\n\n');

  // Register client
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  console.log(`📡 [Realtime] New Command Node Connected: ${clientId} (Total: ${clients.length})`);

  // Periodic heartbeat timer to prevent proxy timeout (every 20s)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('data: {"type": "HEARTBEAT"}\n\n');
    } catch (err) {
      console.error(`[Realtime] Failed writing heartbeat to client ${clientId}:`, err.message);
      clearInterval(heartbeatInterval);
      clients = clients.filter(client => client.id !== clientId);
    }
  }, 20000);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 [Realtime] Command Node Disconnected: ${clientId}`);
    clearInterval(heartbeatInterval);
    clients = clients.filter(client => client.id !== clientId);
  });
});

/**
 * Utility to securely broadcast realtime events to all connected nodes.
 * Used internally by other API routes when state changes.
 */
export const broadcastEvent = (eventType, payload) => {
  const data = JSON.stringify({ type: eventType, payload });
  const deadClients = [];
  clients.forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      console.warn(`[Realtime] Client ${client.id} write failed, removing:`, err.message);
      deadClients.push(client.id);
    }
  });
  // Prune dead clients
  if (deadClients.length > 0) {
    clients = clients.filter(c => !deadClients.includes(c.id));
  }
};

export default router;
