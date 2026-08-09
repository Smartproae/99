import React, { useState } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Edit,
  X
} from 'lucide-react';
import { ComplianceDoc, RevisionHistoryLog } from '../../utils/legalData';

interface ComplianceDocsTableProps {
  docs: ComplianceDoc[];
  onUpdateDocs: (updated: ComplianceDoc[]) => void;
  revisionLogs: RevisionHistoryLog[];
  onAddRevisionLog: (log: RevisionHistoryLog) => void;
  currentUserRole: string;
  onLogAudit: (action: string, details: string, ref?: string) => void;
}

export default function ComplianceDocsTable({ 
  docs, 
  onUpdateDocs, 
  revisionLogs,
  onAddRevisionLog,
  currentUserRole,
  onLogAudit 
}: ComplianceDocsTableProps) {
  // 1. States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<ComplianceDoc | null>(null);

  // Add document form states
  const [newDocName, setNewDocName] = useState('');
  const [newRefNo, setNewRefNo] = useState('');
  const [newIssueDate, setNewIssueDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newResp, setNewResp] = useState<'Authorized Representative' | 'Medical Director'>('Medical Director');
  const [newVersion, setNewVersion] = useState('1.0');

  // Add Revision Log states (Module 7 modal)
  const [revisionChanges, setRevisionChanges] = useState('');
  const [revisionPrepared, setRevisionPrepared] = useState('');
  const [revisionReviewed, setRevisionReviewed] = useState('');
  const [revisionApproved, setRevisionApproved] = useState('');
  const [revisionNextDate, setRevisionNextDate] = useState('');

  // Read-only checker
  const isReadOnly = currentUserRole === 'READ_ONLY';

  // 2. Submit new license
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newDocName || !newRefNo || !newIssueDate || !newExpiryDate) {
      alert('Please fill out all required fields.');
      return;
    }

    // Determine status based on dates
    const expiry = new Date(newExpiryDate).getTime();
    const now = new Date().getTime();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 3600 * 24));
    let status: 'Valid' | 'Expired' | 'Renewal Due' = 'Valid';
    if (daysLeft < 0) status = 'Expired';
    else if (daysLeft <= 30) status = 'Renewal Due';

    const newDoc: ComplianceDoc = {
      id: `cd_${Date.now()}`,
      doc_name: newDocName,
      ref_no: newRefNo,
      issue_date: newIssueDate,
      expiry_date: newExpiryDate,
      responsible_person: newResp,
      status,
      version: newVersion,
      revision_date: newIssueDate
    };

    onUpdateDocs([newDoc, ...docs]);
    onLogAudit('CREATE', `Registered compliance document "${newDocName}" (${newRefNo})`, newRefNo);

    // Add an initial revision log automatically
    const initialRev: RevisionHistoryLog = {
      id: `rev_${Date.now()}`,
      documentRef: newRefNo,
      documentName: newDocName,
      version: newVersion,
      revisionDate: newIssueDate,
      changes: 'Initial document registry and verification logging.',
      preparedBy: 'Sarah Jenkins (Compliance Officer)',
      reviewedBy: 'Authorized Representative',
      approvedBy: 'Medical Director',
      nextReviewDate: newExpiryDate
    };
    onAddRevisionLog(initialRev);

    // Reset Form
    setNewDocName('');
    setNewRefNo('');
    setNewIssueDate('');
    setNewExpiryDate('');
    setNewVersion('1.0');
    setShowAddForm(false);
  };

  // 3. Edit document row fields
  const handleFieldChange = (id: string, key: keyof ComplianceDoc, value: any) => {
    if (isReadOnly) return;
    const updated = docs.map(d => {
      if (d.id === id) {
        // Handle automatic status change if changing expiry_date
        let extra = {};
        if (key === 'expiry_date') {
          const expiry = new Date(value).getTime();
          const now = new Date().getTime();
          const daysLeft = Math.ceil((expiry - now) / (1000 * 3600 * 24));
          let status: 'Valid' | 'Expired' | 'Renewal Due' = 'Valid';
          if (daysLeft < 0) status = 'Expired';
          else if (daysLeft <= 30) status = 'Renewal Due';
          extra = { status };
        }
        return { ...d, [key]: value, ...extra };
      }
      return d;
    });
    onUpdateDocs(updated);

    const updatedItem = updated.find(d => d.id === id);
    if (updatedItem) {
      onLogAudit('UPDATE', `Updated document ${key} to "${value}" on reference ${updatedItem.ref_no}`, updatedItem.ref_no);
    }
  };

  const handleDeleteRow = (id: string) => {
    if (isReadOnly) return;
    const target = docs.find(d => d.id === id);
    const filtered = docs.filter(d => d.id !== id);
    onUpdateDocs(filtered);
    if (target) {
      onLogAudit('DELETE', `Deleted compliance document registry for ${target.doc_name}`, target.ref_no);
    }
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      handleFieldChange(id, 'evidence_file_name', file.name);
      onLogAudit('UPLOAD', `Uploaded document file ${file.name} for license`, id);
    }
  };

  // 4. Create new Revision History Entry (Module 7)
  const handleAddRevisionSubmit = (e: React.FormEvent, docRef: string, docName: string) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!revisionChanges || !revisionPrepared || !revisionApproved) {
      alert('Please complete mandatory revision log fields.');
      return;
    }

    // Bump document version incrementally
    const currentDoc = docs.find(d => d.ref_no === docRef);
    let nextVer = '1.1';
    if (currentDoc) {
      const parsedVer = parseFloat(currentDoc.version);
      nextVer = isNaN(parsedVer) ? '2.0' : (parsedVer + 0.1).toFixed(1);
      
      // Update target document in state
      handleFieldChange(currentDoc.id, 'version', nextVer);
      handleFieldChange(currentDoc.id, 'revision_date', new Date().toISOString().substring(0, 10));
    }

    const newRevLog: RevisionHistoryLog = {
      id: `rev_log_${Date.now()}`,
      documentRef: docRef,
      documentName: docName,
      version: nextVer,
      revisionDate: new Date().toISOString().substring(0, 10),
      changes: revisionChanges,
      preparedBy: revisionPrepared,
      reviewedBy: revisionReviewed || 'Authorized Representative',
      approvedBy: revisionApproved,
      nextReviewDate: revisionNextDate
    };

    onAddRevisionLog(newRevLog);
    onLogAudit('UPDATE', `Pushed new version v${nextVer} revision history log for ${docRef}`, docRef);

    // Reset Form
    setRevisionChanges('');
    setRevisionPrepared('');
    setRevisionReviewed('');
    setRevisionApproved('');
    setRevisionNextDate('');
  };

  // Helper colors
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Renewal Due':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Expired':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div id="compliance-document-register-module" className="space-y-4">
      {/* 1. Module Description Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 4 / Module 7</span>
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
            Mandatory Compliance Licenses & Version Control Engine
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xl">
            Register your DOH Facility license, Civil Defense, FANR Radiation, and Trade licenses. Set up automatic expiry counters and track revision histories for compliance audits.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Hide Form' : 'Register New License'}
          </button>
        </div>
      </div>

      {/* 2. Add Document Form */}
      {showAddForm && (
        <form onSubmit={handleAddDocSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-fade-in">
          <div className="md:col-span-4 border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> New Compliance License Registration
            </h3>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Document/License Name*</label>
            <input
              type="text"
              required
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. Civil Defense Certificate"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">License Reference No*</label>
            <input
              type="text"
              required
              value={newRefNo}
              onChange={e => setNewRefNo(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. ADCD-73920"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Issue Date*</label>
            <input
              type="date"
              required
              value={newIssueDate}
              onChange={e => setNewIssueDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Expiry Date*</label>
            <input
              type="date"
              required
              value={newExpiryDate}
              onChange={e => setNewExpiryDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Responsible Owner</label>
            <select
              value={newResp}
              onChange={e => setNewResp(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer"
            >
              <option value="Authorized Representative">Authorized Rep</option>
              <option value="Medical Director">Medical Director</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Initial Version No</label>
            <input
              type="text"
              value={newVersion}
              onChange={e => setNewVersion(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer"
            >
              Register & Begin Version Tracking
            </button>
          </div>
        </form>
      )}

      {/* 3. Document Grid table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-44">License details</th>
                <th className="p-4">Reference No</th>
                <th className="p-4">Issue & Expiry parameters</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Ver / Revision date</th>
                <th className="p-4">Evidence document</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 font-bold text-slate-400 uppercase tracking-wider">
                    No compliance licenses registered yet.
                  </td>
                </tr>
              ) : (
                docs.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* License Name */}
                    <td className="p-4 align-top font-bold text-slate-900 leading-snug">
                      {d.doc_name}
                      <span className="text-[9px] text-slate-400 block font-semibold mt-1">Owner: {d.responsible_person}</span>
                    </td>

                    {/* Reference */}
                    <td className="p-4 align-top">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {d.ref_no}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="p-4 align-top">
                      <div className="text-[10px] font-semibold text-slate-500">
                        Issue: <span className="text-slate-800 font-bold">{d.issue_date}</span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Expiry: <span className="text-slate-800 font-bold">{d.expiry_date}</span>
                      </div>
                      {(() => {
                        const daysLeft = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        if (daysLeft < 0) return <span className="text-[8px] font-extrabold text-rose-600 uppercase block mt-1">Expired</span>;
                        if (daysLeft <= 30) return <span className="text-[8px] font-extrabold text-amber-600 uppercase block mt-1">Expiring in {daysLeft} Days</span>;
                        return <span className="text-[8px] font-bold text-emerald-600 block mt-1">✓ {daysLeft} Days left</span>;
                      })()}
                    </td>

                    {/* Status badge */}
                    <td className="p-4 align-top text-center">
                      <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[9px] font-bold ${getStatusStyle(d.status)}`}>
                        {d.status === 'Valid' && <CheckCircle2 className="w-3 h-3" />}
                        {d.status === 'Renewal Due' && <Clock className="w-3 h-3 animate-pulse" />}
                        {d.status === 'Expired' && <AlertTriangle className="w-3 h-3" />}
                        {d.status}
                      </span>
                    </td>

                    {/* Version & Revision */}
                    <td className="p-4 align-top">
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-[9px] px-2 py-0.5 rounded">
                        v{d.version}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">Rev Date: {d.revision_date}</span>
                    </td>

                    {/* Evidence Document upload */}
                    <td className="p-4 align-top">
                      {d.evidence_file_name ? (
                        <div className="space-y-1">
                          <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded block font-bold truncate max-w-[120px]">
                            {d.evidence_file_name}
                          </span>
                          {!isReadOnly && (
                            <label className="text-[8px] text-rose-600 hover:text-rose-700 font-extrabold cursor-pointer block mt-1">
                              Replace File
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => handleFileUpload(d.id, e)} 
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div>
                          {!isReadOnly ? (
                            <label className="bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 p-1.5 rounded cursor-pointer flex flex-col items-center justify-center text-center gap-0.5 text-[8.5px] font-bold text-slate-500">
                              <Upload className="w-3 h-3 text-slate-400" />
                              <span>Attach PDF</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={e => handleFileUpload(d.id, e)} 
                              />
                            </label>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">No attachment</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-top text-center space-x-1">
                      {!isReadOnly && (
                        <button
                          onClick={() => setEditingDoc(d)}
                          className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors inline-block text-[10px] font-bold"
                          title="Edit License Details"
                        >
                          <Edit className="w-3.5 h-3.5 inline mr-1" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => setShowHistoryModal(d.ref_no)}
                        className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors inline-block text-[10px] font-bold"
                        title="Version Log"
                      >
                        <History className="w-3.5 h-3.5 inline mr-1" /> Version Log
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteRow(d.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors inline-block"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Revision History Modal / Drawer for target doc (Module 7) */}
      {showHistoryModal && (() => {
        const docRef = showHistoryModal;
        const currentDoc = docs.find(d => d.ref_no === docRef);
        const filteredLogs = revisionLogs.filter(log => log.documentRef === docRef);

        return (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Document Version History & Revisions (Module 7)
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-1 block">
                    {currentDoc?.doc_name} — Reference: <span className="font-mono text-emerald-400">{docRef}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="text-slate-300 hover:text-white font-extrabold text-sm cursor-pointer border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 bg-slate-850"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Timeline display */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Revision Timeline Logs
                  </h4>
                  {filteredLogs.length === 0 ? (
                    <p className="text-slate-400 italic">No revision logs entered. Perform a document revision below.</p>
                  ) : (
                    <div className="space-y-4 pl-3 border-l-2 border-indigo-100">
                      {filteredLogs.map(log => (
                        <div key={log.id} className="relative space-y-1">
                          <span className="absolute -left-5 top-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full" />
                          <div className="bg-slate-50/75 p-3.5 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start">
                              <span className="font-black text-indigo-700 text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                Version {log.version}
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-bold">{log.revisionDate}</span>
                            </div>
                            <p className="font-bold text-slate-800 mt-1.5 leading-snug">{log.changes}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2.5 text-[8.5px] text-slate-500 font-semibold border-t border-slate-100 pt-1.5">
                              <div>Prepared: <span className="text-slate-800 font-bold">{log.preparedBy}</span></div>
                              <div>Reviewed: <span className="text-slate-800 font-bold">{log.reviewedBy}</span></div>
                              <div>Approved: <span className="text-slate-800 font-bold">{log.approvedBy}</span></div>
                            </div>
                            {log.nextReviewDate && (
                              <div className="text-[8.5px] text-indigo-600 font-extrabold mt-1">
                                Next Scheduled Review Expiry: {log.nextReviewDate}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit New Revision Form (Module 7) */}
                {!isReadOnly && (
                  <form 
                    onSubmit={e => handleAddRevisionSubmit(e, docRef, currentDoc?.doc_name || '')} 
                    className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-3"
                  >
                    <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Plus className="w-4 h-4 text-emerald-600" /> Log Document Revision (Bump Version)
                    </h4>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Submitting a revision description automatically bumps the active license version number by +0.1 and stamps the revision date as today.
                    </p>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Description of Changes & Updates*</label>
                      <textarea
                        required
                        rows={2}
                        value={revisionChanges}
                        onChange={e => setRevisionChanges(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        placeholder="e.g. Uploaded revised license received from Department of Health after physical audit."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">Prepared By*</label>
                        <input
                          type="text"
                          required
                          value={revisionPrepared}
                          onChange={e => setRevisionPrepared(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          placeholder="e.g. Sarah Jenkins (Compliance Officer)"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">Reviewed By</label>
                        <input
                          type="text"
                          value={revisionReviewed}
                          onChange={e => setRevisionReviewed(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          placeholder="e.g. Authorized Representative"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-0.5">Approved By*</label>
                        <input
                          type="text"
                          required
                          value={revisionApproved}
                          onChange={e => setRevisionApproved(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                          placeholder="e.g. Medical Director"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Next Scheduled Review Date</label>
                      <input
                        type="date"
                        value={revisionNextDate}
                        onChange={e => setRevisionNextDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-4.5 py-2 rounded-lg cursor-pointer"
                      >
                        Publish Revision & Bump Version
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* 5. Edit License Modal (Module 4 / Module 7) */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                Edit Mandatory License & Version Control Engine
              </h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingDoc) return;
              // Recalculate status based on expiry_date
              const expiry = new Date(editingDoc.expiry_date).getTime();
              const now = new Date().getTime();
              const daysLeft = Math.ceil((expiry - now) / (1000 * 3600 * 24));
              let status = editingDoc.status;
              if (daysLeft < 0) status = 'Expired';
              else if (daysLeft <= 30) status = 'Renewal Due';
              else status = 'Valid';

              const updatedDoc = { ...editingDoc, status };
              onUpdateDocs(docs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
              onLogAudit('UPDATE', `Updated compliance license details for "${updatedDoc.doc_name}" (${updatedDoc.ref_no})`, updatedDoc.ref_no);
              setEditingDoc(null);
            }} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">License / Document Name*</label>
                <input
                  type="text"
                  required
                  value={editingDoc.doc_name}
                  onChange={e => setEditingDoc({ ...editingDoc, doc_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Reference No*</label>
                  <input
                    type="text"
                    required
                    value={editingDoc.ref_no}
                    onChange={e => setEditingDoc({ ...editingDoc, ref_no: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Version Number</label>
                  <input
                    type="text"
                    value={editingDoc.version}
                    onChange={e => setEditingDoc({ ...editingDoc, version: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Issue Date*</label>
                  <input
                    type="date"
                    required
                    value={editingDoc.issue_date}
                    onChange={e => setEditingDoc({ ...editingDoc, issue_date: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Expiry Date*</label>
                  <input
                    type="date"
                    required
                    value={editingDoc.expiry_date}
                    onChange={e => setEditingDoc({ ...editingDoc, expiry_date: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Responsible Owner</label>
                  <select
                    value={editingDoc.responsible_person}
                    onChange={e => setEditingDoc({ ...editingDoc, responsible_person: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold cursor-pointer"
                  >
                    <option value="Authorized Representative">Authorized Representative</option>
                    <option value="Medical Director">Medical Director</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Compliance Status</label>
                  <select
                    value={editingDoc.status}
                    onChange={e => setEditingDoc({ ...editingDoc, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold cursor-pointer"
                  >
                    <option value="Valid">Valid</option>
                    <option value="Renewal Due">Renewal Due</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
