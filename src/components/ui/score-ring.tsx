"use client";

import { type ClassValue, clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ScoreRingProps extends HTMLAttributes<HTMLDivElement> {
  score: number;
  maxScore?: number;
  size?: number;
}

export const ScoreRing = forwardRef<HTMLDivElement, ScoreRingProps>(
  ({ className, score, maxScore = 100, size = 180, ...props }, ref) => {
    const percentage = (score / maxScore) * 100;
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          className,
        )}
        ref={ref}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <title>
            Score: {score} out of {maxScore}
          </title>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            className="text-border-primary"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-accent-green)" />
              <stop offset="35%" stopColor="var(--color-accent-amber)" />
              <stop offset="36%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono text-text-primary">
            {score}
          </span>
          <span className="text-xs text-text-tertiary font-mono">
            / {maxScore}
          </span>
        </div>
      </div>
    );
  },
);

ScoreRing.displayName = "ScoreRing";
