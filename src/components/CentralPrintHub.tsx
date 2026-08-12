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
  X
} from 'lucide-react';
import { Client, Employee, ServiceAgreement } from '../types';
import { printDocument } from '../utils/printUtils';

interface UnifiedPrintDoc {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Compile unified list of printable documents
  const allPrintableDocs = useMemo<UnifiedPrintDoc[]>(() => {
    const list: UnifiedPrintDoc[] = [];

    // Helper to test if policy is M-Policy-008 or M-Policy-019
    const isAckSupportedPolicy = (codeStr: string, titleStr: string) => {
      const c = (codeStr || '').toUpperCase().trim();
      const t = (titleStr || '').toLowerCase().trim();
      return (
        c.includes('M-POLICY-008') ||
        c.includes('M-POLICY-019') ||
        c.includes('POL-SEC-008') ||
        c.includes('POL-SEC-019') ||
        t.includes('acceptable usage') ||
        t.includes('clear desk')
      );
    };

    // 1. Policies
    policies.forEach(p => {
      const isClientPolicy = p.id.startsWith('POL-CLT-') || p.client_id === selectedClientId;
      if (selectedClientId !== 'ALL' && p.client_id && p.client_id !== selectedClientId && !isClientPolicy) {
        // filter out other client's policies
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
        facilityName: p.company_name || p.facility_name || activeClientObj?.company_name || 'SmartPro Facility',
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
        facilityName: activeClientObj?.company_name || 'SmartPro Facility',
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
        facilityName: activeClientObj?.company_name || 'SmartPro Facility',
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
    if (!existingCodes.has('M-POLICY-008')) {
      list.push({
        id: 'p_m_pol_008_synthesized',
        code: 'M-Policy-008',
        title: 'Acceptable Usage Policy',
        category: 'Information Security',
        docType: 'Policy',
        facilityName: activeClientObj?.company_name || 'SmartPro Facility',
        version: '1.0',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        content: `The objective of this Acceptable Usage Policy (M-Policy-008) is to define acceptable and prohibited uses of the facility's IT equipment, internet, email, mobile devices, and communications infrastructure, ensuring confidentiality, system integrity, and legal compliance.`,
        isAckSupported: true
      });
    }
    if (!existingCodes.has('M-POLICY-019')) {
      list.push({
        id: 'p_m_pol_019_synthesized',
        code: 'M-Policy-019',
        title: 'Clear Desk & Clear Screen Policy',
        category: 'Information Security',
        docType: 'Policy',
        facilityName: activeClientObj?.company_name || 'SmartPro Facility',
        version: '1.0',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        content: `The objective of this Clear Desk and Clear Screen Policy (M-Policy-019) is to reduce the risk of unauthorized access, loss of or damage to information assets during and outside normal working hours. All physical documents and removable media must be stored securely when unattended.`,
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

  // Priority Acknowledgment Policies (M-Policy-008 & M-Policy-019)
  const priorityAckPolicies = useMemo(() => {
    return allPrintableDocs.filter(d => 
      /M-Policy-008|POL-SEC-008/i.test(d.code) || 
      /M-Policy-019|POL-SEC-019/i.test(d.code) ||
      /acceptable usage/i.test(d.title) ||
      /clear desk/i.test(d.title)
    );
  }, [allPrintableDocs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  const handlePrintDoc = (doc: UnifiedPrintDoc, mode: 'STANDARD' | 'WITH_ACKNOWLEDGMENT' | 'ACKNOWLEDGMENT_ONLY') => {
    setPreviewDoc(doc);
    setPrintMode(mode);
    setIsPreviewModalOpen(true);

    // Give state time to reflect in printable DOM node then trigger print
    setTimeout(() => {
      printDocument('central-printable-document', {
        documentTitle: `${doc.code} - ${doc.title}`,
        orientation: 'portrait'
      });
      showToast(`✓ Dispatching print request for [${doc.code}] in ${mode.toLowerCase().replace('_', ' ')} format`);
    }, 150);
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
      // Print batch
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
    // Pad to at least 12 rows for physical pen signatures
    while (rows.length < 12) {
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
            <div className="h-9 border border-dashed border-slate-400 rounded bg-slate-50/50 flex items-center justify-center text-[10px] text-slate-400 italic">
              Physical Signature Here
            </div>
          </td>
        </tr>
      );
    });
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
              Centralized Print
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidated printing center to preview, filter, and print any policy, master index, SOP, or contract in clean A4 format. Includes physical Employee Document Acknowledgment signature collection sheets.
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
                  Physical Signature Ready
                </span>
              </h2>
              <p className="text-xs text-slate-600">
                Directly print client policies appended with an active employee acknowledgment roster sheet for physical pen signature collection.
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
                className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {pDoc.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {pDoc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Facility: <strong className="text-slate-700">{pDoc.facilityName}</strong>
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handlePrintDoc(pDoc, 'WITH_ACKNOWLEDGMENT')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Policy + Acknowledgment</span>
                  </button>
                  <button
                    onClick={() => handlePrintDoc(pDoc, 'ACKNOWLEDGMENT_ONLY')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-1.5"
                    title="Print standalone physical signature collection roster sheet only"
                  >
                    <Signature className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Signature Sheet Only</span>
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
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

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by doc code, title..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Batch Actions Bar */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectAll}
              className="font-bold text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300"
            >
              {selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0 ? 'Deselect All' : 'Select All Filtered'}</span>
            </button>

            <span className="text-slate-500 font-medium">
              Selected: <strong className="text-slate-900">{selectedDocIds.size}</strong> of {filteredDocs.length} documents
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatchPrint('STANDARD')}
              disabled={selectedDocIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Selected Batch</span>
            </button>
            <button
              onClick={() => handleBatchPrint('WITH_ACKNOWLEDGMENT')}
              disabled={selectedDocIds.size === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Signature className="w-3.5 h-3.5" />
              <span>Batch + Acknowledgment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Document Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3.5">Doc Code & Reference</th>
                <th className="p-3.5">Document Title</th>
                <th className="p-3.5">Category / Type</th>
                <th className="p-3.5">Facility Entity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Print Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800 font-medium">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, idx) => {
                  const isSelected = selectedDocIds.has(doc.id);
                  return (
                    <tr
                      key={doc.id || idx}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isSelected ? 'bg-blue-50/80 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-blue-900 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono text-[11px] border border-blue-200">
                          {doc.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <span>{doc.docType}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{doc.category}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {doc.facilityName}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handlePrintDoc(doc, 'STANDARD')}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-all text-[11px] inline-flex items-center space-x-1"
                          title="Print Document Only"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>

                        {doc.isAckSupported && (
                          <button
                            onClick={() => handlePrintDoc(doc, 'WITH_ACKNOWLEDGMENT')}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all text-[11px] inline-flex items-center space-x-1"
                            title="Print Policy with appended Employee Acknowledgment Signature Sheet"
                          >
                            <Signature className="w-3 h-3" />
                            <span>Print + Ack Sheet</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No documents matched your current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERACTIVE PRINT PREVIEW MODAL */}
      {isPreviewModalOpen && previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header Toolbar */}
            <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span>Print Dispatch Preview:</span>
                    <span className="font-mono text-blue-400 bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                      {previewDoc.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-md">
                    {previewDoc.title}
                  </p>
                </div>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setPrintMode('STANDARD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printMode === 'STANDARD'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Document Only
                </button>
                <button
                  onClick={() => setPrintMode('WITH_ACKNOWLEDGMENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printMode === 'WITH_ACKNOWLEDGMENT'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Doc + Ack Sheet
                </button>
                <button
                  onClick={() => setPrintMode('ACKNOWLEDGMENT_ONLY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printMode === 'ACKNOWLEDGMENT_ONLY'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Ack Sheet Only
                </button>
              </div>

              {/* Actions & Close */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    printDocument('central-printable-document', {
                      documentTitle: `${previewDoc.code} - ${previewDoc.title}`,
                      orientation: 'portrait'
                    });
                    showToast(`✓ Sent print command to system for [${previewDoc.code}]`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document Now</span>
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document On-Screen A4 Preview Box */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/80 flex justify-center">
              <div className="bg-white p-8 rounded-xl shadow-md border border-slate-300 w-full max-w-[210mm] text-slate-900 space-y-6">
                {/* PAGE 1+: DOCUMENT CONTENT */}
                {printMode !== 'ACKNOWLEDGMENT_ONLY' && (
                  <div className="space-y-6">
                    <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                          {previewDoc.facilityName}
                        </h1>
                        <p className="text-xs text-slate-600 font-bold">
                          SmartHub Compliance & Security Management System
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-700">
                        <p className="font-mono font-bold text-blue-900">{previewDoc.code}</p>
                        <p>Version: {previewDoc.version}</p>
                        <p>Date: {previewDoc.issueDate}</p>
                      </div>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 text-center space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                        OFFICIAL CONTROLLED DOCUMENT
                      </span>
                      <h2 className="text-lg font-black text-slate-900 uppercase">
                        {previewDoc.title}
                      </h2>
                    </div>

                    <table className="w-full text-xs border border-slate-300 rounded-lg">
                      <tbody>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <td className="p-2 font-bold text-slate-700 border-r border-slate-200 w-1/4">Document Ref:</td>
                          <td className="p-2 font-mono font-bold text-slate-900 w-1/4">{previewDoc.code}</td>
                          <td className="p-2 font-bold text-slate-700 border-r border-slate-200 border-l w-1/4">Category:</td>
                          <td className="p-2 text-slate-900 w-1/4">{previewDoc.category}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 font-bold text-slate-700 border-r border-slate-200">Facility Entity:</td>
                          <td className="p-2 text-slate-900">{previewDoc.facilityName}</td>
                          <td className="p-2 font-bold text-slate-700 border-r border-slate-200 border-l">Classification:</td>
                          <td className="p-2 text-slate-900">RESTRICTED / INTERNAL USE</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="text-xs leading-relaxed text-slate-800 space-y-4 pt-2">
                      {previewDoc.content ? (
                        <div
                          className="prose prose-xs max-w-none text-slate-900 space-y-3"
                          dangerouslySetInnerHTML={{ __html: previewDoc.content }}
                        />
                      ) : (
                        <p className="italic text-slate-500">
                          (This document represents the standard operational compliance policy for {previewDoc.facilityName}.)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ACKNOWLEDGMENT SIGNATURE SHEET */}
                {(printMode === 'WITH_ACKNOWLEDGMENT' || printMode === 'ACKNOWLEDGMENT_ONLY') && (
                  <div className="space-y-6 pt-6 border-t-2 border-indigo-200 mt-6">
                    <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                      <div>
                        <h1 className="text-lg font-black text-slate-900 uppercase">
                          {previewDoc.facilityName}
                        </h1>
                        <p className="text-[10px] text-slate-600 font-bold">
                          Department of Health Compliance & Policy Governance
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-slate-700">
                        <p className="font-mono font-bold text-indigo-900">{previewDoc.code} - ACK</p>
                        <p>Form Ref: ACK-SIG-2026</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border-2 border-indigo-900 p-3.5 rounded-xl text-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">
                        FORMAL STAFF COMPLIANCE & PHYSICAL SIGNATURE SHEET
                      </span>
                      <h2 className="text-base font-black text-slate-900 uppercase">
                        EMPLOYEE DOCUMENT ACKNOWLEDGMENT FORM
                      </h2>
                    </div>

                    {/* Policy Reference Details Box (AFTER HEADER AS REQUESTED) */}
                    <div className="bg-slate-50 border border-slate-400 rounded-xl p-3 text-xs space-y-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold text-slate-600">Policy Code / Reference:</span>{' '}
                          <strong className="text-indigo-900 font-mono text-sm">{previewDoc.code}</strong>
                        </div>
                        <div>
                          <span className="font-bold text-slate-600">Effective Version:</span>{' '}
                          <strong className="text-slate-900">{previewDoc.version}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold text-slate-600">Policy Document Title:</span>{' '}
                          <strong className="text-slate-900 text-sm">{previewDoc.title}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold text-slate-600">Facility Entity Name:</span>{' '}
                          <strong className="text-slate-900">{previewDoc.facilityName}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border-l-4 border-indigo-800 p-3 rounded text-[11px] leading-snug text-slate-800 italic">
                      "I hereby acknowledge and confirm that I have received, read, and fully understand the requirements set forth in the policy document referenced above (<strong>{previewDoc.code}: {previewDoc.title}</strong>). I agree to strictly adhere to all directives and security rules outlined therein. I understand that compliance is mandatory and non-adherence may result in formal disciplinary proceedings."
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-300 pb-1">
                        <span>Active Employee Signature Roster ({clientEmployees.length} Active Staff)</span>
                        <span className="text-[10px] text-slate-500 italic">Physical Wet Signature Required</span>
                      </div>

                      <table className="w-full border-collapse border border-slate-400 text-xs">
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-400">
                            <th className="p-2 border-r border-slate-400 text-center w-8">#</th>
                            <th className="p-2 border-r border-slate-400 text-left">Active Employee Name</th>
                            <th className="p-2 border-r border-slate-400 text-left">Designation / Role</th>
                            <th className="p-2 border-r border-slate-400 text-left">Department</th>
                            <th className="p-2 border-r border-slate-400 text-center w-28">Date Received</th>
                            <th className="p-2 text-center w-40">Manual Signature</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderSignatureRows()}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-slate-300">
                      <div className="space-y-6">
                        <p className="font-bold text-slate-800">Compliance Officer Verification:</p>
                        <div className="border-b border-slate-400 h-8"></div>
                        <p className="text-[10px] text-slate-500">Name, Signature & Stamp</p>
                      </div>
                      <div className="space-y-6">
                        <p className="font-bold text-slate-800">Facility Director Approval:</p>
                        <div className="border-b border-slate-400 h-8"></div>
                        <p className="text-[10px] text-slate-500">Name, Signature & Date</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFSCREEN PRINT TARGET CONTAINER (#central-printable-document) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none', width: '210mm', background: '#ffffff' }}>
        <div id="central-printable-document" ref={printableRef} className="p-6 bg-white text-slate-900 font-sans">
          {previewDoc && (
            <div className="space-y-6">
              {/* PAGE 1+: POLICY / DOCUMENT CONTENT (IF NOT ACKNOWLEDGMENT_ONLY) */}
              {printMode !== 'ACKNOWLEDGMENT_ONLY' && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {previewDoc.facilityName}
                      </h1>
                      <p className="text-xs text-slate-600 font-bold">
                        SmartHub Compliance & Security Management System
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-700">
                      <p className="font-mono font-bold text-blue-900">{previewDoc.code}</p>
                      <p>Version: {previewDoc.version}</p>
                      <p>Date: {previewDoc.issueDate}</p>
                    </div>
                  </div>

                  {/* Document Title Header */}
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                      OFFICIAL CONTROLLED DOCUMENT
                    </span>
                    <h2 className="text-lg font-black text-slate-900 uppercase">
                      {previewDoc.title}
                    </h2>
                  </div>

                  {/* Document Metadata Table */}
                  <table className="w-full text-xs border border-slate-300 rounded-lg">
                    <tbody>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200 w-1/4">Document Ref:</td>
                        <td className="p-2 font-mono font-bold text-slate-900 w-1/4">{previewDoc.code}</td>
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200 border-l w-1/4">Category:</td>
                        <td className="p-2 text-slate-900 w-1/4">{previewDoc.category}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200">Facility Entity:</td>
                        <td className="p-2 text-slate-900">{previewDoc.facilityName}</td>
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200 border-l">Classification:</td>
                        <td className="p-2 text-slate-900">RESTRICTED / INTERNAL USE</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Content Body */}
                  <div className="text-xs leading-relaxed text-slate-800 space-y-4 pt-2">
                    {previewDoc.content ? (
                      <div
                        className="prose prose-xs max-w-none text-slate-900 space-y-3"
                        dangerouslySetInnerHTML={{ __html: previewDoc.content }}
                      />
                    ) : (
                      <p className="italic text-slate-500">
                        (This document represents the standard operational compliance policy for {previewDoc.facilityName}.)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PAGE BREAK BEFORE ACKNOWLEDGMENT SHEET */}
              {(printMode === 'WITH_ACKNOWLEDGMENT' || printMode === 'ACKNOWLEDGMENT_ONLY') && (
                <div className="space-y-6 pt-6 page-break-before" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                  {/* Header Banner */}
                  <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                    <div>
                      <h1 className="text-lg font-black text-slate-900 uppercase">
                        {previewDoc.facilityName}
                      </h1>
                      <p className="text-[10px] text-slate-600 font-bold">
                        Department of Health Compliance & Policy Governance
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-700">
                      <p className="font-mono font-bold text-indigo-900">{previewDoc.code} - ACK</p>
                      <p>Form Ref: ACK-SIG-2026</p>
                    </div>
                  </div>

                  {/* Title Box */}
                  <div className="bg-indigo-50 border-2 border-indigo-900 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">
                      FORMAL STAFF COMPLIANCE & PHYSICAL SIGNATURE SHEET
                    </span>
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      EMPLOYEE DOCUMENT ACKNOWLEDGMENT FORM
                    </h2>
                  </div>

                  {/* Policy Reference Details Box (AFTER HEADER AS REQUESTED) */}
                  <div className="bg-slate-50 border border-slate-400 rounded-xl p-3 text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-bold text-slate-600">Policy Code / Reference:</span>{' '}
                        <strong className="text-indigo-900 font-mono">{previewDoc.code}</strong>
                      </div>
                      <div>
                        <span className="font-bold text-slate-600">Effective Version:</span>{' '}
                        <strong className="text-slate-900">{previewDoc.version}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-600">Policy Document Title:</span>{' '}
                        <strong className="text-slate-900">{previewDoc.title}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold text-slate-600">Facility Entity Name:</span>{' '}
                        <strong className="text-slate-900">{previewDoc.facilityName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Formal Acknowledgment Statement */}
                  <div className="bg-white border-l-4 border-indigo-800 p-3 rounded text-[11px] leading-snug text-slate-800 italic">
                    "I hereby acknowledge and confirm that I have received, read, and fully understand the requirements set forth in the policy document referenced above (<strong>{previewDoc.code}: {previewDoc.title}</strong>). I agree to strictly adhere to all directives and security rules outlined therein. I understand that compliance is mandatory and non-adherence may result in formal disciplinary proceedings."
                  </div>

                  {/* Active Employee Roster & Manual Physical Signature Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-300 pb-1">
                      <span>Active Employee Signature Roster ({clientEmployees.length} Active Staff)</span>
                      <span className="text-[10px] text-slate-500 italic">Physical Wet Signature Required</span>
                    </div>

                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-400">
                          <th className="p-2 border-r border-slate-400 text-center w-8">#</th>
                          <th className="p-2 border-r border-slate-400 text-left">Active Employee Name</th>
                          <th className="p-2 border-r border-slate-400 text-left">Designation / Role</th>
                          <th className="p-2 border-r border-slate-400 text-left">Department</th>
                          <th className="p-2 border-r border-slate-400 text-center w-28">Date Received</th>
                          <th className="p-2 text-center w-40">Manual Signature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderSignatureRows()}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Sign-off */}
                  <div className="pt-6 grid grid-cols-2 gap-8 text-xs border-t border-slate-300">
                    <div className="space-y-6">
                      <p className="font-bold text-slate-800">Compliance Officer Verification:</p>
                      <div className="border-b border-slate-400 h-8"></div>
                      <p className="text-[10px] text-slate-500">Name, Signature & Stamp</p>
                    </div>
                    <div className="space-y-6">
                      <p className="font-bold text-slate-800">Facility Director Approval:</p>
                      <div className="border-b border-slate-400 h-8"></div>
                      <p className="text-[10px] text-slate-500">Name, Signature & Date</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
