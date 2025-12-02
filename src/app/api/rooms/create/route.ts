import { NextResponse } from 'next/server';
import { createRoomInStore } from '@/lib/store';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { roomName, hostId } = body;

        if (!roomName) {
            return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
        }

        const room = createRoomInStore(roomName, hostId || 'unknown');

        console.log(`[API] Room created: ${room.id} (${roomName})`);

        return NextResponse.json({ roomId: room.id });
    } catch (error) {
        console.error('[API] Error creating room:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
