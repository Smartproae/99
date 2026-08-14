/**
 * Central Document Print Hub & Acknowledgment Module ("Option Print Box")
 * Allows unified printing of all system policies, master documents, SOPs,
 * agreements, and client physical employee document acknowledgment sheets.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Search,
  CheckSquare,
  Square,
  FileText,
  ShieldCheck,
  Building2,
  Users,
  Download,
  Filter,
  Eye,
  Award,
  Signature,
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  Plus,
  X,
  FileCode,
  Loader2,
  ZoomIn,
  ZoomOut,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Client, Employee, ServiceAgreement } from '../types';
import { printDocument } from '../utils/printUtils';
import { exportToSinglePagePDF, exportToMultiPagePDF } from '../utils/pdfExport';
import { getPolicyTemplateDefaults } from '../utils/policyDefaults';
import { SmartTextRenderer } from './SmartTextRenderer';

const DEFAULT_PREPARED_SIGN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'><path d='M10 25 C 25 10, 35 30, 50 15 C 65 5, 75 35, 90 20 C 100 10, 105 25, 115 18' stroke='%230f766e' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>";
const DEFAULT_REVIEWED_SIGN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'><path d='M10 20 Q 30 5, 50 25 T 90 15 Q 105 25, 115 15' stroke='%231e3a8a' stroke-width='2' fill='none' stroke-linecap='round'/></svg>";
const DEFAULT_APPROVED_SIGN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'><path d='M10 28 C 30 8, 40 32, 60 12 C 75 2, 85 28, 100 10 C 110 2, 112 18, 118 12' stroke='%23991b1b' stroke-width='2.5' fill='none' stroke-linecap='round'/></svg>";

export interface UnifiedPrintDoc {
  id: string;
  code: string;
  title: string;
  category: string;
  docType: 'Policy' | 'Procedure' | 'SOP' | 'Form' | 'Agreement' | 'Register' | 'MasterDoc';
  clientId?: string;
  facilityName: string;
  version: string;
  issueDate: string;
  status: string;
  content?: string;
  rawDoc?: any;
  isAckSupported?: boolean;
}

interface CentralPrintHubProps {
  policies: any[];
  masterDocs: any[];
  docItems: any[];
  agreements: ServiceAgreement[];
  clients: Client[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  employees: Employee[];
}

export const CentralPrintHub: React.FC<CentralPrintHubProps> = ({
  policies,
  masterDocs,
  docItems,
  agreements,
  clients,
  activeClientId,
  onSelectClient,
  employees
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || clients[0]?.id || 'ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'POLICIES' | 'MASTER' | 'AGREEMENTS' | 'ACKNOWLEDGMENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Modal / Print preview state
  const [previewDoc, setPreviewDoc] = useState<UnifiedPrintDoc | null>(null);
  const [printMode, setPrintMode] = useState<'STANDARD' | 'WITH_ACKNOWLEDGMENT' | 'ACKNOWLEDGMENT_ONLY'>('WITH_ACKNOWLEDGMENT');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [activePageFilter, setActivePageFilter] = useState<'ALL' | '1' | '2' | '3'>('ALL');

  const printableRef = useRef<HTMLDivElement>(null);

  const activeClientObj = useMemo(() => {
    if (selectedClientId === 'ALL') return clients[0] || null;
    return clients.find(c => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Filter active employees for selected client
  const clientEmployees = useMemo(() => {
    let list = employees;
    if (selectedClientId && selectedClientId !== 'ALL') {
      list = employees.filter(e => e.client_id === selectedClientId || !e.client_id);
    }
    // Strict filter: ONLY ACTIVE EMPLOYEES
    return list.filter(e => {
      const status = (e.current_status || e.currentStatus || e.status || '').toString().trim().toUpperCase();
      return status === 'ACTIVE';
    });
  }, [employees, selectedClientId]);

  // Helper to test if policy is M-Policy-008, M-Policy-019, POL-SEC-008, POL-SEC-005, or related ack policy
  const isAckSupportedPolicy = (codeStr: string, titleStr: string) => {
    const c = (codeStr || '').toUpperCase().trim();
    const t = (titleStr || '').toLowerCase().trim();
    return (
      c.includes('M-POLICY-008') ||
      c.includes('M-POLICY-019') ||
      c.includes('POL-SEC-008') ||
      c.includes('POL-SEC-019') ||
      c.includes('POL-SEC-005') ||
      t.includes('acceptable usage') ||
      t.includes('clear desk') ||
      t.includes('clean desk') ||
      t.includes('clear screen') ||
      t.includes('access control')
    );
  };

  // Compile unified list of printable documents
  const allPrintableDocs = useMemo<UnifiedPrintDoc[]>(() => {
    const list: UnifiedPrintDoc[] = [];

    // 1. Policies
    policies.forEach(p => {
      const isClientPolicy = p.id?.startsWith('POL-CLT-') || p.client_id === selectedClientId;
      if (selectedClientId !== 'ALL' && p.client_id && p.client_id !== selectedClientId && !isClientPolicy) {
        return;
      }

      const code = p.policy_no || p.code || p.id;
      const title = p.policy_name || p.title || 'Untitled Policy';
      const isAck = isAckSupportedPolicy(code, title);

      list.push({
        id: p.id,
        code,
        title,
        category: p.domain || p.category || 'Information Security',
        docType: (p.doc_type as any) || 'Policy',
        clientId: p.client_id,
        facilityName: p.company_name || p.facility_name || activeClientObj?.company_name || 'Healthcare Facility',
        version: p.version || '1.0',
        issueDate: p.created_at || p.issue_date || new Date().toISOString().split('T')[0],
        status: p.status || 'APPROVED',
        content: p.policy_statement || p.full_content || p.content || '',
        rawDoc: p,
        isAckSupported: isAck
      });
    });

    // 2. Master Documents & SOPs
    masterDocs.forEach(m => {
      const code = m.document_number || m.id;
      const title = m.document_name || 'Master Document';
      list.push({
        id: m.id,
        code,
        title,
        category: m.category || 'Governance',
        docType: 'MasterDoc',
        facilityName: activeClientObj?.company_name || 'Healthcare Facility',
        version: m.version || '1.0',
        issueDate: m.created_at || new Date().toISOString().split('T')[0],
        status: m.status || 'APPROVED',
        content: m.content || m.scope || m.purpose || '',
        rawDoc: m,
        isAckSupported: false
      });
    });

    // 3. Document Repository Items
    docItems.forEach(d => {
      const code = d.code || d.document_code || d.id;
      const title = d.title || d.document_name || 'Repository Document';
      list.push({
        id: d.id,
        code,
        title,
        category: d.doc_type_category || 'SOP & Forms',
        docType: (d.doc_type_category as any) || 'Form',
        facilityName: activeClientObj?.company_name || 'Healthcare Facility',
        version: d.version || '1.0',
        issueDate: d.issue_date || new Date().toISOString().split('T')[0],
        status: d.approval_status || 'APPROVED',
        content: d.content || d.description || '',
        rawDoc: d,
        isAckSupported: false
      });
    });

    // 4. Service Agreements
    agreements.forEach(a => {
      if (selectedClientId !== 'ALL' && a.client_id && a.client_id !== selectedClientId) {
        return;
      }
      const clientMatch = clients.find(c => c.id === a.client_id);
      list.push({
        id: a.id,
        code: a.contract_number || `AGR-${a.id.substring(0, 6)}`,
        title: `Service Agreement — ${clientMatch?.company_name || 'Facility Contract'}`,
        category: 'Third Party Security & Contracts',
        docType: 'Agreement',
        clientId: a.client_id,
        facilityName: clientMatch?.company_name || activeClientObj?.company_name || 'Client Facility',
        version: 'Executed 1.0',
        issueDate: a.effective_date || a.start_date || new Date().toISOString().split('T')[0],
        status: a.status || 'EXECUTED',
        content: a.notes || `Compliance & Cyber Risk Management Service Agreement between SmartPro Consultancy and ${clientMatch?.company_name}.`,
        rawDoc: a,
        isAckSupported: false
      });
    });

    // Ensure M-Policy-008 (Acceptable Usage Policy) and M-Policy-019 (Clear Desk & Clear Screen Policy) are present
    const existingCodes = new Set(list.map(d => d.code.toUpperCase().trim()));
    const facName = activeClientObj?.company_name || 'Healthcare Facility';

    if (!existingCodes.has('M-POLICY-008') && !existingCodes.has('POL-SEC-008')) {
      const def008 = getPolicyTemplateDefaults('M-Policy-008', facName, 'Acceptable Usage Policy');
      list.push({
        id: 'p_m_pol_008_synthesized',
        code: 'M-Policy-008',
        title: 'Acceptable Usage Policy',
        category: 'Information Security',
        docType: 'Policy',
        facilityName: facName,
        version: '1.0',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        content: def008.policy_statement,
        rawDoc: def008,
        isAckSupported: true
      });
    }

    if (!existingCodes.has('M-POLICY-019') && !existingCodes.has('POL-SEC-019') && !existingCodes.has('POL-SEC-005')) {
      const def019 = getPolicyTemplateDefaults('M-Policy-019', facName, 'Clear Desk & Clear Screen Policy');
      list.push({
        id: 'p_m_pol_019_synthesized',
        code: 'M-Policy-019',
        title: 'Clear Desk & Clear Screen Policy',
        category: 'Information Security',
        docType: 'Policy',
        facilityName: facName,
        version: '1.0',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        content: def019.policy_statement,
        rawDoc: def019,
        isAckSupported: true
      });
    }

    return list;
  }, [policies, masterDocs, docItems, agreements, selectedClientId, clients, activeClientObj]);

  // Filtered list
  const filteredDocs = useMemo(() => {
    return allPrintableDocs.filter(doc => {
      // Tab filter
      if (activeTab === 'POLICIES' && doc.docType !== 'Policy') return false;
      if (activeTab === 'MASTER' && doc.docType !== 'MasterDoc' && doc.docType !== 'SOP') return false;
      if (activeTab === 'AGREEMENTS' && doc.docType !== 'Agreement') return false;
      if (activeTab === 'ACKNOWLEDGMENT' && !doc.isAckSupported) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          doc.code.toLowerCase().includes(q) ||
          doc.title.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          doc.facilityName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allPrintableDocs, activeTab, searchTerm]);

  // Priority Acknowledgment Policies (M-Policy-008 & M-Policy-019 Focus)
  const priorityAckPolicies = useMemo(() => {
    return allPrintableDocs.filter(d => 
      /M-Policy-008|POL-SEC-008/i.test(d.code) || 
      /M-Policy-019|POL-SEC-019|POL-SEC-005/i.test(d.code) ||
      /acceptable usage/i.test(d.title) ||
      /clear desk/i.test(d.title) ||
      /clean desk/i.test(d.title) ||
      /clear screen/i.test(d.title)
    );
  }, [allPrintableDocs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSelectDoc = (id: string) => {
    const next = new Set(selectedDocIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  // Structured Policy Data Extractor for Standard Multi-Page Rendering
  const getPolicyStructuredData = (doc: UnifiedPrintDoc) => {
    const facName = doc.facilityName || activeClientObj?.company_name || 'Healthcare Facility';
    const raw = doc.rawDoc || {};
    const defaults = getPolicyTemplateDefaults(doc.code, facName, doc.title);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    return {
      code: doc.code,
      title: doc.title,
      department: raw.department || 'Quality & Information Security',
      docType: doc.docType || 'Policy',
      version: doc.version || '1.0',
      classification: raw.classification || 'Confidential',
      approvalDate: raw.approval_date || raw.issue_date || doc.issueDate,
      effectiveDate: raw.effective_date || raw.issue_date || doc.issueDate,
      revisionDate: raw.revision_date || raw.issue_date || doc.issueDate,
      nextDueDate: raw.next_due_date || nextYearStr,
      reviewFrequency: raw.review_frequency || 'Annually or upon regulatory change',
      retentionPeriod: raw.retention_period || '5 Years / UAE Legal Mandate',
      owner: raw.owner || raw.author || 'Chief Information Security Officer',
      approvedBy: raw.approved_by || 'Managing Director / Chief Executive Officer',
      
      objective: raw.objective || defaults.objective || `To establish mandatory governance and security controls for ${facName}.`,
      scope: raw.scope || defaults.scope || `Applies to all personnel, clinical staff, contractors, information systems, and operational workstations at ${facName}.`,
      resp_it: raw.resp_it_manager || defaults.resp_it_manager || '• Enforces technical access controls, monitoring, and regular audit walkthroughs.',
      resp_md: raw.resp_md || defaults.resp_md || '• Endorses facility security policy frameworks and allocates compliance operational resources.',
      resp_users: raw.resp_all_users || defaults.resp_all_users || '• Strictly complies with policy directives, protects user credentials, and reports security anomalies.',
      
      statement: raw.policy_statement || raw.full_content || raw.content || defaults.policy_statement || doc.content || '',
      principles: raw.core_principles || defaults.core_principles || '1. Security First\n2. Confidentiality\n3. Zero Credential Sharing\n4. Continuous Auditing',
      disciplinary: raw.compliance_disciplinary || defaults.compliance_disciplinary || 'Non-compliance will result in formal HR disciplinary action under the Employee Code of Conduct and UAE Cybercrime Laws.',
      clarifications: raw.compliance_clarifications || defaults.compliance_clarifications || 'Contact the IT Security Officer or Compliance Department for guidance.',
      checks: raw.compliance_checks || defaults.compliance_checks || 'Periodic and unannounced compliance audits are performed by the Quality Team.',
      exceptions: raw.compliance_exceptions || defaults.compliance_exceptions || 'Any formal exceptions must be authorized in writing by the Managing Director.',
      
      preparedByName: raw.prepared_by_name || 'Sarah Jenkins',
      preparedByRole: raw.prepared_by_designation || 'Information Security Officer',
      preparedBySign: raw.prepared_by_sign || DEFAULT_PREPARED_SIGN,
      
      reviewedByName: raw.reviewed_by_name || 'Tareq Al Mansoori',
      reviewedByRole: raw.reviewed_by_designation || 'Senior Compliance Consultant',
      reviewedBySign: raw.reviewed_by_sign || DEFAULT_REVIEWED_SIGN,
      
      approvedByName: raw.approved_by_name || 'Dr. Johnathan Carter',
      approvedByRole: raw.approved_by_designation || 'Managing Director / Chief Medical Officer',
      approvedBySign: raw.approved_by_sign || DEFAULT_APPROVED_SIGN,
    };
  };

  // Open Preview Modal cleanly without triggering immediate browser print
  const handleOpenPreview = (doc: UnifiedPrintDoc, mode: 'STANDARD' | 'WITH_ACKNOWLEDGMENT' | 'ACKNOWLEDGMENT_ONLY' = 'WITH_ACKNOWLEDGMENT') => {
    setPreviewDoc(doc);
    setPrintMode(mode);
    setActivePageFilter('ALL');
    setIsPreviewModalOpen(true);
  };

  // Open Preview & Trigger Print
  const handlePrintDoc = (doc: UnifiedPrintDoc, mode: 'STANDARD' | 'WITH_ACKNOWLEDGMENT' | 'ACKNOWLEDGMENT_ONLY') => {
    setPreviewDoc(doc);
    setPrintMode(mode);
    setActivePageFilter('ALL');
    setIsPreviewModalOpen(true);

    setTimeout(() => {
      printDocument('central-printable-document', {
        documentTitle: `${doc.code} - ${doc.title}`,
        orientation: 'portrait'
      });
      showToast(`✓ Dispatching print request for [${doc.code}]`);
    }, 200);
  };

  // Direct Multi-Page PDF Download Handler
  const handleDownloadPdf = async (doc: UnifiedPrintDoc, mode: 'STANDARD' | 'WITH_ACKNOWLEDGMENT' | 'ACKNOWLEDGMENT_ONLY' = printMode) => {
    setPreviewDoc(doc);
    setPrintMode(mode);
    setIsExportingPdf(true);
    showToast(`⏳ Generating high-definition multi-page PDF for [${doc.code}]...`);

    setTimeout(async () => {
      try {
        const cleanTitle = (doc.title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${doc.code}_${cleanTitle}_${mode === 'ACKNOWLEDGMENT_ONLY' ? 'ACK_Sheet' : 'MultiPage'}.pdf`;

        const success = await exportToMultiPagePDF('central-printable-document', {
          filename,
          scale: 2.5,
          quality: 0.98
        });

        if (success) {
          showToast(`✓ PDF downloaded successfully: ${filename}`);
        } else {
          printDocument('central-printable-document', {
            documentTitle: `${doc.code} - ${doc.title}`
          });
          showToast(`✓ Opened print dialog for PDF save`);
        }
      } catch (err) {
        console.error('PDF export error:', err);
        showToast('Notice: Opened print dialog for direct PDF save');
        printDocument('central-printable-document', {
          documentTitle: `${doc.code} - ${doc.title}`
        });
      } finally {
        setIsExportingPdf(false);
      }
    }, 250);
  };

  // Direct Word (.doc) Download Handler
  const handleDownloadWord = (doc: UnifiedPrintDoc) => {
    const el = document.getElementById('central-printable-document') || printableRef.current;
    if (!el) {
      showToast('Error: Document container not found');
      return;
    }

    const cleanTitle = (doc.title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${doc.code}_${cleanTitle}.doc`;

    const htmlContent = el.innerHTML;
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.code} - ${doc.title}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; margin: 15mm; }
          table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
          th, td { border: 1px solid #94a3b8; padding: 5pt; text-align: left; font-size: 9.5pt; }
          th { background-color: #f1f5f9; font-weight: bold; }
          h1 { font-size: 15pt; color: #0f172a; margin-bottom: 4pt; }
          h2 { font-size: 12pt; color: #1e293b; margin-top: 10pt; }
          h3, h4 { font-size: 10.5pt; color: #334155; margin-top: 8pt; }
          .a4-page-sheet { page-break-after: always; margin-bottom: 20pt; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`✓ Downloaded Word document: ${filename}`);
  };

  const handleBatchPrint = (mode: 'STANDARD' | 'WITH_ACKNOWLEDGMENT') => {
    if (selectedDocIds.size === 0) {
      alert('Please select at least one document from the list to print.');
      return;
    }
    const selected = filteredDocs.filter(d => selectedDocIds.has(d.id));
    if (selected.length === 1) {
      handlePrintDoc(selected[0], mode);
    } else {
      setPreviewDoc(selected[0]);
      setPrintMode(mode);
      setTimeout(() => {
        printDocument('central-printable-document', {
          documentTitle: `Batch Print (${selected.length} Documents)`,
          orientation: 'portrait'
        });
        showToast(`✓ Dispatching batch print request for ${selected.length} document(s)`);
      }, 200);
    }
  };

  // Helper renderer for employee signature rows
  const renderSignatureRows = () => {
    const rows = [...clientEmployees];
    // Pad to at least 10 rows for clean physical pen signatures
    while (rows.length < 10) {
      rows.push({
        id: `blank-${rows.length}`,
        client_id: selectedClientId,
        employee_id: `EMP-00${rows.length + 1}`,
        employee_name: '',
        position: '',
        department: '',
        joining_date: '',
        current_status: 'Active'
      });
    }

    return rows.map((emp, idx) => {
      const name = emp.employee_name || emp.name || emp.full_name || '';
      const position = emp.position || emp.designation || '';
      const dept = emp.department || 'Operations';

      return (
        <tr key={emp.id || idx} className="border-b border-slate-300">
          <td className="p-2 text-center text-xs font-bold text-slate-700 w-10">{idx + 1}</td>
          <td className="p-2 text-xs font-bold text-slate-900 min-w-[160px]">{name || '___________________________'}</td>
          <td className="p-2 text-xs text-slate-700 min-w-[140px]">{position || '____________________'}</td>
          <td className="p-2 text-xs text-slate-700 min-w-[110px]">{dept || '________'}</td>
          <td className="p-2 text-xs text-slate-600 text-center w-28">____ / ____ / 2026</td>
          <td className="p-2 text-xs text-center min-w-[150px]">
            <div className="h-8 border border-dashed border-slate-400 rounded bg-slate-50/50 flex items-center justify-center text-[10px] text-slate-400 italic">
              Physical Signature Here
            </div>
          </td>
        </tr>
      );
    });
  };

  // Total pages calculation
  const totalDocPages = useMemo(() => {
    if (printMode === 'ACKNOWLEDGMENT_ONLY') return 1;
    if (printMode === 'WITH_ACKNOWLEDGMENT') return 3;
    return 2;
  }, [printMode]);

  /* -------------------------------------------------------------
     RENDER PAGE 1: POLICY GOVERNANCE, METADATA & OBJECTIVES / SCOPE
  -------------------------------------------------------------- */
  const renderDocumentPage1 = (doc: UnifiedPrintDoc, totalPages: number) => {
    const data = getPolicyStructuredData(doc);
    return (
      <div
        className="a4-page-sheet bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 mx-auto flex flex-col justify-between"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '16mm 18mm',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page'
        }}
      >
        {/* TOP SECTION */}
        <div className="space-y-4">
          {/* Header Banner with Facility Logo */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              {activeClientObj?.facility_logo ? (
                <img
                  src={activeClientObj.facility_logo}
                  alt={doc.facilityName}
                  className="h-12 max-w-[150px] object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center text-white font-black text-sm shadow-sm border border-blue-800 shrink-0">
                  <Building2 className="w-6 h-6 text-blue-300" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {doc.facilityName}
                </h1>
                <p className="text-xs text-slate-600 font-bold">
                  Information Security & Governance Management
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-700 shrink-0">
              <p className="font-mono font-bold text-blue-900 text-sm">{doc.code}</p>
              <p><span className="font-semibold text-slate-500">Version:</span> {doc.version}</p>
              <p><span className="font-semibold text-slate-500">Effective:</span> {data.effectiveDate}</p>
            </div>
          </div>

          {/* Document Title Header Banner */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 text-center space-y-0.5">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block">
              OFFICIAL CONTROLLED POLICY DOCUMENT
            </span>
            <h2 className="text-base font-black text-slate-900 uppercase">
              {doc.title}
            </h2>
          </div>

          {/* 14-Field Regulatory Document Control Information Grid */}
          <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
            {/* Row 1 */}
            <div className="grid grid-cols-4 bg-slate-50/90 border-b border-slate-300">
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Document Code</span>
                <strong className="font-mono text-emerald-800 font-bold">{data.code}</strong>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Document Title</span>
                <strong className="text-slate-900 font-bold truncate block">{data.title}</strong>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Department</span>
                <strong className="text-slate-800 font-bold">{data.department}</strong>
              </div>
              <div className="p-1.5">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Document Type</span>
                <strong className="text-emerald-800 font-bold">{data.docType}</strong>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-4 bg-slate-50/90 border-b border-slate-300">
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Version</span>
                <strong className="font-mono text-slate-800 font-bold">V{data.version}</strong>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Classification</span>
                <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                  {data.classification}
                </span>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Approval Date</span>
                <span className="font-mono font-bold text-slate-700">{data.approvalDate}</span>
              </div>
              <div className="p-1.5">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Effective Date</span>
                <span className="font-mono font-bold text-slate-700">{data.effectiveDate}</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-4 bg-slate-50/90 border-b border-slate-300">
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Revision Date</span>
                <span className="font-mono font-bold text-slate-700">{data.revisionDate}</span>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Next Review Date</span>
                <span className="font-mono font-bold text-slate-700">{data.nextDueDate}</span>
              </div>
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Review Frequency</span>
                <span className="text-slate-800 font-semibold">{data.reviewFrequency}</span>
              </div>
              <div className="p-1.5">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Retention Period</span>
                <span className="text-slate-800 font-semibold">{data.retentionPeriod}</span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 bg-white">
              <div className="p-1.5 border-r border-slate-300">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Document Owner</span>
                <strong className="text-slate-900 font-bold">{data.owner}</strong>
              </div>
              <div className="p-1.5">
                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Approved By</span>
                <strong className="text-slate-900 font-bold">{data.approvedBy}</strong>
              </div>
            </div>
          </div>

          {/* Section 1.0: Policy Objectives */}
          <div className="space-y-1 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              1.0 Policy Objective & Purpose
            </h3>
            <p className="text-slate-800 leading-relaxed text-[11px] text-justify">
              {data.objective}
            </p>
          </div>

          {/* Section 2.0: Scope & Applicability */}
          <div className="space-y-1 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              2.0 Scope & Operational Applicability
            </h3>
            <p className="text-slate-800 leading-relaxed text-[11px] text-justify">
              {data.scope}
            </p>
          </div>

          {/* Section 3.0: Roles & Responsibilities */}
          <div className="space-y-1.5 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              3.0 Governance Roles & Responsibilities
            </h3>
            <div className="grid grid-cols-1 gap-2 text-[10.5px]">
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-blue-950 font-bold block mb-0.5">3.1 IT Manager / Information Security Officer:</strong>
                <div className="text-slate-700 whitespace-pre-line leading-snug">{data.resp_it}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-blue-950 font-bold block mb-0.5">3.2 Managing Director / Facility Executive:</strong>
                <div className="text-slate-700 whitespace-pre-line leading-snug">{data.resp_md}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-blue-950 font-bold block mb-0.5">3.3 All Users & Operational Personnel:</strong>
                <div className="text-slate-700 whitespace-pre-line leading-snug">{data.resp_users}</div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-500 font-semibold flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <span>TEL: {activeClientObj?.phone || '+971 2 666 4444'}</span>
            <span>•</span>
            <span>EMAIL: {activeClientObj?.owner_email || activeClientObj?.email || 'compliance@facility.ae'}</span>
            <span>•</span>
            <span>ADDR: {activeClientObj?.address || 'Abu Dhabi'}, UAE</span>
          </div>
          <div className="font-mono font-bold text-slate-700">
            Page 1 of {totalPages}
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     RENDER PAGE 2: DIRECTIVES, CONTROLS, PRINCIPLES & SIGN-OFF APPROVALS
  -------------------------------------------------------------- */
  const renderDocumentPage2 = (doc: UnifiedPrintDoc, totalPages: number) => {
    const data = getPolicyStructuredData(doc);
    return (
      <div
        className="a4-page-sheet bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 mx-auto flex flex-col justify-between"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '16mm 18mm',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page'
        }}
      >
        {/* TOP SECTION */}
        <div className="space-y-4">
          {/* Compact Header */}
          <div className="border-b border-slate-300 pb-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 uppercase">{doc.facilityName}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-semibold">{doc.title}</span>
            </div>
            <div className="font-mono text-slate-600 text-[10px]">
              Doc Ref: <strong className="text-blue-900">{doc.code}</strong> (V{doc.version})
            </div>
          </div>

          {/* Section 4.0: Policy Directives & Specific Requirements */}
          <div className="space-y-2 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              4.0 Policy Directives & Technical Control Requirements
            </h3>
            <div className="text-slate-800 leading-relaxed text-[10.5px]">
              <SmartTextRenderer text={data.statement} themeColor="blue" />
            </div>
          </div>

          {/* Section 5.0: Core Principles */}
          <div className="space-y-1 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              5.0 Foundational Core Principles
            </h3>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] text-slate-800 whitespace-pre-line leading-relaxed">
              {data.principles}
            </div>
          </div>

          {/* Section 6.0: Compliance Enforcement, Violations & Exceptions */}
          <div className="space-y-1.5 text-xs">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              6.0 Compliance Enforcement, Exceptions & Clarifications
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-slate-900 font-bold block mb-0.5">Disciplinary Enforcement:</strong>
                <p className="text-slate-700 leading-snug">{data.disciplinary}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-slate-900 font-bold block mb-0.5">Clarifications & Contacts:</strong>
                <p className="text-slate-700 leading-snug">{data.clarifications}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-slate-900 font-bold block mb-0.5">Compliance Inspections:</strong>
                <p className="text-slate-700 leading-snug">{data.checks}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <strong className="text-slate-900 font-bold block mb-0.5">Authorized Exceptions:</strong>
                <p className="text-slate-700 leading-snug">{data.exceptions}</p>
              </div>
            </div>
          </div>

          {/* Section 7.0: 3-Tier Executive Sign-Off & Approvals Grid */}
          <div className="space-y-1.5 pt-2">
            <h3 className="font-extrabold text-blue-900 uppercase tracking-wide border-b border-slate-300 pb-0.5 text-xs">
              7.0 Executive Document Approval & Verification
            </h3>

            <div className="grid grid-cols-3 gap-2.5 text-[10px] relative">
              {/* Prepared By */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50/70 flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[8px] font-bold text-teal-800 uppercase block">Prepared By</span>
                  <strong className="text-[10px] text-slate-900 block mt-0.5">{data.preparedByName}</strong>
                  <span className="text-[8px] text-slate-500 block leading-tight">{data.preparedByRole}</span>
                </div>
                <div className="mt-1 border-t border-slate-200 pt-1 flex items-center justify-center h-9 bg-white rounded p-0.5">
                  <img src={data.preparedBySign} className="max-h-full max-w-full object-contain" alt="Prepared Signature" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Reviewed By */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50/70 flex flex-col justify-between min-h-[110px]">
                <div>
                  <span className="text-[8px] font-bold text-amber-800 uppercase block">Reviewed By</span>
                  <strong className="text-[10px] text-slate-900 block mt-0.5">{data.reviewedByName}</strong>
                  <span className="text-[8px] text-slate-500 block leading-tight">{data.reviewedByRole}</span>
                </div>
                <div className="mt-1 border-t border-slate-200 pt-1 flex items-center justify-center h-9 bg-white rounded p-0.5">
                  <img src={data.reviewedBySign} className="max-h-full max-w-full object-contain" alt="Reviewed Signature" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* Approved By */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50/70 flex flex-col justify-between min-h-[110px] relative">
                <div>
                  <span className="text-[8px] font-bold text-blue-800 uppercase block">Approved By</span>
                  <strong className="text-[10px] text-slate-900 block mt-0.5">{data.approvedByName}</strong>
                  <span className="text-[8px] text-slate-500 block leading-tight">{data.approvedByRole}</span>
                </div>
                <div className="mt-1 border-t border-slate-200 pt-1 flex items-center justify-center h-9 bg-white rounded p-0.5 relative">
                  <img src={data.approvedBySign} className="max-h-full max-w-full object-contain" alt="Approved Signature" referrerPolicy="no-referrer" />
                  <div className="absolute right-0 top-0 text-red-500 font-extrabold text-[12px] opacity-80 select-none pointer-events-none">
                    ❌
                  </div>
                </div>

                {/* Facility Seal Stamp */}
                {activeClientObj?.facility_stamp ? (
                  <div className="absolute -right-4 -bottom-6 w-24 h-24 pointer-events-none -rotate-12 select-none opacity-85 z-10">
                    <img src={activeClientObj.facility_stamp} className="w-full h-full object-contain" alt="Facility Seal" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="absolute -right-2 -bottom-4 w-20 h-20 pointer-events-none -rotate-12 select-none opacity-85 z-10 border-2 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-600 font-bold p-1 bg-white/60">
                    <span className="text-[6px] leading-tight text-center font-mono uppercase truncate max-w-[60px]">{doc.facilityName}</span>
                    <span className="text-[10px] leading-none my-0.2">❌</span>
                    <span className="text-[5.5px] uppercase tracking-widest font-black">APPROVED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-500 font-semibold flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <span>TEL: {activeClientObj?.phone || '+971 2 666 4444'}</span>
            <span>•</span>
            <span>EMAIL: {activeClientObj?.owner_email || activeClientObj?.email || 'compliance@facility.ae'}</span>
            <span>•</span>
            <span>ADDR: {activeClientObj?.address || 'Abu Dhabi'}, UAE</span>
          </div>
          <div className="font-mono font-bold text-slate-700">
            Page 2 of {totalPages}
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
     RENDER PAGE 3: EMPLOYEE DOCUMENT ACKNOWLEDGMENT & WET SIGNATURE ROSTER
  -------------------------------------------------------------- */
  const renderAcknowledgmentPage = (doc: UnifiedPrintDoc, pageNum: number, totalPages: number) => {
    return (
      <div
        className="a4-page-sheet bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 mx-auto flex flex-col justify-between"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '16mm 18mm',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page'
        }}
      >
        {/* TOP SECTION */}
        <div className="space-y-3.5">
          {/* Header Banner with Facility Logo */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {activeClientObj?.facility_logo ? (
                <img
                  src={activeClientObj.facility_logo}
                  alt={doc.facilityName}
                  className="h-10 max-w-[120px] object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-indigo-900 flex items-center justify-center text-white font-black text-xs shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-200" />
                </div>
              )}
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase">
                  {doc.facilityName}
                </h1>
                <p className="text-[10px] text-slate-600 font-bold">
                  Compliance & Policy Governance Management
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-700 shrink-0">
              <p className="font-mono font-bold text-indigo-900 text-xs">{doc.code} - ACK</p>
              <p>Form Ref: ACK-SIG-2026</p>
            </div>
          </div>

          {/* Form Title Banner */}
          <div className="bg-indigo-50 border-2 border-indigo-900 p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-900 block">
              FORMAL STAFF COMPLIANCE & PHYSICAL SIGNATURE SHEET
            </span>
            <h2 className="text-sm font-black text-slate-900 uppercase">
              EMPLOYEE DOCUMENT ACKNOWLEDGMENT FORM
            </h2>
          </div>

          {/* Policy Reference Details Box */}
          <div className="bg-slate-50 border border-slate-400 rounded-lg p-2.5 text-xs space-y-1">
            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              <div>
                <span className="font-bold text-slate-600">Policy Code / Reference:</span>{' '}
                <strong className="text-indigo-900 font-mono">{doc.code}</strong>
              </div>
              <div>
                <span className="font-bold text-slate-600">Effective Version:</span>{' '}
                <strong className="text-slate-900">{doc.version}</strong>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-600">Policy Document Title:</span>{' '}
                <strong className="text-slate-900">{doc.title}</strong>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-600">Facility Entity Name:</span>{' '}
                <strong className="text-slate-900">{doc.facilityName}</strong>
              </div>
            </div>
          </div>

          {/* Formal Undertaking Statement */}
          <div className="bg-white border-l-4 border-indigo-800 p-2.5 rounded text-[10.5px] leading-snug text-slate-800 italic">
            "I hereby acknowledge and confirm that I have received, read, and fully understand the requirements set forth in the policy document referenced above (<strong>{doc.code}: {doc.title}</strong>). I agree to strictly adhere to all directives and security rules outlined therein. I understand that compliance is mandatory and non-adherence may result in formal disciplinary proceedings."
          </div>

          {/* Active Employee Roster & Physical Signature Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-300 pb-1">
              <span className="text-[11px]">Active Employee Signature Roster ({clientEmployees.length} Active Staff)</span>
              <span className="text-[9.5px] text-slate-500 italic">Physical Wet Signature Required</span>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-900 text-[9.5px] font-extrabold uppercase tracking-wider border-b border-slate-400">
                  <th className="p-1.5 border-r border-slate-400 text-center w-8">#</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">Active Employee Name</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">Designation / Role</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">Department</th>
                  <th className="p-1.5 border-r border-slate-400 text-center w-24">Date Received</th>
                  <th className="p-1.5 text-center w-36">Manual Signature</th>
                </tr>
              </thead>
              <tbody>
                {renderSignatureRows()}
              </tbody>
            </table>
          </div>

          {/* Verification & Oversight Sign-off */}
          <div className="pt-4 grid grid-cols-2 gap-6 text-xs border-t border-slate-300">
            <div className="space-y-4">
              <p className="font-bold text-slate-800 text-[10.5px]">Compliance Officer Verification:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-[9px] text-slate-500">Name, Signature & Stamp</p>
            </div>
            <div className="space-y-4">
              <p className="font-bold text-slate-800 text-[10.5px]">Facility Director Approval:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-[9px] text-slate-500">Name, Signature & Date</p>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-500 font-semibold flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <span>TEL: {activeClientObj?.phone || '+971 2 666 4444'}</span>
            <span>•</span>
            <span>EMAIL: {activeClientObj?.owner_email || activeClientObj?.email || 'compliance@facility.ae'}</span>
            <span>•</span>
            <span>ADDR: {activeClientObj?.address || 'Abu Dhabi'}, UAE</span>
          </div>
          <div className="font-mono font-bold text-slate-700">
            Page {pageNum} of {totalPages}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-bold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8 pointer-events-none">
          <Printer className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
              <Printer className="w-3.5 h-3.5" />
              <span>Option Print Box — Centralized Print</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Centralized Print Hub
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidated printing center to preview, filter, and print any policy, master index, SOP, or contract in standard multi-page A4 format. Includes physical Employee Document Acknowledgment signature collection sheets.
            </p>
          </div>

          {/* Quick Client Entity Selector */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col space-y-2 shrink-0 min-w-[260px]">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Target Client Facility Entity</span>
            </label>
            <select
              value={selectedClientId}
              onChange={e => {
                setSelectedClientId(e.target.value);
                if (e.target.value !== 'ALL') onSelectClient(e.target.value);
              }}
              className="w-full bg-slate-900/90 text-white font-bold text-xs p-2.5 rounded-xl border border-blue-400/40 focus:ring-2 focus:ring-blue-400"
            >
              <option value="ALL">-- All Facility Entities --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1">
              <span>Active Roster: <strong>{clientEmployees.length} Staff</strong></span>
              <span>Available Docs: <strong>{allPrintableDocs.length} Records</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED: Priority Document Acknowledgment Section (M-Policy-008 & M-Policy-019 Focus) */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 rounded-3xl p-6 border border-indigo-100 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Signature className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <span>Employee Document Acknowledgment Sheets</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black border border-indigo-200">
                  Multi-Page A4 Standard
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Directly preview, print, or download client policies appended with an active employee acknowledgment roster sheet across standard pages.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('ACKNOWLEDGMENT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'ACKNOWLEDGMENT'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100/50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Show Acknowledgment Policies</span>
            </button>
          </div>
        </div>

        {/* Priority Quick Action Cards for M-Policy-008 & M-Policy-019 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priorityAckPolicies.length > 0 ? (
            priorityAckPolicies.map(pDoc => (
              <div
                key={pDoc.id}
                className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {pDoc.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Ack Supported
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {pDoc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Facility: <strong className="text-slate-700">{pDoc.facilityName}</strong>
                    </p>
                  </div>
                  
                  {activeClientObj?.facility_logo ? (
                    <img
                      src={activeClientObj.facility_logo}
                      alt={pDoc.facilityName}
                      className="h-9 max-w-[80px] object-contain rounded shrink-0 border border-slate-200 p-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenPreview(pDoc, 'WITH_ACKNOWLEDGMENT')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Open interactive multi-page print preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handlePrintDoc(pDoc, 'WITH_ACKNOWLEDGMENT')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print + Ack Sheet</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(pDoc, 'WITH_ACKNOWLEDGMENT')}
                    disabled={isExportingPdf}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Download as Multi-Page PDF file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => handlePrintDoc(pDoc, 'ACKNOWLEDGMENT_ONLY')}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs px-2.5 py-2 rounded-xl border border-purple-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Print standalone signature roster sheet only"
                  >
                    <Signature className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ack Only</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No specific priority acknowledgment policies matched. All client policies below can be printed with Acknowledgment Sheets.
            </div>
          )}
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Documents', count: allPrintableDocs.length, icon: FileText },
              { id: 'POLICIES', label: 'Policies', count: allPrintableDocs.filter(d => d.docType === 'Policy').length, icon: ShieldCheck },
              { id: 'MASTER', label: 'Master Index & SOPs', count: allPrintableDocs.filter(d => d.docType === 'MasterDoc' || d.docType === 'SOP').length, icon: BookOpen },
              { id: 'AGREEMENTS', label: 'Service Agreements', count: allPrintableDocs.filter(d => d.docType === 'Agreement').length, icon: Signature },
              { id: 'ACKNOWLEDGMENT', label: 'Acknowledgment Ready', count: allPrintableDocs.filter(d => d.isAckSupported).length, icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search code, title, facility..."
              className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Batch Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-1.5 text-slate-700 font-bold hover:text-blue-600 cursor-pointer"
            >
              {selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({selectedDocIds.size}/{filteredDocs.length})</span>
            </button>
            {selectedDocIds.size > 0 && (
              <span className="text-slate-500">
                {selectedDocIds.size} document(s) marked for batch dispatch
              </span>
            )}
          </div>

          {selectedDocIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchPrint('STANDARD')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Batch Print Selected ({selectedDocIds.size})</span>
              </button>
              <button
                onClick={() => handleBatchPrint('WITH_ACKNOWLEDGMENT')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Signature className="w-3.5 h-3.5" />
                <span>Batch Print + Ack Sheets</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 text-center w-10">
                  <span className="sr-only">Select</span>
                </th>
                <th className="p-3.5 w-36">Document Ref</th>
                <th className="p-3.5">Document Title & Details</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Facility Entity</th>
                <th className="p-3.5 text-center">Version / Date</th>
                <th className="p-3.5 text-center">Ack Ready</th>
                <th className="p-3.5 text-right w-64">Print & Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, index) => {
                  const isSelected = selectedDocIds.has(doc.id);
                  const isAupOrClear = /M-Policy-008|POL-SEC-008|M-Policy-019|POL-SEC-019|POL-SEC-005/i.test(doc.code);

                  return (
                    <tr
                      key={doc.id || index}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/70' : isAupOrClear ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {doc.code}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-[13px]">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span className="uppercase font-semibold text-slate-600">{doc.docType}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{doc.status}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200">
                          {doc.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700 font-semibold">
                        {doc.facilityName}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="font-mono text-slate-900 font-semibold">V{doc.version}</div>
                        <div className="text-[10px] text-slate-400">{doc.issueDate}</div>
                      </td>

                      <td className="p-3.5 text-center">
                        {doc.isAckSupported ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Ready
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenPreview(doc, doc.isAckSupported ? 'WITH_ACKNOWLEDGMENT' : 'STANDARD')}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 cursor-pointer"
                            title="Interactive Multi-Page Print Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePrintDoc(doc, 'STANDARD')}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                            title="Print Standard Document"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400" />
                            <span>Print</span>
                          </button>

                          {doc.isAckSupported && (
                            <button
                              onClick={() => handlePrintDoc(doc, 'WITH_ACKNOWLEDGMENT')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                              title="Print Policy + Employee Acknowledgment Sheet"
                            >
                              <Signature className="w-3.5 h-3.5" />
                              <span>+ Ack</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadPdf(doc, doc.isAckSupported ? 'WITH_ACKNOWLEDGMENT' : 'STANDARD')}
                            disabled={isExportingPdf}
                            className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 rounded-lg transition-all border border-emerald-200 cursor-pointer disabled:opacity-50"
                            title="Download PDF file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No matching documents found in repository for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==============================================================
          FULL-SCREEN MULTI-PAGE PRINT DISPATCH PREVIEW MODAL
      ============================================================== */}
      {isPreviewModalOpen && previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white shrink-0 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                    {previewDoc.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {previewDoc.facilityName}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white truncate max-w-md">
                  {previewDoc.title}
                </h2>
              </div>
            </div>

            {/* Print Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setPrintMode('STANDARD')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  printMode === 'STANDARD'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Full Policy (Pages 1 & 2)
              </button>

              {previewDoc.isAckSupported && (
                <button
                  onClick={() => setPrintMode('WITH_ACKNOWLEDGMENT')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    printMode === 'WITH_ACKNOWLEDGMENT'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Policy + Ack Sheet (Pages 1, 2 & 3)
                </button>
              )}

              {previewDoc.isAckSupported && (
                <button
                  onClick={() => setPrintMode('ACKNOWLEDGMENT_ONLY')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    printMode === 'ACKNOWLEDGMENT_ONLY'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Ack Sheet Only (Page 1)
                </button>
              )}
            </div>

            {/* Page Jump Filters & Zoom Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setActivePageFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePageFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({totalDocPages} Pgs)
                </button>
                {printMode !== 'ACKNOWLEDGMENT_ONLY' && (
                  <>
                    <button
                      onClick={() => setActivePageFilter('1')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePageFilter === '1' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pg 1
                    </button>
                    <button
                      onClick={() => setActivePageFilter('2')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activePageFilter === '2' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pg 2
                    </button>
                  </>
                )}
                {(printMode === 'WITH_ACKNOWLEDGMENT' || printMode === 'ACKNOWLEDGMENT_ONLY') && (
                  <button
                    onClick={() => setActivePageFilter(printMode === 'ACKNOWLEDGMENT_ONLY' ? '1' : '3')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activePageFilter === (printMode === 'ACKNOWLEDGMENT_ONLY' ? '1' : '3') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ack Sheet
                  </button>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setZoomScale(Math.max(60, zoomScale - 10))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 text-slate-300 font-bold min-w-[34px] text-center">
                  {zoomScale}%
                </span>
                <button
                  onClick={() => setZoomScale(Math.min(140, zoomScale + 10))}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions & Close */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <button
                  onClick={() => {
                    printDocument('central-printable-document', {
                      documentTitle: `${previewDoc.code} - ${previewDoc.title}`,
                      orientation: 'portrait'
                    });
                    showToast(`✓ Sent print command for [${previewDoc.code}]`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                  title="Print Multi-Page Document"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(previewDoc)}
                  disabled={isExportingPdf}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Download Multi-Page PDF"
                >
                  {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadWord(previewDoc)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-slate-600 flex items-center space-x-1.5 cursor-pointer"
                  title="Download as Word document (.doc)"
                >
                  <FileCode className="w-4 h-4 text-blue-300" />
                  <span>Word</span>
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document On-Screen Interactive A4 Preview Workspace */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-950 flex flex-col items-center space-y-8">
            <div
              style={{
                transform: `scale(${zoomScale / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="space-y-8 flex flex-col items-center"
            >
              {/* PAGE 1: POLICY GOVERNANCE & SCOPE */}
              {printMode !== 'ACKNOWLEDGMENT_ONLY' && (activePageFilter === 'ALL' || activePageFilter === '1') && (
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-700">
                      📄 Page 1 of {totalDocPages} — Policy Governance & Scopes
                    </span>
                  </div>
                  {renderDocumentPage1(previewDoc, totalDocPages)}
                </div>
              )}

              {/* PAGE 2: DIRECTIVES & EXECUTIVE SIGN-OFF */}
              {printMode !== 'ACKNOWLEDGMENT_ONLY' && (activePageFilter === 'ALL' || activePageFilter === '2') && (
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-700">
                      📄 Page 2 of {totalDocPages} — Directives, Controls & Approvals
                    </span>
                  </div>
                  {renderDocumentPage2(previewDoc, totalDocPages)}
                </div>
              )}

              {/* PAGE 3: ACTIVE STAFF ACKNOWLEDGMENT & SIGNATURE ROSTER */}
              {(printMode === 'WITH_ACKNOWLEDGMENT' || printMode === 'ACKNOWLEDGMENT_ONLY') &&
                (activePageFilter === 'ALL' || activePageFilter === (printMode === 'ACKNOWLEDGMENT_ONLY' ? '1' : '3')) && (
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="inline-block bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full text-[11px] font-bold border border-indigo-800">
                        📋 Page {printMode === 'ACKNOWLEDGMENT_ONLY' ? '1 of 1' : `3 of ${totalDocPages}`} — Staff Compliance Acknowledgment Roster
                      </span>
                    </div>
                    {renderAcknowledgmentPage(
                      previewDoc,
                      printMode === 'ACKNOWLEDGMENT_ONLY' ? 1 : 3,
                      totalDocPages
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          OFFSCREEN PRINT & EXPORT TARGET CONTAINER (#central-printable-document)
          Strictly mirrors the standard multi-page A4 sheets with CSS page breaks.
      ============================================================== */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none', width: '210mm', background: '#ffffff' }}>
        <div id="central-printable-document" ref={printableRef} className="bg-white text-slate-900 font-sans">
          {previewDoc && (
            <div>
              {/* PAGE 1: Policy Governance (if not ACK only) */}
              {printMode !== 'ACKNOWLEDGMENT_ONLY' && renderDocumentPage1(previewDoc, totalDocPages)}

              {/* PAGE 2: Directives & Approvals (if not ACK only) */}
              {printMode !== 'ACKNOWLEDGMENT_ONLY' && renderDocumentPage2(previewDoc, totalDocPages)}

              {/* PAGE 3: Employee Acknowledgment Sheet */}
              {(printMode === 'WITH_ACKNOWLEDGMENT' || printMode === 'ACKNOWLEDGMENT_ONLY') &&
                renderAcknowledgmentPage(
                  previewDoc,
                  printMode === 'ACKNOWLEDGMENT_ONLY' ? 1 : 3,
                  totalDocPages
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
