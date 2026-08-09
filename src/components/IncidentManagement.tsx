/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Incident } from '../types';
import { Search, Plus, ShieldAlert, CheckCircle, Clock, HeartHandshake, AlertTriangle, Link2 } from 'lucide-react';

interface IncidentManagementProps {
  incidents: Incident[];
  onAddIncident: (incident: Incident) => void;
  activeClientId: string;
}

export default function IncidentManagement({
  incidents,
  onAddIncident,
  activeClientId
}: IncidentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [incidentTitle, setIncidentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [owner, setOwner] = useState('');
  const [rca, setRca] = useState('');
  const [capa, setCapa] = useState('');

  const clientIncidents = incidents.filter(i => i.client_id === activeClientId);

  const filteredIncidents = clientIncidents.filter(i =>
    i.incident_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.incident_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle || !description) return;

    let nextIdNum = incidents.length + 1;
    while (incidents.some(i => i.id === 'i' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'i' + nextIdNum;

    const newInc: Incident = {
      id: newId,
      client_id: activeClientId,
      incident_no: 'INC-2026-00' + (clientIncidents.length + 3),
      incident_title: incidentTitle,
      description,
      severity,
      root_cause: rca || undefined,
      corrective_action: capa || undefined,
      incident_owner: owner || 'Duty Compliance Officer',
      reported_date: new Date().toISOString().split('T')[0],
      closure_status: 'OPEN',
      created_at: new Date().toISOString()
    };

    onAddIncident(newInc);
    setIncidentTitle('');
    setDescription('');
    setSeverity('MEDIUM');
    setOwner('');
    setRca('');
    setCapa('');
    setIsAdding(false);
  };

  return (
    <div id="incident-management-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incident & Clinical Breach Register</h1>
          <p className="text-xs text-slate-500 mt-1">Report, triage, and execute Root Cause Analysis (RCA) on clinical system outages or data privacy gaps.</p>
        </div>
        {!isAdding && (
          <button
            id="btn-add-incident"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        )}
      </div>

      {/* Incident Quick Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Critical Outages</span>
            <h4 className="text-lg font-bold text-slate-900">
              {clientIncidents.filter(i => i.severity === 'CRITICAL' && i.closure_status !== 'CLOSED').length}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Investigating</span>
            <h4 className="text-lg font-bold text-slate-900">
              {clientIncidents.filter(i => i.closure_status === 'INVESTIGATING').length}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Resolved Logs</span>
            <h4 className="text-lg font-bold text-slate-900">
              {clientIncidents.filter(i => i.closure_status === 'CLOSED').length}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
          <span className="text-[10px] font-bold uppercase text-emerald-900">RCA Action Rule</span>
          <p className="text-[11px] text-emerald-800 mt-1">Any CRITICAL/HIGH severity incident automatically triggers a mandatory CAPA report within 48 hours.</p>
        </div>
      </div>

      {/* Add Incident Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Report Compliance Event or System Breach</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Incident Title / Brief Summary *</label>
              <input
                type="text"
                value={incidentTitle}
                onChange={e => setIncidentTitle(e.target.value)}
                placeholder="e.g. Patient data payload failure on NABIDH connector"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Incident Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-bold"
              >
                <option value="CRITICAL">🔴 CRITICAL</option>
                <option value="HIGH">🟠 HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🟢 LOW</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Incident Description & Immediate Impact *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide detailed logs, timing, and departments affected"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none h-24"
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Root Cause Analysis (RCA) - Preliminary</label>
              <input
                type="text"
                value={rca}
                onChange={e => setRca(e.target.value)}
                placeholder="What trigger mechanism allowed the breach?"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Immediate Corrective Actions taken (CAPA link)</label>
              <input
                type="text"
                value={capa}
                onChange={e => setCapa(e.target.value)}
                placeholder="Actions taken to halt spread or isolate nodes"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Incident Reporter / Lead</label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="e.g. Dr. Johnathan Carter"
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
              Log Incident
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
          placeholder="Search incident number, severity, description..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map(inc => {
            let severityStyle = 'bg-slate-50 text-slate-700';
            if (inc.severity === 'CRITICAL') severityStyle = 'bg-rose-100 text-rose-900 font-bold border border-rose-200';
            if (inc.severity === 'HIGH') severityStyle = 'bg-orange-50 text-orange-800 border border-orange-100';
            if (inc.severity === 'MEDIUM') severityStyle = 'bg-amber-50 text-amber-800 border border-amber-100';

            return (
              <div key={inc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{inc.incident_no}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${severityStyle}`}>
                      {inc.severity} Severity
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{inc.incident_title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                    inc.closure_status === 'CLOSED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : inc.closure_status === 'INVESTIGATING'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700 animate-pulse'
                  }`}>
                    {inc.closure_status === 'CLOSED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {inc.closure_status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

                {/* RCA & CAPA Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700 block">🔍 Root Cause Analysis (RCA)</span>
                    <p className="text-slate-600 italic">
                      {inc.root_cause || 'Investigation ongoing. Detailed forensic review scheduled.'}
                    </p>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                    <span className="font-semibold text-slate-700 block flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" />
                      🛡️ Connected Corrective Action (CAPA)
                    </span>
                    <p className="text-slate-600">
                      {inc.corrective_action || 'No CAPA treatment mapped yet. Associate from findings.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>Reported Date: <strong className="text-slate-700">{inc.reported_date}</strong></span>
                  <span>Lead Officer: <strong className="text-slate-700">{inc.incident_owner}</strong></span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-10 rounded-xl border border-slate-100 text-center text-slate-400 text-xs">
            No incident logs registered for this workspace context.
          </div>
        )}
      </div>
    </div>
  );
}
