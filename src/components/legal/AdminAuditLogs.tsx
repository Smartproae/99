import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  FileText, 
  Clock, 
  CheckCircle, 
  CloudLightning,
  History
} from 'lucide-react';
import { ComplianceAuditLog, RevisionHistoryLog } from '../../utils/legalData';

interface AdminAuditLogsProps {
  auditLogs: ComplianceAuditLog[];
  revisionLogs: RevisionHistoryLog[];
  onClearAuditLogs: () => void;
  currentUserRole: string;
}

export default function AdminAuditLogs({ 
  auditLogs, 
  revisionLogs, 
  onClearAuditLogs, 
  currentUserRole 
}: AdminAuditLogsProps) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const isReadOnly = currentUserRole === 'READ_ONLY';

  // Filter audit logs
  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = 
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.refNo && log.refNo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Action colors helpers
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
      case 'UPLOAD':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'SYNC':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse';
      case 'EMAIL':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'EXPORT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="administration-audit-trail-module" className="grid grid-cols-1 lg:grid-cols-3 gap-5 font-sans text-xs text-slate-700">
      
      {/* 1. Revision History Summary Feed (Module 7 List) */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 7</span>
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1">
            <History className="w-4 h-4 text-indigo-600" /> Version Control Logs
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            Historical document revision changes published by auditors.
          </p>
        </div>

        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
          {revisionLogs.length === 0 ? (
            <p className="text-slate-400 italic text-center py-6">No revisions logged.</p>
          ) : (
            revisionLogs.map((log, idx) => (
              <div key={`${log.id || 'rev'}-${idx}`} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1.5 hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                    {log.documentRef} (v{log.version})
                  </span>
                  <span className="text-slate-400 font-semibold">{log.revisionDate}</span>
                </div>
                <h4 className="font-black text-slate-900 leading-snug">{log.documentName}</h4>
                <p className="font-medium text-slate-600 leading-snug">{log.changes}</p>
                <div className="text-[8.5px] text-slate-400 font-bold flex gap-2 pt-1 border-t border-slate-100">
                  <span>Prepared: {log.preparedBy.split(' (')[0]}</span>
                  <span>Approved: {log.approvedBy.split(' (')[0]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Audit Trail Logger Table (Module 9) */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 9</span>
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-emerald-600" /> System GRC Audit Trails
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Immutable logging of compliance actions, uploads, and automated sync events.
            </p>
          </div>
          
          {/* Action to clear logs */}
          {!isReadOnly && (
            <button
              onClick={() => {
                if(confirm('Are you sure you want to purge all local audit logs? This is irreversible.')){
                  onClearAuditLogs();
                }
              }}
              className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg cursor-pointer border border-rose-200 transition-colors"
            >
              Clear Audit Trails
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
          <div className="relative">
            <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50"
              placeholder="Search user, details, or standard ref..."
            />
          </div>
          
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-2 border border-slate-200 bg-white rounded-lg cursor-pointer"
          >
            <option value="ALL">All Action Classes</option>
            <option value="CREATE">CREATE (Manual Registers)</option>
            <option value="UPDATE">UPDATE (Edits)</option>
            <option value="DELETE">DELETE (Removals)</option>
            <option value="UPLOAD">UPLOAD (Attachments)</option>
            <option value="SYNC">SYNC (Live Auto Sync)</option>
            <option value="EMAIL">EMAIL (SMTP Sends)</option>
            <option value="EXPORT">EXPORT (PDF/Excel Compilation)</option>
          </select>
        </div>

        {/* Audit list view */}
        <div className="overflow-hidden rounded-xl border border-slate-100 shadow-inner max-h-[55vh] overflow-y-auto">
          <table className="w-full border-collapse text-left text-[11px] text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-[9.5px] text-slate-400 uppercase tracking-widest">
                <th className="p-3">Activity</th>
                <th className="p-3">Actor / role</th>
                <th className="p-3">Module class</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-slate-400 italic">
                    No matching GRC audit logs registered.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((log, idx) => (
                  <tr key={`${log.id || 'cal'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    {/* Activity */}
                    <td className="p-3">
                      <span className={`border px-2 py-0.5 rounded font-black ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-[8.5px] text-slate-400 block font-semibold mt-1">
                        {log.timestamp.replace('T', ' ').substring(11, 19)}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="p-3 align-top font-bold text-slate-800">
                      {log.performedBy}
                      <span className="text-[8px] text-slate-400 font-extrabold block mt-0.5">{log.role}</span>
                    </td>

                    {/* Module */}
                    <td className="p-3 align-top font-bold text-slate-500">
                      {log.module}
                      {log.refNo && log.refNo !== 'ALL' && (
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8.5px] block font-black mt-1 w-max">
                          {log.refNo}
                        </span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="p-3 align-top leading-relaxed text-slate-600 font-semibold max-w-sm">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
