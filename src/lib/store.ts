import { Room } from '@/types';

// Use globalThis to ensure we share the same rooms object across API routes and Socket server
// especially in Next.js dev mode where modules might be re-evaluated.
declare global {
    var rooms: Record<string, Room> | undefined;
}

export const rooms: Record<string, Room> = globalThis.rooms || (globalThis.rooms = {});

// Helper to create a room
export const createRoomInStore = (roomName: string, hostId: string): Room => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Room = {
        id: roomId,
        queue: [],
        currentSong: null,
        hostId,
        createdAt: Date.now(),
        isPerforming: false,
    };
    rooms[roomId] = newRoom;
    return newRoom;
};
