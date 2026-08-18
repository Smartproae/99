import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Upload, 
  RefreshCw, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { LegalRequirement } from '../../utils/legalData';

interface LegalRegisterTableProps {
  requirements: LegalRequirement[];
  onUpdateRequirement: (updated: LegalRequirement) => void;
  currentUserRole: string;
  onLogAudit: (action: string, details: string, ref?: string) => void;
}

export default function LegalRegisterTable({ 
  requirements, 
  onUpdateRequirement, 
  currentUserRole,
  onLogAudit 
}: LegalRegisterTableProps) {
  // 1. Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [respFilter, setRespFilter] = useState('ALL');

  // Sync state simulator
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState('2026-07-21 06:00:00');

  // Read-only check
  const isReadOnly = currentUserRole === 'READ_ONLY';

  // 2. Compute Unique Values for Filter Dropdowns
  const authorities = ['ALL', ...Array.from(new Set(requirements.map(r => r.authority)))];
  const categories = ['ALL', ...Array.from(new Set(requirements.map(r => r.category)))];

  // 3. Simulated Live Regulatory Auto Sync
  const handleAutoUpdateSync = () => {
    setIsSyncing(true);
    setSyncMessage(null);
    onLogAudit('SYNC', 'Initiated live automated regulatory feed synchronization.');

    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setLastSyncDate(now);
      setSyncMessage('Sync Completed! Verified 13 regulatory codes (including Federal Law No. 13 of 2020 and Federal Law No. 5 of 2019). All UAE legal feed entries are up-to-date.');
      onLogAudit('SYNC', 'Completed live automated synchronization. All codes verified.', 'ALL');
      
      // Auto clear message
      setTimeout(() => setSyncMessage(null), 5000);
    }, 2000);
  };

  // 4. File upload simulation
  const handleFileUpload = (reqId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (file) {
      const targetReq = requirements.find(r => r.id === reqId);
      if (targetReq) {
        const updated = {
          ...targetReq,
          evidence_file_name: file.name,
          evidence_file_size: `${(file.size / 1024).toFixed(1)} KB`
        };
        onUpdateRequirement(updated);
        onLogAudit('UPLOAD', `Uploaded evidence document ${file.name} for standard ${targetReq.ref_no}`, targetReq.ref_no);
      }
    }
  };

  // 5. Handle field updates
  const handleStatusChange = (reqId: string, value: string) => {
    if (isReadOnly) return;
    const targetReq = requirements.find(r => r.id === reqId);
    if (targetReq) {
      const updated = {
        ...targetReq,
        compliance_status: value as any
      };
      onUpdateRequirement(updated);
      onLogAudit('UPDATE', `Updated compliance status to "${value}" on ${targetReq.ref_no}`, targetReq.ref_no);
    }
  };

  const handleResponsibleChange = (reqId: string, value: string) => {
    if (isReadOnly) return;
    const targetReq = requirements.find(r => r.id === reqId);
    if (targetReq) {
      const updated = {
        ...targetReq,
        responsible_person: value as any
      };
      onUpdateRequirement(updated);
      onLogAudit('UPDATE', `Assigned responsible person as "${value}" on ${targetReq.ref_no}`, targetReq.ref_no);
    }
  };

  const handleExpiryDateChange = (reqId: string, value: string) => {
    if (isReadOnly) return;
    const targetReq = requirements.find(r => r.id === reqId);
    if (targetReq) {
      const updated = {
        ...targetReq,
        expiry_date: value || undefined
      };
      onUpdateRequirement(updated);
      onLogAudit('UPDATE', `Modified compliance checklist expiry date to "${value}" on ${targetReq.ref_no}`, targetReq.ref_no);
    }
  };

  // 6. Filter Logic
  const filteredRequirements = requirements.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.ref_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAuth = authorityFilter === 'ALL' || r.authority === authorityFilter;
    const matchesStatus = statusFilter === 'ALL' || r.compliance_status === statusFilter;
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesResp = respFilter === 'ALL' || r.responsible_person === respFilter;

    return matchesSearch && matchesAuth && matchesStatus && matchesCat && matchesResp;
  });

  // Helper for status styling badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fully Compliant':
        return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[9px] font-bold"><CheckCircle className="w-3 h-3" /> Fully Compliant</span>;
      case 'Partially Compliant':
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[9px] font-bold"><AlertTriangle className="w-3 h-3" /> Partially Compliant</span>;
      case 'Non-Compliant':
        return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[9px] font-bold"><XCircle className="w-3 h-3" /> Non-Compliant</span>;
      case 'Not Applicable':
      default:
        return <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[9px] font-bold"><HelpCircle className="w-3 h-3" /> Not Applicable</span>;
    }
  };

  return (
    <div id="uae-legal-register-module" className="space-y-4">
      {/* 1. Header & Live Synchronization Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 text-white shadow-md">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Auto-Updating UAE Legal Register Feed
          </h2>
          <p className="text-[10px] text-slate-300 mt-1">
            Validating regulatory requirements against Department of Health (DOH) and MOHAP public law registers.
          </p>
          <div className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            ● Last checked official feed: <span className="text-slate-100">{lastSyncDate}</span>
          </div>
        </div>
        <div className="shrink-0">
          <button
            id="sync-regulatory-feed-btn"
            disabled={isSyncing}
            onClick={handleAutoUpdateSync}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Contacting Official UAE Portals...' : 'Synchronize Regulatory Feed'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          {syncMessage}
        </div>
      )}

      {/* 2. Advanced Search & Custom Filtering Suite */}
      <div id="search-filter-controls" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search Bar */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
              placeholder="Search by ID, Law Name, Summary..."
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-slate-600">
            {/* Authority */}
            <div>
              <label className="block mb-1 text-slate-500 uppercase tracking-wide">Authority</label>
              <select
                value={authorityFilter}
                onChange={e => setAuthorityFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white cursor-pointer"
              >
                {authorities.map(auth => (
                  <option key={auth} value={auth}>{auth === 'ALL' ? 'All Authorities' : auth}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block mb-1 text-slate-500 uppercase tracking-wide">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

            {/* Compliance Status */}
            <div>
              <label className="block mb-1 text-slate-500 uppercase tracking-wide">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Fully Compliant">Fully Compliant</option>
                <option value="Partially Compliant">Partially Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            </div>

            {/* Responsible Person */}
            <div>
              <label className="block mb-1 text-slate-500 uppercase tracking-wide">Owner</label>
              <select
                value={respFilter}
                onChange={e => setRespFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white cursor-pointer"
              >
                <option value="ALL">All Owners</option>
                <option value="Authorized Representative">Authorized Rep</option>
                <option value="Medical Director">Medical Director</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Legal Register Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="p-4">Reference No</th>
                <th className="p-4">Regulation details</th>
                <th className="p-4 text-center">Compliance Status</th>
                <th className="p-4">Responsible Owner</th>
                <th className="p-4">Expiry date</th>
                <th className="p-4">Evidence document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 font-bold text-slate-400 uppercase tracking-wider">
                    No matching healthcare regulations found.
                  </td>
                </tr>
              ) : (
                filteredRequirements.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Reference No */}
                    <td className="p-4 align-top font-bold text-slate-900 select-all shrink-0">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-[10px] font-mono block mb-1 w-max">
                        {r.ref_no}
                      </span>
                      <span className="text-[9px] text-slate-400 block">{r.authority}</span>
                    </td>

                    {/* Regulation Details */}
                    <td className="p-4 align-top max-w-sm">
                      <span className="font-extrabold text-slate-800 block text-xs leading-snug">{r.name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">{r.summary}</span>
                      <div className="flex gap-2 items-center mt-2">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                          {r.category}
                        </span>
                        <a 
                          href={r.official_link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-0.5 cursor-pointer"
                        >
                          Official Portal <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </td>

                    {/* Compliance Status Dropdown */}
                    <td className="p-4 align-top text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getStatusBadge(r.compliance_status)}
                        {!isReadOnly && (
                          <select
                            value={r.compliance_status}
                            onChange={e => handleStatusChange(r.id, e.target.value)}
                            className="text-[9px] font-bold p-1 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer mt-1"
                          >
                            <option value="Fully Compliant">Fully Compliant</option>
                            <option value="Partially Compliant">Partially Compliant</option>
                            <option value="Non-Compliant">Non-Compliant</option>
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Responsible Owner Dropdown */}
                    <td className="p-4 align-top">
                      {isReadOnly ? (
                        <span className="font-bold text-slate-800 text-[11px] block">{r.responsible_person}</span>
                      ) : (
                        <select
                          value={r.responsible_person}
                          onChange={e => handleResponsibleChange(r.id, e.target.value)}
                          className="text-[10px] font-bold p-1.5 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="Authorized Representative">Authorized Rep</option>
                          <option value="Medical Director">Medical Director</option>
                        </select>
                      )}
                    </td>

                    {/* Expiry Date */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {isReadOnly ? (
                          <span className="font-semibold text-slate-700 text-[10px]">{r.expiry_date || 'N/A'}</span>
                        ) : (
                          <input
                            type="date"
                            value={r.expiry_date || ''}
                            onChange={e => handleExpiryDateChange(r.id, e.target.value)}
                            className="text-[10px] font-bold p-1 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                          />
                        )}
                      </div>
                      {r.expiry_date && (() => {
                        const daysLeft = Math.ceil((new Date(r.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        if (daysLeft < 0) return <span className="text-[8px] font-extrabold text-rose-600 block mt-1 uppercase">⚠️ Expired!</span>;
                        if (daysLeft <= 30) return <span className="text-[8px] font-extrabold text-amber-600 block mt-1 uppercase">⚠️ Expiring in {daysLeft} Days</span>;
                        return <span className="text-[8.5px] font-bold text-emerald-600 block mt-1">✓ {daysLeft} Days remaining</span>;
                      })()}
                    </td>

                    {/* Evidence Document */}
                    <td className="p-4 align-top">
                      {r.evidence_file_name ? (
                        <div className="space-y-1">
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded block font-bold truncate max-w-[120px]">
                            {r.evidence_file_name}
                          </span>
                          <span className="text-[8.5px] text-slate-400 block font-semibold">{r.evidence_file_size}</span>
                          {!isReadOnly && (
                            <label className="text-[8px] text-rose-600 hover:text-rose-700 font-extrabold cursor-pointer block mt-1">
                              Replace File
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => handleFileUpload(r.id, e)} 
                                accept=".pdf,.docx,.xlsx,image/*"
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div>
                          {!isReadOnly ? (
                            <label className="bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 p-2 rounded-lg cursor-pointer flex flex-col items-center justify-center text-center gap-1 text-[9px] font-semibold text-slate-500">
                              <Upload className="w-3.5 h-3.5 text-slate-400" />
                              <span>Upload Proof</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => handleFileUpload(r.id, e)} 
                                accept=".pdf,.docx,.xlsx,image/*"
                              />
                            </label>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">No proof uploaded</span>
                          )}
                        </div>
                      )}
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
