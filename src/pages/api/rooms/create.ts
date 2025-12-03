import type { NextApiRequest, NextApiResponse } from 'next';
import { createRoomInStore } from '@/lib/store';

type CreateRoomRequestBody = {
    roomName?: string;
    hostId?: string;
};

type CreateRoomResponse =
    | { roomId: string }
    | { error: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<CreateRoomResponse>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { roomName, hostId } = req.body as CreateRoomRequestBody;

    if (!roomName || !hostId) {
        return res.status(400).json({ error: 'roomName and hostId are required' });
    }

    try {
        const newRoom = createRoomInStore(roomName, hostId);
        return res.status(200).json({ roomId: newRoom.id });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Failed to create room' });
    }
}
