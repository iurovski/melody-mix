export type Song = {
    id: string;
    title: string;
    thumbnail: string;
    addedBy: string;
    addedAt: number;
    uuid: string;
};

export type Room = {
    id: string;
    queue: Song[];
    currentSong: Song | null;
    hostId: string;
    createdAt: number;
    isPerforming?: boolean;
};
