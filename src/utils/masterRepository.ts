/**
 * Master Repository Manager for SmartPro Compliance Consultant Account (c0)
 * Handles full restoration of master documents, policies, registers, forms, and tools,
 * and handles cloning/copying of master assets/documents to client accounts with
 * automated company name replacement.
 */

import { Policy, RiskItem, Asset, ComplianceForm, DocumentItem, Client } from '../types';
import { MASTER_34_POLICY_TEMPLATES, getPolicyTemplateDefaults } from './policyDefaults';

export const SMARTPRO_CLIENT_ID = 'c0';
export const SMARTPRO_COMPANY_NAME = 'SmartPro Public Relations Consultancy & Cyber Risk Management Services';

/**
 * Text replacement helper for cloning client documents
 */
export function replaceCompanyNames(str: string, sourceCompanyName: string, targetCompanyName: string): string {
  if (!str || typeof str !== 'string') return str;
  if (!targetCompanyName) return str;

  let result = str;
  if (sourceCompanyName) {
    const escapedSource = sourceCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedSource, 'gi'), targetCompanyName);
  }

  // Also replace common SmartPro name variations
  result = result.replace(/SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, targetCompanyName);
  result = result.replace(/SmartPro Consultancy & Facility Services/gi, targetCompanyName);
  result = result.replace(/SmartPro Cyber Risk Management Services/gi, targetCompanyName);
  result = result.replace(/SmartPro Consultancy/gi, targetCompanyName);

  return result;
}

/**
 * Generates the full set of 34 ISO 27001 / ADHICS master policies for SmartPro (c0)
 */
export function getMasterSmartProPolicies(): Policy[] {
  return MASTER_34_POLICY_TEMPLATES.map((tpl, idx) => {
    const defaults = getPolicyTemplateDefaults(tpl.policy_no, SMARTPRO_COMPANY_NAME, tpl.policy_name);
    return {
      id: `p_m34_c0_${tpl.policy_no}_${idx}`,
      client_id: SMARTPRO_CLIENT_ID,
      policy_no: tpl.policy_no,
      policy_name: tpl.policy_name,
      version: '1.0',
      review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'APPROVED',
      category: tpl.category,
      doc_type: tpl.doc_type || 'Policy',
      created_at: new Date().toISOString(),
      policy_statement: defaults.policy_statement || `Official Policy Framework for ${tpl.policy_name}.`,
      full_content: defaults.policy_statement,
      objective: defaults.objective,
      scope: defaults.scope,
      resp_it_manager: defaults.resp_it_manager,
      resp_md: defaults.resp_md,
      resp_all_users: defaults.resp_all_users
    } as Policy;
  });
}

/**
 * Generates the master Risk Register for SmartPro (c0)
 */
export function getMasterSmartProRisks(): RiskItem[] {
  const categories = [
    { id: 'RSK-RR-001', domain: 'Access Control', title: 'Weak Passwords & Lack of MFA', threat: 'Brute-force or credential stuffing vulnerability on systems', vuln: 'Simple credentials without MFA enforcement', owner: 'CISO / IT Lead', rating: 16 },
    { id: 'RSK-RR-002', domain: 'Operations', title: 'Ransomware Attack & Data Loss', threat: 'Malware encrypts critical databases or files', vuln: 'Lack of offline immutable backups', owner: 'IT Manager', rating: 20 },
    { id: 'RSK-RR-003', domain: 'System Config', title: 'Unsecured Network & Open Ports', threat: 'Unauthorized network penetration via open management ports', vuln: 'Default credentials and unpatched firewall policies', owner: 'Network Admin', rating: 12 },
    { id: 'RSK-RR-004', domain: 'Compliance', title: 'ADHICS & ISO 27001 Non-Conformity', threat: 'Regulatory audit penalties or suspension', vuln: 'Outdated policy documentation and unreviewed controls', owner: 'Compliance Consultant', rating: 15 },
    { id: 'RSK-RR-005', domain: 'Physical Security', title: 'Server Room Unauthorized Entry', threat: 'Physical tampering with network switches or server racks', vuln: 'Unmonitored door locks without electronic log', owner: 'Facility Manager', rating: 12 },
    { id: 'RSK-RR-006', domain: 'Data Privacy', title: 'Patient File Breach / MALAFFI Outage', threat: 'Unauthorized viewing or leakage of patient data', vuln: 'Unencrypted communication channels', owner: 'Data Protection Officer', rating: 16 },
    { id: 'RSK-RR-007', domain: 'Vendor Management', title: 'Third-Party Software Vulnerability', threat: 'Supply chain attack through vendor remote access', vuln: 'Uncontrolled vendor VPN credentials', owner: 'IT Operations', rating: 14 }
  ];

  return categories.map((c, idx) => ({
    id: `r_master_c0_${idx}`,
    client_id: SMARTPRO_CLIENT_ID,
    risk_id: c.id,
    domain: c.domain,
    asset_name: 'Core Systems & Infrastructure',
    risk_title: c.title,
    threat: c.threat,
    vulnerability: c.vuln,
    existing_controls: 'Standard access controls, regular audits, and active firewall monitoring.',
    impact: 4,
    likelihood: 4,
    risk_rating: c.rating,
    risk_owner: c.owner,
    status: 'OPEN',
    mitigation_status: 'In Progress',
    record_status: 'Active',
    treatment_option: 'Reduction',
    treatment_plan: 'Execute mitigation plan under ISO 27001 / ADHICS standards.',
    identification_date: '2024-01-15',
    target_closing_date: '2026-12-31',
    residual_likelihood: 2,
    residual_impact: 2,
    residual_risk_rating: 4,
    recurrence: 'Annual',
    review_date: '2026-09-30'
  }));
}

/**
 * Generates master Asset Inventory for SmartPro (c0)
 */
export function getMasterSmartProAssets(): Asset[] {
  return [
    {
      id: 'a_sp_001',
      client_id: SMARTPRO_CLIENT_ID,
      asset_code: 'AST-FW-001',
      asset_name: 'Enterprise Next-Gen Firewall Gateway',
      asset_type: 'IT Asset',
      asset_category: 'Firewall',
      description: 'Primary security gateway enforcing IPS, anti-malware, and network segmentation.',
      manufacturer: 'Fortinet',
      model: 'FortiGate 100F',
      serial_number: 'FG100F-SMARTPRO',
      asset_owner: 'Aseef Sulaiman',
      classification: 'RESTRICTED',
      location: 'Primary Data Center',
      status: 'ACTIVE',
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: 'Lead Auditor',
      c_val: 5, i_val: 5, a_val: 5
    },
    {
      id: 'a_sp_002',
      client_id: SMARTPRO_CLIENT_ID,
      asset_code: 'AST-SVR-002',
      asset_name: 'Compliance Management Application Host',
      asset_type: 'IT Asset',
      asset_category: 'Server',
      description: 'Primary application node hosting SmartPro compliance ledger & document engine.',
      manufacturer: 'Dell Technologies',
      model: 'PowerEdge R750',
      serial_number: 'DELL-SP-8821',
      asset_owner: 'Aseef Sulaiman',
      classification: 'RESTRICTED',
      location: 'Rack A1 - Main Server Room',
      status: 'ACTIVE',
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: 'Lead Auditor',
      c_val: 5, i_val: 5, a_val: 5
    },
    {
      id: 'a_sp_003',
      client_id: SMARTPRO_CLIENT_ID,
      asset_code: 'AST-NAS-003',
      asset_name: 'Immutable Document Vault NAS',
      asset_type: 'IT Asset',
      asset_category: 'NAS',
      description: 'Redundant Network Attached Storage storing encrypted client compliance archives.',
      manufacturer: 'Synology',
      model: 'RackStation RS3621xs+',
      serial_number: 'SYN-NAS-SP2026',
      asset_owner: 'IT Systems Lead',
      classification: 'CONFIDENTIAL',
      location: 'Backup Closet Row 2',
      status: 'ACTIVE',
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: 'Lead Auditor',
      c_val: 5, i_val: 5, a_val: 4
    },
    {
      id: 'a_sp_004',
      client_id: SMARTPRO_CLIENT_ID,
      asset_code: 'AST-SW-004',
      asset_name: 'SmartPro Compliance & Risk Management Platform',
      asset_type: 'Software Asset',
      asset_category: 'License',
      description: 'Core web portal and audit management suite for ADHICS & ISO 27001.',
      manufacturer: 'SmartPro Consultancy',
      model: 'Enterprise v3.5',
      serial_number: 'LIC-SP-FULL-2026',
      asset_owner: 'Aseef Sulaiman',
      classification: 'RESTRICTED',
      location: 'Cloud Infrastructure',
      status: 'ACTIVE',
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: 'Lead Auditor',
      c_val: 5, i_val: 5, a_val: 5
    }
  ];
}

/**
 * Generates master Compliance Forms for SmartPro (c0)
 */
export function getMasterSmartProForms(): ComplianceForm[] {
  const formsData = [
    { doc: 'FORM-INC-LOG-001', name: 'INCIDENT MANAGEMENT & INVESTIGATION FORM', type: 'Incident Management Form', cat: 'Incident Response' },
    { doc: 'FORM-ONB-NDA-001', name: 'NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT (NDA)', type: 'Confidentiality/NDA Form', cat: 'Onboarding' },
    { doc: 'FORM-IT-CRF-007', name: 'IT CHANGE CONTROL REQUEST FORM (CRF)', type: 'Change Request Form', cat: 'Change Control' },
    { doc: 'FORM-IT-USR-003', name: 'IT USER ACCESS PROVISIONING REQUEST FORM', type: 'User Creation Form', cat: 'IT Security' },
    { doc: 'FORM-VND-EVAL-010', name: 'THIRD-PARTY VENDOR CYBER RISK EVALUATION FORM', type: 'Vendor Assessment Form', cat: 'Vendor Risk' },
    { doc: 'FORM-AUD-CHK-012', name: 'INTERNAL COMPLIANCE AUDIT CHECKLIST FORM', type: 'Audit Checklist Form', cat: 'Audit' }
  ];

  return formsData.map((f, idx) => ({
    id: `fm_sp_c0_${idx}`,
    client_id: SMARTPRO_CLIENT_ID,
    doc_ref: f.doc,
    form_name: f.name,
    form_type: f.type,
    category: f.cat,
    issue_date: '2024-01-01',
    expiry_date: '2027-12-31',
    review_date: '2026-12-31',
    version: 'v1.0',
    classification: 'RESTRICTED',
    status: 'ACTIVE',
    prepared_by: 'SmartPro Consultancy Team',
    approved_by: 'Managing Director / Lead Consultant',
    description: `Official master form template for ${f.name} in compliance with ISO 27001 & ADHICS standards.`,
    total_submissions: 10
  }));
}

/**
 * Generates master Document Repository items for SmartPro (c0)
 */
export function getMasterSmartProDocuments(): DocumentItem[] {
  return [
    {
      id: 'doc_sp_001',
      client_id: SMARTPRO_CLIENT_ID,
      document_name: 'SmartPro_ISO_27001_Master_Certificate_2026.pdf',
      document_type: 'PDF',
      version: '1.0',
      storage_path: 'repository/c0/ISO27001_Master_2026.pdf',
      approval_status: 'APPROVED',
      expiry_date: '2028-12-31',
      uploaded_by: 'u1',
      uploaded_by_name: 'Aseef Sulaiman',
      uploaded_at: '2026-01-01T08:00:00Z'
    },
    {
      id: 'doc_sp_002',
      client_id: SMARTPRO_CLIENT_ID,
      document_name: 'DOH_ADHICS_v2_Compliance_Master_Framework.pdf',
      document_type: 'PDF',
      version: '2.0',
      storage_path: 'repository/c0/ADHICS_v2_Master.pdf',
      approval_status: 'APPROVED',
      expiry_date: '2028-12-31',
      uploaded_by: 'u1',
      uploaded_by_name: 'Aseef Sulaiman',
      uploaded_at: '2026-01-01T08:00:00Z'
    },
    {
      id: 'doc_sp_003',
      client_id: SMARTPRO_CLIENT_ID,
      document_name: 'SmartPro_Master_Risk_Assessment_Matrix.xlsx',
      document_type: 'XLSX',
      version: '3.0',
      storage_path: 'repository/c0/Master_Risk_Matrix.xlsx',
      approval_status: 'APPROVED',
      expiry_date: '2028-12-31',
      uploaded_by: 'u1',
      uploaded_by_name: 'Aseef Sulaiman',
      uploaded_at: '2026-01-01T08:00:00Z'
    }
  ];
}
