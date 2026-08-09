/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FrameworkGroupTier } from '../utils/frameworkGroupUtils';
import { ShieldCheck, Activity, Zap } from 'lucide-react';

interface BTATierSelectorProps {
  value?: string;
  onChange: (group: FrameworkGroupTier) => void;
  compact?: boolean;
  label?: string;
  className?: string;
}

export default function BTATierSelector({
  value = 'Basic',
  onChange,
  compact = false,
  label = 'Framework Tier Group (B, T, A)',
  className = ''
}: BTATierSelectorProps) {
  const currentGroup: FrameworkGroupTier = 
    value === 'Transmission' ? 'Transmission' :
    value === 'Advance' ? 'Advance' : 'Basic';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 ${className}`}>
        <button
          type="button"
          onClick={() => onChange('Basic')}
          title="Basic Framework Tier Group [B]"
          className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
            currentGroup === 'Basic'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-800 hover:bg-emerald-200/60'
          }`}
        >
          <span className="font-mono bg-emerald-950/20 px-1 py-0.2 rounded text-[9px]">B</span>
          Basic
        </button>

        <button
          type="button"
          onClick={() => onChange('Transmission')}
          title="Transmission Framework Tier Group [T]"
          className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
            currentGroup === 'Transmission'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-800 hover:bg-blue-200/60'
          }`}
        >
          <span className="font-mono bg-blue-950/20 px-1 py-0.2 rounded text-[9px]">T</span>
          Transmission
        </button>

        <button
          type="button"
          onClick={() => onChange('Advance')}
          title="Advance Framework Tier Group [A]"
          className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
            currentGroup === 'Advance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-800 hover:bg-purple-200/60'
          }`}
        >
          <span className="font-mono bg-purple-950/20 px-1 py-0.2 rounded text-[9px]">A</span>
          Advance
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            BTA Shortcuts: <strong className="text-emerald-700">[B]</strong> Basic | <strong className="text-blue-700">[T]</strong> Transmission | <strong className="text-purple-700">[A]</strong> Advance
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange('Basic')}
          title="Basic Group: Applicable for Basic, Transmission, and Advance"
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
            currentGroup === 'Basic'
              ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/20 text-[10px] font-mono">B</span>
          <ShieldCheck className="w-3.5 h-3.5" />
          Basic Group
          <span className="text-[9px] opacity-80 font-normal ml-0.5">(Applies B, T, A)</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('Transmission')}
          title="Transmission Group: Applicable for Transmission & Advance (Excludes Basic)"
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
            currentGroup === 'Transmission'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <span className="px-1.5 py-0.5 rounded bg-blue-950/20 text-[10px] font-mono">T</span>
          <Activity className="w-3.5 h-3.5" />
          Transmission Group
          <span className="text-[9px] opacity-80 font-normal ml-0.5">(Applies T, A)</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('Advance')}
          title="Advance Group: Applicable for Advance Only (Excludes Basic & Transmission)"
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
            currentGroup === 'Advance'
              ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-500/20'
              : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
          }`}
        >
          <span className="px-1.5 py-0.5 rounded bg-purple-950/20 text-[10px] font-mono">A</span>
          <Zap className="w-3.5 h-3.5" />
          Advance Group
          <span className="text-[9px] opacity-80 font-normal ml-0.5">(Applies A Only)</span>
        </button>
      </div>
    </div>
  );
}
