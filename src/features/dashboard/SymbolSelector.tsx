import React from 'react';
import { cn } from '../../utils';

interface SymbolSelectorProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  className?: string;
}

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD'];

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({ activeSymbol, onSelect, className }) => {
  return (
    <div className={cn("flex items-center gap-1 bg-zinc-900/50 p-1 rounded-sm border border-zinc-800", className)}>
      {SYMBOLS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={cn(
            "px-2 py-1 text-[10px] font-bold tracking-tight rounded-sm transition-all uppercase",
            activeSymbol === s 
              ? "bg-zinc-100 text-zinc-950 shadow-sm" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
};
