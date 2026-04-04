import React from 'react';

interface ChartAriaOverlayProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const ChartAriaOverlay: React.FC<ChartAriaOverlayProps> = ({ title, description, children }) => {
  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-10" 
      width="100%" 
      height="100%" 
      role="graphics-document" 
      aria-label={title}
    >
      <desc>{description}</desc>
      <g role="group" className="pointer-events-auto">
        {children}
      </g>
    </svg>
  );
};
