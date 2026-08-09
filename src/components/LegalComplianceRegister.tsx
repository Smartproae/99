import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Scale, 
  FileText, 
  BookOpen, 
  ShieldAlert, 
  FolderOpen, 
  Printer, 
  Settings,
  AlertOctagon
} from 'lucide-react';

import { Client, User, Asset } from '../types';
import { 
  LegalRequirement, 
  CircularItem, 
  StandardItem, 
  ComplianceDoc, 
  RepoFile, 
  ComplianceAuditLog, 
  RevisionHistoryLog,
  INITIAL_LEGAL_REQUIREMENTS,
  INITIAL_CIRCULARS,
  INITIAL_STANDARDS,
  INITIAL_COMPLIANCE_DOCUMENTS,
  INITIAL_REVISION_LOGS,
  INITIAL_COMPLIANCE_AUDIT_LOGS
} from '../utils/legalData';

// Subcomponents
import LegalDashboard from './legal/LegalDashboard';
import LegalRegisterTable from './legal/LegalRegisterTable';
import CircularsTable from './legal/CircularsTable';
import StandardsTable from './legal/StandardsTable';
import ComplianceDocsTable from './legal/ComplianceDocsTable';
import DocRepository from './legal/DocRepository';
import ReportsAndEmail from './legal/ReportsAndEmail';
import AdminAuditLogs from './legal/AdminAuditLogs';

interface LegalComplianceRegisterProps {
  activeClientId: string;
  client?: Client;
  clients?: Client[];
  currentUser?: User;
  assets?: Asset[];
  onAddEmailLog?: (recipient: string, subject: string, type: string, status: string, body: string) => void;
}

export default function LegalComplianceRegister({ 
  activeClientId, 
  client, 
  clients,
  currentUser,
  assets,
  onAddEmailLog 
}: LegalComplianceRegisterProps) {
  // 1. Tab control state
  const [activeSubTab, setActiveSubTab] = useState<'DASHBOARD' | 'LEGAL_REG' | 'CIRCULARS' | 'STANDARDS' | 'LICENSES' | 'REPOSITORY' | 'REPORTS' | 'ADMIN'>('DASHBOARD');

  // 2. Data states
  const [requirements, setRequirements] = useState<LegalRequirement[]>([]);
  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [revisionLogs, setRevisionLogs] = useState<RevisionHistoryLog[]>([]);

  // 3. Partitioned Client Loading (Local Persistence by activeClientId)
  useEffect(() => {
    if (!activeClientId) return;

    // Load or set default legal requirements
    const savedReqs = localStorage.getItem(`sh_legal_register_${activeClientId}`);
    if (savedReqs) {
      try {
        const parsed = JSON.parse(savedReqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((r: LegalRequirement) => r.id));
          const missing = INITIAL_LEGAL_REQUIREMENTS.filter(r => !existingIds.has(r.id));
          const merged = [...parsed, ...missing];
          setRequirements(merged);
          if (missing.length > 0) {
            localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(merged));
          }
        } else {
          setRequirements(INITIAL_LEGAL_REQUIREMENTS);
          localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(INITIAL_LEGAL_REQUIREMENTS));
        }
      } catch (e) {
        setRequirements(INITIAL_LEGAL_REQUIREMENTS);
        localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(INITIAL_LEGAL_REQUIREMENTS));
      }
    } else {
      setRequirements(INITIAL_LEGAL_REQUIREMENTS);
      localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(INITIAL_LEGAL_REQUIREMENTS));
    }

    // Load or set default circulars
    const savedCircs = localStorage.getItem(`sh_circulars_${activeClientId}`);
    if (savedCircs) {
      try {
        const parsed = JSON.parse(savedCircs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCirculars(parsed);
        } else {
          setCirculars(INITIAL_CIRCULARS);
          localStorage.setItem(`sh_circulars_${activeClientId}`, JSON.stringify(INITIAL_CIRCULARS));
        }
      } catch (e) {
        setCirculars(INITIAL_CIRCULARS);
        localStorage.setItem(`sh_circulars_${activeClientId}`, JSON.stringify(INITIAL_CIRCULARS));
      }
    } else {
      setCirculars(INITIAL_CIRCULARS);
      localStorage.setItem(`sh_circulars_${activeClientId}`, JSON.stringify(INITIAL_CIRCULARS));
    }

    // Load or set default standards
    const savedStds = localStorage.getItem(`sh_standards_${activeClientId}`);
    if (savedStds) {
      try {
        const parsed = JSON.parse(savedStds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStandards(parsed);
        } else {
          setStandards(INITIAL_STANDARDS);
          localStorage.setItem(`sh_standards_${activeClientId}`, JSON.stringify(INITIAL_STANDARDS));
        }
      } catch (e) {
        setStandards(INITIAL_STANDARDS);
        localStorage.setItem(`sh_standards_${activeClientId}`, JSON.stringify(INITIAL_STANDARDS));
      }
    } else {
      setStandards(INITIAL_STANDARDS);
      localStorage.setItem(`sh_standards_${activeClientId}`, JSON.stringify(INITIAL_STANDARDS));
    }

    // Load or set default compliance documents
    const savedDocs = localStorage.getItem(`sh_licenses_${activeClientId}`);
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDocs(parsed);
        } else {
          setDocs(INITIAL_COMPLIANCE_DOCUMENTS);
          localStorage.setItem(`sh_licenses_${activeClientId}`, JSON.stringify(INITIAL_COMPLIANCE_DOCUMENTS));
        }
      } catch (e) {
        setDocs(INITIAL_COMPLIANCE_DOCUMENTS);
        localStorage.setItem(`sh_licenses_${activeClientId}`, JSON.stringify(INITIAL_COMPLIANCE_DOCUMENTS));
      }
    } else {
      setDocs(INITIAL_COMPLIANCE_DOCUMENTS);
      localStorage.setItem(`sh_licenses_${activeClientId}`, JSON.stringify(INITIAL_COMPLIANCE_DOCUMENTS));
    }

    // Load or set default revision logs
    const savedRevs = localStorage.getItem(`sh_revision_history_${activeClientId}`);
    if (savedRevs) {
      setRevisionLogs(JSON.parse(savedRevs));
    } else {
      setRevisionLogs(INITIAL_REVISION_LOGS);
      localStorage.setItem(`sh_revision_history_${activeClientId}`, JSON.stringify(INITIAL_REVISION_LOGS));
    }

    // Load or set default audit logs
    const savedAudits = localStorage.getItem(`sh_compliance_audit_${activeClientId}`);
    if (savedAudits) {
      setAuditLogs(JSON.parse(savedAudits));
    } else {
      setAuditLogs(INITIAL_COMPLIANCE_AUDIT_LOGS);
      localStorage.setItem(`sh_compliance_audit_${activeClientId}`, JSON.stringify(INITIAL_COMPLIANCE_AUDIT_LOGS));
    }

    // Synchronize file attachments from all registers to build Document Repository State
    syncRepoFilesFromRegisters();
  }, [activeClientId]);

  // Synchronize attachments to repository state automatically whenever registers update
  const syncRepoFilesFromRegisters = () => {
    const activeReqs = localStorage.getItem(`sh_legal_register_${activeClientId}`);
    const activeCircs = localStorage.getItem(`sh_circulars_${activeClientId}`);
    const activeStds = localStorage.getItem(`sh_standards_${activeClientId}`);
    const activeDocs = localStorage.getItem(`sh_licenses_${activeClientId}`);

    const reqsList: LegalRequirement[] = activeReqs ? JSON.parse(activeReqs) : INITIAL_LEGAL_REQUIREMENTS;
    const circsList: CircularItem[] = activeCircs ? JSON.parse(activeCircs) : INITIAL_CIRCULARS;
    const stdsList: StandardItem[] = activeStds ? JSON.parse(activeStds) : INITIAL_STANDARDS;
    const docsList: ComplianceDoc[] = activeDocs ? JSON.parse(activeDocs) : INITIAL_COMPLIANCE_DOCUMENTS;

    const collectedFiles: RepoFile[] = [];

    // 1. Gather from UAE Register
    reqsList.forEach(r => {
      if (r.evidence_file_name) {
        collectedFiles.push({
          id: `file_req_${r.id}`,
          name: r.evidence_file_name,
          type: 'PDF / Image',
          size: r.evidence_file_size || '240 KB',
          uploadedAt: r.last_updated || new Date().toISOString().substring(0, 10),
          uploadedBy: currentUser?.full_name || 'Compliance Officer',
          sourceModule: 'UAE Legal Register',
          associatedRef: r.ref_no
        });
      }
    });

    // 2. Gather from Circulars
    circsList.forEach(c => {
      if (c.evidence_file_name) {
        collectedFiles.push({
          id: `file_circ_${c.id}`,
          name: c.evidence_file_name,
          type: 'PDF Document',
          size: '145 KB',
          uploadedAt: c.date,
          uploadedBy: currentUser?.full_name || 'Compliance Officer',
          sourceModule: 'DOH Circular Register',
          associatedRef: c.circular_no
        });
      }
    });

    // 3. Gather from Standards
    stdsList.forEach(s => {
      if (s.evidence_file_name) {
        collectedFiles.push({
          id: `file_std_${s.id}`,
          name: s.evidence_file_name,
          type: 'Audit Sheet',
          size: '192 KB',
          uploadedAt: s.date,
          uploadedBy: currentUser?.full_name || 'Compliance Officer',
          sourceModule: 'DOH Standards Register',
          associatedRef: s.reference
        });
      }
    });

    // 4. Gather from Licenses
    docsList.forEach(d => {
      if (d.evidence_file_name) {
        collectedFiles.push({
          id: `file_lic_${d.id}`,
          name: d.evidence_file_name,
          type: 'Mandatory License',
          size: '512 KB',
          uploadedAt: d.revision_date,
          uploadedBy: currentUser?.full_name || 'Compliance Officer',
          sourceModule: 'Compliance Document Register',
          associatedRef: d.ref_no
        });
      }
    });

    setFiles(collectedFiles);
  };

  // 4. GRC Audit Logger Function (Module 9)
  const logComplianceActivity = (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'SYNC' | 'EXPORT' | 'EMAIL', details: string, refNo?: string) => {
    const newLog: ComplianceAuditLog = {
      id: `cal_log_${Date.now()}`,
      action,
      module: getModuleNameFromSubTab(),
      performedBy: currentUser?.full_name || 'Sarah Jenkins',
      role: currentUser?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString(),
      details,
      refNo
    };

    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem(`sh_compliance_audit_${activeClientId}`, JSON.stringify(updatedLogs));
  };

  const getModuleNameFromSubTab = () => {
    switch (activeSubTab) {
      case 'LEGAL_REG': return 'UAE Legal Register';
      case 'CIRCULARS': return 'DOH Circular Register';
      case 'STANDARDS': return 'DOH Standards Register';
      case 'LICENSES': return 'Compliance Document Register';
      case 'REPOSITORY': return 'Document Repository';
      case 'REPORTS': return 'Reports & Exports';
      case 'ADMIN': return 'Administration Module';
      case 'DASHBOARD':
      default:
        return 'Executive GRC Dashboard';
    }
  };

  // 5. Update Handlers passed to subcomponents
  const handleUpdateRequirement = (updatedReq: LegalRequirement) => {
    const updatedList = requirements.map(r => r.id === updatedReq.id ? updatedReq : r);
    setRequirements(updatedList);
    localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(updatedList));
    syncRepoFilesFromRegisters();
  };

  const handleUpdateRequirements = (updatedReqs: LegalRequirement[]) => {
    setRequirements(updatedReqs);
    localStorage.setItem(`sh_legal_register_${activeClientId}`, JSON.stringify(updatedReqs));
    syncRepoFilesFromRegisters();
  };

  const handleUpdateCirculars = (updatedCircs: CircularItem[]) => {
    setCirculars(updatedCircs);
    localStorage.setItem(`sh_circulars_${activeClientId}`, JSON.stringify(updatedCircs));
    syncRepoFilesFromRegisters();
  };

  const handleUpdateStandards = (updatedStds: StandardItem[]) => {
    setStandards(updatedStds);
    localStorage.setItem(`sh_standards_${activeClientId}`, JSON.stringify(updatedStds));
    syncRepoFilesFromRegisters();
  };

  const handleUpdateDocs = (updatedDocs: ComplianceDoc[]) => {
    setDocs(updatedDocs);
    localStorage.setItem(`sh_licenses_${activeClientId}`, JSON.stringify(updatedDocs));
    syncRepoFilesFromRegisters();
  };

  const handleAddRevisionLog = (newLog: RevisionHistoryLog) => {
    const updatedList = [newLog, ...revisionLogs];
    setRevisionLogs(updatedList);
    localStorage.setItem(`sh_revision_history_${activeClientId}`, JSON.stringify(updatedList));
  };

  const handleDeleteFile = (fileId: string) => {
    // Determine source reference and remove from associated list
    if (fileId.startsWith('file_req_')) {
      const reqId = fileId.replace('file_req_', '');
      const item = requirements.find(r => r.id === reqId);
      if (item) {
        handleUpdateRequirement({ ...item, evidence_file_name: undefined, evidence_file_size: undefined });
      }
    } else if (fileId.startsWith('file_circ_')) {
      const circId = fileId.replace('file_circ_', '');
      const list = circulars.map(c => c.id === circId ? { ...c, evidence_file_name: undefined } : c);
      handleUpdateCirculars(list);
    } else if (fileId.startsWith('file_std_')) {
      const stdId = fileId.replace('file_std_', '');
      const list = standards.map(s => s.id === stdId ? { ...s, evidence_file_name: undefined } : s);
      handleUpdateStandards(list);
    } else if (fileId.startsWith('file_lic_')) {
      const licId = fileId.replace('file_lic_', '');
      const list = docs.map(d => d.id === licId ? { ...d, evidence_file_name: undefined } : d);
      handleUpdateDocs(list);
    }
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem(`sh_compliance_audit_${activeClientId}`);
  };

  // Sub-navigation bar layout
  const tabsConfig = [
    { id: 'DASHBOARD', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'LEGAL_REG', label: 'UAE Legal Register', icon: Scale },
    { id: 'CIRCULARS', label: 'DOH Circulars', icon: FileText },
    { id: 'STANDARDS', label: 'DOH Standards', icon: BookOpen },
    { id: 'LICENSES', label: 'Mandatory Licenses', icon: ShieldAlert },
    { id: 'REPOSITORY', label: 'Doc Repository', icon: FolderOpen },
    { id: 'REPORTS', label: 'Reports & Email', icon: Printer },
    { id: 'ADMIN', label: 'Audit Trail logs', icon: Settings }
  ];

  return (
    <div id="healthcare-legal-register-system" className="space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 inline-block">
            Abu Dhabi DOH Compliance System
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">
            {client?.company_name || 'Al-Nahyan Healthcare Center'} Legal Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-snug font-medium">
            Unified healthcare compliance system aligned with DOH standards, MALAFfI consent codes, and federal UAE health decrees.
          </p>
        </div>
        
        {/* Rapid summary widgets */}
        <div className="flex gap-3 shrink-0 text-slate-700 text-xs font-semibold">
          <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Expirations</span>
              <span className="text-slate-800 font-extrabold text-xs block mt-1">
                {docs.filter(d => d.status === 'Expired' || d.status === 'Renewal Due').length} Licenses
              </span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Controls Checked</span>
              <span className="text-slate-800 font-extrabold text-xs block mt-1">
                {requirements.filter(r => r.compliance_status === 'Fully Compliant').length} Registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Panel Selection Header */}
      <div className="bg-slate-900 text-slate-400 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1 shadow-inner select-none shrink-0">
        {tabsConfig.map(tab => {
          const isActive = activeSubTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-800 text-white shadow-sm font-extrabold' 
                  : 'hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Tab Rendering Blocks */}
      <div id="subtab-view-container" className="animate-fade-in">
        {activeSubTab === 'DASHBOARD' && (
          <LegalDashboard 
            requirements={requirements}
            circulars={circulars}
            standards={standards}
            docs={docs}
          />
        )}

        {activeSubTab === 'LEGAL_REG' && (
          <LegalRegisterTable 
            requirements={requirements}
            onUpdateRequirement={handleUpdateRequirement}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
            onLogAudit={logComplianceActivity}
          />
        )}

        {activeSubTab === 'CIRCULARS' && (
          <CircularsTable 
            circulars={circulars}
            onUpdateCirculars={handleUpdateCirculars}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
            onLogAudit={logComplianceActivity}
          />
        )}

        {activeSubTab === 'STANDARDS' && (
          <StandardsTable 
            standards={standards}
            onUpdateStandards={handleUpdateStandards}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
            onLogAudit={logComplianceActivity}
          />
        )}

        {activeSubTab === 'LICENSES' && (
          <ComplianceDocsTable 
            docs={docs}
            onUpdateDocs={handleUpdateDocs}
            revisionLogs={revisionLogs}
            onAddRevisionLog={handleAddRevisionLog}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
            onLogAudit={logComplianceActivity}
          />
        )}

        {activeSubTab === 'REPOSITORY' && (
          <DocRepository 
            files={files}
            circulars={circulars}
            requirements={requirements}
            standards={standards}
            docs={docs}
            onUpdateCirculars={handleUpdateCirculars}
            onUpdateStandards={handleUpdateStandards}
            onUpdateRequirements={handleUpdateRequirements}
            onDeleteFile={handleDeleteFile}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
            onLogAudit={logComplianceActivity}
          />
        )}

        {activeSubTab === 'REPORTS' && (
          <ReportsAndEmail 
            requirements={requirements}
            circulars={circulars}
            standards={standards}
            docs={docs}
            assets={assets}
            activeClientId={activeClientId}
            clientName={client?.company_name}
            client={client}
            clients={clients}
            onLogAudit={logComplianceActivity}
            onAddEmailLog={onAddEmailLog}
          />
        )}

        {activeSubTab === 'ADMIN' && (
          <AdminAuditLogs 
            auditLogs={auditLogs}
            revisionLogs={revisionLogs}
            onClearAuditLogs={handleClearAuditLogs}
            currentUserRole={currentUser?.role || 'SUPER_ADMIN'}
          />
        )}
      </div>
    </div>
  );
}
