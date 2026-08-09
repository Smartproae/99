/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Printer, 
  BookOpen, 
  Filter, 
  Tag, 
  Building, 
  ArrowLeftRight,
  Sparkles,
  Download,
  Trash2,
  Database
} from 'lucide-react';
import { Policy, Client, ComplianceForm, DocumentItem, RiskItem, Asset, Incident, Audit, CorrectiveAction, User, AuditLog } from '../types';
import { getPolicyTemplateDefaults, getPolicyFullContent } from '../utils/policyDefaults';
import { printCurrentView, printHtmlInHiddenIframe } from '../utils/printUtils';

import { SmartTextRenderer } from './SmartTextRenderer';
import MasterIndexModule from './MasterIndexModule';

const DEFAULT_PREPARED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M5,20 Q15,5 25,18 T45,10 T65,22 T85,12 T95,15" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round"/></svg>`;
const DEFAULT_REVIEWED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M10,12 Q20,25 35,15 T60,22 T80,10 T90,25" fill="none" stroke="%231d4ed8" stroke-width="2" stroke-linecap="round"/></svg>`;
const DEFAULT_APPROVED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M5,15 C20,5 30,25 45,15 C60,5 75,25 90,15" fill="none" stroke="%231e40af" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const AUTOMATIC_POLICY_TEMPLATES = [
  { title: "Information Security High Level Policy", code: "POL-SEC-001", domain: "Information Security", dept: "Quality", doc_type: "Policy" },
  { title: "Human Resource Security Policy", code: "POL-SEC-002", domain: "Information Security", dept: "HR Department", doc_type: "Policy" },
  { title: "Information Asset Management and Classification Policy", code: "IT-POL-INFSEC-01", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Communications and Operations Security Policy", code: "POL-SEC-004", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Clear Desk and Clear Screen Policy", code: "POL-SEC-005", domain: "Information Security", dept: "Administration", doc_type: "Policy" },
  { title: "Access Control Policy", code: "POL-SEC-006", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Information Systems Acquisition Development and Maintenance", code: "POL-SEC-007", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Health Information and Security Policy", code: "POL-SEC-008", domain: "EHR Security", dept: "Clinical Operations", doc_type: "Policy" },
  { title: "Antivirus Policy", code: "POL-SEC-009", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Acceptable Usage Policy", code: "POL-SEC-010", domain: "Information Security", dept: "Administration", doc_type: "Policy" },
  { title: "Password Security Policy", code: "POL-SEC-011", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Third Party Security Policy", code: "POL-SEC-012", domain: "Information Security", dept: "Quality", doc_type: "Policy" },
  { title: "Physical & Environmental Security Policy", code: "POL-SEC-013", domain: "Information Security", dept: "Administration", doc_type: "Policy" },
  { title: "Data Retention and Disposal Policy", code: "POL-SEC-014", domain: "Patient Data Privacy", dept: "Quality", doc_type: "Policy" },
  { title: "Information Assets Disposal Policy & Procedure", code: "POL-SEC-015", domain: "Asset Management", dept: "IT Department", doc_type: "Procedure" },
  { title: "Information Systems Continuity Policy", code: "POL-SEC-016", domain: "Business Continuity", dept: "IT Department", doc_type: "Policy" },
  { title: "Security Baseline Policy", code: "POL-SEC-017", domain: "Information Security", dept: "Quality", doc_type: "Policy" },
  { title: "Vulnerability Management Policy Process", code: "POL-SEC-018", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Change Management Plan and Procedure", code: "POL-SEC-019", domain: "Clinical Quality Operations", dept: "Quality", doc_type: "Procedure" },
  { title: "Patch Management Policy and Procedure", code: "POL-SEC-020", domain: "Information Security", dept: "IT Department", doc_type: "Procedure" },
  { title: "Information Data Backup Restoration Policy", code: "POL-SEC-021", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Removable Media Management Policy and Procedures", code: "POL-SEC-022", domain: "Information Security", dept: "IT Department", doc_type: "Procedure" },
  { title: "Information Exchange Policies and Procedures", code: "POL-SEC-023", domain: "Information Security", dept: "IT Department", doc_type: "Procedure" },
  { title: "Risk Management Policy and Procedures", code: "POL-SEC-024", domain: "Information Security", dept: "Quality", doc_type: "Procedure" },
  { title: "Information Security Incidents Management Policy", code: "POL-SEC-025", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Information Security Incident Management Procedure", code: "POL-SEC-026", domain: "Information Security", dept: "IT Department", doc_type: "Procedure" },
  { title: "BYOD (Bring Your Own Device) Policy", code: "POL-SEC-027", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Disciplinary Policy and Procedure", code: "POL-SEC-028", domain: "Information Security", dept: "HR Department", doc_type: "Procedure" },
  { title: "Cloud Security Policy", code: "POL-SEC-029", domain: "Information Security", dept: "IT Department", doc_type: "Policy" },
  { title: "Data Privacy Policy", code: "POL-SEC-030", domain: "Patient Data Privacy", dept: "Quality", doc_type: "Policy" },
  { title: "Procedure for Control of Documentation", code: "POL-SEC-031", domain: "Clinical Quality Operations", dept: "Quality", doc_type: "Procedure" },
  { title: "Statement of Applicability", code: "M-Policy-002", domain: "Information Security", dept: "Quality", doc_type: "Policy" }
];

interface PolicyProcedureViewProps {
  policies: Policy[];
  forms?: ComplianceForm[];
  documents?: DocumentItem[];
  risks?: RiskItem[];
  assets?: Asset[];
  incidents?: Incident[];
  audits?: Audit[];
  actions?: CorrectiveAction[];
  client: Client;
  activeClientId: string;
  currentUser?: User;
  auditLogs?: AuditLog[];
  onDeletePolicy?: (id: string) => void;
  onUpdatePolicy?: (updatedPolicy: Policy) => void;
  onAddPolicy?: (policy: Policy) => void;
  onBulkFeedPolicies?: (policies: Policy[]) => void;
  onUpdateForm?: (form: ComplianceForm) => void;
  onAddForm?: (form: ComplianceForm) => void;
  onDeleteForm?: (id: string) => void;
  onAddDocument?: (doc: DocumentItem) => void;
  onUpdateClient?: (client: Client) => void;
  onNavigateTab?: (tabId: string) => void;
  logAuditTrail?: (module: string, action: string, payload: any) => void;
}

export default function PolicyProcedureView({ 
  policies = [], 
  forms = [],
  documents = [],
  risks = [],
  assets = [],
  incidents = [],
  audits = [],
  actions = [],
  client, 
  activeClientId,
  currentUser,
  auditLogs = [],
  onDeletePolicy,
  onUpdatePolicy,
  onAddPolicy,
  onBulkFeedPolicies,
  onUpdateForm,
  onAddForm,
  onDeleteForm,
  onAddDocument,
  onUpdateClient,
  onNavigateTab,
  logAuditTrail
}: PolicyProcedureViewProps) {
  const [mainMode, setMainMode] = useState<'MASTER_INDEX' | 'A4_PRINTOUTS'>('MASTER_INDEX');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const replaceEntityName = (text: any) => {
    if (typeof text !== 'string') return '';
    const facName = client?.company_name || 'the facility';
    return text
      .split('[Entity Name]').join(facName)
      .split('(client.company_name) ').join(`${facName} `)
      .split('(client.company_name)').join(facName)
      .split('client.company_name').join(facName);
  };

  // Filter policies belonging to current client
  const clientPolicies = policies.filter(p => p.client_id === activeClientId);

  // Categories list
  const categories = ['All', ...Array.from(new Set(clientPolicies.map(p => p.category)))];
  
  // Filter search
  const filteredPolicies = clientPolicies.filter(p => {
    const matchesSearch = p.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.policy_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesClass = selectedClassification === 'All' || p.classification === selectedClassification;
    return matchesSearch && matchesCategory && matchesClass;
  });

  const handlePrintDocument = (policyId: string) => {
    const printContent = document.getElementById(`a4-print-sheet-${policyId}`);
    if (!printContent) return;
    
    let stylesHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      stylesHtml += el.outerHTML;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document - ${policyId}</title>
          ${stylesHtml}
          <style>
            @media print {
              body {
                background-color: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: 'Inter', sans-serif;
              background-color: #f8fafc;
              padding: 20px;
              display: flex;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <div style="width: 210mm; min-height: 297mm; background: white; padding: 20mm; box-shadow: none; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between;">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printHtmlInHiddenIframe(printHtml);
  };

  const handlePrintAll = () => {
    let allHtml = '';
    filteredPolicies.forEach((policy) => {
      const el = document.getElementById(`a4-print-sheet-${policy.id}`);
      if (el) {
        allHtml += `
          <div style="width: 210mm; min-height: 297mm; background: white; padding: 20mm; box-shadow: none; border: none; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; margin: 0 auto 20px auto;">
            ${el.innerHTML}
          </div>
        `;
      }
    });

    if (!allHtml) {
      printCurrentView({ printableId: 'printable-report-document' });
      return;
    }

    let stylesHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      stylesHtml += el.outerHTML;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print All Saved Policies</title>
          ${stylesHtml}
          <style>
            @media print {
              body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              div {
                box-shadow: none !important;
                border: none !important;
                page-break-after: always;
              }
              div:last-child {
                page-break-after: avoid;
              }
            }
            body {
              font-family: 'Inter', sans-serif;
              background-color: #f1f5f9;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${allHtml}
        </body>
      </html>
    `;

    printHtmlInHiddenIframe(printHtml);
  };


  return (
    <div id="policy-procedure-full-view" className="space-y-6">
      {/* Top Main Mode Switcher Bar */}
      <div className="bg-slate-900 p-2 rounded-2xl flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainMode('MASTER_INDEX')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              mainMode === 'MASTER_INDEX'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> Policy & Procedure Master Index
          </button>

          <button
            type="button"
            onClick={() => setMainMode('A4_PRINTOUTS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              mainMode === 'A4_PRINTOUTS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" /> A4 Regulatory Printable Sheets ({clientPolicies.length})
          </button>
        </div>

        <span className="hidden md:inline-block text-[11px] font-mono text-emerald-400 font-bold px-3">
          ORGANIZATIONAL DOCUMENT CONTROL HUB
        </span>
      </div>

      {/* MODE 1: MASTER INDEX CONTROL MODULE */}
      {mainMode === 'MASTER_INDEX' && (
        <MasterIndexModule
          policies={policies}
          forms={forms}
          documents={documents}
          risks={risks}
          assets={assets}
          incidents={incidents}
          audits={audits}
          actions={actions}
          client={client}
          activeClientId={activeClientId}
          currentUser={currentUser}
          auditLogs={auditLogs}
          onUpdatePolicy={onUpdatePolicy}
          onAddPolicy={onAddPolicy}
          onDeletePolicy={onDeletePolicy}
          onUpdateForm={onUpdateForm}
          onAddForm={onAddForm}
          onDeleteForm={onDeleteForm}
          onAddDocument={onAddDocument}
          onUpdateClient={onUpdateClient}
          onNavigateTab={onNavigateTab}
          logAuditTrail={logAuditTrail}
        />
      )}

      {/* MODE 2: A4 PRINTABLE SHEETS VIEW */}
      {mainMode === 'A4_PRINTOUTS' && (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">A4 Regulatory Policy Printouts</h1>
              <p className="text-xs text-slate-500 mt-1">
                Browse and review formal corporate compliance guidelines formatted as official regulatory printouts.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              {onBulkFeedPolicies && (
                <button
                  type="button"
                  onClick={() => {
                    const newPolicies: Policy[] = AUTOMATIC_POLICY_TEMPLATES.map((tpl, i) => {
                      const nextYear = new Date();
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      return {
                        id: `bulk-${tpl.code}-${activeClientId}-${Date.now()}-${i}`,
                        client_id: activeClientId,
                        policy_no: tpl.code,
                        policy_name: tpl.title,
                        version: '1.0',
                        review_date: new Date().toISOString().split('T')[0],
                        status: 'DRAFT',
                        category: tpl.domain,
                        created_at: new Date().toISOString(),
                        department: tpl.dept,
                        document_type: tpl.doc_type as any,
                        classification: 'Confidential',
                        issue_date: new Date().toISOString().split('T')[0],
                        next_due_date: nextYear.toISOString().split('T')[0],
                        approval_date: nextYear.toISOString().split('T')[0],
                        prepared_by_name: 'Sarah Jenkins',
                        prepared_by_designation: 'Information Security Officer',
                        prepared_by_sign: DEFAULT_PREPARED_SIGN,
                        reviewed_by_name: 'Tareq Al Mansoori',
                        reviewed_by_designation: 'Senior Compliance Consultant',
                        reviewed_by_sign: DEFAULT_REVIEWED_SIGN,
                        approved_by_name: 'Dr. Johnathan Carter',
                        approved_by_designation: 'Chief Medical Officer',
                        approved_by_sign: DEFAULT_APPROVED_SIGN,
                      };
                    });
                    onBulkFeedPolicies(newPolicies);
                  }}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
                  title="Populate all 32 UAE standard healthcare policy drafts instantly"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Auto-draft 32 Policies
                </button>
              )}

              {filteredPolicies.length > 0 && (
                <button
                  onClick={handlePrintAll}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Print All Listed ({filteredPolicies.length})
                </button>
              )}
            </div>
          </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by code, title or scope..."
              className="w-full text-xs bg-transparent focus:outline-none text-slate-700"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-48 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none text-slate-600 font-medium"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Classification Dropdown */}
          <div className="w-full md:w-48 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassification}
              onChange={e => setSelectedClassification(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none text-slate-600 font-medium"
            >
              <option value="All">All Classifications</option>
              <option value="Confidential">Confidential</option>
              <option value="Restricted">Restricted</option>
              <option value="Secret">Secret</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies List in A4 Standard */}
      <div className="space-y-12">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => {
            const defaults = getPolicyTemplateDefaults(policy.policy_no || '', client?.company_name);
            return (
              <div key={policy.id} className="bg-slate-200/40 p-6 rounded-2xl border border-slate-300/40 space-y-4">
              
              {/* Header card action bar */}
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-slate-800">{policy.policy_no}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-semibold text-slate-600">{policy.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintDocument(policy.id)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border border-slate-200"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Print A4 Page
                  </button>
                  {onDeletePolicy && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(policy.id)}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      Delete Policy
                    </button>
                  )}
                </div>
              </div>

              {/* A4 Document Visual Container */}
              <div 
                id={`a4-print-sheet-${policy.id}`} 
                className="bg-white border border-slate-300 shadow-lg p-8 md:p-12 max-w-2xl mx-auto space-y-8 relative font-sans text-slate-800 min-h-[842px] flex flex-col justify-between rounded-sm"
              >
                {/* Header based on client logo placement choice & display mode */}
                <div>
                  {(() => {
                    const displayMode = client?.header_display_mode || 'BOTH';
                    const placement = client?.logo_placement || 'LEFT';
                    const showLogo = displayMode !== 'TEXT_ONLY';
                    const showText = displayMode !== 'LOGO_ONLY';

                    if (placement === 'LEFT') {
                      return (
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 text-left">
                          {showLogo ? (
                            <div className="w-20 h-20 p-1 flex items-center justify-center border border-slate-100 bg-white shrink-0">
                              <img src={client?.facility_logo || DEFAULT_PREPARED_SIGN} className="max-w-full max-h-full object-contain" alt="Facility Logo" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="shrink-0" />
                          )}
                          <div className="text-right pl-4">
                            {showText && (
                              <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide mb-0.5">{client?.company_name || 'Healthcare Facility'}</h2>
                            )}
                          </div>
                        </div>
                      );
                    } else if (placement === 'RIGHT') {
                      return (
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                          <div className="text-left pr-4">
                            {showText && (
                              <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide mb-0.5">{client?.company_name || 'Healthcare Facility'}</h2>
                            )}
                          </div>
                          {showLogo ? (
                            <div className="w-20 h-20 p-1 flex items-center justify-center border border-slate-100 bg-white shrink-0">
                              <img src={client?.facility_logo || DEFAULT_PREPARED_SIGN} className="max-w-full max-h-full object-contain" alt="Facility Logo" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="shrink-0" />
                          )}
                        </div>
                      );
                    } else { // FULL (Centered)
                      return (
                        <div className="space-y-3 border-b-2 border-slate-900 pb-4 text-center">
                          {showLogo && (
                            <div className="w-full h-16 p-1 flex items-center justify-center bg-white">
                              <img src={client?.facility_logo || DEFAULT_PREPARED_SIGN} className="max-h-full object-contain w-auto max-w-[280px]" alt="Facility Logo Banner" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div>
                            {showText && (
                              <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide mb-0.5">{client?.company_name || 'Healthcare Facility'}</h2>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })()}

                  {/* Document Control Information Block displaying all 14 metadata fields */}
                  <div className="mt-3 border border-slate-300 rounded overflow-hidden text-[10px]">
                    {/* Row 1: Code, Title, Department, Type */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/80 border-b border-slate-300">
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Document Code</span>
                        <strong className="font-mono text-[10px] text-emerald-800 font-bold">{policy.policy_no}</strong>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Document Title</span>
                        <strong className="text-[10px] text-slate-900 font-bold line-clamp-1">{replaceEntityName(policy.policy_name)}</strong>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Department</span>
                        <strong className="text-[10px] text-slate-800 font-bold">{policy.department || 'Quality / Administration'}</strong>
                      </div>
                      <div className="py-1 px-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Document Type</span>
                        <strong className="text-[10px] text-emerald-800 font-bold">{policy.type || 'Procedure'}</strong>
                      </div>
                    </div>

                    {/* Row 2: Version, Classification, Approval Date, Effective Date */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/80 border-b border-slate-300">
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Version</span>
                        <strong className="font-mono text-[10px] text-slate-800 font-bold">V{policy.version || '1.0'}</strong>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Classification</span>
                        <span className="inline-block px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                          {policy.classification || 'Confidential'}
                        </span>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Approval Date</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{policy.approval_date || policy.issue_date || 'DD-MM-YYYY'}</span>
                      </div>
                      <div className="py-1 px-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Effective Date</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{policy.effective_date || policy.issue_date || 'DD-MM-YYYY'}</span>
                      </div>
                    </div>

                    {/* Row 3: Revision Date, Next Review Date, Review Frequency, Retention Period */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/80 border-b border-slate-300">
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Revision Date</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{policy.revision_date || policy.review_date || 'DD-MM-YYYY'}</span>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Next Review Date</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700">{policy.next_due_date || policy.next_review_date || 'DD-MM-YYYY'}</span>
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Review Frequency</span>
                        <span className="text-[9.5px] font-bold text-slate-800">{policy.review_frequency || 'Annually or upon regulatory change'}</span>
                      </div>
                      <div className="py-1 px-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Retention Period</span>
                        <span className="text-[9.5px] font-bold text-slate-800">{policy.retention_period || 'As per UAE legal requirements'}</span>
                      </div>
                    </div>

                    {/* Row 4: Document Owner, Approved By, Notice */}
                    <div className="grid grid-cols-2 md:grid-cols-2 bg-white p-2">
                      <div className="border-r border-slate-200 pr-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Document Owner</span>
                        <strong className="text-[10px] text-slate-900 font-bold">{policy.owner || policy.author || 'Quality Manager'}</strong>
                      </div>
                      <div className="pl-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Approved By</span>
                        <strong className="text-[10px] text-slate-900 font-bold">{policy.approved_by || 'Managing Director'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Body Content simulation */}
                <div className="py-4 px-2 space-y-4 bg-white text-slate-800">
                  <div className="space-y-6">
                    {(() => {
                      const contentToRender = getPolicyFullContent(policy, client?.company_name || 'the facility');
                      return (
                        <SmartTextRenderer 
                          text={replaceEntityName(contentToRender)}
                          fontSize="normal"
                          themeColor="emerald"
                        />
                      );
                    })()}
                    {false ? (<>

                    {policy.layout_format === 'table' ? (
                      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs bg-white text-slate-800 text-[11px] font-sans">
                        <div className="bg-emerald-800 text-white p-3 font-bold text-center uppercase tracking-wider text-[10px]">
                          Regulatory Control & Policy Mapping Grid
                        </div>
                        <table className="w-full border-collapse">
                          <tbody>
                            {/* 1.0 OBJECTIVES & SCOPE */}
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <td colSpan={2} className="p-2 font-extrabold text-emerald-950 uppercase tracking-wide text-[9px]">
                                1.0 Policy Objectives & Core Scope
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                1.1 Objective Statement
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.objective || defaults.objective)} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                1.2 Audited Scope Bounds
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.scope || defaults.scope)} />
                              </td>
                            </tr>

                            {/* 2.0 RESPONSIBILITIES */}
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <td colSpan={2} className="p-2 font-extrabold text-emerald-950 uppercase tracking-wide text-[9px]">
                                2.0 Assigned Responsibilities & Roles
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                2.1 IT Manager / Department Leads
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_it_manager || defaults.resp_it_manager)} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                2.2 Managing Director / Manager
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_md || defaults.resp_md)} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                2.3 All Users & General Staff
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_all_users || defaults.resp_all_users)} />
                              </td>
                            </tr>

                            {/* 3.0 POLICY IN DETAIL */}
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <td colSpan={2} className="p-2 font-extrabold text-emerald-950 uppercase tracking-wide text-[9px]">
                                3.0 Detailed Policy & Core Directives
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                3.1 Mandate Statement
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(
                                  (policy.policy_no === 'POL-SEC-019' && (!policy.policy_statement || !policy.policy_statement.includes('| Change Type |')))
                                    ? defaults.policy_statement
                                    : (policy.policy_statement || defaults.policy_statement)
                                )} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                3.2 Core Principles
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.core_principles || defaults.core_principles)} />
                              </td>
                            </tr>

                            {/* 4.0 COMPLIANCE & EXCEPTIONS */}
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <td colSpan={2} className="p-2 font-extrabold text-emerald-950 uppercase tracking-wide text-[9px]">
                                4.0 Policy Compliance, Penalties & Exceptions
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                4.1 Disciplinary Action / Penalties
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_disciplinary || defaults.compliance_disciplinary)} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                4.2 Contact for Clarifications
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_clarifications || defaults.compliance_clarifications)} />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                4.3 Compliance Checks Authority
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_checks || defaults.compliance_checks)} />
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-700 bg-slate-50/50 w-44 align-top border-r border-slate-200">
                                4.4 Exceptions Criteria
                              </td>
                              <td className="p-2.5 text-slate-700 align-top">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_exceptions || defaults.compliance_exceptions)} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* OBJECTIVE */}
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1">OBJECTIVE</h4>
                          <div className="mt-1">
                            <SmartTextRenderer text={replaceEntityName(policy.objective || defaults.objective)} />
                          </div>
                        </div>

                        {/* SCOPE */}
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1">SCOPE</h4>
                          <div className="mt-1">
                            <SmartTextRenderer text={replaceEntityName(policy.scope || defaults.scope)} />
                          </div>
                        </div>

                        {/* RESPONSIBILITIES */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1">RESPONSIBILITIES</h4>
                          
                          <div className="space-y-3 pl-1">
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block font-sans">IT Manager / Department Leads:</span>
                              <div className="pl-3 mt-1">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_it_manager || defaults.resp_it_manager)} />
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block font-sans">Managing Director / Manager & Owners:</span>
                              <div className="pl-3 mt-1">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_md || defaults.resp_md)} />
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block font-sans">All Users / Employees:</span>
                              <div className="pl-3 mt-1">
                                <SmartTextRenderer text={replaceEntityName(policy.resp_all_users || defaults.resp_all_users)} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* POLICY IN DETAIL */}
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1">POLICY IN DETAIL</h4>
                          
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-700 block font-sans">Policy Statement:</span>
                            <div className="mt-1">
                              <SmartTextRenderer text={replaceEntityName(
                                (policy.policy_no === 'POL-SEC-019' && (!policy.policy_statement || !policy.policy_statement.includes('| Change Type |')))
                                  ? defaults.policy_statement
                                  : (policy.policy_statement || defaults.policy_statement)
                              )} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-700 block font-sans font-semibold">CORE PRINCIPLES:</span>
                            <div className="mt-1">
                              <SmartTextRenderer text={replaceEntityName(policy.core_principles || defaults.core_principles)} />
                            </div>
                          </div>
                        </div>

                        {/* POLICY COMPLIANCE */}
                        <div className="space-y-3">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1">POLICY COMPLIANCE</h4>
                          
                          <div className="space-y-2.5 text-[11px] text-slate-700 pl-1 font-sans">
                            <div>
                              <strong className="text-[10px] text-slate-700 block font-sans">Disciplinary Action:</strong>
                              <div className="mt-0.5">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_disciplinary || defaults.compliance_disciplinary)} />
                              </div>
                            </div>
                            <div>
                              <strong className="text-[10px] text-slate-700 block font-sans">Clarifications:</strong>
                              <div className="mt-0.5">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_clarifications || defaults.compliance_clarifications)} />
                              </div>
                            </div>
                            <div>
                              <strong className="text-[10px] text-slate-700 block font-sans">Compliance Checks:</strong>
                              <div className="mt-0.5">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_checks || defaults.compliance_checks)} />
                              </div>
                            </div>
                            <div>
                              <strong className="text-[10px] text-slate-700 block font-sans">Exceptions:</strong>
                              <div className="mt-0.5">
                                <SmartTextRenderer text={replaceEntityName(policy.compliance_exceptions || defaults.compliance_exceptions)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </> ) : null}
                  </div>
                </div>

                {/* Governance Sign-off & Seal Block */}
                <div className="space-y-3 relative">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-200 pb-1.5">
                    Document Sign-off Team (Prepared, Reviewed & Approved)
                  </span>
                  
                  <div className={`grid gap-3 pt-1.5 relative ${policy.show_reviewed_by !== false ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {/* Prepared By */}
                    <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[120px]">
                      <div>
                        <span className="text-[8px] font-bold text-emerald-800 uppercase block">Prepared</span>
                        <strong className="text-[10px] text-slate-900 block mt-1 leading-tight">{policy.prepared_by_name || 'Sarah Jenkins'}</strong>
                        <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">{policy.prepared_by_designation || 'Compliance Officer'}</span>
                      </div>
                      <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1">
                        {policy.prepared_by_sign === 'BLANK' ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                            <div className="w-full border-b border-slate-300 border-dashed mt-2 mb-1"></div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN HERE</span>
                          </div>
                        ) : (
                          <img 
                            src={policy.prepared_by_sign || DEFAULT_PREPARED_SIGN} 
                            className="max-h-full max-w-full object-contain" 
                            alt="Author Signature" 
                            referrerPolicy="no-referrer" 
                          />
                        )}
                      </div>
                    </div>

                    {/* Reviewed By */}
                    {policy.show_reviewed_by !== false && (
                      <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[120px]">
                        <div>
                          <span className="text-[8px] font-bold text-amber-800 uppercase block">Reviewed</span>
                          <strong className="text-[10px] text-slate-900 block mt-1 leading-tight">{policy.reviewed_by_name || 'Tareq Al Mansoori'}</strong>
                          <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">{policy.reviewed_by_designation || 'Senior Consultant'}</span>
                        </div>
                        <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1">
                          {policy.reviewed_by_sign === 'BLANK' ? (
                            <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                              <div className="w-full border-b border-slate-300 border-dashed mt-2 mb-1"></div>
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN HERE</span>
                            </div>
                          ) : (
                            <img 
                              src={policy.reviewed_by_sign || DEFAULT_REVIEWED_SIGN} 
                              className="max-h-full max-w-full object-contain" 
                              alt="Reviewer Signature" 
                              referrerPolicy="no-referrer" 
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approved By */}
                    <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[120px] relative">
                      <div>
                        <span className="text-[8px] font-bold text-blue-800 uppercase block">Approved</span>
                        <strong className="text-[10px] text-slate-900 block mt-1 leading-tight">{policy.approved_by_name || 'Dr. Johnathan Carter'}</strong>
                        <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">{policy.approved_by_designation || 'Managing Director'}</span>
                      </div>
                      <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1 relative">
                        {policy.approved_by_sign === 'BLANK' ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                            <div className="w-full border-b border-slate-300 border-dashed mt-2 mb-1"></div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN HERE</span>
                          </div>
                        ) : (
                          <img 
                            src={policy.approved_by_sign || DEFAULT_APPROVED_SIGN} 
                            className="max-h-full max-w-full object-contain" 
                            alt="Approver Signature" 
                            referrerPolicy="no-referrer" 
                          />
                        )}
                        
                        {/* 4.5 cm Cross indicator near signature */}
                        <div className="absolute right-0 top-0 text-red-500 font-extrabold text-[15px] opacity-75 select-none pointer-events-none" title="Approval Cross Sign">
                          ❌
                        </div>
                      </div>
                    </div>

                    {/* Facility Stamp Overlay (4.5cm Cross mark placed elegantly near Approved by block) */}
                    {client?.facility_stamp ? (
                      <div className="absolute -right-6 -bottom-10 w-36 h-36 pointer-events-none -rotate-12 select-none opacity-85 transition-all z-10" title="Official Facility Stamp Seal (4.5 cm)">
                        <img 
                          src={client.facility_stamp} 
                          className="w-full h-full object-contain" 
                          alt="Seal" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ) : (
                      // Fallback elegant physical stamp rendering
                      <div className="absolute right-[-10px] bottom-[-20px] w-28 h-28 pointer-events-none -rotate-12 select-none opacity-80 z-10 border-4 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 font-bold p-1">
                        <span className="text-[7px] leading-tight text-center font-mono uppercase">{client?.company_name || 'FACILITY SEAL'}</span>
                        <span className="text-[14px] leading-none my-0.5">❌</span>
                        <span className="text-[6px] uppercase tracking-widest">APPROVED BY CEO</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Centered Small Footer displaying Facility Info & REQUIRED "Page 1/1" */}
                <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-400 font-semibold flex items-center justify-between mt-auto">
                  <div className="flex flex-col gap-0.5 text-left">
                    <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                      COMPLIANCE CONTROL SHEET
                    </div>
                    <div className="flex items-center gap-1 flex-wrap text-left text-[8px] text-slate-400 font-semibold">
                      <span>TEL: {client?.phone || '+971 2 666 4444'}</span>
                      <span>•</span>
                      <span className="uppercase">EMAIL: {client?.owner_email || client?.email || 'compliance@facility.ae'}</span>
                      <span>•</span>
                      <span className="uppercase">ADDR: {client?.address || 'Abu Dhabi'}, UAE</span>
                    </div>
                  </div>
                  
                  {/* Page 1/1 Indicator */}
                  <div className="font-mono text-[9px] text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    Page 1/1
                  </div>
                </div>

              </div>

            </div>
          ); })
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">No Policy & Procedure Documents Available</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No compliance policies have been created yet under this client context. Switch to the "Policy Frameworks setup" tab to draft and save policies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Policy Deletion Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Compliance Policy?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">
                {policies.find(p => p.id === confirmDeleteId)?.policy_name} ({policies.find(p => p.id === confirmDeleteId)?.policy_no})
              </strong>? This will permanently remove this compliance policy standard from this client's registry. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel, Keep Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePolicy) {
                    onDeletePolicy(confirmDeleteId);
                  }
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Yes, Delete Policy
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
