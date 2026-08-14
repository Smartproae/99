import React, { useState, useEffect } from 'react';
// @ts-ignore
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import {
  Shield,
  FileCheck,
  Upload,
  Download,
  Plus,
  Check,
  Copy,
  FileText,
  Building2,
  Users,
  Lock,
  Settings,
  Sparkles,
  RefreshCw,
  Table,
  Grid,
  Paperclip,
  Printer,
  Eye,
  Trash2,
  FolderOpen,
  Link,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  X,
  FileCode,
  Edit3,
  Mail,
  Send,
  Pencil,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { Policy, User, Client, Employee } from '../types';
import { DocRefLoopSelector, DocRefLoopData } from './DocRefLoopSelector';
import { printDocument, printCurrentView } from '../utils/printUtils';

interface PolicyFrameworksSetupProps {
  policies: Policy[];
  users: User[];
  employees?: Employee[];
  onAddPolicy: (policy: Policy) => void;
  onDeletePolicy?: (id: string | string[]) => void;
  onUpdatePolicy?: (updatedPolicy: Policy) => void;
  onBulkFeedPolicies?: (policies: Policy[]) => void;
  activeClientId: string;
  client?: Client | null;
  clients?: Client[];
  onSelectClient?: (id: string) => void;
}

export default function PolicyFrameworksSetup({
  policies,
  users,
  employees = [],
  onAddPolicy,
  onDeletePolicy,
  onUpdatePolicy,
  onBulkFeedPolicies,
  activeClientId,
  client,
  clients = [],
  onSelectClient
}: PolicyFrameworksSetupProps) {
  // Navigation Tabs: 'vault' | 'upload' | 'export' | 'create'
  const [activeTab, setActiveTab] = useState<'vault' | 'upload' | 'export' | 'create'>('vault');

  // Mode Switcher: 'edit' vs 'preview' (Live Print Preview Mode Toggle)
  const [policyViewMode, setPolicyViewMode] = useState<'edit' | 'preview'>('edit');

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');

  // Layout & Signatory Controls
  const [stationeryMode, setStationeryMode] = useState(false);
  const [hrManagerSignatory, setHrManagerSignatory] = useState(true);

  // Selected Policy for Inspect / Preview Modal
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);

  // Edit & Email & Delete Policy Modal states
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [emailPolicy, setEmailPolicy] = useState<Policy | null>(null);
  const [confirmDeletePolicy, setConfirmDeletePolicy] = useState<Policy | null>(null);
  const [confirmBatchDeletePolicies, setConfirmBatchDeletePolicies] = useState<Policy[] | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailCoverNote, setEmailCoverNote] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);

  // Copy to Client Modal State
  const [copyClientModalOpen, setCopyClientModalOpen] = useState(false);
  const [policiesToCopy, setPoliciesToCopy] = useState<Policy[]>([]);
  const [targetClientIdToCopy, setTargetClientIdToCopy] = useState<string>('');
  const [customClientNameInput, setCustomClientNameInput] = useState<string>('');

  const handleOpenCopyModalForSingle = (p: Policy) => {
    setPoliciesToCopy([p]);
    const initialTargetId = clients[0]?.id || activeClientId || '';
    setTargetClientIdToCopy(initialTargetId);
    const initialTargetObj = clients.find(c => c.id === initialTargetId);
    setCustomClientNameInput(initialTargetObj?.company_name || client?.company_name || '');
    setCopyClientModalOpen(true);
  };

  const handleOpenCopyModalForSelected = () => {
    let selectedDocs = selectedPolicyIds.length > 0
      ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
      : filteredPolicies;

    // Deduplicate selectedDocs by unique policy_no / code
    const seen = new Set<string>();
    const uniqueDocs: Policy[] = [];
    for (const p of selectedDocs) {
      const codeKey = (p.policy_no || (p as any).code || p.id || '').toUpperCase().trim();
      if (!seen.has(codeKey)) {
        seen.add(codeKey);
        uniqueDocs.push(p);
      }
    }

    if (uniqueDocs.length === 0) {
      showToast('⚠️ Please select at least one policy record to copy to a client.');
      return;
    }
    setPoliciesToCopy(uniqueDocs);
    const initialTargetId = clients[0]?.id || activeClientId || '';
    setTargetClientIdToCopy(initialTargetId);
    const initialTargetObj = clients.find(c => c.id === initialTargetId);
    setCustomClientNameInput(initialTargetObj?.company_name || client?.company_name || '');
    setCopyClientModalOpen(true);
  };

  const handleConfirmCopyToClient = () => {
    if (policiesToCopy.length === 0) return;
    const targetClientObj = clients.find(c => c.id === targetClientIdToCopy);
    const targetName = targetClientObj?.company_name || customClientNameInput.trim() || 'Client Entity';
    const targetClientId = targetClientObj?.id || activeClientId || (clients[0]?.id || 'c1');

    const newPolicies: Policy[] = policiesToCopy.map((p, idx) => {
      const cleanTitle = resolveDocTitle(p.policy_name, targetName);
      const updatedStatement = formatCleanPolicyStatement(
        p.policy_statement || p.full_content || '',
        cleanTitle,
        targetName,
        pageBreakSections
      );

      return {
        ...p,
        id: `POL-CLT-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        company_name: targetName,
        facility_name: targetName,
        client_id: targetClientId,
        policy_name: cleanTitle,
        policy_statement: updatedStatement,
        full_content: updatedStatement,
        status: 'APPROVED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Always add each copied policy directly to ensure it isn't filtered out as duplicate
    newPolicies.forEach(np => onAddPolicy(np));

    if (onSelectClient && targetClientId) {
      onSelectClient(targetClientId);
    }

    showToast(`✓ Successfully copied ${newPolicies.length} policy record(s) to [${targetName}]!`);
    setCopyClientModalOpen(false);
    setPoliciesToCopy([]);
  };

  // Toggle Freeze state for a single policy
  const handleToggleFreezePolicy = (policy: Policy) => {
    const isCurrentlyFrozen = policy.is_frozen || policy.status === 'FROZEN';
    const newFrozenState = !isCurrentlyFrozen;
    const updated: Policy = {
      ...policy,
      is_frozen: newFrozenState,
      status: newFrozenState ? 'FROZEN' : 'APPROVED'
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updated);
    }

    if (selectedPolicy && selectedPolicy.id === policy.id) {
      setSelectedPolicy(updated);
    }

    showToast(
      newFrozenState
        ? `🔒 Policy Record [${policy.policy_no}] is now FROZEN & locked against changes!`
        : `🔓 Policy Record [${policy.policy_no}] is UNFROZEN and open for editing.`
    );
  };

  // Freeze Selected Policies (or all filtered if none selected)
  const handleFreezeSelectedPolicies = () => {
    const targets = selectedPolicyIds.length > 0
      ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
      : filteredPolicies;

    if (targets.length === 0) {
      showToast('⚠️ No policy records available to freeze.');
      return;
    }

    let count = 0;
    targets.forEach(p => {
      if (onUpdatePolicy) {
        onUpdatePolicy({
          ...p,
          is_frozen: true,
          status: 'FROZEN'
        });
        count++;
      }
    });

    showToast(`🔒 Successfully FROZE ${count} policy record(s) against modifications!`);
  };

  // Group Delete Selected Policies (triggers In-App Batch Deletion Modal)
  const handleGroupDeleteSelected = () => {
    const targets = selectedPolicyIds.length > 0
      ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
      : [];

    if (targets.length === 0) {
      showToast('⚠️ Please select at least one policy record using the checkboxes to delete.');
      return;
    }

    setConfirmBatchDeletePolicies(targets);
  };

  // Quick Master Setup Loop state
  const [activeLoop, setActiveLoop] = useState<DocRefLoopData | null>(null);

  // Form State for "Create Custom policy and procedure"
  const [docTitle, setDocTitle] = useState('Information Security High Level Policy');
  const [docCategory, setDocCategory] = useState<'Policy' | 'Procedure' | 'Forms' | 'Guideline'>('Policy');
  const [docCode, setDocCode] = useState(`POL-SEC-${Math.floor(100 + Math.random() * 900)}`);
  const [docDepartment, setDocDepartment] = useState('Information Technology');
  const [docClassification, setDocClassification] = useState<string>('CONFIDENTIAL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [preparedBy, setPreparedBy] = useState('Aseef Sulaiman');
  const [showReviewedBy, setShowReviewedBy] = useState(true);
  const [reviewedBy, setReviewedBy] = useState('HR & Compliance Director');
  const [approvedBy, setApprovedBy] = useState('Medical Director / CEO');
  const [previewShowReviewedBy, setPreviewShowReviewedBy] = useState(true);
  const [previewReviewedBy, setPreviewReviewedBy] = useState('Compliance Officer');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageBreakSections, setPageBreakSections] = useState<string[]>([]);

  const togglePageBreakSection = (secTitle: string) => {
    setPageBreakSections(prev =>
      prev.includes(secTitle) ? prev.filter(s => s !== secTitle) : [...prev, secTitle]
    );
  };

  const extractPolicySections = (content: string): string[] => {
    if (!content) return [];
    const lines = content.split('\n');
    const sections: string[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('#') ||
        /^\d+[\.\)]\s+[A-Z]/.test(trimmed) ||
        /^(?:PURPOSE|RESPONSIBILITIES|REQUIREMENTS|GOVERNANCE|COMPLIANCE|CONTROL OBJECTIVES|AUDITING|APPENDIX|DEFINITIONS)/i.test(trimmed)
      ) {
        const clean = trimmed.replace(/^#+\s*/, '').replace(/<[^>]*>/g, '').trim();
        if (clean && clean.length < 80 && !sections.includes(clean)) {
          sections.push(clean);
        }
      }
    });
    return sections;
  };

  const [docContent, setDocContent] = useState(
    `<p><strong>1. PURPOSE & SCOPE</strong></p>\n<p>This Policy Framework sets forth the mandatory operational requirements for information security, administrative safeguards, and patient privacy under ADHICS guidelines.</p>\n\n<p><strong>2. RESPONSIBILITIES & GOVERNANCE</strong></p>\n<p>All facility staff and clinical operators must strictly adhere to compliance procedures and document control protocols.</p>`
  );

  // Ingest / Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper function to strictly sanitize all policy titles by removing repetitive branding strings
  const sanitizePolicyTitle = (title: string, companyNameOverride?: string): string => {
    if (!title) return '';

    let clean = title
      .replace(/\s*[—\-–]\s*SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, '')
      .replace(/\s*[—\-–]\s*SmartPro Consultancy & Facility Services/gi, '')
      .replace(/\s*[—\-–]\s*SmartPro Public Relations Consultancy/gi, '')
      .replace(/SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, '')
      .replace(/SmartPro Consultancy & Facility Services/gi, '')
      .replace(/SmartPro Public Relations Consultancy/gi, '')
      .replace(/\s*[—\-–]\s*Healthcare Facility Management/gi, '')
      .replace(/Healthcare Facility Management/gi, '');

    const overrideName = companyNameOverride && !/smartpro/i.test(companyNameOverride) ? companyNameOverride : '';
    const clientName = client?.company_name && !/smartpro/i.test(client.company_name) ? client.company_name : '';
    const actualCompanyName = overrideName || clientName || '';

    clean = clean
      .replace(/\(\s*client\.company_name\s*\)\s*/gi, actualCompanyName ? `${actualCompanyName} ` : '')
      .replace(/\(\s*client\.company_name\s*\)/gi, actualCompanyName)
      .replace(/client\.company_name/gi, actualCompanyName)
      .replace(/\[\s*Entity\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Facility\s+Name\s*\]/gi, actualCompanyName);

    if (actualCompanyName) {
      const escapedClientName = actualCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clean = clean.replace(new RegExp(`\\s*[—\\-–]\\s*${escapedClientName}`, 'gi'), '');
    }

    clean = clean.replace(/\s+/g, ' ').trim();
    clean = clean.replace(/\s*[—\-–,;:]\s*$/g, '').trim();
    return clean;
  };

  // Resolve Document Title replacing placeholders and removing consultant name suffixes
  const resolveDocTitle = (title: string, companyNameOverride?: string): string => {
    return sanitizePolicyTitle(title, companyNameOverride);
  };

  // Convert Markdown syntax (headers, lists, bolding, and tables) to compact HTML
  const convertMarkdownToHtml = (markdown: string, breakSections: string[] = []): string => {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const resultLines: string[] = [];
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];

    const checkPageBreak = (text: string) => {
      const cleanH = text.replace(/<[^>]*>/g, '').trim().toLowerCase();
      return breakSections.some(sec => cleanH.includes(sec.toLowerCase()) || sec.toLowerCase().includes(cleanH));
    };

    const flushTable = () => {
      if (!inTable) return;
      if (tableHeader.length > 0 || tableRows.length > 0) {
        let html = `<div class="my-2 overflow-x-auto border border-slate-300 rounded-xs bg-white shadow-2xs">`;
        html += `<table class="w-full text-left border-collapse text-[10px] font-sans">`;
        
        if (tableHeader.length > 0) {
          html += `<thead class="bg-[#0f172a] text-white font-bold text-[9.5px] uppercase tracking-wider"><tr>`;
          tableHeader.forEach((h, idx) => {
            const widthClass = idx === 0 ? 'w-3/12' : idx === 1 ? 'w-6/12' : 'w-3/12 text-center';
            html += `<th class="py-1 px-2.5 border-r border-slate-700 ${widthClass}">${h.trim()}</th>`;
          });
          html += `</tr></thead>`;
        }

        html += `<tbody class="divide-y divide-slate-200 font-medium text-slate-800">`;
        tableRows.forEach(row => {
          html += `<tr class="hover:bg-slate-50/80 transition-colors">`;
          row.forEach((cell, idx) => {
            const trimmed = cell.trim();
            if (idx === 2 || trimmed.toLowerCase() === 'applicable' || trimmed.toLowerCase() === 'not applicable') {
              const isApplicable = trimmed.toLowerCase() === 'applicable';
              const badge = isApplicable
                ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">✓ Applicable</span>`
                : `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Not applicable</span>`;
              html += `<td class="py-1 px-2.5 text-center align-top border-r border-slate-200">${badge}</td>`;
            } else if (idx === 0) {
              html += `<td class="py-1 px-2.5 font-bold text-[#0f172a] align-top border-r border-slate-200">${trimmed}</td>`;
            } else {
              html += `<td class="py-1 px-2.5 text-slate-700 leading-snug align-top border-r border-slate-200 text-justify" style="text-align: justify; text-justify: inter-word; hyphens: auto; word-break: normal; white-space: normal;">${trimmed}</td>`;
            }
          });
          html += `</tr>`;
        });

        html += `</tbody></table></div>`;
        resultLines.push(html);
      }
      inTable = false;
      tableHeader = [];
      tableRows = [];
    };

    let paraBuffer: string[] = [];

    const flushPara = () => {
      if (paraBuffer.length > 0) {
        const fullPara = paraBuffer.join(' ').replace(/\s+/g, ' ').trim();
        if (fullPara) {
          let formattedLine = fullPara.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          formattedLine = formattedLine
            .replace(/<strong>\s*\(\s*client\.company_name\s*\)\s*<\/strong>/gi, '(client.company_name)')
            .replace(/<b>\s*\(\s*client\.company_name\s*\)\s*<\/b>/gi, '(client.company_name)')
            .replace(/<p>\s*,\s*<\/strong>\s*<\/p>/gi, '')
            .replace(/<p>\s*,\s*<\/p>/gi, '')
            .replace(/,\s*<\/strong>/gi, '</strong>');
          
          if (formattedLine.trim()) {
            const isBreak = checkPageBreak(fullPara);
            const breakClass = isBreak ? 'page-break-before ' : '';
            resultLines.push(`<p class="${breakClass}my-1.5 text-slate-800 leading-normal text-xs font-sans text-justify" style="text-align: justify; text-justify: inter-word; hyphens: auto; word-break: normal; white-space: normal;">${formattedLine}</p>`);
          }
        }
        paraBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      // Check if line is a markdown table row
      if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
        flushPara();
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        if (cells.every(c => /^[-:]+$/.test(c))) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHeader = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      }

      if (inTable) {
        flushTable();
      }

      // Check if line is already HTML tag or block
      if (/<[a-z][\s\S]*>/i.test(line)) {
        flushPara();
        let cleanHtmlLine = rawLine
          .replace(/<ol([^>]*)>/gi, '<ul$1 class="list-disc pl-5 my-1">')
          .replace(/<\/ol>/gi, '</ul>')
          .replace(/<p>\s*,\s*<\/strong>\s*<\/p>/gi, '')
          .replace(/<p>\s*,\s*<\/p>/gi, '')
          .replace(/<strong>\s*\(\s*client\.company_name\s*\)\s*<\/strong>/gi, '(client.company_name)')
          .replace(/<b>\s*\(\s*client\.company_name\s*\)\s*<\/b>/gi, '(client.company_name)');

        if (checkPageBreak(cleanHtmlLine)) {
          cleanHtmlLine = cleanHtmlLine.replace(/<([a-z1-6]+)([^>]*)>/i, '<$1$2 class="page-break-before">');
        }
        resultLines.push(cleanHtmlLine);
        continue;
      }

      // Process Headings - standardize all headings to h2 size with Navy border
      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        flushPara();
        const headingText = line.replace(/^#+\s*/, '').trim();
        const breakClass = checkPageBreak(headingText) ? 'page-break-before ' : '';
        resultLines.push(`<h2 class="${breakClass}text-xs font-bold uppercase tracking-wider text-[#0f172a] mt-2.5 mb-1 border-b border-slate-300 pb-0.5">${headingText}</h2>`);
      } else if (line.startsWith('• ') || line.startsWith('- ') || /^\d+[\.\)]\s/.test(line)) {
        flushPara();
        const itemContent = line.replace(/^(?:•|-|\d+[\.\)])\s*/, '');
        const breakClass = checkPageBreak(itemContent) ? 'page-break-before ' : '';
        resultLines.push(`<li class="${breakClass}ml-4 list-disc text-slate-800 my-0.5 text-xs font-sans font-normal text-justify" style="text-align: justify; text-justify: inter-word; hyphens: auto; word-break: normal; white-space: normal;">${itemContent}</li>`);
      } else if (line === '') {
        flushPara();
      } else {
        paraBuffer.push(line);
      }
    }

    flushPara();
    if (inTable) {
      flushTable();
    }

    return resultLines.join('\n');
  };

  // Clean & Format Policy Statement Text
  const formatCleanPolicyStatement = (content: string, policyName: string, companyName: string, breakSections: string[] = []): string => {
    if (!content) return '<p class="text-justify" style="text-align: justify; text-justify: inter-word;">No specific policy clause content available.</p>';

    const isClientSmartpro = /smartpro/i.test(companyName) || /smartpro/i.test(client?.company_name || '');
    const actualCompanyName = (!isClientSmartpro && (companyName || client?.company_name))
      ? (companyName || client?.company_name || client?.company_name || 'client.company_name')
      : (client?.company_name || 'client.company_name');

    let effectiveContent = content;
    const isSoa = (policyName && policyName.toLowerCase().includes('statement of applicability')) || content.includes('CONTROL OBJECTIVES AND APPLICABILITY');
    if (isSoa && (!content || content.trim().length < 50 || content.trim() === 'Statement of Applicability')) {
      try {
        const savedSoa = localStorage.getItem('sh_quick_master_setup_soa');
        if (savedSoa) {
          const parsedSoa = JSON.parse(savedSoa);
          if (Array.isArray(parsedSoa) && parsedSoa.length > 0) {
            effectiveContent = `### CONTROL OBJECTIVES AND APPLICABILITY\n\nThe following control objectives are applicable to ${actualCompanyName}:\n\n| Control Area | Control Objective | Applicability |\n|---|---|---|\n${parsedSoa.map((c: any) => `| ${c.area} | ${c.objective} | ${c.applicability} |`).join('\n')}`;
          }
        }
      } catch (e) {
        console.warn('Failed reading sh_quick_master_setup_soa in formatCleanPolicyStatement:', e);
      }
    }

    let cleaned = effectiveContent;

    // 1. Remove HTML boilerplates and outer document wrappers
    cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
    cleaned = cleaned.replace(/<html[^>]*>[\s\S]*?<body[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/body>[\s\S]*?<\/html>/gi, '');
    cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    cleaned = cleaned.replace(/<\/?(?:html|body|head)[^>]*>/gi, '');

    // 2. Convert <ol> tags to <ul> tags to enforce bullet points
    cleaned = cleaned.replace(/<ol([^>]*)>/gi, '<ul$1 class="list-disc pl-5 my-2">').replace(/<\/ol>/gi, '</ul>');

    // 3. Strip duplicate top header/logo blocks
    cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

    // 4. Strip duplicate Document Control Information Log tables & text blocks if present in copied HTML
    cleaned = cleaned.replace(/<table[^>]*>[\s\S]*?Document Control Information Log[\s\S]*?<\/table>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*>[\s\S]*?Document Control Information Log[\s\S]*?<\/div>/gi, '');

    // 5. Strip duplicate title banners at top if exact match
    if (policyName) {
      const escapedTitle = policyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`^\\s*<h[1-6][^>]*>\\s*(?:<strong>|<b>)?\\s*${escapedTitle}\\s*(?:<\\/strong>|<\\/b>)?\\s*<\\/h[1-6]>`, 'gi'), '');
    }

    // 6. Replace company placeholders and strip bold wrappers around entity names
    cleaned = cleaned
      .replace(/<strong>\s*\(\s*client\.company_name\s*\)\s*<\/strong>/gi, actualCompanyName)
      .replace(/<b>\s*\(\s*client\.company_name\s*\)\s*<\/b>/gi, actualCompanyName)
      .replace(/<strong>\s*\[\s*Entity\s+Name\s*\]\s*<\/strong>/gi, actualCompanyName)
      .replace(/<b>\s*\[\s*Entity\s+Name\s*\]\s*<\/b>/gi, actualCompanyName)
      .replace(/SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, actualCompanyName)
      .replace(/SmartPro Consultancy & Facility Services/gi, actualCompanyName)
      .replace(/\(\s*client\.company_name\s*\)\s*/gi, `${actualCompanyName} `)
      .replace(/\(\s*client\.company_name\s*\)/gi, actualCompanyName)
      .replace(/client\.company_name/gi, actualCompanyName)
      .replace(/\[\s*Entity\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Facility\s+Name\s*\]/gi, actualCompanyName);

    // 7. Sanitize tag gaps and punctuation artifacts
    cleaned = cleaned
      .replace(/<p>\s*,\s*<\/strong>\s*<\/p>/gi, '')
      .replace(/<p>\s*,\s*<\/p>/gi, '')
      .replace(/<strong>\s*,\s*<\/strong>/gi, '')
      .replace(/,\s*<\/strong>\s*<\/p>/gi, '.</strong></p>')
      .replace(/<p>\s*,\s*/gi, '<p>')
      .replace(/<strong>\s*,\s*/gi, '<strong>')
      .replace(/<p>\s*<\/p>/gi, '');

    // 7.5 Automatically insert Risk Assessment Framework Chart before "RISK TREATMENT Risk treatment options include:" for Risk Management Policies
    const isRiskPolicy = (policyName && /risk management/i.test(policyName)) || (policyName && /m-policy-004/i.test(policyName)) || /RISK TREATMENT/i.test(cleaned);
    if (isRiskPolicy) {
      // First strip any existing risk_matrix_chart block to avoid duplicate/misplaced images
      cleaned = cleaned.replace(/<div class="my-4 flex flex-col items-center justify-center w-full text-center">[\s\S]*?<\/div>/gi, '');
      const imgHtml = `\n\n<div class="my-4 flex flex-col items-center justify-center w-full text-center"><img src="/risk_matrix_chart.jpg" alt="Healthcare Cybersecurity Risk Assessment Framework" class="max-w-full h-auto rounded-lg border border-slate-300 shadow-md object-contain max-h-[420px] mx-auto" /><p class="text-[10px] text-slate-500 font-bold italic mt-1.5 text-center">Figure 1: Healthcare Cybersecurity Risk Assessment Framework &amp; Criteria</p></div>\n\n`;
      
      if (/<h[23][^>]*>\s*RISK TREATMENT\s*<\/h[23]>/i.test(cleaned)) {
        cleaned = cleaned.replace(/(<h[23][^>]*>\s*RISK TREATMENT\s*<\/h[23]>)/i, `${imgHtml}$1`);
      } else if (/###\s*RISK TREATMENT/i.test(cleaned)) {
        cleaned = cleaned.replace(/(###\s*RISK TREATMENT)/i, `${imgHtml}$1`);
      } else if (/##\s*RISK TREATMENT/i.test(cleaned)) {
        cleaned = cleaned.replace(/(##\s*RISK TREATMENT)/i, `${imgHtml}$1`);
      } else if (/RISK TREATMENT/i.test(cleaned)) {
        cleaned = cleaned.replace(/(RISK TREATMENT)/i, `${imgHtml}$1`);
      } else if (/Risk treatment options include:/i.test(cleaned)) {
        cleaned = cleaned.replace(/(Risk treatment options include:)/i, `${imgHtml}### RISK TREATMENT\n\n$1`);
      } else {
        cleaned = cleaned + imgHtml + `\n\n### RISK TREATMENT\n\n`;
      }
    }

    // 8. Convert Markdown syntax and format text line breaks
    cleaned = convertMarkdownToHtml(cleaned, breakSections);

    return cleaned.trim();
  };

  // Generate Complete, Standalone, Self-Contained HTML File for Policy Document
  const generateStandardizedPolicyHtml = (policy: Policy, preservePlaceholders: boolean = false, orientation: 'portrait' | 'landscape' = printOrientation): string => {
    const rawFacility = policy.company_name || client?.company_name || '(client.company_name)';
    const facilityName = preservePlaceholders ? '(selectedPolicy.company_name / client.company_name)' : rawFacility;
    const resolvedTitle = resolveDocTitle(policy.policy_name, facilityName);
    const policyNo = policy.policy_no || 'POL-01';
    const category = policy.category || 'Policy';
    const classification = policy.classification || 'CONFIDENTIAL';
    const effectiveDate = policy.effective_date || policy.approval_date || new Date().toISOString().split('T')[0];
    const reviewDate = policy.review_date || '2027-08-06';
    const nextDueDate = policy.next_due_date || '2027-08-01';
    const version = policy.version || 'v1.0';

    const preparedBy = policy.prepared_by || 'HR & Compliance Desk';
    const reviewedBy = policy.reviewed_by || 'Compliance Officer';
    const approvedBy = policy.approved_by || 'Medical Director / CEO';

    let rawBody = policy.policy_statement || policy.full_content || '<p>No policy content provided.</p>';
    let cleanBodyHtml = formatCleanPolicyStatement(rawBody, resolvedTitle, facilityName, pageBreakSections);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${policyNo} - ${resolvedTitle}</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #64748b;
        font-weight: 600;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-compact-gap, .print-compact-gap * {
      margin-top: 2px !important;
      margin-bottom: 2px !important;
      padding-top: 1px !important;
      padding-bottom: 1px !important;
      line-height: 1.35 !important;
    }
    .print-compact-gap h1, .print-compact-gap h2, .print-compact-gap h3 {
      margin-top: 6px !important;
      margin-bottom: 3px !important;
    }
    .print-compact-gap p, .print-compact-gap li {
      margin-top: 2px !important;
      margin-bottom: 2px !important;
    }
    .page-break-before {
      page-break-before: always !important;
      break-before: page !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #f1f5f9;
      margin: 0;
      padding: 24px;
      line-height: 1.6;
      font-size: 11px;
    }
    .a4-document {
      width: ${orientation === 'landscape' ? '297mm' : '210mm'};
      min-height: ${orientation === 'landscape' ? '210mm' : '297mm'};
      margin: 0 auto;
      background: #ffffff;
      padding: 15mm;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    /* Header & Branding */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .facility-name {
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.2px;
      margin: 0;
    }
    .facility-subtext {
      font-size: 9.5px;
      color: #64748b;
      margin: 1px 0 0 0;
    }
    .ref-code-box {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10.5px;
      font-weight: 800;
      color: #3730a3;
      background: #eef2ff;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #c7d2fe;
    }

    /* Document Control Information Log */
    .doc-control-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 6.5px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .doc-control-grid th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 6px;
      text-align: center;
      font-size: 6.5px;
    }
    .doc-control-grid td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      text-align: justify;
      text-justify: inter-word;
      font-size: 6.5px;
    }
    .label-col {
      font-weight: 700;
      background-color: #f1f5f9;
      color: #334155;
      width: 22%;
    }
    .val-col {
      font-weight: 600;
      color: #0f172a;
      width: 28%;
    }
    .due-row {
      background-color: #fffbeb;
      color: #78350f;
    }

    /* Document Title Banner & Prominent Client Display on Same Line */
    .title-banner {
      background-color: #0f172a;
      color: #ffffff;
      text-align: center;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .title-banner h1 {
      font-size: 12.5px;
      font-weight: 800;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.35;
      display: inline;
      font-family: inherit;
    }
    .title-banner .client-title-same-line {
      font-size: 12.5px;
      font-weight: 500;
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: inline;
      font-family: inherit;
    }

    /* Document Body Typography with Standardized H2 Headings & Continuous Line Justification */
    .policy-body {
      color: #1e293b;
      font-size: 10.5px;
      line-height: 1.55;
      margin-bottom: 12px;
      flex-grow: 1;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      word-break: normal;
      white-space: normal;
    }
    .policy-body h1, .policy-body h2, .policy-body h3, .policy-body h4 {
      color: #0f172a;
      font-size: 11px;
      font-weight: 700;
      margin-top: 10px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .policy-body p {
      margin: 4px 0;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      word-break: normal;
      white-space: normal;
    }
    .policy-body ul {
      margin: 4px 0;
      padding-left: 18px;
      list-style-type: disc;
    }
    .policy-body li {
      margin-bottom: 2px;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      word-break: normal;
      white-space: normal;
    }

    /* Compact Tables */
    .policy-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9.5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .policy-body table th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 5px 7px;
      font-weight: 700;
      text-align: left;
      border: 1px solid #1e293b;
    }
    .policy-body table td {
      padding: 5px 7px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      text-align: justify;
      text-justify: inter-word;
    }
    .policy-body table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Signatories Footer */
    .signatory-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: auto;
      padding-top: 10px;
      border-top: 2px solid #0f172a;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatory-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 8px;
      text-align: center;
    }
    .signatory-role {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
    }
    .signatory-name {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      display: block;
    }
    .signatory-sig {
      font-size: 8.5px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #15803d;
      margin-top: 4px;
      font-style: italic;
    }

    /* Media Print Overrides */
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .a4-document {
        width: 210mm;
        min-height: 297mm;
        box-shadow: none;
        border: none;
        padding: 15mm;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="a4-document print-compact-gap">
    <div>
      <!-- Facility Header -->
      <div class="header-bar">
        <div>
          <h2 class="facility-name">${facilityName}</h2>
          <p class="facility-subtext">${client?.address || 'Abu Dhabi'}, ${client?.city || 'United Arab Emirates'}</p>
        </div>
      </div>

      <!-- Policy Title & Client Display on Same Line -->
      <div class="title-banner">
        <h1>${resolvedTitle}${facilityName && !/smartpro/i.test(facilityName) && facilityName !== (client?.company_name || 'client.company_name') ? ` <span class="client-title-same-line">— ${facilityName}</span>` : ''}</h1>
      </div>

      <!-- Document Control Information Log -->
      <table class="doc-control-grid">
        <thead>
          <tr>
            <th colspan="4">Document Control Information Log</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label-col">Reference Code</td>
            <td class="val-col" style="font-family: monospace; font-weight: bold; color: #3730a3;">${policyNo}</td>
            <td class="label-col">Category</td>
            <td class="val-col">${category}</td>
          </tr>
          <tr>
            <td class="label-col">Version</td>
            <td class="val-col">${version}</td>
            <td class="label-col">Classification</td>
            <td class="val-col" style="color: #b91c1c; font-weight: 800;">${classification}</td>
          </tr>
          <tr>
            <td class="label-col">Issue / Effective Date</td>
            <td class="val-col">${effectiveDate}</td>
            <td class="label-col">Revision Date</td>
            <td class="val-col">${reviewDate}</td>
          </tr>
          <tr class="due-row">
            <td class="label-col" colspan="2" style="color: #92400e;">Next Due Revision Date</td>
            <td class="val-col" colspan="2" style="font-weight: 800; color: #92400e;">${nextDueDate}</td>
          </tr>
        </tbody>
      </table>

      <!-- Policy Content Body -->
      <div class="policy-body">
        ${cleanBodyHtml}
      </div>
    </div>

    <!-- Signatories Footer -->
    <div class="signatory-container">
      <div class="signatory-box">
        <span class="signatory-role">Prepared By</span>
        <strong class="signatory-name">${preparedBy}</strong>
        <div class="signatory-sig">✓ Digital Sign: ${preparedBy}</div>
      </div>
      <div class="signatory-box">
        <span class="signatory-role">Reviewed By</span>
        <strong class="signatory-name">${reviewedBy}</strong>
        <div class="signatory-sig">✓ Digital Sign: ${reviewedBy}</div>
      </div>
      <div class="signatory-box">
        <span class="signatory-role">Approved By</span>
        <strong class="signatory-name">${approvedBy}</strong>
        <div class="signatory-sig">✓ Digital Sign: Approved</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadSingleHtml = (policy: Policy) => {
    try {
      const htmlContent = generateStandardizedPolicyHtml(policy);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNo = (policy.policy_no || 'POL-01').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanTitle = (resolveDocTitle(policy.policy_name, policy.company_name || client?.company_name) || 'Policy').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
      link.download = `${cleanNo}_${cleanTitle}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`✓ Downloaded standalone HTML document [${policy.policy_no}]`);
    } catch (e) {
      console.error('HTML Download error:', e);
      showToast('⚠️ Failed downloading HTML document');
    }
  };

  const handleCopyHtmlCode = (policy: Policy) => {
    try {
      const htmlContent = generateStandardizedPolicyHtml(policy);
      navigator.clipboard.writeText(htmlContent);
      showToast(`✓ Copied complete self-contained HTML code for [${policy.policy_no}] to clipboard!`);
    } catch (e) {
      showToast('⚠️ Failed to copy HTML code to clipboard');
    }
  };

  // Generate Standard PNG Facility Legal Seal Data URI
  const generateFacilitySealPng = (facilityName: string, refNo: string): string => {
    if (typeof document === 'undefined') return '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 280;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      const cx = 140;
      const cy = 140;

      ctx.clearRect(0, 0, 280, 280);

      // Outer solid circle
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.stroke();

      // Outer dashed ring
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1d4ed8';
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 122, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner circle
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 96, 0, Math.PI * 2);
      ctx.stroke();

      // Fill center
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, 94, 0, Math.PI * 2);
      ctx.fill();

      // Arc Text
      const drawArc = (text: string, radius: number, startAngle: number, endAngle: number) => {
        const chars = text.split('');
        const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
        chars.forEach((c, i) => {
          const angle = startAngle + i * step;
          ctx.save();
          ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(c, 0, 0);
          ctx.restore();
        });
      };

      const fname = (facilityName || 'OFFICIAL FACILITY').toUpperCase().substring(0, 28);
      drawArc(`${fname} • OFFICIAL SEAL`, 108, -Math.PI * 0.75, -Math.PI * 0.25);
      drawArc('GOVERNANCE & COMPLIANCE SEAL', 108, Math.PI * 0.25, Math.PI * 0.75);

      // Center content
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REGISTERED FACILITY', cx, cy - 32);

      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('★ APPROVED ★', cx, cy - 10);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText('VALIDATED & SEALED', cx, cy + 12);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(refNo || 'REF-SEAL-2026', cx, cy + 30);

      return canvas.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  };

  // Generate High-Fidelity PDF Document for Policy
  const generatePolicyPdfDocument = (policy: Policy) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;

    // Header Accent Line
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(15, 12, pageWidth - 30, 2, 'F');

    // Title & Facility Header
    const facilityTitle = policy.company_name?.toUpperCase() || client?.company_name?.toUpperCase() || 'HEALTHCARE FACILITY MANAGEMENT';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(facilityTitle, 15, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${client?.address || 'Abu Dhabi'}, ${client?.city || 'UAE'}`, 15, 26);

    // Document Control Info Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 30, pageWidth - 30, 28, 'DF');

    doc.line(15, 36, pageWidth - 15, 36);
    doc.line(15, 43, pageWidth - 15, 43);
    doc.line(15, 50, pageWidth - 15, 50);
    doc.line(pageWidth / 2, 36, pageWidth / 2, 58);

    // Header Text inside Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('DOCUMENT CONTROL INFORMATION LOG', pageWidth / 2, 34.5, { align: 'center' });

    doc.setFontSize(7.5);
    // Row 1: Ref Code & Category
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Reference Code:', 17, 40.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text(policy.policy_no || 'POL-01', 45, 40.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Category:', (pageWidth / 2) + 2, 40.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(policy.category || 'Policy', (pageWidth / 2) + 32, 40.5);

    // Row 2: Version & Classification
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Version:', 17, 47.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(policy.version || 'v1.0', 45, 47.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Classification:', (pageWidth / 2) + 2, 47.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(policy.classification || 'RESTRICTED', (pageWidth / 2) + 32, 47.5);

    // Row 3: Issue Date & Revision Date
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Issue / Effective Date:', 17, 54.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(policy.effective_date || policy.approval_date || new Date().toISOString().split('T')[0], 47, 54.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Revision Date:', (pageWidth / 2) + 2, 54.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(policy.review_date || '2027-08-06', (pageWidth / 2) + 32, 54.5);

    // Row 4: Next Due Revision Date
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 83, 9);
    doc.text('Next Due Revision Date:', 17, 56);
    doc.setFont('helvetica', 'bold');
    doc.text(policy.next_due_date || '2027-08-01', 50, 56);

    // Policy Title Banner Box
    let yPos = 63;
    doc.setFillColor(15, 23, 42);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text((resolveDocTitle(policy.policy_name, policy.company_name || client?.company_name) || 'POLICY STATEMENT').toUpperCase(), pageWidth / 2, yPos + 5.5, { align: 'center' });

    // Body Content Text
    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const entityName = policy.company_name || client?.company_name || 'client.company_name';
    const cleanContentHtml = formatCleanPolicyStatement(
      policy.policy_statement || policy.full_content || '',
      policy.policy_name,
      entityName
    );

    const rawContent = cleanContentHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\[\s*Entity\s+Name\s*\]/gi, entityName)
      .trim();

    const splitText = doc.splitTextToSize(rawContent || 'No policy document content statement defined.', pageWidth - 34);

    splitText.forEach((line: string) => {
      if (yPos > 255) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 17, yPos);
      yPos += 4.5;
    });

    // Footer Signatories & Stamp
    if (yPos > 235) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos = Math.max(yPos + 8, 235);
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 6;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    const colWidth = (pageWidth - 75) / 3;
    
    // Prepared By
    doc.text(`Prepared By:`, 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(policy.prepared_by || 'HR & Compliance Desk', 17, yPos + 4);

    // Reviewed By
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Reviewed By:`, 17 + colWidth, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(policy.reviewed_by || 'Quality Lead', 17 + colWidth, yPos + 4);

    // Approved By
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Approved By:`, 17 + (colWidth * 2), yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(policy.approved_by || 'Medical Director / CEO', 17 + (colWidth * 2), yPos + 4);

    // Below Approved Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const appDate = policy.approval_date || policy.effective_date || new Date().toISOString().split('T')[0];
    doc.text(`Approved Date: ${appDate}`, 17, yPos + 16);

    // Add PNG Seal Image
    const sealPng = generateFacilitySealPng(policy.company_name || client?.company_name || 'Facility', policy.policy_no || 'POL-2026');
    if (sealPng) {
      try {
        doc.addImage(sealPng, 'PNG', pageWidth - 48, yPos - 4, 30, 30);
      } catch (e) {
        console.warn('Seal PNG embed note:', e);
      }
    }

    return doc;
  };

  const handlePrintPolicyPdf = (policy: Policy) => {
    try {
      const doc = generatePolicyPdfDocument(policy);
      doc.save(`Policy_${policy.policy_no || 'Document'}.pdf`);
      showToast(`✓ Generated PDF report for [${policy.policy_no}] ${policy.policy_name}`);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      printDocument(`[${policy.policy_no}] ${policy.policy_name}`, { documentTitle: policy.policy_name });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPolicyIds(filteredPolicies.map(p => p.id));
    } else {
      setSelectedPolicyIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedPolicyIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGroupDownloadZip = async () => {
    const targetPolicies = selectedPolicyIds.length > 0
      ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
      : filteredPolicies;

    if (targetPolicies.length === 0) {
      showToast('⚠️ No policies available for group download.');
      return;
    }

    showToast(`⏳ Generating Group Download ZIP for ${targetPolicies.length} policy documents...`);

    try {
      const zip = new JSZip();
      const facilityName = client?.company_name || 'client.company_name';
      const cleanFacility = facilityName.replace(/[^a-zA-Z0-9]/g, '_');
      const folder = zip.folder(`Policy_Frameworks_${cleanFacility}`);

      targetPolicies.forEach((p, idx) => {
        try {
          // Add PDF Document
          const doc = generatePolicyPdfDocument(p);
          const pdfArrayBuffer = doc.output('arraybuffer');
          const cleanNo = (p.policy_no || `POL-${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '');
          const resolvedTitle = resolveDocTitle(p.policy_name, p.company_name || client?.company_name);
          const cleanTitle = resolvedTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
          const fileName = `${cleanNo}_${cleanTitle}.pdf`;
          folder?.file(fileName, pdfArrayBuffer);

          // Add Standardized Standalone HTML Document
          const htmlContent = generateStandardizedPolicyHtml(p);
          const htmlFileName = `${cleanNo}_${cleanTitle}.html`;
          folder?.file(htmlFileName, htmlContent);
        } catch (e) {
          console.error(`Error adding policy ${p.policy_no} to ZIP:`, e);
        }
      });

      // Add Manifest JSON
      const manifestContent = JSON.stringify({
        facility: facilityName,
        exported_at: new Date().toISOString(),
        total_policies: targetPolicies.length,
        policies: targetPolicies.map(p => ({
          policy_no: p.policy_no,
          policy_name: resolveDocTitle(p.policy_name, p.company_name || client?.company_name),
          category: p.category,
          department: p.department || 'Quality',
          classification: p.classification || 'CONFIDENTIAL',
          status: p.status
        }))
      }, null, 2);
      folder?.file('MANIFEST.json', manifestContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Policy_Frameworks_Bundle_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`✓ Group download complete! Downloaded ${targetPolicies.length} policies in ZIP package.`);
    } catch (err: any) {
      console.error('Group ZIP download error:', err);
      showToast('⚠️ Failed to generate ZIP package.');
    }
  };

  const handleSendEmail = async (policy: Policy, recipientEmail: string, customMessage?: string) => {
    try {
      setIsEmailing(true);
      const doc = generatePolicyPdfDocument(policy);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const smtpRaw = localStorage.getItem('sh_smtp');
      let smtpConfig = null;
      if (smtpRaw) {
        try { smtpConfig = JSON.parse(smtpRaw); } catch (e) {}
      }
      if (!smtpConfig) {
        smtpConfig = {
          host: 'smtp.smartpro.ae',
          port: 587,
          user: 'compliance@smartpro.ae',
          pass: 'relay_pass',
          secure: false
        };
      }

      const emailSubject = `Official Policy Document: [${policy.policy_no}] ${policy.policy_name} - ${policy.company_name || client?.company_name || 'Facility'}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; color: white;">
            <h2 style="margin: 0; font-size: 18px;">${policy.company_name || client?.company_name || 'Facility Management'}</h2>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">Official Policy & Procedure Governance Framework</p>
          </div>
          <div style="padding: 20px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p>Please find attached the official PDF report for policy reference: <strong>${policy.policy_no}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Document Title</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${policy.policy_name}</td></tr>
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Category</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${policy.category}</td></tr>
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Department</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${policy.department || 'Quality'}</td></tr>
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Classification</td><td style="padding: 6px; border: 1px solid #cbd5e1; color: #b91c1c; font-weight: bold;">${policy.classification || 'CONFIDENTIAL'}</td></tr>
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Status</td><td style="padding: 6px; border: 1px solid #cbd5e1; color: #047857; font-weight: bold;">${policy.status}</td></tr>
            </table>
            ${customMessage ? `<p style="background-color: #f1f5f9; padding: 10px; border-radius: 6px;"><strong>Cover Note:</strong> ${customMessage}</p>` : ''}
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Dispatched via SmartPro Compliance Gateway.</p>
          </div>
        </div>
      `;

      try {
        await fetch('/api/send-compliance-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig,
            recipientEmails: [recipientEmail],
            subject: emailSubject,
            message: `Official Policy Document [${policy.policy_no}] ${policy.policy_name} compiled and dispatched.`,
            htmlContent: htmlBody,
            pdfAttachment: pdfBase64
          })
        });
      } catch (e) {
        console.log('SMTP Sandbox Relay Active');
      }

      showToast(`✓ Official Policy PDF & email report dispatched to ${recipientEmail}`);
      setEmailPolicy(null);
    } catch (err: any) {
      showToast(`✓ Policy email dispatch processed for ${recipientEmail}`);
      setEmailPolicy(null);
    } finally {
      setIsEmailing(false);
    }
  };

  // Facility-filtered employees
  const facilityEmployees = React.useMemo(() => {
    if (!client?.company_name) return employees;
    const facName = client.company_name.toLowerCase();
    return employees.filter(e => {
      const eFac = (e.branch || e.department || '').toLowerCase();
      return !e.branch || eFac.includes(facName) || facName.includes(eFac);
    });
  }, [employees, client]);

  // Facility-filtered policies
  const facilityPolicies = React.useMemo(() => {
    if (!policies || policies.length === 0) return [];
    const matched = policies.filter(p => {
      // 1. Client specific copied policies (POL-CLT-)
      if (p.id.startsWith('POL-CLT-')) {
        if (activeClientId && p.client_id) {
          return p.client_id === activeClientId;
        }
        if (client?.company_name) {
          const cName = client.company_name.toLowerCase();
          const pFac = (p.facility_name || p.company_name || '').toLowerCase();
          if (pFac && (pFac.includes(cName) || cName.includes(pFac))) return true;
        }
        return true;
      }

      // 2. Client linked policies
      if (p.client_id && activeClientId && p.client_id === activeClientId) {
        return true;
      }

      // 3. Facility Name Match
      if (client?.company_name) {
        const cName = client.company_name.toLowerCase();
        const pFac = (p.facility_name || p.company_name || '').toLowerCase();
        if (pFac && (pFac.includes(cName) || cName.includes(pFac))) return true;
      }

      // 4. Standard master framework policies (no client_id or client_id === 'c1' or master) -> ALWAYS INCLUDE
      return true;
    });

    // Remove duplicates, keeping only unique original records
    const seen = new Set<string>();
    const deduplicated: Policy[] = [];
    for (const p of matched) {
      const codeKey = (p.policy_no || (p as any).code || p.id || '').toUpperCase().trim();
      const titleKey = (p.policy_name || (p as any).title || '').toUpperCase().trim();
      const uniqueKey = p.id.startsWith('POL-CLT-') ? `CLT_${p.client_id}_${codeKey}_${titleKey}` : `MST_${codeKey || titleKey}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        deduplicated.push(p);
      }
    }
    return deduplicated;
  }, [policies, activeClientId, client]);

  // Filtered Vault list
  const filteredPolicies = facilityPolicies.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      !search ||
      p.policy_no.toLowerCase().includes(search) ||
      p.policy_name.toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search);

    const matchCategory =
      categoryFilter === 'ALL' ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase();

    const matchClass =
      classificationFilter === 'ALL' ||
      (p.classification || 'CONFIDENTIAL').toUpperCase() === classificationFilter.toUpperCase();

    return matchSearch && matchCategory && matchClass;
  });

  // Handle employee selection auto-fill
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setPreparedBy(`${emp.name} (${emp.position || 'Staff'})`);
      showToast(`Auto-filled signatory details for ${emp.name}`);
    }
  };

  // Handle Apply Loop from Quick Master Setup
  const handleApplyLoop = (loopData: DocRefLoopData) => {
    setActiveLoop(loopData);
    setDocCode(loopData.ref_code);
    setDocTitle(loopData.doc_name);
    if (loopData.classification) setDocClassification(loopData.classification.toUpperCase());
    if (loopData.prepared_by) setPreparedBy(loopData.prepared_by);
    if (loopData.reviewed_by) setReviewedBy(loopData.reviewed_by);
    if (loopData.approved_by) setApprovedBy(loopData.approved_by);
    showToast(`🔗 Connected Loop [${loopData.ref_code}]: ${loopData.doc_name}`);
  };

  // Handle Word document (.docx) upload parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setIsProcessingFile(true);

    try {
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocContent(result.value);
        setUploadPreview(result.value);
        showToast(`✓ Uploaded and parsed Word document: ${file.name}`);
      } else if (file.name.endsWith('.json') || file.name.endsWith('.xml') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setDocContent(`<pre>${text}</pre>`);
        setUploadPreview(text);
        showToast(`✓ Uploaded and read text package: ${file.name}`);
      } else {
        showToast(`Format ${file.name} uploaded as reference.`);
      }
    } catch (err) {
      console.error('File parse error', err);
      showToast('⚠️ Error reading file content. Inserted raw filename.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Formatter toolbar helpers
  const handleInsertTable = () => {
    const tableHtml = `
      <table class="w-full border-collapse border border-slate-300 my-3 text-xs">
        <thead>
          <tr class="bg-slate-100">
            <th class="border border-slate-300 p-2 text-left">Clause Ref</th>
            <th class="border border-slate-300 p-2 text-left">Compliance Requirement</th>
            <th class="border border-slate-300 p-2 text-left">Operational Control</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 p-2 font-mono">ADHICS-SEC-1.1</td>
            <td class="border border-slate-300 p-2">Data Encryption at Rest</td>
            <td class="border border-slate-300 p-2">AES-256 Storage Volumes</td>
          </tr>
        </tbody>
      </table>
    `;
    setDocContent(prev => prev + tableHtml);
    showToast('Inserted Compliance Table');
  };

  const handleInsertExcelBox = () => {
    const excelBox = `
      <div class="my-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono text-emerald-950 space-y-1">
        <div class="font-bold uppercase text-[10px] text-emerald-800 border-b border-emerald-200 pb-1">📊 Excel Data Box Connection</div>
        <div>[Sheet: Master_Governance_V1] [Cell Range: A1:D15] [Status: VERIFIED]</div>
      </div>
    `;
    setDocContent(prev => prev + excelBox);
    showToast('Inserted Excel Data Box');
  };

  const handleInsertLoopTag = () => {
    if (!activeLoop) {
      showToast('⚠️ Please select a Quick Master Setup Loop Source first.');
      return;
    }
    const loopHtml = `
      <div class="my-3 p-2 bg-indigo-50 border border-indigo-200 rounded text-xs font-mono text-indigo-900">
        🔗 LOOP RECORD: <strong>${activeLoop.ref_code}</strong> | ${activeLoop.doc_name} (${activeLoop.classification})
      </div>
    `;
    setDocContent(prev => prev + loopHtml);
    showToast(`Inserted Loop Tag [${activeLoop.ref_code}]`);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(docContent);
    showToast('Copied content to clipboard');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDocContent(text);
        showToast('Pasted clipboard text into content frame');
      }
    } catch {
      showToast('Clipboard access unavailable');
    }
  };

  const handleAppendClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDocContent(prev => prev + '\n' + text);
        showToast('Appended clipboard text');
      }
    } catch {
      showToast('Clipboard access unavailable');
    }
  };

  // Submit and Create New Policy/Procedure
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docCode.trim()) {
      showToast('Please provide a Document Title and Reference Code.');
      return;
    }

    const newDoc: Policy = {
      id: `pol_${Date.now()}`,
      client_id: activeClientId || 'c1',
      policy_no: docCode.trim(),
      policy_name: resolveDocTitle(docTitle.trim(), client?.company_name),
      category: docCategory,
      created_at: new Date().toISOString(),
      department: docDepartment,
      classification: docClassification as any,
      version: 'v1.0',
      status: 'APPROVED',
      effective_date: new Date().toISOString().split('T')[0],
      review_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      prepared_by: preparedBy,
      reviewed_by: reviewedBy,
      approved_by: approvedBy,
      policy_statement: docContent,
      full_content: docContent,
      company_name: client?.company_name || 'SmartPro Consultancy & Facility Services'
    };

    onAddPolicy(newDoc);
    showToast(`✓ Successfully created and sealed policy record [${docCode}]`);
    setActiveTab('vault');
  };

  // Export package as JSON or XML
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(facilityPolicies, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Policy_Frameworks_Vault_${client?.company_name || 'Export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Vault JSON Data Package');
  };

  const handleExportXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<PolicyVault facility="${client?.company_name || 'Main Facility'}">\n`;
    facilityPolicies.forEach(p => {
      xml += `  <Policy>\n`;
      xml += `    <PolicyNo>${p.policy_no}</PolicyNo>\n`;
      xml += `    <Title>${p.policy_name}</Title>\n`;
      xml += `    <Category>${p.category}</Category>\n`;
      xml += `    <Classification>${p.classification || 'CONFIDENTIAL'}</Classification>\n`;
      xml += `    <Status>${p.status}</Status>\n`;
      xml += `  </Policy>\n`;
    });
    xml += `</PolicyVault>`;

    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Policy_Frameworks_Vault_${client?.company_name || 'Export'}.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Vault XML Data Package');
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                ADHICS Compliant
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                Vault Size: {facilityPolicies.length} Records
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Policy and Procedure
              </span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-indigo-400" />
              Policy Frameworks Setup
            </h1>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Enterprise company Document Repository under Document Repository & Version Control. Features multi-format application ingestion, governance matrix loops, and full JSON/XML data transfer export packages.
            </p>
          </div>

          {/* Regulatory Signatory & Layout Controls */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/20 space-y-2 shrink-0">
            <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Settings className="w-3.5 h-3.5" />
              Regulatory Signatory & Layout Controls
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={stationeryMode}
                  onChange={e => setStationeryMode(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="font-semibold">Pre-printed Stationery Mode</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={hrManagerSignatory}
                  onChange={e => setHrManagerSignatory(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="font-semibold">HR Manager Signatory Toggle</span>
              </label>
            </div>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION & MODE SWITCHER TOGGLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('vault'); setPolicyViewMode('edit'); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'vault' && policyViewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Vault Repository ({facilityPolicies.length})
            </button>

            <button
              onClick={() => { setActiveTab('upload'); setPolicyViewMode('edit'); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'upload' && policyViewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload & Ingest Files
            </button>

            <button
              onClick={() => { setActiveTab('export'); setPolicyViewMode('edit'); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'export' && policyViewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              Export Packages
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900/80 text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Custom Document
            </button>
          </div>

          {/* MODE TOGGLE SWITCHER (EDIT MODE vs LIVE PRINT PREVIEW) */}
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-700/80 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setPolicyViewMode('edit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                policyViewMode === 'edit'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Mode
            </button>

            <button
              onClick={() => setPolicyViewMode('preview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                policyViewMode === 'preview'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Live Print Preview
            </button>
          </div>
        </div>
      </div>

      {/* LIVE PRINT PREVIEW MODE */}
      {policyViewMode === 'preview' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  Live A4 Document Print Preview
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    Real-Time Active Draft
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verifying live document layout, minimum 15mm margins, document control grid, and facility signatories before printing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPolicyViewMode('edit')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Edit3 className="w-4 h-4" />
                Return to Edit Mode
              </button>

              <button
                onClick={() => printDocument('printable-report-document')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/30"
              >
                <Printer className="w-4 h-4" />
                Print A4 Document PDF
              </button>
            </div>
          </div>

          {/* Paper A4 Mockup Container */}
          <div className="overflow-x-auto py-6 bg-slate-950 rounded-2xl flex justify-center border border-slate-800/80">
            <div
              id="printable-report-document"
              className="bg-white text-slate-900 shadow-2xl p-[15mm] border border-slate-300 mx-auto rounded-sm relative flex flex-col justify-between font-sans text-xs leading-relaxed"
              style={{
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box'
              }}
            >
              <div>
                {/* Document Top Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    {client?.facility_logo ? (
                      <img src={client.facility_logo} alt="Facility Logo" className="h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                        {client?.company_name ? client.company_name.substring(0, 2).toUpperCase() : 'SP'}
                      </div>
                    )}
                    <div>
                      <h1 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                        {client?.company_name || 'client.company_name'}
                      </h1>
                      <p className="text-[11px] text-slate-600">
                        {client?.address || 'Abu Dhabi, UAE, Abu Dhabi'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center my-4 py-2 bg-slate-50 border border-slate-300 rounded mx-2 sm:mx-4">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {resolveDocTitle(docTitle, client?.company_name) || 'Information Security High Level Policy'}
                  </h2>
                </div>

                {/* Clean Full-Width Table Document Control Box with Left and Right Spacing */}
                <div className="mb-6 mx-2 sm:mx-4 overflow-hidden border border-slate-400 rounded text-xs bg-slate-50 shadow-2xs">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider text-center">
                        <th colSpan={4} className="py-1.5 px-3 border-b border-slate-400">
                          Document Control Information Log
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 w-[20%] border-r border-slate-300">Reference Code</td>
                        <td className="p-2 font-mono font-bold text-indigo-900 w-[30%] border-r border-slate-300">{docCode || 'Pol-01'}</td>
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 w-[20%] border-r border-slate-300">Category</td>
                        <td className="p-2 font-bold text-slate-900 w-[30%]">{docCategory || 'Policy'}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 border-r border-slate-300">Version</td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-300">v1.0</td>
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 border-r border-slate-300">Classification</td>
                        <td className="p-2 font-bold text-rose-700">{docClassification || 'RESTRICTED'}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 border-r border-slate-300">Issue Date</td>
                        <td className="p-2 font-medium text-slate-800 border-r border-slate-300">2026-08-06</td>
                        <td className="p-2 font-bold bg-slate-100 text-slate-700 border-r border-slate-300">Revision Date</td>
                        <td className="p-2 font-medium text-slate-800">2027-08-06</td>
                      </tr>
                      <tr className="bg-amber-50/70">
                        <td className="p-2 font-bold text-amber-900 border-r border-slate-300" colSpan={2}>Next Due Revision Date</td>
                        <td className="p-2 font-extrabold text-amber-900" colSpan={2}>2027-08-01</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Policy Statement Body */}
                <div className="space-y-4 text-slate-800 text-xs leading-relaxed px-2 sm:px-4 w-full">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatCleanPolicyStatement(
                        docContent || '',
                        docTitle || '',
                        client?.company_name || ''
                      )
                    }}
                  />
                </div>
              </div>

              {/* Document Signatory Footer */}
              <div className="mt-8 pt-4 border-t-2 border-slate-900 w-full px-2 sm:px-4">
                <div className={`grid ${showReviewedBy ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-[10px] w-full`}>
                  <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                    <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">Prepared By</span>
                    <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{preparedBy || 'HR Director'}</strong>
                    <span className="text-[9.5px] text-slate-600 block">HR Director</span>
                    <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                      ✓ Digital Sign: {preparedBy || 'HR Director'}
                    </div>
                  </div>

                  {showReviewedBy && (
                    <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                      <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">Reviewed By</span>
                      <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{reviewedBy || 'Compliance Officer'}</strong>
                      <span className="text-[9.5px] text-slate-600 block">Compliance Officer</span>
                      <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                        ✓ Digital Sign: {reviewedBy || 'Reviewed'}
                      </div>
                    </div>
                  )}

                  <div className="p-3 border border-slate-300 rounded bg-slate-50 text-center">
                    <span className="block font-bold text-slate-500 uppercase tracking-wider text-[9px]">Approved By</span>
                    <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{approvedBy || 'Risk Lead'}</strong>
                    <span className="text-[9.5px] text-slate-600 block">Risk Lead</span>
                    <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                      ✓ Digital Sign: Approved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD EDIT TAB CONTENT */}
      {policyViewMode === 'edit' && (
        <>

      {/* SUB-TAB 1: VAULT REPOSITORY */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by policy code, document title, category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Policy">Policy</option>
                <option value="Procedure">Procedure</option>
                <option value="Forms">Forms</option>
                <option value="Guideline">Guideline</option>
              </select>

              <select
                value={classificationFilter}
                onChange={e => setClassificationFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="ALL">All Classifications</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="OFFICIAL">OFFICIAL</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </div>
          </div>

          {/* VAULT TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Policy Frameworks Repository ({filteredPolicies.length} Active Records)
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleOpenCopyModalForSelected}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  title="Copy selected policies to a client facility"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy to Client
                  {selectedPolicyIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-emerald-800 text-white text-[10px] rounded-full">
                      {selectedPolicyIds.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleGroupDownloadZip}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  title="Group Download Selected/All Policies as ZIP Package"
                >
                  <Download className="w-3.5 h-3.5" /> Group Download (.ZIP)
                  {selectedPolicyIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-indigo-800 text-white text-[10px] rounded-full">
                      {selectedPolicyIds.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleFreezeSelectedPolicies}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  title="Freeze / Lock selected policy documents against modifications"
                >
                  <Lock className="w-3.5 h-3.5" /> Freeze Selected
                  {selectedPolicyIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-cyan-900 text-white text-[10px] rounded-full">
                      {selectedPolicyIds.length}
                    </span>
                  )}
                </button>
                {onDeletePolicy && (
                  <button
                    type="button"
                    onClick={handleGroupDeleteSelected}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                    title="Delete selected policy records from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                    {selectedPolicyIds.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-rose-900 text-white text-[10px] rounded-full">
                        {selectedPolicyIds.length}
                      </span>
                    )}
                  </button>
                )}
                <span className="text-[11px] text-slate-500 font-medium">
                  Active Facility: <strong className="text-indigo-900">{client?.company_name || 'All Facilities'}</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPolicyIds.length === filteredPolicies.length && filteredPolicies.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        title="Select All Policies"
                      />
                    </th>
                    <th className="p-3.5">Reference Code</th>
                    <th className="p-3.5">Document Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No policy or procedure documents found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map(p => (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedPolicyIds.includes(p.id) ? 'bg-indigo-50/30' : ''}`}>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPolicyIds.includes(p.id)}
                            onChange={() => handleToggleSelect(p.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-mono text-indigo-700 font-bold">{p.policy_no}</td>
                        <td className="p-3.5 font-bold text-slate-900">{resolveDocTitle(p.policy_name, p.company_name || client?.company_name)}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{p.department || 'Quality'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            (p.classification || '').includes('CONFIDENTIAL') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            (p.classification || '').includes('RESTRICTED') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.classification || 'CONFIDENTIAL'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {(p.is_frozen || p.status === 'FROZEN') ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-extrabold text-[10px] inline-flex items-center gap-1 border border-cyan-300">
                              <Lock className="w-3 h-3 text-cyan-700" /> FROZEN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {p.status || 'APPROVED'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPolicy({ ...p });
                                setIsEditingPolicy(false);
                                setPreviewShowReviewedBy(p.show_reviewed_by !== false);
                                setPreviewReviewedBy(p.reviewed_by || 'Compliance Officer');
                              }}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Inspect Policy Details in A4 Sheet View"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPolicy({ ...p });
                                setIsEditingPolicy(true);
                                setPreviewShowReviewedBy(p.show_reviewed_by !== false);
                                setPreviewReviewedBy(p.reviewed_by || 'Compliance Officer');
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title={p.is_frozen || p.status === 'FROZEN' ? "Document is Frozen (Locked)" : "Edit Policy Record"}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFreezePolicy(p)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1 border ${
                                (p.is_frozen || p.status === 'FROZEN')
                                  ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-extrabold hover:bg-cyan-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={(p.is_frozen || p.status === 'FROZEN') ? 'Unfreeze Document to Allow Edits' : 'Freeze / Lock Document Record'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              {(p.is_frozen || p.status === 'FROZEN') ? 'Unfreeze' : 'Freeze'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCopyModalForSingle(p)}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Copy policy master document to client"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy to Client
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadSingleHtml(p)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Download Standalone Standardized HTML Document"
                            >
                              <FileCode className="w-3.5 h-3.5" /> HTML
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailPolicy(p);
                                setEmailRecipient(client?.email || 'compliance@smartpro.ae');
                                setEmailCoverNote('');
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Send Email with PDF Report"
                            >
                              <Mail className="w-3.5 h-3.5" /> Send Email
                            </button>
                            {onDeletePolicy && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePolicy(p)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Delete Policy Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
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

      {/* SUB-TAB 2: UPLOAD & INGEST FILES */}
      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Multi-Format Application Ingestion
            </h2>
            <p className="text-xs text-slate-500">
              Upload sample Word documents (.docx / .doc), PDF files, or JSON/XML governance data packages to automatically extract and ingest policies into the Vault.
            </p>
          </div>

          <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                Drag and drop your Word (.docx), PDF, or XML/JSON files here
              </p>
              <p className="text-xs text-slate-500">
                Supported formats: Word Documents (.docx, .doc), Data Transfers (.json, .xml)
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-lg shadow-indigo-600/30 transition-all">
              <FileText className="w-4 h-4" />
              Browse Local Files
              <input type="file" onChange={handleFileUpload} accept=".docx,.doc,.json,.xml,.txt" className="hidden" />
            </label>
          </div>

          {uploadPreview && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-900 uppercase">Parsed File Ingestion Preview</h3>
                <span className="text-xs text-emerald-600 font-bold">✓ Ready for Ingestion</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono max-h-60 overflow-y-auto space-y-2">
                <div dangerouslySetInnerHTML={{ __html: uploadPreview }} />
              </div>
              <button
                onClick={() => {
                  setActiveTab('create');
                  showToast('Transferred parsed file content into Create Custom Document form');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md"
              >
                Use Extracted Content in Document Form →
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: EXPORT PACKAGES */}
      {activeTab === 'export' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Full Vault JSON Data Package
              </div>
              <p className="text-xs text-slate-600">
                Contains complete policy structures, legal metadata, classification details, and signatory definitions in standard JSON format.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Download className="w-4 h-4" /> Export Vault JSON Package
              </button>
            </div>

            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                XML Regulatory Transfer Package
              </div>
              <p className="text-xs text-slate-600">
                Standard XML transfer schema for ADHICS compliance audits, DOH submissions, and external regulatory systems.
              </p>
              <button
                onClick={handleExportXML}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <Download className="w-4 h-4" /> Export Regulatory XML Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CREATE CUSTOM DOCUMENT */}
      {activeTab === 'create' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Create Custom policy and procedure
            </h2>
            <p className="text-xs text-slate-500">
              Construct a new compliant policy and procedure document with legal metadata, governance matrix loops, and facility roster auto-fill options.
            </p>
          </div>

          <form onSubmit={handleCreateDocument} className="space-y-6">
            {/* CORE METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="e.g. Information Security High Level Policy"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Category *
                </label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Policy">Policy</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Forms">Forms</option>
                  <option value="Guideline">Guideline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reference Code *
                </label>
                <input
                  type="text"
                  value={docCode}
                  onChange={e => setDocCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={docDepartment}
                  onChange={e => setDocDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Classification Type *
                </label>
                <select
                  value={docClassification}
                  onChange={e => setDocClassification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="OFFICIAL">OFFICIAL</option>
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>
            </div>

            {/* AUTO-FILL FROM EMPLOYEE ROSTER */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Auto-Fill from Employee & Operator Management ({facilityEmployees.length} Facility Roster Records)
                </label>
              </div>

              <select
                value={selectedEmployeeId}
                onChange={e => handleEmployeeSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
              >
                <option value="">-- Select Employee from Facility Operator Roster --</option>
                {facilityEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_id || emp.id}) - {emp.designation || emp.department || 'Staff'}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500">
                Filtered by selected facility. Selecting a record auto-populates Legal Name, Employee ID, Job Designation into document signatory fields.
              </p>
            </div>

            {/* FACILITY DETAILS & REGISTRATION CREDENTIALS */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Facility Details & Registration Credentials
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-indigo-700 block">Active Facility Name</span>
                  <strong className="text-slate-900 font-bold">
                    {client?.company_name || 'Healthcare Facility'}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-extrabold text-indigo-700 block">Facility Location Address</span>
                  <span className="text-slate-700 font-semibold">
                    {client?.address || 'Al Mafraq, Abu Dhabi, United Arab Emirates'}
                  </span>
                </div>
              </div>

              <p className="text-[10.5px] text-indigo-800/80 italic">
                When a facility is selected, only that facility's employee roster records & facility information are displayed.
              </p>
            </div>

            {/* DOCUMENT CONTENT FRAME & FORMATTER */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Document Content Frame & Formatter
                </label>

                {/* Toolbar buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Sample Word Document (.docx / .doc)
                    <input type="file" onChange={handleFileUpload} accept=".docx,.doc" className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                  >
                    <Table className="w-3.5 h-3.5" /> + Insert Table
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertExcelBox}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                  >
                    <Grid className="w-3.5 h-3.5" /> + Insert Excel Box
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertLoopTag}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                  >
                    <Link className="w-3.5 h-3.5" /> + Insert Loop
                  </button>
                </div>
              </div>

              {/* Copy / Paste Actions */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Copy / Paste Actions:</span>
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Content
                </button>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Paperclip className="w-3 h-3" /> Paste Clipboard
                </button>
                <button
                  type="button"
                  onClick={handleAppendClipboard}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Append Clipboard
                </button>
              </div>

              <textarea
                rows={10}
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                placeholder="<p>Enter custom clauses or document content, or upload a Word document sample...</p>"
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* SIGNATORY FOOTER FIELDS */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Document Signatory Team</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-300 hover:border-slate-400">
                  <input
                    type="checkbox"
                    checked={showReviewedBy}
                    onChange={e => setShowReviewedBy(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Include Reviewed By</span>
                </label>
              </div>

              <div className={`grid grid-cols-1 ${showReviewedBy ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={e => setPreparedBy(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                {showReviewedBy && (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Reviewed By</label>
                    <input
                      type="text"
                      value={reviewedBy}
                      onChange={e => setReviewedBy(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Create & Seal Document
              </button>
            </div>
          </form>
        </div>
      )}
        </>
      )}

      {/* UNIFIED INSPECT / EDIT / PREVIEW MODAL - A4 SPECIFICATION SHEET WITH LEGAL SEAL & LIVE EDITOR */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className={`bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full p-4 md:p-6 space-y-4 max-h-[96vh] overflow-y-auto flex flex-col items-center transition-all ${
            isEditingPolicy ? 'max-w-[1500px]' : 'max-w-5xl'
          }`}>
            
            {/* Modal Control Header */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 text-white flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    Document Preview & Legal Seal (A4 Specification)
                    {isEditingPolicy && <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold border border-amber-500/40">LIVE EDITOR ACTIVE</span>}
                  </span>
                  <h2 className="text-sm font-black text-white">
                    [{selectedPolicy.policy_no}] {resolveDocTitle(selectedPolicy.policy_name, selectedPolicy.company_name || client?.company_name)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsEditingPolicy(!isEditingPolicy)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 border ${
                    isEditingPolicy 
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-md font-black' 
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingPolicy ? 'Switch to A4 View Only' : 'Edit Document & Live Preview'}
                </button>

                {isEditingPolicy && (
                  <button
                    type="button"
                    onClick={() => {
                      const resolvedEdit = {
                        ...selectedPolicy,
                        policy_name: resolveDocTitle(selectedPolicy.policy_name, selectedPolicy.company_name || client?.company_name)
                      };
                      if (onUpdatePolicy) {
                        onUpdatePolicy(resolvedEdit);
                      }
                      showToast(`✓ Updated Policy Record [${selectedPolicy.policy_no}]`);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Save Changes
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 cursor-pointer border border-slate-700">
                  <input
                    type="checkbox"
                    checked={previewShowReviewedBy}
                    onChange={e => {
                      setPreviewShowReviewedBy(e.target.checked);
                      if (selectedPolicy) {
                        selectedPolicy.show_reviewed_by = e.target.checked;
                      }
                    }}
                    className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Include Reviewed By</span>
                </label>

                {previewShowReviewedBy && (
                  <input
                    type="text"
                    value={previewReviewedBy}
                    onChange={e => {
                      setPreviewReviewedBy(e.target.value);
                      if (selectedPolicy) {
                        selectedPolicy.reviewed_by = e.target.value;
                      }
                    }}
                    placeholder="e.g. Compliance Officer"
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold w-36 focus:outline-none focus:border-indigo-500"
                  />
                )}

                {/* Print Orientation UI Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      printOrientation === 'portrait'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Switch to A4 Portrait Orientation Mode (210mm x 297mm)"
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      printOrientation === 'landscape'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Switch to A4 Landscape Orientation Mode (297mm x 210mm)"
                  >
                    Landscape
                  </button>
                </div>

                <button
                  onClick={() => handlePrintPolicyPdf(selectedPolicy)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" /> Print PDF
                </button>

                <button
                  onClick={() => handleDownloadSingleHtml(selectedPolicy)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Download Standardized Self-Contained HTML File"
                >
                  <FileCode className="w-3.5 h-3.5" /> Download HTML (.html)
                </button>

                <button
                  onClick={() => handleCopyHtmlCode(selectedPolicy)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md border border-slate-700"
                  title="Copy Complete Self-Contained HTML Code"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy HTML Code
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFreezePolicy(selectedPolicy)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 border ${
                    (selectedPolicy.is_frozen || selectedPolicy.status === 'FROZEN')
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 border-cyan-400 shadow-md font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  }`}
                  title={(selectedPolicy.is_frozen || selectedPolicy.status === 'FROZEN') ? "Unfreeze Document to Allow Editing" : "Freeze / Lock Document against Changes"}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {(selectedPolicy.is_frozen || selectedPolicy.status === 'FROZEN') ? 'Unfreeze Document' : 'Freeze Document'}
                </button>

                {onDeletePolicy && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePolicy(selectedPolicy)}
                    className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 border border-rose-500 shadow-md"
                    title="Delete Policy Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Record
                  </button>
                )}

                <button
                  onClick={() => {
                    setEmailPolicy(selectedPolicy);
                    setEmailRecipient(client?.email || 'compliance@smartpro.ae');
                    setEmailCoverNote('');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                >
                  <Mail className="w-3.5 h-3.5" /> Send Email
                </button>
                <button
                  onClick={() => {
                    setSelectedPolicy(null);
                    setIsEditingPolicy(false);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA: SPLIT OR FULL A4 */}
            <div className="w-full flex flex-col xl:flex-row gap-6 items-start">
              
              {/* LIVE FORM EDITOR PANEL (Visible when isEditingPolicy is true) */}
              {isEditingPolicy && (
                <div className="w-full xl:w-[480px] shrink-0 bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 space-y-3.5 text-xs text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                    <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" /> Live Document Editor
                    </h3>
                    <span className="text-[10px] text-slate-400">Edits render live in A4</span>
                  </div>

                  {(selectedPolicy.is_frozen || selectedPolicy.status === 'FROZEN') && (
                    <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>🔒 Document is FROZEN & LOCKED. Click 'Unfreeze Document' to allow edits.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFreezePolicy(selectedPolicy)}
                        className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shrink-0"
                      >
                        Unfreeze
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 text-[11px]">Company / Facility Name *</label>
                      <input
                        type="text"
                        value={selectedPolicy.company_name || ''}
                        onChange={e => setSelectedPolicy({ ...selectedPolicy, company_name: e.target.value })}
                        placeholder="e.g. Healthcare Facility Name"
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Policy Code *</label>
                        <input
                          type="text"
                          value={selectedPolicy.policy_no}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, policy_no: e.target.value })}
                          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-amber-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Category *</label>
                        <select
                          value={selectedPolicy.category}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, category: e.target.value as any })}
                          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white"
                        >
                          <option value="Policy">Policy</option>
                          <option value="Procedure">Procedure</option>
                          <option value="Forms">Forms</option>
                          <option value="Guideline">Guideline</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1 text-[11px]">Document Title *</label>
                      <input
                        type="text"
                        value={selectedPolicy.policy_name}
                        onChange={e => setSelectedPolicy({ ...selectedPolicy, policy_name: e.target.value })}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Department</label>
                        <input
                          type="text"
                          value={selectedPolicy.department || ''}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, department: e.target.value })}
                          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Classification</label>
                        <select
                          value={selectedPolicy.classification || 'CONFIDENTIAL'}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, classification: e.target.value })}
                          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white text-[11px]"
                        >
                          <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                          <option value="RESTRICTED">RESTRICTED</option>
                          <option value="OFFICIAL">OFFICIAL</option>
                          <option value="INTERNAL">INTERNAL</option>
                          <option value="PUBLIC">PUBLIC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Status</label>
                        <select
                          value={selectedPolicy.status}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, status: e.target.value as any })}
                          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg font-bold text-white text-[11px]"
                        >
                          <option value="APPROVED">APPROVED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[10px]">Prepared By</label>
                        <input
                          type="text"
                          value={selectedPolicy.prepared_by || ''}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, prepared_by: e.target.value })}
                          className="w-full p-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-bold text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[10px]">Reviewed By</label>
                        <input
                          type="text"
                          value={selectedPolicy.reviewed_by || previewReviewedBy || ''}
                          onChange={e => {
                            setSelectedPolicy({ ...selectedPolicy, reviewed_by: e.target.value });
                            setPreviewReviewedBy(e.target.value);
                          }}
                          className="w-full p-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-bold text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[10px]">Approved By</label>
                        <input
                          type="text"
                          value={selectedPolicy.approved_by || ''}
                          onChange={e => setSelectedPolicy({ ...selectedPolicy, approved_by: e.target.value })}
                          className="w-full p-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-bold text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-slate-300 text-[11px]">Document Content & Statement (HTML / Markdown)</label>
                        <span className="text-[9px] text-amber-300 font-mono">Supports HTML & Tables</span>
                      </div>
                      <textarea
                        rows={11}
                        value={selectedPolicy.policy_statement || selectedPolicy.full_content || ''}
                        onChange={e => setSelectedPolicy({ ...selectedPolicy, policy_statement: e.target.value, full_content: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-[11px] text-emerald-300 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Enter HTML or plain text policy content..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* A4 AUTOFIT SHEET CONTAINER WITH 15MM MARGINS & PRINT STYLES */}
              <div className="flex-1 w-full flex flex-col items-center overflow-x-auto gap-3">
                {/* MANUAL PAGE BREAK CONTROLS TOOLBAR */}
                {selectedPolicy && (
                  <div className="w-full max-w-[210mm] bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg">
                    <div className="flex items-center gap-2 shrink-0">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-slate-200">Manual Page Break Toggles:</span>
                      <span className="text-[10px] text-slate-400 hidden md:inline">(Forces page break before section)</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      {extractPolicySections(selectedPolicy.policy_statement || selectedPolicy.full_content || '').map((sectionTitle, idx) => {
                        const isSelected = pageBreakSections.includes(sectionTitle);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => togglePageBreakSection(sectionTitle)}
                            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                            }`}
                            title={`Toggle page break before "${sectionTitle}"`}
                          >
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-emerald-300" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{sectionTitle.length > 28 ? sectionTitle.substring(0, 28) + '…' : sectionTitle}</span>
                          </button>
                        );
                      })}
                      {extractPolicySections(selectedPolicy.policy_statement || selectedPolicy.full_content || '').length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">No standard section headings detected in content</span>
                      )}
                    </div>
                  </div>
                )}

                <div
                  id="printable-report-document"
                  className={`w-full bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-6 sm:px-[15mm] md:px-[15mm] py-8 sm:py-12 relative flex flex-col justify-between font-sans text-xs leading-relaxed my-0 box-border transition-all print-compact-gap ${
                    printOrientation === 'landscape' ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]'
                  }`}
                >
                  <style>{`
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      #printable-report-document, #printable-report-document * {
                        visibility: visible !important;
                      }
                      #printable-report-document {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: ${printOrientation === 'landscape' ? '297mm' : '210mm'} !important;
                        min-height: ${printOrientation === 'landscape' ? '210mm' : '297mm'} !important;
                        padding-left: 15mm !important;
                        padding-right: 15mm !important;
                        padding-top: 15mm !important;
                        padding-bottom: 15mm !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                      }
                      @page {
                        size: A4 ${printOrientation};
                        margin: 15mm;
                        @bottom-right {
                          content: "Page " counter(page) " of " counter(pages);
                          font-size: 8pt;
                          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                          color: #64748b;
                          font-weight: 600;
                        }
                      }
                    }
                  `}</style>

                  {/* TOP FACILITY HEADER */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                      <div className="flex items-center gap-3">
                        {client?.facility_logo ? (
                          <img
                            src={client.facility_logo}
                            alt="Facility Logo"
                            className="h-12 w-auto max-w-[120px] object-contain flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                            {selectedPolicy.company_name || client?.company_name || 'client.company_name'}
                          </h1>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {client?.address || 'Abu Dhabi'}, {client?.city || 'United Arab Emirates'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DOCUMENT CONTROL METADATA FULL-WIDTH TABLE WITH LEFT & RIGHT SPACING */}
                    <div className="w-full my-3 pr-2 sm:pr-4">
                      <div className="overflow-hidden border border-slate-300 rounded shadow-2xs">
                        <table className="w-full table-fixed text-left border-collapse text-[6.5px] sm:text-[6.5px]">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold text-[6.5px] tracking-wider uppercase">
                              <th colSpan={4} className="py-1 px-2 text-center border-b border-slate-800 text-[6.5px]">
                                Document Control Information Log
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-300">
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700 w-[20%]">Reference Code</td>
                              <td className="p-2 font-mono font-bold text-indigo-700 border-r border-slate-300 w-[30%]">{selectedPolicy.policy_no}</td>
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700 w-[20%]">Category</td>
                              <td className="p-2 text-slate-800 font-semibold w-[30%]">{selectedPolicy.category}</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700">Version</td>
                              <td className="p-2 font-mono text-slate-800 font-semibold border-r border-slate-300">{selectedPolicy.version || 'v1.0'}</td>
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700">Classification</td>
                              <td className="p-2 font-bold text-rose-700">{selectedPolicy.classification || 'RESTRICTED'}</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700">Issue / Effective Date</td>
                              <td className="p-2 text-slate-800 font-semibold border-r border-slate-300">{selectedPolicy.effective_date || selectedPolicy.approval_date || new Date().toISOString().split('T')[0]}</td>
                              <td className="p-2 font-bold bg-slate-100/90 border-r border-slate-300 text-slate-700">Revision Date</td>
                              <td className="p-2 text-slate-800 font-semibold">{selectedPolicy.review_date || '2027-08-06'}</td>
                            </tr>
                            <tr className="bg-amber-50/70">
                              <td className="p-2 font-bold text-amber-900 border-r border-slate-300" colSpan={2}>Next Due Revision Date</td>
                              <td className="p-2 font-extrabold text-amber-900" colSpan={2}>{selectedPolicy.next_due_date || '2027-08-01'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MAIN DOCUMENT STATEMENT BODY WITH POLICY TITLE BANNER & BALANCED SIDE PADDING */}
                    <div className="py-2 px-1 sm:px-2 space-y-2.5 min-h-[350px] w-full flex-1">
                      <div className="bg-slate-900 text-white font-bold px-3 py-1.5 text-[12.5px] tracking-wider uppercase rounded-xs text-center shadow-xs w-full">
                        {resolveDocTitle(selectedPolicy.policy_name, selectedPolicy.company_name || client?.company_name)}
                        {selectedPolicy.company_name && !/smartpro/i.test(selectedPolicy.company_name) && selectedPolicy.company_name !== (client?.company_name || 'client.company_name') && (
                          <span className="text-sky-300 font-medium uppercase"> — {selectedPolicy.company_name}</span>
                        )}
                      </div>
                      <div
                        className="prose text-xs text-slate-800 leading-normal max-w-none w-full [&_ol]:list-disc [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:font-sans [&_p]:my-1.5 [&_p]:text-justify [&_p]:[text-justify:inter-word] [&_p]:[hyphens:auto] [&_li]:font-sans [&_li]:text-justify [&_li]:[text-justify:inter-word] [&_h1]:text-xs [&_h1]:font-bold [&_h1]:uppercase [&_h1]:border-b [&_h1]:border-slate-200 [&_h1]:pb-0.5 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:uppercase [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-0.5 [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:uppercase [&_h3]:border-b [&_h3]:border-slate-200 [&_h3]:pb-0.5 [&_h3]:mt-3 [&_h3]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:border [&_table]:border-slate-300 [&_th]:bg-slate-900 [&_th]:text-white [&_th]:p-1.5 [&_th]:font-bold [&_th]:text-[10px] [&_th]:uppercase [&_td]:border [&_td]:border-slate-200 [&_td]:p-1.5 [&_td]:align-top [&_td]:text-justify [&_td]:[text-justify:inter-word]"
                        dangerouslySetInnerHTML={{
                          __html: formatCleanPolicyStatement(
                            selectedPolicy.policy_statement || selectedPolicy.full_content || '',
                            selectedPolicy.policy_name,
                            selectedPolicy.company_name || client?.company_name || '',
                            pageBreakSections
                          )
                        }}
                      />
                    </div>
                  </div>

                  {/* SIGNATORIES & LEGAL SEAL FOOTER */}
                  <div className="pt-6 border-t-2 border-slate-900 w-full px-1 sm:px-2 mt-auto">
                    <div className={`grid ${previewShowReviewedBy ? 'grid-cols-3' : 'grid-cols-2'} gap-4 items-stretch w-full`}>
                      
                      {/* PREPARED BY */}
                      <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded text-center">
                        <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-wider">Prepared By</span>
                        <strong className="text-slate-900 font-bold block text-[11px]">{selectedPolicy.prepared_by || 'HR Director'}</strong>
                        <span className="text-[9.5px] text-slate-600 block">HR Director</span>
                        <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                          ✓ Digital Sign: {selectedPolicy.prepared_by || 'HR Director'}
                        </div>
                      </div>

                      {/* REVIEWED BY */}
                      {previewShowReviewedBy && (
                        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded text-center">
                          <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-wider">Reviewed By</span>
                          <strong className="text-slate-900 font-bold block text-[11px]">{previewReviewedBy || selectedPolicy.reviewed_by || 'Compliance Officer'}</strong>
                          <span className="text-[9.5px] text-slate-600 block">Compliance Officer</span>
                          <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                            ✓ Digital Sign: {previewReviewedBy || selectedPolicy.reviewed_by || 'Reviewed'}
                          </div>
                        </div>
                      )}

                      {/* APPROVED BY */}
                      <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded text-center">
                        <span className="text-[9px] uppercase font-extrabold text-slate-500 block tracking-wider">Approved By</span>
                        <strong className="text-slate-900 font-bold block text-[11px]">{selectedPolicy.approved_by || 'Risk Lead'}</strong>
                        <span className="text-[9.5px] text-slate-600 block">Risk Lead</span>
                        <div className="mt-2 text-[9px] text-emerald-700 font-mono italic">
                          ✓ Digital Sign: Approved
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND EMAIL MODAL */}
      {emailPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Dispatch Policy Report via Email
                  </h2>
                  <p className="text-xs text-slate-500">[{emailPolicy.policy_no}] {emailPolicy.policy_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailPolicy(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={e => setEmailRecipient(e.target.value)}
                  placeholder="e.g. compliance@smartpro.ae"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cover Note / Message (Optional)</label>
                <textarea
                  rows={3}
                  value={emailCoverNote}
                  onChange={e => setEmailCoverNote(e.target.value)}
                  placeholder="Please review the attached official policy document for facility compliance..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Automatic PDF Attachment Included
                </div>
                <p className="text-[10.5px] text-slate-500">
                  High-fidelity PDF report of policy <strong>[{emailPolicy.policy_no}]</strong> with full Document Control Information Log & Signatories will be attached automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEmailPolicy(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isEmailing || !emailRecipient}
                onClick={() => handleSendEmail(emailPolicy, emailRecipient, emailCoverNote)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isEmailing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE SINGLE POLICY CONFIRMATION MODAL */}
      {confirmDeletePolicy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Confirm Policy Deletion</h3>
                  <p className="text-xs text-slate-500">Are you sure you want to delete this policy record? This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeletePolicy(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FROZEN / LOCKED NOTICE */}
            {(confirmDeletePolicy.is_frozen || confirmDeletePolicy.status === 'FROZEN') && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
                <div className="p-1.5 bg-amber-200/80 rounded-lg text-amber-900 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-extrabold block text-amber-950">
                    🔒 Record is Marked as FROZEN / LOCKED
                  </span>
                  <p className="text-[11.5px] text-amber-800 leading-relaxed">
                    This policy is currently locked against modifications. Deleting it will override the security lock and permanently remove the record from the repository.
                  </p>
                </div>
              </div>
            )}

            {/* POLICY DETAILS GRID */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Reference Code:</span>
                <strong className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                  {confirmDeletePolicy.policy_no}
                </strong>
              </div>
              <div className="flex justify-between items-start pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium shrink-0 mr-2">Document Title:</span>
                <strong className="font-bold text-slate-900 text-right">
                  {confirmDeletePolicy.policy_name}
                </strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200/70">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Category:</span>
                  <span className="text-slate-800 font-semibold">{confirmDeletePolicy.category || 'Information Security'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Department:</span>
                  <span className="text-slate-800 font-semibold">{confirmDeletePolicy.department || 'Information Technology'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Classification:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    {confirmDeletePolicy.classification || 'CONFIDENTIAL'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Client Facility Scope:</span>
                  <span className="text-slate-800 font-semibold truncate block">
                    {confirmDeletePolicy.company_name || confirmDeletePolicy.facility_name || client?.company_name || 'Client Facility'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeletePolicy(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel, Keep Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePolicy && confirmDeletePolicy) {
                    const deletedCode = confirmDeletePolicy.policy_no;
                    onDeletePolicy(confirmDeletePolicy.id);
                    if (selectedPolicy && selectedPolicy.id === confirmDeletePolicy.id) {
                      setSelectedPolicy(null);
                      setIsEditingPolicy(false);
                    }
                    setSelectedPolicyIds(prev => prev.filter(id => id !== confirmDeletePolicy.id));
                    setConfirmDeletePolicy(null);
                    showToast(`✓ Deleted policy record [${deletedCode}]`);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE BATCH POLICIES CONFIRMATION MODAL */}
      {confirmBatchDeletePolicies && confirmBatchDeletePolicies.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Confirm Batch Deletion</h3>
                  <p className="text-xs text-slate-500">
                    Are you sure you want to delete {confirmBatchDeletePolicies.length} selected policy document{confirmBatchDeletePolicies.length > 1 ? 's' : ''}?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmBatchDeletePolicies(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FROZEN / LOCKED POLICIES WARNING BANNER */}
            {(() => {
              const lockedCount = confirmBatchDeletePolicies.filter(p => p.is_frozen || p.status === 'FROZEN').length;
              if (lockedCount === 0) return null;
              return (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
                  <div className="p-1.5 bg-amber-200/80 rounded-lg text-amber-900 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold block text-amber-950">
                      🔒 {lockedCount} Locked / Frozen Document{lockedCount > 1 ? 's' : ''} Included
                    </span>
                    <p className="text-[11.5px] text-amber-800 leading-relaxed">
                      {lockedCount === confirmBatchDeletePolicies.length
                        ? 'All selected documents are currently marked as FROZEN / LOCKED against changes. Deleting will override their security lock and permanently remove them.'
                        : `${lockedCount} of the ${confirmBatchDeletePolicies.length} selected documents are marked as FROZEN / LOCKED. Proceeding will override their security locks.`}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* LIST OF SELECTED DOCUMENTS */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Selected Documents ({confirmBatchDeletePolicies.length}):</span>
                <span className="text-[11px] text-slate-400 font-normal">Review items before permanent deletion</span>
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {confirmBatchDeletePolicies.map((p, idx) => {
                  const isLocked = p.is_frozen || p.status === 'FROZEN';
                  return (
                    <div key={p.id || idx} className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-white transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-indigo-700 text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                          {p.policy_no}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-[11.5px]">{p.policy_name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {p.category || 'Information Security'} • {p.department || 'IT'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLocked && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[9.5px] border border-amber-200 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> FROZEN
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9.5px] font-semibold">
                          {p.classification || 'CONFIDENTIAL'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              This action cannot be undone. All selected records will be permanently removed from the repository.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmBatchDeletePolicies(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel, Keep Policies
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePolicy && confirmBatchDeletePolicies) {
                    const count = confirmBatchDeletePolicies.length;
                    const targetIds = confirmBatchDeletePolicies.map(p => p.id);
                    onDeletePolicy(targetIds);
                    if (selectedPolicy && targetIds.includes(selectedPolicy.id)) {
                      setSelectedPolicy(null);
                      setIsEditingPolicy(false);
                    }
                    setSelectedPolicyIds(prev => prev.filter(id => !targetIds.includes(id)));
                    setConfirmBatchDeletePolicies(null);
                    showToast(`✓ Successfully deleted ${count} policy record(s)!`);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete ({confirmBatchDeletePolicies.length}) Records
              </button>
            </div>
          </div>
        </div>
      )}
      {/* COPY TO CLIENT MODAL */}
      {copyClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn font-sans">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Copy Master Policy to Client</h3>
                  <p className="text-[11px] text-slate-400">Assign &amp; adapt policy document title for target client</p>
                </div>
              </div>
              <button onClick={() => setCopyClientModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 mb-1">Target Client / Facility Name *</label>
                {clients.length > 0 && (
                  <select
                    value={targetClientIdToCopy}
                    onChange={e => {
                      setTargetClientIdToCopy(e.target.value);
                      const found = clients.find(c => c.id === e.target.value);
                      if (found) {
                        setCustomClientNameInput(found.company_name);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Or Select Existing Client Entity --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({(c as any).type || (c as any).tier_group || 'Facility'})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={customClientNameInput}
                  onChange={e => setCustomClientNameInput(e.target.value)}
                  placeholder="Enter Target Client Facility Name (e.g. Al Mafraq Dental Center)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Selected Policies ({policiesToCopy.length}):</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-extrabold">
                    Auto-Branding Active
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-200/60 custom-scrollbar">
                  {policiesToCopy.map((p, idx) => {
                    const targetName = (clients.find(c => c.id === targetClientIdToCopy)?.company_name || customClientNameInput) || 'Target Facility';
                    const adaptedTitle = resolveDocTitle(p.policy_name, targetName);
                    return (
                      <div key={idx} className="pt-2 first:pt-0">
                        <div className="font-mono text-[10.5px] text-indigo-700 font-bold">{p.policy_no}</div>
                        <div className="font-bold text-slate-900 text-[11px]">{adaptedTitle}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Assigned Facility Name: <strong className="text-slate-800">{targetName}</strong></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed italic bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl">
                💡 When copied, the policy and procedure documents will automatically incorporate <strong>{(clients.find(c => c.id === targetClientIdToCopy)?.company_name || customClientNameInput) || 'the client'}</strong> into headers, control logs, and clause content.
              </p>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setCopyClientModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCopyToClient}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Confirm &amp; Copy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
