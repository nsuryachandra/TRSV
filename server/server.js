import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin SDK for background push notifications
let firebaseApp = null;
try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 [Firebase] Firebase Admin SDK initialized successfully.');
  } else {
    console.log('⚠️ [Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is missing. Background push notifications will be bypassed.');
  }
} catch (fbErr) {
  console.warn('⚠️ [Firebase] Failed to initialize Firebase Admin SDK:', fbErr.message);
}

// Import config and routes
import pool from './config/db.js';
import authRouter from './routes/auth.js';
import sessionsRouter from './routes/sessions.js';
import constituencyRouter from './routes/constituencies.js';
import collegeRouter from './routes/colleges.js';
import complaintRouter from './routes/complaints.js';
import announcementRouter from './routes/announcements.js';
import dashboardRouter from './routes/dashboards.js';
import analyticsRouter from './routes/analytics.js';
import transparencyRouter from './routes/transparency.js';
import emergencyRouter from './routes/emergency.js';
import realtimeRouter from './routes/realtime.js';
import searchRouter from './routes/search.js';
import telemetryRouter from './routes/telemetry.js';
import automationRouter, { runAutoEscalationJob } from './routes/automation.js';
import identityRouter from './routes/identity.js';
import chatRouter from './routes/chat.js';
import notificationsRouter from './routes/notifications.js';
import joinRouter from './routes/join.js';


// Startup Environment Validation
const REQUIRED_ENVS = ['DATABASE_URL', 'JWT_SECRET'];
REQUIRED_ENVS.forEach(env => {
  if (!process.env[env]) {
    console.error(`🚨 FATAL: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

const app = express();
// Allow trusted proxy headers when deployed behind Render/other reverse proxies.
// This prevents express-rate-limit from rejecting requests with X-Forwarded-For.
const TRUST_PROXY = process.env.TRUST_PROXY || '1';
if (TRUST_PROXY) {
  app.set('trust proxy', TRUST_PROXY);
}
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  ALLOWED_ORIGIN,
  'http://localhost',
  'capacitor://localhost'
];

const corsOriginHandler = (origin, callback) => {
  if (!origin || origin === 'null' || origin === 'file://') return callback(null, true);
  if (
    allowedOrigins.indexOf(origin) !== -1 ||
    origin.startsWith('http://localhost:') ||
    origin.includes('tvrs-union.onrender.com') ||
    origin.includes('onrender.com')
  ) {
    return callback(null, true);
  }
  return callback(null, false); // Fail safely, but let CORS middleware handle it
};

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST']
  }
});

// Enable JSON parsers and compression
app.use(compression());
app.use(cors({ origin: corsOriginHandler }));
// Parse cookies for refresh-token flows
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Mitigate payload attacks
app.disable('x-powered-by');

// Enterprise Security Hardening with Leaflet CSP Whitelist Exceptions
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com", "https://api.fontshare.com", "https://*.fontshare.com"],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:",
        "https://*.supabase.co",
        "https://images.unsplash.com",
        "https://*.openstreetmap.org",
        "https://*.basemaps.cartocdn.com",
        "https://server.arcgisonline.com",
        "https://unpkg.com"
      ],
      connectSrc: [
        "'self'", 
        "ws:",
        "wss:",
        "https://*.supabase.co",
        "https://nominatim.openstreetmap.org",
        "https://unpkg.com",
        "https://api.fontshare.com",
        "https://*.fontshare.com",
        // Allow onrender deployments and known TVRS hostnames for SSE and realtime sockets
        "https://trsv-union.onrender.com",
        "https://tvrs-union.onrender.com",
        "https://*.onrender.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://api.fontshare.com", "https://*.fontshare.com"],
      frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(xss());

// Advanced DDOS & Brute-Force Protection Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 reqs per 15 min
  message: { success: false, message: 'Strict DDOS protection active. Too many requests. Please wait 15 minutes.' }
});
app.use('/api', apiLimiter);

// Request logging middleware for telemetry auditing
app.use((req, res, next) => {
  console.log(`📡 [API Call] ${req.method} ${req.url}`);
  next();
});

// Register API Sub-Modules
app.use('/api/auth', authRouter);
app.use('/api/auth', sessionsRouter);
app.use('/api/constituencies', constituencyRouter);
app.use('/api/colleges', collegeRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/dashboards', dashboardRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/transparency', transparencyRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/search', searchRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/automation', automationRouter);
app.use('/api/identity', identityRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/join-tvrs', joinRouter);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      service: 'TVRS Governance Core Node',
      database: 'connected',
      timestamp: dbCheck.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      service: 'TVRS Governance Core Node',
      database: 'disconnected',
      error: error.message
    });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets in production
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback all non-API paths to index.html for client-side routing
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found.' });
  }
  // Prevent serving index.html for missing static files with extensions (e.g. .css, .js)
  if (path.extname(req.path)) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 [Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred on governance node.',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

// Configure Socket.io Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch live profile details including parent/hub structure
    const userRes = await pool.query(`
      SELECT u.id, u.role, u.full_name, u.email, u.constituency_id,
             c.constituency_name,
             p.constituency_name as parent_name,
             COALESCE(p.constituency_name, c.constituency_name, 'Upcoming Area') as hub_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      LEFT JOIN constituencies p ON c.parent_id = p.id
      WHERE u.id = $1
    `, [decoded.uid]);

    if (userRes.rows.length === 0) {
      return next(new Error('Authentication error: User profile not found'));
    }

    socket.user = {
      ...userRes.rows[0],
      uid: userRes.rows[0].id // Maintain compatibility with existing code using socket.user.uid
    };
    next();
  } catch (err) {
    // If token expired, attempt a graceful accept for leadership/admin roles
    try {
      if (err.name === 'TokenExpiredError') {
        const decoded = jwt.decode(token);
        if (decoded && decoded.uid) {
          // First try to validate refresh token passed as cookie in handshake headers
          try {
            const cookieHeader = socket.handshake.headers?.cookie || '';
            const parsed = cookieHeader ? Object.fromEntries(cookieHeader.split(';').map(s=>s.split('=').map(p=>p.trim()))) : {};
            const provided = parsed.trsv_refresh || null;
            if (provided) {
              const providedHash = crypto.createHash('sha256').update(provided).digest('hex');
              const rt = await pool.query('SELECT token_hash AS token, user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1', [providedHash]);
              if (rt.rows.length > 0) {
                const r = rt.rows[0];
                if (r.revoked) {
                  // Reuse detected: revoke all sessions for this user
                  try {
                    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [r.user_id]);
                    console.warn('🚨 [Socket Auth] Refresh token reuse detected during socket handshake. All sessions revoked for user:', r.user_id);
                    return next(new Error('Authentication error: Refresh token reuse detected'));
                  } catch (revErr) {
                    console.error('🚨 [Socket Auth] Failed to revoke sessions after reuse detection:', revErr.message);
                    return next(new Error('Authentication error: Refresh token invalid'));
                  }
                }
                if (new Date(r.expires_at) > new Date()) {
                  const userRes2 = await pool.query('SELECT id, role, full_name, email, constituency_id FROM users WHERE id = $1', [decoded.uid]);
                  if (userRes2.rows.length > 0) {
                    const userRow = userRes2.rows[0];
                    // Accept connection and attach user
                    socket.user = { ...userRow, uid: userRow.id };
                    // Rotate refresh token and issue new access token for socket
                    try {
                      const newRefresh = crypto.randomBytes(40).toString('hex');
                      const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
                      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      await pool.query('UPDATE refresh_tokens SET revoked = TRUE, replaced_by_hash = $1, last_used_at = NOW() WHERE token_hash = $2', [newHash, providedHash]);
                      await pool.query('INSERT INTO refresh_tokens(token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [newHash, userRow.id, expiresAt]);
                      // Note: cannot set cookie over socket; server will emit refreshed token for client to persist
                    } catch (rotErr) {
                      console.warn('⚠️ [Socket Auth] Failed to rotate refresh token:', rotErr.message);
                    }
                    socket.__newAuthToken = jwt.sign({ uid: userRow.id, email: userRow.email, role: userRow.role, name: userRow.full_name }, process.env.JWT_SECRET, { expiresIn: '7d' });
                    return next();
                  }
                }
              }
            }
          } catch (cookieErr) {
            console.warn('⚠️ [Socket Auth] Cookie validation failed:', cookieErr.message);
          }

          // No fallback: require valid refresh cookie to accept expired tokens via socket handshake
        }
      }
    } catch (innerErr) {
      console.warn('⚠️ [Socket Auth Grace Refresh] Internal check failed:', innerErr.message);
    }

    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

const messageRateLimits = new Map();

// Intercept database query operations to broadcast created notifications in real time
const originalQuery = pool.query;
pool.query = async function (text, params, callback) {
  let actualParams = params;
  let actualCallback = callback;
  if (typeof params === 'function') {
    actualCallback = params;
    actualParams = [];
  }

  let modifiedText = text;
  if (typeof text === 'string') {
    const queryLower = text.toLowerCase();
    if (queryLower.includes('insert into notifications') && !queryLower.includes('returning')) {
      modifiedText = text + ' RETURNING id';
    }
  } else if (text && typeof text === 'object' && text.text) {
    const queryLower = text.text.toLowerCase();
    if (queryLower.includes('insert into notifications') && !queryLower.includes('returning')) {
      modifiedText = { ...text, text: text.text + ' RETURNING id' };
    }
  }

  const result = await originalQuery.call(pool, modifiedText, actualParams);

  try {
    const queryStr = typeof text === 'string' ? text.trim().toLowerCase() : '';
    if (queryStr.includes('insert into notifications')) {
      if (actualParams && actualParams.length >= 3) {
        // Collect returned ids if available
        const insertedIds = (result && result.rows && result.rows.length > 0)
          ? result.rows.map(r => r.id)
          : [];

        let notifIndex = 0;
        for (let i = 0; i < actualParams.length; i += 3) {
          if (i + 2 < actualParams.length) {
            const userId = actualParams[i];
            const title = actualParams[i + 1];
            const message = actualParams[i + 2];
            
            const notificationId = insertedIds[notifIndex] || (Math.floor(Math.random() * 100000000) + 1);
            notifIndex++;

            // Broadcast live socket event to user's personal channel room
            io.to(`user_${userId}`).emit('new_notification', {
              id: notificationId,
              user_id: userId,
              title: title,
              message: message,
              read: false,
              created_at: new Date().toISOString()
            });

            // Send native background push notification via Firebase Admin SDK
            sendBackgroundPush(userId, title, message);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error emitting live notification socket event:', err);
  }

  return result;
};

const sendBackgroundPush = async (userId, title, message) => {
  if (!firebaseApp) return;
  try {
    // Retrieve registered FCM tokens for this user from database
    const tokenRes = await originalQuery.call(pool, 'SELECT token FROM user_fcm_tokens WHERE user_id = $1', [userId]);
    if (tokenRes.rows.length === 0) return;

    const tokens = tokenRes.rows.map(r => r.token);
    
    // Construct FCM multicast payload
    const payload = {
      notification: {
        title: title || 'TVRS Alert',
        body: message || ''
      },
      android: {
        notification: {
          icon: 'ic_launcher_round',
          sound: 'default'
        }
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`📡 [Firebase] Successfully sent ${response.successCount} background push messages (${response.failureCount} failed).`);

    // Clean up expired tokens if they failed with invalid/not-registered error code
    if (response.failureCount > 0) {
      const tokensToDelete = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error && (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered')) {
            tokensToDelete.push(tokens[idx]);
          }
        }
      });

      if (tokensToDelete.length > 0) {
        await originalQuery.call(pool, 'DELETE FROM user_fcm_tokens WHERE token = ANY($1)', [tokensToDelete]);
        console.log(`🧹 [Firebase] Cleared ${tokensToDelete.length} stale FCM tokens.`);
      }
    }
  } catch (err) {
    console.error('🚨 [Firebase] Background push notification broadcast error:', err.message);
  }
};

// Configure Socket.io real-time event routing
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Telemetry node linked (Auth: ${socket.user.uid}): ${socket.id}`);

  // Join user's personal room for direct notification alerts
  socket.join(`user_${socket.user.uid}`);

  // If a refreshed token was generated during auth, send it to client for immediate replacement
  if (socket.__newAuthToken) {
    try {
      socket.emit('token_refreshed', { token: socket.__newAuthToken });
      // remove it after sending
      delete socket.__newAuthToken;
    } catch (e) {
      console.warn('⚠️ [Socket Token Emit] Failed to emit refreshed token to socket:', e.message);
    }
  }

  const checkChannelAuth = async (user, channel_id) => {
    if (user.role === 'dev' || user.role === 'supreme_admin') {
      return true;
    }
    if (user.role === 'student') {
      return channel_id === `Social-Sector-${user.hub_name}`;
    }
    // Leader roles
    if (channel_id.startsWith('Social-Sector-')) {
      return true;
    }
    if (channel_id === 'GH-Global') {
      return true;
    }
    if (channel_id.startsWith('GH-Constituency-')) {
      const constituencyName = channel_id.replace('GH-Constituency-', '');
      if (
        user.constituency_name && 
        (user.constituency_name.toLowerCase() === constituencyName.toLowerCase() ||
         user.parent_name && user.parent_name.toLowerCase() === constituencyName.toLowerCase())
      ) {
        return true;
      }
      try {
        const hierarchyCheck = await pool.query(`
          SELECT 1 
          FROM constituencies child
          JOIN constituencies parent ON child.parent_id = parent.id
          WHERE LOWER(child.constituency_name) = LOWER($1)
            AND LOWER(parent.constituency_name) = LOWER($2)
        `, [constituencyName, user.constituency_name]);
        return hierarchyCheck.rows.length > 0;
      } catch (err) {
        console.error('🚨 [Socket.io Channel Auth Error]:', err.message);
        return false;
      }
    }
    return false;
  };

  // 1. Join Chat Room
  socket.on('join_channel', async (channel_id) => {
    const isAuth = await checkChannelAuth(socket.user, channel_id);
    if (!isAuth) {
      console.warn(`⚠️ [Socket.io] Unauthorized join attempt by socket ${socket.id} to channel ${channel_id}`);
      return;
    }
    socket.join(channel_id);
    console.log(`👥 [Socket.io] Socket ${socket.id} joined channel: ${channel_id}`);
  });

  // 2. Broadcast Message
  socket.on('send_message', async (data) => {
    const { channel_id, sender_id, message_text } = data;
    
    // Strict sender_id validation (prevents spoofing)
    if (sender_id !== socket.user.uid) {
      console.warn(`⚠️ [Socket.io] Spoofing attempt by socket ${socket.id} (Claimed: ${sender_id}, Actual: ${socket.user.uid})`);
      return;
    }

    const isAuth = await checkChannelAuth(socket.user, channel_id);
    if (!isAuth) {
      console.warn(`⚠️ [Socket.io] Unauthorized message post attempt by socket ${socket.id} to channel ${channel_id}`);
      return;
    }

    // Rate Limiting: max 10 messages per 10 seconds per socket
    const now = Date.now();
    const limitWindow = 10000;
    const rateData = messageRateLimits.get(socket.id) || { count: 0, firstMsgTime: now };
    
    if (now - rateData.firstMsgTime > limitWindow) {
      rateData.count = 1;
      rateData.firstMsgTime = now;
    } else {
      rateData.count++;
      if (rateData.count > 10) {
        socket.emit('rate_limit_error', { message: 'Message rate limit exceeded. Please wait.' });
        return;
      }
    }
    messageRateLimits.set(socket.id, rateData);

    try {
      // Persist to Postgres
      const result = await pool.query(
        `INSERT INTO chat_messages (channel_id, sender_id, message_text)
         VALUES ($1, $2, $3)
         RETURNING id, created_at`,
        [channel_id, sender_id, message_text]
      );

      // Fetch sender details to attach role & name badges
      const userResult = await pool.query(
        `SELECT full_name as sender_name, role as sender_role FROM users WHERE id = $1`,
        [sender_id]
      );

      const senderName = userResult.rows[0]?.sender_name || 'Anonymous';
      const senderRole = userResult.rows[0]?.sender_role || 'user';

      const fullMessage = {
        id: result.rows[0].id,
        channel_id,
        sender_id,
        message_text,
        created_at: result.rows[0].created_at,
        sender_name: senderName,
        sender_role: senderRole
      };

      // Broadcast to the channel room
      io.to(channel_id).emit('new_message', fullMessage);

      // Send background push notification to other users in the channel
      try {
        let recipientTokens = [];
        if (channel_id === 'GH-Global') {
          const tokenRes = await pool.query(
            `SELECT DISTINCT f.token 
             FROM user_fcm_tokens f
             JOIN users u ON f.user_id = u.id
             WHERE u.id != $1 
               AND u.role IN ('dev', 'supreme_admin', 'president', 'state_president', 'vice_president', 'general_secretary', 'secretary')`,
            [sender_id]
          );
          recipientTokens = tokenRes.rows.map(r => r.token);
        } else if (channel_id.startsWith('GH-Constituency-')) {
          const constName = channel_id.replace('GH-Constituency-', '');
          const tokenRes = await pool.query(
            `SELECT DISTINCT f.token 
             FROM user_fcm_tokens f
             JOIN users u ON f.user_id = u.id
             JOIN constituencies c ON u.constituency_id = c.id
             WHERE u.id != $1 
               AND LOWER(c.constituency_name) = LOWER($2)
               AND u.role IN ('dev', 'supreme_admin', 'president', 'state_president', 'vice_president', 'general_secretary', 'secretary')`,
            [sender_id, constName]
          );
          recipientTokens = tokenRes.rows.map(r => r.token);
        } else if (channel_id.startsWith('Social-Sector-')) {
          const hubName = channel_id.replace('Social-Sector-', '');
          const tokenRes = await pool.query(
            `SELECT DISTINCT f.token 
             FROM user_fcm_tokens f
             JOIN users u ON f.user_id = u.id
             LEFT JOIN constituencies c ON u.constituency_id = c.id
             LEFT JOIN constituencies p ON c.parent_id = p.id
             WHERE u.id != $1 
               AND LOWER(COALESCE(p.constituency_name, c.constituency_name, 'Upcoming Area')) = LOWER($2)`,
            [sender_id, hubName]
          );
          recipientTokens = tokenRes.rows.map(r => r.token);
        }

        if (recipientTokens.length > 0 && firebaseApp) {
          const notificationTitle = channel_id.startsWith('Social-Sector-')
            ? `${channel_id.replace('Social-Sector-', '')} Social`
            : (channel_id === 'GH-Global' ? 'Statewide Lounge' : channel_id.replace('GH-Constituency-', ''));

          const payload = {
            notification: {
              title: `💬 ${notificationTitle}`,
              body: `${senderName}: ${message_text.substring(0, 100)}${message_text.length > 100 ? '...' : ''}`
            },
            android: {
              notification: {
                icon: 'ic_launcher_round',
                sound: 'default'
              }
            },
            tokens: recipientTokens
          };

          const response = await admin.messaging().sendEachForMulticast(payload);
          console.log(`📡 [Firebase Chat] Sent ${response.successCount} push notifications for channel ${channel_id} (${response.failureCount} failed).`);

          if (response.failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const error = resp.error;
                if (error && (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered')) {
                  tokensToDelete.push(recipientTokens[idx]);
                }
              }
            });

            if (tokensToDelete.length > 0) {
              await pool.query('DELETE FROM user_fcm_tokens WHERE token = ANY($1)', [tokensToDelete]);
              console.log(`🧹 [Firebase Chat] Cleared ${tokensToDelete.length} stale FCM tokens.`);
            }
          }
        }
      } catch (fcmErr) {
        console.error('🚨 [Firebase Chat Push Error]:', fcmErr.message);
      }
    } catch (err) {
      console.error('🚨 [Socket.io Message Save Error]:', err.message);
    }
  });

  // 3. Edit Message Telemetry
  socket.on('edit_message', async (data) => {
    const { id, channel_id, message_text } = data;
    const isAuth = await checkChannelAuth(socket.user, channel_id);
    if (!isAuth) {
      console.warn(`⚠️ [Socket.io] Unauthorized edit attempt by socket ${socket.id} to channel ${channel_id}`);
      return;
    }
    try {
      // Verify message ownership
      const msgRes = await pool.query('SELECT sender_id FROM chat_messages WHERE id = $1', [id]);
      if (msgRes.rows.length === 0) {
        return;
      }
      
      const message = msgRes.rows[0];
      const isOwner = message.sender_id === socket.user.uid;
      const isAdmin = socket.user.role === 'supreme_admin' || socket.user.role === 'dev';

      if (!isOwner && !isAdmin) {
        console.warn(`⚠️ [Socket.io] Unauthorized edit attempt by socket ${socket.id} (not owner or admin)`);
        return;
      }

      const result = await pool.query(
        `UPDATE chat_messages 
         SET message_text = $1, is_edited = TRUE 
         WHERE id = $2 
         RETURNING id, channel_id, message_text, is_edited, created_at`,
        [message_text, id]
      );

      if (result.rows.length > 0) {
        io.to(channel_id).emit('message_edited', result.rows[0]);
      }
    } catch (err) {
      console.error('🚨 [Socket.io Message Edit Error]:', err.message);
    }
  });

  // 4. Typing Telemetry
  socket.on('typing_start', (data) => {
    socket.to(data.channel_id).emit('typing_start', data);
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.channel_id).emit('typing_stop', data);
  });

  socket.on('disconnect', () => {
    messageRateLimits.delete(socket.id);
    console.log(`🔌 [Socket.io] Telemetry node unlinked: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SERVER START + STARTUP SCHEMA SYNC
// Each migration step is independently try/catched — no single failure
// blocks the remaining steps. Every multi-statement DDL is split into
// separate pool.query() calls to avoid Neon/Supabase rejection of
// semicolon-separated multi-statement strings.
// ─────────────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  console.log(`🚀 [Server] TVRS Phase 4 Governance backend live on http://localhost:${PORT}`);

  // STEP 1: Fix role CHECK constraint FIRST — must run before any role-dependent seeds
  try {
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('student', 'secretary', 'general_secretary', 'vice_president', 'president', 'state_president', 'supreme_admin', 'dev'))
    `);
    console.log('🔹 [Database] Users role constraint updated (dev + state_president allowed).');
  } catch (roleErr) {
    console.warn('⚠️ [Database] Role constraint update skipped (likely already correct):', roleErr.message);
  }

  // STEP 2: Password recovery columns & Performance Indexes
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_complaints_constituency_id ON complaints(constituency_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_complaints_college_id ON complaints(college_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_complaint_timeline_complaint_id ON complaint_timeline(complaint_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_realtime_activity_logs_created_at ON realtime_activity_logs(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_realtime_activity_logs_activity_type ON realtime_activity_logs(activity_type)`);
    
    // Auto-prune realtime logs: Keep last 3000 entries max to conserve database storage
    await pool.query(`
      DELETE FROM realtime_activity_logs 
      WHERE id NOT IN (
        SELECT id FROM realtime_activity_logs 
        ORDER BY created_at DESC 
        LIMIT 3000
      )
    `);
    console.log('🧹 [Database] Auto-pruned realtime activity logs to keep storage optimized.');
    console.log('🔹 [Database] Users password recovery and performance indexes synchronized.');
  } catch (err) {
    console.error('🚨 [Database] Failed to sync password recovery or indexes:', err.message);
  }

  // STEP 2.5: Refresh tokens table for long-lived refresh token support
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token_hash VARCHAR(128) UNIQUE NOT NULL,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        replaced_by_hash VARCHAR(128) NULL,
        last_used_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    // Ensure compat columns exist for older DBs
    await pool.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS replaced_by_hash VARCHAR(128)`);
    await pool.query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE`);
    console.log('🔹 [Database] refresh_tokens table ensured.');
  } catch (rtErr) {
    console.error('🚨 [Database] Failed to create refresh_tokens table:', rtErr.message);
  }

  // STEP 3: Chat messages table (separate queries — no multi-statement)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        channel_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_join_requests_constituency_id ON join_requests(constituency_id)`);
    
    // Safely check if qr_verification_logs exists before trying to index it
    const qrTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'member_identities'
      )
    `);
    if (qrTableExists.rows[0].exists) {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_member_identities_user_id ON member_identities(user_id)`);
    }
    
    console.log('🔹 [Database] Chat messages schema and performance indexes synchronized.');
  } catch (chatDbErr) {
    console.error('🚨 [Database] Failed to sync chat messages schema:', chatDbErr.message);
  }

  // STEP 4: Seed Master Developer account - Removed for production security

  // STEP 5: Ensure "Upcoming Area" constituency exists
  try {
    await pool.query(`
      INSERT INTO constituencies (constituency_name, district, status)
      VALUES ('Upcoming Area', 'Statewide', 'active')
      ON CONFLICT (constituency_name) DO NOTHING
    `);
    console.log('🔹 [Database] Upcoming Area constituency synchronized.');
  } catch (upcomingErr) {
    console.error('🚨 [Database] Failed to ensure Upcoming Area constituency:', upcomingErr.message);
  }

  // STEP 6: Parent-child constituency hierarchy setup
  try {
    await pool.query(`
      ALTER TABLE constituencies 
      ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES constituencies(id) ON DELETE CASCADE
    `);
    let ghRes = await pool.query("SELECT id FROM constituencies WHERE constituency_name = 'Greater Hyderabad'");
    let ghId;
    if (ghRes.rows.length > 0) {
      ghId = ghRes.rows[0].id;
      const oldHydRes = await pool.query("SELECT id FROM constituencies WHERE constituency_name = 'Hyderabad (Parliament)'");
      if (oldHydRes.rows.length > 0) {
        const oldId = oldHydRes.rows[0].id;
        await pool.query("UPDATE users SET constituency_id = $1 WHERE constituency_id = $2", [ghId, oldId]);
        await pool.query("UPDATE colleges SET constituency_id = $1 WHERE constituency_id = $2", [ghId, oldId]);
        await pool.query("UPDATE complaints SET constituency_id = $1 WHERE constituency_id = $2", [ghId, oldId]);
        await pool.query("DELETE FROM constituencies WHERE id = $1", [oldId]);
      }
    } else {
      await pool.query(`UPDATE constituencies SET constituency_name = 'Greater Hyderabad' WHERE constituency_name = 'Hyderabad (Parliament)'`);
      ghRes = await pool.query("SELECT id FROM constituencies WHERE constituency_name = 'Greater Hyderabad'");
      if (ghRes.rows.length > 0) ghId = ghRes.rows[0].id;
    }
    if (ghId) {
      await pool.query(`
        UPDATE constituencies SET parent_id = $1 
        WHERE district = 'Hyderabad' AND id != $1 AND parent_id IS NULL
      `, [ghId]);
    }
    console.log('🔹 [Database] Constituency hierarchy synchronized.');
  } catch (conErr) {
    console.error('🚨 [Database] Failed to sync constituency hierarchy:', conErr.message);
  }

  // STEP 7: Complaint details columns on complaints (each column separate to avoid multi-statement rejection)
  try {
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS complainant_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS complainant_mobile VARCHAR(20)`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS college_school_address TEXT`);
    console.log('🔹 [Database] Complaints form columns synchronized.');
  } catch (colErr) {
    console.error('🚨 [Database] Failed to sync complaint columns:', colErr.message);
  }

  // STEP 8: Announcements image_url column
  try {
    await pool.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`);
    console.log('🔹 [Database] Announcements image_url column synchronized.');
  } catch (imgErr) {
    console.error('🚨 [Database] Failed to sync announcements image_url column:', imgErr.message);
  }

  // STEP 9: Clean up old leaders
  try {
    // 1. Delete Pranith and Omkar
    await pool.query("DELETE FROM users WHERE email IN ('pranith@trsv.gov.in', 'omkar@trsv.gov.in')");
    console.log('🔹 [Database] Old leaders synchronized.');
  } catch (syncErr) {
    console.error('🚨 [Database] Failed to sync old leaders:', syncErr.message);
  }

  // STEP 10: Rename member_identities column tsrv_member_id to trsv_member_id if exists
  try {
    await pool.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='member_identities' AND column_name='tsrv_member_id'
        ) THEN 
          ALTER TABLE member_identities RENAME COLUMN tsrv_member_id TO trsv_member_id;
        END IF;
      END $$;
    `);
    console.log('🔹 [Database] Digital ID member identifier column synchronized to trsv_member_id.');
  } catch (colErr) {
    console.error('🚨 [Database] Failed to rename identity column:', colErr.message);
  }


  // STEP 12: Create user_fcm_tokens table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device_info VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id)`);
    console.log('🔹 [Database] FCM tokens schema synchronized.');
  } catch (fcmDbErr) {
    console.error('🚨 [Database] Failed to sync FCM tokens schema:', fcmDbErr.message);
  }

  // Background auto-escalation scheduler
  setTimeout(() => {
    runAutoEscalationJob().catch(err => console.error('Initial cron job error:', err.message));
  }, 10000);
  setInterval(() => {
    runAutoEscalationJob().catch(err => console.error('Cron job error:', err.message));
  }, 4 * 60 * 60 * 1000);
});

// Graceful Shutdown Handler
const gracefulShutdown = () => {
  console.log('🛑 [Server] Received shutdown signal. Draining pool and closing Socket.io...');
  io.close(() => {
    pool.end(() => {
      console.log('✅ [Server] Connections closed. Shutting down.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
