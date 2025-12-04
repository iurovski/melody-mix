import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoomInStore, rooms } from './store';

describe('createRoomInStore', () => {
  beforeEach(() => {
    Object.keys(rooms).forEach((key) => delete rooms[key]);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates and stores a room with generated id', () => {
    const room = createRoomInStore('Karaoke Night', 'host-1');

    expect(room.id).toBe('4FZZZX');
    expect(room.queue).toEqual([]);
    expect(room.currentSong).toBeNull();
    expect(room.hostId).toBe('host-1');
    expect(typeof room.createdAt).toBe('number');
    expect(rooms[room.id]).toBe(room);
  });
});
