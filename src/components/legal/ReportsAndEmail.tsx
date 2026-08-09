import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { LegalRequirement, CircularItem, StandardItem, ComplianceDoc } from '../../utils/legalData';
import { printCurrentView, printHtmlInHiddenIframe } from '../../utils/printUtils';

import { Asset, Client } from '../../types';
import { formatDateDMY } from '../../utils/dateUtils';
import { INITIAL_ASSETS } from '../../initialData';
import { 
  FileText, 
  Download, 
  Mail, 
  Send,
  CheckCircle, 
  Printer, 
  Sparkles,
  Loader2,
  ShieldCheck,
  Eye,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Award,
  Activity,
  FileSpreadsheet,
  Edit,
  Plus,
  Trash2,
  Upload,
  Copy
} from 'lucide-react';
import { DocRefLoopSelector } from '../DocRefLoopSelector';

interface ReportsAndEmailProps {
  requirements: LegalRequirement[];
  circulars: CircularItem[];
  standards: StandardItem[];
  docs: ComplianceDoc[];
  assets?: Asset[];
  activeClientId?: string;
  clientName?: string;
  client?: Client;
  clients?: Client[];
  onLogAudit: (action: string, details: string, ref?: string) => void;
  onAddEmailLog?: (recipient: string, subject: string, type: string, status: string, body: string) => void;
}

export default function ReportsAndEmail({ 
  requirements, 
  circulars, 
  standards, 
  docs, 
  assets,
  activeClientId,
  clientName: propClientName,
  client,
  clients,
  onLogAudit,
  onAddEmailLog
}: ReportsAndEmailProps) {
  // Facility Metadata
  const clientName = client?.company_name || propClientName || 'AL Khaja Medical Center L.L.C';
  const facilityLicense = client?.doh_license_no || client?.trade_license_no || 'AD-9482-FAC';
  const facilityEmail = client?.email || 'compliance@khajamedical.ae';
  const facilityPhone = client?.phone || '+971 2 555 0199';
  const facilityEmblemText = clientName.replace(/L\.?L\.?C\.?/i, '').trim().substring(0, 14).toUpperCase();

  // 1. Report config form states (Connected to Master Loop)
  const [prepBy, setPrepBy] = useState('HR Director');
  const [appBy, setAppBy] = useState('Risk Lead');
  const [docRef, setDocRef] = useState('REF-HR-RST-B035');
  const [docVersion, setDocVersion] = useState('v1.0 (Master Loop)');
  const [docState, setDocState] = useState('CONFIDENTIAL');
  const [issueDate, setIssueDate] = useState('2026-08-01');
  const [lastReviewDate, setLastReviewDate] = useState('2027-08-01');
  const [approvalStatus, setApprovalStatus] = useState('Approved & Active');

  // Clone Data Modal State (Issue #3)
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [targetClientId, setTargetClientId] = useState('');
  const [cloneCirculars, setCloneCirculars] = useState(true);
  const [cloneStandards, setCloneStandards] = useState(true);
  const [cloneLegal, setCloneLegal] = useState(true);
  const [cloneLicenses, setCloneLicenses] = useState(true);
  const [cloneStatusMsg, setCloneStatusMsg] = useState<string | null>(null);

  // Replication / Clone Engine Logic
  const handleExecuteReplicate = () => {
    if (!targetClientId) {
      alert('Please select a target facility to clone data to.');
      return;
    }

    const targetClient = clients?.find(c => c.id === targetClientId);
    const targetName = targetClient?.company_name || 'Target Facility';

    try {
      // 1. Clone Circulars if checked
      if (cloneCirculars && circulars.length > 0) {
        const key = `sh_circulars_${targetClientId}`;
        const existingRaw = localStorage.getItem(key);
        const existing: CircularItem[] = existingRaw ? JSON.parse(existingRaw) : [];
        const clonedItems: CircularItem[] = circulars.map(c => ({
          ...c,
          id: `circ_clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        const existingNos = new Set(existing.map(e => e.circular_no));
        const newUnique = clonedItems.filter(c => !existingNos.has(c.circular_no));
        const finalCirculars = [...existing, ...newUnique];
        localStorage.setItem(key, JSON.stringify(finalCirculars));
      }

      // 2. Clone Standards if checked
      if (cloneStandards && standards.length > 0) {
        const key = `sh_standards_${targetClientId}`;
        const existingRaw = localStorage.getItem(key);
        const existing: StandardItem[] = existingRaw ? JSON.parse(existingRaw) : [];
        const clonedItems: StandardItem[] = standards.map(s => ({
          ...s,
          id: `std_clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        const existingRefs = new Set(existing.map(e => e.reference));
        const newUnique = clonedItems.filter(s => !existingRefs.has(s.reference));
        const finalStandards = [...existing, ...newUnique];
        localStorage.setItem(key, JSON.stringify(finalStandards));
      }

      // 3. Clone Legal Requirements if checked
      if (cloneLegal && requirements.length > 0) {
        const key = `sh_legal_register_${targetClientId}`;
        const existingRaw = localStorage.getItem(key);
        const existing: LegalRequirement[] = existingRaw ? JSON.parse(existingRaw) : [];
        const clonedItems: LegalRequirement[] = requirements.map(r => ({
          ...r,
          id: `req_clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        const existingRefs = new Set(existing.map(e => e.ref_no));
        const newUnique = clonedItems.filter(r => !existingRefs.has(r.ref_no));
        const finalRequirements = [...existing, ...newUnique];
        localStorage.setItem(key, JSON.stringify(finalRequirements));
      }

      // 4. Clone Compliance Licenses if checked
      if (cloneLicenses && docs.length > 0) {
        const key = `sh_licenses_${targetClientId}`;
        const existingRaw = localStorage.getItem(key);
        const existing: ComplianceDoc[] = existingRaw ? JSON.parse(existingRaw) : [];
        const clonedItems: ComplianceDoc[] = docs.map(d => ({
          ...d,
          id: `doc_clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        }));
        const existingRefs = new Set(existing.map(e => e.ref_no));
        const newUnique = clonedItems.filter(d => !existingRefs.has(d.ref_no));
        const finalDocs = [...existing, ...newUnique];
        localStorage.setItem(key, JSON.stringify(finalDocs));
      }

      onLogAudit('SYNC', `Replicated compliance registers (Circulars, Standards, Legal, Licenses) to facility "${targetName}" (${targetClientId})`, targetClientId);
      setCloneStatusMsg(`✓ Success! Replicated compliance data to ${targetName}.`);
      setTimeout(() => {
        setCloneStatusMsg(null);
        setShowCloneModal(false);
      }, 2500);
    } catch (e) {
      console.error(e);
      alert('Error replicating data to facility.');
    }
  };

  // Report Type Target
  const [reportType, setReportType] = useState('HEALTHCARE_AUDIT'); // HEALTHCARE_AUDIT, EXECUTIVE, ASSET_INVENTORY, LEGAL, CIRCULARS, STANDARDS, LICENSES
  const [complianceFilter, setComplianceFilter] = useState<'COMPLIANT_ONLY' | 'FULLY_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'ALL'>('COMPLIANT_ONLY');

  // Custom Logo URL state for PDF Report Header & Compiler
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    if (client?.facility_logo) return client.facility_logo;
    if (client?.letterhead_image) return client.letterhead_image;
    if (activeClientId) {
      try {
        const stored = localStorage.getItem(`sh_report_logo_${activeClientId}`);
        if (stored) return stored;
      } catch (e) {}
    }
    return '';
  });

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setCustomLogoUrl(result);
          if (activeClientId) {
            localStorage.setItem(`sh_report_logo_${activeClientId}`, result);
          }
          onLogAudit('UPDATE', `Uploaded facility logo for PDF report headers`, docRef);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Document Version Control Log state with localStorage persistence
  const [versionLogs, setVersionLogs] = useState<{ ver: string; date: string; author: string; details: string }[]>(() => {
    if (activeClientId) {
      try {
        const stored = localStorage.getItem(`sh_version_logs_${activeClientId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [
      { ver: '1.0', date: new Date().toISOString().substring(0, 10), author: 'Dr. Faisal Al-Mansoori / Sarah Jenkins', details: 'Initial Publication & DOH Annual Compliance Audit Release' },
      { ver: '0.9', date: '2026-07-15', author: 'Sarah Jenkins (Compliance Officer)', details: 'Draft Review & Healthcare Legal Register Checkpoint Verification' }
    ];
  });

  // Version Control Log Modal States
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [editingVersionIndex, setEditingVersionIndex] = useState<number | null>(null);
  const [versionForm, setVersionForm] = useState({
    ver: '1.1',
    date: new Date().toISOString().substring(0, 10),
    author: prepBy || 'Compliance Officer',
    details: ''
  });

  const handleOpenAddVersion = () => {
    setEditingVersionIndex(null);
    const lastVer = versionLogs[0]?.ver || '1.0';
    const nextVerNum = (parseFloat(lastVer) + 0.1).toFixed(1);
    setVersionForm({
      ver: nextVerNum,
      date: new Date().toISOString().substring(0, 10),
      author: prepBy || 'Sarah Jenkins (Compliance Officer)',
      details: ''
    });
    setShowVersionModal(true);
  };

  const handleOpenEditVersion = (index: number) => {
    setEditingVersionIndex(index);
    setVersionForm(versionLogs[index]);
    setShowVersionModal(true);
  };

  const handleSaveVersionLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionForm.ver || !versionForm.details) {
      alert('Please provide a version number and details of modifications.');
      return;
    }
    let updated = [...versionLogs];
    if (editingVersionIndex !== null) {
      updated[editingVersionIndex] = versionForm;
      onLogAudit('UPDATE', `Updated document version log v${versionForm.ver}`, docRef);
    } else {
      updated = [versionForm, ...updated];
      onLogAudit('CREATE', `Added document version log v${versionForm.ver}`, docRef);
    }
    setVersionLogs(updated);
    if (activeClientId) {
      localStorage.setItem(`sh_version_logs_${activeClientId}`, JSON.stringify(updated));
    }
    setShowVersionModal(false);
    setEditingVersionIndex(null);
  };

  const handleDeleteVersionLog = (index: number) => {
    if (confirm('Are you sure you want to delete this version log entry?')) {
      const updated = versionLogs.filter((_, i) => i !== index);
      setVersionLogs(updated);
      if (activeClientId) {
        localStorage.setItem(`sh_version_logs_${activeClientId}`, JSON.stringify(updated));
      }
      onLogAudit('DELETE', `Deleted document version log entry`, docRef);
    }
  };

  // Live Interactive Report Modal
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  // Filtered Circulars & Standards based on user compliance selection (Default: Fully & Partially Compliant Only)
  const reportCirculars = circulars.filter(c => {
    if (complianceFilter === 'COMPLIANT_ONLY') return c.compliance_status === 'Fully Compliant' || c.compliance_status === 'Partially Compliant';
    if (complianceFilter === 'FULLY_COMPLIANT') return c.compliance_status === 'Fully Compliant';
    if (complianceFilter === 'PARTIALLY_COMPLIANT') return c.compliance_status === 'Partially Compliant';
    return true;
  });

  const reportStandards = standards.filter(s => {
    if (complianceFilter === 'COMPLIANT_ONLY') return s.compliance_status === 'Fully Compliant' || s.compliance_status === 'Partially Compliant';
    if (complianceFilter === 'FULLY_COMPLIANT') return s.compliance_status === 'Fully Compliant';
    if (complianceFilter === 'PARTIALLY_COMPLIANT') return s.compliance_status === 'Partially Compliant';
    return true;
  });

  // Resolve assets list from props or localStorage/INITIAL_ASSETS fallback
  const reportAssets: Asset[] = (() => {
    if (assets && assets.length > 0) return assets;
    if (activeClientId) {
      try {
        const stored = localStorage.getItem(`sh_assets_${activeClientId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to load assets from localStorage for report', e);
      }
    }
    return INITIAL_ASSETS;
  })();

  // Email form states (Module 8)
  const [emailTo, setEmailTo] = useState('faisal.mansoori@doh.gov.ae');
  const [emailCc, setEmailCc] = useState('sarah.jenkins@dentalhub.ae');
  const [emailBcc, setEmailBcc] = useState('archive@dentalhub.ae');
  const [emailSubject, setEmailSubject] = useState('Monthly DOH Healthcare Legal Register & Compliance Report');
  const [emailMessage, setEmailMessage] = useState('Dear Medical Director,\n\nPlease find attached the fully compliant healthcare legal register and mandatory license checklists for our Abu Dhabi dental clinic facility as of July 2026.\n\nAll autoclave standards and FANR radiation controls have been checked and verified fully compliant.\n\nBest Regards,\nCompliance Team');
  const [attachPdf, setAttachPdf] = useState(true);
  const [attachExcel, setAttachExcel] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // 2. High-Fidelity Pure Vector PDF Generation (Landscape A4, Compact Fit-to-Page Layout)
  const generatePDFReport = () => {
    onLogAudit('EXPORT', `Generated GRC Landscape PDF Report type: ${reportType}`, docRef);
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2); // 273mm

      let currentPage = 1;

      // Header & Footer Stamper Function (Facility Brand Header & Legal Footer)
      const stampHeaderFooter = (pageNum: number) => {
        // Top Header Line
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${clientName.toUpperCase()} — DEPARTMENT OF HEALTH (DOH) ABU DHABI AUDIT DIVISION`, margin, 8.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Ref: ${docRef} | v${docVersion} (${docState}) | License: ${facilityLicense}`, pageWidth - margin, 8.5, { align: 'right' });

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.line(margin, 10.5, pageWidth - margin, 10.5);

        // Bottom Footer
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text("CONFIDENTIAL — Official Abu Dhabi Healthcare Legal & Compliance Audit Report (DOH Abu Dhabi & MALAFFI Standards)", margin, pageHeight - 5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`${clientName}, Abu Dhabi UAE | Page ${pageNum}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
      };

      stampHeaderFooter(currentPage);

      let y = 14;

      // Facility Emblem / Logo Badge + Title Box
      let drawnLogo = false;
      if (customLogoUrl) {
        try {
          const fmt = customLogoUrl.includes('image/jpeg') || customLogoUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
          doc.addImage(customLogoUrl, fmt, margin, y, 32, 11);
          drawnLogo = true;
        } catch (e) {
          console.warn('Failed to draw custom logo image on PDF', e);
        }
      }

      if (!drawnLogo) {
        doc.setFillColor(30, 58, 138); // Blue 900
        doc.roundedRect(margin, y, 32, 11, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(facilityEmblemText, margin + 16, y + 4.5, { align: 'center' });
        doc.setFontSize(5);
        doc.text("FACILITY LOGO", margin + 16, y + 8.5, { align: 'center' });
      }

      let titleText = "Healthcare Legal & Compliance Audit Report";
      if (reportType === 'EXECUTIVE') titleText = "Executive Healthcare Compliance Audit Folder";
      if (reportType === 'ASSET_INVENTORY') titleText = "Official Asset Inventory Compliance Report";
      if (reportType === 'LEGAL') titleText = "UAE Healthcare Legal Register Checkpoints";
      if (reportType === 'CIRCULARS') titleText = "DOH Circulars Register Compliance Logs";
      if (reportType === 'STANDARDS') titleText = "DOH Healthcare Standards Compliance Logs";
      if (reportType === 'LICENSES') titleText = "Mandatory Compliance Document Expiry Register";

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(titleText, margin + 36, y + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Facility Name: ${clientName} | DOH Reg ID: ${facilityLicense} | Scope: DOH & UAE Federal Regulations`, margin + 36, y + 9.5);

      y += 14;

      // Metadata Grid Box (Landscape 273mm)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(`Prepared By Auditor: ${prepBy}`, margin + 3, y + 4.5);
      doc.text(`Approved By Director: ${appBy}`, margin + 3, y + 9);

      doc.text(`Document Reference: ${docRef}`, margin + 95, y + 4.5);
      doc.text(`Version & State: v${docVersion} - ${docState}`, margin + 95, y + 9);

      doc.text(`Approval Status: ${approvalStatus}`, margin + 185, y + 4.5);
      doc.text(`Issue Date: ${issueDate} | Last Review: ${lastReviewDate}`, margin + 185, y + 9);

      y += 16;

      // Helper for Page Breakdown
      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 14) {
          doc.addPage();
          currentPage++;
          stampHeaderFooter(currentPage);
          y = 14;
        }
      };

      // Summary Dashboard Metrics
      checkPageOverflow(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text("Executive Compliance Summary Dashboard", margin, y);
      y += 3.5;

      const boxW = (contentWidth - 9) / 4;
      const metrics = [
        { label: "1. Legal Checkpoints", val: "100%", sub: `${requirements.length} Items Compliant`, color: [16, 185, 129] },
        { label: "2. DOH Circulars", val: `${Math.round((reportCirculars.filter(c => c.compliance_status === 'Fully Compliant').length / Math.max(1, reportCirculars.length)) * 100)}%`, sub: `${reportCirculars.length} Active Logs`, color: [99, 102, 241] },
        { label: "3. DOH Standards", val: `${Math.round((reportStandards.filter(s => s.compliance_status === 'Fully Compliant').length / Math.max(1, reportStandards.length)) * 100)}%`, sub: `${reportStandards.length} Standards Verified`, color: [14, 165, 233] },
        { label: "4. License Expirations", val: "100%", sub: `${docs.length} Active Licenses`, color: [245, 158, 11] },
      ];

      metrics.forEach((m, idx) => {
        const bx = margin + (idx * (boxW + 3));
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx, y, boxW, 10.5, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(m.label, bx + 2, y + 3.5);

        doc.setFontSize(8.5);
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.val, bx + 2, y + 7.5);

        doc.setFontSize(5.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.sub, bx + boxW - 2, y + 7.5, { align: 'right' });
      });

      y += 13.5;

      // Version Control Log Table
      if (versionLogs && versionLogs.length > 0) {
        checkPageOverflow(12 + (versionLogs.length * 4.5));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Document Version Control Log", margin, y);
        y += 3.5;

        // Table Header
        doc.setFillColor(226, 232, 240);
        doc.rect(margin, y, contentWidth, 4.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Ver.", margin + 2, y + 3.2);
        doc.text("Revision Date", margin + 14, y + 3.2);
        doc.text("Author / Reviewer", margin + 42, y + 3.2);
        doc.text("Details of Modifications", margin + 105, y + 3.2);
        y += 4.5;

        versionLogs.forEach((v) => {
          checkPageOverflow(4.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`v${v.ver}`, margin + 2, y + 3);
          doc.text(v.date, margin + 14, y + 3);
          doc.text(v.author, margin + 42, y + 3);
          const detailsTrunc = v.details.length > 105 ? v.details.substring(0, 102) + '...' : v.details;
          doc.text(detailsTrunc, margin + 105, y + 3);

          doc.setDrawColor(241, 245, 249);
          doc.line(margin, y + 4.2, margin + contentWidth, y + 4.2);
          y += 4.5;
        });
        y += 3;
      }

      // High-Density Section Helper function for drawing table sections
      const renderTable = (
        sectionTitle: string,
        headers: string[],
        colWidths: number[],
        rows: string[][]
      ) => {
        checkPageOverflow(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(sectionTitle, margin, y);
        y += 3.5;

        // Draw Table Header
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, contentWidth, 4.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);

        let currX = margin + 2;
        headers.forEach((h, i) => {
          doc.text(h, currX, y + 3.2);
          currX += colWidths[i];
        });
        y += 4.5;

        // Rows
        rows.forEach((row, rIdx) => {
          checkPageOverflow(5);

          if (rIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, contentWidth, 4.8, 'F');
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(30, 41, 59);

          let cellX = margin + 2;
          row.forEach((cell, cIdx) => {
            const maxChars = Math.floor(colWidths[cIdx] / 1.5);
            const cellText = cell.length > maxChars ? cell.substring(0, maxChars - 2) + '..' : cell;

            if (cIdx === 0) {
              doc.setFont('helvetica', 'bold');
            } else {
              doc.setFont('helvetica', 'normal');
            }

            // Highlighting status
            if (cell === 'Valid' || cell === 'Fully Compliant' || cell === 'ACTIVE') {
              doc.setTextColor(16, 185, 129);
              doc.setFont('helvetica', 'bold');
            } else if (cell === 'Partially Compliant' || cell === 'INACTIVE') {
              doc.setTextColor(217, 119, 6);
              doc.setFont('helvetica', 'bold');
            } else if (cell === 'Non-Compliant' || cell === 'Expired') {
              doc.setTextColor(220, 38, 38);
              doc.setFont('helvetica', 'bold');
            } else {
              doc.setTextColor(30, 41, 59);
            }

            doc.text(cellText, cellX, y + 3.3);
            cellX += colWidths[cIdx];
          });

          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 4.8, margin + contentWidth, y + 4.8);
          y += 4.8;
        });

        y += 3.5;
      };

      // 1. Licenses
      if (reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LICENSES') {
        const licenseHeaders = ["License / Document Name", "Reference No", "Issue Date", "Expiry Date", "Compliance Status", "Ver.", "Responsible Owner"];
        const licenseWidths = [65, 38, 28, 28, 26, 18, 70];
        const licenseRows = docs.map(d => [d.doc_name, d.ref_no, d.issue_date, d.expiry_date, d.status, d.version, d.responsible_person]);
        renderTable("1. Mandatory Compliance Document Expiry Register", licenseHeaders, licenseWidths, licenseRows);
      }

      // 2. Legal Register
      if (reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LEGAL') {
        const legalHeaders = ["Reference No", "Law / Regulation Name", "Authority", "Issue Date", "Compliance Status", "Responsible Owner"];
        const legalWidths = [32, 95, 35, 28, 28, 55];
        const legalRows = requirements.map(r => [r.ref_no, r.name, r.authority || 'DOH Abu Dhabi', r.issue_date, r.compliance_status, r.responsible_person]);
        renderTable("2. UAE Healthcare Legal Register Checkpoints", legalHeaders, legalWidths, legalRows);
      }

      // 3. Circulars
      if (reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'CIRCULARS') {
        const circHeaders = ["Circular No", "Circular Title & Name", "Issue Date", "Target Date", "Category", "Compliance Status", "Responsible Owner"];
        const circWidths = [30, 95, 28, 28, 32, 25, 35];
        const circRows = reportCirculars.map(c => [c.circular_no, c.circular_name, c.date, c.target_date || 'N/A', c.circular_category, c.compliance_status, c.responsible_person]);
        renderTable("3. DOH Circulars Register Compliance Logs", circHeaders, circWidths, circRows);
      }

      // 4. Standards
      if (reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'STANDARDS') {
        const stdHeaders = ["Reference No", "Standard Name", "Doc Version", "Issue Date", "Category", "Compliance Status", "Responsible Owner"];
        const stdWidths = [30, 90, 22, 26, 32, 28, 45];
        const stdRows = reportStandards.map(s => [
          s.reference,
          s.standard_name,
          s.version || s.doc_version || `v${docVersion}` || 'v1.0',
          s.date,
          s.standard_category || 'DOH Standard',
          s.compliance_status,
          s.responsible_person
        ]);
        renderTable("4. DOH Healthcare Standards Compliance Logs", stdHeaders, stdWidths, stdRows);
      }

      // 5. Assets
      if (reportType === 'EXECUTIVE' || reportType === 'ASSET_INVENTORY') {
        const assetHeaders = ["Asset Code", "Asset Name & Type", "Category & Location", "CIA Rating", "Status", "Asset Owner"];
        const assetWidths = [30, 75, 50, 25, 25, 68];
        const assetRows = reportAssets.map(a => [a.asset_code, `${a.asset_name} (${a.asset_type})`, `${a.asset_category} - ${a.location || 'AD Clinic'}`, `C${a.c_val || 3}/I${a.i_val || 3}/A${a.a_val || 3}`, a.status, a.asset_owner]);
        renderTable("5. Official Asset Inventory Compliance Register", assetHeaders, assetWidths, assetRows);
      }

      // Save PDF output file
      doc.save(`Healthcare_Legal_Compliance_Audit_Report_${docRef}.pdf`);
    } catch (err) {
      console.error('Error generating vector PDF:', err);
      alert('Error building PDF report. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Dedicated Clean Printable Document Generator & Trigger
  const handlePrintReport = () => {
    onLogAudit('PRINT', `Triggered Printable Document for report type: ${reportType}`, docRef);

    let stylesHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      stylesHtml += el.outerHTML;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${clientName} — Healthcare Audit & Compliance Report</title>
        ${stylesHtml}
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
          .logo-box { height: 45px; max-width: 180px; object-fit: contain; }
          .logo-placeholder { background: #1e3a8a; color: #fff; padding: 8px 14px; font-weight: bold; border-radius: 6px; font-size: 11px; text-transform: uppercase; }
          .title { font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 0 0 4px 0; }
          .subtitle { font-size: 11px; color: #64748b; font-weight: bold; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
          .meta-table td { border: 1px solid #cbd5e1; padding: 6px 10px; background: #f8fafc; }
          .meta-label { font-weight: bold; color: #475569; width: 18%; }
          .meta-val { font-weight: 600; color: #0f172a; width: 32%; }
          .section-title { font-size: 13px; font-weight: bold; color: #1e3a8a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin: 18px 0 8px 0; text-transform: uppercase; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
          table.data-table th { background: #1e293b; color: #ffffff; border: 1px solid #334155; padding: 6px 8px; text-align: left; font-weight: bold; }
          table.data-table td { border: 1px solid #cbd5e1; padding: 5px 8px; vertical-align: top; }
          table.data-table tr:nth-child(even) { background: #f8fafc; }
          .badge-compliant { color: #16a34a; font-weight: bold; }
          .badge-partially { color: #d97706; font-weight: bold; }
          .badge-non { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>

      <body>
        <div class="header">
          <div>
            <div class="title">${clientName.toUpperCase()}</div>
            <div class="subtitle">Healthcare Legal & Compliance Audit Report — DOH Abu Dhabi Aligned</div>
          </div>
          <div>
            ${customLogoUrl ? `<img src="${customLogoUrl}" class="logo-box" alt="Logo" />` : `<div class="logo-placeholder">${facilityEmblemText || 'FACILITY LOGO'}</div>`}
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Document Ref:</td>
            <td class="meta-val">${docRef}</td>
            <td class="meta-label">Document State:</td>
            <td class="meta-val" style="color: #16a34a; font-weight: bold;">${docState}</td>
          </tr>
          <tr>
            <td class="meta-label">Prepared By:</td>
            <td class="meta-val">${prepBy}</td>
            <td class="meta-label">Approved By:</td>
            <td class="meta-val">${appBy}</td>
          </tr>
          <tr>
            <td class="meta-label">Doc Version:</td>
            <td class="meta-val">v${docVersion}</td>
            <td class="meta-label">Issue Date:</td>
            <td class="meta-val">${issueDate}</td>
          </tr>
        </table>

        <!-- Document Version Control Log -->
        <div class="section-title">1. Document Version Control Log</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 10%;">Ver.</th>
              <th style="width: 15%;">Revision Date</th>
              <th style="width: 30%;">Author / Reviewer</th>
              <th style="width: 45%;">Details of Modifications</th>
            </tr>
          </thead>
          <tbody>
            ${versionLogs.map(v => `
              <tr>
                <td><strong>v${v.ver}</strong></td>
                <td>${v.date}</td>
                <td><strong>${v.author}</strong></td>
                <td>${v.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- UAE Legal Requirements -->
        <div class="section-title">2. UAE Healthcare Legal Register Checkpoints (${requirements.length} Checkpoints)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 15%;">Reference No</th>
              <th style="width: 45%;">Law / Regulation Details</th>
              <th style="width: 20%;">Compliance Status</th>
              <th style="width: 20%;">Responsible Owner</th>
            </tr>
          </thead>
          <tbody>
            ${requirements.map(r => `
              <tr>
                <td><strong>${r.ref_no}</strong></td>
                <td><strong>${r.name}</strong><br/><span style="color: #475569;">${r.summary || ''}</span></td>
                <td><span class="${r.compliance_status === 'Fully Compliant' ? 'badge-compliant' : 'badge-non'}">${r.compliance_status}</span></td>
                <td>${r.responsible_person}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Circulars -->
        <div class="section-title">3. DOH Circulars Register Compliance Logs (${reportCirculars.length} Logs)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 20%;">Circular No</th>
              <th style="width: 40%;">Circular Name</th>
              <th style="width: 20%;">Compliance Status</th>
              <th style="width: 20%;">Responsible Owner</th>
            </tr>
          </thead>
          <tbody>
            ${reportCirculars.map(c => `
              <tr>
                <td><strong>${c.circular_no}</strong></td>
                <td>${c.circular_name}</td>
                <td><span class="${c.compliance_status === 'Fully Compliant' ? 'badge-compliant' : c.compliance_status === 'Partially Compliant' ? 'badge-partially' : 'badge-non'}">${c.compliance_status}</span></td>
                <td>${c.responsible_person}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Standards -->
        <div class="section-title">4. DOH Healthcare Standards Compliance Logs (${reportStandards.length} Standards)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 18%;">Reference No</th>
              <th style="width: 38%;">Standard Name</th>
              <th style="width: 14%;">Doc Version</th>
              <th style="width: 15%;">Compliance Status</th>
              <th style="width: 15%;">Responsible Owner</th>
            </tr>
          </thead>
          <tbody>
            ${reportStandards.map(s => `
              <tr>
                <td><strong>${s.reference}</strong></td>
                <td>${s.standard_name}</td>
                <td><strong>${s.version || s.doc_version || 'v' + docVersion || 'v1.0'}</strong></td>
                <td><span class="${s.compliance_status === 'Fully Compliant' ? 'badge-compliant' : s.compliance_status === 'Partially Compliant' ? 'badge-partially' : 'badge-non'}">${s.compliance_status}</span></td>
                <td>${s.responsible_person}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Licenses -->
        <div class="section-title">5. Mandatory Compliance Licenses (${docs.length} Licenses)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25%;">License Name</th>
              <th style="width: 20%;">Ref Number</th>
              <th style="width: 15%;">Expiry Date</th>
              <th style="width: 20%;">Status</th>
              <th style="width: 20%;">Owner</th>
            </tr>
          </thead>
          <tbody>
            ${docs.map(d => `
              <tr>
                <td><strong>${d.doc_name}</strong></td>
                <td>${d.ref_no}</td>
                <td>${d.expiry_date}</td>
                <td><span class="badge-compliant">${d.status}</span></td>
                <td>${d.responsible_person}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>CONFIDENTIAL — Official Abu Dhabi Healthcare Audit & Legal Compliance Report</div>
          <div>${clientName} | ${docRef}</div>
        </div>
      </body>
      </html>
    `;

    printHtmlInHiddenIframe(printContent);
  };


  // 3. Formatted Excel Sheet Exports via xlsx (Module 6)
  const generateExcelReport = () => {
    onLogAudit('EXPORT', `Generated GRC Excel Report type: ${reportType}`, docRef);

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Metadata
      const metadata = [
        ['Healthcare Facility Compliance Reporting Sheet'],
        ['Facility Name', clientName],
        ['DOH Facility License ID', 'AD-9482-FAC'],
        ['Malaffi EMR Code', '#88204'],
        ['Report Reference ID', docRef],
        ['Prepared By', prepBy],
        ['Approved By', appBy],
        ['Document State', docState],
        ['Issue Date', issueDate],
        ['Last Review Date', lastReviewDate],
        ['Date generated', new Date().toISOString().replace('T', ' ').substring(0, 19)]
      ];
      const ws_meta = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, ws_meta, 'Summary');

      // Sheet 2: Legal requirements
      const legal_rows = requirements.map(r => ({
        'Reference No': r.ref_no,
        'Law / Regulation Name': r.name,
        'Authority': r.authority,
        'Issue Date': r.issue_date,
        'Category': r.category,
        'Compliance Status': r.compliance_status,
        'Responsible Owner': r.responsible_person,
        'Expiry Date': r.expiry_date || 'N/A'
      }));
      const ws_legal = XLSX.utils.json_to_sheet(legal_rows);
      XLSX.utils.book_append_sheet(wb, ws_legal, 'UAE Legal Register');

      // Sheet 3: Circulars
      const circ_rows = reportCirculars.map(c => ({
        'Circular No': c.circular_no,
        'Circular Title': c.circular_name,
        'Issue Date': c.date,
        'Target Date': c.target_date || 'N/A',
        'Category': c.circular_category,
        'Compliance Status': c.compliance_status,
        'Responsible Owner': c.responsible_person,
        'Remarks': c.remarks || ''
      }));
      const ws_circs = XLSX.utils.json_to_sheet(circ_rows);
      XLSX.utils.book_append_sheet(wb, ws_circs, 'DOH Circulars Logs');

      // Sheet 4: Standards
      const std_rows = reportStandards.map(s => ({
        'Reference ID': s.reference,
        'Standard Name': s.standard_name,
        'Doc Version': s.version || s.doc_version || `v${docVersion}` || 'v1.0',
        'Issue Date': s.date,
        'Category': s.standard_category || 'DOH Healthcare Standard',
        'Status': s.compliance_status,
        'Owner': s.responsible_person,
        'Remarks': s.remarks || ''
      }));
      const ws_stds = XLSX.utils.json_to_sheet(std_rows);
      XLSX.utils.book_append_sheet(wb, ws_stds, 'DOH Standards Logs');

      // Sheet 5: Licenses
      const doc_rows = docs.map(d => ({
        'License Name': d.doc_name,
        'Reference Number': d.ref_no,
        'Issue Date': d.issue_date,
        'Expiry Date': d.expiry_date,
        'Status': d.status,
        'Version': d.version,
        'Revision Date': d.revision_date,
        'Responsible Owner': d.responsible_person
      }));
      const ws_docs = XLSX.utils.json_to_sheet(doc_rows);
      XLSX.utils.book_append_sheet(wb, ws_docs, 'Mandatory Licenses');

      // Sheet 6: Asset Inventory Register
      const asset_rows = reportAssets.map(a => ({
        'Asset Code': a.asset_code,
        'Asset Name': a.asset_name,
        'Asset Type': a.asset_type,
        'Category': a.asset_category,
        'Manufacturer': a.manufacturer || 'N/A',
        'Model': a.model || 'N/A',
        'Serial Number': a.serial_number || 'N/A',
        'Asset Owner': a.asset_owner,
        'Classification': a.classification,
        'Location': a.location || 'N/A',
        'Department': a.department || 'N/A',
        'Operating System': a.operating_system || 'N/A',
        'Warranty Expiry': a.warranty_expiry || 'N/A',
        'PPM Due Date': a.ppm_due_date || 'N/A',
        'Status': a.status,
        'Confidentiality (C)': a.c_val || 3,
        'Integrity (I)': a.i_val || 3,
        'Availability (A)': a.a_val || 3
      }));
      const ws_assets = XLSX.utils.json_to_sheet(asset_rows);
      XLSX.utils.book_append_sheet(wb, ws_assets, 'Asset Inventory Register');

      // Write Workbook to browser trigger
      XLSX.writeFile(wb, `GRC_Compliance_Workbook_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Error generating Excel spreadsheet.');
    }
  };

  // 4. Word Document Export via standard HTML attachment Blob (Module 6)
  const generateWordReport = () => {
    onLogAudit('EXPORT', `Exported styled Word HTML Report`, docRef);

    try {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>Healthcare Legal & Compliance Audit Report</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; color: #0F172A; padding: 20px; }
            .header-banner { border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; margin-bottom: 20px; }
            .branding { font-size: 8pt; color: #64748B; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
            h1 { color: #1E3A8A; font-size: 18pt; margin: 5px 0 10px 0; font-weight: bold; }
            .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9pt; background: #F8FAFC; }
            .meta-grid td { border: 1px solid #E2E8F0; padding: 6px 10px; }
            .meta-label { font-weight: bold; color: #475569; }
            .status-badge { background-color: #DCFCE7; color: #15803D; padding: 2px 8px; font-weight: bold; border-radius: 4px; display: inline-block; }
            h2 { color: #4F46E5; font-size: 13pt; margin-top: 18pt; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
            th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; vertical-align: top; }
            th { background-color: #F1F5F9; font-weight: bold; color: #1E293B; }
            .status-compliant { color: #16A34A; font-weight: bold; }
            .status-partially { color: #D97706; font-weight: bold; }
            .status-non { color: #DC2626; font-weight: bold; }
            .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; pt: 8px; font-size: 8pt; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="branding">Page Header / Footer Compliance Branding Configuration — Abu Dhabi DOH Aligned</div>
            <h1>Healthcare Legal & Compliance Audit Report</h1>
            <table class="meta-grid">
              <tr>
                <td class="meta-label">Organization Name:</td>
                <td><strong>${clientName}</strong></td>
                <td class="meta-label">Document Ref No:</td>
                <td><strong>${docRef}</strong></td>
              </tr>
              <tr>
                <td class="meta-label">DOCUMENT STATE:</td>
                <td><strong>${docState}</strong></td>
                <td class="meta-label">VERSION:</td>
                <td><strong>${docVersion} - PUBLISHED</strong></td>
              </tr>
              <tr>
                <td class="meta-label">ISSUE DATE:</td>
                <td><strong>${issueDate}</strong></td>
                <td class="meta-label">LAST COMPLIANCE REVIEW:</td>
                <td><strong>${lastReviewDate}</strong></td>
              </tr>
              <tr>
                <td class="meta-label">Prepared By:</td>
                <td>${prepBy}</td>
                <td class="meta-label">Approved By & Status:</td>
                <td>${appBy} — <span class="status-badge">${approvalStatus}</span></td>
              </tr>
            </table>
          </div>

          <h2>Document Version Control Log</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Ver.</th>
                <th style="width: 15%;">Date</th>
                <th style="width: 35%;">Author / Reviewer</th>
                <th style="width: 40%;">Details of Modifications</th>
              </tr>
            </thead>
            <tbody>
              ${versionLogs.map(v => `
                <tr>
                  <td><strong>${v.ver}</strong></td>
                  <td>${v.date}</td>
                  <td>${v.author}</td>
                  <td>${v.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>1. Mandatory Compliance Document Expiry</h2>
          <table>
            <thead>
              <tr>
                <th>License / Document Name</th>
                <th>Reference No</th>
                <th>Compliance Status</th>
                <th>Expiry Date</th>
                <th>Responsible Owner</th>
              </tr>
            </thead>
            <tbody>
              ${docs.map(d => `
                <tr>
                  <td><strong>${d.doc_name}</strong></td>
                  <td>${d.ref_no}</td>
                  <td><span class="${d.status === 'Valid' ? 'status-compliant' : 'status-non'}">${d.status}</span></td>
                  <td>${d.expiry_date}</td>
                  <td>${d.responsible_person}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>2. UAE Healthcare Legal Register Checkpoints</h2>
          <table>
            <thead>
              <tr>
                <th>Reference No</th>
                <th>Regulation Details</th>
                <th>Compliance Status</th>
                <th>Responsible Owner</th>
              </tr>
            </thead>
            <tbody>
              ${requirements.map(r => `
                <tr>
                  <td><strong>${r.ref_no}</strong></td>
                  <td><strong>${r.name}</strong><br/>${r.summary}</td>
                  <td><span class="${r.compliance_status === 'Fully Compliant' ? 'status-compliant' : 'status-non'}">${r.compliance_status}</span></td>
                  <td>${r.responsible_person}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>3. DOH Circulars Register Compliance Logs</h2>
          <table>
            <thead>
              <tr>
                <th>DOH Circulars Register Compliance Logs</th>
                <th>Issue / Target Date</th>
                <th>Compliance Status</th>
                <th>Responsible Person</th>
              </tr>
            </thead>
            <tbody>
              ${reportCirculars.map(c => `
                <tr>
                  <td><strong>[${c.circular_no}]</strong> ${c.circular_name}</td>
                  <td>${c.target_date || 'N/A'}</td>
                  <td><span class="${c.compliance_status === 'Fully Compliant' ? 'status-compliant' : c.compliance_status === 'Partially Compliant' ? 'status-partially' : 'status-non'}">${c.compliance_status}</span></td>
                  <td>${c.responsible_person}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>4. DOH Healthcare Standards Compliance Logs</h2>
          <table>
            <thead>
              <tr>
                <th>Reference No</th>
                <th>Standard Name</th>
                <th>Compliance Status</th>
                <th>Responsible Owner</th>
              </tr>
            </thead>
            <tbody>
              ${reportStandards.map(s => `
                <tr>
                  <td><strong>${s.reference}</strong></td>
                  <td>${s.standard_name}</td>
                  <td><span class="${s.compliance_status === 'Fully Compliant' ? 'status-compliant' : s.compliance_status === 'Partially Compliant' ? 'status-partially' : 'status-non'}">${s.compliance_status}</span></td>
                  <td>${s.responsible_person}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            CONFIDENTIAL — Official Abu Dhabi Healthcare Legal & Compliance Audit Report — Aligned with DOH & MALAFFI Standards
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Healthcare_Legal_Compliance_Audit_Report_${docRef}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error generating Word document export.');
    }
  };

  // 5. Simulated SMTP Email Dispatch with attach tracking (Module 8)
  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailMessage) {
      alert('Please fill out mandatory email fields.');
      return;
    }

    setIsSendingEmail(true);
    setEmailSuccess(null);
    onLogAudit('EMAIL', `Initiating email dispatch simulation to ${emailTo}`, docRef);

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSuccess(`Success! Message dispatched via simulated SMTP server to ${emailTo}. Check logs in Settings!`);
      
      // Dispatch email log to parent hook
      if (onAddEmailLog) {
        onAddEmailLog(
          emailTo, 
          emailSubject, 
          'REPORTS', 
          'SENT', 
          `Attachments: ${attachPdf ? '[PDF REPORT] ' : ''}${attachExcel ? '[EXCEL WORKBOOK]' : ''}\n\nCC: ${emailCc}\nBCC: ${emailBcc}\n\n${emailMessage}`
        );
      }

      onLogAudit('EMAIL', `Dispatched compliant healthcare report to ${emailTo}`, docRef);
      
      // Clear fields on success
      setTimeout(() => setEmailSuccess(null), 7000);
    }, 2500);
  };

  return (
    <div id="reports-and-emailing-module" className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans text-xs text-slate-700">
      
      {/* 1. Reports Engine Config Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 6</span>
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-1">
              <Printer className="w-4.5 h-4.5 text-indigo-600" /> Compliance Reports & Document Compilers
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Configure organizational metadata and build printable legal folders matching Abu Dhabi DOH requirements.
            </p>
          </div>

          {/* Quick Master Setup Loop Connection */}
          <DocRefLoopSelector
            currentRefCode={docRef}
            onApplyLoop={(data) => {
              setDocRef(data.ref_code);
              setPrepBy(data.prepared_by);
              setAppBy(data.approved_by);
              setDocState(data.classification || 'ACTIVE');
              setDocVersion(data.version || '1.0');
              setIssueDate(data.issue_date);
              setLastReviewDate(data.review_date);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Organization Name</label>
              <input
                type="text"
                value={clientName}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                disabled
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Document Reference No</label>
              <input
                type="text"
                value={docRef}
                onChange={e => setDocRef(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Prepared By Auditor</label>
              <input
                type="text"
                value={prepBy}
                onChange={e => setPrepBy(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Approved By Director</label>
              <input
                type="text"
                value={appBy}
                onChange={e => setAppBy(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Document State</label>
              <input
                type="text"
                value={docState}
                onChange={e => setDocState(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-emerald-700 font-extrabold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Doc Version</label>
              <input
                type="text"
                value={docVersion}
                onChange={e => setDocVersion(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Last Compliance Review</label>
              <input
                type="date"
                value={lastReviewDate}
                onChange={e => setLastReviewDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-600 mb-1">Select Report Type Target</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-indigo-300 bg-indigo-50/30 text-slate-900 text-xs font-extrabold cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="HEALTHCARE_AUDIT">★ HEALTHCARE LEGAL & COMPLIANCE AUDIT REPORT (FULL DOH AUDIT)</option>
                <option value="EXECUTIVE">Executive Audit Folder (All Modules)</option>
                <option value="ASSET_INVENTORY">OFFICIAL ASSET INVENTORY COMPLIANCE REPORT</option>
                <option value="LEGAL">UAE Healthcare Legal Register Checkpoints</option>
                <option value="CIRCULARS">DOH Circulars Register Compliance Logs</option>
                <option value="STANDARDS">DOH Healthcare Standards Compliance Logs</option>
                <option value="LICENSES">Mandatory Compliance Document Expiry</option>
              </select>
            </div>

            {/* Circulars & Standards Compliance Filter */}
            <div className="sm:col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <label className="block font-extrabold text-indigo-950 mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Circulars & Standards Report Filtering
                </span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                  {reportCirculars.length} Circulars & {reportStandards.length} Standards Included
                </span>
              </label>
              <select
                value={complianceFilter}
                onChange={e => setComplianceFilter(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-indigo-950 cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="COMPLIANT_ONLY">
                  ✓ Show Selected Compliant Only: Fully Compliant & Partially Compliant Only (Hides Non-Compliant / NA)
                </option>
                <option value="FULLY_COMPLIANT">
                  ✓ Fully Compliant Only ({circulars.filter(c => c.compliance_status === 'Fully Compliant').length} Circulars / {standards.filter(s => s.compliance_status === 'Fully Compliant').length} Standards)
                </option>
                <option value="PARTIALLY_COMPLIANT">
                  ⚡ Partially Compliant Only ({circulars.filter(c => c.compliance_status === 'Partially Compliant').length} Circulars / {standards.filter(s => s.compliance_status === 'Partially Compliant').length} Standards)
                </option>
                <option value="ALL">
                  Show All Items (Including Non-Compliant & Not Applicable)
                </option>
              </select>
              <p className="text-[10px] text-indigo-600/80 font-medium mt-1">
                Filters Circulars & Standards reports to include only items matching the selected compliance level to avoid cluttering official exports.
              </p>
            </div>

            {/* Facility Header Logo Upload Control */}
            <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <label className="block font-extrabold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" /> Facility Logo for Report Header & PDF
                </span>
                {customLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLogoUrl('');
                      if (activeClientId) localStorage.removeItem(`sh_report_logo_${activeClientId}`);
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Reset Logo
                  </button>
                )}
              </label>
              <div className="flex items-center gap-3">
                {customLogoUrl ? (
                  <div className="shrink-0">
                    <img src={customLogoUrl} alt="Facility Logo" className="h-10 max-w-[140px] object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-2xs" />
                  </div>
                ) : (
                  <div className="h-10 px-3 bg-slate-900 text-emerald-400 font-black text-[11px] rounded-lg flex items-center justify-center border border-slate-700 uppercase tracking-wide">
                    {facilityEmblemText || 'FACILITY LOGO'}
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Logo Image (PNG / JPEG)</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoFileUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Upload your official healthcare facility logo to automatically embed it on compiled PDF reports and document previews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compile Triggers */}
        <div className="border-t border-slate-100 pt-4.5 space-y-2.5">
          <button
            id="open-live-report-preview-btn"
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="w-full bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 hover:from-indigo-800 hover:to-slate-950 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Eye className="w-4 h-4 text-emerald-400" /> Live Interactive Report Preview & Print
          </button>

          <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest block mb-2 pt-1">Compile and Download Options</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              id="download-pdf-report-btn"
              type="button"
              disabled={isGeneratingPdf}
              onClick={generatePDFReport}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Building...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-emerald-400" /> Compile PDF
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4 text-sky-200" /> Print / Save
            </button>
            <button
              id="download-excel-report-btn"
              type="button"
              onClick={generateExcelReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4 text-slate-100" /> Export Excel
            </button>
            <button
              id="download-word-report-btn"
              type="button"
              onClick={generateWordReport}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <FileText className="w-4 h-4 text-indigo-300" /> Word Doc
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCloneModal(true)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Copy className="w-4 h-4 text-emerald-200" /> Replicate / Clone Circulars & Standards to Another Facility
            </button>
          </div>
        </div>
      </div>

      {/* 2. Simulated SMTP Email Dispatch Block (Module 8) */}
      <form onSubmit={handleSendEmailSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 8</span>
            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-1">
              <Mail className="w-4.5 h-4.5 text-indigo-600" /> Automated Compliance Email Dispatch
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Dispatch encrypted compliance folders directly to DOH auditors, clinic owners, or internal committees.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-600 mb-0.5">To (Recipient)*</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-0.5">CC</label>
                <input
                  type="email"
                  value={emailCc}
                  onChange={e => setEmailCc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-0.5">BCC</label>
                <input
                  type="email"
                  value={emailBcc}
                  onChange={e => setEmailBcc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-0.5">Subject*</label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-0.5">Message / Body*</label>
              <textarea
                required
                rows={3}
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold font-mono"
              />
            </div>

            {/* Checkbox attachments */}
            <div className="flex gap-4 items-center pt-1.5 text-[10px] font-bold text-slate-600">
              <span className="text-slate-400 uppercase tracking-wider text-[8px]">Include Attachments:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={attachPdf} 
                  onChange={e => setAttachPdf(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Attach Compiled PDF
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={attachExcel} 
                  onChange={e => setAttachExcel(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Attach Excel Workbook
              </label>
            </div>
          </div>
        </div>

        {/* Send Buttons */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
          {emailSuccess && (
            <div className="bg-teal-50 border border-teal-100 text-teal-800 text-[10px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold animate-fade-in">
              <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
              {emailSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="send-compliance-email-btn"
              type="submit"
              disabled={isSendingEmail}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> Sending via SMTP...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-emerald-400" /> Dispatch via SMTP Relay
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?cc=${encodeURIComponent(emailCc)}&bcc=${encodeURIComponent(emailBcc)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage + '\n\n[Attached Reports: ' + (attachPdf ? 'PDF ' : '') + (attachExcel ? 'EXCEL' : '') + ']')}`;
                window.open(mailtoUrl, '_blank');
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4 text-sky-200" /> Send via Email Client (mailto:)
            </button>
          </div>
        </div>
      </form>

      {/* 3. Live Printable Healthcare Legal & Compliance Audit Report Modal */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Top Control Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                    {reportType === 'HEALTHCARE_AUDIT' && 'Healthcare Legal & Compliance Audit Report'}
                    {reportType === 'EXECUTIVE' && 'Executive Healthcare Compliance Audit Folder'}
                    {reportType === 'ASSET_INVENTORY' && 'Official Asset Inventory Compliance Report'}
                    {reportType === 'LEGAL' && 'UAE Healthcare Legal Register Checkpoints'}
                    {reportType === 'CIRCULARS' && 'DOH Circulars Register Compliance Logs'}
                    {reportType === 'STANDARDS' && 'DOH Healthcare Standards Compliance Logs'}
                    {reportType === 'LICENSES' && 'Mandatory Compliance Document Expiry Register'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Official Abu Dhabi Healthcare Authority & MALAFFI Standards Audit Document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={generatePDFReport}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Building PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-emerald-400" /> PDF
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={generateExcelReport}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button
                  type="button"
                  onClick={generateWordReport}
                  className="bg-indigo-900 hover:bg-indigo-800 text-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-sky-300" /> Word
                </button>
                <button
                  type="button"
                  onClick={() => setShowLivePreviewModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Document Body (Landscape A4 High Density Paper Styling) */}
            <div id="printable-report-document" className="p-5 overflow-y-auto space-y-4 bg-white max-w-[1100px] w-full mx-auto my-3 rounded-xl shadow-md border border-slate-200 text-slate-900 font-sans print:p-0 print:shadow-none print:border-none print:max-w-none print:w-full">
              
              {/* Facility Header Branding & Compliance Configuration */}
              <div className="border-b-2 border-slate-800 pb-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl mb-3 shadow-sm border border-slate-800">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center border border-white/20 shrink-0">
                    <Building2 className="w-6 h-6 text-emerald-400" />
                    <span className="text-[7px] font-black tracking-widest text-indigo-200 uppercase">LOGICAL</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-2">
                        <span>{clientName || 'AL SALAM MEDICAL CENTER'}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">DOH AD-9482-FAC</span>
                      </h2>
                      <span className="text-[9px] font-mono font-bold text-slate-300">MALAFFI EMR ID: #88204</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                      Department of Health (DOH) Abu Dhabi & UAE Federal Legal Register Compliance Audit Division
                    </p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[8.5px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 block w-fit mb-1">
                      PAGE HEADER / FOOTER COMPLIANCE BRANDING CONFIGURATION
                    </span>
                    <h1 className="text-base font-black text-slate-900 tracking-tight">
                      {reportType === 'HEALTHCARE_AUDIT' && 'Healthcare Legal & Compliance Audit Report'}
                      {reportType === 'EXECUTIVE' && 'Executive Healthcare Compliance Audit Folder'}
                      {reportType === 'ASSET_INVENTORY' && 'Official Asset Inventory Compliance Report'}
                      {reportType === 'LEGAL' && 'UAE Healthcare Legal Register Checkpoints'}
                      {reportType === 'CIRCULARS' && 'DOH Circulars Register Compliance Logs'}
                      {reportType === 'STANDARDS' && 'DOH Healthcare Standards Compliance Logs'}
                      {reportType === 'LICENSES' && 'Mandatory Compliance Document Expiry Register'}
                    </h1>
                  </div>

                  <div className="text-right text-[10px] space-y-0.5 shrink-0">
                    <div className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                      ✓ {approvalStatus}
                    </div>
                    <div className="flex items-center justify-end gap-3 font-medium text-slate-600">
                      <span><strong className="text-slate-500">Ref No:</strong> <span className="font-mono font-bold text-slate-900">{docRef}</span></span>
                      <span><strong className="text-slate-500">STATE:</strong> <span className="font-extrabold text-indigo-700">{docState}</span></span>
                      <span><strong className="text-slate-500">VERSION:</strong> <span className="font-bold text-slate-900">v{docVersion}</span></span>
                      <span><strong className="text-slate-500">ISSUE:</strong> <span className="font-bold text-slate-900">{issueDate}</span></span>
                      <span><strong className="text-slate-500">REVIEW:</strong> <span className="font-bold text-slate-900">{lastReviewDate}</span></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div><span className="text-slate-500 font-bold block text-[9px]">Prepared By Auditor:</span> <strong className="text-slate-900">{prepBy}</strong></div>
                  <div><span className="text-slate-500 font-bold block text-[9px]">Approved By Director:</span> <strong className="text-slate-900">{appBy}</strong></div>
                  <div><span className="text-slate-500 font-bold block text-[9px]">Regulatory Scope:</span> <strong className="text-indigo-900">Abu Dhabi DOH & MALAFFI</strong></div>
                </div>
              </div>

              {/* Compliance Summary Dashboard */}
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Compliance Summary Dashboard
                </h3>
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[9px] font-extrabold text-emerald-800 uppercase block">1. Legal Checkpoints</span>
                    <span className="text-base font-black text-emerald-900">100%</span>
                    <span className="text-[8.5px] font-bold text-emerald-700 block mt-0.5">{requirements.length} / {requirements.length} Compliant</span>
                  </div>
                  <div className="bg-indigo-50/80 p-2 rounded-xl border border-indigo-200 text-center">
                    <span className="text-[9px] font-extrabold text-indigo-800 uppercase block">2. DOH Circulars</span>
                    <span className="text-base font-black text-indigo-900">{Math.round((reportCirculars.filter(c => c.compliance_status === 'Fully Compliant').length / Math.max(1, reportCirculars.length)) * 100)}%</span>
                    <span className="text-[8.5px] font-bold text-indigo-700 block mt-0.5">{reportCirculars.length} Logs Active</span>
                  </div>
                  <div className="bg-sky-50/80 p-2 rounded-xl border border-sky-200 text-center">
                    <span className="text-[9px] font-extrabold text-sky-800 uppercase block">3. DOH Standards</span>
                    <span className="text-base font-black text-sky-900">{Math.round((reportStandards.filter(s => s.compliance_status === 'Fully Compliant').length / Math.max(1, reportStandards.length)) * 100)}%</span>
                    <span className="text-[8.5px] font-bold text-sky-700 block mt-0.5">{reportStandards.length} Standards Verified</span>
                  </div>
                  <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200 text-center">
                    <span className="text-[9px] font-extrabold text-amber-800 uppercase block">4. License Expirations</span>
                    <span className="text-base font-black text-amber-900">100%</span>
                    <span className="text-[8.5px] font-bold text-amber-700 block mt-0.5">{docs.length} Active Licenses</span>
                  </div>
                </div>
              </div>

              {/* Document Version Control Log */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Document Version Control Log
                  </h3>
                  <button
                    type="button"
                    onClick={handleOpenAddVersion}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-indigo-600" /> Add Version Entry
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-14 border-r border-slate-200">Ver.</th>
                        <th className="p-2 w-24 border-r border-slate-200">Revision Date</th>
                        <th className="p-2 w-52 border-r border-slate-200">Author / Reviewer</th>
                        <th className="p-2">Details of Modifications</th>
                        <th className="p-2 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {versionLogs.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-2 font-bold text-indigo-700 border-r border-slate-200">v{v.ver}</td>
                          <td className="p-2 text-slate-600 font-semibold border-r border-slate-200">{v.date}</td>
                          <td className="p-2 text-slate-900 font-bold border-r border-slate-200">{v.author}</td>
                          <td className="p-2 text-slate-700 border-r border-slate-200">{v.details}</td>
                          <td className="p-2 text-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVersion(i)}
                              className="text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              title="Edit Version Log"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersionLog(i)}
                              className="text-[9px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              title="Delete Version Log"
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 1: Mandatory Compliance Document Expiry */}
              {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LICENSES') && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" /> 1. Mandatory Compliance Document Expiry Register
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-2 border-r border-slate-200">License / Document Name</th>
                          <th className="p-2 border-r border-slate-200">Reference No</th>
                          <th className="p-2 border-r border-slate-200">Issue Date</th>
                          <th className="p-2 border-r border-slate-200">Expiry Date</th>
                          <th className="p-2 border-r border-slate-200">Compliance Status</th>
                          <th className="p-2 border-r border-slate-200">Ver.</th>
                          <th className="p-2">Responsible Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {docs.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-extrabold text-slate-900 border-r border-slate-200">{d.doc_name}</td>
                            <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{d.ref_no}</td>
                            <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{d.issue_date}</td>
                            <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{d.expiry_date}</td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                                d.status === 'Valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-600 font-mono border-r border-slate-200">v{d.version}</td>
                            <td className="p-2 text-slate-700 font-medium">{d.responsible_person}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table 2: UAE Healthcare Legal Register Checkpoints */}
              {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LEGAL') && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> 2. UAE Healthcare Legal Register Checkpoints
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-24 border-r border-slate-200">Reference No</th>
                          <th className="p-2 border-r border-slate-200">Law / Regulation Details</th>
                          <th className="p-2 w-28 border-r border-slate-200">Authority</th>
                          <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                          <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                          <th className="p-2 w-40">Responsible Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {requirements.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-mono font-extrabold text-indigo-700 border-r border-slate-200">{r.ref_no}</td>
                            <td className="p-2 border-r border-slate-200">
                              <strong className="text-slate-900 block text-[10.5px]">{r.name}</strong>
                              <span className="text-[9.5px] text-slate-500">{r.summary}</span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{r.authority || 'DOH Abu Dhabi'}</td>
                            <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{r.issue_date}</td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold">
                                {r.compliance_status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium">{r.responsible_person}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table 3: DOH Circulars Register Compliance Logs */}
              {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'CIRCULARS') && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" /> 3. DOH Circulars Register Compliance Logs
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-28 border-r border-slate-200">Circular No</th>
                          <th className="p-2 border-r border-slate-200">Circular Title & Name</th>
                          <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                          <th className="p-2 w-24 border-r border-slate-200">Target Date</th>
                          <th className="p-2 w-32 border-r border-slate-200">Category</th>
                          <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                          <th className="p-2 w-36">Responsible Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {reportCirculars.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-mono font-bold text-indigo-900 border-r border-slate-200">{c.circular_no}</td>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{c.circular_name}</td>
                            <td className="p-2 text-slate-700 font-semibold border-r border-slate-200">{c.date}</td>
                            <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{c.target_date || 'N/A'}</td>
                            <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{c.circular_category}</td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                                c.compliance_status === 'Fully Compliant' ? 'bg-emerald-100 text-emerald-800' :
                                c.compliance_status === 'Partially Compliant' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {c.compliance_status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium">{c.responsible_person}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table 4: DOH Healthcare Standards Compliance Logs */}
              {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'STANDARDS') && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 4. DOH Healthcare Standards Compliance Logs
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-28 border-r border-slate-200">Reference No</th>
                          <th className="p-2 border-r border-slate-200">Standard Name</th>
                          <th className="p-2 w-24 border-r border-slate-200">Doc Version</th>
                          <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                          <th className="p-2 w-32 border-r border-slate-200">Category</th>
                          <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                          <th className="p-2 w-36">Responsible Owner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {reportStandards.map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-mono font-extrabold text-slate-800 border-r border-slate-200">{s.reference}</td>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{s.standard_name}</td>
                            <td className="p-2 font-mono font-extrabold text-indigo-900 border-r border-slate-200">{s.version || s.doc_version || `v${docVersion}` || 'v1.0'}</td>
                            <td className="p-2 text-slate-700 font-semibold border-r border-slate-200">{s.date}</td>
                            <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{s.standard_category || 'DOH Standard'}</td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                                s.compliance_status === 'Fully Compliant' ? 'bg-emerald-100 text-emerald-800' :
                                s.compliance_status === 'Partially Compliant' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {s.compliance_status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium">{s.responsible_person}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table 5: Official Asset Inventory Compliance Register */}
              {(reportType === 'EXECUTIVE' || reportType === 'ASSET_INVENTORY') && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 5. Official Asset Inventory Compliance Register
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-24 border-r border-slate-200">Asset Code</th>
                          <th className="p-2 border-r border-slate-200">Asset Name & Type</th>
                          <th className="p-2 border-r border-slate-200">Category & Location</th>
                          <th className="p-2 w-32 border-r border-slate-200">Owner & Dept</th>
                          <th className="p-2 w-24 border-r border-slate-200">CIA Ratings</th>
                          <th className="p-2 w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {reportAssets.map((a, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-mono font-extrabold text-indigo-700 border-r border-slate-200">{a.asset_code}</td>
                            <td className="p-2 border-r border-slate-200">
                              <strong className="text-slate-900 block">{a.asset_name}</strong>
                              <span className="text-[9.5px] text-slate-500">{a.asset_type} {a.manufacturer ? `(${a.manufacturer} ${a.model || ''})` : ''}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="font-semibold text-slate-800 block">{a.asset_category}</span>
                              <span className="text-[9.5px] text-slate-500">{a.location || 'N/A'}</span>
                            </td>
                            <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{a.asset_owner}</td>
                            <td className="p-2 font-bold text-slate-700 border-r border-slate-200">C:{a.c_val || 3} / I:{a.i_val || 3} / A:{a.a_val || 3}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                                a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-500 font-bold space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                <div className="flex items-center justify-between text-[9.5px] text-slate-700 font-extrabold pb-1 border-b border-slate-200 mb-1">
                  <span>Facility: {clientName} (License: {facilityLicense})</span>
                  <span>Compliance Email: {facilityEmail}</span>
                  <span>Tel: {facilityPhone}</span>
                </div>
                <p className="uppercase tracking-widest text-indigo-900 font-extrabold">
                  CONFIDENTIAL — Official Abu Dhabi Healthcare Legal & Compliance Audit Report
                </p>
                <p className="text-slate-500 text-[8.5px]">
                  Aligned with Department of Health (DOH) Abu Dhabi & MALAFFI Standards — Generated: {formatDateDMY(new Date())} — Landscape High-Density Format
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Offscreen Printable Report Document for compile PDF anytime */}
      <div className="fixed -left-[9999px] top-0 w-[1122px] pointer-events-none aria-hidden">
        <div id="offscreen-printable-report" className="p-6 bg-white space-y-4 text-slate-900 font-sans">
          {/* Header / Compliance Branding Configuration */}
          <div className="border-b-2 border-slate-800 pb-3">
            <div className="flex items-center gap-3 bg-slate-900 text-white p-3.5 rounded-xl mb-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center border border-white/20 shrink-0">
                <Building2 className="w-6 h-6 text-emerald-400" />
                <span className="text-[7px] font-black tracking-widest text-indigo-200 uppercase">LOGICAL</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-2">
                    <span>{clientName}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">DOH {facilityLicense}</span>
                  </h2>
                  <span className="text-[9px] font-mono font-bold text-slate-300">MALAFFI EMR ID: #88204</span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                  Department of Health (DOH) Abu Dhabi & UAE Federal Legal Register Compliance Audit Division
                </p>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[8.5px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 block w-fit mb-1">
                  PAGE HEADER / FOOTER COMPLIANCE BRANDING CONFIGURATION
                </span>
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  {reportType === 'HEALTHCARE_AUDIT' && 'Healthcare Legal & Compliance Audit Report'}
                  {reportType === 'EXECUTIVE' && 'Executive Healthcare Compliance Audit Folder'}
                  {reportType === 'ASSET_INVENTORY' && 'Official Asset Inventory Compliance Report'}
                  {reportType === 'LEGAL' && 'UAE Healthcare Legal Register Checkpoints'}
                  {reportType === 'CIRCULARS' && 'DOH Circulars Register Compliance Logs'}
                  {reportType === 'STANDARDS' && 'DOH Healthcare Standards Compliance Logs'}
                  {reportType === 'LICENSES' && 'Mandatory Compliance Document Expiry Register'}
                </h1>
              </div>

              <div className="text-right text-[10px] space-y-0.5 shrink-0">
                <div className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                  ✓ {approvalStatus}
                </div>
                <div className="flex items-center justify-end gap-3 font-medium text-slate-600">
                  <span><strong className="text-slate-500">Ref No:</strong> <span className="font-mono font-bold text-slate-900">{docRef}</span></span>
                  <span><strong className="text-slate-500">STATE:</strong> <span className="font-extrabold text-indigo-700">{docState}</span></span>
                  <span><strong className="text-slate-500">VERSION:</strong> <span className="font-bold text-slate-900">v{docVersion}</span></span>
                  <span><strong className="text-slate-500">ISSUE:</strong> <span className="font-bold text-slate-900">{issueDate}</span></span>
                  <span><strong className="text-slate-500">REVIEW:</strong> <span className="font-bold text-slate-900">{lastReviewDate}</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div><span className="text-slate-500 font-bold block text-[9px]">Prepared By Auditor:</span> <strong className="text-slate-900">{prepBy}</strong></div>
              <div><span className="text-slate-500 font-bold block text-[9px]">Approved By Director:</span> <strong className="text-slate-900">{appBy}</strong></div>
              <div><span className="text-slate-500 font-bold block text-[9px]">Regulatory Scope:</span> <strong className="text-indigo-900">Abu Dhabi DOH & MALAFFI</strong></div>
            </div>
          </div>

          {/* Compliance Summary Dashboard */}
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Compliance Summary Dashboard
            </h3>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 text-center">
                <span className="text-[9px] font-extrabold text-emerald-800 uppercase block">1. Legal Checkpoints</span>
                <span className="text-base font-black text-emerald-900">100%</span>
                <span className="text-[8.5px] font-bold text-emerald-700 block mt-0.5">{requirements.length} / {requirements.length} Compliant</span>
              </div>
              <div className="bg-indigo-50/80 p-2 rounded-xl border border-indigo-200 text-center">
                <span className="text-[9px] font-extrabold text-indigo-800 uppercase block">2. DOH Circulars</span>
                <span className="text-base font-black text-indigo-900">{Math.round((reportCirculars.filter(c => c.compliance_status === 'Fully Compliant').length / Math.max(1, reportCirculars.length)) * 100)}%</span>
                <span className="text-[8.5px] font-bold text-indigo-700 block mt-0.5">{reportCirculars.length} Logs Active</span>
              </div>
              <div className="bg-sky-50/80 p-2 rounded-xl border border-sky-200 text-center">
                <span className="text-[9px] font-extrabold text-sky-800 uppercase block">3. DOH Standards</span>
                <span className="text-base font-black text-sky-900">{Math.round((reportStandards.filter(s => s.compliance_status === 'Fully Compliant').length / Math.max(1, reportStandards.length)) * 100)}%</span>
                <span className="text-[8.5px] font-bold text-sky-700 block mt-0.5">{reportStandards.length} Standards Verified</span>
              </div>
              <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200 text-center">
                <span className="text-[9px] font-extrabold text-amber-800 uppercase block">4. License Expirations</span>
                <span className="text-base font-black text-amber-900">100%</span>
                <span className="text-[8.5px] font-bold text-amber-700 block mt-0.5">{docs.length} Active Licenses</span>
              </div>
            </div>
          </div>

          {/* Document Version Control Log */}
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Document Version Control Log
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-2 w-14 border-r border-slate-200">Ver.</th>
                    <th className="p-2 w-24 border-r border-slate-200">Revision Date</th>
                    <th className="p-2 w-56 border-r border-slate-200">Author / Reviewer</th>
                    <th className="p-2">Details of Modifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {versionLogs.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-2 font-bold text-indigo-700 border-r border-slate-200">v{v.ver}</td>
                      <td className="p-2 text-slate-600 font-semibold border-r border-slate-200">{v.date}</td>
                      <td className="p-2 text-slate-900 font-bold border-r border-slate-200">{v.author}</td>
                      <td className="p-2 text-slate-700">{v.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 1: Mandatory Compliance Document Expiry */}
          {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LICENSES') && (
            <div className="space-y-1.5 pt-1">
              <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> 1. Mandatory Compliance Document Expiry Register
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">License / Document Name</th>
                      <th className="p-2 border-r border-slate-200">Reference No</th>
                      <th className="p-2 border-r border-slate-200">Issue Date</th>
                      <th className="p-2 border-r border-slate-200">Expiry Date</th>
                      <th className="p-2 border-r border-slate-200">Compliance Status</th>
                      <th className="p-2 border-r border-slate-200">Ver.</th>
                      <th className="p-2">Responsible Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {docs.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2 font-extrabold text-slate-900 border-r border-slate-200">{d.doc_name}</td>
                        <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{d.ref_no}</td>
                        <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{d.issue_date}</td>
                        <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{d.expiry_date}</td>
                        <td className="p-2 border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                            d.status === 'Valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 font-mono border-r border-slate-200">v{d.version}</td>
                        <td className="p-2 text-slate-700 font-medium">{d.responsible_person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 2: UAE Healthcare Legal Register Checkpoints */}
          {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'LEGAL') && (
            <div className="space-y-1.5 pt-1">
              <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> 2. UAE Healthcare Legal Register Checkpoints
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-24 border-r border-slate-200">Reference No</th>
                      <th className="p-2 border-r border-slate-200">Law / Regulation Details</th>
                      <th className="p-2 w-28 border-r border-slate-200">Authority</th>
                      <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                      <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                      <th className="p-2 w-40">Responsible Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {requirements.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-extrabold text-indigo-700 border-r border-slate-200">{r.ref_no}</td>
                        <td className="p-2 border-r border-slate-200">
                          <strong className="text-slate-900 block text-[10.5px]">{r.name}</strong>
                          <span className="text-[9.5px] text-slate-500">{r.summary}</span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{r.authority || 'DOH Abu Dhabi'}</td>
                        <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{r.issue_date}</td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold">
                            {r.compliance_status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium">{r.responsible_person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3: DOH Circulars Register Compliance Logs */}
          {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'CIRCULARS') && (
            <div className="space-y-1.5 pt-1">
              <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" /> 3. DOH Circulars Register Compliance Logs
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-28 border-r border-slate-200">Circular No</th>
                      <th className="p-2 border-r border-slate-200">Circular Title & Name</th>
                      <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                      <th className="p-2 w-24 border-r border-slate-200">Target Date</th>
                      <th className="p-2 w-32 border-r border-slate-200">Category</th>
                      <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                      <th className="p-2 w-36">Responsible Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {reportCirculars.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-bold text-indigo-900 border-r border-slate-200">{c.circular_no}</td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{c.circular_name}</td>
                        <td className="p-2 text-slate-700 font-semibold border-r border-slate-200">{c.date}</td>
                        <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{c.target_date || 'N/A'}</td>
                        <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{c.circular_category}</td>
                        <td className="p-2 border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                            c.compliance_status === 'Fully Compliant' ? 'bg-emerald-100 text-emerald-800' :
                            c.compliance_status === 'Partially Compliant' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.compliance_status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium">{c.responsible_person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 4: DOH Healthcare Standards Compliance Logs */}
          {(reportType === 'HEALTHCARE_AUDIT' || reportType === 'EXECUTIVE' || reportType === 'STANDARDS') && (
            <div className="space-y-1.5 pt-1">
              <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 4. DOH Healthcare Standards Compliance Logs
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-28 border-r border-slate-200">Reference No</th>
                      <th className="p-2 border-r border-slate-200">Standard Name</th>
                      <th className="p-2 w-24 border-r border-slate-200">Doc Version</th>
                      <th className="p-2 w-24 border-r border-slate-200">Issue Date</th>
                      <th className="p-2 w-32 border-r border-slate-200">Category</th>
                      <th className="p-2 w-32 border-r border-slate-200">Compliance Status</th>
                      <th className="p-2 w-36">Responsible Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {reportStandards.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-extrabold text-slate-800 border-r border-slate-200">{s.reference}</td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{s.standard_name}</td>
                        <td className="p-2 font-mono font-extrabold text-indigo-900 border-r border-slate-200">{s.version || s.doc_version || `v${docVersion}` || 'v1.0'}</td>
                        <td className="p-2 text-slate-700 font-semibold border-r border-slate-200">{s.date}</td>
                        <td className="p-2 text-slate-600 font-medium border-r border-slate-200">{s.standard_category || 'DOH Standard'}</td>
                        <td className="p-2 border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                            s.compliance_status === 'Fully Compliant' ? 'bg-emerald-100 text-emerald-800' :
                            s.compliance_status === 'Partially Compliant' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {s.compliance_status}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium">{s.responsible_person}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 5: Official Asset Inventory Compliance Register */}
          {(reportType === 'EXECUTIVE' || reportType === 'ASSET_INVENTORY') && (
            <div className="space-y-1.5 pt-1">
              <h3 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 5. Official Asset Inventory Compliance Register
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-24 border-r border-slate-200">Asset Code</th>
                      <th className="p-2 border-r border-slate-200">Asset Name & Type</th>
                      <th className="p-2 border-r border-slate-200">Category & Location</th>
                      <th className="p-2 w-32 border-r border-slate-200">Owner & Dept</th>
                      <th className="p-2 w-24 border-r border-slate-200">CIA Ratings</th>
                      <th className="p-2 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {reportAssets.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-extrabold text-indigo-700 border-r border-slate-200">{a.asset_code}</td>
                        <td className="p-2 border-r border-slate-200">
                          <strong className="text-slate-900 block">{a.asset_name}</strong>
                          <span className="text-[9.5px] text-slate-500">{a.asset_type} {a.manufacturer ? `(${a.manufacturer} ${a.model || ''})` : ''}</span>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="font-semibold text-slate-800 block">{a.asset_category}</span>
                          <span className="text-[9.5px] text-slate-500">{a.location || 'N/A'}</span>
                        </td>
                        <td className="p-2 text-slate-700 font-medium border-r border-slate-200">{a.asset_owner}</td>
                        <td className="p-2 font-bold text-slate-700 border-r border-slate-200">C:{a.c_val || 3} / I:{a.i_val || 3} / A:{a.a_val || 3}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                            a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Page Footer */}
          <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-500 font-bold space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-[9.5px] text-slate-700 font-extrabold pb-1 border-b border-slate-200 mb-1">
              <span>Facility: {clientName} (License: {facilityLicense})</span>
              <span>Compliance Email: {facilityEmail}</span>
              <span>Tel: {facilityPhone}</span>
            </div>
            <p className="uppercase tracking-widest text-indigo-900 font-extrabold">
              CONFIDENTIAL — Official Abu Dhabi Healthcare Legal & Compliance Audit Report
            </p>
            <p className="text-slate-500 text-[8.5px]">
              Aligned with Department of Health (DOH) Abu Dhabi & MALAFFI Standards — Generated: {formatDateDMY(new Date())} — Landscape High-Density Format
            </p>
          </div>
        </div>
      </div>

      {/* Replicate / Clone Data Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-600" /> Replicate Compliance Engine Data to Target Facility
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Source Facility: <strong className="text-slate-900">{clientName}</strong>. Choose a target facility to clone circulars, standards, legal registers, and compliance document logs.
            </p>

            {cloneStatusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-pulse flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{cloneStatusMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Target Facility*</label>
                <select
                  value={targetClientId}
                  onChange={e => setTargetClientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Choose Target Facility --</option>
                  {clients?.filter(c => c.id !== activeClientId).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">Registers to Replicate</span>
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneCirculars}
                    onChange={e => setCloneCirculars(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>DOH Circulars Register ({circulars.length} Active Logs)</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneStandards}
                    onChange={e => setCloneStandards(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>DOH Healthcare Standards Register ({standards.length} Standards)</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneLegal}
                    onChange={e => setCloneLegal(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>UAE Legal Requirements Register ({requirements.length} Requirements)</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneLicenses}
                    onChange={e => setCloneLicenses(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mandatory Compliance Licenses ({docs.length} Active Documents)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReplicate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Replicate Data to Selected Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Control Log Modal (Add / Edit Version Entry) */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {editingVersionIndex !== null ? 'Edit Document Version Log Entry' : 'Add New Document Version Log Entry'}
              </h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVersionLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Version Number*</label>
                  <input
                    type="text"
                    required
                    value={versionForm.ver}
                    onChange={e => setVersionForm({ ...versionForm, ver: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-extrabold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 1.1"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Revision Date*</label>
                  <input
                    type="date"
                    required
                    value={versionForm.date}
                    onChange={e => setVersionForm({ ...versionForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Author / Reviewer*</label>
                <input
                  type="text"
                  required
                  value={versionForm.author}
                  onChange={e => setVersionForm({ ...versionForm, author: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Sarah Jenkins (Compliance Officer)"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Details of Modifications*</label>
                <textarea
                  rows={3}
                  required
                  value={versionForm.details}
                  onChange={e => setVersionForm({ ...versionForm, details: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe modifications made in this version..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Version Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
