import React, { useState, useEffect } from 'react';
import { Link2, Sparkles, CheckCircle2, ArrowRight, Database, RefreshCw } from 'lucide-react';

export interface DocRefLoopData {
  ref_code: string;
  doc_name: string;
  module_name?: string;
  classification: string;
  issue_date: string;
  review_date: string;
  approval_date: string;
  prepared_by: string;
  reviewed_by: string;
  approved_by: string;
  version?: string;
  framework_group?: string;
}

// Standard fallback Document Reference records connected via Loop
export const DEFAULT_LOOP_DOC_RECORDS: DocRefLoopData[] = [
  {
    ref_code: 'ANNIB-IT-ACC-01',
    doc_name: 'System Access Review Summary Report',
    module_name: 'Access Management',
    classification: 'RESTRICTED / CONFIDENTIAL',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'Aseef Sulaiman (IT Manager)',
    reviewed_by: 'Sarah Jenkins (Compliance Officer)',
    approved_by: 'Dr. Faisal Al-Mansoori (Medical Director)',
    version: 'v2.0 (Master Loop)',
    framework_group: 'Advance Tier (ISO 27001 / ADHICS)'
  },
  {
    ref_code: 'REF-SYS-ACC-001',
    doc_name: 'System Access Review Summary Report',
    module_name: 'Access Management',
    classification: 'APPROVED & ACTIVE',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'IT Manager',
    reviewed_by: 'Compliance Lead',
    approved_by: 'Medical Director',
    version: 'v2.0 (Master Loop)',
    framework_group: 'Advance Tier (ISO 27001 / ADHICS)'
  },
  {
    ref_code: 'ADHICS-ACC-REV-2026',
    doc_name: 'System Access Review Summary Report',
    module_name: 'Access Management',
    classification: 'RESTRICTED / CONFIDENTIAL',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'Aseef Sulaiman (IT Manager)',
    reviewed_by: 'Compliance Lead',
    approved_by: 'Dr. Faisal Al-Mansoori (Medical Director)',
    version: 'v2.1',
    framework_group: 'Advance Tier (ISO 27001 / ADHICS)'
  },
  {
    ref_code: 'ANNIB-HR-Doc-03',
    doc_name: 'Healthcare Legal & Compliance Audit Report',
    module_name: 'Compliance Audit',
    classification: 'APPROVED & ACTIVE',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'Sarah Jenkins (Compliance Officer)',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Dr. Faisal Al-Mansoori (Medical Director)',
    version: '1.0',
    framework_group: 'Advance Tier'
  },
  {
    ref_code: 'REF-HR-NDA-001',
    doc_name: 'Employee Confidentiality Agreement',
    module_name: 'HR Compliance',
    classification: 'CONFIDENTIAL',
    issue_date: '2026-08-03',
    review_date: '2027-08-03',
    approval_date: '2026-08-03',
    prepared_by: 'HR & Legal Desk',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Managing Director',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Basic'
  },
  {
    ref_code: 'REF-INC-LOG-002',
    doc_name: 'INCIDENT MANAGEMENT FORM',
    module_name: 'Incident Response',
    classification: 'RESTRICTED',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'CISO / Security Desk',
    reviewed_by: 'Risk Committee',
    approved_by: 'Medical Director',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Transmission Tier'
  },
  {
    ref_code: 'REF-ONB-CHK-003',
    doc_name: 'ORIENTATION CHECKLIST',
    module_name: 'Staff Onboarding',
    classification: 'RESTRICTED',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'HR Training Officer',
    reviewed_by: 'Facility Manager',
    approved_by: 'HR Lead',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Basic'
  },
  {
    ref_code: 'REF-HR-6597',
    doc_name: 'Staff & Operator Governance & HR Compliance Record',
    module_name: 'HR Governance',
    classification: 'RESTRICTED',
    issue_date: '2026-08-03',
    review_date: '2027-07-28',
    approval_date: '2026-08-03',
    prepared_by: 'HR Director',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Risk Review Lead',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Basic'
  },
  {
    ref_code: 'REF-HR-2500',
    doc_name: 'Staff & Operator Governance & HR Compliance Record',
    module_name: 'HR Governance',
    classification: 'OFFICIAL / RESTRICTED',
    issue_date: '2026-08-03',
    review_date: '2027-07-28',
    approval_date: '2026-08-03',
    prepared_by: 'HR Director',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Risk Review Lead',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Basic'
  },
  {
    ref_code: 'REF-HR-RST-B035',
    doc_name: 'Staff & Operator Clinical Duty Roster',
    module_name: 'Staff Roster',
    classification: 'CONFIDENTIAL',
    issue_date: '2026-08-01',
    review_date: '2027-08-01',
    approval_date: '2026-08-01',
    prepared_by: 'HR Director',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Risk Lead',
    version: 'v1.0 (Master Loop)',
    framework_group: 'Basic'
  },
  {
    ref_code: 'DOH-HLAR-2026-001',
    doc_name: 'Healthcare Legal & Compliance Audit Report Folder',
    module_name: 'Compliance Audit',
    classification: 'ACTIVE',
    issue_date: '2026-08-01',
    review_date: '2026-07-25',
    approval_date: '2026-08-01',
    prepared_by: 'Sarah Jenkins (Compliance Officer)',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Dr. Faisal Al-Mansoori (Medical Director)',
    version: '1.0',
    framework_group: 'Advance Tier'
  },
  {
    ref_code: 'REF-POL-001',
    doc_name: 'Information Security High Level Policy',
    module_name: 'Policy',
    classification: 'CONFIDENTIAL',
    issue_date: '2025-01-15',
    review_date: '2026-01-15',
    approval_date: '2025-01-20',
    prepared_by: 'CISO / Security Desk',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Managing Director / CEO',
    version: 'v1.0',
    framework_group: 'Basic'
  },
  {
    ref_code: 'REF-SOP-002',
    doc_name: 'Disaster Recovery Backup & Data Restoration SOP',
    module_name: 'SOP',
    classification: 'RESTRICTED',
    issue_date: '2025-03-10',
    review_date: '2026-03-10',
    approval_date: '2025-03-15',
    prepared_by: 'IT Lead',
    reviewed_by: 'Operations Manager',
    approved_by: 'Technical Director',
    version: 'v1.2',
    framework_group: 'Transmission Tier'
  },
  {
    ref_code: 'REF-AST-INV-004',
    doc_name: 'Master Information Asset & Inventory Register',
    module_name: 'Register',
    classification: 'CONFIDENTIAL',
    issue_date: '2025-01-01',
    review_date: '2026-01-01',
    approval_date: '2025-01-10',
    prepared_by: 'IT Asset Manager',
    reviewed_by: 'Infrastructure Lead',
    approved_by: 'Risk Director',
    version: 'v2.0',
    framework_group: 'Basic'
  }
];

interface DocRefLoopSelectorProps {
  onApplyLoop: (data: DocRefLoopData) => void;
  currentRefCode?: string;
  compact?: boolean;
}

const toISODate = (val?: string): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

export const DocRefLoopSelector: React.FC<DocRefLoopSelectorProps> = ({
  onApplyLoop,
  currentRefCode,
  compact = false
}) => {
  const [availableDocs, setAvailableDocs] = useState<DocRefLoopData[]>(DEFAULT_LOOP_DOC_RECORDS);
  const [selectedRef, setSelectedRef] = useState<string>(currentRefCode || 'ANNIB-IT-ACC-01');
  const [isSynced, setIsSynced] = useState<boolean>(true);

  // Load latest records from Quick Master Setup localStorage & listen to loop sync events
  const refreshRecords = () => {
    try {
      const mergedMap = new Map<string, DocRefLoopData>();
      DEFAULT_LOOP_DOC_RECORDS.forEach(item => mergedMap.set(item.ref_code, item));

      // 1. Check root quick master setup
      const saved = localStorage.getItem('sh_quick_master_setup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
          parsed.documents.forEach((d: any) => {
            if (d && d.ref_code) {
              mergedMap.set(d.ref_code, {
                ref_code: d.ref_code,
                doc_name: d.doc_name || 'Governance Record',
                module_name: d.module_name || 'General',
                classification: d.classification || 'CONFIDENTIAL',
                issue_date: toISODate(d.issue_date),
                review_date: toISODate(d.next_due_date || d.review_date),
                approval_date: toISODate(d.approval_date || d.effective_date),
                prepared_by: d.prepared_by || 'HR Director',
                reviewed_by: d.reviewed_by || 'Compliance Officer',
                approved_by: d.approved_by || 'Risk Lead',
                version: d.version_control || 'v1.0',
                framework_group: d.framework_group || 'Basic'
              });
            }
          });
        }
      }

      // 2. Check client-specific keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sh_quick_master_setup_')) {
          try {
            const clientSaved = localStorage.getItem(key);
            if (clientSaved) {
              const clientParsed = JSON.parse(clientSaved);
              if (Array.isArray(clientParsed.documents)) {
                clientParsed.documents.forEach((d: any) => {
                  if (d && d.ref_code) {
                    mergedMap.set(d.ref_code, {
                      ref_code: d.ref_code,
                      doc_name: d.doc_name || 'Governance Record',
                      module_name: d.module_name || 'General',
                      classification: d.classification || 'CONFIDENTIAL',
                      issue_date: toISODate(d.issue_date),
                      review_date: toISODate(d.next_due_date || d.review_date),
                      approval_date: toISODate(d.approval_date || d.effective_date),
                      prepared_by: d.prepared_by || 'HR Director',
                      reviewed_by: d.reviewed_by || 'Compliance Officer',
                      approved_by: d.approved_by || 'Risk Lead',
                      version: d.version_control || 'v1.0',
                      framework_group: d.framework_group || 'Basic'
                    });
                  }
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }

      const merged = Array.from(mergedMap.values());
      setAvailableDocs(merged);

      if (currentRefCode && mergedMap.has(currentRefCode)) {
        setSelectedRef(currentRefCode);
      }
    } catch (e) {
      console.warn('Could not read sh_quick_master_setup in DocRefLoopSelector:', e);
    }
  };

  useEffect(() => {
    refreshRecords();

    const handleSyncEvent = () => refreshRecords();
    window.addEventListener('sh_quick_master_setup_updated', handleSyncEvent);
    window.addEventListener('sh_doc_ref_loop_applied', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    return () => {
      window.removeEventListener('sh_quick_master_setup_updated', handleSyncEvent);
      window.removeEventListener('sh_doc_ref_loop_applied', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
    };
  }, [currentRefCode]);

  const handleExecuteLoopConnect = (refToApply?: string) => {
    const targetCode = refToApply || selectedRef;
    const found = availableDocs.find(d => d.ref_code === targetCode) || availableDocs[0];
    if (found) {
      onApplyLoop(found);
      setIsSynced(true);

      // Persist to localStorage and dispatch event to update Quick Master Setup & Automatic Module Resolver
      try {
        localStorage.setItem('sh_selected_doc_ref', JSON.stringify(found));

        // Upsert into sh_quick_master_setup
        const masterRaw = localStorage.getItem('sh_quick_master_setup');
        let masterData: any = {};
        if (masterRaw) {
          masterData = JSON.parse(masterRaw);
        }
        if (!masterData.documents || !Array.isArray(masterData.documents)) {
          masterData.documents = [];
        }

        const existingIdx = masterData.documents.findIndex((d: any) => d.ref_code === found.ref_code);
        const docRecord = {
          id: existingIdx >= 0 ? masterData.documents[existingIdx].id : 'doc_' + Date.now(),
          ref_code: found.ref_code,
          doc_name: found.doc_name,
          module_name: found.module_name || 'Access Management',
          framework_group: found.framework_group || 'Basic',
          version_control: found.version || 'v2.0 (Master Loop)',
          issue_date: found.issue_date,
          approval_date: found.approval_date,
          effective_date: found.approval_date || found.issue_date,
          next_due_date: found.review_date,
          classification: found.classification,
          prepared_by: found.prepared_by,
          reviewed_by: found.reviewed_by,
          approved_by: found.approved_by,
          is_mapped: true
        };

        if (existingIdx >= 0) {
          masterData.documents[existingIdx] = { ...masterData.documents[existingIdx], ...docRecord };
        } else {
          masterData.documents.unshift(docRecord);
        }

        localStorage.setItem('sh_quick_master_setup', JSON.stringify(masterData));

        // Dispatch events so QuickMasterSetup and all modules immediately update Document Reference Details & Resolver
        window.dispatchEvent(new CustomEvent('sh_doc_ref_loop_applied', { detail: docRecord }));
        window.dispatchEvent(new CustomEvent('sh_quick_master_setup_updated', { detail: masterData }));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('Failed to sync loop record to sh_quick_master_setup', err);
      }
    }
  };

  return (
    <div className={`rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-blue-50/90 ${compact ? 'p-2.5 space-y-2' : 'p-3 space-y-2.5'} shadow-2xs`}>
      <div className="flex items-center justify-between gap-2 border-b border-indigo-150/70 pb-2">
        <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-[11px] uppercase tracking-wider">
          <Link2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
          <span>Quick Master Setup Loop Connection</span>
        </div>
        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-300 rounded-full px-2 py-0.5 flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" /> Auto-Fill Active
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-tight">
          🔗 Select Document Reference Record (Loop Source)
        </label>
        <div className="flex items-center gap-1.5">
          <select
            value={selectedRef}
            onChange={(e) => {
              setSelectedRef(e.target.value);
              handleExecuteLoopConnect(e.target.value);
            }}
            className="flex-1 p-2 rounded-lg border border-indigo-300 bg-white font-mono font-bold text-indigo-950 text-xs shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {availableDocs.map((doc) => (
              <option key={doc.ref_code} value={doc.ref_code}>
                {doc.ref_code} — {doc.doc_name} ({doc.classification})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleExecuteLoopConnect()}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-2xs cursor-pointer transition-all shrink-0"
            title="Auto-Fill & Connect Metadata From Quick Master Setup"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Connect Loop</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-600 font-medium flex items-center justify-between pt-0.5">
        <span className="inline-flex items-center gap-1 text-indigo-800">
          <Database className="w-3 h-3 text-indigo-500" />
          <span>Directly synced with <strong>Quick Master Setup & Facility Governance Matrix</strong></span>
        </span>
        <span className="text-[9.5px] text-emerald-700 font-bold font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Loop Active</span>
      </div>
    </div>
  );
};
