/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  UploadCloud,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Edit3,
  Clipboard,
  ClipboardCopy,
  ClipboardPaste,
  Plus,
  Copy,
  Check,
  Search,
  Filter,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Printer,
  Sparkles,
  Users,
  Award,
  RefreshCw,
  Trash2,
  Code,
  Sliders,
  CheckSquare,
  Building2,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Mail,
  Send,
  Layers,
  Save,
  Database,
  Calendar
} from 'lucide-react';
import { Client, User, Employee } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_CLIENTS } from '../initialData';
import { exportToSinglePagePDF } from '../utils/pdfExport';
import { printCurrentView, printDocument } from '../utils/printUtils';
import { DocRefLoopSelector, DocRefLoopData, DEFAULT_LOOP_DOC_RECORDS } from './DocRefLoopSelector';

// Robust ISO YYYY-MM-DD Date Conversion Helper for <input type="date"> Compatibility
export const toISODate = (val: string | undefined | null): string => {
  if (!val) return new Date().toISOString().slice(0, 10);
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Parse formats such as "03 Aug 2026", "03/08/2026", "2026/08/03", etc.
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
};

// Formatted Display Date Helper (e.g. 03 Aug 2026)
export const formatDateDisplay = (val: string | undefined | null): string => {
  if (!val) return '';
  const iso = toISODate(val);
  try {
    const parts = iso.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIndex = parseInt(m, 10) - 1;
      if (mIndex >= 0 && mIndex < 12) {
        return `${d} ${monthNames[mIndex]} ${y}`;
      }
    }
  } catch (e) {}
  return val;
};

export interface HRDocumentLegalMetadata {
  documentName: string;
  referenceCode: string;
  legalStandards: string;
  lawReference: string;
  issueDate: string;
  effectiveDate: string;
  nextReviewDate: string;
  dueDateForRevision?: string;
  approvalDate?: string;
  versionControl?: string;
  preparedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  documentClassification?: string;
  moduleName?: string;
}

export interface HRDocumentEntityCredentials {
  companyName: string;
  tradeLicenseNo: string;
  emirateJurisdiction: string;
  registeredAddress: string;
}

export interface HRDocumentEmployeeDetails {
  fullLegalName: string;
  employeeId: string;
  emiratesId: string;
  passportNumber: string;
  jobTitle: string;
  department: string;
  joiningDate?: string;
  lastWorkingDate?: string;
  employmentStatus?: 'Active' | 'Vacation' | 'Resigned' | 'Terminated' | string;
}

export interface HRDocumentFacilityDetails {
  facilityName: string;
  facilityLicenseNo: string;
  dohMohapRegNo: string;
  facilityLocation: string;
  clinicalWing: string;
}

export interface HRDocumentRiskCommitteeContacts {
  committeeChair: string;
  complianceOfficer: string;
  dutyOfficerPhone: string;
  escalationEmail: string;
}

export interface HRDocumentSignatureRecord {
  signedBy: string;
  signerRole: string;
  signedAt: string;
  isUaePassVerified: boolean;
  verificationHash: string;
  ipAddress: string;
}

export interface HRDocumentRecord {
  id: string;
  title: string;
  category: 'ONBOARDING' | 'CONTRACT' | 'POLICY_ACK' | 'PERFORMANCE' | 'SEPARATION' | 'GENERAL_HR' | 'COMPLIANCE';
  status: 'APPROVED_FROZEN' | 'PENDING_REVIEW' | 'DRAFT' | 'REJECTED';
  currentVersion: string;
  isFrozen: boolean;
  prePrintedLetterheadMode: boolean;
  includeHrManagerSignatory: boolean;
  isUaePassSealed: boolean;
  legalMetadata: HRDocumentLegalMetadata;
  entityCredentials: HRDocumentEntityCredentials;
  employeeDetails: HRDocumentEmployeeDetails;
  facilityDetails: HRDocumentFacilityDetails;
  riskCommitteeContacts: HRDocumentRiskCommitteeContacts;
  htmlContent: string;
  employeeSignature: HRDocumentSignatureRecord;
  employerSignature: HRDocumentSignatureRecord;
  hrManagerSignature?: HRDocumentSignatureRecord;
  createdAt: string;
  updatedAt: string;
}

interface HrDocumentsHubProps {
  client?: Client;
  currentUser?: User;
  employees?: Employee[];
  allClients?: Client[];
  onAddEmailLog?: (recipient: string, subject: string, type: string, status?: 'SENT' | 'FAILED', body?: string) => void;
}

const STORAGE_KEY = 'smarthub_hr_documents_vault_v2';

export const getDocumentClassification = (doc?: Partial<HRDocumentRecord>): string => {
  if (!doc) return 'CONFIDENTIAL';
  const customCls = doc.legalMetadata?.documentClassification;
  const title = (doc.title || doc.legalMetadata?.documentName || '').toUpperCase();
  
  if (title.includes('CONFIDENTIALITY') || title.includes('NDA') || title.includes('NON-DISCLOSURE') || title.includes('CONFIDENTIAL AGREEMENT')) {
    return 'CONFIDENTIAL';
  }
  if (title.includes('INCIDENT') || title.includes('ORIENTATION') || title.includes('CHECKLIST') || title.includes('ONBOARDING')) {
    return 'RESTRICTED';
  }
  if (customCls && customCls !== 'OFFICIAL / RESTRICTED') {
    return customCls;
  }
  return customCls || 'CONFIDENTIAL';
};

export const getProcessedHtmlContent = (htmlContent: string | undefined, doc?: Partial<HRDocumentRecord>, fallbackCompanyName?: string, client?: Client): string => {
  if (!htmlContent) return '';
  const compName = fallbackCompanyName || client?.company_name || doc?.entityCredentials?.companyName || DEFAULT_ENTITY_CREDENTIALS.companyName;
  const facName = doc?.facilityDetails?.facilityName && doc.facilityDetails.facilityName !== DEFAULT_FACILITY_DETAILS.facilityName ? doc.facilityDetails.facilityName : compName;
  const empName = doc?.employeeDetails?.fullLegalName || DEFAULT_EMPLOYEE_DETAILS.fullLegalName;

  const authRepName = client?.auth_representative?.name || doc?.riskCommitteeContacts?.committeeChair || 'Aseef Sulaiman';
  const clinicMgrName = client?.clinic_manager?.name || 'Clinic Manager';
  const medDirName = client?.medical_director?.name || doc?.riskCommitteeContacts?.complianceOfficer || 'Raziya Aseef';
  const itMgrName = client?.it_manager?.name || 'IT Manager / Admin';
  const hrMgrName = client?.hr_manager?.name || 'HR Manager';
  const lastWorkingDateStr = doc?.employeeDetails?.lastWorkingDate ? formatDateDisplay(doc.employeeDetails.lastWorkingDate) : '';
  const empStatus = doc?.employeeDetails?.employmentStatus || 'Active';

  let processed = htmlContent
    .replace(/\(Company Name\)/gi, compName)
    .replace(/\[Company Name\]/gi, compName)
    .replace(/\[COMPANY_NAME\]/gi, compName)
    .replace(/\{client\.company_name\}/gi, compName)
    .replace(/\(client\.company_name\)/gi, compName)
    .replace(/\[client\.company_name\]/gi, compName)
    .replace(/client\.company_name/gi, compName)
    .replace(/\(Company\)/gi, compName)
    .replace(/\[Company\]/gi, compName)
    .replace(/\(Facility Name\)/gi, facName)
    .replace(/\[Facility Name\]/gi, facName)
    .replace(/\[FACILITY_NAME\]/gi, facName)
    .replace(/\(Employee Name\)/gi, empName)
    .replace(/\[Employee Name\]/gi, empName)
    .replace(/\{employee\.fullLegalName\}/gi, empName)
    .replace(/\(Last Working Date\)/gi, lastWorkingDateStr)
    .replace(/\[Last Working Date\]/gi, lastWorkingDateStr)
    .replace(/\[LAST_WORKING_DATE\]/gi, lastWorkingDateStr)
    .replace(/\{employee\.last_working_date\}/gi, lastWorkingDateStr)
    .replace(/\{employee\.lastWorkingDate\}/gi, lastWorkingDateStr)
    .replace(/\{employee\.employmentStatus\}/gi, empStatus)
    .replace(/\(Authorized Representative\)/gi, authRepName)
    .replace(/\[Authorized Representative\]/gi, authRepName)
    .replace(/\(Auth Rep\)/gi, authRepName)
    .replace(/\[AUTH_REP_NAME\]/gi, authRepName)
    .replace(/\{auth_representative\.name\}/gi, authRepName)
    .replace(/\(Clinic Manager\)/gi, clinicMgrName)
    .replace(/\[Clinic Manager\]/gi, clinicMgrName)
    .replace(/\[CLINIC_MGR_NAME\]/gi, clinicMgrName)
    .replace(/\{clinic_manager\.name\}/gi, clinicMgrName)
    .replace(/\(Medical Director\)/gi, medDirName)
    .replace(/\[Medical Director\]/gi, medDirName)
    .replace(/\[MED_DIR_NAME\]/gi, medDirName)
    .replace(/\{medical_director\.name\}/gi, medDirName)
    .replace(/\(IT Manager\)/gi, itMgrName)
    .replace(/\[IT Manager\]/gi, itMgrName)
    .replace(/\{it_manager\.name\}/gi, itMgrName)
    .replace(/\(HR Manager\)/gi, hrMgrName)
    .replace(/\[HR Manager\]/gi, hrMgrName)
    .replace(/\{hr_manager\.name\}/gi, hrMgrName);

  if (fallbackCompanyName && fallbackCompanyName !== 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L') {
    processed = processed.replace(/AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W\.L\.L/gi, fallbackCompanyName);
  }

  return processed;
};

export const DEFAULT_LEGAL_METADATA: HRDocumentLegalMetadata = {
  documentName: 'HR Compliance Document',
  referenceCode: 'REF-HR-1001',
  legalStandards: 'UAE Cyber Security & Internal Audit Compliance',
  lawReference: 'Federal Decree-Law No. 50',
  issueDate: new Date().toISOString().split('T')[0],
  effectiveDate: new Date().toISOString().split('T')[0],
  nextReviewDate: '2027-07-28',
  documentClassification: 'CONFIDENTIAL'
};

export const DEFAULT_ENTITY_CREDENTIALS: HRDocumentEntityCredentials = {
  companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
  tradeLicenseNo: 'CN-1005168',
  emirateJurisdiction: 'Abu Dhabi',
  registeredAddress: 'Abu Dhabi, UAE'
};

export const DEFAULT_EMPLOYEE_DETAILS: HRDocumentEmployeeDetails = {
  fullLegalName: 'Raziya Aseef',
  employeeId: 'SPRC-01',
  emiratesId: '784-1990-1234567-1',
  passportNumber: 'N1029384',
  jobTitle: 'Manager',
  department: 'Admin',
  joiningDate: '2024-01-01',
  lastWorkingDate: '',
  employmentStatus: 'Active'
};

export const DEFAULT_FACILITY_DETAILS: HRDocumentFacilityDetails = {
  facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
  facilityLicenseNo: '',
  dohMohapRegNo: '',
  facilityLocation: 'Abu Dhabi, UAE',
  clinicalWing: ''
};

export const DEFAULT_RISK_COMMITTEE_CONTACTS: HRDocumentRiskCommitteeContacts = {
  committeeChair: 'Risk Review Committee Chair',
  complianceOfficer: 'Governance Lead',
  dutyOfficerPhone: '+971 2 600 8899',
  escalationEmail: 'compliance@alnahda.ae'
};

const SEED_HR_DOCUMENTS: HRDocumentRecord[] = [
  {
    id: 'doc-empl-7102',
    title: 'Employee Confidentiality Agreement',
    category: 'COMPLIANCE',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Employee Confidentiality Agreement',
      referenceCode: 'REF-HR-NDA-001',
      legalStandards: 'UAE Federal Decree-Law No. 45 & DOH ADHICS Health Data Standards',
      lawReference: 'Federal Decree-Law No. 45',
      issueDate: '03 Aug 2026',
      effectiveDate: '03 Aug 2026',
      nextReviewDate: '2027-08-03',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Zayed Al-Maktoum',
      employeeId: 'EMP-10294',
      emiratesId: '784-1990-1234567-1',
      passportNumber: 'N12345678',
      jobTitle: 'Senior Compliance Specialist',
      department: 'Legal & Regulatory Compliance'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>This Employee Confidentiality Agreement is executed by and between <strong>(Company Name)</strong> (the "Employer") and the Employee. The Employee acknowledges that during the course of employment at <strong>(Company Name)</strong>, they will have access to protected patient health information (PHI), MALAFFI EMR databases, proprietary clinical protocols, and internal network infrastructure.</p><p>The Employee agrees to maintain strict confidentiality and shall not disclose or transmit any proprietary information of <strong>(Company Name)</strong> to unauthorized third parties without prior written consent, in strict compliance with UAE Federal Decree-Law No. 45 on Personal Data Protection and DOH ADHICS security frameworks.</p><div style="margin-top: 14px; padding: 10px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;"><h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.05em;">Facility Committee Signatory Controls</h4><p style="margin: 0 0 6px 0; font-size: 10px; color: #475569;">This agreement is maintained and governed under the authority of the active Facility Management Committee Contacts:</p><table style="width: 100%; text-align: left; font-size: 10px; border-collapse: collapse; background-color: #ffffff; border: 1px solid #cbd5e1;"><thead><tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #0f172a;"><th style="padding: 5px 8px; font-weight: 700;">Committee Role</th><th style="padding: 5px 8px; font-weight: 700;">Designated Contact Person</th></tr></thead><tbody><tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 5px 8px; font-weight: 600; color: #334155;">Authorized Representative</td><td style="padding: 5px 8px; font-weight: 700; color: #0f172a;">(Authorized Representative)</td></tr><tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 5px 8px; font-weight: 600; color: #334155;">Clinic Manager</td><td style="padding: 5px 8px; font-weight: 700; color: #0f172a;">(Clinic Manager)</td></tr><tr><td style="padding: 5px 8px; font-weight: 600; color: #334155;">Medical Director</td><td style="padding: 5px 8px; font-weight: 700; color: #0f172a;">(Medical Director)</td></tr></tbody></table></div>`,
    employeeSignature: {
      signedBy: 'Zayed Al-Maktoum',
      signerRole: 'Employee',
      signedAt: '03/08/2026 11:00',
      isUaePassVerified: true,
      verificationHash: 'SHA256:D9B9BFCC38',
      ipAddress: '194.170.16.1'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '03/08/2026 11:05',
      isUaePassVerified: true,
      verificationHash: 'SHA256:6639384E14',
      ipAddress: '194.170.16.1'
    },
    hrManagerSignature: {
      signedBy: 'Fatima Al-Suwaidi',
      signerRole: 'HR Manager',
      signedAt: '03/08/2026 11:10',
      isUaePassVerified: true,
      verificationHash: 'SHA256:72D297A328',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-5228',
    title: 'Employee Onboarding & Compliance Acknowledgement',
    category: 'ONBOARDING',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Employee Onboarding & Compliance Acknowledgement',
      referenceCode: 'REF-HR-6597',
      legalStandards: 'UAE Cyber Security & Internal Audit Compliance',
      lawReference: 'Federal Decree-Law No. 50',
      issueDate: '03 Aug 2026',
      effectiveDate: '03 Aug 2026',
      nextReviewDate: '2027-07-28',
      documentClassification: 'RESTRICTED'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Zayed Al-Maktoum',
      employeeId: 'EMP-10294',
      emiratesId: '784-1990-1234567-1',
      passportNumber: 'N12345678',
      jobTitle: 'Senior Compliance Specialist',
      department: 'Legal & Regulatory Compliance'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>The Employee hereby acknowledges receipt of all corporate policies, data security guidelines, and confidential information protection frameworks established under UAE Federal Law.</p><p>By executing this instrument via UAE PASS, the employee attests full compliance with ADHCS cybersecurity benchmarks and corporate code of conduct.</p>`,
    employeeSignature: {
      signedBy: 'Zayed Al-Maktoum',
      signerRole: 'Employee',
      signedAt: '27/07/2026 10:15',
      isUaePassVerified: true,
      verificationHash: 'SHA256:7A9F3C1D2E4B8C1D',
      ipAddress: '194.170.16.1'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '27/07/2026 10:20',
      isUaePassVerified: true,
      verificationHash: 'SHA256:8B0E4D2C3F5A9D2E',
      ipAddress: '194.170.16.1'
    },
    hrManagerSignature: {
      signedBy: 'Fatima Al-Suwaidi',
      signerRole: 'HR Manager',
      signedAt: '27/07/2026 10:25',
      isUaePassVerified: true,
      verificationHash: 'SHA256:9C1F5E3D4A6B0E3F',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-6019',
    title: 'Standard Employment Agreement & IP Assignment',
    category: 'CONTRACT',
    status: 'APPROVED_FROZEN',
    currentVersion: '2.1',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Standard Employment Agreement & IP Assignment',
      referenceCode: 'REF-EMPL-6019',
      legalStandards: 'MOHRE UAE Labor Law & ADHCS Data Protection',
      lawReference: 'Federal Decree-Law No. 33',
      issueDate: '15 Jan 2026',
      effectiveDate: '15 Jan 2026',
      nextReviewDate: '15 Jan 2027'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Mariam Al-Hassani',
      employeeId: 'EMP-10882',
      emiratesId: '784-1995-7654321-2',
      passportNumber: 'P98765432',
      jobTitle: 'Lead Information Security Auditor',
      department: 'Cybersecurity Operations'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Dr. Tariq Al-Mansoori (Risk Review Chair)',
      complianceOfficer: 'Fatima Al-Suwaidi (Risk Officer)',
      dutyOfficerPhone: '+971 2 600 7700',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>This Employment Agreement defines the terms of service, intellectual property ownership, and strict non-disclosure obligations for the Employee during and after employment.</p>`,
    employeeSignature: {
      signedBy: 'Mariam Al-Hassani',
      signerRole: 'Employee',
      signedAt: '15/01/2026 14:00',
      isUaePassVerified: true,
      verificationHash: 'SHA256:3E2F1A4B5C6D7E8F',
      ipAddress: '194.170.16.4'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '15/01/2026 14:10',
      isUaePassVerified: true,
      verificationHash: 'SHA256:4F3A2B1C5D6E7F8A',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8801',
    title: 'Information Security & ADHICS Acceptable Use Policy Acknowledgement',
    category: 'POLICY_ACK',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.2',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Information Security & ADHICS Acceptable Use Policy Acknowledgement',
      referenceCode: 'REF-HR-SEC-8801',
      legalStandards: 'ADHICS Standards v2.0 & ISO 27001 Controls A.7.2',
      lawReference: 'DOH ADHICS Security Standard A.7',
      issueDate: '10 Feb 2026',
      effectiveDate: '10 Feb 2026',
      nextReviewDate: '10 Feb 2027',
      documentClassification: 'RESTRICTED'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Ahmed Al-Mansoori',
      employeeId: 'EMP-10442',
      emiratesId: '784-1988-9876543-1',
      passportNumber: 'N4488331',
      jobTitle: 'Senior Infrastructure Engineer',
      department: 'IT & Infrastructure'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>The Employee hereby confirms agreement to adhere strictly to all Information Security Policies, ADHICS Acceptable Use Rules, credential management standards, and workstation lock requirements established by <strong>AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L</strong>.</p>`,
    employeeSignature: {
      signedBy: 'Ahmed Al-Mansoori',
      signerRole: 'Employee',
      signedAt: '10/02/2026 09:30',
      isUaePassVerified: true,
      verificationHash: 'SHA256:8F9E0A1B2C3D4E5F',
      ipAddress: '194.170.16.2'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '10/02/2026 09:35',
      isUaePassVerified: true,
      verificationHash: 'SHA256:1A2B3C4D5E6F7A8B',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8802',
    title: 'Remote Work & BYOD Mobile Security Protocol Agreement',
    category: 'POLICY_ACK',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Remote Work & BYOD Mobile Security Protocol Agreement',
      referenceCode: 'REF-HR-BYOD-8802',
      legalStandards: 'UAE Cyber Security Council & ADHICS Remote Access Framework',
      lawReference: 'Federal Decree-Law No. 45',
      issueDate: '20 Mar 2026',
      effectiveDate: '20 Mar 2026',
      nextReviewDate: '20 Mar 2027',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Ahmed Al-Mansoori',
      employeeId: 'EMP-10442',
      emiratesId: '784-1988-9876543-1',
      passportNumber: 'N4488331',
      jobTitle: 'Senior Infrastructure Engineer',
      department: 'IT & Infrastructure'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>This Remote Work and BYOD Agreement outlines mandatory endpoint controls, mandatory VPN tunneling, encrypted storage mandates, and remote-wipe permissions for personal devices connecting to corporate networks.</p>`,
    employeeSignature: {
      signedBy: 'Ahmed Al-Mansoori',
      signerRole: 'Employee',
      signedAt: '20/03/2026 11:15',
      isUaePassVerified: true,
      verificationHash: 'SHA256:7B8C9D0E1F2A3B4C',
      ipAddress: '194.170.16.2'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '20/03/2026 11:20',
      isUaePassVerified: true,
      verificationHash: 'SHA256:5C6D7E8F9A0B1C2D',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8803',
    title: 'Conflict of Interest & Corporate Ethics Declaration',
    category: 'COMPLIANCE',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Conflict of Interest & Corporate Ethics Declaration',
      referenceCode: 'REF-HR-ETH-8803',
      legalStandards: 'UAE Federal Commercial Code & Internal Anti-Bribery Standards',
      lawReference: 'Federal Law No. 32 of 2021',
      issueDate: '05 Apr 2026',
      effectiveDate: '05 Apr 2026',
      nextReviewDate: '05 Apr 2027',
      documentClassification: 'RESTRICTED'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Fatima Al-Suwaidi',
      employeeId: 'EMP-10012',
      emiratesId: '784-1992-5544332-9',
      passportNumber: 'N9911223',
      jobTitle: 'HR & Governance Manager',
      department: 'Human Resources'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>The Employee declares that they have no outside commercial engagements, financial interests, or vendor relationships that present an unmitigated conflict of interest with <strong>AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L</strong>.</p>`,
    employeeSignature: {
      signedBy: 'Fatima Al-Suwaidi',
      signerRole: 'Employee',
      signedAt: '05/04/2026 10:00',
      isUaePassVerified: true,
      verificationHash: 'SHA256:4D5E6F7A8B9C0D1E',
      ipAddress: '194.170.16.1'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '05/04/2026 10:05',
      isUaePassVerified: true,
      verificationHash: 'SHA256:2E3F4A5B6C7D8E9F',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8804',
    title: 'Health Data Protection & Malaffi EMR Access Authorization Form',
    category: 'COMPLIANCE',
    status: 'APPROVED_FROZEN',
    currentVersion: '2.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Health Data Protection & Malaffi EMR Access Authorization Form',
      referenceCode: 'REF-HR-MLF-8804',
      legalStandards: 'DOH ADHICS Security Standard & Malaffi Health Information Exchange Controls',
      lawReference: 'Federal Law No. 2 of 2019 on Health Data',
      issueDate: '12 May 2026',
      effectiveDate: '12 May 2026',
      nextReviewDate: '12 May 2027',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Dr. Sarah Al-Dhaheri',
      employeeId: 'EMP-10901',
      emiratesId: '784-1985-1122334-5',
      passportNumber: 'N5566778',
      jobTitle: 'Clinical Audit Supervisor',
      department: 'Medical Claims & Audit'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Authorized Health Data Access Form authorizing the Employee to view and process patient medical records in accordance with DOH Abu Dhabi regulations and Malaffi security protocols.</p>`,
    employeeSignature: {
      signedBy: 'Dr. Sarah Al-Dhaheri',
      signerRole: 'Employee',
      signedAt: '12/05/2026 15:20',
      isUaePassVerified: true,
      verificationHash: 'SHA256:9A8B7C6D5E4F3A2B',
      ipAddress: '194.170.16.5'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '12/05/2026 15:25',
      isUaePassVerified: true,
      verificationHash: 'SHA256:6F5E4D3C2B1A0F9E',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8805',
    title: 'Occupational Health, Safety & Emergency Protocol Sign-off',
    category: 'GENERAL_HR',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Occupational Health, Safety & Emergency Protocol Sign-off',
      referenceCode: 'REF-HR-OHS-8805',
      legalStandards: 'UAE OSHAD System Framework & Civil Defense Safety Codes',
      lawReference: 'Federal Decree-Law No. 33',
      issueDate: '01 Jun 2026',
      effectiveDate: '01 Jun 2026',
      nextReviewDate: '01 Jun 2027',
      documentClassification: 'GENERAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Dr. Sarah Al-Dhaheri',
      employeeId: 'EMP-10901',
      emiratesId: '784-1985-1122334-5',
      passportNumber: 'N5566778',
      jobTitle: 'Clinical Audit Supervisor',
      department: 'Medical Claims & Audit'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Acknowledgement of receipt and training on workplace fire evacuation, emergency protocols, hazardous material handling, and occupational safety rules mandated under UAE OSHAD standards.</p>`,
    employeeSignature: {
      signedBy: 'Dr. Sarah Al-Dhaheri',
      signerRole: 'Employee',
      signedAt: '01/06/2026 09:00',
      isUaePassVerified: true,
      verificationHash: 'SHA256:1C2D3E4F5A6B7C8D',
      ipAddress: '194.170.16.5'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '01/06/2026 09:05',
      isUaePassVerified: true,
      verificationHash: 'SHA256:3B4C5D6E7F8A9B0C',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8806',
    title: 'Annual Cyber Security Training & Phishing Awareness Certificate Record',
    category: 'GENERAL_HR',
    status: 'APPROVED_FROZEN',
    currentVersion: '2026.1',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Annual Cyber Security Training & Phishing Awareness Certificate Record',
      referenceCode: 'REF-HR-TRN-8806',
      legalStandards: 'ADHICS Security Control A.7.2.2 & ISO 27001 Awareness',
      lawReference: 'DOH ADHICS Domain A.7',
      issueDate: '18 Jun 2026',
      effectiveDate: '18 Jun 2026',
      nextReviewDate: '18 Jun 2027',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Tariq Al-Nuaimi',
      employeeId: 'EMP-10773',
      emiratesId: '784-1993-3322110-4',
      passportNumber: 'N8877665',
      jobTitle: 'IT Risk Analyst',
      department: 'Cybersecurity Operations'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Official training completion certificate verifying that the employee passed the 2026 Annual Cybersecurity, Ransomware Defense, Social Engineering, and ADHICS Compliance Assessment.</p>`,
    employeeSignature: {
      signedBy: 'Tariq Al-Nuaimi',
      signerRole: 'Employee',
      signedAt: '18/06/2026 16:45',
      isUaePassVerified: true,
      verificationHash: 'SHA256:5E6F7A8B9C0D1E2F',
      ipAddress: '194.170.16.3'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '18/06/2026 16:50',
      isUaePassVerified: true,
      verificationHash: 'SHA256:7A8B9C0D1E2F3A4B',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8807',
    title: 'Incident Response Protocol & Whistleblower Acknowledgment',
    category: 'COMPLIANCE',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.1',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Incident Response Protocol & Whistleblower Acknowledgment',
      referenceCode: 'REF-HR-INC-8807',
      legalStandards: 'ADHICS Domain A.16 Security Incident Management & UAE Whistleblower Guidelines',
      lawReference: 'Federal Decree-Law No. 45',
      issueDate: '02 Jul 2026',
      effectiveDate: '02 Jul 2026',
      nextReviewDate: '02 Jul 2027',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Tariq Al-Nuaimi',
      employeeId: 'EMP-10773',
      emiratesId: '784-1993-3322110-4',
      passportNumber: 'N8877665',
      jobTitle: 'IT Risk Analyst',
      department: 'Cybersecurity Operations'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Mandatory policy acknowledgement governing immediate 15-minute reporting requirements for security breaches, ransomware detection, patient data spillages, and protected whistleblower channels.</p>`,
    employeeSignature: {
      signedBy: 'Tariq Al-Nuaimi',
      signerRole: 'Employee',
      signedAt: '02/07/2026 11:30',
      isUaePassVerified: true,
      verificationHash: 'SHA256:2D3E4F5A6B7C8D9E',
      ipAddress: '194.170.16.3'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '02/07/2026 11:35',
      isUaePassVerified: true,
      verificationHash: 'SHA256:8C9D0E1F2A3B4C5D',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8808',
    title: 'Offboarding Data Sanitization & Exit NDA Declaration',
    category: 'SEPARATION',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Offboarding Data Sanitization & Exit NDA Declaration',
      referenceCode: 'REF-HR-EXT-8808',
      legalStandards: 'ADHICS Domain A.7.3 Termination & ISO 27001 Control A.8.1.4',
      lawReference: 'Federal Decree-Law No. 33',
      issueDate: '25 Jul 2026',
      effectiveDate: '25 Jul 2026',
      nextReviewDate: '25 Jul 2027',
      documentClassification: 'RESTRICTED'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Hassan Al-Zaabi',
      employeeId: 'EMP-10119',
      emiratesId: '784-1982-6677889-0',
      passportNumber: 'N3344556',
      jobTitle: 'Former Systems Administrator',
      department: 'IT Infrastructure'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Formal exit sign-off attesting that the departing employee has returned all company assets, deleted all offline copies of proprietary information, and remains bound by permanent NDA covenants.</p>`,
    employeeSignature: {
      signedBy: 'Hassan Al-Zaabi',
      signerRole: 'Employee',
      signedAt: '25/07/2026 17:00',
      isUaePassVerified: true,
      verificationHash: 'SHA256:9E0A1B2C3D4E5F6A',
      ipAddress: '194.170.16.8'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '25/07/2026 17:05',
      isUaePassVerified: true,
      verificationHash: 'SHA256:3D4E5F6A7B8C9D0E',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-empl-8809',
    title: 'Staff Anti-Solicitation & Non-Compete Covenant',
    category: 'CONTRACT',
    status: 'APPROVED_FROZEN',
    currentVersion: '1.0',
    isFrozen: true,
    prePrintedLetterheadMode: false,
    includeHrManagerSignatory: true,
    isUaePassSealed: true,
    legalMetadata: {
      documentName: 'Staff Anti-Solicitation & Non-Compete Covenant',
      referenceCode: 'REF-HR-NCP-8809',
      legalStandards: 'MOHRE Executive Regulations & Federal Decree-Law No. 33 Article 10',
      lawReference: 'Federal Decree-Law No. 33',
      issueDate: '01 Aug 2026',
      effectiveDate: '01 Aug 2026',
      nextReviewDate: '01 Aug 2027',
      documentClassification: 'CONFIDENTIAL'
    },
    entityCredentials: {
      companyName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      tradeLicenseNo: 'CN-1005168',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'Abu Dhabi, UAE'
    },
    employeeDetails: {
      fullLegalName: 'Fatima Al-Suwaidi',
      employeeId: 'EMP-10012',
      emiratesId: '784-1992-5544332-9',
      passportNumber: 'N9911223',
      jobTitle: 'HR & Governance Manager',
      department: 'Human Resources'
    },
    facilityDetails: {
      facilityName: 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L',
      facilityLicenseNo: '',
      dohMohapRegNo: '',
      facilityLocation: 'Abu Dhabi, UAE',
      clinicalWing: ''
    },
    riskCommitteeContacts: {
      committeeChair: 'Risk Review Committee Chair',
      complianceOfficer: 'Senior Governance Lead',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'compliance@alnahda.ae'
    },
    htmlContent: `<p>Restrictive covenant protecting <strong>AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L</strong> against unauthorized client solicitation, employee poaching, and unfair competition for a period of 24 months post-employment.</p>`,
    employeeSignature: {
      signedBy: 'Fatima Al-Suwaidi',
      signerRole: 'Employee',
      signedAt: '01/08/2026 14:30',
      isUaePassVerified: true,
      verificationHash: 'SHA256:1A2B3C4D5E6F7A8B',
      ipAddress: '194.170.16.1'
    },
    employerSignature: {
      signedBy: 'Rashid Al-Nuaimi',
      signerRole: 'Employer Signatory',
      signedAt: '01/08/2026 14:35',
      isUaePassVerified: true,
      verificationHash: 'SHA256:7B8C9D0E1F2A3B4C',
      ipAddress: '194.170.16.1'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function HrDocumentsHub({ client, currentUser, employees, allClients, onAddEmailLog }: HrDocumentsHubProps) {
  const currentClientKey = client?.id || 'c1';

  // Compliance Consultant Master Detection
  const isConsultantMode = currentClientKey === 'c0' || 
    currentClientKey === 'SPRC' || 
    client?.client_code === 'SPRC' || 
    client?.id === 'c0' ||
    Boolean(client?.company_name && client.company_name.toLowerCase().includes('smartpro')) || 
    Boolean(client?.company_name && client.company_name.toLowerCase().includes('compliance consultant')) || 
    Boolean(client?.facility_type && client.facility_type.toLowerCase().includes('consultan'));

  // SuperAdmin Role Check for Master Document Operations
  const isSuperAdmin =
    !currentUser ||
    currentUser.role === 'SUPER_ADMIN' ||
    (currentUser.role as string)?.toLowerCase() === 'superadmin' ||
    (currentUser.role as string)?.toLowerCase() === 'super_admin';

  // Available Clients List for Cross-Client & All-Client Batch Copying
  const availableClientsList = React.useMemo(() => {
    let list: Client[] = [];
    if (allClients && allClients.length > 0) {
      list = allClients;
    } else {
      try {
        const saved = localStorage.getItem('sh_clients');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
      } catch (e) {}
    }
    if (list.length === 0) list = INITIAL_CLIENTS;
    if (client && !list.some(c => c.id === client.id)) {
      list = [client, ...list];
    }
    return list;
  }, [allClients, client]);

  // Roster of registered employees from Employee & Operator Management
  const effectiveEmployees = React.useMemo(() => {
    if (employees && employees.length > 0) return employees;
    try {
      const saved = localStorage.getItem(`sh_employees_${currentClientKey}`) || (currentClientKey === 'c1' ? localStorage.getItem('sh_employees') : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load employee roster for HR Vault', e);
    }
    return INITIAL_EMPLOYEES;
  }, [employees, currentClientKey]);

  // Helper to load documents safely and synchronously from storage
  const loadDocumentsFromStorage = (targetClientKey: string, isConsultant: boolean, targetClientObj?: Client | null): HRDocumentRecord[] => {
    try {
      if (isConsultant) {
        // COMPLIANCE CONSULTANT mode: load master documents
        const consultantKeys = [
          'smarthub_hr_documents_vault_v2_c0',
          'smarthub_hr_documents_vault_v2_SPRC',
          'smarthub_hr_documents_vault_c0',
          'smarthub_hr_documents_vault_SPRC'
        ];
        for (const k of consultantKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr) && arr.length > 0) {
                return arr.map((doc: any) => ({
                  ...doc,
                  client_id: 'c0',
                  legalMetadata: {
                    ...DEFAULT_LEGAL_METADATA,
                    ...(doc.legalMetadata || {}),
                    issueDate: toISODate(doc.legalMetadata?.issueDate || doc.createdAt),
                    effectiveDate: toISODate(doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt),
                    nextReviewDate: toISODate(doc.legalMetadata?.nextReviewDate || doc.legalMetadata?.dueDateForRevision || '2027-07-28'),
                    dueDateForRevision: toISODate(doc.legalMetadata?.dueDateForRevision || doc.legalMetadata?.nextReviewDate || '2027-07-28'),
                    approvalDate: toISODate(doc.legalMetadata?.approvalDate || doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt)
                  },
                  entityCredentials: { ...DEFAULT_ENTITY_CREDENTIALS, ...(doc.entityCredentials || {}) },
                  employeeDetails: { ...DEFAULT_EMPLOYEE_DETAILS, ...(doc.employeeDetails || {}) },
                  facilityDetails: doc.facilityDetails || DEFAULT_FACILITY_DETAILS,
                  riskCommitteeContacts: doc.riskCommitteeContacts || DEFAULT_RISK_COMMITTEE_CONTACTS
                }));
              }
            } catch (e) {}
          }
        }

        // If empty on Compliance Consultant, initialize master seed documents for SmartPro
        const masterSeed = SEED_HR_DOCUMENTS.map((doc, idx) => ({
          ...doc,
          id: doc.id || `doc-master-${idx + 1}`,
          client_id: 'c0',
          isFrozen: true,
          status: 'APPROVED_FROZEN' as const,
          legalMetadata: {
            ...DEFAULT_LEGAL_METADATA,
            ...(doc.legalMetadata || {}),
            issueDate: toISODate(doc.legalMetadata?.issueDate || doc.createdAt),
            effectiveDate: toISODate(doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt),
            nextReviewDate: toISODate(doc.legalMetadata?.nextReviewDate || doc.legalMetadata?.dueDateForRevision || '2027-07-28'),
            dueDateForRevision: toISODate(doc.legalMetadata?.dueDateForRevision || doc.legalMetadata?.nextReviewDate || '2027-07-28'),
            approvalDate: toISODate(doc.legalMetadata?.approvalDate || doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt)
          },
          entityCredentials: {
            companyName: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
            tradeLicenseNo: 'TL-AD-10192',
            emirateJurisdiction: 'Abu Dhabi',
            registeredAddress: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
          },
          facilityDetails: {
            facilityName: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
            facilityLicenseNo: 'TL-AD-10192',
            dohMohapRegNo: 'DOH-CONS-9921',
            clinicalWing: '',
            facilityLocation: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
          }
        }));
        try {
          localStorage.setItem('smarthub_hr_documents_vault_v2_c0', JSON.stringify(masterSeed));
          localStorage.setItem('smarthub_hr_documents_vault_v2_SPRC', JSON.stringify(masterSeed));
        } catch (e) {}
        return masterSeed;
      } else {
        // CLIENT MODE: Only load documents genuinely created, uploaded, or copied for this client
        const candidateKeys = [
          `${STORAGE_KEY}_${targetClientKey}`,
          `smarthub_hr_documents_vault_${targetClientKey}`,
          `sh_hr_documents_${targetClientKey}`,
          `smarthub_hr_documents_vault_v2_${targetClientKey}`,
          ...(targetClientKey === 'c1' || (targetClientObj?.company_name && targetClientObj.company_name.toLowerCase().includes('nahda'))
            ? [`${STORAGE_KEY}_c1`, `smarthub_hr_documents_vault_v2_c1`, `smarthub_hr_documents_vault_c1`]
            : [])
        ];

        for (const k of candidateKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr) && arr.length > 0) {
                return arr.map((doc: any) => ({
                  ...doc,
                  client_id: targetClientKey,
                  legalMetadata: {
                    ...DEFAULT_LEGAL_METADATA,
                    ...(doc.legalMetadata || {}),
                    issueDate: toISODate(doc.legalMetadata?.issueDate || doc.createdAt),
                    effectiveDate: toISODate(doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt),
                    nextReviewDate: toISODate(doc.legalMetadata?.nextReviewDate || doc.legalMetadata?.dueDateForRevision || '2027-07-28'),
                    dueDateForRevision: toISODate(doc.legalMetadata?.dueDateForRevision || doc.legalMetadata?.nextReviewDate || '2027-07-28'),
                    approvalDate: toISODate(doc.legalMetadata?.approvalDate || doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt)
                  },
                  entityCredentials: { ...DEFAULT_ENTITY_CREDENTIALS, ...(doc.entityCredentials || {}) },
                  employeeDetails: { ...DEFAULT_EMPLOYEE_DETAILS, ...(doc.employeeDetails || {}) },
                  facilityDetails: doc.facilityDetails || DEFAULT_FACILITY_DETAILS,
                  riskCommitteeContacts: doc.riskCommitteeContacts || DEFAULT_RISK_COMMITTEE_CONTACTS
                }));
              }
            } catch (e) {}
          }
        }
        return [];
      }
    } catch (e) {
      console.warn('Failed to parse HR Documents Vault state', e);
      return [];
    }
  };

  // Helper to persist documents synchronously and safely
  const persistDocumentsToStorage = (targetClientKey: string, isConsultant: boolean, docs: HRDocumentRecord[], targetClientObj?: Client | null) => {
    if (!targetClientKey) return;
    try {
      const jsonStr = JSON.stringify(docs);
      if (isConsultant) {
        localStorage.setItem('smarthub_hr_documents_vault_v2_c0', jsonStr);
        localStorage.setItem('smarthub_hr_documents_vault_v2_SPRC', jsonStr);
      } else {
        localStorage.setItem(`${STORAGE_KEY}_${targetClientKey}`, jsonStr);
        if (targetClientKey === 'c1' || targetClientObj?.company_name?.toLowerCase().includes('al nahda')) {
          localStorage.setItem(`${STORAGE_KEY}_c1`, jsonStr);
        }
      }
    } catch (e) {
      console.warn('Failed to save HR Documents to localStorage', e);
    }
  };

  const isInitializedRef = useRef<boolean>(false);
  const currentLoadedClientRef = useRef<string>(currentClientKey);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>(() => new Date().toLocaleTimeString());
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Master Security Protection Key & Unlock State (Password: 663385)
  const MASTER_SECURITY_PIN = '663385';
  const [isProtectedUnlocked, setIsProtectedUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('smarthub_master_unlock_663385') === 'true';
    } catch {
      return false;
    }
  });
  const [showSecurityUnlockModal, setShowSecurityUnlockModal] = useState<boolean>(false);
  const [securityPinInput, setSecurityPinInput] = useState<string>('');
  const [securityPinError, setSecurityPinError] = useState<string | null>(null);
  const [showPinPassword, setShowPinPassword] = useState<boolean>(false);
  const [pendingActionOnUnlock, setPendingActionOnUnlock] = useState<(() => void) | null>(null);

  const handleVerifySecurityPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (securityPinInput.trim() === MASTER_SECURITY_PIN) {
      setIsProtectedUnlocked(true);
      try {
        sessionStorage.setItem('smarthub_master_unlock_663385', 'true');
      } catch {}
      setShowSecurityUnlockModal(false);
      setSecurityPinInput('');
      setSecurityPinError(null);
      setFormCopyPasteNotice('🔓 Security Key Verified! Protected operations & Master template actions are UNLOCKED.');
      setTimeout(() => setFormCopyPasteNotice(null), 5000);
      if (pendingActionOnUnlock) {
        const action = pendingActionOnUnlock;
        setPendingActionOnUnlock(null);
        action();
      }
    } else {
      setSecurityPinError('❌ Invalid Security PIN. Please enter the authorized Master Security Key.');
    }
  };

  const handleToggleProtectedLock = () => {
    if (isProtectedUnlocked) {
      setIsProtectedUnlocked(false);
      try {
        sessionStorage.removeItem('smarthub_master_unlock_663385');
      } catch {}
      setFormCopyPasteNotice('🔒 Master Protection RE-LOCKED. Security PIN required for destructive actions.');
      setTimeout(() => setFormCopyPasteNotice(null), 4000);
    } else {
      setSecurityPinError(null);
      setSecurityPinInput('');
      setShowSecurityUnlockModal(true);
    }
  };

  // Synchronously initialize documents from storage on initial mount
  const [documents, setDocuments] = useState<HRDocumentRecord[]>(() => {
    const initialDocs = loadDocumentsFromStorage(currentClientKey, isConsultantMode, client);
    isInitializedRef.current = true;
    return initialDocs;
  });

  // Re-hydrate when client switches
  useEffect(() => {
    if (currentLoadedClientRef.current !== currentClientKey) {
      currentLoadedClientRef.current = currentClientKey;
      const loaded = loadDocumentsFromStorage(currentClientKey, isConsultantMode, client);
      setDocuments(loaded);
      isInitializedRef.current = true;
      setLastSavedTimestamp(new Date().toLocaleTimeString());
    }
  }, [currentClientKey, isConsultantMode, client]);

  // Persist Documents to Client-Specific Storage whenever documents array changes
  useEffect(() => {
    if (!isInitializedRef.current || currentLoadedClientRef.current !== currentClientKey) return;
    persistDocumentsToStorage(currentClientKey, isConsultantMode, documents, client);
    setLastSavedTimestamp(new Date().toLocaleTimeString());
  }, [documents, currentClientKey, isConsultantMode, client]);

  // Explicit Manual Save Vault Handler
  const handleManualSaveVault = () => {
    persistDocumentsToStorage(currentClientKey, isConsultantMode, documents, client);
    const nowTime = new Date().toLocaleTimeString();
    setLastSavedTimestamp(nowTime);
    setSaveStatusMessage(`✓ Vault Saved (${documents.length} records) at ${nowTime}`);
    setFormCopyPasteNotice(`✓ HR Documents Vault Registry successfully saved! All ${documents.length} file(s) are securely persisted.`);
    setTimeout(() => {
      setSaveStatusMessage(null);
      setFormCopyPasteNotice(null);
    }, 4000);
  };

  const [activeTab, setActiveTab] = useState<'vault' | 'import' | 'export' | 'create'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');

  // Keep facility filter defaulted to ALL so documents are never hidden
  useEffect(() => {
    setFacilityFilter('ALL');
  }, [currentClientKey, client?.company_name]);

  // Derived Master Consultant Documents for Copying to Client Vault
  const consultantMasterDocs = React.useMemo(() => {
    // 1. Check Compliance Consultant storage key first
    try {
      const keys = ['smarthub_hr_documents_vault_v2_c0', 'smarthub_hr_documents_vault_v2_SPRC'];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length > 0) {
            return arr as HRDocumentRecord[];
          }
        }
      }
    } catch (e) {}

    // 2. Default baseline master documents from SmartPro Public Relations Consultancy & Cyber Risk Management Services
    return SEED_HR_DOCUMENTS.map((doc, idx) => ({
      ...doc,
      id: doc.id || `doc-master-${idx + 1}`,
      client_id: 'c0',
      isFrozen: true,
      status: 'APPROVED_FROZEN' as const,
      entityCredentials: {
        companyName: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
        tradeLicenseNo: 'TL-AD-10192',
        emirateJurisdiction: 'Abu Dhabi',
        registeredAddress: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
      },
      facilityDetails: {
        facilityName: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
        facilityLicenseNo: 'TL-AD-10192',
        dohMohapRegNo: 'DOH-CONS-9921',
        clinicalWing: '',
        facilityLocation: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
      }
    }));
  }, [currentClientKey, isConsultantMode, documents]);

  // Fit to Page (A4 Scale Mode) state
  const [fitToPageA4, setFitToPageA4] = useState<boolean>(true);

  // Facility List Derived Options
  const facilityOptions = React.useMemo(() => {
    const list = new Set<string>();
    if (client?.company_name) list.add(client.company_name);
    effectiveEmployees.forEach(e => {
      if (e.branch_name) list.add(e.branch_name);
    });
    documents.forEach(d => {
      if (d.facilityDetails?.facilityName) list.add(d.facilityDetails.facilityName);
      if (d.entityCredentials?.companyName) list.add(d.entityCredentials.companyName);
    });
    list.add('AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L');
    list.add('SmartPro Public Relations Consultancy & Cyber Risk Management Services');
    list.add('AL KHAJA MEDICAL CENTER');
    list.add('Al Khatem Medical Branch');
    list.add('Cleveland Clinic Abu Dhabi');
    list.add('HealthPoint Hospital Abu Dhabi');
    list.add('Al Zahra Hospital Dubai');
    return Array.from(list).filter(Boolean);
  }, [client, effectiveEmployees, documents]);

  // Selected Document & Modal Controls
  const [selectedDoc, setSelectedDoc] = useState<HRDocumentRecord | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<HRDocumentRecord | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTotalScriptModal, setShowTotalScriptModal] = useState(false);
  const [inspectViewMode, setInspectViewMode] = useState<'a4-preview' | 'data-grid'>('a4-preview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Group Selection & Bulk Operations
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  // Copy Files from Compliance Consultant Modal
  const [showCopyFromConsultantModal, setShowCopyFromConsultantModal] = useState<boolean>(false);
  const [selectedConsultantDocIds, setSelectedConsultantDocIds] = useState<string[]>([]);
  const [consultantSearch, setConsultantSearch] = useState<string>('');
  const [targetCopyDestination, setTargetCopyDestination] = useState<string>('ACTIVE_CLIENT');
  const [showClearVaultModal, setShowClearVaultModal] = useState<boolean>(false);

  // Dedicated Connect with Employee & Operator Management State
  const [showConnectEmployeeModal, setShowConnectEmployeeModal] = useState<boolean>(false);
  const [connectEmployeeTargetDoc, setConnectEmployeeTargetDoc] = useState<HRDocumentRecord | null>(null);
  const [connectEmployeeSelectedId, setConnectEmployeeSelectedId] = useState<string>('');
  const [connectEmployeeSearch, setConnectEmployeeSearch] = useState<string>('');
  const [connectEmployeeRefreezeOnSave, setConnectEmployeeRefreezeOnSave] = useState<boolean>(true);
  const [unfreezeSelectedEmployeeId, setUnfreezeSelectedEmployeeId] = useState<string>('');

  // Freeze & Unfreeze Master Document Governance States
  const [unfreezePromptDoc, setUnfreezePromptDoc] = useState<HRDocumentRecord | null>(null);
  const [showUnfreezeConfirmModal, setShowUnfreezeConfirmModal] = useState<boolean>(false);
  const [showMassUnfreezeConfirmModal, setShowMassUnfreezeConfirmModal] = useState<boolean>(false);
  const [editRefreezeOnSave, setEditRefreezeOnSave] = useState<boolean>(true);

  // Global Header Toggles
  const [prePrintedLetterhead, setPrePrintedLetterhead] = useState(false);
  const [includeHrManager, setIncludeHrManager] = useState(true);

  // Copy Feedback States
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  // Ingestion Staging States
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<any[]>([]);
  const [ingestNotice, setIngestNotice] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // New Document Form State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<HRDocumentRecord['category']>('ONBOARDING');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmiratesId, setNewEmiratesId] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newJoiningDate, setNewJoiningDate] = useState('2024-01-01');
  const [newEmpStatus, setNewEmpStatus] = useState<string>('Active');
  const [newLastWorkingDate, setNewLastWorkingDate] = useState<string>('');
  const [newFacilityName, setNewFacilityName] = useState('AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L');
  const [newFacilityLicenseNo, setNewFacilityLicenseNo] = useState('');
  const [newDohMohapRegNo, setNewDohMohapRegNo] = useState('');
  const [newFacilityLocation, setNewFacilityLocation] = useState('Abu Dhabi, UAE');
  const [newClinicalWing, setNewClinicalWing] = useState('');
  const [newCommitteeChair, setNewCommitteeChair] = useState('Risk Review Chair');
  const [newComplianceOfficer, setNewComplianceOfficer] = useState('Governance Lead');
  const [newDutyOfficerPhone, setNewDutyOfficerPhone] = useState('+971 2 600 8899');
  const [newEscalationEmail, setNewEscalationEmail] = useState('compliance@alnahda.ae');
  const [newHtmlContent, setNewHtmlContent] = useState('');

  // Loop & Revision Metadata for New Form
  const [newRefCode, setNewRefCode] = useState('REF-HR-6597');
  const [newVersionControl, setNewVersionControl] = useState('v1.0 (Master Loop)');
  const [newIssueDate, setNewIssueDate] = useState('03 Aug 2026');
  const [newDueDateForRevision, setNewDueDateForRevision] = useState('2027-07-28');
  const [newApprovalDate, setNewApprovalDate] = useState('2026-08-03');
  const [newPreparedBy, setNewPreparedBy] = useState('HR Director');
  const [newReviewedBy, setNewReviewedBy] = useState('Compliance Officer');
  const [newApprovedBy, setNewApprovedBy] = useState('Risk Committee Lead');
  const [newDocClassification, setNewDocClassification] = useState('OFFICIAL / RESTRICTED');
  const [newModuleName, setNewModuleName] = useState('General HR Governance');

  // Filtered employees for Create Form based on current client and selected facility
  const filteredEmployeesForCreate = React.useMemo(() => {
    let baseList = effectiveEmployees;
    if (client?.id) {
      const byClientId = effectiveEmployees.filter(emp => emp.client_id === client.id);
      if (byClientId.length > 0) {
        baseList = byClientId;
      } else if (client.company_name) {
        const cName = client.company_name.trim().toLowerCase();
        const byName = effectiveEmployees.filter(emp => {
          const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
          return b === cName || cName.includes(b) || b.includes(cName);
        });
        if (byName.length > 0) baseList = byName;
      }
    }

    if (!newFacilityName || newFacilityName === 'ALL' || newFacilityName === client?.company_name) {
      return baseList;
    }

    const target = newFacilityName.trim().toLowerCase();
    const matches = baseList.filter(emp => {
      const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
      if (!b) return true;
      return b === target || target.includes(b) || b.includes(target);
    });
    return matches.length > 0 ? matches : baseList;
  }, [effectiveEmployees, newFacilityName, client]);

  // Document Form Formatting & Interactive Toolbar State
  const [showCompanyEmployeeInfo, setShowCompanyEmployeeInfo] = useState(true);
  const [showRegulatorySignatoryControls, setShowRegulatorySignatoryControls] = useState(true);
  const [showOptionalEmiratesId, setShowOptionalEmiratesId] = useState(true);
  const [showJoiningDate, setShowJoiningDate] = useState(true);
  const [showOptionalHrManagerSignatory, setShowOptionalHrManagerSignatory] = useState(true);
  const [useManualSignatures, setUseManualSignatures] = useState(true);
  const [signatoryPrintOption, setSignatoryPrintOption] = useState<'dual' | 'tri' | 'quad' | 'custom'>('tri');
  const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>(['auth_rep', 'med_dir', 'hr_mgr']);

  // Committee Contacts connected directly from Facility Management > Facility Committee Signatory Controls (client)
  const committeeContacts = React.useMemo(() => [
    {
      id: 'auth_rep',
      role: client?.auth_representative?.designation || 'Authorized Representative',
      name: client?.auth_representative?.name || 'Aseef Sulaiman',
      email: client?.auth_representative?.email || 'aseef@smartpro.ae',
      phone: client?.auth_representative?.phone || '+971 524846770',
      designation: client?.auth_representative?.designation || 'Authorized Representative',
    },
    {
      id: 'clinic_mgr',
      role: client?.clinic_manager?.designation || 'Clinic Manager',
      name: client?.clinic_manager?.name || 'Clinic Manager',
      email: client?.clinic_manager?.email || 'manager@smartpro.ae',
      phone: client?.clinic_manager?.phone || '+971 2 600 8899',
      designation: client?.clinic_manager?.designation || 'Clinic Manager',
    },
    {
      id: 'med_dir',
      role: client?.medical_director?.designation || 'Medical Director',
      name: client?.medical_director?.name || 'Raziya Aseef',
      email: client?.medical_director?.email || 'raziya@smartpro.ae',
      phone: client?.medical_director?.phone || '+971 50 9007267',
      designation: client?.medical_director?.designation || 'Medical Director',
    },
    {
      id: 'it_mgr',
      role: client?.it_manager?.designation || 'IT Manager / Admin',
      name: client?.it_manager?.name || 'IT Manager / Admin',
      email: client?.it_manager?.email || 'it@smartpro.ae',
      phone: client?.it_manager?.phone || '+971 52 4846770',
      designation: client?.it_manager?.designation || 'IT Manager / Admin',
    },
    {
      id: 'hr_mgr',
      role: client?.hr_manager?.designation || 'HR Manager',
      name: client?.hr_manager?.name || 'HR Manager',
      email: client?.hr_manager?.email || 'hr@smartpro.ae',
      phone: client?.hr_manager?.phone || '+971 2 600 8899',
      designation: client?.hr_manager?.designation || 'HR Manager',
    },
  ], [client]);

  const activeCommitteeSignatories = React.useMemo(() => {
    if (signatoryPrintOption === 'dual') {
      return [committeeContacts[0]]; // Auth Rep
    } else if (signatoryPrintOption === 'tri') {
      return [committeeContacts[0], committeeContacts[2]]; // Auth Rep + Medical Director
    } else if (signatoryPrintOption === 'quad') {
      return [committeeContacts[0], committeeContacts[2], committeeContacts[4]]; // Auth Rep + Medical Director + HR Manager
    } else {
      return committeeContacts.filter(c => selectedCommitteeIds.includes(c.id));
    }
  }, [signatoryPrintOption, committeeContacts, selectedCommitteeIds]);
  const [docFontFamily, setDocFontFamily] = useState('Arial, sans-serif');
  const [docFontSize, setDocFontSize] = useState('11px');
  const [docAreaPadding, setDocAreaPadding] = useState('16px');
  const [docTextColor, setDocTextColor] = useState('#0f172a');
  const [docIsBold, setDocIsBold] = useState(false);
  const [docIsItalic, setDocIsItalic] = useState(false);
  const [docIsUnderline, setDocIsUnderline] = useState(false);
  const [docTextAlign, setDocTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [wordDocUploadNotice, setWordDocUploadNotice] = useState<string | null>(null);

  // Edit Document Modal State
  const [editingDoc, setEditingDoc] = useState<HRDocumentRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocCategory, setEditDocCategory] = useState<HRDocumentRecord['category']>('ONBOARDING');
  const [editDocStatus, setEditDocStatus] = useState<HRDocumentRecord['status']>('APPROVED_FROZEN');
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editEmiratesId, setEditEmiratesId] = useState('');
  const [editPassportNumber, setEditPassportNumber] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState<string>('Active');
  const [editLastWorkingDate, setEditLastWorkingDate] = useState<string>('');
  const [editFacilityName, setEditFacilityName] = useState('');
  const [editFacilityLicenseNo, setEditFacilityLicenseNo] = useState('');
  const [editDohMohapRegNo, setEditDohMohapRegNo] = useState('');
  const [editClinicalWing, setEditClinicalWing] = useState('');
  const [editCommitteeChair, setEditCommitteeChair] = useState('');
  const [editComplianceOfficer, setEditComplianceOfficer] = useState('');
  const [editDutyOfficerPhone, setEditDutyOfficerPhone] = useState('');
  const [editEscalationEmail, setEditEscalationEmail] = useState('');
  const [editHtmlContent, setEditHtmlContent] = useState('');
  const [formCopyPasteNotice, setFormCopyPasteNotice] = useState<string | null>(null);

  // Loop & Revision Metadata for Edit Modal
  const [editRefCode, setEditRefCode] = useState('');
  const [editVersionControl, setEditVersionControl] = useState('v1.0 (Master Loop)');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editDueDateForRevision, setEditDueDateForRevision] = useState('');
  const [editApprovalDate, setEditApprovalDate] = useState('');
  const [editPreparedBy, setEditPreparedBy] = useState('');
  const [editReviewedBy, setEditReviewedBy] = useState('');
  const [editApprovedBy, setEditApprovedBy] = useState('');
  const [editDocClassification, setEditDocClassification] = useState('CONFIDENTIAL');
  const [editModuleName, setEditModuleName] = useState('');

  // Filtered employees for Edit Form based on current client and selected facility
  const filteredEmployeesForEdit = React.useMemo(() => {
    let baseList = effectiveEmployees;
    if (client?.id) {
      const byClientId = effectiveEmployees.filter(emp => emp.client_id === client.id);
      if (byClientId.length > 0) {
        baseList = byClientId;
      } else if (client.company_name) {
        const cName = client.company_name.trim().toLowerCase();
        const byName = effectiveEmployees.filter(emp => {
          const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
          return b === cName || cName.includes(b) || b.includes(cName);
        });
        if (byName.length > 0) baseList = byName;
      }
    }

    if (!editFacilityName || editFacilityName === 'ALL' || editFacilityName === client?.company_name) {
      return baseList;
    }

    const target = editFacilityName.trim().toLowerCase();
    const matches = baseList.filter(emp => {
      const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
      if (!b) return true;
      return b === target || target.includes(b) || b.includes(target);
    });
    return matches.length > 0 ? matches : baseList;
  }, [effectiveEmployees, editFacilityName, client]);

  // Filtered employees for Connect with Employee & Operator Management Modal
  const filteredEmployeesForConnect = React.useMemo(() => {
    let list = filteredEmployeesForEdit;
    if (connectEmployeeSearch.trim()) {
      const q = connectEmployeeSearch.toLowerCase().trim();
      list = list.filter(emp => 
        (emp.employee_name && emp.employee_name.toLowerCase().includes(q)) ||
        (emp.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
        (emp.position && emp.position.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.branch_name && emp.branch_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredEmployeesForEdit, connectEmployeeSearch]);

  // Apply Document Reference Details from Loop Selector
  const handleApplyLoopToNewForm = (loopData: DocRefLoopData) => {
    setNewDocTitle(loopData.doc_name);
    setNewRefCode(loopData.ref_code);
    setNewVersionControl(loopData.version || 'v1.0 (Master Loop)');
    setNewIssueDate(toISODate(loopData.issue_date));
    setNewDueDateForRevision(toISODate(loopData.review_date));
    setNewApprovalDate(toISODate(loopData.approval_date));
    setNewPreparedBy(loopData.prepared_by);
    setNewReviewedBy(loopData.reviewed_by);
    setNewApprovedBy(loopData.approved_by);
    setNewDocClassification(loopData.classification);
    setNewModuleName(loopData.module_name || 'General HR Governance');
    setFormCopyPasteNotice(`✓ Synced with Quick Master Setup & Facility Governance Matrix (Ref: ${loopData.ref_code})`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  const handleApplyLoopToEditForm = (loopData: DocRefLoopData) => {
    setEditDocTitle(loopData.doc_name);
    setEditRefCode(loopData.ref_code);
    setEditVersionControl(loopData.version || 'v1.0 (Master Loop)');
    setEditIssueDate(toISODate(loopData.issue_date));
    setEditDueDateForRevision(toISODate(loopData.review_date));
    setEditApprovalDate(toISODate(loopData.approval_date));
    setEditPreparedBy(loopData.prepared_by);
    setEditReviewedBy(loopData.reviewed_by);
    setEditApprovedBy(loopData.approved_by);
    setEditDocClassification(loopData.classification);
    setEditModuleName(loopData.module_name || 'General HR Governance');
    setFormCopyPasteNotice(`✓ Synced with Quick Master Setup & Facility Governance Matrix (Ref: ${loopData.ref_code})`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Email Dispatch Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTargetDoc, setEmailTargetDoc] = useState<HRDocumentRecord | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  const handleOpenEmailModal = (doc: HRDocumentRecord) => {
    setEmailTargetDoc(doc);
    setEmailTo(doc.riskCommitteeContacts?.escalationEmail || 'risk-committee@zamzampharmacy.ae');
    setEmailSubject(`[OFFICIAL RECORD] HR Compliance Document: ${doc.title} (${doc.legalMetadata?.referenceCode || 'REF-HR-0000'})`);
    setEmailBody(`Dear Recipient,

Please find attached the official certified HR compliance record for ${doc.employeeDetails?.fullLegalName || 'Employee'} (${doc.employeeDetails?.jobTitle || 'Staff'}).

Document Reference: ${doc.legalMetadata?.referenceCode || 'REF-HR-0000'}
Category: ${doc.category}
Standard: ${doc.legalMetadata?.legalStandards || 'UAE Compliance'} (${doc.legalMetadata?.lawReference || 'Federal Decree-Law No. 50'})
Next Review Date: ${doc.legalMetadata?.nextReviewDate || '2027-07-28'}

This record is electronically signed and attested under UAE Federal Decree-Law No. 50 and ADHCS compliance standards.

Best regards,
HR & Governance Division`);
    setShowEmailModal(true);
    setEmailSentNotice(null);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailTo.includes('@')) {
      setEmailSentNotice("⚠️ Please enter a valid recipient email address.");
      return;
    }
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      const noticeText = `✓ Document dispatch email queued and transmitted successfully to ${emailTo}! (Dispatch ID: DISP-${Math.floor(Math.random()*90000+10000)})`;
      setEmailSentNotice(noticeText);

      if (onAddEmailLog) {
        onAddEmailLog(emailTo, emailSubject, 'HR_DOCUMENT_DISPATCH', 'SENT', emailBody);
      }

      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSentNotice(null);
      }, 2500);
    }, 1000);
  };

  // Copy & Paste Form Helpers
  const handleCopyContent = (content: string, label: string = 'Content') => {
    if (!content) {
      setFormCopyPasteNotice('⚠️ Nothing to copy. Content field is empty.');
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
      return;
    }
    navigator.clipboard.writeText(content);
    setFormCopyPasteNotice(`✓ Copied ${label} to clipboard!`);
    setTimeout(() => setFormCopyPasteNotice(null), 3000);
  };

  const handlePasteFromClipboard = async (
    setContent: React.Dispatch<React.SetStateAction<string>>,
    append: boolean = false
  ) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setFormCopyPasteNotice('⚠️ Clipboard is empty.');
        setTimeout(() => setFormCopyPasteNotice(null), 3000);
        return;
      }
      if (append) {
        setContent(prev => (prev ? prev + '\n\n' + text : text));
        setFormCopyPasteNotice('✓ Appended clipboard text to document content!');
      } else {
        setContent(text);
        setFormCopyPasteNotice('✓ Replaced document content with clipboard text!');
      }
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
    } catch {
      setFormCopyPasteNotice('⚠️ Clipboard access permission denied or unavailable.');
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
    }
  };

  const handleCopyFormAsJson = (formObj: any) => {
    navigator.clipboard.writeText(JSON.stringify(formObj, null, 2));
    setFormCopyPasteNotice('✓ Copied form details as JSON payload!');
    setTimeout(() => setFormCopyPasteNotice(null), 3000);
  };

  const handlePasteJsonToForm = async (applyData: (json: any) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      applyData(data);
      setFormCopyPasteNotice('✓ Successfully populated form fields from clipboard JSON data!');
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
    } catch {
      setFormCopyPasteNotice('⚠️ Invalid JSON format in clipboard.');
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
    }
  };

  // Request Edit with Freeze Check
  const handleRequestEditDoc = (doc: HRDocumentRecord) => {
    if (doc.isFrozen || (isConsultantMode && doc.isFrozen !== false)) {
      setUnfreezePromptDoc(doc);
      // Pre-select employee if already matching
      const matched = effectiveEmployees.find(e => 
        e.employee_id === doc.employeeDetails?.employeeId ||
        e.employee_name?.toLowerCase() === doc.employeeDetails?.fullLegalName?.toLowerCase()
      );
      setUnfreezeSelectedEmployeeId(matched?.id || '');
      setShowUnfreezeConfirmModal(true);
      return;
    }
    handleOpenEditModal(doc);
  };

  // Confirm Unfreeze & Open Editor (with optional employee binding)
  const handleConfirmUnfreezeAndEdit = (docToUnfreeze?: HRDocumentRecord, selectedEmpId?: string) => {
    const target = docToUnfreeze && docToUnfreeze.id ? docToUnfreeze : unfreezePromptDoc;
    if (!target) return;

    const empIdToUse = selectedEmpId !== undefined ? selectedEmpId : unfreezeSelectedEmployeeId;
    const emp = empIdToUse ? effectiveEmployees.find(e => e.id === empIdToUse) : null;

    const updatedEmpDetails = emp ? {
      ...target.employeeDetails,
      fullLegalName: emp.employee_name,
      employeeId: emp.employee_id,
      jobTitle: emp.position || target.employeeDetails?.jobTitle || '',
      department: emp.department || target.employeeDetails?.department || '',
      joiningDate: (emp as any).joining_date || (emp as any).date_of_joining || target.employeeDetails?.joiningDate || ''
    } : target.employeeDetails;

    const updatedFacilityDetails = emp?.branch_name ? {
      ...target.facilityDetails,
      facilityName: emp.branch_name
    } : target.facilityDetails;

    const updatedEmpSignature = emp ? {
      ...target.employeeSignature,
      signedBy: emp.employee_name,
      signerRole: `${emp.position || 'Staff'} (${emp.department || 'Operations'})`,
      signedAt: new Date().toISOString().split('T')[0],
      isUaePassVerified: true
    } : target.employeeSignature;

    const unfrozenDoc: HRDocumentRecord = {
      ...target,
      employeeDetails: updatedEmpDetails,
      facilityDetails: updatedFacilityDetails,
      employeeSignature: updatedEmpSignature,
      isFrozen: false,
      status: 'DRAFT_PENDING',
      updatedAt: new Date().toISOString()
    };

    setDocuments(prev => prev.map(d => d.id === target.id ? unfrozenDoc : d));
    if (selectedDoc && selectedDoc.id === target.id) {
      setSelectedDoc(unfrozenDoc);
    }
    setShowUnfreezeConfirmModal(false);
    setUnfreezePromptDoc(null);
    setUnfreezeSelectedEmployeeId('');
    setEditRefreezeOnSave(true);
    handleOpenEditModal(unfrozenDoc);
    setFormCopyPasteNotice(`🔓 Master Document "${target.title}" unfrozen${emp ? ` and connected with ${emp.employee_name} (${emp.employee_id})` : ''}.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Quick Connect Employee & Re-freeze directly from Unfreeze Dialog without opening full editor
  const handleQuickConnectAndRefreezeFromModal = (docToProcess: HRDocumentRecord, empId: string) => {
    const emp = effectiveEmployees.find(e => e.id === empId);
    if (!emp) return;

    const empStatus = emp.current_status || emp.status || 'Active';
    const lwd = emp.last_working_date || (emp as any).lastWorkingDate || '';

    const updatedEmpDetails = {
      ...docToProcess.employeeDetails,
      fullLegalName: emp.employee_name,
      employeeId: emp.employee_id,
      jobTitle: emp.position || docToProcess.employeeDetails?.jobTitle || '',
      department: emp.department || docToProcess.employeeDetails?.department || '',
      joiningDate: (emp as any).joining_date || (emp as any).date_of_joining || docToProcess.employeeDetails?.joiningDate || '',
      lastWorkingDate: lwd || docToProcess.employeeDetails?.lastWorkingDate || '',
      employmentStatus: empStatus
    };

    const updatedFacilityDetails = emp?.branch_name ? {
      ...docToProcess.facilityDetails,
      facilityName: emp.branch_name
    } : docToProcess.facilityDetails;

    const updatedEmpSignature = {
      ...docToProcess.employeeSignature,
      signedBy: emp.employee_name,
      signerRole: `${emp.position || 'Staff'} (${emp.department || 'Operations'})`,
      signedAt: new Date().toISOString().split('T')[0],
      isUaePassVerified: true
    };

    const frozenDoc: HRDocumentRecord = {
      ...docToProcess,
      employeeDetails: updatedEmpDetails,
      facilityDetails: updatedFacilityDetails,
      employeeSignature: updatedEmpSignature,
      isFrozen: true,
      status: 'APPROVED_FROZEN',
      updatedAt: new Date().toISOString()
    };

    setDocuments(prev => prev.map(d => d.id === docToProcess.id ? frozenDoc : d));
    if (selectedDoc && selectedDoc.id === docToProcess.id) {
      setSelectedDoc(frozenDoc);
    }
    setShowUnfreezeConfirmModal(false);
    setUnfreezePromptDoc(null);
    setUnfreezeSelectedEmployeeId('');
    setFormCopyPasteNotice(`🔒 Connected "${emp.employee_name} (${emp.employee_id})" to "${docToProcess.title}" & sealed as FROZEN MASTER.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Open Dedicated Connect with Employee & Operator Management Modal
  const handleOpenConnectEmployeeModal = (doc: HRDocumentRecord) => {
    setConnectEmployeeTargetDoc(doc);
    const matched = effectiveEmployees.find(e => 
      e.employee_id === doc.employeeDetails?.employeeId ||
      e.employee_name?.toLowerCase() === doc.employeeDetails?.fullLegalName?.toLowerCase()
    );
    setConnectEmployeeSelectedId(matched?.id || '');
    setConnectEmployeeSearch('');
    setConnectEmployeeRefreezeOnSave(doc.isFrozen !== false);
    setShowConnectEmployeeModal(true);
  };

  // Save Connection from Dedicated Modal
  const handleSaveConnectEmployee = (openInEditor: boolean = false) => {
    if (!connectEmployeeTargetDoc) return;
    const emp = effectiveEmployees.find(e => e.id === connectEmployeeSelectedId);
    
    if (!emp && !openInEditor) {
      setFormCopyPasteNotice('⚠️ Please select an employee from Employee & Operator Management roster.');
      setTimeout(() => setFormCopyPasteNotice(null), 3000);
      return;
    }

    const empStatus = emp?.current_status || emp?.status || connectEmployeeTargetDoc.employeeDetails?.employmentStatus || 'Active';
    const lwd = emp?.last_working_date || (emp as any)?.lastWorkingDate || connectEmployeeTargetDoc.employeeDetails?.lastWorkingDate || '';

    const updatedEmployeeDetails = emp ? {
      ...connectEmployeeTargetDoc.employeeDetails,
      fullLegalName: emp.employee_name,
      employeeId: emp.employee_id,
      jobTitle: emp.position || connectEmployeeTargetDoc.employeeDetails?.jobTitle || '',
      department: emp.department || connectEmployeeTargetDoc.employeeDetails?.department || '',
      joiningDate: (emp as any).joining_date || (emp as any).date_of_joining || connectEmployeeTargetDoc.employeeDetails?.joiningDate || '',
      lastWorkingDate: lwd,
      employmentStatus: empStatus
    } : connectEmployeeTargetDoc.employeeDetails;

    const updatedFacilityDetails = emp?.branch_name ? {
      ...connectEmployeeTargetDoc.facilityDetails,
      facilityName: emp.branch_name
    } : connectEmployeeTargetDoc.facilityDetails;

    const updatedEmployeeSignature = emp ? {
      ...connectEmployeeTargetDoc.employeeSignature,
      signedBy: emp.employee_name,
      signerRole: `${emp.position || 'Staff'} (${emp.department || 'Operations'})`,
      signedAt: new Date().toISOString().split('T')[0],
      isUaePassVerified: true
    } : connectEmployeeTargetDoc.employeeSignature;

    const updatedDoc: HRDocumentRecord = {
      ...connectEmployeeTargetDoc,
      employeeDetails: updatedEmployeeDetails,
      facilityDetails: updatedFacilityDetails,
      employeeSignature: updatedEmployeeSignature,
      isFrozen: openInEditor ? false : connectEmployeeRefreezeOnSave,
      status: (openInEditor ? 'DRAFT_PENDING' : (connectEmployeeRefreezeOnSave ? 'APPROVED_FROZEN' : 'DRAFT_PENDING')) as any,
      updatedAt: new Date().toISOString()
    };

    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    if (selectedDoc && selectedDoc.id === updatedDoc.id) {
      setSelectedDoc(updatedDoc);
    }

    setShowConnectEmployeeModal(false);
    setConnectEmployeeTargetDoc(null);

    if (openInEditor) {
      handleOpenEditModal(updatedDoc);
    } else {
      setFormCopyPasteNotice(`✓ Connected "${emp?.employee_name || 'Staff'}" (${emp?.employee_id || 'ID'}) from Employee & Operator Management to "${updatedDoc.title}".`);
      setTimeout(() => setFormCopyPasteNotice(null), 4000);
    }
  };

  // Quick Toggle Freeze / Unfreeze for single document
  const handleToggleFreezeDoc = (doc: HRDocumentRecord) => {
    if (doc.isFrozen) {
      setUnfreezePromptDoc(doc);
      setShowUnfreezeConfirmModal(true);
    } else {
      const frozenDoc: HRDocumentRecord = {
        ...doc,
        isFrozen: true,
        status: 'APPROVED_FROZEN',
        updatedAt: new Date().toISOString()
      };
      setDocuments(prev => prev.map(d => d.id === doc.id ? frozenDoc : d));
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc(frozenDoc);
      }
      setFormCopyPasteNotice(`🔒 Master Document "${doc.title}" is now FROZEN & locked against modification.`);
      setTimeout(() => setFormCopyPasteNotice(null), 4000);
    }
  };

  // Mass Freeze All Documents
  const handleFreezeAllDocuments = () => {
    setDocuments(prev => prev.map(d => ({
      ...d,
      isFrozen: true,
      status: 'APPROVED_FROZEN',
      updatedAt: new Date().toISOString()
    })));
    setFormCopyPasteNotice(`🔒 All ${documents.length} Master HR Documents in Vault are now FROZEN & Protected!`);
    setTimeout(() => setFormCopyPasteNotice(null), 5000);
  };

  // Mass Unfreeze All Documents
  const handleUnfreezeAllDocuments = () => {
    setDocuments(prev => prev.map(d => ({
      ...d,
      isFrozen: false,
      updatedAt: new Date().toISOString()
    })));
    setShowMassUnfreezeConfirmModal(false);
    setFormCopyPasteNotice(`🔓 All Master HR Documents have been UNROZEN for modification.`);
    setTimeout(() => setFormCopyPasteNotice(null), 5000);
  };

  // Open Edit Document Modal
  const handleOpenEditModal = (doc: HRDocumentRecord) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocCategory(doc.category);
    setEditDocStatus(doc.status);
    setEditRefreezeOnSave(true);
    setEditEmpName(doc.employeeDetails?.fullLegalName || '');
    setEditEmpId(doc.employeeDetails?.employeeId || '');
    setEditEmiratesId(doc.employeeDetails?.emiratesId || '');
    setEditPassportNumber(doc.employeeDetails?.passportNumber || '');
    setEditJobTitle(doc.employeeDetails?.jobTitle || '');
    setEditDept(doc.employeeDetails?.department || '');
    setEditJoiningDate(toISODate(doc.employeeDetails?.joiningDate || '2024-01-01'));

    const matchedEmp = effectiveEmployees.find(e => 
      e.employee_id === doc.employeeDetails?.employeeId ||
      e.employee_name?.toLowerCase() === doc.employeeDetails?.fullLegalName?.toLowerCase()
    );
    const empStatus = doc.employeeDetails?.employmentStatus || matchedEmp?.current_status || matchedEmp?.status || 'Active';
    const lwd = doc.employeeDetails?.lastWorkingDate || matchedEmp?.last_working_date || '';
    setEditEmpStatus(empStatus);
    setEditLastWorkingDate(lwd ? toISODate(lwd) : '');

    setEditFacilityName(doc.facilityDetails?.facilityName || DEFAULT_FACILITY_DETAILS.facilityName);
    setEditFacilityLicenseNo(doc.facilityDetails?.facilityLicenseNo || DEFAULT_FACILITY_DETAILS.facilityLicenseNo);
    setEditDohMohapRegNo(doc.facilityDetails?.dohMohapRegNo || DEFAULT_FACILITY_DETAILS.dohMohapRegNo);
    setEditClinicalWing(doc.facilityDetails?.clinicalWing || DEFAULT_FACILITY_DETAILS.clinicalWing);
    setEditCommitteeChair(doc.riskCommitteeContacts?.committeeChair || DEFAULT_RISK_COMMITTEE_CONTACTS.committeeChair);
    setEditComplianceOfficer(doc.riskCommitteeContacts?.complianceOfficer || DEFAULT_RISK_COMMITTEE_CONTACTS.complianceOfficer);
    setEditDutyOfficerPhone(doc.riskCommitteeContacts?.dutyOfficerPhone || DEFAULT_RISK_COMMITTEE_CONTACTS.dutyOfficerPhone);
    setEditEscalationEmail(doc.riskCommitteeContacts?.escalationEmail || DEFAULT_RISK_COMMITTEE_CONTACTS.escalationEmail);
    setEditHtmlContent(doc.htmlContent);

    // Populate legal metadata loop fields
    setEditRefCode(doc.legalMetadata?.referenceCode || `REF-HR-${Math.floor(Math.random()*9000+1000)}`);
    setEditVersionControl(doc.legalMetadata?.versionControl || doc.currentVersion || 'v1.0 (Master Loop)');
    setEditIssueDate(toISODate(doc.legalMetadata?.issueDate || doc.createdAt));
    setEditDueDateForRevision(toISODate(doc.legalMetadata?.dueDateForRevision || doc.legalMetadata?.nextReviewDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]));
    setEditApprovalDate(toISODate(doc.legalMetadata?.approvalDate || doc.legalMetadata?.effectiveDate || doc.legalMetadata?.issueDate || doc.createdAt));
    setEditPreparedBy(doc.legalMetadata?.preparedBy || 'HR Director');
    setEditReviewedBy(doc.legalMetadata?.reviewedBy || 'Compliance Officer');
    setEditApprovedBy(doc.legalMetadata?.approvedBy || 'Risk Committee Lead');
    setEditDocClassification(doc.legalMetadata?.documentClassification || 'CONFIDENTIAL');
    setEditModuleName(doc.legalMetadata?.moduleName || 'General HR Governance');

    setShowEditModal(true);
  };

  // Save Edited Document Changes
  const handleSaveEditedDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const isDocFrozenAfterSave = editRefreezeOnSave ? true : false;
    const finalIssueDate = toISODate(editIssueDate || editingDoc.legalMetadata?.issueDate || editingDoc.createdAt);
    const finalDueDate = toISODate(editDueDateForRevision || editingDoc.legalMetadata?.dueDateForRevision || editingDoc.legalMetadata?.nextReviewDate || '2027-07-28');
    const finalApprovalDate = toISODate(editApprovalDate || editingDoc.legalMetadata?.approvalDate || editingDoc.legalMetadata?.effectiveDate || finalIssueDate);

    const updated: HRDocumentRecord = {
      ...editingDoc,
      title: editDocTitle,
      category: editDocCategory,
      status: isDocFrozenAfterSave ? 'APPROVED_FROZEN' : editDocStatus,
      isFrozen: isDocFrozenAfterSave,
      currentVersion: editVersionControl || editingDoc.currentVersion,
      updatedAt: new Date().toISOString(),
      legalMetadata: {
        ...DEFAULT_LEGAL_METADATA,
        ...(editingDoc.legalMetadata || {}),
        documentName: editDocTitle,
        referenceCode: editRefCode || editingDoc.legalMetadata?.referenceCode || 'REF-HR-0000',
        issueDate: finalIssueDate,
        nextReviewDate: finalDueDate,
        dueDateForRevision: finalDueDate,
        approvalDate: finalApprovalDate,
        versionControl: editVersionControl || 'v1.0 (Master Loop)',
        preparedBy: editPreparedBy || 'HR Director',
        reviewedBy: editReviewedBy || 'Compliance Officer',
        approvedBy: editApprovedBy || 'Risk Committee Lead',
        documentClassification: editDocClassification || 'CONFIDENTIAL',
        moduleName: editModuleName || 'General HR Governance'
      },
      employeeDetails: {
        ...DEFAULT_EMPLOYEE_DETAILS,
        ...(editingDoc.employeeDetails || {}),
        fullLegalName: editEmpName,
        employeeId: editEmpId,
        emiratesId: editEmiratesId,
        passportNumber: editPassportNumber,
        jobTitle: editJobTitle,
        department: editDept,
        joiningDate: toISODate(editJoiningDate),
        lastWorkingDate: (editEmpStatus === 'Resigned' || editEmpStatus === 'Terminated' || editLastWorkingDate) ? toISODate(editLastWorkingDate) : undefined,
        employmentStatus: editEmpStatus || 'Active'
      },
      facilityDetails: {
        facilityName: editFacilityName,
        facilityLicenseNo: editFacilityLicenseNo,
        dohMohapRegNo: editDohMohapRegNo,
        facilityLocation: editingDoc.facilityDetails?.facilityLocation || DEFAULT_FACILITY_DETAILS.facilityLocation,
        clinicalWing: editClinicalWing,
      },
      riskCommitteeContacts: {
        committeeChair: editCommitteeChair,
        complianceOfficer: editComplianceOfficer,
        dutyOfficerPhone: editDutyOfficerPhone,
        escalationEmail: editEscalationEmail,
      },
      employeeSignature: {
        ...(editingDoc.employeeSignature || {
          signedAt: new Date().toLocaleString(),
          isUaePassVerified: true,
          verificationHash: 'SHA256:' + Math.random().toString(16).substring(2, 10).toUpperCase(),
          ipAddress: '194.170.16.1'
        }),
        signedBy: editEmpName,
        signerRole: 'Employee',
      },
      htmlContent: editHtmlContent,
    };

    const updatedDocList = documents.map(d => d.id === editingDoc.id ? updated : d);
    setDocuments(updatedDocList);
    persistDocumentsToStorage(currentClientKey, isConsultantMode, updatedDocList, client);
    if (selectedDoc && selectedDoc.id === editingDoc.id) {
      setSelectedDoc(updated);
    }
    setShowEditModal(false);
    setEditingDoc(null);
    setFormCopyPasteNotice(`✓ Document "${editDocTitle}" saved successfully ${isDocFrozenAfterSave ? '(🔒 Re-frozen)' : '(🔓 Unfrozen)'}!`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Helper to insert Repeater Loop Block
  const handleInsertLoop = (targetDocId?: string) => {
    const loopHtml = `
<div class="my-3 p-3 border border-indigo-200 bg-indigo-50/40 rounded-lg">
  <div class="font-bold text-indigo-900 text-[10px] uppercase mb-1 flex items-center gap-1">
    <span>🔁 Itemized Schedule Loop (Repeater Block)</span>
  </div>
  <ul class="list-disc pl-5 space-y-1 text-slate-800 text-xs">
    <li><strong>[Loop Item 1]:</strong> Section 1.01 — Initial Onboarding Verification & Compliance Check</li>
    <li><strong>[Loop Item 2]:</strong> Section 1.02 — Annual Medical Fitness & Licensing Registration Check</li>
    <li><strong>[Loop Item 3]:</strong> Section 1.03 — Professional Indemnity Insurance Attestation Renewal</li>
  </ul>
</div>`;

    if (targetDocId && selectedDoc && selectedDoc.id === targetDocId) {
      const updatedDoc = {
        ...selectedDoc,
        htmlContent: (selectedDoc.htmlContent || '') + loopHtml,
        updatedAt: new Date().toISOString()
      };
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === targetDocId ? updatedDoc : d));
    } else if (showEditModal) {
      setEditHtmlContent(prev => (prev || '') + loopHtml);
    } else {
      setNewHtmlContent(prev => (prev || '') + loopHtml);
    }
  };

  // Helper to process uploaded Word sample document
  const handleWordDocUpload = (file: File, targetMode: 'create' | 'edit' | 'inspect' = 'create', targetDocId?: string) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const formattedHtml = lines.map(line => `<p className="mb-2">${line}</p>`).join('');
      const capturedContent = formattedHtml || `<p>${text}</p>`;

      if (targetMode === 'edit') {
        setEditHtmlContent(prev => (prev ? prev + '<hr class="my-3 border-slate-300"/>' : '') + capturedContent);
      } else if (targetMode === 'inspect' && targetDocId && selectedDoc && selectedDoc.id === targetDocId) {
        const updatedDoc = {
          ...selectedDoc,
          htmlContent: (selectedDoc.htmlContent ? selectedDoc.htmlContent + '<hr class="my-3 border-slate-300"/>' : '') + capturedContent,
          updatedAt: new Date().toISOString()
        };
        setSelectedDoc(updatedDoc);
        setDocuments(prev => prev.map(d => d.id === targetDocId ? updatedDoc : d));
      } else {
        setNewHtmlContent(prev => (prev ? prev + '<hr class="my-3 border-slate-300"/>' : '') + capturedContent);
      }
      setWordDocUploadNotice(`✓ Successfully captured and imported "${file.name}" into document content frame!`);
      setTimeout(() => setWordDocUploadNotice(null), 5000);
    };
    reader.readAsText(file);
  };

  // Helper to insert structured HTML Table
  const handleInsertTable = (targetDocId?: string) => {
    const tableHtml = `
<div class="my-3 overflow-x-auto">
  <table class="w-full text-xs border-collapse border border-slate-300">
    <thead>
      <tr class="bg-slate-800 text-white font-bold text-[10px] uppercase">
        <th class="border border-slate-300 p-2 text-left">Clause Ref</th>
        <th class="border border-slate-300 p-2 text-left">Compliance Requirement</th>
        <th class="border border-slate-300 p-2 text-left">Status / Verification</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200 text-slate-800">
      <tr class="bg-white">
        <td class="border border-slate-300 p-2 font-mono font-bold">SEC-01</td>
        <td class="border border-slate-300 p-2">Non-Disclosure & Data Privacy Protocol</td>
        <td class="border border-slate-300 p-2 font-bold text-emerald-700">✓ Verified & Attested</td>
      </tr>
      <tr class="bg-slate-50">
        <td class="border border-slate-300 p-2 font-mono font-bold">SEC-02</td>
        <td class="border border-slate-300 p-2">Information Asset Access Rights Authorization</td>
        <td class="border border-slate-300 p-2 font-bold text-emerald-700">✓ Active Clearance</td>
      </tr>
      <tr class="bg-white">
        <td class="border border-slate-300 p-2 font-mono font-bold">SEC-03</td>
        <td class="border border-slate-300 p-2">UAE Federal Data Protection Compliance (Decree-Law 45)</td>
        <td class="border border-slate-300 p-2 font-bold text-emerald-700">✓ Full Compliance</td>
      </tr>
    </tbody>
  </table>
</div>`;

    if (targetDocId && selectedDoc && selectedDoc.id === targetDocId) {
      const updatedDoc = {
        ...selectedDoc,
        htmlContent: (selectedDoc.htmlContent || '') + tableHtml,
        updatedAt: new Date().toISOString()
      };
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === targetDocId ? updatedDoc : d));
    } else if (showEditModal) {
      setEditHtmlContent(prev => (prev || '') + tableHtml);
    } else {
      setNewHtmlContent(prev => (prev || '') + tableHtml);
    }
  };

  // Helper to insert Excel Box Grid
  const handleInsertExcelBox = (targetDocId?: string) => {
    const excelBoxHtml = `
<div class="my-3 border-2 border-emerald-700 rounded-lg overflow-hidden shadow-xs bg-white">
  <div class="bg-emerald-800 text-white font-mono text-[10px] px-3 py-1 flex items-center justify-between font-bold">
    <span>📊 Excel Grid Box — Employee Compensation & Allowance Schedule.xlsx</span>
    <span class="bg-emerald-950 px-2 py-0.5 rounded text-[9px] text-emerald-300 font-normal">Sheet1: Active</span>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-[10px] font-mono border-collapse">
      <thead>
        <tr class="bg-slate-200 text-slate-700 border-b border-slate-300 font-bold">
          <th class="w-8 border-r border-slate-300 p-1 text-center bg-slate-300">#</th>
          <th class="border-r border-slate-300 p-1.5 text-left">A: Item Code</th>
          <th class="border-r border-slate-300 p-1.5 text-left">B: Description</th>
          <th class="border-r border-slate-300 p-1.5 text-right">C: Allowance (AED)</th>
          <th class="p-1.5 text-center">D: Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 text-slate-800">
        <tr class="hover:bg-emerald-50">
          <td class="border-r border-slate-300 p-1 text-center bg-slate-100 font-bold text-slate-500">1</td>
          <td class="border-r border-slate-300 p-1.5 font-bold">BASIC-PAY</td>
          <td class="border-r border-slate-300 p-1.5">Basic Monthly Legal Salary</td>
          <td class="border-r border-slate-300 p-1.5 text-right font-extrabold text-slate-900">18,500.00</td>
          <td class="p-1.5 text-center text-emerald-700 font-bold">APPROVED</td>
        </tr>
        <tr class="hover:bg-emerald-50">
          <td class="border-r border-slate-300 p-1 text-center bg-slate-100 font-bold text-slate-500">2</td>
          <td class="border-r border-slate-300 p-1.5 font-bold">HOUSING-ALLW</td>
          <td class="border-r border-slate-300 p-1.5">Executive Housing & Accommodation</td>
          <td class="border-r border-slate-300 p-1.5 text-right font-extrabold text-slate-900">7,500.00</td>
          <td class="p-1.5 text-center text-emerald-700 font-bold">APPROVED</td>
        </tr>
        <tr class="hover:bg-emerald-50">
          <td class="border-r border-slate-300 p-1 text-center bg-slate-100 font-bold text-slate-500">3</td>
          <td class="border-r border-slate-300 p-1.5 font-bold">TRANSPORT-ALLW</td>
          <td class="border-r border-slate-300 p-1.5">Transport & Communication</td>
          <td class="border-r border-slate-300 p-1.5 text-right font-extrabold text-slate-900">2,000.00</td>
          <td class="p-1.5 text-center text-emerald-700 font-bold">APPROVED</td>
        </tr>
        <tr class="bg-emerald-100 font-bold text-emerald-950">
          <td class="border-r border-slate-300 p-1 text-center bg-emerald-200 font-bold">4</td>
          <td colSpan="2" class="border-r border-slate-300 p-1.5 text-right font-black uppercase">TOTAL MONTHLY GROSS (AED):</td>
          <td class="border-r border-slate-300 p-1.5 text-right font-black text-emerald-900 text-xs">28,000.00</td>
          <td class="p-1.5 text-center font-black">VALIDATED</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

    if (targetDocId && selectedDoc && selectedDoc.id === targetDocId) {
      const updatedDoc = {
        ...selectedDoc,
        htmlContent: (selectedDoc.htmlContent || '') + excelBoxHtml,
        updatedAt: new Date().toISOString()
      };
      setSelectedDoc(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === targetDocId ? updatedDoc : d));
    } else if (showEditModal) {
      setEditHtmlContent(prev => (prev || '') + excelBoxHtml);
    } else {
      setNewHtmlContent(prev => (prev || '') + excelBoxHtml);
    }
  };

  const companyName = client?.company_name || 'AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W.L.L';
  const tradeLicense = client?.trade_license_no || 'CN-1005168';

  // Helper to Download Files
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleExportPdf = async (docToExport?: HRDocumentRecord) => {
    const targetDoc = docToExport || selectedDoc;
    if (!targetDoc) return;
    setIsExportingPdf(true);
    setFormCopyPasteNotice("⏳ Preparing certified single-page PDF document...");

    try {
      setSelectedDoc(targetDoc);
      setInspectViewMode('a4-preview');
      setShowPreviewModal(true);

      // Wait for DOM element to be fully rendered
      let element: HTMLElement | null = null;
      for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        element = document.getElementById('hr-a4-preview-page');
        if (element) break;
      }

      if (element) {
        const cleanName = (targetDoc.employeeDetails?.fullLegalName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${targetDoc.legalMetadata?.referenceCode || 'REF-HR'}_${cleanName}.pdf`;
        const success = await exportToSinglePagePDF(element, {
          filename: fileName,
          quality: 0.98,
          scale: 2,
        });
        if (success) {
          setFormCopyPasteNotice(`✓ Certified PDF "${fileName}" downloaded successfully!`);
          setTimeout(() => setFormCopyPasteNotice(null), 4000);
          return;
        }
      }

      setFormCopyPasteNotice("🖨️ Opening print PDF dialog...");
      printDocument('#hr-a4-preview-page', { documentTitle: selectedDoc?.title || 'HR Document' });
    } catch (err) {
      console.error('PDF export error:', err);
      printDocument('#hr-a4-preview-page', { documentTitle: selectedDoc?.title || 'HR Document' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPdf = async (docToPrint?: HRDocumentRecord) => {
    const targetDoc = docToPrint || selectedDoc;
    if (!targetDoc) return;

    setSelectedDoc(targetDoc);
    setInspectViewMode('a4-preview');
    setShowPreviewModal(true);

    // Wait for element to render
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (document.getElementById('hr-a4-preview-page')) break;
    }

    setFormCopyPasteNotice("🖨️ Opening print dialog for page preview...");
    printDocument('#hr-a4-preview-page', { documentTitle: targetDoc.title });
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // 1. JSON Exporter Engine Generator
  const getJsonExportPayload = (doc?: HRDocumentRecord) => {
    if (doc) {
      return JSON.stringify({
        "$schema": "https://hr-documents-hub.ae/schemas/hr-doc-v1.json",
        "application": "HR Documents Hub",
        "exportVersion": "1.0",
        "exportedAt": new Date().toISOString(),
        "document": doc
      }, null, 2);
    }

    return JSON.stringify({
      "$schema": "https://hr-documents-hub.ae/schemas/hr-doc-batch-v1.json",
      "application": "HR Documents Hub",
      "exportVersion": "1.0",
      "exportedAt": new Date().toISOString(),
      "vaultSummary": {
        "totalRecords": documents.length,
        "sealedRecords": documents.filter(d => d.isUaePassSealed).length,
        "companyName": companyName,
        "tradeLicenseNo": tradeLicense
      },
      "documents": documents
    }, null, 2);
  };

  // 2. XML Enterprise Standard Generator
  const getXmlExportPayload = (doc?: HRDocumentRecord) => {
    const docsToExport = doc ? [doc] : documents;
    return `<?xml version="1.0" encoding="UTF-8"?>
<HRDocumentsVault xmlns="https://hr-documents-hub.ae/xml/v1" exportedAt="${new Date().toISOString()}">
  <CompanyCredentials>
    <Name>${companyName}</Name>
    <TradeLicense>${tradeLicense}</TradeLicense>
    <Jurisdiction>Abu Dhabi / UAE</Jurisdiction>
  </CompanyCredentials>
  <Documents count="${docsToExport.length}">
${docsToExport.map(d => `    <Document id="${d.id}">
      <Title>${d.title}</Title>
      <Category>${d.category}</Category>
      <Status>${d.status}</Status>
      <ReferenceCode>${d.legalMetadata?.referenceCode || ''}</ReferenceCode>
      <LawReference>${d.legalMetadata?.lawReference || ''}</LawReference>
      <Employee>
        <FullName>${d.employeeDetails?.fullLegalName || ''}</FullName>
        <EmployeeID>${d.employeeDetails?.employeeId || ''}</EmployeeID>
        <EmiratesID>${d.employeeDetails?.emiratesId || ''}</EmiratesID>
        <JobTitle>${d.employeeDetails?.jobTitle || ''}</JobTitle>
        <Department>${d.employeeDetails?.department || ''}</Department>
      </Employee>
      <FacilityDetails>
        <FacilityName>${d.facilityDetails?.facilityName || DEFAULT_FACILITY_DETAILS.facilityName}</FacilityName>
        <FacilityLicenseNo>${d.facilityDetails?.facilityLicenseNo || DEFAULT_FACILITY_DETAILS.facilityLicenseNo}</FacilityLicenseNo>
        <DohMohapRegNo>${d.facilityDetails?.dohMohapRegNo || DEFAULT_FACILITY_DETAILS.dohMohapRegNo}</DohMohapRegNo>
        <FacilityLocation>${d.facilityDetails?.facilityLocation || DEFAULT_FACILITY_DETAILS.facilityLocation}</FacilityLocation>
        <ClinicalWing>${d.facilityDetails?.clinicalWing || DEFAULT_FACILITY_DETAILS.clinicalWing}</ClinicalWing>
      </FacilityDetails>
      <RiskReviewCommittee>
        <CommitteeChair>${d.riskCommitteeContacts?.committeeChair || DEFAULT_RISK_COMMITTEE_CONTACTS.committeeChair}</CommitteeChair>
        <ComplianceOfficer>${d.riskCommitteeContacts?.complianceOfficer || DEFAULT_RISK_COMMITTEE_CONTACTS.complianceOfficer}</ComplianceOfficer>
        <DutyOfficerPhone>${d.riskCommitteeContacts?.dutyOfficerPhone || DEFAULT_RISK_COMMITTEE_CONTACTS.dutyOfficerPhone}</DutyOfficerPhone>
        <EscalationEmail>${d.riskCommitteeContacts?.escalationEmail || DEFAULT_RISK_COMMITTEE_CONTACTS.escalationEmail}</EscalationEmail>
      </RiskReviewCommittee>
      <Signatures>
        <EmployeeSig verified="${d.employeeSignature?.isUaePassVerified ?? true}">${d.employeeSignature?.verificationHash || 'UAE-PASS-VERIFIED-EMP-101'}</EmployeeSig>
        <EmployerSig verified="${d.employerSignature?.isUaePassVerified ?? true}">${d.employerSignature?.verificationHash || 'UAE-PASS-VERIFIED-EMP-102'}</EmployerSig>
      </Signatures>
    </Document>`).join('\n')}
  </Documents>
</HRDocumentsVault>`;
  };

  // 3. CSV Spreadsheet Manifest Generator
  const getCsvExportPayload = () => {
    const headers = ["Document ID", "Title", "Category", "Status", "Reference Code", "Employee Name", "Employee ID", "Emirates ID", "Department", "Job Title", "Facility Name", "Facility License", "Risk Committee Chair", "Compliance Officer", "Issue Date", "UAE PASS Hash"];
    const rows = documents.map(d => [
      `"${d.id}"`,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.status}"`,
      `"${d.legalMetadata?.referenceCode || ''}"`,
      `"${d.employeeDetails?.fullLegalName || ''}"`,
      `"${d.employeeDetails?.employeeId || ''}"`,
      `"${d.employeeDetails?.emiratesId || ''}"`,
      `"${d.employeeDetails?.department || ''}"`,
      `"${d.employeeDetails?.jobTitle || ''}"`,
      `"${(d.facilityDetails?.facilityName || DEFAULT_FACILITY_DETAILS.facilityName).replace(/"/g, '""')}"`,
      `"${d.facilityDetails?.facilityLicenseNo || DEFAULT_FACILITY_DETAILS.facilityLicenseNo}"`,
      `"${(d.riskCommitteeContacts?.committeeChair || DEFAULT_RISK_COMMITTEE_CONTACTS.committeeChair).replace(/"/g, '""')}"`,
      `"${(d.riskCommitteeContacts?.complianceOfficer || DEFAULT_RISK_COMMITTEE_CONTACTS.complianceOfficer).replace(/"/g, '""')}"`,
      `"${d.legalMetadata?.issueDate || ''}"`,
      `"${d.employeeSignature?.verificationHash || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 4. DOCX Formatted HTML Exporter
  const getDocxHtmlPayload = (doc: HRDocumentRecord) => {
    const fac = doc.facilityDetails || DEFAULT_FACILITY_DETAILS;
    const risk = doc.riskCommitteeContacts || DEFAULT_RISK_COMMITTEE_CONTACTS;

    return `\ufeff<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns:v='urn:schemas-microsoft-com:vml' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<title>${doc.title}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page WordSection1 { size: 8.5in 11.0in; margin: 1.0in 1.0in 1.0in 1.0in; }
  div.WordSection1 { page: WordSection1; }
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 0; color: #0f172a; }
  .header { text-align: center; border-bottom: 2pt solid #0284c7; padding-bottom: 12pt; margin-bottom: 18pt; }
  .title { font-size: 18pt; font-weight: bold; color: #0369a1; text-transform: uppercase; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 18pt; font-size: 10pt; }
  .meta-table td, .meta-table th { border: 1pt solid #cbd5e1; padding: 6pt; }
  .meta-table th { background-color: #f1f5f9; font-weight: bold; text-align: left; color: #0f172a; }
  .content { font-size: 11pt; line-height: 1.5; margin-bottom: 24pt; }
  .sig-box { width: 100%; margin-top: 30pt; border-top: 1pt solid #cbd5e1; padding-top: 12pt; font-size: 9pt; }
</style>
</head>
<body>
<div class="WordSection1">
  <div class="header">
    <div class="title">${doc.entityCredentials?.companyName || companyName}</div>
    <div style="font-size: 9pt; color: #64748b; margin-top: 4pt;">Trade License: ${doc.entityCredentials?.tradeLicenseNo || tradeLicense} | ${doc.legalMetadata?.lawReference || ''}</div>
    <h2 style="font-size: 14pt; margin-top: 10pt; color: #0f172a;">${getProcessedHtmlContent(doc.title, doc, companyName, client) || doc.title}</h2>
  </div>

  <table class="meta-table">
    <tr><th>Reference Code</th><td>${doc.legalMetadata?.referenceCode || ''}</td><th>Classification</th><td><strong>${getDocumentClassification(doc)}</strong></td></tr>
    <tr><th>Employee Name</th><td>${doc.employeeDetails?.fullLegalName || ''}</td><th>Employee ID</th><td>${doc.employeeDetails?.employeeId || ''}</td></tr>
    <tr><th>Emirates ID</th><td>${doc.employeeDetails?.emiratesId || ''}</td><th>Department</th><td>${doc.employeeDetails?.department || ''}</td></tr>
    <tr><th>Facility Name</th><td>${fac.facilityName}</td><th>Facility License</th><td>${fac.facilityLicenseNo}</td></tr>
    <tr><th>DOH / MOHAP Reg No</th><td>${fac.dohMohapRegNo}</td><th>Clinical / Operational Wing</th><td>${fac.clinicalWing}</td></tr>
    <tr><th>Risk Committee Chair</th><td>${risk.committeeChair}</td><th>Compliance Officer</th><td>${risk.complianceOfficer}</td></tr>
    <tr><th>Duty Officer Phone</th><td>${risk.dutyOfficerPhone}</td><th>Escalation Email</th><td>${risk.escalationEmail}</td></tr>
  </table>

  <div class="content">
    ${getProcessedHtmlContent(doc.htmlContent, doc, companyName, client)}
  </div>

  <div class="sig-box">
    <p><strong>Digital Attestation Seal:</strong> Verified (${doc.employeeSignature?.signedAt || new Date().toISOString().split('T')[0]})</p>
  </div>
</div>
</body>
</html>`;
  };

  // Helper to trigger Word document download with full MS Word compatibility
  const downloadWordDocument = (doc: HRDocumentRecord, format: 'doc' | 'docx' = 'doc') => {
    const payload = getDocxHtmlPayload(doc);
    const cleanName = (doc.employeeDetails?.fullLegalName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${doc.legalMetadata?.referenceCode || 'REF'}_${cleanName}.${format}`;
    downloadFile(payload, filename, 'application/msword;charset=utf-8');
  };

  // Sample Templates Download
  const downloadSampleTemplate = (format: 'json' | 'xml' | 'csv') => {
    if (format === 'json') {
      const sample = getJsonExportPayload(SEED_HR_DOCUMENTS[0]);
      downloadFile(sample, 'sample_hr_document_import_template.json', 'application/json');
    } else if (format === 'xml') {
      const sample = getXmlExportPayload(SEED_HR_DOCUMENTS[0]);
      downloadFile(sample, 'sample_hr_document_import_template.xml', 'text/xml');
    } else if (format === 'csv') {
      const sample = getCsvExportPayload();
      downloadFile(sample, 'sample_hr_document_import_template.csv', 'text/csv');
    }
  };

  // Handle Multi-Format File Upload / Ingest
  const handleFileUpload = (files: FileList | File[]) => {
    setIngestNotice(null);
    setIngestError(null);
    const newStaged: any[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const ext = file.name.split('.').pop()?.toLowerCase();

      reader.onload = (e) => {
        const text = e.target?.result as string;

        if (ext === 'json') {
          try {
            const parsed = JSON.parse(text);
            const docObj = parsed.document || (Array.isArray(parsed) ? parsed[0] : parsed);
            if (docObj && (docObj.title || docObj.employeeDetails)) {
              newStaged.push({
                fileName: file.name,
                format: 'JSON',
                title: docObj.title || 'Imported HR Record',
                empName: docObj.employeeDetails?.fullLegalName || docObj.employeeName || 'Unknown Employee',
                empId: docObj.employeeDetails?.employeeId || 'EMP-IMPORT',
                refCode: docObj.legalMetadata?.referenceCode || `REF-IMP-${Math.floor(Math.random()*9000+1000)}`,
                rawObj: docObj,
                valid: true
              });
            } else {
              throw new Error('Missing document title or employee fields.');
            }
          } catch (err: any) {
            newStaged.push({ fileName: file.name, format: 'JSON', valid: false, error: err.message });
          }
        } else if (ext === 'xml') {
          newStaged.push({
            fileName: file.name,
            format: 'XML',
            title: `XML Record (${file.name})`,
            empName: 'Extracted from XML Schema',
            empId: 'EMP-XML-99',
            refCode: `REF-XML-${Math.floor(Math.random()*9000+1000)}`,
            valid: true,
            rawText: text
          });
        } else if (ext === 'csv') {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          newStaged.push({
            fileName: file.name,
            format: 'CSV',
            title: `CSV Batch Import (${lines.length - 1} records)`,
            empName: 'Batch Manifest Employees',
            empId: 'EMP-CSV-VAR',
            refCode: `REF-CSV-${Math.floor(Math.random()*9000+1000)}`,
            valid: true,
            rawText: text
          });
        } else {
          // docx, html, txt fallback
          newStaged.push({
            fileName: file.name,
            format: ext?.toUpperCase() || 'TXT',
            title: file.name.replace(/\.[^/.]+$/, ''),
            empName: 'External HR Document Import',
            empId: 'EMP-GENERIC',
            refCode: `REF-EXT-${Math.floor(Math.random()*9000+1000)}`,
            valid: true,
            rawText: text
          });
        }

        setStagedFiles([...stagedFiles, ...newStaged]);
        setIngestNotice(`Parsed ${newStaged.length} file(s) for compliance review before vault commitment.`);
      };

      reader.readAsText(file);
    });
  };

  // Commit Staged Files to Vault
  const handleCommitStagedToVault = () => {
    if (stagedFiles.length === 0) return;

    const newDocs: HRDocumentRecord[] = stagedFiles.filter(s => s.valid).map((stg, idx) => {
      if (stg.rawObj) {
        return {
          ...stg.rawObj,
          id: `doc-imp-${Date.now()}-${idx}`,
          updatedAt: new Date().toISOString()
        };
      }

      return {
        id: `doc-imp-${Date.now()}-${idx}`,
        title: stg.title,
        category: 'GENERAL_HR',
        status: 'APPROVED_FROZEN',
        currentVersion: '1.0',
        isFrozen: true,
        prePrintedLetterheadMode: prePrintedLetterhead,
        includeHrManagerSignatory: includeHrManager,
        isUaePassSealed: true,
        legalMetadata: {
          documentName: stg.title,
          referenceCode: stg.refCode,
          legalStandards: 'ADHCS & MOHRE Ingest Standard',
          lawReference: 'Federal Decree-Law No. 50',
          issueDate: new Date().toISOString().slice(0,10),
          effectiveDate: new Date().toISOString().slice(0,10),
          nextReviewDate: '2027-12-31'
        },
        entityCredentials: {
          companyName,
          tradeLicenseNo: tradeLicense,
          emirateJurisdiction: 'Abu Dhabi',
          registeredAddress: 'ADGM Square, Abu Dhabi, UAE'
        },
        employeeDetails: {
          fullLegalName: stg.empName,
          employeeId: stg.empId,
          emiratesId: '784-1992-9988776-1',
          passportNumber: 'N99887766',
          jobTitle: 'Imported Personnel',
          department: 'Human Resources'
        },
        htmlContent: `<p>Imported document contents from <strong>${stg.fileName}</strong>.</p>`,
        employeeSignature: {
          signedBy: stg.empName,
          signerRole: 'Employee',
          signedAt: new Date().toLocaleString(),
          isUaePassVerified: true,
          verificationHash: `SHA256:${Math.random().toString(16).substring(2,10).toUpperCase()}`,
          ipAddress: '194.170.16.10'
        },
        employerSignature: {
          signedBy: currentUser?.name || 'HR Signatory',
          signerRole: 'Employer Signatory',
          signedAt: new Date().toLocaleString(),
          isUaePassVerified: true,
          verificationHash: `SHA256:${Math.random().toString(16).substring(2,10).toUpperCase()}`,
          ipAddress: '194.170.16.1'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    setDocuments([...newDocs, ...documents]);
    setStagedFiles([]);
    setIngestNotice(`Successfully committed ${newDocs.length} external HR document(s) into the vault!`);
    setActiveTab('vault');
  };

  // Create New Custom Document
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newEmpName.trim()) return;

    const refCodeToUse = newRefCode || `REF-HR-${Math.floor(Math.random() * 9000 + 1000)}`;

    const finalIssueDate = toISODate(newIssueDate);
    const finalDueDate = toISODate(newDueDateForRevision || '2027-07-28');
    const finalApprovalDate = toISODate(newApprovalDate || finalIssueDate);

    const createdDoc: HRDocumentRecord = {
      id: `doc-custom-${Date.now()}`,
      title: newDocTitle,
      category: newDocCategory,
      status: 'APPROVED_FROZEN',
      currentVersion: newVersionControl || 'v1.0 (Master Loop)',
      isFrozen: true,
      prePrintedLetterheadMode: prePrintedLetterhead,
      includeHrManagerSignatory: includeHrManager,
      isUaePassSealed: true,
      legalMetadata: {
        documentName: newDocTitle,
        referenceCode: refCodeToUse,
        legalStandards: 'MOHRE & ADHCS Compliance Standard',
        lawReference: 'Federal Decree-Law No. 50',
        issueDate: finalIssueDate,
        effectiveDate: finalApprovalDate,
        nextReviewDate: finalDueDate,
        dueDateForRevision: finalDueDate,
        approvalDate: finalApprovalDate,
        versionControl: newVersionControl || 'v1.0 (Master Loop)',
        preparedBy: newPreparedBy || 'HR Director',
        reviewedBy: newReviewedBy || 'Compliance Officer',
        approvedBy: newApprovedBy || 'Risk Committee Lead',
        documentClassification: newDocClassification || 'CONFIDENTIAL',
        moduleName: newModuleName || 'General HR Governance'
      },
      entityCredentials: {
        companyName,
        tradeLicenseNo: tradeLicense,
        emirateJurisdiction: 'Abu Dhabi',
        registeredAddress: 'Al Khatem Tower, ADGM Square, Abu Dhabi, UAE'
      },
      employeeDetails: {
        fullLegalName: newEmpName,
        employeeId: newEmpId || `EMP-${Math.floor(Math.random() * 89999 + 10000)}`,
        emiratesId: newEmiratesId || '784-1990-1234567-1',
        passportNumber: 'N12345678',
        jobTitle: newJobTitle || 'Staff Member',
        department: newDept || 'General Operations',
        joiningDate: toISODate(newJoiningDate || '2024-01-01'),
        lastWorkingDate: (newEmpStatus === 'Resigned' || newEmpStatus === 'Terminated' || newLastWorkingDate) ? toISODate(newLastWorkingDate) : undefined,
        employmentStatus: newEmpStatus || 'Active'
      },
      facilityDetails: {
        facilityName: newFacilityName || DEFAULT_FACILITY_DETAILS.facilityName,
        facilityLicenseNo: newFacilityLicenseNo || DEFAULT_FACILITY_DETAILS.facilityLicenseNo,
        dohMohapRegNo: newDohMohapRegNo || DEFAULT_FACILITY_DETAILS.dohMohapRegNo,
        facilityLocation: newFacilityLocation || DEFAULT_FACILITY_DETAILS.facilityLocation,
        clinicalWing: newClinicalWing || DEFAULT_FACILITY_DETAILS.clinicalWing
      },
      riskCommitteeContacts: {
        committeeChair: newCommitteeChair || DEFAULT_RISK_COMMITTEE_CONTACTS.committeeChair,
        complianceOfficer: newComplianceOfficer || DEFAULT_RISK_COMMITTEE_CONTACTS.complianceOfficer,
        dutyOfficerPhone: newDutyOfficerPhone || DEFAULT_RISK_COMMITTEE_CONTACTS.dutyOfficerPhone,
        escalationEmail: newEscalationEmail || DEFAULT_RISK_COMMITTEE_CONTACTS.escalationEmail
      },
      htmlContent: newHtmlContent || `<p>The Employee and Employer agree to all standard regulatory provisions governed by UAE Federal Laws.</p>`,
      employeeSignature: {
        signedBy: newEmpName,
        signerRole: 'Employee',
        signedAt: new Date().toLocaleString(),
        isUaePassVerified: true,
        verificationHash: `SHA256:${Math.random().toString(16).substring(2,12).toUpperCase()}`,
        ipAddress: '194.170.16.1'
      },
      employerSignature: {
        signedBy: currentUser?.name || 'Authorized Employer Signatory',
        signerRole: 'Employer Signatory',
        signedAt: new Date().toLocaleString(),
        isUaePassVerified: true,
        verificationHash: `SHA256:${Math.random().toString(16).substring(2,12).toUpperCase()}`,
        ipAddress: '194.170.16.1'
      },
      hrManagerSignature: includeHrManager ? {
        signedBy: 'Fatima Al-Suwaidi',
        signerRole: 'HR Manager',
        signedAt: new Date().toLocaleString(),
        isUaePassVerified: true,
        verificationHash: `SHA256:${Math.random().toString(16).substring(2,12).toUpperCase()}`,
        ipAddress: '194.170.16.1'
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newDocsList = [createdDoc, ...documents];
    setDocuments(newDocsList);
    persistDocumentsToStorage(currentClientKey, isConsultantMode, newDocsList, client);
    setNewDocTitle('');
    setNewEmpName('');
    setNewEmpId('');
    setNewEmiratesId('');
    setNewJobTitle('');
    setNewDept('');
    setNewHtmlContent('');
    setActiveTab('vault');
  };

  // Delete Document
  const handleDeleteDocument = (id: string, title?: string) => {
    if (isConsultantMode && !isProtectedUnlocked) {
      setSecurityPinError(null);
      setSecurityPinInput('');
      setPendingActionOnUnlock(() => () => {
        const doc = documents.find(d => d.id === id);
        if (doc) setDeletingDoc(doc);
      });
      setShowSecurityUnlockModal(true);
      return;
    }
    const docToDelete = documents.find(d => d.id === id);
    if (docToDelete) {
      setDeletingDoc(docToDelete);
    }
  };

  const confirmDeleteDocument = () => {
    if (isConsultantMode && !isProtectedUnlocked) {
      setDeletingDoc(null);
      setShowSecurityUnlockModal(true);
      return;
    }
    if (!deletingDoc) return;
    const targetId = deletingDoc.id;
    const targetTitle = deletingDoc.title;
    const updatedList = documents.filter(d => d.id !== targetId);
    setDocuments(updatedList);
    persistDocumentsToStorage(currentClientKey, isConsultantMode, updatedList, client);
    setSelectedDocIds(prev => prev.filter(id => id !== targetId));
    if (selectedDoc?.id === targetId) {
      setSelectedDoc(null);
      setShowPreviewModal(false);
    }
    setDeletingDoc(null);
    setFormCopyPasteNotice(`✓ Record "${targetTitle}" deleted from HR Vault.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Bulk Delete Selected HR Documents
  const handleBulkDelete = () => {
    if (isConsultantMode && !isProtectedUnlocked) {
      setShowBulkDeleteModal(false);
      setSecurityPinError(null);
      setSecurityPinInput('');
      setPendingActionOnUnlock(() => () => {
        if (selectedDocIds.length > 0) setShowBulkDeleteModal(true);
      });
      setShowSecurityUnlockModal(true);
      return;
    }
    if (selectedDocIds.length === 0) return;
    const count = selectedDocIds.length;
    const updatedList = documents.filter(d => !selectedDocIds.includes(d.id));
    setDocuments(updatedList);
    persistDocumentsToStorage(currentClientKey, isConsultantMode, updatedList, client);
    if (selectedDoc && selectedDocIds.includes(selectedDoc.id)) {
      setSelectedDoc(null);
      setShowPreviewModal(false);
    }
    setSelectedDocIds([]);
    setShowBulkDeleteModal(false);
    setFormCopyPasteNotice(`✓ Permanently deleted ${count} selected document(s) from HR Vault.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Clear / Purge All Documents from Current Vault
  const handleClearVault = () => {
    if (isConsultantMode && !isProtectedUnlocked) {
      setShowClearVaultModal(false);
      setSecurityPinError(null);
      setSecurityPinInput('');
      setPendingActionOnUnlock(() => () => {
        setShowClearVaultModal(true);
      });
      setShowSecurityUnlockModal(true);
      return;
    }
    setDocuments([]);
    setSelectedDocIds([]);
    setSelectedDoc(null);
    setShowPreviewModal(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${currentClientKey}`);
      if (currentClientKey === 'c1') {
        localStorage.removeItem(`${STORAGE_KEY}_c1`);
      }
      if (isConsultantMode) {
        localStorage.setItem('smarthub_hr_documents_vault_v2_c0', JSON.stringify([]));
        localStorage.setItem('smarthub_hr_documents_vault_v2_SPRC', JSON.stringify([]));
      }
    } catch (e) {}
    setShowClearVaultModal(false);
    setFormCopyPasteNotice(`✓ All documents removed from this vault.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Duplicate / Clone Selected Documents
  const handleDuplicateSelectedDocs = () => {
    if (selectedDocIds.length === 0) return;
    const docsToDuplicate = documents.filter(d => selectedDocIds.includes(d.id));
    const clones: HRDocumentRecord[] = docsToDuplicate.map((doc, idx) => ({
      ...doc,
      id: `doc-clone-${Date.now()}-${idx}`,
      title: `${doc.title} (Copy)`,
      legalMetadata: {
        ...doc.legalMetadata,
        referenceCode: `${doc.legalMetadata?.referenceCode || 'REF-HR'}-COPY`
      },
      updatedAt: new Date().toISOString()
    }));
    setDocuments(prev => [...clones, ...prev]);
    setFormCopyPasteNotice(`✓ Duplicated ${clones.length} document(s) in HR Vault.`);
    setSelectedDocIds([]);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
  };

  // Filtered Consultant Master Documents for Copy Modal
  const filteredConsultantDocs = React.useMemo(() => {
    if (!consultantSearch) return consultantMasterDocs;
    const term = consultantSearch.toLowerCase();
    return consultantMasterDocs.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.category.toLowerCase().includes(term) ||
      (d.legalMetadata?.referenceCode || '').toLowerCase().includes(term)
    );
  }, [consultantMasterDocs, consultantSearch]);

  // Copy Files from COMPLIANCE CONSULTANT to Client(s) Vault
  const handleExecuteCopyFromConsultant = (overrideDocIds?: string[], targetDestOverride?: string) => {
    if (!isSuperAdmin) {
      setFormCopyPasteNotice("⛔ Permission Restricted: Only SuperAdmin accounts are authorized to copy Master HR Vault Documents to client organizations.");
      setTimeout(() => setFormCopyPasteNotice(null), 5000);
      return;
    }
    const targetIds = overrideDocIds || selectedConsultantDocIds;
    if (targetIds.length === 0) return;

    const dest = targetDestOverride || targetCopyDestination;
    const sourceDocsToCopy = consultantMasterDocs.filter(d => targetIds.includes(d.id));

    let targetsToProcess: Client[] = [];
    if (dest === 'ALL_CLIENTS') {
      targetsToProcess = availableClientsList;
    } else if (dest === 'ACTIVE_CLIENT') {
      targetsToProcess = client ? [client] : [availableClientsList[0]];
    } else {
      const found = availableClientsList.find(c => c.id === dest);
      targetsToProcess = found ? [found] : (client ? [client] : [availableClientsList[0]]);
    }

    let totalCopiesCreated = 0;
    const currentActiveClientCopies: HRDocumentRecord[] = [];

    targetsToProcess.forEach(targetClient => {
      const targetClientName = targetClient.company_name;
      const targetClientId = targetClient.id;
      const tradeLic = targetClient.trade_license_no || (targetClient as any).trade_license || 'TL-AD-10192';
      const cityAddress = targetClient.address || targetClient.city || 'Abu Dhabi, United Arab Emirates';
      const dohLic = targetClient.doh_license_no || (targetClient as any).doh_moh_license || '';
      const authRep = targetClient.auth_representative?.name || targetClient.owner_name || 'Authorized Representative';
      const clinicMgr = (targetClient as any).clinic_manager?.name || 'Operations Lead';
      const medDir = (targetClient as any).medical_director?.name || 'Medical Director';
      const itMgr = (targetClient as any).it_manager?.name || (targetClient as any).it_lead || 'IT & Security Officer';
      const hrMgr = (targetClient as any).hr_manager?.name || targetClient.auth_representative?.name || 'HR Manager';

      const newCopies: HRDocumentRecord[] = sourceDocsToCopy.map((doc, idx) => {
        const timestamp = Date.now();
        const newId = `doc-${targetClientId}-master-copy-${timestamp}-${idx}-${Math.floor(Math.random() * 1000)}`;

        // Deep content placeholder replacement for Target Client
        let customizedHtml = doc.htmlContent || '';
        customizedHtml = customizedHtml
          .replace(/AL NAHDA NATIONAL INSURANCE BROKERS COMPANY W\.L\.L/gi, targetClientName)
          .replace(/SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, targetClientName)
          .replace(/\(Company Name\)/gi, targetClientName)
          .replace(/\[Company Name\]/gi, targetClientName)
          .replace(/\(Authorized Representative\)/gi, authRep)
          .replace(/\(Clinic Manager\)/gi, clinicMgr)
          .replace(/\(Medical Director\)/gi, medDir);

        return {
          ...doc,
          id: newId,
          client_id: targetClientId,
          status: 'APPROVED_FROZEN' as const,
          isFrozen: true,
          entityCredentials: {
            ...doc.entityCredentials,
            companyName: targetClientName,
            tradeLicenseNo: tradeLic,
            registeredAddress: cityAddress,
            emirateJurisdiction: targetClient.city || 'Abu Dhabi'
          },
          facilityDetails: {
            ...doc.facilityDetails,
            facilityName: targetClientName,
            facilityLicenseNo: tradeLic,
            dohMohapRegNo: dohLic,
            facilityLocation: cityAddress
          },
          riskCommitteeContacts: {
            ...doc.riskCommitteeContacts,
            committeeChair: authRep,
            complianceOfficer: itMgr,
            dutyOfficerPhone: targetClient.auth_representative?.phone || '+971 2 600 8899',
            escalationEmail: targetClient.auth_representative?.email || targetClient.owner_email || 'compliance@facility.ae'
          },
          employerSignature: {
            ...doc.employerSignature,
            signedBy: authRep,
            signerRole: 'Authorized Employer Signatory',
            signedAt: new Date().toISOString().split('T')[0],
            isUaePassVerified: true
          },
          hrManagerSignature: doc.hrManagerSignature ? {
            ...doc.hrManagerSignature,
            signedBy: hrMgr,
            signedAt: new Date().toISOString().split('T')[0],
            isUaePassVerified: true
          } : undefined,
          htmlContent: customizedHtml,
          updatedAt: new Date().toISOString()
        };
      });

      totalCopiesCreated += newCopies.length;

      // Store in target client's localStorage bucket
      try {
        const key = `${STORAGE_KEY}_${targetClientId}`;
        const existingRaw = localStorage.getItem(key);
        let existingArr: HRDocumentRecord[] = [];
        if (existingRaw) {
          try {
            existingArr = JSON.parse(existingRaw);
          } catch (e) {}
        }
        
        // Merge or overwrite matching title copies
        const existingFiltered = existingArr.filter(e => !newCopies.some(n => n.title === e.title));
        const combined = [...newCopies, ...existingFiltered];
        localStorage.setItem(key, JSON.stringify(combined));
        if (targetClientId === 'c1' || targetClientName.toLowerCase().includes('al nahda')) {
          localStorage.setItem(`${STORAGE_KEY}_c1`, JSON.stringify(combined));
        }
      } catch (err) {
        console.warn(`Failed to store copies for client ${targetClientId}`, err);
      }

      if (targetClientId === currentClientKey) {
        currentActiveClientCopies.push(...newCopies);
      }
    });

    if (currentActiveClientCopies.length > 0) {
      setDocuments(prev => {
        const filtered = prev.filter(p => !currentActiveClientCopies.some(c => c.title === p.title));
        return [...currentActiveClientCopies, ...filtered];
      });
    }

    setShowCopyFromConsultantModal(false);
    setSelectedConsultantDocIds([]);

    const destLabel = dest === 'ALL_CLIENTS'
      ? `ALL ${targetsToProcess.length} Clients HR Documents Vault Registry`
      : `Client Vault "${targetsToProcess[0]?.company_name || 'Active Client'}"`;

    setFormCopyPasteNotice(`✓ Successfully copied ${targetIds.length} Master Document(s) from COMPLIANCE CONSULTANT to ${destLabel}! (${totalCopiesCreated} client records synchronized)`);
    setTimeout(() => setFormCopyPasteNotice(null), 6000);
  };

  // Filtered Vault Items
  const filteredDocs = documents.filter(doc => {
    const search = searchQuery.toLowerCase();
    const matchSearch = doc.title.toLowerCase().includes(search) ||
      (doc.employeeDetails?.fullLegalName || '').toLowerCase().includes(search) ||
      (doc.employeeDetails?.employeeId || '').toLowerCase().includes(search) ||
      (doc.legalMetadata?.referenceCode || '').toLowerCase().includes(search);

    const matchCat = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchFacility = facilityFilter === 'ALL' ||
      (doc.facilityDetails?.facilityName || '').toLowerCase().includes(facilityFilter.toLowerCase()) ||
      (doc.entityCredentials?.companyName || '').toLowerCase().includes(facilityFilter.toLowerCase()) ||
      facilityFilter.toLowerCase().includes((doc.facilityDetails?.facilityName || '---').toLowerCase()) ||
      facilityFilter.toLowerCase().includes((doc.entityCredentials?.companyName || '---').toLowerCase()) ||
      (doc.client_id && currentClientKey && doc.client_id === currentClientKey);

    return matchSearch && matchCat && matchStatus && matchFacility;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 font-sans">

      {/* TOP HEADER - REGULATORY CERTIFICATION & SIGNATORY CONTROLS */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0a121e] to-[#041a16] p-6 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> ADHCS Compliant
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Vault Size: {documents.length} Records
              </span>

              {/* MASTER SECURITY PROTECTED BUTTON */}
              <button
                type="button"
                onClick={handleToggleProtectedLock}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border ${
                  isProtectedUnlocked
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                }`}
                title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Repository - Click to unlock with Security PIN"}
              >
                {isProtectedUnlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unlocked (Protected Mode)</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Protected</span>
                  </>
                )}
              </button>

              {isConsultantMode ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> Compliance Consultant Master Mode (Frozen Baseline)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" /> Client: {client?.company_name || 'Active Entity'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
              HR Documents Hub & Vault
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Enterprise HR Document Repository under <span className="font-bold text-white">Document Repository & Version Control</span>. All master baseline documents are securely frozen by default. Any modification requires authorized unfreezing.
            </p>
          </div>

          {/* Dual-Mode Signatory & Letterhead Toggles & Freeze Controls */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shrink-0 shadow-lg max-w-md w-full lg:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Regulatory Signatory & Layout Controls
            </span>

            <div className="flex flex-col sm:flex-row gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={prePrintedLetterhead}
                  onChange={e => setPrePrintedLetterhead(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                Pre-printed Stationery Mode
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={includeHrManager}
                  onChange={e => setIncludeHrManager(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                HR Manager Signatory Toggle
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
              {isConsultantMode ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleFreezeAllDocuments}
                      className="py-1.5 px-3 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-700/60"
                      title="Lock and freeze all documents against unauthorized modification"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" /> Freeze All Master Docs
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMassUnfreezeConfirmModal(true)}
                      className="py-1.5 px-3 bg-amber-950 hover:bg-amber-900 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-700/60"
                      title="Unfreeze all documents for bulk template revisions"
                    >
                      <Unlock className="w-3.5 h-3.5 text-amber-400" /> Unfreeze All
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetCopyDestination('ALL_CLIENTS');
                      setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
                      setShowCopyFromConsultantModal(true);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-cyan-400/40"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Distribute Master Data to ALL Clients ({availableClientsList.length})</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleExecuteCopyFromConsultant(consultantMasterDocs.map(d => d.id), 'ACTIVE_CLIENT')}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-emerald-400/40"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>⚡ 1-Click Copy Master Data from COMPLIANCE CONSULTANT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetCopyDestination('ACTIVE_CLIENT');
                      setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
                      setShowCopyFromConsultantModal(true);
                    }}
                    className="w-full py-1.5 px-3 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-cyan-500/40"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select Specific Master Documents to Copy</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MASTER DATA COPY & GOVERNANCE PROMPT BANNER FOR CLIENTS */}
      {!isConsultantMode && (
        <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-emerald-950/60 p-4 rounded-2xl border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">Master HR Documents Hub & Vault Sync</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SOURCE: COMPLIANCE CONSULTANT (SmartPro)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Copy master certified templates into <strong className="text-white">{client?.company_name || 'Active Client'}</strong>. Entity credentials, trade license, and facility signatory contacts are auto-bound and locked with baseline freeze.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleExecuteCopyFromConsultant(consultantMasterDocs.map(d => d.id), 'ACTIVE_CLIENT')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Master Data
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetCopyDestination('ACTIVE_CLIENT');
                setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
                setShowCopyFromConsultantModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" /> Browse Master ({consultantMasterDocs.length})
            </button>
          </div>
        </div>
      )}

      {/* TOP ACTION BAR - NAVIGATION TABS & SCRIPT EXPORTER BTN */}
      <div className="bg-slate-900/90 p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Vault Repository ({filteredDocs.length})
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" /> Upload & Ingest Files
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" /> Export Packages
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Create Custom Document
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PROTECTED / UNLOCKED SECURITY BUTTON */}
          <button
            type="button"
            onClick={handleToggleProtectedLock}
            className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg border ${
              isProtectedUnlocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-950/40'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-amber-950/30'
            }`}
            title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Repository - Click to unlock with Security PIN"}
          >
            {isProtectedUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-300" /> Unlocked (Protected Mode)
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-amber-400" /> Protected
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualSaveVault}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
            title="Explicitly save and persist all documents in HR Vault Registry"
          >
            <Save className="w-4 h-4" /> Save Vault Registry ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetCopyDestination('ACTIVE_CLIENT');
              setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
              setShowCopyFromConsultantModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 border border-cyan-400/30"
          >
            <Copy className="w-4 h-4" /> Copy Files from Compliance Consultant
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetCopyDestination('ALL_CLIENTS');
              setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
              setShowCopyFromConsultantModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 border border-cyan-400/30"
          >
            <Layers className="w-4 h-4" /> Copy to ALL Clients Registry
          </button>

          <button
            onClick={() => setShowTotalScriptModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <Code className="w-4 h-4" /> Attach Total JSON Script (.json)
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNERS */}
      {ingestNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{ingestNotice}</span>
          </div>
          <button onClick={() => setIngestNotice(null)} className="text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: VAULT REPOSITORY LIST */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by title, employee name, ID, or reference code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={facilityFilter}
                onChange={e => setFacilityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-sm"
              >
                <option value="ALL">🏢 All Facilities & Branches</option>
                {facilityOptions.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="CONTRACT">Employment Contract</option>
                <option value="POLICY_ACK">Policy Acknowledgement</option>
                <option value="PERFORMANCE">Performance Review</option>
                <option value="SEPARATION">Separation / Clearance</option>
                <option value="GENERAL_HR">General HR</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED_FROZEN">Approved & Frozen</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* BULK SELECTION ACTION BAR */}
          {selectedDocIds.length > 0 && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-center gap-2 text-emerald-200 font-bold">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>{selectedDocIds.length} Document(s) Selected</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedDocIds.length})
                </button>

                <button
                  type="button"
                  onClick={handleDuplicateSelectedDocs}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate Selected ({selectedDocIds.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocIds([])}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* VAULT TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  HR Documents Vault Registry ({filteredDocs.length} Active Records)
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Saved: {lastSavedTimestamp}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* PROTECTED BUTTON IN TABLE HEADER */}
                <button
                  type="button"
                  onClick={handleToggleProtectedLock}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all border ${
                    isProtectedUnlocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  }`}
                  title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Repository - Click to unlock with Security PIN"}
                >
                  {isProtectedUnlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-300" /> Unlocked (Protected Mode)
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Protected
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleManualSaveVault}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all border border-emerald-400/30"
                  title="Force save all current document records to persistent storage"
                >
                  <Save className="w-3.5 h-3.5" /> Save Vault Registry
                </button>
                {documents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearVaultModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Remove all documents from this client vault"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear Vault
                  </button>
                )}
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Click <span className="text-emerald-400 font-bold">Inspect</span> to view or export full document details.
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredDocs.length > 0 && filteredDocs.every(d => selectedDocIds.includes(d.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocIds(filteredDocs.map(d => d.id));
                          } else {
                            setSelectedDocIds([]);
                          }
                        }}
                        className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        title="Select or deselect all filtered documents"
                      />
                    </th>
                    <th className="p-4">Reference & Title</th>
                    <th className="p-4">Employee Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-3 py-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                            <FileText className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Vault is Clean & Empty</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Auto-loading of unwanted documents has been stopped. You can create your own documents, ingest files, or copy master certified documents from <strong>COMPLIANCE CONSULTANT</strong>.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleExecuteCopyFromConsultant(consultantMasterDocs.map(d => d.id), 'ACTIVE_CLIENT')}
                              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Copy className="w-4 h-4" /> 1-Click Copy Master Documents ({consultantMasterDocs.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetCopyDestination('ACTIVE_CLIENT');
                                setSelectedConsultantDocIds(consultantMasterDocs.map(d => d.id));
                                setShowCopyFromConsultantModal(true);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5" /> Select Specific Master Docs
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('create')}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Create Custom Doc
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No HR documents matched your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => (
                      <tr key={doc.id} className={`transition-colors ${selectedDocIds.includes(doc.id) ? 'bg-emerald-950/25 hover:bg-emerald-950/35' : 'hover:bg-slate-800/40'}`}>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocIds(prev => [...prev, doc.id]);
                              } else {
                                setSelectedDocIds(prev => prev.filter(id => id !== doc.id));
                              }
                            }}
                            className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          {(() => {
                            const matchedEmp = effectiveEmployees.find(e => 
                              e.employee_id === doc.employeeDetails?.employeeId ||
                              e.employee_name?.toLowerCase() === doc.employeeDetails?.fullLegalName?.toLowerCase()
                            );
                            const effectiveStatus = doc.employeeDetails?.employmentStatus || matchedEmp?.current_status || matchedEmp?.status || 'Active';
                            const effectiveLwd = doc.employeeDetails?.lastWorkingDate || matchedEmp?.last_working_date || '';
                            const isInactive = effectiveStatus === 'Resigned' || effectiveStatus === 'Terminated';

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                                    {doc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                                  </span>
                                  {isInactive && (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded shadow-xs animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                                      {effectiveStatus.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="font-black text-slate-100 text-sm block">{doc.title}</span>
                                {isInactive && (
                                  <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-rose-300 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded-md mt-0.5">
                                    <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Last Working Date *: <strong className="font-mono text-white">{effectiveLwd ? formatDateDisplay(effectiveLwd) : 'Required in Form'}</strong></span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-4">
                          {(() => {
                            const matchedEmp = effectiveEmployees.find(e => 
                              e.employee_id === doc.employeeDetails?.employeeId ||
                              e.employee_name?.toLowerCase() === doc.employeeDetails?.fullLegalName?.toLowerCase()
                            );
                            const effectiveStatus = doc.employeeDetails?.employmentStatus || matchedEmp?.current_status || matchedEmp?.status || 'Active';
                            const effectiveLwd = doc.employeeDetails?.lastWorkingDate || matchedEmp?.last_working_date || '';
                            const isInactive = effectiveStatus === 'Resigned' || effectiveStatus === 'Terminated';

                            return (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-200 block">{doc.employeeDetails?.fullLegalName || 'Employee'}</span>
                                  {isInactive ? (
                                    <span className="text-[9.5px] font-black text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40 uppercase">
                                      {effectiveStatus}
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                                      {effectiveStatus}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  ID: {doc.employeeDetails?.employeeId || 'N/A'} &bull; {doc.employeeDetails?.department || 'General'}
                                </span>
                                {isInactive && (
                                  <span className="text-[10px] font-bold text-rose-400 block mt-0.5 font-mono">
                                    Last Working Date *: {effectiveLwd ? formatDateDisplay(effectiveLwd) : 'Not Specified'}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConnectEmployeeModal(doc)}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-bold mt-1 transition-colors cursor-pointer"
                                  title="Connect or change staff record from Employee & Operator Management"
                                >
                                  <UserCheck className="w-3 h-3" /> Connect Staff Record
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 text-cyan-300 border border-slate-700">
                            {doc.category}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {doc.isFrozen !== false ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-emerald-400" /> FROZEN (MASTER)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-amber-400" /> UNFROZEN (EDITABLE)
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenConnectEmployeeModal(doc)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all shadow-xs"
                              title="Connect with Employee & Operator Management (Select staff member from roster)"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Connect Staff
                            </button>

                            {doc.isFrozen !== false ? (
                              <button
                                type="button"
                                onClick={() => handleRequestEditDoc(doc)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                                title="This document is frozen. Click to unfreeze and edit."
                              >
                                <Unlock className="w-3.5 h-3.5 text-amber-400" /> Unfreeze to Edit
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(doc)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1 transition-all shadow-sm"
                                title="Edit Document Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit Record
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleFreezeDoc(doc)}
                              className={`p-1.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                                doc.isFrozen !== false
                                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                                  : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-700'
                              }`}
                              title={doc.isFrozen !== false ? 'Unfreeze Document' : 'Freeze & Lock Document'}
                            >
                              {doc.isFrozen !== false ? (
                                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setInspectViewMode('a4-preview');
                                setShowPreviewModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950/30"
                              title="Inspect & Format Page Preview"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect Page
                            </button>

                            <button
                              onClick={() => handlePrintPdf(doc)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer transition-all"
                              title="Print / Page Preview Document"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleExportPdf(doc)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer transition-all"
                              title="Download Certified PDF (.pdf)"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEmailModal(doc);
                              }}
                              className="p-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 cursor-pointer"
                              title="Email Document Dispatch"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            {/* DELETE BUTTON */}
                            {(!isConsultantMode || isProtectedUnlocked) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id, doc.title);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all shadow-xs"
                                title="Delete Record from Vault"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}

                            {/* ROW PROTECTED BUTTON */}
                            {isConsultantMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleProtectedLock();
                                }}
                                className={`px-2.5 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition-all inline-flex items-center gap-1 border shadow-xs ${
                                  isProtectedUnlocked
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                }`}
                                title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Document - Click to unlock with Security PIN"}
                              >
                                {isProtectedUnlocked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Unlocked
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3.5 h-3.5 text-amber-400" /> Protected
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD & INGEST FILES FROM EXTERNAL APPLICATIONS */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-400" /> Multi-Format Application File Ingestion
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Drag-and-drop or upload JSON (.json), XML (.xml), CSV (.csv), Microsoft Word (.docx), HTML, or TXT documents exported from external HR systems.
                </p>
              </div>

              {/* Integration Format Templates */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold">Sample Templates:</span>
                <button
                  onClick={() => downloadSampleTemplate('json')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  .JSON Template
                </button>
                <button
                  onClick={() => downloadSampleTemplate('xml')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  .XML Template
                </button>
                <button
                  onClick={() => downloadSampleTemplate('csv')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px] font-bold cursor-pointer"
                >
                  .CSV Template
                </button>
              </div>
            </div>

            {/* DROP ZONE */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
              }}
              className={`p-10 border-2 border-dashed rounded-2xl text-center space-y-3 transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 w-16 h-16 mx-auto flex items-center justify-center border border-emerald-500/30">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">Drag & Drop HR Files Here or Browse Computer</p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .json, .xml, .csv, .docx, .html, .txt
                </p>
              </div>

              <label className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-950/40">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept=".json,.xml,.csv,.docx,.html,.txt"
                  className="hidden"
                  onChange={e => e.target.files && handleFileUpload(e.target.files)}
                />
              </label>
            </div>

            {/* STAGED PREVIEW BEFORE COMMIT */}
            {stagedFiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white">
                    Live Parsed Staging Preview ({stagedFiles.length} Records)
                  </h3>
                  <button
                    onClick={handleCommitStagedToVault}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Commit All to Vault
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stagedFiles.map((stg, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate max-w-[200px]">{stg.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {stg.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Employee: {stg.empName} ({stg.empId})</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Ref: {stg.refCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EXPORT PACKAGES FOR UPLOADING TO ANOTHER APPLICATION */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PACKAGE 1: JSON DATA PACKAGE */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">JSON Data Package (.json)</h3>
                  <p className="text-[11px] text-slate-400">REST API ingest or software migration package</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                JSON API
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Export complete batch package containing all vault document structures, legal metadata, and UAE PASS seal hashes formatted for direct REST API integration or database migration.
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[11px] max-h-40 overflow-x-auto border border-slate-800 custom-scrollbar">
              {getJsonExportPayload()}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(getJsonExportPayload(), setCopiedJson)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? 'Copied JSON!' : 'Copy JSON'}
              </button>

              <button
                onClick={() => downloadFile(getJsonExportPayload(), 'hr_documents_vault_export.json', 'application/json')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download (.json)
              </button>
            </div>
          </div>

          {/* PACKAGE 2: XML ENTERPRISE STANDARD */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">XML Enterprise Standard (.xml)</h3>
                  <p className="text-[11px] text-slate-400">HRIS & enterprise document repository schema</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                XML Schema
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Formatted XML schema compliant with enterprise HRIS document repository ingestion and archiving systems.
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-[11px] max-h-40 overflow-x-auto border border-slate-800 custom-scrollbar">
              {getXmlExportPayload()}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(getXmlExportPayload(), setCopiedXml)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedXml ? 'Copied XML!' : 'Copy XML'}
              </button>

              <button
                onClick={() => downloadFile(getXmlExportPayload(), 'hr_documents_vault_export.xml', 'text/xml')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download (.xml)
              </button>
            </div>
          </div>

          {/* PACKAGE 3: CSV SPREADSHEET MANIFEST */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">CSV Spreadsheet Manifest (.csv)</h3>
                  <p className="text-[11px] text-slate-400">Tabular metadata, Emirates IDs & signature hashes</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Excel / CSV
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tabular spreadsheet manifest containing complete employee details, reference codes, Emirates IDs, and digital signature hashes for spreadsheet uploading.
            </p>

            <button
              onClick={() => downloadFile(getCsvExportPayload(), 'hr_documents_manifest.csv', 'text/csv')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download CSV Manifest (.csv)
            </button>
          </div>

          {/* PACKAGE 4: CERTIFIED A4 PDF & PRINT RECORDS */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Certified A4 PDF & Print Records</h3>
                  <p className="text-[11px] text-slate-400">Official A4 PDF generation & printable reports</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A4 PDF & PRINT
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select any document in the vault list to export official certified single-page PDF files or trigger A4 print preview outputs with UAE PASS watermarks.
            </p>

            <button
              onClick={() => {
                if (documents.length > 0) {
                  handleExportPdf(documents[0]);
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Certified PDF (.pdf)
            </button>
          </div>

        </div>
      )}

      {/* TAB 4: CREATE CUSTOM HR DOCUMENT */}
      {activeTab === 'create' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Create Custom HR Vault Record
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Construct a new compliant HR document with legal metadata, employee details, and automated UAE PASS digital attestation.
            </p>
          </div>

          {/* Quick Master Setup & Governance Matrix Loop Selector */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
            <DocRefLoopSelector onApplyLoop={handleApplyLoopToNewForm} />
          </div>

          <form onSubmit={handleCreateDocument} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual IT Security & Code of Conduct Agreement"
                  value={newDocTitle}
                  onChange={e => setNewDocTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                <select
                  value={newDocCategory}
                  onChange={e => setNewDocCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="CONTRACT">Employment Contract</option>
                  <option value="POLICY_ACK">Policy Acknowledgement</option>
                  <option value="PERFORMANCE">Performance Review</option>
                  <option value="SEPARATION">Separation / Clearance</option>
                  <option value="GENERAL_HR">General HR</option>
                </select>
              </div>

              {/* GOVERNANCE & FORM LIFECYCLE CONTROLS */}
              <div className="col-span-1 sm:col-span-2 bg-slate-950/80 border border-indigo-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-indigo-400" /> Document Governance & Loop Metadata
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                    Audit-Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-amber-400 block mb-1">Document Ref Code</label>
                    <input
                      type="text"
                      value={newRefCode}
                      onChange={e => setNewRefCode(e.target.value)}
                      placeholder="REF-HR-0000"
                      className="w-full p-2 bg-slate-900 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-indigo-400 block mb-1">Version Control</label>
                    <input
                      type="text"
                      value={newVersionControl}
                      onChange={e => setNewVersionControl(e.target.value)}
                      placeholder="v1.0 (Master Loop)"
                      className="w-full p-2 bg-slate-900 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-cyan-400 block mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={toISODate(newIssueDate)}
                      onChange={e => setNewIssueDate(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-rose-400 block mb-1">Due for Revision</label>
                    <input
                      type="date"
                      value={toISODate(newDueDateForRevision)}
                      onChange={e => setNewDueDateForRevision(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* EMPLOYEE ROSTER CONNECTED SELECTOR (FILTERED BY SELECTED FACILITY) */}
              <div className="col-span-1 sm:col-span-2 bg-slate-900/90 border border-emerald-500/40 p-3.5 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Auto-Fill from Employee & Operator Management
                  </label>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    {filteredEmployeesForCreate.length} Facility Roster Records
                  </span>
                </div>
                <select
                  defaultValue=""
                  onChange={e => {
                    const emp = filteredEmployeesForCreate.find(x => x.id === e.target.value);
                    if (emp) {
                      setNewEmpName(emp.employee_name);
                      setNewEmpId(emp.employee_id);
                      setNewJobTitle(emp.position || '');
                      setNewDept(emp.department || '');
                      const status = emp.current_status || emp.status || 'Active';
                      setNewEmpStatus(status);
                      if (emp.last_working_date) {
                        setNewLastWorkingDate(toISODate(emp.last_working_date));
                      } else {
                        setNewLastWorkingDate('');
                      }
                      if ((emp as any).joining_date || (emp as any).date_of_joining || (emp as any).joiningDate) {
                        setNewJoiningDate((emp as any).joining_date || (emp as any).date_of_joining || (emp as any).joiningDate);
                      }
                      if (emp.branch_name) {
                        setNewFacilityName(emp.branch_name);
                      }
                    }
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
                >
                  <option value="" disabled>-- Select Employee from Facility Operator Roster --</option>
                  {filteredEmployeesForCreate.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_name} ({emp.employee_id}) • {emp.status || 'Active'} • {emp.position || 'Staff'} • {emp.department || 'Operations'} ({emp.branch_name || 'Main Facility'})
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 italic">Filtered by selected facility. Selecting a record auto-populates Legal Name, Employee ID, Job Designation, Department, Status, and Separation Dates.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Employee Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamdan Al-Nahyan"
                  value={newEmpName}
                  onChange={e => {
                    const val = e.target.value;
                    setNewEmpName(val);
                    const matched = effectiveEmployees.find(emp => emp.employee_name.toLowerCase() === val.toLowerCase());
                    if (matched) {
                      const st = matched.current_status || matched.status || 'Active';
                      setNewEmpStatus(st);
                      if (matched.last_working_date) {
                        setNewLastWorkingDate(toISODate(matched.last_working_date));
                      }
                    }
                  }}
                  list="new-emp-roster-list"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
                <datalist id="new-emp-roster-list">
                  {filteredEmployeesForCreate.map(emp => (
                    <option key={emp.id} value={emp.employee_name}>
                      {emp.employee_id} • {emp.status || 'Active'} • {emp.position || 'Staff'} ({emp.department || 'Operations'})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Employment Status</label>
                <select
                  value={newEmpStatus}
                  onChange={e => setNewEmpStatus(e.target.value)}
                  className={`w-full p-2.5 bg-slate-950 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
                    newEmpStatus === 'Resigned' || newEmpStatus === 'Terminated' ? 'border-rose-500 text-rose-300' : 'border-slate-800 text-white'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              {(newEmpStatus === 'Resigned' || newEmpStatus === 'Terminated') && (
                <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-xl">
                  <label className="text-xs font-black text-rose-300 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Last Working Date *
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                      Mandatory for {newEmpStatus} Staff
                    </span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newLastWorkingDate}
                    onChange={e => setNewLastWorkingDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-rose-500/60 rounded-xl text-xs text-rose-200 font-bold focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-rose-400/90 mt-1">Required compliance record for separated/inactive employee credential archiving.</p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-10992"
                  value={newEmpId}
                  onChange={e => setNewEmpId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Emirates ID (EID)</label>
                <input
                  type="text"
                  placeholder="784-1990-1234567-1"
                  value={newEmiratesId}
                  onChange={e => setNewEmiratesId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Job Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Security Analyst"
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Quality & IT Security"
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Joining Date</label>
                <input
                  type="date"
                  value={newJoiningDate}
                  onChange={e => setNewJoiningDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* FACILITY DETAILS FIELDSET */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Facility Details & Registration Credentials
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Facility Isolated View Mode
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                  <label className="text-[11px] font-extrabold text-emerald-300 block mb-1">Select Active Facility / Branch *</label>
                  <select
                    value={newFacilityName}
                    onChange={e => {
                      const facName = e.target.value;
                      setNewFacilityName(facName);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {facilityOptions.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">When a facility is selected, only that facility's employee roster records & facility information are displayed.</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={newFacilityName}
                    onChange={e => setNewFacilityName(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">MOHAP Facility License No.</label>
                  <input
                    type="text"
                    value={newFacilityLicenseNo}
                    onChange={e => setNewFacilityLicenseNo(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">DOH / MOHAP Registration No.</label>
                  <input
                    type="text"
                    value={newDohMohapRegNo}
                    onChange={e => setNewDohMohapRegNo(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Clinical / Operational Wing</label>
                  <input
                    type="text"
                    value={newClinicalWing}
                    onChange={e => setNewClinicalWing(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Facility Location Address</label>
                  <input
                    type="text"
                    value={newFacilityLocation}
                    onChange={e => setNewFacilityLocation(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            {/* FACILITY COMMITTEE SIGNATORY CONTROLS */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Facility Committee Signatory Controls
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Committee Chair</label>
                  <input
                    type="text"
                    value={newCommitteeChair}
                    onChange={e => setNewCommitteeChair(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Compliance & Governance Officer</label>
                  <input
                    type="text"
                    value={newComplianceOfficer}
                    onChange={e => setNewComplianceOfficer(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Duty Officer Phone / Hotline</label>
                  <input
                    type="text"
                    value={newDutyOfficerPhone}
                    onChange={e => setNewDutyOfficerPhone(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Risk Committee Escalation Email</label>
                  <input
                    type="text"
                    value={newEscalationEmail}
                    onChange={e => setNewEscalationEmail(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" /> Document Content Frame & Formatter
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer flex items-center gap-1 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Sample Word Document (.docx / .doc)</span>
                    <input
                      type="file"
                      accept=".doc,.docx,.word,.txt"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleWordDocUpload(e.target.files[0], 'create');
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleInsertTable()}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 cursor-pointer"
                  >
                    + Insert Table
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertExcelBox()}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-[11px] border border-emerald-800 cursor-pointer"
                  >
                    + Insert Excel Box
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertLoop()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-[11px] border border-indigo-800 cursor-pointer"
                  >
                    + Insert Loop
                  </button>
                </div>
              </div>

              {/* Copy / Paste Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Copy / Paste Actions:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyContent(newHtmlContent, 'Document Content')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Content
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard(setNewHtmlContent, false)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-[11px] border border-indigo-800 cursor-pointer flex items-center gap-1"
                  >
                    <Clipboard className="w-3 h-3" /> Paste Clipboard
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard(setNewHtmlContent, true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 cursor-pointer flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3 h-3 text-emerald-400" /> Append Clipboard
                  </button>
                </div>
              </div>

              {formCopyPasteNotice && (
                <div className="bg-cyan-950/90 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>{formCopyPasteNotice}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">CLIPBOARD ACTIVE</span>
                </div>
              )}

              {wordDocUploadNotice && (
                <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>{wordDocUploadNotice}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">AUTOCAPTURED</span>
                </div>
              )}

              <textarea
                rows={5}
                placeholder="<p>Enter custom clauses or document content, or upload a Word document sample...</p>"
                value={newHtmlContent}
                onChange={e => setNewHtmlContent(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Create & Seal Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INSPECT / PREVIEW MODAL */}
      {showPreviewModal && selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-4 sm:p-6 space-y-5 max-h-[95vh] overflow-y-auto shadow-2xl relative custom-scrollbar">

            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    {selectedDoc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DIGITAL SEALED
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">{selectedDoc.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    onClick={() => setInspectViewMode('a4-preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectViewMode === 'a4-preview'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> A4 Page Preview
                  </button>
                  <button
                    onClick={() => setInspectViewMode('data-grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inspectViewMode === 'data-grid'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" /> Data Structure
                  </button>
                </div>

                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
                  title="Close Modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-slate-300 hidden sm:inline">Certified Compliance Document:</span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">
                  {selectedDoc.legalMetadata?.lawReference || 'Federal Decree-Law No. 50'}
                </span>
                {selectedDoc.isFrozen !== false ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> FROZEN BASELINE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800 inline-flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-amber-400" /> UNFROZEN / EDITABLE
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenConnectEmployeeModal(selectedDoc)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-extrabold text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                  title="Connect with Employee & Operator Management"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Connect Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFreezeDoc(selectedDoc)}
                  className={`px-3 py-2 rounded-xl font-extrabold text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all border ${
                    selectedDoc.isFrozen !== false
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {selectedDoc.isFrozen !== false ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unfreeze to Modify</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Freeze Master Document</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportPdf(selectedDoc)}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingPdf ? 'Exporting PDF...' : 'Download PDF (.pdf)'}
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print / Page Preview
                </button>

                <button
                  onClick={() => handleOpenEmailModal(selectedDoc)}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-sky-950/40 flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Document
                </button>

                <button
                  onClick={() => {
                    handleRequestEditDoc(selectedDoc);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md shadow-amber-950/30 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {selectedDoc.isFrozen !== false ? 'Unfreeze & Edit' : 'Edit Document'}
                </button>

                <button
                  onClick={() => handleDeleteDocument(selectedDoc.id, selectedDoc.title)}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Delete Document Record"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Record
                </button>
              </div>
            </div>

            {/* FROZEN WARNING NOTIFICATION BANNER */}
            {selectedDoc.isFrozen !== false && (
              <div className="bg-amber-950/70 border border-amber-500/50 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-2.5 text-amber-200">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Master Baseline Document is FROZEN:</strong> Text clauses, employee designations, and entity credentials are locked against accidental modification.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenConnectEmployeeModal(selectedDoc)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Connect Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnfreezePromptDoc(selectedDoc);
                      setShowUnfreezeConfirmModal(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Unfreeze to Modify
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: A4 REALISTIC DOCUMENT PAPER PREVIEW */}
            {inspectViewMode === 'a4-preview' && (
              <div className="space-y-4">
                {/* DOCUMENT EDITING & FORMATTING TOOLBAR */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">Document Content Frame & Format Controls</span>
                    </div>

                    {/* Word Doc Upload Button */}
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Sample Word Document (.docx / .doc)</span>
                        <input
                          type="file"
                          accept=".doc,.docx,.word,.txt"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleWordDocUpload(e.target.files[0], selectedDoc.id);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {wordDocUploadNotice && (
                    <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>{wordDocUploadNotice}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">AUTOCAPTURED</span>
                    </div>
                  )}

                  {/* Formatting Tool Grid */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {/* Font Family */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Font:</span>
                      <select
                        value={docFontFamily}
                        onChange={e => setDocFontFamily(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Arial, sans-serif">Arial / Sans</option>
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Monaco, monospace">Monospace</option>
                      </select>
                    </div>

                    {/* Size */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Size:</span>
                      <select
                        value={docFontSize}
                        onChange={e => setDocFontSize(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="10px">10px</option>
                        <option value="11px">11px (Std)</option>
                        <option value="12px">12px</option>
                        <option value="14px">14px</option>
                        <option value="16px">16px</option>
                      </select>
                    </div>

                    {/* Adjust Area / Padding */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Frame Area:</span>
                      <select
                        value={docAreaPadding}
                        onChange={e => setDocAreaPadding(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="8px">Compact (8px)</option>
                        <option value="16px">Standard (16px)</option>
                        <option value="24px">Spacious (24px)</option>
                        <option value="32px">Wide (32px)</option>
                      </select>
                    </div>

                    {/* Color Picker presets */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Color:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Dark', value: '#0f172a' },
                          { label: 'Navy', value: '#1e3a8a' },
                          { label: 'Green', value: '#065f46' },
                          { label: 'Crimson', value: '#991b1b' }
                        ].map(c => (
                          <button
                            key={c.value}
                            onClick={() => setDocTextColor(c.value)}
                            style={{ backgroundColor: c.value }}
                            className={`w-4 h-4 rounded-full border ${docTextColor === c.value ? 'border-white ring-2 ring-emerald-400' : 'border-slate-700'}`}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bold / Italic / Underline */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setDocIsBold(!docIsBold)}
                        className={`px-2 py-0.5 rounded text-xs font-black cursor-pointer ${docIsBold ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Toggle Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocIsItalic(!docIsItalic)}
                        className={`px-2 py-0.5 rounded text-xs italic font-bold cursor-pointer ${docIsItalic ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Toggle Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocIsUnderline(!docIsUnderline)}
                        className={`px-2 py-0.5 rounded text-xs underline font-bold cursor-pointer ${docIsUnderline ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Toggle Underline"
                      >
                        U
                      </button>
                    </div>

                    {/* Text Alignment */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {[
                        { label: 'Left', value: 'left', symbol: '⇤' },
                        { label: 'Center', value: 'center', symbol: '↔' },
                        { label: 'Right', value: 'right', symbol: '⇥' },
                        { label: 'Justify', value: 'justify', symbol: '≡' }
                      ].map(a => (
                        <button
                          key={a.value}
                          type="button"
                          onClick={() => setDocTextAlign(a.value as any)}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold cursor-pointer ${docTextAlign === a.value ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          title={`Align ${a.label}`}
                        >
                          {a.symbol}
                        </button>
                      ))}
                    </div>

                    {/* Insert Table & Insert Excel Box & Insert Loop */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => handleInsertTable(selectedDoc.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        + Insert Table
                      </button>
                      <button
                        onClick={() => handleInsertExcelBox(selectedDoc.id)}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        + Insert Excel Box
                      </button>
                      <button
                        onClick={() => handleInsertLoop(selectedDoc.id)}
                        className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-lg text-[11px] font-bold border border-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        + Insert Loop
                      </button>
                    </div>
                  </div>

                  {/* Section Enable / Disable Visibility Controls */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span className="font-extrabold text-slate-200 text-xs">Document Sections & Signatory Controls:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Company Employee Information Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCompanyEmployeeInfo(!showCompanyEmployeeInfo)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                          showCompanyEmployeeInfo
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Enable or Disable Company Employee Information section"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Company Employee Information</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                          showCompanyEmployeeInfo ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {showCompanyEmployeeInfo ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </button>

                      {/* Regulatory Signatory Controls Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowRegulatorySignatoryControls(!showRegulatorySignatoryControls)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                          showRegulatorySignatoryControls
                            ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Enable or Disable Regulatory Signatory Controls section"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Regulatory Signatory Controls</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                          showRegulatorySignatoryControls ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {showRegulatorySignatoryControls ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* A4 Paper Sheet Container */}
                <div className="bg-slate-950 p-2 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto flex justify-center custom-scrollbar">
                  <div
                    id="hr-a4-preview-page"
                    className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-2xl rounded-sm border border-slate-200 text-xs font-sans relative space-y-5 flex flex-col justify-between my-2"
                    style={{ minWidth: '595px' }}
                  >
                    {/* Watermark Stamp */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                      <div className="border-8 border-emerald-900 rounded-full w-96 h-96 flex flex-col items-center justify-center text-emerald-950 font-black p-4 text-center transform -rotate-12">
                        <span className="text-3xl tracking-widest uppercase">OFFICIALLY SEALED</span>
                        <span className="text-sm tracking-wider mt-2">ADHCS CERTIFIED COMPLIANCE</span>
                      </div>
                    </div>

                    <div className="space-y-5 relative z-10">
                      {/* Header Letterhead */}
                      <div className="border-b-2 border-emerald-800 pb-3 flex items-center justify-between gap-4">
                        {/* Left Side: Facility Logo */}
                        <div className="flex items-center gap-3">
                          {client?.facility_logo ? (
                            <img
                              src={client.facility_logo}
                              alt="Facility Logo"
                              className="h-14 w-auto max-w-[150px] object-contain rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white font-black text-xs flex flex-col items-center justify-center shadow-md p-1 text-center">
                              <ShieldCheck className="w-6 h-6 text-emerald-300" />
                              <span className="text-[7px] font-mono tracking-tighter uppercase">FACILITY</span>
                            </div>
                          )}
                        </div>

                        {/* Right Side: Facility Name & Details */}
                        {(() => {
                          const isSmartProDoc = (
                            selectedDoc.facilityDetails?.facilityName?.toLowerCase().includes('smartpro') ||
                            selectedDoc.entityCredentials?.companyName?.toLowerCase().includes('smartpro') ||
                            companyName?.toLowerCase().includes('smartpro')
                          );
                          const facLic = selectedDoc.facilityDetails?.facilityLicenseNo;
                          const regNo = selectedDoc.facilityDetails?.dohMohapRegNo;
                          const wing = selectedDoc.facilityDetails?.clinicalWing;
                          const comp = selectedDoc.entityCredentials?.companyName || companyName;
                          const facName = selectedDoc.facilityDetails?.facilityName;
                          const isSameCompAndFac = !facName || facName === comp || facName.toLowerCase().includes('facility');

                          return (
                            <div className="text-right space-y-0.5">
                              <h1 className="font-black text-slate-900 text-sm tracking-tight uppercase leading-snug">
                                {comp}
                              </h1>
                              {!isSmartProDoc && (facLic || regNo) ? (
                                <p className="text-[9.5px] text-emerald-900 font-extrabold">
                                  {facLic ? <>Facility Lic: <span className="font-mono text-slate-800">{facLic}</span></> : null}
                                  {facLic && regNo ? ' • ' : ''}
                                  {regNo ? <>DOH/MOHAP Reg: <span className="font-mono text-slate-800">{regNo}</span></> : null}
                                </p>
                              ) : null}
                              {!isSmartProDoc && (
                                <p className="text-[9px] text-slate-600 font-semibold">
                                  {isSameCompAndFac ? null : <>Entity: <span className="font-bold text-slate-800">{comp}</span> </>}
                                  (Trade Lic: <span className="font-mono">{selectedDoc.entityCredentials?.tradeLicenseNo || tradeLicense}</span>) &bull; Abu Dhabi, UAE
                                </p>
                              )}
                              {wing ? (
                                <p className="text-[8.5px] text-slate-500 font-medium italic">
                                  {wing}
                                </p>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Document Title Banner */}
                      <div className="bg-slate-100 p-3 rounded border border-slate-200 text-center">
                        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight text-center font-bold">
                          {getProcessedHtmlContent(selectedDoc.title, selectedDoc, companyName, client) || selectedDoc.title}
                        </h2>
                      </div>

                      {/* Company Employee Information Grid */}
                      {showCompanyEmployeeInfo && (
                        <>
                          <div className="border border-slate-200 rounded overflow-hidden text-[11px]">
                            <div className="bg-slate-800 text-white font-extrabold text-[10px] px-3 py-1 uppercase tracking-wider flex items-center justify-between">
                              <span>Company Employee Information</span>
                              <div className="flex items-center gap-3 no-print print:hidden" data-no-print="true">
                                <label className="text-[9px] font-normal text-slate-300 flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={showJoiningDate}
                                    onChange={e => setShowJoiningDate(e.target.checked)}
                                    className="rounded accent-emerald-500"
                                  />
                                  <span>Include Joining Date (Optional)</span>
                                </label>
                                <label className="text-[9px] font-normal text-slate-300 flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={showOptionalEmiratesId}
                                    onChange={e => setShowOptionalEmiratesId(e.target.checked)}
                                    className="rounded accent-emerald-500"
                                  />
                                  <span>Include Emirates ID (Optional)</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setShowCompanyEmployeeInfo(false)}
                                  className="text-[9px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold transition-all cursor-pointer"
                                  title="Disable / Hide Company Employee Information section"
                                >
                                  ✕ Disable Section
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3 bg-slate-50/90">
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Full Legal Name:</span>
                                <span className="font-black text-slate-900">{selectedDoc.employeeDetails?.fullLegalName || 'Staff Member'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Employee ID:</span>
                                <span className="font-mono font-bold text-slate-900">{selectedDoc.employeeDetails?.employeeId || 'EMP-101'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Job Designation:</span>
                                <span className="font-bold text-slate-900">{selectedDoc.employeeDetails?.jobTitle || 'Healthcare Specialist'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase block">Department:</span>
                                <span className="font-bold text-slate-900">{selectedDoc.employeeDetails?.department || 'Admin'}</span>
                              </div>
                              {(() => {
                                const empStatus = selectedDoc.employeeDetails?.employmentStatus;
                                const lwd = selectedDoc.employeeDetails?.lastWorkingDate;
                                const isInactive = empStatus === 'Resigned' || empStatus === 'Terminated';
                                if (!isInactive && !lwd) return null;
                                return (
                                  <div className="col-span-2 pt-1 border-t border-rose-200 bg-rose-50/70 p-1.5 rounded flex items-center justify-between">
                                    <div>
                                      <span className="text-[9px] text-rose-700 font-bold uppercase block">Last Working Date *:</span>
                                      <span className="font-mono font-black text-rose-900 text-xs">{lwd ? formatDateDisplay(lwd) : 'Separation on file'}</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded border border-rose-300">
                                      Status: {empStatus || 'Inactive'}
                                    </span>
                                  </div>
                                );
                              })()}
                              {showJoiningDate && (
                                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Joining Date:</span>
                                    <span className="font-mono font-bold text-indigo-900">{selectedDoc.employeeDetails?.joiningDate || '2024-01-01'}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono italic no-print print:hidden">(Optional Joining Date)</span>
                                </div>
                              )}
                              {showOptionalEmiratesId && (
                                <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Emirates ID (EID):</span>
                                    <span className="font-mono font-bold text-emerald-800">{selectedDoc.employeeDetails?.emiratesId || '784-1990-1234567-1'}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono italic no-print print:hidden">(Optional EID Record)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Edit / Paste Options for Company Employee Information - Hidden during print */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs no-print print:hidden" data-no-print="true">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Employee Information Controls:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPreviewModal(false);
                                  handleOpenEditModal(selectedDoc);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                              >
                                <Edit3 className="w-3 h-3" /> Edit Employee Details
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                      let name = selectedDoc.employeeDetails?.fullLegalName || 'Staff Member';
                                      let empId = selectedDoc.employeeDetails?.employeeId || 'EMP-101';
                                      let job = selectedDoc.employeeDetails?.jobTitle || 'Healthcare Specialist';
                                      let dept = selectedDoc.employeeDetails?.department || 'Operations';
                                      let eid = selectedDoc.employeeDetails?.emiratesId || '784-1990-1234567-1';
                                      let joinDate = selectedDoc.employeeDetails?.joiningDate || '2024-01-01';

                                      try {
                                        const parsed = JSON.parse(text);
                                        if (parsed.employeeName || parsed.fullLegalName || parsed.name) name = parsed.employeeName || parsed.fullLegalName || parsed.name;
                                        if (parsed.employeeId || parsed.empId) empId = parsed.employeeId || parsed.empId;
                                        if (parsed.jobTitle || parsed.designation) job = parsed.jobTitle || parsed.designation;
                                        if (parsed.department || parsed.dept) dept = parsed.department || parsed.dept;
                                        if (parsed.emiratesId || parsed.eid) eid = parsed.emiratesId || parsed.eid;
                                      } catch {
                                        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                                        if (lines.length > 0) name = lines[0];
                                        if (lines.length > 1) empId = lines[1];
                                        if (lines.length > 2) job = lines[2];
                                        if (lines.length > 3) dept = lines[3];
                                      }

                                      const updated = {
                                        ...selectedDoc,
                                        employeeDetails: {
                                          ...DEFAULT_EMPLOYEE_DETAILS,
                                          ...(selectedDoc.employeeDetails || {}),
                                          fullLegalName: name,
                                          employeeId: empId,
                                          jobTitle: job,
                                          department: dept,
                                          emiratesId: eid || selectedDoc.employeeDetails?.emiratesId || '784-1990-1234567-1',
                                          joiningDate: joinDate || selectedDoc.employeeDetails?.joiningDate || '2024-01-01'
                                        },
                                        employeeSignature: {
                                          ...(selectedDoc.employeeSignature || {
                                            signedAt: new Date().toLocaleString(),
                                            isUaePassVerified: true,
                                            verificationHash: 'SHA256:' + Math.random().toString(16).substring(2, 10).toUpperCase(),
                                            ipAddress: '194.170.16.1'
                                          }),
                                          signedBy: name,
                                          signerRole: 'Employee'
                                        },
                                        updatedAt: new Date().toISOString()
                                      };
                                      setSelectedDoc(updated);
                                      setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updated : d));
                                      setFormCopyPasteNotice("✓ Employee Information updated from clipboard paste!");
                                      setTimeout(() => setFormCopyPasteNotice(null), 4000);
                                    }
                                  } catch (err) {
                                    console.error("Clipboard error", err);
                                    alert("Unable to read clipboard. Please use the Edit Employee Details modal.");
                                  }
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                              >
                                <Clipboard className="w-3 h-3" /> Paste Employee Data
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Executed Clauses Content Frame */}
                      <div className="space-y-1.5 pt-1">
                        <div
                          style={{
                            fontFamily: docFontFamily,
                            fontSize: docFontSize,
                            padding: docAreaPadding,
                            color: docTextColor,
                            fontWeight: docIsBold ? 'bold' : 'normal',
                            fontStyle: docIsItalic ? 'italic' : 'normal',
                            textDecoration: docIsUnderline ? 'underline' : 'none',
                            textAlign: docTextAlign,
                          }}
                          className="bg-slate-50/70 border border-slate-200 rounded-lg leading-relaxed space-y-2"
                          dangerouslySetInnerHTML={{ __html: getProcessedHtmlContent(selectedDoc.htmlContent, selectedDoc, companyName, client) }}
                        />
                      </div>

                      {/* Signatures Row */}
                      {showRegulatorySignatoryControls && (
                        <div className="pt-2 border-t border-slate-200">
                          {/* Control Header Bar - Hidden during print */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 no-print print:hidden bg-slate-100 p-2 rounded-lg border border-slate-200" data-no-print="true">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-wider">
                                Facility Committee Signatory Controls
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Layout Options */}
                              <div className="flex items-center bg-white border border-slate-300 rounded p-0.5 text-[9px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setSignatoryPrintOption('dual')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${signatoryPrintOption === 'dual' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  Option 1: Dual (Auth Rep)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSignatoryPrintOption('tri')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${signatoryPrintOption === 'tri' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  Option 2: Executive Tri-Signatory
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSignatoryPrintOption('quad')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${signatoryPrintOption === 'quad' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  Option 3: Quad Committee
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSignatoryPrintOption('custom')}
                                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${signatoryPrintOption === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  Custom
                                </button>
                              </div>

                              <label className="text-[9px] text-slate-700 font-extrabold flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-slate-300">
                                <input
                                  type="checkbox"
                                  checked={useManualSignatures}
                                  onChange={e => setUseManualSignatures(e.target.checked)}
                                  className="rounded accent-indigo-600"
                                />
                                <span>Physical Signature / Stamp Lines</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => setShowRegulatorySignatoryControls(false)}
                                className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 px-1.5 py-1 rounded border border-rose-300 font-bold transition-all cursor-pointer"
                                title="Disable / Hide Regulatory Signatory Controls section"
                              >
                                ✕ Hide
                              </button>
                            </div>

                            {/* Custom Member Checkboxes if Custom layout selected */}
                            {signatoryPrintOption === 'custom' && (
                              <div className="w-full pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-[9px] text-slate-700 font-semibold">
                                <span className="font-extrabold text-slate-900">Select Committee Members:</span>
                                {committeeContacts.map(c => (
                                  <label key={c.id} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedCommitteeIds.includes(c.id)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedCommitteeIds(prev => [...prev, c.id]);
                                        } else {
                                          setSelectedCommitteeIds(prev => prev.filter(id => id !== c.id));
                                        }
                                      }}
                                      className="rounded accent-indigo-600"
                                    />
                                    <span>{c.role}: <strong className="text-slate-900">{c.name}</strong></span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Signatures Grid */}
                          <div className={`grid gap-2.5 ${
                            activeCommitteeSignatories.length === 1 ? 'grid-cols-1 sm:grid-cols-2' :
                            activeCommitteeSignatories.length === 2 ? 'grid-cols-1 sm:grid-cols-3' :
                            'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                          }`}>
                            {/* 1. Employee Signatory */}
                            <div className="p-2.5 border-2 border-slate-300 bg-white rounded space-y-1">
                              <span className="text-[8px] font-black uppercase text-slate-700 tracking-wider block">Employee Signatory</span>
                              <span className="font-extrabold text-slate-900 text-xs block">{selectedDoc.employeeSignature?.signedBy || selectedDoc.employeeDetails?.fullLegalName || 'Staff Member'}</span>
                              <span className="text-[8px] text-slate-500 block truncate">{selectedDoc.employeeDetails?.jobTitle || 'Employee / Staff Member'}</span>
                              
                              {useManualSignatures ? (
                                <>
                                  <div className="border-b-2 border-dashed border-slate-400 my-2 h-5 flex items-end">
                                    <span className="text-[7px] text-slate-400 italic">Physical Signature / Stamp</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[8px] text-slate-600 font-mono pt-0.5">
                                    <span>Signed: ________________</span>
                                    <span>Date: ___/___/2026</span>
                                  </div>
                                </>
                              ) : (
                                <div className="pt-1">
                                  <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 w-fit">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified & Attested
                                  </div>
                                  <p className="text-[8px] text-slate-500 font-mono mt-0.5">Signed: {selectedDoc.employeeSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</p>
                                </div>
                              )}
                            </div>

                            {/* 2. Committee Signatories connected from Facility Management */}
                            {activeCommitteeSignatories.map(sig => (
                              <div key={sig.id} className="p-2.5 border-2 border-slate-300 bg-white rounded space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-700 tracking-wider block">{sig.role}</span>
                                <span className="font-extrabold text-slate-900 text-xs block">{sig.name}</span>
                                <div className="text-[8px] text-slate-600 font-mono space-y-0.2">
                                  <p className="truncate">{sig.email}</p>
                                  <p>{sig.phone}</p>
                                </div>

                                {useManualSignatures ? (
                                  <>
                                    <div className="border-b-2 border-dashed border-slate-400 my-2 h-5 flex items-end">
                                      <span className="text-[7px] text-slate-400 italic">Physical Signature / Stamp</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] text-slate-600 font-mono pt-0.5">
                                      <span>Signed: ________________</span>
                                      <span>Date: ___/___/2026</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="pt-1">
                                    <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 w-fit">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified & Attested
                                    </div>
                                    <p className="text-[8px] text-slate-500 font-mono mt-0.5">Signed: {selectedDoc.employerSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document Footer */}
                    <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between font-sans text-[9px] text-slate-700 font-bold relative z-10 gap-2">
                      <div>
                        <span className="font-mono text-[9px] text-slate-900 font-extrabold">
                          Ref: {selectedDoc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-slate-700 font-bold">
                          Issue Date: {selectedDoc.legalMetadata?.issueDate || ''}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-slate-700 font-bold">
                          Classification: {getDocumentClassification(selectedDoc)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-700 font-bold">
                          Next Review Date: {selectedDoc.legalMetadata?.nextReviewDate || '2027-07-28'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATA STRUCTURE METADATA GRID */}
            {inspectViewMode === 'data-grid' && (
              <div className="space-y-4">
                {/* Document Details Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-extrabold text-emerald-400 uppercase text-[10px] block flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Company Credentials
                    </span>
                    <p className="text-white font-bold">{companyName}</p>
                    <p className="text-slate-400">Trade License: {tradeLicense}</p>
                    <p className="text-slate-400">{selectedDoc.entityCredentials?.registeredAddress || DEFAULT_ENTITY_CREDENTIALS.registeredAddress}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-extrabold text-indigo-400 uppercase text-[10px] block flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Employee Information
                    </span>
                    <p className="text-white font-bold">{selectedDoc.employeeDetails?.fullLegalName || 'Employee'}</p>
                    <p className="text-slate-400">Employee ID: {selectedDoc.employeeDetails?.employeeId || 'N/A'}</p>
                    <p className="text-slate-400">Emirates ID: {selectedDoc.employeeDetails?.emiratesId || 'N/A'}</p>
                    <p className="text-slate-400">Title: {selectedDoc.employeeDetails?.jobTitle || ''} ({selectedDoc.employeeDetails?.department || ''})</p>
                    <p className="text-slate-400">Joining Date: {selectedDoc.employeeDetails?.joiningDate || '2024-01-01'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-extrabold text-teal-400 uppercase text-[10px] block flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Facility Details
                    </span>
                    <p className="text-white font-bold">{selectedDoc.facilityDetails?.facilityName || DEFAULT_FACILITY_DETAILS.facilityName}</p>
                    {selectedDoc.facilityDetails?.facilityName?.toLowerCase().includes('smartpro') ? (
                      <p className="text-slate-400">Location: {selectedDoc.facilityDetails?.facilityLocation || 'Al Mafraq, Abu Dhabi, United Arab Emirates'}</p>
                    ) : (
                      <>
                        <p className="text-slate-400">MOHAP License: {selectedDoc.facilityDetails?.facilityLicenseNo || DEFAULT_FACILITY_DETAILS.facilityLicenseNo}</p>
                        <p className="text-slate-400">DOH Reg No: {selectedDoc.facilityDetails?.dohMohapRegNo || DEFAULT_FACILITY_DETAILS.dohMohapRegNo}</p>
                        <p className="text-slate-400">Wing: {selectedDoc.facilityDetails?.clinicalWing || DEFAULT_FACILITY_DETAILS.clinicalWing}</p>
                      </>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-extrabold text-amber-400 uppercase text-[10px] block flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Facility Committee Signatory Controls
                    </span>
                    <p className="text-white font-bold">Chair: {selectedDoc.riskCommitteeContacts?.committeeChair || DEFAULT_RISK_COMMITTEE_CONTACTS.committeeChair}</p>
                    <p className="text-slate-400">Compliance Lead: {selectedDoc.riskCommitteeContacts?.complianceOfficer || DEFAULT_RISK_COMMITTEE_CONTACTS.complianceOfficer}</p>
                    <p className="text-slate-400">Duty Hotline: {selectedDoc.riskCommitteeContacts?.dutyOfficerPhone || DEFAULT_RISK_COMMITTEE_CONTACTS.dutyOfficerPhone}</p>
                    <p className="text-slate-400 font-mono text-[11px]">Email: {selectedDoc.riskCommitteeContacts?.escalationEmail || DEFAULT_RISK_COMMITTEE_CONTACTS.escalationEmail}</p>
                  </div>
                </div>

                {/* Document Clauses Content */}
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed space-y-3">
                  <span className="font-extrabold text-slate-400 uppercase text-[10px] block">Executed Clauses & Provisions</span>
                  <div dangerouslySetInnerHTML={{ __html: selectedDoc.htmlContent }} />
                </div>

                {/* Signatures Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Employee Signatory</span>
                    <span className="font-bold text-white block mt-1">{selectedDoc.employeeSignature?.signedBy || selectedDoc.employeeDetails?.fullLegalName || 'Staff Member'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono block">Signed: {selectedDoc.employeeSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Employer Signatory</span>
                    <span className="font-bold text-white block mt-1">{selectedDoc.employerSignature?.signedBy || 'Authorized Employer Signatory'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono block">Signed: {selectedDoc.employerSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</span>
                  </div>

                  {includeHrManager && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">HR Manager Signatory</span>
                      <span className="font-bold text-white block mt-1">
                        {selectedDoc.hrManagerSignature?.signedBy || 'Fatima Al-Suwaidi'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono block">Attested</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TOTAL SCRIPT / ATTACH JSON MODAL */}
      {showTotalScriptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Total HR Documents JSON Script Payload</h2>
                  <p className="text-xs text-slate-400">Attach or send this complete JSON script to another application or system</p>
                </div>
              </div>

              <button
                onClick={() => setShowTotalScriptModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-[11px] max-h-96 overflow-x-auto leading-relaxed border border-slate-800 custom-scrollbar">
                {getJsonExportPayload()}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => copyToClipboard(getJsonExportPayload(), setCopiedScript)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedScript ? 'Copied Total Script!' : '1-Click Copy Script'}
              </button>

              <button
                onClick={() => downloadFile(getJsonExportPayload(), 'total_hr_documents_script.json', 'application/json')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/40"
              >
                <Download className="w-4 h-4" /> Download JSON File (.json)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT HR DOCUMENT MODAL */}
      {showEditModal && editingDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl relative custom-scrollbar">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {editingDoc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Vault Record Edit Mode
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">Edit Document: {editingDoc.title}</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDoc(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Copy / Paste Toolbar for Edit Form */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mr-1">Edit Copy/Paste Tools:</span>
                <button
                  type="button"
                  onClick={() => handleCopyContent(editHtmlContent, 'Document HTML Content')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Content
                </button>

                <button
                  type="button"
                  onClick={() => handlePasteFromClipboard(setEditHtmlContent, false)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-[11px] border border-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Paste Clipboard
                </button>

                <button
                  type="button"
                  onClick={() => handlePasteFromClipboard(setEditHtmlContent, true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 cursor-pointer flex items-center gap-1"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" /> Append Clipboard
                </button>
              </div>
            </div>

            {formCopyPasteNotice && (
              <div className="bg-amber-950/90 border border-amber-800 text-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
                <span>{formCopyPasteNotice}</span>
                <span className="text-[10px] text-amber-400 font-mono">CLIPBOARD ACTIVE</span>
              </div>
            )}

            {/* Edit Form Body */}
            <form onSubmit={handleSaveEditedDocument} className="space-y-5">
              {/* Quick Master Setup & Governance Matrix Loop Selector */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                <DocRefLoopSelector onApplyLoop={handleApplyLoopToEditForm} />
              </div>

              {/* Core Document & Employee Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={editDocTitle}
                    onChange={e => setEditDocTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={editDocCategory}
                    onChange={e => setEditDocCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="CONTRACT">Employment Contract</option>
                    <option value="POLICY_ACK">Policy Acknowledgement</option>
                    <option value="PERFORMANCE">Performance Review</option>
                    <option value="SEPARATION">Separation / Clearance</option>
                    <option value="GENERAL_HR">General HR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Status</label>
                  <select
                    value={editDocStatus}
                    onChange={e => setEditDocStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="APPROVED_FROZEN">APPROVED_FROZEN</option>
                    <option value="DRAFT_PENDING">DRAFT_PENDING</option>
                  </select>
                </div>

                {/* Governance Metadata & Version Control Loop Fields */}
                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1">Document Reference Code</label>
                  <input
                    type="text"
                    value={editRefCode}
                    onChange={e => setEditRefCode(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-indigo-400 block mb-1">Version Control</label>
                  <input
                    type="text"
                    value={editVersionControl}
                    onChange={e => setEditVersionControl(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-cyan-400 block mb-1">Form Issue Date *</label>
                  <input
                    type="date"
                    value={toISODate(editIssueDate)}
                    onChange={e => setEditIssueDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-400 block mb-1">Form Due for Revision</label>
                  <input
                    type="date"
                    value={toISODate(editDueDateForRevision)}
                    onChange={e => setEditDueDateForRevision(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">Approval Date</label>
                  <input
                    type="date"
                    value={toISODate(editApprovalDate)}
                    onChange={e => setEditApprovalDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-400 block mb-1">Document Classification</label>
                  <select
                    value={editDocClassification}
                    onChange={e => setEditDocClassification(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-purple-500/30 rounded-xl text-xs text-purple-300 cursor-pointer"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="PUBLIC">PUBLIC</option>
                  </select>
                </div>

                {/* EMPLOYEE ROSTER CONNECTED SELECTOR FOR EDIT MODAL */}
                <div className="col-span-1 sm:col-span-2 md:col-span-3 bg-slate-900/90 border border-amber-500/40 p-3.5 rounded-xl space-y-2 shadow-xs my-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-400" /> Connect with Employee & Operator Management
                    </label>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                      {filteredEmployeesForEdit.length} Facility Staff Records
                    </span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = filteredEmployeesForEdit.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditEmpName(emp.employee_name);
                        setEditEmpId(emp.employee_id);
                        setEditJobTitle(emp.position || '');
                        setEditDept(emp.department || '');
                        const st = emp.current_status || emp.status || 'Active';
                        setEditEmpStatus(st);
                        if (emp.last_working_date) {
                          setEditLastWorkingDate(toISODate(emp.last_working_date));
                        } else {
                          setEditLastWorkingDate('');
                        }
                        if ((emp as any).joining_date || (emp as any).date_of_joining || (emp as any).joiningDate) {
                          setEditJoiningDate((emp as any).joining_date || (emp as any).date_of_joining || (emp as any).joiningDate);
                        }
                        if (emp.branch_name) {
                          setEditFacilityName(emp.branch_name);
                        }
                      }
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
                  >
                    <option value="" disabled>-- Select Employee from Facility Operator Roster to Auto-Fill --</option>
                    {filteredEmployeesForEdit.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.employee_id}) • {emp.status || 'Active'} • {emp.position || 'Staff'} • {emp.department || 'Operations'} ({emp.branch_name || 'Main Facility'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-400 italic">Filtered by selected facility. Selecting a record updates Employee Full Legal Name, Employee ID, Job Designation, Department, Status, and Separation Dates.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Employee Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editEmpName}
                    onChange={e => {
                      const val = e.target.value;
                      setEditEmpName(val);
                      const matched = effectiveEmployees.find(emp => emp.employee_name.toLowerCase() === val.toLowerCase());
                      if (matched) {
                        const st = matched.current_status || matched.status || 'Active';
                        setEditEmpStatus(st);
                        if (matched.last_working_date) {
                          setEditLastWorkingDate(toISODate(matched.last_working_date));
                        }
                      }
                    }}
                    list="edit-emp-roster-list"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                  <datalist id="edit-emp-roster-list">
                    {filteredEmployeesForEdit.map(emp => (
                      <option key={emp.id} value={emp.employee_name}>
                        {emp.employee_id} • {emp.status || 'Active'} • {emp.position || 'Staff'} ({emp.department || 'Operations'})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Employment Status</label>
                  <select
                    value={editEmpStatus}
                    onChange={e => setNewEmpStatus ? setEditEmpStatus(e.target.value) : null}
                    className={`w-full p-2.5 bg-slate-950 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/30 cursor-pointer ${
                      editEmpStatus === 'Resigned' || editEmpStatus === 'Terminated' ? 'border-rose-500 text-rose-300' : 'border-slate-800 text-white'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                {(editEmpStatus === 'Resigned' || editEmpStatus === 'Terminated') && (
                  <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-xl">
                    <label className="text-xs font-black text-rose-300 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Last Working Date *
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        Mandatory for {editEmpStatus} Staff
                      </span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editLastWorkingDate}
                      onChange={e => setEditLastWorkingDate(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-rose-500/60 rounded-xl text-xs text-rose-200 font-bold focus:ring-2 focus:ring-rose-500"
                    />
                    <p className="text-[10px] text-rose-400/90 mt-1">Required compliance record for separated/inactive employee credential archiving.</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editEmpId}
                    onChange={e => setEditEmpId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Emirates ID (EID)</label>
                  <input
                    type="text"
                    value={editEmiratesId}
                    onChange={e => setEditEmiratesId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={editPassportNumber}
                    onChange={e => setEditPassportNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={e => setEditJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={editJoiningDate}
                    onChange={e => setEditJoiningDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Facility & Clinical Wing Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Facility Credentials & Licensing
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Facility Isolated View
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                    <label className="text-[11px] font-extrabold text-emerald-300 block mb-1">Select Active Facility / Branch *</label>
                    <select
                      value={editFacilityName}
                      onChange={e => {
                        const facName = e.target.value;
                        setEditFacilityName(facName);
                      }}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {facilityOptions.map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Updates document facility & isolates staff selection to chosen facility.</p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Facility Name</label>
                    <input
                      type="text"
                      value={editFacilityName}
                      onChange={e => setEditFacilityName(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Facility License No</label>
                    <input
                      type="text"
                      value={editFacilityLicenseNo}
                      onChange={e => setEditFacilityLicenseNo(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">DOH / MOHAP Reg No</label>
                    <input
                      type="text"
                      value={editDohMohapRegNo}
                      onChange={e => setEditDohMohapRegNo(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Clinical / Operational Wing</label>
                    <input
                      type="text"
                      value={editClinicalWing}
                      onChange={e => setEditClinicalWing(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Facility Committee Signatory Controls */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Facility Committee Signatory Controls
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Committee Chair</label>
                    <input
                      type="text"
                      value={editCommitteeChair}
                      onChange={e => setEditCommitteeChair(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Compliance & Governance Officer</label>
                    <input
                      type="text"
                      value={editComplianceOfficer}
                      onChange={e => setEditComplianceOfficer(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Duty Officer Phone / Hotline</label>
                    <input
                      type="text"
                      value={editDutyOfficerPhone}
                      onChange={e => setEditDutyOfficerPhone(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Risk Committee Escalation Email</label>
                    <input
                      type="text"
                      value={editEscalationEmail}
                      onChange={e => setEditEscalationEmail(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Document HTML / Clauses Content Frame */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" /> Document Content Frame & Formatter
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer flex items-center gap-1 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Sample Word Document (.docx / .doc)</span>
                      <input
                        type="file"
                        accept=".doc,.docx,.word,.txt"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleWordDocUpload(e.target.files[0], 'edit');
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setEditHtmlContent(prev => prev + `
<div class="my-3 overflow-x-auto">
  <table class="w-full text-xs border-collapse border border-slate-300">
    <thead>
      <tr class="bg-slate-800 text-white font-bold text-[10px] uppercase">
        <th class="border border-slate-300 p-2 text-left">Clause Ref</th>
        <th class="border border-slate-300 p-2 text-left">Requirement</th>
        <th class="border border-slate-300 p-2 text-left">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr class="bg-white">
        <td class="border border-slate-300 p-2 font-mono font-bold">SEC-01</td>
        <td class="border border-slate-300 p-2">Data Privacy Protocol</td>
        <td class="border border-slate-300 p-2 font-bold text-emerald-700">✓ Verified</td>
      </tr>
    </tbody>
  </table>
</div>`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 cursor-pointer"
                    >
                      + Insert Table
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditHtmlContent(prev => prev + `
<div class="my-3 border-2 border-emerald-700 rounded-lg overflow-hidden shadow-xs bg-white">
  <div class="bg-emerald-800 text-white font-mono text-[10px] px-3 py-1 flex items-center justify-between font-bold">
    <span>📊 Excel Grid Box — Compensation Schedule.xlsx</span>
    <span class="bg-emerald-950 px-2 py-0.5 rounded text-[9px] text-emerald-300 font-normal">Sheet1</span>
  </div>
  <table class="w-full text-[10px] font-mono border-collapse">
    <tr class="bg-slate-200 text-slate-700 font-bold">
      <td class="p-1.5 border">Code</td>
      <td class="p-1.5 border">Description</td>
      <td class="p-1.5 border text-right">Amount (AED)</td>
    </tr>
    <tr>
      <td class="p-1.5 border font-bold">BASIC</td>
      <td class="p-1.5 border">Basic Salary</td>
      <td class="p-1.5 border text-right font-bold">18,500.00</td>
    </tr>
  </table>
</div>`)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-[11px] border border-emerald-800 cursor-pointer"
                    >
                      + Insert Excel Box
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertLoop()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-bold text-[11px] border border-indigo-800 cursor-pointer"
                    >
                      + Insert Loop
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={editHtmlContent}
                  onChange={e => setEditHtmlContent(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 hover:text-white bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={editDocStatus === 'APPROVED_FROZEN'}
                    onChange={e => setEditDocStatus(e.target.checked ? 'APPROVED_FROZEN' : 'DRAFT_PENDING')}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Re-freeze Master Document on Save (Locked baseline protection)
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDoc(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs cursor-pointer border border-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-950/40 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save Changes to Vault Record
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EMAIL DOCUMENT DISPATCH MODAL */}
      {showEmailModal && emailTargetDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Email Official HR Record</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono">
                      {emailTargetDoc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Transmit certified compliance record with UAE PASS seal attestation via secure HR mail dispatch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {emailSentNotice ? (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-bold space-y-2 text-center animate-fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p>{emailSentNotice}</p>
                <span className="text-[10px] text-emerald-400 block font-mono">DISPATCH TRANSMITTED VIA SECURE GATEWAY</span>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-300">Recipient Email Address:</label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="e.g. employee@company.ae or hr-compliance@zamzampharmacy.ae"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-300">Email Subject Line:</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-slate-300">Cover Message / Body:</label>
                    <span className="text-[10px] text-slate-500">Plain text + Auto-attached PDF</span>
                  </div>
                  <textarea
                    rows={7}
                    required
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-sans focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white text-xs block">{emailTargetDoc.title}.pdf</span>
                      <span className="text-[10px] text-slate-400">Attested PDF Document &bull; {emailTargetDoc.legalMetadata?.referenceCode || 'REF-HR-0000'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                    AUTO-ATTACHED
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-950/50 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingEmail ? 'Transmitting Email...' : 'Send Email Dispatch'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Delete HR Document Record</h3>
                <p className="text-xs text-slate-400 mt-0.5">Permanent Vault Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-white font-mono">"{deletingDoc.title}"</strong> ({deletingDoc.legalMetadata?.referenceCode || ''}) from the HR Documents Vault? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Delete Selected HR Documents</h3>
                <p className="text-xs text-slate-400 mt-0.5">Bulk Vault Permanent Deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-rose-400 font-mono">{selectedDocIds.length} selected document(s)</strong> from the HR Documents Vault for <strong>{client?.company_name || 'Active Client'}</strong>? This action cannot be undone.
            </p>

            <div className="max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
              {documents.filter(d => selectedDocIds.includes(d.id)).map(d => (
                <div key={d.id} className="flex items-center justify-between text-[11px]">
                  <span className="truncate font-semibold text-slate-200">{d.title}</span>
                  <span className="font-mono text-emerald-400 text-[10px] ml-2 shrink-0">{d.legalMetadata?.referenceCode}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete {selectedDocIds.length} Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COPY FILES FROM COMPLIANCE CONSULTANT MODAL */}
      {showCopyFromConsultantModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Copy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Copy HR Documents from Compliance Consultant</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Source: <span className="text-emerald-400 font-bold">COMPLIANCE CONSULTANT (SmartPro)</span> &rarr; Target: <span className="text-cyan-300 font-extrabold">{targetCopyDestination === 'ALL_CLIENTS' ? `ALL ${availableClientsList.length} CLIENTS REGISTRY` : (availableClientsList.find(c => c.id === targetCopyDestination)?.company_name || client?.company_name || 'Active Client')}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCopyFromConsultantModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Select master documents from the Compliance Consultant library to copy into the client vault. Entity credentials, trade licenses, and committee signatory contacts will be dynamically bound to each target client.
              </p>
            </div>

            {/* TARGET DESTINATION SELECTOR */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Target HR Vault Registry Destination:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({availableClientsList.length} Clients Registered)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTargetCopyDestination('ACTIVE_CLIENT')}
                  className={`p-2.5 rounded-lg border font-bold text-left transition-all cursor-pointer ${
                    targetCopyDestination === 'ACTIVE_CLIENT'
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Active Client</div>
                  <div className="truncate text-xs font-bold text-slate-100">{client?.company_name || 'Active Client'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetCopyDestination('ALL_CLIENTS')}
                  className={`p-2.5 rounded-lg border font-bold text-left transition-all cursor-pointer ${
                    targetCopyDestination === 'ALL_CLIENTS'
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">✨ All Clients Registry</div>
                  <div className="truncate text-xs font-bold text-slate-100">Copy to ALL {availableClientsList.length} Clients</div>
                </button>

                <div className="relative">
                  <select
                    value={targetCopyDestination !== 'ACTIVE_CLIENT' && targetCopyDestination !== 'ALL_CLIENTS' ? targetCopyDestination : ''}
                    onChange={e => {
                      if (e.target.value) setTargetCopyDestination(e.target.value);
                    }}
                    className={`w-full h-full p-2.5 rounded-lg border font-bold text-xs bg-slate-900 transition-all cursor-pointer ${
                      targetCopyDestination !== 'ACTIVE_CLIENT' && targetCopyDestination !== 'ALL_CLIENTS'
                        ? 'border-indigo-500 text-indigo-200 bg-indigo-950/60'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <option value="">Select Specific Client...</option>
                    {availableClientsList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search master consultant documents..."
                  value={consultantSearch}
                  onChange={e => setConsultantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedConsultantDocIds.length === filteredConsultantDocs.length) {
                    setSelectedConsultantDocIds([]);
                  } else {
                    setSelectedConsultantDocIds(filteredConsultantDocs.map(d => d.id));
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                {selectedConsultantDocIds.length === filteredConsultantDocs.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[280px]">
              {filteredConsultantDocs.map(doc => {
                const isAlreadyInVault = documents.some(d => d.title === doc.title && d.client_id === currentClientKey);
                const isSelected = selectedConsultantDocIds.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedConsultantDocIds(prev => [...prev, doc.id]);
                        } else {
                          setSelectedConsultantDocIds(prev => prev.filter(id => id !== doc.id));
                        }
                      }}
                      className="mt-1 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-100 truncate">{doc.title}</span>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          {doc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span>Category: {doc.category}</span>
                        {isAlreadyInVault && (
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Already in Client Vault
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                {selectedConsultantDocIds.length} of {filteredConsultantDocs.length} selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCopyFromConsultantModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={selectedConsultantDocIds.length === 0}
                  onClick={() => handleExecuteCopyFromConsultant(undefined, 'ACTIVE_CLIENT')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy to Active Client
                </button>

                <button
                  type="button"
                  disabled={selectedConsultantDocIds.length === 0}
                  onClick={() => handleExecuteCopyFromConsultant(undefined, 'ALL_CLIENTS')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-cyan-950/40 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-400/30"
                >
                  <Layers className="w-4 h-4" /> Copy to ALL Clients Registry ({availableClientsList.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNFREEZE SINGLE DOCUMENT CONFIRMATION MODAL WITH EMPLOYEE ROSTER CONNECT OPTION */}
      {showUnfreezeConfirmModal && unfreezePromptDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Document Freeze Protection Active</h3>
                <p className="text-xs text-slate-400">Master Document Version & Governance Control</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs space-y-2 text-slate-300">
              <p className="font-bold text-amber-200">
                You are requesting to edit a frozen master document:
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="font-black text-slate-100">{unfreezePromptDoc.title}</div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Ref: {unfreezePromptDoc.legalMetadata?.referenceCode || 'REF-HR-0000'} &bull; Status: {unfreezePromptDoc.status}
                </div>
                <div className="text-[11px] text-slate-400">
                  Current Connected Staff: <strong className="text-slate-200">{unfreezePromptDoc.employeeDetails?.fullLegalName || 'None'}</strong> {unfreezePromptDoc.employeeDetails?.employeeId ? `(${unfreezePromptDoc.employeeDetails.employeeId})` : ''}
                </div>
              </div>
              <p className="leading-relaxed">
                By unfreezing, legal clauses, employee metadata, and signatories can be modified.
              </p>
            </div>

            {/* CONNECT WITH EMPLOYEE & OPERATOR MANAGEMENT SECTION */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-cyan-500/40 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-400" /> Connect with Employee & Operator Management
                </label>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                  {filteredEmployeesForEdit.length} Roster Records
                </span>
              </div>
              <select
                value={unfreezeSelectedEmployeeId}
                onChange={e => setUnfreezeSelectedEmployeeId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 cursor-pointer font-medium"
              >
                <option value="">-- Keep Existing Document Record / Manual Edit --</option>
                {filteredEmployeesForEdit.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_name} ({emp.employee_id}) • {emp.position || 'Staff'} • {emp.department || 'Operations'} ({emp.branch_name || 'Main Facility'})
                  </option>
                ))}
              </select>

              {unfreezeSelectedEmployeeId && (() => {
                const matchedEmp = effectiveEmployees.find(e => e.id === unfreezeSelectedEmployeeId);
                if (!matchedEmp) return null;
                const isInactive = matchedEmp.current_status === 'Resigned' || matchedEmp.current_status === 'Terminated' || matchedEmp.status === 'Resigned' || matchedEmp.status === 'Terminated';
                const lwd = matchedEmp.last_working_date;

                return (
                  <div className={`border p-2.5 rounded-lg text-xs space-y-1.5 ${
                    isInactive ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{matchedEmp.employee_name}</span>
                        {isInactive && (
                          <span className="text-[9.5px] font-black text-rose-300 bg-rose-950/90 border border-rose-500/60 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            {matchedEmp.current_status || matchedEmp.status}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-cyan-300 font-extrabold">{matchedEmp.employee_id}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Designation: <strong>{matchedEmp.position || 'Staff'}</strong> &bull; Dept: <strong>{matchedEmp.department || 'Operations'}</strong>
                    </div>
                    {isInactive && (
                      <div className="text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded flex items-center gap-1.5 mt-1 font-mono">
                        <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Last Working Date *: <strong className="text-white">{lwd ? formatDateDisplay(lwd) : 'Not Set in Profile'}</strong></span>
                      </div>
                    )}
                    {matchedEmp.branch_name && (
                      <div className="text-[10.5px] text-slate-400">
                        Facility: {matchedEmp.branch_name}
                      </div>
                    )}
                  </div>
                );
              })()}
              <p className="text-[10.5px] text-slate-400 italic">
                Select a staff member from the facility roster to auto-fill their credentials and electronic signatory role when unfreezing.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowUnfreezeConfirmModal(false);
                  setUnfreezePromptDoc(null);
                  setUnfreezeSelectedEmployeeId('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Frozen & Cancel
              </button>

              {unfreezeSelectedEmployeeId && (
                <button
                  type="button"
                  onClick={() => handleQuickConnectAndRefreezeFromModal(unfreezePromptDoc, unfreezeSelectedEmployeeId)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-400/30"
                  title="Directly bind selected employee to document and keep frozen as master"
                >
                  <Lock className="w-3.5 h-3.5" /> Quick Connect & Re-Freeze
                </button>
              )}

              <button
                type="button"
                onClick={() => handleConfirmUnfreezeAndEdit(unfreezePromptDoc, unfreezeSelectedEmployeeId)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" /> {unfreezeSelectedEmployeeId ? 'Unfreeze & Connect Staff' : 'Unfreeze & Open Editor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED CONNECT WITH EMPLOYEE & OPERATOR MANAGEMENT MODAL */}
      {showConnectEmployeeModal && connectEmployeeTargetDoc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Connect with Employee & Operator Management</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Document: <span className="text-cyan-300 font-bold">{connectEmployeeTargetDoc.title}</span> ({connectEmployeeTargetDoc.legalMetadata?.referenceCode || 'REF-HR-0000'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConnectEmployeeModal(false);
                  setConnectEmployeeTargetDoc(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* SEARCH AND ROSTER SUMMARY BAR */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search staff by name, employee code/ID, designation, department, branch..."
                  value={connectEmployeeSearch}
                  onChange={e => setConnectEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                {connectEmployeeSearch && (
                  <button
                    type="button"
                    onClick={() => setConnectEmployeeSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Facility Staff Records: <strong className="text-cyan-300">{filteredEmployeesForConnect.length}</strong> available</span>
                <span>Current Document Staff: <strong className="text-white">{connectEmployeeTargetDoc.employeeDetails?.fullLegalName || 'None'}</strong></span>
              </div>
            </div>

            {/* EMPLOYEE ROSTER CARDS LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[38vh]">
              {filteredEmployeesForConnect.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No staff members matched your search in Employee & Operator Management.
                </div>
              ) : (
                filteredEmployeesForConnect.map(emp => {
                  const isSelected = connectEmployeeSelectedId === emp.id;
                  const isCurrentlyBound = connectEmployeeTargetDoc.employeeDetails?.employeeId === emp.employee_id;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setConnectEmployeeSelectedId(emp.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 text-white ring-1 ring-cyan-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-white">{emp.employee_name}</span>
                            <span className="text-[10px] font-mono font-extrabold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                              {emp.employee_id}
                            </span>
                            {isCurrentlyBound && (
                              <span className="text-[9.5px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                                CURRENTLY BOUND
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                            <span>Role: <strong className="text-slate-200">{emp.position || 'Staff'}</strong></span>
                            <span>Dept: <strong className="text-slate-200">{emp.department || 'Operations'}</strong></span>
                            {emp.branch_name && <span>Facility: <strong className="text-slate-300">{emp.branch_name}</strong></span>}
                          </div>
                          {(emp.current_status === 'Resigned' || emp.current_status === 'Terminated' || emp.status === 'Resigned' || emp.status === 'Terminated') && (
                            <div className="text-[10.5px] font-bold text-rose-400 mt-1 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-rose-400" />
                              Last Working Date *: <span className="text-rose-200">{emp.last_working_date ? formatDateDisplay(emp.last_working_date) : 'Required'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {emp.current_status === 'Resigned' || emp.current_status === 'Terminated' || emp.status === 'Resigned' || emp.status === 'Terminated' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-rose-500/20 text-rose-300 border-rose-500/40 inline-flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            {emp.current_status || emp.status}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            emp.status === 'Active' || emp.current_status === 'Active' || !emp.status
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {emp.current_status || emp.status || 'Active'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* LIVE PREVIEW CARD OF CHOSEN EMPLOYEE */}
            {connectEmployeeSelectedId && (() => {
              const chosen = effectiveEmployees.find(e => e.id === connectEmployeeSelectedId);
              if (!chosen) return null;
              const isInactive = chosen.current_status === 'Resigned' || chosen.current_status === 'Terminated' || chosen.status === 'Resigned' || chosen.status === 'Terminated';
              const lwd = chosen.last_working_date;

              return (
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isInactive ? 'bg-rose-950/30 border-rose-500/50' : 'bg-cyan-950/30 border-cyan-500/40'
                }`}>
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400" /> Selected Staff for Auto-Binding:
                    </span>
                    <span className="font-mono text-[11px] text-white font-black">{chosen.employee_name} ({chosen.employee_id})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                    <div><span className="text-slate-400 block text-[10px]">DESIGNATION</span><strong>{chosen.position || 'Staff'}</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">DEPARTMENT</span><strong>{chosen.department || 'Operations'}</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">FACILITY / BRANCH</span><strong>{chosen.branch_name || client?.company_name || 'Main Facility'}</strong></div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">STATUS</span>
                      <strong className={isInactive ? 'text-rose-400 font-black' : 'text-emerald-400'}>
                        {chosen.current_status || chosen.status || 'Active'}
                      </strong>
                    </div>
                  </div>
                  {isInactive && (
                    <div className="text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-1 rounded flex items-center gap-1.5 mt-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Last Working Date *: <strong className="text-white">{lwd ? formatDateDisplay(lwd) : 'Separation Date to be archived'}</strong></span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* FREEZE GOVERNANCE TOGGLE */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={connectEmployeeRefreezeOnSave}
                  onChange={e => setConnectEmployeeRefreezeOnSave(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold">Keep / Seal document as Frozen Master after connecting</span>
              </label>
              <span className="text-[10.5px] text-slate-500 italic hidden sm:inline">Prevents unintended clause edits</span>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConnectEmployeeModal(false);
                  setConnectEmployeeTargetDoc(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!connectEmployeeSelectedId}
                  onClick={() => handleSaveConnectEmployee(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-slate-700 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Bind & Open in Full Editor
                </button>

                <button
                  type="button"
                  disabled={!connectEmployeeSelectedId}
                  onClick={() => handleSaveConnectEmployee(false)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-cyan-950/40 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-400/30"
                >
                  <UserCheck className="w-4 h-4" /> Save & Bind to Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASS UNFREEZE CONFIRMATION MODAL */}
      {showMassUnfreezeConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Unfreeze All Documents?</h3>
                <p className="text-xs text-slate-400">Bulk Repository Modification Mode</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to unfreeze all <strong>{documents.length}</strong> HR documents in the vault? This will make all documents immediately editable. You can re-freeze all documents at any time.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMassUnfreezeConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUnfreezeAllDocuments}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-4 h-4" /> Yes, Unfreeze All Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR / PURGE VAULT CONFIRMATION MODAL */}
      {showClearVaultModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Clear All Vault Documents?</h3>
                <p className="text-xs text-slate-400">Purge Unwanted & Legacy Records</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove all <strong>{documents.length}</strong> document(s) from this vault? This will leave your vault clean so only files you explicitly create or copy will be stored.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearVaultModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearVault}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Yes, Clear All Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER SECURITY UNLOCK MODAL (PASSWORD: 663385) */}
      {showSecurityUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn font-sans">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-amber-500/40 overflow-hidden text-left">
            <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    HR Vault Master Protection Unlock
                  </h3>
                  <p className="text-[11px] text-slate-400">Security Key Verification for Protected Actions</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSecurityUnlockModal(false);
                  setSecurityPinError(null);
                  setSecurityPinInput('');
                  setPendingActionOnUnlock(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySecurityPin} className="p-6 space-y-4 text-xs text-slate-300">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Lock className="w-4 h-4" />
                  <span>Master Protection Key Required</span>
                </div>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Enter the Master Security PIN to unlock master template modifications, deletion rights, and protected governance controls in HR Documents Hub &amp; Vault.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-200 text-xs">
                  Authorization Security Key *
                </label>
                <div className="relative">
                  <input
                    type={showPinPassword ? "text" : "password"}
                    autoFocus
                    value={securityPinInput}
                    onChange={e => {
                      setSecurityPinInput(e.target.value);
                      if (securityPinError) setSecurityPinError(null);
                    }}
                    placeholder="Enter Security PIN (e.g. 123456)..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 focus:bg-slate-900 font-mono font-bold text-white text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(prev => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPinPassword ? "Hide PIN" : "Show PIN"}
                  >
                    {showPinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {securityPinError && (
                  <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    {securityPinError}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityUnlockModal(false);
                    setSecurityPinError(null);
                    setSecurityPinInput('');
                    setPendingActionOnUnlock(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs shadow-lg cursor-pointer transition-all flex items-center gap-1.5 border border-amber-400/30"
                >
                  <Unlock className="w-4 h-4" /> Verify &amp; Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
