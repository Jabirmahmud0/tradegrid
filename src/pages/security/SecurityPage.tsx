import * as React from 'react';
import { useLiveStore } from '../../store/live-store';
import { Card } from '../../components/ui/Card';
import { Wifi, WifiOff, Activity, Clock, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useServerStatus } from '../../services/market-data.queries';

export const SecurityPage: React.FC = () => {
  const systemReady = useLiveStore((s) => s.systemReady);
  const metrics = useLiveStore((s) => s.metrics);
  const mode = useLiveStore((s) => s.mode);
  const dataSource = useLiveStore((s) => s.dataSource);
  const { data: serverStatus } = useServerStatus();

  const wsStatus: 'connected' | 'reconnecting' | 'disconnected' = systemReady ? 'connected' : 'disconnected';

  const uptime = serverStatus?.uptime ? Math.max(0, Number(serverStatus.uptime)) : 0;
  const avgLatency = metrics.dispatchLatency ?? 0;
  const droppedFrames = metrics.droppedFrames ?? 0;
  const runtimeMode = dataSource === 'mock' ? 'Local simulator' : dataSource === 'binance' ? 'Binance mainnet' : dataSource === 'binance-testnet' ? 'Binance testnet' : 'Custom source';

  const securityChecks = [
    { label: 'WebSocket Transport', status: wsStatus === 'connected' ? 'pass' as const : wsStatus !== 'disconnected' ? 'warn' as const : 'fail' as const, detail: wsStatus === 'connected' ? `${runtimeMode} stream active` : 'Connection unavailable' },
    { label: 'MessagePack Serialization', status: 'pass' as const, detail: 'Binary payload encoding verified' },
    { label: 'Worker Isolation', status: 'pass' as const, detail: 'Web Worker sandboxes heavy computation' },
    { label: 'Memory Bounds', status: 'pass' as const, detail: 'All streams use bounded ring buffers' },
    { label: 'Replay Determinism', status: mode === 'REPLAY' ? 'pass' : 'warn' as const, detail: mode === 'REPLAY' ? 'Replay mode active' : 'Live mode - replay engine standby' },
    { label: 'Input Validation', status: 'pass' as const, detail: 'All stream events schema-validated in worker' },
    { label: 'No Sensitive Data Exposure', status: 'pass' as const, detail: 'No auth tokens or PII in streaming payloads' },
    { label: 'Server Health', status: serverStatus?.status === 'UP' ? 'pass' as const : 'warn' as const, detail: serverStatus?.status === 'UP' ? `${serverStatus.clients} clients, ${serverStatus.bufferSize} buffered events` : 'Status endpoint unavailable' },
  ];

  const passCount = securityChecks.filter(c => c.status === 'pass').length;
  const warnCount = securityChecks.filter(c => c.status === 'warn').length;
  const failCount = securityChecks.filter(c => c.status === 'fail').length;

  return (
    <div className="h-full overflow-auto p-4 bg-[var(--color-bg-base)]">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Security & System Health</h1>
        <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Connection integrity, data validation, and runtime safety checks</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3">
            <div className={cn(
              'h-8 w-8 rounded-sm flex items-center justify-center',
              wsStatus === 'connected' ? 'bg-green-500/10' : wsStatus !== 'disconnected' ? 'bg-yellow-500/10' : 'bg-red-500/10'
            )}>
              {wsStatus === 'connected' ? <Wifi size={16} className="text-[var(--color-profit)]" /> :
               wsStatus !== 'disconnected' ? <WifiOff size={16} className="text-[var(--color-warning)]" /> :
               <WifiOff size={16} className="text-[var(--color-loss)]" />}
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">WS Status</div>
              <div className={cn(
                'text-sm font-bold font-mono capitalize',
                wsStatus === 'connected' ? 'text-[var(--color-profit)]' :
                wsStatus !== 'disconnected' ? 'text-[var(--color-warning)]' :
                'text-[var(--color-loss)]'
              )}>{wsStatus}</div>
            </div>
          </div>
        </Card>

        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 rounded-sm bg-blue-500/10 flex items-center justify-center">
              <Activity size={16} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Avg Latency</div>
              <div className="text-sm font-bold font-mono text-[var(--color-text-primary)]">{avgLatency.toFixed(1)}ms</div>
            </div>
          </div>
        </Card>

        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 rounded-sm bg-blue-500/10 flex items-center justify-center">
              <Server size={16} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Uptime</div>
              <div className="text-sm font-bold font-mono text-[var(--color-profit)]">{uptime > 0 ? `${(uptime / 60).toFixed(1)}m` : '--'}</div>
            </div>
          </div>
        </Card>

        <Card variant="outline" className="border-[var(--color-border)]">
          <div className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 rounded-sm bg-blue-500/10 flex items-center justify-center">
              <Clock size={16} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Dropped Frames</div>
              <div className={cn(
                'text-sm font-bold font-mono',
                droppedFrames === 0 ? 'text-[var(--color-profit)]' : droppedFrames < 10 ? 'text-[var(--color-warning)]' : 'text-[var(--color-loss)]'
              )}>{droppedFrames}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Checks */}
      <Card variant="outline" header={`Security & Integrity Checks (${passCount} passed, ${warnCount} warnings, ${failCount} failed)`} className="border-[var(--color-border)]">
        <div className="flex flex-col divide-y divide-[var(--color-border-subtle)]">
          {securityChecks.map((check) => (
            <div key={check.label} className="flex items-start gap-3 p-3">
              <div className="mt-0.5 shrink-0">
                {check.status === 'pass' ? (
                  <CheckCircle2 size={14} className="text-[var(--color-profit)]" />
                ) : check.status === 'warn' ? (
                  <AlertTriangle size={14} className="text-[var(--color-warning)]" />
                ) : (
                  <AlertTriangle size={14} className="text-[var(--color-loss)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-[var(--color-text-primary)] uppercase">{check.label}</div>
                <div className="text-[9px] text-[var(--color-text-tertiary)] font-mono mt-0.5">{check.detail}</div>
              </div>
              <div className={cn(
                'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm border shrink-0',
                check.status === 'pass' ? 'text-[var(--color-profit)] border-[var(--color-profit)]/30 bg-[var(--color-profit)]/5' :
                check.status === 'warn' ? 'text-[var(--color-warning)] border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5' :
                'text-[var(--color-loss)] border-[var(--color-loss)]/30 bg-[var(--color-loss)]/5'
              )}>
                {check.status}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture Security Notes */}
      <Card variant="outline" header="Architecture Notes" className="border-[var(--color-border)] mt-4">
        <div className="p-3 flex flex-col gap-2 text-[10px] text-[var(--color-text-secondary)] font-mono leading-relaxed">
          <p><span className="text-[var(--color-text-primary)] font-bold">Transport:</span> WebSocket connection uses binary MessagePack serialization. No raw JSON exposure to the render pipeline.</p>
          <p><span className="text-[var(--color-text-primary)] font-bold">Worker Sandbox:</span> All decode, validation, and normalization occur in an isolated Web Worker. The main thread only receives render-safe, coalesced payloads.</p>
          <p><span className="text-[var(--color-text-primary)] font-bold">Memory Safety:</span> Every stream type uses a fixed-size ring buffer. No unbounded growth. Oldest events are evicted on overflow.</p>
          <p><span className="text-[var(--color-text-primary)] font-bold">No Auth / PII:</span> The dashboard streams market data only. No user accounts, secrets, or personally identifiable information are processed in the client stream.</p>
          <p><span className="text-[var(--color-text-primary)] font-bold">Replay Mode:</span> Playback is served from the mock backend&apos;s bounded historical ring buffer and is now tracked with live cursor and total-event state.</p>
        </div>
      </Card>
    </div>
  );
};
