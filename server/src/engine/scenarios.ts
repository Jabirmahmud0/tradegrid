export type ScenarioMode = 'NORMAL' | 'BURST' | 'FAILURE' | 'REPLAY';

export interface ScenarioState {
  mode: ScenarioMode;
  tickInterval: number;
  burstMultiplier: number;
  failureRate: number; // 0 to 1
}

export const DEFAULT_SCENARIO: ScenarioState = {
  mode: 'NORMAL',
  tickInterval: 100,
  burstMultiplier: 1,
  failureRate: 0
};

export const BURST_SCENARIO: ScenarioState = {
  mode: 'BURST',
  tickInterval: 20, // 50 ticks per second
  burstMultiplier: 10, // 10x events per tick
  failureRate: 0
};

export const FAILURE_SCENARIO: ScenarioState = {
  mode: 'FAILURE',
  tickInterval: 100,
  burstMultiplier: 1,
  failureRate: 0.3 // 30% chance of dropping packets
};
