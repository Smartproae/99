/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Audit, AuditFinding } from '../types';
import { Search, Plus, Calendar, FileCheck, Shield, ClipboardList, CheckCircle2, AlertOctagon, BarChart3, ListFilter } from 'lucide-react';
import AuditOverview from './AuditOverview';

interface AuditManagementProps {
  audits: Audit[];
  findings: AuditFinding[];
  onAddAudit: (audit: Audit) => void;
  onAddFinding: (finding: AuditFinding) => void;
  activeClientId: string;
}

export default function AuditManagement({
  audits,
  findings,
  onAddAudit,
  onAddFinding,
  activeClientId
}: AuditManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'overview'>('plans');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isAddingFinding, setIsAddingFinding] = useState(false);

  // Audit Form States
  const [auditNumber, setAuditNumber] = useState('');
  const [auditType, setAuditType] = useState<'INTERNAL' | 'EXTERNAL' | 'REGULATORY'>('INTERNAL');
  const [scope, setScope] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [auditDate, setAuditDate] = useState('');
  const [status, setStatus] = useState<'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'>('PLANNED');

  // Finding Form States
  const [findingNo, setFindingNo] = useState('');
  const [findingDesc, setFindingDesc] = useState('');
  const [findingType, setFindingType] = useState<'NC_MAJOR' | 'NC_MINOR' | 'OFI'>('NC_MINOR');
  const [severity, setSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [recommendation, setRecommendation] = useState('');

  const clientAudits = audits.filter(a => a.client_id === activeClientId);

  const filteredAudits = clientAudits.filter(a =>
    a.audit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.auditor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.audit_scope.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditNumber || !auditorName) return;

    let nextIdNum = audits.length + 1;
    while (audits.some(a => a.id === 'au' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'au' + nextIdNum;

    const newAudit: Audit = {
      id: newId,
      client_id: activeClientId,
      audit_number: auditNumber,
      audit_type: auditType,
      audit_scope: scope,
      auditor_name: auditorName,
      audit_date: auditDate || '2026-12-31',
      status,
      created_at: new Date().toISOString()
    };

    onAddAudit(newAudit);
    setAuditNumber('');
    setAuditorName('');
    setScope('');
    setAuditDate('');
    setIsAdding(false);
  };

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditId || !findingNo || !findingDesc) return;

    let nextIdNum = findings.length + 1;
    while (findings.some(f => f.id === 'f' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'f' + nextIdNum;

    const newFinding: AuditFinding = {
      id: newId,
      audit_id: selectedAuditId,
      finding_no: findingNo,
      finding_description: findingDesc,
      finding_type: findingType,
      severity,
      recommendation,
      status: 'OPEN'
    };

    onAddFinding(newFinding);
    setFindingNo('');
    setFindingDesc('');
    setRecommendation('');
    setIsAddingFinding(false);
  };

  return (
    <div id="audit-management-view" className="space-y-6">
      {/* Sub-Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit Management & Non-Conformance Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Design external audit inspections, track non-conformance trends over time, and resolve compliance gaps.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'plans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Audit Plans & Findings
            </button>
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'overview' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              Audit Overview Dashboard
            </button>
          </div>

          {activeSubTab === 'plans' && !isAdding && (
            <button
              id="btn-add-audit"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Audit Plan
            </button>
          )}
        </div>
      </div>

      {/* Overview View */}
      {activeSubTab === 'overview' && (
        <AuditOverview
          audits={audits}
          findings={findings}
          activeClientId={activeClientId}
        />
      )}

      {/* Plans & Findings View */}
      {activeSubTab === 'plans' && (
        <>
          {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold font-sans">Total Scheduled Audits</span>
            <h4 className="text-lg font-bold text-slate-900">{clientAudits.length}</h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold font-sans">Critical Findings</span>
            <h4 className="text-lg font-bold text-slate-900">
              {findings.filter(f => audits.find(a => a.id === f.audit_id && a.client_id === activeClientId) && f.status === 'OPEN').length} Active NCs
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compliance Framework Standards</span>
          <span className="text-xs font-semibold leading-tight text-slate-200 mt-2">ISO 27001 Internal & DOH Regulatory Inspections</span>
        </div>
      </div>

      {/* Add Audit Form */}
      {isAdding && (
        <form onSubmit={handleCreateAudit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Schedule Regulatory or Quality Audit Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Plan Number *</label>
              <input
                type="text"
                value={auditNumber}
                onChange={e => setAuditNumber(e.target.value)}
                placeholder="e.g. AUD-ISO-2026"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Type</label>
              <select
                value={auditType}
                onChange={e => setAuditType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-semibold text-slate-700"
              >
                <option value="INTERNAL">INTERNAL (Self-Assessment)</option>
                <option value="EXTERNAL">EXTERNAL (Third-Party Audit)</option>
                <option value="REGULATORY">REGULATORY (DOH / DHA)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Auditor / Inspecting Body Name *</label>
              <input
                type="text"
                value={auditorName}
                onChange={e => setAuditorName(e.target.value)}
                placeholder="e.g. TUV Middle East"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Scope of Compliance Inspection</label>
              <input
                type="text"
                value={scope}
                onChange={e => setScope(e.target.value)}
                placeholder="Scope, departments involved, networks"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Schedule Date</label>
              <input
                type="date"
                value={auditDate}
                onChange={e => setAuditDate(e.target.value)}
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
              Commit Audit Plan
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Audit List & Detailed Findings side-panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Audits List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search scheduled audit numbers..."
              className="w-full text-xs focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-3 font-semibold text-slate-600">Audit Number</th>
                  <th className="p-3 font-semibold text-slate-600">Type</th>
                  <th className="p-3 font-semibold text-slate-600">Auditor</th>
                  <th className="p-3 font-semibold text-slate-600">Audit Date</th>
                  <th className="p-3 font-semibold text-slate-600">Status</th>
                  <th className="p-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length > 0 ? (
                  filteredAudits.map(aud => {
                    const isSelected = aud.id === selectedAuditId;
                    const count = findings.filter(f => f.audit_id === aud.id).length;

                    return (
                      <tr
                        key={aud.id}
                        onClick={() => setSelectedAuditId(aud.id)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="p-3 font-mono text-slate-900 font-bold">{aud.audit_number}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                            aud.audit_type === 'REGULATORY'
                              ? 'bg-purple-100 text-purple-800'
                              : aud.audit_type === 'EXTERNAL'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {aud.audit_type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{aud.auditor_name}</td>
                        <td className="p-3 text-slate-600 font-mono">{aud.audit_date}</td>
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            aud.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : aud.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {aud.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {count} Findings
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No matching audit plans on record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Interactive Findings Viewer */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              {selectedAuditId
                ? `Findings for ${audits.find(a => a.id === selectedAuditId)?.audit_number}`
                : 'Select Audit Plan to View Non-Compliances'}
            </h3>
            {selectedAuditId && !isAddingFinding && (
              <button
                onClick={() => setIsAddingFinding(true)}
                className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Finding
              </button>
            )}
          </div>

          {selectedAuditId ? (
            <div className="space-y-4">
              {isAddingFinding && (
                <form onSubmit={handleCreateFinding} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-xs font-bold text-slate-700">Add Audit Finding</span>
                    <button type="button" onClick={() => setIsAddingFinding(false)} className="text-[10px] text-slate-400">Cancel</button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Finding Code *</label>
                      <input
                        type="text"
                        value={findingNo}
                        onChange={e => setFindingNo(e.target.value)}
                        placeholder="e.g. FND-SEC-03"
                        className="w-full p-2 rounded border border-slate-200 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Description / Issue *</label>
                      <textarea
                        value={findingDesc}
                        onChange={e => setFindingDesc(e.target.value)}
                        placeholder="Write exact observation..."
                        className="w-full p-2 rounded border border-slate-200 text-xs h-16"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Finding Type</label>
                        <select
                          value={findingType}
                          onChange={e => setFindingType(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 bg-white"
                        >
                          <option value="NC_MAJOR">NC Major (Critical Breach)</option>
                          <option value="NC_MINOR">NC Minor (Gap)</option>
                          <option value="OFI">Opportunity for Improvement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Severity</label>
                        <select
                          value={severity}
                          onChange={e => setSeverity(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 bg-white"
                        >
                          <option value="HIGH">🔴 High</option>
                          <option value="MEDIUM">🟡 Medium</option>
                          <option value="LOW">🟢 Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Recommendation</label>
                      <input
                        type="text"
                        value={recommendation}
                        onChange={e => setRecommendation(e.target.value)}
                        placeholder="Preventive suggestion..."
                        className="w-full p-2 rounded border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-xs cursor-pointer">
                    Save Non-Compliance
                  </button>
                </form>
              )}

              {/* Findings list matching this audit */}
              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {findings.filter(f => f.audit_id === selectedAuditId).length > 0 ? (
                  findings.filter(f => f.audit_id === selectedAuditId).map(fnd => (
                    <div key={fnd.id} className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{fnd.finding_no}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          fnd.finding_type === 'NC_MAJOR'
                            ? 'bg-rose-100 text-rose-800'
                            : fnd.finding_type === 'NC_MINOR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {fnd.finding_type === 'NC_MAJOR' ? 'NC Major' : fnd.finding_type === 'NC_MINOR' ? 'NC Minor' : 'OFI'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium leading-normal">{fnd.finding_description}</p>
                      {fnd.recommendation && (
                        <div className="text-[11px] text-emerald-950 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                          <strong>💡 Recommend:</strong> {fnd.recommendation}
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className={`font-bold px-2 py-0.5 rounded ${fnd.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          Status: {fnd.status}
                        </span>
                        <span className="text-slate-400">Severity: <strong className="text-slate-600">{fnd.severity}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No compliance findings or NCRs recorded for this plan context.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Click on an active row in the Audit table to view specific compliance findings and details.
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
