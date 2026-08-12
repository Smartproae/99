/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Policy, MasterDocument, DocumentItem } from '../types';
import jsPDF from 'jspdf';
import { formatDateDMY } from './dateUtils';

export type FrameworkGroupTier = 'Basic' | 'Transmission' | 'Advance';

export interface FrameworkGroupInfo {
  id: FrameworkGroupTier;
  name: string;
  badgeColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  iconName: string;
  description: string;
  targetFocus: string;
}

export const FRAMEWORK_GROUPS: FrameworkGroupInfo[] = [
  {
    id: 'Basic',
    name: 'Basic Framework Group',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bgLight: 'bg-emerald-50/60',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-950',
    iconName: 'ShieldCheck',
    description: 'Foundational baseline governance policies, HR security, document control, and basic administrative compliance forms.',
    targetFocus: 'DOH ADHICS Baseline & Essential Clinical Security'
  },
  {
    id: 'Transmission',
    name: 'Transmission Framework Group',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    bgLight: 'bg-blue-50/60',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-950',
    iconName: 'Activity',
    description: 'Patient data exchange, EMR telemetry, MALAFFI/NABIDH interface protocols, network security, and backup restoration.',
    targetFocus: 'Interoperability, Data Transmission & Privacy'
  },
  {
    id: 'Advance',
    name: 'Advance Framework Group',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    bgLight: 'bg-purple-50/60',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-950',
    iconName: 'Zap',
    description: 'Statement of Applicability (SoA), master risk registers, asset vulnerability patch management, and business continuity.',
    targetFocus: 'ISO 27001 Controls & Enterprise Resilience'
  }
];

export interface UnifiedGroupDocument {
  id: string;
  code: string;
  title: string;
  category: string;
  docType: 'Policy' | 'Procedure' | 'Form' | 'Register' | 'SOP' | 'Review';
  frameworkGroup: FrameworkGroupTier;
  status: 'APPROVED' | 'COMPLIANT' | 'UNDER_REVIEW' | 'DRAFT' | 'EXPIRED' | 'NEED_ACTION';
  issueDate?: string;
  effectiveDate?: string;
  nextReviewDate?: string;
  owner?: string;
  department?: string;
  isCustomAssigned?: boolean;
}

// Key mapping storage key in localStorage
const GROUP_ASSIGNMENTS_KEY = 'sh_framework_group_assignments';

export function getCustomGroupAssignments(): Record<string, FrameworkGroupTier> {
  try {
    const raw = localStorage.getItem(GROUP_ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read sh_framework_group_assignments:', e);
  }
  return {};
}

export function saveCustomGroupAssignment(docCodeOrId: string, group: FrameworkGroupTier) {
  try {
    const assignments = getCustomGroupAssignments();
    assignments[docCodeOrId] = group;
    localStorage.setItem(GROUP_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.warn('Could not save custom group assignment:', e);
  }
}

// Default heuristic tier determination based on code/title/type
export function determineDefaultFrameworkGroup(code: string = '', title: string = '', docType: string = ''): FrameworkGroupTier {
  const codeUpper = code.toUpperCase();
  const titleUpper = title.toUpperCase();

  // Advance Group items
  if (
    codeUpper.includes('POL-SEC-032') ||
    codeUpper.includes('M-POLICY-002') ||
    codeUpper.includes('POL-SEC-005') ||
    codeUpper.includes('POL-SEC-018') ||
    codeUpper.includes('POL-SEC-022') ||
    titleUpper.includes('STATEMENT OF APPLICABILITY') ||
    titleUpper.includes('RISK') ||
    titleUpper.includes('VULNERABILITY') ||
    titleUpper.includes('CONTINUITY') ||
    titleUpper.includes('SOA') ||
    titleUpper.includes('MASTER INDEX')
  ) {
    return 'Advance';
  }

  // Transmission Group items
  if (
    codeUpper.includes('POL-SEC-021') ||
    codeUpper.includes('POL-SEC-020') ||
    codeUpper.includes('POL-SEC-029') ||
    codeUpper.includes('POL-SEC-030') ||
    codeUpper.includes('ACC-REV') ||
    titleUpper.includes('BACKUP') ||
    titleUpper.includes('NETWORK') ||
    titleUpper.includes('CLOUD') ||
    titleUpper.includes('TELEMETRY') ||
    titleUpper.includes('MALAFFI') ||
    titleUpper.includes('NABIDH') ||
    titleUpper.includes('PRIVACY') ||
    titleUpper.includes('TRANSMISSION') ||
    titleUpper.includes('EXCHANGE') ||
    titleUpper.includes('ACCESS REVIEW')
  ) {
    return 'Transmission';
  }

  // Basic Group items (Default)
  return 'Basic';
}

// Build unified list of all documents, policies, and forms for a given client
export function getUnifiedDocuments(
  clientId: string,
  policies: Policy[] = [],
  masterDocs: MasterDocument[] = [],
  docItems: DocumentItem[] = []
): UnifiedGroupDocument[] {
  const customAssignments = getCustomGroupAssignments();
  const result: UnifiedGroupDocument[] = [];
  const seenKeys = new Set<string>();

  // 1. Process Policies
  const clientPolicies = policies.filter(p => !p.client_id || p.client_id === clientId);
  for (const p of clientPolicies) {
    const key = p.policy_no || p.id;
    if (seenKeys.has(key)) continue;
    if (customAssignments[key] === ('EXCLUDED' as any) || customAssignments[p.id] === ('EXCLUDED' as any)) {
      continue;
    }
    seenKeys.add(key);

    const group = customAssignments[key] || customAssignments[p.id] || p.framework_group as FrameworkGroupTier || determineDefaultFrameworkGroup(p.policy_no, p.policy_name, p.document_type);
    if ((group as string) === 'EXCLUDED') continue;

    let status: UnifiedGroupDocument['status'] = 'APPROVED';
    if (p.status === 'EXPIRED') status = 'EXPIRED';
    else if (p.status === 'DRAFT' || p.status === 'UNDER_REVIEW') status = 'UNDER_REVIEW';

    // Check if review/next due date is overdue or approaching
    const reviewDate = p.next_review_date || p.next_due_date || p.review_date;
    if (reviewDate) {
      const due = new Date(reviewDate);
      const now = new Date();
      if (due < now || p.status === 'DRAFT') {
        status = 'NEED_ACTION';
      }
    }

    result.push({
      id: p.id,
      code: p.policy_no || 'POL-SEC-GEN',
      title: p.policy_name || 'Security Governance Document',
      category: p.category || 'Information Security',
      docType: (p.document_type as any) || 'Policy',
      frameworkGroup: group,
      status,
      issueDate: p.issue_date || p.effective_date,
      effectiveDate: p.effective_date || p.issue_date,
      nextReviewDate: reviewDate,
      owner: p.owner || p.author || 'Compliance Officer',
      department: p.department || 'Quality & Risk',
      isCustomAssigned: !!customAssignments[key] || !!customAssignments[p.id]
    });
  }

  // 2. Process Master Documents & Forms
  const clientMasterDocs = masterDocs.filter(m => !m.client_id || m.client_id === clientId);
  for (const m of clientMasterDocs) {
    const key = m.document_number || m.id;
    if (seenKeys.has(key)) continue;
    if (customAssignments[key] === ('EXCLUDED' as any) || customAssignments[m.id] === ('EXCLUDED' as any)) {
      continue;
    }
    seenKeys.add(key);

    const group = customAssignments[key] || customAssignments[m.id] || m.framework_group as FrameworkGroupTier || determineDefaultFrameworkGroup(m.document_number, m.document_name, m.category);
    if ((group as string) === 'EXCLUDED') continue;

    let status: UnifiedGroupDocument['status'] = 'APPROVED';
    const mStatus = (m.status as string) || '';
    if (mStatus === 'EXPIRED' || mStatus === 'OBSOLETE') status = 'EXPIRED';
    else if (mStatus === 'DRAFT' || mStatus === 'IN_REVIEW' || mStatus === 'Under Review' || mStatus === 'Draft') status = 'UNDER_REVIEW';

    const reviewDate = m.next_review_date || m.due_date;
    if (reviewDate) {
      const due = new Date(reviewDate);
      const now = new Date();
      if (due < now) status = 'NEED_ACTION';
    }

    const mCat = (m.category as string) || '';

    result.push({
      id: m.id,
      code: m.document_number || 'DOC-MST-00',
      title: m.document_name,
      category: m.category || 'General Governance',
      docType: mCat === 'Form' ? 'Form' : mCat === 'Register' ? 'Register' : 'SOP',
      frameworkGroup: group,
      status,
      issueDate: m.issue_date,
      effectiveDate: m.effective_date,
      nextReviewDate: reviewDate,
      owner: m.owner || m.prepared_by,
      department: m.department || 'Quality',
      isCustomAssigned: !!customAssignments[key] || !!customAssignments[m.id]
    });
  }

  // 3. Process Document Items if any distinct ones remain
  const clientDocItems = docItems.filter(d => !d.client_id || d.client_id === clientId);
  for (const d of clientDocItems) {
    const key = d.code || d.document_code || d.id;
    if (seenKeys.has(key)) continue;
    if (customAssignments[key] === ('EXCLUDED' as any) || customAssignments[d.id] === ('EXCLUDED' as any)) {
      continue;
    }
    seenKeys.add(key);

    const group = customAssignments[key] || customAssignments[d.id] || d.framework_group as FrameworkGroupTier || determineDefaultFrameworkGroup(key, d.title || d.document_name, d.doc_type_category);
    if ((group as string) === 'EXCLUDED') continue;

    result.push({
      id: d.id,
      code: key,
      title: d.title || d.document_name || 'Compliance Record',
      category: d.category || 'Compliance',
      docType: (d.doc_type_category as any) || 'Form',
      frameworkGroup: group,
      status: d.approval_status === 'APPROVED' ? 'APPROVED' : 'NEED_ACTION',
      issueDate: d.issue_date,
      nextReviewDate: d.expiry_date || d.next_due_date,
      owner: d.owner || d.uploaded_by_name || 'Compliance Team',
      department: d.department || 'Quality',
      isCustomAssigned: !!customAssignments[key] || !!customAssignments[d.id]
    });
  }

  return result;
}

// Check tier applicability for specific group tab:
export function isGroupApplicable(itemGroup: FrameworkGroupTier, chosenGroup: FrameworkGroupTier): boolean {
  if ((itemGroup as string) === 'EXCLUDED') return false;
  return itemGroup === chosenGroup;
}

// Get documents filtered by specific Framework Tier Group (using applicability hierarchy)
export function getDocumentsByGroup(
  clientId: string,
  group: FrameworkGroupTier,
  policies: Policy[] = [],
  masterDocs: MasterDocument[] = [],
  docItems: DocumentItem[] = []
): UnifiedGroupDocument[] {
  const all = getUnifiedDocuments(clientId, policies, masterDocs, docItems);
  return all.filter(d => isGroupApplicable(d.frameworkGroup, group));
}

// Compute stats per group
export function getGroupComplianceStats(
  clientId: string,
  group: FrameworkGroupTier,
  policies: Policy[] = [],
  masterDocs: MasterDocument[] = [],
  docItems: DocumentItem[] = []
) {
  const docs = getDocumentsByGroup(clientId, group, policies, masterDocs, docItems);
  const total = docs.length;
  const compliant = docs.filter(d => d.status === 'APPROVED' || d.status === 'COMPLIANT').length;
  const needAction = docs.filter(d => d.status === 'NEED_ACTION' || d.status === 'EXPIRED').length;
  const underReview = docs.filter(d => d.status === 'UNDER_REVIEW' || d.status === 'DRAFT').length;

  const score = total > 0 ? Math.round((compliant / total) * 100) : 100;

  return {
    total,
    compliant,
    needAction,
    underReview,
    score
  };
}

// Need Action List for Dashboard (Approaching expiry / pending review)
export function getNeedActionDocuments(
  clientId: string,
  policies: Policy[] = [],
  masterDocs: MasterDocument[] = [],
  docItems: DocumentItem[] = []
): UnifiedGroupDocument[] {
  const all = getUnifiedDocuments(clientId, policies, masterDocs, docItems);
  const now = new Date();
  const thresholdDays = 90; // Look ahead 90 days or already passed

  return all.filter(doc => {
    if (doc.status === 'NEED_ACTION' || doc.status === 'EXPIRED' || doc.status === 'UNDER_REVIEW') {
      return true;
    }
    if (doc.nextReviewDate) {
      const dueDate = new Date(doc.nextReviewDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= thresholdDays) {
        return true;
      }
    }
    return false;
  });
}

// Generate PDF / Printable Compliance Status Report filtered by group
export function generateFrameworkGroupPDFReport(
  client: Client,
  group: FrameworkGroupTier,
  groupDocs: UnifiedGroupDocument[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const compName = client.company_name || 'HEALTHCARE FACILITY';
  const groupInfo = FRAMEWORK_GROUPS.find(g => g.id === group) || FRAMEWORK_GROUPS[0];

  const total = groupDocs.length;
  const compliant = groupDocs.filter(d => d.status === 'APPROVED' || d.status === 'COMPLIANT').length;
  const needAction = groupDocs.filter(d => d.status === 'NEED_ACTION' || d.status === 'EXPIRED').length;
  const score = total > 0 ? Math.round((compliant / total) * 100) : 100;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(compName.toUpperCase(), 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(`COMPLIANCE STATUS REPORT • ${groupInfo.name.toUpperCase()}`, 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${formatDateDMY(new Date().toISOString())} • Facility License: ${client.doh_license_no || client.trade_license_no || 'DOH-LH-2026'}`, 14, 29);

  // Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Group Category Focus: ${groupInfo.targetFocus}`, 18, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Managed Documents: ${total} | Compliant/Active: ${compliant} | Need Action / Review: ${needAction}`, 18, 55);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (score >= 80) doc.setTextColor(16, 185, 129);
  else doc.setTextColor(225, 29, 72);
  doc.text(`Group Compliance Rating: ${score}%`, 18, 62);

  // Table Header
  let y = 74;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Ref Code', 16, y + 5.5);
  doc.text('Document Title & Scope', 52, y + 5.5);
  doc.text('Type', 130, y + 5.5);
  doc.text('Next Review', 152, y + 5.5);
  doc.text('Status', 178, y + 5.5);

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  groupDocs.forEach((item, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;

      // Repeat Table Header
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Ref Code', 16, y + 5.5);
      doc.text('Document Title & Scope', 52, y + 5.5);
      doc.text('Type', 130, y + 5.5);
      doc.text('Next Review', 152, y + 5.5);
      doc.text('Status', 178, y + 5.5);
      y += 8;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 7.5, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7.5, 196, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(item.code.substring(0, 18), 16, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const truncTitle = item.title.length > 45 ? item.title.substring(0, 43) + '...' : item.title;
    doc.text(truncTitle, 52, y + 5);

    doc.text(item.docType, 130, y + 5);
    doc.text(item.nextReviewDate ? formatDateDMY(item.nextReviewDate) : '2027-08-01', 152, y + 5);

    if (item.status === 'APPROVED' || item.status === 'COMPLIANT') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('✓ COMPLIANT', 178, y + 5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text('⚡ NEED ACTION', 178, y + 5);
    }

    y += 7.5;
  });

  // Footer Sign-off
  y += 10;
  if (y < 260) {
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Audit Trail Document • Prepared for ${compName} under ADHICS v2 / ISO 27001 Standards`, 14, y + 5);
    doc.text(`Report Group Scope: ${groupInfo.name} (${groupInfo.targetFocus})`, 14, y + 9);
  }

  doc.save(`${group}_Framework_Compliance_Report_${client.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Facility'}.pdf`);
}
