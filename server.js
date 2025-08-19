import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

const server = http.createServer(app);

/**
 * Rooms structure:
 * rooms[roomId] = {
 *   publisher: { id, ws } | null,
 *   viewer: { id, ws } | null
 * }
 */
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { publisher: null, viewer: null });
  }
  return rooms.get(roomId);
}

function safeSend(ws, payload) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const clientId = crypto.randomUUID();
  let role = null;
  let roomId = null;

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }

    if (msg.type === 'join') {
      role = msg.role === 'publisher' ? 'publisher' : 'viewer';
      roomId = String(msg.roomId || 'default');
      const room = getOrCreateRoom(roomId);

      if (role === 'publisher') {
        // Replace any existing publisher
        if (room.publisher && room.publisher.ws && room.publisher.ws !== ws) {
          try { room.publisher.ws.close(4000, 'New publisher joined'); } catch {}
        }
        room.publisher = { id: clientId, ws };
        // Notify viewer if present
        if (room.viewer) {
          safeSend(room.viewer.ws, { type: 'publisher-ready', roomId });
          safeSend(room.publisher.ws, { type: 'viewer-ready', roomId });
        }
      } else {
        // Replace any existing viewer
        if (room.viewer && room.viewer.ws && room.viewer.ws !== ws) {
          try { room.viewer.ws.close(4001, 'New viewer joined'); } catch {}
        }
        room.viewer = { id: clientId, ws };
        // Notify both sides
        if (room.publisher) {
          safeSend(room.viewer.ws, { type: 'publisher-ready', roomId });
          safeSend(room.publisher.ws, { type: 'viewer-ready', roomId });
        }
      }
      return;
    }

    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Signaling relay: offer/answer/candidate
    if (msg.type === 'offer' && role === 'viewer') {
      if (room.publisher) {
        safeSend(room.publisher.ws, { type: 'offer', sdp: msg.sdp, roomId });
      }
      return;
    }

    if (msg.type === 'answer' && role === 'publisher') {
      if (room.viewer) {
        safeSend(room.viewer.ws, { type: 'answer', sdp: msg.sdp, roomId });
      }
      return;
    }

    if (msg.type === 'candidate') {
      if (role === 'viewer' && room.publisher) {
        safeSend(room.publisher.ws, { type: 'candidate', candidate: msg.candidate, roomId });
      } else if (role === 'publisher' && room.viewer) {
        safeSend(room.viewer.ws, { type: 'candidate', candidate: msg.candidate, roomId });
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    if (role === 'publisher' && room.publisher && room.publisher.id === clientId) {
      room.publisher = null;
      if (room.viewer) safeSend(room.viewer.ws, { type: 'publisher-left', roomId });
    }
    if (role === 'viewer' && room.viewer && room.viewer.id === clientId) {
      room.viewer = null;
      if (room.publisher) safeSend(room.publisher.ws, { type: 'viewer-left', roomId });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
}); 