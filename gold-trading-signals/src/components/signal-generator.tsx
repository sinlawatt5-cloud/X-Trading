'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SignalGeneratorProps {
  onSignalGenerated: () => void;
  className?: string;
}

export function SignalGenerator({ onSignalGenerated, className = '' }: SignalGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate signal: ${response.statusText}`);
      }

      const signal = await response.json();

      toast.success('Signal Generated!', {
        description: `${signal.type} signal created for XAUUSD ${signal.timeframe}`,
      });

      onSignalGenerated();
    } catch (error) {
      console.error('Failed to generate signal:', error);
      toast.error('Generation Failed', {
        description: error instanceof Error ? error.message : 'Failed to generate signal',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn('clay-card p-6', className)}>
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto mb-3 h-16 w-16 rounded-full gold-gradient flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-cream-dark dark:text-cream mb-2">
            Generate New Signal
          </h3>
          <p className="font-handwritten text-sm text-muted-foreground mb-4">
            Run AI analysis to generate a new gold trading signal
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            'clay-btn px-6 py-3 font-handwritten text-sm font-semibold transition-all',
            isGenerating
              ? 'cursor-not-allowed opacity-70'
              : 'hover:shadow-lg hover:brightness-110 active:scale-95',
            'text-cream-dark dark:text-cream'
          )}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Generate Signal
            </span>
          )}
        </button>

        <div className="mt-4">
          <p className="font-handwritten text-xs text-muted-foreground">
            Analysis includes SMC, Wyckoff & Multi-Timeframe methods
          </p>
        </div>
      </div>
    </div>
  );
}