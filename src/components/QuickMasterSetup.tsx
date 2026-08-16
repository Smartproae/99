/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  UserCheck, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  HardDrive, 
  Clock, 
  KeyRound, 
  MapPin, 
  Wifi, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Lock, 
  Server, 
  ChevronRight, 
  Download, 
  Save,
  Check,
  X,
  Mail,
  Phone,
  Laptop,
  Activity,
  Globe,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Wrench,
  PenTool,
  Table,
  Info,
  Upload,
  Users,
  Database,
  Link2
} from 'lucide-react';
import { Client, Policy } from '../types';
import MetadataMappingModal, { MasterMetadataSource } from './MetadataMappingModal';
import { exportToSinglePagePDF } from '../utils/pdfExport';
import BTATierSelector from './BTATierSelector';
import { saveCustomGroupAssignment, FrameworkGroupTier } from '../utils/frameworkGroupUtils';

export interface DocumentReferenceItem {
  id: string;
  ref_code: string;
  doc_name: string;
  module_name: string;
  framework_group?: 'Basic' | 'Transmission' | 'Advance' | string;
  version_control?: string;
  issue_date: string;
  approval_date: string;
  effective_date: string;
  next_due_date: string;
  classification?: string;
  prepared_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  // Mapped Metadata Fields
  doc_number?: string;
  revision?: string;
  department?: string;
  location?: string;
  source_module?: string;
  doc_owner?: string;
  status?: string;
  mapped_from?: string;
  is_mapped?: boolean;
  last_synced_at?: string;
}

export interface BackupPlanItem {
  id: string;
  system_name: string;
  backup_type: 'Full' | 'Incremental' | 'Smart' | 'Weekly' | 'Monthly';
  retention_period: '1 Day' | '2 Days' | '3 Days' | '5 Days' | '7 Days' | '14 Days' | '30 Days' | '60 Days' | '90 Days' | '180 Days';
  schedule_time: string; // e.g. "02:00 AM"
}

export interface AccessReviewDocItem {
  id: string;
  doc_title: string;
  ref_code: string;
  review_frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annually';
  last_review_date: string;
  next_review_date: string;
  assigned_reviewer: string;
  status: 'Compliant' | 'Pending Review' | 'Overdue';
}

export interface SecurityZoneItem {
  id: string;
  zone: string; // e.g. "Zone 1"
  description: string; // e.g. "High Security Area"
  location: string; // e.g. "Data Center Vault B1"
}

export interface NetworkIpItem {
  id: string;
  label: string;
  ip_address: string;
  device_type: string;
  status: 'Active' | 'Scanning' | 'Offline';
  mac_address?: string;
  open_ports?: string;
  latency_ms?: number;
  last_ping?: string;
}

export interface FacilitySubnetConfig {
  subnet_cidr: string;
  subnet_mask: string;
  gateway_ip: string;
  primary_dns: string;
  secondary_dns: string;
  vlan_name: string;
}

interface QuickMasterSetupProps {
  client?: Client;
  onUpdateClient?: (updatedClient: Client) => void;
  onNavigateTab?: (tabId: string) => void;
  logAuditTrail?: (module: string, action: string, payload: any) => void;
  allClients?: Client[];
  onSelectClient?: (clientId: string) => void;
  policies?: Policy[];
  onUpdatePolicy?: (updatedPolicy: Policy) => void;
  onAddPolicy?: (newPolicy: Policy) => void;
}

const STANDARD_DOCUMENT_NAMES = [
  'Information Security High Level Policy',
  'Human Resource Security Policy',
  'Information Asset Management Policy',
  'Clear Desk & Clear Screen Policy',
  'Access Control Policy',
  'Antivirus & Endpoint Security Policy',
  'Password Security & Multi-Factor Policy',
  'Data Retention and Disposal Policy',
  'Disaster Recovery Backup & Data Restoration SOP',
  'Change Management Plan and Procedure',
  'Patch Management Policy and Procedure',
  'Incident Management & Reporting Procedure',
  'Information Security Incident Notification Form',
  'Third Party Security Audit Form',
  'Employee Offboarding Checklist Form',
  'Master Risk Register',
  'Master Information Asset Register',
  'DOH ADHICS Compliance Master Index',
  'Statement of Applicability'
];

export default function QuickMasterSetup({
  client,
  onUpdateClient,
  onNavigateTab,
  logAuditTrail,
  allClients = [],
  onSelectClient,
  policies,
  onUpdatePolicy,
  onAddPolicy
}: QuickMasterSetupProps) {
  // Quick Setup wizard states
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [activeWizardTab, setActiveWizardTab] = useState<'governance' | 'antivirus' | 'access' | 'physical' | 'backup' | 'incident' | 'doccontrol' | 'soa'>('governance');

  // Wizard custom governance states
  const [wizardPreparedByName, setWizardPreparedByName] = useState('Sarah Jenkins');
  const [wizardPreparedByDesignation, setWizardPreparedByDesignation] = useState('Information Security Officer');
  const [wizardPreparedSignMode, setWizardPreparedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardPreparedBySign, setWizardPreparedBySign] = useState('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 25 Q30 10 50 25 T90 25 T110 20" stroke="%23059669" stroke-width="2" fill="none"/></svg>');

  const [wizardApprovedByName, setWizardApprovedByName] = useState('Dr. Johnathan Carter');
  const [wizardApprovedByDesignation, setWizardApprovedByDesignation] = useState('Chief Medical Officer');
  const [wizardApprovedSignMode, setWizardApprovedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardApprovedBySign, setWizardApprovedBySign] = useState('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 20 Q40 30 70 15 T110 25" stroke="%232563EB" stroke-width="2" fill="none"/></svg>');

  const [wizardShowReviewedBy, setWizardShowReviewedBy] = useState(true);
  const [wizardReviewedByName, setWizardReviewedByName] = useState('Tareq Al Mansoori');
  const [wizardReviewedByDesignation, setWizardReviewedByDesignation] = useState('Senior Compliance Consultant');
  const [wizardReviewedSignMode, setWizardReviewedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardReviewedBySign, setWizardReviewedBySign] = useState('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 22 Q35 12 65 22 T105 18" stroke="%23D97706" stroke-width="2" fill="none"/></svg>');

  // Antivirus Policy states
  const [selectedAntivirus, setSelectedAntivirus] = useState('Microsoft Defender for Endpoint');
  const [customAntivirus, setCustomAntivirus] = useState('');
  
  // Access Control Policy states
  const [accessReviewFrequency, setAccessReviewFrequency] = useState<'Yearly' | 'Twice a Year' | 'Quarterly'>('Yearly');

  // Statement of Applicability (SoA) Controls state
  const [soaControls, setSoaControls] = useState([
    { area: 'Risk Management', objective: 'Identify, assess, and mitigate risks to patient safety and operations', applicability: 'Applicable' },
    { area: 'Compliance', objective: 'Adhere to UAE healthcare regulatory and legal requirements', applicability: 'Applicable' },
    { area: 'Human Resources Security', objective: 'Ensure proper hiring, training, and management of personnel', applicability: 'Applicable' },
    { area: 'Asset Management', objective: 'Maintain and protect information assets', applicability: 'Applicable' },
    { area: 'Physical and Environmental Security', objective: 'Safeguard clinical infrastructure and sensitive areas', applicability: 'Applicable' },
    { area: 'Access Control', objective: 'Restrict unauthorized access to sensitive systems and data', applicability: 'Applicable' },
    { area: 'Communications and Operations Management', objective: 'Securely manage IT and operational processes', applicability: 'Applicable' },
    { area: 'Data Privacy and Protection', objective: 'Ensure confidentiality and integrity of patient data', applicability: 'Applicable' },
    { area: 'Cloud Security', objective: 'Secure cloud-based information systems and storage', applicability: 'Applicable' },
    { area: 'Third-Party Security', objective: 'Ensure compliance of vendors and partners with security standards', applicability: 'Applicable' },
    { area: 'Information Systems Acquisition, Development, and Maintenance', objective: 'Implement secure IT solutions and updates', applicability: 'Applicable' },
    { area: 'Information Security Incident Management', objective: 'Establish processes for detecting and responding to security incidents', applicability: 'Applicable' },
    { area: 'Information Systems Continuity Management', objective: 'Ensure continuity planning for IT services', applicability: 'Not applicable' }
  ]);

  const clientKey = client?.id || 'c1';

  // Load saved SoA controls if available per client
  useEffect(() => {
    try {
      const savedSoa = localStorage.getItem(`sh_quick_master_setup_soa_${clientKey}`) || (clientKey === 'c1' ? localStorage.getItem('sh_quick_master_setup_soa') : null);
      if (savedSoa) {
        const parsed = JSON.parse(savedSoa);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSoaControls(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read sh_quick_master_setup_soa:', e);
    }
  }, [clientKey]);

  // Whenever soaControls changes, sync to localStorage & update policies in sh_policies
  useEffect(() => {
    try {
      localStorage.setItem(`sh_quick_master_setup_soa_${clientKey}`, JSON.stringify(soaControls));

      // Auto-update Statement of Applicability policy statement in sh_policies
      const savedPoliciesRaw = localStorage.getItem('sh_policies');
      if (savedPoliciesRaw) {
        const savedPolicies: any[] = JSON.parse(savedPoliciesRaw);
        const compName = client?.company_name || 'the facility';
        const soaTableMarkdown = `### CONTROL OBJECTIVES AND APPLICABILITY\n\nThe following control objectives are applicable to ${compName}:\n\n| Control Area | Control Objective | Applicability |\n|---|---|---|\n${soaControls.map(c => `| ${c.area} | ${c.objective} | ${c.applicability} |`).join('\n')}`;

        let updated = false;
        const newPolicies = savedPolicies.map(p => {
          if ((p.client_id === clientKey || !p.client_id) && (p.policy_no === 'M-Policy-002' || p.policy_no === 'POL-SEC-032' || (p.policy_name && p.policy_name.toLowerCase().includes('statement of applicability')))) {
            updated = true;
            return {
              ...p,
              client_id: clientKey,
              policy_no: 'M-Policy-002',
              policy_name: 'Statement of Applicability',
              policy_statement: soaTableMarkdown,
              full_content: '' // invalidate cached HTML
            };
          }
          return p;
        });

        if (updated) {
          localStorage.setItem('sh_policies', JSON.stringify(newPolicies));
        }
      }
    } catch (e) {
      console.warn('Could not sync soaControls:', e);
    }
  }, [soaControls, client?.company_name]);

  // Document Index Report PDF export states
  const [isExportingIndexPdf, setIsExportingIndexPdf] = useState(false);
  const [docSortKey, setDocSortKey] = useState<'module' | 'ref'>('module');

  const handleDownloadIndexPdf = async () => {
    if (isExportingIndexPdf || documents.length === 0) return;
    setIsExportingIndexPdf(true);

    try {
      const success = await exportToSinglePagePDF('doc-index-report-printable', {
        filename: `Document_Index_Report_By_Module_${new Date().toISOString().slice(0, 10)}.pdf`,
        quality: 0.98,
        scale: 2
      });
      if (!success) {
        console.warn('Document index report PDF generation timed out or failed.');
      }
    } catch (err) {
      console.error('Failed to export Document Index Report PDF:', err);
    } finally {
      setIsExportingIndexPdf(false);
    }
  };

  const handleApplyQuickPolicySetup = () => {
    const activeCompName = facilityInfo.facility_name || client?.company_name || 'Medical Center & Pharmacy';
    const activeClientId = facilityInfo.client_id || client?.id || 'default-client';
    const antivirusToUse = selectedAntivirus === 'Custom / Other' ? (customAntivirus || 'SentinelOne') : selectedAntivirus;

    const templatesToGenerate = [
      {
        id: `pol-009-${Date.now()}`,
        policy_no: 'POL-SEC-009',
        policy_name: 'Antivirus & Endpoint Security Policy',
        category: 'Information Security',
        description: `Endpoint Protection policy mandating deployment of ${antivirusToUse} across all corporate workstations and clinical servers.`,
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-006-${Date.now()}`,
        policy_no: 'POL-SEC-006',
        policy_name: 'Access Control & Privileged User Policy',
        category: 'Access Management',
        description: `Identity & Access management framework requiring multi-factor authentication and ${accessReviewFrequency} user audit reviews.`,
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-013-${Date.now()}`,
        policy_no: 'POL-SEC-013',
        policy_name: 'Physical & Environmental Security Policy',
        category: 'Physical Security',
        description: `Physical access controls for clinical zones, server cabinet vaults, and restricted treatment areas at ${activeCompName}.`,
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-021-${Date.now()}`,
        policy_no: 'POL-SEC-021',
        policy_name: 'Backup, Retention & Disaster Recovery SOP',
        category: 'Business Continuity',
        description: 'SOP defining automated daily incremental and monthly full backups for EMR and database servers.',
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-025-${Date.now()}`,
        policy_no: 'POL-SEC-025',
        policy_name: 'Incident Management & Response Policy',
        category: 'Incident Response',
        description: 'Incident escalation procedures with near-real-time DOH ADHICS notification SLAs for critical security events.',
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-031-${Date.now()}`,
        policy_no: 'POL-SEC-031',
        policy_name: 'Document Control & Governance SOP',
        category: 'Compliance',
        description: `Procedure for creation, review, approval, distribution and retention of documentation for ${activeCompName}.`,
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString()
      },
      {
        id: `pol-032-${Date.now()}`,
        policy_no: 'M-Policy-002',
        policy_name: 'Statement of Applicability',
        category: 'Compliance',
        description: 'Master DOH ADHICS / ISO 27001 security controls baseline mapping for clinical operations.',
        status: 'Active',
        client_id: activeClientId,
        version: 'v1.0',
        prepared_by_name: wizardPreparedByName,
        prepared_by_designation: wizardPreparedByDesignation,
        approved_by_name: wizardApprovedByName,
        approved_by_designation: wizardApprovedByDesignation,
        reviewed_by_name: wizardShowReviewedBy ? wizardReviewedByName : undefined,
        reviewed_by_designation: wizardShowReviewedBy ? wizardReviewedByDesignation : undefined,
        created_at: new Date().toISOString(),
        policy_statement: `### CONTROL OBJECTIVES AND APPLICABILITY\n\nThe following control objectives are applicable to ${activeCompName}:\n\n| Control Area | Control Objective | Applicability |\n|---|---|---|\n${soaControls.map(c => `| ${c.area} | ${c.objective} | ${c.applicability} |`).join('\n')}`
      }
    ];

    try {
      const existingRaw = localStorage.getItem('sh_policies');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const merged = [...templatesToGenerate, ...existing];
      localStorage.setItem('sh_policies', JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed saving policies to localStorage:', e);
    }

    if (logAuditTrail) {
      logAuditTrail('QUICK_MASTER_SETUP', 'PUBLISHED 7 CRITICAL COMPLIANCE POLICIES', { count: 7, client: activeCompName });
    }

    setToastMsg(`✓ Successfully configured and published 7 critical compliance policies for ${activeCompName}!`);
    setIsQuickSetupOpen(false);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Facility & Contact Information State
  const [facilityInfo, setFacilityInfo] = useState({
    facility_name: client?.company_name || 'SmartPro Health Systems & Medical Center',
    health_license: client?.doh_license_no || 'DOH-MF-2026-9842',
    commercial_number: client?.trade_license_no || 'CN-1049281-2026',
    client_id: client?.id || '',
    contacts: {
      responsible_person: {
        name: client?.owner_name || 'Dr. Tariq Mahmood',
        email: client?.owner_email || 'tariq.m@smartprohealth.ae',
        phone: client?.phone || '+971 2 654 9900'
      },
      hr_manager: {
        name: client?.hr_manager?.name || 'Sara Al-Mansoori',
        email: client?.hr_manager?.email || 'hr.manager@smartprohealth.ae',
        phone: client?.hr_manager?.phone || '+971 50 432 1098'
      },
      it_manager: {
        name: client?.it_manager?.name || 'Eng. Aseef Sulaiman',
        email: client?.it_manager?.email || 'it.head@smartprohealth.ae',
        phone: client?.it_manager?.phone || '+971 52 876 5432'
      },
      facility_manager: {
        name: client?.clinic_manager?.name || 'Khalid Al-Hassan',
        email: client?.clinic_manager?.email || 'facility.mgr@smartprohealth.ae',
        phone: client?.clinic_manager?.phone || '+971 50 112 2334'
      },
      emr_vendor: {
        name: client?.emr_support?.team_name || 'Malaffi / Epic EMR Tech',
        email: client?.emr_support?.email || 'support@epicehr.ae',
        phone: client?.emr_support?.phone || '+971 4 390 8877'
      },
      it_support: {
        name: client?.it_support?.team_name || 'Apex IT Managed Services',
        email: client?.it_support?.email || 'support@apexit.ae',
        phone: client?.it_support?.phone || '+971 4 800 2739'
      }
    }
  });

  // 2. Document Reference Details State
  const [documents, setDocuments] = useState<DocumentReferenceItem[]>([
    {
      id: 'doc-ref-hr-rst-b035',
      ref_code: 'REF-HR-RST-B035',
      doc_name: 'Staff & Operator Clinical Duty Roster',
      module_name: 'Staff Roster',
      version_control: 'v1.0 (Master Loop)',
      issue_date: '2026-08-01',
      approval_date: '2026-08-01',
      effective_date: '2026-08-01',
      next_due_date: '2027-08-01',
      classification: 'CONFIDENTIAL',
      prepared_by: 'HR Director',
      reviewed_by: 'Compliance Officer',
      approved_by: 'Risk Lead'
    },
    {
      id: 'doc-ref-1',
      ref_code: 'REF-POL-001',
      doc_name: 'Information Security High Level Policy',
      module_name: 'Policy',
      version_control: 'v1.0 (Initial Release)',
      issue_date: '2025-01-15',
      approval_date: '2025-01-20',
      effective_date: '2025-02-01',
      next_due_date: '2026-02-01',
      classification: 'CONFIDENTIAL',
      prepared_by: 'CISO / Security Desk',
      reviewed_by: 'Compliance Officer',
      approved_by: 'Managing Director'
    },
    {
      id: 'doc-ref-2',
      ref_code: 'REF-SOP-002',
      doc_name: 'Disaster Recovery Backup & Data Restoration SOP',
      module_name: 'SOP',
      version_control: 'v1.2 (Annual Review)',
      issue_date: '2025-03-10',
      approval_date: '2025-03-15',
      effective_date: '2025-04-01',
      next_due_date: '2026-04-01',
      classification: 'RESTRICTED',
      prepared_by: 'IT Lead',
      reviewed_by: 'Operations Manager',
      approved_by: 'Technical Director'
    },
    {
      id: 'doc-ref-3',
      ref_code: 'REF-FRM-003',
      doc_name: 'Information Security Incident Notification Form',
      module_name: 'Forms',
      version_control: 'v2.0 (DOH ADHICS Revision)',
      issue_date: '2025-02-01',
      approval_date: '2025-02-05',
      effective_date: '2025-02-10',
      next_due_date: '2026-02-10',
      classification: 'CONFIDENTIAL',
      prepared_by: 'Security Officer',
      reviewed_by: 'Compliance Officer',
      approved_by: 'Risk Lead'
    },
    {
      id: 'doc-ref-4',
      ref_code: 'REF-REG-004',
      doc_name: 'Master Information Asset & Inventory Register',
      module_name: 'Register',
      version_control: 'v1.0 (Baseline)',
      issue_date: '2025-01-01',
      approval_date: '2025-01-10',
      effective_date: '2025-01-15',
      next_due_date: '2026-01-15',
      classification: 'CONFIDENTIAL',
      prepared_by: 'IT Asset Manager',
      reviewed_by: 'Infrastructure Lead',
      approved_by: 'Risk Director'
    }
  ]);

  // Form state for adding/editing document reference
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<Omit<DocumentReferenceItem, 'id'>>({
    ref_code: '',
    doc_name: 'Information Security High Level Policy',
    module_name: 'Policy',
    version_control: 'v1.0',
    classification: 'CONFIDENTIAL',
    prepared_by: 'HR Director',
    reviewed_by: 'Compliance Officer',
    approved_by: 'Risk Lead',
    issue_date: new Date().toISOString().split('T')[0],
    approval_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    next_due_date: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    })()
  });

  // Sorted Documents by Module Name
  const sortedDocsByModule = React.useMemo(() => {
    return [...documents].sort((a, b) => {
      const modA = (a.module_name || '').toLowerCase();
      const modB = (b.module_name || '').toLowerCase();
      if (modA !== modB) return modA.localeCompare(modB);
      return (a.ref_code || '').localeCompare(b.ref_code || '');
    });
  }, [documents]);

  // 3. Backup Plan State
  const [backupPlans, setBackupPlans] = useState<BackupPlanItem[]>([
    { id: 'bp-1', system_name: 'EMR Core Production Database', backup_type: 'Full', retention_period: '90 Days', schedule_time: '02:00 AM' },
    { id: 'bp-2', system_name: 'Daily Incremental Transaction Logs', backup_type: 'Incremental', retention_period: '30 Days', schedule_time: '11:30 PM' },
    { id: 'bp-3', system_name: 'Critical System State & Config Snapshot', backup_type: 'Smart', retention_period: '14 Days', schedule_time: '06:00 AM' },
    { id: 'bp-4', system_name: 'Weekly Disaster Recovery Bare-Metal Backup', backup_type: 'Weekly', retention_period: '180 Days', schedule_time: '01:00 AM' }
  ]);
  const [editingBackupId, setEditingBackupId] = useState<string | null>(null);
  const [backupForm, setBackupForm] = useState<Omit<BackupPlanItem, 'id'>>({
    system_name: '',
    backup_type: 'Full',
    retention_period: '30 Days',
    schedule_time: '02:00 AM'
  });

  // 4. Access Review Documents State
  const [accessReviews, setAccessReviews] = useState<AccessReviewDocItem[]>([
    { id: 'ar-1', doc_title: 'Active Directory Privileged Administrator Access Review', ref_code: 'ACC-REV-001', review_frequency: 'Quarterly', last_review_date: '2026-04-01', next_review_date: '2026-07-01', assigned_reviewer: 'IT Manager', status: 'Compliant' },
    { id: 'ar-2', doc_title: 'EMR User Roles & Permission Rights Audit', ref_code: 'ACC-REV-002', review_frequency: 'Monthly', last_review_date: '2026-07-01', next_review_date: '2026-08-01', assigned_reviewer: 'CISO / Compliance Lead', status: 'Compliant' },
    { id: 'ar-3', doc_title: 'Facility Physical Keycard & Biometric Access Logs', ref_code: 'ACC-REV-003', review_frequency: 'Half-Yearly', last_review_date: '2026-01-15', next_review_date: '2026-07-15', assigned_reviewer: 'Facility Manager', status: 'Pending Review' },
    { id: 'ar-4', doc_title: 'Third-Party Vendor Remote Access Access Control', ref_code: 'ACC-REV-004', review_frequency: 'Annually', last_review_date: '2025-12-01', next_review_date: '2026-12-01', assigned_reviewer: 'Compliance Auditor', status: 'Compliant' }
  ]);
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null);
  const [accessForm, setAccessForm] = useState<Omit<AccessReviewDocItem, 'id'>>({
    doc_title: '',
    ref_code: '',
    review_frequency: 'Quarterly',
    last_review_date: new Date().toISOString().split('T')[0],
    next_review_date: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      return d.toISOString().split('T')[0];
    })(),
    assigned_reviewer: 'IT Manager',
    status: 'Compliant'
  });

  // 5. Security Zones State
  const [securityZones, setSecurityZones] = useState<SecurityZoneItem[]>([
    { id: 'sec-z1', zone: 'Zone 1', description: 'High Security Area', location: 'Data Center Vault & Main Server Room (B1 Sub-level)' },
    { id: 'sec-z2', zone: 'Zone 2', description: 'Restricted Area', location: 'Executive Archive & Medical Records Storage' },
    { id: 'sec-z3', zone: 'Zone 3', description: 'Working Area', location: 'Clinical Operations Workspace & Staff Stations' },
    { id: 'sec-z4', zone: 'Zone 4', description: 'Public Area', location: 'Facility Main Reception, Outpatient Lobby & Waiting Area' }
  ]);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState<Omit<SecurityZoneItem, 'id'>>({
    zone: 'Zone 5',
    description: 'Custom Restricted Zone',
    location: ''
  });

  // 6. Local Network IP Scan State
  const [networkIps, setNetworkIps] = useState<NetworkIpItem[]>([
    { id: 'ip-1', label: 'IP Address 1 (Primary EMR Node)', ip_address: '192.168.1.100', device_type: 'Database Server', status: 'Active' },
    { id: 'ip-2', label: 'IP Address 2 (PACs Diagnostic Station)', ip_address: '192.168.1.105', device_type: 'Medical Workstation', status: 'Active' },
    { id: 'ip-3', label: 'IP Address 3 (Core Firewall Gateway)', ip_address: '10.140.10.1', device_type: 'Network Gateway', status: 'Active' }
  ]);
  const [editingIpId, setEditingIpId] = useState<string | null>(null);
  const [ipForm, setIpForm] = useState<Omit<NetworkIpItem, 'id'>>({
    label: 'IP Address 4',
    ip_address: '192.168.1.110',
    device_type: 'Endpoint PC',
    status: 'Active'
  });

  // Modal deletion confirmation states
  const [docToDelete, setDocToDelete] = useState<DocumentReferenceItem | null>(null);
  const [ipToDelete, setIpToDelete] = useState<NetworkIpItem | null>(null);

  // MAP (Document Metadata Mapping) Modal States
  const [mapModalTarget, setMapModalTarget] = useState<DocumentReferenceItem | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Manual / Custom Document Names state
  const [customDocNames, setCustomDocNames] = useState<string[]>([]);
  const [showManualDocInput, setShowManualDocInput] = useState(false);
  const [manualDocNameInput, setManualDocNameInput] = useState('');

  // Local Network Subnet /24 Config & Host Scan States
  const [subnetConfig, setSubnetConfig] = useState<FacilitySubnetConfig>({
    subnet_cidr: '192.168.1.0/24',
    subnet_mask: '255.255.255.0',
    gateway_ip: '192.168.1.1',
    primary_dns: '192.168.1.254',
    secondary_dns: '8.8.8.8',
    vlan_name: 'VLAN 10 - Clinical Infrastructure & Server Segment'
  });
  const [isScanningSubnet, setIsScanningSubnet] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedIpCount, setScannedIpCount] = useState(0);
  const [discoveredSubnetHosts, setDiscoveredSubnetHosts] = useState<NetworkIpItem[]>([]);
  const [pingingIpId, setPingingIpId] = useState<string | null>(null);

  // Small Popup Modal States for Ping & IP Scan
  const [pingModalTarget, setPingModalTarget] = useState<NetworkIpItem | null>(null);
  const [pingModalLogs, setPingModalLogs] = useState<string[]>([]);
  const [isModalPinging, setIsModalPinging] = useState(false);

  const [ipScanModalTarget, setIpScanModalTarget] = useState<NetworkIpItem | null>(null);
  const [isModalScanning, setIsModalScanning] = useState(false);

  // UI status messages
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load saved setup & custom doc options from localStorage per client
  useEffect(() => {
    try {
      const savedKey = `sh_quick_master_setup_${clientKey}`;
      const saved = localStorage.getItem(savedKey) || (clientKey === 'c1' ? localStorage.getItem('sh_quick_master_setup') : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.facilityInfo) setFacilityInfo(parsed.facilityInfo);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (Array.isArray(parsed.backupPlans)) setBackupPlans(parsed.backupPlans);
        if (Array.isArray(parsed.accessReviews)) setAccessReviews(parsed.accessReviews);
        if (Array.isArray(parsed.securityZones)) setSecurityZones(parsed.securityZones);
        if (Array.isArray(parsed.networkIps)) setNetworkIps(parsed.networkIps);
        if (parsed.subnetConfig) setSubnetConfig(parsed.subnetConfig);
      } else if (client) {
        // Reset facility info for newly active client if no saved setup exists
        setFacilityInfo(prev => ({
          ...prev,
          client_id: client.id,
          facility_name: client.company_name || prev.facility_name,
          company_name: client.company_name || prev.company_name,
          health_authority_license_no: (client as any).health_authority_license_no || prev.health_authority_license_no
        }));
      }
      const savedCustomDocs = localStorage.getItem(`sh_custom_doc_names_${clientKey}`) || (clientKey === 'c1' ? localStorage.getItem('sh_custom_doc_names') : null);
      if (savedCustomDocs) {
        setCustomDocNames(JSON.parse(savedCustomDocs));
      }
    } catch (e) {
      console.warn('Failed to parse sh_quick_master_setup', e);
    }
  }, [clientKey, client]);

  // Save changes helper
  const saveAllToLocalStorage = (
    newInfo = facilityInfo,
    newDocs = documents,
    newBackups = backupPlans,
    newAccess = accessReviews,
    newZones = securityZones,
    newIps = networkIps
  ) => {
    try {
      const payload = {
        facilityInfo: newInfo,
        documents: newDocs,
        backupPlans: newBackups,
        accessReviews: newAccess,
        securityZones: newZones,
        networkIps: newIps,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(`sh_quick_master_setup_${clientKey}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  // Auto-resolve Module Name from Reference Code or Document Name
  const deriveModuleName = (code: string, name: string): string => {
    const combined = `${code} ${name}`.toUpperCase();
    if (combined.includes('POL-') || combined.includes('POLICY')) return 'Policy';
    if (combined.includes('SOP-') || combined.includes('PRC-') || combined.includes('PROCEDURE') || combined.includes('SOP')) return 'SOP';
    if (combined.includes('FRM-') || combined.includes('FORM') || combined.includes('TEMPLATE')) return 'Forms';
    if (combined.includes('REG-') || combined.includes('REGISTER') || combined.includes('INDEX')) return 'Register';
    if (combined.includes('GDL-') || combined.includes('GUIDELINE') || combined.includes('STANDARD')) return 'Guideline';
    return 'Record';
  };

  // Handle Ref Code or Doc Name Change in Form
  const handleDocCodeOrNameChange = (code: string, name: string) => {
    let targetCode = code;
    let targetName = name;

    // Auto-connect "Statement of Applicability" -> M-Policy-002
    if (name === 'Statement of Applicability' || name.toLowerCase().includes('statement of applicability') || code === 'M-Policy-002') {
      targetName = 'Statement of Applicability';
      if (!targetCode || targetCode === 'POL-SEC-032' || targetCode.startsWith('REF-') || targetCode.trim() === '') {
        targetCode = 'M-Policy-002';
      }
    }

    const autoModule = deriveModuleName(targetCode, targetName);
    setDocForm(prev => ({
      ...prev,
      ref_code: targetCode,
      doc_name: targetName,
      module_name: autoModule
    }));
  };

  // Save / Link Selected Client Account into Facility Info
  const handleSelectClientAccount = (clientId: string) => {
    const selected = allClients.find(c => c.id === clientId);
    if (!selected) return;

    const updated = {
      ...facilityInfo,
      facility_name: selected.company_name || facilityInfo.facility_name,
      health_license: selected.doh_license_no || facilityInfo.health_license,
      commercial_number: selected.trade_license_no || facilityInfo.commercial_number,
      client_id: selected.id,
      contacts: {
        ...facilityInfo.contacts,
        responsible_person: {
          name: selected.owner_name || facilityInfo.contacts.responsible_person.name,
          email: selected.owner_email || facilityInfo.contacts.responsible_person.email,
          phone: selected.phone || facilityInfo.contacts.responsible_person.phone
        },
        hr_manager: selected.hr_manager ? { ...selected.hr_manager } : facilityInfo.contacts.hr_manager,
        it_manager: selected.it_manager ? { ...selected.it_manager } : facilityInfo.contacts.it_manager,
        facility_manager: selected.clinic_manager ? { ...selected.clinic_manager } : facilityInfo.contacts.facility_manager,
        emr_vendor: selected.emr_support ? { name: selected.emr_support.team_name, email: selected.emr_support.email, phone: selected.emr_support.phone } : facilityInfo.contacts.emr_vendor,
        it_support: selected.it_support ? { name: selected.it_support.team_name, email: selected.it_support.email, phone: selected.it_support.phone } : facilityInfo.contacts.it_support
      }
    };

    setFacilityInfo(updated);
    saveAllToLocalStorage(updated);

    if (onSelectClient) {
      onSelectClient(selected.id);
    }

    setToastMsg(`Facility Info & Active Tenant linked successfully to account [${selected.company_name}]!`);
    setTimeout(() => setToastMsg(null), 3500);

    if (logAuditTrail) {
      logAuditTrail('QUICK_MASTER_SETUP', 'LINKED_CLIENT_ACCOUNT', { client_id: selected.id, facility_name: selected.company_name });
    }
  };

  // Validate Facility Info
  const handleSaveFacilityInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityInfo.facility_name.trim()) {
      setValidationError('Facility Name is required.');
      return;
    }
    if (!facilityInfo.health_license.trim()) {
      setValidationError('Facility Health License is required.');
      return;
    }
    if (!facilityInfo.commercial_number.trim()) {
      setValidationError('Facility Commercial Number is required.');
      return;
    }

    setValidationError(null);
    saveAllToLocalStorage(facilityInfo);

    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        company_name: facilityInfo.facility_name,
        doh_license_no: facilityInfo.health_license,
        trade_license_no: facilityInfo.commercial_number,
        owner_name: facilityInfo.contacts.responsible_person.name,
        owner_email: facilityInfo.contacts.responsible_person.email,
        phone: facilityInfo.contacts.responsible_person.phone
      });
    }

    setToastMsg('✓ Facility & Contact Information saved successfully!');
    setTimeout(() => setToastMsg(null), 3500);

    if (logAuditTrail) {
      logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_FACILITY_INFO', facilityInfo);
    }
  };

  // --- 2. Document Reference Details CRUD ---
  const handleAddOrUpdateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.ref_code.trim()) {
      setValidationError('Reference Code is required.');
      return;
    }
    if (!docForm.doc_name.trim()) {
      setValidationError('Document Name is required.');
      return;
    }

    setValidationError(null);

    saveCustomGroupAssignment(docForm.ref_code, (docForm.framework_group as FrameworkGroupTier) || 'Basic');
    if (docForm.doc_name) {
      saveCustomGroupAssignment(docForm.doc_name, (docForm.framework_group as FrameworkGroupTier) || 'Basic');
    }

    let updatedDocs: DocumentReferenceItem[];
    const targetModule = (docForm.module_name || 'Policy').trim();

    if (editingDocId) {
      updatedDocs = documents.map(d => d.id === editingDocId ? { id: editingDocId, ...docForm } : d);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_DOC_REF', { id: editingDocId, ...docForm });
    } else {
      const newDoc: DocumentReferenceItem = {
        id: `doc-ref-${Date.now()}`,
        ...docForm
      };
      updatedDocs = [newDoc, ...documents];
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'ADD_DOC_REF', newDoc);
    }

    // Ask user if they want to update Effective Date and Next Due Date for all documents in the same Module Name group
    if (docForm.effective_date || docForm.next_due_date) {
      const confirmGroup = window.confirm(
        `Do you want to update the Effective Date (${docForm.effective_date}) and Next Due Date (${docForm.next_due_date}) for all documents in the "${targetModule}" Module group?`
      );

      if (confirmGroup) {
        updatedDocs = updatedDocs.map(d => {
          if ((d.module_name || '').trim().toLowerCase() === targetModule.toLowerCase()) {
            return {
              ...d,
              effective_date: docForm.effective_date,
              next_due_date: docForm.next_due_date
            };
          }
          return d;
        });

        // Sync to sh_policies if targetModule is Policy or SOP
        try {
          if (targetModule.toLowerCase().includes('policy') || targetModule.toLowerCase().includes('sop')) {
            const savedPoliciesRaw = localStorage.getItem('sh_policies');
            if (savedPoliciesRaw) {
              const savedPolicies: any[] = JSON.parse(savedPoliciesRaw);
              const updatedPolicies = savedPolicies.map(p => ({
                ...p,
                effective_date: docForm.effective_date,
                review_date: docForm.next_due_date,
                next_due_date: docForm.next_due_date
              }));
              localStorage.setItem('sh_policies', JSON.stringify(updatedPolicies));
            }
          }
        } catch (e) {
          console.warn('Failed to sync sh_policies', e);
        }

        // Sync to sh_forms if targetModule is Forms
        try {
          if (targetModule.toLowerCase().includes('form')) {
            const savedFormsRaw = localStorage.getItem('sh_forms');
            if (savedFormsRaw) {
              const savedForms: any[] = JSON.parse(savedFormsRaw);
              const updatedForms = savedForms.map(f => ({
                ...f,
                effective_date: docForm.effective_date,
                next_due_date: docForm.next_due_date
              }));
              localStorage.setItem('sh_forms', JSON.stringify(updatedForms));
            }
          }
        } catch (e) {
          console.warn('Failed to sync sh_forms', e);
        }

        // Sync to sh_documents for Register / Document / General Master Docs
        try {
          const savedDocsRaw = localStorage.getItem('sh_documents');
          if (savedDocsRaw) {
            const savedDocs: any[] = JSON.parse(savedDocsRaw);
            const updatedMasterDocs = savedDocs.map(doc => {
              if ((doc.doc_type_category || doc.module_name || '').toLowerCase().includes(targetModule.toLowerCase())) {
                return {
                  ...doc,
                  effective_date: docForm.effective_date,
                  next_due_date: docForm.next_due_date
                };
              }
              return doc;
            });
            localStorage.setItem('sh_documents', JSON.stringify(updatedMasterDocs));
          }
        } catch (e) {
          console.warn('Failed to sync sh_documents', e);
        }

        setToastMsg(`✓ Updated record [${docForm.ref_code}] and all documents in "${targetModule}" group.`);
      } else {
        setToastMsg(editingDocId ? `✓ Updated document reference [${docForm.ref_code}]` : `✓ Created new document reference record [${docForm.ref_code}]`);
      }
    } else {
      setToastMsg(editingDocId ? `✓ Updated document reference [${docForm.ref_code}]` : `✓ Created new document reference record [${docForm.ref_code}]`);
    }

    setDocuments(updatedDocs);
    saveAllToLocalStorage(facilityInfo, updatedDocs);

    // Reset Form
    setEditingDocId(null);
    setDocForm({
      ref_code: '',
      doc_name: 'Information Security High Level Policy',
      module_name: 'Policy',
      version_control: 'v1.0',
      issue_date: new Date().toISOString().split('T')[0],
      approval_date: new Date().toISOString().split('T')[0],
      effective_date: new Date().toISOString().split('T')[0],
      next_due_date: (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
      })()
    });

    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditDoc = (doc: DocumentReferenceItem) => {
    setEditingDocId(doc.id);
    setDocForm({
      ref_code: doc.ref_code,
      doc_name: doc.doc_name,
      module_name: doc.module_name,
      version_control: doc.version_control || 'v1.0',
      classification: doc.classification || 'CONFIDENTIAL',
      prepared_by: doc.prepared_by || 'HR Director',
      reviewed_by: doc.reviewed_by || 'Compliance Officer',
      approved_by: doc.approved_by || 'Risk Lead',
      issue_date: doc.issue_date,
      approval_date: doc.approval_date,
      effective_date: doc.effective_date,
      next_due_date: doc.next_due_date
    });
  };

  const handleRequestDeleteDoc = (doc: DocumentReferenceItem) => {
    setDocToDelete(doc);
  };

  const confirmDeleteDoc = () => {
    if (!docToDelete) return;
    const refCode = docToDelete.ref_code;
    const docName = docToDelete.doc_name;
    const updated = documents.filter(d => d.id !== docToDelete.id);
    setDocuments(updated);
    saveAllToLocalStorage(facilityInfo, updated);
    setDocToDelete(null);
    setToastMsg(`✓ Document Reference [${refCode}] - "${docName}" permanently deleted.`);
    setTimeout(() => setToastMsg(null), 3500);
    if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'DELETE_DOC_REF', { id: docToDelete.id, ref_code: refCode });
  };

  const handleSelectMapSource = (source: MasterMetadataSource) => {
    if (!mapModalTarget) return;

    const updated = documents.map(d => {
      if (d.id === mapModalTarget.id) {
        return {
          ...d,
          doc_name: source.doc_name,
          ref_code: source.ref_code,
          module_name: source.source_module,
          version_control: `${source.version} (${source.revision})`,
          issue_date: source.issue_date,
          approval_date: source.approval_date,
          effective_date: source.effective_date,
          next_due_date: source.next_due_date,
          doc_number: source.doc_number,
          revision: source.revision,
          department: source.department,
          location: source.location,
          source_module: source.source_module,
          doc_owner: source.doc_owner,
          status: source.status,
          mapped_from: source.source_title,
          is_mapped: true,
          last_synced_at: new Date().toISOString()
        };
      }
      return d;
    });

    setDocuments(updated);
    saveAllToLocalStorage(facilityInfo, updated);
    setIsMapModalOpen(false);
    setToastMsg(`✓ Document [${source.ref_code}] successfully mapped & linked to Master Source: "${source.source_title}"`);
    setTimeout(() => setToastMsg(null), 4000);

    if (logAuditTrail) {
      logAuditTrail('DOCUMENT_REFERENCE_MAP', 'LINKED_MASTER_SOURCE', {
        doc_id: mapModalTarget.id,
        ref_code: source.ref_code,
        mapped_from: source.source_title
      });
    }
  };

  const handleAddManualDocName = () => {
    const trimmed = manualDocNameInput.trim();
    if (!trimmed) {
      setValidationError('Please enter a valid custom document name.');
      return;
    }
    setValidationError(null);
    if (!customDocNames.includes(trimmed) && !STANDARD_DOCUMENT_NAMES.includes(trimmed)) {
      const updated = [...customDocNames, trimmed];
      setCustomDocNames(updated);
      try {
        localStorage.setItem('sh_custom_doc_names', JSON.stringify(updated));
      } catch (e) {}
    }
    handleDocCodeOrNameChange(docForm.ref_code, trimmed);
    setManualDocNameInput('');
    setShowManualDocInput(false);
    setToastMsg(`✓ Added custom document option "${trimmed}" and linked to Module Resolver.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- 3. Backup Plan CRUD ---
  const handleAddOrUpdateBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupForm.system_name.trim()) {
      setValidationError('Backup System Name is required.');
      return;
    }

    setValidationError(null);
    let updated: BackupPlanItem[];

    if (editingBackupId) {
      updated = backupPlans.map(b => b.id === editingBackupId ? { id: editingBackupId, ...backupForm } : b);
      setToastMsg(`✓ Updated Backup Plan record for [${backupForm.system_name}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_BACKUP_PLAN', { id: editingBackupId, ...backupForm });
    } else {
      const newPlan: BackupPlanItem = { id: `bp-${Date.now()}`, ...backupForm };
      updated = [newPlan, ...backupPlans];
      setToastMsg(`✓ Added new Backup Plan record [${backupForm.system_name}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'ADD_BACKUP_PLAN', newPlan);
    }

    setBackupPlans(updated);
    saveAllToLocalStorage(facilityInfo, documents, updated);

    setEditingBackupId(null);
    setBackupForm({ system_name: '', backup_type: 'Full', retention_period: '30 Days', schedule_time: '02:00 AM' });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditBackup = (bp: BackupPlanItem) => {
    setEditingBackupId(bp.id);
    setBackupForm({
      system_name: bp.system_name,
      backup_type: bp.backup_type,
      retention_period: bp.retention_period,
      schedule_time: bp.schedule_time
    });
  };

  const handleDeleteBackup = (id: string, name: string) => {
    if (confirm(`Delete Backup Plan for [${name}]?`)) {
      const updated = backupPlans.filter(b => b.id !== id);
      setBackupPlans(updated);
      saveAllToLocalStorage(facilityInfo, documents, updated);
      setToastMsg(`Deleted Backup Plan [${name}]`);
      setTimeout(() => setToastMsg(null), 3000);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'DELETE_BACKUP_PLAN', { id, system_name: name });
    }
  };

  // --- 4. Access Review Documents CRUD ---
  const handleAddOrUpdateAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessForm.doc_title.trim()) {
      setValidationError('Access Review Document Title is required.');
      return;
    }

    setValidationError(null);
    let updated: AccessReviewDocItem[];

    if (editingAccessId) {
      updated = accessReviews.map(a => a.id === editingAccessId ? { id: editingAccessId, ...accessForm } : a);
      setToastMsg(`✓ Updated Access Review Document [${accessForm.doc_title}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_ACCESS_REVIEW', { id: editingAccessId, ...accessForm });
    } else {
      const newItem: AccessReviewDocItem = { id: `ar-${Date.now()}`, ...accessForm };
      updated = [newItem, ...accessReviews];
      setToastMsg(`✓ Added Access Review Document record [${accessForm.doc_title}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'ADD_ACCESS_REVIEW', newItem);
    }

    setAccessReviews(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, updated);

    setEditingAccessId(null);
    setAccessForm({
      doc_title: '',
      ref_code: '',
      review_frequency: 'Quarterly',
      last_review_date: new Date().toISOString().split('T')[0],
      next_review_date: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        return d.toISOString().split('T')[0];
      })(),
      assigned_reviewer: 'IT Manager',
      status: 'Compliant'
    });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditAccess = (ar: AccessReviewDocItem) => {
    setEditingAccessId(ar.id);
    setAccessForm({
      doc_title: ar.doc_title,
      ref_code: ar.ref_code,
      review_frequency: ar.review_frequency,
      last_review_date: ar.last_review_date,
      next_review_date: ar.next_review_date,
      assigned_reviewer: ar.assigned_reviewer,
      status: ar.status
    });
  };

  const handleDeleteAccess = (id: string, title: string) => {
    if (confirm(`Delete Access Review Record [${title}]?`)) {
      const updated = accessReviews.filter(a => a.id !== id);
      setAccessReviews(updated);
      saveAllToLocalStorage(facilityInfo, documents, backupPlans, updated);
      setToastMsg(`Deleted Access Review [${title}]`);
      setTimeout(() => setToastMsg(null), 3000);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'DELETE_ACCESS_REVIEW', { id, doc_title: title });
    }
  };

  // --- 5. Security Zones CRUD ---
  const handleAddOrUpdateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.zone.trim()) {
      setValidationError('Zone Identifier is required.');
      return;
    }
    if (!zoneForm.location.trim()) {
      setValidationError('Physical Location is required.');
      return;
    }

    setValidationError(null);
    let updated: SecurityZoneItem[];

    if (editingZoneId) {
      updated = securityZones.map(z => z.id === editingZoneId ? { id: editingZoneId, ...zoneForm } : z);
      setToastMsg(`✓ Updated Security Zone [${zoneForm.zone}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_SECURITY_ZONE', { id: editingZoneId, ...zoneForm });
    } else {
      const newZone: SecurityZoneItem = { id: `sec-${Date.now()}`, ...zoneForm };
      updated = [...securityZones, newZone];
      setToastMsg(`✓ Added Security Zone record [${zoneForm.zone}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'ADD_SECURITY_ZONE', newZone);
    }

    setSecurityZones(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, updated);

    setEditingZoneId(null);
    setZoneForm({ zone: `Zone ${securityZones.length + 1}`, description: 'Restricted Area', location: '' });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditZone = (zoneItem: SecurityZoneItem) => {
    setEditingZoneId(zoneItem.id);
    setZoneForm({
      zone: zoneItem.zone,
      description: zoneItem.description,
      location: zoneItem.location
    });
  };

  const handleDeleteZone = (id: string, zoneName: string) => {
    if (confirm(`Delete Security Zone [${zoneName}]?`)) {
      const updated = securityZones.filter(z => z.id !== id);
      setSecurityZones(updated);
      saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, updated);
      setToastMsg(`Deleted Security Zone [${zoneName}]`);
      setTimeout(() => setToastMsg(null), 3000);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'DELETE_SECURITY_ZONE', { id, zone: zoneName });
    }
  };

  // --- 6. Local Network IP Scan CRUD ---
  const handleAddOrUpdateIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipForm.ip_address.trim()) {
      setValidationError('IP Address is required.');
      return;
    }

    setValidationError(null);
    let updated: NetworkIpItem[];

    if (editingIpId) {
      updated = networkIps.map(ip => ip.id === editingIpId ? { id: editingIpId, ...ipForm } : ip);
      setToastMsg(`✓ Updated Local Network IP record [${ipForm.ip_address}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'UPDATE_NETWORK_IP', { id: editingIpId, ...ipForm });
    } else {
      const newIp: NetworkIpItem = { id: `ip-${Date.now()}`, ...ipForm };
      updated = [...networkIps, newIp];
      setToastMsg(`✓ Added Local Network IP record [${ipForm.ip_address}]`);
      if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'ADD_NETWORK_IP', newIp);
    }

    setNetworkIps(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, securityZones, updated);

    setEditingIpId(null);
    setIpForm({ label: `IP Address ${networkIps.length + 1}`, ip_address: '192.168.1.120', device_type: 'Host Server', status: 'Active' });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleEditIp = (ipItem: NetworkIpItem) => {
    setEditingIpId(ipItem.id);
    setIpForm({
      label: ipItem.label,
      ip_address: ipItem.ip_address,
      device_type: ipItem.device_type,
      status: ipItem.status
    });
  };

  const handleRequestDeleteIp = (ipItem: NetworkIpItem) => {
    setIpToDelete(ipItem);
  };

  const confirmDeleteIp = () => {
    if (!ipToDelete) return;
    const ipAddr = ipToDelete.ip_address;
    const updated = networkIps.filter(ip => ip.id !== ipToDelete.id);
    setNetworkIps(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, securityZones, updated);
    setIpToDelete(null);
    setToastMsg(`✓ Network IP Record [${ipAddr}] deleted.`);
    setTimeout(() => setToastMsg(null), 3000);
    if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'DELETE_NETWORK_IP', { id: ipToDelete.id, ip_address: ipAddr });
  };

  const handleRunSubnetScan = () => {
    setIsScanningSubnet(true);
    setScanProgress(0);
    setScannedIpCount(0);
    setDiscoveredSubnetHosts([]);
    setToastMsg(`🔍 Initiating /24 Subnet IP scan across range ${subnetConfig.subnet_cidr}...`);

    let current = 0;
    const interval = setInterval(() => {
      current += 8;
      if (current >= 254) {
        current = 254;
        clearInterval(interval);
        setIsScanningSubnet(false);
        setScanProgress(100);
        setScannedIpCount(254);

        const gatewayBase = subnetConfig.gateway_ip.includes('.') 
          ? subnetConfig.gateway_ip.substring(0, subnetConfig.gateway_ip.lastIndexOf('.'))
          : '192.168.1';

        const found: NetworkIpItem[] = [
          { id: `disc-1`, label: 'Gateway Firewall Router', ip_address: `${gatewayBase}.1`, device_type: 'Core Network Gateway', status: 'Active', mac_address: '00:1A:2B:3C:4D:5E', open_ports: '80, 443, 22', latency_ms: 1 },
          { id: `disc-2`, label: 'Primary EMR Database Cluster', ip_address: `${gatewayBase}.100`, device_type: 'Healthcare Database Server', status: 'Active', mac_address: '00:14:22:99:88:11', open_ports: '1433, 5432, 443', latency_ms: 2 },
          { id: `disc-3`, label: 'PACS Diagnostic Workstation 01', ip_address: `${gatewayBase}.105`, device_type: 'Medical Workstation', status: 'Active', mac_address: '00:50:56:A1:B2:C3', open_ports: '104, 443, 3389', latency_ms: 4 },
          { id: `disc-4`, label: 'Primary Domain Controller & DNS', ip_address: `${gatewayBase}.254`, device_type: 'Active Directory & DNS', status: 'Active', mac_address: '00:1A:2B:99:88:77', open_ports: '53, 389, 88, 445', latency_ms: 2 },
          { id: `disc-5`, label: 'Laboratory LIS Gateway', ip_address: `${gatewayBase}.45`, device_type: 'HL7 Interface Server', status: 'Active', mac_address: '70:B5:E8:12:34:56', open_ports: '8080, 2575', latency_ms: 3 },
          { id: `disc-6`, label: 'Pharmacy Dispensary Station', ip_address: `${gatewayBase}.112`, device_type: 'Clinical Dispensary PC', status: 'Active', mac_address: 'A4:BB:6D:88:99:00', open_ports: '443, 3389', latency_ms: 5 }
        ];
        setDiscoveredSubnetHosts(found);
        setToastMsg(`✓ /24 Subnet Scan Complete! Discovered 6 active hosts on ${subnetConfig.subnet_cidr}.`);
        setTimeout(() => setToastMsg(null), 4000);
        if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'SUBNET_SCAN_COMPLETE', { range: subnetConfig.subnet_cidr, active_hosts: 6 });
      } else {
        setScanProgress(Math.floor((current / 254) * 100));
        setScannedIpCount(current);
      }
    }, 40);
  };

  const handleImportDiscoveredHosts = () => {
    if (discoveredSubnetHosts.length === 0) return;
    const existingIps = networkIps.map(i => i.ip_address);
    const newItems = discoveredSubnetHosts.filter(h => !existingIps.includes(h.ip_address));
    if (newItems.length === 0) {
      setToastMsg('All discovered endpoints are already included in your monitored host list.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    const updated = [...networkIps, ...newItems];
    setNetworkIps(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, securityZones, updated);
    setToastMsg(`✓ Imported ${newItems.length} discovered host endpoints into Monitored Host Inventory.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePingHost = (ipId: string, ipAddress: string) => {
    const target = networkIps.find(i => i.id === ipId) || { id: ipId, label: 'Target Host', ip_address: ipAddress, device_type: 'Endpoint Node', status: 'Active' as const };
    setPingModalTarget(target);
    setIsModalPinging(true);
    setPingModalLogs([
      `[0.00s] PING ${ipAddress} (${ipAddress}) 56(84) bytes of data.`,
      `[0.10s] 64 bytes from ${ipAddress}: icmp_seq=1 ttl=128 time=1.42 ms`,
      `[0.22s] 64 bytes from ${ipAddress}: icmp_seq=2 ttl=128 time=1.18 ms`,
      `[0.35s] 64 bytes from ${ipAddress}: icmp_seq=3 ttl=128 time=1.55 ms`,
      `[0.48s] 64 bytes from ${ipAddress}: icmp_seq=4 ttl=128 time=1.20 ms`,
      `--- ${ipAddress} ping statistics ---`,
      `4 packets transmitted, 4 received, 0% packet loss, time 2004ms`,
      `rtt min/avg/max/mdev = 1.18/1.33/1.55/0.14 ms (ONLINE / ACTIVE)`
    ]);

    const lat = Math.floor(Math.random() * 5) + 1;
    const updated = networkIps.map(i => i.id === ipId ? { ...i, latency_ms: lat, status: 'Active' as const, last_ping: new Date().toLocaleTimeString() } : i);
    setNetworkIps(updated);
    saveAllToLocalStorage(facilityInfo, documents, backupPlans, accessReviews, securityZones, updated);

    setTimeout(() => {
      setIsModalPinging(false);
    }, 600);
  };

  const handleTriggerIpScan = (ipAddr: string) => {
    const target = networkIps.find(i => i.ip_address === ipAddr) || { id: 'scan-' + Date.now(), label: 'Target Host', ip_address: ipAddr, device_type: 'Network Node', status: 'Active' as const };
    setIpScanModalTarget(target);
    setIsModalScanning(true);

    if (logAuditTrail) logAuditTrail('QUICK_MASTER_SETUP', 'TRIGGER_IP_SCAN', { ip_address: ipAddr });

    setTimeout(() => {
      setIsModalScanning(false);
    }, 800);
  };

  return (
    <div id="quick-master-setup-root" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 rounded-3xl text-white border border-sky-500/30 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-sky-300" /> Quick Master Setup
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
              <Building className="w-6 h-6 text-sky-400" />
              Quick Master Setup & Facility Governance Matrix
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl mt-1">
              Configure master facility parameters, contact registers, document reference codes with auto-module assignment, data backup retention schedules, security zone mapping, and local network IP scans.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                saveAllToLocalStorage();
                setToastMsg('✓ All Quick Master Setup configurations saved to local storage!');
                setTimeout(() => setToastMsg(null), 3000);
              }}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save All Configurations
            </button>
          </div>
        </div>
      </div>

      {/* Toast & Validation Alerts */}
      {toastMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {validationError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Validation Error: {validationError}</span>
          </div>
          <button onClick={() => setValidationError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: FACILITY INFORMATION & CONTACTS */}
      {/* ========================================================================= */}
      <form onSubmit={handleSaveFacilityInfo} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-600 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Step 1: Governance & Organization Base
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Facility Information & Contact Directory
            </h2>
          </div>

          {/* Client Account Linkage */}
          {allClients.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase px-2 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-sky-600" /> Link Account:
              </span>
              <select
                value={facilityInfo.client_id}
                onChange={e => handleSelectClientAccount(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Select Registered Client Account --</option>
                {allClients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (facilityInfo.client_id) {
                    handleSelectClientAccount(facilityInfo.client_id);
                  }
                }}
                disabled={!facilityInfo.client_id}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>LINK ACCOUNT</span>
              </button>
            </div>
          )}
        </div>

        {/* First Row – Facility Information */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-sky-600" /> Top Row: Facility Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name *</label>
              <input
                type="text"
                value={facilityInfo.facility_name}
                onChange={e => setFacilityInfo({ ...facilityInfo, facility_name: e.target.value })}
                placeholder="e.g. SmartPro Health System & Medical Center"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Health License *</label>
              <input
                type="text"
                value={facilityInfo.health_license}
                onChange={e => setFacilityInfo({ ...facilityInfo, health_license: e.target.value })}
                placeholder="e.g. DOH-MF-2026-9842 / MOHAP-9901"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold text-sky-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Facility Commercial Number *</label>
              <input
                type="text"
                value={facilityInfo.commercial_number}
                onChange={e => setFacilityInfo({ ...facilityInfo, commercial_number: e.target.value })}
                placeholder="e.g. CN-1049281-2026"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Second Row – Contact Information (6 Required Roles) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-sky-600" /> Second Row: Key Facility & IT Contacts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Responsible Person */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-sky-700 block">1. Responsible Person</span>
              <input
                type="text"
                value={facilityInfo.contacts.responsible_person.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    responsible_person: { ...facilityInfo.contacts.responsible_person, name: e.target.value }
                  }
                })}
                placeholder="Full Name"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.responsible_person.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      responsible_person: { ...facilityInfo.contacts.responsible_person, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.responsible_person.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      responsible_person: { ...facilityInfo.contacts.responsible_person, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* 2. HR Manager */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-indigo-700 block">2. HR Manager</span>
              <input
                type="text"
                value={facilityInfo.contacts.hr_manager.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    hr_manager: { ...facilityInfo.contacts.hr_manager, name: e.target.value }
                  }
                })}
                placeholder="Full Name"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.hr_manager.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      hr_manager: { ...facilityInfo.contacts.hr_manager, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.hr_manager.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      hr_manager: { ...facilityInfo.contacts.hr_manager, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* 3. IT Manager */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-teal-700 block">3. IT Manager</span>
              <input
                type="text"
                value={facilityInfo.contacts.it_manager.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    it_manager: { ...facilityInfo.contacts.it_manager, name: e.target.value }
                  }
                })}
                placeholder="Full Name"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.it_manager.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      it_manager: { ...facilityInfo.contacts.it_manager, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.it_manager.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      it_manager: { ...facilityInfo.contacts.it_manager, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* 4. Facility Manager */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-700 block">4. Facility Manager</span>
              <input
                type="text"
                value={facilityInfo.contacts.facility_manager.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    facility_manager: { ...facilityInfo.contacts.facility_manager, name: e.target.value }
                  }
                })}
                placeholder="Full Name"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.facility_manager.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      facility_manager: { ...facilityInfo.contacts.facility_manager, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.facility_manager.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      facility_manager: { ...facilityInfo.contacts.facility_manager, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* 5. EMR Vendor Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-rose-700 block">5. EMR Vendor Name</span>
              <input
                type="text"
                value={facilityInfo.contacts.emr_vendor.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    emr_vendor: { ...facilityInfo.contacts.emr_vendor, name: e.target.value }
                  }
                })}
                placeholder="Vendor Name / Team"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.emr_vendor.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      emr_vendor: { ...facilityInfo.contacts.emr_vendor, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.emr_vendor.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      emr_vendor: { ...facilityInfo.contacts.emr_vendor, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* 6. IT Support Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-cyan-700 block">6. IT Support Name</span>
              <input
                type="text"
                value={facilityInfo.contacts.it_support.name}
                onChange={e => setFacilityInfo({
                  ...facilityInfo,
                  contacts: {
                    ...facilityInfo.contacts,
                    it_support: { ...facilityInfo.contacts.it_support, name: e.target.value }
                  }
                })}
                placeholder="IT Support Lead / Provider"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={facilityInfo.contacts.it_support.email}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      it_support: { ...facilityInfo.contacts.it_support, email: e.target.value }
                    }
                  })}
                  placeholder="Email ID"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <input
                  type="text"
                  value={facilityInfo.contacts.it_support.phone}
                  onChange={e => setFacilityInfo({
                    ...facilityInfo,
                    contacts: {
                      ...facilityInfo.contacts,
                      it_support: { ...facilityInfo.contacts.it_support, phone: e.target.value }
                    }
                  })}
                  placeholder="Telephone Number"
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4 text-sky-400" /> Save Facility & Contact Register
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* SECTION 2: DOCUMENT REFERENCE DETAILS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Step 2: Document Index Matrix
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Document Reference Details & Automatic Module Resolver
            </h2>
            <p className="text-xs text-slate-500">
              Module Name automatically updates based on selected Reference Code / Document Name (e.g. Policy, SOP, Forms, Register, Guideline).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadIndexPdf}
              disabled={isExportingIndexPdf || documents.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExportingIndexPdf ? 'Exporting Index PDF...' : 'Download Document Index Report (.pdf)'}
            </button>
          </div>
        </div>

        {/* Add / Edit Form Row */}
        <form onSubmit={handleAddOrUpdateDoc} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
            <span className="text-xs font-black uppercase text-slate-800">
              {editingDocId ? '✏️ Edit Version Record & Framework Tier Group' : '+ Add Version Record & Framework Tier Group'}
            </span>
            <BTATierSelector
              compact
              value={docForm.framework_group || 'Basic'}
              onChange={g => setDocForm({ ...docForm, framework_group: g })}
            />
            {editingDocId && (
              <button
                type="button"
                onClick={() => {
                  setEditingDocId(null);
                  setDocForm({
                    ref_code: '',
                    doc_name: 'Information Security High Level Policy',
                    module_name: 'Policy',
                    framework_group: 'Basic',
                    issue_date: new Date().toISOString().split('T')[0],
                    approval_date: new Date().toISOString().split('T')[0],
                    effective_date: new Date().toISOString().split('T')[0],
                    next_due_date: (() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      return d.toISOString().split('T')[0];
                    })()
                  });
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            {/* 1. Reference Code */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reference Code *</label>
              <input
                type="text"
                value={docForm.ref_code}
                onChange={e => handleDocCodeOrNameChange(e.target.value, docForm.doc_name)}
                placeholder="e.g. POL-SEC-001"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-indigo-900"
                required
              />
            </div>

            {/* 2. Document Name (Dropdown & Custom Manual Input) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Document Name (Dropdown) *</label>
                {!showManualDocInput && (
                  <button
                    type="button"
                    onClick={() => setShowManualDocInput(true)}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Manual Option
                  </button>
                )}
              </div>

              {showManualDocInput ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={manualDocNameInput}
                      onChange={e => setManualDocNameInput(e.target.value)}
                      placeholder="Type custom document name (e.g. Clinical Audit SOP)"
                      className="flex-1 p-2 rounded-xl border border-sky-400 bg-sky-50/50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddManualDocName}
                      className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Save Option
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualDocInput(false);
                        setManualDocNameInput('');
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={docForm.doc_name}
                  onChange={e => {
                    if (e.target.value === '__ADD_MANUAL__') {
                      setShowManualDocInput(true);
                    } else {
                      handleDocCodeOrNameChange(docForm.ref_code, e.target.value);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <optgroup label="Standard Policy & Governance Documents">
                    {STANDARD_DOCUMENT_NAMES.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </optgroup>
                  {customDocNames.length > 0 && (
                    <optgroup label="Custom / Manually Added Document Names">
                      {customDocNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__ADD_MANUAL__">➕ + Add Custom / Manual Option...</option>
                </select>
              )}
            </div>

            {/* 3. Module Name (Auto-derived) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Module Name (Auto) *</label>
              <input
                type="text"
                value={docForm.module_name}
                onChange={e => setDocForm({ ...docForm, module_name: e.target.value })}
                placeholder="Auto-derived Module"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-sky-50 font-black text-sky-950"
              />
            </div>

            {/* 4. Classification Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Classification *</label>
              <select
                value={docForm.classification || 'CONFIDENTIAL'}
                onChange={e => setDocForm({ ...docForm, classification: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="OFFICIAL">OFFICIAL</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="PUBLIC">PUBLIC</option>
                <option value="OFFICIAL / RESTRICTED">OFFICIAL / RESTRICTED</option>
                <option value="STRICTLY CONFIDENTIAL">STRICTLY CONFIDENTIAL</option>
              </select>
            </div>

            {/* 5. Issue Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={docForm.issue_date}
                onChange={e => setDocForm({ ...docForm, issue_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            {/* 6. Approval Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Approval Date</label>
              <input
                type="date"
                value={docForm.approval_date}
                onChange={e => setDocForm({ ...docForm, approval_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            {/* 7. Effective Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={docForm.effective_date}
                onChange={e => setDocForm({ ...docForm, effective_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            {/* 8. Next Due Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Due Date</label>
              <input
                type="date"
                value={docForm.next_due_date}
                onChange={e => setDocForm({ ...docForm, next_due_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono text-rose-900 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {editingDocId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingDocId ? 'Update Version Record' : '+ Add Version Record'}
            </button>
          </div>
        </form>

        {/* Document Records Table */}
        <div id="doc-index-report-printable" className="overflow-x-auto border border-slate-200 rounded-2xl bg-white p-4">
          <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">{client?.company_name || 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L'}</h3>
              <p className="text-xs font-bold text-sky-700">Master Governance Document Index & Reference Register</p>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Total Documents: {documents.length}</p>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3">Reference Code</th>
                <th className="p-3">Document Name</th>
                <th className="p-3">Module Name</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Version Control</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Approval Date</th>
                <th className="p-3">Effective Date</th>
                <th className="p-3">Next Due Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    No Document Reference Records created yet. Use the form above to add a new document.
                  </td>
                </tr>
              ) : (
                documents.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-900">{d.ref_code}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{d.doc_name}</div>
                      {d.is_mapped && d.mapped_from && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-md px-1.5 py-0.5">
                          <Link2 className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                          <span>Mapped From: <strong>{d.mapped_from}</strong></span>
                          <span className="text-[8px] text-emerald-600 font-mono font-black ml-0.5">● SYNCED</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                        d.module_name === 'Policy' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        d.module_name === 'SOP' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        d.module_name === 'Forms' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        d.module_name === 'Register' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {d.module_name}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        (d.classification || 'CONFIDENTIAL').includes('CONFIDENTIAL') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        (d.classification || '').includes('RESTRICTED') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {d.classification || 'CONFIDENTIAL'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-emerald-800 font-bold">{d.version_control || 'v1.0'}</td>
                    <td className="p-3 font-mono text-slate-600">{d.issue_date}</td>
                    <td className="p-3 font-mono text-slate-600">{d.approval_date}</td>
                    <td className="p-3 font-mono text-slate-600">{d.effective_date}</td>
                    <td className="p-3 font-mono text-rose-700 font-bold">{d.next_due_date}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditDoc(d)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteDoc(d)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: BACKUP PLAN */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-600 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> Step 3: Disaster Recovery Data Preservation
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Facility Data Backup Plan & Retention Schedule
            </h2>
          </div>
        </div>

        {/* Add/Edit Backup Plan Form */}
        <form onSubmit={handleAddOrUpdateBackup} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase text-slate-800">
              {editingBackupId ? '✏️ Edit Backup Schedule Record' : '➕ Add Backup Plan Record'}
            </span>
            {editingBackupId && (
              <button
                type="button"
                onClick={() => {
                  setEditingBackupId(null);
                  setBackupForm({ system_name: '', backup_type: 'Full', retention_period: '30 Days', schedule_time: '02:00 AM' });
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* System / Target Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target System Name *</label>
              <input
                type="text"
                value={backupForm.system_name}
                onChange={e => setBackupForm({ ...backupForm, system_name: e.target.value })}
                placeholder="e.g. EMR Core Production DB"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                required
              />
            </div>

            {/* Backup Type Dropdown */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Backup Type *</label>
              <select
                value={backupForm.backup_type}
                onChange={e => setBackupForm({ ...backupForm, backup_type: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              >
                <option value="Full">Full</option>
                <option value="Incremental">Incremental</option>
                <option value="Smart">Smart</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            {/* Retention Period Dropdown */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Retention Period *</label>
              <select
                value={backupForm.retention_period}
                onChange={e => setBackupForm({ ...backupForm, retention_period: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              >
                <option value="1 Day">1 Day</option>
                <option value="2 Days">2 Days</option>
                <option value="3 Days">3 Days</option>
                <option value="5 Days">5 Days</option>
                <option value="7 Days">7 Days</option>
                <option value="14 Days">14 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="180 Days">180 Days</option>
              </select>
            </div>

            {/* Backup Schedule Time (Time Picker AM/PM) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Backup Schedule Time (AM/PM) *</label>
              <input
                type="text"
                value={backupForm.schedule_time}
                onChange={e => setBackupForm({ ...backupForm, schedule_time: e.target.value })}
                placeholder="e.g. 02:00 AM / 11:30 PM"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-indigo-900"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {editingBackupId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingBackupId ? 'Update Backup Plan' : '+ Add Backup Plan'}
            </button>
          </div>
        </form>

        {/* Backup Plan Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3">System Name</th>
                <th className="p-3">Backup Type</th>
                <th className="p-3">Retention Period</th>
                <th className="p-3">Schedule Time (AM/PM)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {backupPlans.map(bp => (
                <tr key={bp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{bp.system_name}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                      {bp.backup_type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700 font-semibold">{bp.retention_period}</td>
                  <td className="p-3 font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {bp.schedule_time}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditBackup(bp)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(bp.id, bp.system_name)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: ACCESS REVIEW DOCUMENTS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-600 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Step 4: Access Control & Privileges Audit
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Access Review Documents & Periodic Verification Schedule
            </h2>
          </div>
        </div>

        {/* Add/Edit Form */}
        <form onSubmit={handleAddOrUpdateAccess} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase text-slate-800">
              {editingAccessId ? '✏️ Edit Access Review Document' : '➕ Add Access Review Document'}
            </span>
            {editingAccessId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAccessId(null);
                  setAccessForm({
                    doc_title: '',
                    ref_code: '',
                    review_frequency: 'Quarterly',
                    last_review_date: new Date().toISOString().split('T')[0],
                    next_review_date: (() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 3);
                      return d.toISOString().split('T')[0];
                    })(),
                    assigned_reviewer: 'IT Manager',
                    status: 'Compliant'
                  });
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
              <input
                type="text"
                value={accessForm.doc_title}
                onChange={e => setAccessForm({ ...accessForm, doc_title: e.target.value })}
                placeholder="e.g. Active Directory Privileged Access Review"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Review Frequency *</label>
              <select
                value={accessForm.review_frequency}
                onChange={e => setAccessForm({ ...accessForm, review_frequency: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Review Date</label>
              <input
                type="date"
                value={accessForm.last_review_date}
                onChange={e => setAccessForm({ ...accessForm, last_review_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Next Review Date</label>
              <input
                type="date"
                value={accessForm.next_review_date}
                onChange={e => setAccessForm({ ...accessForm, next_review_date: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono text-indigo-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Reviewer</label>
              <input
                type="text"
                value={accessForm.assigned_reviewer}
                onChange={e => setAccessForm({ ...accessForm, assigned_reviewer: e.target.value })}
                placeholder="e.g. CISO / Quality Lead"
                className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {editingAccessId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingAccessId ? 'Update Access Review' : '+ Add Access Review'}
            </button>
          </div>
        </form>

        {/* Access Review Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3">Document Title</th>
                <th className="p-3">Review Frequency</th>
                <th className="p-3">Last Review</th>
                <th className="p-3">Next Review Due</th>
                <th className="p-3">Reviewer</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {accessReviews.map(ar => (
                <tr key={ar.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{ar.doc_title}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      {ar.review_frequency}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{ar.last_review_date}</td>
                  <td className="p-3 font-mono text-indigo-900 font-bold">{ar.next_review_date}</td>
                  <td className="p-3 text-slate-700 font-medium">{ar.assigned_reviewer}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      ar.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      ar.status === 'Pending Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {ar.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditAccess(ar)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccess(ar.id, ar.doc_title)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: SECURITY ZONES */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-sky-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Step 5: Physical Facility Security Boundaries
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Facility Security Zones & Physical Locations
            </h2>
          </div>
        </div>

        {/* Add/Edit Form */}
        <form onSubmit={handleAddOrUpdateZone} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase text-slate-800">
              {editingZoneId ? '✏️ Edit Security Zone Record' : '➕ Add Security Zone Record'}
            </span>
            {editingZoneId && (
              <button
                type="button"
                onClick={() => {
                  setEditingZoneId(null);
                  setZoneForm({ zone: `Zone ${securityZones.length + 1}`, description: 'Restricted Area', location: '' });
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Zone *</label>
              <input
                type="text"
                value={zoneForm.zone}
                onChange={e => setZoneForm({ ...zoneForm, zone: e.target.value })}
                placeholder="e.g. Zone 1 / Zone 2"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description *</label>
              <input
                type="text"
                value={zoneForm.description}
                onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })}
                placeholder="e.g. High Security Area / Public Area"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Location Assigned *</label>
              <input
                type="text"
                value={zoneForm.location}
                onChange={e => setZoneForm({ ...zoneForm, location: e.target.value })}
                placeholder="e.g. Data Center Vault B1 / Reception Lobby"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {editingZoneId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingZoneId ? 'Update Security Zone' : '+ Add Security Zone'}
            </button>
          </div>
        </form>

        {/* Security Zones Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3">Zone</th>
                <th className="p-3">Description</th>
                <th className="p-3">Physical Location Assigned</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {securityZones.map(z => (
                <tr key={z.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-extrabold font-mono text-amber-900">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                      {z.zone}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{z.description}</td>
                  <td className="p-3 font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {z.location}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditZone(z)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Edit Zone"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteZone(z.id, z.zone)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete Zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5B: STATEMENT OF APPLICABILITY (SoA) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-600 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5" /> Step 5B: Statement of Applicability (SoA) Controls Baseline
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Statement of Applicability (SoA) - Control Objectives & Applicability Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Configure control objectives and select applicability status ("Applicable" / "Not applicable") for DOH ADHICS & ISO 27001 compliance standards.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold font-mono">
              M-Policy-002
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              CONTROL OBJECTIVES AND APPLICABILITY
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              Select <strong className="text-emerald-700">Applicable</strong> or <strong className="text-slate-600">Not applicable</strong> for each control domain below
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-600 tracking-wider">
                  <th className="p-3.5 w-1/4">Control Area</th>
                  <th className="p-3.5 w-7/12">Control Objective</th>
                  <th className="p-3.5 w-2/12 text-center">Applicability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {soaControls.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 align-top">
                      {item.area}
                    </td>
                    <td className="p-3.5 text-slate-600 leading-relaxed align-top">
                      {item.objective}
                    </td>
                    <td className="p-3.5 text-center align-top">
                      <select
                        value={item.applicability}
                        onChange={(e) => {
                          const updated = [...soaControls];
                          updated[index].applicability = e.target.value;
                          setSoaControls(updated);
                        }}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                          item.applicability === 'Applicable'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                            : 'bg-slate-100 text-slate-600 border-slate-300 focus:ring-2 focus:ring-slate-400'
                        }`}
                      >
                        <option value="Applicable">Applicable</option>
                        <option value="Not applicable">Not applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: LOCAL NETWORK IP SCAN & HOST MONITORING */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-600 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" /> Step 6: Local Network IP Scan & Host Monitoring
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Facility Local Network IP Scan & Host Monitoring (/24 Subnet)
            </h2>
            <p className="text-xs text-slate-500">
              Configure facility network parameters, scan local IP /24 range with default gateway & DNS servers, and manage monitored endpoint host targets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunSubnetScan}
            disabled={isScanningSubnet}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Activity className={`w-4 h-4 ${isScanningSubnet ? 'animate-spin' : ''}`} />
            {isScanningSubnet ? 'Scanning /24 Subnet...' : '🔍 Scan /24 Subnet Range'}
          </button>
        </div>

        {/* Subnet /24 Configuration Row */}
        <div className="p-4 rounded-2xl bg-cyan-950 text-white space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
            <span className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Facility Network Gateway & DNS Configuration
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-900/80 text-cyan-300 border border-cyan-700/50">
              {subnetConfig.subnet_cidr}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-cyan-200 mb-1 text-[11px]">Subnet CIDR Range</label>
              <input
                type="text"
                value={subnetConfig.subnet_cidr}
                onChange={e => setSubnetConfig({ ...subnetConfig, subnet_cidr: e.target.value })}
                className="w-full p-2 rounded-xl bg-cyan-900/70 border border-cyan-700 text-cyan-100 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-cyan-200 mb-1 text-[11px]">Default Gateway IP *</label>
              <input
                type="text"
                value={subnetConfig.gateway_ip}
                onChange={e => setSubnetConfig({ ...subnetConfig, gateway_ip: e.target.value })}
                placeholder="192.168.1.1"
                className="w-full p-2 rounded-xl bg-cyan-900/70 border border-cyan-700 text-cyan-100 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-cyan-200 mb-1 text-[11px]">Primary DNS Server *</label>
              <input
                type="text"
                value={subnetConfig.primary_dns}
                onChange={e => setSubnetConfig({ ...subnetConfig, primary_dns: e.target.value })}
                placeholder="192.168.1.254"
                className="w-full p-2 rounded-xl bg-cyan-900/70 border border-cyan-700 text-cyan-100 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-cyan-200 mb-1 text-[11px]">Secondary DNS Server</label>
              <input
                type="text"
                value={subnetConfig.secondary_dns}
                onChange={e => setSubnetConfig({ ...subnetConfig, secondary_dns: e.target.value })}
                placeholder="8.8.8.8"
                className="w-full p-2 rounded-xl bg-cyan-900/70 border border-cyan-700 text-cyan-100 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-cyan-200 mb-1 text-[11px]">Subnet Mask</label>
              <input
                type="text"
                value={subnetConfig.subnet_mask}
                onChange={e => setSubnetConfig({ ...subnetConfig, subnet_mask: e.target.value })}
                placeholder="255.255.255.0"
                className="w-full p-2 rounded-xl bg-cyan-900/70 border border-cyan-700 text-cyan-100 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Subnet Scan Progress Bar & Host Discovery Results */}
        {(isScanningSubnet || scanProgress > 0) && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-400 flex items-center gap-2">
                <Search className="w-4 h-4 animate-spin text-cyan-400" />
                Scanning Local Network Range [{subnetConfig.subnet_cidr}]
              </span>
              <span className="font-mono text-slate-300">
                {scannedIpCount}/254 IPs Scanned ({scanProgress}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            {discoveredSubnetHosts.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Discovered {discoveredSubnetHosts.length} Active Hosts on Subnet
                  </span>
                  <button
                    type="button"
                    onClick={handleImportDiscoveredHosts}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Import Discovered Endpoints
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {discoveredSubnetHosts.map(h => (
                    <div key={h.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-100">{h.label}</div>
                        <div className="font-mono text-cyan-400 font-bold text-[11px]">{h.ip_address}</div>
                        <div className="text-[10px] text-slate-400">MAC: {h.mac_address}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800/50">
                        {h.latency_ms} ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit IP Form */}
        <form onSubmit={handleAddOrUpdateIp} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black uppercase text-slate-800">
              {editingIpId ? '✏️ Edit Local Network IP Record' : '➕ Add Local Network IP Record'}
            </span>
            {editingIpId && (
              <button
                type="button"
                onClick={() => {
                  setEditingIpId(null);
                  setIpForm({ label: `IP Address ${networkIps.length + 1}`, ip_address: '192.168.1.120', device_type: 'Host Server', status: 'Active' });
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">IP Identifier / Label *</label>
              <input
                type="text"
                value={ipForm.label}
                onChange={e => setIpForm({ ...ipForm, label: e.target.value })}
                placeholder="e.g. IP Address 1 (EMR DB Server)"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">IP Address *</label>
              <input
                type="text"
                value={ipForm.ip_address}
                onChange={e => setIpForm({ ...ipForm, ip_address: e.target.value })}
                placeholder="e.g. 192.168.1.100"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-cyan-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Device Type / Host Description</label>
              <input
                type="text"
                value={ipForm.device_type}
                onChange={e => setIpForm({ ...ipForm, device_type: e.target.value })}
                placeholder="e.g. Database Server / Medical Workstation"
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {editingIpId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingIpId ? 'Update Network IP Record' : '+ Add Network IP Record'}
            </button>
          </div>
        </form>

        {/* Network IP Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="p-3">IP Label</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Device / Host Description</th>
                <th className="p-3 text-center">Status / Latency</th>
                <th className="p-3 text-right">IP Scan & Monitoring Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {networkIps.map(ip => (
                <tr key={ip.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{ip.label}</td>
                  <td className="p-3 font-mono font-bold text-cyan-900 text-sm">
                    {ip.ip_address}
                    {ip.mac_address && (
                      <div className="text-[10px] text-slate-400 font-sans">MAC: {ip.mac_address}</div>
                    )}
                  </td>
                  <td className="p-3 text-slate-700 font-medium">{ip.device_type}</td>
                  <td className="p-3 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {ip.status}
                      </span>
                      {ip.latency_ms && (
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          ⚡ {ip.latency_ms} ms
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePingHost(ip.id, ip.ip_address)}
                        disabled={pingingIpId === ip.id}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
                        title="Ping Host Endpoint"
                      >
                        <Activity className={`w-3.5 h-3.5 text-cyan-600 ${pingingIpId === ip.id ? 'animate-spin' : ''}`} />
                        <span>Ping</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerIpScan(ip.ip_address)}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        title="Run IP Scan and Navigate to Endpoint Guard"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>IP Scan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditIp(ip)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="Edit IP"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestDeleteIp(ip)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Delete IP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL - DOCUMENT REFERENCE */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirm Document Deletion
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this Document Reference record? This will permanently remove it from the facility master repository.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
              <div className="text-indigo-900 font-bold">
                Reference Code: <span className="bg-indigo-100 px-1.5 py-0.5 rounded">{docToDelete.ref_code}</span>
              </div>
              <div className="text-slate-800 font-sans font-bold pt-1">
                Document: {docToDelete.doc_name}
              </div>
              <div className="text-slate-500 font-sans text-[11px]">
                Module: {docToDelete.module_name}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoc}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL - NETWORK IP RECORD */}
      {/* ========================================================================= */}
      {ipToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirm Network Host Deletion
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to remove this endpoint host from local host monitoring?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{ipToDelete.label}</div>
              <div className="font-mono text-cyan-900 font-bold">{ipToDelete.ip_address}</div>
              <div className="text-slate-500 text-[11px]">{ipToDelete.device_type}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIpToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteIp}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Remove IP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMALL POPUP MODAL 1: PING STATUS & CONNECTIVITY DIAGNOSTIC */}
      {pingModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#090d16] text-white w-full max-w-lg rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Activity className={`w-5 h-5 ${isModalPinging ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>📡 ICMP Ping Diagnostic Status</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Target: {pingModalTarget.label}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                STATUS: ONLINE
              </span>
            </div>

            {/* Target Details Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Host IP Address</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{pingModalTarget.ip_address}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Device Category</span>
                <span className="font-bold text-slate-200">{pingModalTarget.device_type}</span>
              </div>
              {pingModalTarget.mac_address && (
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">MAC Hardware ID</span>
                  <span className="font-mono text-slate-300 text-xs">{pingModalTarget.mac_address}</span>
                </div>
              )}
            </div>

            {/* Console Log Output Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Live Packet Exchange Log</span>
              <div className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-emerald-400 space-y-1 border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                {pingModalLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('statistics') || log.includes('rtt') ? 'text-cyan-300 font-bold pt-1 border-t border-slate-900' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handlePingHost(pingModalTarget.id, pingModalTarget.ip_address)}
                className="px-4 py-2 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isModalPinging ? 'animate-spin' : ''}`} />
                Re-Ping Endpoint
              </button>
              <button
                type="button"
                onClick={() => setPingModalTarget(null)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
              >
                Close Status Popup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMALL POPUP MODAL 2: IP SCAN & ENDPOINT AUDIT STATUS */}
      {ipScanModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#090d16] text-white w-full max-w-lg rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Search className={`w-5 h-5 ${isModalScanning ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>🔍 IP Scan & Port Audit Report</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Target Host: {ipScanModalTarget.label}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AUDIT COMPLETE
              </span>
            </div>

            {/* Target Overview */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Scanned IP</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{ipScanModalTarget.ip_address}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Device Type</span>
                <span className="font-bold text-slate-200">{ipScanModalTarget.device_type}</span>
              </div>
            </div>

            {/* Discovered Ports & Posture */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">Discovered Open Services & Ports</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Port 445 (SMB/CIFS)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Port 3389 (RDP)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Port 443 (HTTPS)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Port 135 (RPC)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Endpoint Compliance & Hardening Check</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>BitLocker Storage Encryption:</span>
                    <span className="font-extrabold text-emerald-400">XTS-AES 256-bit Active</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>SMBv1 Legacy Protocol:</span>
                    <span className="font-extrabold text-emerald-400">Disabled (Secure)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Windows Defender Antivirus:</span>
                    <span className="font-extrabold text-emerald-400">Real-time Enabled</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Firewall Status:</span>
                    <span className="font-extrabold text-emerald-400">Domain Profile Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    setIpScanModalTarget(null);
                    onNavigateTab('windows-endpoint-auditor');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-4 h-4" /> Open SecOps Endpoint Guard
                </button>
              )}
              <button
                type="button"
                onClick={() => setIpScanModalTarget(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK COMPLIANCE POLICY SETUP WIZARD MODAL */}
      {/* ========================================================================= */}
      {isQuickSetupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Quick Compliance Policy Setup</h3>
                  <p className="text-xs text-slate-400">Configure and publish 7 critical compliance policies for {facilityInfo.facility_name || client?.company_name || 'Active Clinic'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickSetupOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-bold text-slate-600">
              {[
                { id: 'governance', label: '1. Sign-off Roles', icon: <PenTool className="w-3.5 h-3.5" /> },
                { id: 'antivirus', label: '2. Antivirus Solution', icon: <Shield className="w-3.5 h-3.5" /> },
                { id: 'access', label: '3. Access Audits', icon: <Lock className="w-3.5 h-3.5" /> },
                { id: 'physical', label: '4. Physical Zones', icon: <Server className="w-3.5 h-3.5" /> },
                { id: 'backup', label: '5. Backup Schedule', icon: <HardDrive className="w-3.5 h-3.5" /> },
                { id: 'incident', label: '6. Incident SLAs', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { id: 'doccontrol', label: '7. Doc Governance', icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'soa', label: '8. SoA Matrix', icon: <Table className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWizardTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeWizardTab === tab.id
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                      : 'hover:bg-slate-200 text-slate-700 font-semibold'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {activeWizardTab === 'governance' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">Policy Prepared, Verified & Approved By Sign-off Matrix</h4>
                    <p className="text-slate-500">Specify signatories to automatically populate the approval section on all generated compliance policies.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Prepared By */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Prepared By (Author)
                      </span>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={wizardPreparedByName}
                          onChange={e => setWizardPreparedByName(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation</label>
                        <input
                          type="text"
                          value={wizardPreparedByDesignation}
                          onChange={e => setWizardPreparedByDesignation(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Reviewed By */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        Reviewed By (Compliance)
                      </span>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={wizardReviewedByName}
                          onChange={e => setWizardReviewedByName(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation</label>
                        <input
                          type="text"
                          value={wizardReviewedByDesignation}
                          onChange={e => setWizardReviewedByDesignation(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Approved By */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        Approved By (CEO / Director)
                      </span>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={wizardApprovedByName}
                          onChange={e => setWizardApprovedByName(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation</label>
                        <input
                          type="text"
                          value={wizardApprovedByDesignation}
                          onChange={e => setWizardApprovedByDesignation(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWizardTab === 'antivirus' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-009: Antivirus & Endpoint Security Solution Selection</h4>
                  <p className="text-slate-500">Select active endpoint detection & response (EDR) or antivirus engine deployed across facility workstations.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Microsoft Defender for Endpoint', 'SentinelOne EDR', 'CrowdStrike Falcon', 'Kaspersky Endpoint Security', 'Sophos Intercept X', 'Custom / Other'].map((av) => (
                      <label key={av} className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${selectedAntivirus === av ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="antivirus_sel"
                          checked={selectedAntivirus === av}
                          onChange={() => setSelectedAntivirus(av)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-800">{av}</span>
                      </label>
                    ))}
                  </div>
                  {selectedAntivirus === 'Custom / Other' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Specify Custom Endpoint Solution Name</label>
                      <input
                        type="text"
                        value={customAntivirus}
                        onChange={e => setCustomAntivirus(e.target.value)}
                        placeholder="e.g. ESET PROTECT Advanced"
                        className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold text-slate-900"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeWizardTab === 'access' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-006: Access Control Audit & Review Schedule</h4>
                  <p className="text-slate-500">Select how frequently user access permissions and privileged credentials are re-certified by management.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Quarterly', 'Twice a Year', 'Yearly'].map((freq) => (
                      <label key={freq} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${accessReviewFrequency === freq ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 font-bold text-indigo-900' : 'border-slate-200 hover:bg-slate-50 text-slate-800'}`}>
                        <span className="font-black text-xs">{freq} Audit</span>
                        <input
                          type="radio"
                          name="access_freq"
                          checked={accessReviewFrequency === freq}
                          onChange={() => setAccessReviewFrequency(freq as any)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeWizardTab === 'physical' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-013: Physical & Environmental Perimeter Zones</h4>
                  <p className="text-slate-500">Physical security zones classification bound to DOH ADHICS controls.</p>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-800">Public Access Area:</strong> Reception Waiting Area, Main Entrance Lobby
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-800">Work Area:</strong> Doctor Consultation Rooms, Nursing Workstations
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-800">Restricted Area:</strong> Treatment Bay, Clinical Laboratory, Medical Records Archive
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <strong className="text-slate-800">High Security Area:</strong> IT Server Cabinet Room, Pharmacy Vault
                    </div>
                  </div>
                </div>
              )}

              {activeWizardTab === 'backup' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-021: Backup & Data Restoration Schedule</h4>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                    ✓ Daily Incremental EMR & DB Snapshots + Monthly Full Offsite Backup configured with AES-256 encryption.
                  </div>
                </div>
              )}

              {activeWizardTab === 'incident' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-025: Incident Escalation & Response SLAs</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Severity Level</th>
                          <th className="p-2.5">Ack SLA</th>
                          <th className="p-2.5">Resolution SLA</th>
                          <th className="p-2.5">AD Health SOC Escalation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-2.5 text-rose-600 font-bold">P1 - Critical</td>
                          <td className="p-2.5">30 Mins</td>
                          <td className="p-2.5">2 Hours</td>
                          <td className="p-2.5 text-indigo-700 font-bold">Near-Real Time</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-orange-600 font-bold">P2 - Severe</td>
                          <td className="p-2.5">1 Hour</td>
                          <td className="p-2.5">4 Hours</td>
                          <td className="p-2.5">Within 1 Hour</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-amber-600 font-bold">P3 - Elevated</td>
                          <td className="p-2.5">1 Hour</td>
                          <td className="p-2.5">24 Hours</td>
                          <td className="p-2.5">Within 1 Hour</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeWizardTab === 'doccontrol' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <h4 className="font-extrabold text-slate-900 text-sm">POL-SEC-031: Document Control & Versioning Governance</h4>
                  <p className="text-slate-500">Defines document naming convention, classification levels (Secret, Confidential, Restricted, Public) and review lifecycle.</p>
                </div>
              )}

              {activeWizardTab === 'soa' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-1">
                    <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      M-Policy-002: Statement of Applicability (SoA) Controls Baseline
                    </h4>
                    <p className="text-slate-600">
                      Maps 13 security control domains to DOH ADHICS & ISO 27001 compliance mandates. Select "Applicable" or "Not applicable" for each control objective below:
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white text-xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>CONTROL OBJECTIVES AND APPLICABILITY</span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">13 Security Control Domains</span>
                    </div>
                    <div className="overflow-y-auto max-h-[380px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 z-10 shadow-3xs">
                          <tr>
                            <th className="p-3 w-1/4">Control Area</th>
                            <th className="p-3 w-7/12">Control Objective</th>
                            <th className="p-3 w-2/12 text-center">Applicability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {soaControls.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 font-semibold text-slate-900 align-top">
                                {item.area}
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed text-slate-600 align-top">
                                {item.objective}
                              </td>
                              <td className="p-3 text-center align-top">
                                <select
                                  value={item.applicability}
                                  onChange={(e) => {
                                    const updated = [...soaControls];
                                    updated[index].applicability = e.target.value;
                                    setSoaControls(updated);
                                  }}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                                    item.applicability === 'Applicable'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                                      : 'bg-slate-100 text-slate-600 border-slate-300 focus:ring-2 focus:ring-slate-400'
                                  }`}
                                >
                                  <option value="Applicable">Applicable</option>
                                  <option value="Not applicable">Not applicable</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Facility: <strong>{facilityInfo.facility_name || client?.company_name || 'Active Medical Center'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSetupOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyQuickPolicySetup}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Save & Generate 7 Custom Policies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT METADATA MASTER MAP MODAL */}
      <MetadataMappingModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setMapModalTarget(null);
        }}
        targetDoc={mapModalTarget}
        onSelectSource={handleSelectMapSource}
      />
    </div>
  );
}
