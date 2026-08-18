/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Employee,
  Client,
  SystemAccessReviewItem,
  SystemApplicationType,
  AccessRoleType,
  AccessReviewStatus,
  AccessReviewAuditLog,
  User
} from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { printHtmlInHiddenIframe } from '../utils/printUtils';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Plus,
  Trash2,
  Edit2,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  History,
  FileText,
  Key,
  Server,
  Layers,
  Check,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  HelpCircle,
  Building,
  Calendar,
  Lock,
  ArrowRight,
  Info,
  Sparkles,
  Link2,
  Tag,
  Award,
  ExternalLink,
  Save,
  CheckCircle,
  Eye,
  Bookmark,
  Share2,
  Monitor,
  Video,
  HardDrive,
  AppWindow,
  LayoutList,
  Grid,
  ListFilter,
  ArrowUpRight,
  FolderTree
} from 'lucide-react';
import { DocRefLoopSelector, DocRefLoopData } from './DocRefLoopSelector';

export interface SystemAccessReviewVersionRecord {
  id: string;
  version: string;
  ref_code: string;
  revision_date: string;
  author: string;
  change_summary: string;
  framework_group: string;
  status: 'Approved' | 'Draft' | 'Under Review' | 'Active';
  approved_by: string;
  classification: string;
  issue_date?: string;
  approval_date?: string;
  review_conducted_date?: string;
  effective_date?: string;
  next_due_date?: string;
  reviewed_by?: string;
}

export const INITIAL_SYSTEM_ACCESS_VERSIONS: SystemAccessReviewVersionRecord[] = [
  {
    id: 'vrec-1',
    version: '1.0',
    ref_code: 'ANNIB/IT/HR/009',
    revision_date: '2023-05-05',
    author: 'Aseef Sulaiman (IT Manager)',
    change_summary: 'Initial System Access Review Governance baseline established under ISO 27001 (A.9) and ADHICS Access Control guidelines.',
    framework_group: 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
    status: 'Approved',
    approved_by: 'Anjum Ahmad (Medical Director)',
    classification: 'RESTRICTED',
    issue_date: '2023-05-05',
    approval_date: '2023-05-05',
    review_conducted_date: '2023-05-05',
    effective_date: '2023-05-05',
    next_due_date: '2024-05-05',
    reviewed_by: 'Anju Ahmed'
  },
  {
    id: 'vrec-2',
    version: '2.0',
    ref_code: 'ANNIB/IT/HR/009',
    revision_date: '2025-08-01',
    author: 'Aseef Sulaiman (IT Manager)',
    change_summary: 'Expanded review scope to include CCTV, NAS storage volumes, Firewall administration, and clinical EMR operators.',
    framework_group: 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
    status: 'Approved',
    approved_by: 'Anjum Ahmad (Medical Director)',
    classification: 'RESTRICTED',
    issue_date: '2023-05-05',
    approval_date: '2025-08-01',
    review_conducted_date: '2025-08-01',
    effective_date: '2025-08-01',
    next_due_date: '2026-08-01',
    reviewed_by: 'Anju Ahmed'
  },
  {
    id: 'vrec-3',
    version: '2.1',
    ref_code: 'ANNIB/IT/HR/009',
    revision_date: '2026-08-01',
    author: 'Aseef Sulaiman (IT Manager)',
    change_summary: 'Updated review privileges for critical server accounts, CCTV operators, and NAS storage access.',
    framework_group: 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
    status: 'Approved',
    approved_by: 'Anjum Ahmad (Medical Director)',
    classification: 'RESTRICTED',
    issue_date: '2023-05-05',
    approval_date: '2026-08-01',
    review_conducted_date: '2026-08-01',
    effective_date: '2026-08-01',
    next_due_date: '2027-08-01',
    reviewed_by: 'Anju Ahmed'
  }
];

export const CLASSIFICATION_OPTIONS = [
  'RESTRICTED',
  'RESTRICTED / CONFIDENTIAL',
  'APPROVED & ACTIVE',
  'CONFIDENTIAL',
  'OFFICIAL / RESTRICTED',
  'INTERNAL USE ONLY',
  'STRICTLY CONFIDENTIAL'
];

export const FRAMEWORK_TIER_GROUPS = [
  'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
  'Transmission Tier (DOH / HAAD Information Security Framework)',
  'Basic Tier (Core Facility IT Security Baseline)',
  'HIPAA Security Rule § 164.308(a)(3) Access Control',
  'NIST SP 800-53 AC-2 Account Management'
];

interface SystemAccessReviewModuleProps {
  accessReviews: SystemAccessReviewItem[];
  employees: Employee[];
  client: Client | null;
  currentUser?: User;
  onAddAccessReview: (item: SystemAccessReviewItem) => void;
  onUpdateAccessReview: (item: SystemAccessReviewItem) => void;
  onDeleteAccessReview: (id: string) => void;
  onBulkAddAccessReviews?: (items: SystemAccessReviewItem[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SYSTEM_APPLICATION_OPTIONS: SystemApplicationType[] = [
  'Desktop / Computer User Accounts',
  'Server',
  'Firewall',
  'CCTV / NVR',
  'Antivirus / Kaspersky',
  'NAS',
  'Other Application'
];

export const ACCESS_ROLE_OPTIONS: AccessRoleType[] = [
  'General / End User',
  'Operator',
  'Administrator',
  'Business Application User',
  'DB User'
];

export const MODULE_PRIVILEGE_SUGGESTIONS = [
  'Firewall Administration',
  'NAS Read/Write',
  'CCTV Live View',
  'CCTV Playback',
  'Server Administration',
  'Application User',
  'Database Access',
  'Email Administration',
  'Standard Workstation & Local Domain User',
  'Active Directory User Management',
  'Antivirus Management & Policy Deployment',
  'EMR / HIS Clinical User Access',
  'Billing & Financial Operations',
  'Backup & Disaster Recovery Admin'
];

export const ACCESS_STATUS_OPTIONS: AccessReviewStatus[] = [
  'Active',
  'Inactive',
  'Removed',
  'Modified'
];

export interface SystemTypeConfig {
  label: string;
  shortLabel: string;
  category: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBg: string;
  headerBorder: string;
  accentText: string;
}

export const SYSTEM_TYPE_CONFIGS: Record<SystemApplicationType, SystemTypeConfig> = {
  'Desktop / Computer User Accounts': {
    label: 'Desktop / Computer User Accounts',
    shortLabel: 'Desktop Accounts',
    category: 'Endpoint & Workstation',
    description: 'Workstations, local PC domain logins, staff access credentials & clinical computers',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    headerBg: 'bg-emerald-50/80',
    headerBorder: 'border-emerald-200',
    accentText: 'text-emerald-700'
  },
  'Server': {
    label: 'Server',
    shortLabel: 'Server Infrastructure',
    category: 'Core Infrastructure',
    description: 'Windows Active Directory, Domain Controllers, Hyper-V, Linux & Database servers',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
    headerBg: 'bg-indigo-50/80',
    headerBorder: 'border-indigo-200',
    accentText: 'text-indigo-700'
  },
  'Firewall': {
    label: 'Firewall',
    shortLabel: 'Network Firewall',
    category: 'Perimeter & Security',
    description: 'FortiGate / Sophos perimeter firewall, VPN gateway tunnels, IPsec & admin portals',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
    headerBg: 'bg-rose-50/80',
    headerBorder: 'border-rose-200',
    accentText: 'text-rose-700'
  },
  'CCTV / NVR': {
    label: 'CCTV / NVR',
    shortLabel: 'CCTV & Surveillance',
    category: 'Physical Security',
    description: 'Network Video Recorders, camera surveillance feeds, live monitoring & playback operators',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
    headerBg: 'bg-cyan-50/80',
    headerBorder: 'border-cyan-200',
    accentText: 'text-cyan-700'
  },
  'Antivirus / Kaspersky': {
    label: 'Antivirus / Kaspersky',
    shortLabel: 'Antivirus & EDR',
    category: 'Endpoint Security',
    description: 'Kaspersky Security Center, policy administrators, client agent status & malware consoles',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-300',
    headerBg: 'bg-teal-50/80',
    headerBorder: 'border-teal-200',
    accentText: 'text-teal-700'
  },
  'NAS': {
    label: 'NAS',
    shortLabel: 'NAS & File Storage',
    category: 'Storage Infrastructure',
    description: 'Synology / QNAP network attached storage, backup LUNs, PACS archives & departmental shares',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
    headerBg: 'bg-sky-50/80',
    headerBorder: 'border-sky-200',
    accentText: 'text-sky-700'
  },
  'Other Application': {
    label: 'Other Application',
    shortLabel: 'Other Applications',
    category: 'Business & Clinical Apps',
    description: 'EMR / EHR, RIS/PACS, Dental suite, Accounting / ERP, Malaffi gateway & specialized SaaS',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    headerBg: 'bg-amber-50/80',
    headerBorder: 'border-amber-200',
    accentText: 'text-amber-700'
  }
};

export const getSystemIcon = (sys: string, className = "w-4 h-4") => {
  if (sys.includes('Desktop') || sys.includes('Computer')) return <Monitor className={className} />;
  if (sys.includes('Server')) return <Server className={className} />;
  if (sys.includes('Firewall')) return <Lock className={className} />;
  if (sys.includes('CCTV') || sys.includes('NVR')) return <Video className={className} />;
  if (sys.includes('Antivirus') || sys.includes('Kaspersky')) return <ShieldCheck className={className} />;
  if (sys.includes('NAS')) return <HardDrive className={className} />;
  return <AppWindow className={className} />;
};

export default function SystemAccessReviewModule({
  accessReviews,
  employees,
  client,
  currentUser,
  onAddAccessReview,
  onUpdateAccessReview,
  onDeleteAccessReview,
  onNavigateTab
}: SystemAccessReviewModuleProps) {
  // Current active client employees
  const activeClientId = client?.id || 'c1';
  const clientEmployees = useMemo(() => {
    return employees.filter(e => !e.client_id || e.client_id === activeClientId);
  }, [employees, activeClientId]);

  // Client-specific access reviews
  const clientReviews = useMemo(() => {
    return accessReviews.filter(r => !r.client_id || r.client_id === activeClientId);
  }, [accessReviews, activeClientId]);

  // Authorized Person list for "Approved By"
  const authorizedSigners = useMemo(() => {
    const list: { name: string; designation: string }[] = [];
    if (client?.medical_director?.name) {
      list.push({ name: `${client.medical_director.name} (Medical Director)`, designation: 'Medical Director' });
    }
    if (client?.auth_representative?.name) {
      list.push({ name: `${client.auth_representative.name} (Auth Representative)`, designation: 'Authorized Representative' });
    }
    if (client?.clinic_manager?.name) {
      list.push({ name: `${client.clinic_manager.name} (Clinic Manager)`, designation: 'Clinic Manager' });
    }
    if (client?.owner_name && client.owner_name !== 'N/A') {
      list.push({ name: `${client.owner_name} (Facility Owner)`, designation: 'Facility Owner' });
    }
    if (client?.hr_manager?.name) {
      list.push({ name: `${client.hr_manager.name} (HR Director)`, designation: 'HR Director' });
    }
    
    // Also include leadership positions from employees
    clientEmployees.forEach(e => {
      if (
        e.position?.toLowerCase().includes('director') ||
        e.position?.toLowerCase().includes('manager') ||
        e.position?.toLowerCase().includes('officer') ||
        e.position?.toLowerCase().includes('lead')
      ) {
        const entry = `${e.employee_name} (${e.position})`;
        if (!list.some(l => l.name === entry)) {
          list.push({ name: entry, designation: e.position });
        }
      }
    });

    // Also ensure medical director / authorized person requested by governance
    const defaultSignerName = client?.medical_director?.name 
      ? `${client.medical_director.name} (Medical Director)` 
      : 'Anjum Ahmad (Medical Director)';
    if (!list.some(l => l.name.includes('Anjum Ahmad') || l.name.includes('Medical Director'))) {
      list.unshift({ name: defaultSignerName, designation: 'Medical Director' });
    }

    if (list.length === 0) {
      list.push({ name: 'Anjum Ahmad (Medical Director)', designation: 'Medical Director' });
      list.push({ name: 'Dr. Faisal Al-Mansoori (Medical Director)', designation: 'Medical Director' });
      list.push({ name: 'Anju Ahmed (Compliance Lead)', designation: 'Compliance Lead' });
    }
    return list;
  }, [client, clientEmployees]);

  // IT Manager default for "Prepared By"
  const defaultPreparedBy = useMemo(() => {
    if (client?.it_manager?.name) {
      return `${client.it_manager.name} (IT Manager)`;
    }
    if (currentUser?.full_name) {
      return `${currentUser.full_name} (IT Manager)`;
    }
    return 'Aseef Sulaiman (IT Manager)';
  }, [client, currentUser]);

  // Default Review Date
  const defaultTodayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Form State: Workflow sequential entry
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [systemApplication, setSystemApplication] = useState<SystemApplicationType | ''>('');
  const [accessRole, setAccessRole] = useState<AccessRoleType | ''>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [modulePrivilegeInput, setModulePrivilegeInput] = useState<string>('');
  const [approvedByInput, setApprovedByInput] = useState<string>(authorizedSigners[0]?.name || 'Anjum Ahmad (Medical Director)');
  const [preparedByInput, setPreparedByInput] = useState<string>(defaultPreparedBy);
  const [reviewDateInput, setReviewDateInput] = useState<string>('2026-08-01');
  const [statusInput, setStatusInput] = useState<AccessReviewStatus>('Active');
  const [notesInput, setNotesInput] = useState<string>('');

  // Form Editing State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [formValidationErrors, setFormValidationErrors] = useState<string[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('ALL');
  const [filterSystem, setFilterSystem] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Layout View Mode: "all_one_page" (Consolidated Master Table) or "grouped_by_system" (Separate System Cards)
  const [viewLayout, setViewLayout] = useState<'all_one_page' | 'grouped_by_system'>('all_one_page');

  // Modals & Drawers
  const [auditModalItem, setAuditModalItem] = useState<SystemAccessReviewItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SystemAccessReviewItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Document Metadata for Governance, Print & PDF & Master Loop
  const [docRef, setDocRef] = useState<string>('ANNIB/IT/HR/009');
  const [docClassification, setDocClassification] = useState<string>('RESTRICTED');
  const [docVersion, setDocVersion] = useState<string>('2.1');
  const [docFrameworkGroup, setDocFrameworkGroup] = useState<string>('Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)');
  const [docIssueDate, setDocIssueDate] = useState<string>('2023-05-05');
  const [docApprovalDate, setDocApprovalDate] = useState<string>('2026-08-01');
  const [docEffectiveDate, setDocEffectiveDate] = useState<string>('2026-08-01');
  const [docNextDueDate, setDocNextDueDate] = useState<string>('2027-08-01');
  const [docReviewedBy, setDocReviewedBy] = useState<string>('Anju Ahmed');

  // Version Control History
  const [versionHistory, setVersionHistory] = useState<SystemAccessReviewVersionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sh_system_access_review_versions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SYSTEM_ACCESS_VERSIONS;
  });

  // Modals for Version Control & Master Setup Loop
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Version Form State (Preset with requested governance fields)
  const [newVersionForm, setNewVersionForm] = useState({
    ref_code: 'ANNIB/IT/HR/009',
    doc_name: 'System Access Review Summary Report',
    version: '2.1',
    framework_group: 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
    classification: 'RESTRICTED',
    issue_date: '2023-05-05',
    approval_date: '2026-08-01',
    review_conducted_date: '2026-08-01',
    effective_date: '2026-08-01',
    next_due_date: '2027-08-01',
    prepared_by: 'Aseef Sulaiman (IT Manager)',
    reviewed_by: 'Anju Ahmed',
    approved_by: authorizedSigners[0]?.name || 'Anjum Ahmad (Medical Director)',
    change_summary: 'Updated review privileges for critical server accounts, CCTV operators, and NAS storage access.'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync to Quick Master Setup & Local Storage
  const syncToQuickMasterSetup = (rec: SystemAccessReviewVersionRecord) => {
    try {
      const masterRaw = localStorage.getItem('sh_quick_master_setup');
      let masterData: any = {};
      if (masterRaw) {
        masterData = JSON.parse(masterRaw);
      }
      if (!masterData.documents || !Array.isArray(masterData.documents)) {
        masterData.documents = [];
      }
      
      // Check if doc exists
      const existingIdx = masterData.documents.findIndex((d: any) => d.ref_code === rec.ref_code);
      const docEntry = {
        id: existingIdx >= 0 ? masterData.documents[existingIdx].id : 'doc_' + Date.now(),
        ref_code: rec.ref_code,
        doc_name: 'System Access Review Summary Report',
        module_name: 'Access Management',
        framework_group: rec.framework_group,
        version_control: rec.version,
        issue_date: rec.issue_date || rec.revision_date,
        approval_date: rec.approval_date || rec.revision_date,
        review_conducted_date: rec.review_conducted_date || rec.approval_date || rec.revision_date,
        effective_date: rec.effective_date || rec.revision_date,
        next_due_date: rec.next_due_date || '2027-08-01',
        classification: rec.classification,
        prepared_by: rec.author,
        reviewed_by: rec.reviewed_by || 'Anju Ahmed',
        approved_by: rec.approved_by,
        is_mapped: true,
        client_id: activeClientId
      };

      if (existingIdx >= 0) {
        masterData.documents[existingIdx] = docEntry;
      } else {
        masterData.documents.unshift(docEntry);
      }
      localStorage.setItem('sh_quick_master_setup', JSON.stringify(masterData));
      localStorage.setItem(`sh_quick_master_setup_${activeClientId}`, JSON.stringify(masterData));

      // Dispatch event so Quick Master Setup and Automatic Module Resolver update in real time
      window.dispatchEvent(new CustomEvent('sh_doc_ref_loop_applied', { detail: docEntry }));
      window.dispatchEvent(new CustomEvent('sh_quick_master_setup_updated', { detail: masterData }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Failed to sync with sh_quick_master_setup', err);
    }
  };

  // Handle Add Version Record Submission
  const handleAddVersionRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionForm.version.trim()) return;

    const conductedDate = newVersionForm.review_conducted_date || newVersionForm.approval_date || defaultTodayDate;

    const newRecord: SystemAccessReviewVersionRecord = {
      id: 'vrec-' + Date.now(),
      version: newVersionForm.version.trim(),
      ref_code: newVersionForm.ref_code.trim() || docRef,
      revision_date: conductedDate,
      author: newVersionForm.prepared_by.trim() || preparedByInput,
      change_summary: newVersionForm.change_summary.trim() || 'Access governance revision update.',
      framework_group: newVersionForm.framework_group,
      status: 'Approved',
      approved_by: newVersionForm.approved_by.trim() || approvedByInput,
      classification: newVersionForm.classification,
      issue_date: newVersionForm.issue_date,
      approval_date: newVersionForm.approval_date,
      review_conducted_date: conductedDate,
      effective_date: newVersionForm.effective_date || newVersionForm.approval_date,
      next_due_date: newVersionForm.next_due_date,
      reviewed_by: newVersionForm.reviewed_by
    };

    const updatedHistory = [newRecord, ...versionHistory];
    setVersionHistory(updatedHistory);
    try {
      localStorage.setItem('sh_system_access_review_versions', JSON.stringify(updatedHistory));
    } catch {
      // ignore
    }

    // Apply directly to active state
    setDocRef(newRecord.ref_code);
    setDocVersion(newRecord.version);
    setDocClassification(newRecord.classification);
    setDocFrameworkGroup(newRecord.framework_group);
    if (newRecord.issue_date) setDocIssueDate(newRecord.issue_date);
    if (newRecord.approval_date) setDocApprovalDate(newRecord.approval_date);
    if (newRecord.review_conducted_date) {
      setReviewDateInput(newRecord.review_conducted_date);
    }
    if (newRecord.effective_date) setDocEffectiveDate(newRecord.effective_date);
    if (newRecord.next_due_date) setDocNextDueDate(newRecord.next_due_date);
    if (newRecord.reviewed_by) setDocReviewedBy(newRecord.reviewed_by);
    if (newRecord.author) setPreparedByInput(newRecord.author);
    if (newRecord.approved_by) setApprovedByInput(newRecord.approved_by);

    // Sync to Master Loop & Governance Matrix
    syncToQuickMasterSetup(newRecord);

    setIsAddVersionModalOpen(false);
    showToast(`✓ Successfully created Version Record [${newRecord.version}] & synced to Quick Master Setup Loop!`);
  };

  // Apply selected Loop Record
  const handleApplyLoopData = (data: DocRefLoopData) => {
    setDocRef(data.ref_code);
    setDocClassification(data.classification || 'RESTRICTED');
    setDocVersion(data.version || '2.1');
    if (data.framework_group) setDocFrameworkGroup(data.framework_group);
    if (data.prepared_by) setPreparedByInput(data.prepared_by);
    if (data.approved_by) setApprovedByInput(data.approved_by);
    if (data.reviewed_by) setDocReviewedBy(data.reviewed_by);
    if (data.issue_date) setDocIssueDate(data.issue_date);
    if (data.approval_date) setDocApprovalDate(data.approval_date);
    if (data.review_date) {
      setDocNextDueDate(data.review_date);
      setReviewDateInput(data.approval_date || defaultTodayDate);
    }

    // Also sync and broadcast to Quick Master Setup
    const loopRecord: SystemAccessReviewVersionRecord = {
      id: 'vrec-loop-' + Date.now(),
      version: data.version || '2.1',
      ref_code: data.ref_code,
      revision_date: data.issue_date || defaultTodayDate,
      author: data.prepared_by || preparedByInput,
      change_summary: 'Synchronized via Quick Master Setup Loop Connection',
      framework_group: data.framework_group || 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
      status: 'Approved',
      approved_by: data.approved_by || approvedByInput,
      classification: data.classification || 'RESTRICTED',
      issue_date: data.issue_date,
      approval_date: data.approval_date,
      review_conducted_date: data.approval_date || defaultTodayDate,
      effective_date: data.approval_date || data.issue_date,
      next_due_date: data.review_date,
      reviewed_by: data.reviewed_by
    };
    syncToQuickMasterSetup(loopRecord);

    showToast(`✓ Connected to Document Reference [${data.ref_code}] via Master Setup Loop!`);
  };

  // Selected Employee object (Auto-populates Employee Full Name, Employee ID, Position / Title)
  const selectedEmployee = useMemo(() => {
    return clientEmployees.find(e => e.id === selectedEmployeeId || e.employee_id === selectedEmployeeId) || null;
  }, [clientEmployees, selectedEmployeeId]);

  // Handle Employee Change
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    setFormValidationErrors([]);
    setSaveSuccessMessage(null);
    const emp = clientEmployees.find(e => e.id === empId || e.employee_id === empId);
    if (emp) {
      // Auto-suggest username if blank
      if (!usernameInput && !editingReviewId) {
        const cleanName = emp.employee_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsernameInput(cleanName.substring(0, 10));
      }
    }
  };

  // Reset form fields
  const resetForm = (preserveEmployee = false) => {
    if (!preserveEmployee) {
      setSelectedEmployeeId('');
      setUsernameInput('');
    }
    setSystemApplication('');
    setAccessRole('');
    setModulePrivilegeInput('');
    setStatusInput('Active');
    setNotesInput('');
    setEditingReviewId(null);
    setFormValidationErrors([]);
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!selectedEmployeeId || !selectedEmployee) {
      errors.push('Employee selection is required.');
    }
    if (!systemApplication) {
      errors.push('System / Application selection is required.');
    }
    if (!accessRole) {
      errors.push('Access Role selection is required.');
    }
    if (!approvedByInput || !approvedByInput.trim()) {
      errors.push('Approved By authorized person is required.');
    }
    if (!preparedByInput || !preparedByInput.trim()) {
      errors.push('Prepared By IT Manager is required.');
    }
    if (!reviewDateInput) {
      errors.push('Access Review Conducted Date is required.');
    }
    setFormValidationErrors(errors);
    return errors.length === 0;
  };

  // Save Record
  const handleSave = (addMore = false) => {
    if (!validateForm()) return;
    if (!selectedEmployee) return;

    const nowIso = new Date().toISOString();
    const actorName = currentUser?.full_name || 'IT Manager';

    if (editingReviewId) {
      // Update existing
      const existing = clientReviews.find(r => r.id === editingReviewId);
      if (!existing) return;

      const prevStatus = existing.status;
      const newAuditLog: AccessReviewAuditLog = {
        id: 'aud_' + Date.now(),
        action: prevStatus !== statusInput ? 'STATUS_CHANGED' : 'MODIFIED',
        changed_at: nowIso,
        changed_by: actorName,
        details: `Updated access review details for ${systemApplication} (${accessRole}).`,
        prev_status: prevStatus,
        new_status: statusInput
      };

      const updatedItem: SystemAccessReviewItem = {
        ...existing,
        employee_id: selectedEmployee.employee_id,
        employee_name: selectedEmployee.employee_name,
        position: selectedEmployee.position,
        department: selectedEmployee.department,
        branch_name: selectedEmployee.branch_name,
        system_application: systemApplication,
        access_role: accessRole,
        username: usernameInput.trim() || undefined,
        module_privilege: modulePrivilegeInput.trim() || undefined,
        status: statusInput,
        approved_by: approvedByInput,
        prepared_by: preparedByInput,
        review_date: reviewDateInput,
        updated_at: nowIso,
        modified_by: actorName,
        notes: notesInput.trim() || undefined,
        audit_history: [newAuditLog, ...(existing.audit_history || [])]
      };

      onUpdateAccessReview(updatedItem);
      setSaveSuccessMessage(`Successfully updated access review for ${selectedEmployee.employee_name} (${systemApplication})`);
      resetForm(false);
    } else {
      // Create new
      const newId = 'sar_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const initialAuditLog: AccessReviewAuditLog = {
        id: 'aud_' + Date.now(),
        action: 'CREATED',
        changed_at: nowIso,
        changed_by: actorName,
        details: `Created new access review for ${systemApplication} with role ${accessRole}.`,
        new_status: statusInput
      };

      const newItem: SystemAccessReviewItem = {
        id: newId,
        client_id: activeClientId,
        employee_id: selectedEmployee.employee_id,
        employee_name: selectedEmployee.employee_name,
        position: selectedEmployee.position,
        department: selectedEmployee.department,
        branch_name: selectedEmployee.branch_name,
        system_application: systemApplication,
        access_role: accessRole,
        username: usernameInput.trim() || undefined,
        module_privilege: modulePrivilegeInput.trim() || undefined,
        status: statusInput,
        approved_by: approvedByInput,
        prepared_by: preparedByInput,
        review_date: reviewDateInput,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: actorName,
        modified_by: actorName,
        notes: notesInput.trim() || undefined,
        audit_history: [initialAuditLog]
      };

      onAddAccessReview(newItem);
      const empName = selectedEmployee.employee_name;
      setSaveSuccessMessage(
        addMore
          ? `✓ Saved ${systemApplication} for ${empName}. Ready to add next system/app for the same employee!`
          : `✓ Successfully saved access review for ${empName} (${systemApplication}).`
      );

      if (addMore) {
        // Keep selected employee, prepared by, approved by, and review date ready for next system
        resetForm(true);
      } else {
        resetForm(false);
      }
    }
  };

  // Start Edit
  const handleStartEdit = (item: SystemAccessReviewItem) => {
    setEditingReviewId(item.id);
    const matchedEmp = clientEmployees.find(e => e.employee_id === item.employee_id || e.employee_name === item.employee_name);
    setSelectedEmployeeId(matchedEmp ? matchedEmp.id : item.employee_id);
    setSystemApplication(item.system_application as SystemApplicationType);
    setAccessRole(item.access_role as AccessRoleType);
    setUsernameInput(item.username || '');
    setModulePrivilegeInput(item.module_privilege || '');
    setApprovedByInput(item.approved_by || authorizedSigners[0]?.name || '');
    setPreparedByInput(item.prepared_by || defaultPreparedBy);
    setReviewDateInput(item.review_date || defaultTodayDate);
    setStatusInput(item.status);
    setNotesInput(item.notes || '');
    setFormValidationErrors([]);
    setSaveSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick Status Change directly from Table
  const handleQuickStatusChange = (item: SystemAccessReviewItem, newStatus: AccessReviewStatus) => {
    if (item.status === newStatus) return;
    const nowIso = new Date().toISOString();
    const actorName = currentUser?.full_name || 'IT Manager';

    const newAuditLog: AccessReviewAuditLog = {
      id: 'aud_' + Date.now(),
      action: 'STATUS_CHANGED',
      changed_at: nowIso,
      changed_by: actorName,
      details: `Changed status from ${item.status} to ${newStatus}.`,
      prev_status: item.status,
      new_status: newStatus
    };

    const updatedItem: SystemAccessReviewItem = {
      ...item,
      status: newStatus,
      updated_at: nowIso,
      modified_by: actorName,
      audit_history: [newAuditLog, ...(item.audit_history || [])]
    };
    onUpdateAccessReview(updatedItem);
  };

  // Filtered Summary Table Records
  const filteredReviews = useMemo(() => {
    return clientReviews.filter(r => {
      // Search
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.employee_name.toLowerCase().includes(q) ||
        r.employee_id.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q) ||
        r.system_application.toLowerCase().includes(q) ||
        r.access_role.toLowerCase().includes(q) ||
        (r.username && r.username.toLowerCase().includes(q)) ||
        (r.module_privilege && r.module_privilege.toLowerCase().includes(q)) ||
        (r.approved_by && r.approved_by.toLowerCase().includes(q)) ||
        (r.prepared_by && r.prepared_by.toLowerCase().includes(q));

      // Employee Filter
      const matchesEmp = filterEmployeeId === 'ALL' || r.employee_id === filterEmployeeId;

      // System Filter
      const matchesSys = filterSystem === 'ALL' || r.system_application === filterSystem;

      // Role Filter
      const matchesRole = filterRole === 'ALL' || r.access_role === filterRole;

      // Status Filter
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

      // Date Range Filter
      let matchesDate = true;
      if (filterStartDate && r.review_date < filterStartDate) matchesDate = false;
      if (filterEndDate && r.review_date > filterEndDate) matchesDate = false;

      return matchesSearch && matchesEmp && matchesSys && matchesRole && matchesStatus && matchesDate;
    });
  }, [clientReviews, searchTerm, filterEmployeeId, filterSystem, filterRole, filterStatus, filterStartDate, filterEndDate]);

  // Statistics
  const stats = useMemo(() => {
    const total = clientReviews.length;
    const active = clientReviews.filter(r => r.status === 'Active').length;
    const inactive = clientReviews.filter(r => r.status === 'Inactive').length;
    const removed = clientReviews.filter(r => r.status === 'Removed').length;
    const modified = clientReviews.filter(r => r.status === 'Modified').length;
    const adminCount = clientReviews.filter(r => r.access_role === 'Administrator').length;
    const uniqueEmployees = new Set(clientReviews.map(r => r.employee_id)).size;
    const uniqueSystems = new Set(clientReviews.map(r => r.system_application)).size;
    return { total, active, inactive, removed, modified, adminCount, uniqueEmployees, uniqueSystems };
  }, [clientReviews]);

  // Per-System Summaries and Breakdowns
  const systemSummaries = useMemo(() => {
    return SYSTEM_APPLICATION_OPTIONS.map((sysType) => {
      const config = SYSTEM_TYPE_CONFIGS[sysType];
      const allForSys = clientReviews.filter(r => r.system_application === sysType);
      const filteredForSys = filteredReviews.filter(r => r.system_application === sysType);
      const active = allForSys.filter(r => r.status === 'Active').length;
      const adminCount = allForSys.filter(r => r.access_role === 'Administrator').length;
      const inactive = allForSys.filter(r => r.status === 'Inactive').length;
      const removed = allForSys.filter(r => r.status === 'Removed').length;
      const modified = allForSys.filter(r => r.status === 'Modified').length;
      const uniqueEmployees = new Set(allForSys.map(r => r.employee_id)).size;

      return {
        sysType,
        config,
        total: allForSys.length,
        filteredTotal: filteredForSys.length,
        active,
        adminCount,
        inactive,
        removed,
        modified,
        uniqueEmployees,
        allReviews: allForSys,
        filteredReviews: filteredForSys
      };
    });
  }, [clientReviews, filteredReviews]);

  // Export to Excel (XLSX)
  const handleExportExcel = () => {
    const data = filteredReviews.map((r, i) => ({
      'Sl No': i + 1,
      'Employee Name': r.employee_name,
      'Employee ID': r.employee_id,
      'Position / Title': r.position,
      'Department': r.department || '-',
      'System / Application': r.system_application,
      'Access Role': r.access_role,
      'Username': r.username || '-',
      'Module / Privilege': r.module_privilege || '-',
      'Status': r.status,
      'Approved By': r.approved_by,
      'Prepared By': r.prepared_by,
      'Review Date': r.review_date,
      'Created At': r.created_at ? new Date(r.created_at).toLocaleString() : '-',
      'Last Modified': r.updated_at ? new Date(r.updated_at).toLocaleString() : '-',
      'Created By': r.created_by || '-',
      'Modified By': r.modified_by || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'System Access Reviews');
    const fileName = `${client?.company_name || 'Organization'}_System_Access_Review_Report_${defaultTodayDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export to PDF (ISO 27001 / ADHICS Compliant Summary Report)
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;

    // Header Band
    doc.setFillColor(30, 41, 59); // Dark slate
    doc.rect(0, 0, pageWidth, 58, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('SYSTEM ACCESS REVIEW SUMMARY REPORT', margin, 24);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const facilityLic = client?.doh_license_no || client?.trade_license_no || client?.license_number || 'DOH/HAAD Verified';
    doc.text(`Facility: ${client?.company_name || 'Healthcare Facility'} (${facilityLic}) | Doc Ref: ${docRef} | Classification: ${docClassification}`, margin, 40);
    doc.text(`Framework: ${docFrameworkGroup} | Version: ${docVersion} | Issue: ${docIssueDate} | Next Review Due: ${docNextDueDate}`, margin, 51);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, 66, pageWidth - margin * 2, 34, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL REVIEWS: ${stats.total}`, margin + 12, 86);
    doc.setTextColor(22, 101, 52);
    doc.text(`ACTIVE: ${stats.active}`, margin + 130, 86);
    doc.setTextColor(220, 38, 38);
    doc.text(`ADMINISTRATOR ROLES: ${stats.adminCount}`, margin + 220, 86);
    doc.setTextColor(79, 70, 229);
    doc.text(`UNIQUE EMPLOYEES: ${stats.uniqueEmployees}`, margin + 370, 86);
    doc.setTextColor(71, 85, 105);
    doc.text(`SYSTEMS / APPS: ${stats.uniqueSystems}`, margin + 520, 86);

    // Table Header
    const tableTop = 108;
    const colWidths = [24, 86, 68, 80, 110, 84, 60, 95, 48, 86, 86];
    const headers = [
      '#',
      'Employee Name',
      'Employee ID',
      'Position',
      'System / App',
      'Access Role',
      'Username',
      'Module/Privilege',
      'Status',
      'Approved By',
      'Prepared By'
    ];

    let startX = margin;
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, tableTop, pageWidth - margin * 2, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    headers.forEach((h, idx) => {
      doc.text(h, startX + 3, tableTop + 12);
      startX += colWidths[idx];
    });

    let currentY = tableTop + 18;
    const rowHeight = 17;

    filteredReviews.forEach((r, rowIdx) => {
      if (currentY + rowHeight > pageHeight - 50) {
        doc.addPage('landscape');
        currentY = 40;
      }

      // Zebra background
      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);

      let xPos = margin;
      // Index
      doc.text(String(rowIdx + 1), xPos + 3, currentY + 11);
      xPos += colWidths[0];

      // Name
      doc.setFont('helvetica', 'bold');
      doc.text(r.employee_name.substring(0, 18), xPos + 3, currentY + 11);
      doc.setFont('helvetica', 'normal');
      xPos += colWidths[1];

      // ID
      doc.text(r.employee_id, xPos + 3, currentY + 11);
      xPos += colWidths[2];

      // Position
      doc.text((r.position || '').substring(0, 16), xPos + 3, currentY + 11);
      xPos += colWidths[3];

      // System
      doc.text((r.system_application || '').substring(0, 24), xPos + 3, currentY + 11);
      xPos += colWidths[4];

      // Role
      if (r.access_role === 'Administrator') {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(r.access_role, xPos + 3, currentY + 11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      xPos += colWidths[5];

      // Username
      doc.text(r.username || '-', xPos + 3, currentY + 11);
      xPos += colWidths[6];

      // Privilege
      doc.text((r.module_privilege || '-').substring(0, 20), xPos + 3, currentY + 11);
      xPos += colWidths[7];

      // Status
      if (r.status === 'Active') {
        doc.setTextColor(22, 101, 52);
      } else if (r.status === 'Removed') {
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setTextColor(202, 138, 4);
      }
      doc.text(r.status, xPos + 3, currentY + 11);
      doc.setTextColor(30, 41, 59);
      xPos += colWidths[8];

      // Approved By
      doc.text((r.approved_by || '').substring(0, 18), xPos + 3, currentY + 11);
      xPos += colWidths[9];

      // Prepared By
      doc.text((r.prepared_by || '').substring(0, 18), xPos + 3, currentY + 11);

      // Line bottom
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

      currentY += rowHeight;
    });

    // Signature Block at Bottom
    if (currentY + 60 > pageHeight - 30) {
      doc.addPage('landscape');
      currentY = 40;
    }

    const signY = Math.max(currentY + 16, pageHeight - 75);
    doc.setDrawColor(148, 163, 184);
    doc.line(margin, signY, margin + 200, signY);
    doc.line(pageWidth - margin - 200, signY, pageWidth - margin, signY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`PREPARED BY: ${preparedByInput}`, margin, signY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('IT Manager / Information Security Lead', margin, signY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`APPROVED BY: ${approvedByInput}`, pageWidth - margin - 200, signY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Authorized Representative / Medical Director', pageWidth - margin - 200, signY + 22);

    // Save
    doc.save(`${client?.company_name || 'System'}_Access_Review_Report_${defaultTodayDate}.pdf`);
  };

  // Direct Print HTML
  const handleDirectPrint = (forcedLayout?: 'all_one_page' | 'grouped_by_system') => {
    const activeLayout = forcedLayout || viewLayout;
    const facilityLogoSrc = client?.facility_logo || client?.logo_url;
    const facilityLogoHtml = facilityLogoSrc
      ? `<img src="${facilityLogoSrc}" alt="${client?.company_name || 'Logo'}" style="max-height: 48px; max-width: 140px; object-fit: contain; margin-bottom: 6px;" />`
      : `<div style="display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: #3b82f6; color: white; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 4px;">🏥</div>`;
    const facilityLic = client?.doh_license_no || client?.trade_license_no || client?.license_number || 'DOH/HAAD Verified';

    let tableBodyHtml = '';

    if (activeLayout === 'grouped_by_system') {
      // Grouped by System / Application Print Format
      const systemsWithRecords = systemSummaries.filter(s => filterSystem === 'ALL' ? s.filteredTotal > 0 : s.sysType === filterSystem);
      const displaySystems = systemsWithRecords.length > 0 ? systemsWithRecords : systemSummaries;

      tableBodyHtml = displaySystems.map(sys => `
        <div style="margin-top: 14px; margin-bottom: 16px; page-break-inside: avoid;">
          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-left: 5px solid #4f46e5; border-radius: 6px; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 11px; color: #0f172a; text-transform: uppercase;">${sys.sysType}</strong>
              <span style="font-size: 9px; color: #64748b; margin-left: 8px;">[${sys.config.category}] — ${sys.config.description}</span>
            </div>
            <div style="display: flex; gap: 6px; font-size: 9px;">
              <span class="badge" style="background:#e0e7ff; color:#3730a3;">Total: ${sys.filteredTotal}</span>
              <span class="badge badge-active">Active: ${sys.active}</span>
              ${sys.adminCount > 0 ? `<span class="badge badge-admin">Privileged Admins: ${sys.adminCount}</span>` : ''}
              ${sys.inactive > 0 ? `<span class="badge badge-inactive">Inactive: ${sys.inactive}</span>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 20px;">#</th>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Position / Title</th>
                <th>Access Role</th>
                <th>Username</th>
                <th>Module / Privilege</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Prepared By</th>
                <th>Review Conducted Date</th>
              </tr>
            </thead>
            <tbody>
              ${sys.filteredReviews.length === 0 ? `
                <tr>
                  <td colspan="11" style="text-align: center; color: #94a3b8; padding: 10px; font-style: italic;">
                    No access review accounts recorded for ${sys.sysType}.
                  </td>
                </tr>
              ` : sys.filteredReviews.map((r, i) => `
                <tr>
                  <td style="text-align: center;">${i + 1}</td>
                  <td><strong>${r.employee_name}</strong></td>
                  <td><code>${r.employee_id}</code></td>
                  <td>${r.position || '-'}</td>
                  <td><span class="${r.access_role === 'Administrator' ? 'badge badge-admin' : ''}">${r.access_role}</span></td>
                  <td><code>${r.username || '-'}</code></td>
                  <td>${r.module_privilege || '-'}</td>
                  <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status}</span></td>
                  <td>${r.approved_by}</td>
                  <td>${r.prepared_by}</td>
                  <td>${r.review_date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('');
    } else {
      // Consolidated One Page Master Table
      tableBodyHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 20px;">#</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Position / Title</th>
              <th>System / Application</th>
              <th>Access Role</th>
              <th>Username</th>
              <th>Module / Privilege</th>
              <th>Status</th>
              <th>Approved By</th>
              <th>Prepared By</th>
              <th>Review Conducted Date</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReviews.length === 0 ? `
              <tr>
                <td colspan="12" style="text-align: center; color: #94a3b8; padding: 14px; font-style: italic;">
                  No access review records match the active filter criteria.
                </td>
              </tr>
            ` : filteredReviews.map((r, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td><strong>${r.employee_name}</strong></td>
                <td><code>${r.employee_id}</code></td>
                <td>${r.position || '-'}</td>
                <td><strong>${r.system_application}</strong></td>
                <td><span class="${r.access_role === 'Administrator' ? 'badge badge-admin' : ''}">${r.access_role}</span></td>
                <td><code>${r.username || '-'}</code></td>
                <td>${r.module_privilege || '-'}</td>
                <td><span class="badge ${r.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${r.status}</span></td>
                <td>${r.approved_by}</td>
                <td>${r.prepared_by}</td>
                <td>${r.review_date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SYSTEM ACCESS REVIEW SUMMARY REPORT - ${client?.company_name || 'Facility'}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 6px; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
          .facility-info { display: flex; align-items: center; gap: 12px; }
          .title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; }
          .sub-title { font-size: 9.5px; color: #475569; margin-top: 2px; }
          .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px; margin-bottom: 8px; display: flex; justify-content: space-between; font-size: 9.5px; }
          .meta-box strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9px; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: 700; text-align: left; padding: 4px 6px; border: 1px solid #cbd5e1; font-size: 8.5px; text-transform: uppercase; }
          td { padding: 4px 6px; border: 1px solid #cbd5e1; vertical-align: middle; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-size: 8px; font-weight: 700; }
          .badge-active { background: #dcfce7; color: #166534; }
          .badge-inactive { background: #fee2e2; color: #991b1b; }
          .badge-admin { background: #fee2e2; color: #b91c1c; font-weight: 800; border: 1px solid #fca5a5; }
          .badge-class { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #3730a3; font-weight: bold; font-size: 8.5px; }
          .signatures { margin-top: 20px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { width: 220px; border-top: 1px solid #475569; padding-top: 4px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="facility-info">
            <div>${facilityLogoHtml}</div>
            <div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${client?.company_name || 'Organization / Healthcare Facility'}</div>
              <div style="font-size: 9px; color: #64748b;">License: ${facilityLic} | Location: ${client?.address || 'Abu Dhabi, UAE'}</div>
              <h1 class="title" style="margin-top: 3px;">System Access Review Summary Report ${activeLayout === 'grouped_by_system' ? '• Grouped by System' : '• Consolidated Master'}</h1>
              <div class="sub-title">IT Access Governance • ISO 27001:2022 (A.9.2.5) & ADHICS v2.0 Access Control Standard</div>
            </div>
          </div>
          <div style="text-align: right; font-size: 8.5px; color: #334155; line-height: 1.35;">
            <div><span class="badge-class">${docClassification}</span></div>
            <div style="margin-top: 3px;"><strong>Doc Ref:</strong> ${docRef}</div>
            <div><strong>Version Control:</strong> ${docVersion}</div>
            <div><strong>Framework Tier:</strong> ${docFrameworkGroup}</div>
            <div><strong>Issue:</strong> ${docIssueDate} | <strong>Review Conducted:</strong> ${reviewDateInput} | <strong>Next Due:</strong> ${docNextDueDate}</div>
          </div>
        </div>

        <div class="meta-box">
          <div><strong>Facility:</strong> ${client?.company_name || 'Organization'}</div>
          <div><strong>Layout Mode:</strong> ${activeLayout === 'grouped_by_system' ? 'Grouped by System / App' : 'All Reviews (One Page)'}</div>
          <div><strong>Total Reviews:</strong> ${filteredReviews.length}</div>
          <div><strong>Active Accounts:</strong> ${stats.active}</div>
          <div><strong>Privileged Admins:</strong> ${stats.adminCount}</div>
          <div><strong>Unique Employees:</strong> ${stats.uniqueEmployees}</div>
          <div><strong>Systems Covered:</strong> ${stats.uniqueSystems}</div>
        </div>

        ${tableBodyHtml}

        <div class="signatures">
          <div class="sig-box">
            <strong>Prepared By (IT Manager):</strong><br/>
            ${preparedByInput}<br/>
            <span style="color: #64748b;">IT Manager / Information Security Lead</span>
          </div>
          <div class="sig-box" style="text-align: center;">
            <strong>Reviewed By (Compliance Officer):</strong><br/>
            ${docReviewedBy}<br/>
            <span style="color: #64748b;">Compliance Officer / Governance Lead</span>
          </div>
          <div class="sig-box" style="text-align: right;">
            <strong>Approved By (Authorized Signer):</strong><br/>
            ${approvedByInput}<br/>
            <span style="color: #64748b;">Medical Director / Authorized Person</span>
          </div>
        </div>
      </body>
      </html>
    `;
    printHtmlInHiddenIframe(htmlContent);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Facility Header Card & Logo Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Facility Logo & Identity */}
          <div className="flex items-start sm:items-center gap-4">
            {(client?.facility_logo || client?.logo_url) ? (
              <div className="bg-white p-2.5 rounded-xl shadow-inner border border-slate-300 shrink-0 flex items-center justify-center">
                <img
                  src={client.facility_logo || client.logo_url}
                  alt={client.company_name || 'Facility Logo'}
                  className="h-12 w-auto max-w-[130px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/80 text-white border border-indigo-400 flex flex-col items-center justify-center font-extrabold shadow-md shrink-0">
                <Building className="w-6 h-6 text-indigo-200" />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-100 mt-0.5">Facility</span>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400/40 uppercase tracking-wide">
                  Healthcare Facility Profile
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> DOH / HAAD Verified
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {client?.company_name || 'Organization / Healthcare Facility'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span>License: <strong className="text-white">{client?.doh_license_no || client?.trade_license_no || client?.license_number || 'DOH/HAAD-2026-F01'}</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-white">{client?.address || 'Abu Dhabi, UAE'}</strong></span>
                <span>•</span>
                <span>Medical Director: <strong className="text-indigo-200">{client?.medical_director?.name || 'Dr. Faisal Al-Mansoori'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl shadow-sm border border-slate-700 bg-slate-800/90 p-0.5">
              <button
                onClick={() => handleDirectPrint('all_one_page')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition"
                title="Print All Reviews (Consolidated One Page)"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                Print One Page
              </button>
              <button
                onClick={() => handleDirectPrint('grouped_by_system')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition border-l border-slate-700"
                title="Print Grouped by System / Application Cards"
              >
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                Print Grouped by System
              </button>
            </div>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-sm"
              title="Export Official PDF"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-sm"
              title="Export XLSX Spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Document Governance, Version Control & Classification Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Classification Pill */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Classification</span>
              <div className="mt-0.5">
                <select
                  value={docClassification}
                  onChange={(e) => {
                    setDocClassification(e.target.value);
                    showToast(`Classification updated to: ${e.target.value}`);
                  }}
                  className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer py-0.5 border-b border-dashed border-amber-400/50"
                >
                  {CLASSIFICATION_OPTIONS.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <Tag className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
          </div>

          {/* Version Control Pill */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Version Control</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-white text-xs">{docVersion}</span>
                <button
                  onClick={() => setIsVersionHistoryModalOpen(true)}
                  className="text-[10px] text-indigo-300 hover:text-indigo-100 underline ml-1"
                >
                  History ({versionHistory.length})
                </button>
              </div>
            </div>
            <History className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
          </div>

          {/* Framework Tier Group */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Framework Tier Group</span>
              <span className="font-bold text-emerald-300 text-xs truncate block max-w-[170px]" title={docFrameworkGroup}>
                {docFrameworkGroup}
              </span>
            </div>
            <Award className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
          </div>

          {/* Document Reference Code */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Doc Ref & Due Date</span>
              <span className="font-mono font-bold text-cyan-300 text-xs">{docRef}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">Due: {docNextDueDate}</span>
            </div>
            <Bookmark className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Master Setup Loop & Facility Governance Resolver Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <span>Quick Master Setup & Facility Governance Matrix</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700">Document Reference Details & Automatic Module Resolver</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              Document Reference Loop & Version Resolver
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or apply governance metadata from the Quick Master Setup loop to keep ref code, classification, version record, and signers synchronized.
            </p>
          </div>

          {/* Action buttons for loop */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddVersionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              + Add Version Record & Framework Tier Group
            </button>

            <button
              onClick={() => setIsVersionHistoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              Version Records ({versionHistory.length})
            </button>

            {onNavigateTab && (
              <button
                onClick={() => {
                  onNavigateTab('policies');
                  showToast('Navigating to Quick Master Setup & Facility Governance Matrix...');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition border border-indigo-200"
                title="Open Quick Master Setup & Facility Governance Matrix"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                Open Master Governance
              </button>
            )}
          </div>
        </div>

        {/* Master Setup Doc Ref Loop Connection Component */}
        <div className="mt-4">
          <DocRefLoopSelector
            currentRefCode={docRef}
            onApplyLoop={handleApplyLoopData}
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Reviews</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
          <span className="text-[10.5px] text-slate-500">{stats.uniqueEmployees} Employees</span>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Active Status</span>
          <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{stats.active}</div>
          <span className="text-[10.5px] text-emerald-600 font-medium">Authorized</span>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Privileged Admins</span>
          <div className="text-xl font-extrabold text-rose-800 mt-0.5">{stats.adminCount}</div>
          <span className="text-[10.5px] text-rose-600 font-medium">Critical Roles</span>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">IT Systems</span>
          <div className="text-xl font-extrabold text-sky-800 mt-0.5">{stats.uniqueSystems}</div>
          <span className="text-[10.5px] text-sky-600 font-medium">Applications</span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Modified</span>
          <div className="text-xl font-extrabold text-amber-800 mt-0.5">{stats.modified}</div>
          <span className="text-[10.5px] text-amber-600 font-medium">Permission edits</span>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Inactive</span>
          <div className="text-xl font-extrabold text-slate-700 mt-0.5">{stats.inactive}</div>
          <span className="text-[10.5px] text-slate-500 font-medium">Suspended</span>
        </div>
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Removed</span>
          <div className="text-xl font-extrabold text-red-800 mt-0.5">{stats.removed}</div>
          <span className="text-[10.5px] text-red-600 font-medium">Revoked access</span>
        </div>
      </div>

      {/* Sequential Access Review Entry Form */}
      <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {editingReviewId ? '✎' : '+'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingReviewId ? 'Edit System Access Review Entry' : 'New System Access Review Entry'}
              </h2>
              <p className="text-xs text-slate-500">
                Sequential Workflow: Employee Details → System/Application → Access Role → Username (Optional) → Module/Privilege (Optional) → Save & Add More
              </p>
            </div>
          </div>

          {editingReviewId && (
            <button
              onClick={() => resetForm(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Validation Errors banner */}
        {formValidationErrors.length > 0 && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-1">Please complete mandatory fields before saving:</strong>
              <ul className="list-disc list-inside space-y-0.5">
                {formValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Success message banner */}
        {saveSuccessMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveSuccessMessage}</span>
            </div>
            <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* STEP 1: Employee & Operator Management → Employee Details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Employee & Operator Management → Employee Details
              </h3>
              <span className="text-[10px] text-rose-600 font-semibold">* Required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Select Employee dropdown */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee from Master List <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                >
                  <option value="">-- Choose Existing Employee --</option>
                  {clientEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_name} ({emp.employee_id}) - {emp.position}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Retrieves master employee record automatically.
                </p>
              </div>

              {/* Auto-populated: Employee Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Full Name <span className="text-[10.5px] text-indigo-600 font-normal">(Auto-populated)</span>
                </label>
                <div className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold flex items-center justify-between min-h-[34px]">
                  <span>{selectedEmployee?.employee_name || '<Select Employee>'}</span>
                  {selectedEmployee && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>

              {/* Auto-populated: Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID <span className="text-[10.5px] text-indigo-600 font-normal">(Auto-populated)</span>
                </label>
                <div className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 font-mono text-indigo-800 font-bold flex items-center justify-between min-h-[34px]">
                  <span>{selectedEmployee?.employee_id || '<Select Employee>'}</span>
                  {selectedEmployee && <Key className="w-3.5 h-3.5 text-indigo-500" />}
                </div>
              </div>

              {/* Auto-populated: Position / Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Position / Title <span className="text-[10.5px] text-indigo-600 font-normal">(Auto-populated)</span>
                </label>
                <div className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold flex items-center justify-between min-h-[34px]">
                  <span>{selectedEmployee?.position || '<Select Employee>'}</span>
                  {selectedEmployee?.department && (
                    <span className="text-[9.5px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-normal">
                      {selectedEmployee.department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 & 3: System / Application Selection & Access Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System / Application */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold flex items-center justify-center">
                  2
                </span>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  System / Application <span className="text-rose-600">*</span>
                </label>
              </div>
              <select
                value={systemApplication}
                onChange={(e) => setSystemApplication(e.target.value as SystemApplicationType)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Select Applicable System / Application --</option>
                {SYSTEM_APPLICATION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {SYSTEM_APPLICATION_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSystemApplication(opt)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                      systemApplication === opt
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.replace('Desktop / Computer User Accounts', 'Desktop')}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Role */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold flex items-center justify-center">
                  3
                </span>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Access Role <span className="text-rose-600">*</span>
                </label>
              </div>
              <select
                value={accessRole}
                onChange={(e) => setAccessRole(e.target.value as AccessRoleType)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Select Assigned Access Role --</option>
                {ACCESS_ROLE_OPTIONS.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {ACCESS_ROLE_OPTIONS.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setAccessRole(role)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                      accessRole === role
                        ? role === 'Administrator'
                          ? 'bg-rose-600 text-white border-rose-600 font-bold'
                          : 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4 & 5: Username (Optional) & Module / Privilege (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-extrabold flex items-center justify-center">
                    4
                  </span>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Username <span className="text-[10.5px] text-slate-500 font-normal">(Optional)</span>
                  </label>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Example: yasserit</span>
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter actual system/application username (e.g. yasserit)"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Optional: Record the exact username, domain login ID, or system account tag.
              </p>
            </div>

            {/* Module / Privilege */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-extrabold flex items-center justify-center">
                    5
                  </span>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Module / Privilege <span className="text-[10.5px] text-slate-500 font-normal">(Optional)</span>
                  </label>
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Quick suggestions below</span>
              </div>
              <input
                type="text"
                value={modulePrivilegeInput}
                onChange={(e) => setModulePrivilegeInput(e.target.value)}
                placeholder="Specific module, permission, or privilege (e.g. Firewall Administration)"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {MODULE_PRIVILEGE_SUGGESTIONS.slice(0, 6).map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setModulePrivilegeInput(sug)}
                    className="text-[9.5px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 6 & 7: Approval and Review Information & Status */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold flex items-center justify-center">
                6
              </span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Approval, Signatory and Review Governance Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Approved By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved By <span className="text-rose-600">*</span>
                </label>
                <select
                  value={approvedByInput}
                  onChange={(e) => setApprovedByInput(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {authorizedSigners.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
                  {/* Custom fallback */}
                  <option value="Dr. Faisal Al-Mansoori (Medical Director)">Dr. Faisal Al-Mansoori (Medical Director)</option>
                  <option value="Faizal (Authorized Representative)">Faizal (Authorized Representative)</option>
                  <option value="Aseef Sulaiman (Clinic Manager)">Aseef Sulaiman (Clinic Manager)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Authorized Person / Medical Director</p>
              </div>

              {/* Prepared By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prepared By <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={preparedByInput}
                  onChange={(e) => setPreparedByInput(e.target.value)}
                  placeholder="IT Manager Name & Title"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">IT Manager conducting access audit</p>
              </div>

              {/* Review Conducted Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Review Conducted Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={reviewDateInput}
                  onChange={(e) => setReviewDateInput(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Audit verification date</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Status (Default: Active)
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as AccessReviewStatus)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Removed">Removed</option>
                  <option value="Modified">Modified</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Current state of the account</p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save & Save & Add More */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>Save & Add More</strong> saves this entry and immediately keeps the current employee selected so you can add their next system/app (e.g. Desktop → Firewall → NAS → App).
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => resetForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Clear Fields
              </button>

              {/* Save & Add More Button */}
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                Save & Add More
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                {editingReviewId ? 'Update Access Record' : 'Save Access Record'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL REPORT DISPLAY & SUMMARY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {/* Table Controls, Layout Switcher & Filters */}
        <div className="space-y-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  System Access Review Summary Report ({filteredReviews.length} Records)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit register of employee access rights, roles, privileges, and approval history across enterprise systems.
              </p>
            </div>

            {/* Layout Mode Segmented Selector & Direct Print Toolbar */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewLayout('all_one_page')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewLayout === 'all_one_page'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Consolidated master table showing all system reviews on one unified page"
                >
                  <LayoutList className="w-4 h-4 text-indigo-600" />
                  <span>All Reviews (One Page)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    viewLayout === 'all_one_page' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {filteredReviews.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewLayout('grouped_by_system')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewLayout === 'grouped_by_system'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Separate dedicated cards & tables organized by System / Application type"
                >
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  <span>Grouped by System / App</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    viewLayout === 'grouped_by_system' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    7 Types
                  </span>
                </button>
              </div>

              {/* Direct Print Shortcuts */}
              <div className="inline-flex rounded-xl shadow-sm border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => handleDirectPrint('all_one_page')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 rounded-lg transition"
                  title="Print All Reviews (One Page Master)"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print (One Page)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPrint('grouped_by_system')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 rounded-lg transition border-l border-slate-200"
                  title="Print Grouped by System"
                >
                  <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print (Grouped)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick System / Application Filter Badges Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ListFilter className="w-3 h-3 text-indigo-500" />
                Quick Filter by System / Application Type
              </span>
              {filterSystem !== 'ALL' && (
                <button
                  onClick={() => setFilterSystem('ALL')}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                >
                  Clear System Filter (Show All)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {/* All Systems Pill */}
              <button
                type="button"
                onClick={() => setFilterSystem('ALL')}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  filterSystem === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>All Systems & Apps</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterSystem === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {clientReviews.length}
                </span>
              </button>

              {/* Individual System Pills */}
              {systemSummaries.map(sys => {
                const isSelected = filterSystem === sys.sysType;
                return (
                  <button
                    key={sys.sysType}
                    type="button"
                    onClick={() => setFilterSystem(isSelected ? 'ALL' : sys.sysType)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                        : `${sys.config.headerBg} hover:opacity-90 ${sys.config.accentText} ${sys.config.headerBorder}`
                    }`}
                  >
                    {getSystemIcon(sys.sysType, 'w-3.5 h-3.5')}
                    <span>{sys.config.shortLabel}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-indigo-800 text-white' : `${sys.config.badgeBg} ${sys.config.badgeText}`
                    }`}>
                      {sys.total}
                    </span>
                    {sys.adminCount > 0 && (
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-extrabold ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                        }`}
                        title={`${sys.adminCount} Privileged Administrator account(s)`}
                      >
                        {sys.adminCount} Adm
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee, ID, role, app, username, privilege..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Employee */}
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Employees ({clientEmployees.length})</option>
                {clientEmployees.map(emp => (
                  <option key={emp.id} value={emp.employee_id}>
                    {emp.employee_name} ({emp.employee_id})
                  </option>
                ))}
              </select>

              {/* Filter Role */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                {ACCESS_ROLE_OPTIONS.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                {ACCESS_STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW MODE 1: ALL REVIEWS (ONE PAGE CONSOLIDATED MASTER TABLE) */}
        {/* ------------------------------------------------------------- */}
        {viewLayout === 'all_one_page' && (
          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200 w-10 text-center">#</th>
                  <th className="p-3 border-r border-slate-200 min-w-[140px]">Employee Name</th>
                  <th className="p-3 border-r border-slate-200 min-w-[100px]">Employee ID</th>
                  <th className="p-3 border-r border-slate-200 min-w-[130px]">Position / Title</th>
                  <th className="p-3 border-r border-slate-200 min-w-[170px]">System / Application</th>
                  <th className="p-3 border-r border-slate-200 min-w-[130px]">Access Role</th>
                  <th className="p-3 border-r border-slate-200 min-w-[100px]">Username</th>
                  <th className="p-3 border-r border-slate-200 min-w-[150px]">Module / Privilege</th>
                  <th className="p-3 border-r border-slate-200 min-w-[100px]">Status</th>
                  <th className="p-3 border-r border-slate-200 min-w-[140px]">Approved By</th>
                  <th className="p-3 border-r border-slate-200 min-w-[140px]">Prepared By</th>
                  <th className="p-3 border-r border-slate-200 min-w-[95px]">Review Date</th>
                  <th className="p-3 text-center min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-500">
                      <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">No access review records match the selected filters.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select an employee above and click "Save" or "Save & Add More" to register review entries.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((item, index) => {
                    const isAdministrator = item.access_role === 'Administrator';
                    const sysConfig = SYSTEM_TYPE_CONFIGS[item.system_application] || {
                      badgeBg: 'bg-slate-100',
                      badgeText: 'text-slate-800',
                      badgeBorder: 'border-slate-300'
                    };

                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/40 transition">
                        <td className="p-3 border-r border-slate-200 text-center font-mono text-slate-500">
                          {index + 1}
                        </td>

                        {/* Employee Name */}
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                          {item.employee_name}
                        </td>

                        {/* Employee ID */}
                        <td className="p-3 border-r border-slate-200 font-mono text-indigo-700 font-semibold">
                          {item.employee_id}
                        </td>

                        {/* Position / Title */}
                        <td className="p-3 border-r border-slate-200 text-slate-700">
                          <div>{item.position}</div>
                          {item.department && (
                            <div className="text-[10px] text-slate-400">{item.department}</div>
                          )}
                        </td>

                        {/* System / Application */}
                        <td className="p-3 border-r border-slate-200">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-semibold"
                               style={{ backgroundColor: 'rgba(241, 245, 249, 0.7)' }}>
                            {getSystemIcon(item.system_application, 'w-3.5 h-3.5 text-indigo-600 shrink-0')}
                            <span className="text-slate-900">{item.system_application}</span>
                          </div>
                        </td>

                        {/* Access Role */}
                        <td className="p-3 border-r border-slate-200">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                              isAdministrator
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : item.access_role === 'Operator'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {item.access_role}
                          </span>
                        </td>

                        {/* Username */}
                        <td className="p-3 border-r border-slate-200 font-mono text-slate-700">
                          {item.username ? (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                              {item.username}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Module / Privilege */}
                        <td className="p-3 border-r border-slate-200 text-slate-700">
                          {item.module_privilege ? (
                            <span className="text-[11px] font-medium text-slate-800">
                              {item.module_privilege}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status with Quick Toggle */}
                        <td className="p-3 border-r border-slate-200">
                          <select
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item, e.target.value as AccessReviewStatus)}
                            className={`text-[10.5px] font-bold rounded-lg px-2 py-1 border transition focus:outline-none ${
                              item.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.status === 'Inactive'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : item.status === 'Removed'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Removed">Removed</option>
                            <option value="Modified">Modified</option>
                          </select>
                        </td>

                        {/* Approved By */}
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-700">
                          <div className="font-semibold text-slate-900">{item.approved_by}</div>
                        </td>

                        {/* Prepared By */}
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-700">
                          <div className="font-medium text-slate-800">{item.prepared_by}</div>
                        </td>

                        {/* Review Date */}
                        <td className="p-3 border-r border-slate-200 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                          {item.review_date}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Audit History */}
                            <button
                              onClick={() => setAuditModalItem(item)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="View Audit & Control History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Edit Review Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE 2: GROUPED BY SYSTEM / APPLICATION (SEPARATE DEDICATED CARDS) */}
        {/* ------------------------------------------------------------------- */}
        {viewLayout === 'grouped_by_system' && (
          <div className="space-y-6 mt-4">
            {systemSummaries
              .filter(sys => filterSystem === 'ALL' || sys.sysType === filterSystem)
              .map(sys => {
                const records = sys.filteredReviews;

                return (
                  <div
                    key={sys.sysType}
                    className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white"
                  >
                    {/* System Section Header Banner */}
                    <div className={`p-4 border-b ${sys.config.headerBorder} ${sys.config.headerBg} flex flex-col lg:flex-row lg:items-center justify-between gap-3`}>
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-indigo-700 shrink-0">
                          {getSystemIcon(sys.sysType, 'w-5 h-5')}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {sys.sysType}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${sys.config.badgeBg} ${sys.config.badgeText} ${sys.config.badgeBorder}`}>
                              {sys.config.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {sys.config.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Side Stats & Quick Add Button */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs shadow-xs">
                          <span className="text-slate-500 font-semibold">Total:</span>
                          <span className="font-mono font-bold text-slate-900">{sys.total}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                          <span className="font-semibold">Active:</span>
                          <span className="font-mono font-bold">{sys.active}</span>
                        </div>

                        {sys.adminCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 text-xs text-rose-800 font-bold">
                            <span>Admins:</span>
                            <span className="font-mono">{sys.adminCount}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSystemApplication(sys.sysType);
                            const formElement = document.getElementById('step-2-system-role');
                            if (formElement) {
                              formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            showToast(`Selected ${sys.sysType}. Complete details in form above.`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm ml-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add {sys.config.shortLabel}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Table for this System */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[9.5px] tracking-wider border-b border-slate-200">
                            <th className="p-2.5 border-r border-slate-200 w-10 text-center">#</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[140px]">Employee Name</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[100px]">Employee ID</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[130px]">Position / Title</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[130px]">Access Role</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[100px]">Username</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[150px]">Module / Privilege</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[100px]">Status</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[130px]">Approved By</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[130px]">Prepared By</th>
                            <th className="p-2.5 border-r border-slate-200 min-w-[95px]">Review Date</th>
                            <th className="p-2.5 text-center min-w-[100px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {records.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="p-6 text-center text-slate-500 bg-slate-50/30">
                                <p className="font-semibold text-xs text-slate-600">No review records found for {sys.sysType}.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSystemApplication(sys.sysType);
                                    const formElement = document.getElementById('step-2-system-role');
                                    if (formElement) {
                                      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                    showToast(`Selected ${sys.sysType}. Choose employee to complete.`);
                                  }}
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Register First Access Account for {sys.sysType}
                                </button>
                              </td>
                            </tr>
                          ) : (
                            records.map((item, index) => {
                              const isAdministrator = item.access_role === 'Administrator';
                              return (
                                <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                                  <td className="p-2.5 border-r border-slate-200 text-center font-mono text-slate-500">
                                    {index + 1}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">
                                    {item.employee_name}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 font-mono text-indigo-700 font-semibold">
                                    {item.employee_id}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 text-slate-700">
                                    <div>{item.position}</div>
                                    {item.department && (
                                      <div className="text-[10px] text-slate-400">{item.department}</div>
                                    )}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        isAdministrator
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : item.access_role === 'Operator'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      }`}
                                    >
                                      {item.access_role}
                                    </span>
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 font-mono text-slate-700">
                                    {item.username ? (
                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px] font-semibold text-slate-800">
                                        {item.username}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 text-slate-700">
                                    {item.module_privilege || <span className="text-slate-400">-</span>}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200">
                                    <select
                                      value={item.status}
                                      onChange={(e) => handleQuickStatusChange(item, e.target.value as AccessReviewStatus)}
                                      className={`text-[10px] font-bold rounded-lg px-2 py-0.5 border transition focus:outline-none ${
                                        item.status === 'Active'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                          : item.status === 'Inactive'
                                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                                          : item.status === 'Removed'
                                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                                          : 'bg-amber-50 text-amber-800 border-amber-300'
                                      }`}
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Inactive">Inactive</option>
                                      <option value="Removed">Removed</option>
                                      <option value="Modified">Modified</option>
                                    </select>
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 text-[10.5px] font-semibold text-slate-800">
                                    {item.approved_by}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 text-[10.5px] text-slate-700">
                                    {item.prepared_by}
                                  </td>
                                  <td className="p-2.5 border-r border-slate-200 text-slate-700 font-mono text-[10.5px] whitespace-nowrap">
                                    {item.review_date}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => setAuditModalItem(item)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                        title="View Audit History"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleStartEdit(item)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                        title="Edit Review"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmItem(item)}
                                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                        title="Delete Review"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Footer Audit Statement */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Access Governance Compliance:</strong> All employee privilege assignments are recorded with timestamps, creator identification, and authorized approvals in accordance with ISO 27001 (A.9) and ADHICS access management controls.
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            SmartHub IT Access Management v2.0
          </div>
        </div>
      </div>

      {/* AUDIT & CONTROL HISTORY MODAL */}
      {auditModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Access Review Audit & Control Record
                  </h3>
                  <p className="text-xs text-slate-500">
                    {auditModalItem.employee_name} ({auditModalItem.employee_id}) — {auditModalItem.system_application}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Audit Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
                <span className="font-semibold text-slate-800">{auditModalItem.employee_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                <span className="font-mono font-semibold text-indigo-700">{auditModalItem.employee_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Position / Title</span>
                <span className="text-slate-800">{auditModalItem.position}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">System / Application</span>
                <span className="font-semibold text-slate-800">{auditModalItem.system_application}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Access Role</span>
                <span className="font-bold text-indigo-700">{auditModalItem.access_role}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Username</span>
                <span className="font-mono text-slate-800">{auditModalItem.username || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Module / Privilege</span>
                <span className="text-slate-800">{auditModalItem.module_privilege || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-700">{auditModalItem.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Review Date</span>
                <span className="font-mono text-slate-800">{auditModalItem.review_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Approved By</span>
                <span className="font-semibold text-slate-800">{auditModalItem.approved_by}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Prepared By</span>
                <span className="font-semibold text-slate-800">{auditModalItem.prepared_by}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Created By</span>
                <span className="text-slate-800">{auditModalItem.created_by || 'IT Manager'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Created Date/Time</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {auditModalItem.created_at ? new Date(auditModalItem.created_at).toLocaleString() : '2026-08-17 08:30'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Modified Date/Time</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {auditModalItem.updated_at ? new Date(auditModalItem.updated_at).toLocaleString() : '2026-08-17 08:30'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Modified By</span>
                <span className="text-slate-800">{auditModalItem.modified_by || 'IT Manager'}</span>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Change & Review History Trail
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {auditModalItem.audit_history && auditModalItem.audit_history.length > 0 ? (
                  auditModalItem.audit_history.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.changed_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Actor: <strong>{log.changed_by}</strong>
                          {log.prev_status && (
                            <span className="ml-2">({log.prev_status} → {log.new_status})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous modifications recorded.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAuditModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete System Access Review?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Are you sure you want to remove the access record for{' '}
              <strong>{deleteConfirmItem.employee_name}</strong> on{' '}
              <strong>{deleteConfirmItem.system_application}</strong>? This action will remove the entry from the active register.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteAccessReview(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* + ADD VERSION RECORD & FRAMEWORK TIER GROUP MODAL */}
      {isAddVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-indigo-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    + Add Version Record & Framework Tier Group
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connects to Quick Master Setup & Facility Governance Matrix loop with automatic module resolver.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Auto-Fill Preset Banner */}
            <div className="mb-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Governance Preset: ANNIB/IT/HR/009 (v2.1)</div>
                  <div className="text-[11px] text-slate-500">Advance Tier (ISO 27001 / ADHICS) • Review Conducted: 01/08/2026</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewVersionForm({
                    ref_code: 'ANNIB/IT/HR/009',
                    doc_name: 'System Access Review Summary Report',
                    version: '2.1',
                    framework_group: 'Advance Tier (ISO 27001:2022 A.9.2.5 / ADHICS v2.0 - Section 8)',
                    classification: 'RESTRICTED',
                    issue_date: '2023-05-05',
                    approval_date: '2026-08-01',
                    review_conducted_date: '2026-08-01',
                    effective_date: '2026-08-01',
                    next_due_date: '2027-08-01',
                    prepared_by: 'Aseef Sulaiman (IT Manager)',
                    reviewed_by: 'Anju Ahmed',
                    approved_by: 'Anjum Ahmad (Medical Director)',
                    change_summary: 'Updated review privileges for critical server accounts, CCTV operators, and NAS storage access.'
                  });
                  showToast('✓ Loaded Governance Preset (ANNIB/IT/HR/009 v2.1)!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load v2.1 Preset</span>
              </button>
            </div>

            <form onSubmit={handleAddVersionRecordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ref Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Ref Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionForm.ref_code}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, ref_code: e.target.value })}
                    placeholder="e.g. ANNIB/IT/HR/009"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Version Control *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionForm.version}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, version: e.target.value })}
                    placeholder="e.g. 2.1"
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Framework Tier Group */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Framework Tier Group *
                  </label>
                  <select
                    value={newVersionForm.framework_group}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, framework_group: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50"
                  >
                    {FRAMEWORK_TIER_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Classification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Classification Level *
                  </label>
                  <select
                    value={newVersionForm.classification}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, classification: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50"
                  >
                    {CLASSIFICATION_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={newVersionForm.issue_date}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, issue_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Approval Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Approval Date
                  </label>
                  <input
                    type="date"
                    value={newVersionForm.approval_date}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, approval_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Review Conducted Date */}
                <div>
                  <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Review Conducted Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newVersionForm.review_conducted_date || newVersionForm.approval_date}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, review_conducted_date: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 border-2 border-indigo-200 bg-indigo-50/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Next Review Due Date */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Next Due Review Date
                  </label>
                  <input
                    type="date"
                    value={newVersionForm.next_due_date}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, next_due_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Prepared By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prepared By (IT Manager) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionForm.prepared_by}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, prepared_by: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Reviewed By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Reviewed By (Compliance Officer)
                  </label>
                  <input
                    type="text"
                    value={newVersionForm.reviewed_by}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, reviewed_by: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Approved By */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Approved By (Authorized Signer / Medical Director) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionForm.approved_by}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, approved_by: e.target.value })}
                    placeholder="e.g. Anjum Ahmad (Medical Director) — Medical Director"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Change Summary / Revision Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Revision Notes & Change Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newVersionForm.change_summary}
                    onChange={(e) => setNewVersionForm({ ...newVersionForm, change_summary: e.target.value })}
                    placeholder="Updated review privileges for critical server accounts, CCTV operators, and NAS storage access..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Will sync to Quick Master Setup & Matrix</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddVersionModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Version Record & Sync Loop
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY & REVISION TRAIL MODAL */}
      {isVersionHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Version Control & Revision History Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Doc Ref: <strong className="font-mono text-indigo-700">{docRef}</strong> — Active Version: <strong className="text-emerald-700">{docVersion}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsVersionHistoryModalOpen(false);
                    setIsAddVersionModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Version
                </button>
                <button
                  onClick={() => setIsVersionHistoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of Version Records */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {versionHistory.map((rec, idx) => (
                <div
                  key={rec.id || idx}
                  className={`p-4 rounded-xl border transition ${
                    rec.version === docVersion
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                        {rec.version}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {rec.revision_date}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {rec.classification}
                      </span>
                      {rec.version === docVersion && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white shadow-xs">
                          Active Loop
                        </span>
                      )}
                    </div>

                    {rec.version !== docVersion && (
                      <button
                        onClick={() => {
                          setDocVersion(rec.version);
                          setDocClassification(rec.classification);
                          setDocFrameworkGroup(rec.framework_group);
                          if (rec.ref_code) setDocRef(rec.ref_code);
                          if (rec.author) setPreparedByInput(rec.author);
                          if (rec.approved_by) setApprovedByInput(rec.approved_by);
                          if (rec.issue_date) setDocIssueDate(rec.issue_date);
                          if (rec.next_due_date) setDocNextDueDate(rec.next_due_date);
                          showToast(`✓ Switched active report version to ${rec.version}`);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs transition self-start sm:self-auto"
                      >
                        Apply Version
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 mt-2.5 font-medium">
                    {rec.change_summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span>Framework: <strong className="text-slate-700">{rec.framework_group}</strong></span>
                    <span>•</span>
                    <span>Prepared By: <strong className="text-slate-700">{rec.author}</strong></span>
                    <span>•</span>
                    <span>Approved By: <strong className="text-slate-700">{rec.approved_by}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsVersionHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
