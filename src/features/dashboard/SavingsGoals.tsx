"use client";

import React from "react";

type Goal = { name: string; current: number; target: number; color: string };

export default function SavingsGoals({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
      <h3 className="font-display text-base font-bold text-text-primary mb-4">Savings Goals</h3>
      <div className="space-y-4">
        {goals.map((goal, i) => (
          <div key={i}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">
                {goal.name}
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-text-primary">
                ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(goal.current / goal.target) * 100}%`,
                  background: `linear-gradient(to right, ${goal.color}, ${goal.color})`,
                }}
              />
            </div>
            <p className="text-xs text-text-muted font-mono mt-1">
              {Math.round((goal.current / goal.target) * 100)}% complete
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
