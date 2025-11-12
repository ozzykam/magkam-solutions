'use client';

import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number;
  className?: string;
}

export default function CharacterCounter({
  current,
  max,
  warningThreshold = 0.9, // 90% of max
  className = '',
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = current >= max * warningThreshold;
  const isError = current > max;

  // Determine color
  let colorClass = 'text-gray-500';
  if (isError) {
    colorClass = 'text-red-600 font-medium';
  } else if (isWarning) {
    colorClass = 'text-yellow-600 font-medium';
  } else if (percentage > 50) {
    colorClass = 'text-green-600';
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Character Count */}
      <span className={`text-sm ${colorClass}`}>
        {current} / {max}
      </span>

      {/* Progress Bar */}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isError
              ? 'bg-red-600'
              : isWarning
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      {isError && (
        <span className="text-xs text-red-600">
          {current - max} over limit
        </span>
      )}
      {isWarning && !isError && (
        <span className="text-xs text-yellow-600">
          {max - current} remaining
        </span>
      )}
    </div>
  );
}
