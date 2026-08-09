import React, { useState } from 'react';
import { 
  Link2, 
  Search, 
  X, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Database,
  Layers,
  Check,
  Tag,
  ArrowRight
} from 'lucide-react';
import { DocumentReferenceItem } from './QuickMasterSetup';

export interface MasterMetadataSource {
  id: string;
  source_title: string;
  source_module: string;
  document_type: string;
  department: string;
  location: string;
  ref_code: string;
  doc_name: string;
  doc_number: string;
  version: string;
  revision: string;
  issue_date: string;
  approval_date: string;
  effective_date: string;
  next_due_date: string;
  doc_owner: string;
  status: string;
  description?: string;
}

// Master list of available document metadata sources across modules
export const MASTER_METADATA_SOURCES: MasterMetadataSource[] = [
  {
    id: 'src-doh-iso-27001',
    source_title: 'DOH / ISO 27001 / ADHICS Compliance Report View → Document Metadata',
    source_module: 'Compliance Reports & Compilers',
    document_type: 'Compliance Report',
    department: 'Information Security & Compliance',
    location: 'Abu Dhabi HQ - Data Center Vault',
    ref_code: 'REF-ISO-27001-2026',
    doc_name: 'DOH ADHICS & ISO 27001 Executive Compliance Statement',
    doc_number: 'DOC-ISO-8012',
    version: 'v2.1',
    revision: 'Rev 03',
    issue_date: '2025-01-15',
    approval_date: '2025-01-20',
    effective_date: '2025-02-01',
    next_due_date: '2026-02-01',
    doc_owner: 'Chief Information Security Officer (CISO)',
    status: 'Approved & Certified',
    description: 'Master compliance statement for Healthcare Information Security Framework and ISO 27001 audits.'
  },
  {
    id: 'src-roster-pdf',
    source_title: 'Roster PDF Controls → Document Control Information',
    source_module: 'Staff Roster Controls',
    document_type: 'Control Roster',
    department: 'Human Resources & Operations',
    location: 'Corporate Main Office',
    ref_code: 'REF-RST-CTL-2026',
    doc_name: 'Cyber Security On-Call Roster & Emergency Escalation Matrix',
    doc_number: 'DOC-RST-4029',
    version: 'v1.4',
    revision: 'Rev 01',
    issue_date: '2025-02-01',
    approval_date: '2025-02-05',
    effective_date: '2025-02-01',
    next_due_date: '2026-02-01',
    doc_owner: 'HR & Incident Response Team Lead',
    status: 'Active & Verified',
    description: 'Emergency response duty roster control documentation with verified contact metadata.'
  },
  {
    id: 'src-asset-inv',
    source_title: 'Assets Inventory → Report Metadata',
    source_module: 'Asset Inventory Register',
    document_type: 'Inventory Report',
    department: 'IT Infrastructure & Biomedical',
    location: 'Primary Data Center & Server Rooms',
    ref_code: 'REF-AST-INV-004',
    doc_name: 'Master Information Asset & Inventory Register',
    doc_number: 'DOC-AST-9021',
    version: 'v3.0',
    revision: 'Rev 02',
    issue_date: '2025-01-01',
    approval_date: '2025-01-10',
    effective_date: '2025-01-15',
    next_due_date: '2026-01-15',
    doc_owner: 'IT Asset Manager',
    status: 'Synchronized Master',
    description: 'Comprehensive inventory metadata for server, network, software, and biomedical hardware assets.'
  },
  {
    id: 'src-phys-sec-output',
    source_title: 'Physical Security Compliance Output → Governance Record',
    source_module: 'Physical Security',
    document_type: 'Physical Security',
    department: 'Physical Security & Facilities',
    location: 'Facility Perimeter & Vault Areas',
    ref_code: 'REF-PHY-SEC-2026',
    doc_name: 'Facility Access Control & CCTV Perimeter Security Audit',
    doc_number: 'DOC-PHY-3310',
    version: 'v1.1',
    revision: 'Rev 01',
    issue_date: '2025-03-01',
    approval_date: '2025-03-05',
    effective_date: '2025-03-10',
    next_due_date: '2026-03-10',
    doc_owner: 'Head of Physical Security',
    status: 'Approved',
    description: 'Biometric access control logs, CCTV surveillance coverage, and physical barrier audit metrics.'
  },
  {
    id: 'src-master-key-reg',
    source_title: 'Master Key Register Report (Physical Security Compliance) → Master Key Register Metadata',
    source_module: 'Physical Security / Key Control',
    document_type: 'Master Key Register',
    department: 'Facilities & Security Vaults',
    location: 'High-Security Vault & Server Cabinets',
    ref_code: 'REF-KEY-REG-101',
    doc_name: 'Master Key & Physical Vault Key Distribution Ledger',
    doc_number: 'DOC-KEY-5542',
    version: 'v2.0',
    revision: 'Rev 04',
    issue_date: '2025-01-20',
    approval_date: '2025-01-25',
    effective_date: '2025-02-01',
    next_due_date: '2026-02-01',
    doc_owner: 'Security Custodian',
    status: 'Audited & Locked',
    description: 'Control log for physical server room keys, master bypass keys, and vault lock distribution.'
  },
  {
    id: 'src-comp-compilers',
    source_title: 'Compliance Reports & Document Compilers → Master Executive Compiler',
    source_module: 'Compliance Reports & Compilers',
    document_type: 'Compiler Summary',
    department: 'Compliance & Risk Governance',
    location: 'Executive Boardroom & Cloud Portal',
    ref_code: 'REF-CMP-CMP-009',
    doc_name: 'Unified Compliance Master Audit Compiler & Gap Analysis',
    doc_number: 'DOC-CMP-7711',
    version: 'v1.5',
    revision: 'Rev 02',
    issue_date: '2025-04-01',
    approval_date: '2025-04-05',
    effective_date: '2025-04-10',
    next_due_date: '2026-04-10',
    doc_owner: 'Compliance Officer',
    status: 'Final Release',
    description: 'Compiled multi-framework assessment covering DOH ADHICS, ISO 27001, and UAE Information Security Regulations.'
  },
  {
    id: 'src-legal-reg',
    source_title: 'Legal & Regulatory Register → Document Reference Metadata',
    source_module: 'Legal Compliance Register',
    document_type: 'Legal Register',
    department: 'Legal & Regulatory Affairs',
    location: 'Abu Dhabi Corporate Registry',
    ref_code: 'REF-LGL-REG-2026',
    doc_name: 'Abu Dhabi Healthcare & Data Privacy Legal Register',
    doc_number: 'DOC-LGL-1002',
    version: 'v1.0',
    revision: 'Rev 00',
    issue_date: '2025-01-01',
    approval_date: '2025-01-05',
    effective_date: '2025-01-10',
    next_due_date: '2026-01-10',
    doc_owner: 'Legal Counsel',
    status: 'Legally Binding',
    description: 'Regulatory compliance mappings for UAE Data Protection Law and DOH mandatory directives.'
  },
  {
    id: 'src-win-endpoint',
    source_title: 'Windows Endpoint Security Auditor → Telemetry Metadata',
    source_module: 'Windows Endpoint Auditor',
    document_type: 'Telemetry Audit',
    department: 'IT Security Operations (SOC)',
    location: 'Endpoint Workstations & Domain Controllers',
    ref_code: 'REF-WIN-END-007',
    doc_name: 'Windows Workstation Baseline Hardening & Telemetry Report',
    doc_number: 'DOC-WIN-4481',
    version: 'v1.3',
    revision: 'Rev 01',
    issue_date: '2025-02-15',
    approval_date: '2025-02-20',
    effective_date: '2025-02-25',
    next_due_date: '2026-02-25',
    doc_owner: 'SOC Endpoint Specialist',
    status: 'Active Scan Log',
    description: 'Active Directory domain group policy, bitlocker status, and endpoint hardening audit telemetry.'
  },
  {
    id: 'src-policy-gov',
    source_title: 'Policy & Governance Matrix → High Level Policy Control',
    source_module: 'Policy & Governance',
    document_type: 'Policy',
    department: 'Information Security',
    location: 'Global Workspace',
    ref_code: 'REF-POL-SEC-001',
    doc_name: 'Information Security High Level Master Policy',
    doc_number: 'DOC-POL-1001',
    version: 'v2.0',
    revision: 'Rev 01',
    issue_date: '2025-01-15',
    approval_date: '2025-01-20',
    effective_date: '2025-02-01',
    next_due_date: '2026-02-01',
    doc_owner: 'CISO / Policy Committee',
    status: 'Enforced',
    description: 'Foundational security policy governing organizational risk management and data classification.'
  }
];

export interface MetadataMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDoc: DocumentReferenceItem | null;
  onSelectSource: (source: MasterMetadataSource) => void;
}

export default function MetadataMappingModal({
  isOpen,
  onClose,
  targetDoc,
  onSelectSource
}: MetadataMappingModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [activeRecentTag, setActiveRecentTag] = useState<string | null>(null);

  if (!isOpen || !targetDoc) return null;

  // Extract unique filters dynamically
  const availableModules = Array.from(new Set(MASTER_METADATA_SOURCES.map(s => s.source_module)));
  const availableTypes = Array.from(new Set(MASTER_METADATA_SOURCES.map(s => s.document_type)));
  const availableDepts = Array.from(new Set(MASTER_METADATA_SOURCES.map(s => s.department)));

  // Filter sources based on search and filters
  const filteredSources = MASTER_METADATA_SOURCES.filter(source => {
    const matchesSearch = 
      source.source_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.doc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.ref_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.doc_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === 'ALL' || source.source_module === selectedModule;
    const matchesType = selectedType === 'ALL' || source.document_type === selectedType;
    const matchesDept = selectedDept === 'ALL' || source.department === selectedDept;
    const matchesRecent = !activeRecentTag || source.source_title.toLowerCase().includes(activeRecentTag.toLowerCase());

    return matchesSearch && matchesModule && matchesType && matchesDept && matchesRecent;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Link2 className="w-5 h-5 text-indigo-400" />
              </span>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Document Metadata Master Loop Engine</span>
                <span className="text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/40">Loop Connected</span>
              </h3>
            </div>
            <p className="text-xs text-indigo-200/80 font-medium flex items-center gap-2 flex-wrap">
              <span>Target Record:</span>
              <strong className="text-white font-mono bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/60">
                {targetDoc.ref_code}
              </strong>
              <span>—</span>
              <span className="text-emerald-300 font-bold">{targetDoc.doc_name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Close Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search metadata sources by title, document name, ref code, owner, or department..."
              className="w-full pl-10 pr-16 py-2.5 rounded-2xl border border-slate-300 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Module Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" /> Module Filter
              </label>
              <select
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Available Modules ({MASTER_METADATA_SOURCES.length})</option>
                {availableModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-emerald-600" /> Document Type Filter
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Document Types</option>
                {availableTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-600" /> Department Filter
              </label>
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Departments</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RECENTLY USED LIST / QUICK PILLS */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px] pb-1">
            <span className="font-extrabold text-slate-500 shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Source Modules:
            </span>
            <button
              onClick={() => setActiveRecentTag(null)}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold transition-all shrink-0 cursor-pointer ${
                !activeRecentTag ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setActiveRecentTag('Assets Inventory')}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all shrink-0 cursor-pointer ${
                activeRecentTag === 'Assets Inventory' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              📦 Assets Inventory → Report Metadata
            </button>
            <button
              onClick={() => setActiveRecentTag('ISO 27001')}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all shrink-0 cursor-pointer ${
                activeRecentTag === 'ISO 27001' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              🛡️ DOH / ISO 27001 Compliance
            </button>
            <button
              onClick={() => setActiveRecentTag('Master Key')}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all shrink-0 cursor-pointer ${
                activeRecentTag === 'Master Key' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              🔑 Master Key Register Metadata
            </button>
            <button
              onClick={() => setActiveRecentTag('Roster PDF')}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all shrink-0 cursor-pointer ${
                activeRecentTag === 'Roster PDF' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              👥 Roster PDF Controls
            </button>
          </div>
        </div>

        {/* METADATA SOURCES SCROLLABLE CONTENT AREA */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredSources.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl space-y-3">
              <Database className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Document Metadata Sources Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No modules match your current search parameters. Try clearing your search term or selecting "All Available Modules".
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedModule('ALL');
                  setSelectedType('ALL');
                  setSelectedDept('ALL');
                  setActiveRecentTag(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSources.map(source => {
                const isCurrentlySelected = targetDoc.mapped_from === source.source_title;

                return (
                  <div
                    key={source.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isCurrentlySelected 
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/30' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header Row of Source */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {source.source_module}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {source.document_type}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            Ref: {source.ref_code}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{source.source_title}</span>
                          {isCurrentlySelected && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                              Currently Linked
                            </span>
                          )}
                        </h4>
                        {source.description && (
                          <p className="text-xs text-slate-500 font-medium">{source.description}</p>
                        )}
                      </div>

                      {/* Map Action Button */}
                      <button
                        onClick={() => onSelectSource(source)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-xs ${
                          isCurrentlySelected
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <Link2 className="w-4 h-4" />
                        <span>{isCurrentlySelected ? 'Re-Sync Master Metadata' : '🔗 Link & Sync Master Metadata'}</span>
                      </button>
                    </div>

                    {/* METADATA FIELDS MAPPING PREVIEW GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px] bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-medium">
                      
                      {/* Document Name */}
                      <div className="col-span-2">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Document Name</span>
                        <strong className="text-slate-900 font-bold block truncate">{source.doc_name}</strong>
                      </div>

                      {/* Document Ref & Number */}
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Doc No / Ref Code</span>
                        <span className="font-mono font-bold text-indigo-900 block">{source.doc_number}</span>
                        <span className="font-mono text-[9.5px] text-slate-500 block">{source.ref_code}</span>
                      </div>

                      {/* Version & Revision */}
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Version / Revision</span>
                        <span className="font-mono font-bold text-emerald-800 block">{source.version} ({source.revision})</span>
                      </div>

                      {/* Dates */}
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Effective Date</span>
                        <span className="font-mono text-slate-700 block">{source.effective_date}</span>
                      </div>

                      {/* Next Due Date */}
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Next Due Date</span>
                        <span className="font-mono font-bold text-rose-700 block">{source.next_due_date}</span>
                      </div>

                      {/* Department & Location */}
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Department & Location</span>
                        <span className="text-slate-800 font-bold block truncate">{source.department}</span>
                        <span className="text-slate-500 text-[10px] block truncate">{source.location}</span>
                      </div>

                      {/* Owner */}
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Document Owner</span>
                        <span className="text-slate-800 font-semibold block truncate">{source.doc_owner}</span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Master Source Status</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ● {source.status}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automatic Module Resolver will sync linked fields whenever master document changes.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
