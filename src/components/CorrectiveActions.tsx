/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CorrectiveAction } from '../types';
import { Plus, Search, Calendar, CheckSquare, ShieldCheck, Clock, User, AlertCircle } from 'lucide-react';

interface CorrectiveActionsProps {
  actions: CorrectiveAction[];
  onAddAction: (action: CorrectiveAction) => void;
  activeClientId: string;
}

export default function CorrectiveActions({
  actions,
  onAddAction,
  activeClientId
}: CorrectiveActionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [sourceType, setSourceType] = useState<'AUDIT_FINDING' | 'INCIDENT' | 'RISK_REVIEW' | 'OTHER'>('AUDIT_FINDING');
  const [sourceRef, setSourceRef] = useState('');
  const [finding, setFinding] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [responsible, setResponsible] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const clientActions = actions.filter(a => a.client_id === activeClientId);

  const filteredActions = clientActions.filter(a =>
    a.finding.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.source_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.responsible_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRef || !finding || !actionPlan) return;

    let nextIdNum = actions.length + 1;
    while (actions.some(a => a.id === 'ca' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'ca' + nextIdNum;

    const newAction: CorrectiveAction = {
      id: newId,
      client_id: activeClientId,
      source_type: sourceType,
      source_reference: sourceRef,
      finding,
      root_cause: rootCause,
      action_plan: actionPlan,
      responsible_person: responsible || 'Quality Manager',
      target_date: targetDate || '2026-12-31',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    onAddAction(newAction);
    setSourceRef('');
    setFinding('');
    setRootCause('');
    setActionPlan('');
    setResponsible('');
    setTargetDate('');
    setIsAdding(false);
  };

  return (
    <div id="corrective-actions-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Corrective & Preventive Actions (CAPA)</h1>
          <p className="text-xs text-slate-500 mt-1">Implement strict, documented corrective workflows mapped back to incident registers or specific audit plans.</p>
        </div>
        {!isAdding && (
          <button
            id="btn-add-capa"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue CAPA Request
          </button>
        )}
      </div>

      {/* Add CAPA Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Issue Formal Corrective & Preventive Action Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Issue Source Type</label>
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-bold"
              >
                <option value="AUDIT_FINDING">AUDIT FINDING (NCR)</option>
                <option value="INCIDENT">SYSTEM INCIDENT LOG</option>
                <option value="RISK_REVIEW">PROACTIVE RISK MITIGATION</option>
                <option value="OTHER">OTHER GENERAL GAP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Source Index Reference *</label>
              <input
                type="text"
                value={sourceRef}
                onChange={e => setSourceRef(e.target.value)}
                placeholder="e.g. FND-CCAD-01 or INC-2026-001"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Remediation Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Observation / Non-Compliance Finding *</label>
              <textarea
                value={finding}
                onChange={e => setFinding(e.target.value)}
                placeholder="Describe exact system gap, missing credential, or clinical deficiency"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none h-20"
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Root Cause Analysis (RCA)</label>
              <input
                type="text"
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="What foundational structural weakness allowed this event?"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remediation & Action Plan *</label>
              <input
                type="text"
                value={actionPlan}
                onChange={e => setActionPlan(e.target.value)}
                placeholder="Exact actions required to resolve and prevent reoccurrence"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Responsible Compliance Officer / Lead</label>
              <input
                type="text"
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                placeholder="Sarah Jenkins (Lead)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
            >
              Launch CAPA Workflow
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm max-w-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search finding details, reference indexes..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* CAPA Cards list */}
      <div className="space-y-4">
        {filteredActions.length > 0 ? (
          filteredActions.map(action => {
            const hasOverdue = action.status !== 'COMPLETED' && new Date(action.target_date) < new Date();
            let statusColor = 'bg-slate-50 text-slate-700';
            if (action.status === 'COMPLETED') statusColor = 'bg-emerald-50 text-emerald-700';
            if (action.status === 'IN_PROGRESS') statusColor = 'bg-blue-50 text-blue-700';
            if (hasOverdue) statusColor = 'bg-rose-100 text-rose-800 animate-pulse border border-rose-200 font-bold';

            return (
              <div key={action.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-slate-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded">
                      {action.source_type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">REF: {action.source_reference}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${statusColor}`}>
                      {hasOverdue ? 'Remediation Overdue' : action.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="md:col-span-1 space-y-1">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Deficiency Observed</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{action.finding}</p>
                  </div>
                  <div className="md:col-span-1 space-y-1 md:border-l border-slate-100 md:pl-6">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">RCA Found</span>
                    <p className="text-slate-600 leading-relaxed italic">"{action.root_cause || 'Awaiting comprehensive engineering diagnostics.'}"</p>
                  </div>
                  <div className="md:col-span-1 space-y-1 md:border-l border-slate-100 md:pl-6">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Assigned Corrective Action Plan</span>
                    <p className="text-slate-900 font-semibold leading-relaxed">{action.action_plan}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lead: <strong>{action.responsible_person}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Date: <strong className={hasOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>{action.target_date}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-10 rounded-xl border border-slate-100 text-center text-slate-400 text-xs">
            No corrective actions launched for this client context. Click "Issue CAPA Request" to start.
          </div>
        )}
      </div>
    </div>
  );
}
