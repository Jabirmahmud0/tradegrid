import React from 'react';

interface DataTableFallbackProps {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export const DataTableFallback: React.FC<DataTableFallbackProps> = ({ title, headers, rows }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-50 focus-within:bg-[#0d1117] focus-within:p-4 focus-within:shadow-xl focus-within:w-full focus-within:h-full focus-within:overflow-auto focus-within:border focus-within:border-[#263344] focus-within:rounded-md">
      <h3 className="text-lg font-bold text-gray-200 mb-2">{title} Table View</h3>
      <table aria-label={title} className="w-full text-left border-collapse text-sm text-gray-300">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border-b border-[#263344] p-2 bg-[#131920]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} tabIndex={0} className="focus:bg-[#1a2330] focus:outline-none focus:ring-2 focus:ring-[#00d4ff] hover:bg-[#1a2330]">
              {r.map((cell, j) => (
                <td key={j} className="border-b border-[#1e2b38] p-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
