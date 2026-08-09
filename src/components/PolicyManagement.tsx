/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// @ts-ignore
import mammoth from 'mammoth';
import { Policy, User, Client } from '../types';
import { getPolicyTemplateDefaults, parsePolicyText, getPolicyFullContent, parsePolicyFullFallback } from '../utils/policyDefaults';
import { Search, Plus, BookOpen, AlertCircle, Calendar, FileText, CheckCircle, Clock, Upload, PenTool, Trash2, Sparkles, Database, Wrench, Shield, HardDrive, Users, Lock, Server, AlertTriangle, Phone, Mail, Info, FileEdit, Table, Square, Type, Palette, Copy, Printer, Activity, ShieldCheck, Zap } from 'lucide-react';
import { SmartTextRenderer } from './SmartTextRenderer';
import { printCurrentView, printDocument } from '../utils/printUtils';
import BTATierSelector from './BTATierSelector';
import { FrameworkGroupTier, saveCustomGroupAssignment, determineDefaultFrameworkGroup } from '../utils/frameworkGroupUtils';

const DEFAULT_PREPARED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M5,20 Q15,5 25,18 T45,10 T65,22 T85,12 T95,15" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round"/></svg>`;
const DEFAULT_REVIEWED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M10,12 Q20,25 35,15 T60,22 T80,10 T90,25" fill="none" stroke="%231d4ed8" stroke-width="2" stroke-linecap="round"/></svg>`;
const DEFAULT_APPROVED_SIGN = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30"><path d="M5,15 C20,5 30,25 45,15 C60,5 75,25 90,15" fill="none" stroke="%231e40af" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const getThemeClasses = (color: 'emerald' | 'blue' | 'teal' | 'crimson' | 'slate') => {
  switch (color) {
    case 'blue':
      return {
        bgLight: 'bg-blue-50/50',
        bgAccent: 'bg-blue-100',
        borderAccent: 'border-blue-100',
        textAccent: 'text-blue-800',
        textAccentDark: 'text-blue-950',
        primaryText: 'text-blue-800',
        primaryBorder: 'border-blue-200',
        primaryFocus: 'focus:outline-blue-500 focus:ring-blue-500 focus:border-blue-500',
        headingText: 'text-blue-800 border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        accentBadge: 'bg-blue-200 text-blue-900',
        headerText: 'text-blue-800',
        buttonHover: 'hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50'
      };
    case 'teal':
      return {
        bgLight: 'bg-teal-50/50',
        bgAccent: 'bg-teal-100',
        borderAccent: 'border-teal-100',
        textAccent: 'text-teal-800',
        textAccentDark: 'text-teal-950',
        primaryText: 'text-teal-800',
        primaryBorder: 'border-teal-200',
        primaryFocus: 'focus:outline-teal-500 focus:ring-teal-500 focus:border-teal-500',
        headingText: 'text-teal-800 border-teal-200',
        badge: 'bg-teal-100 text-teal-800',
        accentBadge: 'bg-teal-200 text-teal-900',
        headerText: 'text-teal-800',
        buttonHover: 'hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50'
      };
    case 'crimson':
      return {
        bgLight: 'bg-rose-50/50',
        bgAccent: 'bg-rose-100',
        borderAccent: 'border-rose-100',
        textAccent: 'text-rose-800',
        textAccentDark: 'text-rose-950',
        primaryText: 'text-rose-800',
        primaryBorder: 'border-rose-200',
        primaryFocus: 'focus:outline-rose-500 focus:ring-rose-500 focus:border-rose-500',
        headingText: 'text-rose-800 border-rose-200',
        badge: 'bg-rose-100 text-rose-800',
        accentBadge: 'bg-rose-200 text-rose-900',
        headerText: 'text-rose-800',
        buttonHover: 'hover:border-rose-500 hover:text-rose-700 hover:bg-rose-50'
      };
    case 'slate':
      return {
        bgLight: 'bg-slate-50/50',
        bgAccent: 'bg-slate-100',
        borderAccent: 'border-slate-200',
        textAccent: 'text-slate-800',
        textAccentDark: 'text-slate-950',
        primaryText: 'text-slate-800',
        primaryBorder: 'border-slate-300',
        primaryFocus: 'focus:outline-slate-500 focus:ring-slate-500 focus:border-slate-500',
        headingText: 'text-slate-800 border-slate-300',
        badge: 'bg-slate-100 text-slate-800',
        accentBadge: 'bg-slate-200 text-slate-900',
        headerText: 'text-slate-800',
        buttonHover: 'hover:border-slate-500 hover:text-slate-700 hover:bg-slate-50'
      };
    case 'emerald':
    default:
      return {
        bgLight: 'bg-emerald-50/50',
        bgAccent: 'bg-emerald-100',
        borderAccent: 'border-emerald-100',
        textAccent: 'text-emerald-800',
        textAccentDark: 'text-emerald-950',
        primaryText: 'text-emerald-800',
        primaryBorder: 'border-emerald-200',
        primaryFocus: 'focus:outline-emerald-500 focus:ring-emerald-500 focus:border-emerald-500',
        headingText: 'text-emerald-800 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        accentBadge: 'bg-emerald-200 text-emerald-900',
        headerText: 'text-emerald-800',
        buttonHover: 'hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
      };
  }
};

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


interface PolicyManagementProps {
  policies: Policy[];
  users: User[];
  onAddPolicy: (policy: Policy) => void;
  onDeletePolicy?: (id: string) => void;
  onUpdatePolicy?: (updatedPolicy: Policy) => void;
  onBulkFeedPolicies?: (policies: Policy[]) => void;
  activeClientId: string;
  client?: Client;
  clients?: Client[];
}

export default function PolicyManagement({
  policies,
  users,
  onAddPolicy,
  onDeletePolicy,
  onUpdatePolicy,
  onBulkFeedPolicies,
  activeClientId,
  client,
  clients = []
}: PolicyManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draftMode, setDraftMode] = useState<'automatic' | 'manual' | 'ai'>('automatic');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // AI-Assisted Document Capture & Extraction States
  const [aiExtractedFields, setAiExtractedFields] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [aiRawText, setAiRawText] = useState('');

  // Policy Cloning / Duplication States
  const [policyToClone, setPolicyToClone] = useState<Policy | null>(null);
  const [cloneTargetClientId, setCloneTargetClientId] = useState<string>('');
  const [clonePolicyNo, setClonePolicyNo] = useState<string>('');
  const [clonePolicyName, setClonePolicyName] = useState<string>('');
  const [cloneMode, setCloneMode] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [cloneTargetClientIds, setCloneTargetClientIds] = useState<string[]>([]);

  // Tenant Bulk Policy Cloning States
  const [isBulkCloning, setIsBulkCloning] = useState(false);
  const [bulkCloneTargetIds, setBulkCloneTargetIds] = useState<string[]>([]);
  const [bulkCloneSuccess, setBulkCloneSuccess] = useState<string | null>(null);

  const handleAiExtract = async (textToExtract: string) => {
    if (!textToExtract.trim()) {
      setExtractError('Please paste some policy text or upload a .docx file first.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      let data;
      try {
        const response = await fetch('/api/parse-policy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: textToExtract }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to extract policy fields.');
        }

        data = await response.json();
      } catch (apiErr: any) {
        console.warn('[AI Extract] Primary Gemini parser failed or is down (503). Running local high-fidelity compliance rule-based extractor.', apiErr);
        data = parsePolicyFullFallback(textToExtract);
        setExtractError('⚠️ Gemini API is temporarily offline. Used high-fidelity local rules fallback engine to parse document.');
      }
      
      // Auto-populate form metadata states
      if (data.policy_no) setPolicyNo(data.policy_no);
      if (data.policy_name) setPolicyName(data.policy_name);
      if (data.version) setVersion(data.version);
      if (data.category) setCategory(data.category);
      if (data.department) setDepartment(data.department);
      if (data.classification) setClassification(data.classification as any);

      // Save full compliance detail fields to merge on submit
      setAiExtractedFields({
        objective: data.objective || '',
        scope: data.scope || '',
        resp_it_manager: data.resp_it_manager || '',
        resp_md: data.resp_md || '',
        resp_all_users: data.resp_all_users || '',
        policy_statement: data.policy_statement || '',
        core_principles: data.core_principles || '',
        compliance_disciplinary: data.compliance_disciplinary || '',
        compliance_clarifications: data.compliance_clarifications || '',
        compliance_checks: data.compliance_checks || '',
        compliance_exceptions: data.compliance_exceptions || '',
        full_content: textToExtract,
      });
    } catch (err: any) {
      console.error('[AI Extract Error]', err);
      setExtractError(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractError(null);
    setIsExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value || '';
      
      if (!extractedText.trim()) {
        throw new Error('This .docx file appears to be empty or contains no extractable text.');
      }

      setAiRawText(extractedText);
      // Auto trigger extraction
      await handleAiExtract(extractedText);
    } catch (err: any) {
      console.error('[Docx Upload/Parsing Error]', err);
      setExtractError(err.message || 'Failed to read .docx file. Ensure it is a valid MS Word document.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSheetAiExtract = async (textToExtract: string) => {
    if (!textToExtract.trim()) {
      setExtractError('Please paste some policy text or upload a .docx file first.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      let data;
      try {
        const response = await fetch('/api/parse-policy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: textToExtract }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to extract policy fields.');
        }

        data = await response.json();
      } catch (apiErr: any) {
        console.warn('[AI Sheet Extract] Primary Gemini parser failed or is down (503). Running local high-fidelity compliance rule-based extractor.', apiErr);
        data = parsePolicyFullFallback(textToExtract);
        setExtractError('⚠️ Gemini API is temporarily offline. Used high-fidelity local rules fallback engine to parse document.');
      }
      
      // Auto-update editing metadata states of the active sheet
      if (data.policy_no) setEditPolicyNo(data.policy_no);
      if (data.policy_name) setEditPolicyName(data.policy_name);
      if (data.version) setEditVersion(data.version);
      if (data.category) setEditCategory(data.category);
      if (data.department) setEditDepartment(data.department);
      if (data.classification) setEditClassification(data.classification as any);

      // Auto-update compliance sections
      setEditObjective(data.objective || '');
      setEditScope(data.scope || '');
      setEditRespItManager(data.resp_it_manager || '');
      setEditRespMd(data.resp_md || '');
      setEditRespAllUsers(data.resp_all_users || '');
      setEditPolicyStatement(data.policy_statement || '');
      setEditCorePrinciples(data.core_principles || '');
      setEditComplianceDisciplinary(data.compliance_disciplinary || '');
      setEditComplianceClarifications(data.compliance_clarifications || '');
      setEditComplianceChecks(data.compliance_checks || '');
      setEditComplianceExceptions(data.compliance_exceptions || '');
      setEditFullContent(textToExtract);

      setEditorMode('sections');
    } catch (err: any) {
      console.error('[AI Sheet Extract Error]', err);
      setExtractError(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSheetDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractError(null);
    setIsExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value || '';
      
      if (!extractedText.trim()) {
        throw new Error('This .docx file appears to be empty or contains no extractable text.');
      }

      setAiRawText(extractedText);
      await handleSheetAiExtract(extractedText);
    } catch (err: any) {
      console.error('[Docx Sheet Upload/Parsing Error]', err);
      setExtractError(err.message || 'Failed to read .docx file. Ensure it is a valid MS Word document.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Form states
  const [policyNo, setPolicyNo] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [category, setCategory] = useState('Information Security');
  const [reviewDate, setReviewDate] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'UNDER_REVIEW' | 'APPROVED'>('APPROVED');
  const [frameworkGroup, setFrameworkGroup] = useState<FrameworkGroupTier>('Basic');
  const [editFrameworkGroup, setEditFrameworkGroup] = useState<FrameworkGroupTier>('Basic');

  // Advanced document reference states
  const [department, setDepartment] = useState('Quality');
  const [documentType, setDocumentType] = useState<'Policy' | 'Procedure' | 'Form' | 'Guideline' | 'Record'>('Policy');
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });
  const [reviewedByName, setReviewedByName] = useState('Tareq Al Mansoori');
  const [reviewedByDesignation, setReviewedByDesignation] = useState('Senior Compliance Consultant');
  const [approvedByName, setApprovedByName] = useState('Dr. Johnathan Carter');
  const [approvedByDesignation, setApprovedByDesignation] = useState('Chief Medical Officer');
  const [preparedByName, setPreparedByName] = useState('Sarah Jenkins');
  const [preparedByDesignation, setPreparedByDesignation] = useState('Information Security Officer');
  const [preparedBySign, setPreparedBySign] = useState(DEFAULT_PREPARED_SIGN);
  const [reviewedBySign, setReviewedBySign] = useState(DEFAULT_REVIEWED_SIGN);
  const [approvedBySign, setApprovedBySign] = useState(DEFAULT_APPROVED_SIGN);
  const [classification, setClassification] = useState<'Confidential' | 'Restricted' | 'Secret'>('Confidential');
  const [showReviewedBy, setShowReviewedBy] = useState(true);
  const [preparedBySignMode, setPreparedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [reviewedBySignMode, setReviewedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [approvedBySignMode, setApprovedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  
  // Quick Setup wizard states
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [activeWizardTab, setActiveWizardTab] = useState<'governance' | 'antivirus' | 'access' | 'physical' | 'backup' | 'incident' | 'doccontrol' | 'soa'>('governance');

  // Wizard custom governance states
  const [wizardPreparedByName, setWizardPreparedByName] = useState('Sarah Jenkins');
  const [wizardPreparedByDesignation, setWizardPreparedByDesignation] = useState('Information Security Officer');
  const [wizardPreparedSignMode, setWizardPreparedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardPreparedBySign, setWizardPreparedBySign] = useState(DEFAULT_PREPARED_SIGN);

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

  const [wizardApprovedByName, setWizardApprovedByName] = useState('Dr. Johnathan Carter');
  const [wizardApprovedByDesignation, setWizardApprovedByDesignation] = useState('Chief Medical Officer');
  const [wizardApprovedSignMode, setWizardApprovedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardApprovedBySign, setWizardApprovedBySign] = useState(DEFAULT_APPROVED_SIGN);

  const [wizardShowReviewedBy, setWizardShowReviewedBy] = useState(true);
  const [wizardReviewedByName, setWizardReviewedByName] = useState('Tareq Al Mansoori');
  const [wizardReviewedByDesignation, setWizardReviewedByDesignation] = useState('Senior Compliance Consultant');
  const [wizardReviewedSignMode, setWizardReviewedSignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [wizardReviewedBySign, setWizardReviewedBySign] = useState(DEFAULT_REVIEWED_SIGN);

  
  // Antivirus Policy states
  const [selectedAntivirus, setSelectedAntivirus] = useState('Microsoft Defender for Endpoint');
  const [customAntivirus, setCustomAntivirus] = useState('');
  
  // Access Control Policy states
  const [accessReviewFrequency, setAccessReviewFrequency] = useState<'Yearly' | 'Twice a Year' | 'Quarterly'>('Yearly');
  
  // Physical Security states
  const [publicAccessAreas, setPublicAccessAreas] = useState('Reception waiting Area, Lobby');
  const [workAreas, setWorkAreas] = useState('Doctor room, Consultation desk');
  const [restrictedAreas, setRestrictedAreas] = useState('Treatment room, Laboratory');
  const [highSecureAreas, setHighSecureAreas] = useState('Server-cabinet, IT Server Room, Pharmacy Locker');

  // Backup Plan states
  const [backupStorageType, setBackupStorageType] = useState<'NAS' | 'workstation'>('NAS');
  const [backupPlans, setBackupPlans] = useState([
    { type: 'Daily – Incremental', source: 'EMR Backup', destination: 'NAS', remarks: 'Automatic scheduled nightly delta snapshots' },
    { type: 'Daily – Incremental', source: 'Share Folder', destination: 'NAS', remarks: 'Incremental backup of user shares and clinical logs' },
    { type: 'Weekly Full Backup', source: 'EMR Backup', destination: 'NAS', remarks: 'Full encrypted binary backup with integrity checks' },
    { type: 'Monthly Full Backup', source: 'DB Folder', destination: 'NAS', remarks: 'Long-term archival storage offsite cloud gateway' }
  ]);

  // Incident Management states
  const [incidentModeOfCommunication, setIncidentModeOfCommunication] = useState('soc@doh.gov.ae | 02 4193777');
  const [incidentResponsibleStakeholder, setIncidentResponsibleStakeholder] = useState('im@doh.gov.ae | 02 4193777');

  const handleUpdateBackupPlan = (index: number, field: string, value: string) => {
    setBackupPlans(prev => prev.map((plan, i) => i === index ? { ...plan, [field]: value } : plan));
  };

  const handleBackupStorageTypeChange = (value: 'NAS' | 'workstation') => {
    setBackupStorageType(value);
    setBackupPlans(prev => prev.map(plan => ({
      ...plan,
      destination: value === 'NAS' ? 'NAS' : 'Workstation'
    })));
  };
  
  const handleAddBackupPlanRow = () => {
    setBackupPlans(prev => [...prev, { type: 'Daily – Incremental', source: '', destination: backupStorageType === 'NAS' ? 'NAS' : 'Workstation', remarks: '' }]);
  };
  
  const handleRemoveBackupPlanRow = (index: number) => {
    setBackupPlans(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyQuickSetup = () => {
    const antivirusToUse = selectedAntivirus === 'Custom / Other' ? customAntivirus : selectedAntivirus;

    // Generate Backup Plan table as a highly readable, elegant text table
    const backupTableMarkdown = backupPlans.map(p => `• **${p.type}** of *${p.source}* to destination *${p.destination}*. Remarks: ${p.remarks}`).join('\n');

    // Generate SLA Incident Management Matrix in clean text layout
    const slaTableText = `
INCIDENT SEVERITY LEVEL SLAS AND RESPONSE PLAN:

P1 - Critical Severity:
  • SLA - Incident Acknowledgement: Within 30 mins of incident communication/observation
  • SLA - Incident Resolution: Within 2 hours of incident acknowledgement
  • SLA - Incident Notification to AD Health SOC: Near-Real Time
  • SLA - Incident Updates to AD Health SOC: Near-Real Time
  • SLA - Incident Resolution Communication to AD Health SOC: Within 30 mins of incident resolution
  • Mode of Communication: ${incidentModeOfCommunication}
  • Responsible Stakeholder: ${incidentResponsibleStakeholder}

P2 - Severe Severity:
  • SLA - Incident Acknowledgement: Within 1 hour of incident communication/observation
  • SLA - Incident Resolution: Within 4 hours of incident acknowledgement
  • SLA - Incident Notification to AD Health SOC: Within 1 hour of Incident acknowledgement
  • SLA - Incident Updates to AD Health SOC: Every 1 hour
  • SLA - Incident Resolution Communication to AD Health SOC: Within 1 hour of incident resolution
  • Mode of Communication: ${incidentModeOfCommunication}
  • Responsible Stakeholder: ${incidentResponsibleStakeholder}

P3 - Elevated Severity:
  • SLA - Incident Acknowledgement: Within 1 hour of incident communication/observation
  • SLA - Incident Resolution: Within 24 hours of incident acknowledgement
  • SLA - Incident Notification to AD Health SOC: Within 1 hour of incident acknowledgement
  • SLA - Incident Updates to AD Health SOC: Every 2 hours
  • SLA - Incident Resolution Communication to AD Health SOC: Within 4 hours of incident resolution
  • Mode of Communication: ${incidentModeOfCommunication}
  • Responsible Stakeholder: ${incidentResponsibleStakeholder}

P4 - Normal Severity:
  • SLA - Incident Acknowledgement: Within 1 hour of incident communication/observation
  • SLA - Incident Resolution: Within 48 hours of incident acknowledgement
  • SLA - Incident Notification to AD Health SOC: Within 24 hours of incident acknowledgement
  • SLA - Incident Updates to AD Health SOC: Every 24 hours
  • SLA - Incident Resolution Communication to AD Health SOC: Within 8 hours of incident resolution
  • Mode of Communication: ${incidentModeOfCommunication}
  • Responsible Stakeholder: ${incidentResponsibleStakeholder}
`;

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dateStr = new Date().toISOString().split('T')[0];
    const nextYearStr = nextYear.toISOString().split('T')[0];
    const nowStr = new Date().toISOString();

    // 1. Antivirus Policy (POL-SEC-009)
    const pAntivirus: Policy = {
      id: `POL-SEC-009-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-009',
      policy_name: 'Antivirus Policy',
      version: '1.0',
      category: 'Information Security',
      department: 'IT Department',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: `The objective of this policy is to outline protection controls against malicious codes (such as viruses, spyware, malware, Trojans, etc.) that may harm the computer devices and servers of at [Entity Name] . This policy also establishes the requirements for addressing any problems arising from such infections.`,
      scope: `This policy applies to all users and physical assets (including information and computing resources such as desktops, laptops, servers, and tablets) within at [Entity Name] .`,
      resp_it_manager: `• Responsible for the development, maintenance, enforcement, and endorsement of this policy.
• Support relevant business units in implementing defined controls and ensuring compliance.
• Conduct regular awareness training for users about the policy.
• Administer the antivirus system, centrally monitor, and analyze system logs.
• Coordinate with external security authorities to address virus outbreaks and ensure preventive actions.`,
      resp_md: `• Ensure policy compliance within their respective areas of concern.`,
      resp_all_users: `• Read, understand, and adhere to this policy in daily operations.
• Report any malicious content, configuration changes, or unusual behavior to the IT Manager.
• Immediately disconnect from the network if their system is believed to be infected.`,
      policy_statement: `### Antivirus Installation
• The IT Manager shall ensure that all desktops, laptops, and tablets are installed and with official antivirus software.
• The Technical Support Team shall ensure that all servers are installed and configured with official antivirus software (e.g., ${antivirusToUse}).
• Antivirus software shall operate in real time on all servers, desktops, laptops, and tablets.
• Server machines running on operating systems with minimal virus risk may not require antivirus software.
• Full system scans must be configured to occur weekly, with real-time scanning of files from external storage media when accessed, copied, or moved.
• Antivirus software shall automatically clean malicious content, and if cleaning is unsuccessful, quarantine infected files.
• Email servers must scan all internal and external emails for malicious content.
• Users shall be trained in antivirus software usage, but they are not permitted to install, uninstall, or alter antivirus configurations.

### Antivirus Software and Signature File Maintenance
• The IT Manager administering the antivirus system shall ensure that virus definitions (signatures) are regularly updated.
• Automatic updates must be enabled across all network endpoints and systems.
• The IT Manager must maintain updated documentation for the installation, configuration, and administration of all antivirus components.
• In case of a worm/virus outbreak, the infected system must be disconnected from the [Entity Name] network to prevent the spread of the infection.

### Antivirus Server Security
• Antivirus system servers shall be in a physically secure, controlled environment with access restricted to authorized personnel.
• Logical (electronic) access to antivirus servers shall be restricted to authorized personnel only.

### Third-Party Access
• Third-party personnel are not permitted to connect laptops, desktops, or tablets to the entity network unless their antivirus signatures are up to date.
• The IT Manager must verify that third-party devices are free of viruses and other vulnerabilities before they are connected to the local area network (LAN).

### Logging and Monitoring
• Logging must be enabled on all antivirus systems, and logs must be monitored weekly by administrators responsible for the antivirus system.
• All virus detection incidents must be logged, along with actions taken (e.g., quarantine, deletion, or successful cleaning).
• Antivirus logs must be stored for at least 30 days (or as required by regulatory guidelines) and reviewed by the IT Manager.
• The antivirus system must be configured to send alerts to the IT Manager in case of malicious content that cannot be cleaned or upon the detection of a new virus.

### Incident Reporting
• The IT Manager must review, and report identified malicious code/content in accordance with the Information Security Incident Management process.
• Users must report any detection of malicious content, configuration changes, or unusual system behavior to the IT Manager immediately.
• Systems suspected to be infected must be disconnected from the network without delay.

### CHANGE MANAGEMENT
All changes related to antivirus servers, applications, or configuration settings must adhere to [Entity Name]’s Change Management Process.`,
      core_principles: `1. Antivirus Installation: Official software deployed across all desktops, laptops, tablets, and servers.
2. Routine Updates & Maintenance: Daily automated definition updates synchronized across all endpoints.
3. Logical & Physical Security: Restricting host and administrative credentials to authorized personnel only.
4. Continuous Log Auditing: Retaining detection logs for 30+ days and dispatching real-time notifications for uncleaned infections.`,
      full_content: `## POL-SEC-009: Antivirus Policy

### OBJECTIVE
The objective of this policy is to outline protection controls against malicious codes (such as viruses, spyware, malware, Trojans, etc.) that may harm the computer devices and servers of at [Entity Name] . This policy also establishes the requirements for addressing any problems arising from such infections.

### SCOPE
This policy applies to all users and physical assets (including information and computing resources such as desktops, laptops, servers, and tablets) within at [Entity Name] .

### RESPONSIBILITIES

#### IT Manager:
• Responsible for the development, maintenance, enforcement, and endorsement of this policy.
• Support relevant business units in implementing defined controls and ensuring compliance.
• Conduct regular awareness training for users about the policy.
• Administer the antivirus system, centrally monitor, and analyze system logs.
• Coordinate with external security authorities to address virus outbreaks and ensure preventive actions.

#### All Users:
• Read, understand, and adhere to this policy in daily operations.
• Report any malicious content, configuration changes, or unusual behavior to the IT Manager.
• Immediately disconnect from the network if their system is believed to be infected.

#### Managing Director / Manager:
• Ensure policy compliance within their respective areas of concern.

### POLICY IN DETAIL

#### Antivirus Installation
• The IT Manager shall ensure that all desktops, laptops, and tablets are installed and with official antivirus software.
• The Technical Support Team shall ensure that all servers are installed and configured with official antivirus software (e.g., ${antivirusToUse}).
• Antivirus software shall operate in real time on all servers, desktops, laptops, and tablets.
• Server machines running on operating systems with minimal virus risk may not require antivirus software.
• Full system scans must be configured to occur weekly, with real-time scanning of files from external storage media when accessed, copied, or moved.
• Antivirus software shall automatically clean malicious content, and if cleaning is unsuccessful, quarantine infected files.
• Email servers must scan all internal and external emails for malicious content.
• Users shall be trained in antivirus software usage, but they are not permitted to install, uninstall, or alter antivirus configurations.

#### Antivirus Software and Signature File Maintenance
• The IT Manager administering the antivirus system shall ensure that virus definitions (signatures) are regularly updated.
• Automatic updates must be enabled across all network endpoints and systems.
• The IT Manager must maintain updated documentation for the installation, configuration, and administration of all antivirus components.
• In case of a worm/virus outbreak, the infected system must be disconnected from the [Entity Name] network to prevent the spread of the infection.

#### Antivirus Server Security
• Antivirus system servers shall be in a physically secure, controlled environment with access restricted to authorized personnel.
• Logical (electronic) access to antivirus servers shall be restricted to authorized personnel only.

#### Third-Party Access
• Third-party personnel are not permitted to connect laptops, desktops, or tablets to the entity network unless their antivirus signatures are up to date.
• The IT Manager must verify that third-party devices are free of viruses and other vulnerabilities before they are connected to the local area network (LAN).

#### Logging and Monitoring
• Logging must be enabled on all antivirus systems, and logs must be monitored weekly by administrators responsible for the antivirus system.
• All virus detection incidents must be logged, along with actions taken (e.g., quarantine, deletion, or successful cleaning).
• Antivirus logs must be stored for at least 30 days (or as required by regulatory guidelines) and reviewed by the IT Manager.
• The antivirus system must be configured to send alerts to the IT Manager in case of malicious content that cannot be cleaned or upon the detection of a new virus.

#### Incident Reporting
• The IT Manager must review, and report identified malicious code/content in accordance with the Information Security Incident Management process.
• Users must report any detection of malicious content, configuration changes, or unusual system behavior to the IT Manager immediately.
• Systems suspected to be infected must be disconnected from the network without delay.

### CHANGE MANAGEMENT
All changes related to antivirus servers, applications, or configuration settings must adhere to [Entity Name]’s Change Management Process.

### POLICY COMPLIANCE
**Violations:** Any violations of this policy may result in HR disciplinary actions in line with UAE Labor Law, the Code of Conduct for Employees, and any applicable UAE regulations.

**Clarifications:** Users unsure about any aspects of this policy must seek clarification from the IT Manager.

**Periodic Audits:** The IT Manager reserves the right to conduct periodic compliance checks.

**Exceptions:** Any exceptions to this policy must have valid business justifications and receive approval from the IT Manager on a case-by-case basis.`
    };

    // 2. Access Control Policy (POL-SEC-006)
    const accessFreqText = accessReviewFrequency === 'Quarterly' ? 'quarterly' : accessReviewFrequency === 'Twice a Year' ? 'twice a year' : 'annually';
    const pAccess: Policy = {
      id: `POL-SEC-006-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-006',
      policy_name: 'Access Control Policy',
      version: '1.0',
      category: 'Information Security',
      department: 'IT Department',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: `The objective of this policy is to specify access control protocols and protect patient registers, medical records, and digital platforms from unauthorized data breaches, complying with DOH regulations.`,
      scope: `Applies to all electronic logins, role-based security assignments, active directory credentials, and shared resource groups inside [Entity Name].`,
      resp_it_manager: `• Responsible for the development, maintenance, enforcement, and endorsement of the access control policy.
• Supports the relevant business unit/section in implementing defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Conducts access reviews of user lists periodically.`,
      resp_md: `• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum access privilege requirements.`,
      resp_all_users: `• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.`,
      policy_statement: `### Access Control and Privilege Management
• Access to medical folders and server shares is restricted under a strict 'least privilege' paradigm. User authentication credentials must be formally requested and authorized.

### Review of Access
• The IT Manager regularly generates a user list from the information systems, either annually or whenever major changes occur. This list is reviewed by the Business Managing Director and/or Manager to identify redundant, dormant, or expired user accounts, as well as incorrect privileges.

User accounts inactive for more than 90 days must be disabled by the IT Manager.
Administrator/Standard user accounts are reviewed ${accessFreqText}, with changes logged for periodic review.`,
      core_principles: `1. Least Privilege Authorization: Login access is granted strictly based on active clinical or business functions.
2. Routine Review Cycles: Credentials and permissions are formally audited and updated ${accessFreqText}.
3. Strong Password Enforcement: All user profiles are bound by strong complexity requirements.
4. Stale Account Revocation: Automatic deactivation of user directories dormant for more than 90 days.`,
      compliance_disciplinary: `Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws.`,
      compliance_clarifications: `Users unsure about this policy should seek clarification from the IT Manager.`,
      compliance_checks: `The IT Manager reserves the right to check compliance with this policy.`,
      compliance_exceptions: `The IT Manager reserves the right to approve exceptions on a case-by-case basis.`,
      full_content: `## POL-SEC-006: Access Control Policy

### OBJECTIVE
The objective of this policy is to specify access control protocols and protect patient registers, medical records, and digital platforms from unauthorized data breaches, complying with DOH regulations.

### SCOPE
Applies to all electronic logins, role-based security assignments, active directory credentials, and shared resource groups inside [Entity Name].

### RESPONSIBILITIES

#### IT Manager:
• Responsible for the development, maintenance, enforcement, and endorsement of the access control policy.
• Supports the relevant business unit/section in implementing defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Conducts access reviews of user lists periodically.

#### Managing Director/Manager:
• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum access privilege requirements.

#### All Users:
• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.

### POLICY IN DETAIL

#### Access Control and Privilege Management
• Access to medical folders and server shares is restricted under a strict 'least privilege' paradigm. User authentication credentials must be formally requested and authorized.

#### Review of Access
• The IT Manager regularly generates a user list from the information systems, either annually or whenever major changes occur. This list is reviewed by the Business Managing Director and/or Manager to identify redundant, dormant, or expired user accounts, as well as incorrect privileges.

User accounts inactive for more than 90 days must be disabled by the IT Manager.
Administrator/Standard user accounts are reviewed ${accessFreqText}, with changes logged for periodic review.

#### Core Principles
1. Least Privilege Authorization: Login access is granted strictly based on active clinical or business functions.
2. Routine Review Cycles: Credentials and permissions are formally audited and updated ${accessFreqText}.
3. Strong Password Enforcement: All user profiles are bound by strong complexity requirements.
4. Stale Account Revocation: Automatic deactivation of user directories dormant for more than 90 days.

### POLICY COMPLIANCE
Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws. Users unsure about this policy should seek clarification from the IT Manager. The IT Manager reserves the right to check compliance with this policy and approve exceptions on a case-by-case basis.`
    };

    // 3. Physical & Environmental Security Policy (POL-SEC-013)
    const pPhysical: Policy = {
      id: `POL-SEC-013-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-013',
      policy_name: 'Physical & Environmental Security Policy',
      version: '1.0',
      category: 'Information Security',
      department: 'Administration',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: `The objective of this policy is to prevent unauthorized physical access, damage, or hazard to [Entity Name]'s operational rooms, healthcare suites, and physical networks.`,
      scope: `Applies to all geographic enclosures, reception desks, diagnostic consultation rooms, file storage lockers, and technical closets located on our premises.`,
      policy_statement: `### Secure Working Areas

To protect our premises, clinical spaces, and critical IT infrastructure, [Entity Name] establishes secure working areas. Specific facility spaces are classified into designated physical zones, each governed by tailored security requirements, custody protocols, and monitoring standards:

🔒 **FACILITY PHYSICAL SECURITY ZONES & DESIGNATED SECURE AREAS:**

### Interactive Zoning Matrix Preview:

| Risk Area | Risk Location | Custodian |
|---|---|---|
| Public Access Areas | Reception / Waiting Area (including: ${publicAccessAreas}) | Customers / Staff |
| Work Areas, Restricted Areas | Consultation room, Treatment / Reception Counter (including: ${workAreas}, ${restrictedAreas}) | Nurse, Doctor, Pharmacist, Manager, Managing Director |
| High Secure Areas | Company Assets Area (Server Cabinet) (including: ${highSecureAreas}) | Managing Director, Authorized Staff* |
| *Escort with facility authorized person | | |

### Physical Access Control

Access to all restricted and high-security zones must be actively managed and monitored. Personnel must wear identification badges, and visitors must be escorted by authorized staff at all times. Doors to server closets, pharmacy cabinets, and confidential files must remain locked.`,
      core_principles: `1. Zoning Controls: Distinct administrative and clinical areas are strictly segregated.
2. Visual Monitoring: Critical doors, reception perimeters, and server racks are observed 24/7.
3. Access Authorization: Restricted area entries require badge authorizations or physical double-locks.
4. Environmental Protection: Server and pharmacy zones must maintain climate controls and fire prevention.`
    };

    // 4. Information Data Backup Restoration Policy (POL-SEC-021)
    const storageMediaLabel = backupStorageType === 'NAS' ? 'NAS' : 'workstation';
    const backupPlanMatrixLines = backupPlans.map(p => `${p.type} of ${p.source} to destination ${p.destination}. Remarks: ${p.remarks}`).join('\n');
    const backupPlanFrequencies = Array.from(new Set(
      backupPlans.map(p => {
        const lower = p.type.toLowerCase();
        if (lower.includes('daily')) return 'daily';
        if (lower.includes('weekly')) return 'weekly';
        if (lower.includes('monthly')) return 'monthly';
        return lower;
      })
    ))
    .filter(Boolean)
    .join(', ') || 'daily, weekly, monthly';

    const pBackup: Policy = {
      id: `POL-SEC-021-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-021',
      policy_name: 'Information Data Backup Restoration Policy',
      version: '1.0',
      category: 'Information Security',
      department: 'IT Department',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: `The objective of this policy is to define adequate backup requirements for the critical information and data of the facility and ensure their availability in the event of a disruption.`,
      scope: `This policy covers all information/data stored and processed in production, development, test environments, file servers, as well as network and security devices owned by Smartpro Consultancy.`,
      resp_it_manager: `• Responsible for the development, maintenance, enforcement, and endorsement of the policy.
• Supports the relevant business unit/section in implementing the defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Ensures that backups are taken as per operational requirements, in consultation with the Managing Director/Manager.
• Schedules and handles backup media.
• Oversees the implementation of this policy in day-to-day operations.`,
      resp_md: `• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum backup requirements and frequency.`,
      resp_all_users: `• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.`,
      policy_statement: `### Backup Requirements
• Backup requirements for all information systems within the facility must be identified and documented by the IT Manager.
• Locally stored data on Users’ computers will not be included in scheduled backups; Users must transfer data to network drive folders.
• The Managing Director/Manager or IT Manager shall decide on the minimum backup requirements and the frequency/type of backups for their respective systems.
• The IT Manager shall maintain a record of all backup requirements, including the type of information/data, backup frequency, storage media, retention, and disposal.

### Backup Schedule
• Backups shall be conducted regularly as defined by the IT Manager to ensure data availability in case of system failures.
• The Technical Support team must perform minimum backup levels for each server hosting production data, as agreed with the Managing Director/Manager.
• New production servers must be included in the backup schedule immediately.
• In case of a scheduled backup failure, the IT Manager must reschedule the backup and inform the Managing Director/Manager.
• The root cause of backup failures must be identified, documented, and shared with the Managing Director/Manager.
• Backups must be taken before and after any changes, such as upgrades or patching, to systems, applications, or network devices.
• A regular backup must be maintained for all systems software, applications, user data, databases, and associated documentation.

📦 **ACTIVE FACILITY BACKUP PLAN MATRIX:**

${backupPlanMatrixLines}

Restoration tests are conducted on a biannual schedule to guarantee the readiness of recovery systems.

### Performing Backups
• The backup operations will be logged and reviewed. Logs must include details such as start and end times, media used, and backup success/failure status.
• Unscheduled/one-time backups require specific authorization from the IT Manager and must be documented.

### Backup Storage
• Backup media will be stored onsite within the organization’s premises (${storageMediaLabel}).
• Physical access to backup media and storage locations will be restricted to authorized personnel and secured with appropriate controls/encryption.
• A physical access log will be maintained and reviewed periodically by the IT Manager.
• Backup media will be stored in an environment protected from fire, dust, humidity, and magnetic interference.

### Backup Media Handling and Storage
• Backup (${storageMediaLabel}) devices will be used for ${backupPlanFrequencies} backups, and all backup media must be clearly identified.
• Access to backup media must be restricted and secured.
• Backup media will be securely disposed of at the end of their life, following degaussing, label/tag removal, and physical destruction if necessary.
• Handling of backup media must follow the manufacturer’s recommendations to prevent damage.

### Media and Restoration Management
• An up-to-date inventory of all backup media, including media identification, data contents, physical location, and usage history, will be maintained by the IT team.
• Media due for disposal will be identified and reported for approval by the respective system owners.`,
      core_principles: `### Testing and Restoring
• Full data restores will be performed according to an annual restore plan, reviewed by the IT Manager.
Data restoration will be necessary if:
• A system/device is compromised.
• Files are corrupted, deleted, or incorrectly modified.
• Archived data needs to be accessed.
• Restoration requests must be approved by the IT Manager, and Users should contact the IT Manager for restore requests.
• The IT team will verify the readability and restorability of backup media, with data restoration tests conducted at least once annually or during version changes.

### Audit and Review
• The Information Security Team will regularly review the policy to ensure compliance.`,
      compliance_disciplinary: `Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws.`,
      compliance_clarifications: `Users unsure about this policy should seek clarification from the IT Manager.`,
      compliance_checks: `The IT Manager reserves the right to check compliance with this policy.`,
      compliance_exceptions: `The IT Manager reserves the right to approve exceptions on a case-by-case basis.`,
      full_content: `## POL-SEC-021: Information Data Backup & Restoration Policy

### OBJECTIVE
The objective of this policy is to define adequate backup requirements for the critical information and data of the facility and ensure their availability in the event of a disruption.

### SCOPE
This policy covers all information/data stored and processed in production, development, test environments, file servers, as well as network and security devices owned by Smartpro Consultancy.

### RESPONSIBILITIES

#### IT Manager:
• Responsible for the development, maintenance, enforcement, and endorsement of the policy.
• Supports the relevant business unit/section in implementing the defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Ensures that backups are taken as per operational requirements, in consultation with the Managing Director/Manager.
• Schedules and handles backup media.
• Oversees the implementation of this policy in day-to-day operations.

#### Managing Director/Manager:
• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum backup requirements and frequency.

#### All Users:
• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.

### POLICY IN DETAIL

#### Backup Requirements
• Backup requirements for all information systems within the facility must be identified and documented by the IT Manager.
• Locally stored data on Users’ computers will not be included in scheduled backups; Users must transfer data to network drive folders.
• The Managing Director/Manager or IT Manager shall decide on the minimum backup requirements and the frequency/type of backups for their respective systems.
• The IT Manager shall maintain a record of all backup requirements, including the type of information/data, backup frequency, storage media, retention, and disposal.

#### Backup Schedule
• Backups shall be conducted regularly as defined by the IT Manager to ensure data availability in case of system failures.
• The Technical Support team must perform minimum backup levels for each server hosting production data, as agreed with the Managing Director/Manager.
• New production servers must be included in the backup schedule immediately.
• In case of a scheduled backup failure, the IT Manager must reschedule the backup and inform the Managing Director/Manager.
• The root cause of backup failures must be identified, documented, and shared with the Managing Director/Manager.
• Backups must be taken before and after any changes, such as upgrades or patching, to systems, applications, or network devices.
• A regular backup must be maintained for all systems software, applications, user data, databases, and associated documentation.

📦 **ACTIVE FACILITY BACKUP PLAN MATRIX:**

${backupPlanMatrixLines}

Restoration tests are conducted on a biannual schedule to guarantee the readiness of recovery systems.

#### Performing Backups
• The backup operations will be logged and reviewed. Logs must include details such as start and end times, media used, and backup success/failure status.
• Unscheduled/one-time backups require specific authorization from the IT Manager and must be documented.

#### Backup Storage
• Backup media will be stored onsite within the organization’s premises (${storageMediaLabel}).
• Physical access to backup media and storage locations will be restricted to authorized personnel and secured with appropriate controls/encryption.
• A physical access log will be maintained and reviewed periodically by the IT Manager.
• Backup media will be stored in an environment protected from fire, dust, humidity, and magnetic interference.

#### Backup Media Handling and Storage
• Backup (${storageMediaLabel}) devices will be used for ${backupPlanFrequencies} backups, and all backup media must be clearly identified.
• Access to backup media must be restricted and secured.
• Backup media will be securely disposed of at the end of their life, following degaussing, label/tag removal, and physical destruction if necessary.
• Handling of backup media must follow the manufacturer’s recommendations to prevent damage.

#### Media and Restoration Management
• An up-to-date inventory of all backup media, including media identification, data contents, physical location, and usage history, will be maintained by the IT team.
• Media due for disposal will be identified and reported for approval by the respective system owners.

#### Testing and Restoring
• Full data restores will be performed according to an annual restore plan, reviewed by the IT Manager.
Data restoration will be necessary if:
• A system/device is compromised.
• Files are corrupted, deleted, or incorrectly modified.
• Archived data needs to be accessed.
• Restoration requests must be approved by the IT Manager, and Users should contact the IT Manager for restore requests.
• The IT team will verify the readability and restorability of backup media, with data restoration tests conducted at least once annually or during version changes.

#### Audit and Review
• The Information Security Team will regularly review the policy to ensure compliance.

### POLICY COMPLIANCE
Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws. Users unsure about this policy should seek clarification from the IT Manager. The IT Manager reserves the right to check compliance with this policy and approve exceptions on a case-by-case basis.`
    };

    // 5. Information Security Incidents Management Policy (POL-SEC-025)
    const pIncident: Policy = {
      id: `POL-SEC-025-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-025',
      policy_name: 'Information Security Incidents Management Policy',
      version: '1.0',
      category: 'Information Security',
      department: 'IT Department',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: `The objective of this policy is to specify incident triage, logging, and SLA escalations for cybersecurity occurrences at [Entity Name], in compliance with Abu Dhabi Department of Health directives.`,
      scope: `Applies to all suspected cyber-attacks, virus outbreaks, unauthorized data transfers, physical security breaches, or EMR outages.`,
      policy_statement: `Cybersecurity breaches or operational incidents must be classified and resolved in strict conformity with Abu Dhabi Health SLA agreements.

🚨 **DOH COMPLIANT INCIDENT RESPONSE SLAS & CHANNELS:**

${slaTableText}

Responsible incident handlers must monitor these response timeframes and report directly to the Health SOC.`,
      core_principles: `1. Standardized Severity Triage: Incidents are logged and sorted by severity (P1 to P4).
2. AD Health SOC Integration: Formal notifications are sent within the SLA timeframes to soc@doh.gov.ae.
3. SLA Verification: Security officers must log acknowledgment and resolution metrics.
4. Post-Incident Audit: A formal root-cause analysis must be documented within 48 hours of resolving any critical incident.`
    };

    // 6. Procedure for Control of Documentation (POL-SEC-031)
    const docControlDefaults = getPolicyTemplateDefaults('POL-SEC-031', client?.company_name || 'Medical Center & Pharmacy');
    const pDocControl: Policy = {
      id: `POL-SEC-031-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'POL-SEC-031',
      policy_name: 'Procedure for Control of Documentation',
      version: '1.0',
      category: 'Clinical Quality Operations',
      department: 'Quality',
      document_type: 'Procedure',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: docControlDefaults.objective || '',
      scope: docControlDefaults.scope || '',
      policy_statement: docControlDefaults.policy_statement || '',
      core_principles: docControlDefaults.core_principles || '',
      compliance_disciplinary: docControlDefaults.compliance_disciplinary || '',
      compliance_clarifications: docControlDefaults.compliance_clarifications || '',
      compliance_checks: docControlDefaults.compliance_checks || '',
      compliance_exceptions: docControlDefaults.compliance_exceptions || '',
      resp_it_manager: docControlDefaults.resp_it_manager || '',
      resp_md: docControlDefaults.resp_md || '',
      resp_all_users: docControlDefaults.resp_all_users || ''
    };

    // 7. Statement of Applicability (M-Policy-002)
    const clientNameStr = client?.company_name || 'Smartpro Consultancy';
    const soaTableMarkdown = `### CONTROL OBJECTIVES AND APPLICABILITY

The following control objectives are applicable to ${clientNameStr}:

| Control Area | Control Objective | Applicability |
|---|---|---|
${soaControls.map(c => `| ${c.area} | ${c.objective} | ${c.applicability} |`).join('\n')}`;

    const soaDefaults = getPolicyTemplateDefaults('M-Policy-002', clientNameStr);
    const pSoa: Policy = {
      id: `M-Policy-002-${activeClientId}`,
      client_id: activeClientId,
      policy_no: 'M-Policy-002',
      policy_name: 'Statement of Applicability',
      version: '1.0',
      category: 'Information Security',
      department: 'Quality',
      document_type: 'Policy',
      classification: 'Confidential',
      review_date: dateStr,
      issue_date: dateStr,
      next_due_date: nextYearStr,
      approval_date: dateStr,
      prepared_by_name: wizardPreparedByName,
      prepared_by_designation: wizardPreparedByDesignation,
      prepared_by_sign: wizardPreparedSignMode === 'BLANK' ? 'BLANK' : wizardPreparedBySign,
      reviewed_by_name: wizardReviewedByName,
      reviewed_by_designation: wizardReviewedByDesignation,
      reviewed_by_sign: wizardReviewedSignMode === 'BLANK' ? 'BLANK' : wizardReviewedBySign,
      approved_by_name: wizardApprovedByName,
      approved_by_designation: wizardApprovedByDesignation,
      approved_by_sign: wizardApprovedSignMode === 'BLANK' ? 'BLANK' : wizardApprovedBySign,
      show_reviewed_by: wizardShowReviewedBy,
      status: 'APPROVED',
      created_at: nowStr,
      objective: soaDefaults.objective || '',
      scope: soaDefaults.scope || '',
      policy_statement: soaTableMarkdown,
      core_principles: soaDefaults.core_principles || '',
      compliance_disciplinary: soaDefaults.compliance_disciplinary || '',
      compliance_clarifications: soaDefaults.compliance_clarifications || '',
      compliance_checks: soaDefaults.compliance_checks || '',
      compliance_exceptions: soaDefaults.compliance_exceptions || '',
      resp_it_manager: soaDefaults.resp_it_manager || '',
      resp_md: soaDefaults.resp_md || '',
      resp_all_users: soaDefaults.resp_all_users || ''
    };

    // Add or update these policies
    const policiesToSubmit = [pAntivirus, pAccess, pPhysical, pBackup, pIncident, pDocControl, pSoa];
    
    // Call onAddPolicy or onUpdatePolicy for each
    policiesToSubmit.forEach(p => {
      const exists = policies.some(existing => existing.policy_no === p.policy_no && existing.client_id === activeClientId);
      if (exists) {
        if (onUpdatePolicy) {
          const existingPolicy = policies.find(existing => existing.policy_no === p.policy_no && existing.client_id === activeClientId);
          if (existingPolicy) {
            onUpdatePolicy({
              ...p,
              id: existingPolicy.id
            });
          }
        }
      } else {
        onAddPolicy(p);
      }
    });

    setIsQuickSetupOpen(false);
  };

  // Selected policy for metadata control sheet modal view
  const [selectedPolicyForSheet, setSelectedPolicyForSheet] = useState<Policy | null>(null);
  const [isEditingSheet, setIsEditingSheet] = useState(false);
  const [editPolicyNo, setEditPolicyNo] = useState('');
  const [editPolicyName, setEditPolicyName] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editClassification, setEditClassification] = useState<'Confidential' | 'Restricted' | 'Secret'>('Confidential');
  const [editCategory, setEditCategory] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editReviewDate, setEditReviewDate] = useState('');
  const [editNextDueDate, setEditNextDueDate] = useState('');
  const [editApprovalDate, setEditApprovalDate] = useState('');
  const [editPreparedByName, setEditPreparedByName] = useState('');
  const [editPreparedByDesignation, setEditPreparedByDesignation] = useState('');
  const [editReviewedByName, setEditReviewedByName] = useState('');
  const [editReviewedByDesignation, setEditReviewedByDesignation] = useState('');
  const [editApprovedByName, setEditApprovedByName] = useState('');
  const [editApprovedByDesignation, setEditApprovedByDesignation] = useState('');
  const [editScopeClause1, setEditScopeClause1] = useState('');
  const [editScopeClause2, setEditScopeClause2] = useState('');
  const [editScopeClause3, setEditScopeClause3] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editScope, setEditScope] = useState('');
  const [editRespItManager, setEditRespItManager] = useState('');
  const [editRespMd, setEditRespMd] = useState('');
  const [editRespAllUsers, setEditRespAllUsers] = useState('');
  const [editPolicyStatement, setEditPolicyStatement] = useState('');
  const [editCorePrinciples, setEditCorePrinciples] = useState('');
  const [editComplianceDisciplinary, setEditComplianceDisciplinary] = useState('');
  const [editComplianceClarifications, setEditComplianceClarifications] = useState('');
  const [editComplianceChecks, setEditComplianceChecks] = useState('');
  const [editComplianceExceptions, setEditComplianceExceptions] = useState('');
  const [editPreparedBySign, setEditPreparedBySign] = useState('');
  const [editPreparedBySignMode, setEditPreparedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [editReviewedBySign, setEditReviewedBySign] = useState('');
  const [editReviewedBySignMode, setEditReviewedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [editApprovedBySign, setEditApprovedBySign] = useState('');
  const [editApprovedBySignMode, setEditApprovedBySignMode] = useState<'DIGITAL' | 'BLANK'>('DIGITAL');
  const [editShowReviewedBy, setEditShowReviewedBy] = useState(true);
  const [pastedPolicyText, setPastedPolicyText] = useState('');
  const [showManualTune, setShowManualTune] = useState(false);
  const [editLayoutFormat, setEditLayoutFormat] = useState<'box' | 'table'>('box');
  const [docFontSize, setDocFontSize] = useState<'small' | 'normal' | 'medium' | 'large'>('normal');
  const [editFullContent, setEditFullContent] = useState('');
  const [docThemeColor, setDocThemeColor] = useState<'emerald' | 'blue' | 'teal' | 'crimson' | 'slate'>('emerald');
  const [editorMode, setEditorMode] = useState<'unified' | 'sections'>('unified');

  const handleInsertTemplate = (
    setter: (val: string) => void,
    currentVal: string,
    type: 'table' | 'box'
  ) => {
    const tableTpl = `\n| Option | Criteria | Requirement |\n|---|---|---|\n| Standard | Check log | Formal approval |\n| High-Risk | MFA enabled | CIO auth required |\n`;
    const boxTpl = `\n> 💡 **IMPORTANT GOVERNANCE COMPLIANCE NOTE**\n> All staff members must periodically check and review their assigned security guidelines and adhere strictly to these principles.\n`;
    setter(currentVal + (type === 'table' ? tableTpl : boxTpl));
  };

  const openPolicySheet = (policy: Policy) => {
    setSelectedPolicyForSheet(policy);
    setIsEditingSheet(false);
    setEditFrameworkGroup(
      (policy.framework_group as FrameworkGroupTier) ||
      determineDefaultFrameworkGroup(policy.policy_no, policy.policy_name, policy.document_type)
    );
    setEditLayoutFormat(policy.layout_format || 'box');
    setEditPolicyNo(policy.policy_no || '');
    setEditPolicyName(policy.policy_name || '');
    setEditVersion(policy.version || '1.0');
    setEditDepartment(policy.department || 'Quality');
    setEditClassification(policy.classification || 'Confidential');
    setEditCategory(policy.category || '');
    setEditIssueDate(policy.issue_date || new Date().toISOString().split('T')[0]);
    setEditReviewDate(policy.review_date || new Date().toISOString().split('T')[0]);
    setEditNextDueDate(policy.next_due_date || new Date().toISOString().split('T')[0]);
    setEditApprovalDate(policy.approval_date || new Date().toISOString().split('T')[0]);
    setEditPreparedByName(policy.prepared_by_name || 'Sarah Jenkins');
    setEditPreparedByDesignation(policy.prepared_by_designation || 'Information Security Officer');
    setEditReviewedByName(policy.reviewed_by_name || 'Tareq Al Mansoori');
    setEditReviewedByDesignation(policy.reviewed_by_designation || 'Senior Compliance Consultant');
    setEditApprovedByName(policy.approved_by_name || 'Dr. Johnathan Carter');
    setEditApprovedByDesignation(policy.approved_by_designation || 'Chief Medical Officer');
    setEditScopeClause1(policy.scope_clause_1 || `This digital regulation establishes and enforces operational standards at ${client?.company_name || 'the facility'}.`);
    setEditScopeClause2(policy.scope_clause_2 || 'Staff, clinical operations teams, and compliance coordinators are bound by the governance guidelines detailed herein.');
    setEditScopeClause3(policy.scope_clause_3 || 'Information security controls are continuously mapped to Malaffi, Nabidh, and DOH Abu Dhabi directives respectively.');
    
    const defaults = getPolicyTemplateDefaults(policy.policy_no || '', client?.company_name);
    const objVal = policy.objective || defaults.objective;
    const scopeVal = policy.scope || defaults.scope;
    const respItVal = policy.resp_it_manager || defaults.resp_it_manager;
    const respMdVal = policy.resp_md || defaults.resp_md;
    const respUserVal = policy.resp_all_users || defaults.resp_all_users;
    
    let stmtVal = policy.policy_statement || defaults.policy_statement;
    if (policy.policy_no === 'POL-SEC-019') {
      if (!stmtVal || !stmtVal.includes('| Change Type |') || !stmtVal.includes('Emergency Change')) {
        stmtVal = defaults.policy_statement;
      }
    }
    const principlesVal = policy.core_principles || defaults.core_principles;
    const complianceDispVal = policy.compliance_disciplinary || defaults.compliance_disciplinary;
    const complianceClarVal = policy.compliance_clarifications || defaults.compliance_clarifications;
    const complianceCheckVal = policy.compliance_checks || defaults.compliance_checks;
    const complianceExceptionVal = policy.compliance_exceptions || defaults.compliance_exceptions;

    setEditObjective(objVal);
    setEditScope(scopeVal);
    setEditRespItManager(respItVal);
    setEditRespMd(respMdVal);
    setEditRespAllUsers(respUserVal);
    setEditPolicyStatement(stmtVal);
    setEditCorePrinciples(principlesVal);
    setEditComplianceDisciplinary(complianceDispVal);
    setEditComplianceClarifications(complianceClarVal);
    setEditComplianceChecks(complianceCheckVal);
    setEditComplianceExceptions(complianceExceptionVal);

    // Reconstruct full policy text for pasting & auto-adjust
    const fullText = `### 1. OBJECTIVE & SCOPE

#### OBJECTIVE
${objVal}

#### SCOPE
${scopeVal}

### 2. RESPONSIBILITIES

#### IT MANAGER / DEPARTMENT LEADS
${respItVal}

#### MANAGING DIRECTOR / MANAGER
${respMdVal}

#### ALL USERS / EMPLOYEES
${respUserVal}

### 3. POLICY STATEMENT & CORE PRINCIPLES

#### POLICY STATEMENT
${stmtVal}

#### CORE PRINCIPLES
${principlesVal}

### 4. POLICY COMPLIANCE, EXCEPTIONS & PENALTIES

#### DISCIPLINARY ACTION
${complianceDispVal}

#### CLARIFICATIONS CONTACT
${complianceClarVal}

#### COMPLIANCE CHECKS AUTHORITY
${complianceCheckVal}

#### EXCEPTIONS CRITERIA
${complianceExceptionVal}`;

    setPastedPolicyText(policy.full_content || fullText);
    setEditFullContent(policy.full_content || fullText);
    setDocThemeColor(policy.doc_theme_color || 'emerald');
    setDocFontSize(policy.doc_font_size || 'normal');
    setEditorMode('unified');

    // Initialize signature edit states
    setEditPreparedBySign(policy.prepared_by_sign || DEFAULT_PREPARED_SIGN);
    setEditPreparedBySignMode(policy.prepared_by_sign === 'BLANK' ? 'BLANK' : 'DIGITAL');
    setEditReviewedBySign(policy.reviewed_by_sign || DEFAULT_REVIEWED_SIGN);
    setEditReviewedBySignMode(policy.reviewed_by_sign === 'BLANK' ? 'BLANK' : 'DIGITAL');
    setEditApprovedBySign(policy.approved_by_sign || DEFAULT_APPROVED_SIGN);
    setEditApprovedBySignMode(policy.approved_by_sign === 'BLANK' ? 'BLANK' : 'DIGITAL');
    setEditShowReviewedBy(policy.show_reviewed_by !== false);
  };

  const handlePastedTextChange = (val: string) => {
    setPastedPolicyText(val);
    const parsed = parsePolicyText(val);
    
    setEditObjective(parsed.objective || '');
    setEditScope(parsed.scope || '');
    setEditRespItManager(parsed.resp_it_manager || '');
    setEditRespMd(parsed.resp_md || '');
    setEditRespAllUsers(parsed.resp_all_users || '');
    setEditPolicyStatement(parsed.policy_statement || '');
    setEditCorePrinciples(parsed.core_principles || '');
    setEditComplianceDisciplinary(parsed.compliance_disciplinary || '');
    setEditComplianceClarifications(parsed.compliance_clarifications || '');
    setEditComplianceChecks(parsed.compliance_checks || '');
    setEditComplianceExceptions(parsed.compliance_exceptions || '');

    // Dynamic clause auto-generation to keep brief mandate up-to-date
    if (parsed.objective) {
      const sentences = parsed.objective.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      if (sentences.length > 0) {
        setEditScopeClause1(`This regulation defines standards for: ${sentences[0].substring(0, 120)}...`);
      }
    }
    if (parsed.scope) {
      const sentences = parsed.scope.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      if (sentences.length > 0) {
        setEditScopeClause2(`Audited scope: ${sentences[0].substring(0, 120)}.`);
      }
    }
  };

  const handleSaveSheetChanges = () => {
    if (!selectedPolicyForSheet) return;

    let finalFullContent = editFullContent;
    let finalObjective = editObjective;
    let finalScope = editScope;
    let finalRespIt = editRespItManager;
    let finalRespMd = editRespMd;
    let finalRespUser = editRespAllUsers;
    let finalStmt = editPolicyStatement;
    let finalPrinciples = editCorePrinciples;
    let finalComplianceDisp = editComplianceDisciplinary;
    let finalComplianceClar = editComplianceClarifications;
    let finalComplianceCheck = editComplianceChecks;
    let finalComplianceException = editComplianceExceptions;

    if (editorMode === 'sections') {
      // Clear full_content so sectional view is preferred and rendered
      finalFullContent = '';
    } else {
      // Parse unified content to sync sectional fields
      const parsed = parsePolicyText(editFullContent);
      finalObjective = parsed.objective || editObjective;
      finalScope = parsed.scope || editScope;
      finalRespIt = parsed.resp_it_manager || editRespItManager;
      finalRespMd = parsed.resp_md || editRespMd;
      finalRespUser = parsed.resp_all_users || editRespAllUsers;
      finalStmt = parsed.policy_statement || editPolicyStatement;
      finalPrinciples = parsed.core_principles || editCorePrinciples;
      finalComplianceDisp = parsed.compliance_disciplinary || editComplianceDisciplinary;
      finalComplianceClar = parsed.compliance_clarifications || editComplianceClarifications;
      finalComplianceCheck = parsed.compliance_checks || editComplianceChecks;
      finalComplianceException = parsed.compliance_exceptions || editComplianceExceptions;
    }

    const updatedPolicy: Policy = {
      ...selectedPolicyForSheet,
      policy_no: editPolicyNo,
      policy_name: editPolicyName,
      version: editVersion,
      department: editDepartment,
      classification: editClassification,
      category: editCategory,
      issue_date: editIssueDate,
      review_date: editReviewDate,
      next_due_date: editNextDueDate,
      approval_date: editApprovalDate,
      prepared_by_name: editPreparedByName,
      prepared_by_designation: editPreparedByDesignation,
      reviewed_by_name: editReviewedByName,
      reviewed_by_designation: editReviewedByDesignation,
      approved_by_name: editApprovedByName,
      approved_by_designation: editApprovedByDesignation,
      scope_clause_1: editScopeClause1,
      scope_clause_2: editScopeClause2,
      scope_clause_3: editScopeClause3,
      objective: finalObjective,
      scope: finalScope,
      resp_it_manager: finalRespIt,
      resp_md: finalRespMd,
      resp_all_users: finalRespUser,
      policy_statement: finalStmt,
      core_principles: finalPrinciples,
      compliance_disciplinary: finalComplianceDisp,
      compliance_clarifications: finalComplianceClar,
      compliance_checks: finalComplianceCheck,
      compliance_exceptions: finalComplianceException,
      layout_format: editLayoutFormat,
      full_content: finalFullContent,
      doc_theme_color: docThemeColor,
      doc_font_size: docFontSize,
      prepared_by_sign: editPreparedBySignMode === 'BLANK' ? 'BLANK' : editPreparedBySign,
      reviewed_by_sign: editReviewedBySignMode === 'BLANK' ? 'BLANK' : editReviewedBySign,
      approved_by_sign: editApprovedBySignMode === 'BLANK' ? 'BLANK' : editApprovedBySign,
      show_reviewed_by: editShowReviewedBy,
      framework_group: editFrameworkGroup,
    };

    saveCustomGroupAssignment(editPolicyNo || selectedPolicyForSheet.id, editFrameworkGroup);

    if (onUpdatePolicy) {
      onUpdatePolicy(updatedPolicy);
    }
    setSelectedPolicyForSheet(updatedPolicy);
    setIsEditingSheet(false);
  };

  const replaceEntityName = (text: any) => {
    if (typeof text !== 'string') return '';
    return text.split('[Entity Name]').join(client?.company_name || 'the facility');
  };

  // Filter policies matching current tenant client context
  const clientPolicies = policies.filter(p => p.client_id === activeClientId);

  const filteredPolicies = clientPolicies.filter(p =>
    p.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.policy_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'prepared' | 'reviewed' | 'approved'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'prepared') setPreparedBySign(reader.result);
          if (type === 'reviewed') setReviewedBySign(reader.result);
          if (type === 'approved') setApprovedBySign(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteClone = () => {
    if (!policyToClone) return;

    const sourceClient = clients.find(c => c.id === policyToClone.client_id);
    const sourceClientName = sourceClient ? sourceClient.company_name : '';

    const replaceClientNamesInPolicy = (policy: Policy, fromName: string, toName: string): Policy => {
      const textFields: (keyof Policy)[] = [
        'scope_clause_1', 'scope_clause_2', 'scope_clause_3',
        'objective', 'scope', 'policy_statement', 'core_principles',
        'compliance_disciplinary', 'compliance_clarifications',
        'compliance_checks', 'compliance_exceptions', 'full_content'
      ];
      const updated: Partial<Policy> = {};
      textFields.forEach(field => {
        const val = policy[field];
        if (typeof val === 'string' && val) {
          let newVal = val;
          if (fromName) {
            const regex = new RegExp(fromName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            newVal = newVal.replace(regex, toName);
          }
          // Also clean up standard placeholders
          newVal = newVal.replace(/\[Entity Name\]/g, toName);
          (updated as any)[field] = newVal;
        }
      });
      return { ...policy, ...updated };
    };

    if (cloneMode === 'INDIVIDUAL') {
      if (!cloneTargetClientId) return;
      const targetClient = clients.find(c => c.id === cloneTargetClientId);
      const targetClientName = targetClient ? targetClient.company_name : '';

      let cloned: Policy = {
        ...policyToClone,
        id: 'p_clone_' + Date.now(),
        client_id: cloneTargetClientId,
        policy_no: clonePolicyNo || policyToClone.policy_no,
        policy_name: clonePolicyName || policyToClone.policy_name,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        review_date: new Date().toISOString().split('T')[0]
      };

      if (targetClientName) {
        cloned = replaceClientNamesInPolicy(cloned, sourceClientName, targetClientName);
      }

      onAddPolicy(cloned);
    } else {
      // Group cloning mode
      if (cloneTargetClientIds.length === 0) return;

      cloneTargetClientIds.forEach((cid, index) => {
        const targetClient = clients.find(c => c.id === cid);
        const targetClientName = targetClient ? targetClient.company_name : '';

        let cloned: Policy = {
          ...policyToClone,
          id: `p_clone_${cid}_${Date.now()}_${index}`,
          client_id: cid,
          policy_no: clonePolicyNo ? `${clonePolicyNo}-${targetClient?.client_code || index}` : `${policyToClone.policy_no}-${targetClient?.client_code || index}`,
          policy_name: clonePolicyName ? `${clonePolicyName} (${targetClient?.company_name || cid})` : `${policyToClone.policy_name} (${targetClient?.company_name || cid})`,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          review_date: new Date().toISOString().split('T')[0]
        };

        if (targetClientName) {
          cloned = replaceClientNamesInPolicy(cloned, sourceClientName, targetClientName);
        }

        onAddPolicy(cloned);
      });
    }

    // Reset clone state
    setPolicyToClone(null);
    setCloneTargetClientId('');
    setCloneTargetClientIds([]);
    setClonePolicyNo('');
    setClonePolicyName('');
  };

  const handleExecuteBulkClone = () => {
    if (bulkCloneTargetIds.length === 0) return;
    const currentTenantPolicies = policies.filter(p => p.client_id === activeClientId);
    if (currentTenantPolicies.length === 0) return;

    const sourceClient = clients.find(c => c.id === activeClientId);
    const sourceClientName = sourceClient ? sourceClient.company_name : '';

    const replaceClientNamesInPolicy = (policy: Policy, fromName: string, toName: string): Policy => {
      const textFields: (keyof Policy)[] = [
        'scope_clause_1', 'scope_clause_2', 'scope_clause_3',
        'objective', 'scope', 'policy_statement', 'core_principles',
        'compliance_disciplinary', 'compliance_clarifications',
        'compliance_checks', 'compliance_exceptions', 'full_content'
      ];
      const updated: Partial<Policy> = {};
      textFields.forEach(field => {
        const val = policy[field];
        if (typeof val === 'string' && val) {
          let newVal = val;
          if (fromName) {
            const regex = new RegExp(fromName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            newVal = newVal.replace(regex, toName);
          }
          newVal = newVal.replace(/\[Entity Name\]/g, toName);
          (updated as any)[field] = newVal;
        }
      });
      return { ...policy, ...updated };
    };

    let cloneCount = 0;

    bulkCloneTargetIds.forEach(targetCid => {
      const targetClient = clients.find(c => c.id === targetCid);
      const targetClientName = targetClient ? targetClient.company_name : '';

      currentTenantPolicies.forEach((policyToCopy, index) => {
        let cloned: Policy = {
          ...policyToCopy,
          id: `p_bulk_clone_${targetCid}_${Date.now()}_${index}`,
          client_id: targetCid,
          policy_no: policyToCopy.policy_no,
          policy_name: policyToCopy.policy_name,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          review_date: new Date().toISOString().split('T')[0]
        };

        if (targetClientName) {
          cloned = replaceClientNamesInPolicy(cloned, sourceClientName, targetClientName);
        }

        onAddPolicy(cloned);
        cloneCount++;
      });
    });

    setBulkCloneSuccess(`Successfully cloned ${currentTenantPolicies.length} master policies into ${bulkCloneTargetIds.length} tenants (total ${cloneCount} files generated).`);
    setBulkCloneTargetIds([]);
    setTimeout(() => {
      setIsBulkCloning(false);
      setBulkCloneSuccess(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyNo || !policyName) return;

    let nextIdNum = policies.length + 1;
    while (policies.some(p => p.id === 'p' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'p' + nextIdNum;

    const newPolicy: Policy = {
      id: newId,
      client_id: activeClientId,
      policy_no: policyNo,
      policy_name: policyName,
      version,
      review_date: reviewDate || new Date().toISOString().split('T')[0],
      status,
      category,
      created_at: new Date().toISOString(),
      department,
      document_type: documentType,
      approval_date: approvalDate,
      issue_date: issueDate,
      next_due_date: nextDueDate,
      reviewed_by_name: reviewedByName,
      reviewed_by_designation: reviewedByDesignation,
      approved_by_name: approvedByName,
      approved_by_designation: approvedByDesignation,
      prepared_by_name: preparedByName,
      prepared_by_designation: preparedByDesignation,
      prepared_by_sign: preparedBySignMode === 'BLANK' ? 'BLANK' : preparedBySign,
      reviewed_by_sign: reviewedBySignMode === 'BLANK' ? 'BLANK' : reviewedBySign,
      approved_by_sign: approvedBySignMode === 'BLANK' ? 'BLANK' : approvedBySign,
      show_reviewed_by: showReviewedBy,
      classification,
      framework_group: frameworkGroup,
      ...(draftMode === 'ai' && aiExtractedFields ? aiExtractedFields : {})
    };

    saveCustomGroupAssignment(policyNo || newId, frameworkGroup);

    onAddPolicy(newPolicy);
    setPolicyNo('');
    setPolicyName('');
    setVersion('1.0');
    setReviewDate('');
    setReviewedByName('Tareq Al Mansoori');
    setReviewedByDesignation('Senior Compliance Consultant');
    setApprovedByName('Dr. Johnathan Carter');
    setApprovedByDesignation('Chief Medical Officer');
    setPreparedByName('Sarah Jenkins');
    setPreparedByDesignation('Information Security Officer');
    setPreparedBySign(DEFAULT_PREPARED_SIGN);
    setReviewedBySign(DEFAULT_REVIEWED_SIGN);
    setApprovedBySign(DEFAULT_APPROVED_SIGN);
    setAiExtractedFields(null);
    setAiRawText('');
    setExtractError(null);
    setIsAdding(false);
  };

  const activeTheme = getThemeClasses(docThemeColor);

  return (
    <div id="policy-management-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Policy Frameworks Setup
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage corporate policies, track periodic reviews, and monitor regulatory declarations.</p>
        </div>
        {!isAdding && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsQuickSetupOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              title="Quick setup for standard policies including Access Control, Physical Security, Backups, and Incidents"
            >
              <Wrench className="w-4 h-4" />
              Quick Setup
            </button>
            {onBulkFeedPolicies && (
              <button
                type="button"
                onClick={() => {
                  const newPolicies: Policy[] = AUTOMATIC_POLICY_TEMPLATES.map((tpl, i) => {
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    const defaults = getPolicyTemplateDefaults(tpl.code, client?.company_name);
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
                      objective: defaults.objective,
                      scope: defaults.scope,
                      resp_it_manager: defaults.resp_it_manager,
                      resp_md: defaults.resp_md,
                      resp_all_users: defaults.resp_all_users,
                      policy_statement: defaults.policy_statement,
                      core_principles: defaults.core_principles,
                      compliance_disciplinary: defaults.compliance_disciplinary,
                      compliance_clarifications: defaults.compliance_clarifications,
                      compliance_checks: defaults.compliance_checks,
                      compliance_exceptions: defaults.compliance_exceptions,
                    };
                  });
                  onBulkFeedPolicies(newPolicies);
                }}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Populate all 32 UAE standard healthcare policy drafts instantly"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Auto-draft 32 Policies
              </button>
            )}

            {clientPolicies.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsBulkCloning(true);
                  setBulkCloneTargetIds([]);
                }}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Clone all policies in this tenant to other tenants"
              >
                <Copy className="w-4 h-4 text-amber-500" />
                Clone All to Tenant
              </button>
            )}
            
            <button
              id="btn-add-policy"
              onClick={() => {
                setIsAdding(true);
                setDraftMode('automatic');
                // Initialize with first template default values
                const defaultTpl = AUTOMATIC_POLICY_TEMPLATES[0];
                setPolicyNo(defaultTpl.code);
                setPolicyName(defaultTpl.title);
                setCategory(defaultTpl.domain);
                setDepartment(defaultTpl.dept);
                setDocumentType(defaultTpl.doc_type as any);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Policy File
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Draft New Compliance Policy</h3>
            
            {/* Mode Selectors */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setDraftMode('automatic');
                  const defaultTpl = AUTOMATIC_POLICY_TEMPLATES[0];
                  setPolicyNo(defaultTpl.code);
                  setPolicyName(defaultTpl.title);
                  setCategory(defaultTpl.domain);
                  setDepartment(defaultTpl.dept);
                  setDocumentType(defaultTpl.doc_type as any);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  draftMode === 'automatic'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Automatic Feed
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftMode('manual');
                  setPolicyNo('');
                  setPolicyName('');
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  draftMode === 'manual'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftMode('ai');
                  setPolicyNo('');
                  setPolicyName('');
                  setAiRawText('');
                  setAiExtractedFields(null);
                  setExtractError(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  draftMode === 'ai'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                AI Word/Text Capture
              </button>
            </div>
          </div>

          {draftMode === 'ai' && (
            <div className="bg-gradient-to-br from-amber-50/40 to-emerald-50/30 p-4 rounded-xl border border-emerald-100/70 space-y-3.5 animate-fade-in">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                Smart AI Policy Capture & Extraction
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Upload your client's existing <strong>.docx (MS Word)</strong> policy document, or paste raw policy draft text directly. Our secure Gemini AI will instantly parse the document structure and map it into compliance standards!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag and Drop/Upload Container */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-white p-5 rounded-xl transition-all cursor-pointer relative group min-h-[140px]">
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleDocxFileUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    disabled={isExtracting}
                  />
                  <Upload className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700">Upload Policy (.docx)</span>
                  <span className="text-[10px] text-slate-400 mt-1">Drag and drop file here, or click to browse</span>
                </div>

                {/* Text Paste Input */}
                <div className="space-y-1.5 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    📋 Or Paste Policy Text:
                  </span>
                  <textarea
                    rows={5}
                    value={aiRawText}
                    onChange={(e) => setAiRawText(e.target.value)}
                    placeholder="Paste policy document content here..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-sans flex-1 resize-none"
                    disabled={isExtracting}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-emerald-100/50">
                <div className="flex-1">
                  {extractError ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {extractError}
                    </div>
                  ) : aiExtractedFields ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Parsed successfully! Policy info and metadata populated below.
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Press "AI Capture & Fill" to trigger secure server-side extraction.</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAiExtract(aiRawText)}
                  disabled={isExtracting || !aiRawText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end sm:self-auto"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Capture & Fill
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {draftMode === 'automatic' && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 space-y-2.5">
              <label className="block text-xs font-bold text-emerald-900">Select pre-filled compliance policy to auto-feed:</label>
              <select
                onChange={(e) => {
                  const selectedIdx = parseInt(e.target.value);
                  const tpl = AUTOMATIC_POLICY_TEMPLATES[selectedIdx];
                  if (tpl) {
                    setPolicyNo(tpl.code);
                    setPolicyName(tpl.title);
                    setCategory(tpl.domain);
                    setDepartment(tpl.dept);
                    setDocumentType(tpl.doc_type as any);
                  }
                }}
                defaultValue="0"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-medium text-slate-700 shadow-xs"
              >
                {AUTOMATIC_POLICY_TEMPLATES.map((tpl, idx) => (
                  <option key={idx} value={idx}>
                    {tpl.title} ({tpl.code})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-emerald-700 font-medium">
                💡 Choosing a policy template automatically fills the form below with standard compliance metadata, which you can still freely edit!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Section 1: Document Reference ID & Titles */}
            <div className="md:col-span-3 border-b border-slate-100 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">1. Document Reference Information & Framework Tier Group</span>
              <span className="text-[10px] text-slate-500 font-mono">Select B, T, or A to assign tier</span>
            </div>

            <div className="md:col-span-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <BTATierSelector
                value={frameworkGroup}
                onChange={setFrameworkGroup}
                label="Framework Tier Group Assignment (B, T, A Shortcuts)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Document Code / Policy ID *</label>
              <input
                type="text"
                value={policyNo}
                onChange={e => setPolicyNo(e.target.value)}
                placeholder="e.g. DOC-QMS-001"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Document Title *</label>
              <input
                type="text"
                value={policyName}
                onChange={e => setPolicyName(e.target.value)}
                placeholder="e.g. Procedure for Control of Documentation"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
              >
                <option value="Quality">Quality Department</option>
                <option value="Administration">Administration</option>
                <option value="IT Department">IT Department</option>
                <option value="HR Department">HR Department</option>
                <option value="Clinical Operations">Clinical Operations</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={e => setDocumentType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
              >
                <option value="Policy">Policy</option>
                <option value="Procedure">Procedure</option>
                <option value="Form">Form</option>
                <option value="Guideline">Guideline</option>
                <option value="Record">Record</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Version Number</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="V1.0"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Section 2: Document Classification */}
            <div className="md:col-span-3 border-b border-slate-100 pb-1 pt-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">2. Security Classification</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Document Classification</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-bold text-slate-700"
              >
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
                <option value="Secret">Secret</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category Domain</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
              >
                <option value="Information Security">Information Security</option>
                <option value="Patient Data Privacy">Patient Data Privacy</option>
                <option value="Asset Management">Asset Management</option>
                <option value="EHR Security">EHR Security</option>
                <option value="Clinical Quality Operations">Clinical Quality Operations</option>
                <option value="Business Continuity">Business Continuity</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Approval State</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white font-bold"
              >
                <option value="APPROVED">APPROVED (Active)</option>
                <option value="UNDER_REVIEW">UNDER REVIEW (Drafting)</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            {/* Section 3: Review and Approvals */}
            <div className="md:col-span-3 border-b border-slate-100 pb-1 pt-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">3. Document Sign-off Team (Prepared, Reviewed & Approved)</span>
            </div>
            
            {/* Prepared By block */}
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">A. Prepared By (Author)</span>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Author Name *</label>
                <input
                  type="text"
                  value={preparedByName}
                  onChange={e => setPreparedByName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Author Designation *</label>
                <input
                  type="text"
                  value={preparedByDesignation}
                  onChange={e => setPreparedByDesignation(e.target.value)}
                  placeholder="e.g. Compliance Officer"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Author Signature (PNG/JPG)</label>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px]">Upload Signature...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={(e) => handleSignatureUpload(e, 'prepared')} 
                    className="hidden" 
                  />
                </label>
              </div>
              <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-bold">Preview:</span>
                <div className="h-8 bg-white border border-slate-100 rounded px-2 flex items-center justify-center">
                  <img src={preparedBySign} className="max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Reviewed By block */}
            <div className={`space-y-3 p-3 rounded-xl border transition-all ${showReviewedBy ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/40 border-slate-200/40 opacity-75'}`}>
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">B. Reviewed By (Verifier) — Optional</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReviewedBy}
                    onChange={(e) => setShowReviewedBy(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-700 select-none">Show Reviewed</span>
                </label>
              </div>
              
              {showReviewedBy ? (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Reviewer Name *</label>
                    <input
                      type="text"
                      value={reviewedByName}
                      onChange={e => setReviewedByName(e.target.value)}
                      placeholder="e.g. Tareq Al Mansoori"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                      required={showReviewedBy}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Reviewer Designation *</label>
                    <input
                      type="text"
                      value={reviewedByDesignation}
                      onChange={e => setReviewedByDesignation(e.target.value)}
                      placeholder="e.g. Senior Compliance Consultant"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                      required={showReviewedBy}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Reviewer Signature (PNG/JPG)</label>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px]">Upload Signature...</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={(e) => handleSignatureUpload(e, 'reviewed')} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold">Preview:</span>
                    <div className="h-8 bg-white border border-slate-100 rounded px-2 flex items-center justify-center">
                      <img src={reviewedBySign} className="max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic py-2 text-center select-none">
                  'Reviewed By' section is excluded from the generated document.
                </div>
              )}
            </div>

            {/* Approved By block */}
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">C. Approved By (Sign-off)</span>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Approver Name *</label>
                <input
                  type="text"
                  value={approvedByName}
                  onChange={e => setApprovedByName(e.target.value)}
                  placeholder="e.g. Dr. Johnathan Carter"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Approver Designation *</label>
                <input
                  type="text"
                  value={approvedByDesignation}
                  onChange={e => setApprovedByDesignation(e.target.value)}
                  placeholder="e.g. Chief Medical Officer"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Approver Signature (PNG/JPG)</label>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px]">Upload Signature...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={(e) => handleSignatureUpload(e, 'approved')} 
                    className="hidden" 
                  />
                </label>
              </div>
              <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-bold">Preview:</span>
                <div className="h-8 bg-white border border-slate-100 rounded px-2 flex items-center justify-center">
                  <img src={approvedBySign} className="max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Section 4: Lifecycle dates */}
            <div className="md:col-span-3 border-b border-slate-100 pb-1 pt-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">4. Policy Lifecycle Calendar Dates</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Policy Issue Date *</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Approved Date *</label>
              <input
                type="date"
                value={approvalDate}
                onChange={e => setApprovalDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Next Review Date *</label>
              <input
                type="date"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Next Due Date *</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={e => setNextDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
            >
              Commit Policy Document
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Policy Templates & Quick Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Total Enforced</span>
            <h4 className="text-lg font-bold text-slate-900">{clientPolicies.length}</h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Under Review</span>
            <h4 className="text-lg font-bold text-slate-900">
              {clientPolicies.filter(p => p.status === 'UNDER_REVIEW').length}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Expired / Overdue</span>
            <h4 className="text-lg font-bold text-slate-900">
              {clientPolicies.filter(p => p.status === 'EXPIRED').length}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-300">Framework Focus</span>
            <FileText className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-xs font-semibold leading-tight mt-1">DOH Abu Dhabi & MALAFFI Standards</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search policy name, index number..."
          className="w-full text-xs focus:outline-none"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-3.5 font-semibold text-slate-600">Policy Number</th>
                <th className="p-3.5 font-semibold text-slate-600">Title</th>
                <th className="p-3.5 font-semibold text-slate-600">Category</th>
                <th className="p-3.5 font-semibold text-slate-600">Department</th>
                <th className="p-3.5 font-semibold text-slate-600">Classification</th>
                <th className="p-3.5 font-semibold text-slate-600">Next Review Date</th>
                <th className="p-3.5 font-semibold text-slate-600">Status</th>
                <th className="p-3.5 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map(policy => {
                  let statusColor = 'bg-slate-50 text-slate-600';
                  if (policy.status === 'APPROVED') statusColor = 'bg-emerald-50 text-emerald-700';
                  if (policy.status === 'UNDER_REVIEW') statusColor = 'bg-yellow-50 text-yellow-700 border border-yellow-100';
                  if (policy.status === 'EXPIRED') statusColor = 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse';

                  return (
                    <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono text-slate-900 font-semibold">{policy.policy_no}</td>
                      <td className="p-3.5 font-medium text-slate-800">{policy.policy_name}</td>
                      <td className="p-3.5 text-slate-500">{policy.category}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{policy.department || 'Quality'}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          policy.classification === 'Secret' 
                            ? 'bg-rose-50 text-rose-700' 
                            : policy.classification === 'Restricted' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {policy.classification || 'Confidential'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {policy.review_date}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPolicySheet(policy)}
                            className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded transition-all cursor-pointer whitespace-nowrap"
                          >
                            View Control Sheet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPolicyToClone(policy);
                              setCloneTargetClientId(activeClientId);
                              setClonePolicyNo(policy.policy_no + '-COPY');
                              setClonePolicyName(policy.policy_name + ' (Copy)');
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            title="Clone/copy policy to another client"
                          >
                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/10" />
                            Copy to Client
                          </button>
                          {onDeletePolicy && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(policy.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              title="Delete Policy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No policy files found for this client context. Click "Create Policy File" to begin drafting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy / Document Control Sheet Modal */}
      {selectedPolicyForSheet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Regulatory Document Control Sheet (A4 Specification)</h3>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <BTATierSelector
                  compact
                  value={editFrameworkGroup}
                  onChange={(group) => {
                    setEditFrameworkGroup(group);
                    if (selectedPolicyForSheet) {
                      saveCustomGroupAssignment(selectedPolicyForSheet.policy_no || selectedPolicyForSheet.id, group);
                    }
                  }}
                />
                
                {onUpdatePolicy && (
                  <button
                    onClick={() => setIsEditingSheet(!isEditingSheet)}
                    className={`text-xs font-bold border px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                      isEditingSheet 
                        ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    {isEditingSheet ? 'Cancel Edit Mode' : 'Edit Sheet Fields'}
                  </button>
                )}
                <button
                  onClick={() => printDocument('#printable-control-sheet', { documentTitle: selectedPolicyForSheet.policy_name || 'Document Control Sheet', orientation: 'portrait' })}
                  className="text-xs text-indigo-700 hover:text-indigo-850 font-bold border border-indigo-200 px-3 py-1.5 rounded-lg bg-indigo-50 shadow-xs hover:bg-indigo-100 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print PDF
                </button>
                <button 
                  onClick={() => {
                    setSelectedPolicyForSheet(null);
                    setIsEditingSheet(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-slate-100 overflow-y-auto space-y-4">
              <div className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs max-w-3xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Document Preview & Legal Seal (A4 Specification)
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium">Standard A4 Format (210mm x 297mm)</div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
                  {/* Font Size Adjust Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-slate-400" /> Font Size:
                    </span>
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      {(['small', 'normal', 'medium', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setDocFontSize(sz)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all uppercase cursor-pointer ${
                            docFontSize === sz
                              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Color Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-slate-400" /> Color Accent:
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      {(['emerald', 'blue', 'teal', 'crimson', 'slate'] as const).map((color) => {
                        const colorClass = 
                          color === 'emerald' ? 'bg-emerald-600' :
                          color === 'blue' ? 'bg-blue-600' :
                          color === 'teal' ? 'bg-teal-600' :
                          color === 'crimson' ? 'bg-rose-600' :
                          'bg-slate-600';
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setDocThemeColor(color)}
                            className={`w-4 h-4 rounded-full ${colorClass} transition-all cursor-pointer relative hover:scale-110 ${
                              docThemeColor === color 
                                ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' 
                                : 'opacity-80 hover:opacity-100'
                            }`}
                            title={`Set primary brand accent to ${color}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual A4 Page Simulation */}
              <div id="printable-control-sheet" className="bg-white border border-slate-300 shadow-2xl p-10 sm:p-12 w-full max-w-[210mm] min-h-[297mm] mx-auto space-y-6 relative font-sans text-slate-800 rounded-xs flex flex-col justify-between">
                
                {/* Header Section based on Logo Placement & Display mode */}
                <div>
                  {(() => {
                    const displayMode = client?.header_display_mode || 'BOTH';
                    const placement = client?.logo_placement || 'LEFT';
                    const showLogo = displayMode !== 'TEXT_ONLY';
                    const showText = displayMode !== 'LOGO_ONLY';

                    if (placement === 'LEFT') {
                      return (
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
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

                  {/* Document Control Info Block with Dates unified in Header */}
                  <div className="mt-3 border border-slate-300 rounded overflow-hidden text-[10px]">
                    {/* Row 1: General Meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/80 border-b border-slate-300">
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Document Code</span>
                        {isEditingSheet ? (
                          <input
                            type="text"
                            value={editPolicyNo}
                            onChange={(e) => setEditPolicyNo(e.target.value)}
                            className={`w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] ${activeTheme.primaryText} font-bold focus:outline-slate-500`}
                          />
                        ) : (
                          <strong className={`font-mono text-[10px] ${activeTheme.primaryText} font-bold`}>{selectedPolicyForSheet.policy_no}</strong>
                        )}
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Version</span>
                        {isEditingSheet ? (
                          <input
                            type="text"
                            value={editVersion}
                            onChange={(e) => setEditVersion(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-800 focus:outline-slate-500"
                          />
                        ) : (
                          <strong className="font-mono text-[10px] text-slate-800 font-bold">v{selectedPolicyForSheet.version || '1.0'}</strong>
                        )}
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Department</span>
                        {isEditingSheet ? (
                          <input
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-slate-500"
                          />
                        ) : (
                          <strong className="text-[10px] text-slate-800 font-bold">{selectedPolicyForSheet.department || 'Quality'}</strong>
                        )}
                      </div>
                      <div className="py-1 px-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Classification</span>
                        {isEditingSheet ? (
                          <select
                            value={editClassification}
                            onChange={(e) => setEditClassification(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[9px] font-bold focus:outline-slate-500 cursor-pointer"
                          >
                            <option value="Confidential">Confidential</option>
                            <option value="Restricted">Restricted</option>
                            <option value="Secret">Secret</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider ${
                            selectedPolicyForSheet.classification === 'Secret' 
                              ? 'bg-rose-100 text-rose-800' 
                              : selectedPolicyForSheet.classification === 'Restricted' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedPolicyForSheet.classification || 'Confidential'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Lifecycle Dates */}
                    <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50/80 border-b border-slate-300">
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Issue Date</span>
                        {isEditingSheet ? (
                          <input
                            type="date"
                            value={editIssueDate}
                            onChange={(e) => setEditIssueDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px] focus:outline-slate-500"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-slate-700">{selectedPolicyForSheet.issue_date || '2026-06-25'}</span>
                        )}
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Review Date</span>
                        {isEditingSheet ? (
                          <input
                            type="date"
                            value={editReviewDate}
                            onChange={(e) => setEditReviewDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px] focus:outline-slate-500"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-slate-700">{selectedPolicyForSheet.review_date || '2027-06-25'}</span>
                        )}
                      </div>
                      <div className="py-1 px-2 border-r border-slate-300">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Next Due Date</span>
                        {isEditingSheet ? (
                          <input
                            type="date"
                            value={editNextDueDate}
                            onChange={(e) => setEditNextDueDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px] focus:outline-slate-500"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-slate-700">{selectedPolicyForSheet.next_due_date || '2027-06-25'}</span>
                        )}
                      </div>
                      <div className="py-1 px-2">
                        <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none">Approved Date</span>
                        {isEditingSheet ? (
                          <input
                            type="date"
                            value={editApprovalDate}
                            onChange={(e) => setEditApprovalDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px] focus:outline-slate-500"
                          />
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-slate-700">{selectedPolicyForSheet.approval_date || '2026-06-25'}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-white">
                      <span className="text-[7px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-0.5">Document Title</span>
                      {isEditingSheet ? (
                        <div className="space-y-1 mt-0.5">
                          <input
                            type="text"
                            value={editPolicyName}
                            onChange={(e) => setEditPolicyName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-900 font-bold text-xs focus:outline-slate-500"
                            placeholder="Policy Name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[7px] font-bold text-slate-400 uppercase block leading-none">Category / Domain</span>
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-800 focus:outline-slate-500"
                                placeholder="Category"
                              />
                            </div>
                            <div>
                              <span className="text-[7px] font-bold text-slate-400 uppercase block leading-none">Compliance Framework Reference</span>
                              <span className="text-[10px] text-slate-500 block py-0.5">{client?.compliance_framework || 'DOH Abu Dhabi & MALAFFI'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-bold text-slate-900 text-xs leading-tight">{selectedPolicyForSheet.policy_name}</h3>
                          <div className="flex gap-4 mt-0.5">
                            <span className="text-[8.5px] text-slate-500 font-medium">Domain: <strong className="text-slate-700">{selectedPolicyForSheet.category}</strong></span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                            This official document establishes compliance rules under the <strong>{client?.compliance_framework || 'DOH Abu Dhabi & MALAFFI'}</strong> regulatory environment.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Content simulation */}
                <div className="py-4 px-2 space-y-4 bg-white text-slate-800">
                  {isEditingSheet ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h4 className={`font-bold text-xs uppercase tracking-wider ${activeTheme.textAccent}`}>Edit Control Sheet Content</h4>
                          <p className="text-[10px] text-slate-500">Edit or paste policy content. Live preview applies immediately.</p>
                        </div>
                        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditorMode('unified');
                              if (!editFullContent) {
                                const recon = `### 1. OBJECTIVE & SCOPE

#### OBJECTIVE
${editObjective}

#### SCOPE
${editScope}

### 2. RESPONSIBILITIES

#### IT MANAGER / DEPARTMENT LEADS
${editRespItManager}

#### MANAGING DIRECTOR / MANAGER
${editRespMd}

#### ALL USERS / EMPLOYEES
${editRespAllUsers}

### 3. POLICY STATEMENT & CORE PRINCIPLES

#### POLICY STATEMENT
${editPolicyStatement}

#### CORE PRINCIPLES
${editCorePrinciples}

### 4. POLICY COMPLIANCE, EXCEPTIONS & PENALTIES

#### DISCIPLINARY ACTION
${editComplianceDisciplinary}

#### CLARIFICATIONS CONTACT
${editComplianceClarifications}

#### COMPLIANCE CHECKS AUTHORITY
${editComplianceChecks}

#### EXCEPTIONS CRITERIA
${editComplianceExceptions}`;
                                setEditFullContent(recon);
                              }
                            }}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              editorMode === 'unified'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Unified Editor (Copy-Paste)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('sections')}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              editorMode === 'sections'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Sectional Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditorMode('ai');
                              setAiRawText(editFullContent || '');
                              setExtractError(null);
                            }}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                              editorMode === 'ai'
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                            AI Capture (.docx / Paste)
                          </button>
                        </div>
                      </div>

                      {editorMode === 'unified' ? (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                📋 Paste or Write Your Policy Text Below:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to clear the entire document text? This cannot be undone.")) {
                                      setEditFullContent('');
                                    }
                                  }}
                                  className="text-[9px] text-red-600 hover:text-red-700 font-bold border border-red-200 px-2 py-1 rounded bg-white shadow-2xs hover:bg-red-50 transition-all cursor-pointer"
                                >
                                  🗑️ Clear Document
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const tableTpl = `\n| Option | Criteria | Requirement |\n|---|---|---|\n| Standard | Check log | Formal approval |\n| High-Risk | MFA enabled | CIO auth required |\n`;
                                    setEditFullContent(prev => prev + tableTpl);
                                  }}
                                  className="text-[9px] text-slate-700 hover:text-slate-900 font-bold border border-slate-200 px-2 py-1 rounded bg-white shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Table className="w-3.5 h-3.5 text-slate-400" /> Insert Table
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const boxTpl = `\n> 💡 **IMPORTANT GOVERNANCE COMPLIANCE NOTE**\n> All staff members must periodically check and review their assigned security guidelines and adhere strictly to these principles.\n`;
                                    setEditFullContent(prev => prev + boxTpl);
                                  }}
                                  className="text-[9px] text-slate-700 hover:text-slate-900 font-bold border border-slate-200 px-2 py-1 rounded bg-white shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Square className="w-3.5 h-3.5 text-slate-400" /> Insert Box
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Tip: Paste your long policy text. Use headers with <code className="font-mono bg-slate-100 p-0.5 rounded text-slate-700">###</code> and bold text with <code className="font-mono bg-slate-100 p-0.5 rounded text-slate-700">**</code>. Custom tables and quote boxes will render beautifully in the A4 Live Preview!
                            </p>
                          </div>

                          <textarea
                            rows={24}
                            value={editFullContent}
                            onChange={(e) => setEditFullContent(e.target.value)}
                            className="w-full font-sans text-xs bg-white border border-slate-300 rounded-xl p-4 shadow-inner focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none leading-relaxed"
                            placeholder="Paste your complete policy text here..."
                          />
                        </div>
                      ) : editorMode === 'ai' ? (
                        <div className="bg-gradient-to-br from-amber-50/40 to-emerald-50/30 p-5 rounded-xl border border-emerald-100/70 space-y-4 animate-fade-in">
                          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                            Smart AI Document Capture & Parser
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            Upload a <strong>.docx (MS Word)</strong> document, or paste raw compliance draft text below to automatically extract and populate all individual sections of this active policy sheet.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Drag and Drop/Upload Container */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-white p-5 rounded-xl transition-all cursor-pointer relative group min-h-[140px]">
                              <input
                                type="file"
                                accept=".docx"
                                onChange={handleSheetDocxFileUpload}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                disabled={isExtracting}
                              />
                              <Upload className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-bold text-slate-700">Upload Policy (.docx)</span>
                              <span className="text-[10px] text-slate-400 mt-1">Drag and drop file here, or click to browse</span>
                            </div>

                            {/* Text Paste Input */}
                            <div className="space-y-1.5 flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                📋 Or Paste Policy Text:
                              </span>
                              <textarea
                                rows={5}
                                value={aiRawText}
                                onChange={(e) => setAiRawText(e.target.value)}
                                placeholder="Paste policy document content here..."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-sans flex-1 resize-none"
                                disabled={isExtracting}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-emerald-100/50">
                            <div className="flex-1">
                              {extractError ? (
                                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  {extractError}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Press "Parse & Sync with AI" to trigger secure server-side extraction.</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSheetAiExtract(aiRawText)}
                              disabled={isExtracting || !aiRawText.trim()}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end sm:self-auto"
                            >
                              {isExtracting ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  AI Processing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Parse & Sync with AI
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Render the original sectioned inputs
                        (() => {
                          const renderFieldHeader = (label: string, value: string, setter: (v: string) => void) => (
                            <div className="flex items-center justify-between mb-1.5 bg-slate-100/60 px-2 py-1 rounded border border-slate-200/50">
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplate(setter, value, 'table')}
                                  className="text-[8px] text-slate-600 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold uppercase transition-all cursor-pointer"
                                  title="Insert sample regulatory data table"
                                >
                                  <Table className="w-2.5 h-2.5 text-slate-400" /> ＋ Insert Table
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertTemplate(setter, value, 'box')}
                                  className="text-[8px] text-slate-600 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold uppercase transition-all cursor-pointer"
                                  title="Insert sample callout box"
                                >
                                  <Square className="w-2.5 h-2.5 text-slate-400" /> ＋ Insert Box
                                </button>
                              </div>
                            </div>
                          );

                          return (
                            <div className="space-y-4">
                              {/* Section 1: Brief Control Clauses */}
                              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1">
                                  <span>📋 Document Control Brief Summary (Header Box)</span>
                                </h5>
                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    {renderFieldHeader("Clause 1: Scope & Standard", editScopeClause1, setEditScopeClause1)}
                                    <textarea
                                      rows={2}
                                      value={editScopeClause1}
                                      onChange={(e) => setEditScopeClause1(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-sans"
                                      placeholder="Clause 1 text..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Clause 2: Target Audience & Bounds", editScopeClause2, setEditScopeClause2)}
                                    <textarea
                                      rows={2}
                                      value={editScopeClause2}
                                      onChange={(e) => setEditScopeClause2(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-sans"
                                      placeholder="Clause 2 text..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Clause 3: Regulatory Mapping", editScopeClause3, setEditScopeClause3)}
                                    <textarea
                                      rows={2}
                                      value={editScopeClause3}
                                      onChange={(e) => setEditScopeClause3(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-sans"
                                      placeholder="Clause 3 text..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Section 2: OBJECTIVE & SCOPE */}
                              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">1. Objective & Scope</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    {renderFieldHeader("OBJECTIVE", editObjective, setEditObjective)}
                                    <textarea
                                      rows={4}
                                      value={editObjective}
                                      onChange={(e) => setEditObjective(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="Objective details..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("SCOPE", editScope, setEditScope)}
                                    <textarea
                                      rows={4}
                                      value={editScope}
                                      onChange={(e) => setEditScope(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="Scope details..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Section 3: RESPONSIBILITIES */}
                              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">2. Responsibilities</h5>
                                <div className="space-y-3">
                                  <div>
                                    {renderFieldHeader("IT Manager Responsibilities", editRespItManager, setEditRespItManager)}
                                    <textarea
                                      rows={3}
                                      value={editRespItManager}
                                      onChange={(e) => setEditRespItManager(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="IT Manager duties..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Managing Director / Manager Responsibilities", editRespMd, setEditRespMd)}
                                    <textarea
                                      rows={3}
                                      value={editRespMd}
                                      onChange={(e) => setEditRespMd(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="MD duties..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("All Users Responsibilities", editRespAllUsers, setEditRespAllUsers)}
                                    <textarea
                                      rows={3}
                                      value={editRespAllUsers}
                                      onChange={(e) => setEditRespAllUsers(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="User duties..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Section 4: POLICY IN DETAIL */}
                              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">3. Policy Statement & Core Principles</h5>
                                <div className="space-y-3">
                                  <div>
                                    {renderFieldHeader("Policy Statement", editPolicyStatement, setEditPolicyStatement)}
                                    <textarea
                                      rows={4}
                                      value={editPolicyStatement}
                                      onChange={(e) => setEditPolicyStatement(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="Policy statement details..."
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Core Principles", editCorePrinciples, setEditCorePrinciples)}
                                    <textarea
                                      rows={5}
                                      value={editCorePrinciples}
                                      onChange={(e) => setEditCorePrinciples(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      placeholder="Core principles..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Section 5: POLICY COMPLIANCE */}
                              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 space-y-3">
                                <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">4. Policy Compliance, Exceptions & Penalties</h5>
                                <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    {renderFieldHeader("Disciplinary Action", editComplianceDisciplinary, setEditComplianceDisciplinary)}
                                    <textarea
                                      rows={3}
                                      value={editComplianceDisciplinary}
                                      onChange={(e) => setEditComplianceDisciplinary(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Clarifications Contact", editComplianceClarifications, setEditComplianceClarifications)}
                                    <textarea
                                      rows={3}
                                      value={editComplianceClarifications}
                                      onChange={(e) => setEditComplianceClarifications(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Compliance Checks Authority", editComplianceChecks, setEditComplianceChecks)}
                                    <textarea
                                      rows={3}
                                      value={editComplianceChecks}
                                      onChange={(e) => setEditComplianceChecks(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    {renderFieldHeader("Exceptions Criteria", editComplianceExceptions, setEditComplianceExceptions)}
                                    <textarea
                                      rows={3}
                                      value={editComplianceExceptions}
                                      onChange={(e) => setEditComplianceExceptions(e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const contentToRender = getPolicyFullContent(selectedPolicyForSheet, client?.company_name || 'the facility');
                        return (
                          <div className="space-y-4">
                            <SmartTextRenderer 
                              text={replaceEntityName(contentToRender)}
                              fontSize={docFontSize}
                              themeColor={docThemeColor}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Dynamic Signatures Block & Official Stamp */}
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Document Sign-off Team (Prepared, Reviewed & Approved)</span>
                    {isEditingSheet && (
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[9px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={editShowReviewedBy}
                          onChange={(e) => setEditShowReviewedBy(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                        />
                        <span>Include Reviewed By</span>
                      </label>
                    )}
                  </div>

                  <div className={`grid gap-3 pt-2 relative ${(!isEditingSheet ? (selectedPolicyForSheet.show_reviewed_by !== false) : editShowReviewedBy) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    
                    {/* Prepared By */}
                    <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[140px]">
                      <div>
                        <span className="text-[8px] font-bold text-emerald-800 uppercase block">Prepared</span>
                        {isEditingSheet ? (
                          <div className="space-y-1 mt-1 text-left">
                            <input
                              type="text"
                              value={editPreparedByName}
                              onChange={(e) => setEditPreparedByName(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] text-slate-900 font-semibold focus:outline-slate-500"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={editPreparedByDesignation}
                              onChange={(e) => setEditPreparedByDesignation(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-500 focus:outline-slate-500"
                              placeholder="Designation"
                            />
                            <select
                              value={editPreparedBySignMode}
                              onChange={(e) => setEditPreparedBySignMode(e.target.value as any)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-700 mt-1"
                            >
                              <option value="DIGITAL">Digital Upload</option>
                              <option value="BLANK">Blank Hand Sign</option>
                            </select>
                            {editPreparedBySignMode === 'DIGITAL' && (
                              <div className="mt-1">
                                <label className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:border-slate-400 text-[8px] text-slate-600 font-bold cursor-pointer transition-all w-max">
                                  <Upload className="w-2.5 h-2.5 text-slate-400" />
                                  <span>Upload Sig...</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const r = new FileReader();
                                        r.onload = () => setEditPreparedBySign(r.result as string);
                                        r.readAsDataURL(file);
                                      }
                                    }} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <strong className="text-[11px] text-slate-900 block mt-1 leading-tight">{selectedPolicyForSheet.prepared_by_name || 'Sarah Jenkins'}</strong>
                            <span className="text-[9px] text-slate-500 block leading-tight">{selectedPolicyForSheet.prepared_by_designation || 'Compliance Officer'}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1">
                        {(!isEditingSheet ? (selectedPolicyForSheet.prepared_by_sign === 'BLANK') : (editPreparedBySignMode === 'BLANK')) ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                            <div className="w-full border-b border-slate-300 border-dashed mt-1 mb-0.5"></div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN</span>
                          </div>
                        ) : (
                          <img src={isEditingSheet ? editPreparedBySign : (selectedPolicyForSheet.prepared_by_sign || DEFAULT_PREPARED_SIGN)} className="max-h-full max-w-full object-contain" alt="Author Signature" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    {/* Reviewed By */}
                    {(!isEditingSheet ? (selectedPolicyForSheet.show_reviewed_by !== false) : editShowReviewedBy) && (
                      <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <span className="text-[8px] font-bold text-amber-800 uppercase block">Reviewed</span>
                          {isEditingSheet ? (
                            <div className="space-y-1 mt-1 text-left">
                              <input
                                type="text"
                                value={editReviewedByName}
                                onChange={(e) => setEditReviewedByName(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] text-slate-900 font-semibold focus:outline-slate-500"
                                placeholder="Name"
                              />
                              <input
                                type="text"
                                value={editReviewedByDesignation}
                                onChange={(e) => setEditReviewedByDesignation(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-500 focus:outline-slate-500"
                                placeholder="Designation"
                              />
                              <select
                                value={editReviewedBySignMode}
                                onChange={(e) => setEditReviewedBySignMode(e.target.value as any)}
                                className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-700 mt-1"
                              >
                                <option value="DIGITAL">Digital Upload</option>
                                <option value="BLANK">Blank Hand Sign</option>
                              </select>
                              {editReviewedBySignMode === 'DIGITAL' && (
                                <div className="mt-1">
                                  <label className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:border-slate-400 text-[8px] text-slate-600 font-bold cursor-pointer transition-all w-max">
                                    <Upload className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Upload Sig...</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const r = new FileReader();
                                          r.onload = () => setEditReviewedBySign(r.result as string);
                                          r.readAsDataURL(file);
                                        }
                                      }} 
                                      className="hidden" 
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <strong className="text-[11px] text-slate-900 block mt-1 leading-tight">{selectedPolicyForSheet.reviewed_by_name || 'Tareq Al Mansoori'}</strong>
                              <span className="text-[9px] text-slate-500 block leading-tight">{selectedPolicyForSheet.reviewed_by_designation || 'Senior Consultant'}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1">
                          {(!isEditingSheet ? (selectedPolicyForSheet.reviewed_by_sign === 'BLANK') : (editReviewedBySignMode === 'BLANK')) ? (
                            <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                              <div className="w-full border-b border-slate-300 border-dashed mt-1 mb-0.5"></div>
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN</span>
                            </div>
                          ) : (
                            <img src={isEditingSheet ? editReviewedBySign : (selectedPolicyForSheet.reviewed_by_sign || DEFAULT_REVIEWED_SIGN)} className="max-h-full max-w-full object-contain" alt="Reviewer Signature" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approved By */}
                    <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between min-h-[140px] relative">
                      <div>
                        <span className="text-[8px] font-bold text-blue-800 uppercase block">Approved</span>
                        {isEditingSheet ? (
                          <div className="space-y-1 mt-1 text-left">
                            <input
                              type="text"
                              value={editApprovedByName}
                              onChange={(e) => setEditApprovedByName(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] text-slate-900 font-semibold focus:outline-slate-500"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              value={editApprovedByDesignation}
                              onChange={(e) => setEditApprovedByDesignation(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-500 focus:outline-slate-500"
                              placeholder="Designation"
                            />
                            <select
                              value={editApprovedBySignMode}
                              onChange={(e) => setEditApprovedBySignMode(e.target.value as any)}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-[9px] text-slate-700 mt-1"
                            >
                              <option value="DIGITAL">Digital Upload</option>
                              <option value="BLANK">Blank Hand Sign</option>
                            </select>
                            {editApprovedBySignMode === 'DIGITAL' && (
                              <div className="mt-1">
                                <label className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:border-slate-400 text-[8px] text-slate-600 font-bold cursor-pointer transition-all w-max">
                                  <Upload className="w-2.5 h-2.5 text-slate-400" />
                                  <span>Upload Sig...</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const r = new FileReader();
                                        r.onload = () => setEditApprovedBySign(r.result as string);
                                        r.readAsDataURL(file);
                                      }
                                    }} 
                                    className="hidden" 
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <strong className="text-[11px] text-slate-900 block mt-1 leading-tight">{selectedPolicyForSheet.approved_by_name || 'Dr. Johnathan Carter'}</strong>
                            <span className="text-[9px] text-slate-500 block leading-tight">{selectedPolicyForSheet.approved_by_designation || 'Managing Director'}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 border-t border-slate-200/60 pt-2 flex items-center justify-center h-10 bg-white rounded overflow-hidden p-1 relative">
                        {(!isEditingSheet ? (selectedPolicyForSheet.approved_by_sign === 'BLANK') : (editApprovedBySignMode === 'BLANK')) ? (
                          <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
                            <div className="w-full border-b border-slate-300 border-dashed mt-1 mb-0.5"></div>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider select-none">HAND SIGN</span>
                          </div>
                        ) : (
                          <img src={isEditingSheet ? editApprovedBySign : (selectedPolicyForSheet.approved_by_sign || DEFAULT_APPROVED_SIGN)} className="max-h-full max-w-full object-contain" alt="Approver Signature" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>

                    {/* Facility Stamp Overlay placed elegantly next to the Approved by block */}
                    {client?.facility_stamp && (
                      <div className="absolute -right-6 -bottom-10 w-36 h-36 pointer-events-none -rotate-12 select-none opacity-85 transition-all z-10" title="Official Facility Stamp Seal (4.5 cm)">
                        <img src={client.facility_stamp} className="w-full h-full object-contain animate-fade-in" alt="Seal" referrerPolicy="no-referrer" />
                      </div>
                    )}

                  </div>
                </div>

                {/* Centered Small Footer displaying Facility Info & REQUIRED "Page 1/1" */}
                <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-400 font-semibold flex flex-col gap-1.5 mt-auto">
                  {/* If Footer logo is enabled AND FULL width, place the image banner on top */}
                  {(client?.show_footer_logo !== false) && client?.footer_logo && client.footer_placement === 'FULL' && (
                    <div className="w-full h-10 flex items-center justify-center bg-white border border-slate-100 rounded-md p-1">
                      <img src={client.footer_logo} className="max-h-full object-contain w-auto max-w-[400px]" alt="Facility Footer Banner" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className="flex items-center justify-between w-full gap-2">
                    {/* Left content: contains COMPLIANCE CONTROL SHEET & logo if LEFT placement and enabled */}
                    <div className="flex items-center gap-2">
                      {(client?.show_footer_logo !== false) && client?.footer_logo && client.footer_placement === 'LEFT' && (
                        <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                          <img src={client.footer_logo} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                          COMPLIANCE CONTROL SHEET
                        </div>
                        {/* Show/hide Address info based on show_footer_address option */}
                        {(client?.show_footer_address !== false) && (
                          <div className="flex items-center gap-1 flex-wrap text-left text-[8px] text-slate-400">
                            <span>TEL: {client?.phone || '+971 2 666 4444'}</span>
                            <span>•</span>
                            <span className="uppercase">EMAIL: {client?.owner_email || client?.email || 'compliance@facility.ae'}</span>
                            <span>•</span>
                            <span className="uppercase">ADDR: {client?.address || 'Abu Dhabi'}, UAE</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right content: can contain logo if RIGHT placement, plus Page 1/1 Indicator */}
                    <div className="flex items-center gap-2 font-sans shrink-0">
                      {(client?.show_footer_logo !== false) && client?.footer_logo && client.footer_placement === 'RIGHT' && (
                        <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                          <img src={client.footer_logo} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      {/* Page 1/1 Indicator */}
                      <div className="font-mono text-[9px] text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        Page 1/1
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              {isEditingSheet ? (
                <>
                  <button 
                    onClick={() => setIsEditingSheet(false)}
                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                  <button 
                    onClick={handleSaveSheetChanges}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save Sheet Changes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setSelectedPolicyForSheet(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Done Viewing Control Sheet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Policy Framework Wizard Modal */}
      {isQuickSetupOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-5xl w-full mx-4 flex flex-col h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/20">
                  <Wrench className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Quick Compliance Policy Setup</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Configure and publish 7 critical compliance policies instantly tailored for your facility setup</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuickSetupOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Left Sidebar Menu */}
              <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-1.5 flex-shrink-0 overflow-y-auto">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-2 block mb-2">Policy Templates</span>
                
                {[
                  { id: 'governance', title: 'Document Sign-off Team', code: 'AUTHOR/VERIFIER/CEO', icon: <PenTool className="w-4 h-4" /> },
                  { id: 'antivirus', title: 'Antivirus Policy', code: 'POL-SEC-009', icon: <Shield className="w-4 h-4" /> },
                  { id: 'access', title: 'Access Control Policy', code: 'POL-SEC-006', icon: <Lock className="w-4 h-4" /> },
                  { id: 'physical', title: 'Physical Security', code: 'POL-SEC-013', icon: <Server className="w-4 h-4" /> },
                  { id: 'backup', title: 'Backup & Restoration', code: 'POL-SEC-021', icon: <HardDrive className="w-4 h-4" /> },
                  { id: 'incident', title: 'Incident Management', code: 'POL-SEC-025', icon: <AlertTriangle className="w-4 h-4" /> },
                  { id: 'doccontrol', title: 'Document Control', code: 'POL-SEC-031', icon: <FileText className="w-4 h-4" /> },
                  { id: 'soa', title: 'Statement of Applicability', code: 'M-Policy-002', icon: <Table className="w-4 h-4" /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveWizardTab(tab.id as any)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      activeWizardTab === tab.id 
                        ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-950 font-bold' 
                        : 'hover:bg-slate-100 text-slate-600 font-medium'
                    }`}
                  >
                    <div className={activeWizardTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}>
                      {tab.icon}
                    </div>
                    <div className="truncate">
                      <div className="truncate leading-tight">{tab.title}</div>
                      <div className="text-[9px] opacity-70 font-mono">{tab.code}</div>
                    </div>
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-slate-200/60 p-2">
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Compliance Instructions
                    </span>
                    <p className="text-[10px] text-amber-900/80 leading-relaxed">
                      Tailor the variables for each policy, then click <strong>Save & Generate Custom Policies</strong> at the bottom right to publish.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                
                {activeWizardTab === 'governance' && (
                  <div className="space-y-6 animate-fade-in text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-indigo-600" />
                        Document Sign-off Team (Prepared, Reviewed & Approved)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Configure the authors, verifiers, and approvers who will sign off on the generated compliance policies.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* A. Prepared By (Author) */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <PenTool className="w-4 h-4 text-emerald-600" />
                          Prepared By (Author)
                        </span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Author Name *</label>
                            <input
                              type="text"
                              value={wizardPreparedByName}
                              onChange={(e) => setWizardPreparedByName(e.target.value)}
                              placeholder="e.g. Sarah Jenkins"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Author Position / Designation *</label>
                            <input
                              type="text"
                              value={wizardPreparedByDesignation}
                              onChange={(e) => setWizardPreparedByDesignation(e.target.value)}
                              placeholder="e.g. Information Security Officer"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Signature Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setWizardPreparedSignMode('DIGITAL')}
                                className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                  wizardPreparedSignMode === 'DIGITAL'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Digital Signature
                              </button>
                              <button
                                type="button"
                                onClick={() => setWizardPreparedSignMode('BLANK')}
                                className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                  wizardPreparedSignMode === 'BLANK'
                                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Blank to Sign (Manual)
                              </button>
                            </div>
                          </div>

                          {wizardPreparedSignMode === 'DIGITAL' && (
                            <div className="pt-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Upload Digital Signature Image</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Choose image...</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const r = new FileReader();
                                        r.onload = () => setWizardPreparedBySign(r.result as string);
                                        r.readAsDataURL(file);
                                      }
                                    }} 
                                    className="hidden" 
                                  />
                                </label>
                                <div className="h-10 w-24 bg-white border border-slate-100 rounded p-1 flex items-center justify-center overflow-hidden">
                                  <img src={wizardPreparedBySign} className="max-h-full object-contain" alt="Author Sig Preview" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* B. Approved By (CEO/MD) */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 shadow-xs">
                        <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          Approved By (CEO/MD)
                        </span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Approver Name *</label>
                            <input
                              type="text"
                              value={wizardApprovedByName}
                              onChange={(e) => setWizardApprovedByName(e.target.value)}
                              placeholder="e.g. Dr. Johnathan Carter"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Approver Position / Designation *</label>
                            <input
                              type="text"
                              value={wizardApprovedByDesignation}
                              onChange={(e) => setWizardApprovedByDesignation(e.target.value)}
                              placeholder="e.g. Chief Medical Officer"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Signature Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setWizardApprovedSignMode('DIGITAL')}
                                className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                  wizardApprovedSignMode === 'DIGITAL'
                                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Digital Signature
                              </button>
                              <button
                                type="button"
                                onClick={() => setWizardApprovedSignMode('BLANK')}
                                className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                  wizardApprovedSignMode === 'BLANK'
                                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Blank to Sign (Manual)
                              </button>
                            </div>
                          </div>

                          {wizardApprovedSignMode === 'DIGITAL' && (
                            <div className="pt-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Upload Digital Signature Image</label>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Choose image...</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const r = new FileReader();
                                        r.onload = () => setWizardApprovedBySign(r.result as string);
                                        r.readAsDataURL(file);
                                      }
                                    }} 
                                    className="hidden" 
                                  />
                                </label>
                                <div className="h-10 w-24 bg-white border border-slate-100 rounded p-1 flex items-center justify-center overflow-hidden">
                                  <img src={wizardApprovedBySign} className="max-h-full object-contain" alt="Approver Sig Preview" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* C. Reviewed By (Verifier) - FULL WIDTH WITH OPTIONAL TOGGLE */}
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 md:col-span-2 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-600" />
                            Reviewed By (Verifier) — Optional
                          </span>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wizardShowReviewedBy}
                              onChange={(e) => setWizardShowReviewedBy(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-bold text-slate-700">Show 'Reviewed By' Role</span>
                          </label>
                        </div>

                        {wizardShowReviewedBy ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Verifier Name *</label>
                                <input
                                  type="text"
                                  value={wizardReviewedByName}
                                  onChange={(e) => setWizardReviewedByName(e.target.value)}
                                  placeholder="e.g. Tareq Al Mansoori"
                                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Verifier Position / Designation *</label>
                                <input
                                  type="text"
                                  value={wizardReviewedByDesignation}
                                  onChange={(e) => setWizardReviewedByDesignation(e.target.value)}
                                  placeholder="e.g. Senior Compliance Consultant"
                                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Signature Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setWizardReviewedSignMode('DIGITAL')}
                                    className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                      wizardReviewedSignMode === 'DIGITAL'
                                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    Digital Signature
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setWizardReviewedSignMode('BLANK')}
                                    className={`px-3 py-2 text-xs rounded-lg font-semibold border transition-all cursor-pointer ${
                                      wizardReviewedSignMode === 'BLANK'
                                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    Blank to Sign (Manual)
                                  </button>
                                </div>
                              </div>

                              {wizardReviewedSignMode === 'DIGITAL' && (
                                <div className="pt-1">
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Upload Digital Signature Image</label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-amber-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Choose image...</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const r = new FileReader();
                                            r.onload = () => setWizardReviewedBySign(r.result as string);
                                            r.readAsDataURL(file);
                                          }
                                        }} 
                                        className="hidden" 
                                      />
                                    </label>
                                    <div className="h-10 w-24 bg-white border border-slate-100 rounded p-1 flex items-center justify-center overflow-hidden">
                                      <img src={wizardReviewedBySign} className="max-h-full object-contain" alt="Verifier Sig Preview" referrerPolicy="no-referrer" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl text-center">
                            <p className="text-xs text-amber-950 font-semibold">
                              Reviewed By (Verifier) is disabled. The verifier signature and role will be excluded from all 5 generated documents.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'antivirus' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        POL-SEC-009: Antivirus Policy Customization
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Configure which corporate endpoint protection or antivirus application is deployed across all devices.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">Select Deployed Endpoint Security Solution</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Microsoft Defender for Endpoint',
                          'Kaspersky Endpoint Security',
                          'Symantec Endpoint Protection',
                          'Sophos Intercept X',
                          'Avast Premium security',
                          'Trend Micro Apex One',
                          'McAfee Endpoint Security',
                          'CrowdStrike Falcon',
                          'SentinelOne',
                          'Bitdefender GravityZone',
                          'Custom / Other'
                        ].map(av => (
                          <label key={av} className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            selectedAntivirus === av 
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="selectedAntivirus"
                              checked={selectedAntivirus === av}
                              onChange={() => setSelectedAntivirus(av)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedAntivirus === av ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                              {selectedAntivirus === av && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            {av}
                          </label>
                        ))}
                      </div>
                      
                      {selectedAntivirus === 'Custom / Other' && (
                        <div className="pt-2 animate-fade-in">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Enter Custom Installed Antivirus Application Name</label>
                          <input
                            type="text"
                            value={customAntivirus}
                            onChange={(e) => setCustomAntivirus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-medium shadow-inner"
                            placeholder="e.g. Bitdefender GravityZone, SentinelOne"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Interactive Draft Preview:</span>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                        <strong className="block text-xs font-bold text-slate-800">Antivirus Installation</strong>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>The IT Manager shall ensure that all desktops, laptops, and tablets are installed and with official antivirus software.</li>
                          <li>
                            The Technical Support Team shall ensure that all servers are installed and configured with official antivirus software (e.g., <strong className="text-indigo-600 font-semibold">{selectedAntivirus === 'Custom / Other' ? (customAntivirus || 'SentinelOne') : selectedAntivirus}</strong>).
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'access' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        POL-SEC-006: Access Control Policy Settings
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Define the schedule for auditing clinical user profiles, active permissions, and doctor directory credentials.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700">Audit & Review Cycle Frequency</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'Yearly', label: 'Yearly', desc: 'Audit access privileges once every 12 calendar months (Standard baseline)' },
                          { value: 'Twice a Year', label: 'Twice a Year', desc: 'Audit access privileges twice annually (Highly recommended for Clinics)' },
                          { value: 'Quarterly', label: 'Quarterly', desc: 'Audit access privileges quarterly (Recommended for High Security facilities)' }
                        ].map(freq => (
                          <label key={freq.value} className={`flex flex-col gap-1.5 p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                            accessReviewFrequency === freq.value 
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`} onClick={() => setAccessReviewFrequency(freq.value as any)}>
                            <span className="font-bold text-slate-900 text-sm">{freq.label}</span>
                            <span className="text-[10px] text-slate-500 leading-tight font-medium">{freq.desc}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Interactive Draft Preview:</span>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200/60 space-y-2">
                        <strong className="block text-xs font-bold text-slate-800">Review of Access</strong>
                        <p className="m-0">• The IT Manager regularly generates a user list from the information systems, either annually or whenever major changes occur. This list is reviewed by the Business Managing Director and/or Manager to identify redundant, dormant, or expired user accounts, as well as incorrect privileges.</p>
                        <p className="m-0">User accounts inactive for more than 90 days must be disabled by the IT Manager.</p>
                        <p className="m-0">
                          Administrator/Standard user accounts are reviewed <strong className="text-indigo-600 font-semibold">{accessReviewFrequency === 'Quarterly' ? 'quarterly' : accessReviewFrequency === 'Twice a Year' ? 'twice a year' : 'annually'}</strong>, with changes logged for periodic review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'physical' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-600" />
                        POL-SEC-013: Physical & Environmental Security Boundaries
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Map physical security spaces into concrete zones. Examples are populated to simplify setup.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Public Access Areas (Unrestricted)</label>
                        <input
                          type="text"
                          value={publicAccessAreas}
                          onChange={(e) => setPublicAccessAreas(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. Reception waiting Area, Lobby, Waiting room"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Lobby, reception, and waiting lounge areas open to patients.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Work Areas (Staff Workspaces)</label>
                        <input
                          type="text"
                          value={workAreas}
                          onChange={(e) => setWorkAreas(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. Doctor room, Consultation desk"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Standard back-office rooms and clinical desks.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Restricted Areas (Practitioners Only)</label>
                        <input
                          type="text"
                          value={restrictedAreas}
                          onChange={(e) => setRestrictedAreas(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. Treatment room, Laboratory"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Treatment areas, medical laboratories, and record folders closets.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">High Secure Areas (Strict Locks / IT)</label>
                        <input
                          type="text"
                          value={highSecureAreas}
                          onChange={(e) => setHighSecureAreas(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. Server-cabinet, Pharmacy, IT room"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Racks holding networks, server enclosures, and pharmacies.</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 mt-2 max-w-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Interactive Zoning Matrix Preview:</span>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs bg-white">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[9px] uppercase tracking-wider">
                              <th className="py-2 px-3 w-1/3 border-r border-slate-200">Risk Area</th>
                              <th className="py-2 px-3 w-1/3 border-r border-slate-200">Risk Location</th>
                              <th className="py-2 px-3">Custodian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                              <td className="py-2 px-3 font-semibold border-r border-slate-200 bg-emerald-50/30 text-emerald-900">Public Access Areas</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-semibold text-slate-800">Reception / Waiting Area</div>
                                <div className="text-[9px] text-slate-400 font-mono italic mt-0.5">{publicAccessAreas || 'None'}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-medium">Customers / Staff</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold border-r border-slate-200 bg-amber-50/30 text-amber-900">Work Areas, Restricted Areas</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-semibold text-slate-800">Consultation room, Treatment / Reception Counter</div>
                                <div className="text-[9px] text-slate-400 font-mono italic mt-0.5">{[workAreas, restrictedAreas].filter(Boolean).join(', ') || 'None'}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-medium">Nurse, Doctor, Pharmacist, Manager, Managing Director</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold border-r border-slate-200 bg-rose-50/30 text-rose-900">High Secure Areas</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-semibold text-slate-800">Company Assets Area (Server Cabinet)</div>
                                <div className="text-[9px] text-slate-400 font-mono italic mt-0.5">{highSecureAreas || 'None'}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-medium">Managing Director, Authorized Staff*</td>
                            </tr>
                            <tr className="bg-slate-50 text-[9px] text-slate-500 italic">
                              <td colSpan={3} className="py-1.5 px-3 font-medium">
                                *Escort with facility authorized person
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'backup' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-indigo-600" />
                          POL-SEC-021: Information Data Backup & Restoration Matrix
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Configure the scheduled digital backup routines. These will generate a beautiful list in your official document.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddBackupPlanRow}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Backup Routine
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Backup Storage Location / Media</label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Select the backup media storage type. Changing this automatically updates the destinations in your backup plan matrix below.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'NAS', label: 'Network Attached Storage (NAS)', desc: 'Enterprise network-attached storage array' },
                          { value: 'workstation', label: 'Workstation', desc: 'Local workstation or dedicated backup computer' }
                        ].map(opt => (
                          <label key={opt.value} className={`flex flex-col gap-1 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            backupStorageType === opt.value 
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}>
                            <div className="flex items-center gap-2 font-bold">
                              <input
                                type="radio"
                                name="backupStorageType"
                                checked={backupStorageType === opt.value}
                                onChange={() => handleBackupStorageTypeChange(opt.value as any)}
                                className="sr-only"
                              />
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${backupStorageType === opt.value ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                {backupStorageType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              {opt.label}
                            </div>
                            <span className="text-[10px] text-slate-500 pl-5.5 font-normal leading-tight">{opt.desc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3 w-1/4">Backup Type</th>
                            <th className="p-3 w-1/4">Source Data</th>
                            <th className="p-3 w-1/5">Destination Path</th>
                            <th className="p-3">Compliance Remarks</th>
                            <th className="p-3 text-center w-12">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {backupPlans.map((plan, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="p-2">
                                <select
                                  value={plan.type}
                                  onChange={(e) => handleUpdateBackupPlan(index, 'type', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-indigo-500 font-semibold"
                                >
                                  <option value="Daily – Incremental">Daily – Incremental</option>
                                  <option value="Weekly Full Backup">Weekly Full Backup</option>
                                  <option value="Monthly Full Backup">Monthly Full Backup</option>
                                  <option value="Real-Time Replication">Real-Time Replication</option>
                                  <option value="Ad-Hoc Manual">Ad-Hoc Manual</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={plan.source}
                                  onChange={(e) => handleUpdateBackupPlan(index, 'source', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-indigo-500 text-xs font-bold"
                                  placeholder="e.g. EMR Backup"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={plan.destination}
                                  onChange={(e) => handleUpdateBackupPlan(index, 'destination', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-indigo-500 text-xs font-semibold"
                                  placeholder="e.g. NAS"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={plan.remarks}
                                  onChange={(e) => handleUpdateBackupPlan(index, 'remarks', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-indigo-500 text-xs font-medium"
                                  placeholder="e.g. Scheduled snapshot"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBackupPlanRow(index)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove routine"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'incident' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-indigo-600" />
                          POL-SEC-025: Information Security Incidents SLAs & Communication Channels
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Configure incident response escalations, authorized communication modes, and primary compliance contacts.</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (client) {
                            setIncidentResponsibleStakeholder(`${client.owner_name || 'Dr. Al Mansoori'} (${client.owner_email || 'im@doh.gov.ae'} | ${client.phone || '02 4193777'})`);
                            setIncidentModeOfCommunication(`Email: ${client.owner_email || 'compliance@facility.ae'} | Tel: ${client.phone || '02 4193777'}`);
                          } else {
                            setIncidentResponsibleStakeholder('Tareq Al Mansoori (compliance@facility.ae | 02 4193777)');
                            setIncidentModeOfCommunication('Email: compliance@facility.ae | Tel: 02 4193777');
                          }
                        }}
                        className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors self-start sm:self-auto shadow-xs"
                        title="Extract contact info from Client setup automatically"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Auto-feed Company Contacts
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Mode of Communication with DOH / SOC</label>
                        <input
                          type="text"
                          value={incidentModeOfCommunication}
                          onChange={(e) => setIncidentModeOfCommunication(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. soc@doh.gov.ae | 02 4193777"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Authorized channels used to communicate alerts to Abu Dhabi Health SOC.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Responsible Stakeholder / Contact Officer</label>
                        <input
                          type="text"
                          value={incidentResponsibleStakeholder}
                          onChange={(e) => setIncidentResponsibleStakeholder(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-indigo-500 font-semibold"
                          placeholder="e.g. im@doh.gov.ae | 02 4193777"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Internal compliance champion or IT Lead designated as responder.</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Abu Dhabi Health Incident SLA Matrix Preview:</h4>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                              <th className="p-3">Priority Level</th>
                              <th className="p-3">Ack SLA</th>
                              <th className="p-3">Resolution SLA</th>
                              <th className="p-3">DOH SOC Notify</th>
                              <th className="p-3">SLA Update Cycle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                            <tr>
                              <td className="p-2.5 text-red-600 font-extrabold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                P1 - Critical
                              </td>
                              <td className="p-2.5 text-slate-900">30 Mins</td>
                              <td className="p-2.5 text-slate-900">2 Hours</td>
                              <td className="p-2.5 text-indigo-700 font-bold">Near-Real Time</td>
                              <td className="p-2.5 text-indigo-700">Near-Real Time</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-orange-600 font-bold">P2 - Severe</td>
                              <td className="p-2.5">1 Hour</td>
                              <td className="p-2.5">4 Hours</td>
                              <td className="p-2.5">Within 1 Hour</td>
                              <td className="p-2.5 text-slate-500 font-medium">Every 1 Hour</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-amber-600 font-bold">P3 - Elevated</td>
                              <td className="p-2.5">1 Hour</td>
                              <td className="p-2.5">24 Hours</td>
                              <td className="p-2.5">Within 1 Hour</td>
                              <td className="p-2.5 text-slate-500 font-medium">Every 2 Hours</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 text-slate-600">P4 - Normal</td>
                              <td className="p-2.5">1 Hour</td>
                              <td className="p-2.5">48 Hours</td>
                              <td className="p-2.5">Within 24 Hours</td>
                              <td className="p-2.5 text-slate-500 font-medium">Every 24 Hours</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'doccontrol' && (
                  <div className="space-y-4 animate-fade-in text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        POL-SEC-031: Procedure for Control of Documentation
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Establishes a systematic and controlled approach for the creation, review, approval, distribution, retention, and disposal of internal and external documents.
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Facility Name Binding (Automatic)
                      </h4>
                      <p className="text-xs text-emerald-900/80 leading-relaxed">
                        The company name placeholder has been automatically bound to your active client tenant setup:
                      </p>
                      <div className="p-3 bg-white border border-emerald-200/60 rounded-xl font-mono text-xs font-bold text-slate-800">
                        DOCUMENT REFERENCE<br />
                        Company Name: <span className="text-indigo-700 underline">{client?.company_name || 'Medical Center & Pharmacy'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">Document Classification & Color Coding Table Preview:</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              <th className="p-3 w-1/4">Classification Level</th>
                              <th className="p-3 w-3/4">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                              <td className="p-3">
                                <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider inline-block border border-orange-200">
                                  Secret
                                </span>
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed font-semibold">
                                Highly sensitive information; access strictly limited to authorized management personnel only. Unauthorized disclosure could cause severe damage to the organization.
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3">
                                <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider inline-block border border-rose-200">
                                  Confidential
                                </span>
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed font-semibold">
                                Sensitive internal information; access restricted to relevant departments or authorized staff.
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3">
                                <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider inline-block border border-blue-200">
                                  Restricted
                                </span>
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed font-semibold">
                                Operational or departmental use only; not to be shared outside the organization.
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3">
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider inline-block border border-emerald-200">
                                  Public
                                </span>
                              </td>
                              <td className="p-3 text-[11px] leading-relaxed font-semibold">
                                Approved for external distribution or public access; may be shared with third parties or posted on official channels.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeWizardTab === 'soa' && (
                  <div className="space-y-4 animate-fade-in text-slate-700">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Table className="w-5 h-5 text-indigo-600" />
                        M-Policy-002: Statement of Applicability
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Map and manage information security control areas, specific objectives, and applicability status.
                      </p>
                    </div>

                    <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl space-y-2 animate-pulse-subtle">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        Control Objectives and Applicability
                      </h4>
                      <p className="text-xs text-indigo-950/80 leading-relaxed">
                        The following control objectives are applicable to <span className="font-bold underline">{client?.company_name || 'Smartpro Consultancy'}</span>. Customize the applicability of each control area using the options below:
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white text-xs">
                      <div className="overflow-y-auto max-h-[340px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 z-10 shadow-3xs">
                            <tr>
                              <th className="p-3 w-1/4">Control Area</th>
                              <th className="p-3 w-7/12">Control Objective</th>
                              <th className="p-3 w-2/12 text-center">Applicability Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {soaControls.map((item, index) => (
                              <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                                <td className="p-3 font-semibold text-slate-800 align-top">
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
                                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none transition-all cursor-pointer focus:ring-2 focus:ring-offset-1 ${
                                      item.applicability === 'Applicable'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-500'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 focus:ring-slate-400'
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold px-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Target Client: </span>
                <strong className="text-slate-800 font-bold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">{client?.company_name || 'Active Clinic'}</strong>
              </div>
              <div className="flex gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsQuickSetupOpen(false)}
                  className="border border-slate-200 hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleApplyQuickSetup}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save & Generate Custom Policies
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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

      {/* Tenant Bulk Policy Cloning Modal */}
      {isBulkCloning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Copy className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Bulk Clone Tenant Policies</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This utility allows you to copy all <strong className="text-slate-800">{clientPolicies.length}</strong> master draft policies from <strong className="text-slate-800">{client?.company_name}</strong> to other client tenants.
              During duplication, all document headers, metadata, and body texts referring to the old client name will be automatically translated to match the selected target tenant's name!
            </p>

            {bulkCloneSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                {bulkCloneSuccess}
              </div>
            )}

            {!bulkCloneSuccess && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Target Client Tenants:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkCloneTargetIds(clients.filter(c => c.id !== activeClientId).map(c => c.id))}
                        className="text-[9px] text-emerald-600 hover:underline font-bold cursor-pointer"
                      >
                        Select All Tenants
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkCloneTargetIds([])}
                        className="text-[9px] text-slate-500 hover:underline font-bold cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1.5">
                    {clients.filter(c => c.id !== activeClientId).map(c => {
                      const isChecked = bulkCloneTargetIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-white p-1 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setBulkCloneTargetIds(bulkCloneTargetIds.filter(id => id !== c.id));
                              } else {
                                setBulkCloneTargetIds([...bulkCloneTargetIds, c.id]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
                          />
                          <span>{c.company_name} <span className="text-[10px] text-slate-400 font-mono">({c.client_code})</span></span>
                        </label>
                      );
                    })}
                  </div>
                  {bulkCloneTargetIds.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      ✓ Ready to clone to {bulkCloneTargetIds.length} tenants ({bulkCloneTargetIds.length * clientPolicies.length} total policy files will be generated).
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkCloning(false);
                      setBulkCloneTargetIds([]);
                    }}
                    className="px-4 py-2 font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBulkClone}
                    disabled={bulkCloneTargetIds.length === 0}
                    className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Start Bulk Cloning
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Policy Clone Confirmation Modal */}
      {policyToClone && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500/15" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Clone Policy / Copy to Client</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Copy standard draft policy <strong className="text-slate-800">{policyToClone.policy_name} ({policyToClone.policy_no})</strong> to other client contexts. This duplicates all compliance clauses, objectives, and structures, and automatically translates the target company's name in all texts!
            </p>

            {/* Selection Mode Selector */}
            <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setCloneMode('INDIVIDUAL')}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                  cloneMode === 'INDIVIDUAL' 
                    ? 'bg-white text-emerald-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👤 Individual Client
              </button>
              <button
                type="button"
                onClick={() => setCloneMode('GROUP')}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                  cloneMode === 'GROUP' 
                    ? 'bg-white text-emerald-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👥 Group (Bulk Selection)
              </button>
            </div>

            <div className="space-y-3.5">
              {cloneMode === 'INDIVIDUAL' ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Destination Client:</label>
                  <select
                    value={cloneTargetClientId}
                    onChange={(e) => setCloneTargetClientId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-white font-medium text-slate-700 shadow-2xs"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.client_code}) {c.id === activeClientId ? '(Current Client - Duplicate)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Target Clients Group:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCloneTargetClientIds(clients.map(c => c.id))}
                        className="text-[9px] text-emerald-600 hover:underline font-bold"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCloneTargetClientIds([])}
                        className="text-[9px] text-slate-500 hover:underline font-bold"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-1.5">
                    {clients.map(c => {
                      const isChecked = cloneTargetClientIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-white p-1 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCloneTargetClientIds(cloneTargetClientIds.filter(id => id !== c.id));
                              } else {
                                setCloneTargetClientIds([...cloneTargetClientIds, c.id]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
                          />
                          <span>{c.company_name} <span className="text-[10px] text-slate-400 font-mono">({c.client_code})</span></span>
                        </label>
                      );
                    })}
                  </div>
                  {cloneTargetClientIds.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      ✓ Selected {cloneTargetClientIds.length} clients for cloning.
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Policy Number:</label>
                  <input
                    type="text"
                    value={clonePolicyNo}
                    onChange={(e) => setClonePolicyNo(e.target.value)}
                    placeholder="e.g. POL-SEC-012"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-white font-medium text-slate-700 shadow-2xs"
                  />
                  {cloneMode === 'GROUP' && (
                    <span className="text-[9px] text-slate-400 block leading-tight">Will automatically append target client code in group mode</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Policy Title:</label>
                  <input
                    type="text"
                    value={clonePolicyName}
                    onChange={(e) => setClonePolicyName(e.target.value)}
                    placeholder="e.g. Access Control Policy"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 bg-white font-medium text-slate-700 shadow-2xs"
                  />
                  {cloneMode === 'GROUP' && (
                    <span className="text-[9px] text-slate-400 block leading-tight">Will append client names in brackets in group mode</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPolicyToClone(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClone}
                disabled={cloneMode === 'INDIVIDUAL' ? (!cloneTargetClientId || !clonePolicyNo || !clonePolicyName) : (cloneTargetClientIds.length === 0 || !clonePolicyNo || !clonePolicyName)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Clone & Create Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Framework Blueprint Template Guidelines */}
      <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
        <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          UAE Standard Healthcare Policy Blueprints Included
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-emerald-900">
          <div>
            <p className="font-semibold">📜 MALAFFI Interoperability Agreement</p>
            <p className="text-emerald-800 text-[11px] mt-0.5">Approved baseline policy establishing secure logging channels for all API endpoints interacting with Abu Dhabi Health Information Exchange.</p>
          </div>
          <div>
            <p className="font-semibold">📜 ISO 27001 Annex A.12 Asset Register Controls</p>
            <p className="text-emerald-800 text-[11px] mt-0.5">Template defining mandatory maintenance schedules and firmware safety checks for medical critical assets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
