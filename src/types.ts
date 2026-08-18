/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT_ADMIN' | 'AUDITOR' | 'READ_ONLY';

export interface BranchLocation {
  id: string;
  name: string;
  license_no: string;
}

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  designation?: string;
  signature_image?: string; // Base64 or DataURL of signature (.png)
}

export interface ThirdPartySupport {
  id?: string;
  team_name: string;
  email: string;
  phone: string;
  service_type?: string; // e.g. "Primary EMR / EHR", "Malaffi Integrator", "LIMS / Lab System", "PACS / Radiology", "Claims / Billing"
  contact_person?: string;
  notes?: string;
}

export type DocumentStorageProvider = 'LOCAL_PC' | 'GOOGLE_DRIVE' | 'DROPBOX' | 'ONE_DRIVE';

export interface StorageConfig {
  provider: DocumentStorageProvider;
  local_folder_path?: string; // Local PC folder directory location (e.g. C:\SmartHub_Documents\Client_Folder)
  cloud_account_email?: string;
  cloud_folder_name?: string;
  connected_status?: 'CONNECTED' | 'DISCONNECTED' | 'PENDING_AUTHORIZATION';
  last_synced_at?: string;
  sync_documents?: boolean;
}

export interface Client {
  id: string;
  client_code: string;
  company_name: string;
  trade_license_no?: string;
  license_expiry?: string;
  facility_type?: string;
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  compliance_framework?: string; // ISO 27001, NABIDH, MALAFFI, DOH Abu Dhabi, etc.
  framework_group?: 'Basic' | 'Transmission' | 'Advance' | string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  last_login?: string; // Client last login timestamp
  doh_license_no?: string;
  owner_name?: string;
  owner_email?: string;
  facility_stamp?: string;
  facility_logo?: string;
  logo_url?: string;
  license_number?: string;
  logo_placement?: 'FULL' | 'LEFT' | 'RIGHT';
  footer_placement?: 'FULL' | 'LEFT' | 'RIGHT';
  footer_logo?: string;
  show_footer_address?: boolean;
  show_footer_logo?: boolean;
  header_display_mode?: 'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY';
  show_reviewed_by?: boolean;
  is_group?: boolean;
  parent_id?: string;
  letterhead_image?: string; // Base64 or DataURL of custom letterhead (PDF/JPEG/PNG)

  // Document Storage Provider Settings
  storage_config?: StorageConfig;
  
  // New Facility Management fields
  clone_source_id?: string;
  structure_classification?: 'SINGLE' | 'GROUP';
  all_branches_active?: boolean;
  facility_group_name?: string;
  branches?: BranchLocation[];
  
  // Facility Committee Signatory Controls
  auth_representative?: ContactPerson;
  clinic_manager?: ContactPerson;
  medical_director?: ContactPerson;
  it_manager?: ContactPerson;
  hr_manager?: ContactPerson;
  
  // Third-Party Support Channels
  it_support?: ThirdPartySupport;
  emr_support?: ThirdPartySupport;
  emr_vendors?: ThirdPartySupport[]; // Multi-vendor EMR support channels (e.g. Primary EMR, Malaffi, LIMS, PACS, etc.)
  it_vendors?: ThirdPartySupport[];  // Multi-vendor IT support channels

  // Document Metadata
  doc_ref?: string;
  doc_classification?: string;
  doc_issue_date?: string;
  doc_approved_date?: string;
  doc_version?: string;
  doc_owner?: string;
  doc_approved_by?: string;
  auth_rep_signature?: string;

  // Risk ID Naming Options
  risk_id_prefix?: string;
  risk_id_start_index?: number;
  risk_id_padding?: number;

  // Client Admin access details
  client_admin_contact?: {
    name: string;
    email: string;
    phone: string;
  };

  // Client Specific Policy Exclusions / Non-Applicable Policies
  not_applicable_policy_ids?: string[];

  // Version History
  version_history?: {
    version: string;
    date: string;
    author: string;
    changes: string;
  }[];
}

export type AccessPermission = 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY';
export type ModuleAccessLevel = 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY' | 'NO_ACCESS';

export interface UserPermissions {
  can_edit: boolean;
  can_view: boolean;
  can_print: boolean;
}

export interface User {
  id: string;
  client_id?: string;
  tenant_id?: string;
  role: UserRole;
  full_name: string;
  name?: string;
  email: string;
  mobile?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  mfa_enabled?: boolean;
  mfa_secret?: string;
  allowed_tabs?: string[];
  access_level?: AccessPermission;
  permissions?: UserPermissions;
  module_access?: Record<string, ModuleAccessLevel>;
}

export interface ChatMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  recipient_email?: string;
  content: string;
  timestamp: string;
  is_admin?: boolean;
}

export interface Policy {
  scope_clause_1?: string;
  scope_clause_2?: string;
  scope_clause_3?: string;
  
  // New detailed policy sheet fields
  objective?: string;
  scope?: string;
  resp_it_manager?: string;
  resp_md?: string;
  resp_all_users?: string;
  policy_statement?: string;
  core_principles?: string;
  compliance_disciplinary?: string;
  compliance_clarifications?: string;
  compliance_checks?: string;
  compliance_exceptions?: string;

  id: string;
  client_id: string;
  policy_no: string;
  policy_name: string;
  version: string;
  review_date: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'EXPIRED' | 'FROZEN' | string;
  is_frozen?: boolean;
  document_path?: string;
  category: string;
  created_at: string;
  updated_at?: string;
  department?: string;
  document_type?: 'Policy' | 'Procedure' | 'Form' | 'Guideline' | 'Record';
  approval_date?: string;
  issue_date?: string;
  next_due_date?: string;
  type?: string;
  effective_date?: string;
  revision_date?: string;
  next_review_date?: string;
  review_frequency?: string;
  retention_period?: string;
  owner?: string;
  author?: string;
  approved_by?: string;
  prepared_by?: string;
  reviewed_by?: string;
  facility_name?: string;
  company_name?: string;
  reviewed_by_name?: string;
  reviewed_by_designation?: string;
  approved_by_name?: string;
  approved_by_designation?: string;
  classification?: 'Confidential' | 'Restricted' | 'Secret' | string;
  prepared_by_sign?: string;
  reviewed_by_sign?: string;
  approved_by_sign?: string;
  prepared_by_name?: string;
  prepared_by_designation?: string;
  layout_format?: 'box' | 'table';
  full_content?: string;
  doc_theme_color?: 'emerald' | 'blue' | 'teal' | 'crimson' | 'slate';
  doc_font_size?: 'small' | 'normal' | 'medium' | 'large';
  show_reviewed_by?: boolean;
  additional_by_name?: string;
  additional_by_designation?: string;
  framework_group?: 'Basic' | 'Transmission' | 'Advance' | string;
  additional_by_sign?: string;
  show_additional_by?: boolean;
  not_applicable_clients?: string[];
  is_applicable?: boolean;
  non_applicable_reason?: string;
  version_history?: {
    version: string;
    date: string;
    author: string;
    changes: string;
  }[];
}

export interface PolicyAcknowledgement {
  id: string;
  policy_id: string;
  user_id: string;
  acknowledgement_date?: string;
  status: 'PENDING' | 'ACKNOWLEDGED';
}

export interface RiskItem {
  id: string;
  client_id: string;
  risk_id: string;
  risk_title: string;
  asset_name: string;
  threat: string;
  vulnerability: string;
  impact: number; // 1-5
  likelihood: number; // 1-5
  risk_rating: number; // impact * likelihood
  existing_controls: string;
  treatment_plan: string;
  risk_owner: string;
  review_date: string;
  status: 'OPEN' | 'TREATMENT_PLAN' | 'ACCEPTED' | 'CLOSED';
  created_at?: string;

  // High-fidelity compliance extensions
  domain?: string;
  mitigation_status?: 'Open' | 'In progress' | 'Treated' | 'Closed';
  record_status?: 'Active' | 'Deactivated';
  treatment_option?: 'Reduction' | 'Avoidance' | 'Transfer' | 'Retention';
  identification_date?: string;
  target_closing_date?: string;
  residual_likelihood?: number;
  residual_impact?: number;
  residual_risk_rating?: number;
  recurrence?: 'Ongoing' | 'One-time' | 'Annual' | 'Quarterly';
  next_review_date?: string;
  c_val?: number;
  i_val?: number;
  a_val?: number;
  asset_value?: number;
  asset_category?: 'Physical Assets' | 'Digital Assets Risks';
  asset_code?: string;
}

export interface Asset {
  id: string;
  client_id: string;
  asset_code: string;
  asset_name: string;
  asset_type: 'IT Asset' | 'Biomedical Asset' | 'Software Asset' | 'Physical Asset';
  asset_category: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  asset_owner: string;
  classification: 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';
  location: string;
  purchase_date?: string;
  warranty_expiry?: string;
  eol_date?: string;
  eos_date?: string;
  ppm_date?: string; // Planned Preventive Maintenance
  ppm_due_date?: string;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED' | 'STOLEN_LOST';
  remarks?: string;
  created_at?: string;

  // New fields requested by user
  operating_system?: string;
  asset_operator?: string;
  version?: string;
  department?: string;

  // CIA Values (1-5)
  c_val?: number;
  i_val?: number;
  a_val?: number;

  // Verification fields
  is_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
}

export interface Incident {
  id: string;
  client_id: string;
  incident_no: string;
  incident_title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  root_cause?: string;
  corrective_action?: string;
  incident_owner: string;
  reported_date: string;
  closed_date?: string;
  closure_status: 'OPEN' | 'INVESTIGATING' | 'CORRECTIVE_ACTION' | 'CLOSED';
  created_at: string;
}

export interface Audit {
  id: string;
  client_id: string;
  audit_number: string;
  audit_type: 'INTERNAL' | 'EXTERNAL' | 'REGULATORY';
  audit_scope: string;
  auditor_name: string;
  audit_date: string;
  report_path?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  finding_no: string;
  finding_description: string;
  finding_type: 'NC_MAJOR' | 'NC_MINOR' | 'OFI'; // Non-Compliance Major/Minor, Opportunity for Improvement
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  status: 'OPEN' | 'RESOLVING' | 'CLOSED';
}

export interface CorrectiveAction {
  id: string;
  client_id: string;
  source_type: 'AUDIT_FINDING' | 'INCIDENT' | 'RISK_REVIEW' | 'OTHER';
  source_reference: string; // e.g. AUD-001-F01 or INC-2026-003
  finding: string;
  root_cause: string;
  action_plan: string;
  responsible_person: string;
  target_date: string;
  completion_date?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  created_at: string;
}

export interface ComplianceForm {
  id: string;
  client_id: string;
  form_name: string;
  form_type: string;
  version: string;
  document_path?: string;
  review_date?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'UNDER_REVIEW';
  
  // Document Control & Indexing Metadata
  doc_ref?: string;
  category?: 'Onboarding' | 'Offboarding' | 'IT Security' | 'HR Compliance' | 'Change Control' | 'General' | string;
  issue_date?: string;
  expiry_date?: string;
  classification?: 'CONFIDENTIAL' | 'RESTRICTED' | 'INTERNAL' | 'STRICTLY CONFIDENTIAL' | string;
  prepared_by?: string;
  approved_by?: string;
  description?: string;
  total_submissions?: number;
  header_footer_config?: {
    show_logo?: boolean;
    show_stamp?: boolean;
    footer_text?: string;
    classification_badge?: string;
  };

  // Sample .doc / .docx Document Template Attachment
  sample_doc_name?: string;
  sample_doc_url?: string;
  sample_doc_size?: string;
  sample_doc_type?: string;
  sample_doc_uploaded_at?: string;
  sample_doc_text_content?: string;
}

export type DocumentCategoryType = 'Policies' | 'Procedures' | 'Forms' | 'Templates' | 'Registers';
export type MasterClassification = 'Secret' | 'Confidential' | 'Restricted' | 'Public' | 'Internal' | 'CONFIDENTIAL' | 'RESTRICTED';
export type MasterDocStatus = 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Obsolete' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'EXPIRED';

export interface VersionRecord {
  id: string;
  version_number: string;
  revision_date: string;
  changed_by: string;
  change_description: string;
  approved_by?: string;
  approval_date?: string;
  file_url?: string;
  file_name?: string;
  mapped_risk_ids?: string[];
  mapped_asset_ids?: string[];
  mapped_doc_ids?: string[];
}

export interface MasterDocument {
  id: string;
  client_id: string;
  document_id: string;
  document_number: string;
  document_name: string;
  category: DocumentCategoryType;
  sub_category?: string;
  main_category?: string;
  department: string;
  owner: string;
  version: string;
  version_history: VersionRecord[];
  classification: MasterClassification;
  status: MasterDocStatus;
  prepared_by: string;
  reviewed_by: string;
  approved_by: string;
  issue_date: string;
  effective_date: string;
  revision_date?: string;
  next_review_date: string;
  approval_date?: string;
  review_frequency?: string;
  retention_period?: string;
  document_location: string;
  document_reference?: string;
  page_format?: 'A4 Portrait' | 'A4 Landscape';
  due_date?: string;
  file_attachment_name?: string;
  file_attachment_url?: string;
  file_size?: string;
  sample_doc_name?: string;
  sample_doc_url?: string;
  current_revision: string;
  change_summary?: string;
  remarks?: string;
  source_type?: 'POLICY' | 'FORM' | 'REPOSITORY' | 'REGISTER' | 'DIRECT' | 'FACILITY_CONTACTS';
  source_id?: string;
  mapped_risk_ids?: string[];
  mapped_asset_ids?: string[];
  mapped_incident_ids?: string[];
  mapped_doc_ids?: string[];
  mapped_legal_ids?: string[];
  mapped_employee_ids?: string[];
  mapped_security_zone_ids?: string[];
  mapped_contract_ids?: string[];
  framework_group?: 'Basic' | 'Transmission' | 'Advance' | string;
  created_at: string;
  updated_at: string;
}

export interface DocumentMapping {
  doc_id: string;
  risk_ids: string[];
  asset_ids?: string[];
  incident_ids?: string[];
  doc_ids?: string[];
  legal_ids?: string[];
  employee_ids?: string[];
  security_zone_ids?: string[];
  contract_ids?: string[];
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  client_id?: string;
  document_name?: string;
  document_type?: string; // PDF, DOCX, XLSX
  version?: string;
  storage_path?: string;
  approval_status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  expiry_date?: string;
  uploaded_by?: string; // User ID
  uploaded_by_name?: string;
  uploaded_at?: string;
  department?: string;
  doc_type_category?: 'Policy' | 'Procedure' | 'Form' | 'Guideline' | 'Record';
  document_code?: string;
  code?: string;
  category?: string;
  status?: string;
  type?: string;
  effective_date?: string;
  owner?: string;
  approval_date?: string;
  issue_date?: string;
  review_date?: string;
  next_due_date?: string;
  reviewed_by_name?: string;
  reviewed_by_designation?: string;
  approved_by_name?: string;
  approved_by_designation?: string;
  classification?: 'Confidential' | 'Restricted' | 'Secret' | string;
  prepared_by_sign?: string;
  reviewed_by_sign?: string;
  approved_by_sign?: string;
  prepared_by_name?: string;
  prepared_by_designation?: string;
  additional_by_name?: string;
  additional_by_designation?: string;
  additional_by_sign?: string;
  show_additional_by?: boolean;
  content?: string;
  title?: string;
  letterhead_mode?: boolean;
  framework_group?: 'Basic' | 'Transmission' | 'Advance' | string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_no: string;
  file_path: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  client_id?: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'POLICY_REVIEW' | 'RISK_REVIEW' | 'ASSET_PPM' | 'AUDIT' | 'DOCUMENT_EXPIRY' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  email_type: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sent_at: string;
  body?: string;
}

export interface AuditLog {
  id: string;
  client_id?: string;
  user_id: string;
  user_name: string;
  action: string;
  module_name: string;
  record_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  created_at: string;
}

export interface SMTPSetting {
  server: string;
  port: number;
  username: string;
  password?: string;
  sender_email: string;
  tls: boolean;
  ssl: boolean;
  provider: 'Office 365' | 'Google Workspace' | 'Custom SMTP';
  sandbox_mode?: boolean;
}

export interface Employee {
  id: string;
  client_id: string;
  employee_id: string;
  employee_name: string;
  name?: string;
  full_name?: string;
  position: string;
  designation?: string;
  department: string;
  joining_date: string;
  last_working_date?: string;
  current_status: 'Active' | 'Vacation' | 'Resigned' | 'Terminated';
  status?: string;
  branch_name?: string;
  branch?: string;
  facility_name?: string;
}

export type SystemApplicationType =
  | 'Desktop / Computer User Accounts'
  | 'Server'
  | 'Firewall'
  | 'CCTV / NVR'
  | 'Antivirus / Kaspersky'
  | 'NAS'
  | 'Other Application';

export type AccessRoleType =
  | 'General / End User'
  | 'Operator'
  | 'Administrator'
  | 'Business Application User'
  | 'DB User';

export type AccessReviewStatus = 'Active' | 'Inactive' | 'Removed' | 'Modified';

export interface AccessReviewAuditLog {
  id: string;
  action: string;
  changed_at: string;
  changed_by: string;
  details: string;
  prev_status?: AccessReviewStatus;
  new_status?: AccessReviewStatus;
}

export interface SystemAccessReviewItem {
  id: string;
  client_id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department?: string;
  branch_name?: string;
  system_application: SystemApplicationType | string;
  access_role: AccessRoleType | string;
  username?: string;
  module_privilege?: string;
  status: AccessReviewStatus;
  approved_by: string;
  approved_by_designation?: string;
  prepared_by: string;
  prepared_by_designation?: string;
  review_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  modified_by: string;
  notes?: string;
  audit_history?: AccessReviewAuditLog[];
}

export interface ServiceAgreement {
  id: string;
  client_id: string;
  contract_number: string;
  effective_date: string;
  start_date: string;
  end_date: string;
  site_visits: string;
  remote_support: 'Unlimited' | 'Limited';
  working_hours: string;
  consultant_name: string;
  consultant_signature_name: string;
  client_signature_name: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'EXECUTED';
  signature_date?: string;
  scope_items: string[];
  created_at: string;
  updated_at: string;
}

export interface MasterKeyRegisterItem {
  id: string;
  slNo: number;
  locationName: string;
  keyTagNo: string;
  issueDate: string;
  receiverName: string;
  receiverSign: string;
  returnDate: string;
  physicalKeyTagId: string;
  digitalBioAccess: 'Yes' | 'No';
}

