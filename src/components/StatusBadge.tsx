import React from 'react';

interface StatusBadgeProps {
  status: 'queued' | 'printing' | 'ready' | 'completed';
}

const statusConfig = {
  queued: { label: 'Queued', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  printing: { label: 'Printing', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${status === 'ready' ? 'animate-pulse-glow' : ''}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
