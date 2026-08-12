/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { DocumentItem, Client } from '../types';
import QuickMasterSetup from './QuickMasterSetup';
import {
  Search,
  Filter,
  Download,
  FileText,
  CheckSquare,
  Square,
  FileCheck,
  Shield,
  FolderArchive,
  RefreshCw,
  Building,
  Tag,
  Settings,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface DocumentRepositoryProps {
  documents?: DocumentItem[];
  onAddDocument?: (doc: DocumentItem) => void;
  activeClientId?: string;
  client?: Client;
  onUpdateClient?: (updatedClient: Client) => void;
  onNavigateTab?: (tabId: string) => void;
  logAuditTrail?: (module: string, action: string, payload: any) => void;
  allClients?: Client[];
  onSelectClient?: (clientId: string) => void;
}

// Sample fallback repository items if prop list is initial
const INITIAL_REPOSITORY_DOCS: DocumentItem[] = [
  {
    id: 'doc-001',
    code: 'POL-SEC-001',
    title: 'Information Security High Level Policy',
    type: 'Policy',
    category: 'Policy',
    classification: 'Restricted',
    status: 'Approved',
    version: 'v1.0',
    effective_date: '2026-08-06',
    department: 'Information Technology',
    owner: 'Aseef Sulaiman'
  },
  {
    id: 'doc-002',
    code: 'SOP-IT-002',
    title: 'User Access Control & Password Management SOP',
    type: 'Procedure',
    category: 'Procedure',
    classification: 'Confidential',
    status: 'Approved',
    version: 'v2.1',
    effective_date: '2026-07-15',
    department: 'Information Technology',
    owner: 'IT Manager'
  },
  {
    id: 'doc-003',
    code: 'FRM-HR-003',
    title: 'Employee Onboarding Cyber Risk Checklist Form',
    type: 'Form',
    category: 'Forms',
    classification: 'Confidential',
    status: 'Under Review',
    version: 'v1.2',
    effective_date: '2026-08-01',
    department: 'Human Resources',
    owner: 'HR Director'
  },
  {
    id: 'doc-004',
    code: 'GDL-MED-004',
    title: 'Patient EHR Privacy Safeguards Guideline',
    type: 'Guideline',
    category: 'Guideline',
    classification: 'Restricted',
    status: 'Approved',
    version: 'v1.0',
    effective_date: '2026-06-20',
    department: 'Clinical Operations',
    owner: 'Medical Director'
  },
  {
    id: 'doc-005',
    code: 'REG-RISK-005',
    title: 'Facility Asset & Vulnerability Register Log',
    type: 'Register',
    category: 'Forms',
    classification: 'Confidential',
    status: 'Approved',
    version: 'v3.0',
    effective_date: '2026-08-05',
    department: 'Risk & Quality',
    owner: 'Cyber Risk Manager'
  },
  {
    id: 'doc-006',
    code: 'POL-ADM-006',
    title: 'Clear Desk and Clear Screen Policy Mandate',
    type: 'Policy',
    category: 'Policy',
    classification: 'Confidential',
    status: 'Approved',
    version: 'v1.1',
    effective_date: '2026-05-10',
    department: 'Administration',
    owner: 'Compliance Officer'
  }
];

export default function DocumentRepository({
  documents = [],
  onAddDocument,
  activeClientId,
  client,
  onUpdateClient,
  onNavigateTab,
  logAuditTrail,
  allClients = [],
  onSelectClient
}: DocumentRepositoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'master_setup'>('master_setup');

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Multi-select for Bulk ZIP Export
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Combine parent documents with default initial repository scoped strictly to active client
  const docList = useMemo(() => {
    if (documents && documents.length > 0) {
      const clientDocs = documents.filter(doc => doc.client_id === activeClientId);
      if (clientDocs.length > 0) return clientDocs;
    }
    // Scope initial repository docs to active client
    return INITIAL_REPOSITORY_DOCS.map(d => ({ ...d, client_id: activeClientId }));
  }, [documents, activeClientId]);

  // Real-time filtering
  const filteredDocs = useMemo(() => {
    return docList.filter(doc => {
      // Category filter
      if (categoryFilter !== 'ALL' && doc.category !== categoryFilter && doc.type !== categoryFilter) {
        return false;
      }
      // Classification filter
      if (classificationFilter !== 'ALL' && doc.classification !== classificationFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }
      // Real-time search query matching code, title, department, classification, category, owner
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = (doc.code || '').toLowerCase().includes(q);
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchDept = (doc.department || '').toLowerCase().includes(q);
        const matchClass = (doc.classification || '').toLowerCase().includes(q);
        const matchCat = (doc.category || doc.type || '').toLowerCase().includes(q);
        const matchOwner = (doc.owner || '').toLowerCase().includes(q);

        if (!matchCode && !matchTitle && !matchDept && !matchClass && !matchCat && !matchOwner) {
          return false;
        }
      }

      return true;
    });
  }, [docList, searchTerm, categoryFilter, classificationFilter, statusFilter]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map(d => d.id));
    }
  };

  const handleToggleDocSelect = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk ZIP Export handler
  const handleBulkZipExport = async () => {
    if (selectedDocIds.length === 0) return;

    setIsExportingZip(true);

    try {
      const zip = new JSZip();
      const facilityName = client?.company_name || 'Healthcare Facility';
      const folder = zip.folder('Document_Repository_Archive');

      // Add a Master Manifest JSON file to the ZIP
      const selectedDocsData = docList.filter(d => selectedDocIds.includes(d.id));
      const manifest = {
        facility_name: facilityName,
        export_date: new Date().toISOString(),
        total_documents: selectedDocsData.length,
        documents: selectedDocsData
      };

      folder?.file('DOCUMENT_REPOSITORY_MANIFEST.json', JSON.stringify(manifest, null, 2));

      // Add individual markdown / text files for each document
      selectedDocsData.forEach((doc, idx) => {
        const fileContent = `================================================================
OFFICIAL FACILITY DOCUMENT
Facility: ${facilityName}
Address: ${client?.address || 'Abu Dhabi, UAE'}
================================================================

DOCUMENT TITLE: ${doc.title}
REFERENCE CODE: ${doc.code}
CATEGORY: ${doc.category || doc.type}
CLASSIFICATION: ${doc.classification || 'RESTRICTED'}
VERSION: ${doc.version || 'v1.0'}
STATUS: ${doc.status || 'Approved'}
DEPARTMENT: ${doc.department || 'Quality'}
OWNER / RESPONSIBLE: ${doc.owner || 'Aseef Sulaiman'}
EFFECTIVE DATE: ${doc.effective_date || '2026-08-06'}

----------------------------------------------------------------
DOCUMENT STATEMENT & MANDATE SUMMARY:
----------------------------------------------------------------
This document sets forth the official governance control guidelines, operational mandates, and administrative policies for ${facilityName} under ADHICS and DOH regulatory compliance frameworks.

1. PURPOSE & SCOPE
   Outlines fundamental protection mechanisms for facility information assets and clinical infrastructure.

2. GOVERNANCE & MANDATES
   Mandatory compliance controls binding upon all employees, contractors, and authorized operators.

================================================================
CONFIDENTIALITY NOTICE: ${doc.classification || 'RESTRICTED'} DOCUMENT
================================================================
`;
        const safeCode = (doc.code || `DOC-${idx}`).replace(/[^a-z0-9_-]/gi, '_');
        folder?.file(`${safeCode}_${doc.title.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.txt`, fileContent);
      });

      // Generate the ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Trigger File Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartPro_Document_Repository_Archive_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (logAuditTrail) {
        logAuditTrail('DOCUMENT_REPOSITORY', 'BULK ZIP EXPORT GENERATED', {
          count: selectedDocsData.length,
          doc_codes: selectedDocsData.map(d => d.code)
        });
      }
    } catch (err) {
      console.error('[DocumentRepository] Error generating bulk ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div id="document-repository-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            Quick Master Setup & Facility Governance Matrix
          </h1>
        </div>
      </div>

      {activeSubTab === 'repository' ? (
        <div className="space-y-4">
          {/* Real-time Search and Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Real-time Search Input */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by document code, metadata, title..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all"
                />
              </div>

              {/* Filter Selectors */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Policy">Policy</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Forms">Forms</option>
                  <option value="Guideline">Guideline</option>
                </select>

                <select
                  value={classificationFilter}
                  onChange={e => setClassificationFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="ALL">All Classifications</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="OFFICIAL">OFFICIAL</option>
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Draft">Draft</option>
                </select>

                {/* Bulk Export ZIP Button */}
                <button
                  disabled={selectedDocIds.length === 0 || isExportingZip}
                  onClick={handleBulkZipExport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isExportingZip ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Packaging ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Bulk Export ZIP ({selectedDocIds.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Stats & Active Tag Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
              <span>
                Showing <strong>{filteredDocs.length}</strong> of <strong>{docList.length}</strong> controlled documents
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" /> Select All ({filteredDocs.length})
                    </>
                  )}
                </button>

                {(searchTerm || categoryFilter !== 'ALL' || classificationFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('ALL');
                      setClassificationFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold ml-2 underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Reference Code</th>
                    <th className="p-3.5">Document Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Version</th>
                    <th className="p-3.5">Effective Date</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map(doc => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <tr
                          key={doc.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocSelect(doc.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-mono font-extrabold text-indigo-700">
                            {doc.code}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 max-w-xs">
                            {doc.title}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10.5px]">
                              {doc.category || doc.type}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                (doc.classification || '').includes('CONFIDENTIAL')
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : (doc.classification || '').includes('RESTRICTED')
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {doc.classification || 'RESTRICTED'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{doc.department || 'Quality'}</td>
                          <td className="p-3.5 font-mono text-slate-700 font-bold">{doc.version || 'v1.0'}</td>
                          <td className="p-3.5 text-slate-500">{doc.effective_date || '2026-08-06'}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-wider">
                              {doc.status || 'Approved'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No documents matched your search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Quick Master Setup Sub-Tab */
        <QuickMasterSetup
          client={client}
          onUpdateClient={onUpdateClient}
          onNavigateTab={onNavigateTab}
          logAuditTrail={logAuditTrail}
          allClients={allClients}
          onSelectClient={onSelectClient}
        />
      )}
    </div>
  );
}
