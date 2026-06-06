/**
 * local server entry file, for local development
 */
import app from './app.js';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from './data/database.js';
import type { WebSocketMessage } from '../shared/types.js';
import { startSensorSimulator, startLocationSimulator } from './services/dataSimulator.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received WebSocket message:', message.type);
    } catch (e) {
      console.error('Invalid WebSocket message');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcast(message: WebSocketMessage) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

db.on('websocket', (message: WebSocketMessage) => {
  broadcast(message);
});

startSensorSimulator();
startLocationSimulator();

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
