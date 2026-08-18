/**
 * Healthcare Legal Register & Compliance Management System - Initial Data and Types
 * Aligned with Department of Health (DOH) Abu Dhabi & Federal UAE Regulations
 */

export interface LegalRequirement {
  id: string;
  ref_no: string;
  name: string;
  authority: string;
  issue_date: string;
  last_updated: string;
  category: string;
  summary: string;
  official_link: string;
  compliance_status: 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable';
  responsible_person: 'Authorized Representative' | 'Medical Director';
  expiry_date?: string;
  evidence_file_name?: string;
  evidence_file_size?: string;
}

export interface CircularItem {
  id: string;
  circular_no: string;
  circular_name: string;
  date: string;
  circular_category: string;
  compliance_status: 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable';
  responsible_person: 'Authorized Representative' | 'Medical Director';
  evidence_file_name?: string;
  remarks?: string;
  target_date?: string;
  license_number?: string; // e.g. "MF000", "PF000", "MF1042", "All Branches (Group)"
  branch_name?: string;
}

export interface StandardItem {
  id: string;
  reference: string;
  standard_name: string;
  date: string;
  version?: string;
  doc_version?: string;
  standard_category?: string;
  compliance_status: 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable';
  responsible_person: 'Authorized Representative' | 'Medical Director';
  evidence_file_name?: string;
  remarks?: string;
  review_date?: string;
  license_number?: string; // e.g. "MF000", "PF000", "MF1042", "All Branches (Group)"
  branch_name?: string;
}

export interface ComplianceDoc {
  id: string;
  doc_name: string;
  ref_no: string;
  issue_date: string;
  expiry_date: string;
  responsible_person: 'Authorized Representative' | 'Medical Director';
  status: 'Valid' | 'Expired' | 'Renewal Due';
  version: string;
  revision_date: string;
  evidence_file_name?: string;
}

export interface RepoFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  sourceModule: string;
  associatedRef: string;
  contentBase64?: string;
}

export interface ComplianceAuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'SYNC' | 'EXPORT' | 'EMAIL';
  module: string;
  performedBy: string;
  role: string;
  timestamp: string;
  details: string;
  refNo?: string;
}

export interface RevisionHistoryLog {
  id: string;
  documentRef: string;
  documentName: string;
  version: string;
  revisionDate: string;
  changes: string;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
  nextReviewDate: string;
}

// 1. Initial UAE Legal Requirements List (13 major categories as requested)
export const INITIAL_LEGAL_REQUIREMENTS: LegalRequirement[] = [
  {
    id: 'lr_1',
    ref_no: 'UAE-DOH-LIC-01',
    name: 'Healthcare Facility Licensing Standards v4.0',
    authority: 'Department of Health (DOH Abu Dhabi)',
    issue_date: '2023-01-15',
    last_updated: '2025-06-10',
    category: 'Healthcare Licensing',
    summary: 'Establishes licensing frameworks, physical architectural standards, hygiene guidelines, and operational requirements for all outpatient clinics, medical centers, and hospitals in Abu Dhabi.',
    official_link: 'https://www.doh.gov.ae/en/resources/standards',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    expiry_date: '2027-01-15'
  },
  {
    id: 'lr_2',
    ref_no: 'UAE-MOHAP-LIA-02',
    name: 'Federal Decree-Law No. 4 of 2016 on Medical Liability',
    authority: 'Ministry of Health and Prevention (MOHAP)',
    issue_date: '2016-08-30',
    last_updated: '2024-11-20',
    category: 'Medical Liability Law',
    summary: 'Governs doctors responsibilities, patient safety standard practices, medical error investigation parameters, and legal frameworks for clinical negligence and liability insurance.',
    official_link: 'https://www.mohap.gov.ae/en/laws-and-legislation',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director'
  },
  {
    id: 'lr_3',
    ref_no: 'UAE-MOHRE-EMI-03',
    name: 'MOHRE Emiratisation Targets in Private Healthcare',
    authority: 'Ministry of Human Resources & Emiratisation (MOHRE)',
    issue_date: '2022-09-01',
    last_updated: '2025-12-31',
    category: 'UAE Labour Law',
    summary: 'Specifies Emiratisation hiring ratios for clinical and administrative staff in healthcare entities with more than 50 employees, including compliance checkpoints.',
    official_link: 'https://www.mohre.gov.ae/en/laws-and-regulations',
    compliance_status: 'Partially Compliant',
    responsible_person: 'Authorized Representative',
    expiry_date: '2026-10-31'
  },
  {
    id: 'lr_4',
    ref_no: 'UAE-DPA-2021',
    name: 'Federal Decree-Law No. 45 of 2021 on Personal Data Protection',
    authority: 'UAE Data Protection Law',
    issue_date: '2021-11-27',
    last_updated: '2024-05-14',
    category: 'UAE Data Protection Law',
    summary: 'Regulates processing, storage, and cross-border transfer of personal data of patients. Governs patient consent procedures and requirements for appointing Data Protection Officers (DPO).',
    official_link: 'https://u.ae/en/about-the-uae/strategies-initiatives-and-laws/laws/data-privacy-law',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Authorized Representative'
  },
  {
    id: 'lr_5',
    ref_no: 'UAE-CYBER-SEC-05',
    name: 'National Cybersecurity Standards for Health Information (ADHICS v2)',
    authority: 'UAE Cyber Security',
    issue_date: '2020-03-01',
    last_updated: '2025-01-15',
    category: 'UAE Cyber Security',
    summary: 'Abu Dhabi Healthcare Information and Cyber Security (ADHICS) standard governs patient electronic medical records security, risk assessments, firewalls, and encryption.',
    official_link: 'https://www.doh.gov.ae/en/programs-initiatives/adhics',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Authorized Representative'
  },
  {
    id: 'lr_6',
    ref_no: 'UAE-LAB-LAW-33',
    name: 'Employment Relationships Law (Federal Decree-Law No. 33 of 2021)',
    authority: 'Ministry of Human Resources & Emiratisation (MOHRE)',
    issue_date: '2021-09-20',
    last_updated: '2024-08-01',
    category: 'UAE Labour Law',
    summary: 'Specifies medical staff employment contracts, legal working hours, overtime compensation, sick leaves, maternity leaves, and termination procedures.',
    official_link: 'https://www.mohre.gov.ae',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Authorized Representative'
  },
  {
    id: 'lr_7',
    ref_no: 'UAE-INS-LAW-23',
    name: 'Abu Dhabi Health Insurance Law No. 23 of 2005',
    authority: 'Department of Health (DOH Abu Dhabi)',
    issue_date: '2005-11-12',
    last_updated: '2024-03-22',
    category: 'Health Insurance',
    summary: 'Mandates compulsory health insurance cover for all resident employees, dependents, and authorized visitors. Outlines claims processing and billing audits.',
    official_link: 'https://www.doh.gov.ae/en/resources/regulations',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Authorized Representative'
  },
  {
    id: 'lr_8',
    ref_no: 'UAE-OSH-SF-15',
    name: 'Abu Dhabi Occupational Safety and Health System Framework (OSHAD)',
    authority: 'Occupational Health & Safety',
    issue_date: '2015-05-10',
    last_updated: '2025-04-12',
    category: 'Occupational Health & Safety',
    summary: 'Establishes risk assessment protocols, ergonomic clinic layouts, sharps disposal guidelines, chemical safety protocols, and emergency evacuation drills in clinics.',
    official_link: 'https://www.oshad.ae/en/framework',
    compliance_status: 'Partially Compliant',
    responsible_person: 'Authorized Representative',
    expiry_date: '2026-11-15'
  },
  {
    id: 'lr_9',
    ref_no: 'UAE-IPC-STD-09',
    name: 'Infection Prevention and Control Standards for Outpatient Facilities',
    authority: 'Department of Health (DOH Abu Dhabi)',
    issue_date: '2018-02-15',
    last_updated: '2025-02-10',
    category: 'Infection Control',
    summary: 'Mandates sterile processing of instruments, high-level disinfection protocols, autoclave validations, hand hygiene compliance audits, and nurse immunization records.',
    official_link: 'https://www.doh.gov.ae/en/resources/standards',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director'
  },
  {
    id: 'lr_10',
    ref_no: 'UAE-WASTE-ENV-10',
    name: 'Abu Dhabi Medical Waste Handling and Disposal Regulations',
    authority: 'Waste Management',
    issue_date: '2014-06-18',
    last_updated: '2025-09-01',
    category: 'Waste Management',
    summary: 'Establishes strict tracking logs for yellow clinical waste bags, red sharps containers, chemical wastes, and contracts with authorized environmental waste collectors (Averda).',
    official_link: 'https://www.tadweer.gov.ae',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Authorized Representative',
    expiry_date: '2026-10-31'
  },
  {
    id: 'lr_11',
    ref_no: 'UAE-FANR-RAD-11',
    name: 'FANR-REG-24 Radiation Safety & Shielding Regulations',
    authority: 'Radiation Safety',
    issue_date: '2012-08-10',
    last_updated: '2024-03-12',
    category: 'Radiation Safety',
    summary: 'Federal Authority for Nuclear Regulation (FANR) mandates dental clinic X-ray shielding, lead aprons calibration, annual dosimeter badges monitoring, and officer certifications.',
    official_link: 'https://www.fanr.gov.ae',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    expiry_date: '2027-03-10'
  },
  {
    id: 'lr_12',
    ref_no: 'UAE-FED-LAW-13-2020',
    name: 'Federal Law No. (13) of 2020 on Public Health',
    authority: 'Ministry of Health and Prevention (MOHAP)',
    issue_date: '2020-05-18',
    last_updated: '2025-01-10',
    category: 'Public Health & Communicable Diseases',
    summary: 'Establishes public health regulations, disease prevention protocols, mandatory communicable disease reporting, isolation/quarantine parameters, and health monitoring obligations for healthcare facilities across the UAE.',
    official_link: 'https://www.mohap.gov.ae/en/laws-and-legislation',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    expiry_date: '2027-05-18'
  },
  {
    id: 'lr_13',
    ref_no: 'UAE-FED-LAW-05-2019',
    name: 'Federal Law No. (5) of 2019 Regulating the Practice of the Medical Profession',
    authority: 'Ministry of Health and Prevention (MOHAP)',
    issue_date: '2019-03-25',
    last_updated: '2024-10-15',
    category: 'Medical Profession & Clinical Ethics',
    summary: 'Regulates professional medical practice, licensing standards, practitioner scopes of duties, medical codes of ethics, patient rights, and disciplinary procedures for healthcare professionals in the UAE.',
    official_link: 'https://www.mohap.gov.ae/en/laws-and-legislation',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    expiry_date: '2027-03-25'
  }
];

// 2. Initial DOH Circulars List
export const INITIAL_CIRCULARS: CircularItem[] = [
  {
    id: 'c_1',
    circular_no: 'DOH/CIRC/2026/012',
    circular_name: 'Mandatory Malaffi EMR Integration for Allied Dental and Derma Clinics',
    date: '2026-02-15',
    circular_category: 'Information Technology / EMR',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    remarks: 'API bridges deployed, all active healthcare providers trained on electronic consent capture.',
    target_date: '2026-06-30',
    license_number: 'MF000'
  },
  {
    id: 'c_2',
    circular_no: 'DOH/CIRC/2026/045',
    circular_name: 'Updated Infection Control Vaccination Protocols for Nursing and Surgical Staff',
    date: '2026-04-10',
    circular_category: 'Infection Control / Clinical',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    remarks: 'Staff immunizations up to date. Annual flu and hepatitis booster records logged.',
    target_date: '2026-05-15',
    license_number: 'MF000'
  },
  {
    id: 'c_3',
    circular_no: 'DOH/CIRC/2026/089',
    circular_name: 'Revised Patient Medical Record Retention and Archiving Periods',
    date: '2026-06-01',
    circular_category: 'Administration / Legal',
    compliance_status: 'Partially Compliant',
    responsible_person: 'Authorized Representative',
    remarks: 'Physical archive contract signed. Digital records migration under process.',
    target_date: '2026-09-30',
    license_number: 'PF000'
  },
  {
    id: 'c_4',
    circular_no: 'DOH/CIRC/2026/104',
    circular_name: 'Mandatory Professional Indemnity Insurance for Visiting Clinical Consultants',
    date: '2026-07-15',
    circular_category: 'Licensing / Insurance',
    compliance_status: 'Non-Compliant',
    responsible_person: 'Authorized Representative',
    remarks: 'Reviewing policies for 3 newly joined visiting oral surgeons.',
    target_date: '2026-08-15',
    license_number: 'All Branches (Group)'
  }
];

// 3. Initial DOH Standards List
export const INITIAL_STANDARDS: StandardItem[] = [
  {
    id: 's_1',
    reference: 'DOH-STD-POL-001',
    standard_name: 'Patient Rights & Informed Consent Standard v2.1',
    date: '2024-01-10',
    version: '2.1',
    standard_category: 'Patient Care & Rights',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    remarks: 'Forms updated in Arabic and English, displayed clearly in reception and treatment rooms.',
    review_date: '2027-01-10',
    license_number: 'MF000'
  },
  {
    id: 's_2',
    reference: 'DOH-STD-RAD-004',
    standard_name: 'OPG Radiation Protection and Diagnostic Shielding Protocol',
    date: '2024-08-15',
    version: '1.2',
    standard_category: 'Radiation & Safety',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    remarks: 'FANR shield report is active, lead partitions are calibrated, badges measured quarterly.',
    review_date: '2026-08-15',
    license_number: 'MF000'
  },
  {
    id: 's_3',
    reference: 'DOH-STD-EMR-012',
    standard_name: 'Emergency Response Crash Cart Equipment and Meds Standard',
    date: '2025-03-20',
    version: '1.0',
    standard_category: 'Emergency & Safety',
    compliance_status: 'Fully Compliant',
    responsible_person: 'Medical Director',
    remarks: 'Crash cart audit logs maintained daily by the head nurse. Defibrillator tested.',
    review_date: '2026-03-20',
    license_number: 'PF000'
  },
  {
    id: 's_4',
    reference: 'DOH-STD-LAB-007',
    standard_name: 'Diagnostic Dental Laboratory Quality Assurance Standard',
    date: '2025-05-11',
    version: '1.1',
    standard_category: 'Laboratory & Quality',
    compliance_status: 'Partially Compliant',
    responsible_person: 'Medical Director',
    remarks: 'In-house CAD-CAM milling machine calibration scheduled for Q3.',
    review_date: '2026-05-11',
    license_number: 'All Branches (Group)'
  }
];

// 4. Initial Mandatory Compliance Documents List (Module 4)
export const INITIAL_COMPLIANCE_DOCUMENTS: ComplianceDoc[] = [
  {
    id: 'cd_1',
    doc_name: 'DOH Facility License',
    ref_no: 'LIC-DOH-74920',
    issue_date: '2025-08-01',
    expiry_date: '2026-08-01',
    responsible_person: 'Medical Director',
    status: 'Renewal Due',
    version: '4.0',
    revision_date: '2025-08-01'
  },
  {
    id: 'cd_2',
    doc_name: 'Commercial Trade License (Abu Dhabi DED)',
    ref_no: 'CN-1030053',
    issue_date: '2025-09-12',
    expiry_date: '2026-09-12',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '11.0',
    revision_date: '2025-09-12'
  },
  {
    id: 'cd_3',
    doc_name: 'Malaffi Active Platform Registration',
    ref_no: 'MAL-REG-2024-83',
    issue_date: '2024-01-15',
    expiry_date: '2027-01-15',
    responsible_person: 'Medical Director',
    status: 'Valid',
    version: '2.0',
    revision_date: '2024-01-15'
  },
  {
    id: 'cd_4',
    doc_name: 'Medical Waste Disposal Contract (Averda)',
    ref_no: 'CONT-A-39420',
    issue_date: '2025-11-01',
    expiry_date: '2026-11-01',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '3.0',
    revision_date: '2025-11-01'
  },
  {
    id: 'cd_5',
    doc_name: 'Civil Defense Certificate (ADCD)',
    ref_no: 'ADCD-F-9402',
    issue_date: '2025-10-20',
    expiry_date: '2026-10-20',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '5.0',
    revision_date: '2025-10-20'
  },
  {
    id: 'cd_6',
    doc_name: 'Medical Chamber Compliance Certificate (MCC)',
    ref_no: 'MCC-AUH-3042',
    issue_date: '2025-04-05',
    expiry_date: '2026-04-05',
    responsible_person: 'Medical Director',
    status: 'Expired',
    version: '1.0',
    revision_date: '2025-04-05'
  },
  {
    id: 'cd_7',
    doc_name: 'FANR Radiation Safety License',
    ref_no: 'FANR-RAD-2930',
    issue_date: '2024-03-10',
    expiry_date: '2027-03-10',
    responsible_person: 'Medical Director',
    status: 'Valid',
    version: '2.0',
    revision_date: '2024-03-10'
  },
  {
    id: 'cd_8',
    doc_name: 'Staff Health Insurance Policy',
    ref_no: 'INS-GRP-9482',
    issue_date: '2025-12-15',
    expiry_date: '2026-12-15',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '6.0',
    revision_date: '2025-12-15'
  },
  {
    id: 'cd_9',
    doc_name: 'Occupational Health Staff Records',
    ref_no: 'OSH-REC-2025',
    issue_date: '2025-01-10',
    expiry_date: '2026-12-31',
    responsible_person: 'Medical Director',
    status: 'Valid',
    version: '3.0',
    revision_date: '2025-01-10'
  },
  {
    id: 'cd_10',
    doc_name: 'Corporate Patient Data Privacy Policy',
    ref_no: 'POL-DP-012',
    issue_date: '2024-11-27',
    expiry_date: '2026-11-27',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '2.0',
    revision_date: '2024-11-27'
  },
  {
    id: 'cd_11',
    doc_name: 'Facility Risk Register v2.0',
    ref_no: 'CMP-RISK-2026',
    issue_date: '2026-01-01',
    expiry_date: '2026-12-31',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '2.0',
    revision_date: '2026-01-01'
  },
  {
    id: 'cd_12',
    doc_name: 'ISO 27001 Security Certificate',
    ref_no: 'ISO-27001-4920',
    issue_date: '2023-12-21',
    expiry_date: '2026-12-21',
    responsible_person: 'Authorized Representative',
    status: 'Valid',
    version: '1.0',
    revision_date: '2023-12-21'
  }
];

// 5. Initial Revision History Logs (Module 7)
export const INITIAL_REVISION_LOGS: RevisionHistoryLog[] = [
  {
    id: 'rev_1',
    documentRef: 'LIC-DOH-74920',
    documentName: 'DOH Facility License',
    version: '4.0',
    revisionDate: '2025-08-01',
    changes: 'Annual clinic facility license renewal approved by DOH inspector after site inspection.',
    preparedBy: 'Sarah Jenkins (Compliance Officer)',
    reviewedBy: 'Authorized Representative',
    approvedBy: 'Medical Director',
    nextReviewDate: '2026-08-01'
  },
  {
    id: 'rev_2',
    documentRef: 'MAL-REG-2024-83',
    documentName: 'Malaffi Active Platform Registration',
    version: '2.0',
    revisionDate: '2024-01-15',
    changes: 'Updated clinic nodes to support dentists and allied specialists. Security firewalls validated.',
    preparedBy: 'Sarah Jenkins (Compliance Officer)',
    reviewedBy: 'Authorized Representative',
    approvedBy: 'Medical Director',
    nextReviewDate: '2027-01-15'
  },
  {
    id: 'rev_3',
    documentRef: 'ADCD-F-9402',
    documentName: 'Civil Defense Certificate (ADCD)',
    version: '5.0',
    revisionDate: '2025-10-20',
    changes: 'Bi-annual fire safety equipment overhaul and alarm calibration signed-off by civil defense engineer.',
    preparedBy: 'Sarah Jenkins (Compliance Officer)',
    reviewedBy: 'Authorized Representative',
    approvedBy: 'Medical Director',
    nextReviewDate: '2026-10-20'
  }
];

// 6. Initial Audit logs
export const INITIAL_COMPLIANCE_AUDIT_LOGS: ComplianceAuditLog[] = [
  {
    id: 'cal_1',
    action: 'SYNC',
    module: 'UAE Legal Register',
    performedBy: 'Sarah Jenkins',
    role: 'SUPER_ADMIN',
    timestamp: '2026-07-21T06:00:00-07:00',
    details: 'Triggered auto-synchronization with DOH Abu Dhabi and MOHAP official circular feeds.',
    refNo: 'ALL'
  },
  {
    id: 'cal_2',
    action: 'UPDATE',
    module: 'Compliance Document Register',
    performedBy: 'Sarah Jenkins',
    role: 'SUPER_ADMIN',
    timestamp: '2026-07-21T05:12:00-07:00',
    details: 'Modified status of DOH Facility License (LIC-DOH-74920) to Renewal Due (expires in 11 days).',
    refNo: 'LIC-DOH-74920'
  }
];
