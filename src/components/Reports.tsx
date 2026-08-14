/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Client, Policy, RiskItem, Asset, Incident, AuditFinding, CorrectiveAction } from '../types';
import { 
  FileText, Download, FileSpreadsheet, FileMinus, CheckCircle, 
  BarChart3, TrendingUp, AlertTriangle, Printer, Sparkles, Filter, 
  Settings, CheckSquare, Square, RefreshCw, Layers, Mail, Shield 
} from 'lucide-react';
import { formatDateDMY, formatTime12h, formatDateTimeDMY } from '../utils/dateUtils';
import { DocRefLoopSelector } from './DocRefLoopSelector';
import { 
  generateFrameworkGroupPDFReport, 
  getDocumentsByGroup, 
  getGroupComplianceStats, 
  FrameworkGroupTier, 
  FRAMEWORK_GROUPS 
} from '../utils/frameworkGroupUtils';

interface ReportsProps {
  clients: Client[];
  policies: Policy[];
  risks: RiskItem[];
  assets: Asset[];
  incidents: Incident[];
  findings: AuditFinding[];
  actions: CorrectiveAction[];
  activeClientId: string;
  filteredRisks?: RiskItem[];
  autoOpenPdf?: boolean;
  onClosePdfStream?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenQuickSetup?: () => void;
  onUpdateClient?: (client: Client) => void;
}

export default function Reports({
  clients,
  policies,
  risks,
  assets,
  incidents,
  findings,
  actions,
  activeClientId,
  filteredRisks,
  autoOpenPdf,
  onClosePdfStream,
  onNavigateTab,
  onOpenQuickSetup,
  onUpdateClient
}: ReportsProps) {
  const currentClient = clients.find(c => c.id === activeClientId);
  const entityName = currentClient?.company_name || 'AL NASR PHARMACY - LLC';
  const isGroup = currentClient?.structure_classification === 'GROUP' || currentClient?.is_group || false;
  const branches = currentClient?.branches || [];
  const clientPolicies = policies.filter(p => p.client_id === activeClientId);
  
  // Exclude deactivated risks from standard reports unless we want to show everything
  const allClientRisks = risks.filter(r => r.client_id === activeClientId);
  const clientRisks = filteredRisks !== undefined
    ? filteredRisks
    : allClientRisks.filter(r => (r.record_status || 'Active') !== 'Deactivated');
  
  const clientAssets = assets.filter(a => a.client_id === activeClientId);
  const clientIncidents = incidents.filter(i => i.client_id === activeClientId);
  const clientActions = actions.filter(a => a.client_id === activeClientId);

  const [selectedReportType, setSelectedReportType] = useState<'RISK' | 'ASSET' | 'INCIDENT' | 'CAPA' | 'FRAMEWORK_GROUP'>('RISK');
  const [selectedFrameworkGroupTier, setSelectedFrameworkGroupTier] = useState<FrameworkGroupTier>('Basic');
  
  // High-fidelity report config state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [includeFacilityDetails, setIncludeFacilityDetails] = useState(true);
  const [includeAcceptanceCriteria, setIncludeAcceptanceCriteria] = useState(true);
  const [includeCommitteeDetails, setIncludeCommitteeDetails] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<'DRAFT' | 'FINAL'>('FINAL');

  const [assessmentDate, setAssessmentDate] = useState(formatDateDMY(currentClient?.doc_approved_date || '30/06/2026'));

  // Document Metadata Edit Modal State
  const [showEditMetadataModal, setShowEditMetadataModal] = useState(false);
  const [editDocRef, setEditDocRef] = useState(currentClient?.doc_ref || 'ZZP-IT-PE-05/2021');
  const [editDocClassification, setEditDocClassification] = useState(currentClient?.doc_classification || 'RESTRICTED');
  const [editDocIssueDate, setEditDocIssueDate] = useState(formatDateDMY(currentClient?.doc_issue_date || '01/03/2022'));
  const [editDocApprovedDate, setEditDocApprovedDate] = useState(formatDateDMY(currentClient?.doc_approved_date || '30/06/2026'));
  const [editDocVersion, setEditDocVersion] = useState(currentClient?.doc_version || '1.0');

  React.useEffect(() => {
    if (currentClient) {
      setAssessmentDate(formatDateDMY(currentClient.doc_approved_date || '30/06/2026'));
      setEditDocRef(currentClient.doc_ref || 'ZZP-IT-PE-05/2021');
      setEditDocClassification(currentClient.doc_classification || 'RESTRICTED');
      setEditDocIssueDate(formatDateDMY(currentClient.doc_issue_date || '01/03/2022'));
      setEditDocApprovedDate(formatDateDMY(currentClient.doc_approved_date || '30/06/2026'));
      setEditDocVersion(currentClient.doc_version || '1.0');
    }
  }, [activeClientId, currentClient]);

  // Interactive PDF Stream states
  const [isPdfStreamOpen, setIsPdfStreamOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // GRC Email delivery states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customRecipients, setCustomRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [includeStatsHtml, setIncludeStatsHtml] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const getClientContacts = () => {
    const currentClient = clients.find(c => c.id === activeClientId);
    if (!currentClient) return [];
    
    return [
      {
        name: currentClient.auth_representative?.name || 'Faizal',
        role: 'Authorized Representative',
        email: currentClient.auth_representative?.email || 'nasrpharma@emirated.net.ae'
      },
      {
        name: currentClient.clinic_manager?.name || 'Aseef Sulaiman',
        role: 'Clinic Manager',
        email: currentClient.clinic_manager?.email || 'info@smartpro.ae'
      },
      {
        name: currentClient.medical_director?.name || 'Dr. Michael Roberts',
        role: 'Medical Director',
        email: currentClient.medical_director?.email || 'medical.director@partner.ae'
      },
      {
        name: currentClient.it_manager?.name || 'aseef',
        role: 'IT Manager',
        email: currentClient.it_manager?.email || 'info@smartpro.ae'
      },
      {
        name: currentClient.hr_manager?.name || 'Sarah Jenkins',
        role: 'HR Manager',
        email: currentClient.hr_manager?.email || 'hr@partner.ae'
      },
      {
        name: currentClient.it_support?.team_name || 'Aseef',
        role: 'IT Support',
        email: currentClient.it_support?.email || 'Tst@tesr.com'
      },
      {
        name: currentClient.emr_support?.team_name || 'fdfsdf',
        role: 'EMR Support',
        email: currentClient.emr_support?.email || 'dfsdf'
      }
    ];
  };

  const addEmailLog = (recipient: string, subject: string, success: boolean, errorMessage?: string) => {
    try {
      const saved = localStorage.getItem('sh_email_logs') || '[]';
      let logs = [];
      try {
        logs = JSON.parse(saved);
        if (!Array.isArray(logs)) logs = [];
      } catch {
        logs = [];
      }
      const newLog = {
        id: 'em-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        recipient,
        subject,
        timestamp: new Date().toISOString(),
        status: success ? 'DELIVERED' : 'FAILED',
        error: errorMessage || null,
        type: 'Compliance Report'
      };
      logs.unshift(newLog);
      
      // Enforce log limit of 30 to avoid filling up localStorage
      const capped = logs.slice(0, 30);
      try {
        localStorage.setItem('sh_email_logs', JSON.stringify(capped));
      } catch (quotaError) {
        console.warn('[SmartHub Compliance] Quota exceeded on email logging in Reports. Max truncating logs.');
        try {
          localStorage.setItem('sh_email_logs', JSON.stringify(capped.slice(0, 5)));
        } catch {
          localStorage.setItem('sh_email_logs', '[]');
        }
      }
    } catch (err) {
      console.error('Failed to log email transmission:', err);
    }
  };

  const addAuditLog = (action: string, details: any) => {
    try {
      const saved = localStorage.getItem('sh_audit_logs') || '[]';
      let logs = [];
      try {
        logs = JSON.parse(saved);
        if (!Array.isArray(logs)) logs = [];
      } catch {
        logs = [];
      }
      const newLog = {
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        userId: 'u1',
        userName: 'Administrator',
        role: 'ADMIN',
        actionType: 'COMPLIANCE_REPORT',
        action,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      
      // Enforce log limit of 30 to avoid filling up localStorage
      const capped = logs.slice(0, 30);
      try {
        localStorage.setItem('sh_audit_logs', JSON.stringify(capped));
      } catch (quotaError) {
        console.warn('[SmartHub Compliance] Quota exceeded on audit logging in Reports. Max truncating logs.');
        try {
          localStorage.setItem('sh_audit_logs', JSON.stringify(capped.slice(0, 5)));
        } catch {
          localStorage.setItem('sh_audit_logs', '[]');
        }
      }
    } catch (err) {
      console.error('Failed to log audit trail:', err);
    }
  };

  const generateHtmlContent = (
    clientName: string,
    subjectLine: string,
    customMessage: string,
    includeStats: boolean,
    allRisks: RiskItem[]
  ) => {
    // Calculate stats
    const critCount = allRisks.filter(r => getRiskScore(r, 'inherent') >= 76).length;
    const highCount = allRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 51 && sc <= 75; }).length;
    const modCount = allRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 21 && sc <= 50; }).length;
    const lowCount = allRisks.filter(r => getRiskScore(r, 'inherent') <= 20).length;
    const totCount = allRisks.length;

    let statsHtml = '';
    if (includeStats) {
      statsHtml = `
        <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-family: sans-serif;">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Risk Summary Statistics</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: center; margin-top: 10px;">
            <tr>
              <td style="padding: 10px; background-color: #7f1d1d; color: #ffffff; border-radius: 6px; font-weight: bold; width: 20%;">
                <div style="font-size: 11px; text-transform: uppercase;">CRITICAL</div>
                <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${critCount}</div>
              </td>
              <td style="width: 4%;"></td>
              <td style="padding: 10px; background-color: #ef4444; color: #ffffff; border-radius: 6px; font-weight: bold; width: 20%;">
                <div style="font-size: 11px; text-transform: uppercase;">HIGH</div>
                <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${highCount}</div>
              </td>
              <td style="width: 4%;"></td>
              <td style="padding: 10px; background-color: #fbbf24; color: #1e293b; border-radius: 6px; font-weight: bold; width: 20%;">
                <div style="font-size: 11px; text-transform: uppercase;">MODERATE</div>
                <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${modCount}</div>
              </td>
              <td style="width: 4%;"></td>
              <td style="padding: 10px; background-color: #34d399; color: #1e293b; border-radius: 6px; font-weight: bold; width: 20%;">
                <div style="font-size: 11px; text-transform: uppercase;">LOW</div>
                <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${lowCount}</div>
              </td>
              <td style="width: 4%;"></td>
              <td style="padding: 10px; background-color: #0f172a; color: #ffffff; border-radius: 6px; font-weight: bold; width: 20%;">
                <div style="font-size: 11px; text-transform: uppercase;">TOTAL</div>
                <div style="font-size: 20px; font-weight: 900; margin-top: 4px;">${totCount}</div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    // Generate top risk items HTML
    let risksTableHtml = '';
    if (allRisks.length > 0) {
      const sortedRisks = [...allRisks].sort((a, b) => getRiskScore(b, 'inherent') - getRiskScore(a, 'inherent'));
      const topRisks = sortedRisks.slice(0, 10);

      const rowsHtml = topRisks.map(r => {
        const inhScore = getRiskScore(r, 'inherent');
        const resScore = getRiskScore(r, 'residual');
        
        const getBadgeStyle = (score: number) => {
          if (score >= 76) return 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;';
          if (score >= 51) return 'background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;';
          if (score >= 21) return 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;';
          return 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
        };

        const getLevelText = (score: number) => {
          if (score >= 76) return 'Critical';
          if (score >= 51) return 'High';
          if (score >= 21) return 'Moderate';
          return 'Low';
        };

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; font-family: monospace; font-weight: bold; color: #0f172a; font-size: 12px; border: 1px solid #e2e8f0;">${r.risk_id}</td>
            <td style="padding: 8px; font-weight: 600; color: #334155; font-size: 11px; border: 1px solid #e2e8f0;">${r.domain}</td>
            <td style="padding: 8px; color: #475569; font-size: 11px; border: 1px solid #e2e8f0;">${r.identification_date || r.created_at?.substring(0, 10) || assessmentDate || '2023-05-18'}</td>
            <td style="padding: 8px; color: #1e293b; font-size: 11px; border: 1px solid #e2e8f0; font-weight: bold;">${r.asset_name}</td>
            <td style="padding: 8px; color: #475569; font-size: 11px; border: 1px solid #e2e8f0;">${r.threat || ''}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="display: inline-block; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${getBadgeStyle(inhScore)}">
                ${inhScore} - ${getLevelText(inhScore)}
              </span>
            </td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="display: inline-block; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${getBadgeStyle(resScore)}">
                ${resScore} - ${getLevelText(resScore)}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      risksTableHtml = `
        <div style="margin: 20px 0; font-family: sans-serif;">
          <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Top 10 Risk Register Records</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-weight: bold;">
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Risk ID</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Domain</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Risk Ident- Date</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Asset Name *</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1;">Threat/Vulnerability</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">Inherent (AV&times;I&times;L)</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">Residual (AV&times;RI&times;RL)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 8px;">* Calculations follow DOH compliance criteria. Confidentially rounded according to ADHICS standard instructions.</p>
        </div>
      `;
    }

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
        <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; color: #ffffff; margin-bottom: 25px; text-align: left;">
          <table style="width: 100%;">
            <tr>
              <td style="vertical-align: middle; width: 50px;">
                <div style="background-color: #10b981; color: #ffffff; font-weight: 900; border-radius: 8px; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 14px;">ISO</div>
              </td>
              <td style="vertical-align: middle; padding-left: 12px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; color: #ffffff;">Compliance & Risk Portal</h2>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">${clientName}</p>
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Dear Committee Member,
        </p>
        
        <div style="font-size: 14px; line-height: 1.6; color: #334155; padding: 15px; background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
          <strong>Message from Compliance Administrator:</strong><br/>
          <span style="white-space: pre-wrap; font-style: italic; display: block; margin-top: 8px; color: #475569;">${customMessage || 'Please review the attached/embedded Compliance Risk Register report.'}</span>
        </div>

        ${statsHtml}

        ${risksTableHtml}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;" />
        
        <table style="width: 100%; font-size: 11px; color: #64748b; text-align: center;">
          <tr>
            <td>
              <p style="margin: 0; font-weight: bold; color: #475569;">Regulatory Compliance Management Platform</p>
              <p style="margin: 4px 0 0 0;">This is a system-generated secure transmission dispatched on behalf of ${clientName}.</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  const handleSendEmail = async () => {
    const recipients = [...selectedRecipients];
    if (customRecipients.trim()) {
      const parsed = customRecipients.split(',').map(e => e.trim()).filter(e => e.includes('@'));
      recipients.push(...parsed);
    }

    if (recipients.length === 0) {
      setEmailResult({ success: false, message: 'Please select or enter at least one valid recipient email.' });
      return;
    }

    setIsSendingEmail(true);

    try {
      const smtpRaw = localStorage.getItem('sh_smtp');
      if (!smtpRaw) {
        throw new Error('No outbound SMTP configuration found. Please configure SMTP in Settings first!');
      }
      const smtpConfig = JSON.parse(smtpRaw);
      const clientName = currentClient?.company_name || 'AL NASR PHARMACY';

      const htmlBody = generateHtmlContent(
        clientName,
        emailSubject,
        emailNotes,
        includeStatsHtml,
        clientRisks
      );

      // Render PDF attachment as base64
      let pdfBase64 = '';
      try {
        const pdf = generatePdfInstance();
        const pdfDataUri = pdf.output('datauristring');
        if (pdfDataUri && pdfDataUri.includes(',')) {
          pdfBase64 = pdfDataUri.split(',')[1];
        }
      } catch (pdfErr) {
        console.error('Failed to pre-render PDF attachment for email dispatch:', pdfErr);
      }

      const res = await fetch('/api/send-compliance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          recipientEmails: recipients,
          subject: emailSubject,
          message: emailNotes,
          htmlContent: htmlBody,
          pdfAttachment: pdfBase64 || undefined
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email over SMTP relay gateway.');
      }

      const isSimulated = !!data.simulated;
      addEmailLog(recipients.join(', '), emailSubject, true, isSimulated ? 'SIMULATED' : undefined);
      addAuditLog('EMAIL_DISPATCH', {
        recipients,
        subject: emailSubject,
        client: clientName,
        success: true,
        simulated: isSimulated
      });

      if (isSimulated) {
        setEmailResult({
          success: true,
          message: `✓ Compliance Email Dispatched (Sandbox Gateway Active): Report captured and sent to ${recipients.length} contact(s).`
        });
      } else {
        setEmailResult({
          success: true,
          message: `Compliance report email has been dispatched successfully to ${recipients.length} recipient(s).`
        });
      }
    } catch (err: any) {
      console.error('Email sending error:', err);
      addEmailLog(recipients.join(', '), emailSubject, false, err.message);
      addAuditLog('EMAIL_DISPATCH_FAILED', {
        recipients,
        subject: emailSubject,
        error: err.message,
        success: false
      });

      setEmailResult({
        success: false,
        message: err.message || 'An error occurred while routing email via SMTP gateway.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  React.useEffect(() => {
    if (isEmailModalOpen && currentClient) {
      const clientName = currentClient.company_name || 'AL NASR PHARMACY';
      const contacts = getClientContacts();
      const authRepName = contacts[0]?.name || '(Authorized Representative)';

      setEmailSubject(`ISO 27001 & ADHICS Risk Assessment Report - ${clientName}`);
      setEmailNotes(`Dear ${authRepName},

Please find the finalized ISO 27001 & ADHICS v2 Risk Register and Assessment Report for ${clientName} completed and finalized.

This register has been compiled, analyzed and signed off by the Risk Review Committee.

Document details:
- Total Registered Risks: ${clientRisks.length}
- Document Type: Strategic Confidential ISMS Risk Assessment
- Approval Reference: REC-2026-C17

Please verify and update your internal action trackers accordingly. (Looking forward to your approval and reply)

Best regards,

Risk & Information Security Team
SMARTPRO CONSULTANCY
(Public Relations & Cyber Risk Management Service) 
Abudhabi - United Arab Emirates
Mobile:    +971 52 4846770    /    +971 50 9007267 
Email:  info@smartpro.ae |   www.smartpro.ae
Classification: STRICTLY CONFIDENTIAL
This transmission may contain highly sensitive, proprietary or legally privileged information. If you are not the intended recipient, please notify the sender immediately.`);
      
      const defaultEmails = contacts.slice(0, 3).map(c => c.email);
      setSelectedRecipients(defaultEmails);
    }
  }, [isEmailModalOpen, activeClientId, clientRisks.length]);

  React.useEffect(() => {
    if (autoOpenPdf) {
      setIsPdfStreamOpen(true);
    }
  }, [autoOpenPdf]);

  const handleClosePdfStream = () => {
    setIsPdfStreamOpen(false);
    if (onClosePdfStream) {
      onClosePdfStream();
    }
  };

  const handleExport = (format: 'PDF' | 'EXCEL' | 'WORD') => {
    if (format === 'PDF') {
      setIsPdfStreamOpen(true);
      return;
    }
    if (format === 'EXCEL') {
      // Create real CSV data to download
      const headers = ['Risk ID', 'Domain', 'Risk Ident- Date', 'Asset Name *', 'Threat/Gap Title', 'Description', 'Vulnerabilities', 'Existing Controls', 'L', 'I', 'Asset Value', 'Inherent Score', 'Residual L', 'Residual I', 'Residual Score', 'Status'];
      const rows = clientRisks.map(r => {
        const assetVal = getAssetValue(r.asset_name);
        const score = getRiskScore(r, 'inherent');
        const resImp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
        const resLik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);
        const resScore = getRiskScore(r, 'residual');
        return [
          r.risk_id,
          r.domain,
          r.identification_date || r.created_at?.substring(0, 10) || assessmentDate || '2023-05-18',
          r.asset_name,
          r.risk_title,
          r.threat,
          r.vulnerability || '',
          r.existing_controls || '',
          r.likelihood,
          r.impact,
          assetVal,
          score,
          resLik,
          resImp,
          resScore,
          r.mitigation_status || 'Open'
        ];
      });
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Risk_Register_${currentClient?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Export'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (format === 'WORD') {
      // Download a clean Text summary of the report
      const content = `COMPLIANCE REPORT: ${currentClient?.company_name || 'Facility'}
Generated Date: ${new Date().toLocaleDateString()}
Status: ${documentStatus}

RISK ASSESSMENT REPORT SUMMARY:
Total Risks: ${clientRisks.length}
Critical: ${clientRisks.filter(r => getRiskScore(r, 'inherent') >= 76).length}
High: ${clientRisks.filter(r => { const s = getRiskScore(r, 'inherent'); return s >= 51 && s <= 75; }).length}
Moderate: ${clientRisks.filter(r => { const s = getRiskScore(r, 'inherent'); return s >= 21 && s <= 50; }).length}

ACTIVE RISKS REGISTER:
${clientRisks.map(r => `[${r.risk_id}] - ${r.asset_name}: ${r.risk_title} (Inherent Score: ${getRiskScore(r, 'inherent')})`).join('\n')}
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Compliance_Report_Summary_${currentClient?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Export'}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  };

  const handlePrint = () => {
    setIsPdfStreamOpen(true);
  };

  const generatePdfInstance = () => {
    // Create a landscape A3 PDF (420mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3'
    });

    const clientName = currentClient?.company_name || 'AL NASR PHARMACY';
    const sortedRisks = [...clientRisks].sort((a, b) => {
      if (sortOrder === 'desc') {
        return getRiskScore(b, 'inherent') - getRiskScore(a, 'inherent');
      } else {
        return getRiskScore(a, 'inherent') - getRiskScore(b, 'inherent');
      }
    });

    let pageNum = 1;

    // Define the full set of 24 compliance register columns
    const cols = [
      { id: 'risk_id', label: 'Risk ID', width: 12 },
      { id: 'domain', label: 'Domain', width: 19 },
      { id: 'risk_ident_date', label: 'Risk Ident- Date', width: 15 },
      { id: 'asset_name', label: 'Asset Name *', width: 19 },
      { id: 'threat', label: 'Threats', width: 28 },
      { id: 'risk_title', label: 'Risk Description', width: 31 },
      { id: 'vulnerability', label: 'Vulnerabilities', width: 26 },
      { id: 'existing_controls', label: 'Existing Controls', width: 31 },
      { id: 'cia', label: 'C, I, A Rating', width: 14 },
      { id: 'asset_value', label: 'Asset Value', width: 10 },
      { id: 'impact', label: 'Impact (I)', width: 10 },
      { id: 'likelihood', label: 'Likelihood (L)', width: 10 },
      { id: 'inherent', label: 'Inherent (AVxIxL)', width: 16 },
      { id: 'treatment_plan', label: 'Risk Treatment Plan', width: 33 },
      { id: 'status', label: 'Status', width: 14 },
      { id: 'res_asset_value', label: 'Asset Value', width: 10 },
      { id: 'res_impact', label: 'Residual Impact', width: 10 },
      { id: 'res_likelihood', label: 'Residual Prob.', width: 10 },
      { id: 'residual', label: 'Residual (AVxRIxRL)', width: 16 },
      { id: 'recurrence', label: 'Recurrence', width: 11 },
      { id: 'owner', label: 'Owner', width: 15 },
      { id: 'treatment_option', label: 'Treatment Option', width: 15 },
      { id: 'target_date', label: 'Target Date', width: 15 },
      { id: 'risk_status', label: 'Risk Status', width: 12 },
      { id: 'next_review', label: 'Next Review', width: 13 },
    ];

    const drawHeader = (doc: any) => {
      // Dark top header bar spanning A3 width (400mm total inside 10mm margins)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(10, 10, 400, 18, 'F');

      // Document Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("DOH / ISO 27001 / ADHICS COMPLIANCE REPORT VIEW", 14, 16.5);

      // Standard/Regulation label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("FACILITY REGULATION COMPLIANCE REGISTER • REVISION 2.2", 14, 22.5);

      // Facility Name on the right
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(clientName.toUpperCase(), 410 - 14, 16.5, { align: 'right' });

      // Date and Page on the right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}  |  PAGE 0${pageNum}`, 410 - 14, 22.5, { align: 'right' });
    };

    const drawFooter = (doc: any) => {
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(10, 285, 410, 285);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("REGULATORY STANDARD COMPLIANCE REGISTER", 12, 290);
      doc.text("ABU DHABI HEALTH AUTHORITY (DOH) STANDARDS V2 & ISO 27001:2022 & ADHICS", 210, 290, { align: 'center' });
      doc.text("© 2026 SMARTPRO.AE", 408, 290, { align: 'right' });
    };

    const drawTableHeader = (doc: any, y: number) => {
      // Indigo background
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(10, y, 400, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);

      let startX = 10;
      cols.forEach((col) => {
        const isCenter = ['cia', 'asset_value', 'impact', 'likelihood', 'inherent', 'res_asset_value', 'res_impact', 'res_likelihood', 'residual'].includes(col.id);
        if (isCenter) {
          doc.text(col.label, startX + col.width / 2, y + 5.5, { align: 'center', maxWidth: col.width - 1 });
        } else {
          doc.text(col.label, startX + 1.5, y + 5.5, { maxWidth: col.width - 2 });
        }
        startX += col.width;
      });
    };

    // DRAW PAGE 1 (Cover / Compliance Dashboard view)
    drawHeader(pdf);

    // 1. Executive Overview Box (now widened to 400mm width as Overall Metric box is removed)
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.rect(10, 32, 400, 30, 'FD');

    // Title: EXECUTIVE OVERVIEW
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 27, 75); // indigo-950
    pdf.text("EXECUTIVE OVERVIEW", 14, 38.5);

    // Separator line
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(14, 40.5, 406, 40.5);

    // Body Text (wrapped over A3 space)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(executiveOverviewText || '', 14, 45, { maxWidth: 390 });

    // 2. Draw 4 Cards side-by-side on A3 layout
    const cardY = 68;
    const cardWidth = 95;
    const cardGap = 6.6;
    const cardHeight = 42;

    // --- CARD 1: Facility Profile ---
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(10, cardY, cardWidth, cardHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text("FACILITY PROFILE", 13, cardY + 5);
    pdf.line(13, cardY + 6.5, 10 + cardWidth - 3, cardY + 6.5);

    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFontSize(7.5);
    // Display the License: number with the facility name in a single area
    const facilityLabel = isGroup ? (entityName || 'AL NASR PHARMACY') : `${entityName || 'AL NASR PHARMACY'} [License: ${currentClient?.doh_license_no || currentClient?.trade_license_no || 'PF1045'}]`;
    pdf.text(facilityLabel, 13, cardY + 11.5, { maxWidth: cardWidth - 6 });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);

    if (isGroup && branches && branches.length > 0) {
      // Group branches list on the left column of Card 1
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(79, 70, 229); // indigo-600
      pdf.text(`GROUP BRANCHES (${branches.length}):`, 13, cardY + 17);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(71, 85, 105);
      let bY = cardY + 21;
      branches.slice(0, 4).forEach((b) => {
        pdf.text(`• ${b.name} (${b.license_no || 'N/A'})`, 13, bY, { maxWidth: 42 });
        bY += 4.5;
      });
      if (branches.length > 4) {
        pdf.text(`• and ${branches.length - 4} more locations...`, 13, bY);
      }

      // Address, Tel, Email on the right column of Card 1
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Contact & Address:", 58, cardY + 17);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Address: ${currentClient?.address || 'Central District - Abu Dhabi'}`, 58, cardY + 21.5, { maxWidth: 42 });
      pdf.text(`Tel: ${currentClient?.phone || '0509680219'}`, 58, cardY + 31);
      pdf.text(`Email: ${currentClient?.email || 'nasrpharmacy@gmail.com'}`, 58, cardY + 36);
    } else {
      // Normal single facility: standard single column layout
      pdf.text(`Address: ${currentClient?.address || 'Central District - Abu Dhabi'}`, 13, cardY + 18, { maxWidth: cardWidth - 6 });
      pdf.text(`Tel: ${currentClient?.phone || '0509680219'}`, 13, cardY + 28);
      pdf.text(`Email: ${currentClient?.email || 'nasrpharmacy@gmail.com'}`, 13, cardY + 34);
    }

    // --- CARD 2: Document Metadata ---
    const card2X = 10 + cardWidth + cardGap; // 111.6
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card2X, cardY, cardWidth, cardHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("DOCUMENT METADATA", card2X + 3, cardY + 5);
    pdf.line(card2X + 3, cardY + 6.5, card2X + cardWidth - 3, cardY + 6.5);

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    pdf.text(`Ref: ${currentClient?.doc_ref || 'ZZP-IT-PE-05/2021'}`, card2X + 3, cardY + 11.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Classification: ", card2X + 3, cardY + 16.5);
    pdf.setTextColor(220, 38, 38); // red-600
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${currentClient?.doc_classification || 'RESTRICTED'}`, card2X + 18, cardY + 16.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Issue Date: ${formatDateDMY(currentClient?.doc_issue_date || '01/03/2022')}`, card2X + 3, cardY + 21.5);
    pdf.text(`Approved: ${formatDateDMY(currentClient?.doc_approved_date || '30/06/2026')}`, card2X + 3, cardY + 26.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(67, 56, 202); // indigo-700
    pdf.text(`Version: ${currentClient?.doc_version || '1.0'}`, card2X + 3, cardY + 36);

    // --- CARD 3: Risk Summary Stats ---
    const card3X = 10 + (cardWidth + cardGap) * 2; // 213.2
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card3X, cardY, cardWidth, cardHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("RISK SUMMARY STATS", card3X + 3, cardY + 5);
    pdf.line(card3X + 3, cardY + 6.5, card3X + cardWidth - 3, cardY + 6.5);

    const cWidth = 15;
    const cHeight = 20;
    const cY = cardY + 11;
    
    // Crit
    pdf.setFillColor(127, 29, 29);
    pdf.rect(card3X + 3, cY, cWidth, cHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CRIT", card3X + 3 + cWidth / 2, cY + 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${clientRisks.filter(r => getRiskScore(r, 'inherent') >= 76).length}`, card3X + 3 + cWidth / 2, cY + 13, { align: 'center' });

    // High
    pdf.setFillColor(239, 68, 68);
    pdf.rect(card3X + 3 + 18, cY, cWidth, cHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.text("HIGH", card3X + 3 + 18 + cWidth / 2, cY + 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 51 && sc <= 75; }).length}`, card3X + 3 + 18 + cWidth / 2, cY + 13, { align: 'center' });

    // Mod
    pdf.setFillColor(245, 158, 11);
    pdf.rect(card3X + 3 + 36, cY, cWidth, cHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("MOD", card3X + 3 + 36 + cWidth / 2, cY + 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 21 && sc <= 50; }).length}`, card3X + 3 + 36 + cWidth / 2, cY + 13, { align: 'center' });

    // Low
    pdf.setFillColor(52, 211, 153);
    pdf.rect(card3X + 3 + 54, cY, cWidth, cHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("LOW", card3X + 3 + 54 + cWidth / 2, cY + 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${clientRisks.filter(r => getRiskScore(r, 'inherent') <= 20).length}`, card3X + 3 + 54 + cWidth / 2, cY + 13, { align: 'center' });

    // Tot
    pdf.setFillColor(15, 23, 42);
    pdf.rect(card3X + 3 + 72, cY, cWidth, cHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOT", card3X + 3 + 72 + cWidth / 2, cY + 4, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${clientRisks.length}`, card3X + 3 + 72 + cWidth / 2, cY + 13, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(148, 163, 184);
    pdf.text("100% ACTIVE REGISTER RECORDS", card3X + cardWidth / 2, cardY + 36, { align: 'center' });

    // --- CARD 4: Version History ---
    const card4X = 10 + (cardWidth + cardGap) * 3; // 314.8
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card4X, cardY, cardWidth, cardHeight, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("VERSION HISTORY", card4X + 3, cardY + 5);
    pdf.line(card4X + 3, cardY + 6.5, card4X + cardWidth - 3, cardY + 6.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);

    const pdfVhList = (currentClient?.version_history && currentClient.version_history.length > 0)
      ? currentClient.version_history
      : [
          { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
        ];

    pdfVhList.slice(0, 3).forEach((vh, idx) => {
      const rowY = cardY + 13 + (idx * 6);
      pdf.text(vh.version || '', card4X + 3, rowY);
      pdf.text(vh.date || '', card4X + 15, rowY);
      const remarkTxt = vh.changes || (vh as any).change_description || (vh as any).remarks || vh.author || '';
      pdf.text(remarkTxt, card4X + cardWidth - 3, rowY, { align: 'right', maxWidth: 42 });
    });

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${currentClient?.doc_version || '1.0'} - LIVE AUDITED`, card4X + 3, cardY + 35);
    pdf.text(`Ref: ${currentClient?.doc_ref || 'ZZP-IT-PE-05/2021'}`, card4X + cardWidth - 3, cardY + 35, { align: 'right' });

    // --- NEW ELEMENT: Facility Committee Signatory Controls & Support Channels Box (placed on cover page where matrices were) ---
    const rawContacts = [
      {
        role: "Authorized Representative",
        name: currentClient?.auth_representative?.name || "",
        email: currentClient?.auth_representative?.email || "",
        phone: currentClient?.auth_representative?.phone || "",
        purview: "High-Level Executive Oversight"
      },
      {
        role: "Clinic Manager",
        name: currentClient?.clinic_manager?.name || "",
        email: currentClient?.clinic_manager?.email || "",
        phone: currentClient?.clinic_manager?.phone || "",
        purview: "General Governance Oversight"
      },
      {
        role: "Medical Director",
        name: currentClient?.medical_director?.name || "",
        email: currentClient?.medical_director?.email || "",
        phone: currentClient?.medical_director?.phone || "",
        purview: "Clinical Process Compliance"
      },
      {
        role: "IT Manager & Risk Officer",
        name: currentClient?.it_manager?.name || "",
        email: currentClient?.it_manager?.email || "",
        phone: currentClient?.it_manager?.phone || "",
        purview: "IT Systems & Backups Guardian"
      },
      {
        role: "HR Manager",
        name: currentClient?.hr_manager?.name || "",
        email: currentClient?.hr_manager?.email || "",
        phone: currentClient?.hr_manager?.phone || "",
        purview: "Personnel Security Training"
      },
      {
        role: "Third-Party IT Support",
        name: currentClient?.it_support?.team_name || "",
        email: currentClient?.it_support?.email || "",
        phone: currentClient?.it_support?.phone || "",
        purview: "External Network Firewalls"
      },
      {
        role: "Third-Party EMR Support",
        name: currentClient?.emr_support?.team_name || "",
        email: currentClient?.emr_support?.email || "",
        phone: currentClient?.emr_support?.phone || "",
        purview: "EMR Operations & Security"
      }
    ];

    const nonEmptyContacts = rawContacts.filter(contact => contact.name || contact.email || contact.phone);

    if (includeCommitteeDetails && nonEmptyContacts.length > 0) {
      const committeeY = 118;
      const committeeHeight = 16 + (nonEmptyContacts.length * 10);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.rect(10, committeeY, 400, committeeHeight, 'FD');

      // Box Header Accent Pill & Text
      pdf.setFillColor(99, 102, 241); // indigo-500
      pdf.rect(14, committeeY + 3.5, 2, 4.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 27, 75); // indigo-950
      pdf.text("FACILITY COMMITTEE SIGNATORY CONTROLS & THIRD-PARTY SUPPORT", 18, committeeY + 7);
      
      pdf.setDrawColor(241, 245, 249); // slate-100 divider
      pdf.line(14, committeeY + 9.5, 406, committeeY + 9.5);

      // Grid Columns for committee table
      const commCols = [
        { label: "COMMITTEE ROLE / DESIGNATION", width: 62 },
        { label: "AUTHORIZED MEMBER / CONTACT NAME", width: 92 },
        { label: "EMAIL ADDRESS", width: 108 },
        { label: "TELEPHONE / CONTACT CHANNEL", width: 68 },
        { label: "GOVERNANCE PURVIEW & CLEARANCE", width: 62 }
      ];

      // Table Header
      const commHeaderY = committeeY + 13;
      pdf.setFillColor(241, 245, 249); // slate-100 background for a smoother look
      pdf.rect(14, commHeaderY, 392, 7, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105); // slate-600 text
      let commX = 14;
      commCols.forEach(c => {
        pdf.text(c.label, commX + 2, commHeaderY + 5);
        commX += c.width;
      });

      // Render committee rows
      let currentCommRowY = commHeaderY + 7;
      nonEmptyContacts.forEach((contact, idx) => {
        if (idx % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(14, currentCommRowY, 392, 10, 'F');
        }

        pdf.setDrawColor(241, 245, 249);
        pdf.line(14, currentCommRowY + 10, 406, currentCommRowY + 10);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(71, 85, 105);

        let cX = 14;
        commCols.forEach((col, cIdx) => {
          let textVal = "";
          switch (cIdx) {
            case 0:
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(30, 41, 59);
              textVal = contact.role;
              break;
            case 1:
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(67, 56, 202);
              textVal = contact.name;
              break;
            case 2:
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(71, 85, 105);
              textVal = contact.email;
              break;
            case 3:
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(71, 85, 105);
              textVal = contact.phone;
              break;
            case 4:
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(100, 116, 139);
              textVal = contact.purview;
              break;
          }
          pdf.text(textVal, cX + 2, currentCommRowY + 6.5);
          cX += col.width;
        });

        currentCommRowY += 10;
      });
    }

    drawFooter(pdf);

    let currentY = 32;

    const drawSectionTable = (risksList: any[], sectionTitle: string, sectionColor: number[]) => {
      if (risksList.length === 0) return;

      if (currentY + 25 > 275) {
        drawFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawHeader(pdf);
        currentY = 32;
      }

      pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
      pdf.rect(10, currentY, 400, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(sectionTitle, 14, currentY + 5.5);
      currentY += 10;

      drawTableHeader(pdf, currentY);
      currentY += 8;

      risksList.forEach((r, idx) => {
        const assetVal = getAssetValue(r.asset_name, r);
        const inhScore = getRiskScore(r, 'inherent');
        const resScore = getRiskScore(r, 'residual');

        const resImp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
        const resLik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);

        const matchedAsset = clientAssets.find(a => a.asset_name.toLowerCase() === r.asset_name.toLowerCase());
        const cVal = r.c_val ?? matchedAsset?.c_val ?? 4;
        const iVal = r.i_val ?? matchedAsset?.i_val ?? 4;
        const aVal = r.a_val ?? matchedAsset?.a_val ?? 4;

        const formattedAssetVal = typeof assetVal === 'number' ? assetVal.toFixed(2).replace(/\.00$/, '') : assetVal;

        if (currentY + 16 > 275) {
          drawFooter(pdf);
          pdf.addPage();
          pageNum++;
          drawHeader(pdf);
          currentY = 32;
          drawTableHeader(pdf, currentY);
          currentY += 8;
        }

        if (idx % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(10, currentY, 400, 16, 'F');
        }

        pdf.setDrawColor(226, 232, 240);
        pdf.line(10, currentY + 16, 410, currentY + 16);

        let lineX = 10;
        pdf.setDrawColor(241, 245, 249);
        cols.forEach((col) => {
          pdf.line(lineX, currentY, lineX, currentY + 16);
          lineX += col.width;
        });
        pdf.line(410, currentY, 410, currentY + 16);

        let startX = 10;
        cols.forEach((col) => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(5.5);
          pdf.setTextColor(71, 85, 105);

          let val = '';
          let isBadgeInherent = false;
          let isBadgeResidual = false;
          let isStatusColor = false;
          let isRiskStatusColor = false;
          let alignOption: 'left' | 'center' = 'left';

          switch (col.id) {
            case 'risk_id':
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(67, 56, 202);
              val = r.risk_id || `RSK-${idx + 1}`;
              break;
            case 'domain':
              val = r.domain || 'Information Security';
              break;
            case 'risk_ident_date':
              val = r.identification_date || r.created_at?.substring(0, 10) || assessmentDate || '2023-05-18';
              break;
            case 'asset_name': {
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(15, 23, 42);
              val = r.asset_name || 'N/A';
              break;
            }
            case 'threat':
              val = r.threat || 'N/A';
              break;
            case 'risk_title':
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(15, 23, 42);
              val = r.risk_title || '';
              break;
            case 'vulnerability':
              val = r.vulnerability || 'N/A';
              break;
            case 'existing_controls':
              val = r.existing_controls || 'None';
              break;
            case 'cia':
              pdf.setFont('helvetica', 'bold');
              alignOption = 'center';
              val = `C:${cVal}, I:${iVal}, A:${aVal}`;
              break;
            case 'asset_value':
              pdf.setFont('helvetica', 'bold');
              alignOption = 'center';
              val = `${formattedAssetVal}`;
              break;
            case 'impact':
              alignOption = 'center';
              val = `${r.impact}`;
              break;
            case 'likelihood':
              alignOption = 'center';
              val = `${r.likelihood}`;
              break;
            case 'inherent':
              alignOption = 'center';
              isBadgeInherent = true;
              break;
            case 'treatment_plan':
              val = r.treatment_plan || 'N/A';
              break;
            case 'status':
              isStatusColor = true;
              val = (r.mitigation_status || 'Open').toUpperCase();
              break;
            case 'res_asset_value':
              pdf.setFont('helvetica', 'bold');
              alignOption = 'center';
              val = `${formattedAssetVal}`;
              break;
            case 'res_impact':
              alignOption = 'center';
              val = `${resImp}`;
              break;
            case 'res_likelihood':
              alignOption = 'center';
              val = `${resLik}`;
              break;
            case 'residual':
              alignOption = 'center';
              isBadgeResidual = true;
              break;
            case 'recurrence':
              alignOption = 'center';
              val = r.recurrence || 'Ongoing';
              break;
            case 'owner':
              val = r.risk_owner || 'IT Manager';
              break;
            case 'treatment_option':
              val = r.treatment_option || 'Reduction';
              break;
            case 'target_date':
              pdf.setFont('helvetica', 'normal');
              val = r.target_closing_date || '2026-12-31';
              break;
            case 'risk_status':
              isRiskStatusColor = true;
              val = (r.status || 'OPEN').toUpperCase();
              break;
            case 'next_review':
              pdf.setFont('helvetica', 'normal');
              val = r.next_review_date || 'Annual';
              break;
          }

          if (isBadgeInherent) {
            let badgeColor = [16, 185, 129];
            if (inhScore >= 76) badgeColor = [127, 29, 29];
            else if (inhScore >= 51) badgeColor = [239, 68, 68];
            else if (inhScore >= 21) badgeColor = [245, 158, 11];

            pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
            pdf.rect(startX + 1, currentY + 2, col.width - 2, 5, 'F');
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(5.5);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${inhScore}`, startX + col.width / 2, currentY + 5.5, { align: 'center' });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(4.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`${formattedAssetVal}*${r.impact}*${r.likelihood}`, startX + col.width / 2, currentY + 11.5, { align: 'center' });
          } 
          else if (isBadgeResidual) {
            let resBadgeColor = [16, 185, 129];
            if (resScore >= 76) resBadgeColor = [127, 29, 29];
            else if (resScore >= 51) resBadgeColor = [239, 68, 68];
            else if (resScore >= 21) resBadgeColor = [245, 158, 11];

            pdf.setFillColor(resBadgeColor[0], resBadgeColor[1], resBadgeColor[2]);
            pdf.rect(startX + 1, currentY + 2, col.width - 2, 5, 'F');
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(5.5);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${resScore}`, startX + col.width / 2, currentY + 5.5, { align: 'center' });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(4.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`${formattedAssetVal}*${resImp}*${resLik}`, startX + col.width / 2, currentY + 11.5, { align: 'center' });
          }
          else if (isStatusColor) {
            pdf.setFont('helvetica', 'bold');
            if (val === 'TREATED' || val === 'REMEDIATED' || val === 'REDUCE' || val === 'CLOSED' || val === 'REDUCTION' || val === 'MITIGATED') {
              pdf.setTextColor(16, 185, 129);
            } else {
              pdf.setTextColor(245, 158, 11);
            }
            pdf.text(val, startX + 1.5, currentY + 8.5, { maxWidth: col.width - 2 });
          }
          else if (isRiskStatusColor) {
            pdf.setFont('helvetica', 'bold');
            if (val === 'CLOSED') {
              pdf.setTextColor(16, 185, 129);
            } else {
              pdf.setTextColor(245, 158, 11);
            }
            pdf.text(val, startX + 1.5, currentY + 8.5, { maxWidth: col.width - 2 });
          }
          else {
            if (alignOption === 'center') {
              pdf.text(val, startX + col.width / 2, currentY + 8.5, { align: 'center', maxWidth: col.width - 2 });
            } else {
              pdf.text(val, startX + 1.5, currentY + 4.5, { maxWidth: col.width - 2 });
            }
          }

          startX += col.width;
        });

        currentY += 16;
      });
    };

    // Draw separate tables for Physical and Digital Asset Risks
    pdf.addPage();
    pageNum++;
    drawHeader(pdf);
    currentY = 32;

    const physicalRisks = sortedRisks.filter(r => getRiskAssetCategoryAndCode(r).category === 'Physical Assets');
    const digitalRisks = sortedRisks.filter(r => getRiskAssetCategoryAndCode(r).category === 'Digital Assets Risks');

    if (physicalRisks.length > 0) {
      drawSectionTable(
        physicalRisks,
        `1. DETAILED RISK ASSESSMENT REGISTER - PHYSICAL ASSETS RISKS (${physicalRisks.length} RECORDS) • RISK IDENTIFICATION DATE: ${assessmentDate}`,
        [16, 185, 129] // Emerald Green for Physical
      );
    }

    if (digitalRisks.length > 0) {
      // If we are getting too low on the current page, add a fresh page
      if (currentY > 140) {
        drawFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawHeader(pdf);
        currentY = 32;
      } else {
        currentY += 12; // nice separation gap
      }

      drawSectionTable(
        digitalRisks,
        `2. DETAILED RISK ASSESSMENT REGISTER - DIGITAL ASSETS RISKS (${digitalRisks.length} RECORDS) • RISK IDENTIFICATION DATE: ${assessmentDate}`,
        [67, 56, 202] // Indigo for Digital
      );
    }

    drawFooter(pdf);

    // DRAW FINAL PAGE (Heatmaps + Sign-off + Directory)
    pdf.addPage();
    pageNum++;
    drawHeader(pdf);

    const drawMatrix = (startX: number, heatmapY: number, matrixContainerWidth: number, matrixContainerHeight: number, matrixType: 'inherent' | 'residual', title: string) => {
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(startX, heatmapY, matrixContainerWidth, matrixContainerHeight, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 27, 75);
      pdf.text(title, startX + 5, heatmapY + 8);
      pdf.line(startX + 5, heatmapY + 10.5, startX + matrixContainerWidth - 5, heatmapY + 10.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      
      pdf.text("ASSET IMPACT SEVERITY (I)", startX + 4, heatmapY + 54, { angle: 90, align: 'center' });
      pdf.text("LIKELIHOOD OF OCCURRENCE (L)", startX + 70, heatmapY + 92, { align: 'center' });

      const gridX = startX + 22;
      const gridY = heatmapY + 16;
      const cellW = 18;
      const cellH = 12;

      for (let imp = 5; imp >= 1; imp--) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`${imp}`, gridX - 4, gridY + ((5 - imp) * cellH) + cellH / 2 + 1.5, { align: 'right' });

        for (let lik = 1; lik <= 5; lik++) {
          const baseAvgAsset = 4.3;
          const rawScore = baseAvgAsset * imp * lik;
          const score = Math.round(rawScore);

          const matchedRecords = clientRisks.filter(r => {
            const rImp = matrixType === 'inherent' ? r.impact : (r.residual_impact !== undefined ? r.residual_impact : r.impact);
            const rLik = matrixType === 'inherent' ? r.likelihood : (r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1));
            return rImp === imp && rLik === lik;
          });

          let cellColor = [16, 185, 129];
          if (score >= 76) cellColor = [127, 29, 29];
          else if (score >= 51) cellColor = [239, 68, 68];
          else if (score >= 21) cellColor = [245, 158, 11];

          pdf.setFillColor(cellColor[0], cellColor[1], cellColor[2]);
          pdf.rect(gridX + (lik - 1) * cellW, gridY + (5 - imp) * cellH, cellW, cellH, 'F');

          pdf.setDrawColor(255, 255, 255);
          pdf.setLineWidth(0.4);
          pdf.rect(gridX + (lik - 1) * cellW, gridY + (5 - imp) * cellH, cellW, cellH, 'D');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`${matchedRecords.length} Recs`, gridX + (lik - 1) * cellW + cellW / 2, gridY + (5 - imp) * cellH + 4.5, { align: 'center' });

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(4.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`sc:${score}`, gridX + (lik - 1) * cellW + cellW / 2, gridY + (5 - imp) * cellH + 9.5, { align: 'center' });
        }
      }

      for (let lik = 1; lik <= 5; lik++) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`${lik}`, gridX + (lik - 1) * cellW + cellW / 2, gridY + (5 * cellH) + 4.5, { align: 'center' });
      }

      const legendX = startX + 115;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(71, 85, 105);
      pdf.text("LEGEND", legendX, heatmapY + 16);

      pdf.setFillColor(127, 29, 29);
      pdf.rect(legendX, heatmapY + 19, 3, 3, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Critical (>=76)", legendX + 4.5, heatmapY + 21.5);

      pdf.setFillColor(239, 68, 68);
      pdf.rect(legendX, heatmapY + 24, 3, 3, 'F');
      pdf.text("High (51-75)", legendX + 4.5, heatmapY + 26.5);

      pdf.setFillColor(245, 158, 11);
      pdf.rect(legendX, heatmapY + 29, 3, 3, 'F');
      pdf.text("Moderate (21-50)", legendX + 4.5, heatmapY + 31.5);

      pdf.setFillColor(52, 211, 153);
      pdf.rect(legendX, heatmapY + 34, 3, 3, 'F');
      pdf.text("Low (<=20)", legendX + 4.5, heatmapY + 36.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(71, 85, 105);
      pdf.text("GUIDELINE NOTES", legendX, heatmapY + 44);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      
      const noteText = matrixType === 'inherent' 
        ? "Inherent Risk Map represents raw severity levels before the application of corrective actions or procedural controls."
        : "Residual Risk Map represents remaining mitigated exposure following successful implementation of recommended plans.";
      pdf.text(noteText, legendX, heatmapY + 48, { maxWidth: 35 });
    };

    drawMatrix(10, 32, 195, 100, 'inherent', "A. INHERENT RISK HEATMAP MATRIX");
    drawMatrix(215, 32, 195, 100, 'residual', "B. RESIDUAL RISK HEATMAP MATRIX");

    const bottomRowY = 140;

    // Card 2: Consultancy & Risk Assessment Directory (Horizontal placement, side-by-side)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(10, bottomRowY, 260, 55, 'FD');

    pdf.setFillColor(99, 102, 241); // Indigo accent pill
    pdf.rect(14, bottomRowY + 3.5, 2, 4.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 27, 75);
    pdf.text("CONSULTANCY & RISK ASSESSMENT DIRECTORY", 18, bottomRowY + 7);
    
    pdf.setDrawColor(241, 245, 249);
    pdf.line(14, bottomRowY + 9.5, 266, bottomRowY + 9.5);

    // Left Column inside Directory Card
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(67, 56, 202);
    pdf.text("Risk Assessment by:", 14, bottomRowY + 15);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Aseef Sulaiman -IT Manager, | Smartpro Consultancy | info@smartpro.ae | www.smartpro.ae", 14, bottomRowY + 19.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(67, 56, 202);
    pdf.text("Risk Identification & Assessment Date:", 14, bottomRowY + 28);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(assessmentDate, 14, bottomRowY + 32.5);

    // Right Column inside Directory Card (Clean representation of key properties)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Licensing Authority: DOH / Abu Dhabi Commerce", 135, bottomRowY + 15);
    pdf.text("Global Compliance Framework: ADHICS v2 / ISO 27001", 135, bottomRowY + 20);

    // Mini Seal Stamp inside Directory Card
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(135, bottomRowY + 29, 131, 21, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("SMARTPRO CONSULTANCY OFFICIAL SEAL & STAMP", 135 + 65.5, bottomRowY + 33, { align: 'center' });
    pdf.line(139, bottomRowY + 35, 135 + 127, bottomRowY + 35);

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Digitally Verified Audit & ISO 27001 Regulatory Seal", 135 + 65.5, bottomRowY + 41, { align: 'center' });
    pdf.text("Smartpro Consultancy Compliance Division", 135 + 65.5, bottomRowY + 46, { align: 'center' });


    // Card 3: Authorized Signature & Stamp (Side-by-side with Directory)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(290, bottomRowY, 120, 55, 'FD');

    pdf.setFillColor(99, 102, 241); // Indigo accent pill
    pdf.rect(294, bottomRowY + 3.5, 2, 4.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 27, 75);
    pdf.text("AUTHORIZED SIGN-OFF", 298, bottomRowY + 7);
    
    pdf.setDrawColor(241, 245, 249);
    pdf.line(294, bottomRowY + 9.5, 406, bottomRowY + 9.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Authorized by Clinic Director:", 294, bottomRowY + 14.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(entityName.toUpperCase(), 294, bottomRowY + 19.5);

    // Signature Area Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(294, bottomRowY + 23, 112, 21, 'FD');

    pdf.setDrawColor(148, 163, 184);
    pdf.line(298, bottomRowY + 36, 402, bottomRowY + 36);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Authorized Signature & Stamp", 294 + 56, bottomRowY + 40, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Date: ____ / ____ / 2026", 294, bottomRowY + 48.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Abu Dhabi Healthcare Division | Compliance Code: ADHICS-COMP-V2", 294, bottomRowY + 52.5);


    // --- NEW ELEMENT: Risk Rating & Acceptance Criteria Horizontal Box Table (Full width below directory & sign-off) ---
    const criteriaYStart = 202;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(10, criteriaYStart, 400, 73, 'FD');

    pdf.setFillColor(99, 102, 241); // Indigo accent pill
    pdf.rect(14, criteriaYStart + 3, 2, 4.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 27, 75);
    pdf.text("RISK RATING & ACCEPTANCE CRITERIA METHODOLOGY", 18, criteriaYStart + 6.5);
    
    pdf.setDrawColor(241, 245, 249);
    pdf.line(14, criteriaYStart + 9, 406, criteriaYStart + 9);

    // Table Headers
    const gridTableHeaderY = criteriaYStart + 11.5;
    pdf.setFillColor(241, 245, 249); // slate-100 header
    pdf.rect(14, gridTableHeaderY, 392, 5.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text("RISK SCORE", 16, gridTableHeaderY + 4);
    pdf.text("RISK LEVEL", 56, gridTableHeaderY + 4);
    pdf.text("RESPONSE & ACCEPTANCE CRITERIA DETAILS", 96, gridTableHeaderY + 4);

    // Rows layout (4 rows, 13mm each)
    let currentCritRowY = gridTableHeaderY + 5.5;

    // Row 1: Low Risk (Teal pastel)
    pdf.setFillColor(240, 253, 250); // teal-50
    pdf.rect(14, currentCritRowY, 392, 12, 'F');
    pdf.setDrawColor(204, 251, 241); // teal-100 border line
    pdf.line(14, currentCritRowY + 12, 406, currentCritRowY + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(13, 148, 136); // teal-600
    pdf.text("1–20", 16, currentCritRowY + 7.5);
    pdf.text("Low Risk", 56, currentCritRowY + 7.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(15, 118, 110); // teal-800
    pdf.text("Acceptable level of risk with no significant impact on safety, clinical services, or data security. Risk is tolerated and periodically monitored.", 96, currentCritRowY + 4.5, { maxWidth: 304 });

    currentCritRowY += 12;

    // Row 2: Moderate Risk (Amber pastel)
    pdf.setFillColor(254, 243, 199); // amber-50
    pdf.rect(14, currentCritRowY, 392, 12, 'F');
    pdf.setDrawColor(252, 211, 77); // amber-200 border line
    pdf.line(14, currentCritRowY + 12, 406, currentCritRowY + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(180, 83, 9); // amber-700
    pdf.text("21–50", 16, currentCritRowY + 7.5);
    pdf.text("Moderate", 56, currentCritRowY + 7.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(120, 53, 4); // amber-900
    pdf.text("Mitigation required. Implement cost-effective strategies; monitor for potential frequency, scope, or severity escalation.", 96, currentCritRowY + 4.5, { maxWidth: 304 });

    currentCritRowY += 12;

    // Row 3: High Risk (Red/Orange pastel)
    pdf.setFillColor(254, 242, 242); // red-50
    pdf.rect(14, currentCritRowY, 392, 12, 'F');
    pdf.setDrawColor(254, 202, 202); // red-200 border line
    pdf.line(14, currentCritRowY + 12, 406, currentCritRowY + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(185, 28, 28); // red-700
    pdf.text("51–75", 16, currentCritRowY + 7.5);
    pdf.text("High Risk", 56, currentCritRowY + 7.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(153, 27, 27); // red-800
    pdf.text("Immediate attention. Deploy strong controls, increase monitoring frequency, notify department heads, and assign remedial ownership.", 96, currentCritRowY + 4.5, { maxWidth: 304 });

    currentCritRowY += 12;

    // Row 4: Critical Risk (Deep Red/Rose pastel)
    pdf.setFillColor(255, 241, 242); // rose-50
    pdf.rect(14, currentCritRowY, 392, 12, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(190, 24, 74); // rose-700
    pdf.text("76–125", 16, currentCritRowY + 7.5);
    pdf.text("Critical", 56, currentCritRowY + 7.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(159, 18, 57); // rose-900
    pdf.text("Unacceptable. Urgent mitigation required via immediate corrective actions, risk transfer, or cessation of vulnerable operations.", 96, currentCritRowY + 4.5, { maxWidth: 304 });


    drawFooter(pdf);

    return pdf;
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    
    let parentElement: HTMLElement | null = null;
    let originalTransform = '';
    let originalTransition = '';

    // Overrides tracking to completely bypass html2canvas stylesheet parsing bugs
    let originalDocumentStyleSheets: PropertyDescriptor | undefined = undefined;
    let didOverrideMainStyleSheets = false;
    let originalProtoStyleSheetsGetter: (() => StyleSheetList) | undefined = undefined;
    let didOverrideProtoStyleSheets = false;
    let tempStyle: HTMLStyleElement | null = null;

    let originalParentGetComputedStyle = window.getComputedStyle;
    let didOverrideParentGetComputedStyle = false;

    // Create helper canvas inside the main document context for oklch -> rgba conversion
    const canvasHelper = document.createElement('canvas');
    canvasHelper.width = 1;
    canvasHelper.height = 1;
    const ctxHelper = canvasHelper.getContext('2d');

    const oklchToRgb = (l: number, c: number, h: number): [number, number, number] => {
      const hRad = (h * Math.PI) / 180;
      const a_coord = c * Math.cos(hRad);
      const b_coord = c * Math.sin(hRad);
      const l_ = l + 0.3963377774 * a_coord + 0.2158037573 * b_coord;
      const m_ = l - 0.1055613458 * a_coord - 0.0638541728 * b_coord;
      const s_ = l - 0.0894841775 * a_coord - 1.2914855414 * b_coord;
      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;
      const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
      const toSRGB = (x: number) => {
        return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      };
      const r_val = Math.round(Math.max(0, Math.min(1, toSRGB(rL))) * 255);
      const g_val = Math.round(Math.max(0, Math.min(1, toSRGB(gL))) * 255);
      const b_val = Math.round(Math.max(0, Math.min(1, toSRGB(bL))) * 255);
      return [r_val, g_val, b_val];
    };

    const convertSingleColorToRgb = (colorStr: string): string => {
      try {
        if (!colorStr) return '#1e293b';

        // Parse OKLCH mathematically
        if (colorStr.includes('oklch')) {
          const match = colorStr.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/);
          if (match) {
            const l = parseFloat(match[1]);
            const c = parseFloat(match[2]);
            const h = parseFloat(match[3]);
            let alpha = 1;
            if (match[4]) {
              if (match[4].endsWith('%')) {
                alpha = parseFloat(match[4]) / 100;
              } else {
                alpha = parseFloat(match[4]);
              }
            }
            const [outR, outG, outB] = oklchToRgb(l, c, h);
            return `rgba(${outR}, ${outG}, ${outB}, ${alpha})`;
          }
        }

        if (!ctxHelper) return '#1e293b';
        ctxHelper.clearRect(0, 0, 1, 1);
        ctxHelper.fillStyle = 'rgba(0,0,0,0)';
        ctxHelper.fillStyle = colorStr;
        const data = ctxHelper.getImageData(0, 0, 1, 1).data;
        if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0 && !colorStr.includes('transparent')) {
          return '#1e293b'; // Default text color fallback if it was rendered completely transparently
        }
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
      } catch (e) {
        return '#1e293b';
      }
    };

    const resolveModernColorsInString = (str: string): string => {
      if (!str || typeof str !== 'string') return str;
      let result = str;

      try {
        // oklch
        result = result.replace(/oklch\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        // oklab
        result = result.replace(/oklab\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        // color-mix
        result = result.replace(/color-mix\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        // light-dark
        result = result.replace(/light-dark\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
      } catch (e) {
        console.warn('Failed in regex color translation:', e);
      }
      return result;
    };

    try {
      const clientName = currentClient?.company_name || 'AL NASR PHARMACY';
      const element = document.getElementById("printable-pdf-content");
      
      let pdf;
      if (element) {
        // Extract all existing CSS rules and sanitize them
        let compiledCssText = '';
        try {
          const originalSheets = Array.from(document.styleSheets);
          for (const sheet of originalSheets) {
            try {
              if (!sheet.cssRules) continue;
              for (let i = 0; i < sheet.cssRules.length; i++) {
                compiledCssText += sheet.cssRules[i].cssText + '\n';
              }
            } catch (e) {
              // Ignore security or cross-origin errors
            }
          }
        } catch (e) {
          console.warn('Failed to compile original stylesheets:', e);
        }

        // Convert oklch / oklab / color-mix to rgba in compiled CSS
        const sanitizedCssText = resolveModernColorsInString(compiledCssText);

        // Create temporary style element with the sanitized stylesheet
        tempStyle = document.createElement('style');
        tempStyle.textContent = sanitizedCssText;
        document.head.appendChild(tempStyle);

        let mockSheetsList: StyleSheetList | null = null;
        if (tempStyle.sheet) {
          mockSheetsList = [tempStyle.sheet] as unknown as StyleSheetList;
        }

        // Temporarily override styleSheets lookup on main document and Document prototype.
        try {
          originalDocumentStyleSheets = Object.getOwnPropertyDescriptor(document, 'styleSheets');
          Object.defineProperty(document, 'styleSheets', {
            get() {
              return mockSheetsList || ([] as unknown as StyleSheetList);
            },
            configurable: true
          });
          didOverrideMainStyleSheets = true;
        } catch (e) {
          console.warn('Failed to override main document.styleSheets:', e);
        }

        try {
          const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');
          if (descriptor && descriptor.get) {
            originalProtoStyleSheetsGetter = descriptor.get;
            Object.defineProperty(Document.prototype, 'styleSheets', {
              get() {
                return mockSheetsList || ([] as unknown as StyleSheetList);
              },
              configurable: true
            });
            didOverrideProtoStyleSheets = true;
          }
        } catch (e) {
          console.warn('Failed to override Document.prototype.styleSheets:', e);
        }

        // Intercept parent window's getComputedStyle
        try {
          window.getComputedStyle = function (el: Element, pseudo?: string) {
            const styles = originalParentGetComputedStyle.call(this, el, pseudo);
            return new Proxy(styles, {
              get(target, prop) {
                if (typeof prop === 'string') {
                  if (prop === 'getPropertyValue') {
                    return function (propertyName: string) {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === 'string' && (
                        val.includes('oklch') || 
                        val.includes('oklab') || 
                        val.includes('color-mix') || 
                        val.includes('light-dark')
                      )) {
                        return resolveModernColorsInString(val);
                      }
                      return val;
                    };
                  }
                }
                const val = target[prop as keyof typeof target];
                if (typeof val === 'string' && (
                  val.includes('oklch') || 
                  val.includes('oklab') || 
                  val.includes('color-mix') || 
                  val.includes('light-dark')
                )) {
                  return resolveModernColorsInString(val);
                }
                if (typeof val === 'function') {
                  return (val as Function).bind(target);
                }
                return val;
              }
            }) as CSSStyleDeclaration;
          };
          didOverrideParentGetComputedStyle = true;
        } catch (e) {
          console.warn('Failed to override parent window.getComputedStyle:', e);
        }

        // Temporarily reset zoom/scale transform on original parent element to prevent html2canvas bounding-box calculation bugs
        parentElement = element.parentElement;
        if (parentElement) {
          originalTransform = parentElement.style.transform;
          originalTransition = parentElement.style.transition;
          parentElement.style.transform = 'none';
          parentElement.style.transition = 'none';
        }

        // Wait a frame for the layout to recalculate un-scaled dimensions
        await new Promise(resolve => requestAnimationFrame(resolve));

        const width = element.scrollWidth || 1280;
        const height = element.scrollHeight || 900;

        // Capture the pixel-perfect HTML preview container at double-scale for extreme crispness
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          width: width,
          height: height,
          windowWidth: width + 100,
          windowHeight: height + 100,
          onclone: (clonedDoc) => {
            // Force the cloned document and its prototype to return the sanitized styleSheets list
            try {
              Object.defineProperty(clonedDoc, 'styleSheets', {
                get() {
                  return mockSheetsList || ([] as unknown as StyleSheetList);
                },
                configurable: true
              });
            } catch (e) {
              console.warn('Failed to override clonedDoc.styleSheets:', e);
            }

            const clonedProto = clonedDoc.defaultView?.Document?.prototype;
            if (clonedProto) {
              try {
                Object.defineProperty(clonedProto, 'styleSheets', {
                  get() {
                    return mockSheetsList || ([] as unknown as StyleSheetList);
                  },
                  configurable: true
                });
              } catch (e) {
                console.warn('Failed to override cloned Document.prototype.styleSheets:', e);
              }
            }

            // Keep adoptedStyleSheets empty if supported to prevent native Chrome layout isolation conflicts
            if (clonedDoc.adoptedStyleSheets) {
              try {
                clonedDoc.adoptedStyleSheets = [];
              } catch (e) {}
            }

            // Intercept window.getComputedStyle inside the cloned iframe
            const view = clonedDoc.defaultView || window;
            if (view) {
              const originalGetComputedStyle = view.getComputedStyle;
              view.getComputedStyle = function (el: Element, pseudo?: string) {
                const styles = originalGetComputedStyle.call(this, el, pseudo);
                return new Proxy(styles, {
                  get(target, prop) {
                    if (typeof prop === 'string') {
                      if (prop === 'getPropertyValue') {
                        return function (propertyName: string) {
                          const val = target.getPropertyValue(propertyName);
                          if (typeof val === 'string' && (
                            val.includes('oklch') || 
                            val.includes('oklab') || 
                            val.includes('color-mix') || 
                            val.includes('light-dark')
                          )) {
                            return resolveModernColorsInString(val);
                          }
                          return val;
                        };
                      }
                    }
                    const val = target[prop as keyof typeof target];
                    if (typeof val === 'string' && (
                      val.includes('oklch') || 
                      val.includes('oklab') || 
                      val.includes('color-mix') || 
                      val.includes('light-dark')
                    )) {
                      return resolveModernColorsInString(val);
                    }
                    if (typeof val === 'function') {
                      return (val as Function).bind(target);
                    }
                    return val;
                  }
                }) as CSSStyleDeclaration;
              };
            }

            // Sanitize all inline styles in the cloned document
            const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
            allElements.forEach((el) => {
              if (el.getAttribute && el.getAttribute('style')) {
                const styleAttr = el.getAttribute('style');
                if (styleAttr && (
                  styleAttr.includes('oklch') || 
                  styleAttr.includes('oklab') || 
                  styleAttr.includes('color-mix') || 
                  styleAttr.includes('light-dark')
                )) {
                  el.setAttribute('style', resolveModernColorsInString(styleAttr));
                }
              }
            });

            // Inject highly specific HEX overrides to completely bypass Tailwind 4 oklch/color-mix CSS parsing bugs in html2canvas
            const overrideStyle = clonedDoc.createElement('style');
            overrideStyle.textContent = `
              #printable-pdf-content {
                background-color: #ffffff !important;
                color: #1e293b !important;
                font-family: system-ui, -apple-system, sans-serif !important;
              }
              #printable-pdf-content * {
                box-sizing: border-box !important;
              }
              #printable-pdf-content .bg-white {
                background-color: #ffffff !important;
              }
              #printable-pdf-content .bg-slate-50 {
                background-color: #f8fafc !important;
              }
              #printable-pdf-content .bg-slate-100 {
                background-color: #f1f5f9 !important;
              }
              #printable-pdf-content .bg-slate-900 {
                background-color: #0f172a !important;
              }
              #printable-pdf-content .bg-slate-950 {
                background-color: #020617 !important;
              }
              #printable-pdf-content .text-white {
                color: #ffffff !important;
              }
              #printable-pdf-content .text-slate-950 {
                color: #020617 !important;
              }
              #printable-pdf-content .text-slate-900 {
                color: #0f172a !important;
              }
              #printable-pdf-content .text-slate-800 {
                color: #1e293b !important;
              }
              #printable-pdf-content .text-slate-700 {
                color: #334155 !important;
              }
              #printable-pdf-content .text-slate-600 {
                color: #475569 !important;
              }
              #printable-pdf-content .text-slate-500 {
                color: #64748b !important;
              }
              #printable-pdf-content .text-slate-400 {
                color: #94a3b8 !important;
              }
              #printable-pdf-content .text-indigo-950 {
                color: #17153b !important;
              }
              #printable-pdf-content .text-indigo-900 {
                color: #312e81 !important;
              }
              #printable-pdf-content .text-indigo-800 {
                color: #3730a3 !important;
              }
              #printable-pdf-content .text-indigo-700 {
                color: #4338ca !important;
              }
              #printable-pdf-content .text-emerald-850,
              #printable-pdf-content .text-emerald-800 {
                color: #065f46 !important;
              }
              #printable-pdf-content .text-emerald-700 {
                color: #047857 !important;
              }
              #printable-pdf-content .text-rose-800 {
                color: #9f1239 !important;
              }
              #printable-pdf-content .text-rose-700 {
                color: #be123c !important;
              }
              #printable-pdf-content .text-amber-800 {
                color: #92400e !important;
              }
              #printable-pdf-content .text-amber-700 {
                color: #b45309 !important;
              }
              #printable-pdf-content .border-slate-900 {
                border-color: #0f172a !important;
              }
              #printable-pdf-content .border-slate-400 {
                border-color: #94a3b8 !important;
              }
              #printable-pdf-content .border-slate-300 {
                border-color: #cbd5e1 !important;
              }
              #printable-pdf-content .border-slate-200 {
                border-color: #e2e8f0 !important;
              }
              #printable-pdf-content .border-slate-100 {
                border-color: #f1f5f9 !important;
              }
              #printable-pdf-content .bg-rose-900 {
                background-color: #4c0519 !important;
              }
              #printable-pdf-content .bg-rose-500 {
                background-color: #f43f5e !important;
              }
              #printable-pdf-content .bg-amber-400 {
                background-color: #fbbf24 !important;
              }
              #printable-pdf-content .bg-emerald-400 {
                background-color: #34d399 !important;
              }
              #printable-pdf-content .bg-emerald-100 {
                background-color: #d1fae5 !important;
              }
              #printable-pdf-content .bg-rose-100 {
                background-color: #ffe4e6 !important;
              }
              #printable-pdf-content .bg-amber-100 {
                background-color: #fef3c7 !important;
              }
              #printable-pdf-content .bg-indigo-100 {
                background-color: #e0e7ff !important;
              }
              #printable-pdf-content .bg-indigo-600 {
                background-color: #4f46e5 !important;
              }
              #printable-pdf-content table {
                border-collapse: collapse !important;
                width: 100% !important;
              }
              #printable-pdf-content th {
                background-color: #0f172a !important;
                color: #ffffff !important;
              }
              #printable-pdf-content td, #printable-pdf-content th {
                border: 1px solid #cbd5e1 !important;
              }
              /* Heatmap Matrix fixes */
              #printable-pdf-content .w-8.h-4 {
                width: 32px !important;
                height: 16px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 1px !important;
              }
            `;
            clonedDoc.head.appendChild(overrideStyle);
          }
        });
        
        pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = 297;
        const pdfHeight = 210;
        const margin = 10;
        const printableWidth = pdfWidth - (margin * 2);
        const printableHeight = pdfHeight - (margin * 2);

        // Slice canvas into multi-page chunks if it exceeds printable aspect ratio
        const pageAspectRatio = printableHeight / printableWidth;
        const canvasPageHeight = canvas.width * pageAspectRatio;
        const totalCanvasHeight = canvas.height;
        const numPages = Math.ceil(totalCanvasHeight / canvasPageHeight);

        for (let i = 0; i < numPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const sourceY = i * canvasPageHeight;
          const sourceHeight = Math.min(canvasPageHeight, totalCanvasHeight - sourceY);

          // Create sliced canvas segment with the exact height of the source slice to prevent stretching
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sourceHeight;
          const sliceCtx = sliceCanvas.getContext('2d');

          if (sliceCtx) {
            // Fill sliced background with white
            sliceCtx.fillStyle = '#ffffff';
            sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

            // Draw segment from original canvas
            sliceCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
          }

          const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
          
          // Calculate the target height in mm based on slice aspect ratio
          const sliceRatio = sourceHeight / canvas.width;
          const targetHeight = printableWidth * sliceRatio;
          
          let finalWidth = printableWidth;
          let finalHeight = targetHeight;
          
          // Ensure it stays within page boundaries
          if (finalHeight > printableHeight) {
            finalHeight = printableHeight;
            finalWidth = printableHeight / sliceRatio;
          }
          
          // Center the image horizontally and vertically inside page margins
          const x = margin + (printableWidth - finalWidth) / 2;
          const y = margin + (printableHeight - finalHeight) / 2;

          pdf.addImage(sliceImgData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
        }
      } else {
        // Fallback to programmatic pdf generation if the DOM element is not active
        pdf = generatePdfInstance();
      }

      // Save PDF via Blob to bypass sandbox and iframe limitations
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.setAttribute("href", blobUrl);
      link.setAttribute("download", `Risk_Register_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

    } catch (err) {
      console.error('Failed to generate professional PDF:', err);
      // Fallback to browser printing if all else fails
      window.print();
    } finally {
      // Restore parent computedStyle override
      if (didOverrideParentGetComputedStyle) {
        window.getComputedStyle = originalParentGetComputedStyle;
      }

      // Restore original styleSheets getters
      if (didOverrideMainStyleSheets) {
        try {
          if (originalDocumentStyleSheets) {
            Object.defineProperty(document, 'styleSheets', originalDocumentStyleSheets);
          } else {
            delete (document as any).styleSheets;
          }
        } catch (e) {
          console.error('Failed to restore main document.styleSheets:', e);
        }
      }

      if (didOverrideProtoStyleSheets && originalProtoStyleSheetsGetter) {
        try {
          Object.defineProperty(Document.prototype, 'styleSheets', {
            get: originalProtoStyleSheetsGetter,
            configurable: true
          });
        } catch (e) {
          console.error('Failed to restore Document.prototype.styleSheets:', e);
        }
      }

      // Remove temporary style element
      if (tempStyle && tempStyle.parentNode) {
        try {
          tempStyle.parentNode.removeChild(tempStyle);
        } catch (e) {
          console.warn('Failed to remove tempStyle:', e);
        }
      }

      // Restore original parent scale transforms immediately
      if (parentElement) {
        parentElement.style.transform = originalTransform;
        parentElement.style.transition = originalTransition;
      }
      setIsGeneratingPdf(false);
    }
  };

  const getAssetValue = (assetName: string, r?: RiskItem): number => {
    const matchedAsset = clientAssets.find(
      a => a.asset_name.toLowerCase() === assetName.toLowerCase() ||
           assetName.toLowerCase().includes(a.asset_name.toLowerCase()) ||
           a.asset_name.toLowerCase().includes(assetName.toLowerCase())
    );
    
    let c = matchedAsset ? matchedAsset.c_val : (r?.c_val ?? undefined);
    let i = matchedAsset ? matchedAsset.i_val : (r?.i_val ?? undefined);
    let a = matchedAsset ? matchedAsset.a_val : (r?.a_val ?? undefined);

    if (c === undefined || i === undefined || a === undefined) {
      const name = assetName.toLowerCase();
      if (name.includes('firewall') || name.includes('server') || name.includes('database')) {
        c = c ?? 5; i = i ?? 5; a = a ?? 5;
      } else if (name.includes('emr') || name.includes('software') || name.includes('record') || name.includes('malaffi') || name.includes('suite')) {
        c = c ?? 5; i = i ?? 5; a = a ?? 4;
      } else if (name.includes('ventilator') || name.includes('medical') || name.includes('clinical') || name.includes('device') || name.includes('x-ray') || name.includes('imaging') || name.includes('ultrasound')) {
        c = c ?? 3; i = i ?? 5; a = a ?? 5;
      } else if (name.includes('desktop') || name.includes('computer') || name.includes('laptop')) {
        c = c ?? 3; i = i ?? 4; a = a ?? 4;
      } else {
        c = c ?? 3; i = i ?? 3; a = a ?? 3;
      }
    }

    const avg = (c + i + a) / 3;
    let val = Math.round(avg);
    if (avg >= 4.0 && avg <= 4.5) val = 4;
    else if (avg >= 4.51 && avg <= 5.0) val = 5;
    return val;
  };

  const getRiskScore = (r: RiskItem, type: 'inherent' | 'residual') => {
    const assetVal = getAssetValue(r.asset_name, r);
    if (type === 'inherent') {
      return Math.round(assetVal * r.impact * r.likelihood);
    } else {
      const resImp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
      const resLik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);
      return Math.round(assetVal * resImp * resLik);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 76) return { label: 'Critical', bgClass: 'bg-rose-900 text-white font-extrabold border-rose-900', textClass: 'text-rose-900 font-extrabold' };
    if (score >= 51) return { label: 'High', bgClass: 'bg-rose-500 text-white font-bold border-rose-500', textClass: 'text-rose-500 font-bold' };
    if (score >= 21) return { label: 'Moderate', bgClass: 'bg-amber-400 text-slate-900 font-bold border-amber-400', textClass: 'text-amber-600 font-bold' };
    return { label: 'Low', bgClass: 'bg-emerald-400 text-slate-900 font-medium border-emerald-400', textClass: 'text-emerald-600 font-semibold' };
  };

  // Helper to count risks in a 5x5 grid cell
  const getCellRiskCount = (imp: number, lik: number, matrixType: 'inherent' | 'residual') => {
    return clientRisks.filter(r => {
      if (matrixType === 'inherent') {
        return r.impact === imp && r.likelihood === lik;
      } else {
        const r_imp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
        const r_lik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);
        return r_imp === imp && r_lik === lik;
      }
    }).length;
  };

  // Helper to get color code for cells
  const getCellColorClass = (imp: number, lik: number) => {
    const score = imp * lik;
    if (score >= 15) return 'bg-rose-500 text-white font-extrabold';
    if (score >= 8) return 'bg-amber-400 text-slate-900 font-extrabold';
    return 'bg-emerald-400 text-slate-900 font-bold';
  };

  // Sort risks based on compliance inherent score
  const sortedRisks = [...clientRisks].sort((a, b) => {
    const scoreA = getRiskScore(a, 'inherent');
    const scoreB = getRiskScore(b, 'inherent');
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  // Segregate by Asset Category using a helper function
  const getRiskAssetCategoryAndCode = (risk: any) => {
    if (risk.asset_category && risk.asset_code) {
      return { category: risk.asset_category as 'Physical Assets' | 'Digital Assets Risks', code: risk.asset_code };
    }

    const matchedAsset = clientAssets.find(
      a => (a.asset_name.toLowerCase() === risk.asset_name.toLowerCase() ||
            risk.asset_name.toLowerCase().includes(a.asset_name.toLowerCase()) ||
            a.asset_name.toLowerCase().includes(risk.asset_name.toLowerCase()))
    );

    let category: 'Physical Assets' | 'Digital Assets Risks' = 'Physical Assets';
    let code = risk.asset_code || '';

    if (matchedAsset) {
      code = code || matchedAsset.asset_code || '';
      if (matchedAsset.asset_type === 'Software Asset') {
        category = 'Digital Assets Risks';
      } else {
        category = 'Physical Assets';
      }
    } else {
      const name = risk.asset_name.toLowerCase();
      if (name.includes('firewall') || name.includes('server') || name.includes('desktop') || name.includes('printer') || name.includes('cctv') || name.includes('wifi') || name.includes('device') || name.includes('hardware') || name.includes('computer') || name.includes('ventilator') || name.includes('ups') || name.includes('power')) {
        category = 'Physical Assets';
        if (name.includes('firewall')) code = code || 'PHY-FW';
        else if (name.includes('server')) code = code || 'PHY-SRV';
        else if (name.includes('desktop') || name.includes('computer')) code = code || 'PHY-PC';
        else if (name.includes('printer')) code = code || 'PHY-PR';
        else if (name.includes('cctv')) code = code || 'PHY-CCTV';
        else if (name.includes('wifi')) code = code || 'PHY-WIFI';
        else if (name.includes('device') || name.includes('ventilator')) code = code || 'PHY-MED';
        else if (name.includes('ups') || name.includes('power')) code = code || 'PHY-PWR';
      } else {
        category = 'Digital Assets Risks';
        if (name.includes('emr')) code = code || 'DIG-EMR';
        else if (name.includes('windows')) code = code || 'DIG-WIN';
        else if (name.includes('antivirus')) code = code || 'DIG-AV';
        else if (name.includes('database')) code = code || 'DIG-DB';
        else code = code || 'DIG-SW';
      }
    }

    return { category, code };
  };

  // Segregate by Asset Category
  const physicalAssetRisks = sortedRisks.filter(r => getRiskAssetCategoryAndCode(r).category === 'Physical Assets');
  const digitalAssetRisks = sortedRisks.filter(r => getRiskAssetCategoryAndCode(r).category === 'Digital Assets Risks');

  const activeCount = clientRisks.length;
  const deactivatedCount = 0;
  const avgAssetVal = clientRisks.length 
    ? Math.round((clientRisks.reduce((sum, r) => sum + getAssetValue(r.asset_name, r), 0) / clientRisks.length) * 10) / 10 
    : 4.3;
  const maxInherentScore = clientRisks.length 
    ? Math.max(...clientRisks.map(r => getRiskScore(r, 'inherent'))) 
    : 125;

  const executiveOverviewText = `This Risk Assessment Report for ${entityName} provides a comprehensive analysis of the information security risks identified within the organization's infrastructure and clinical operations. The assessment was conducted in accordance with ISO 27001:2022 and ADHICS v2 frameworks. A total of ${activeCount} active risks were evaluated (along with ${deactivatedCount} deactivated risks). The average asset value across the facility is ${avgAssetVal}, with a maximum identified inherent risk rating of ${maxInherentScore}. Through the implementation of existing and proposed controls, the organization aims to reduce the residual risk to an acceptable level`;

  const renderRiskTable = (risksList: any[], title: string) => {
    return (
      <div className="space-y-3 pt-4">
        <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>{title}</span>
          </span>
          <span className="text-[9px] font-mono lowercase italic text-slate-500 font-normal">sorted by inherent risk score • Identification Date: {assessmentDate}</span>
        </h4>
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left border-collapse text-[8.5px] table-auto bg-white min-w-[2200px]">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 text-[8px] font-bold uppercase tracking-tight text-slate-800">
                <th className="p-1.5 border border-slate-250 w-[55px]">Risk ID</th>
                <th className="p-1.5 border border-slate-250 w-[110px]">Domain</th>
                <th className="p-1.5 border border-slate-250 w-[100px]">Risk Ident- Date</th>
                <th className="p-1.5 border border-slate-250 w-[140px]">Asset Name *</th>
                <th className="p-1.5 border border-slate-250 w-[95px]">Asset Category</th>
                <th className="p-1.5 border border-slate-250 w-[85px]">Asset Code</th>
                <th className="p-1.5 border border-slate-250 w-[160px]">Threats</th>
                <th className="p-1.5 border border-slate-250 w-[160px]">Risk Description</th>
                <th className="p-1.5 border border-slate-250 w-[100px]">Vulnerabilities</th>
                <th className="p-1.5 border border-slate-250 w-[140px]">Existing Controls</th>
                <th className="p-1.5 border border-slate-250 text-center w-[85px]">C, I, A Rating</th>
                <th className="p-1.5 border border-slate-250 text-center w-[45px]">Asset Value</th>
                <th className="p-1.5 border border-slate-250 text-center w-[40px]">Impact (I)</th>
                <th className="p-1.5 border border-slate-250 text-center w-[45px]">Likelihood (L)</th>
                <th className="p-1.5 border border-slate-250 text-center w-[65px]">Inherent (AV×I×L)</th>
                <th className="p-1.5 border border-slate-250 w-[180px]">Risk Treatment Plan</th>
                <th className="p-1.5 border border-slate-250 w-[60px]">Status</th>
                <th className="p-1.5 border border-slate-250 text-center w-[45px]">Asset Value</th>
                <th className="p-1.5 border border-slate-250 text-center w-[45px]">Residual Impact</th>
                <th className="p-1.5 border border-slate-250 text-center w-[50px]">Residual Prob.</th>
                <th className="p-1.5 border border-slate-250 text-center w-[65px]">Residual (AV×RI×RL)</th>
                <th className="p-1.5 border border-slate-250 text-center w-[50px]">Recurrence</th>
                <th className="p-1.5 border border-slate-250 w-[80px]">Owner</th>
                <th className="p-1.5 border border-slate-250 w-[70px]">Treatment Option</th>
                <th className="p-1.5 border border-slate-250 w-[70px]">Target Date</th>
                <th className="p-1.5 border border-slate-250 w-[55px]">Risk Status</th>
                <th className="p-1.5 border border-slate-250 w-[70px]">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {risksList.length > 0 ? (
                risksList.map(r => {
                  const assetVal = getAssetValue(r.asset_name, r);
                  const score = getRiskScore(r, 'inherent');
                  const resScore = getRiskScore(r, 'residual');
                  const levelInherent = getRiskLevel(score);
                  const levelResidual = getRiskLevel(resScore);

                  const resImp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
                  const resLik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);

                  // Find detailed asset values
                  const matchedAsset = clientAssets.find(
                    a => a.asset_name.toLowerCase() === r.asset_name.toLowerCase() ||
                         r.asset_name.toLowerCase().includes(a.asset_name.toLowerCase()) ||
                         a.asset_name.toLowerCase().includes(r.asset_name.toLowerCase())
                  );
                  const cVal = matchedAsset ? (matchedAsset.c_val ?? 4) : (r.c_val ?? 4);
                  const iVal = matchedAsset ? (matchedAsset.i_val ?? 4) : (r.i_val ?? 4);
                  const aVal = matchedAsset ? (matchedAsset.a_val ?? 4) : (r.a_val ?? 4);

                  const formattedAssetVal = typeof assetVal === 'number' ? assetVal.toFixed(2).replace(/\.00$/, '') : assetVal;
                  const catAndCode = getRiskAssetCategoryAndCode(r);

                  return (
                    <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50 even:bg-slate-50/25">
                      <td className="p-1.5 border border-slate-200 font-mono font-bold text-slate-900">
                        {r.risk_id}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-semibold text-slate-500">
                        {r.domain || 'Information Security'}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-mono text-slate-600 font-bold whitespace-nowrap">
                        {r.identification_date || r.created_at?.substring(0, 10) || assessmentDate || '2023-05-18'}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-bold text-slate-800">
                        {r.asset_name}
                      </td>
                      <td className="p-1.5 border border-slate-200">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[8px] uppercase ${
                          catAndCode.category === 'Physical Assets'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}>
                          {catAndCode.category === 'Physical Assets' ? 'Physical' : 'Digital'}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 font-mono font-extrabold text-slate-900 bg-slate-50/50">
                        {catAndCode.code || 'N/A'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-600 leading-normal">
                        {r.threat}
                      </td>
                      <td className="p-1.5 border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">{r.risk_title}</span>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-600">
                        {r.vulnerability || 'N/A'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-600 leading-normal">
                        {r.existing_controls || 'None'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-mono text-[8px] whitespace-nowrap text-slate-600 font-bold">
                        C:{cVal}, I:{iVal}, A:{aVal}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-bold text-slate-700">
                        {formattedAssetVal}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-semibold text-slate-600">
                        {r.impact}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-semibold text-slate-600">
                        {r.likelihood}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-bold whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] leading-none ${levelInherent.bgClass}`}>
                          {levelInherent.label} {score}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-700 leading-normal">
                        {r.treatment_plan || 'N/A'}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-medium text-indigo-900">
                        {r.mitigation_status || 'Open'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-bold text-slate-500">
                        {formattedAssetVal}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-semibold text-slate-600">
                        {resImp}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-semibold text-slate-600">
                        {resLik}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-bold whitespace-nowrap">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] leading-none ${levelResidual.bgClass}`}>
                          {levelResidual.label} {resScore}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 text-center font-medium text-slate-500">
                        {r.recurrence || 'Ongoing'}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        {r.risk_owner}
                      </td>
                      <td className="p-1.5 border border-slate-200 text-slate-600">
                        {r.treatment_option || 'Reduction'}
                      </td>
                      <td className="p-1.5 border border-slate-200 font-mono text-slate-500 whitespace-nowrap">
                        {r.target_closing_date || '2026-12-31'}
                      </td>
                      <td className="p-1.5 border border-slate-200">
                        <span className={`font-bold uppercase text-[7.5px] ${r.status === 'CLOSED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {r.status || 'OPEN'}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-200 font-mono text-slate-500 whitespace-nowrap">
                        {r.next_review_date || 'Annual'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={26} className="p-4 text-center text-slate-400 italic">No records in this asset category</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div id="reports-view" className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Compliance & Risk Reports Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and preview fully structured A3 landscape report documents to prove compliance status to healthcare inspectors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Email Report
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Select Report Category */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
        <button
          onClick={() => setSelectedReportType('RISK')}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
            selectedReportType === 'RISK'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Risk Management
        </button>
        <button
          onClick={() => setSelectedReportType('ASSET')}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
            selectedReportType === 'ASSET'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Specialized Equipment
        </button>
        <button
          onClick={() => setSelectedReportType('INCIDENT')}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
            selectedReportType === 'INCIDENT'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Clinical Gaps
        </button>
        <button
          onClick={() => setSelectedReportType('CAPA')}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
            selectedReportType === 'CAPA'
              ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Remediation (CAPA)
        </button>
        <button
          onClick={() => setSelectedReportType('FRAMEWORK_GROUP')}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            selectedReportType === 'FRAMEWORK_GROUP'
              ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Framework Tier Groups
        </button>
      </div>

      {/* Control panel for Framework Tier Groups Report */}
      {selectedReportType === 'FRAMEWORK_GROUP' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Tiered Compliance Export Engine
              </span>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Compliance Status Report Filtered by Framework Tier Group
              </h3>
              <p className="text-xs text-slate-500">
                Generate and export official PDF compliance reports for <strong>Basic</strong>, <strong>Transmission</strong>, or <strong>Advance</strong> tier documentation.
              </p>
            </div>

            <button
              onClick={() => {
                const groupDocs = getDocumentsByGroup(currentClient?.id || '', selectedFrameworkGroupTier, clientPolicies);
                generateFrameworkGroupPDFReport(currentClient || clients[0], selectedFrameworkGroupTier, groupDocs);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              Export {selectedFrameworkGroupTier} Compliance PDF
            </button>
          </div>

          {/* Group Tier Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FRAMEWORK_GROUPS.map(group => {
              const isActive = selectedFrameworkGroupTier === group.id;
              const groupDocs = getDocumentsByGroup(currentClient?.id || '', group.id, clientPolicies);
              const groupStats = getGroupComplianceStats(currentClient?.id || '', group.id, clientPolicies);

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedFrameworkGroupTier(group.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <span className={`text-xs font-extrabold ${isActive ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {group.name} Tier
                    </span>
                    <p className={`text-[10px] line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {group.targetFocus}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : group.badgeColor
                    }`}>
                      {groupDocs.length} items
                    </span>
                    <span className={`block text-[11px] font-mono font-extrabold mt-1 ${isActive ? 'text-emerald-400' : 'text-slate-700'}`}>
                      {groupStats.score}% Score
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table Preview of Group Documents */}
          <div className="pt-2 space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              {selectedFrameworkGroupTier} Group Document Inventory ({getDocumentsByGroup(currentClient?.id || '', selectedFrameworkGroupTier, clientPolicies).length} items)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-2.5">Ref Code</th>
                    <th className="p-2.5">Document / Form Title</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Owner</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-800">
                  {getDocumentsByGroup(currentClient?.id || '', selectedFrameworkGroupTier, clientPolicies).map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-indigo-950">{doc.code}</td>
                      <td className="p-2.5 font-bold text-slate-900">{doc.title}</td>
                      <td className="p-2.5 text-slate-600 text-[10px]">{doc.docType}</td>
                      <td className="p-2.5 text-slate-600 text-[10px]">{doc.owner}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">COMPLIANT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Control panel for Risk Report view options */}
      {selectedReportType === 'RISK' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Risk Scores Sorter</span>
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => setSortOrder('desc')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  sortOrder === 'desc'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Descending Order ↘
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  sortOrder === 'asc'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Ascending Order ↗
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Include Options</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              <button
                onClick={() => setIncludeFacilityDetails(!includeFacilityDetails)}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {includeFacilityDetails ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                Facility Details
              </button>
              <button
                onClick={() => setIncludeAcceptanceCriteria(!includeAcceptanceCriteria)}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {includeAcceptanceCriteria ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                Acceptance Criteria
              </button>
              <button
                onClick={() => setIncludeCommitteeDetails(!includeCommitteeDetails)}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {includeCommitteeDetails ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                Committee & Support
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Risk Assessment Date</span>
            <input
              type="text"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-white text-slate-800 font-semibold focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. 12/05/2026"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Document Watermark</span>
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => setDocumentStatus('DRAFT')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  documentStatus === 'DRAFT'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Draft Mode
              </button>
              <button
                onClick={() => setDocumentStatus('FINAL')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                  documentStatus === 'FINAL'
                    ? 'bg-slate-950 text-white border-slate-950'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Final Report
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Audited Export Links</span>
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => handleExport('PDF')}
                className="flex-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-md cursor-pointer transition-colors border border-rose-100 flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF Stream
              </button>
              <button
                onClick={() => handleExport('EXCEL')}
                className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-md cursor-pointer transition-colors border border-emerald-100 flex items-center justify-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel Tab
              </button>
              <button
                onClick={() => setIsEmailModalOpen(true)}
                className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-md cursor-pointer transition-colors border border-indigo-100 flex items-center justify-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Report Document Wrapper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">A3 Landscape Standard Format Preview</span>
            <h3 className="font-bold text-slate-900 text-sm mt-0.5">
              {selectedReportType === 'RISK' && `${currentClient?.company_name || 'Active Facility'} - Complete Risk Register & Threat Assessment`}
              {selectedReportType === 'ASSET' && 'IT & Biomedical Equipment Preventive Maintenance Logs'}
              {selectedReportType === 'INCIDENT' && 'Clinical Privacy & Interoperability Incident Auditing'}
              {selectedReportType === 'CAPA' && 'Quality Assurance CAPA Remediation Timelines'}
            </h3>
          </div>
        </div>

        {/* RISK REPORT PREVIEW IN LANDSCAPE FORMAT */}
        {selectedReportType === 'RISK' && (
          <div className="max-w-full overflow-x-auto p-6 bg-slate-100 rounded-2xl shadow-inner border border-slate-200">
            {/* The A3 landscape simulated page */}
            <div id="printable-landscape-sheet" className="bg-white border border-slate-300 w-[1280px] p-8 mx-auto shadow-lg space-y-8 text-slate-800 text-xs font-sans relative">
              
              {/* Draft Watermark or Approved Seal */}
              {documentStatus === 'DRAFT' ? (
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                  <span className="text-[150px] font-black tracking-widest text-slate-900 rotate-12">DRAFT VERSION</span>
                </div>
              ) : (
                <div className="absolute right-8 top-20 pointer-events-none select-none border-4 border-emerald-600 text-emerald-600 font-black px-4 py-2 uppercase text-[10px] rounded-lg rotate-[-8deg] flex flex-col items-center justify-center leading-none tracking-widest shadow-sm bg-white/90 z-10">
                  <span className="text-[8px] font-bold">APPROVED STATUS</span>
                  <span className="text-sm font-black mt-0.5">FINAL COMPLIANT</span>
                  <span className="text-[8px] font-mono mt-1">DOH-ADHICS CERTIFIED</span>
                </div>
              )}

              {/* Document Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-indigo-900 flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0">
                    ISO
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">DOH / ISO 27001 / ADHICS COMPLIANCE REPORT VIEW</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      FACILITY REGULATION COMPLIANCE REGISTER • REVISION 2.2
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex bg-slate-900 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    PAGE 02 / ANALYSIS
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Section: Facility details block */}
              {includeFacilityDetails && currentClient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {/* Row 1: Horizontal Executive Overview */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-left text-[9px] leading-relaxed col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[8px] font-bold text-indigo-950 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1.5">Executive Overview</span>
                      <p className="text-slate-600 font-medium">
                        {executiveOverviewText}
                      </p>
                    </div>
                    <div className="shrink-0 bg-slate-50 p-3 rounded border border-slate-250 text-center min-w-[135px] flex flex-col justify-center">
                      <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1">Overall Metric</span>
                      <p className="font-extrabold text-slate-900 text-xs mt-1">Avg Asset: 4.3</p>
                      <p className="text-[8px] font-mono text-slate-500 mt-0.5">Max Inherent: {maxInherentScore}</p>
                    </div>
                  </div>

                  {/* Card 1: Facility Profile */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px]">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Facility Profile</span>
                      <p className="font-extrabold text-slate-900 text-[10px] mt-1.5 leading-snug">{isGroup ? entityName : `${entityName} [License: ${currentClient?.doh_license_no || currentClient?.trade_license_no || 'PF1045'}]`}</p>
                      {isGroup && branches.length > 0 && (
                        <div className="mt-1.5 bg-indigo-50/50 p-1.5 rounded border border-indigo-100">
                          <p className="text-[7px] font-bold text-indigo-950 uppercase tracking-wider mb-0.5">Group Facilities ({branches.length})</p>
                          <div className="space-y-0.5 max-h-[50px] overflow-y-auto pr-1">
                            {branches.map(b => (
                              <p key={b.id} className="text-[7.5px] text-slate-700 font-semibold truncate">
                                • {b.name} <span className="text-[7px] text-slate-400 font-normal">({b.license_no || 'N/A'})</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-slate-500 mt-1 line-clamp-2">Address: {currentClient.address || 'Central District - Abu Dhabi'}</p>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-100 text-slate-500 space-y-0.5">
                      <p>Tel: {currentClient.phone || '0509680219'}</p>
                      <p className="truncate">Email: {currentClient.email || 'nasrpharmacy@gmail.com'}</p>
                    </div>
                  </div>

                  {/* Card 2: Document Metadata */}
                  <div className="bg-white p-3 rounded-lg border border-amber-300 shadow-2xs flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px] bg-amber-50/10">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Document Metadata</span>
                        <div className="flex items-center gap-1">
                          {onUpdateClient && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditDocRef(currentClient?.doc_ref || 'ZZP-IT-PE-05/2021');
                                setEditDocClassification(currentClient?.doc_classification || 'RESTRICTED');
                                setEditDocIssueDate(formatDateDMY(currentClient?.doc_issue_date || '01/03/2022'));
                                setEditDocApprovedDate(formatDateDMY(currentClient?.doc_approved_date || '30/06/2026'));
                                setEditDocVersion(currentClient?.doc_version || '1.0');
                                setShowEditMetadataModal(true);
                              }}
                              className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[7.5px] rounded border border-indigo-200 cursor-pointer transition-colors"
                              title="Edit Document Metadata"
                            >
                              ✎ Edit
                            </button>
                          )}
                          <span className="text-[7.5px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-0.5">
                            🔗 Loop Synced
                          </span>
                        </div>
                      </div>

                      {/* Quick Master Setup Loop Selector Connection */}
                      <div className="mb-2">
                        <DocRefLoopSelector
                          compact
                          currentRefCode={currentClient?.doc_ref || 'DOH-HLAR-2026-001'}
                          onApplyLoop={(data) => {
                            if (currentClient && onUpdateClient) {
                              onUpdateClient({
                                ...currentClient,
                                doc_ref: data.ref_code,
                                doc_classification: data.classification,
                                doc_issue_date: formatDateDMY(data.issue_date),
                                doc_approved_date: formatDateDMY(data.approval_date || data.review_date),
                                doc_version: data.version || '1.0'
                              });
                            }
                          }}
                        />
                      </div>

                      <p className="font-mono font-black text-indigo-900 text-[10.5px] mt-1.5">Ref: {currentClient?.doc_ref || 'DOH-HLAR-2026-001'}</p>
                      <p className="text-slate-600 font-semibold mt-1">Classification: <span className="font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[8.5px] border border-rose-200">{currentClient?.doc_classification || 'CONFIDENTIAL'}</span></p>
                      <p className="text-slate-600 font-semibold mt-1">Issue: <span className="font-mono font-bold text-slate-900">{formatDateDMY(currentClient?.doc_issue_date || '01/08/2026')}</span></p>
                      <p className="text-slate-600 font-semibold mt-0.5">Approved: <span className="font-mono font-bold text-slate-900">{formatDateDMY(currentClient?.doc_approved_date || '01/08/2026')}</span></p>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-indigo-900 font-black font-mono text-[9.5px]">
                        Version: {currentClient?.doc_version || '1.0'}
                      </span>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('policy-procedure-view')}
                          className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-[8px] rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Connect to Express Indexing & Multi-Register Linkage to Master Index"
                        >
                          <span>🔗 Master Index Loop</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Risk Summary Stats */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px]">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Risk Summary Stats</span>
                      <div className="grid grid-cols-5 gap-0.5 text-center mt-2">
                        <div className="p-0.5 bg-rose-900 text-white rounded text-[7px] flex flex-col justify-between h-7">
                          <span className="block font-black text-[5.5px]">CRIT</span>
                          <span className="text-[9px] font-black">{clientRisks.filter(r => getRiskScore(r, 'inherent') >= 76).length}</span>
                        </div>
                        <div className="p-0.5 bg-rose-500 text-white rounded text-[7px] flex flex-col justify-between h-7">
                          <span className="block font-black text-[5.5px]">HIGH</span>
                          <span className="text-[9px] font-black">{clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 51 && sc <= 75; }).length}</span>
                        </div>
                        <div className="p-0.5 bg-amber-400 text-slate-900 rounded text-[7px] flex flex-col justify-between h-7">
                          <span className="block font-black text-[5.5px]">MOD</span>
                          <span className="text-[9px] font-black">{clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 21 && sc <= 50; }).length}</span>
                        </div>
                        <div className="p-0.5 bg-emerald-400 text-slate-900 rounded text-[7px] flex flex-col justify-between h-7">
                          <span className="block font-black text-[5.5px]">LOW</span>
                          <span className="text-[9px] font-black">{clientRisks.filter(r => getRiskScore(r, 'inherent') <= 20).length}</span>
                        </div>
                        <div className="p-0.5 bg-slate-900 text-white rounded text-[7px] flex flex-col justify-between h-7">
                          <span className="block font-black text-[5.5px]">TOT</span>
                          <span className="text-[9px] font-black">{clientRisks.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-100 text-[7.5px] text-slate-400 text-center uppercase tracking-tighter">
                      100% active register records
                    </div>
                  </div>

                  {/* Card 4: Version History */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[8px] leading-tight min-h-[145px]">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1">Version History</span>
                      <div className="space-y-0.5 text-[7.5px] leading-none">
                        {(currentClient?.version_history && currentClient.version_history.length > 0 ? currentClient.version_history : [
                          { version: '1.0', date: '01/03/2022', author: 'MD / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
                        ]).slice(0, 3).map((vh, idx) => (
                          <div key={idx} className="border-b border-slate-100 py-1 space-y-0.5">
                            <div className="flex justify-between items-center text-[7.5px]">
                              <span className="font-bold text-slate-900 font-mono">{vh.version}</span>
                              <span className="text-slate-400 font-mono text-[7px]">{vh.date}</span>
                            </div>
                            <div className="text-slate-700 font-normal text-[7.5px] leading-tight break-words">
                              {vh.changes || (vh as any).change_description || (vh as any).remarks || 'Risk Register revision'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-100 text-[7px] text-slate-500 font-mono font-bold text-right">
                      Doc Ref: {currentClient?.doc_ref || 'ZZP-IT-PE-05/2021'}
                    </div>
                  </div>

                  {/* Row 3: Single combined box for Authorized Contacts, Governance & Third-Party Support */}
                  {includeCommitteeDetails && (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col justify-between text-left text-[9px] leading-tight">
                      <div>
                        <span className="text-[8px] font-black text-indigo-950 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">
                          Facility Committee Signatory Controls & Third-Party Support
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Col 1: Authorized Contacts */}
                          <div className="space-y-1 border-r border-slate-150 pr-2 last:border-0">
                            <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Authorized Contacts</p>
                            {currentClient.auth_representative?.name && (
                              <div>
                                <p className="font-extrabold text-slate-800">Rep: {currentClient.auth_representative.name}</p>
                                {currentClient.auth_representative.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.auth_representative.phone}</p>}
                                {currentClient.auth_representative.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.auth_representative.email}</p>}
                              </div>
                            )}
                            {currentClient.clinic_manager?.name && (
                              <div className="mt-1">
                                <p className="font-extrabold text-slate-800">Clinic Mgr: {currentClient.clinic_manager.name}</p>
                                {currentClient.clinic_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.clinic_manager.phone}</p>}
                                {currentClient.clinic_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.clinic_manager.email}</p>}
                              </div>
                            )}
                            {!currentClient.auth_representative?.name && !currentClient.clinic_manager?.name && (
                              <p className="text-slate-400 italic text-[8px]">No authorized contacts filled</p>
                            )}
                          </div>

                          {/* Col 2: Governance Contacts */}
                          <div className="space-y-1 border-r border-slate-150 pr-2 last:border-0">
                            <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Governance Contacts</p>
                            {currentClient.medical_director?.name && (
                              <div>
                                <p className="font-extrabold text-slate-800">Med Dir: {currentClient.medical_director.name}</p>
                                {currentClient.medical_director.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.medical_director.phone}</p>}
                                {currentClient.medical_director.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.medical_director.email}</p>}
                              </div>
                            )}
                            {currentClient.it_manager?.name && (
                              <div className="mt-1">
                                <p className="font-extrabold text-slate-800">IT Mgr: {currentClient.it_manager.name}</p>
                                {currentClient.it_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.it_manager.phone}</p>}
                                {currentClient.it_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.it_manager.email}</p>}
                              </div>
                            )}
                            {currentClient.hr_manager?.name && (
                              <div className="mt-1">
                                <p className="font-extrabold text-slate-800">HR Mgr: {currentClient.hr_manager.name}</p>
                                {currentClient.hr_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.hr_manager.phone}</p>}
                                {currentClient.hr_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.hr_manager.email}</p>}
                              </div>
                            )}
                            {!currentClient.medical_director?.name && !currentClient.it_manager?.name && !currentClient.hr_manager?.name && (
                              <p className="text-slate-400 italic text-[8px]">No governance contacts filled</p>
                            )}
                          </div>

                          {/* Col 3: Third-Party Support */}
                          <div className="space-y-1">
                            <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Third-Party Support</p>
                            {currentClient.it_support?.team_name && (
                              <div>
                                <p className="font-extrabold text-indigo-950">IT Support: {currentClient.it_support.team_name}</p>
                                {currentClient.it_support.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.it_support.phone}</p>}
                                {currentClient.it_support.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.it_support.email}</p>}
                              </div>
                            )}
                            {currentClient.emr_support?.team_name && (
                              <div className="mt-1">
                                <p className="font-extrabold text-indigo-950">EMR Support: {currentClient.emr_support.team_name}</p>
                                {currentClient.emr_support.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.emr_support.phone}</p>}
                                {currentClient.emr_support.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.emr_support.email}</p>}
                              </div>
                            )}
                            {!currentClient.it_support?.team_name && !currentClient.emr_support?.team_name && (
                              <p className="text-slate-400 italic text-[8px]">No support contacts filled</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-100 text-[8px] text-slate-400">
                        Primary Escalation & IT Governance Pathways
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1. Detailed Risk Assessment Register - Physical Assets Risks */}
              {renderRiskTable(physicalAssetRisks, `1. Detailed Risk Assessment Register - Physical Assets Risks (${physicalAssetRisks.length} Records) Risk Identification Date: ${assessmentDate}`)}

              {/* 2. Detailed Risk Assessment Register - Digital Assets Risks */}
              {renderRiskTable(digitalAssetRisks, `2. Detailed Risk Assessment Register - Digital Assets Risks (${digitalAssetRisks.length} Records) Risk Identification Date: ${assessmentDate}`)}

              {/* Section: Visual Risk Analysis Matrices (Relocated to bottom!) */}
              <div className="grid grid-cols-2 gap-6 border-y border-slate-200 py-4">
                {/* Visual Inherent Risk Heatmap */}
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-150 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wide">A. Inherent Risk Map (Raw Severity)</h4>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Raw Count</span>
                  </div>
                  <div className="flex items-stretch justify-center pt-2">
                    <div className="w-5 flex items-center justify-center -rotate-90 text-[7px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                      Impact →
                    </div>
                    <div className="space-y-0.5">
                      {[5, 4, 3, 2, 1].map(imp => (
                        <div key={imp} className="flex gap-0.5 items-center">
                          <span className="w-2.5 text-right text-[8px] font-bold text-slate-400 pr-0.5">{imp}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(lik => {
                              const count = getCellRiskCount(imp, lik, 'inherent');
                              return (
                                <div
                                  key={lik}
                                  className={`w-8 h-5 rounded-sm text-[8px] font-black flex items-center justify-center transition-all shadow-sm border border-black/5 ${getCellColorClass(imp, lik)}`}
                                  title={`Impact ${imp} x Likelihood ${lik} (Score ${imp * lik})`}
                                >
                                  {count || '-'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-0.5 pl-3 pt-0.5 text-center text-[7px] font-bold text-slate-400">
                        <span className="w-8">1</span>
                        <span className="w-8">2</span>
                        <span className="w-8">3</span>
                        <span className="w-8">4</span>
                        <span className="w-8">5</span>
                      </div>
                      <div className="text-center text-[6.5px] text-slate-400 font-bold tracking-wider uppercase pl-3 mt-0.5">
                        Likelihood →
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Residual Risk Heatmap */}
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-150 flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wide">B. Residual Risk Map (Mitigated)</h4>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Post-Control</span>
                  </div>
                  <div className="flex items-stretch justify-center pt-2">
                    <div className="w-5 flex items-center justify-center -rotate-90 text-[7px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                      Impact →
                    </div>
                    <div className="space-y-0.5">
                      {[5, 4, 3, 2, 1].map(imp => (
                        <div key={imp} className="flex gap-0.5 items-center">
                          <span className="w-2.5 text-right text-[8px] font-bold text-slate-400 pr-0.5">{imp}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(lik => {
                              const count = getCellRiskCount(imp, lik, 'residual');
                              return (
                                <div
                                  key={lik}
                                  className={`w-8 h-5 rounded-sm text-[8px] font-black flex items-center justify-center transition-all shadow-sm border border-black/5 ${getCellColorClass(imp, lik)}`}
                                  title={`Impact ${imp} x Likelihood ${lik} (Score ${imp * lik})`}
                                >
                                  {count || '-'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-0.5 pl-3 pt-0.5 text-center text-[7px] font-bold text-slate-400">
                        <span className="w-8">1</span>
                        <span className="w-8">2</span>
                        <span className="w-8">3</span>
                        <span className="w-8">4</span>
                        <span className="w-8">5</span>
                      </div>
                      <div className="text-center text-[6.5px] text-slate-400 font-bold tracking-wider uppercase pl-3 mt-0.5">
                        Likelihood →
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Risk Acceptance Reference guide */}
              {includeAcceptanceCriteria && (
                <div className="space-y-2 pt-4 border-t border-slate-200 text-left">
                  <h4 className="font-extrabold text-indigo-950 text-[10px] uppercase tracking-wide">
                    Risk Rating and Acceptance Criteria
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-emerald-150 pb-1 mb-1">
                          <span className="font-extrabold text-[8px] text-emerald-800 uppercase">Low Risk</span>
                          <span className="font-mono font-bold text-[8.5px] text-emerald-900 bg-emerald-100 px-1 rounded">1–20</span>
                        </div>
                        <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                          Acceptable level of risk with no significant impact on safety, clinical services, or data security. Risk is tolerated and periodically monitored.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50/70 p-2.5 rounded border border-amber-200 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-amber-150 pb-1 mb-1">
                          <span className="font-extrabold text-[8px] text-amber-850 uppercase">Moderate</span>
                          <span className="font-mono font-bold text-[8.5px] text-amber-900 bg-amber-100 px-1 rounded">21–50</span>
                        </div>
                        <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                          Mitigation required. Implement cost-effective strategies; monitor for potential frequency, scope, or severity escalation.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-rose-50/70 p-2.5 rounded border border-rose-200 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-rose-150 pb-1 mb-1">
                          <span className="font-extrabold text-[8px] text-rose-800 uppercase">High Risk</span>
                          <span className="font-mono font-bold text-[8.5px] text-rose-900 bg-rose-100 px-1 rounded">51–75</span>
                        </div>
                        <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                          Immediate attention. Deploy strong controls, increase monitoring frequency, notify department heads, and assign remedial ownership.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-rose-900/10 p-2.5 rounded border border-rose-300 text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-rose-250 pb-1 mb-1">
                          <span className="font-extrabold text-[8px] text-rose-950 uppercase">Critical</span>
                          <span className="font-mono font-bold text-[8.5px] text-rose-950 bg-rose-900/20 px-1 rounded">76–125</span>
                        </div>
                        <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                          Unacceptable. Urgent mitigation required via immediate corrective actions, risk transfer, or cessation of vulnerable operations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Sign-off & Consulting Directory Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-300 mt-6 text-left text-[9px] leading-relaxed">
                {/* Left: Consultant & Prepared By Info */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[8px] font-black text-indigo-950 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-1.5">
                    Consultancy & Risk Assessment Directory
                  </span>
                  <p className="font-semibold text-slate-700">
                    <span className="font-black text-indigo-950">Risk Assessment by:</span> Aseef Sulaiman -IT Manager, | Smartpro Consultancy | info@smartpro.ae | www.smartpro.ae
                  </p>
                  <p className="font-semibold text-slate-700">
                    <span className="font-black text-indigo-950">Risk Identification & Assessment Date:</span> {assessmentDate}
                  </p>
                </div>

                {/* Right: Signatures */}
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex flex-col justify-between">
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-1 mb-1">Authorization</span>
                    <div className="mt-4 border-b border-slate-400 w-full h-0"></div>
                    <p className="text-[8.5px] font-black text-slate-700 mt-1 uppercase">Authorized Signature</p>
                  </div>
                  <div className="flex flex-col justify-between">
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-1 mb-1">Approval Date</span>
                    <div className="mt-4 border-b border-slate-400 w-full h-0"></div>
                    <p className="text-[8.5px] font-black text-slate-700 mt-1 uppercase">Date of Approval</p>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="flex items-center justify-between border-t-2 border-slate-900 pt-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Regulatory Standard compliance register</span>
                <span>Abu Dhabi Health Authority (DOH) Standards v2 & ISO 27001:2022</span>
                <span>© 2026 Smartpro.ae</span>
              </div>

            </div>
          </div>
        )}

        {/* DEFAULT LAYOUTS FOR NON-RISK REPORT CATEGORIES */}
        {selectedReportType !== 'RISK' && (
          <div className="space-y-4">
            {selectedReportType === 'ASSET' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Asset Nodes</span>
                    <p className="text-xl font-bold text-slate-950 mt-1">{clientAssets.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Biomedical Clinical Suite</span>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {clientAssets.filter(a => a.asset_type === 'Biomedical Asset').length} Machinery
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Overdue PPM Schedules</span>
                    <p className="text-xl font-bold text-rose-700 mt-1">
                      {clientAssets.filter(a => a.status === 'ACTIVE' && a.ppm_due_date && new Date(a.ppm_due_date) < new Date()).length} Overdue
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 font-semibold text-slate-600">Asset Tag</th>
                        <th className="p-3 font-semibold text-slate-600">Name</th>
                        <th className="p-3 font-semibold text-slate-600">Type</th>
                        <th className="p-3 font-semibold text-slate-600">Location</th>
                        <th className="p-3 font-semibold text-slate-600">PPM Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAssets.map(a => (
                        <tr key={a.id} className="border-b border-slate-100">
                          <td className="p-3 font-mono font-bold text-slate-900">{a.asset_code}</td>
                          <td className="p-3 font-medium text-slate-800">{a.asset_name}</td>
                          <td className="p-3 text-slate-500">{a.asset_type}</td>
                          <td className="p-3 text-slate-600">{a.location}</td>
                          <td className="p-3 font-mono text-slate-600 font-bold">{a.ppm_due_date || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReportType === 'INCIDENT' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Breach Incidents</span>
                    <p className="text-xl font-bold text-slate-950 mt-1">{clientIncidents.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Critical Incidents</span>
                    <p className="text-xl font-bold text-rose-700 mt-1">
                      {clientIncidents.filter(i => i.severity === 'CRITICAL').length} Logs
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pending Resolution</span>
                    <p className="text-xl font-bold text-amber-700 mt-1">
                      {clientIncidents.filter(i => i.closure_status !== 'CLOSED').length} Active
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 font-semibold text-slate-600">Incident No</th>
                        <th className="p-3 font-semibold text-slate-600">Title</th>
                        <th className="p-3 font-semibold text-slate-600">Severity</th>
                        <th className="p-3 font-semibold text-slate-600">Reported Date</th>
                        <th className="p-3 font-semibold text-slate-600">Closure status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientIncidents.map(i => (
                        <tr key={i.id} className="border-b border-slate-100">
                          <td className="p-3 font-mono font-bold text-slate-900">{i.incident_no}</td>
                          <td className="p-3 font-medium text-slate-800">{i.incident_title}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${i.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100'}`}>
                              {i.severity}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{i.reported_date}</td>
                          <td className="p-3 font-semibold text-emerald-800">{i.closure_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReportType === 'CAPA' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Action Registers</span>
                    <p className="text-xl font-bold text-slate-950 mt-1">{clientActions.length}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Completed Gaps</span>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {clientActions.filter(a => a.status === 'COMPLETED').length} Handled
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Overdue Gaps</span>
                    <p className="text-xl font-bold text-rose-700 mt-1">
                      {clientActions.filter(a => a.status !== 'COMPLETED' && new Date(a.target_date) < new Date()).length} Items
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 font-semibold text-slate-600">Source Reference</th>
                        <th className="p-3 font-semibold text-slate-600">Observation</th>
                        <th className="p-3 font-semibold text-slate-600">CAPA Action Plan</th>
                        <th className="p-3 font-semibold text-slate-600">Lead Responsible</th>
                        <th className="p-3 font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientActions.map(a => (
                        <tr key={a.id} className="border-b border-slate-100">
                          <td className="p-3 font-mono font-bold text-slate-900">{a.source_reference}</td>
                          <td className="p-3 font-medium text-slate-800">{a.finding}</td>
                          <td className="p-3 text-slate-900 font-semibold">{a.action_plan}</td>
                          <td className="p-3 text-slate-600">{a.responsible_person}</td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-700">{a.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Compliance PDF Stream Visualizer Modal */}
      {isPdfStreamOpen && (
        <div id="pdf-stream-viewer-backdrop" className="fixed inset-0 bg-slate-800/95 z-50 flex flex-col font-sans overflow-hidden select-none">
          {/* PDF Top Reader Toolbar */}
          <div className="bg-slate-900 border-b border-slate-700 h-14 px-5 flex items-center justify-between shadow-md text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-rose-600 rounded text-[9px] font-black uppercase text-white tracking-widest">
                PDF
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100">Regulatory_Compliance_Risk_Register_A3_Landscape_Stream.pdf</p>
                <p className="text-[10px] text-slate-400 font-medium">Abu Dhabi Health Authority (DOH) Compliance SmartDataHub Stream</p>
              </div>
            </div>

            {/* Middle Zoom controls & Page numbering */}
            <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                className="hover:text-emerald-400 font-bold px-1.5 cursor-pointer"
                title="Zoom Out"
              >
                －
              </button>
              <span className="font-mono font-bold w-12 text-center text-slate-300">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                className="hover:text-emerald-400 font-bold px-1.5 cursor-pointer"
                title="Zoom In"
              >
                ＋
              </button>
              <span className="text-slate-500 mx-1">|</span>
              <span className="text-slate-400 font-medium">Page 1 of 1</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <div className="hidden xl:flex items-center text-[10px] text-slate-400 max-w-[280px] leading-tight text-right mr-2 bg-slate-800/50 p-1.5 rounded border border-slate-700">
                💡 <span>If download is blocked by iframe security, click <strong className="text-white">"Open in New Tab"</strong> in AI Studio to run independently!</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>{isGeneratingPdf ? '⏳' : '💾'}</span> {isGeneratingPdf ? 'Generating...' : 'Save PDF / Print'}
              </button>
              <button
                type="button"
                onClick={handleClosePdfStream}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Close Viewer
              </button>
            </div>
          </div>

          {/* PDF Simulated canvas */}
          <div className="flex-1 bg-slate-700/90 p-12 overflow-auto flex items-start justify-center">
            <div 
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'top center',
                transition: 'transform 0.1s ease-out'
              }}
              className="origin-top shrink-0"
            >
              {/* Printable container wrapper */}
              <div id="printable-pdf-content" className="bg-white text-slate-800 p-8 shadow-2xl rounded-xs border border-slate-400 max-w-fit">
                {selectedReportType === 'RISK' ? (
                  /* We clone or render the main A3 landscape block here so it shows the actual live compliance register! */
                  <div className="w-[2200px] space-y-8 relative">
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-950 rounded flex items-center justify-center font-black text-white text-xs">
                          ISO
                        </div>
                        <div className="text-left">
                          <h2 className="font-black text-slate-950 text-sm tracking-tight leading-none uppercase">
                            DOH / ISO 27001 / ADHICS COMPLIANCE REPORT VIEW
                          </h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            FACILITY REGULATION COMPLIANCE REGISTER • REVISION 2.2 ({clientRisks.length} Active Records)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex bg-slate-900 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          PAGE 01 / AUDITED LANDSCAPE STREAM
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Facility Details Row inside PDF Stream */}
                    {includeFacilityDetails && currentClient && (
                      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {/* Row 1: Horizontal Executive Overview */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-left text-[9px] leading-relaxed col-span-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <span className="text-[8px] font-bold text-indigo-950 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1.5">Executive Overview</span>
                            <p className="text-slate-600 font-medium">
                              {executiveOverviewText}
                            </p>
                          </div>
                          <div className="shrink-0 bg-slate-50 p-3 rounded border border-slate-250 text-center min-w-[135px] flex flex-col justify-center">
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1">Overall Metric</span>
                            <p className="font-extrabold text-slate-900 text-xs mt-1">Avg Asset: 4.3</p>
                            <p className="text-[8px] font-mono text-slate-500 mt-0.5">Max Inherent: {maxInherentScore}</p>
                          </div>
                        </div>

                        {/* Card 1: Facility Profile */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Facility Profile</span>
                            <p className="font-extrabold text-slate-900 text-[10px] mt-1.5 leading-snug">{isGroup ? entityName : `${entityName} [License: ${currentClient?.doh_license_no || currentClient?.trade_license_no || 'PF1045'}]`}</p>
                            {isGroup && branches.length > 0 && (
                              <div className="mt-1.5 bg-indigo-50/50 p-1.5 rounded border border-indigo-100">
                                <p className="text-[7px] font-bold text-indigo-950 uppercase tracking-wider mb-0.5">Group Facilities ({branches.length})</p>
                                <div className="space-y-0.5 max-h-[50px] overflow-y-auto pr-1">
                                  {branches.map(b => (
                                    <p key={b.id} className="text-[7.5px] text-slate-700 font-semibold truncate">
                                      • {b.name} <span className="text-[7px] text-slate-400 font-normal">({b.license_no || 'N/A'})</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="text-slate-500 mt-1 line-clamp-2">Address: {currentClient.address || 'Central District - Abu Dhabi'}</p>
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-slate-100 text-slate-500 space-y-0.5">
                            <p>Tel: {currentClient.phone || '0509680219'}</p>
                            <p className="truncate">Email: {currentClient.email || 'nasrpharmacy@gmail.com'}</p>
                          </div>
                        </div>

                        {/* Card 2: Document Metadata */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Document Metadata</span>
                            <p className="font-extrabold text-slate-900 text-[10px] mt-1.5">Ref: {currentClient?.doc_ref || 'ZZP-IT-PE-05/2021'}</p>
                            <p className="text-slate-600 mt-1">Classification: <span className="font-bold text-red-600">{currentClient?.doc_classification || 'RESTRICTED'}</span></p>
                            <p className="text-slate-500 mt-1">Issue: {formatDateDMY(currentClient?.doc_issue_date || '01/03/2022')}</p>
                            <p className="text-slate-500 mt-0.5">Approved: {formatDateDMY(currentClient?.doc_approved_date || '30/06/2026')}</p>
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-slate-100 text-indigo-900 font-bold">
                            Version: {currentClient?.doc_version || '1.0'}
                          </div>
                        </div>

                        {/* Card 3: Risk Summary Stats */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[9px] leading-tight min-h-[145px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Risk Summary Stats</span>
                            <div className="grid grid-cols-5 gap-0.5 text-center mt-2">
                              <div className="p-0.5 bg-rose-900 text-white rounded text-[7px] flex flex-col justify-between h-7">
                                <span className="block font-black text-[5.5px]">CRIT</span>
                                <span className="text-[9px] font-black">{clientRisks.filter(r => getRiskScore(r, 'inherent') >= 76).length}</span>
                              </div>
                              <div className="p-0.5 bg-rose-500 text-white rounded text-[7px] flex flex-col justify-between h-7">
                                <span className="block font-black text-[5.5px]">HIGH</span>
                                <span className="text-[9px] font-black">{clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 51 && sc <= 75; }).length}</span>
                              </div>
                              <div className="p-0.5 bg-amber-400 text-slate-900 rounded text-[7px] flex flex-col justify-between h-7">
                                <span className="block font-black text-[5.5px]">MOD</span>
                                <span className="text-[9px] font-black">{clientRisks.filter(r => { const sc = getRiskScore(r, 'inherent'); return sc >= 21 && sc <= 50; }).length}</span>
                              </div>
                              <div className="p-0.5 bg-emerald-400 text-slate-900 rounded text-[7px] flex flex-col justify-between h-7">
                                <span className="block font-black text-[5.5px]">LOW</span>
                                <span className="text-[9px] font-black">{clientRisks.filter(r => getRiskScore(r, 'inherent') <= 20).length}</span>
                              </div>
                              <div className="p-0.5 bg-slate-900 text-white rounded text-[7px] flex flex-col justify-between h-7">
                                <span className="block font-black text-[5.5px]">TOT</span>
                                <span className="text-[9px] font-black">{clientRisks.length}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-slate-100 text-[7.5px] text-slate-400 text-center uppercase tracking-tighter">
                            100% active register records
                          </div>
                        </div>

                        {/* Card 4: Version History */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between text-left text-[8px] leading-tight min-h-[145px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1">Version History</span>
                            <div className="space-y-0.5 text-[7.5px] leading-none">
                              {(currentClient?.version_history && currentClient.version_history.length > 0 ? currentClient.version_history : [
                                { version: '1.0', date: '01/03/2022', author: 'MD / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
                              ]).slice(0, 3).map((vh, idx) => (
                                <div key={idx} className="border-b border-slate-100 py-1 space-y-0.5">
                                  <div className="flex justify-between items-center text-[7.5px]">
                                    <span className="font-bold text-slate-900 font-mono">{vh.version}</span>
                                    <span className="text-slate-400 font-mono text-[7px]">{vh.date}</span>
                                  </div>
                                  <div className="text-slate-700 font-normal text-[7.5px] leading-tight break-words">
                                    {vh.changes || (vh as any).change_description || (vh as any).remarks || 'Risk Register revision'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-slate-100 text-[7px] text-slate-500 font-mono font-bold text-right">
                            Doc Ref: {currentClient?.doc_ref || 'ZZP-IT-PE-05/2021'}
                          </div>
                        </div>

                        {/* Row 3: Combined Contact and Third-Party Support directory */}
                        {includeCommitteeDetails && (
                          <div className="bg-white p-3.5 rounded-lg border border-slate-200 col-span-4 flex flex-col justify-between text-left text-[9px] leading-tight">
                            <div>
                              <span className="text-[8px] font-black text-indigo-950 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-2">
                                Facility Committee Signatory Controls & Third-Party Support
                              </span>
                              <div className="grid grid-cols-3 gap-4">
                                {/* Col 1: Authorized Contacts */}
                                <div className="space-y-1 border-r border-slate-150 pr-2 last:border-0">
                                  <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Authorized Contacts</p>
                                  {currentClient.auth_representative?.name && (
                                    <div>
                                      <p className="font-extrabold text-slate-800">Rep: {currentClient.auth_representative.name}</p>
                                      {currentClient.auth_representative.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.auth_representative.phone}</p>}
                                      {currentClient.auth_representative.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.auth_representative.email}</p>}
                                    </div>
                                  )}
                                  {currentClient.clinic_manager?.name && (
                                    <div className="mt-1">
                                      <p className="font-extrabold text-slate-800">Clinic Mgr: {currentClient.clinic_manager.name}</p>
                                      {currentClient.clinic_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.clinic_manager.phone}</p>}
                                      {currentClient.clinic_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.clinic_manager.email}</p>}
                                    </div>
                                  )}
                                  {!currentClient.auth_representative?.name && !currentClient.clinic_manager?.name && (
                                    <p className="text-slate-400 italic text-[8px]">No authorized contacts filled</p>
                                  )}
                                </div>

                                {/* Col 2: Governance Contacts */}
                                <div className="space-y-1 border-r border-slate-150 pr-2 last:border-0">
                                  <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Governance Contacts</p>
                                  {currentClient.medical_director?.name && (
                                    <div>
                                      <p className="font-extrabold text-slate-800">Med Dir: {currentClient.medical_director.name}</p>
                                      {currentClient.medical_director.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.medical_director.phone}</p>}
                                      {currentClient.medical_director.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.medical_director.email}</p>}
                                    </div>
                                  )}
                                  {currentClient.it_manager?.name && (
                                    <div className="mt-1">
                                      <p className="font-extrabold text-slate-800">IT Mgr: {currentClient.it_manager.name}</p>
                                      {currentClient.it_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.it_manager.phone}</p>}
                                      {currentClient.it_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.it_manager.email}</p>}
                                    </div>
                                  )}
                                  {currentClient.hr_manager?.name && (
                                    <div className="mt-1">
                                      <p className="font-extrabold text-slate-800">HR Mgr: {currentClient.hr_manager.name}</p>
                                      {currentClient.hr_manager.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.hr_manager.phone}</p>}
                                      {currentClient.hr_manager.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.hr_manager.email}</p>}
                                    </div>
                                  )}
                                  {!currentClient.medical_director?.name && !currentClient.it_manager?.name && !currentClient.hr_manager?.name && (
                                    <p className="text-slate-400 italic text-[8px]">No governance contacts filled</p>
                                  )}
                                </div>

                                {/* Col 3: Third-Party Support */}
                                <div className="space-y-1">
                                  <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Third-Party Support</p>
                                  {currentClient.it_support?.team_name && (
                                    <div>
                                      <p className="font-extrabold text-indigo-950">IT Support: {currentClient.it_support.team_name}</p>
                                      {currentClient.it_support.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.it_support.phone}</p>}
                                      {currentClient.it_support.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.it_support.email}</p>}
                                    </div>
                                  )}
                                  {currentClient.emr_support?.team_name && (
                                    <div className="mt-1">
                                      <p className="font-extrabold text-indigo-950">EMR Support: {currentClient.emr_support.team_name}</p>
                                      {currentClient.emr_support.phone && <p className="text-slate-500 pl-2 text-[8px]">Tel: {currentClient.emr_support.phone}</p>}
                                      {currentClient.emr_support.email && <p className="text-slate-500 pl-2 text-[8px] truncate">Email: {currentClient.emr_support.email}</p>}
                                    </div>
                                  )}
                                  {!currentClient.it_support?.team_name && !currentClient.emr_support?.team_name && (
                                    <p className="text-slate-400 italic text-[8px]">No support contacts filled</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 pt-1 border-t border-slate-100 text-[8px] text-slate-400">
                              Primary Escalation & IT Governance Pathways
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 1. Detailed Risk Assessment Register - Physical Assets Risks */}
                    {renderRiskTable(physicalAssetRisks, `1. Detailed Risk Assessment Register - Physical Assets Risks (${physicalAssetRisks.length} Records) Risk Identification Date: ${assessmentDate}`)}

                    {/* 2. Detailed Risk Assessment Register - Digital Assets Risks */}
                    {renderRiskTable(digitalAssetRisks, `2. Detailed Risk Assessment Register - Digital Assets Risks (${digitalAssetRisks.length} Records) Risk Identification Date: ${assessmentDate}`)}

                    {/* Inherent vs Residual heatmaps summary row (Relocated here!) */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Matrix A */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                        <h4 className="font-black text-slate-900 text-[10px] uppercase">A. Inherent Risk Map</h4>
                        <div className="flex justify-center items-center mt-2">
                          <div className="flex flex-col gap-0.5">
                            {[5, 4, 3, 2, 1].map(imp => (
                              <div key={imp} className="flex gap-0.5 items-center">
                                <span className="w-4 text-right text-[8px] text-slate-400">{imp}</span>
                                { [1, 2, 3, 4, 5].map(lik => (
                                  <div key={lik} className={`w-8 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center ${getCellColorClass(imp, lik)}`}>
                                    {getCellRiskCount(imp, lik, 'inherent') || '-'}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Matrix B */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200 text-left">
                        <h4 className="font-black text-slate-900 text-[10px] uppercase">B. Residual Risk Map</h4>
                        <div className="flex justify-center items-center mt-2">
                          <div className="flex flex-col gap-0.5">
                            {[5, 4, 3, 2, 1].map(imp => (
                              <div key={imp} className="flex gap-0.5 items-center">
                                <span className="w-4 text-right text-[8px] text-slate-400">{imp}</span>
                                { [1, 2, 3, 4, 5].map(lik => (
                                  <div key={lik} className={`w-8 h-4 rounded-sm text-[8px] font-bold flex items-center justify-center ${getCellColorClass(imp, lik)}`}>
                                    {getCellRiskCount(imp, lik, 'residual') || '-'}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acceptance criteria in PDF */}
                    {includeAcceptanceCriteria && (
                      <div className="pt-2 text-left">
                        <h4 className="font-extrabold text-indigo-950 text-[10px] uppercase">Risk Rating and Acceptance Criteria</h4>
                        <div className="grid grid-cols-4 gap-3 mt-1.5">
                          <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-left flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-emerald-150 pb-1 mb-1">
                                <span className="font-extrabold text-[8px] text-emerald-800 uppercase">Low Risk</span>
                                <span className="font-mono font-bold text-[8.5px] text-emerald-900 bg-emerald-100 px-1 rounded">1–20</span>
                              </div>
                              <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                                Acceptable level of risk with no significant impact on safety, clinical services, or data security. Risk is tolerated and periodically monitored.
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-amber-50/70 p-2.5 rounded border border-amber-200 text-left flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-amber-150 pb-1 mb-1">
                                <span className="font-extrabold text-[8px] text-amber-850 uppercase">Moderate</span>
                                <span className="font-mono font-bold text-[8.5px] text-amber-900 bg-amber-100 px-1 rounded">21–50</span>
                              </div>
                              <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                                Mitigation required. Implement cost-effective strategies; monitor for potential frequency, scope, or severity escalation.
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-rose-50/70 p-2.5 rounded border border-rose-200 text-left flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-rose-150 pb-1 mb-1">
                                <span className="font-extrabold text-[8px] text-rose-800 uppercase">High Risk</span>
                                <span className="font-mono font-bold text-[8.5px] text-rose-900 bg-rose-100 px-1 rounded">51–75</span>
                              </div>
                              <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                                Immediate attention. Deploy strong controls, increase monitoring frequency, notify department heads, and assign remedial ownership.
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-rose-900/10 p-2.5 rounded border border-rose-300 text-left flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between border-b border-rose-250 pb-1 mb-1">
                                <span className="font-extrabold text-[8px] text-rose-950 uppercase">Critical</span>
                                <span className="font-mono font-bold text-[8.5px] text-rose-950 bg-rose-900/20 px-1 rounded">76–125</span>
                              </div>
                              <p className="text-[7.5px] text-slate-600 leading-normal font-medium">
                                Unacceptable. Urgent mitigation required via immediate corrective actions, risk transfer, or cessation of vulnerable operations.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}



                    {/* PDF Sign-off & Consulting Directory Block */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 mt-6 text-left text-[8px] leading-relaxed">
                      {/* Left: Consultant & Prepared By Info */}
                      <div className="space-y-1 p-2.5 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[7.5px] font-black text-indigo-950 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-1">
                          Consultancy & Risk Assessment Directory
                        </span>
                        <p className="font-semibold text-slate-700">
                          <span className="font-black text-indigo-950">Risk Assessment by:</span> Aseef Sulaiman -IT Manager, | Smartpro Consultancy | info@smartpro.ae | www.smartpro.ae
                        </p>
                        <p className="font-semibold text-slate-700">
                          <span className="font-black text-indigo-950">Risk Identification & Assessment Date:</span> {assessmentDate}
                        </p>
                      </div>

                      {/* Right: Signatures */}
                      <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
                        <div className="flex flex-col justify-between">
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-0.5 mb-1">Authorization</span>
                          <div className="mt-2 border-b border-slate-400 w-full h-0"></div>
                          <p className="text-[7.5px] font-black text-slate-700 mt-0.5 uppercase">Authorized Signature</p>
                        </div>
                        <div className="flex flex-col justify-between">
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-0.5 mb-1">Approval Date</span>
                          <div className="mt-2 border-b border-slate-400 w-full h-0"></div>
                          <p className="text-[7.5px] font-black text-slate-700 mt-0.5 uppercase">Date of Approval</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard generic page view inside PDF stream */
                  <div className="w-[1280px] space-y-8 relative text-left">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-950 rounded flex items-center justify-center font-black text-white text-xs">
                          {selectedReportType === 'ASSET' ? 'ASM' : selectedReportType === 'INCIDENT' ? 'INC' : 'QA'}
                        </div>
                        <div className="text-left">
                          <h2 className="font-black text-slate-950 text-sm tracking-tight leading-none uppercase">
                            {selectedReportType === 'ASSET' && 'IT & BIOMEDICAL PREVENTIVE MAINTENANCE LOGS'}
                            {selectedReportType === 'INCIDENT' && 'PRIVACY BREACH & INTEROPERABILITY INCIDENT AUDITING'}
                            {selectedReportType === 'CAPA' && 'QUALITY ASSURANCE CAPA REMEDIATION TIMELINES'}
                          </h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            {selectedReportType === 'ASSET' && `FACILITY EQUIPMENT INVENTORY REGISTER • ${clientAssets.length} Active Records`}
                            {selectedReportType === 'INCIDENT' && `CLINICAL PRIVACY COMPLIANCE LOGGER • ${clientIncidents.length} Active Records`}
                            {selectedReportType === 'CAPA' && `COMPLIANCE GAP CORRECTIVE ACTION REGISTER • ${clientActions.length} Active Records`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex bg-slate-900 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          PAGE 01 / AUDITED LANDSCAPE STREAM
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Generated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Facility Details Row inside PDF Stream */}
                    {includeFacilityDetails && currentClient && (
                      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {/* Executive Overview */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-left text-[9px] leading-relaxed col-span-2">
                          <span className="text-[8px] font-bold text-indigo-950 uppercase tracking-wider block border-b border-slate-100 pb-1 mb-1.5">Executive Overview</span>
                          <p className="text-slate-600 font-medium">
                            {selectedReportType === 'ASSET' && 'This preventive maintenance log contains detailed tracking of clinical biomedical suite inventory and active IT hardware nodes, mapped against upcoming ADHICS inspection parameters.'}
                            {selectedReportType === 'INCIDENT' && 'A comprehensive audit trail tracking clinical privacy violations, network outages, and security events, required for regulatory standard compliance registers.'}
                            {selectedReportType === 'CAPA' && 'The corrective and preventive action (CAPA) list detailing compliance gaps identified during auditing, assigned ownership and target resolution timelines.'}
                          </p>
                        </div>

                        {/* Facility Profile */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-left text-[9px] leading-tight col-span-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Facility Profile</span>
                          <p className="font-extrabold text-slate-900 text-[10px] mt-1.5 leading-snug">{isGroup ? entityName : `${entityName} [License: ${currentClient?.doh_license_no || currentClient?.trade_license_no || 'PF1045'}]`}</p>
                          {isGroup && branches.length > 0 && (
                            <div className="mt-1.5 bg-indigo-50/50 p-1.5 rounded border border-indigo-100">
                              <p className="text-[7px] font-bold text-indigo-950 uppercase tracking-wider mb-0.5">Group Facilities ({branches.length})</p>
                              <div className="space-y-0.5 max-h-[50px] overflow-y-auto pr-1">
                                {branches.map(b => (
                                  <p key={b.id} className="text-[7.5px] text-slate-700 font-semibold truncate">
                                    • {b.name} <span className="text-[7px] text-slate-400 font-normal">({b.license_no || 'N/A'})</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-slate-500 mt-1 truncate">Address: {currentClient.address || 'Abu Dhabi'}</p>
                        </div>

                        {/* Summary Metrics */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-left text-[9px] leading-tight col-span-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Summary Metrics</span>
                            {selectedReportType === 'ASSET' && (
                              <div className="mt-1.5 space-y-0.5 text-slate-700">
                                <p className="font-bold">Total Assets: {clientAssets.length}</p>
                                <p className="text-emerald-700 font-semibold">Biomedical: {clientAssets.filter(a => a.asset_type === 'Biomedical Asset').length}</p>
                                <p className="text-rose-700 font-semibold">Overdue PPM: {clientAssets.filter(a => a.status === 'ACTIVE' && a.ppm_due_date && new Date(a.ppm_due_date) < new Date()).length}</p>
                              </div>
                            )}
                            {selectedReportType === 'INCIDENT' && (
                              <div className="mt-1.5 space-y-0.5 text-slate-700">
                                <p className="font-bold">Total Incidents: {clientIncidents.length}</p>
                                <p className="text-rose-700 font-semibold">Critical: {clientIncidents.filter(i => i.severity === 'CRITICAL').length}</p>
                                <p className="text-amber-700 font-semibold">Open: {clientIncidents.filter(i => i.closure_status !== 'CLOSED').length}</p>
                              </div>
                            )}
                            {selectedReportType === 'CAPA' && (
                              <div className="mt-1.5 space-y-0.5 text-slate-700">
                                <p className="font-bold">Total CAPA Actions: {clientActions.length}</p>
                                <p className="text-emerald-700 font-semibold">Completed: {clientActions.filter(a => a.status === 'COMPLETED').length}</p>
                                <p className="text-rose-700 font-semibold">Overdue: {clientActions.filter(a => a.status !== 'COMPLETED' && new Date(a.target_date) < new Date()).length}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Table of Content */}
                    {selectedReportType === 'ASSET' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[7px]">
                              <th className="p-2 border border-slate-400">Asset Tag</th>
                              <th className="p-2 border border-slate-400">Asset Name</th>
                              <th className="p-2 border border-slate-400">Type</th>
                              <th className="p-2 border border-slate-400">Location</th>
                              <th className="p-2 border border-slate-400 text-center">Status</th>
                              <th className="p-2 border border-slate-400 text-center">PPM Schedule</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientAssets.map(a => (
                              <tr key={a.id} className="border-b border-slate-300 hover:bg-slate-50">
                                <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{a.asset_code}</td>
                                <td className="p-2 border border-slate-300 font-medium text-slate-800">{a.asset_name}</td>
                                <td className="p-2 border border-slate-300 text-slate-500">{a.asset_type}</td>
                                <td className="p-2 border border-slate-300 text-slate-600">{a.location}</td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                    {a.status}
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 font-mono text-center font-bold text-slate-600">{a.ppm_due_date || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'INCIDENT' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[7px]">
                              <th className="p-2 border border-slate-400">Incident No</th>
                              <th className="p-2 border border-slate-400">Incident Title</th>
                              <th className="p-2 border border-slate-400">Description</th>
                              <th className="p-2 border border-slate-400 text-center">Severity</th>
                              <th className="p-2 border border-slate-400 text-center">Reported Date</th>
                              <th className="p-2 border border-slate-400">Closure Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientIncidents.map(i => (
                              <tr key={i.id} className="border-b border-slate-300 hover:bg-slate-50">
                                <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{i.incident_no}</td>
                                <td className="p-2 border border-slate-300 font-medium text-slate-800">{i.incident_title}</td>
                                <td className="p-2 border border-slate-300 text-slate-600 leading-normal">{i.description || 'N/A'}</td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${i.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                                    {i.severity}
                                  </span>
                                </td>
                                <td className="p-2 border border-slate-300 text-center text-slate-500">{i.reported_date}</td>
                                <td className="p-2 border border-slate-300 font-semibold text-emerald-800">{i.closure_status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'CAPA' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-300 text-[8px]">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[7px]">
                              <th className="p-2 border border-slate-400">Source Reference</th>
                              <th className="p-2 border border-slate-400">Finding / Gap Description</th>
                              <th className="p-2 border border-slate-400">CAPA Action Plan</th>
                              <th className="p-2 border border-slate-400">Lead Responsible</th>
                              <th className="p-2 border border-slate-400 text-center">Target Date</th>
                              <th className="p-2 border border-slate-400 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientActions.map(a => (
                              <tr key={a.id} className="border-b border-slate-300 hover:bg-slate-50">
                                <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{a.source_reference}</td>
                                <td className="p-2 border border-slate-300 font-medium text-slate-800 leading-normal">{a.finding}</td>
                                <td className="p-2 border border-slate-300 text-slate-900 font-bold leading-normal">{a.action_plan}</td>
                                <td className="p-2 border border-slate-300 text-slate-600">{a.responsible_person}</td>
                                <td className="p-2 border border-slate-300 font-mono text-center text-slate-500">{a.target_date}</td>
                                <td className="p-2 border border-slate-300 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${a.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {a.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* PDF Sign-off & Consulting Directory Block */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 mt-6 text-left text-[8px] leading-relaxed">
                      {/* Left: Consultant & Prepared By Info */}
                      <div className="space-y-1 p-2.5 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[7.5px] font-black text-indigo-950 uppercase tracking-wider block border-b border-slate-200 pb-1 mb-1">
                          Consultancy & Risk Assessment Directory
                        </span>
                        <p className="font-semibold text-slate-700">
                          <span className="font-black text-indigo-950">Risk Assessment by:</span> Aseef Sulaiman -IT Manager, | Smartpro Consultancy | info@smartpro.ae | www.smartpro.ae
                        </p>
                        <p className="font-semibold text-slate-700">
                          <span className="font-black text-indigo-950">Risk Identification & Assessment Date:</span> {assessmentDate}
                        </p>
                      </div>

                      {/* Right: Signatures */}
                      <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
                        <div className="flex flex-col justify-between">
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-0.5 mb-1">Authorization</span>
                          <div className="mt-2 border-b border-slate-400 w-full h-0"></div>
                          <p className="text-[7.5px] font-black text-slate-700 mt-0.5 uppercase">Authorized Signature</p>
                        </div>
                        <div className="flex flex-col justify-between">
                          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-150 pb-0.5 mb-1">Approval Date</span>
                          <div className="mt-2 border-b border-slate-400 w-full h-0"></div>
                          <p className="text-[7.5px] font-black text-slate-700 mt-0.5 uppercase">Date of Approval</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Email Delivery Modal */}
      {isEmailModalOpen && (
        <div id="email-report-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-indigo-950 px-6 py-4 flex items-center justify-between text-white text-left">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">Send Compliance Report to Client</h3>
                  <p className="text-[10px] text-indigo-300 font-medium mt-0.5">Secure transmission over compliance SMTP relay gateway</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEmailModalOpen(false); setEmailResult(null); }}
                className="text-indigo-200 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 text-left">
              {emailResult && (
                <div className={`p-4 rounded-xl text-xs font-medium border ${
                  emailResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <p className="flex items-center gap-1.5">
                    <span className="text-sm">{emailResult.success ? '✅' : '❌'}</span>
                    {emailResult.message}
                  </p>
                </div>
              )}

              {/* Recipient Contacts Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Recipients (Client Contacts)</label>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-[140px] overflow-y-auto">
                  {getClientContacts().map(contact => (
                    <label 
                      key={`${contact.email}-${contact.role}`} 
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedRecipients.includes(contact.email)
                          ? 'bg-white border-indigo-200 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedRecipients.includes(contact.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecipients([...selectedRecipients, contact.email]);
                          } else {
                            setSelectedRecipients(selectedRecipients.filter(email => email !== contact.email));
                          }
                        }}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <div className="text-[9px] leading-tight">
                        <span className="font-bold text-slate-800 block">{contact.name}</span>
                        <span className="text-slate-500 block text-[8px]">{contact.role}</span>
                        <span className="text-indigo-600 font-mono block text-[8px] mt-0.5">{contact.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Recipients Text Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Recipients (Comma Separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. inspector@doh.gov.ae, supervisor@smartpro.ae"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Subject Line</label>
                <input 
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-800"
                />
              </div>

              {/* Message Notes Textarea */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accompanying Cover Notes / Message</label>
                <textarea 
                  rows={4}
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 leading-relaxed"
                />
              </div>

              {/* Include Options */}
              <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                <input 
                  type="checkbox"
                  id="includeStatsHtml"
                  checked={includeStatsHtml}
                  onChange={(e) => setIncludeStatsHtml(e.target.checked)}
                  className="text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <label htmlFor="includeStatsHtml" className="text-[10px] text-indigo-950 font-bold cursor-pointer leading-tight">
                  Embed Complete Risk Stats Summary & Active Register Table (HTML) inside email body
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/60 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => { setIsEmailModalOpen(false); setEmailResult(null); }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100"
              >
                <span>{isSendingEmail ? '⏳' : '🚀'}</span>
                {isSendingEmail ? 'Dispatching...' : 'Send to Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT METADATA EDIT MODAL */}
      {showEditMetadataModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-xs text-white uppercase tracking-wide">Edit Document Metadata</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditMetadataModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (currentClient && onUpdateClient) {
                const updated: Client = {
                  ...currentClient,
                  doc_ref: editDocRef,
                  doc_classification: editDocClassification,
                  doc_issue_date: formatDateDMY(editDocIssueDate),
                  doc_approved_date: formatDateDMY(editDocApprovedDate),
                  doc_version: editDocVersion
                };
                onUpdateClient(updated);
              }
              setShowEditMetadataModal(false);
            }} className="p-5 space-y-3.5">
              {/* Quick Master Setup Loop Connection */}
              <DocRefLoopSelector
                currentRefCode={editDocRef}
                onApplyLoop={(data) => {
                  setEditDocRef(data.ref_code);
                  setEditDocClassification(data.classification);
                  setEditDocIssueDate(formatDateDMY(data.issue_date));
                  setEditDocApprovedDate(formatDateDMY(data.approval_date || data.review_date));
                  setEditDocVersion(data.version || '1.0');
                }}
              />

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Document Reference No (Ref)</label>
                <input
                  type="text"
                  value={editDocRef}
                  onChange={e => setEditDocRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                  placeholder="e.g. ZZP-IT-PE-05/2021"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Classification</label>
                <select
                  value={editDocClassification}
                  onChange={e => setEditDocClassification(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                >
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Internal Use Only">Internal Use Only</option>
                  <option value="Public">Public</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Issue Date (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={editDocIssueDate}
                    onChange={e => setEditDocIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                    placeholder="DD/MM/YYYY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Approval Date (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={editDocApprovedDate}
                    onChange={e => setEditDocApprovedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                    placeholder="DD/MM/YYYY"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Active Version</label>
                <input
                  type="text"
                  value={editDocVersion}
                  onChange={e => setEditDocVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                  placeholder="e.g. 1.0"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditMetadataModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
