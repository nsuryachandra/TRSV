import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Store active SSE connections
let clients = [];

/**
 * 1. SSE Stream Endpoint
 * Dashboards connect here to listen for live operational telemetry.
 */
router.get('/stream', requireAuth, (req, res) => {
  // Set headers required for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Ensure headers are sent immediately

  // Send initial connection heartbeat
  res.write('data: {"type": "CONNECTED", "message": "Enterprise SSE Stream Active"}\n\n');

  // Register client
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  console.log(`📡 [Realtime] New Command Node Connected: ${clientId} (Total: ${clients.length})`);

  // Periodic heartbeat timer to prevent proxy timeout
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('data: {"type": "HEARTBEAT"}\n\n');
    } catch (err) {
      console.error(`[Realtime] Failed writing heartbeat to client ${clientId}:`, err.message);
    }
  }, 15000);

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
  clients.forEach(client => {
    client.res.write(`data: ${data}\n\n`);
  });
};

export default router;
