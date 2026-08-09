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
  Eye,
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
  Send
} from 'lucide-react';
import { Client, User, Employee } from '../types';
import { INITIAL_EMPLOYEES } from '../initialData';
import { exportToSinglePagePDF } from '../utils/pdfExport';
import { printCurrentView, printDocument } from '../utils/printUtils';
import { DocRefLoopSelector, DocRefLoopData, DEFAULT_LOOP_DOC_RECORDS } from './DocRefLoopSelector';

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

export const getProcessedHtmlContent = (htmlContent: string | undefined, doc?: Partial<HRDocumentRecord>, fallbackCompanyName?: string): string => {
  if (!htmlContent) return '';
  const compName = doc?.entityCredentials?.companyName || fallbackCompanyName || DEFAULT_ENTITY_CREDENTIALS.companyName;
  const facName = doc?.facilityDetails?.facilityName || compName;
  const empName = doc?.employeeDetails?.fullLegalName || DEFAULT_EMPLOYEE_DETAILS.fullLegalName;

  return htmlContent
    .replace(/\(Company Name\)/gi, compName)
    .replace(/\[Company Name\]/gi, compName)
    .replace(/\[COMPANY_NAME\]/gi, compName)
    .replace(/\(Company\)/gi, compName)
    .replace(/\[Company\]/gi, compName)
    .replace(/\(Facility Name\)/gi, facName)
    .replace(/\[Facility Name\]/gi, facName)
    .replace(/\[FACILITY_NAME\]/gi, facName)
    .replace(/\(Employee Name\)/gi, empName)
    .replace(/\[Employee Name\]/gi, empName);
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
  companyName: 'Zamzam Pharmacy LLC',
  tradeLicenseNo: 'CN-1029481',
  emirateJurisdiction: 'Abu Dhabi',
  registeredAddress: 'ADGM Square, Al Maryah Island, Abu Dhabi, UAE'
};

export const DEFAULT_EMPLOYEE_DETAILS: HRDocumentEmployeeDetails = {
  fullLegalName: 'Staff Member',
  employeeId: 'EMP-101',
  emiratesId: '784-1990-1234567-1',
  passportNumber: 'N1029384',
  jobTitle: 'Healthcare Specialist',
  department: 'Operations'
};

export const DEFAULT_FACILITY_DETAILS: HRDocumentFacilityDetails = {
  facilityName: 'Zamzam Pharmacy - ADGM Main Medical Facility',
  facilityLicenseNo: 'MOHAP-FL-88201',
  dohMohapRegNo: 'DOH-REG-2026-991A',
  facilityLocation: 'Al Khatem Tower, ADGM Square, Abu Dhabi, UAE',
  clinicalWing: 'Clinical & Operational Governance Wing'
};

export const DEFAULT_RISK_COMMITTEE_CONTACTS: HRDocumentRiskCommitteeContacts = {
  committeeChair: 'Dr. Tariq Al-Mansoori (Risk Review Chair)',
  complianceOfficer: 'Huda K. Al-Hashemi (Governance Lead)',
  dutyOfficerPhone: '+971 2 600 8899',
  escalationEmail: 'risk-committee@zamzampharmacy.ae'
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
      companyName: 'Emirates Corporate Solutions LLC',
      tradeLicenseNo: 'CN-1029384',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'P.O. Box 45000, Al Khatem Tower, ADGM Square, Abu Dhabi, UAE'
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
      facilityName: 'Zamzam Pharmacy - ADGM Main Medical Facility',
      facilityLicenseNo: 'MOHAP-FL-88201',
      dohMohapRegNo: 'DOH-REG-2026-991A',
      facilityLocation: 'P.O. Box 45000, Al Khatem Tower, ADGM Square, Abu Dhabi, UAE',
      clinicalWing: 'Pharmacy & Clinical Quality Wing'
    },
    riskCommitteeContacts: {
      committeeChair: 'Dr. Tariq Al-Mansoori (Risk Review Committee Chair)',
      complianceOfficer: 'Huda K. Al-Hashemi (Senior Governance Lead)',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'risk-committee@zamzampharmacy.ae'
    },
    htmlContent: `<p>This Employee Confidentiality Agreement is executed by and between <strong>(Company Name)</strong> (the "Employer") and the Employee. The Employee acknowledges that during the course of employment at <strong>(Company Name)</strong>, they will have access to protected patient health information (PHI), MALAFFI EMR databases, proprietary clinical protocols, and internal network infrastructure.</p><p>The Employee agrees to maintain strict confidentiality and shall not disclose or transmit any proprietary information of <strong>(Company Name)</strong> to unauthorized third parties without prior written consent, in strict compliance with UAE Federal Decree-Law No. 45 on Personal Data Protection and DOH ADHICS security frameworks.</p>`,
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
      companyName: 'Emirates Corporate Solutions LLC',
      tradeLicenseNo: 'CN-1029384',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'P.O. Box 45000, Al Khatem Tower, ADGM Square, Abu Dhabi, UAE'
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
      facilityName: 'Zamzam Pharmacy - ADGM Main Medical Facility',
      facilityLicenseNo: 'MOHAP-FL-88201',
      dohMohapRegNo: 'DOH-REG-2026-991A',
      facilityLocation: 'P.O. Box 45000, Al Khatem Tower, ADGM Square, Abu Dhabi, UAE',
      clinicalWing: 'Pharmacy & Clinical Quality Wing'
    },
    riskCommitteeContacts: {
      committeeChair: 'Dr. Tariq Al-Mansoori (Risk Review Committee Chair)',
      complianceOfficer: 'Huda K. Al-Hashemi (Senior Governance Lead)',
      dutyOfficerPhone: '+971 2 600 8899',
      escalationEmail: 'risk-committee@zamzampharmacy.ae'
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
      companyName: 'Emirates Corporate Solutions LLC',
      tradeLicenseNo: 'CN-1029384',
      emirateJurisdiction: 'Abu Dhabi',
      registeredAddress: 'P.O. Box 45000, Al Khatem Tower, ADGM Square, Abu Dhabi, UAE'
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
      facilityName: 'Emirates Corporate Operations Center',
      facilityLicenseNo: 'MOHAP-FL-70211',
      dohMohapRegNo: 'DOH-REG-2026-440B',
      facilityLocation: 'Al Khatem Tower, ADGM Square, Abu Dhabi, UAE',
      clinicalWing: 'Cybersecurity & Internal Audit Wing'
    },
    riskCommitteeContacts: {
      committeeChair: 'Dr. Tariq Al-Mansoori (Risk Review Chair)',
      complianceOfficer: 'Fatima Al-Suwaidi (Risk Officer)',
      dutyOfficerPhone: '+971 2 600 7700',
      escalationEmail: 'audit-risk@emiratescorp.ae'
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
  }
];

export default function HrDocumentsHub({ client, currentUser, employees, onAddEmailLog }: HrDocumentsHubProps) {
  // Roster of registered employees from Employee & Operator Management
  const effectiveEmployees = React.useMemo(() => {
    if (employees && employees.length > 0) return employees;
    try {
      const saved = localStorage.getItem('sh_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load employee roster for HR Vault', e);
    }
    return INITIAL_EMPLOYEES;
  }, [employees]);

  const [documents, setDocuments] = useState<HRDocumentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((doc: any) => {
            const empDetails = {
              ...DEFAULT_EMPLOYEE_DETAILS,
              ...(doc.employeeDetails || {})
            };
            const legMetadata = {
              ...DEFAULT_LEGAL_METADATA,
              ...(doc.legalMetadata || {})
            };
            return {
              ...doc,
              legalMetadata: legMetadata,
              entityCredentials: {
                ...DEFAULT_ENTITY_CREDENTIALS,
                ...(doc.entityCredentials || {})
              },
              employeeDetails: empDetails,
              facilityDetails: doc.facilityDetails || DEFAULT_FACILITY_DETAILS,
              riskCommitteeContacts: doc.riskCommitteeContacts || DEFAULT_RISK_COMMITTEE_CONTACTS,
              employeeSignature: doc.employeeSignature || {
                signedBy: empDetails.fullLegalName || 'Employee',
                signerRole: 'Employee / Staff Member',
                signedAt: legMetadata.issueDate || new Date().toISOString().split('T')[0],
                isUaePassVerified: true,
                verificationHash: 'UAE-PASS-VERIFIED-EMP',
                ipAddress: '192.168.1.1'
              },
              employerSignature: doc.employerSignature || {
                signedBy: 'Authorized Employer Signatory',
                signerRole: 'HR / Operations Representative',
                signedAt: legMetadata.issueDate || new Date().toISOString().split('T')[0],
                isUaePassVerified: true,
                verificationHash: 'UAE-PASS-VERIFIED-EMP-EXEC',
                ipAddress: '192.168.1.1'
              }
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse HR Documents Vault state', e);
    }
    return SEED_HR_DOCUMENTS;
  });

  const [activeTab, setActiveTab] = useState<'vault' | 'import' | 'export' | 'create'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');

  // Auto-sync active facility filter when Facility Management active client changes
  useEffect(() => {
    if (client?.company_name) {
      setFacilityFilter(client.company_name);
    }
  }, [client?.company_name]);

  // Copy HR Documents from Al Nahda to (COMPLIANCE CONSULTANT)
  const copyDocumentsFromAlNahdaToComplianceConsultant = React.useCallback(() => {
    const consultantName = 'SmartPro Public Relations Consultancy & Cyber Risk Management Services';
    
    setDocuments(prevDocs => {
      const updatedPrevDocs = prevDocs.map(doc => {
        if (
          doc.entityCredentials?.companyName?.toLowerCase().includes('smartpro') ||
          doc.facilityDetails?.facilityName?.toLowerCase().includes('smartpro')
        ) {
          return {
            ...doc,
            facilityDetails: {
              ...doc.facilityDetails,
              facilityName: consultantName,
              facilityLicenseNo: '',
              dohMohapRegNo: '',
              clinicalWing: '',
              facilityLocation: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
            }
          };
        }
        return doc;
      });

      const existingTitles = new Set(
        updatedPrevDocs
          .filter(d => d.entityCredentials?.companyName === consultantName)
          .map(d => d.title)
      );

      const sourceDocs = updatedPrevDocs.filter(d => 
        d.entityCredentials?.companyName?.toLowerCase().includes('al nahda') ||
        d.facilityDetails?.facilityName?.toLowerCase().includes('al nahda') ||
        d.entityCredentials?.companyName?.toLowerCase().includes('emirates corporate') ||
        d.entityCredentials?.companyName?.toLowerCase().includes('zamzam')
      );

      const docsToCopy = sourceDocs.length > 0 ? sourceDocs : SEED_HR_DOCUMENTS;
      const newCopies: HRDocumentRecord[] = [];

      docsToCopy.forEach((doc, idx) => {
        if (!existingTitles.has(doc.title)) {
          newCopies.push({
            ...doc,
            id: `doc-sprc-copy-${Date.now()}-${idx}`,
            title: doc.title,
            entityCredentials: {
              ...doc.entityCredentials,
              companyName: consultantName,
              tradeLicenseNo: 'CN-1029384-SPRC',
              emirateJurisdiction: 'Abu Dhabi',
              registeredAddress: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
            },
            facilityDetails: {
              ...doc.facilityDetails,
              facilityName: consultantName,
              facilityLicenseNo: '',
              dohMohapRegNo: '',
              clinicalWing: '',
              facilityLocation: 'Al Mafraq, Abu Dhabi, United Arab Emirates'
            },
            updatedAt: new Date().toISOString()
          });
        }
      });

      if (newCopies.length === 0 && updatedPrevDocs === prevDocs) return prevDocs;

      const updatedList = [...updatedPrevDocs, ...newCopies];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save copied HR documents', e);
      }
      return updatedList;
    });
  }, []);

  useEffect(() => {
    copyDocumentsFromAlNahdaToComplianceConsultant();
  }, [copyDocumentsFromAlNahdaToComplianceConsultant]);

  // Fit to Page (A4 Scale Mode) state
  const [fitToPageA4, setFitToPageA4] = useState<boolean>(true);

  // Facility List Derived Options
  const facilityOptions = React.useMemo(() => {
    const list = new Set<string>();
    if (client?.company_name) list.add(client.company_name);
    effectiveEmployees.forEach(e => {
      if (e.branch_name) list.add(e.branch_name);
    });
    list.add('AL KHAJA MEDICAL CENTER');
    list.add('Al Khatem Medical Branch');
    list.add('Cleveland Clinic Abu Dhabi');
    list.add('HealthPoint Hospital Abu Dhabi');
    list.add('Al Zahra Hospital Dubai');
    return Array.from(list);
  }, [client, effectiveEmployees]);

  // Selected Document & Modal Controls
  const [selectedDoc, setSelectedDoc] = useState<HRDocumentRecord | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<HRDocumentRecord | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTotalScriptModal, setShowTotalScriptModal] = useState(false);
  const [inspectViewMode, setInspectViewMode] = useState<'a4-preview' | 'data-grid'>('a4-preview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
  const [newFacilityName, setNewFacilityName] = useState('Zamzam Pharmacy - ADGM Main Medical Facility');
  const [newFacilityLicenseNo, setNewFacilityLicenseNo] = useState('MOHAP-FL-88201');
  const [newDohMohapRegNo, setNewDohMohapRegNo] = useState('DOH-REG-2026-991A');
  const [newFacilityLocation, setNewFacilityLocation] = useState('Al Khatem Tower, ADGM Square, Abu Dhabi, UAE');
  const [newClinicalWing, setNewClinicalWing] = useState('Clinical & Operational Governance Wing');
  const [newCommitteeChair, setNewCommitteeChair] = useState('Dr. Tariq Al-Mansoori (Risk Review Chair)');
  const [newComplianceOfficer, setNewComplianceOfficer] = useState('Huda K. Al-Hashemi (Governance Lead)');
  const [newDutyOfficerPhone, setNewDutyOfficerPhone] = useState('+971 2 600 8899');
  const [newEscalationEmail, setNewEscalationEmail] = useState('risk-committee@zamzampharmacy.ae');
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

  // Filtered employees for Create Form based on selected facility / active tenant ("Facility Management" employees only)
  const filteredEmployeesForCreate = React.useMemo(() => {
    const selectedFac = newFacilityName || client?.company_name;
    if (!selectedFac || selectedFac === 'ALL') return effectiveEmployees;
    const target = selectedFac.trim().toLowerCase();
    const matches = effectiveEmployees.filter(emp => {
      const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
      if (!b) return true;
      return b === target || target.includes(b) || b.includes(target);
    });
    return matches;
  }, [effectiveEmployees, newFacilityName, client]);

  // Document Form Formatting & Interactive Toolbar State
  const [showCompanyEmployeeInfo, setShowCompanyEmployeeInfo] = useState(true);
  const [showRegulatorySignatoryControls, setShowRegulatorySignatoryControls] = useState(true);
  const [showOptionalEmiratesId, setShowOptionalEmiratesId] = useState(true);
  const [showOptionalHrManagerSignatory, setShowOptionalHrManagerSignatory] = useState(true);
  const [useManualSignatures, setUseManualSignatures] = useState(false);
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

  // Filtered employees for Edit Form based on selected facility / active tenant ("Facility Management" employees only)
  const filteredEmployeesForEdit = React.useMemo(() => {
    const selectedFac = editFacilityName || client?.company_name;
    if (!selectedFac || selectedFac === 'ALL') return effectiveEmployees;
    const target = selectedFac.trim().toLowerCase();
    const matches = effectiveEmployees.filter(emp => {
      const b = (emp.branch_name || emp.facility_name || '').trim().toLowerCase();
      if (!b) return true;
      return b === target || target.includes(b) || b.includes(target);
    });
    return matches;
  }, [effectiveEmployees, editFacilityName, client]);

  // Apply Document Reference Details from Loop Selector
  const handleApplyLoopToNewForm = (loopData: DocRefLoopData) => {
    setNewDocTitle(loopData.doc_name);
    setNewRefCode(loopData.ref_code);
    setNewVersionControl(loopData.version || 'v1.0 (Master Loop)');
    setNewIssueDate(loopData.issue_date);
    setNewDueDateForRevision(loopData.review_date);
    setNewApprovalDate(loopData.approval_date);
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
    setEditIssueDate(loopData.issue_date);
    setEditDueDateForRevision(loopData.review_date);
    setEditApprovalDate(loopData.approval_date);
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

  // Open Edit Document Modal
  const handleOpenEditModal = (doc: HRDocumentRecord) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocCategory(doc.category);
    setEditDocStatus(doc.status);
    setEditEmpName(doc.employeeDetails?.fullLegalName || '');
    setEditEmpId(doc.employeeDetails?.employeeId || '');
    setEditEmiratesId(doc.employeeDetails?.emiratesId || '');
    setEditPassportNumber(doc.employeeDetails?.passportNumber || '');
    setEditJobTitle(doc.employeeDetails?.jobTitle || '');
    setEditDept(doc.employeeDetails?.department || '');
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
    setEditIssueDate(doc.legalMetadata?.issueDate || new Date().toISOString().split('T')[0]);
    setEditDueDateForRevision(doc.legalMetadata?.dueDateForRevision || doc.legalMetadata?.nextReviewDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
    setEditApprovalDate(doc.legalMetadata?.approvalDate || doc.legalMetadata?.effectiveDate || new Date().toISOString().split('T')[0]);
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

    const updated: HRDocumentRecord = {
      ...editingDoc,
      title: editDocTitle,
      category: editDocCategory,
      status: editDocStatus,
      currentVersion: editVersionControl || editingDoc.currentVersion,
      updatedAt: new Date().toISOString(),
      legalMetadata: {
        ...DEFAULT_LEGAL_METADATA,
        ...(editingDoc.legalMetadata || {}),
        documentName: editDocTitle,
        referenceCode: editRefCode || editingDoc.legalMetadata?.referenceCode || 'REF-HR-0000',
        issueDate: editIssueDate || editingDoc.legalMetadata?.issueDate || '',
        nextReviewDate: editDueDateForRevision || editingDoc.legalMetadata?.nextReviewDate || '',
        dueDateForRevision: editDueDateForRevision || editingDoc.legalMetadata?.nextReviewDate || '',
        approvalDate: editApprovalDate || editingDoc.legalMetadata?.effectiveDate || '',
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

    setDocuments(prev => prev.map(d => d.id === editingDoc.id ? updated : d));
    if (selectedDoc && selectedDoc.id === editingDoc.id) {
      setSelectedDoc(updated);
    }
    setShowEditModal(false);
    setEditingDoc(null);
    setFormCopyPasteNotice(`✓ Document "${editDocTitle}" updated successfully in Vault Registry!`);
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

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {
      console.warn('Failed to save HR Documents to localStorage', e);
    }
  }, [documents]);

  const companyName = client?.company_name || 'Emirates Corporate Solutions LLC';
  const tradeLicense = client?.trade_license_no || 'CN-1029384';

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
    <h2 style="font-size: 14pt; margin-top: 10pt; color: #0f172a;">${getProcessedHtmlContent(doc.title, doc, companyName) || doc.title}</h2>
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
    ${getProcessedHtmlContent(doc.htmlContent, doc, companyName)}
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
        issueDate: newIssueDate || new Date().toISOString().split('T')[0],
        effectiveDate: newApprovalDate || new Date().toISOString().split('T')[0],
        nextReviewDate: newDueDateForRevision || '2027-07-28',
        dueDateForRevision: newDueDateForRevision || '2027-07-28',
        approvalDate: newApprovalDate || new Date().toISOString().split('T')[0],
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
        department: newDept || 'General Operations'
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

    setDocuments([createdDoc, ...documents]);
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
    const docToDelete = documents.find(d => d.id === id);
    if (docToDelete) {
      setDeletingDoc(docToDelete);
    }
  };

  const confirmDeleteDocument = () => {
    if (!deletingDoc) return;
    const targetId = deletingDoc.id;
    const targetTitle = deletingDoc.title;
    setDocuments(prev => prev.filter(d => d.id !== targetId));
    if (selectedDoc?.id === targetId) {
      setSelectedDoc(null);
      setShowPreviewModal(false);
    }
    setDeletingDoc(null);
    setFormCopyPasteNotice(`✓ Record "${targetTitle}" deleted from HR Vault.`);
    setTimeout(() => setFormCopyPasteNotice(null), 4000);
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
      facilityFilter.toLowerCase().includes((doc.entityCredentials?.companyName || '---').toLowerCase());

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
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
              HR Documents Hub & Vault
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Enterprise HR Document Repository under <span className="font-bold text-white">Document Repository & Version Control</span>. Features multi-format application ingestion, governance matrix loops, and full JSON/XML data transfer export packages.
            </p>
          </div>

          {/* Dual-Mode Signatory & Letterhead Toggles */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shrink-0 shadow-lg">
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

            <button
              type="button"
              onClick={() => {
                copyDocumentsFromAlNahdaToComplianceConsultant();
                setFormCopyPasteNotice('✓ Successfully copied HR documents from Al Nahda National Insurance Brokers to (COMPLIANCE CONSULTANT)!');
                setTimeout(() => setFormCopyPasteNotice(null), 4000);
              }}
              className="mt-2 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border border-emerald-400/40"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy HR Docs from Al Nahda to (COMPLIANCE CONSULTANT)</span>
            </button>
          </div>
        </div>
      </div>

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

        <button
          onClick={() => setShowTotalScriptModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
        >
          <Code className="w-4 h-4" /> Attach Total JSON Script (.json)
        </button>
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

          {/* VAULT TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  HR Documents Vault Registry ({filteredDocs.length} Active Records)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Click <span className="text-emerald-400 font-bold">Inspect</span> to view or export full document details.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="p-4">Reference & Title</th>
                    <th className="p-4">Employee Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No HR documents matched your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] text-emerald-400 font-bold block">
                              {doc.legalMetadata?.referenceCode || 'REF-HR-0000'}
                            </span>
                            <span className="font-black text-slate-100 text-sm block">{doc.title}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div>
                            <span className="font-bold text-slate-200 block">{doc.employeeDetails?.fullLegalName || 'Employee'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {doc.employeeDetails?.employeeId || 'N/A'} &bull; {doc.employeeDetails?.department || 'General'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 text-cyan-300 border border-slate-700">
                            {doc.category}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            doc.status === 'APPROVED_FROZEN'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {doc.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(doc)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                              title="Edit HR Document Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
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

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmDel = window.confirm(`Are you sure you want to delete "${doc.title}" (${doc.legalMetadata?.referenceCode || ''}) from the HR Vault?`);
                                if (confirmDel) {
                                  setDocuments(prev => prev.filter(d => d.id !== doc.id));
                                  if (selectedDoc?.id === doc.id) {
                                    setSelectedDoc(null);
                                    setShowPreviewModal(false);
                                  }
                                  setFormCopyPasteNotice(`✓ Document "${doc.title}" deleted from HR Vault.`);
                                  setTimeout(() => setFormCopyPasteNotice(null), 4000);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs cursor-pointer flex items-center gap-1 transition-all shadow-xs"
                              title="Delete Record from Vault"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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
                      {emp.employee_name} ({emp.employee_id}) • {emp.position || 'Staff'} • {emp.department || 'Operations'} ({emp.branch_name || 'Main Facility'})
                    </option>
                  ))}
                </select>
                <p className="text-[10.5px] text-slate-400 italic">Filtered by selected facility. Selecting a record auto-populates Legal Name, Employee ID, Job Designation, and Department.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Employee Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamdan Al-Nahyan"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
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

            {/* RISK REVIEW COMMITTEE FIELDSET */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Risk Review Committee / Authorized Personnel Contacts
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
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                    setShowPreviewModal(false);
                    handleOpenEditModal(selectedDoc);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md shadow-amber-950/30 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Document
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

                          return (
                            <div className="text-right space-y-0.5">
                              <h1 className="font-black text-slate-900 text-sm tracking-tight uppercase leading-snug">
                                {selectedDoc.facilityDetails?.facilityName || companyName || DEFAULT_FACILITY_DETAILS.facilityName}
                              </h1>
                              {!isSmartProDoc && (facLic || DEFAULT_FACILITY_DETAILS.facilityLicenseNo) ? (
                                <p className="text-[9.5px] text-emerald-900 font-extrabold">
                                  Facility Lic: <span className="font-mono text-slate-800">{facLic || DEFAULT_FACILITY_DETAILS.facilityLicenseNo}</span> &bull; DOH/MOHAP Reg: <span className="font-mono text-slate-800">{regNo || DEFAULT_FACILITY_DETAILS.dohMohapRegNo}</span>
                                </p>
                              ) : null}
                              {!isSmartProDoc && (
                                <p className="text-[9px] text-slate-600 font-semibold">
                                  Entity: <span className="font-bold text-slate-800">{selectedDoc.entityCredentials?.companyName || companyName}</span> (Trade Lic: <span className="font-mono">{selectedDoc.entityCredentials?.tradeLicenseNo || tradeLicense}</span>) &bull; Abu Dhabi, UAE
                                </p>
                              )}
                              <p className="text-[8.5px] text-slate-500 font-medium italic">
                                {selectedDoc.facilityDetails?.facilityLocation || DEFAULT_FACILITY_DETAILS.facilityLocation}
                                {!isSmartProDoc && (wing || DEFAULT_FACILITY_DETAILS.clinicalWing) ? ` \u2022 ${wing || DEFAULT_FACILITY_DETAILS.clinicalWing}` : ''}
                              </p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Document Title Banner */}
                      <div className="bg-slate-100 p-3 rounded border border-slate-200 text-center">
                        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight text-center font-bold">
                          {getProcessedHtmlContent(selectedDoc.title, selectedDoc, companyName) || selectedDoc.title}
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
                                <span className="font-bold text-slate-900">{selectedDoc.employeeDetails?.department || 'Operations'}</span>
                              </div>
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
                                          emiratesId: eid || selectedDoc.employeeDetails?.emiratesId || '784-1990-1234567-1'
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
                          dangerouslySetInnerHTML={{ __html: getProcessedHtmlContent(selectedDoc.htmlContent, selectedDoc, companyName) }}
                        />
                      </div>

                      {/* Signatures Row */}
                      {showRegulatorySignatoryControls && (
                        <div className="pt-2 border-t border-slate-200">
                          {/* Control Header Bar - Hidden during print */}
                          <div className="flex items-center justify-between mb-1.5 no-print print:hidden" data-no-print="true">
                            <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-wider">
                              Regulatory Signatory Controls
                            </h3>
                            <div className="flex items-center gap-3">
                              <label className="text-[9px] text-slate-600 font-extrabold flex items-center gap-1 cursor-pointer bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <input
                                  type="checkbox"
                                  checked={useManualSignatures}
                                  onChange={e => setUseManualSignatures(e.target.checked)}
                                  className="rounded accent-indigo-600"
                                />
                                <span>Manual Signature Line</span>
                              </label>

                              <label className="text-[9px] text-slate-500 font-bold flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={showOptionalHrManagerSignatory}
                                  onChange={e => setShowOptionalHrManagerSignatory(e.target.checked)}
                                  className="rounded accent-amber-600"
                                />
                                <span>Include HR Manager Signatory (Optional)</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => setShowRegulatorySignatoryControls(false)}
                                className="text-[9px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-700 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold transition-all cursor-pointer"
                                title="Disable / Hide Regulatory Signatory Controls section"
                              >
                                ✕ Disable Section
                              </button>
                            </div>
                          </div>

                          {useManualSignatures ? (
                            /* Manual Physical Signature Box Option */
                            <div className={`grid gap-2.5 ${showOptionalHrManagerSignatory ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                              {/* Employee Signatory Manual Box */}
                              <div className="p-2.5 border-2 border-slate-300 bg-white rounded space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-700 tracking-wider block">Employee Signatory</span>
                                <span className="font-extrabold text-slate-900 text-xs block">{selectedDoc.employeeSignature?.signedBy || selectedDoc.employeeDetails?.fullLegalName || 'Staff Member'}</span>
                                <div className="border-b-2 border-dashed border-slate-400 my-2 h-6 flex items-end">
                                  <span className="text-[7px] text-slate-400 italic">Physical Signature / Stamp</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] text-slate-600 font-mono pt-0.5">
                                  <span>Signed: ________________</span>
                                  <span>Date: ___/___/2026</span>
                                </div>
                              </div>

                              {/* Employer Signatory Manual Box */}
                              <div className="p-2.5 border-2 border-slate-300 bg-white rounded space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-700 tracking-wider block">Employer Signatory</span>
                                <span className="font-extrabold text-slate-900 text-xs block">{selectedDoc.employerSignature?.signedBy || 'Authorized Employer Signatory'}</span>
                                <div className="border-b-2 border-dashed border-slate-400 my-2 h-6 flex items-end">
                                  <span className="text-[7px] text-slate-400 italic">Physical Signature / Stamp</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px] text-slate-600 font-mono pt-0.5">
                                  <span>Signed: ________________</span>
                                  <span>Date: ___/___/2026</span>
                                </div>
                              </div>

                              {/* HR Manager Signatory (Optional) Manual Box */}
                              {showOptionalHrManagerSignatory && (
                                <div className="p-2.5 border-2 border-slate-300 bg-white rounded space-y-1">
                                  <span className="text-[8px] font-black uppercase text-slate-700 tracking-wider block flex items-center justify-between">
                                    <span>HR Manager Signatory</span>
                                    <span className="text-[7px] text-slate-500 font-normal italic no-print print:hidden">(Optional)</span>
                                  </span>
                                  <span className="font-extrabold text-slate-900 text-xs block">
                                    {selectedDoc.hrManagerSignature?.signedBy || 'Fatima Al-Suwaidi (HR Director)'}
                                  </span>
                                  <div className="border-b-2 border-dashed border-slate-400 my-2 h-6 flex items-end">
                                    <span className="text-[7px] text-slate-400 italic">Physical Signature / Stamp</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[8px] text-slate-600 font-mono pt-0.5">
                                    <span>Signed: ________________</span>
                                    <span>Date: ___/___/2026</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Digital Attestation Signature Box Option */
                            <div className={`grid gap-2.5 ${showOptionalHrManagerSignatory ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                              {/* Employee Signatory */}
                              <div className="p-2.5 border-2 border-emerald-600 bg-emerald-50/40 rounded space-y-1">
                                <span className="text-[8px] font-black uppercase text-emerald-800 tracking-wider block">Employee Signatory</span>
                                <span className="font-extrabold text-slate-900 text-xs block">{selectedDoc.employeeSignature?.signedBy || selectedDoc.employeeDetails?.fullLegalName || 'Staff Member'}</span>
                                <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 w-fit">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified & Attested
                                </div>
                                <p className="text-[8px] text-slate-500 font-mono">Signed: {selectedDoc.employeeSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</p>
                              </div>

                              {/* Employer Signatory */}
                              <div className="p-2.5 border-2 border-emerald-600 bg-emerald-50/40 rounded space-y-1">
                                <span className="text-[8px] font-black uppercase text-emerald-800 tracking-wider block">Employer Signatory</span>
                                <span className="font-extrabold text-slate-900 text-xs block">{selectedDoc.employerSignature?.signedBy || 'Authorized Employer Signatory'}</span>
                                <div className="flex items-center gap-1 text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 w-fit">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified & Attested
                                </div>
                                <p className="text-[8px] text-slate-500 font-mono">Signed: {selectedDoc.employerSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || '2026-08-01'}</p>
                              </div>

                              {/* HR Manager Signatory (Optional) */}
                              {showOptionalHrManagerSignatory && (
                                <div className="p-2.5 border-2 border-amber-600 bg-amber-50/40 rounded space-y-1">
                                  <span className="text-[8px] font-black uppercase text-amber-900 tracking-wider block flex items-center justify-between">
                                    <span>HR Manager Signatory</span>
                                    <span className="text-[7px] text-amber-700 font-normal italic no-print print:hidden">(Optional)</span>
                                  </span>
                                  <span className="font-extrabold text-slate-900 text-xs block">
                                    {selectedDoc.hrManagerSignature?.signedBy || 'Fatima Al-Suwaidi (HR Director)'}
                                  </span>
                                  <div className="flex items-center gap-1 text-[8px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 w-fit">
                                    <Award className="w-3 h-3 text-amber-600" /> HR ATTESTED
                                  </div>
                                  <p className="text-[8px] text-slate-500 font-mono">
                                    Signed: {selectedDoc.hrManagerSignature?.signedAt || selectedDoc.legalMetadata?.issueDate || ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
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
                      <ShieldCheck className="w-3.5 h-3.5" /> Risk Review Committee & Contacts
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
                  <label className="text-xs font-bold text-cyan-400 block mb-1">Form Issue Date</label>
                  <input
                    type="date"
                    value={editIssueDate}
                    onChange={e => setEditIssueDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-cyan-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-400 block mb-1">Form Due for Revision</label>
                  <input
                    type="date"
                    value={editDueDateForRevision}
                    onChange={e => setEditDueDateForRevision(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold"
                  />
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
                        {emp.employee_name} ({emp.employee_id}) • {emp.position || 'Staff'} • {emp.department || 'Operations'} ({emp.branch_name || 'Main Facility'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-400 italic">Filtered by selected facility. Selecting a record updates Employee Full Legal Name, Employee ID, Job Designation, and Department.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Employee Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editEmpName}
                    onChange={e => setEditEmpName(e.target.value)}
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

              {/* Risk Review Committee Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Risk Review Committee & Contacts
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
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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

    </div>
  );
}
