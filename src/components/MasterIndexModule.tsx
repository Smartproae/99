/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { formatDateDMY, formatDateTimeDMY } from '../utils/dateUtils';
import { printHtmlInHiddenIframe } from '../utils/printUtils';

import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  History,
  Shield,
  Building,
  UserCheck,
  Tag,
  Calendar,
  Layers,
  FolderCheck,
  FileSpreadsheet,
  FileCheck,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileUp,
  FileCode,
  Lock,
  Sparkles,
  CheckSquare,
  AlertOctagon,
  RefreshCw,
  Bell,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Network,
  Link2,
  GitFork,
  Unlink,
  ShieldAlert,
  Scale,
  Users,
  Server,
  Building2,
  FileCheck2
} from 'lucide-react';
import {
  MasterDocument,
  VersionRecord,
  DocumentCategoryType,
  MasterClassification,
  MasterDocStatus,
  Policy,
  ComplianceForm,
  DocumentItem,
  RiskItem,
  Asset,
  Incident,
  Audit,
  CorrectiveAction,
  Client,
  User,
  AuditLog
} from '../types';
import QuickMasterSetup from './QuickMasterSetup';
import { printCurrentView } from '../utils/printUtils';

interface MasterIndexModuleProps {
  policies: Policy[];
  forms: ComplianceForm[];
  documents: DocumentItem[];
  risks?: RiskItem[];
  assets?: Asset[];
  incidents?: Incident[];
  audits?: Audit[];
  actions?: CorrectiveAction[];
  client: Client;
  activeClientId: string;
  currentUser?: User;
  auditLogs?: AuditLog[];
  onUpdatePolicy?: (policy: Policy) => void;
  onAddPolicy?: (policy: Policy) => void;
  onDeletePolicy?: (id: string) => void;
  onUpdateForm?: (form: ComplianceForm) => void;
  onAddForm?: (form: ComplianceForm) => void;
  onDeleteForm?: (id: string) => void;
  onAddDocument?: (doc: DocumentItem) => void;
  onUpdateClient?: (client: Client) => void;
  onNavigateTab?: (tabId: string) => void;
  logAuditTrail?: (module: string, action: string, payload: any) => void;
}

export default function MasterIndexModule({
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
  onUpdatePolicy,
  onAddPolicy,
  onDeletePolicy,
  onUpdateForm,
  onAddForm,
  onDeleteForm,
  onAddDocument,
  onUpdateClient,
  onNavigateTab,
  logAuditTrail
}: MasterIndexModuleProps) {
  // Master View Navigation Tabs
  const [activeTab, setActiveTab] = useState<'TABLE' | 'DASHBOARD' | 'MAPPINGS' | 'APPROVALS' | 'VERSIONS' | 'AUDIT' | 'QUICK_SETUP'>('TABLE');

  // Default system register data for Quick Setup connects
  const DEFAULT_LEGAL_ITEMS = [
    { id: 'LEG-001', title: 'ADHCIS v2 Information Security Standard', domain: 'Health Data' },
    { id: 'LEG-002', title: 'Federal Law No. 45/2021 on Personal Data Protection', domain: 'Privacy' },
    { id: 'LEG-003', title: 'ISO/IEC 27001:2022 Statutory Annex A Controls', domain: 'Cyber Security' },
    { id: 'LEG-004', title: 'MOHAP Healthcare Facility Compliance Guidelines', domain: 'Regulatory' },
    { id: 'LEG-005', title: 'OSHAD SF v3.1 Occupational Safety & Health Framework', domain: 'Safety' },
  ];

  const DEFAULT_EMPLOYEES = [
    { id: 'EMP-101', name: 'Dr. Aseef Sulaiman', role: 'Chief Information Security Officer (CISO)' },
    { id: 'EMP-102', name: 'Sara Al-Mansoori', role: 'Lead Compliance Auditor' },
    { id: 'EMP-103', name: 'Tariq Mahmood', role: 'Facility Operations Manager' },
    { id: 'EMP-104', name: 'Beema Yoosaf', role: 'EMR System Administrator' },
    { id: 'EMP-105', name: 'Khalid Hassan', role: 'Emergency Incident Commander' },
  ];

  const DEFAULT_SECURITY_ZONES = [
    { id: 'ZONE-01', title: 'Data Center Main Server Vault (Zone A - Restricted)', level: 'Biometric Access' },
    { id: 'ZONE-02', title: 'Executive Records & Compliance Archive Room (Zone B)', level: 'Keycard Access' },
    { id: 'ZONE-03', title: 'Facility Power Control & Generator Plant Area (Zone C)', level: 'Engineering Staff' },
    { id: 'ZONE-04', title: 'Emergency Operations Command Center (Zone D)', level: 'Command Staff' },
    { id: 'ZONE-05', title: 'Cleanroom Laboratory & Medical Store (Zone E)', level: 'Authorized Personnel' },
  ];

  const DEFAULT_CONTRACTS = [
    { id: 'CTR-2026-01', title: 'Master Service Agreement - IT Security Maintenance (Apex)', vendor: 'Apex Solutions' },
    { id: 'CTR-2026-02', title: 'SLA 24/7 EMR Infrastructure Support (SafeCare Tech)', vendor: 'SafeCare' },
    { id: 'CTR-2026-03', title: 'Facility Physical Security & Access Control Contract', vendor: 'SmartPro' },
    { id: 'CTR-2026-04', title: 'Cloud Hosting & Disaster Recovery Subscription', vendor: 'CloudOps' },
    { id: 'CTR-2026-05', title: 'Vendor Confidentiality & Non-Disclosure Agreement (NDA)', vendor: 'Legal Corp' },
  ];

  // Quick Setup Form State
  const [quickSetupData, setQuickSetupData] = useState<{
    doc_ref: string;
    doc_name: string;
    category: DocumentCategoryType;
    sub_category: string;
    department: string;
    classification: MasterClassification;
    review_date: string;
    effective_date: string;
    due_date: string;
    prepared_by: string;
    reviewed_by: string;
    approved_by: string;
    page_format: 'A4 Portrait' | 'A4 Landscape';
    version_number: string;
    version_description: string;
    revision_history_logs: VersionRecord[];
    mapped_risk_ids: string[];
    mapped_legal_ids: string[];
    mapped_employee_ids: string[];
    mapped_asset_ids: string[];
    mapped_security_zone_ids: string[];
    mapped_contract_ids: string[];
    mapped_doc_ids: string[];
    org_name: string;
    compliance_framework: string;
    header_badge_text: string;
    footer_disclaimer: string;
    security_marking: string;
    show_watermark: boolean;
    watermark_text: string;
  }>({
    doc_ref: 'ZZP-IT-PE-05/2021',
    doc_name: 'ISO 27001 & ADHICS v2 Compliance',
    category: 'Policies',
    sub_category: 'Information Security & Risk Management',
    department: 'IT Security & Compliance',
    classification: 'Restricted',
    review_date: '2026-06-30',
    effective_date: '2022-03-01',
    due_date: '2026-06-30',
    prepared_by: currentUser?.name || 'CISO / Compliance Lead',
    reviewed_by: 'Internal Compliance Audit Committee',
    approved_by: 'Managing Director (Approved 2026-06-30)',
    page_format: 'A4 Portrait',
    version_number: '1.0',
    version_description: 'ISO 27001 & ADHICS v2 Compliance Standard Policy & Register Control',
    revision_history_logs: [
      {
        id: 'vh-qs-1',
        version_number: '1.0',
        revision_date: '2022-03-01',
        changed_by: currentUser?.name || 'CISO / Compliance Lead',
        change_description: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework',
        approved_by: 'Managing Director',
        approval_date: '2026-06-30'
      }
    ],
    mapped_risk_ids: ['RSK-001', 'RSK-003'],
    mapped_legal_ids: ['LEG-001', 'LEG-002'],
    mapped_employee_ids: ['EMP-101', 'EMP-102'],
    mapped_asset_ids: ['AST-001'],
    mapped_security_zone_ids: ['ZONE-01'],
    mapped_contract_ids: ['CTR-2026-01'],
    mapped_doc_ids: [],
    org_name: 'GLOBAL ENTERPRISE FACILITY & HEALTHCARE GOVERNANCE',
    compliance_framework: 'ISO 27001 & ADHICS v2 Compliance',
    header_badge_text: 'OFFICIAL COMPLIANCE CONTROLLED SPECIFICATION',
    footer_disclaimer: 'CONFIDENTIAL & PROPRIETARY — Issued under Executive Compliance Governance Authority. Unauthorized copying, distribution, or alteration is strictly prohibited.',
    security_marking: 'RESTRICTED — INTERNAL COMPLIANCE AUDIT ONLY',
    show_watermark: true,
    watermark_text: 'RESTRICTED COMPLIANCE COPY'
  });

  // Keep Quick Setup synced with active client metadata
  useEffect(() => {
    if (client) {
      const targetRef = client.doc_ref || 'ZZP-IT-PE-05/2021';
      const targetCls = (client.doc_classification as MasterClassification) || 'RESTRICTED';
      const targetIssue = formatDateDMY(client.doc_issue_date || '01/03/2022');
      const targetApproved = formatDateDMY(client.doc_approved_date || '30/06/2026');
      const targetVer = client.doc_version || '1.0';

      const targetHistory: VersionRecord[] = (client.version_history && client.version_history.length > 0)
        ? client.version_history.map((vh, i) => ({
            id: `vh-qs-${i}`,
            version_number: vh.version,
            revision_date: formatDateDMY(vh.date),
            changed_by: vh.author,
            change_description: vh.changes
          }))
        : [
            {
              id: 'vh-qs-1',
              version_number: '1.0',
              revision_date: '01/03/2022',
              changed_by: currentUser?.name || 'CISO / Compliance Lead',
              change_description: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework',
              approved_by: 'Managing Director',
              approval_date: '30/06/2026'
            }
          ];

      setQuickSetupData(prev => ({
        ...prev,
        doc_ref: targetRef,
        classification: targetCls,
        effective_date: targetIssue,
        review_date: targetApproved,
        due_date: targetApproved,
        version_number: targetVer,
        revision_history_logs: targetHistory,
        security_marking: `${targetCls.toUpperCase()} — INTERNAL COMPLIANCE AUDIT ONLY`,
        watermark_text: `${targetCls.toUpperCase()} COMPLIANCE COPY`
      }));
    }
  }, [client]);

  // State for revision log entry editing inside Quick Setup
  const [quickSetupModuleFilter, setQuickSetupModuleFilter] = useState<'ALL' | 'RISK' | 'LEGAL' | 'EMPLOYEE' | 'ASSET' | 'SECURITY' | 'CONTRACT'>('ALL');
  const [qsLogVersion, setQsLogVersion] = useState('');
  const [qsLogDesc, setQsLogDesc] = useState('');
  const [qsLogAuthor, setQsLogAuthor] = useState('');
  const [qsLogDate, setQsLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [qsEditingLogId, setQsEditingLogId] = useState<string | null>(null);

  const handleAddOrUpdateQsRevisionLog = () => {
    if (!qsLogVersion.trim() || !qsLogDesc.trim()) {
      setToastMsg('Please enter a version number and change description.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    if (qsEditingLogId) {
      setQuickSetupData(prev => ({
        ...prev,
        revision_history_logs: prev.revision_history_logs.map(log =>
          log.id === qsEditingLogId
            ? {
                ...log,
                version_number: qsLogVersion,
                change_description: qsLogDesc,
                changed_by: qsLogAuthor || prev.prepared_by,
                revision_date: qsLogDate
              }
            : log
        )
      }));
      setQsEditingLogId(null);
      setToastMsg('Revision log entry updated!');
    } else {
      const newLog: VersionRecord = {
        id: `vh-qs-${Date.now()}`,
        version_number: qsLogVersion,
        revision_date: qsLogDate,
        changed_by: qsLogAuthor || quickSetupData.prepared_by,
        change_description: qsLogDesc,
        approved_by: quickSetupData.approved_by,
        approval_date: qsLogDate
      };
      setQuickSetupData(prev => ({
        ...prev,
        revision_history_logs: [...prev.revision_history_logs, newLog]
      }));
      setToastMsg('New revision log entry added!');
    }

    setQsLogVersion('');
    setQsLogDesc('');
    setQsLogAuthor('');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleEditQsRevisionLog = (log: VersionRecord) => {
    setQsEditingLogId(log.id);
    setQsLogVersion(log.version_number);
    setQsLogDesc(log.change_description);
    setQsLogAuthor(log.changed_by);
    setQsLogDate(log.revision_date);
  };

  const handleDeleteQsRevisionLog = (logId: string) => {
    setQuickSetupData(prev => ({
      ...prev,
      revision_history_logs: prev.revision_history_logs.filter(l => l.id !== logId)
    }));
    if (qsEditingLogId === logId) {
      setQsEditingLogId(null);
      setQsLogVersion('');
      setQsLogDesc('');
      setQsLogAuthor('');
    }
  };

  const handleSaveQuickSetup = () => {
    if (!quickSetupData.doc_ref || !quickSetupData.doc_name) {
      setToastMsg('Please provide a Document Reference and Document Title.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const newDocId = `qsetup-${Date.now()}`;
    const createdDoc: MasterDocument = {
      id: newDocId,
      client_id: activeClientId,
      document_id: quickSetupData.doc_ref,
      document_number: quickSetupData.doc_ref,
      document_reference: quickSetupData.doc_ref,
      document_name: quickSetupData.doc_name,
      category: quickSetupData.category,
      sub_category: quickSetupData.sub_category,
      department: quickSetupData.department || 'Governance & Compliance',
      owner: quickSetupData.prepared_by,
      version: quickSetupData.version_number,
      version_history: quickSetupData.revision_history_logs,
      classification: quickSetupData.classification,
      status: 'Published',
      prepared_by: quickSetupData.prepared_by,
      reviewed_by: quickSetupData.reviewed_by,
      approved_by: quickSetupData.approved_by,
      issue_date: quickSetupData.effective_date,
      effective_date: quickSetupData.effective_date,
      next_review_date: quickSetupData.review_date,
      due_date: quickSetupData.due_date,
      page_format: quickSetupData.page_format,
      document_location: `Central Repository (A4 ${quickSetupData.page_format === 'A4 Landscape' ? 'Landscape' : 'Portrait'})`,
      current_revision: quickSetupData.version_number,
      source_type: 'DIRECT',
      mapped_risk_ids: quickSetupData.mapped_risk_ids,
      mapped_asset_ids: quickSetupData.mapped_asset_ids,
      mapped_legal_ids: quickSetupData.mapped_legal_ids,
      mapped_employee_ids: quickSetupData.mapped_employee_ids,
      mapped_security_zone_ids: quickSetupData.mapped_security_zone_ids,
      mapped_contract_ids: quickSetupData.mapped_contract_ids,
      mapped_doc_ids: quickSetupData.mapped_doc_ids,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setDirectDocs(prev => [createdDoc, ...prev]);

    setDocMappings(prev => ({
      ...prev,
      [newDocId]: {
        risk_ids: quickSetupData.mapped_risk_ids,
        asset_ids: quickSetupData.mapped_asset_ids,
        legal_ids: quickSetupData.mapped_legal_ids,
        employee_ids: quickSetupData.mapped_employee_ids,
        security_zone_ids: quickSetupData.mapped_security_zone_ids,
        contract_ids: quickSetupData.mapped_contract_ids,
        doc_ids: quickSetupData.mapped_doc_ids
      },
      [quickSetupData.doc_ref]: {
        risk_ids: quickSetupData.mapped_risk_ids,
        asset_ids: quickSetupData.mapped_asset_ids,
        legal_ids: quickSetupData.mapped_legal_ids,
        employee_ids: quickSetupData.mapped_employee_ids,
        security_zone_ids: quickSetupData.mapped_security_zone_ids,
        contract_ids: quickSetupData.mapped_contract_ids,
        doc_ids: quickSetupData.mapped_doc_ids
      }
    }));

    if (logAuditTrail) {
      logAuditTrail('MasterIndexModule', 'QUICK_SETUP_INDEX', {
        doc_ref: quickSetupData.doc_ref,
        doc_name: quickSetupData.doc_name,
        page_format: quickSetupData.page_format,
        connected_registers_count:
          quickSetupData.mapped_risk_ids.length +
          quickSetupData.mapped_legal_ids.length +
          quickSetupData.mapped_employee_ids.length +
          quickSetupData.mapped_asset_ids.length +
          quickSetupData.mapped_security_zone_ids.length +
          quickSetupData.mapped_contract_ids.length
      });
    }

    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        doc_ref: quickSetupData.doc_ref,
        doc_classification: quickSetupData.classification,
        doc_issue_date: quickSetupData.effective_date,
        doc_approved_date: quickSetupData.review_date,
        doc_version: quickSetupData.version_number,
        version_history: quickSetupData.revision_history_logs.map(log => ({
          version: log.version_number,
          date: log.revision_date,
          author: log.changed_by,
          changes: log.change_description
        }))
      });
    }

    setToastMsg(`⚡ Document "${quickSetupData.doc_name}" successfully indexed & connected across 6 system registers!`);
    setTimeout(() => setToastMsg(null), 4000);

    setActiveTab('TABLE');
  };

  // Generate PDF Report for Facility Physical Security Zones & Designated Secure Areas
  const handleGenerateSecurityZonesPDFReport = () => {
    const selectedZoneIds = quickSetupData.mapped_security_zone_ids.length > 0
      ? quickSetupData.mapped_security_zone_ids
      : DEFAULT_SECURITY_ZONES.map(z => z.id);

    const selectedZones = DEFAULT_SECURITY_ZONES.filter(z => selectedZoneIds.includes(z.id));

    const isLandscape = quickSetupData.page_format === 'A4 Landscape';


    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facility Physical Security Zones Report - ${quickSetupData.doc_ref || 'SEC-ZONE-01'}</title>
          <style>
            @page {
              size: A4 ${isLandscape ? 'landscape' : 'portrait'};
              margin: 12mm 12mm 15mm 12mm;
            }
            * {
              box-sizing: border-box !important;
              float: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 11px;
              line-height: 1.45;
              color: #0f172a;
              margin: 0;
              padding: 0;
              background: #ffffff;
              position: relative;
            }

            ${quickSetupData.show_watermark ? `
            .watermark-container {
              position: fixed;
              top: 38%;
              left: 5%;
              width: 90%;
              text-align: center;
              transform: rotate(-28deg);
              font-size: 38px;
              font-weight: 900;
              color: rgba(217, 119, 6, 0.07);
              text-transform: uppercase;
              letter-spacing: 3px;
              pointer-events: none;
              z-index: 0;
              font-family: monospace;
            }
            ` : ''}

            .branding-header-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              border-bottom: 2px solid #334155;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }

            .org-title {
              font-size: 11.5px;
              font-weight: 900;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .framework-tag {
              font-size: 9px;
              font-weight: 700;
              color: #0284c7;
              margin-top: 2px;
            }

            .header-badge {
              display: inline-block;
              padding: 3px 8px;
              background-color: #fef3c7;
              color: #78350f;
              border: 1px solid #f59e0b;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
            }

            .main-header-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              border-bottom: 3px solid #d97706;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }

            .doc-title {
              font-size: 17px;
              font-weight: 900;
              color: #78350f;
              text-transform: uppercase;
              letter-spacing: -0.2px;
              margin: 0 0 4px 0;
            }

            .doc-subtitle {
              font-size: 11.5px;
              font-weight: 700;
              color: #92400e;
              margin: 0;
            }

            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .badge-restricted { background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
            .badge-confidential { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #a855f7; }
            .badge-secret { background-color: #ffe4e6; color: #9f1239; border: 1px solid #f43f5e; }
            .badge-public { background-color: #ccfbf1; color: #115e59; border: 1px solid #14b8a6; }

            table.meta-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              background-color: #fffbeb;
              border: 1px solid #fde68a;
              border-radius: 6px;
              margin-bottom: 14px;
            }
            table.meta-table td {
              padding: 8px 10px;
              vertical-align: top;
              border: 1px solid #fef3c7;
              box-sizing: border-box;
            }
            .meta-label {
              font-size: 8.5px;
              font-weight: 800;
              color: #78350f;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .meta-val {
              font-size: 10.5px;
              font-weight: 700;
              color: #1e293b;
            }

            .section-heading {
              font-size: 11.5px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background-color: #f1f5f9;
              padding: 7px 10px;
              border-left: 4px solid #d97706;
              margin: 14px 0 8px 0;
            }

            table.data-table-fixed {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              margin-bottom: 14px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            table.data-table-fixed th {
              background-color: #1e293b;
              color: #ffffff;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 7px 9px;
              text-align: left;
              border: 1px solid #334155;
              box-sizing: border-box;
            }
            table.data-table-fixed td {
              padding: 7px 9px;
              border: 1px solid #cbd5e1;
              font-size: 10px;
              vertical-align: top;
              word-wrap: break-word;
              overflow-wrap: break-word;
              word-break: break-word;
              box-sizing: border-box;
            }
            table.data-table-fixed tr:nth-child(even) {
              background-color: #f8fafc;
            }

            .signature-cell {
              padding: 10px;
              border: 1px solid #e2e8f0;
              background-color: #f8fafc;
              vertical-align: top;
              box-sizing: border-box;
            }
            .signature-title {
              font-size: 8.5px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .signature-line {
              border-bottom: 1px solid #94a3b8;
              margin-bottom: 4px;
            }
            .signature-name {
              font-weight: 800;
              color: #0f172a;
              font-size: 9.5px;
            }

            .compliance-footer-box {
              margin-top: 18px;
              padding-top: 8px;
              border-top: 2px solid #d97706;
              font-size: 8.5px;
              color: #475569;
              text-align: center;
              page-break-inside: avoid;
            }
            .security-marking-line {
              font-family: monospace;
              font-size: 9.5px;
              font-weight: 900;
              color: #991b1b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .disclaimer-text {
              font-size: 8.5px;
              color: #64748b;
              line-height: 1.35;
            }
          </style>
        </head>
        <body>
          ${quickSetupData.show_watermark ? `
            <div class="watermark-container">${quickSetupData.watermark_text || 'OFFICIAL COMPLIANCE COPY'}</div>
          ` : ''}

          <!-- Header Compliance Branding Bar -->
          <table class="branding-header-table">
            <colgroup>
              <col style="width: 70%;" />
              <col style="width: 30%;" />
            </colgroup>
            <tr>
              <td style="vertical-align: middle;">
                <div class="org-title">${quickSetupData.org_name || 'GLOBAL ENTERPRISE FACILITY & HEALTHCARE GOVERNANCE'}</div>
                <div class="framework-tag">REGULATORY FRAMEWORK: ${quickSetupData.compliance_framework || 'ISO 27001 | OSHAD SF | ADHCIS'}</div>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <span class="header-badge">${quickSetupData.header_badge_text || 'OFFICIAL COMPLIANCE SPECIFICATION'}</span>
              </td>
            </tr>
          </table>

          <!-- Document Main Header -->
          <table class="main-header-table">
            <colgroup>
              <col style="width: 68%;" />
              <col style="width: 32%;" />
            </colgroup>
            <tr>
              <td style="vertical-align: top; padding-right: 10px;">
                <div class="doc-title">Facility Physical Security Zones & Designated Secure Areas</div>
                <div class="doc-subtitle">Official Master Index Compliance Audit & Physical Security Control Report</div>
                <div style="margin-top: 5px; font-size: 9.5px; color: #475569; font-weight: 600;">
                  Document Title: <strong>${quickSetupData.doc_name || 'Physical Access Control & Security Zones SOP'}</strong>
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <span class="badge ${
                  quickSetupData.classification === 'Secret' ? 'badge-secret'
                  : quickSetupData.classification === 'Confidential' ? 'badge-confidential'
                  : quickSetupData.classification === 'Restricted' ? 'badge-restricted'
                  : 'badge-public'
                }">
                  ${quickSetupData.classification}
                </span>
                <div style="font-family: monospace; font-size: 11px; font-weight: 900; color: #1e1b4b; margin-top: 5px;">
                  REF: ${quickSetupData.doc_ref || 'SOP-SEC-2026-01'}
                </div>
                <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
                  Page Layout: ${quickSetupData.page_format}
                </div>
              </td>
            </tr>
          </table>

          <!-- Metadata Summary Table -->
          <table class="meta-table">
            <colgroup>
              <col style="width: 25%;" />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
            </colgroup>
            <tr>
              <td>
                <div class="meta-label">Prepared By</div>
                <div class="meta-val">${quickSetupData.prepared_by || 'Security Officer'}</div>
              </td>
              <td>
                <div class="meta-label">Approved By</div>
                <div class="meta-val">${quickSetupData.approved_by || 'Managing Director'}</div>
              </td>
              <td>
                <div class="meta-label">Effective Date</div>
                <div class="meta-val">${quickSetupData.effective_date}</div>
              </td>
              <td>
                <div class="meta-label">Next Review Date</div>
                <div class="meta-val">${quickSetupData.review_date}</div>
              </td>
            </tr>
          </table>

          <!-- Designated Secure Areas Table -->
          <div class="section-heading">
            1. Designated Physical Security Zones & Security Controls (${selectedZones.length} Areas)
          </div>
          <table class="data-table-fixed">
            <colgroup>
              <col style="width: 14%;" />
              <col style="width: 42%;" />
              <col style="width: 24%;" />
              <col style="width: 20%;" />
            </colgroup>
            <thead>
              <tr>
                <th>Zone ID</th>
                <th>Designated Secure Area & Facility Description</th>
                <th>Access Control & Security Level</th>
                <th>Perimeter Protocol</th>
              </tr>
            </thead>
            <tbody>
              ${selectedZones.map(zone => `
                <tr>
                  <td style="font-family: monospace; font-weight: 800; color: #78350f;">${zone.id}</td>
                  <td>
                    <strong style="color: #0f172a; font-size: 10.5px;">${zone.title}</strong>
                    <div style="font-size: 9px; color: #475569; margin-top: 2px;">
                      Mandatory 24/7 CCTV surveillance, biometric log logging, and escorted visitor policy.
                    </div>
                  </td>
                  <td>
                    <span style="background-color: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 4px; font-weight: 800; font-size: 9px; border: 1px solid #fde68a; display: inline-block;">
                      ${zone.level}
                    </span>
                  </td>
                  <td style="font-size: 9.5px; color: #334155; font-weight: 600;">
                    Biometric / RFID Keycard Entry & Escort Required
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Connected Running System Registers -->
          <div class="section-heading">
            2. Multi-Register Inter-connected Compliance Links
          </div>
          <table class="data-table-fixed">
            <colgroup>
              <col style="width: 28%;" />
              <col style="width: 18%;" />
              <col style="width: 54%;" />
            </colgroup>
            <thead>
              <tr>
                <th>Connected System Register</th>
                <th>Linkage Count</th>
                <th>Mapped System Identifiers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Risk Register Items</strong></td>
                <td><span style="font-weight: 800; color: #6b21a8;">${quickSetupData.mapped_risk_ids.length} linked</span></td>
                <td>${quickSetupData.mapped_risk_ids.length > 0 ? quickSetupData.mapped_risk_ids.join(', ') : 'All facility risk profiles applied'}</td>
              </tr>
              <tr>
                <td><strong>Legal & Statutory Standards</strong></td>
                <td><span style="font-weight: 800; color: #1e40af;">${quickSetupData.mapped_legal_ids.length} linked</span></td>
                <td>${quickSetupData.mapped_legal_ids.length > 0 ? quickSetupData.mapped_legal_ids.join(', ') : 'ISO 27001, OSHAD SF v3.1, ADHCIS v2'}</td>
              </tr>
              <tr>
                <td><strong>Personnel & Security Operators</strong></td>
                <td><span style="font-weight: 800; color: #0369a1;">${quickSetupData.mapped_employee_ids.length} linked</span></td>
                <td>${quickSetupData.mapped_employee_ids.length > 0 ? quickSetupData.mapped_employee_ids.join(', ') : 'Authorized Facility Operations Staff'}</td>
              </tr>
              <tr>
                <td><strong>Hardware & Facility Assets</strong></td>
                <td><span style="font-weight: 800; color: #047857;">${quickSetupData.mapped_asset_ids.length} linked</span></td>
                <td>${quickSetupData.mapped_asset_ids.length > 0 ? quickSetupData.mapped_asset_ids.join(', ') : 'Primary Cloud Servers, Power Backups, SAN Arrays'}</td>
              </tr>
              <tr>
                <td><strong>Agreements & Contracts</strong></td>
                <td><span style="font-weight: 800; color: #be123c;">${quickSetupData.mapped_contract_ids.length} linked</span></td>
                <td>${quickSetupData.mapped_contract_ids.length > 0 ? quickSetupData.mapped_contract_ids.join(', ') : 'Physical Security & Access Control Maintenance MSA'}</td>
              </tr>
            </tbody>
          </table>

          <!-- Document Version Revision History -->
          <div class="section-heading">
            3. Document Version Control & Revision History Log
          </div>
          <table class="data-table-fixed">
            <colgroup>
              <col style="width: 15%;" />
              <col style="width: 20%;" />
              <col style="width: 25%;" />
              <col style="width: 40%;" />
            </colgroup>
            <thead>
              <tr>
                <th>Version</th>
                <th>Revision Date</th>
                <th>Author / Modified By</th>
                <th>Description of Change</th>
              </tr>
            </thead>
            <tbody>
              ${quickSetupData.revision_history_logs.length > 0 ? quickSetupData.revision_history_logs.map(log => `
                <tr>
                  <td style="font-family: monospace; font-weight: 800; color: #1e40af;">${log.version_number}</td>
                  <td>${log.revision_date}</td>
                  <td>${log.changed_by}</td>
                  <td>${log.change_description}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td style="font-family: monospace; font-weight: 800; color: #1e40af;">${quickSetupData.version_number}</td>
                  <td>${quickSetupData.effective_date}</td>
                  <td>${quickSetupData.prepared_by}</td>
                  <td>Initial Master Index Registration & Physical Security Zone Mapping</td>
                </tr>
              `}
            </tbody>
          </table>

          <!-- Sign-off Block -->
          <table class="data-table-fixed" style="margin-top: 20px; page-break-inside: avoid;">
            <colgroup>
              <col style="width: 33.33%;" />
              <col style="width: 33.33%;" />
              <col style="width: 33.33%;" />
            </colgroup>
            <tbody>
              <tr>
                <td class="signature-cell">
                  <div class="signature-title">Prepared By</div>
                  <div class="signature-line"></div>
                  <div class="signature-name">${quickSetupData.prepared_by || 'Security Officer'}</div>
                  <div style="font-size: 8px; color: #64748b;">Date: ${quickSetupData.effective_date}</div>
                </td>
                <td class="signature-cell">
                  <div class="signature-title">Reviewed By</div>
                  <div class="signature-line"></div>
                  <div class="signature-name">${quickSetupData.reviewed_by || 'Compliance Lead'}</div>
                  <div style="font-size: 8px; color: #64748b;">Date: ${quickSetupData.effective_date}</div>
                </td>
                <td class="signature-cell">
                  <div class="signature-title">Approved By</div>
                  <div class="signature-line"></div>
                  <div class="signature-name">${quickSetupData.approved_by || 'Managing Director'}</div>
                  <div style="font-size: 8px; color: #64748b;">Date: ${quickSetupData.effective_date}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Page Footer Compliance Branding Block -->
          <div class="compliance-footer-box">
            <div class="security-marking-line">${quickSetupData.security_marking || 'STRICTLY CONFIDENTIAL — INTERNAL COMPLIANCE AUDIT ONLY'}</div>
            <div class="disclaimer-text">${quickSetupData.footer_disclaimer || 'CONFIDENTIAL & PROPRIETARY — Issued by Executive Compliance Authority.'}</div>
            <div style="margin-top: 4px; font-size: 8px; color: #94a3b8; font-family: monospace;">
              Master Index Ref: ${quickSetupData.doc_ref || 'REF-001'} | System Timestamp: ${formatDateTimeDMY(new Date())} | Controlled Compliance Record
            </div>
          </div>
        </body>
      </html>
    `;

    printHtmlInHiddenIframe(htmlContent);
  };


  // Cross-Connect / Risk Register Document Mappings saved in Local Storage
  const [docMappings, setDocMappings] = useState<Record<string, {
    risk_ids: string[];
    asset_ids?: string[];
    incident_ids?: string[];
    doc_ids?: string[];
    legal_ids?: string[];
    employee_ids?: string[];
    security_zone_ids?: string[];
    contract_ids?: string[];
  }>>(() => {
    try {
      const saved = localStorage.getItem('sh_master_doc_mappings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sh_master_doc_mappings from localStorage', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('sh_master_doc_mappings', JSON.stringify(docMappings));
    } catch (e) {
      console.warn('Failed to save sh_master_doc_mappings to localStorage', e);
    }
  }, [docMappings]);

  // Deleted Master Document IDs set for persistent permanent removal
  const [deletedDocIds, setDeletedDocIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sh_deleted_master_doc_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sh_deleted_master_doc_ids from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sh_deleted_master_doc_ids', JSON.stringify(deletedDocIds));
    } catch (e) {
      console.warn('Failed to save sh_deleted_master_doc_ids to localStorage', e);
    }
  }, [deletedDocIds]);

  // Direct Master Documents saved in Local Storage
  const [directDocs, setDirectDocs] = useState<MasterDocument[]>(() => {
    try {
      const saved = localStorage.getItem('sh_master_index_docs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sh_master_index_docs from localStorage', e);
    }
    return [];
  });

  // Save direct Master Documents to local storage
  useEffect(() => {
    try {
      localStorage.setItem('sh_master_index_docs', JSON.stringify(directDocs));
    } catch (e) {
      console.warn('Failed to save sh_master_index_docs', e);
    }
  }, [directDocs]);

  // Combined Master Index - Dynamically synthesized across all platform modules
  const allMasterDocuments = useMemo<MasterDocument[]>(() => {
    const list: MasterDocument[] = [];

    // 1. Convert Policies
    policies
      .filter(p => p.client_id === activeClientId)
      .forEach(p => {
        list.push({
          id: `pol-${p.id}`,
          client_id: p.client_id,
          document_id: p.policy_no || `POL-${p.id}`,
          document_number: p.policy_no || `POL-${p.id}`,
          document_name: p.policy_name,
          category: (p.document_type === 'Procedure' ? 'Procedures' : 'Policies') as DocumentCategoryType,
          sub_category: p.category || (p as any).domain || 'Policy Framework',
          department: p.department || 'Quality & Compliance',
          owner: p.prepared_by_name || 'Compliance Officer',
          version: p.version || 'v1.0',
          version_history: [
            {
              id: `v1-${p.id}`,
              version_number: p.version || 'v1.0',
              revision_date: p.issue_date || p.review_date || new Date().toISOString().split('T')[0],
              changed_by: p.prepared_by_name || 'System Admin',
              change_description: 'Initial Policy Authorization & Publication'
            }
          ],
          classification: (p.classification || 'Confidential') as MasterClassification,
          status: (p.status === 'APPROVED' ? 'Published' : 'Draft') as MasterDocStatus,
          prepared_by: p.prepared_by_name || 'Compliance Officer',
          reviewed_by: p.reviewed_by_name || 'Senior Consultant',
          approved_by: p.approved_by_name || 'Chief Medical Director',
          issue_date: p.issue_date || p.created_at?.split('T')[0] || '2026-01-01',
          effective_date: p.issue_date || '2026-01-01',
          next_review_date: p.next_due_date || p.review_date || '2027-01-01',
          approval_date: p.approval_date || p.issue_date || '2026-01-01',
          document_location: 'Policy Vault / Cloud Repository',
          current_revision: p.version || '1.0',
          change_summary: p.policy_statement ? p.policy_statement.slice(0, 100) + '...' : 'Standard Regulatory Policy Statement',
          remarks: p.scope || 'Applies to all organization departments',
          source_type: 'POLICY',
          source_id: p.id,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

    // 2. Convert Compliance Forms
    forms
      .filter(f => f.client_id === activeClientId)
      .forEach(f => {
        list.push({
          id: `frm-${f.id}`,
          client_id: f.client_id,
          document_id: f.doc_ref || `FORM-${f.id}`,
          document_number: f.doc_ref || `FORM-${f.id}`,
          document_name: f.form_name,
          category: 'Forms',
          sub_category: f.category || 'Compliance Form',
          department: 'HR & Administration',
          owner: f.prepared_by || 'HR Specialist',
          version: f.version || 'v1.0',
          version_history: [
            {
              id: `v1-frm-${f.id}`,
              version_number: f.version || 'v1.0',
              revision_date: f.issue_date || new Date().toISOString().split('T')[0],
              changed_by: f.prepared_by || 'HR Admin',
              change_description: 'Standard Electronic Form Template Release'
            }
          ],
          classification: (f.classification as MasterClassification) || 'Confidential',
          status: (f.status === 'ACTIVE' ? 'Published' : 'Draft') as MasterDocStatus,
          prepared_by: f.prepared_by || 'HR Compliance Team',
          reviewed_by: 'Quality Lead',
          approved_by: f.approved_by || 'Managing Director',
          issue_date: f.issue_date || '2026-01-01',
          effective_date: f.issue_date || '2026-01-01',
          next_review_date: f.expiry_date || f.review_date || '2027-01-01',
          approval_date: f.issue_date || '2026-01-01',
          document_location: 'Electronic Forms Portal',
          sample_doc_name: f.sample_doc_name,
          sample_doc_url: f.sample_doc_url,
          current_revision: f.version || '1.0',
          change_summary: f.description || 'Electronic Form Template',
          remarks: 'Integrated from Compliance Forms Module',
          source_type: 'FORM',
          source_id: f.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

    // 3. Convert Repository Documents
    documents
      .filter(d => d.client_id === activeClientId)
      .forEach(d => {
        list.push({
          id: `doc-${d.id}`,
          client_id: d.client_id,
          document_id: d.document_code || `DOC-${d.id}`,
          document_number: d.document_code || `DOC-${d.id}`,
          document_name: d.document_name,
          category: (d.doc_type_category === 'Form' ? 'Forms' : d.doc_type_category === 'Procedure' ? 'Procedures' : 'Policies') as DocumentCategoryType,
          sub_category: d.document_type || 'Uploaded Vault File',
          department: d.department || 'General',
          owner: d.uploaded_by_name || 'Document Controller',
          version: d.version || 'v1.0',
          version_history: [
            {
              id: `v1-doc-${d.id}`,
              version_number: d.version || 'v1.0',
              revision_date: d.issue_date || d.uploaded_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              changed_by: d.uploaded_by_name || 'Admin',
              change_description: 'Repository Document Import'
            }
          ],
          classification: (d.classification as MasterClassification) || 'Internal',
          status: (d.approval_status === 'APPROVED' ? 'Published' : d.approval_status === 'PENDING_APPROVAL' ? 'Under Review' : 'Draft') as MasterDocStatus,
          prepared_by: d.prepared_by_name || d.uploaded_by_name || 'Author',
          reviewed_by: d.reviewed_by_name || 'Reviewer',
          approved_by: d.approved_by_name || 'Approver',
          issue_date: d.issue_date || '2026-01-01',
          effective_date: d.issue_date || '2026-01-01',
          next_review_date: d.next_due_date || d.expiry_date || '2027-01-01',
          approval_date: d.approval_date || '2026-01-01',
          document_location: d.storage_path || 'Document Vault Storage',
          file_attachment_name: d.document_name,
          file_attachment_url: d.storage_path,
          current_revision: d.version || '1.0',
          change_summary: 'Centralized Repository Document',
          remarks: 'Stored in Document Repository',
          source_type: 'REPOSITORY',
          source_id: d.id,
          created_at: d.uploaded_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

    // 4. Synthesize System Registers (Risk Register, Asset Register, Incident Register, Secure Areas Register, Audit Register, Committee Contacts Register, CAPA Register)
    
    // 4.1 Organizational Risk Register
    list.push({
      id: `reg-risk-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-RSK-001',
      document_number: client?.doc_ref || 'ZZP-IT-PE-05/2021',
      document_name: 'Organizational Risk Register',
      category: 'Registers',
      sub_category: 'Risk Management',
      department: 'Risk & Governance',
      owner: client?.doc_owner || client?.owner_name || 'Risk Officer',
      version: client?.doc_version || '1.0',
      version_history: (client?.version_history && client.version_history.length > 0)
        ? client.version_history.map((vh, i) => ({
            id: `vh-${i}`,
            version_number: vh.version,
            revision_date: vh.date,
            changed_by: vh.author,
            change_description: vh.changes
          }))
        : [
            {
              id: 'v10-risk-reg',
              version_number: '1.0',
              revision_date: '01/03/2022',
              changed_by: 'Managing Director / IT Lead',
              change_description: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework'
            }
          ],
      classification: (client?.doc_classification as any) || 'RESTRICTED',
      status: 'Published',
      prepared_by: client?.doc_owner || client?.owner_name || 'Risk Lead',
      reviewed_by: 'Audit Committee',
      approved_by: client?.doc_approved_by || 'Managing Director',
      issue_date: formatDateDMY(client?.doc_issue_date || '01/03/2022'),
      effective_date: formatDateDMY(client?.doc_issue_date || '01/03/2022'),
      next_review_date: formatDateDMY(client?.doc_approved_date || '30/06/2026'),
      approval_date: formatDateDMY(client?.doc_approved_date || '30/06/2026'),
      document_location: 'Risk Management Engine',
      current_revision: client?.doc_version || '1.0',
      change_summary: `Tracks ${risks.filter(r => r.client_id === activeClientId).length} identified corporate and clinical risks.`,
      remarks: 'Live Master Risk Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.2 IT & Biomedical Asset Inventory Register
    list.push({
      id: `reg-ast-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-AST-001',
      document_number: 'REG-AST-001',
      document_name: 'IT & Biomedical Asset Inventory Register',
      category: 'Registers',
      sub_category: 'Asset Management',
      department: 'IT & Facilities',
      owner: 'IT Director / Asset Manager',
      version: 'v1.4',
      version_history: [
        {
          id: 'v1-ast-reg',
          version_number: 'v1.4',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: 'IT Manager',
          change_description: 'Asset Lifecycle & Preventive Maintenance Register Update'
        }
      ],
      classification: 'Confidential',
      status: 'Published',
      prepared_by: 'Asset Custodian',
      reviewed_by: 'IT Manager',
      approved_by: 'Operations Director',
      issue_date: '2026-01-01',
      effective_date: '2026-01-01',
      next_review_date: '2026-12-31',
      approval_date: '2026-01-01',
      document_location: 'Asset Inventory System',
      current_revision: '1.4',
      change_summary: `Tracks ${assets.filter(a => a.client_id === activeClientId).length} critical IT & medical hardware assets.`,
      remarks: 'Live Master Asset Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.3 Security Incident & Data Breach Log Register
    list.push({
      id: `reg-inc-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-INC-001',
      document_number: 'REG-INC-001',
      document_name: 'Security Incident & Data Breach Log Register',
      category: 'Registers',
      sub_category: 'Incident Management',
      department: 'Information Security',
      owner: 'CISO / Security Incident Response Team',
      version: 'v1.2',
      version_history: [
        {
          id: 'v1-inc-reg',
          version_number: 'v1.2',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: 'Security Incident Lead',
          change_description: 'Breach Incident Log & Resolution Records'
        }
      ],
      classification: 'Restricted',
      status: 'Published',
      prepared_by: 'Incident Officer',
      reviewed_by: 'CISO',
      approved_by: 'Board Director',
      issue_date: '2026-01-01',
      effective_date: '2026-01-01',
      next_review_date: '2026-12-31',
      approval_date: '2026-01-01',
      document_location: 'Breach Incident Desk',
      current_revision: '1.2',
      change_summary: `Records ${incidents.filter(i => i.client_id === activeClientId).length} breach incidents and root causes.`,
      remarks: 'Confidential Security Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.4 Designated Secure Areas Register
    list.push({
      id: `reg-sec-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-SEC-001',
      document_number: 'REG-SEC-001',
      document_name: 'Designated Secure Areas Register',
      category: 'Registers',
      sub_category: 'Physical Security',
      department: 'Facilities & Security',
      owner: 'Facility Security Lead',
      version: 'v1.0',
      version_history: [
        {
          id: 'v1-sec-reg',
          version_number: 'v1.0',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: 'Security Lead',
          change_description: 'Physical & Environmental Security Area Controls'
        }
      ],
      classification: 'Restricted',
      status: 'Published',
      prepared_by: 'Facility Security Manager',
      reviewed_by: 'CISO',
      approved_by: 'Operations Director',
      issue_date: '2026-01-01',
      effective_date: '2026-01-01',
      next_review_date: '2026-12-31',
      approval_date: '2026-01-01',
      document_location: 'Physical Security Vault',
      current_revision: '1.0',
      change_summary: 'Tracks 4 designated physical security zones (Server Room, Archive Room, EHR Workstations, Lobby).',
      remarks: 'Physical & Environmental Security Boundary Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.5 Internal & External Audit Findings Register (NCR)
    list.push({
      id: `reg-aud-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-AUD-001',
      document_number: 'REG-AUD-001',
      document_name: 'Internal & External Audit Findings Register (NCR)',
      category: 'Registers',
      sub_category: 'Audit & Governance',
      department: 'Quality Assurance',
      owner: 'Lead Auditor',
      version: 'v1.0',
      version_history: [
        {
          id: 'v1-aud-reg',
          version_number: 'v1.0',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: 'Lead Auditor',
          change_description: 'Regulatory Audit Non-Compliance Reports Log'
        }
      ],
      classification: 'Confidential',
      status: 'Published',
      prepared_by: 'Audit Lead',
      reviewed_by: 'Quality Director',
      approved_by: 'CEO',
      issue_date: '2026-01-01',
      effective_date: '2026-01-01',
      next_review_date: '2026-12-31',
      approval_date: '2026-01-01',
      document_location: 'Audit Findings Hub',
      current_revision: '1.0',
      change_summary: `Tracks ${audits.filter(au => au.client_id === activeClientId).length} regulatory audit reports.`,
      remarks: 'Master Audit Trail Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.6 Risk Review Committee & Authorized Personnel Contacts Register
    list.push({
      id: `reg-rrc-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-RRC-001',
      document_number: 'REG-RRC-001',
      document_name: 'Risk Review Committee / Authorized Personnel Contacts Register',
      category: 'Registers',
      main_category: 'Facility Governance',
      sub_category: 'Authorized Personnel Contacts',
      department: 'Quality / Administration',
      owner: client?.owner_name || 'Risk Review Committee',
      version: 'V1.0',
      classification: 'Confidential',
      status: 'Published',
      prepared_by: client?.auth_representative?.name || 'Authorized Representative',
      reviewed_by: client?.clinic_manager?.name || 'Clinic Manager',
      approved_by: client?.medical_director?.name || client?.owner_name || 'Managing Director',
      issue_date: '2025-01-01',
      effective_date: client?.license_expiry || '2026-01-01',
      revision_date: new Date().toISOString().split('T')[0],
      approval_date: '2026-01-01',
      next_review_date: '2027-01-01',
      review_frequency: 'Annually or upon regulatory change',
      retention_period: 'As per UAE legal requirements',
      document_location: 'Facility Governance Hub',
      current_revision: '1.0',
      change_summary: `Auth Rep: ${client?.auth_representative?.name || 'N/A'}, Clinic Mgr: ${client?.clinic_manager?.name || 'N/A'}, Med Dir: ${client?.medical_director?.name || 'N/A'}, IT Admin: ${client?.it_manager?.name || 'N/A'}, HR Mgr: ${client?.hr_manager?.name || 'N/A'}`,
      remarks: 'Live Facility Governance & Authorized Personnel Contacts Register',
      source_type: 'FACILITY_CONTACTS',
      version_history: [
        {
          id: 'v1-rrc-reg',
          version_number: 'V1.0',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: client?.auth_representative?.name || 'Quality Lead',
          change_description: 'Risk Review Committee & Key Authorized Contacts Registry'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 4.7 CAPA Register
    list.push({
      id: `reg-capa-${activeClientId}`,
      client_id: activeClientId,
      document_id: 'REG-CAPA-001',
      document_number: 'REG-CAPA-001',
      document_name: 'Corrective & Preventive Action (CAPA) Log Register',
      category: 'Registers',
      sub_category: 'Corrective Actions',
      department: 'Quality Assurance',
      owner: 'CAPA Manager',
      version: 'v1.1',
      version_history: [
        {
          id: 'v1-capa-reg',
          version_number: 'v1.1',
          revision_date: new Date().toISOString().split('T')[0],
          changed_by: 'Quality Manager',
          change_description: 'Remediation Action Tracking Updates'
        }
      ],
      classification: 'Internal',
      status: 'Published',
      prepared_by: 'CAPA Coordinator',
      reviewed_by: 'Quality Lead',
      approved_by: 'Operations Manager',
      issue_date: '2026-01-01',
      effective_date: '2026-01-01',
      next_review_date: '2026-12-31',
      approval_date: '2026-01-01',
      document_location: 'CAPA Tracking Hub',
      current_revision: '1.1',
      change_summary: `Tracks ${actions.filter(ca => ca.client_id === activeClientId).length} corrective action remediation plans.`,
      remarks: 'Master CAPA Register',
      source_type: 'REGISTER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Ensure Procedure for Control of Documentation (DOC-QMS-001) is present
    const hasQmsDoc = list.some(d => d.document_id === 'DOC-QMS-001' || d.document_number === 'DOC-QMS-001');
    if (!hasQmsDoc) {
      list.push({
        id: `doc-qms-001-${activeClientId}`,
        client_id: activeClientId,
        document_id: 'DOC-QMS-001',
        document_number: 'DOC-QMS-001',
        document_name: 'Procedure for Control of Documentation',
        category: 'Procedures',
        main_category: 'Human Resources',
        sub_category: 'Document Control',
        department: 'Quality / Administration',
        owner: 'Quality Manager',
        version: 'V1.0',
        classification: 'Confidential',
        status: 'Published',
        prepared_by: 'Quality Manager',
        reviewed_by: 'Senior Compliance Lead',
        approved_by: 'Managing Director',
        issue_date: '15-01-2025',
        effective_date: '15-01-2025',
        revision_date: '15-01-2025',
        approval_date: '15-01-2025',
        next_review_date: '15-01-2026',
        review_frequency: 'Annually or upon regulatory change',
        retention_period: 'As per UAE legal requirements',
        document_location: 'Policy & Master Index Vault',
        current_revision: 'V1.0',
        change_summary: 'Standardized procedure for creation, review, approval, distribution, control, and retention of organizational documents.',
        remarks: 'Mandatory Governance Procedure under Quality / HR',
        source_type: 'DIRECT',
        version_history: [
          {
            id: 'v1-qms-001',
            version_number: 'V1.0',
            revision_date: '15-01-2025',
            changed_by: 'Quality Manager',
            change_description: 'Initial Approval & Deployment of Document Control Procedure'
          }
        ],
        created_at: '2025-01-15T08:00:00Z',
        updated_at: new Date().toISOString()
      });
    }

    // Merge directDocs overrides into list
    const overrideMap = new Map<string, MasterDocument>();
    directDocs.filter(d => d.client_id === activeClientId).forEach(d => {
      if (d.id) overrideMap.set(d.id, d);
      if (d.document_id) overrideMap.set(d.document_id, d);
      if (d.source_id) overrideMap.set(d.source_id, d);
    });

    const mergedList: MasterDocument[] = [];
    const seenKeys = new Set<string>();

    list.forEach(item => {
      const primaryKey = item.id || item.document_id;
      if (seenKeys.has(primaryKey)) return;

      if (item.id) seenKeys.add(item.id);
      if (item.document_id) seenKeys.add(item.document_id);
      if (item.document_number) seenKeys.add(item.document_number);
      if (item.source_id) seenKeys.add(item.source_id);

      const override = overrideMap.get(item.id) || overrideMap.get(item.document_id) || (item.source_id ? overrideMap.get(item.source_id) : undefined);
      if (override) {
        mergedList.push({ ...item, ...override });
      } else {
        mergedList.push(item);
      }
    });

    // Add any brand new directDocs not present in synthesized list
    directDocs.filter(d => d.client_id === activeClientId).forEach(d => {
      const isAlreadySeen = (d.id && seenKeys.has(d.id)) ||
                            (d.document_id && seenKeys.has(d.document_id)) ||
                            (d.document_number && seenKeys.has(d.document_number)) ||
                            (d.source_id && seenKeys.has(d.source_id));
      if (!isAlreadySeen) {
        if (d.id) seenKeys.add(d.id);
        if (d.document_id) seenKeys.add(d.document_id);
        if (d.document_number) seenKeys.add(d.document_number);
        if (d.source_id) seenKeys.add(d.source_id);
        mergedList.push(d);
      }
    });

    const finalFilteredList = mergedList.filter(d => 
      !deletedDocIds.includes(d.id) && 
      !deletedDocIds.includes(d.document_id) && 
      !deletedDocIds.includes(d.document_number)
    );

    return finalFilteredList.map(doc => {
      const customMapping = docMappings[doc.id] || docMappings[doc.document_id] || docMappings[doc.document_number];
      let mappedRiskIds = customMapping?.risk_ids;
      let mappedAssetIds = customMapping?.asset_ids;
      let mappedIncidentIds = customMapping?.incident_ids;
      let mappedDocIds = customMapping?.doc_ids;

      if (!customMapping) {
        if (doc.document_id === 'REG-RSK-001' || doc.sub_category === 'Risk Management') {
          mappedRiskIds = risks.filter(r => r.client_id === activeClientId).map(r => r.id);
        } else {
          const docTitleLower = (doc.document_name + ' ' + (doc.sub_category || '')).toLowerCase();
          const matched = risks.filter(r => {
            if (r.client_id !== activeClientId) return false;
            const rText = (r.risk_title + ' ' + (r.asset_name || '') + ' ' + (r.domain || '') + ' ' + (r.threat || '')).toLowerCase();
            if (docTitleLower.includes('security') && (rText.includes('security') || rText.includes('cyber') || rText.includes('unauthorized') || rText.includes('data'))) return true;
            if ((docTitleLower.includes('disaster') || docTitleLower.includes('continuity') || docTitleLower.includes('bcp')) && (rText.includes('disaster') || rText.includes('outage') || rText.includes('backup') || rText.includes('failure'))) return true;
            if ((docTitleLower.includes('asset') || docTitleLower.includes('inventory') || docTitleLower.includes('hardware')) && (rText.includes('asset') || rText.includes('hardware') || rText.includes('device'))) return true;
            if ((docTitleLower.includes('incident') || docTitleLower.includes('breach')) && (rText.includes('incident') || rText.includes('breach'))) return true;
            if ((docTitleLower.includes('access') || docTitleLower.includes('password')) && (rText.includes('access') || rText.includes('credential') || rText.includes('password'))) return true;
            return false;
          });
          mappedRiskIds = matched.map(r => r.id);
        }
      }

      return {
        ...doc,
        mapped_risk_ids: mappedRiskIds || [],
        mapped_asset_ids: mappedAssetIds || [],
        mapped_incident_ids: mappedIncidentIds || [],
        mapped_doc_ids: mappedDocIds || []
      };
    });
  }, [policies, forms, documents, risks, assets, incidents, audits, actions, directDocs, activeClientId, client, deletedDocIds, docMappings]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOwner, setSelectedOwner] = useState<string>('All');
  const [showOnlyReviewDue, setShowOnlyReviewDue] = useState<boolean>(false);
  const [showOnlyExpired, setShowOnlyExpired] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Active Modals state
  const [viewingDoc, setViewingDoc] = useState<MasterDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<MasterDocument | null>(null);
  const [bumpVersionDoc, setBumpVersionDoc] = useState<MasterDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<MasterDocument | null>(null);
  const [workflowDoc, setWorkflowDoc] = useState<MasterDocument | null>(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState<boolean>(false);

  // Cross-Connect / Risk Register Mapping Editor Modal state
  const [mappingDoc, setMappingDoc] = useState<MasterDocument | null>(null);
  const [mappingTab, setMappingTab] = useState<'DOCS' | 'RISKS' | 'ASSETS' | 'INCIDENTS'>('DOCS');
  const [mappingSearchTerm, setMappingSearchTerm] = useState<string>('');
  const [selectedRiskIdsForMapping, setSelectedRiskIdsForMapping] = useState<string[]>([]);
  const [selectedAssetIdsForMapping, setSelectedAssetIdsForMapping] = useState<string[]>([]);
  const [selectedIncidentIdsForMapping, setSelectedIncidentIdsForMapping] = useState<string[]>([]);
  const [selectedDocIdsForMapping, setSelectedDocIdsForMapping] = useState<string[]>([]);

  // Cross-Connect Matrix Tab filter state
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>('All');
  const [matrixMappingFilter, setMatrixMappingFilter] = useState<'All' | 'Mapped' | 'Unmapped'>('All');
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  // Open mapping modal for a document
  const openMappingModal = (doc: MasterDocument) => {
    setMappingDoc(doc);
    setMappingTab('DOCS');
    setMappingSearchTerm('');
    setSelectedRiskIdsForMapping(doc.mapped_risk_ids || []);
    setSelectedAssetIdsForMapping(doc.mapped_asset_ids || []);
    setSelectedIncidentIdsForMapping(doc.mapped_incident_ids || []);
    setSelectedDocIdsForMapping(doc.mapped_doc_ids || []);
  };

  // Save mapping changes
  const handleSaveDocMapping = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mappingDoc) return;

    setDocMappings(prev => ({
      ...prev,
      [mappingDoc.id]: {
        risk_ids: selectedRiskIdsForMapping,
        asset_ids: selectedAssetIdsForMapping,
        incident_ids: selectedIncidentIdsForMapping,
        doc_ids: selectedDocIdsForMapping
      },
      [mappingDoc.document_id]: {
        risk_ids: selectedRiskIdsForMapping,
        asset_ids: selectedAssetIdsForMapping,
        incident_ids: selectedIncidentIdsForMapping,
        doc_ids: selectedDocIdsForMapping
      }
    }));

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'UPDATED DOCUMENT CROSS-CONNECT MAPPING', {
        doc_id: mappingDoc.document_id,
        doc_name: mappingDoc.document_name,
        mapped_docs_count: selectedDocIdsForMapping.length,
        mapped_risks_count: selectedRiskIdsForMapping.length,
        mapped_assets_count: selectedAssetIdsForMapping.length
      });
    }

    showToast(`Saved cross-connects for "${mappingDoc.document_name}" (${selectedDocIdsForMapping.length} Docs, ${selectedRiskIdsForMapping.length} Risks linked)`);
    setMappingDoc(null);
  };

  // New Document Form State
  const [newDocData, setNewDocData] = useState<Partial<MasterDocument>>({
    document_id: 'DOC-REF-1001',
    document_number: 'REF-1001',
    document_reference: 'REF-1001',
    document_name: '',
    category: 'Policies',
    sub_category: 'Standard Operating Procedure',
    department: 'Quality & Compliance',
    owner: currentUser?.full_name || 'Document Controller',
    version: 'v1.0',
    classification: 'Confidential',
    status: 'Approved',
    prepared_by: currentUser?.full_name || 'Compliance Lead',
    reviewed_by: 'Senior Risk Lead',
    approved_by: 'Managing Director',
    issue_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    approval_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    document_location: 'Master Document Vault',
    current_revision: '1.0',
    change_summary: 'Initial Master Document Registration',
    remarks: 'Authorized Master Document Record',
    page_format: 'A4 Portrait'
  });

  // Registration Mapping States (for Register New Master Document)
  const [regDocMappedDocIds, setRegDocMappedDocIds] = useState<string[]>([]);
  const [regDocMappedRiskIds, setRegDocMappedRiskIds] = useState<string[]>([]);
  const [regDocMappedAssetIds, setRegDocMappedAssetIds] = useState<string[]>([]);
  const [regDocMappedModules, setRegDocMappedModules] = useState<string[]>([
    'Risk Register',
    'Legal Registry & Compliance',
    'Employee & Operator Management',
    'Assets Inventory',
    'Facility Physical Security Zones & Designated Secure Areas',
    'Agreements & Contracts'
  ]);
  const [regMappingSearch, setRegMappingSearch] = useState<string>('');
  const [regMappingTab, setRegMappingTab] = useState<'MODULES' | 'DOCS' | 'RISKS' | 'ASSETS'>('MODULES');

  const openAddDocModal = () => {
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setNewDocData({
      document_id: `DOC-REF-${nextNum}`,
      document_number: `REF-${nextNum}`,
      document_reference: `REF-${nextNum}`,
      document_name: '',
      category: 'Policies',
      sub_category: 'Standard Operating Procedure',
      department: 'Quality & Compliance',
      owner: currentUser?.full_name || 'Document Controller',
      version: 'v1.0',
      classification: 'Confidential',
      status: 'Approved',
      prepared_by: currentUser?.full_name || 'Compliance Lead',
      reviewed_by: 'Senior Risk Lead',
      approved_by: 'Managing Director',
      issue_date: new Date().toISOString().split('T')[0],
      effective_date: new Date().toISOString().split('T')[0],
      approval_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      document_location: 'Master Document Vault',
      current_revision: '1.0',
      change_summary: 'Initial Master Document Registration',
      remarks: 'Authorized Master Document Record',
      page_format: 'A4 Portrait'
    });
    setRegDocMappedDocIds([]);
    setRegDocMappedRiskIds([]);
    setRegDocMappedAssetIds([]);
    setRegDocMappedModules([
      'Risk Register',
      'Legal Registry & Compliance',
      'Employee & Operator Management',
      'Assets Inventory',
      'Facility Physical Security Zones & Designated Secure Areas',
      'Agreements & Contracts'
    ]);
    setRegMappingSearch('');
    setRegMappingTab('MODULES');
    setIsAddDocOpen(true);
  };

  const handleClearAllDocuments = () => {
    if (window.confirm('Are you sure you want to remove ALL existing master documents? This will clear the index so you can create new custom documents.')) {
      const allIds = allMasterDocuments.flatMap(d => [d.id, d.document_id, d.document_number].filter(Boolean) as string[]);
      setDeletedDocIds(prev => Array.from(new Set([...prev, ...allIds])));
      setDirectDocs([]);
      showToast('All existing master documents have been removed. You can now create new documents.');
    }
  };

  // Version bump form state
  const [bumpData, setBumpData] = useState({
    new_version: '',
    revision_date: new Date().toISOString().split('T')[0],
    change_description: '',
    changed_by: currentUser?.full_name || 'Document Controller',
    file_name: '',
    mapped_risk_ids: [] as string[],
    mapped_asset_ids: [] as string[],
    mapped_doc_ids: [] as string[]
  });
  const [bumpMappingTab, setBumpMappingTab] = useState<'RISKS' | 'ASSETS' | 'DOCS'>('RISKS');
  const [bumpMappingSearch, setBumpMappingSearch] = useState<string>('');

  const openBumpModal = (doc: MasterDocument) => {
    setBumpVersionDoc(doc);
    setBumpData({
      new_version: doc.version ? `v${(parseFloat(doc.version.replace(/[^0-9.]/g, '')) + 0.1).toFixed(1)}` : 'v1.1',
      revision_date: new Date().toISOString().split('T')[0],
      change_description: '',
      changed_by: currentUser?.full_name || 'Document Controller',
      file_name: doc.sample_doc_name || '',
      mapped_risk_ids: doc.mapped_risk_ids || [],
      mapped_asset_ids: doc.mapped_asset_ids || [],
      mapped_doc_ids: doc.mapped_doc_ids || []
    });
    setBumpMappingSearch('');
    setBumpMappingTab('RISKS');
  };

  // Version Record Editor Modal State
  const [editingVersionDoc, setEditingVersionDoc] = useState<MasterDocument | null>(null);
  const [editingVersionRecord, setEditingVersionRecord] = useState<VersionRecord | null>(null);
  const [editVersionData, setEditVersionData] = useState({
    version_number: '',
    revision_date: '',
    changed_by: '',
    change_description: '',
    file_name: '',
    mapped_risk_ids: [] as string[],
    mapped_asset_ids: [] as string[],
    mapped_doc_ids: [] as string[]
  });
  const [editVerMappingTab, setEditVerMappingTab] = useState<'RISKS' | 'ASSETS' | 'DOCS'>('RISKS');
  const [editVerMappingSearch, setEditVerMappingSearch] = useState<string>('');

  const openEditVersionModal = (doc: MasterDocument, record: VersionRecord) => {
    setEditingVersionDoc(doc);
    setEditingVersionRecord(record);
    setEditVersionData({
      version_number: record.version_number || 'v1.0',
      revision_date: record.revision_date || new Date().toISOString().split('T')[0],
      changed_by: record.changed_by || currentUser?.full_name || 'Document Controller',
      change_description: record.change_description || '',
      file_name: record.file_name || '',
      mapped_risk_ids: record.mapped_risk_ids || doc.mapped_risk_ids || [],
      mapped_asset_ids: record.mapped_asset_ids || doc.mapped_asset_ids || [],
      mapped_doc_ids: record.mapped_doc_ids || doc.mapped_doc_ids || []
    });
    setEditVerMappingSearch('');
    setEditVerMappingTab('RISKS');
  };

  const handleSaveVersionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersionDoc || !editingVersionRecord) return;

    const updatedRecord: VersionRecord = {
      ...editingVersionRecord,
      version_number: editVersionData.version_number,
      revision_date: editVersionData.revision_date,
      changed_by: editVersionData.changed_by,
      change_description: editVersionData.change_description,
      file_name: editVersionData.file_name,
      mapped_risk_ids: editVersionData.mapped_risk_ids,
      mapped_asset_ids: editVersionData.mapped_asset_ids,
      mapped_doc_ids: editVersionData.mapped_doc_ids
    };

    const updatedHistory = (editingVersionDoc.version_history || []).map(r =>
      r.id === editingVersionRecord.id ? updatedRecord : r
    );

    // Also update document's cross-connects if mapped items modified
    const mergedRisks = Array.from(new Set([...(editingVersionDoc.mapped_risk_ids || []), ...editVersionData.mapped_risk_ids]));
    const mergedAssets = Array.from(new Set([...(editingVersionDoc.mapped_asset_ids || []), ...editVersionData.mapped_asset_ids]));
    const mergedDocs = Array.from(new Set([...(editingVersionDoc.mapped_doc_ids || []), ...editVersionData.mapped_doc_ids]));

    const updatedDoc: MasterDocument = {
      ...editingVersionDoc,
      version_history: updatedHistory,
      mapped_risk_ids: mergedRisks,
      mapped_asset_ids: mergedAssets,
      mapped_doc_ids: mergedDocs,
      updated_at: new Date().toISOString()
    };

    setDirectDocs(prev => prev.map(d => (d.id === editingVersionDoc.id ? updatedDoc : d)));
    if (viewingDoc && viewingDoc.id === editingVersionDoc.id) {
      setViewingDoc(updatedDoc);
    }

    setDocMappings(prev => ({
      ...prev,
      [editingVersionDoc.id]: {
        doc_id: editingVersionDoc.id,
        risk_ids: mergedRisks,
        asset_ids: mergedAssets,
        doc_ids: mergedDocs,
        updated_at: new Date().toISOString()
      }
    }));

    showToast(`Updated version record ${updatedRecord.version_number} & MAP links for "${editingVersionDoc.document_name}"`);
    setEditingVersionDoc(null);
    setEditingVersionRecord(null);
  };

  const handleDeleteVersionRecord = (doc: MasterDocument, recordId: string) => {
    if (window.confirm('Are you sure you want to delete this version history log entry?')) {
      const updatedHistory = (doc.version_history || []).filter(r => r.id !== recordId);
      const updatedDoc: MasterDocument = {
        ...doc,
        version_history: updatedHistory,
        updated_at: new Date().toISOString()
      };
      setDirectDocs(prev => prev.map(d => (d.id === doc.id ? updatedDoc : d)));
      if (viewingDoc && viewingDoc.id === doc.id) {
        setViewingDoc(updatedDoc);
      }
      showToast('Version revision record deleted from history.');
    }
  };

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Departments list from documents
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    allMasterDocuments.forEach(d => {
      if (d.department) set.add(d.department);
    });
    return ['All', ...Array.from(set)];
  }, [allMasterDocuments]);

  // Owners list
  const ownersList = useMemo(() => {
    const set = new Set<string>();
    allMasterDocuments.forEach(d => {
      if (d.owner) set.add(d.owner);
    });
    return ['All', ...Array.from(set)];
  }, [allMasterDocuments]);

  // Filtered master documents list
  const filteredDocuments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return allMasterDocuments.filter(doc => {
      // Free-text search
      const text = `${doc.document_id} ${doc.document_number} ${doc.document_name} ${doc.category} ${doc.sub_category} ${doc.department} ${doc.owner} ${doc.version} ${doc.classification} ${doc.status} ${doc.prepared_by} ${doc.approved_by}`.toLowerCase();
      const matchesSearch = text.includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchesDept = selectedDepartment === 'All' || doc.department === selectedDepartment;
      const matchesClass = selectedClassification === 'All' || doc.classification === selectedClassification;
      const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
      const matchesOwner = selectedOwner === 'All' || doc.owner === selectedOwner;

      let matchesReviewDue = true;
      if (showOnlyReviewDue) {
        matchesReviewDue = doc.next_review_date ? (doc.next_review_date <= in30Days && doc.next_review_date >= today) : false;
      }

      let matchesExpired = true;
      if (showOnlyExpired) {
        matchesExpired = doc.next_review_date ? (doc.next_review_date < today) : false;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDept &&
        matchesClass &&
        matchesStatus &&
        matchesOwner &&
        matchesReviewDue &&
        matchesExpired
      );
    });
  }, [
    allMasterDocuments,
    searchTerm,
    selectedCategory,
    selectedDepartment,
    selectedClassification,
    selectedStatus,
    selectedOwner,
    showOnlyReviewDue,
    showOnlyExpired
  ]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let total = allMasterDocuments.length;
    let policiesCount = allMasterDocuments.filter(d => d.category === 'Policies').length;
    let proceduresCount = allMasterDocuments.filter(d => d.category === 'Procedures').length;
    let formsCount = allMasterDocuments.filter(d => d.category === 'Forms').length;
    let registersCount = allMasterDocuments.filter(d => d.category === 'Registers').length;

    let pendingReview = allMasterDocuments.filter(d => d.next_review_date && d.next_review_date <= in30Days && d.next_review_date >= today).length;
    let expired = allMasterDocuments.filter(d => d.next_review_date && d.next_review_date < today).length;
    let awaitingApproval = allMasterDocuments.filter(d => d.status === 'Draft' || d.status === 'Under Review').length;
    let recentlyUpdated = allMasterDocuments.filter(d => d.updated_at && d.updated_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length;

    return {
      total,
      policiesCount,
      proceduresCount,
      formsCount,
      registersCount,
      pendingReview,
      expired,
      awaitingApproval,
      recentlyUpdated
    };
  }, [allMasterDocuments]);

  // Handle Save Edit Document
  const handleSaveDocEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    if (editingDoc.source_type === 'POLICY' && onUpdatePolicy) {
      const existing = policies.find(p => p.id === editingDoc.source_id);
      if (existing) {
        const updatedPolicy: Policy = {
          ...existing,
          policy_no: editingDoc.document_id,
          policy_name: editingDoc.document_name,
          version: editingDoc.version,
          classification: editingDoc.classification as any,
          issue_date: editingDoc.issue_date,
          next_due_date: editingDoc.next_review_date,
          department: editingDoc.department,
          prepared_by_name: editingDoc.prepared_by,
          reviewed_by_name: editingDoc.reviewed_by,
          approved_by_name: editingDoc.approved_by,
          status: editingDoc.status === 'Published' || editingDoc.status === 'Approved' ? 'APPROVED' : 'DRAFT'
        };
        onUpdatePolicy(updatedPolicy);
      }
    } else if (editingDoc.source_type === 'FORM' && onUpdateForm) {
      const existing = forms.find(f => f.id === editingDoc.source_id);
      if (existing) {
        const updatedForm: ComplianceForm = {
          ...existing,
          doc_ref: editingDoc.document_id,
          form_name: editingDoc.document_name,
          version: editingDoc.version,
          classification: editingDoc.classification as any,
          issue_date: editingDoc.issue_date,
          expiry_date: editingDoc.next_review_date,
          prepared_by: editingDoc.prepared_by,
          approved_by: editingDoc.approved_by,
          status: editingDoc.status === 'Published' ? 'ACTIVE' : 'DRAFT'
        };
        onUpdateForm(updatedForm);
      }
    }

    // Always store/update in directDocs so metadata overrides (Ref, Issue Date, Approval Date, Version, History) persist across sessions
    setDirectDocs(prev => {
      const exists = prev.some(d => d.id === editingDoc.id || (d.document_id && d.document_id === editingDoc.document_id));
      if (exists) {
        return prev.map(d => (d.id === editingDoc.id || (d.document_id && d.document_id === editingDoc.document_id)) ? { ...editingDoc, updated_at: new Date().toISOString() } : d);
      } else {
        return [{ ...editingDoc, updated_at: new Date().toISOString() }, ...prev];
      }
    });

    if (onUpdateClient && client) {
      const isRiskReg = editingDoc.document_id === 'REG-RSK-001' || editingDoc.document_number === 'COMP-DOC-01' || editingDoc.sub_category === 'Risk Management';
      const updatedClient: Client = {
        ...client,
        doc_ref: editingDoc.document_number || editingDoc.document_id || client.doc_ref,
        doc_classification: editingDoc.classification || client.doc_classification,
        doc_issue_date: editingDoc.issue_date || client.doc_issue_date,
        doc_approved_date: editingDoc.approval_date || client.doc_approved_date,
        doc_version: editingDoc.version || client.doc_version,
        doc_owner: editingDoc.prepared_by || editingDoc.owner || client.doc_owner,
        doc_approved_by: editingDoc.approved_by || client.doc_approved_by,
        version_history: (editingDoc.version_history && editingDoc.version_history.length > 0)
          ? editingDoc.version_history.map(vh => ({
              version: vh.version_number,
              date: vh.revision_date,
              author: vh.changed_by,
              changes: vh.change_description
            }))
          : client.version_history,
        owner_name: editingDoc.prepared_by || client.owner_name,
        auth_representative: {
          name: (editingDoc as any).auth_rep_name ?? client.auth_representative?.name ?? '',
          email: (editingDoc as any).auth_rep_email ?? client.auth_representative?.email ?? '',
          phone: (editingDoc as any).auth_rep_phone ?? client.auth_representative?.phone ?? ''
        },
        clinic_manager: {
          name: (editingDoc as any).clinic_mgr_name ?? client.clinic_manager?.name ?? '',
          email: (editingDoc as any).clinic_mgr_email ?? client.clinic_manager?.email ?? '',
          phone: (editingDoc as any).clinic_mgr_phone ?? client.clinic_manager?.phone ?? ''
        },
        medical_director: {
          name: (editingDoc as any).med_dir_name ?? client.medical_director?.name ?? '',
          email: (editingDoc as any).med_dir_email ?? client.medical_director?.email ?? '',
          phone: (editingDoc as any).med_dir_phone ?? client.medical_director?.phone ?? ''
        },
        it_manager: {
          name: (editingDoc as any).it_admin_name ?? client.it_manager?.name ?? '',
          email: (editingDoc as any).it_admin_email ?? client.it_manager?.email ?? '',
          phone: (editingDoc as any).it_admin_phone ?? client.it_manager?.phone ?? ''
        },
        hr_manager: {
          name: (editingDoc as any).hr_mgr_name ?? client.hr_manager?.name ?? '',
          email: (editingDoc as any).hr_mgr_email ?? client.hr_manager?.email ?? '',
          phone: (editingDoc as any).hr_mgr_phone ?? client.hr_manager?.phone ?? ''
        },
        it_support: {
          team_name: (editingDoc as any).it_supp_name ?? client.it_support?.team_name ?? '',
          email: (editingDoc as any).it_supp_email ?? client.it_support?.email ?? '',
          phone: (editingDoc as any).it_supp_phone ?? client.it_support?.phone ?? ''
        },
        emr_support: {
          team_name: (editingDoc as any).emr_supp_name ?? client.emr_support?.team_name ?? '',
          email: (editingDoc as any).emr_supp_email ?? client.emr_support?.email ?? '',
          phone: (editingDoc as any).emr_supp_phone ?? client.emr_support?.phone ?? ''
        },
        license_expiry: editingDoc.effective_date || client.license_expiry,
        updated_at: new Date().toISOString()
      };
      onUpdateClient(updatedClient);
    }

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'UPDATED MASTER DOCUMENT METADATA RECORD', {
        doc_id: editingDoc.document_id,
        doc_name: editingDoc.document_name,
        category: editingDoc.category,
        version: editingDoc.version
      });
    }

    showToast(`Successfully updated master document: "${editingDoc.document_name}" (${editingDoc.document_id})`);
    setEditingDoc(null);
  };

  // Handle Version Bump
  const handleExecuteVersionBump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bumpVersionDoc || !bumpData.new_version) return;

    const newHistoryItem: VersionRecord = {
      id: `ver-${Date.now()}`,
      version_number: bumpData.new_version,
      revision_date: bumpData.revision_date || new Date().toISOString().split('T')[0],
      changed_by: bumpData.changed_by,
      change_description: bumpData.change_description || 'Version bump revision update',
      file_name: bumpData.file_name || bumpVersionDoc.file_attachment_name,
      mapped_risk_ids: bumpData.mapped_risk_ids,
      mapped_asset_ids: bumpData.mapped_asset_ids,
      mapped_doc_ids: bumpData.mapped_doc_ids
    };

    const mergedRisks = Array.from(new Set([...(bumpVersionDoc.mapped_risk_ids || []), ...bumpData.mapped_risk_ids]));
    const mergedAssets = Array.from(new Set([...(bumpVersionDoc.mapped_asset_ids || []), ...bumpData.mapped_asset_ids]));
    const mergedDocs = Array.from(new Set([...(bumpVersionDoc.mapped_doc_ids || []), ...bumpData.mapped_doc_ids]));

    const updatedDoc: MasterDocument = {
      ...bumpVersionDoc,
      version: bumpData.new_version,
      current_revision: bumpData.new_version,
      version_history: [newHistoryItem, ...(bumpVersionDoc.version_history || [])],
      mapped_risk_ids: mergedRisks,
      mapped_asset_ids: mergedAssets,
      mapped_doc_ids: mergedDocs,
      updated_at: new Date().toISOString()
    };

    if (bumpVersionDoc.source_type === 'POLICY' && onUpdatePolicy) {
      const existing = policies.find(p => p.id === bumpVersionDoc.source_id);
      if (existing) {
        onUpdatePolicy({
          ...existing,
          version: bumpData.new_version
        });
      }
    } else if (bumpVersionDoc.source_type === 'FORM' && onUpdateForm) {
      const existing = forms.find(f => f.id === bumpVersionDoc.source_id);
      if (existing) {
        onUpdateForm({
          ...existing,
          version: bumpData.new_version
        });
      }
    } else {
      setDirectDocs(prev => {
        const exists = prev.some(d => d.id === bumpVersionDoc.id);
        if (exists) {
          return prev.map(d => (d.id === bumpVersionDoc.id ? updatedDoc : d));
        } else {
          return [...prev, updatedDoc];
        }
      });
    }

    setDocMappings(prev => ({
      ...prev,
      [bumpVersionDoc.id]: {
        doc_id: bumpVersionDoc.id,
        risk_ids: mergedRisks,
        asset_ids: mergedAssets,
        doc_ids: mergedDocs,
        updated_at: new Date().toISOString()
      },
      [bumpVersionDoc.document_id]: {
        doc_id: bumpVersionDoc.document_id,
        risk_ids: mergedRisks,
        asset_ids: mergedAssets,
        doc_ids: mergedDocs,
        updated_at: new Date().toISOString()
      }
    }));

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'BUMPED DOCUMENT VERSION & LINKED MAPS', {
        doc_id: bumpVersionDoc.document_id,
        old_ver: bumpVersionDoc.version,
        new_ver: bumpData.new_version,
        notes: bumpData.change_description,
        linked_risks: bumpData.mapped_risk_ids.length,
        linked_docs: bumpData.mapped_doc_ids.length
      });
    }

    showToast(`Published new version ${bumpData.new_version} with MAP links for "${bumpVersionDoc.document_name}"`);
    setBumpVersionDoc(null);
    setBumpData({ new_version: '', revision_date: new Date().toISOString().split('T')[0], change_description: '', changed_by: currentUser?.full_name || 'Document Controller', file_name: '', mapped_risk_ids: [], mapped_asset_ids: [], mapped_doc_ids: [] });
  };

  // Handle Workflow Approval
  const handleApproveDocument = (doc: MasterDocument) => {
    const updatedDoc: MasterDocument = {
      ...doc,
      status: 'Published',
      approval_date: new Date().toISOString().split('T')[0],
      approved_by: currentUser?.full_name || doc.approved_by || 'Authorized Approver',
      updated_at: new Date().toISOString()
    };

    if (doc.source_type === 'POLICY' && onUpdatePolicy) {
      const existing = policies.find(p => p.id === doc.source_id);
      if (existing) {
        onUpdatePolicy({
          ...existing,
          status: 'APPROVED',
          approval_date: new Date().toISOString().split('T')[0],
          approved_by_name: currentUser?.full_name || existing.approved_by_name
        });
      }
    } else if (doc.source_type === 'FORM' && onUpdateForm) {
      const existing = forms.find(f => f.id === doc.source_id);
      if (existing) {
        onUpdateForm({
          ...existing,
          status: 'ACTIVE'
        });
      }
    } else {
      setDirectDocs(prev => {
        const exists = prev.some(d => d.id === doc.id);
        if (exists) {
          return prev.map(d => (d.id === doc.id ? updatedDoc : d));
        } else {
          return [...prev, updatedDoc];
        }
      });
    }

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'APPROVED AND PUBLISHED MASTER DOCUMENT', {
        doc_id: doc.document_id,
        doc_name: doc.document_name,
        approver: currentUser?.full_name || 'Authorized Approver'
      });
    }

    showToast(`Document "${doc.document_name}" is now APPROVED & PUBLISHED in Master Index!`);
    setWorkflowDoc(null);
  };

  // Handle Create Direct Master Document
  const handleCreateDirectDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.document_name || !newDocData.document_id) {
      alert('Please provide Document ID and Document Name.');
      return;
    }

    const docId = `master-${Date.now()}`;
    const docRefCode = newDocData.document_reference || newDocData.document_number || newDocData.document_id || `REF-${Date.now()}`;

    const initialVersionHistory: VersionRecord[] = [
      {
        id: `ver-${Date.now()}`,
        version_number: newDocData.version || 'v1.0',
        revision_date: newDocData.effective_date || new Date().toISOString().split('T')[0],
        changed_by: newDocData.prepared_by || currentUser?.full_name || 'Compliance Lead',
        change_description: newDocData.change_summary || 'Initial Master Document Registration & Approval',
        mapped_doc_ids: regDocMappedDocIds,
        mapped_risk_ids: regDocMappedRiskIds,
        mapped_asset_ids: regDocMappedAssetIds
      }
    ];

    const created: MasterDocument = {
      id: docId,
      client_id: activeClientId,
      document_id: newDocData.document_id,
      document_number: docRefCode,
      document_reference: docRefCode,
      document_name: newDocData.document_name,
      category: (newDocData.category as DocumentCategoryType) || 'Policies',
      sub_category: newDocData.sub_category || 'General Document',
      department: newDocData.department || 'Quality & Compliance',
      owner: newDocData.owner || 'Document Controller',
      version: newDocData.version || 'v1.0',
      version_history: initialVersionHistory,
      classification: (newDocData.classification as MasterClassification) || 'Confidential',
      status: (newDocData.status as MasterDocStatus) || 'Approved',
      prepared_by: newDocData.prepared_by || currentUser?.full_name || 'Compliance Lead',
      reviewed_by: newDocData.reviewed_by || 'Senior Risk Lead',
      approved_by: newDocData.approved_by || 'Managing Director',
      issue_date: newDocData.issue_date || new Date().toISOString().split('T')[0],
      effective_date: newDocData.effective_date || new Date().toISOString().split('T')[0],
      next_review_date: newDocData.next_review_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      due_date: newDocData.due_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      approval_date: newDocData.approval_date || new Date().toISOString().split('T')[0],
      page_format: (newDocData.page_format as 'A4 Portrait' | 'A4 Landscape') || 'A4 Portrait',
      document_location: newDocData.document_location || 'Master Vault',
      sample_doc_name: newDocData.sample_doc_name,
      sample_doc_url: newDocData.sample_doc_url,
      current_revision: newDocData.version || 'v1.0',
      change_summary: newDocData.change_summary || 'Initial Registration',
      remarks: newDocData.remarks || 'Registered directly in Master Index',
      source_type: 'DIRECT',
      mapped_doc_ids: regDocMappedDocIds,
      mapped_risk_ids: regDocMappedRiskIds,
      mapped_asset_ids: regDocMappedAssetIds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setDirectDocs(prev => [created, ...prev]);

    setDocMappings(prev => ({
      ...prev,
      [docId]: {
        doc_id: docId,
        risk_ids: regDocMappedRiskIds,
        asset_ids: regDocMappedAssetIds,
        doc_ids: regDocMappedDocIds,
        updated_at: new Date().toISOString()
      },
      [created.document_id]: {
        doc_id: created.document_id,
        risk_ids: regDocMappedRiskIds,
        asset_ids: regDocMappedAssetIds,
        doc_ids: regDocMappedDocIds,
        updated_at: new Date().toISOString()
      }
    }));

    // If user requested creating a policy/form/document, sync to appropriate module
    if (newDocData.category === 'Policies' && onAddPolicy) {
      onAddPolicy({
        id: docId,
        client_id: activeClientId,
        policy_no: created.document_id,
        policy_name: created.document_name,
        version: created.version,
        review_date: created.next_review_date,
        status: created.status === 'Published' || created.status === 'Approved' ? 'APPROVED' : 'DRAFT',
        category: created.sub_category || 'Information Security',
        created_at: new Date().toISOString(),
        department: created.department,
        document_type: 'Policy',
        classification: created.classification as any,
        issue_date: created.issue_date,
        next_due_date: created.next_review_date,
        prepared_by_name: created.prepared_by,
        reviewed_by_name: created.reviewed_by,
        approved_by_name: created.approved_by
      });
    } else if (newDocData.category === 'Forms' && onAddForm) {
      onAddForm({
        id: docId,
        client_id: activeClientId,
        form_name: created.document_name,
        form_type: created.sub_category || 'Compliance Form',
        version: created.version,
        status: created.status === 'Published' ? 'ACTIVE' : 'DRAFT',
        doc_ref: created.document_id,
        category: created.sub_category,
        issue_date: created.issue_date,
        expiry_date: created.next_review_date,
        classification: created.classification as any,
        prepared_by: created.prepared_by,
        approved_by: created.approved_by,
        sample_doc_name: created.sample_doc_name,
        sample_doc_url: created.sample_doc_url
      });
    } else if (onAddDocument) {
      onAddDocument({
        id: docId,
        client_id: activeClientId,
        document_name: created.document_name,
        document_type: 'PDF',
        version: created.version,
        storage_path: created.document_location,
        approval_status: created.status === 'Published' ? 'APPROVED' : 'DRAFT',
        uploaded_by: currentUser?.id || 'admin',
        uploaded_by_name: created.prepared_by,
        uploaded_at: new Date().toISOString(),
        department: created.department,
        doc_type_category: created.category === 'Forms' ? 'Form' : created.category === 'Procedures' ? 'Procedure' : 'Policy',
        document_code: created.document_id
      });
    }

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'CREATED NEW MASTER DOCUMENT', {
        doc_id: created.document_id,
        doc_name: created.document_name,
        category: created.category
      });
    }

    showToast(`Created & registered new master document: "${created.document_name}". Popping up document control sheet...`);
    setIsAddDocOpen(false);
    setViewingDoc(created);
  };

  // Handle Delete Confirmation
  const confirmDeleteDocument = () => {
    if (!deletingDoc) return;

    const idsToRemove = [
      deletingDoc.id,
      deletingDoc.document_id,
      deletingDoc.document_number,
      `reg-risk-${activeClientId}`,
      `pol-${deletingDoc.source_id}`,
      `form-${deletingDoc.source_id}`
    ].filter(Boolean) as string[];

    setDeletedDocIds(prev => {
      const updated = Array.from(new Set([...prev, ...idsToRemove]));
      try {
        localStorage.setItem('sh_deleted_master_doc_ids', JSON.stringify(updated));
      } catch (err) {
        console.error('Error persisting deleted doc ids:', err);
      }
      return updated;
    });

    if (deletingDoc.source_type === 'POLICY' && onDeletePolicy && deletingDoc.source_id) {
      onDeletePolicy(deletingDoc.source_id);
    } else if (deletingDoc.source_type === 'FORM' && onDeleteForm && deletingDoc.source_id) {
      onDeleteForm(deletingDoc.source_id);
    }

    setDirectDocs(prev => prev.filter(d => d.id !== deletingDoc.id && d.document_id !== deletingDoc.document_id));

    if (logAuditTrail) {
      logAuditTrail('MASTER_INDEX', 'PERMANENTLY DELETED MASTER DOCUMENT RECORD FROM INDEX', {
        doc_id: deletingDoc.document_id,
        doc_name: deletingDoc.document_name
      });
    }

    showToast(`Permanently deleted master document: "${deletingDoc.document_name}" (${deletingDoc.document_id})`);
    setDeletingDoc(null);
    if (viewingDoc && (viewingDoc.id === deletingDoc.id || viewingDoc.document_id === deletingDoc.document_id)) {
      setViewingDoc(null);
    }
  };

  // Helper badge styles
  const getCategoryBadge = (cat: DocumentCategoryType) => {
    switch (cat) {
      case 'Policies':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Procedures':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Forms':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Registers':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st: MasterDocStatus) => {
    switch (st) {
      case 'Published':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Draft':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Obsolete':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getClassificationBadge = (cls: MasterClassification) => {
    switch (cls) {
      case 'Restricted':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Confidential':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Internal':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Public':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="master-index-module" className="space-y-6 font-sans">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> Centralized Document Control Index
            </span>
            <span className="text-slate-400 text-[10px] font-mono font-semibold">
              Client ID: {activeClientId.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            Policy & Procedure Master Index
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed font-medium">
            Unified governance repository automatically indexing all organizational Policies, Procedures, Forms, and Master Registers across your facility with real-time audit control.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('QUICK_SETUP')}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ring-2 ring-amber-300"
          >
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" /> ⚡ Quick setup to Index
          </button>

          <button
            type="button"
            onClick={openAddDocModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Register New Document
          </button>

          <button
            type="button"
            onClick={handleClearAllDocuments}
            className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="Remove all existing master documents to start fresh"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove All Existing Files
          </button>

          <button
            type="button"
            onClick={() => printCurrentView({ target: '#master-index-module' })}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Print Master Index Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-xl shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 p-1">
          <button
            onClick={() => setActiveTab('QUICK_SETUP')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'QUICK_SETUP'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-300" /> ⚡ Quick setup to Index
          </button>

          <button
            onClick={() => setActiveTab('TABLE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'TABLE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderCheck className="w-4 h-4" /> Master Index Table
            <span className="ml-1 bg-slate-200 text-slate-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {filteredDocuments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" /> Executive Dashboard
          </button>

          <button
            onClick={() => setActiveTab('MAPPINGS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'MAPPINGS'
                ? 'bg-indigo-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Network className="w-4 h-4 text-indigo-400" /> Map / Cross-Connect Matrix
            <span className="ml-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
              {allMasterDocuments.filter(d => d.mapped_risk_ids && d.mapped_risk_ids.length > 0).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVALS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'APPROVALS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-400" /> Approval Workflow Queue
            {metrics.awaitingApproval > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {metrics.awaitingApproval}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'VERSIONS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-indigo-400" /> Version History Controls
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" /> Immutable Audit Logs
          </button>
        </div>

        {/* Quick Review Alert Badge */}
        {metrics.pendingReview > 0 && (
          <button
            onClick={() => {
              setActiveTab('TABLE');
              setShowOnlyReviewDue(true);
            }}
            className="hidden lg:flex items-center gap-1.5 text-xs font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {metrics.pendingReview} Documents Due for Review
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 1: MASTER INDEX TABLE VIEW */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'TABLE' && (
        <div className="space-y-4">
          {/* Quick Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search Master Index by Document ID, Title, Category, Owner, Department, or Status..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                />
              </div>

              {/* Category Quick Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto shrink-0">
                {['All', 'Policies', 'Procedures', 'Forms', 'Templates', 'Registers'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filter Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  isFilterDrawerOpen || selectedDepartment !== 'All' || selectedClassification !== 'All' || selectedStatus !== 'All' || showOnlyReviewDue || showOnlyExpired
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Filters
              </button>
            </div>

            {/* Expanded Advanced Filters Drawer */}
            {isFilterDrawerOpen && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    {departmentsList.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Classification</label>
                  <select
                    value={selectedClassification}
                    onChange={e => setSelectedClassification(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    {['All', 'Public', 'Internal', 'Confidential', 'Restricted'].map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Lifecycle Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    {['All', 'Draft', 'Under Review', 'Approved', 'Published', 'Obsolete'].map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Document Owner</label>
                  <select
                    value={selectedOwner}
                    onChange={e => setSelectedOwner(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold bg-white"
                  >
                    {ownersList.map(o => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowOnlyReviewDue(!showOnlyReviewDue);
                      if (!showOnlyReviewDue) setShowOnlyExpired(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                      showOnlyReviewDue ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Review Due
                  </button>

                  <button
                    onClick={() => {
                      setShowOnlyExpired(!showOnlyExpired);
                      if (!showOnlyExpired) setShowOnlyReviewDue(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                      showOnlyExpired ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Expired
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedDepartment('All');
                      setSelectedClassification('All');
                      setSelectedStatus('All');
                      setSelectedOwner('All');
                      setShowOnlyReviewDue(false);
                      setShowOnlyExpired(false);
                      setSearchTerm('');
                    }}
                    className="text-[10px] text-slate-500 underline font-bold hover:text-slate-800"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Master Index Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Doc ID / Ref</th>
                    <th className="py-3 px-4">Document Title & Sub-Category</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Department & Owner</th>
                    <th className="py-3 px-4 text-center">Version</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Next Review</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <FolderCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-700">No Master Documents Found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new document.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map(doc => {
                      const isReviewDue = doc.next_review_date && doc.next_review_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && doc.next_review_date >= new Date().toISOString().split('T')[0];
                      const isExpired = doc.next_review_date && doc.next_review_date < new Date().toISOString().split('T')[0];

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          {/* Doc ID */}
                          <td className="py-3.5 px-4 font-mono font-black text-indigo-700 whitespace-nowrap">
                            {doc.document_id || doc.document_number}
                          </td>

                          {/* Document Title */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => setViewingDoc(doc)}>
                              {doc.document_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                              <span>{doc.sub_category || 'General Template'}</span>
                              {doc.sample_doc_name && (
                                <span className="bg-blue-50 text-blue-700 font-mono text-[9px] px-1.5 py-0.2 rounded border border-blue-200">
                                  📎 .DOC Attached
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getCategoryBadge(doc.category)}`}>
                              {doc.category}
                            </span>
                          </td>

                          {/* Department & Owner */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{doc.department}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{doc.owner}</div>
                          </td>

                          {/* Version */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {doc.version}
                            </span>
                          </td>

                          {/* Classification */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getClassificationBadge(doc.classification)}`}>
                              {doc.classification}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getStatusBadge(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>

                          {/* Next Review */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className={`font-mono text-xs font-bold ${isExpired ? 'text-rose-600 font-black' : isReviewDue ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>
                              {doc.next_review_date || 'N/A'}
                            </div>
                            {isExpired && (
                              <span className="text-[9px] font-black text-rose-600 uppercase block">EXPIRED</span>
                            )}
                            {isReviewDue && !isExpired && (
                              <span className="text-[9px] font-black text-amber-600 uppercase block">REVIEW DUE</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingDoc(doc)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                title="View Document Details & Sheet"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openMappingModal(doc)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
                                  doc.mapped_risk_ids && doc.mapped_risk_ids.length > 0
                                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300'
                                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                }`}
                                title="Map / Cross-Connect to Risk Register & Modules"
                              >
                                <Network className="w-3.5 h-3.5 text-purple-600" />
                                {doc.mapped_risk_ids && doc.mapped_risk_ids.length > 0 ? (
                                  <span className="font-mono text-[9px] font-black bg-purple-200 text-purple-950 px-1 rounded">
                                    {doc.mapped_risk_ids.length}
                                  </span>
                                ) : (
                                  <span>Map</span>
                                )}
                              </button>

                              <button
                                onClick={() => setEditingDoc(doc)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                title="Edit Document Metadata"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setBumpVersionDoc(doc);
                                  const verParts = doc.version.replace(/[^\d.]/g, '').split('.');
                                  let nextVer = 'v1.1';
                                  if (verParts.length >= 2) {
                                    nextVer = `v${verParts[0]}.${parseInt(verParts[1]) + 1}`;
                                  }
                                  setBumpData({
                                    new_version: nextVer,
                                    change_description: '',
                                    changed_by: currentUser?.full_name || 'Document Controller',
                                    file_name: doc.file_attachment_name || ''
                                  });
                                }}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                title="Publish New Version"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {(doc.status === 'Draft' || doc.status === 'Under Review') && (
                                <button
                                  onClick={() => setWorkflowDoc(doc)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                  title="Review & Approve"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setDeletingDoc(doc)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                title="Delete Document"
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
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 2: EXECUTIVE DASHBOARD */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Index Docs</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
              <p className="text-[10px] text-slate-500 font-bold mt-1">All Document Types</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Total Policies</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{metrics.policiesCount}</div>
              <p className="text-[10px] text-blue-700 font-bold mt-1">Policies Framework</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs bg-sky-50/20">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest block">Total Procedures</span>
              <div className="text-2xl font-black text-sky-900 mt-1">{metrics.proceduresCount}</div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">SOPs & Work Instructions</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Total Forms</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{metrics.formsCount}</div>
              <p className="text-[10px] text-amber-800 font-bold mt-1">Digital Forms</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">Total Registers</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">{metrics.registersCount}</div>
              <p className="text-[10px] text-emerald-800 font-bold mt-1">Master Registers</p>
            </div>
          </div>

          {/* Actionable Alerts & Lifecycle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> Pending Review (30 Days)
                </span>
                <span className="text-lg font-black text-amber-900">{metrics.pendingReview}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Documents requiring annual regulatory re-authorization soon.</p>
              <button
                onClick={() => {
                  setActiveTab('TABLE');
                  setShowOnlyReviewDue(true);
                }}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                View Pending Review Documents <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Expired Documents
                </span>
                <span className="text-lg font-black text-rose-900">{metrics.expired}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Review date has passed. Immediate document control action needed.</p>
              <button
                onClick={() => {
                  setActiveTab('TABLE');
                  setShowOnlyExpired(true);
                }}
                className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                View Expired Documents <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Awaiting Approval
                </span>
                <span className="text-lg font-black text-indigo-900">{metrics.awaitingApproval}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Drafts and updates queued for senior sign-off and publishing.</p>
              <button
                onClick={() => setActiveTab('APPROVALS')}
                className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                Open Approval Queue <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Graphical Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Progress Bars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Document Category Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Policies', count: metrics.policiesCount, color: 'bg-blue-600' },
                  { label: 'Procedures', count: metrics.proceduresCount, color: 'bg-sky-500' },
                  { label: 'Forms', count: metrics.formsCount, color: 'bg-amber-500' },
                  { label: 'Registers', count: metrics.registersCount, color: 'bg-emerald-500' }
                ].map(item => {
                  const pct = metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{item.label}</span>
                        <span>
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Departmental Allocation List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Departmental Index Distribution</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {departmentsList
                  .filter(d => d !== 'All')
                  .map(dept => {
                    const count = allMasterDocuments.filter(d => d.department === dept).length;
                    return (
                      <div key={dept} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-extrabold text-slate-800">{dept}</span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          {count} docs
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB: CROSS-CONNECT & RISK REGISTER MAPPING MATRIX */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'MAPPINGS' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Network className="w-3 h-3 text-indigo-400" /> Policy & Risk Mapping Engine
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ADHCIS v2 & ISO 27001 Aligned
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Policy & Procedure Cross-Connect Matrix</h2>
              <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
                Map master policies, procedures, and forms directly to Risk Register items, IT assets, and incident records. Ensure 100% regulatory traceability across your compliance framework.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={openAddDocModal}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Document</span>
              </button>
              <button
                type="button"
                onClick={handleClearAllDocuments}
                className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Remove all existing master documents to start fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Existing Files</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (allMasterDocuments.length > 0) openMappingModal(allMasterDocuments[0]);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Network className="w-4 h-4" />
                <span>Map Document</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Master Index Docs</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{allMasterDocuments.length}</div>
              <p className="text-[10px] text-slate-500 font-bold mt-1">Policies, Forms & Registers</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">Cross-Connected Docs</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {allMasterDocuments.filter(d => d.mapped_risk_ids && d.mapped_risk_ids.length > 0).length}
              </div>
              <p className="text-[10px] text-indigo-700 font-bold mt-1">
                {allMasterDocuments.length > 0
                  ? Math.round((allMasterDocuments.filter(d => d.mapped_risk_ids && d.mapped_risk_ids.length > 0).length / allMasterDocuments.length) * 100)
                  : 0}% Coverage Rate
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">Linked Risk Items</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {allMasterDocuments.reduce((acc, d) => acc + (d.mapped_risk_ids?.length || 0), 0)}
              </div>
              <p className="text-[10px] text-emerald-800 font-bold mt-1">Risk Register References</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Unmapped Policies</span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {allMasterDocuments.filter(d => (!d.mapped_risk_ids || d.mapped_risk_ids.length === 0) && d.category === 'Policies').length}
              </div>
              <p className="text-[10px] text-amber-800 font-bold mt-1">Requires Risk Association</p>
            </div>
          </div>

          {/* Matrix Controls & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={e => setMatrixSearch(e.target.value)}
                  placeholder="Search Matrix by Document Name, Doc ID, or Linked Risk Code..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto shrink-0">
                <select
                  value={matrixCategoryFilter}
                  onChange={e => setMatrixCategoryFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Policies">Policies</option>
                  <option value="Procedures">Procedures</option>
                  <option value="Forms">Forms</option>
                  <option value="Registers">Registers</option>
                </select>

                <select
                  value={matrixMappingFilter}
                  onChange={e => setMatrixMappingFilter(e.target.value as any)}
                  className="text-xs p-2 rounded-xl border border-slate-200 font-bold bg-white text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Mapped">Mapped Only</option>
                  <option value="Unmapped">Unmapped Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matrix Cards List */}
          <div className="space-y-3">
            {allMasterDocuments
              .filter(doc => {
                const matchesCat = matrixCategoryFilter === 'All' || doc.category === matrixCategoryFilter;
                const isMapped = doc.mapped_risk_ids && doc.mapped_risk_ids.length > 0;
                const matchesStatus = matrixMappingFilter === 'All' || (matrixMappingFilter === 'Mapped' ? isMapped : !isMapped);
                const query = matrixSearch.toLowerCase();
                const matchesSearch =
                  !matrixSearch ||
                  doc.document_name.toLowerCase().includes(query) ||
                  doc.document_id.toLowerCase().includes(query) ||
                  (doc.mapped_risk_ids || []).some(rid => rid.toLowerCase().includes(query));

                return matchesCat && matchesStatus && matchesSearch;
              })
              .map(doc => {
                const mappedRisks = risks.filter(r => (doc.mapped_risk_ids || []).includes(r.id) || (doc.mapped_risk_ids || []).includes(r.risk_id));
                const mappedDocs = allMasterDocuments.filter(other =>
                  other.id !== doc.id && (
                    (doc.mapped_doc_ids || []).includes(other.id) ||
                    (doc.mapped_doc_ids || []).includes(other.document_id) ||
                    (other.mapped_doc_ids || []).includes(doc.id) ||
                    (other.mapped_doc_ids || []).includes(doc.document_id)
                  )
                );

                return (
                  <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                            {doc.document_id || doc.document_number}
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getCategoryBadge(doc.category)}`}>
                            {doc.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {doc.department}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setViewingDoc(doc)}>
                          {doc.document_name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          title="View Document Sheet Popup"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingDoc(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          title="Edit Document Metadata"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openMappingModal(doc)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Network className="w-3.5 h-3.5" />
                          <span>Manage Cross-Connects</span>
                        </button>
                        <button
                          onClick={() => setDeletingDoc(doc)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold cursor-pointer transition-colors border border-rose-200"
                          title="Remove / Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inter-Connected Master Index Documents */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                          Inter-Connected Master Documents ({mappedDocs.length})
                        </span>
                      </div>

                      {mappedDocs.length === 0 ? (
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 flex items-center justify-between">
                          <span className="font-semibold text-[11px] text-slate-500">
                            No related Master Documents connected to this document yet.
                          </span>
                          <button
                            onClick={() => openMappingModal(doc)}
                            className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer"
                          >
                            + Connect Document
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {mappedDocs.map(cDoc => (
                            <button
                              key={cDoc.id}
                              onClick={() => setViewingDoc(cDoc)}
                              className="p-2 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-2xs group"
                              title="Click to view connected document popup"
                            >
                              <span className="font-mono font-black text-[10px] bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-900">
                                {cDoc.document_id || cDoc.document_number}
                              </span>
                              <span className="font-extrabold text-[11px] truncate max-w-[180px] group-hover:text-indigo-700">
                                {cDoc.document_name}
                              </span>
                              <ExternalLink className="w-3 h-3 text-indigo-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linked Risk Register Badges */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Mapped Risk Register Items ({mappedRisks.length})
                        </span>
                        {mappedRisks.length > 0 && onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('risks')}
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Open Risk Register <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {mappedRisks.length === 0 ? (
                        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                          <span className="font-semibold text-[11px] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            No Risk Register items linked to this document yet.
                          </span>
                          <button
                            onClick={() => openMappingModal(doc)}
                            className="text-[10px] font-black text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            + Cross-Connect Now
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {mappedRisks.map(r => {
                            const isHigh = (r.risk_rating || 0) >= 12;
                            const isMed = (r.risk_rating || 0) >= 6 && (r.risk_rating || 0) < 12;
                            return (
                              <div
                                key={r.id}
                                className={`p-2 rounded-xl border text-xs flex items-center gap-2 max-w-xs ${
                                  isHigh
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : isMed
                                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                }`}
                              >
                                <span className="font-mono font-black text-[10px] bg-white px-1.5 py-0.5 rounded border shadow-2xs">
                                  {r.risk_id || 'RSK-001'}
                                </span>
                                <span className="font-bold text-[11px] truncate flex-1" title={r.risk_title}>
                                  {r.risk_title}
                                </span>
                                <span className="font-mono text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-white border">
                                  Score: {r.risk_rating || 0}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 3: APPROVAL WORKFLOW QUEUE */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Document Approval & Release Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Review pending drafts and authorize formal regulatory release.</p>
            </div>
            <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              {metrics.awaitingApproval} Documents Pending Authorization
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {allMasterDocuments.filter(d => d.status === 'Draft' || d.status === 'Under Review').length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                <p className="font-extrabold text-slate-800 text-sm">All Master Documents Approved!</p>
                <p className="text-xs text-slate-400 mt-1">There are no pending draft documents requiring authorization.</p>
              </div>
            ) : (
              allMasterDocuments
                .filter(d => d.status === 'Draft' || d.status === 'Under Review')
                .map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {doc.document_id}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getCategoryBadge(doc.category)}`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Status: {doc.status}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-sm">{doc.document_name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Prepared By: <strong className="text-slate-800">{doc.prepared_by}</strong> | Department: <strong className="text-slate-800">{doc.department}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        Preview Draft
                      </button>

                      <button
                        onClick={() => handleApproveDocument(doc)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Approve & Publish
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 4: VERSION HISTORY CONTROLS */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'VERSIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Version Control & Revision Logs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Add, edit, manage and link MAP options across all master document version revisions.</p>
            </div>
            <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
              {allMasterDocuments.length} Registered Master Documents
            </div>
          </div>

          <div className="space-y-4">
            {allMasterDocuments.map(doc => (
              <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{doc.document_id}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{doc.category}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-1">{doc.document_name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Current: {doc.version}
                    </span>
                    <button
                      type="button"
                      onClick={() => openBumpModal(doc)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      + Publish Version & MAP
                    </button>
                    <button
                      type="button"
                      onClick={() => openMappingModal(doc)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Network className="w-3.5 h-3.5" /> MAP Links
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(doc.version_history && doc.version_history.length > 0 ? doc.version_history : [
                    { id: 'vh1', version_number: doc.version || 'v1.0', revision_date: doc.effective_date || '2026-06-01', changed_by: doc.prepared_by || 'Compliance Lead', change_description: 'Initial Master Document Registration' }
                  ]).map((ver, idx) => {
                    const numRisks = (ver.mapped_risk_ids || doc.mapped_risk_ids || []).length;
                    const numAssets = (ver.mapped_asset_ids || doc.mapped_asset_ids || []).length;
                    const numDocs = (ver.mapped_doc_ids || doc.mapped_doc_ids || []).length;

                    return (
                      <div key={ver.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-200 text-xs">{ver.version_number}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{ver.revision_date}</span>
                            <span className="font-bold text-slate-800">• Author: {ver.changed_by}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditVersionModal(doc, ver)}
                              className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit Version Log & MAP Connections"
                            >
                              <FileCheck2 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersionRecord(doc, ver.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete Version Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-700 font-medium text-xs leading-relaxed">{ver.change_description}</p>

                        {/* MAP CONNECTION BADGES */}
                        {(numRisks > 0 || numAssets > 0 || numDocs > 0) && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 text-[10px] font-extrabold">
                            <span className="text-purple-900 flex items-center gap-1">
                              <Network className="w-3 h-3 text-purple-600" /> MAP Connections:
                            </span>
                            {numRisks > 0 && <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">{numRisks} Risks</span>}
                            {numAssets > 0 && <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">{numAssets} Assets</span>}
                            {numDocs > 0 && <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-200">{numDocs} Connected Documents</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 5: IMMUTABLE AUDIT LOGS */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Immutable Master Index Audit Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Read-only cryptographic event trail of all document modifications and approvals.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Module</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, i) => (
                    <tr key={`${log.id || 'al'}-${i}`} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500">{log.created_at?.replace('T', ' ').slice(0, 19)}</td>
                      <td className="p-2.5 font-bold text-slate-800">{log.user_name}</td>
                      <td className="p-2.5 font-bold text-indigo-700">{log.action}</td>
                      <td className="p-2.5 text-slate-600">{log.module_name}</td>
                      <td className="p-2.5 text-slate-500 max-w-xs truncate">{JSON.stringify(log.new_value || log.record_id || '')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* TAB 7: QUICK SETUP TO INDEX */}
      {/* -------------------------------------------------------------------------- */}
      {activeTab === 'QUICK_SETUP' && (
        <QuickMasterSetup
          client={client}
          onUpdateClient={onUpdateClient}
          onNavigateTab={onNavigateTab}
          logAuditTrail={logAuditTrail}
        />
      )}

      {/* Legacy Quick Setup layout superseded by QuickMasterSetup component */}
      {false && (
        <div className="space-y-6">
          <div>

            {/* Connected Metadata Source Linkage Bar */}
            <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                      LINKED METADATA SOURCE:
                    </span>
                    <span className="text-[11px] font-extrabold text-white">
                      Risk Register &gt; DOH / ISO 27001 / ADHICS COMPLIANCE REPORT VIEW &gt; Document Metadata
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700/50">Ref: {quickSetupData.doc_ref}</span>
                    <span className="bg-rose-950/80 text-rose-200 px-2 py-0.5 rounded border border-rose-700/50">Classification: {quickSetupData.classification.toUpperCase()}</span>
                    <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">Issue: {formatDateDMY(quickSetupData.effective_date)}</span>
                    <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">Approved: {formatDateDMY(quickSetupData.review_date)}</span>
                    <span className="bg-emerald-950/80 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/50">Version: {quickSetupData.version_number}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const targetRef = client?.doc_ref || 'ZZP-IT-PE-05/2021';
                  const targetCls = (client?.doc_classification as any) || 'Restricted';
                  const targetIssue = formatDateDMY(client?.doc_issue_date || '01/03/2022');
                  const targetApproved = formatDateDMY(client?.doc_approved_date || '30/06/2026');
                  const targetVer = client?.doc_version || '1.0';

                  setQuickSetupData({
                    ...quickSetupData,
                    doc_ref: targetRef,
                    doc_name: 'ISO 27001 & ADHICS v2 Compliance',
                    category: 'Policies',
                    sub_category: 'Information Security & Risk Management',
                    department: 'IT Security & Compliance',
                    classification: targetCls,
                    effective_date: targetIssue,
                    review_date: targetApproved,
                    due_date: targetApproved,
                    prepared_by: currentUser?.name || 'CISO / Compliance Lead',
                    reviewed_by: 'Internal Compliance Audit Committee',
                    approved_by: `Managing Director (Approved ${targetApproved})`,
                    version_number: targetVer,
                    version_description: 'ISO 27001 & ADHICS v2 Compliance Standard Policy & Register Control',
                    compliance_framework: 'ISO 27001 & ADHICS v2 Compliance',
                    security_marking: `${targetCls.toUpperCase()} — INTERNAL COMPLIANCE AUDIT ONLY`,
                    watermark_text: `${targetCls.toUpperCase()} COMPLIANCE COPY`
                  });

                  if (client && onUpdateClient) {
                    onUpdateClient({
                      ...client,
                      doc_ref: targetRef,
                      doc_classification: targetCls,
                      doc_issue_date: targetIssue,
                      doc_approved_date: targetApproved,
                      doc_version: targetVer
                    });
                  }
                  setToastMsg('Metadata successfully re-synced across Risk Register & Master Index!');
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Re-Sync Compliance Metadata</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Form & Register Selector (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* SECTION 1: Core Document Information */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-600" /> Document Control Metadata
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500">* Required Fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-black text-slate-800 mb-1">DOCUMENT REFERENCE *</label>
                    <input
                      type="text"
                      value={quickSetupData.doc_ref}
                      onChange={e => setQuickSetupData({ ...quickSetupData, doc_ref: e.target.value })}
                      placeholder="e.g. SOP-SEC-2026-01 / ZZP-IT-RR-02/2021"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">DOCUMENT NAME / TITLE *</label>
                    <input
                      type="text"
                      value={quickSetupData.doc_name}
                      onChange={e => setQuickSetupData({ ...quickSetupData, doc_name: e.target.value })}
                      placeholder="e.g. Access Control & Physical Security SOP"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">CATEGORY & TYPE *</label>
                    <select
                      value={quickSetupData.category}
                      onChange={e => setQuickSetupData({ ...quickSetupData, category: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Policies">Policies Framework</option>
                      <option value="Procedures">Procedures & SOPs</option>
                      <option value="Forms">Digital Forms</option>
                      <option value="Registers">Master Registers</option>
                      <option value="Templates">Templates & Guidelines</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">SUB-CATEGORY / DEPARTMENT</label>
                    <input
                      type="text"
                      value={quickSetupData.sub_category}
                      onChange={e => setQuickSetupData({ ...quickSetupData, sub_category: e.target.value })}
                      placeholder="e.g. Physical & Cyber Security"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* CLASSIFICATION SELECTOR */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-black text-slate-800">
                      CLASSIFICATION (Restricted, Confidential, Secret, Public) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Public', 'Restricted', 'Confidential', 'Secret'] as MasterClassification[]).map(cls => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setQuickSetupData({ ...quickSetupData, classification: cls })}
                          className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            quickSetupData.classification === cls
                              ? cls === 'Secret' ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                                : cls === 'Restricted' ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400'
                                : cls === 'Confidential' ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400'
                                : 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-400'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{cls}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DATES & AUTHORIZATIONS */}
                  <div>
                    <label className="block font-black text-slate-800 mb-1">APPROVED / EFFECTIVE DATE *</label>
                    <input
                      type="date"
                      value={quickSetupData.effective_date}
                      onChange={e => setQuickSetupData({ ...quickSetupData, effective_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">REVIEW DATE *</label>
                    <input
                      type="date"
                      value={quickSetupData.review_date}
                      onChange={e => setQuickSetupData({ ...quickSetupData, review_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">DUE DATE</label>
                    <input
                      type="date"
                      value={quickSetupData.due_date}
                      onChange={e => setQuickSetupData({ ...quickSetupData, due_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">PREPARED BY *</label>
                    <input
                      type="text"
                      value={quickSetupData.prepared_by}
                      onChange={e => setQuickSetupData({ ...quickSetupData, prepared_by: e.target.value })}
                      placeholder="Author / Prepared By"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">REVIEWED BY * (Optional)</label>
                    <input
                      type="text"
                      value={quickSetupData.reviewed_by}
                      onChange={e => setQuickSetupData({ ...quickSetupData, reviewed_by: e.target.value })}
                      placeholder="Reviewer Name"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 mb-1">APPROVED BY *</label>
                    <input
                      type="text"
                      value={quickSetupData.approved_by}
                      onChange={e => setQuickSetupData({ ...quickSetupData, approved_by: e.target.value })}
                      placeholder="Approver / Authority"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 1B: PAGE HEADER / FOOTER COMPLIANCE BRANDING CONFIGURATION */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" /> Page Header / Footer Compliance Branding Configuration
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize corporate branding, compliance frameworks, security markings, and footer disclaimers for PDF report generation.</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-auto">
                    Branding & Layout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Organization Name / Entity Branding */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                      Organization / Corporate Entity Name
                    </label>
                    <input
                      type="text"
                      value={quickSetupData.org_name}
                      onChange={e => setQuickSetupData({ ...quickSetupData, org_name: e.target.value })}
                      placeholder="e.g. GLOBAL ENTERPRISE FACILITY & HEALTHCARE GOVERNANCE"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Compliance Framework & Authorities */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                      Compliance Frameworks & Standards
                    </label>
                    <input
                      type="text"
                      value={quickSetupData.compliance_framework}
                      onChange={e => setQuickSetupData({ ...quickSetupData, compliance_framework: e.target.value })}
                      placeholder="e.g. ISO 27001:2022 | OSHAD SF v3.1 | ADHCIS v2"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Header Compliance Badge */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                      Header Compliance Badge Text
                    </label>
                    <input
                      type="text"
                      value={quickSetupData.header_badge_text}
                      onChange={e => setQuickSetupData({ ...quickSetupData, header_badge_text: e.target.value })}
                      placeholder="e.g. OFFICIAL COMPLIANCE CONTROLLED SPECIFICATION"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Footer Security Marking */}
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                      Footer Security Classification Marking
                    </label>
                    <input
                      type="text"
                      value={quickSetupData.security_marking}
                      onChange={e => setQuickSetupData({ ...quickSetupData, security_marking: e.target.value })}
                      placeholder="e.g. STRICTLY CONFIDENTIAL — INTERNAL COMPLIANCE AUDIT ONLY"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Footer Confidentiality Disclaimer */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-extrabold text-slate-800 uppercase text-[10.5px] block">
                      Footer Confidentiality & Governance Disclaimer
                    </label>
                    <textarea
                      rows={2}
                      value={quickSetupData.footer_disclaimer}
                      onChange={e => setQuickSetupData({ ...quickSetupData, footer_disclaimer: e.target.value })}
                      placeholder="Enter official footer legal & compliance notice..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Watermark Toggle & Text */}
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_watermark_toggle"
                        checked={quickSetupData.show_watermark}
                        onChange={e => setQuickSetupData({ ...quickSetupData, show_watermark: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor="show_watermark_toggle" className="font-extrabold text-slate-900 text-xs cursor-pointer">
                        Enable Print Background Watermark
                      </label>
                    </div>

                    {quickSetupData.show_watermark && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[11px] font-semibold text-slate-700 shrink-0">Watermark:</span>
                        <input
                          type="text"
                          value={quickSetupData.watermark_text}
                          onChange={e => setQuickSetupData({ ...quickSetupData, watermark_text: e.target.value })}
                          placeholder="WATERMARK TEXT"
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 w-full sm:w-52"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>



              {/* SECTION 3: DOCUMENT VERSION CONTROL & REVISION LOGS (ADD / EDIT) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" /> DOCUMENT VERSION CONTROL & REVISION LOGS (Add / Edit)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Maintain explicit audit logs of version iterations, revisions, and approval dates.</p>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 self-start sm:self-auto">
                    {quickSetupData.revision_history_logs.length} Version Log Entries
                  </span>
                </div>

                {/* Input Controls to Add/Edit Revision Log */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider block">
                    {qsEditingLogId ? '✏️ Edit Selected Revision Log Entry' : '➕ Add New Revision History Entry'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={qsLogVersion}
                      onChange={e => setQsLogVersion(e.target.value)}
                      placeholder="Version No. (e.g. V1.1)"
                      className="p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    />
                    <input
                      type="date"
                      value={qsLogDate}
                      onChange={e => setQsLogDate(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                    />
                    <input
                      type="text"
                      value={qsLogAuthor}
                      onChange={e => setQsLogAuthor(e.target.value)}
                      placeholder="Changed By / Author"
                      className="p-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={qsLogDesc}
                      onChange={e => setQsLogDesc(e.target.value)}
                      placeholder="Change Description / Revision Notes (e.g. Added 6-register cross-connect linkages)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddOrUpdateQsRevisionLog}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
                    >
                      {qsEditingLogId ? 'Update Log' : 'Add Entry'}
                    </button>
                  </div>
                </div>

                {/* List of Version Logs */}
                <div className="space-y-2">
                  {quickSetupData.revision_history_logs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded text-[10px] border border-indigo-200">
                            {log.version_number}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{log.revision_date}</span>
                          <span className="font-bold text-slate-800 text-[11px]">• {log.changed_by}</span>
                        </div>
                        <p className="font-semibold text-slate-700 text-[11px] truncate">{log.change_description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditQsRevisionLog(log)}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded border border-slate-200 text-[10px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQsRevisionLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION SUBMIT BAR */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickSetupData({
                      doc_ref: 'ZZP-IT-PE-05/2021',
                      doc_name: 'ISO 27001 & ADHICS v2 Compliance',
                      category: 'Policies',
                      sub_category: 'Information Security & Risk Management',
                      department: 'IT Security & Compliance',
                      classification: 'Restricted',
                      review_date: '2026-06-30',
                      effective_date: '2022-03-01',
                      due_date: '2026-06-30',
                      prepared_by: currentUser?.name || 'CISO / Compliance Lead',
                      reviewed_by: 'Internal Compliance Audit Committee',
                      approved_by: 'Managing Director (Approved 2026-06-30)',
                      page_format: 'A4 Portrait',
                      version_number: '1.0',
                      version_description: 'ISO 27001 & ADHICS v2 Compliance Standard Policy & Register Control',
                      revision_history_logs: [
                        {
                          id: 'vh-qs-1',
                          version_number: '1.0',
                          revision_date: '2022-03-01',
                          changed_by: currentUser?.name || 'CISO / Compliance Lead',
                          change_description: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework',
                          approved_by: 'Managing Director',
                          approval_date: '2026-06-30'
                        }
                      ],
                      mapped_risk_ids: ['RSK-001', 'RSK-003'],
                      mapped_legal_ids: ['LEG-001', 'LEG-002'],
                      mapped_employee_ids: ['EMP-101', 'EMP-102'],
                      mapped_asset_ids: ['AST-001'],
                      mapped_security_zone_ids: ['ZONE-01'],
                      mapped_contract_ids: ['CTR-2026-01'],
                      mapped_doc_ids: [],
                      org_name: 'GLOBAL ENTERPRISE FACILITY & HEALTHCARE GOVERNANCE',
                      compliance_framework: 'ISO 27001 & ADHICS v2 Compliance',
                      header_badge_text: 'OFFICIAL COMPLIANCE CONTROLLED SPECIFICATION',
                      footer_disclaimer: 'CONFIDENTIAL & PROPRIETARY — Issued under Executive Compliance Governance Authority. Unauthorized copying, distribution, or alteration is strictly prohibited.',
                      security_marking: 'RESTRICTED — INTERNAL COMPLIANCE AUDIT ONLY',
                      show_watermark: true,
                      watermark_text: 'RESTRICTED COMPLIANCE COPY'
                    });
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Reset Form
                </button>

                <button
                  type="button"
                  onClick={handleSaveQuickSetup}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckSquare className="w-4 h-4 stroke-[3]" /> Publish & Connect to Master Index
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Live A4 Format Page Previewer (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="sticky top-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 shrink-0">
                    <Printer className="w-4 h-4" /> Live {quickSetupData.page_format} Sheet
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateSecurityZonesPDFReport}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                      title="Print or Export PDF Report for Physical Security Zones"
                    >
                      <Download className="w-3 h-3" /> .PDF Report
                    </button>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      A4 Canvas
                    </span>
                  </div>
                </div>

                {/* Printable A4 Dynamic Sheet Canvas Box with Branding */}
                <div className="bg-white text-slate-900 p-4 rounded-xl shadow-inner border border-slate-300 font-sans space-y-3 min-h-[520px] max-h-[680px] overflow-y-auto flex flex-col justify-between transition-all relative">
                  {/* Watermark Overlay in Preview */}
                  {quickSetupData.show_watermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                      <span className="font-mono font-black text-2xl text-amber-500/10 -rotate-25 select-none uppercase tracking-widest text-center px-4">
                        {quickSetupData.watermark_text || 'OFFICIAL COMPLIANCE COPY'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 relative z-10">
                    {/* Top Organization Compliance Branding Banner */}
                    <div className="border-b border-slate-200 pb-2 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-black text-[9px] uppercase tracking-wider text-slate-900 truncate">
                          {quickSetupData.org_name || 'GLOBAL ENTERPRISE FACILITY & HEALTHCARE GOVERNANCE'}
                        </span>
                        <span className="font-extrabold text-[8px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                          {quickSetupData.header_badge_text || 'COMPLIANCE SPEC'}
                        </span>
                      </div>
                      <div className="text-[8px] font-semibold text-sky-700 truncate">
                        Standards: {quickSetupData.compliance_framework || 'ISO 27001 | OSHAD SF | ADHCIS'}
                      </div>
                    </div>

                    {/* Document Title Header */}
                    <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-black text-[9px] uppercase tracking-widest text-amber-800 block flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-600" /> FACILITY PHYSICAL SECURITY ZONES & REPOSITORY
                        </span>
                        <h4 className="font-black text-slate-900 leading-snug text-xs break-words">{quickSetupData.doc_name || 'Physical Access Control & Security Zones SOP'}</h4>
                      </div>
                      <span className="font-mono font-black text-[9px] bg-slate-100 text-indigo-900 px-1.5 py-0.5 rounded border border-slate-300 shrink-0">
                        {quickSetupData.doc_ref || 'REF-001'}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded border border-slate-200 text-[9px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">Classification:</span>
                        <strong className="text-indigo-900 font-extrabold">{quickSetupData.classification}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Format Option:</span>
                        <strong className="text-emerald-800 font-extrabold">{quickSetupData.page_format}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Approved Date:</span>
                        <strong className="text-slate-800">{quickSetupData.effective_date}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Review Date:</span>
                        <strong className="text-slate-800">{quickSetupData.review_date}</strong>
                      </div>
                    </div>

                    {/* Approvals Block */}
                    <div className="space-y-1 text-[9px] bg-indigo-50/50 p-2 rounded border border-indigo-100">
                      <div><span className="text-slate-500">Prepared By:</span> <strong>{quickSetupData.prepared_by || 'Author'}</strong></div>
                      {quickSetupData.reviewed_by && <div><span className="text-slate-500">Reviewed By:</span> <strong>{quickSetupData.reviewed_by}</strong></div>}
                      <div><span className="text-slate-500">Approved By:</span> <strong>{quickSetupData.approved_by || 'Approver'}</strong></div>
                    </div>

                    {/* Facility Physical Security Zones Cards in Dynamic View */}
                    <div className="space-y-1.5 border-t border-slate-200 pt-2 text-[9px]">
                      <div className="flex items-center justify-between">
                        <span className="font-black uppercase text-amber-900 text-[8.5px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-600" /> Physical Security Zones ({
                            quickSetupData.mapped_security_zone_ids.length > 0
                              ? quickSetupData.mapped_security_zone_ids.length
                              : DEFAULT_SECURITY_ZONES.length
                          })
                        </span>
                        <button
                          type="button"
                          onClick={handleGenerateSecurityZonesPDFReport}
                          className="text-[8px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer border border-amber-300 transition-colors"
                        >
                          Print PDF
                        </button>
                      </div>

                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {(quickSetupData.mapped_security_zone_ids.length > 0
                          ? DEFAULT_SECURITY_ZONES.filter(z => quickSetupData.mapped_security_zone_ids.includes(z.id))
                          : DEFAULT_SECURITY_ZONES
                        ).map(z => (
                          <div key={z.id} className="p-1.5 bg-amber-50/70 rounded border border-amber-200/80 grid grid-cols-12 items-center gap-1 text-[8.5px] leading-snug">
                            <div className="col-span-9 font-semibold text-slate-800 truncate">
                              <strong className="font-mono text-amber-900">{z.id}:</strong> {z.title}
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="bg-amber-200 text-amber-950 font-extrabold px-1.5 py-0.2 rounded text-[7.5px] inline-block truncate">
                                {z.level}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6 Connected Registers Summary */}
                    <div className="space-y-1 border-t border-slate-200 pt-2 text-[9px]">
                      <span className="font-black uppercase text-slate-600 block text-[8px]">Connected Registers ({
                        quickSetupData.mapped_risk_ids.length +
                        quickSetupData.mapped_legal_ids.length +
                        quickSetupData.mapped_employee_ids.length +
                        quickSetupData.mapped_asset_ids.length +
                        quickSetupData.mapped_security_zone_ids.length +
                        quickSetupData.mapped_contract_ids.length
                      })</span>
                      <div className="flex flex-wrap gap-1">
                        {quickSetupData.mapped_risk_ids.length > 0 && <span className="bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_risk_ids.length} Risks</span>}
                        {quickSetupData.mapped_legal_ids.length > 0 && <span className="bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_legal_ids.length} Legal</span>}
                        {quickSetupData.mapped_employee_ids.length > 0 && <span className="bg-sky-100 text-sky-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_employee_ids.length} Staff</span>}
                        {quickSetupData.mapped_asset_ids.length > 0 && <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_asset_ids.length} Assets</span>}
                        {quickSetupData.mapped_security_zone_ids.length > 0 && <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_security_zone_ids.length} Zones</span>}
                        {quickSetupData.mapped_contract_ids.length > 0 && <span className="bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded font-bold">{quickSetupData.mapped_contract_ids.length} Contracts</span>}
                      </div>
                    </div>
                  </div>

                  {/* Footer Compliance Branding Preview Box */}
                  <div className="border-t-2 border-amber-500 pt-2 text-[8px] text-center space-y-0.5 relative z-10 bg-slate-50/80 p-1.5 rounded border border-slate-200 mt-2">
                    <div className="font-mono font-black text-rose-800 uppercase tracking-tight text-[8.5px]">
                      {quickSetupData.security_marking || 'STRICTLY CONFIDENTIAL'}
                    </div>
                    <p className="text-slate-500 line-clamp-2 leading-tight">
                      {quickSetupData.footer_disclaimer || 'Official Controlled Document.'}
                    </p>
                    <div className="text-[7.5px] font-mono text-slate-400">
                      Ref: {quickSetupData.doc_ref || 'REF-001'} | Page 1 of 1
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Clicking "Publish & Connect to Master Index" will inject this document into the live repository and connect all 6 system registers instantly.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 1: VIEW DOCUMENT DETAILS & PRINTABLE SHEET */}
      {/* ========================================================================== */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="printable-document" className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    Master Document Control Sheet
                  </span>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <FileText className="w-3 h-3 text-indigo-600" />
                    Page Format: {viewingDoc.page_format || 'A4 Portrait'}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getClassificationBadge(viewingDoc.classification as any)}`}>
                    Classification: {viewingDoc.classification || 'Confidential'}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug">{viewingDoc.document_name}</h3>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QMS Formatted Control Header Sheet */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="font-mono text-xs font-black text-indigo-800 bg-indigo-100/80 px-3 py-1 rounded-lg border border-indigo-300">
                  DOCUMENT REFERENCE: {viewingDoc.document_reference || viewingDoc.document_number || viewingDoc.document_id}
                </div>
                <div className="text-[11px] font-bold text-slate-600">
                  Version: <span className="font-mono text-indigo-700 font-extrabold">{viewingDoc.version || 'v1.0'}</span>
                </div>
              </div>

              {/* Grid 1: Reference & Classification */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Document Reference</span>
                  <span className="font-mono font-black text-indigo-700">{viewingDoc.document_reference || viewingDoc.document_number || viewingDoc.document_id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Classification</span>
                  <span className="font-bold text-purple-700">{viewingDoc.classification || 'Confidential'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Category / Type</span>
                  <span className="font-bold text-emerald-700">{viewingDoc.category} ({viewingDoc.sub_category || 'General'})</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Department</span>
                  <span className="font-bold text-slate-800">{viewingDoc.department || 'Quality & Compliance'}</span>
                </div>
              </div>

              {/* Grid 2: Control Dates */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">APPROVED / EFFECTIVE DATE</span>
                  <span className="font-mono font-bold text-slate-900">{viewingDoc.effective_date || viewingDoc.approval_date || viewingDoc.issue_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">REVIEW DATE</span>
                  <span className="font-mono font-bold text-slate-900">{viewingDoc.next_review_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">DUE DATE</span>
                  <span className="font-mono font-bold text-indigo-700">{viewingDoc.due_date || 'N/A'}</span>
                </div>
              </div>

              {/* Grid 3: Sign-Off Stakeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">PREPARED BY</span>
                  <span className="font-bold text-slate-900">{viewingDoc.prepared_by || 'Compliance Lead'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">REVIEWED BY</span>
                  <span className="font-bold text-slate-800">{viewingDoc.reviewed_by || 'Optional / N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">APPROVED BY</span>
                  <span className="font-bold text-slate-900">{viewingDoc.approved_by || 'Managing Director'}</span>
                </div>
              </div>
            </div>

            {/* Change Summary & Remarks */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="font-bold text-indigo-900 block mb-0.5">Scope & Purpose:</span>
                <p className="text-slate-700">{viewingDoc.change_summary || viewingDoc.remarks}</p>
              </div>

              {viewingDoc.sample_doc_name && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Attached Document Template: {viewingDoc.sample_doc_name}</span>
                  </div>
                  {viewingDoc.sample_doc_url && (
                    <a
                      href={viewingDoc.sample_doc_url}
                      download={viewingDoc.sample_doc_name}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Download .DOC
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Custom Register / Facility Contacts & Risk Management Detail Section */}
            {(viewingDoc.document_id === 'REG-RSK-001' || viewingDoc.document_id === 'REG-RRC-001' || viewingDoc.source_type === 'FACILITY_CONTACTS') && (
              <div className="space-y-3">
                {/* 1. Authorized Personnel Contacts */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px]">
                        Risk Review Committee / Authorized Personnel Contacts
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-extrabold text-amber-950 block text-[10px] uppercase tracking-wider">Authorized Representative</span>
                      <p className="text-slate-900 font-black text-xs mt-0.5">{client?.auth_representative?.name || 'DR TITTY MATHEW'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">{client?.auth_representative?.email || 'titty@alkhajamedicalcenter.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">{client?.auth_representative?.phone || '+971 56 6437407'}</p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-extrabold text-amber-950 block text-[10px] uppercase tracking-wider">Clinic Manager</span>
                      <p className="text-slate-900 font-black text-xs mt-0.5">{client?.clinic_manager?.name || 'Clinic Manager'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">{client?.clinic_manager?.email || 'manager@alkhajamedicalcenter.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">{client?.clinic_manager?.phone || '+971 2 6720048'}</p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-extrabold text-amber-950 block text-[10px] uppercase tracking-wider">Medical Director</span>
                      <p className="text-slate-900 font-black text-xs mt-0.5">{client?.medical_director?.name || 'DR TITTY MATHEW'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">{client?.medical_director?.email || 'info@alkhajamedicalcenter.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">{client?.medical_director?.phone || '+971 2 6720048'}</p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-extrabold text-amber-950 block text-[10px] uppercase tracking-wider">IT Manager / Administrator</span>
                      <p className="text-slate-900 font-black text-xs mt-0.5">{client?.it_manager?.name || 'Aseef Sulaiman'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">{client?.it_manager?.email || 'info@smartpro.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">{client?.it_manager?.phone || '+971 52 4846770'}</p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="font-extrabold text-amber-950 block text-[10px] uppercase tracking-wider">HR Manager</span>
                      <p className="text-slate-900 font-black text-xs mt-0.5">{client?.hr_manager?.name || 'HR Manager'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">{client?.hr_manager?.email || 'hr@alkhajamedicalcenter.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">{client?.hr_manager?.phone || '+971 2 6720048'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Third-Party Support Channels */}
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2.5 text-xs">
                  <span className="font-extrabold text-sky-950 uppercase tracking-wider text-[11px] block border-b border-sky-200 pb-1.5">
                    Third-Party Support Channels
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-sky-200 shadow-2xs">
                      <span className="font-extrabold text-sky-900 block text-[10px] uppercase">IT Support Team (Third-Party)</span>
                      <p className="text-slate-500 text-[10px]">e.g. Apex Security Solutions / SmartPro</p>
                      <p className="text-slate-900 font-black text-xs mt-1">Support Provider: {client?.it_support?.team_name || 'Aseef Sulaiman'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">Support Email: {client?.it_support?.email || 'info@smartpro.ae'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">Support Phone: {client?.it_support?.phone || '+971 52 4846770'}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-sky-200 shadow-2xs">
                      <span className="font-extrabold text-sky-900 block text-[10px] uppercase">EMR Support Team (Third-Party)</span>
                      <p className="text-slate-500 text-[10px]">e.g. CureMD Regional Support / SafeCare</p>
                      <p className="text-slate-900 font-black text-xs mt-1">EMR Provider Name: {client?.emr_support?.team_name || 'Beema Yoosaf'}</p>
                      <p className="text-slate-600 font-mono text-[10px] mt-0.5">Support Email: {client?.emr_support?.email || 'beema@safecaretec.com'}</p>
                      <p className="text-slate-600 font-mono text-[10px]">Support Phone: {client?.emr_support?.phone || '+971 2 506 7300'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Document Metadata & Risk Naming Options */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">Document Metadata</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Doc Ref Code</span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100 inline-block">{viewingDoc.document_number || client?.doc_ref || 'ZZP-IT-PE-05/2021'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Classification</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100 inline-block">{viewingDoc.classification || client?.doc_classification || 'RESTRICTED'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Doc. Issue Date</span>
                        <span className="font-medium text-slate-800">{formatDateDMY(viewingDoc.issue_date) || formatDateDMY(client?.doc_issue_date) || '01/03/2022'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Approved Date</span>
                        <span className="font-medium text-slate-800">{formatDateDMY(viewingDoc.approval_date) || formatDateDMY(client?.doc_approved_date) || '30/06/2026'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Version</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200 inline-block">{viewingDoc.version || client?.doc_version || '1.0'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider block border-b border-slate-200 pb-1">Risk ID Naming Options</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Risk ID Prefix</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200 inline-block">AKMC-RR</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Start Index Number</span>
                        <span className="font-mono font-bold text-slate-800">1</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Sequence Padding</span>
                        <span className="font-medium text-slate-800">3 digits (001)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Live Preview Format</span>
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded text-[10px] border border-indigo-200 inline-block">AKMC-RR-001</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cross-Connected Risk Register Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {(() => {
                const activeMapping = docMappings[viewingDoc.id] || docMappings[viewingDoc.document_id] || (viewingDoc.document_number ? docMappings[viewingDoc.document_number] : undefined);
                const effectiveRiskIds = Array.from(new Set([...(viewingDoc.mapped_risk_ids || []), ...(activeMapping?.risk_ids || [])]));
                const effectiveAssetIds = Array.from(new Set([...(viewingDoc.mapped_asset_ids || []), ...(activeMapping?.asset_ids || [])]));
                const effectiveDocIds = Array.from(new Set([...(viewingDoc.mapped_doc_ids || []), ...(activeMapping?.doc_ids || [])]));

                const connectedRisks = risks.filter(r => effectiveRiskIds.includes(r.id) || effectiveRiskIds.includes(r.risk_id));
                const connectedAssets = assets.filter(a => effectiveAssetIds.includes(a.id) || effectiveAssetIds.includes(a.asset_code));
                const connectedDocs = allMasterDocuments.filter(other =>
                  other.id !== viewingDoc.id && (
                    effectiveDocIds.includes(other.id) ||
                    effectiveDocIds.includes(other.document_id) ||
                    (other.mapped_doc_ids || []).includes(viewingDoc.id) ||
                    (other.mapped_doc_ids || []).includes(viewingDoc.document_id)
                  )
                );

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-purple-600" />
                        <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">
                          Cross-Connected Risk Register Items ({connectedRisks.length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const docToMap = viewingDoc;
                          setViewingDoc(null);
                          openMappingModal(docToMap);
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Manage Mappings</span>
                      </button>
                    </div>

                    {connectedRisks.length === 0 ? (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
                        No Risk Register items mapped to this document yet. Click 'Manage Mappings' above to link risks.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {connectedRisks.map(r => (
                          <div key={r.id} className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/70 text-xs flex items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded border border-purple-300">
                                  {r.risk_id || 'RSK-001'}
                                </span>
                                <span className="text-[9px] font-extrabold text-purple-800 uppercase">{r.domain || 'GRC'}</span>
                              </div>
                              <p className="font-bold text-slate-800 text-[11px] truncate" title={r.risk_title}>{r.risk_title}</p>
                            </div>
                            <span className="font-mono text-[9px] font-black bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-900 shrink-0">
                              Score: {r.risk_rating || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cross-Connected Assets Inventory */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">
                            Cross-Connected Asset Inventory ({connectedAssets.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const docToMap = viewingDoc;
                            setViewingDoc(null);
                            openMappingModal(docToMap);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Link Assets</span>
                        </button>
                      </div>

                      {connectedAssets.length === 0 ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
                          No Asset Inventory items mapped to this document. Click 'Link Assets' above to cross-connect hardware, systems or facilities.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {connectedAssets.map(a => (
                            <div key={a.id} className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/70 text-xs flex items-center justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-[10px] bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300">
                                    {a.asset_code}
                                  </span>
                                  <span className="text-[9px] font-extrabold text-emerald-800 uppercase">{a.asset_type}</span>
                                </div>
                                <p className="font-bold text-slate-800 text-[11px] truncate" title={a.asset_name}>{a.asset_name}</p>
                              </div>
                              <span className="text-[9px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                Active Asset
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Inter-Connected Related Master Documents */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Link2 className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider">
                            Connected Related Master Documents & Policies ({connectedDocs.length})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const docToMap = viewingDoc;
                            setViewingDoc(null);
                            openMappingModal(docToMap);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        >
                          <Network className="w-3 h-3" />
                          <span>Connect Documents</span>
                        </button>
                      </div>

                      {connectedDocs.length === 0 ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
                          No related master documents linked yet. Click 'Connect Documents' to establish inter-document cross-connects.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {connectedDocs.map(cDoc => (
                            <div
                              key={cDoc.id}
                              onClick={() => setViewingDoc(cDoc)}
                              className="bg-indigo-50/60 hover:bg-indigo-100/80 p-2.5 rounded-xl border border-indigo-200 text-xs flex items-center justify-between gap-2 cursor-pointer transition-all group shadow-2xs"
                              title="Click to view connected document popup"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-[10px] bg-indigo-100 text-indigo-950 px-1.5 py-0.2 rounded border border-indigo-300">
                                    {cDoc.document_id || cDoc.document_number}
                                  </span>
                                  <span className="text-[9px] font-black uppercase text-indigo-800">{cDoc.category}</span>
                                </div>
                                <p className="font-extrabold text-slate-900 text-[11px] truncate group-hover:text-indigo-700">{cDoc.document_name}</p>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-200 shrink-0 flex items-center gap-1">
                                Open <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Version History Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Version Control & Revision History Logs
                </h4>
                <button
                  type="button"
                  onClick={() => openBumpModal(viewingDoc)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                >
                  + Add Version & MAP
                </button>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                {(viewingDoc.version_history && viewingDoc.version_history.length > 0
                  ? viewingDoc.version_history
                  : [
                      { id: 'vh1', version_number: client?.doc_version || '1.0', revision_date: formatDateDMY(client?.doc_issue_date) || '01/03/2022', changed_by: 'Managing Director / IT Lead', change_description: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
                    ]
                ).map(v => {
                  const numRisks = (v.mapped_risk_ids || viewingDoc.mapped_risk_ids || []).length;
                  const numAssets = (v.mapped_asset_ids || viewingDoc.mapped_asset_ids || []).length;
                  const numDocs = (v.mapped_doc_ids || viewingDoc.mapped_doc_ids || []).length;

                  return (
                    <div key={v.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] text-center border border-indigo-100">{v.version_number}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{v.revision_date}</span>
                          <span className="font-bold text-slate-800 truncate">• {v.changed_by}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditVersionModal(viewingDoc, v)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Edit Version Log & MAP Connections"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVersionRecord(viewingDoc, v.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete Version Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-700 text-[11px] leading-tight font-medium pl-1">{v.change_description}</p>

                      {/* MAP CONNECTION BADGES FOR THIS REVISION */}
                      {(numRisks > 0 || numAssets > 0 || numDocs > 0) && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-[9px] font-extrabold">
                          <span className="text-purple-900 flex items-center gap-0.5">
                            <Network className="w-3 h-3 text-purple-600" /> MAP Links:
                          </span>
                          {numRisks > 0 && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">{numRisks} Risks</span>}
                          {numAssets > 0 && <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">{numAssets} Assets</span>}
                          {numDocs > 0 && <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-200">{numDocs} Documents</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    const docCode = viewingDoc.document_id || viewingDoc.document_number;
                    setViewingDoc(null);
                    if (docCode === 'REG-RSK-001') onNavigateTab('risks');
                    else if (docCode === 'REG-AST-001') onNavigateTab('assets');
                    else if (docCode === 'REG-INC-001') onNavigateTab('incidents');
                    else if (docCode === 'REG-SEC-001') onNavigateTab('secure-area');
                    else if (docCode === 'REG-AUD-001') onNavigateTab('audits');
                    else if (docCode === 'REG-RRC-001') onNavigateTab('clients');
                    else if (docCode === 'REG-CAPA-001') onNavigateTab('capa');
                    else if (viewingDoc.category === 'Policies') onNavigateTab('policies');
                    else if (viewingDoc.category === 'Forms') onNavigateTab('forms');
                    else onNavigateTab('repository');
                  }}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Module Register</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const docToEdit = viewingDoc;
                    setViewingDoc(null);
                    setEditingDoc(docToEdit);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Edit Document Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 2: EDIT DOCUMENT METADATA */}
      {/* ========================================================================== */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveDocEdit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase">Document Index Editor</span>
                <h3 className="font-black text-slate-900 text-sm">Edit Master Document Metadata</h3>
              </div>
              <button type="button" onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document ID / Code</label>
                <input
                  type="text"
                  value={editingDoc.document_id || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, document_id: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Doc Ref Code (Ref)</label>
                <input
                  type="text"
                  value={editingDoc.document_number || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, document_number: e.target.value })}
                  placeholder="e.g. COMP-DOC-01"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-indigo-700 bg-indigo-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={editingDoc.category}
                  onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                >
                  <option value="Policies">Policies</option>
                  <option value="Procedures">Procedures</option>
                  <option value="Forms">Forms</option>
                  <option value="Registers">Registers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Document Name / Title</label>
              <input
                type="text"
                value={editingDoc.document_name}
                onChange={e => setEditingDoc({ ...editingDoc, document_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-extrabold text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingDoc.department}
                  onChange={e => setEditingDoc({ ...editingDoc, department: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Classification</label>
                <select
                  value={editingDoc.classification}
                  onChange={e => setEditingDoc({ ...editingDoc, classification: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                >
                  <option value="Public">Public</option>
                  <option value="Internal">Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingDoc.status}
                  onChange={e => setEditingDoc({ ...editingDoc, status: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Published">Published</option>
                  <option value="Obsolete">Obsolete</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Version Number</label>
                <input
                  type="text"
                  value={editingDoc.version}
                  onChange={e => setEditingDoc({ ...editingDoc, version: e.target.value })}
                  placeholder="e.g. 2.2 [Live]"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold text-amber-800 bg-amber-50/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doc Issue Date</label>
                <input
                  type="text"
                  value={editingDoc.issue_date || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, issue_date: e.target.value })}
                  placeholder="e.g. 2025-01-10"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approved Date</label>
                <input
                  type="text"
                  value={editingDoc.approval_date || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, approval_date: e.target.value })}
                  placeholder="e.g. 2026-05-12"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="text"
                  value={editingDoc.effective_date || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, effective_date: e.target.value })}
                  placeholder="DD-MM-YYYY"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Date</label>
                <input
                  type="text"
                  value={editingDoc.revision_date || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, revision_date: e.target.value })}
                  placeholder="DD-MM-YYYY"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Next Review Date</label>
                <input
                  type="text"
                  value={editingDoc.next_review_date || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, next_review_date: e.target.value })}
                  placeholder="DD-MM-YYYY"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Frequency</label>
                <input
                  type="text"
                  value={editingDoc.review_frequency || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, review_frequency: e.target.value })}
                  placeholder="Annually or upon regulatory change"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Retention Period</label>
                <input
                  type="text"
                  value={editingDoc.retention_period || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, retention_period: e.target.value })}
                  placeholder="As per UAE legal requirements"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Main Category</label>
                <input
                  type="text"
                  value={editingDoc.main_category || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, main_category: e.target.value })}
                  placeholder="e.g. Human Resources"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Category</label>
                <input
                  type="text"
                  value={editingDoc.sub_category || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, sub_category: e.target.value })}
                  placeholder="e.g. Document Control"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
            </div>

            {(editingDoc.document_id === 'REG-RSK-001' || editingDoc.document_id === 'REG-RRC-001' || editingDoc.source_type === 'FACILITY_CONTACTS') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs">
                <span className="font-extrabold text-amber-900 block text-xs uppercase">Authorized Personnel & Committee Contact Details</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Auth Rep Name</label>
                    <input
                      type="text"
                      value={(editingDoc as any).auth_rep_name ?? client?.auth_representative?.name ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, auth_rep_name: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Auth Rep Email</label>
                    <input
                      type="text"
                      value={(editingDoc as any).auth_rep_email ?? client?.auth_representative?.email ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, auth_rep_email: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Auth Rep Phone</label>
                    <input
                      type="text"
                      value={(editingDoc as any).auth_rep_phone ?? client?.auth_representative?.phone ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, auth_rep_phone: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Clinic Manager Name</label>
                    <input
                      type="text"
                      value={(editingDoc as any).clinic_mgr_name ?? client?.clinic_manager?.name ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, clinic_mgr_name: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Clinic Manager Email</label>
                    <input
                      type="text"
                      value={(editingDoc as any).clinic_mgr_email ?? client?.clinic_manager?.email ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, clinic_mgr_email: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Clinic Manager Phone</label>
                    <input
                      type="text"
                      value={(editingDoc as any).clinic_mgr_phone ?? client?.clinic_manager?.phone ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, clinic_mgr_phone: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Medical Director Name</label>
                    <input
                      type="text"
                      value={(editingDoc as any).med_dir_name ?? client?.medical_director?.name ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, med_dir_name: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Medical Director Email</label>
                    <input
                      type="text"
                      value={(editingDoc as any).med_dir_email ?? client?.medical_director?.email ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, med_dir_email: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">Medical Director Phone</label>
                    <input
                      type="text"
                      value={(editingDoc as any).med_dir_phone ?? client?.medical_director?.phone ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, med_dir_phone: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">IT Manager Name</label>
                    <input
                      type="text"
                      value={(editingDoc as any).it_admin_name ?? client?.it_manager?.name ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, it_admin_name: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">IT Manager Email</label>
                    <input
                      type="text"
                      value={(editingDoc as any).it_admin_email ?? client?.it_manager?.email ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, it_admin_email: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">IT Manager Phone</label>
                    <input
                      type="text"
                      value={(editingDoc as any).it_admin_phone ?? client?.it_manager?.phone ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, it_admin_phone: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">HR Manager Name</label>
                    <input
                      type="text"
                      value={(editingDoc as any).hr_mgr_name ?? client?.hr_manager?.name ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, hr_mgr_name: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">HR Manager Email</label>
                    <input
                      type="text"
                      value={(editingDoc as any).hr_mgr_email ?? client?.hr_manager?.email ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, hr_mgr_email: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900">HR Manager Phone</label>
                    <input
                      type="text"
                      value={(editingDoc as any).hr_mgr_phone ?? client?.hr_manager?.phone ?? ''}
                      onChange={e => setEditingDoc({ ...editingDoc, hr_mgr_phone: e.target.value } as any)}
                      className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                    />
                  </div>
                </div>

                <div className="border-t border-amber-200 pt-2 space-y-2">
                  <span className="font-extrabold text-amber-900 block text-[11px] uppercase">Third-Party Support Channels</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">IT Support Provider Name</label>
                      <input
                        type="text"
                        value={(editingDoc as any).it_supp_name ?? client?.it_support?.team_name ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, it_supp_name: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">IT Support Email</label>
                      <input
                        type="text"
                        value={(editingDoc as any).it_supp_email ?? client?.it_support?.email ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, it_supp_email: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">IT Support Phone</label>
                      <input
                        type="text"
                        value={(editingDoc as any).it_supp_phone ?? client?.it_support?.phone ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, it_supp_phone: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">EMR Provider Name</label>
                      <input
                        type="text"
                        value={(editingDoc as any).emr_supp_name ?? client?.emr_support?.team_name ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, emr_supp_name: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">EMR Support Email</label>
                      <input
                        type="text"
                        value={(editingDoc as any).emr_supp_email ?? client?.emr_support?.email ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, emr_supp_email: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">EMR Support Phone</label>
                      <input
                        type="text"
                        value={(editingDoc as any).emr_supp_phone ?? client?.emr_support?.phone ?? ''}
                        onChange={e => setEditingDoc({ ...editingDoc, emr_supp_phone: e.target.value } as any)}
                        className="w-full text-xs p-1.5 bg-white rounded border border-amber-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Owner / Prepared By</label>
                <input
                  type="text"
                  value={editingDoc.prepared_by || editingDoc.owner || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, prepared_by: e.target.value, owner: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approved By</label>
                <input
                  type="text"
                  value={editingDoc.approved_by || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, approved_by: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                />
              </div>
            </div>

            {/* Version History Table & Add Version Options */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Version History</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                      ? editingDoc.version_history
                      : [
                          { id: 'vh1', version_number: '2.1 [Live]', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Live Online Version' },
                          { id: 'vh2', version_number: 'V2.0', revision_date: '2026-05-29', changed_by: 'Managing Director', change_description: 'Updated Register as per ADHCIS v2 standards' },
                          { id: 'vh3', version_number: 'V1.1', revision_date: '2025-05-15', changed_by: 'Risk Officer', change_description: 'Risk Register revision' }
                        ];
                    const nextVerNum = (currentHist.length + 1).toFixed(1);
                    const today = formatDateDMY(new Date());
                    const newEntry = {
                      id: `vh_${Date.now()}`,
                      version_number: nextVerNum,
                      revision_date: today,
                      changed_by: editingDoc.prepared_by || 'Compliance Manager',
                      change_description: 'Updated document metadata and regulatory controls.'
                    };
                    setEditingDoc({
                      ...editingDoc,
                      version_history: [...currentHist, newEntry]
                    });
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Version</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[9.5px] tracking-wider bg-slate-100/70">
                      <th className="py-1.5 px-2">Version</th>
                      <th className="py-1.5 px-2">Date</th>
                      <th className="py-1.5 px-2">Author</th>
                      <th className="py-1.5 px-2">Summary of Changes / Remarks</th>
                      <th className="py-1.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {(editingDoc.version_history && editingDoc.version_history.length > 0
                      ? editingDoc.version_history
                      : [
                          { id: 'vh1', version_number: '2.2 [Live]', revision_date: '2026-05-29', changed_by: 'Compliance Manager', change_description: 'Live Online Version' },
                          { id: 'vh2', version_number: 'V2.1', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Online' },
                          { id: 'vh3', version_number: 'V2.0', revision_date: '2025-05-15', changed_by: 'Managing Director', change_description: 'ADHICS' },
                          { id: 'vh4', version_number: 'V1.1', revision_date: '2024-06-05', changed_by: 'Compliance Officer', change_description: 'Revision' }
                        ]
                    ).map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-1.5 px-2 font-mono font-bold text-indigo-700">
                          <input
                            type="text"
                            value={v.version_number}
                            onChange={e => {
                              const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                                ? editingDoc.version_history
                                : [
                                    { id: 'vh1', version_number: '2.2 [Live]', revision_date: '2026-05-29', changed_by: 'Compliance Manager', change_description: 'Live Online Version' },
                                    { id: 'vh2', version_number: 'V2.1', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Online' },
                                    { id: 'vh3', version_number: 'V2.0', revision_date: '2025-05-15', changed_by: 'Managing Director', change_description: 'ADHICS' },
                                    { id: 'vh4', version_number: 'V1.1', revision_date: '2024-06-05', changed_by: 'Compliance Officer', change_description: 'Revision' }
                                  ];
                              const updated = currentHist.map((item, i) => i === idx ? { ...item, version_number: e.target.value } : item);
                              setEditingDoc({ ...editingDoc, version_history: updated });
                            }}
                            className="w-20 p-1 rounded border border-slate-200 font-mono font-bold text-indigo-700 text-[10px]"
                          />
                        </td>
                        <td className="py-1.5 px-2 font-mono text-slate-600">
                          <input
                            type="text"
                            value={v.revision_date}
                            onChange={e => {
                              const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                                ? editingDoc.version_history
                                : [
                                    { id: 'vh1', version_number: '2.2 [Live]', revision_date: '2026-05-29', changed_by: 'Compliance Manager', change_description: 'Live Online Version' },
                                    { id: 'vh2', version_number: 'V2.1', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Online' },
                                    { id: 'vh3', version_number: 'V2.0', revision_date: '2025-05-15', changed_by: 'Managing Director', change_description: 'ADHICS' },
                                    { id: 'vh4', version_number: 'V1.1', revision_date: '2024-06-05', changed_by: 'Compliance Officer', change_description: 'Revision' }
                                  ];
                              const updated = currentHist.map((item, i) => i === idx ? { ...item, revision_date: e.target.value } : item);
                              setEditingDoc({ ...editingDoc, version_history: updated });
                            }}
                            className="w-24 p-1 rounded border border-slate-200 text-[10px]"
                          />
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-800">
                          <input
                            type="text"
                            value={v.changed_by}
                            onChange={e => {
                              const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                                ? editingDoc.version_history
                                : [
                                    { id: 'vh1', version_number: '2.2 [Live]', revision_date: '2026-05-29', changed_by: 'Compliance Manager', change_description: 'Live Online Version' },
                                    { id: 'vh2', version_number: 'V2.1', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Online' },
                                    { id: 'vh3', version_number: 'V2.0', revision_date: '2025-05-15', changed_by: 'Managing Director', change_description: 'ADHICS' },
                                    { id: 'vh4', version_number: 'V1.1', revision_date: '2024-06-05', changed_by: 'Compliance Officer', change_description: 'Revision' }
                                  ];
                              const updated = currentHist.map((item, i) => i === idx ? { ...item, changed_by: e.target.value } : item);
                              setEditingDoc({ ...editingDoc, version_history: updated });
                            }}
                            className="w-28 p-1 rounded border border-slate-200 text-[10px] font-bold"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-slate-700">
                          <input
                            type="text"
                            value={v.change_description}
                            onChange={e => {
                              const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                                ? editingDoc.version_history
                                : [
                                    { id: 'vh1', version_number: '2.2 [Live]', revision_date: '2026-05-29', changed_by: 'Compliance Manager', change_description: 'Live Online Version' },
                                    { id: 'vh2', version_number: 'V2.1', revision_date: '2026-05-29', changed_by: 'IT Manager', change_description: 'Online' },
                                    { id: 'vh3', version_number: 'V2.0', revision_date: '2025-05-15', changed_by: 'Managing Director', change_description: 'ADHICS' },
                                    { id: 'vh4', version_number: 'V1.1', revision_date: '2024-06-05', changed_by: 'Compliance Officer', change_description: 'Revision' }
                                  ];
                              const updated = currentHist.map((item, i) => i === idx ? { ...item, change_description: e.target.value } : item);
                              setEditingDoc({ ...editingDoc, version_history: updated });
                            }}
                            className="w-full p-1 rounded border border-slate-200 text-[10px]"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const currentHist = editingDoc.version_history && editingDoc.version_history.length > 0
                                ? editingDoc.version_history
                                : [
                                    { id: 'vh1', version_number: '1.0', revision_date: '21/12/2023', changed_by: 'IT Manager', change_description: 'Initial Draft release of the Compliance framework.' },
                                    { id: 'vh2', version_number: '2.0', revision_date: '15/01/2025', changed_by: 'Managing Director', change_description: 'Enforcement review and alignment with ADHICS v2 protocols.' }
                                  ];
                              const updated = currentHist.filter((_, i) => i !== idx);
                              setEditingDoc({ ...editingDoc, version_history: updated });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove Version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 3: VERSION BUMP REVISION & MAP CONNECTIONS */}
      {/* ========================================================================== */}
      {bumpVersionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleExecuteVersionBump} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase">Version Control & Revision Logs</span>
                <h3 className="font-black text-slate-900 text-sm">Publish New Version Revision & Link MAP Options</h3>
              </div>
              <button type="button" onClick={() => setBumpVersionDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
              Publishing new revision for <strong>"{bumpVersionDoc.document_name}"</strong> ({bumpVersionDoc.version})
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Version Number *</label>
                  <input
                    type="text"
                    value={bumpData.new_version}
                    onChange={e => setBumpData({ ...bumpData, new_version: e.target.value })}
                    placeholder="e.g. v2.0 or v1.1"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision Date *</label>
                  <input
                    type="date"
                    value={bumpData.revision_date}
                    onChange={e => setBumpData({ ...bumpData, revision_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Changed By / Author *</label>
                <input
                  type="text"
                  value={bumpData.changed_by}
                  onChange={e => setBumpData({ ...bumpData, changed_by: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Change Summary *</label>
                <textarea
                  rows={2}
                  value={bumpData.change_description}
                  onChange={e => setBumpData({ ...bumpData, change_description: e.target.value })}
                  placeholder="Summarize the changes and updates made in this version..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                  required
                />
              </div>

              {/* MAP CONNECTIONS FOR THIS REVISION */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-900 block flex items-center gap-1">
                  <Network className="w-3.5 h-3.5 text-purple-700" /> MAP Options for Version {bumpData.new_version || 'Revision'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connect Risks ({bumpData.mapped_risk_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-purple-200 space-y-1">
                      {risks.map(r => {
                        const isChecked = bumpData.mapped_risk_ids.includes(r.id) || bumpData.mapped_risk_ids.includes(r.risk_id);
                        return (
                          <label key={r.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-purple-50 cursor-pointer">
                            <span className="truncate">{r.risk_id || 'RSK'}: {r.risk_title}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setBumpData({ ...bumpData, mapped_risk_ids: [...bumpData.mapped_risk_ids, r.id] });
                                else setBumpData({ ...bumpData, mapped_risk_ids: bumpData.mapped_risk_ids.filter(id => id !== r.id && id !== r.risk_id) });
                              }}
                              className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connect Assets ({bumpData.mapped_asset_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-emerald-200 space-y-1">
                      {assets.map(a => {
                        const isChecked = bumpData.mapped_asset_ids.includes(a.id) || bumpData.mapped_asset_ids.includes(a.asset_code);
                        return (
                          <label key={a.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-emerald-50 cursor-pointer">
                            <span className="truncate">{a.asset_code}: {a.asset_name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setBumpData({ ...bumpData, mapped_asset_ids: [...bumpData.mapped_asset_ids, a.id] });
                                else setBumpData({ ...bumpData, mapped_asset_ids: bumpData.mapped_asset_ids.filter(id => id !== a.id && id !== a.asset_code) });
                              }}
                              className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connect Docs ({bumpData.mapped_doc_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-indigo-200 space-y-1">
                      {allMasterDocuments.filter(d => d.id !== bumpVersionDoc.id).map(d => {
                        const isChecked = bumpData.mapped_doc_ids.includes(d.id) || bumpData.mapped_doc_ids.includes(d.document_id);
                        return (
                          <label key={d.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-indigo-50 cursor-pointer">
                            <span className="truncate">{d.document_id}: {d.document_name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setBumpData({ ...bumpData, mapped_doc_ids: [...bumpData.mapped_doc_ids, d.id] });
                                else setBumpData({ ...bumpData, mapped_doc_ids: bumpData.mapped_doc_ids.filter(id => id !== d.id && id !== d.document_id) });
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBumpVersionDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-black cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Publish & Save MAP
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 6: EDIT VERSION REVISION RECORD & MAP OPTIONS */}
      {/* ========================================================================== */}
      {editingVersionDoc && editingVersionRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveVersionEdit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase">Version Revision Logs</span>
                <h3 className="font-black text-slate-900 text-sm">Edit Version Record & MAP Connections</h3>
              </div>
              <button type="button" onClick={() => { setEditingVersionDoc(null); setEditingVersionRecord(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-xs text-indigo-950 font-semibold">
              Editing version revision log for <strong>"{editingVersionDoc.document_name}"</strong>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Version Number *</label>
                  <input
                    type="text"
                    value={editVersionData.version_number}
                    onChange={e => setEditVersionData({ ...editVersionData, version_number: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision Date *</label>
                  <input
                    type="date"
                    value={editVersionData.revision_date}
                    onChange={e => setEditVersionData({ ...editVersionData, revision_date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-mono font-bold bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Changed By / Author *</label>
                <input
                  type="text"
                  value={editVersionData.changed_by}
                  onChange={e => setEditVersionData({ ...editVersionData, changed_by: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Change Summary *</label>
                <textarea
                  rows={2}
                  value={editVersionData.change_description}
                  onChange={e => setEditVersionData({ ...editVersionData, change_description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium bg-white"
                  required
                />
              </div>

              {/* MAP CONNECTIONS FOR THIS REVISION RECORD */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-900 block flex items-center gap-1">
                  <Network className="w-3.5 h-3.5 text-purple-700" /> MAP Connections for this Revision
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connected Risks ({editVersionData.mapped_risk_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-purple-200 space-y-1">
                      {risks.map(r => {
                        const isChecked = editVersionData.mapped_risk_ids.includes(r.id) || editVersionData.mapped_risk_ids.includes(r.risk_id);
                        return (
                          <label key={r.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-purple-50 cursor-pointer">
                            <span className="truncate">{r.risk_id || 'RSK'}: {r.risk_title}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setEditVersionData({ ...editVersionData, mapped_risk_ids: [...editVersionData.mapped_risk_ids, r.id] });
                                else setEditVersionData({ ...editVersionData, mapped_risk_ids: editVersionData.mapped_risk_ids.filter(id => id !== r.id && id !== r.risk_id) });
                              }}
                              className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connected Assets ({editVersionData.mapped_asset_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-emerald-200 space-y-1">
                      {assets.map(a => {
                        const isChecked = editVersionData.mapped_asset_ids.includes(a.id) || editVersionData.mapped_asset_ids.includes(a.asset_code);
                        return (
                          <label key={a.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-emerald-50 cursor-pointer">
                            <span className="truncate">{a.asset_code}: {a.asset_name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setEditVersionData({ ...editVersionData, mapped_asset_ids: [...editVersionData.mapped_asset_ids, a.id] });
                                else setEditVersionData({ ...editVersionData, mapped_asset_ids: editVersionData.mapped_asset_ids.filter(id => id !== a.id && id !== a.asset_code) });
                              }}
                              className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Connected Docs ({editVersionData.mapped_doc_ids.length})</label>
                    <div className="max-h-32 overflow-y-auto bg-white p-1.5 rounded-lg border border-indigo-200 space-y-1">
                      {allMasterDocuments.filter(d => d.id !== editingVersionDoc.id).map(d => {
                        const isChecked = editVersionData.mapped_doc_ids.includes(d.id) || editVersionData.mapped_doc_ids.includes(d.document_id);
                        return (
                          <label key={d.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-indigo-50 cursor-pointer">
                            <span className="truncate">{d.document_id}: {d.document_name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) setEditVersionData({ ...editVersionData, mapped_doc_ids: [...editVersionData.mapped_doc_ids, d.id] });
                                else setEditVersionData({ ...editVersionData, mapped_doc_ids: editVersionData.mapped_doc_ids.filter(id => id !== d.id && id !== d.document_id) });
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setEditingVersionDoc(null); setEditingVersionRecord(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Update Version Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 4: CREATE / REGISTER NEW MASTER DOCUMENT */}
      {/* ========================================================================== */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateDirectDoc} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5" /> Master Index Document Registration
                </span>
                <h3 className="font-black text-slate-900 text-base">Register New Master Document</h3>
              </div>
              <button type="button" onClick={() => setIsAddDocOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: Document Reference & Page Layout */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                Primary Identity & Layout Settings
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    DOCUMENT REFERENCE *
                  </label>
                  <input
                    type="text"
                    value={newDocData.document_reference || newDocData.document_id}
                    onChange={e => setNewDocData({ ...newDocData, document_reference: e.target.value, document_id: e.target.value })}
                    placeholder="e.g. POL-SEC-033 or REF-1001"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono font-black text-indigo-700 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    CLASSIFICATION *
                  </label>
                  <select
                    value={newDocData.classification || 'Confidential'}
                    onChange={e => setNewDocData({ ...newDocData, classification: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white text-slate-800"
                    required
                  >
                    <option value="Restricted">Restricted (High Security)</option>
                    <option value="Confidential">Confidential (Internal Sensitive)</option>
                    <option value="Secret">Secret (Executive Only)</option>
                    <option value="Public">Public (External Release)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  PAGE FORMAT OPTIONS *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDocData({ ...newDocData, page_format: 'A4 Portrait' })}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newDocData.page_format === 'A4 Portrait' || !newDocData.page_format
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>A4 Portrait</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDocData({ ...newDocData, page_format: 'A4 Landscape' })}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newDocData.page_format === 'A4 Landscape'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>A4 Landscape</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  DOCUMENT NAME / TITLE *
                </label>
                <input
                  type="text"
                  value={newDocData.document_name}
                  onChange={e => setNewDocData({ ...newDocData, document_name: e.target.value })}
                  placeholder="e.g. Remote Work & Telecommuting Information Security Policy"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-extrabold text-slate-900 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CATEGORY *</label>
                  <select
                    value={newDocData.category || 'Policies'}
                    onChange={e => setNewDocData({ ...newDocData, category: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white"
                  >
                    <option value="Policies">Policies</option>
                    <option value="Procedures">Procedures</option>
                    <option value="Forms">Forms</option>
                    <option value="Registers">Registers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DEPARTMENT</label>
                  <input
                    type="text"
                    value={newDocData.department}
                    onChange={e => setNewDocData({ ...newDocData, department: e.target.value })}
                    placeholder="e.g. Quality & IT Security"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Important Dates */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Control Dates
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    APPROVED / EFFECTIVE DATE *
                  </label>
                  <input
                    type="date"
                    value={newDocData.effective_date}
                    onChange={e => setNewDocData({ ...newDocData, effective_date: e.target.value, approval_date: e.target.value, issue_date: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    REVIEW DATE *
                  </label>
                  <input
                    type="date"
                    value={newDocData.next_review_date}
                    onChange={e => setNewDocData({ ...newDocData, next_review_date: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    DUE DATE
                  </label>
                  <input
                    type="date"
                    value={newDocData.due_date}
                    onChange={e => setNewDocData({ ...newDocData, due_date: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Sign-Off Stakeholders */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Stakeholder Approvals
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    PREPARED BY *
                  </label>
                  <input
                    type="text"
                    value={newDocData.prepared_by}
                    onChange={e => setNewDocData({ ...newDocData, prepared_by: e.target.value })}
                    placeholder="Author Name / Lead"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    REVIEWED BY * <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newDocData.reviewed_by}
                    onChange={e => setNewDocData({ ...newDocData, reviewed_by: e.target.value })}
                    placeholder="Reviewer Name"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    APPROVED BY *
                  </label>
                  <input
                    type="text"
                    value={newDocData.approved_by}
                    onChange={e => setNewDocData({ ...newDocData, approved_by: e.target.value })}
                    placeholder="Approver / Managing Director"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Version Control & Revision Logs */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Document Version Control & Revision Logs
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">INITIAL VERSION *</label>
                  <input
                    type="text"
                    value={newDocData.version}
                    onChange={e => setNewDocData({ ...newDocData, version: e.target.value })}
                    placeholder="v1.0"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono font-bold bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">REVISION LOG / CHANGE SUMMARY</label>
                  <input
                    type="text"
                    value={newDocData.change_summary}
                    onChange={e => setNewDocData({ ...newDocData, change_summary: e.target.value })}
                    placeholder="Initial Master Document Registration & Formal Release"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* File Attachment / Sample .doc file upload upload interface */}
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-2 text-xs">
              <label className="block font-extrabold text-indigo-950">
                Attach Sample Document File / Template (.DOCX / .PDF)
              </label>
              <input
                type="file"
                accept=".doc,.docx,.pdf,.xlsx"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewDocData({
                      ...newDocData,
                      sample_doc_name: file.name,
                      sample_doc_url: URL.createObjectURL(file)
                    });
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
              {newDocData.sample_doc_name && (
                <p className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attached: {newDocData.sample_doc_name}
                </p>
              )}
            </div>

            {/* SECTION 5: Cross-Connect & Map to Existing Registers, Policies, Forms & Modules */}
            <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-purple-700" />
                  Connect & Map Existing Registers, Policies & System Modules
                </span>
                <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">
                  {regDocMappedModules.length + regDocMappedDocIds.length + regDocMappedRiskIds.length + regDocMappedAssetIds.length} MAP Links Selected
                </span>
              </div>

              {/* Sub-Tabs for Mapping */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-purple-200 text-xs font-bold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setRegMappingTab('MODULES')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${regMappingTab === 'MODULES' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  System Registers & Modules ({regDocMappedModules.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegMappingTab('DOCS')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${regMappingTab === 'DOCS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Existing Documents & Forms ({regDocMappedDocIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegMappingTab('RISKS')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${regMappingTab === 'RISKS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Risk Register ({regDocMappedRiskIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegMappingTab('ASSETS')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${regMappingTab === 'ASSETS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Assets Inventory ({regDocMappedAssetIds.length})
                </button>
              </div>

              {/* TAB CONTENT 1: System Registers & Modules */}
              {regMappingTab === 'MODULES' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600 font-medium">Select primary system registers & modules to map with this master document:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'Risk Register', name: 'Risk Register', icon: ShieldAlert, desc: 'ISO / ADHCIS Risk Register' },
                      { id: 'Legal Registry & Compliance', name: 'Legal Registry & Compliance', icon: Scale, desc: 'Legal & Regulatory Framework' },
                      { id: 'Employee & Operator Management', name: 'Employee & Operator Management', icon: Users, desc: 'Staff Credentials & Licensing' },
                      { id: 'Assets Inventory', name: 'Assets Inventory', icon: Server, desc: 'IT & Medical Asset Inventory' },
                      { id: 'Facility Physical Security Zones & Designated Secure Areas', name: 'Facility Physical Security Zones', icon: Building2, desc: 'Keycard, CCTV & Physical Areas' },
                      { id: 'Agreements & Contracts', name: 'Agreements & Contracts', icon: FileCheck2, desc: 'Vendor SLAs, NDAs & Contracts' }
                    ].map(mod => {
                      const isSelected = regDocMappedModules.includes(mod.id);
                      const IconComp = mod.icon;
                      return (
                        <label
                          key={mod.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected ? 'bg-purple-100/90 border-purple-400 text-purple-950 font-extrabold shadow-2xs' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-purple-700' : 'text-slate-400'}`} />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold">{mod.name}</div>
                              <div className="text-[10px] text-slate-500 font-normal truncate">{mod.desc}</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) setRegDocMappedModules(prev => [...prev, mod.id]);
                              else setRegDocMappedModules(prev => prev.filter(m => m !== mod.id));
                            }}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: Existing Documents & Forms */}
              {regMappingTab === 'DOCS' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={regMappingSearch}
                    onChange={e => setRegMappingSearch(e.target.value)}
                    placeholder="Search existing policies, forms, registers to connect..."
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-medium"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                    {allMasterDocuments
                      .filter(d => !regMappingSearch || d.document_name.toLowerCase().includes(regMappingSearch.toLowerCase()) || d.document_id.toLowerCase().includes(regMappingSearch.toLowerCase()))
                      .map(otherDoc => {
                        const isSelected = regDocMappedDocIds.includes(otherDoc.id) || regDocMappedDocIds.includes(otherDoc.document_id);
                        return (
                          <label key={otherDoc.id} className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer ${isSelected ? 'bg-purple-100/80 border-purple-300 font-bold text-purple-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">{otherDoc.document_id}</span>
                              <span className="truncate">{otherDoc.document_name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const idToUse = otherDoc.id;
                                if (e.target.checked) setRegDocMappedDocIds(prev => [...prev, idToUse]);
                                else setRegDocMappedDocIds(prev => prev.filter(i => i !== idToUse && i !== otherDoc.document_id));
                              }}
                              className="w-4 h-4 rounded text-purple-600 cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: Risk Register Items */}
              {regMappingTab === 'RISKS' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={regMappingSearch}
                    onChange={e => setRegMappingSearch(e.target.value)}
                    placeholder="Search active risk register entries..."
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-medium"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                    {risks
                      .filter(r => !regMappingSearch || r.risk_title.toLowerCase().includes(regMappingSearch.toLowerCase()) || r.risk_id?.toLowerCase().includes(regMappingSearch.toLowerCase()))
                      .map(r => {
                        const isSelected = regDocMappedRiskIds.includes(r.id) || regDocMappedRiskIds.includes(r.risk_id);
                        return (
                          <label key={r.id} className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer ${isSelected ? 'bg-purple-100/80 border-purple-300 font-bold text-purple-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] font-black text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300 shrink-0">{r.risk_id || 'RSK'}</span>
                              <span className="truncate">{r.risk_title}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) setRegDocMappedRiskIds(prev => [...prev, r.id]);
                                else setRegDocMappedRiskIds(prev => prev.filter(i => i !== r.id && i !== r.risk_id));
                              }}
                              className="w-4 h-4 rounded text-purple-600 cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 4: Assets Inventory Items */}
              {regMappingTab === 'ASSETS' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={regMappingSearch}
                    onChange={e => setRegMappingSearch(e.target.value)}
                    placeholder="Search IT & Facility assets..."
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white font-medium"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                    {assets
                      .filter(a => !regMappingSearch || a.asset_name.toLowerCase().includes(regMappingSearch.toLowerCase()) || a.asset_code?.toLowerCase().includes(regMappingSearch.toLowerCase()))
                      .map(a => {
                        const isSelected = regDocMappedAssetIds.includes(a.id) || regDocMappedAssetIds.includes(a.asset_code);
                        return (
                          <label key={a.id} className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer ${isSelected ? 'bg-purple-100/80 border-purple-300 font-bold text-purple-950' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">{a.asset_code || 'AST'}</span>
                              <span className="truncate">{a.asset_name}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) setRegDocMappedAssetIds(prev => [...prev, a.id]);
                                else setRegDocMappedAssetIds(prev => prev.filter(i => i !== a.id && i !== a.asset_code));
                              }}
                              className="w-4 h-4 rounded text-purple-600 cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddDocOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Register & Popup Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ========================================================================== */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase">Document Index Control</span>
                <h3 className="font-black text-slate-900 text-sm">Delete Master Document</h3>
              </div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
              <p className="text-slate-700 font-bold">Are you sure you want to permanently delete this master document record?</p>
              <div className="bg-white p-3 rounded-lg border border-rose-200 space-y-1">
                <p className="font-extrabold text-slate-900">{deletingDoc.document_name}</p>
                <span className="font-mono text-[10px] text-indigo-700 font-bold">{deletingDoc.document_id}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-5 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================== */}
      {/* MODAL 6: CROSS-CONNECT & RISK REGISTER MAPPING EDITOR */}
      {/* ========================================================================== */}
      {mappingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveDocMapping} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                  <Network className="w-3 h-3 text-purple-600" /> Policy & Risk Cross-Connect Engine
                </span>
                <h3 className="font-black text-slate-900 text-base mt-1">
                  Map Document to Risk Register & System Modules
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {mappingDoc.document_id} — <strong className="text-slate-800">{mappingDoc.document_name}</strong> ({mappingDoc.category})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMappingDoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs within Mapping Modal */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMappingTab('DOCS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mappingTab === 'DOCS'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Related Documents</span>
                <span className="ml-1 bg-indigo-200 text-indigo-950 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                  {selectedDocIdsForMapping.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMappingTab('RISKS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mappingTab === 'RISKS'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Risk Register Items</span>
                <span className="ml-1 bg-purple-200 text-purple-950 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                  {selectedRiskIdsForMapping.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMappingTab('ASSETS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mappingTab === 'ASSETS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Asset Inventory</span>
                <span className="ml-1 bg-slate-200 text-slate-950 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                  {selectedAssetIdsForMapping.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMappingTab('INCIDENTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mappingTab === 'INCIDENTS'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Incidents</span>
                <span className="ml-1 bg-rose-200 text-rose-950 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black">
                  {selectedIncidentIdsForMapping.length}
                </span>
              </button>
            </div>

            {/* Search and Bulk Selection Toolbar */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={mappingSearchTerm}
                  onChange={e => setMappingSearchTerm(e.target.value)}
                  placeholder={`Search ${mappingTab.toLowerCase()} by ID, title, domain, or owner...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {mappingTab === 'DOCS' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allOtherDocIds = allMasterDocuments.filter(d => d.id !== mappingDoc.id).map(d => d.id);
                      setSelectedDocIdsForMapping(allOtherDocIds);
                    }}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded border border-indigo-200 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDocIdsForMapping([])}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {mappingTab === 'RISKS' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = risks.filter(r => r.client_id === activeClientId).map(r => r.id);
                      setSelectedRiskIdsForMapping(allIds);
                    }}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold rounded border border-purple-200 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRiskIdsForMapping([])}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 0: OTHER MASTER DOCUMENTS */}
            {mappingTab === 'DOCS' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allMasterDocuments.filter(d => d.id !== mappingDoc.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No other documents available in the Master Index.
                  </div>
                ) : (
                  allMasterDocuments
                    .filter(d => {
                      if (d.id === mappingDoc.id) return false;
                      const q = mappingSearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        (d.document_id || '').toLowerCase().includes(q) ||
                        (d.document_name || '').toLowerCase().includes(q) ||
                        (d.category || '').toLowerCase().includes(q) ||
                        (d.department || '').toLowerCase().includes(q)
                      );
                    })
                    .map(otherDoc => {
                      const isSelected = selectedDocIdsForMapping.includes(otherDoc.id) || selectedDocIdsForMapping.includes(otherDoc.document_id);
                      return (
                        <div
                          key={otherDoc.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDocIdsForMapping(prev => prev.filter(id => id !== otherDoc.id && id !== otherDoc.document_id));
                            } else {
                              setSelectedDocIdsForMapping(prev => [...prev, otherDoc.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                  {otherDoc.document_id || otherDoc.document_number}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${getCategoryBadge(otherDoc.category)}`}>
                                  {otherDoc.category}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  Dept: {otherDoc.department}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 truncate">{otherDoc.document_name}</h4>
                            </div>
                          </div>

                          <div className="shrink-0 text-right space-y-0.5">
                            <span className="font-mono text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block text-slate-800">
                              Rev {otherDoc.current_revision || '1.0'}
                            </span>
                            <span className="text-[9px] font-extrabold text-indigo-700 block uppercase">
                              {otherDoc.status || 'APPROVED'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* TAB CONTENT 1: RISKS */}
            {mappingTab === 'RISKS' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {risks.filter(r => r.client_id === activeClientId).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No Risk Register items found for this client.
                  </div>
                ) : (
                  risks
                    .filter(r => {
                      if (r.client_id !== activeClientId) return false;
                      const q = mappingSearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        (r.risk_id || '').toLowerCase().includes(q) ||
                        (r.risk_title || '').toLowerCase().includes(q) ||
                        (r.domain || '').toLowerCase().includes(q) ||
                        (r.asset_name || '').toLowerCase().includes(q)
                      );
                    })
                    .map(r => {
                      const isSelected = selectedRiskIdsForMapping.includes(r.id) || selectedRiskIdsForMapping.includes(r.risk_id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRiskIdsForMapping(prev => prev.filter(id => id !== r.id && id !== r.risk_id));
                            } else {
                              setSelectedRiskIdsForMapping(prev => [...prev, r.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                  {r.risk_id || 'RSK-001'}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.2 rounded">
                                  {r.domain || 'GRC'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  Owner: {r.risk_owner || 'Risk Team'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 truncate">{r.risk_title}</h4>
                            </div>
                          </div>

                          <div className="shrink-0 text-right space-y-0.5">
                            <span className="font-mono text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block text-slate-800">
                              Rating: {r.risk_rating || 0}
                            </span>
                            <span className="text-[9px] font-extrabold text-emerald-700 block uppercase">
                              {r.status || 'OPEN'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* TAB CONTENT 2: ASSETS */}
            {mappingTab === 'ASSETS' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {assets.filter(a => a.client_id === activeClientId).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No Assets found in inventory for this client.
                  </div>
                ) : (
                  assets
                    .filter(a => {
                      if (a.client_id !== activeClientId) return false;
                      const q = mappingSearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        (a.asset_code || '').toLowerCase().includes(q) ||
                        (a.asset_name || '').toLowerCase().includes(q) ||
                        (a.asset_type || '').toLowerCase().includes(q)
                      );
                    })
                    .map(a => {
                      const isSelected = selectedAssetIdsForMapping.includes(a.id) || selectedAssetIdsForMapping.includes(a.asset_code);
                      return (
                        <div
                          key={a.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssetIdsForMapping(prev => prev.filter(id => id !== a.id && id !== a.asset_code));
                            } else {
                              setSelectedAssetIdsForMapping(prev => [...prev, a.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                  {a.asset_code}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {a.asset_type}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 mt-0.5">{a.asset_name}</h4>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* TAB CONTENT 3: INCIDENTS */}
            {mappingTab === 'INCIDENTS' && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {incidents.filter(inc => inc.client_id === activeClientId).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No Incidents recorded for this client.
                  </div>
                ) : (
                  incidents
                    .filter(inc => {
                      if (inc.client_id !== activeClientId) return false;
                      const q = mappingSearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        (inc.incident_no || '').toLowerCase().includes(q) ||
                        (inc.incident_title || '').toLowerCase().includes(q)
                      );
                    })
                    .map(inc => {
                      const isSelected = selectedIncidentIdsForMapping.includes(inc.id) || selectedIncidentIdsForMapping.includes(inc.incident_no);
                      return (
                        <div
                          key={inc.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIncidentIdsForMapping(prev => prev.filter(id => id !== inc.id && id !== inc.incident_no));
                            } else {
                              setSelectedIncidentIdsForMapping(prev => [...prev, inc.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                  {inc.incident_no}
                                </span>
                                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  {inc.severity}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 mt-0.5">{inc.incident_title}</h4>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Linked: <strong className="text-indigo-700">{selectedDocIdsForMapping.length} Related Docs</strong>, <strong className="text-purple-700">{selectedRiskIdsForMapping.length} Risks</strong>, <strong className="text-slate-700">{selectedAssetIdsForMapping.length} Assets</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMappingDoc(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Save Cross-Connect Mappings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
