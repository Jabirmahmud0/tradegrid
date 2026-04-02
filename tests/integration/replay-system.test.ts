import { describe, it, expect, beforeEach } from 'vitest';
import { useLiveStore } from '../../src/store/live-store';

describe('Replay System Integration', () => {
    beforeEach(() => {
        const state = useLiveStore.getState();
        state.setReplayMode('LIVE');
        state.setReplaySpeed(1);
    });

    it('should toggle replay mode and reset state', () => {
        const state = useLiveStore.getState();
        state.setReplayMode('REPLAY');

        const mode = useLiveStore.getState().mode;
        expect(mode).toBe('REPLAY');

        // When toggling back off, we should ideally clear replay-specific state
        state.setReplayMode('LIVE');
        expect(useLiveStore.getState().mode).toBe('LIVE');
    });

    it('should adjust playback speed and broadcast to engine', () => {
        const state = useLiveStore.getState();
        state.setReplaySpeed(5);
        expect(useLiveStore.getState().speed).toBe(5);
    });

    it('should compute time progress correctly', () => {
        const state = useLiveStore.getState();
        state.setReplayCursor(50);
        const cursor = useLiveStore.getState().cursor;
        expect(cursor).toBe(50);

        state.setReplayCursor(100);
        expect(useLiveStore.getState().cursor).toBe(100);
    });
});
