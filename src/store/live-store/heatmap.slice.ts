import { StateCreator } from 'zustand';
import { HeatmapEvent } from '../../types';

export interface HeatmapSlice {
  heatmap: HeatmapEvent | null;
  updateHeatmap: (event: HeatmapEvent) => void;
}

export const createHeatmapSlice: StateCreator<HeatmapSlice, [], [], HeatmapSlice> = (set) => ({
  heatmap: null,
  updateHeatmap: (event: HeatmapEvent) => set({ heatmap: event }),
});
