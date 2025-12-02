import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as NetServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface ExtendedSocket extends NetSocket {
  server: NetServer & {
    io?: Server;
  };
}

interface ExtendedResponse extends NextApiResponse {
  socket: ExtendedSocket;
}

type Song = {
  id: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  addedAt: number;
  uuid: string; // Unique ID for queue item
};

type Room = {
  id: string;
  queue: Song[];
  currentSong: Song | null;
  hostId: string;
  createdAt: number;
};

import { rooms } from '@/lib/store';

// In-memory storage is now imported from @/lib/store

// Use globalThis to prevent multiple IO instances in dev mode
declare global {
  var io: Server | undefined;
}

const SocketHandler = (req: NextApiRequest, res: ExtendedResponse) => {
  if (globalThis.io) {
    console.log('Socket is already running (Global)');
    res.socket.server.io = globalThis.io; // Ensure response reference is set
  } else {
    console.log('Socket is initializing (Global)');
    const io = new Server(res.socket.server, {
      path: '/api/socket-io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    globalThis.io = io;
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected', socket.id);

      // Host creates a room
      socket.on('create_room', (roomName: string, callback) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[roomId] = {
          id: roomId,
          queue: [],
          currentSong: null,
          hostId: socket.id,
          createdAt: Date.now(),
        };
        socket.join(roomId);
        console.log(`Room created: ${roomId} (${roomName})`);

        // Emit event as fallback for client
        socket.emit('room_created', { roomId });

        if (typeof callback === 'function') {
          callback({ roomId });
        }
      });

      // Guest/Admin joins a room
      socket.onAny((eventName, ...args) => {
        console.log(`[Socket DEBUG] Event received: ${eventName}`, args);
      });

      socket.on('join_room', (roomId: string, callback) => {
        const room = rooms[roomId];
        if (room) {
          socket.join(roomId);
          callback({ success: true, roomState: room });
          console.log(`User joined room: ${roomId}`);
        } else {
          callback({ success: false, error: 'Room not found' });
        }
      });

      // Add song to queue
      socket.on('add_to_queue', ({ roomId, song }: { roomId: string; song: Omit<Song, 'uuid' | 'addedAt'> }, callback) => {
        console.log(`[Socket DEBUG] Received add_to_queue. RoomID: ${roomId}, Song: ${song?.title}`);
        console.log(`[Socket DEBUG] Available rooms: ${Object.keys(rooms).join(', ')}`);

        const room = rooms[roomId];
        if (room) {
          const newSong: Song = {
            ...song,
            uuid: Math.random().toString(36).substring(7),
            addedAt: Date.now(),
          };
          // Auto-play if nothing is playing
          if (!room.currentSong) {
            room.currentSong = newSong;
            io.to(roomId).emit('now_playing', newSong);
            console.log(`[Socket] Auto-playing song in ${roomId}: ${song.title}`);
          } else {
            room.queue.push(newSong);
            io.to(roomId).emit('queue_updated', room.queue);
            console.log(`[Socket] Song added to queue in ${roomId}: ${song.title}. Queue length: ${room.queue.length}`);
          }

          if (typeof callback === 'function') {
            callback({ success: true });
          }
        } else {
          console.error(`[Socket] Room not found for add_to_queue: ${roomId}`);
          console.log('[Socket] Available rooms:', Object.keys(rooms));
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Room not found' });
          }
        }
      });

      // Remove song from queue (Host/Admin)
      socket.on('remove_from_queue', ({ roomId, songUuid }: { roomId: string; songUuid: string }) => {
        const room = rooms[roomId];
        if (room) {
          room.queue = room.queue.filter(s => s.uuid !== songUuid);
          io.to(roomId).emit('queue_updated', room.queue);
        }
      });

      // Move song in queue (Admin)
      socket.on('move_in_queue', ({ roomId, songUuid, direction }: { roomId: string; songUuid: string; direction: 'up' | 'down' }) => {
        const room = rooms[roomId];
        if (room) {
          const index = room.queue.findIndex(s => s.uuid === songUuid);
          if (index === -1) return;

          const newIndex = direction === 'up' ? index - 1 : index + 1;

          if (newIndex >= 0 && newIndex < room.queue.length) {
            const [movedSong] = room.queue.splice(index, 1);
            room.queue.splice(newIndex, 0, movedSong);
            io.to(roomId).emit('queue_updated', room.queue);
          }
        }
      });

      // Play next song
      socket.on('play_next', ({ roomId }) => {
        const room = rooms[roomId];
        if (room && room.queue.length > 0) {
          const nextSong = room.queue.shift();
          room.currentSong = nextSong || null;
          io.to(roomId).emit('now_playing', nextSong);
          io.to(roomId).emit('queue_updated', room.queue);
        }
      });

      // Playback controls (Pause/Play) - Broadcast to Host
      socket.on('control_playback', ({ roomId, action }: { roomId: string; action: 'play' | 'pause' }) => {
        io.to(roomId).emit('playback_action', action);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        // Optional: Cleanup empty rooms after delay
      });
    });
  }
  res.end();
};

export default SocketHandler;
