/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Policy, MasterDocument, DocumentItem } from '../types';
import { 
  FrameworkGroupTier, 
  FRAMEWORK_GROUPS, 
  getDocumentsByGroup, 
  getGroupComplianceStats, 
  saveCustomGroupAssignment, 
  generateFrameworkGroupPDFReport,
  UnifiedGroupDocument
} from '../utils/frameworkGroupUtils';
import { X, ShieldCheck, Activity, Zap, FileText, Plus, Search, Download, CheckCircle, AlertTriangle, Filter, Check, Edit2 } from 'lucide-react';
import { formatDateDMY } from '../utils/dateUtils';
import BTATierSelector from './BTATierSelector';

interface FrameworkGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  initialGroup?: FrameworkGroupTier;
  policies?: Policy[];
  masterDocs?: MasterDocument[];
  docItems?: DocumentItem[];
  onRefreshData?: () => void;
}

export default function FrameworkGroupModal({
  isOpen,
  onClose,
  client,
  initialGroup = 'Basic',
  policies = [],
  masterDocs = [],
  docItems = [],
  onRefreshData
}: FrameworkGroupModalProps) {
  if (!isOpen) return null;

  const [activeGroup, setActiveGroup] = useState<FrameworkGroupTier>(initialGroup);
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');

  // Form state for adding custom document to active group
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocCode, setNewDocCode] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Information Security');
  const [newDocType, setNewDocType] = useState<'Policy' | 'Procedure' | 'Form' | 'Register' | 'SOP' | 'Review'>('Policy');

  // Get documents for active group
  const groupDocs = getDocumentsByGroup(client.id, activeGroup, policies, masterDocs, docItems);
  const groupStats = getGroupComplianceStats(client.id, activeGroup, policies, masterDocs, docItems);
  const activeGroupInfo = FRAMEWORK_GROUPS.find(g => g.id === activeGroup) || FRAMEWORK_GROUPS[0];

  // Filtered documents by search & type
  const filteredDocs = groupDocs.filter(d => {
    const matchesSearch = 
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = docTypeFilter === 'ALL' || d.docType === docTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleGroupChange = (docCode: string, newGroup: FrameworkGroupTier) => {
    saveCustomGroupAssignment(docCode, newGroup);
    if (onRefreshData) onRefreshData();
  };

  const handleAddCustomDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const code = newDocCode.trim() || `REF-${activeGroup.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    // Save assignment to active group
    saveCustomGroupAssignment(code, activeGroup);

    // Save to localStorage sh_quick_master_setup_docs
    try {
      const savedDocsRaw = localStorage.getItem('sh_quick_master_setup_docs');
      const savedDocs = savedDocsRaw ? JSON.parse(savedDocsRaw) : [];
      savedDocs.push({
        id: `doc-custom-${Date.now()}`,
        ref_code: code,
        doc_name: newDocTitle.trim(),
        module_name: newDocCategory,
        version_control: 'v1.0',
        issue_date: new Date().toISOString().slice(0, 10),
        effective_date: new Date().toISOString().slice(0, 10),
        next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        classification: 'CONFIDENTIAL',
        prepared_by: 'Compliance Team',
        reviewed_by: 'Quality Lead',
        approved_by: 'Facility Director'
      });
      localStorage.setItem('sh_quick_master_setup_docs', JSON.stringify(savedDocs));
    } catch (err) {
      console.warn('Error saving custom group document:', err);
    }

    setNewDocCode('');
    setNewDocTitle('');
    setIsAddingDoc(false);
    if (onRefreshData) onRefreshData();
  };

  const handleExportReport = () => {
    generateFrameworkGroupPDFReport(client, activeGroup, groupDocs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn text-left font-sans">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Facility Compliance & Licenses Framework
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {client.company_name}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-slate-100 flex items-center gap-2">
              Compliance Framework Groups (Basic • Transmission • Advance)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any of the 3 groups below to automatically filter documents, forms, and policies assigned to that tier.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer self-start md:self-auto"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Selector Tabs */}
        <div className="bg-slate-100/80 p-3 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          {FRAMEWORK_GROUPS.map(group => {
            const isActive = activeGroup === group.id;
            const stats = getGroupComplianceStats(client.id, group.id, policies, masterDocs, docItems);

            return (
              <button
                key={group.id}
                onClick={() => {
                  setActiveGroup(group.id);
                  setIsAddingDoc(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    {group.id === 'Basic' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                    {group.id === 'Transmission' && <Activity className="w-4 h-4 text-blue-600" />}
                    {group.id === 'Advance' && <Zap className="w-4 h-4 text-purple-600" />}
                    <span className="font-extrabold text-xs text-slate-900">{group.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{group.targetFocus}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.badgeColor}`}>
                    {stats.total} items
                  </span>
                  <span className="block text-[11px] font-mono font-extrabold text-slate-700 mt-1">
                    {stats.score}% Compliant
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Group Banner & Action Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${activeGroupInfo.badgeColor}`}>
                {activeGroupInfo.name}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                ({groupStats.total} total documents, policies & forms)
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {activeGroupInfo.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddingDoc(!isAddingDoc)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Document to {activeGroup} Group
            </button>

            <button
              onClick={handleExportReport}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Export PDF compliance report for this group"
            >
              <Download className="w-4 h-4" />
              Export {activeGroup} Report (PDF)
            </button>
          </div>
        </div>

        {/* Add Document Inline Form */}
        {isAddingDoc && (
          <form onSubmit={handleAddCustomDocument} className="p-4 bg-indigo-50/70 border-b border-indigo-200 space-y-3 shrink-0 animate-fadeIn">
            <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-indigo-600" /> Add Custom Document / Form to {activeGroup} Group
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ref Code / Document ID</label>
                <input
                  type="text"
                  value={newDocCode}
                  onChange={e => setNewDocCode(e.target.value)}
                  placeholder={`e.g. REF-${activeGroup.toUpperCase()}-001`}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Remote Access Telemetry Log & Policy"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Document Type</label>
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Policy">Policy</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Form">Form / Checklist</option>
                  <option value="SOP">SOP</option>
                  <option value="Register">Register</option>
                  <option value="Review">Access Review</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingDoc(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                Save Document to Group
              </button>
            </div>
          </form>
        )}

        {/* Filter and Search Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search code, title, or category..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Type:
            </span>
            {['ALL', 'Policy', 'Procedure', 'Form', 'Register', 'SOP'].map(type => (
              <button
                key={type}
                onClick={() => setDocTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  docTypeFilter === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Table View */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">No documents found in {activeGroup} Group</p>
              <p className="text-xs max-w-md mx-auto text-slate-500">
                You can add new documents or forms to this group using the "Add Document" button above, or reassign existing documents to this group.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3">Reference Code</th>
                    <th className="p-3">Document / Form Title</th>
                    <th className="p-3">Type / Category</th>
                    <th className="p-3">Next Review / Due</th>
                    <th className="p-3 text-center">Assigned Group</th>
                    <th className="p-3 text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-800">
                  {filteredDocs.map((doc) => {
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-950">
                          {doc.code}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[10px] text-slate-500">Owner: {doc.owner}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                            {doc.docType}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {doc.nextReviewDate ? formatDateDMY(doc.nextReviewDate) : '2027-08-01'}
                        </td>
                        <td className="p-3 text-center">
                          <BTATierSelector
                            compact
                            value={doc.frameworkGroup}
                            onChange={g => handleGroupChange(doc.code, g)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          {doc.status === 'APPROVED' || doc.status === 'COMPLIANT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Compliant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Need Action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredDocs.length}</strong> documents in <strong className="text-emerald-400">{activeGroup} Group</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
