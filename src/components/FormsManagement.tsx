/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ComplianceForm, Client, Employee } from '../types';
import * as XLSX from 'xlsx';
import { printCurrentView } from '../utils/printUtils';
import BTATierSelector from './BTATierSelector';
import { saveCustomGroupAssignment, FrameworkGroupTier } from '../utils/frameworkGroupUtils';
import {
  FileText,
  Plus,
  ShieldCheck,
  Download,
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Printer,
  Edit3,
  Search,
  Filter,
  Trash2,
  Lock,
  UserPlus,
  UserMinus,
  FileCheck,
  RefreshCw,
  Sliders,
  Building2,
  Layers,
  Eye,
  CheckSquare,
  X,
  Clock,
  Sparkles,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface FormsManagementProps {
  forms: ComplianceForm[];
  onAddForm: (form: ComplianceForm) => void;
  onUpdateForm?: (form: ComplianceForm) => void;
  onDeleteForm?: (id: string) => void;
  activeClientId: string;
  client?: Client | null;
  employees?: Employee[];
}

export interface FormSubmissionRecord {
  id: string;
  form_id: string;
  form_type: string;
  doc_ref: string;
  form_name: string;
  client_id: string;
  employee_name: string;
  employee_id?: string;
  department?: string;
  submitted_by: string;
  submission_date: string;
  status: 'APPROVED' | 'PENDING' | 'UNDER_REVIEW';
  data: Record<string, any>;
}

export default function FormsManagement({
  forms,
  onAddForm,
  onUpdateForm,
  onDeleteForm,
  activeClientId,
  client,
  employees = []
}: FormsManagementProps) {
  // Navigation Tabs: 'INDEX' | 'FILL' | 'PRINT_PREVIEW' | 'SUBMISSIONS'
  const [activeSubTab, setActiveSubTab] = useState<'INDEX' | 'FILL' | 'PRINT_PREVIEW' | 'SUBMISSIONS'>('INDEX');

  // Active form selected for filling or preview
  const [selectedFormId, setSelectedFormId] = useState<string | null>('fm1');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionRecord | null>(null);

  // Filters for Master Index Sheet
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [classificationFilter, setClassificationFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Metadata Editing Modal State
  const [editingForm, setEditingForm] = useState<ComplianceForm | null>(null);

  // New Form Template Modal State
  const [isAddingNewForm, setIsAddingNewForm] = useState(false);
  const [newFormState, setNewFormState] = useState<{
    doc_ref: string;
    form_name: string;
    form_type: string;
    category: string;
    issue_date: string;
    expiry_date: string;
    version: string;
    classification: string;
    prepared_by: string;
    approved_by: string;
    description: string;
    framework_group: FrameworkGroupTier;
  }>({
    doc_ref: `FORM-HR-NEW-${Math.floor(100 + Math.random() * 900)}`,
    form_name: '',
    form_type: 'Onboarding Form',
    category: 'Onboarding',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 3 * 365 * 86400000).toISOString().split('T')[0],
    version: 'v1.0',
    classification: 'CONFIDENTIAL',
    prepared_by: 'HR & Compliance Desk',
    approved_by: 'Medical Director',
    description: '',
    framework_group: 'Basic'
  });

  // Global Header/Footer Format Configuration for Document Index & Printable Sheets
  const [headerFooterConfig, setHeaderFooterConfig] = useState({
    showLogo: true,
    showStamp: true,
    showFooterAddress: true,
    customFooterText: 'CONFIDENTIAL HEALTHCARE COMPLIANCE DOCUMENT - REGULATORY USE ONLY',
    headerDisplayMode: 'BOTH' as 'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY'
  });

  // Form Submissions Log (Local State)
  const [submissions, setSubmissions] = useState<FormSubmissionRecord[]>([
    {
      id: 'sub-1',
      form_id: 'fm1',
      form_type: 'Confidentiality/NDA Form',
      doc_ref: 'FORM-ONB-NDA-001',
      form_name: 'Employee Confidentiality & Non-Disclosure Agreement (NDA)',
      client_id: activeClientId,
      employee_name: 'Dr. Johnathan Carter',
      employee_id: 'EMP-1029',
      department: 'Clinical Operations',
      submitted_by: 'Dr. Johnathan Carter',
      submission_date: '2026-05-10',
      status: 'APPROVED',
      data: {
        civil_id: '784-1988-1234567-1',
        joining_date: '2026-05-01',
        nda_agreed: true,
        malaffi_acknowledged: true,
        witness_name: 'Sarah Jenkins (HR)',
        signature_date: '2026-05-10'
      }
    },
    {
      id: 'sub-2',
      form_id: 'fm3',
      form_type: 'User Creation Form',
      doc_ref: 'FORM-IT-USR-003',
      form_name: 'IT User Account Creation & Access Rights Provisioning Request',
      client_id: activeClientId,
      employee_name: 'Dr. Fatima Al Nuaimi',
      employee_id: 'EMP-1044',
      department: 'Radiology',
      submitted_by: 'IT Operations',
      submission_date: '2026-06-12',
      status: 'APPROVED',
      data: {
        email_requested: 'fatima.nuaimi@facility.ae',
        systems_requested: ['EMR / Malaffi', 'RIS / PACS Imaging', 'Windows Domain'],
        privilege_level: 'Clinical Staff',
        mfa_enabled: true,
        approved_by_it: 'Aseef Sulaiman (IT Lead)'
      }
    },
    {
      id: 'sub-3',
      form_id: 'fm6',
      form_type: 'Staff Clearance Form',
      doc_ref: 'FORM-OFF-CLR-006',
      form_name: 'Staff Exit Clearance & Asset Handover Sign-Off Form',
      client_id: activeClientId,
      employee_name: 'Elena Rostova',
      employee_id: 'EMP-0982',
      department: 'Quality & Compliance',
      submitted_by: 'Elena Rostova',
      submission_date: '2026-07-01',
      status: 'APPROVED',
      data: {
        last_working_date: '2026-07-15',
        it_cleared: true,
        hr_cleared: true,
        finance_cleared: true,
        malaffi_revoked: true,
        laptop_returned: true
      }
    }
  ]);

  // Toast / Banner Success Message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Selected Employee State for Auto-Populating Form Data from Employee Register
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;

    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormInputs(prev => ({
        ...prev,
        employee_name: emp.employee_name,
        employee_id: emp.employee_id || prev.employee_id,
        department: emp.department || prev.department,
        position: emp.position || prev.position,
        joining_date: emp.joining_date || prev.joining_date,
        last_working_date: emp.last_working_date || '',
        current_status: emp.current_status || 'Active',
        branch_name: emp.branch_name || '',
        signature_name: emp.employee_name,
        referrer_name: emp.employee_name,
        candidate_name: emp.employee_name,
        supervisor_name: client?.auth_representative?.name || client?.hr_manager?.name || 'Aseef Sulaiman'
      }));
      showToast(`Loaded staff record for ${emp.employee_name} (${emp.employee_id || 'ID N/A'})`);
    }
  };

  // Delete Form Confirmation Modal State
  const [formToDelete, setFormToDelete] = useState<ComplianceForm | null>(null);

  const handleDeleteTemplate = (formId: string) => {
    const target = forms.find(f => f.id === formId);
    if (!target) return;
    setFormToDelete(target);
  };

  const confirmDeleteForm = (formId: string) => {
    const target = forms.find(f => f.id === formId);
    if (!target) return;
    if (onDeleteForm) {
      onDeleteForm(formId);
      showToast(`Deleted form template: "${target.form_name}" (${target.doc_ref || target.id})`);
      setFormToDelete(null);
      if (selectedFormId === formId) {
        const remaining = forms.filter(f => f.id !== formId);
        setSelectedFormId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Filter client forms based on active facility/client tenant
  const clientForms = React.useMemo(() => {
    if (!activeClientId && !client?.company_name) return forms;

    return forms.filter(f => {
      // Direct match on activeClientId
      if (activeClientId && f.client_id === activeClientId) return true;

      // Direct match on active facility name
      if (client?.company_name) {
        const activeName = client.company_name.trim().toLowerCase();
        const fFac = ((f as any).facility_name || (f as any).branch_name || (f as any).company_name || '').trim().toLowerCase();
        if (fFac && (fFac === activeName || fFac.includes(activeName) || activeName.includes(fFac))) {
          return true;
        }
      }

      // Default/global template forms without explicit client_id or 'c1'
      if (!f.client_id || f.client_id === 'c1') {
        const fFac = ((f as any).facility_name || (f as any).branch_name || (f as any).company_name || '').trim();
        // If the form specifies a different facility name, don't show it for another active facility
        if (fFac && client?.company_name && !fFac.toLowerCase().includes(client.company_name.toLowerCase()) && !client.company_name.toLowerCase().includes(fFac.toLowerCase())) {
          return false;
        }
        return true;
      }

      return false;
    });
  }, [forms, activeClientId, client]);

  // Filtered forms for Document Index Table
  const filteredForms = clientForms.filter(f => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (f.doc_ref && f.doc_ref.toLowerCase().includes(searchLower)) ||
      f.form_name.toLowerCase().includes(searchLower) ||
      f.form_type.toLowerCase().includes(searchLower) ||
      (f.classification && f.classification.toLowerCase().includes(searchLower)) ||
      (f.prepared_by && f.prepared_by.toLowerCase().includes(searchLower));

    const matchesCategory = categoryFilter === 'All' || f.category === categoryFilter;
    const matchesClassification = classificationFilter === 'All' || f.classification === classificationFilter;
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;

    return matchesSearch && matchesCategory && matchesClassification && matchesStatus;
  });

  // Selected form object
  const activeForm = clientForms.find(f => f.id === selectedFormId) || clientForms[0] || null;

  // Interactive Form State (for filling selected form)
  const [formInputs, setFormInputs] = useState<Record<string, any>>({
    employee_name: '',
    employee_id: '',
    department: 'General Healthcare',
    position: 'Specialist Physician',
    civil_id: '784-1990-8765432-1',
    joining_date: new Date().toISOString().split('T')[0],
    last_working_date: '',
    // NDA / Orientation Checkboxes
    nda_accepted: false,
    orientation_tour: false,
    emergency_exits_known: false,
    emr_malaffi_trained: false,
    infection_control_known: false,
    // IT User Creation
    systems_email: true,
    systems_emr: true,
    systems_pacs: false,
    systems_hr: true,
    access_level: 'Clinical Staff',
    // Employee Verification
    qualification: 'Bachelor of Medicine & Surgery (MBBS)',
    doh_license_no: 'DOH-P-88321',
    verification_agency: 'DataFlow Group Primary Source',
    verification_status: 'Verified',
    // Referral
    referrer_name: '',
    candidate_name: '',
    candidate_specialty: '',
    // Staff Clearance
    it_asset_returned: true,
    access_card_returned: true,
    emr_revoked: true,
    finance_cleared: true,
    // Change Request
    change_title: 'EMR API SSL Certificate Annual Renewal',
    change_category: 'Standard Maintenance',
    impact_risk: 'Medium',
    rollback_plan: 'Revert to legacy secondary backup cert node within 15 minutes',
    // Signatures
    signature_name: '',
    supervisor_name: client?.auth_representative?.name || 'Aseef Sulaiman'
  });

  const handleInputChange = (key: string, value: any) => {
    setFormInputs(prev => ({ ...prev, [key]: value }));
  };

  // Submit Interactive Form
  const handleSaveFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    const newSub: FormSubmissionRecord = {
      id: `sub-${Date.now()}`,
      form_id: activeForm.id,
      form_type: activeForm.form_type,
      doc_ref: activeForm.doc_ref || 'FORM-REC-000',
      form_name: activeForm.form_name,
      client_id: activeClientId,
      employee_name: formInputs.employee_name || formInputs.candidate_name || formInputs.signature_name || 'Staff Member',
      employee_id: formInputs.employee_id || 'EMP-TEMP',
      department: formInputs.department || 'General Operations',
      submitted_by: formInputs.signature_name || 'Authorized Staff',
      submission_date: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
      data: { ...formInputs }
    };

    setSubmissions(prev => [newSub, ...prev]);

    // Update total submissions count in form template
    if (onUpdateForm) {
      onUpdateForm({
        ...activeForm,
        total_submissions: (activeForm.total_submissions || 0) + 1
      });
    }

    showToast(`Form Submission for ${newSub.employee_name} successfully recorded & signed!`);
    setSelectedSubmission(newSub);
    setActiveSubTab('PRINT_PREVIEW');
  };

  // Metadata Edit Save
  const handleSaveMetadataEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;

    if (onUpdateForm) {
      onUpdateForm(editingForm);
    }
    showToast(`Updated document index metadata for ${editingForm.doc_ref}!`);
    setEditingForm(null);
  };

  // Add New Form Template Save
  const handleCreateNewFormTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ComplianceForm = {
      id: `fm-${Date.now()}`,
      client_id: activeClientId,
      doc_ref: newFormState.doc_ref,
      form_name: newFormState.form_name,
      form_type: newFormState.form_type,
      category: newFormState.category,
      issue_date: newFormState.issue_date,
      expiry_date: newFormState.expiry_date,
      version: newFormState.version,
      classification: newFormState.classification,
      prepared_by: newFormState.prepared_by,
      approved_by: newFormState.approved_by,
      description: newFormState.description,
      status: 'ACTIVE',
      total_submissions: 0
    };

    saveCustomGroupAssignment(newFormState.doc_ref, newFormState.framework_group);
    if (newFormState.form_name) {
      saveCustomGroupAssignment(newFormState.form_name, newFormState.framework_group);
    }

    onAddForm(created);
    showToast(`New Form Template ${created.doc_ref} added to Master Document Index!`);
    setIsAddingNewForm(false);
  };

  // Export Master Index to Excel
  const exportMasterIndexExcel = () => {
    const exportData = filteredForms.map((f, idx) => ({
      'S/N': idx + 1,
      'Document Reference No': f.doc_ref || `FORM-00${idx + 1}`,
      'Form Name / Title': f.form_name,
      'Form Type': f.form_type,
      'Category': f.category || 'General',
      'Issue Date': f.issue_date || '2024-01-01',
      'Expiry / Review Date': f.expiry_date || f.review_date || '2027-01-01',
      'Version': f.version || 'v1.0',
      'Classification': f.classification || 'CONFIDENTIAL',
      'Status': f.status,
      'Prepared By': f.prepared_by || 'HR & Compliance Desk',
      'Approved By': f.approved_by || 'Medical Director',
      'Total Submissions': f.total_submissions || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Document Index Master');
    XLSX.writeFile(wb, `Document_Index_Master_Sheet_${client?.client_code || 'FACILITY'}.xlsx`);
    showToast('Exported Master Document Index to Excel successfully!');
  };

  // Print Master Index Single Sheet
  const handlePrintMasterIndexSheet = () => {
    printCurrentView({
      target: '#printable-master-index-sheet',
      printableId: 'printable-pdf-content',
      orientation: 'landscape'
    });
  };

  // Print Single A4 Form (Blank or Filled)
  const handlePrintSingleFormA4 = () => {
    printCurrentView({
      target: '#printable-single-form-a4',
      printableId: 'printable-report-document',
      orientation: 'portrait'
    });
  };

  const getClassificationBadgeClass = (classification?: string) => {
    switch (classification) {
      case 'STRICTLY CONFIDENTIAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'CONFIDENTIAL':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'RESTRICTED':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
      case 'INTERNAL':
      default:
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
    }
  };

  return (
    <div id="forms-management-container" className="space-y-6 font-sans pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
              HR & IT Regulatory Forms
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ISO 27001 Annex A.7 & A.12 / DOH ADHICS
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Onboarding & Offboarding Forms Index & Control Portal
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Centralized single-sheet document index for managing Confidentiality/NDA, Orientation, User Creation, Employee Verification, Referrals, Staff Clearance, and IT Change Requests with standard header/footer formatting.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddingNewForm(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Form Template
          </button>
          <button
            onClick={exportMasterIndexExcel}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
          <button
            onClick={handlePrintMasterIndexSheet}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" /> Print Master Index
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('INDEX')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'INDEX'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Master Document Index (Single Sheet)
          </button>

          <button
            onClick={() => setActiveSubTab('FILL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'FILL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Fill & Sign Form Station
          </button>

          <button
            onClick={() => setActiveSubTab('PRINT_PREVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'PRINT_PREVIEW'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            Printable A4 Document View
          </button>

          <button
            onClick={() => setActiveSubTab('SUBMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'SUBMISSIONS'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Submitted Records Log ({submissions.length})
          </button>
        </div>

        {/* Facility Info Badge */}
        <div className="text-right hidden lg:block">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Active Facility Code: {client?.client_code || 'SPRC'}
          </span>
          <span className="text-xs font-bold text-slate-800 truncate block max-w-xs">
            {client?.company_name || 'Healthcare Facility & Consultancy'}
          </span>
        </div>
      </div>

      {/* TAB 1: MASTER DOCUMENT INDEX (SINGLE SHEET) */}
      {activeSubTab === 'INDEX' && (
        <div className="space-y-6">
          {/* Header & Footer Configuration Control Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Header / Footer & Classification Formatting Settings
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Document Index Master Single Sheet Format Controls
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintMasterIndexSheet}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Single Sheet Master Index
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerFooterConfig.showLogo}
                  onChange={e => setHeaderFooterConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">Include Client Facility Logo</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerFooterConfig.showStamp}
                  onChange={e => setHeaderFooterConfig(prev => ({ ...prev, showStamp: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">Include Official Facility Stamp</span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Header Display Mode</label>
                <select
                  value={headerFooterConfig.headerDisplayMode}
                  onChange={e => setHeaderFooterConfig(prev => ({ ...prev, headerDisplayMode: e.target.value as any }))}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="BOTH">Logo + Facility Name Header</option>
                  <option value="LOGO_ONLY">Logo Only Header</option>
                  <option value="TEXT_ONLY">Text Only Header</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Footer Classification Text</label>
                <input
                  type="text"
                  value={headerFooterConfig.customFooterText}
                  onChange={e => setHeaderFooterConfig(prev => ({ ...prev, customFooterText: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search Ref No, Form Name, Classification..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Offboarding">Offboarding</option>
                  <option value="IT Security">IT Security</option>
                  <option value="HR Compliance">HR Compliance</option>
                  <option value="Change Control">Change Control</option>
                </select>
              </div>

              <div>
                <select
                  value={classificationFilter}
                  onChange={e => setClassificationFilter(e.target.value)}
                  className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="All">All Classifications</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="STRICTLY CONFIDENTIAL">STRICTLY CONFIDENTIAL</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              Showing <span className="text-emerald-700 font-extrabold">{filteredForms.length}</span> of {clientForms.length} Forms
            </div>
          </div>

          {/* Master Single Sheet Printable Container */}
          <div id="printable-master-index-sheet" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            {/* Facility Header Block */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {headerFooterConfig.showLogo && client?.facility_logo && (
                  <img
                    src={client.facility_logo}
                    alt="Facility Logo"
                    className="h-14 w-auto object-contain rounded-lg border border-slate-100 p-1"
                  />
                )}
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {client?.company_name || 'SMARTPRO HEALTHCARE & CONSULTANCY'}
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    DOH License: <span className="font-mono font-bold text-slate-900">{client?.doh_license_no || 'DOH-AD-10192'}</span> | Trade License: <span className="font-mono font-bold text-slate-900">{client?.trade_license_no || 'TL-AD-9921'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {client?.address || 'Abu Dhabi'}, United Arab Emirates • Email: {client?.email || 'info@smartpro.ae'}
                  </p>
                </div>
              </div>

              {/* Master Sheet Document Title Badge */}
              <div className="text-right border-l-2 border-emerald-500 pl-4 py-1">
                <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider block">
                  INDEX CONTROL SHEET
                </span>
                <h3 className="text-sm font-black text-emerald-900 uppercase mt-1">
                  MASTER DOCUMENT INDEX REGISTER
                </h3>
                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                  Issue Date: {new Date().toISOString().split('T')[0]} | Version: v2.4
                </span>
              </div>
            </div>

            {/* Document Index Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="p-3 border border-slate-800">Doc Ref No</th>
                    <th className="p-3 border border-slate-800">Form Title / Name</th>
                    <th className="p-3 border border-slate-800">Category</th>
                    <th className="p-3 border border-slate-800 text-center">Issue Date</th>
                    <th className="p-3 border border-slate-800 text-center">Expiry / Review Date</th>
                    <th className="p-3 border border-slate-800 text-center">Version</th>
                    <th className="p-3 border border-slate-800 text-center">Classification</th>
                    <th className="p-3 border border-slate-800 text-center">Status</th>
                    <th className="p-3 border border-slate-800 text-center print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                  {filteredForms.map((f, idx) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      {/* Doc Ref */}
                      <td className="p-3 font-mono font-bold text-emerald-800 border border-slate-200 whitespace-nowrap">
                        {f.doc_ref || `FORM-REF-00${idx + 1}`}
                      </td>

                      {/* Form Title */}
                      <td className="p-3 border border-slate-200">
                        <span className="font-extrabold text-slate-900 block leading-tight">{f.form_name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{f.description || f.form_type}</span>
                      </td>

                      {/* Category */}
                      <td className="p-3 border border-slate-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md">
                          {f.category || 'General'}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="p-3 font-mono font-semibold text-center border border-slate-200 whitespace-nowrap">
                        {f.issue_date || '2024-01-15'}
                      </td>

                      {/* Expiry Date */}
                      <td className="p-3 font-mono font-semibold text-center border border-slate-200 whitespace-nowrap">
                        {f.expiry_date || f.review_date || '2027-01-15'}
                      </td>

                      {/* Version */}
                      <td className="p-3 font-mono font-extrabold text-center border border-slate-200 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px]">
                          {f.version || 'v1.0'}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="p-3 text-center border border-slate-200 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getClassificationBadgeClass(f.classification)}`}>
                          {f.classification || 'CONFIDENTIAL'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center border border-slate-200 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          f.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          ● {f.status}
                        </span>
                      </td>

                      {/* Actions (Hidden in Print) */}
                      <td className="p-3 text-center border border-slate-200 whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedFormId(f.id);
                              setActiveSubTab('FILL');
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Fill and Sign Form"
                          >
                            <Edit3 className="w-3 h-3" /> Fill
                          </button>

                          <button
                            onClick={() => {
                              setSelectedFormId(f.id);
                              setActiveSubTab('PRINT_PREVIEW');
                            }}
                            className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Preview Printable A4"
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>

                          <button
                            onClick={() => setEditingForm(f)}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Edit Form Metadata"
                          >
                            <Sliders className="w-3 h-3" /> Edit
                          </button>

                          <button
                            onClick={() => setFormToDelete(f)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Delete Form Template"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Index Footer & Sign-off Block */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prepared & Compiled By</span>
                <p className="font-bold text-slate-900">{client?.hr_manager?.name || 'HR & Compliance Department'}</p>
                <p className="text-[10px] text-slate-500">Quality Management System (QMS) Lead</p>
                <div className="mt-4 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-400">
                  Signature: __________________________
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reviewed & Authorized By</span>
                <p className="font-bold text-slate-900">{client?.medical_director?.name || client?.auth_representative?.name || 'Medical Director / CEO'}</p>
                <p className="text-[10px] text-slate-500">Authorized Representative Signatory</p>
                <div className="mt-4 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-400">
                  Signature: __________________________
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Official Facility Seal</span>
                  <p className="text-[11px] text-slate-600 font-medium">
                    This document index is an official record under ISO 27001 Annex A.7 & DOH Regulations.
                  </p>
                </div>
                {headerFooterConfig.showStamp && client?.facility_stamp && (
                  <div className="mt-2 flex justify-end">
                    <img src={client.facility_stamp} alt="Official Stamp" className="h-14 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Document Index Legal Footer Disclaimer */}
            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 font-mono">
              {headerFooterConfig.customFooterText} • PAGE 1 OF 1
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE FILL & SIGN FORM STATION */}
      {activeSubTab === 'FILL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Form Selectors with Add/Edit/Delete Actions */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Select Form Template to Complete
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewForm(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                title="Add New Form Template"
              >
                <Plus className="w-3 h-3" /> Add Template
              </button>
            </div>

            <div className="space-y-2">
              {clientForms.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFormId(f.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative group ${
                    selectedFormId === f.id
                      ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      selectedFormId === f.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {f.doc_ref || 'FORM'}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {f.version || 'v1.0'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs mt-1 leading-tight">{f.form_name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{f.description || f.form_type}</p>
                    </div>
                  </div>

                  {/* Template Card Actions: Edit / Delete */}
                  <div className="absolute top-2.5 right-2 flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingForm(f);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                      title="Edit Form Template Metadata"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormToDelete(f);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Form Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Active Fillable Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            {activeForm ? (
              <form onSubmit={handleSaveFormSubmission} className="space-y-6">
                {/* Form Header */}
                <div className="border-b border-slate-200 pb-4 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                        {activeForm.doc_ref || 'FORM-REF'}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${getClassificationBadgeClass(activeForm.classification)}`}>
                        {activeForm.classification || 'CONFIDENTIAL'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                        Category: {activeForm.category || 'General'}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 mt-1.5">
                      {activeForm.form_name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeForm.description || 'Fill out required details to generate signed electronic record.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Version</span>
                      <span className="text-xs font-mono font-bold text-indigo-700">{activeForm.version || 'v1.0'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingForm(activeForm)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit Template Details"
                      >
                        <Sliders className="w-3 h-3" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormToDelete(activeForm)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Form Template"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Common Employee / Target Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Section 1: Staff & Operator Identification Details
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Linked with Employee & Operator Management
                    </span>
                  </div>

                  {/* Employee Dropdown Selection */}
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-emerald-950 flex items-center justify-between">
                      <span>Select Staff / Operator Record from Employee Management:</span>
                      <span className="text-[10px] text-emerald-700 font-bold">{employees.length} Staff Records Available</span>
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Select Employee to Auto-populate Record & Signatory Details --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_name} ({emp.employee_id || 'ID N/A'}) - {emp.position || 'Staff'} [{emp.department || 'General'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Employee Live Summary Card */}
                  {selectedEmployeeId && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-extrabold text-slate-900">{formInputs.employee_name}</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {formInputs.employee_id}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          formInputs.current_status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          ● {formInputs.current_status || 'Active'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Position / Role</span>
                          <span className="font-bold text-slate-800">{formInputs.position || 'Healthcare Staff'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Department</span>
                          <span className="font-bold text-slate-800">{formInputs.department || 'General Healthcare'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Joining Date</span>
                          <span className="font-mono font-bold text-slate-800">{formInputs.joining_date || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Branch Location</span>
                          <span className="font-bold text-slate-800">{formInputs.branch_name || client?.company_name || 'Abu Dhabi Main Branch'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formInputs.employee_name}
                        onChange={e => handleInputChange('employee_name', e.target.value)}
                        placeholder="e.g. Dr. Johnathan Carter"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee ID / Code</label>
                      <input
                        type="text"
                        value={formInputs.employee_id}
                        onChange={e => handleInputChange('employee_id', e.target.value)}
                        placeholder="e.g. EMP-1092"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Position / Designation</label>
                      <input
                        type="text"
                        value={formInputs.position || ''}
                        onChange={e => handleInputChange('position', e.target.value)}
                        placeholder="e.g. Specialist Physician"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={formInputs.department}
                        onChange={e => handleInputChange('department', e.target.value)}
                        placeholder="e.g. Clinical Operations"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Emirates ID / Civil ID</label>
                      <input
                        type="text"
                        value={formInputs.civil_id}
                        onChange={e => handleInputChange('civil_id', e.target.value)}
                        placeholder="e.g. 784-1990-1234567-1"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Joining / Effective Date</label>
                      <input
                        type="date"
                        value={formInputs.joining_date}
                        onChange={e => handleInputChange('joining_date', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* FORM SPECIFIC FIELDS */}

                {/* 1. Confidentiality / NDA Form */}
                {activeForm.form_type.includes('NDA') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-rose-600" /> Section 2: Non-Disclosure & Patient Health Data Privacy Agreement
                    </h3>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-950">
                      <p className="font-bold">🔒 Regulatory Confidentiality Undertaking:</p>
                      <p className="leading-relaxed text-[11px]">
                        I hereby agree that all medical records, MALAFFI/NABIDH health data, patient identities, software code, and facility network configurations accessed during my employment are RESTRICTED and protected under UAE Federal Decree Law No. 2 of 2019 and DOH ADHICS Information Security Standards.
                      </p>
                      <label className="flex items-center gap-2.5 font-extrabold cursor-pointer mt-3 pt-2 border-t border-amber-200">
                        <input
                          type="checkbox"
                          checked={formInputs.nda_accepted}
                          onChange={e => handleInputChange('nda_accepted', e.target.checked)}
                          className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          required
                        />
                        I accept and digitally sign all confidentiality terms.
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. Orientation Form */}
                {activeForm.form_type.includes('Orientation') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-600" /> Section 2: Onboarding Orientation & Safety Checklist
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.orientation_tour}
                          onChange={e => handleInputChange('orientation_tour', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Facility Tour & Emergency Exits Walkthrough</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.emergency_exits_known}
                          onChange={e => handleInputChange('emergency_exits_known', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Fire Alarm & Evacuation Drill Instructions</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.emr_malaffi_trained}
                          onChange={e => handleInputChange('emr_malaffi_trained', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">EMR & MALAFFI Privacy Training Attended</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.infection_control_known}
                          onChange={e => handleInputChange('infection_control_known', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800">Infection Control & Medical Waste Disposal</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. User Creation Form */}
                {activeForm.form_type.includes('User Creation') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-sky-600" /> Section 2: IT Systems Access Provisioning Requisition
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.systems_email}
                          onChange={e => handleInputChange('systems_email', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">Official Email</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.systems_emr}
                          onChange={e => handleInputChange('systems_emr', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">EMR / Malaffi</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.systems_pacs}
                          onChange={e => handleInputChange('systems_pacs', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">RIS / PACS</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.systems_hr}
                          onChange={e => handleInputChange('systems_hr', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">HR Portal</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Access Role Privilege</label>
                        <select
                          value={formInputs.access_level}
                          onChange={e => handleInputChange('access_level', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold bg-white"
                        >
                          <option value="Clinical Staff">Clinical Staff (Read/Write)</option>
                          <option value="Physician Supervisor">Physician Supervisor (Full Clinical)</option>
                          <option value="Department Admin">Department Admin</option>
                          <option value="System Admin">System Administrator</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">IT Approver Name</label>
                        <input
                          type="text"
                          value={formInputs.supervisor_name}
                          onChange={e => handleInputChange('supervisor_name', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Employee Verification Form */}
                {activeForm.form_type.includes('Verification') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" /> Section 2: Credential & Primary Source Verification
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Qualification Degree</label>
                        <input
                          type="text"
                          value={formInputs.qualification}
                          onChange={e => handleInputChange('qualification', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">DOH / DHA License No</label>
                        <input
                          type="text"
                          value={formInputs.doh_license_no}
                          onChange={e => handleInputChange('doh_license_no', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Verification Status</label>
                        <select
                          value={formInputs.verification_status}
                          onChange={e => handleInputChange('verification_status', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                        >
                          <option value="Verified">Verified & Authentic</option>
                          <option value="Pending">Pending Primary Source</option>
                          <option value="Rejected">Verification Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Employee Referral Form */}
                {activeForm.form_type.includes('Referral') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-600" /> Section 2: Candidate Nomination & Specialty Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Referring Staff Name</label>
                        <input
                          type="text"
                          value={formInputs.referrer_name}
                          onChange={e => handleInputChange('referrer_name', e.target.value)}
                          placeholder="e.g. Dr. Aseef"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Candidate Name</label>
                        <input
                          type="text"
                          value={formInputs.candidate_name}
                          onChange={e => handleInputChange('candidate_name', e.target.value)}
                          placeholder="e.g. Dr. Tariq"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Candidate Specialty</label>
                        <input
                          type="text"
                          value={formInputs.candidate_specialty}
                          onChange={e => handleInputChange('candidate_specialty', e.target.value)}
                          placeholder="e.g. Senior Radiologist"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Staff Clearance Form */}
                {activeForm.form_type.includes('Clearance') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserMinus className="w-4 h-4 text-rose-600" /> Section 2: Exit Clearance & Asset Return Sign-off
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.it_asset_returned}
                          onChange={e => handleInputChange('it_asset_returned', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">IT Assets Returned</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.access_card_returned}
                          onChange={e => handleInputChange('access_card_returned', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">Access Badge Handed Over</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.emr_revoked}
                          onChange={e => handleInputChange('emr_revoked', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">EMR Access Revoked</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInputs.finance_cleared}
                          onChange={e => handleInputChange('finance_cleared', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">Finance Cleared</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 7. Change Request Form */}
                {activeForm.form_type.includes('Change') && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-purple-600" /> Section 2: Change Specification & Rollback Plan
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Change Title / Description</label>
                        <input
                          type="text"
                          value={formInputs.change_title}
                          onChange={e => handleInputChange('change_title', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Change Category</label>
                          <select
                            value={formInputs.change_category}
                            onChange={e => handleInputChange('change_category', e.target.value)}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                          >
                            <option value="Standard Maintenance">Standard Maintenance</option>
                            <option value="Emergency Patch">Emergency Patch</option>
                            <option value="Major Infrastructure Update">Major Infrastructure Update</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Rollback Plan</label>
                          <input
                            type="text"
                            value={formInputs.rollback_plan}
                            onChange={e => handleInputChange('rollback_plan', e.target.value)}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Digital Attestation Sign-off */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Digital Signature Full Name *</label>
                    <input
                      type="text"
                      value={formInputs.signature_name}
                      onChange={e => handleInputChange('signature_name', e.target.value)}
                      placeholder="e.g. Dr. Johnathan Carter"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-extrabold text-emerald-900 bg-emerald-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Supervisor / Verification Signatory</label>
                    <input
                      type="text"
                      value={formInputs.supervisor_name}
                      onChange={e => handleInputChange('supervisor_name', e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Encrypted Submission & Preview A4
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-20 text-center text-slate-400">
                Please select a form from the left panel to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRINTABLE A4 DOCUMENT VIEW */}
      {activeSubTab === 'PRINT_PREVIEW' && (
        <div className="space-y-4">
          {/* Print Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">A4 Print Ready Preview</span>
              <h3 className="text-sm font-black text-slate-900">
                {selectedSubmission ? selectedSubmission.form_name : (activeForm?.form_name || 'Standard Form Document')}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintSingleFormA4}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print A4 PDF
              </button>
            </div>
          </div>

          {/* Printable Container */}
          <div
            id="printable-single-form-a4"
            className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6 text-slate-900 text-xs font-sans"
          >
            {/* Header Block */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {headerFooterConfig.showLogo && client?.facility_logo && (
                  <img src={client.facility_logo} alt="Logo" className="h-16 w-auto object-contain" />
                )}
                <div>
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {client?.company_name || 'SMARTPRO PUBLIC RELATIONS & HEALTH CONSULTANCY'}
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    DOH License: <span className="font-mono font-bold text-slate-900">{client?.doh_license_no || 'DOH-AD-10192'}</span> | Trade License: <span className="font-mono font-bold text-slate-900">{client?.trade_license_no || 'TL-AD-9921'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {client?.address || 'Abu Dhabi'}, UAE • Phone: {client?.phone || '0524846770'}
                  </p>
                </div>
              </div>

              {/* Control Metadata Box */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-right space-y-1">
                <div className="text-[9px] font-mono font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded text-center uppercase">
                  {selectedSubmission?.doc_ref || activeForm?.doc_ref || 'FORM-ONB-NDA-001'}
                </div>
                <div className="text-[10px] font-bold text-slate-700">
                  Version: <span className="font-mono font-extrabold text-indigo-900">{activeForm?.version || 'v1.0'}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-700">
                  Class: <span className="font-extrabold uppercase text-amber-800">{activeForm?.classification || 'CONFIDENTIAL'}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  Issued: {activeForm?.issue_date || '2024-01-15'}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2 bg-slate-100 rounded-lg border border-slate-200">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {selectedSubmission ? selectedSubmission.form_name : (activeForm?.form_name || 'Healthcare Form Document')}
              </h2>
            </div>

            {/* Body Content */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-1 uppercase flex items-center justify-between">
                  <span>Record & Signatory Details (Employee & Operator Management)</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    VERIFIED OPERATOR RECORD
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Staff Member / Candidate</span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {selectedSubmission?.employee_name || formInputs.employee_name || 'Dr. Johnathan Carter'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Employee ID / Code</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSubmission?.employee_id || formInputs.employee_id || 'EMP-1029'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Designation / Role</span>
                    <span className="font-semibold text-slate-900">
                      {selectedSubmission?.data?.position || formInputs.position || 'Specialist Physician'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Department</span>
                    <span className="font-semibold text-slate-900">
                      {selectedSubmission?.department || formInputs.department || 'Clinical Operations'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Emirates ID / Civil ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSubmission?.data?.civil_id || formInputs.civil_id || '784-1990-1234567-1'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Joining / Effective Date</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSubmission?.data?.joining_date || formInputs.joining_date || '2024-01-15'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Record Date</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSubmission?.submission_date || new Date().toISOString().split('T')[0]}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Facility Branch</span>
                    <span className="font-bold text-slate-900">
                      {selectedSubmission?.data?.branch_name || formInputs.branch_name || client?.company_name || 'Main Facility'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Wording */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase border-b border-slate-100 pb-1">
                  Attestation & Terms Agreement
                </h3>
                <p className="text-slate-700 leading-relaxed text-xs">
                  This electronic form record certifies that all information declared herein has been reviewed and executed in compliance with ISO 27001 Information Security Management, DOH Abu Dhabi Healthcare Regulations, and UAE Federal Laws regarding patient data protection and employee conduct.
                </p>
              </div>
            </div>

            {/* Signatures & Stamp Block */}
            <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Submitted By</span>
                <p className="font-bold text-slate-900 mt-1">{selectedSubmission?.submitted_by || formInputs.signature_name || 'Dr. Johnathan Carter'}</p>
                <div className="mt-6 pt-2 border-t border-slate-300 font-mono text-[9px] text-slate-400">
                  Digital Sign: Verified
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Authorized By</span>
                <p className="font-bold text-slate-900 mt-1">{client?.medical_director?.name || 'Medical Director / CEO'}</p>
                <div className="mt-6 pt-2 border-t border-slate-300 font-mono text-[9px] text-slate-400">
                  Digital Sign: Approved
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Facility Seal</span>
                {headerFooterConfig.showStamp && client?.facility_stamp && (
                  <div className="flex justify-center mt-2">
                    <img src={client.facility_stamp} alt="Stamp" className="h-12 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* Printable Footer */}
            <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-100 font-mono">
              {headerFooterConfig.customFooterText} • PAGE 1 OF 1
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBMITTED RECORDS LOG */}
      {activeSubTab === 'SUBMISSIONS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-sm">Completed Electronic Submissions Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit log of all filled, signed, and saved onboarding/offboarding forms.</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Total Records: {submissions.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Form Name</th>
                  <th className="p-3">Staff / Candidate</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Submission Date</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-emerald-800">{sub.doc_ref}</td>
                    <td className="p-3 font-bold text-slate-900">{sub.form_name}</td>
                    <td className="p-3 font-semibold text-slate-800">{sub.employee_name}</td>
                    <td className="p-3 text-slate-600">{sub.department || 'Operations'}</td>
                    <td className="p-3 font-mono text-center text-slate-600">{sub.submission_date}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[9px]">
                        ● {sub.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setActiveSubTab('PRINT_PREVIEW');
                        }}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Preview A4
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT FORM METADATA */}
      {editingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Document Control Index Editor</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Edit Form Template</h3>
              </div>
              <button onClick={() => setEditingForm(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadataEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doc Reference No *</label>
                  <input
                    type="text"
                    value={editingForm.doc_ref || ''}
                    onChange={e => setEditingForm({ ...editingForm, doc_ref: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Version *</label>
                  <input
                    type="text"
                    value={editingForm.version || ''}
                    onChange={e => setEditingForm({ ...editingForm, version: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Form Name / Title *</label>
                <input
                  type="text"
                  value={editingForm.form_name}
                  onChange={e => setEditingForm({ ...editingForm, form_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-extrabold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Form Type / Template Classification</label>
                  <input
                    type="text"
                    value={editingForm.form_type || ''}
                    onChange={e => setEditingForm({ ...editingForm, form_type: e.target.value })}
                    placeholder="e.g. Confidentiality / NDA Form"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingForm.status || 'ACTIVE'}
                    onChange={e => setEditingForm({ ...editingForm, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingForm.category || 'Onboarding'}
                    onChange={e => setEditingForm({ ...editingForm, category: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Offboarding">Offboarding</option>
                    <option value="IT Security">IT Security</option>
                    <option value="HR Compliance">HR Compliance</option>
                    <option value="Change Control">Change Control</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classification</label>
                  <select
                    value={editingForm.classification || 'CONFIDENTIAL'}
                    onChange={e => setEditingForm({ ...editingForm, classification: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="STRICTLY CONFIDENTIAL">STRICTLY CONFIDENTIAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editingForm.issue_date || '2024-01-15'}
                    onChange={e => setEditingForm({ ...editingForm, issue_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry / Review Date</label>
                  <input
                    type="date"
                    value={editingForm.expiry_date || editingForm.review_date || '2027-01-15'}
                    onChange={e => setEditingForm({ ...editingForm, expiry_date: e.target.value, review_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={editingForm.prepared_by || ''}
                    onChange={e => setEditingForm({ ...editingForm, prepared_by: e.target.value })}
                    placeholder="e.g. HR & Compliance Officer"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={editingForm.approved_by || ''}
                    onChange={e => setEditingForm({ ...editingForm, approved_by: e.target.value })}
                    placeholder="e.g. Managing Director / CISO"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Form Description & Scope</label>
                <textarea
                  rows={2}
                  value={editingForm.description || ''}
                  onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                  placeholder="Summarize the legal purpose and workflow of this form template..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingForm(null)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW FORM TEMPLATE */}
      {isAddingNewForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Document Index Expansion</span>
                <h3 className="font-extrabold text-slate-900 text-sm">Add New Form Template</h3>
              </div>
              <button onClick={() => setIsAddingNewForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFormTemplate} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <BTATierSelector
                  value={newFormState.framework_group}
                  onChange={g => setNewFormState({ ...newFormState, framework_group: g })}
                  label="Framework Tier Group Assignment (B, T, A)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doc Ref No *</label>
                  <input
                    type="text"
                    value={newFormState.doc_ref}
                    onChange={e => setNewFormState({ ...newFormState, doc_ref: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={newFormState.version}
                    onChange={e => setNewFormState({ ...newFormState, version: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Form Name / Title *</label>
                <input
                  type="text"
                  value={newFormState.form_name}
                  onChange={e => setNewFormState({ ...newFormState, form_name: e.target.value })}
                  placeholder="e.g. Special Equipment Training Verification Form"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-extrabold text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newFormState.category}
                    onChange={e => setNewFormState({ ...newFormState, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Offboarding">Offboarding</option>
                    <option value="IT Security">IT Security</option>
                    <option value="HR Compliance">HR Compliance</option>
                    <option value="Change Control">Change Control</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classification</label>
                  <select
                    value={newFormState.classification}
                    onChange={e => setNewFormState({ ...newFormState, classification: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="STRICTLY CONFIDENTIAL">STRICTLY CONFIDENTIAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={newFormState.issue_date}
                    onChange={e => setNewFormState({ ...newFormState, issue_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry / Review Date</label>
                  <input
                    type="date"
                    value={newFormState.expiry_date}
                    onChange={e => setNewFormState({ ...newFormState, expiry_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNewForm(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Add to Master Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE FORM TEMPLATE CONFIRMATION */}
      {formToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">Document Index Control</span>
                <h3 className="font-black text-slate-900 text-sm">Delete Form Template</h3>
              </div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
              <p className="text-slate-700 font-bold">Are you sure you want to permanently delete this form template?</p>
              <div className="bg-white p-3 rounded-lg border border-rose-200 space-y-1">
                <p className="font-extrabold text-slate-900">{formToDelete.form_name}</p>
                <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-600 font-mono font-bold">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{formToDelete.doc_ref || formToDelete.id}</span>
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{formToDelete.version || 'v1.0'}</span>
                  <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{formToDelete.classification || 'CONFIDENTIAL'}</span>
                </div>
              </div>
              <p className="text-[11px] text-rose-800 leading-normal font-medium">
                This action will remove the form template from your Master Document Index and prevent new submissions.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteForm(formToDelete.id)}
                className="px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
