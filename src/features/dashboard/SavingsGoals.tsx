"use client";

import React from "react";

type Goal = { name: string; current: number; target: number; color: string };

export default function SavingsGoals({ goals }: { goals: Goal[] }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Savings Goals</h3>
      </div>
      <div className="space-y-4">
        {goals.map((goal, i) => (
          <div key={i}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {goal.name}
              </span>
              <span className="text-sm font-bold text-gray-900">
                ${goal.current.toLocaleString()} / $
                {goal.target.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(goal.current / goal.target) * 100}%`,
                  background: `linear-gradient(to right, ${goal.color}, ${goal.color})`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((goal.current / goal.target) * 100)}% complete
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
