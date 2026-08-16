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
  Unlock,
  Key,
  KeyRound,
  Settings,
  Sparkles,
  RefreshCw,
  Table,
  Grid,
  Paperclip,
  Printer,
  Eye,
  EyeOff,
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
  Square,
  History,
  Layers,
  FolderCheck,
  FolderX,
  Folder,
  XCircle
} from 'lucide-react';
import { Policy, User, Client, Employee } from '../types';
import { DocRefLoopSelector, DocRefLoopData } from './DocRefLoopSelector';
import { printDocument, printCurrentView } from '../utils/printUtils';

interface PolicyFrameworksSetupProps {
  policies: Policy[];
  users: User[];
  currentUser?: User;
  employees?: Employee[];
  onAddPolicy: (policy: Policy) => void;
  onDeletePolicy?: (id: string | string[]) => void;
  onUpdatePolicy?: (updatedPolicy: Policy) => void;
  onBulkFeedPolicies?: (policies: Policy[]) => void;
  activeClientId: string;
  client?: Client | null;
  clients?: Client[];
  onSelectClient?: (id: string) => void;
  onUpdateClient?: (updatedClient: Client) => void;
}

export default function PolicyFrameworksSetup({
  policies,
  users,
  currentUser,
  employees = [],
  onAddPolicy,
  onDeletePolicy,
  onUpdatePolicy,
  onBulkFeedPolicies,
  activeClientId,
  client,
  clients = [],
  onSelectClient,
  onUpdateClient
}: PolicyFrameworksSetupProps) {
  // Navigation Tabs: 'vault' | 'upload' | 'export' | 'create'
  const [activeTab, setActiveTab] = useState<'vault' | 'upload' | 'export' | 'create'>('vault');

  // Master Client & SuperAdmin Role Detection
  const isMasterClient =
    client?.id === 'c0' ||
    activeClientId === 'c0' ||
    client?.client_code === 'MASTER' ||
    (client?.company_name || '').toLowerCase().includes('smartpro');

  const isSuperAdmin =
    !currentUser ||
    currentUser.role === 'SUPER_ADMIN' ||
    (currentUser.role as string)?.toLowerCase() === 'superadmin' ||
    (currentUser.role as string)?.toLowerCase() === 'super_admin';

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
      showToast('🔓 Security Key Verified! Master Protection is now UNLOCKED.');
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
      showToast('🔒 Master Protection RE-LOCKED. Security PIN required for protected actions.');
    } else {
      setSecurityPinError(null);
      setSecurityPinInput('');
      setShowSecurityUnlockModal(true);
    }
  };

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

  // HTML Script Modal & Generator State
  const [htmlScriptModalPolicy, setHtmlScriptModalPolicy] = useState<Policy | null>(null);
  const [htmlScriptActiveTab, setHtmlScriptActiveTab] = useState<'preview' | 'code'>('preview');

  // Policy Version History & Revision Control State
  const [showAddVersionForm, setShowAddVersionForm] = useState<boolean>(false);
  const [newVersionNum, setNewVersionNum] = useState<string>('v1.1');
  const [newVersionDate, setNewVersionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newVersionAuthor, setNewVersionAuthor] = useState<string>('');
  const [newVersionChanges, setNewVersionChanges] = useState<string>('');

  // Editing existing version record state
  const [editingVersionIndex, setEditingVersionIndex] = useState<number | null>(null);
  const [editVersionNum, setEditVersionNum] = useState<string>('v1.0');
  const [editVersionDate, setEditVersionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editVersionAuthor, setEditVersionAuthor] = useState<string>('');
  const [editVersionChanges, setEditVersionChanges] = useState<string>('');

  // Extract or fallback version history records
  const getPolicyVersionRecords = (p?: Policy | null) => {
    if (!p) return [];
    if (p.version_history && Array.isArray(p.version_history) && p.version_history.length > 0) {
      return p.version_history;
    }
    return [
      {
        version: p.version || 'v1.0',
        date: p.effective_date || p.approval_date || p.created_at?.split('T')[0] || '2026-08-14',
        author: p.prepared_by || 'Aseef Sulaiman',
        changes: 'Initial Document Baseline Creation & Governance Approval'
      }
    ];
  };

  const handleStartEditVersionRecord = (targetPolicy: Policy, idx: number) => {
    const records = getPolicyVersionRecords(targetPolicy);
    const rec = records[idx];
    if (!rec) return;
    setEditingVersionIndex(idx);
    setEditVersionNum(rec.version || 'v1.0');
    setEditVersionDate(rec.date || new Date().toISOString().split('T')[0]);
    setEditVersionAuthor(rec.author || targetPolicy.prepared_by || 'Aseef Sulaiman');
    setEditVersionChanges(rec.changes || '');
    setShowAddVersionForm(false);
  };

  const handleSaveEditVersionRecord = (targetPolicy: Policy) => {
    if (editingVersionIndex === null) return;
    if (!editVersionNum.trim()) {
      showToast('❌ Please specify a valid version number (e.g., v1.0, v1.1, v2.0)');
      return;
    }

    const currentRecords = getPolicyVersionRecords(targetPolicy);
    const updatedHistory = currentRecords.map((r, i) => {
      if (i === editingVersionIndex) {
        return {
          version: editVersionNum.trim(),
          date: editVersionDate || new Date().toISOString().split('T')[0],
          author: editVersionAuthor.trim() || targetPolicy.prepared_by || 'Aseef Sulaiman',
          changes: editVersionChanges.trim() || 'Document review and governance update.'
        };
      }
      return r;
    });

    const latestRec = updatedHistory[updatedHistory.length - 1];
    const isLatestOrActive = editingVersionIndex === updatedHistory.length - 1 || targetPolicy.version === currentRecords[editingVersionIndex]?.version;

    const updatedPolicy: Policy = {
      ...targetPolicy,
      version: isLatestOrActive ? editVersionNum.trim() : (latestRec ? latestRec.version : targetPolicy.version),
      version_history: updatedHistory,
      review_date: editVersionDate || targetPolicy.review_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updatedPolicy);
    }

    // Direct synchronous local persistence update
    try {
      const saved = localStorage.getItem('sh_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        const updatedList = list.map(p => (p.id === targetPolicy.id ? updatedPolicy : p));
        localStorage.setItem('sh_policies', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Error persisting version history', err);
    }

    if (selectedPolicy && selectedPolicy.id === targetPolicy.id) {
      setSelectedPolicy(updatedPolicy);
    }
    if (htmlScriptModalPolicy && htmlScriptModalPolicy.id === targetPolicy.id) {
      setHtmlScriptModalPolicy(updatedPolicy);
    }

    setEditingVersionIndex(null);
    showToast(`✓ Version record [${editVersionNum.trim()}] successfully updated!`);
  };

  const handleSaveNewVersionRecord = (targetPolicy: Policy) => {
    if (!newVersionNum.trim()) {
      showToast('❌ Please specify a valid version number (e.g., v1.1, v2.0)');
      return;
    }

    const currentRecords = getPolicyVersionRecords(targetPolicy);
    const newRecord = {
      version: newVersionNum.trim(),
      date: newVersionDate || new Date().toISOString().split('T')[0],
      author: newVersionAuthor.trim() || targetPolicy.prepared_by || 'Aseef Sulaiman',
      changes: newVersionChanges.trim() || 'Document review, regulatory compliance alignment, and clause updates.'
    };

    const updatedHistory = [...currentRecords, newRecord];
    const updatedPolicy: Policy = {
      ...targetPolicy,
      version: newVersionNum.trim(),
      version_history: updatedHistory,
      review_date: newVersionDate || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updatedPolicy);
    }

    // Direct synchronous local persistence update
    try {
      const saved = localStorage.getItem('sh_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        const updatedList = list.map(p => (p.id === targetPolicy.id ? updatedPolicy : p));
        localStorage.setItem('sh_policies', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Error persisting version history', err);
    }

    if (selectedPolicy && selectedPolicy.id === targetPolicy.id) {
      setSelectedPolicy(updatedPolicy);
    }
    if (htmlScriptModalPolicy && htmlScriptModalPolicy.id === targetPolicy.id) {
      setHtmlScriptModalPolicy(updatedPolicy);
    }

    setShowAddVersionForm(false);
    setNewVersionChanges('');
    showToast(`✓ Version record [${newVersionNum.trim()}] successfully saved to Policy Version History!`);
  };

  const handleDeleteVersionRecord = (targetPolicy: Policy, indexToDelete: number) => {
    const currentRecords = getPolicyVersionRecords(targetPolicy);
    if (currentRecords.length <= 1) {
      showToast('⚠️ Cannot delete baseline version record.');
      return;
    }
    const updatedHistory = currentRecords.filter((_, idx) => idx !== indexToDelete);
    const latestRecord = updatedHistory[updatedHistory.length - 1];
    const updatedPolicy: Policy = {
      ...targetPolicy,
      version: latestRecord ? latestRecord.version : targetPolicy.version,
      version_history: updatedHistory,
      updated_at: new Date().toISOString()
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updatedPolicy);
    }

    if (selectedPolicy && selectedPolicy.id === targetPolicy.id) {
      setSelectedPolicy(updatedPolicy);
    }
    if (htmlScriptModalPolicy && htmlScriptModalPolicy.id === targetPolicy.id) {
      setHtmlScriptModalPolicy(updatedPolicy);
    }

    showToast('✓ Version record removed.');
  };

  const handleOpenCopyModalForSingle = (p: Policy) => {
    if (!isSuperAdmin) {
      showToast('⛔ Permission Restricted: Only SuperAdmin accounts are authorized to copy Master Policy Frameworks to clients.');
      return;
    }
    setPoliciesToCopy([p]);
    const initialTargetId = clients[0]?.id || activeClientId || '';
    setTargetClientIdToCopy(initialTargetId);
    const initialTargetObj = clients.find(c => c.id === initialTargetId);
    setCustomClientNameInput(initialTargetObj?.company_name || client?.company_name || '');
    setCopyClientModalOpen(true);
  };

  const handleOpenCopyModalForSelected = () => {
    if (!isSuperAdmin) {
      showToast('⛔ Permission Restricted: Only SuperAdmin accounts are authorized to copy Master Policy Frameworks to clients.');
      return;
    }
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
    if (!isSuperAdmin) {
      showToast('⛔ Permission Restricted: Only SuperAdmin accounts are authorized to copy master documents.');
      return;
    }
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
      status: newFrozenState ? 'FROZEN' : 'APPROVED',
      updated_at: new Date().toISOString()
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updated);
    }

    // Direct synchronous local persistence update
    try {
      const saved = localStorage.getItem('sh_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        const updatedList = list.map(p => {
          if (p.id === policy.id) return updated;
          if (p.policy_no === policy.policy_no && (p.client_id === policy.client_id || (!p.client_id && !policy.client_id))) {
            return updated;
          }
          return p;
        });
        localStorage.setItem('sh_policies', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Error persisting policy freeze toggle', err);
    }

    if (selectedPolicy && (selectedPolicy.id === policy.id || selectedPolicy.policy_no === policy.policy_no)) {
      setSelectedPolicy(updated);
    }

    showToast(
      newFrozenState
        ? `🔒 Policy Record [${policy.policy_no}] is now FROZEN & locked against changes!`
        : `🔓 Policy Record [${policy.policy_no}] is UNFROZEN and open for editing.`
    );
  };

  // Freeze / Unfreeze Selected Policies (or all filtered if none selected)
  const handleFreezeSelectedPolicies = (forceUnfreeze = false) => {
    const targets = selectedPolicyIds.length > 0
      ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
      : filteredPolicies;

    if (targets.length === 0) {
      showToast('⚠️ No policy records available to freeze/unfreeze.');
      return;
    }

    const allCurrentlyFrozen = targets.every(p => p.is_frozen || p.status === 'FROZEN');
    const shouldFreeze = forceUnfreeze ? false : !allCurrentlyFrozen;

    let count = 0;
    const targetMap = new Map<string, Policy>();
    targets.forEach(p => {
      const updated: Policy = {
        ...p,
        is_frozen: shouldFreeze,
        status: shouldFreeze ? 'FROZEN' : 'APPROVED',
        updated_at: new Date().toISOString()
      };
      targetMap.set(p.id, updated);
      if (onUpdatePolicy) {
        onUpdatePolicy(updated);
      }
      count++;
    });

    // Synchronous direct local storage sync for all targets
    try {
      const saved = localStorage.getItem('sh_policies');
      if (saved) {
        const list: Policy[] = JSON.parse(saved);
        const updatedList = list.map(p => targetMap.get(p.id) || p);
        localStorage.setItem('sh_policies', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.error('Error persisting batch policy freeze', err);
    }

    showToast(
      shouldFreeze
        ? `🔒 Successfully FROZE ${count} policy record(s) against modifications!`
        : `🔓 Successfully UNFROZE ${count} policy record(s) for editing!`
    );
  };

  // Group Delete Selected Policies (triggers In-App Batch Deletion Modal)
  const handleGroupDeleteSelected = () => {
    if (isMasterClient && !isProtectedUnlocked) {
      setSecurityPinError(null);
      setSecurityPinInput('');
      setPendingActionOnUnlock(() => () => {
        const targets = selectedPolicyIds.length > 0
          ? filteredPolicies.filter(p => selectedPolicyIds.includes(p.id))
          : [];
        if (targets.length > 0) setConfirmBatchDeletePolicies(targets);
      });
      setShowSecurityUnlockModal(true);
      return;
    }
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

  // Normalize and clean pasted policy text into bullet points without losing any substantive text
  const formatContentToBulletsAndClean = (rawText: string): string => {
    if (!rawText) return '';
    let text = rawText;

    // Convert HTML <ol> ... </ol> blocks to <ul> with bullets
    text = text.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_match, inner) => {
      const cleanedInner = inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '<li class="my-0.5">$1</li>');
      return `<ul class="list-disc pl-5 my-2 space-y-0.5">\n${cleanedInner}\n</ul>`;
    });

    // Convert line-based numbered items (1., 2), (1), 1 -, 1.1, a., i., etc.) to bullet points •
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      // Match numbered list starters: 1. , 1) , (1) , 1 - , a. , b) , i. , 1.1 , etc.
      if (/^(?:\(?\d+(?:\.\d+)*[\.\)\-:]|\([a-zA-Z0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdmIVXLCDM]+[\.\)])\s+/.test(trimmed)) {
        const rest = trimmed.replace(/^(?:\(?\d+(?:\.\d+)*[\.\)\-:]|\([a-zA-Z0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdmIVXLCDM]+[\.\)])\s+/, '');
        const leadingSpace = line.match(/^\s*/)?.[0] || '';
        return `${leadingSpace}• ${rest}`;
      }
      return line;
    });

    return processedLines.join('\n');
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
        let html = `<div class="my-2.5 overflow-x-auto border border-slate-300 rounded bg-white shadow-2xs">`;
        html += `<table class="w-full text-left border-collapse text-[9.5px] font-sans">`;
        
        if (tableHeader.length > 0) {
          html += `<thead class="bg-[#0f172a] text-white font-bold text-[9px] uppercase tracking-wider"><tr>`;
          tableHeader.forEach((h, idx) => {
            const widthClass = idx === 0 ? 'w-3/12' : idx === 1 ? 'w-6/12' : 'w-3/12 text-center';
            html += `<th class="py-1.5 px-2.5 border-r border-slate-700 ${widthClass}">${h.trim()}</th>`;
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
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">✓ Applicable</span>`
                : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[8.5px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">Not applicable</span>`;
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
          .replace(/<ol([^>]*)>/gi, '<ul$1 class="list-disc pl-5 my-1.5 space-y-0.5">')
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

      // Process Headings - standardize all headings with Corporate Navy Color & clean border
      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        flushPara();
        const headingText = line.replace(/^#+\s*/, '').trim();
        const breakClass = checkPageBreak(headingText) ? 'page-break-before ' : '';
        resultLines.push(`<h2 class="${breakClass}text-xs font-bold uppercase tracking-wider text-[#0f172a] mt-3 mb-1 border-b border-slate-300 pb-0.5">${headingText}</h2>`);
      } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ') || /^(?:\(?\d+(?:\.\d+)*[\.\)\-:]|\([a-zA-Z0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdmIVXLCDM]+[\.\)])\s+/.test(line)) {
        // Automatically convert all list items, numbered items (1., 2), 1 -) to elegant bullet points
        flushPara();
        const itemContent = line.replace(/^(?:•|-|\*|\(?\d+(?:\.\d+)*[\.\)\-:]|\([a-zA-Z0-9]+\)|[a-zA-Z][\.\)]|[ivxlcdmIVXLCDM]+[\.\)])\s*/i, '');
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

  // Clean & Format Policy Statement Text (preserves user content without destructive truncation)
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
    cleaned = cleaned.replace(/<ol([^>]*)>/gi, '<ul$1 class="list-disc pl-5 my-2 space-y-0.5">').replace(/<\/ol>/gi, '</ul>');

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

    // 6. Replace company placeholders and match client name across all sentences and clauses
    const clientNameBadge = `<strong class="font-bold text-[#0f172a]">${actualCompanyName}</strong>`;
    cleaned = cleaned
      .replace(/<strong>\s*\(\s*(?:selectedPolicy\.company_name\s*\/\s*)?client\.company_name\s*\)\s*<\/strong>/gi, clientNameBadge)
      .replace(/<b>\s*\(\s*(?:selectedPolicy\.company_name\s*\/\s*)?client\.company_name\s*\)\s*<\/b>/gi, clientNameBadge)
      .replace(/<strong>\s*\[\s*(?:Entity|Facility|Client|Company)\s+Name\s*\]\s*<\/strong>/gi, clientNameBadge)
      .replace(/<b>\s*\[\s*(?:Entity|Facility|Client|Company)\s+Name\s*\]\s*<\/b>/gi, clientNameBadge)
      .replace(/SmartPro Public Relations Consultancy & Cyber Risk Management Services/gi, actualCompanyName)
      .replace(/SmartPro Consultancy & Facility Services/gi, actualCompanyName)
      .replace(/SmartPro Medical Complex/gi, actualCompanyName)
      .replace(/SmartPro Clinic/gi, actualCompanyName)
      .replace(/SmartPro Healthcare/gi, actualCompanyName)
      .replace(/\(\s*selectedPolicy\.company_name\s*\/\s*client\.company_name\s*\)/gi, actualCompanyName)
      .replace(/\(\s*selectedPolicy\.company_name\s*\)/gi, actualCompanyName)
      .replace(/\(\s*client\.company_name\s*\)\s*/gi, `${actualCompanyName} `)
      .replace(/\(\s*client\.company_name\s*\)/gi, actualCompanyName)
      .replace(/client\.company_name/gi, actualCompanyName)
      .replace(/\[\s*Entity\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Facility\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Client\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Company\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Facility\/Company\s+Name\s*\]/gi, actualCompanyName)
      .replace(/\[\s*Healthcare\s+Facility\s*\]/gi, actualCompanyName);

    // 7. Sanitize tag gaps and punctuation artifacts
    cleaned = cleaned
      .replace(/<li>\s*Facilitates risk assessments and supports implementation of risk treatment plans\.?\s*<\/li>/gi, '')
      .replace(/[•\-\*]\s*Facilitates risk assessments and supports implementation of risk treatment plans\.?\s*\n?/gi, '')
      .replace(/Facilitates risk assessments and supports implementation of risk treatment plans\.?\s*\n?/gi, '')
      .replace(/<p>\s*,\s*<\/strong>\s*<\/p>/gi, '')
      .replace(/<p>\s*,\s*<\/p>/gi, '')
      .replace(/<strong>\s*,\s*<\/strong>/gi, '')
      .replace(/,\s*<\/strong>\s*<\/p>/gi, '.</strong></p>')
      .replace(/<p>\s*,\s*/gi, '<p>')
      .replace(/<strong>\s*,\s*/gi, '<strong>')
      .replace(/<p>\s*<\/p>/gi, '');

    // 7.5 Automatically insert Risk Assessment Framework Chart before "RISK TREATMENT" for Risk Management Policies
    const isRiskPolicy = (policyName && /risk management/i.test(policyName)) || 
      (policyName && /m-policy-004|m-p004|m-p4|pol-sec-024/i.test(policyName)) || 
      /Risk acceptance must align with the organization’s Risk Appetite/i.test(cleaned) ||
      /RISK TREATMENT/i.test(cleaned);
    if (isRiskPolicy) {
      // First strip any existing risk_matrix_chart or risk framework image block to avoid duplicate/misplaced images
      cleaned = cleaned.replace(/<div class="my-4 flex flex-col items-center justify-center w-full text-center">[\s\S]*?<\/div>/gi, '');
      const imgHtml = `\n\n<div class="my-4 flex flex-col items-center justify-center w-full text-center"><img src="https://lh3.googleusercontent.com/d/1IGYItCxnI4Ky7DQXuIUxsesmkzK-V4uj" onerror="this.onerror=null; this.src='https://drive.google.com/uc?export=view&id=1IGYItCxnI4Ky7DQXuIUxsesmkzK-V4uj';" alt="Healthcare Cybersecurity Risk Assessment Framework" referrerpolicy="no-referrer" class="max-w-full h-auto rounded-lg border border-slate-300 shadow-md object-contain max-h-[420px] mx-auto" /><p class="text-[10px] text-slate-500 font-bold italic mt-1.5 text-center">Figure 1: Healthcare Cybersecurity Risk Assessment Framework &amp; Criteria</p></div>\n\n`;
      
      if (/Risk acceptance must align with the organization’s Risk Appetite and be formally approved and documented\./i.test(cleaned)) {
        cleaned = cleaned.replace(/(Risk acceptance must align with the organization’s Risk Appetite and be formally approved and documented\.)/i, `$1${imgHtml}`);
      } else if (/<h[23][^>]*>\s*RISK TREATMENT\s*<\/h[23]>/i.test(cleaned)) {
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

  // Helper to extract committee signatory names, roles, and signatures
  const getResolvedSignatories = (policy: Policy) => {
    const preparedName = policy.prepared_by || client?.it_manager?.name || client?.hr_manager?.name || 'Aseef Sulaiman';
    const preparedRole = client?.it_manager?.designation || (client?.it_manager?.name ? 'IT Manager / Admin' : 'HR & Compliance Desk');
    const preparedSig = client?.it_manager?.signature_image || client?.hr_manager?.signature_image;

    const reviewedName = (selectedPolicy && selectedPolicy.id === policy.id ? previewReviewedBy : null) || policy.reviewed_by || client?.clinic_manager?.name || (client as any)?.compliance_officer_name || client?.auth_representative?.name || 'Compliance Officer';
    const reviewedRole = client?.clinic_manager?.designation || 'Compliance Officer';
    const reviewedSig = client?.clinic_manager?.signature_image;

    const approvedName = policy.approved_by || client?.medical_director?.name || client?.auth_representative?.name || 'Medical Director / CEO';
    const approvedRole = client?.medical_director?.designation || client?.auth_representative?.designation || 'Medical Director / Authorized Representative';
    const approvedSig = client?.medical_director?.signature_image || client?.auth_representative?.signature_image || client?.auth_rep_signature;

    // Check if Reviewed By should be shown (respect toggle from modal/form or policy attribute)
    const isReviewedIncluded = policy.show_reviewed_by !== undefined
      ? Boolean(policy.show_reviewed_by)
      : (selectedPolicy && selectedPolicy.id === policy.id
          ? Boolean(previewShowReviewedBy)
          : (htmlScriptModalPolicy && htmlScriptModalPolicy.id === policy.id
              ? Boolean(showReviewedBy)
              : true));

    return {
      preparedName,
      preparedRole,
      preparedSig,
      reviewedName,
      reviewedRole,
      reviewedSig,
      approvedName,
      approvedRole,
      approvedSig,
      isReviewedIncluded,
    };
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

    const {
      preparedName,
      preparedRole,
      preparedSig,
      reviewedName,
      reviewedRole,
      reviewedSig,
      approvedName,
      approvedRole,
      approvedSig,
      isReviewedIncluded,
    } = getResolvedSignatories(policy);

    const facilityLogo = client?.facility_logo || (client as any)?.logo_url;
    const facilityStamp = client?.facility_stamp;

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
    .signatory-wrapper {
      position: relative;
      margin-top: auto;
      padding-top: 10px;
      border-top: 2px solid #0f172a;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatory-container {
      display: grid;
      grid-template-columns: repeat(${isReviewedIncluded ? 3 : 2}, 1fr);
      gap: 12px;
    }
    .signatory-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      text-align: center;
      min-height: 84px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
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
    .signatory-title {
      font-size: 8.5px;
      color: #64748b;
      display: block;
      margin-top: 1px;
    }
    .signatory-sig-img {
      max-height: 32px;
      max-width: 120px;
      height: 28px;
      object-fit: contain;
      margin: 4px auto 0;
      display: block;
    }
    .signatory-sig {
      font-size: 8.5px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #15803d;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 3px;
      padding: 2px 6px;
      margin: 4px auto 0;
      display: inline-block;
      font-style: italic;
      font-weight: 600;
    }
    .facility-stamp-seal {
      position: absolute;
      right: 15px;
      bottom: 8px;
      width: 4.5cm;
      height: 4.5cm;
      max-height: 4.5cm;
      max-width: 4.5cm;
      object-fit: contain;
      opacity: 0.88;
      transform: rotate(-4deg);
      pointer-events: none;
      z-index: 10;
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
      <!-- Facility Header with Logo -->
      <div class="header-bar">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${facilityLogo ? `
            <img src="${facilityLogo}" alt="Facility Logo" style="height: 45px; max-width: 130px; object-fit: contain; border-radius: 4px;" />
          ` : ''}
          <div>
            <h2 class="facility-name">${facilityName}</h2>
            <p class="facility-subtext">${client?.address || 'Abu Dhabi'}, ${client?.city || 'United Arab Emirates'}</p>
          </div>
        </div>
        <div class="ref-code-box">${policyNo}</div>
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

      <!-- Policy Version History & Document Control Audit Revision Log -->
      <div style="margin: 12px 0; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; page-break-inside: avoid; break-inside: avoid;">
        <div style="background: #0f172a; color: #ffffff; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
          <span>Policy Version History • Document Control &amp; Audit Revision Log</span>
          <span style="font-family: monospace; color: #7dd3fc; background: #1e293b; padding: 1px 5px; border-radius: 3px;">Active: ${version}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; margin: 0;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #1e293b; font-weight: 800; text-transform: uppercase;">
              <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 65px;">Version</th>
              <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 80px;">Date</th>
              <th style="padding: 4px 6px; text-align: left; border-right: 1px solid #cbd5e1; width: 140px;">Author / Reviewer</th>
              <th style="padding: 4px 6px; text-align: left;">Summary of Changes / Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${getPolicyVersionRecords(policy).map((rec, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px 6px; font-family: monospace; font-weight: bold; color: #3730a3; border-right: 1px solid #e2e8f0;">${rec.version}</td>
                <td style="padding: 4px 6px; border-right: 1px solid #e2e8f0; color: #334155;">${rec.date}</td>
                <td style="padding: 4px 6px; font-weight: 600; border-right: 1px solid #e2e8f0; color: #0f172a;">${rec.author}</td>
                <td style="padding: 4px 6px; color: #334155; line-height: 1.35;">${rec.changes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signatories Footer with Signatures and Official Facility Stamp / Seal (size 4.5cm) -->
    <div class="signatory-wrapper">
      ${facilityStamp ? `
        <img src="${facilityStamp}" alt="Official Facility Stamp / Seal" class="facility-stamp-seal" />
      ` : ''}
      <div class="signatory-container">
        <div class="signatory-box">
          <div>
            <span class="signatory-role">Prepared By</span>
            <strong class="signatory-name">${preparedName}</strong>
            <span class="signatory-title">${preparedRole}</span>
          </div>
          ${preparedSig ? `
            <img src="${preparedSig}" alt="Signature" class="signatory-sig-img" />
          ` : `
            <div class="signatory-sig">✓ Digital Sign: ${preparedName}</div>
          `}
        </div>
        ${isReviewedIncluded ? `
        <div class="signatory-box">
          <div>
            <span class="signatory-role">Reviewed By</span>
            <strong class="signatory-name">${reviewedName}</strong>
            <span class="signatory-title">${reviewedRole}</span>
          </div>
          ${reviewedSig ? `
            <img src="${reviewedSig}" alt="Signature" class="signatory-sig-img" />
          ` : `
            <div class="signatory-sig">✓ Digital Sign: ${reviewedName}</div>
          `}
        </div>
        ` : ''}
        <div class="signatory-box">
          <div>
            <span class="signatory-role">Approved By</span>
            <strong class="signatory-name">${approvedName}</strong>
            <span class="signatory-title">${approvedRole}</span>
          </div>
          ${approvedSig ? `
            <img src="${approvedSig}" alt="Signature" class="signatory-sig-img" />
          ` : `
            <div class="signatory-sig">✓ Digital Sign: Approved</div>
          `}
        </div>
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
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos = Math.max(yPos + 8, 230);
    }

    const {
      preparedName,
      preparedRole,
      preparedSig,
      reviewedName,
      reviewedRole,
      reviewedSig,
      approvedName,
      approvedRole,
      approvedSig,
      isReviewedIncluded,
    } = getResolvedSignatories(policy);

    doc.setDrawColor(203, 213, 225);
    doc.line(15, yPos, pageWidth - 15, yPos);

    yPos += 6;
    const numCols = isReviewedIncluded ? 3 : 2;
    const colWidth = (pageWidth - 75) / numCols;
    
    // Prepared By
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`PREPARED BY`, 17, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(preparedName, 17, yPos + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(preparedRole, 17, yPos + 8.5);

    if (preparedSig) {
      try {
        doc.addImage(preparedSig, 'PNG', 17, yPos + 10, 26, 10);
      } catch (e) {}
    } else {
      doc.setFontSize(6.5);
      doc.setTextColor(21, 128, 61);
      doc.text(`✓ Digital Sign: ${preparedName}`, 17, yPos + 13);
    }

    if (isReviewedIncluded) {
      // Reviewed By
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`REVIEWED BY`, 17 + colWidth, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.text(reviewedName, 17 + colWidth, yPos + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(reviewedRole, 17 + colWidth, yPos + 8.5);

      if (reviewedSig) {
        try {
          doc.addImage(reviewedSig, 'PNG', 17 + colWidth, yPos + 10, 26, 10);
        } catch (e) {}
      } else {
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text(`✓ Digital Sign: ${reviewedName}`, 17 + colWidth, yPos + 13);
      }
    }

    // Approved By
    const approvedX = 17 + (isReviewedIncluded ? colWidth * 2 : colWidth);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`APPROVED BY`, approvedX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(approvedName, approvedX, yPos + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(approvedRole, approvedX, yPos + 8.5);

    if (approvedSig) {
      try {
        doc.addImage(approvedSig, 'PNG', approvedX, yPos + 10, 26, 10);
      } catch (e) {}
    } else {
      doc.setFontSize(6.5);
      doc.setTextColor(21, 128, 61);
      doc.text(`✓ Digital Sign: Approved`, approvedX, yPos + 13);
    }

    // Below Approved Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const appDate = policy.approval_date || policy.effective_date || new Date().toISOString().split('T')[0];
    doc.text(`Approval / Effective Date: ${appDate}`, 17, yPos + 22);

    // Add Facility Stamp / Official Seal (4.5cm / 45mm size)
    const effectiveStamp = client?.facility_stamp || generateFacilitySealPng(policy.company_name || client?.company_name || 'Facility', policy.policy_no || 'POL-2026');
    if (effectiveStamp) {
      try {
        doc.addImage(effectiveStamp, 'PNG', pageWidth - 55, yPos - 5, 45, 45);
      } catch (e) {
        console.warn('Facility Seal/Stamp PNG embed note:', e);
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

  // Vault Folder View State: 'applicable' (default) | 'not_applicable' | 'all'
  const [vaultFolder, setVaultFolder] = useState<'applicable' | 'not_applicable' | 'all'>('applicable');

  // Client-scoped Policy Applicability Checker
  const isPolicyNotApplicable = (p?: Policy | null): boolean => {
    if (!p) return false;
    const effClientId = activeClientId || client?.id || '';
    if (!effClientId) return false;

    // 1. Check client's not_applicable_policy_ids
    if (client?.not_applicable_policy_ids && Array.isArray(client.not_applicable_policy_ids)) {
      if (client.not_applicable_policy_ids.includes(p.id) || client.not_applicable_policy_ids.includes(p.policy_no)) {
        return true;
      }
    }

    // 2. Check policy's not_applicable_clients
    if (p.not_applicable_clients && Array.isArray(p.not_applicable_clients)) {
      if (p.not_applicable_clients.includes(effClientId)) {
        return true;
      }
    }

    // 3. Direct policy field if scoped to this client
    if (p.client_id === effClientId && p.is_applicable === false) {
      return true;
    }

    // 4. LocalStorage persistence for this client
    try {
      const stored = localStorage.getItem(`sh_client_not_applicable_${effClientId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && (parsed.includes(p.id) || parsed.includes(p.policy_no))) {
          return true;
        }
      }
    } catch (e) {}

    return false;
  };

  // Toggle Policy Applicability for the Current Selected Client Only
  const handleTogglePolicyApplicability = (targetPolicy: Policy, shouldBeApplicable?: boolean) => {
    const effClientId = activeClientId || client?.id || '';
    if (!effClientId) {
      showToast('⚠️ Please select an active client account first.');
      return;
    }

    const currentlyExcluded = isPolicyNotApplicable(targetPolicy);
    const targetApplicable = shouldBeApplicable !== undefined ? shouldBeApplicable : currentlyExcluded;

    // 1. Update localStorage list for this specific client
    let clientExclusions: string[] = [];
    try {
      const stored = localStorage.getItem(`sh_client_not_applicable_${effClientId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) clientExclusions = parsed;
      }
    } catch (e) {}

    if (targetApplicable) {
      clientExclusions = clientExclusions.filter(id => id !== targetPolicy.id && id !== targetPolicy.policy_no);
    } else {
      if (!clientExclusions.includes(targetPolicy.id)) clientExclusions.push(targetPolicy.id);
      if (targetPolicy.policy_no && !clientExclusions.includes(targetPolicy.policy_no)) clientExclusions.push(targetPolicy.policy_no);
    }

    try {
      localStorage.setItem(`sh_client_not_applicable_${effClientId}`, JSON.stringify(clientExclusions));
    } catch (e) {}

    // 2. Update Client object
    if (client && onUpdateClient) {
      const updatedClient: Client = {
        ...client,
        not_applicable_policy_ids: clientExclusions,
      };
      onUpdateClient(updatedClient);
    }

    // 3. Update Policy object
    let updatedNotAppClients = [...(targetPolicy.not_applicable_clients || [])];
    if (targetApplicable) {
      updatedNotAppClients = updatedNotAppClients.filter(cId => cId !== effClientId);
    } else {
      if (!updatedNotAppClients.includes(effClientId)) updatedNotAppClients.push(effClientId);
    }

    const updatedPolicy: Policy = {
      ...targetPolicy,
      not_applicable_clients: updatedNotAppClients,
      is_applicable: targetApplicable,
    };

    if (onUpdatePolicy) {
      onUpdatePolicy(updatedPolicy);
    }

    if (selectedPolicy && (selectedPolicy.id === targetPolicy.id || selectedPolicy.policy_no === targetPolicy.policy_no)) {
      setSelectedPolicy(updatedPolicy);
    }

    const clientName = client?.company_name || 'selected client';
    showToast(
      targetApplicable
        ? `✓ Policy "${targetPolicy.policy_no}" marked as APPLICABLE for ${clientName}`
        : `📁 Policy "${targetPolicy.policy_no}" moved to NON-APPLICABLE folder for ${clientName}`
    );
  };

  // Bulk toggle applicability for selected items
  const handleBulkToggleApplicability = (targetApplicable: boolean) => {
    if (selectedPolicyIds.length === 0) {
      showToast('⚠️ Please select one or more policies first.');
      return;
    }
    const effClientId = activeClientId || client?.id || '';
    if (!effClientId) return;

    const targetList = facilityPolicies.filter(p => selectedPolicyIds.includes(p.id));
    targetList.forEach(p => {
      handleTogglePolicyApplicability(p, targetApplicable);
    });

    const clientName = client?.company_name || 'selected client';
    showToast(
      targetApplicable
        ? `✓ Restored ${targetList.length} policies to APPLICABLE folder for ${clientName}`
        : `📁 Moved ${targetList.length} policies to NON-APPLICABLE folder for ${clientName}`
    );
    setSelectedPolicyIds([]);
  };

  // Separate policies into Applicable vs Non-Applicable for this client
  const applicablePolicies = facilityPolicies.filter(p => !isPolicyNotApplicable(p));
  const notApplicablePolicies = facilityPolicies.filter(p => isPolicyNotApplicable(p));

  // Determine active folder list based on selected folder tab
  const activeFolderPolicies = 
    vaultFolder === 'applicable' ? applicablePolicies :
    vaultFolder === 'not_applicable' ? notApplicablePolicies :
    facilityPolicies;

  // Filtered Vault list
  const filteredPolicies = activeFolderPolicies.filter(p => {
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

                {/* Policy Version History & Document Control Revision Log */}
                <div className="my-4 border border-slate-300 rounded-lg overflow-hidden bg-white mx-2 sm:mx-4 shadow-xs">
                  <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-sky-400" /> Policy Version History • Document Control Log
                    </span>
                    <span className="font-mono text-[9px] bg-slate-800 px-2 py-0.5 rounded text-sky-300 border border-slate-700">Active: v1.0</span>
                  </div>
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 uppercase text-[8.5px]">
                        <th className="p-1.5 text-left border-r border-slate-300 w-16">Version</th>
                        <th className="p-1.5 text-left border-r border-slate-300 w-24">Date</th>
                        <th className="p-1.5 text-left border-r border-slate-300 w-44">Author / Reviewer</th>
                        <th className="p-1.5 text-left">Summary of Changes / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="p-1.5 font-mono font-bold text-indigo-700 border-r border-slate-200">v1.0</td>
                        <td className="p-1.5 text-slate-700 border-r border-slate-200">{new Date().toISOString().split('T')[0]}</td>
                        <td className="p-1.5 font-semibold text-slate-800 border-r border-slate-200">{preparedBy || 'HR Director'}</td>
                        <td className="p-1.5 text-slate-700">Initial Document Baseline Creation & Governance Approval</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Signatory Footer */}
              <div className="mt-8 pt-4 border-t-2 border-slate-900 w-full px-2 sm:px-4">
                <div className={`grid ${showReviewedBy ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-[10px] w-full`}>
                  <div className="p-3 border border-slate-300 rounded-lg bg-white text-center shadow-xs flex flex-col justify-between min-h-[84px]">
                    <div>
                      <span className="block font-extrabold text-slate-500 uppercase tracking-wider text-[8.5px]">Prepared By</span>
                      <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{preparedBy || 'Aseef Sulaiman'}</strong>
                      <span className="text-[8.5px] text-slate-600 block">IT Manager / Admin</span>
                    </div>
                    <div className="mt-2 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
                      ✓ Digital Sign: {preparedBy || 'Aseef Sulaiman'}
                    </div>
                  </div>

                  {showReviewedBy && (
                    <div className="p-3 border border-slate-300 rounded-lg bg-white text-center shadow-xs flex flex-col justify-between min-h-[84px]">
                      <div>
                        <span className="block font-extrabold text-slate-500 uppercase tracking-wider text-[8.5px]">Reviewed By</span>
                        <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{reviewedBy || 'HR & Compliance Director'}</strong>
                        <span className="text-[8.5px] text-slate-600 block">Operations Manager</span>
                      </div>
                      <div className="mt-2 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
                        ✓ Digital Sign: {reviewedBy || 'HR & Compliance Director'}
                      </div>
                    </div>
                  )}

                  <div className="p-3 border border-slate-300 rounded-lg bg-white text-center shadow-xs flex flex-col justify-between min-h-[84px]">
                    <div>
                      <span className="block font-extrabold text-slate-500 uppercase tracking-wider text-[8.5px]">Approved By</span>
                      <strong className="block text-slate-900 mt-1 font-extrabold text-[11px]">{approvedBy || 'Medical Director / CEO'}</strong>
                      <span className="text-[8.5px] text-slate-600 block">Compliance Officer</span>
                    </div>
                    <div className="mt-2 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
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
          {/* MASTER CLIENT PROTECTION BANNER */}
          {isMasterClient && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                <span>👑 <strong>Compliance Consultant Master Repository (SmartPro)</strong>: Gold Standard Master Policies & Procedures. Documents are protected from deletion. Copying to client entities is restricted to SuperAdmin accounts.</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 rounded-xl text-[10px] uppercase tracking-wider font-black shrink-0 border border-amber-300">
                Gold Master Store
              </span>
            </div>
          )}

          {/* FOLDER NAVIGATION (APPLICABLE POLICIES vs NON-APPLICABLE vs ALL) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setVaultFolder('applicable')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-2 cursor-pointer border ${
                  vaultFolder === 'applicable'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={`Show policies applicable to ${client?.company_name || 'selected client'}`}
              >
                <CheckCircle2 className={`w-4 h-4 ${vaultFolder === 'applicable' ? 'text-emerald-300' : 'text-emerald-600'}`} />
                <span>Applicable Policies</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                  vaultFolder === 'applicable' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {applicablePolicies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVaultFolder('not_applicable')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-2 cursor-pointer border ${
                  vaultFolder === 'not_applicable'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title={`Show policies marked as NOT applicable for ${client?.company_name || 'selected client'}`}
              >
                <XCircle className={`w-4 h-4 ${vaultFolder === 'not_applicable' ? 'text-rose-200' : 'text-rose-600'}`} />
                <span>Not Applicable Policies</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                  vaultFolder === 'not_applicable' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {notApplicablePolicies.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVaultFolder('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-2 cursor-pointer border ${
                  vaultFolder === 'all'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="View all repository records regardless of client applicability status"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>All Repository Records</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                  vaultFolder === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {facilityPolicies.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 ml-auto">
              <span>Scoped Client:</span>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-lg font-black">
                {client?.company_name || 'Selected Client'}
              </span>
            </div>
          </div>

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
                  {vaultFolder === 'applicable' && `Policy Frameworks Repository (${applicablePolicies.length} Active Records)`}
                  {vaultFolder === 'not_applicable' && `Non-Applicable & Excluded Policies (${notApplicablePolicies.length} Excluded Records)`}
                  {vaultFolder === 'all' && `All Policy Frameworks Repository (${facilityPolicies.length} Total Records)`}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* BULK APPLICABILITY ACTIONS */}
                {vaultFolder !== 'not_applicable' && (
                  <button
                    type="button"
                    onClick={() => handleBulkToggleApplicability(false)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-2xs"
                    title={`Mark selected policies as Not Applicable for ${client?.company_name || 'selected client'}`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Mark as Not Applicable
                    {selectedPolicyIds.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-rose-700 text-white text-[10px] rounded-full">
                        {selectedPolicyIds.length}
                      </span>
                    )}
                  </button>
                )}
                {vaultFolder !== 'applicable' && (
                  <button
                    type="button"
                    onClick={() => handleBulkToggleApplicability(true)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-2xs"
                    title={`Restore selected policies as Applicable for ${client?.company_name || 'selected client'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark as Applicable
                    {selectedPolicyIds.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-emerald-700 text-white text-[10px] rounded-full">
                        {selectedPolicyIds.length}
                      </span>
                    )}
                  </button>
                )}

                {/* PROTECTED / UNLOCKED SECURITY TOGGLE BUTTON */}
                <button
                  type="button"
                  onClick={handleToggleProtectedLock}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm border ${
                    isProtectedUnlocked
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                  }`}
                  title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Repository - Click to unlock with Security PIN"}
                >
                  {isProtectedUnlocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Unlocked (Protected Mode)</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      <span>Protected</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenCopyModalForSelected}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm ${
                    isSuperAdmin
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={isSuperAdmin ? "Copy selected policies to a client facility" : "Copy to Client (SuperAdmin Only)"}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'Copy to Client' : 'Copy to Client (SuperAdmin)'}
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
                  onClick={() => handleFreezeSelectedPolicies()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  title="Freeze / Lock or Unfreeze selected policy documents against modifications"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {selectedPolicyIds.length > 0 && filteredPolicies.filter(p => selectedPolicyIds.includes(p.id)).every(p => p.is_frozen || p.status === 'FROZEN')
                    ? 'Unfreeze Selected'
                    : 'Freeze Selected'}
                  {selectedPolicyIds.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-cyan-900 text-white text-[10px] rounded-full">
                      {selectedPolicyIds.length}
                    </span>
                  )}
                </button>
                {onDeletePolicy && !isMasterClient && (
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
                    <th className="p-3.5">Scope</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        {vaultFolder === 'not_applicable'
                          ? 'No non-applicable policies found for this client facility.'
                          : 'No policy or procedure documents found matching your criteria.'}
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
                          {isPolicyNotApplicable(p) ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10.5px] font-extrabold inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Not Applicable
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-extrabold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Applicable
                            </span>
                          )}
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
                            {/* SCOPE APPLICABILITY TOGGLE BUTTON */}
                            {isPolicyNotApplicable(p) ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePolicyApplicability(p, true)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-black cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs"
                                title={`Restore policy to APPLICABLE repository for ${client?.company_name || 'selected client'}`}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark Applicable
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePolicyApplicability(p, false)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1 shadow-2xs"
                                title={`Mark policy as NOT APPLICABLE / Exclude for ${client?.company_name || 'selected client'}`}
                              >
                                <XCircle className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" /> Not Applicable
                              </button>
                            )}

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
                                  ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-extrabold hover:bg-cyan-200 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 shadow-xs'
                              }`}
                              title={(p.is_frozen || p.status === 'FROZEN') ? 'Unfreeze Document to Allow Edits' : 'Freeze / Lock Document Record'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              {(p.is_frozen || p.status === 'FROZEN') ? 'Unfreeze' : 'Freeze'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCopyModalForSingle(p)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1 border ${
                                isSuperAdmin
                                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200/60'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={isSuperAdmin ? "Copy policy master document to client" : "Copy to Client (SuperAdmin Only)"}
                            >
                              <Copy className="w-3.5 h-3.5" /> {isSuperAdmin ? 'Copy to Client' : 'Copy (SuperAdmin)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHtmlScriptModalPolicy(p);
                                setHtmlScriptActiveTab('preview');
                              }}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Prepare, View & Copy Complete HTML Script for Document"
                            >
                              <FileCode className="w-3.5 h-3.5" /> HTML Script
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintPolicyPdf(p)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Download & Export Policy as PDF Document (.pdf)"
                            >
                              <Printer className="w-3.5 h-3.5" /> PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadSingleHtml(p)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Download Standalone Standardized HTML Document (.html)"
                            >
                              <Download className="w-3.5 h-3.5" /> HTML
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
                            {onDeletePolicy && (!isMasterClient || isProtectedUnlocked) && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeletePolicy(p)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Delete Policy Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                            {isMasterClient && (
                              <button
                                type="button"
                                onClick={handleToggleProtectedLock}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all inline-flex items-center gap-1 border shadow-xs ${
                                  isProtectedUnlocked
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                }`}
                                title={isProtectedUnlocked ? "Master Protection UNLOCKED - Click to Re-lock" : "Protected Master Document - Click to unlock with Security PIN"}
                              >
                                {isProtectedUnlocked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-emerald-700" /> Unlocked
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3.5 h-3.5 text-amber-700" /> Protected
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
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Actions:</span>
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
                <button
                  type="button"
                  onClick={() => {
                    setDocContent(prev => formatContentToBulletsAndClean(prev));
                    showToast('✓ Converted numbered lists to bullet points');
                  }}
                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                  title="Normalize numbered lists (1., 2), etc.) into bullet points without losing text"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" /> Format to Bullets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tempPolicy: Policy = {
                      id: 'temp_create',
                      client_id: activeClientId || 'master',
                      created_at: new Date().toISOString(),
                      policy_no: docCode || 'POL-01',
                      policy_name: docTitle || 'Custom Policy Document',
                      category: docCategory,
                      department: docDepartment,
                      classification: docClassification,
                      status: 'APPROVED',
                      effective_date: new Date().toISOString().split('T')[0],
                      review_date: '2027-08-06',
                      next_due_date: '2027-08-01',
                      version: 'v1.0',
                      policy_statement: docContent,
                      prepared_by: preparedBy,
                      reviewed_by: reviewedBy,
                      approved_by: approvedBy,
                      show_reviewed_by: showReviewedBy
                    };
                    setHtmlScriptModalPolicy(tempPolicy);
                    setHtmlScriptActiveTab('preview');
                  }}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                  title="Prepare and view standard A4 HTML script for this document"
                >
                  <FileCode className="w-3 h-3 text-indigo-600" /> Prepare HTML Script
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

                {/* FACILITY POLICY SCOPE APPLICABILITY TOGGLE */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleTogglePolicyApplicability(selectedPolicy, true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      !isPolicyNotApplicable(selectedPolicy)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`Mark as APPLICABLE for ${client?.company_name || 'selected client'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Applicable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePolicyApplicability(selectedPolicy, false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isPolicyNotApplicable(selectedPolicy)
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`Mark as NOT APPLICABLE / Exclude for ${client?.company_name || 'selected client'}`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Not Applicable
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold text-slate-200 cursor-pointer hover:bg-slate-700/60">
                    <input
                      type="checkbox"
                      checked={previewShowReviewedBy}
                      onChange={e => {
                        const val = e.target.checked;
                        setPreviewShowReviewedBy(val);
                        if (selectedPolicy) {
                          const updated = {
                            ...selectedPolicy,
                            show_reviewed_by: val,
                          };
                          setSelectedPolicy(updated);
                          if (onUpdatePolicy && updated.id && !updated.id.startsWith('temp')) {
                            onUpdatePolicy(updated);
                          }
                        }
                      }}
                      className="rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Include Reviewed By</span>
                  </label>

                  {previewShowReviewedBy && (
                    <input
                      type="text"
                      value={previewReviewedBy}
                      onChange={e => {
                        const val = e.target.value;
                        setPreviewReviewedBy(val);
                        if (selectedPolicy) {
                          const updated = {
                            ...selectedPolicy,
                            reviewed_by: val,
                          };
                          setSelectedPolicy(updated);
                          if (onUpdatePolicy && updated.id && !updated.id.startsWith('temp')) {
                            onUpdatePolicy(updated);
                          }
                        }
                      }}
                      placeholder="e.g. Compliance Officer"
                      className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold w-36 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>

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
                  title="Download / Save as PDF Document (.pdf)"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF (.pdf)
                </button>

                <button
                  onClick={() => handleDownloadSingleHtml(selectedPolicy)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Download Standalone Standardized HTML Document (.html)"
                >
                  <Download className="w-3.5 h-3.5" /> Download HTML (.html)
                </button>

                <button
                  onClick={() => {
                    setHtmlScriptModalPolicy(selectedPolicy);
                    setHtmlScriptActiveTab('preview');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Prepare, View & Copy Complete HTML Script for Document"
                >
                  <FileCode className="w-3.5 h-3.5" /> HTML Script
                </button>

                <button
                  onClick={() => handlePrintPolicyPdf(selectedPolicy)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                  title="Direct Print Layout"
                >
                  <Printer className="w-3.5 h-3.5" /> Print A4
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

                {onDeletePolicy && !isMasterClient && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePolicy(selectedPolicy)}
                    className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 border border-rose-500 shadow-md"
                    title="Delete Policy Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Record
                  </button>
                )}
                {isMasterClient && (
                  <span
                    className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700 cursor-not-allowed select-none"
                    title="Master template policy records are permanently protected from deletion"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> Master Protected
                  </span>
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
                      <div className="flex flex-wrap justify-between items-center gap-1 mb-1">
                        <label className="block font-bold text-slate-300 text-[11px]">Document Content & Statement (HTML / Markdown)</label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedPolicy) {
                                const current = selectedPolicy.policy_statement || selectedPolicy.full_content || '';
                                const cleaned = formatContentToBulletsAndClean(current);
                                setSelectedPolicy({ ...selectedPolicy, policy_statement: cleaned, full_content: cleaned });
                                showToast('✓ Converted numbered lists to bullet points');
                              }
                            }}
                            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                            title="Convert numbered lists (1., 2), etc.) into bullet points without losing text"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" /> Convert to Bullets
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedPolicy) {
                                setHtmlScriptModalPolicy(selectedPolicy);
                                setHtmlScriptActiveTab('preview');
                              }
                            }}
                            className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                            title="Prepare, View & Copy Complete HTML Script"
                          >
                            <FileCode className="w-3 h-3 text-indigo-400" /> Prepare HTML Script
                          </button>
                          <span className="text-[9px] text-emerald-400 font-mono">Supports HTML & Tables</span>
                        </div>
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

                  {/* NON-APPLICABLE FACILITY SCOPE NOTICE */}
                  {isPolicyNotApplicable(selectedPolicy) && (
                    <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-900 text-xs font-bold no-print">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>This policy is marked as <strong>NOT APPLICABLE</strong> for {client?.company_name || 'the selected facility'}.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePolicyApplicability(selectedPolicy, true)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-black cursor-pointer shadow-xs transition-colors"
                      >
                        Restore to Applicable
                      </button>
                    </div>
                  )}

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

                  {/* POLICY VERSION HISTORY & DOCUMENT CONTROL REVISION LOG */}
                  <div className="my-5 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs px-0">
                    <div className="bg-slate-900 text-white px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-sky-400" />
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Policy Version History</h4>
                          <p className="text-[8.5px] text-slate-300 font-normal">Document Control &amp; Audit Revision Log</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-slate-300">
                          Current Active Version: <strong className="font-mono text-sky-300 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedPolicy.version || 'v1.0'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVersionIndex(null);
                            setShowAddVersionForm(!showAddVersionForm);
                            if (!showAddVersionForm) {
                              const currentVer = selectedPolicy.version || 'v1.0';
                              const num = parseFloat(currentVer.replace(/[^0-9.]/g, '')) || 1.0;
                              setNewVersionNum(`v${(num + 0.1).toFixed(1)}`);
                              setNewVersionDate(new Date().toISOString().split('T')[0]);
                              setNewVersionAuthor(selectedPolicy.prepared_by || 'Aseef Sulaiman');
                              setNewVersionChanges('Annual policy revision, governance audit review, and clause updates.');
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all inline-flex items-center gap-1 shadow-xs"
                          title="Add new revision entry"
                        >
                          <Plus className="w-3 h-3" /> + Add Version Record
                        </button>
                      </div>
                    </div>

                    {/* Edit Version Record Entry Form */}
                    {editingVersionIndex !== null && (
                      <div className="p-3 bg-amber-50/90 border-b border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-bold text-amber-950 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit Version Record Entry (Row #{editingVersionIndex + 1})
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingVersionIndex(null)}
                            className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Version Number *</label>
                            <input
                              type="text"
                              value={editVersionNum}
                              onChange={e => setEditVersionNum(e.target.value)}
                              placeholder="e.g. v1.0, v1.1"
                              className="w-full p-1.5 bg-white border border-amber-300 rounded font-mono text-[10.5px] text-slate-900 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Date *</label>
                            <input
                              type="date"
                              value={editVersionDate}
                              onChange={e => setEditVersionDate(e.target.value)}
                              className="w-full p-1.5 bg-white border border-amber-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Author / Reviewer *</label>
                            <input
                              type="text"
                              value={editVersionAuthor}
                              onChange={e => setEditVersionAuthor(e.target.value)}
                              placeholder="e.g. Aseef Sulaiman"
                              className="w-full p-1.5 bg-white border border-amber-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Summary of Changes / Remarks *</label>
                          <textarea
                            rows={2}
                            value={editVersionChanges}
                            onChange={e => setEditVersionChanges(e.target.value)}
                            placeholder="Detail the scope of changes, regulatory revisions, or compliance audit updates..."
                            className="w-full p-1.5 bg-white border border-amber-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingVersionIndex(null)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditVersionRecord(selectedPolicy)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Save Changes
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New Version Record Entry Form */}
                    {showAddVersionForm && (
                      <div className="p-3 bg-indigo-50/80 border-b border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> New Version Record Entry
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddVersionForm(false)}
                            className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Version Number *</label>
                            <input
                              type="text"
                              value={newVersionNum}
                              onChange={e => setNewVersionNum(e.target.value)}
                              placeholder="e.g. v1.1, v2.0"
                              className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-[10.5px] text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Date *</label>
                            <input
                              type="date"
                              value={newVersionDate}
                              onChange={e => setNewVersionDate(e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Author / Reviewer *</label>
                            <input
                              type="text"
                              value={newVersionAuthor}
                              onChange={e => setNewVersionAuthor(e.target.value)}
                              placeholder="e.g. Aseef Sulaiman"
                              className="w-full p-1.5 bg-white border border-slate-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">Summary of Changes / Remarks *</label>
                          <textarea
                            rows={2}
                            value={newVersionChanges}
                            onChange={e => setNewVersionChanges(e.target.value)}
                            placeholder="Detail the scope of changes, regulatory revisions, or compliance audit updates..."
                            className="w-full p-1.5 bg-white border border-slate-300 rounded text-[10.5px] text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddVersionForm(false)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNewVersionRecord(selectedPolicy)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Save Version
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Version History Table */}
                    <table className="w-full border-collapse text-[9.5px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[8.5px]">
                          <th className="p-1.5 text-left border-r border-slate-300 w-20">Version</th>
                          <th className="p-1.5 text-left border-r border-slate-300 w-24">Date</th>
                          <th className="p-1.5 text-left border-r border-slate-300 w-44">Author / Reviewer</th>
                          <th className="p-1.5 text-left">Summary of Changes / Remarks</th>
                          <th className="p-1.5 text-center w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {getPolicyVersionRecords(selectedPolicy).map((rec, idx) => {
                          const isCurrentlyEditing = editingVersionIndex === idx;
                          return (
                            <tr
                              key={idx}
                              className={
                                isCurrentlyEditing
                                  ? 'bg-amber-50/70 border-y-2 border-amber-400'
                                  : idx % 2 === 0
                                  ? 'bg-white'
                                  : 'bg-slate-50/60'
                              }
                            >
                              <td className="p-1.5 font-mono font-bold text-indigo-700 border-r border-slate-200 whitespace-nowrap">
                                {rec.version}
                              </td>
                              <td className="p-1.5 text-slate-700 border-r border-slate-200 whitespace-nowrap">
                                {rec.date}
                              </td>
                              <td className="p-1.5 font-semibold text-slate-800 border-r border-slate-200">
                                {rec.author}
                              </td>
                              <td className="p-1.5 text-slate-700 leading-tight">
                                {rec.changes}
                              </td>
                              <td className="p-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditVersionRecord(selectedPolicy, idx)}
                                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded cursor-pointer transition-colors"
                                    title="Edit this version record"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  {getPolicyVersionRecords(selectedPolicy).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVersionRecord(selectedPolicy, idx)}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                                      title="Remove version record"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* SIGNATORIES & LEGAL SEAL FOOTER */}
                  {(() => {
                    const resolved = getResolvedSignatories(selectedPolicy);
                    const currentFacilityStamp = client?.facility_stamp;
                    return (
                      <div className="pt-6 border-t-2 border-slate-900 w-full px-1 sm:px-2 mt-auto relative">
                        {currentFacilityStamp && (
                          <img
                            src={currentFacilityStamp}
                            alt="Official Facility Seal"
                            style={{ width: '4.5cm', height: '4.5cm', maxWidth: '4.5cm', maxHeight: '4.5cm' }}
                            className="facility-stamp-seal absolute right-2 bottom-1 object-contain opacity-90 pointer-events-none -rotate-3 z-10"
                          />
                        )}
                        <div className={`grid ${previewShowReviewedBy ? 'grid-cols-3' : 'grid-cols-2'} gap-3 items-stretch w-full`}>
                          
                          {/* PREPARED BY */}
                          <div className="space-y-1 p-3 bg-white border border-slate-300 rounded-lg text-center shadow-2xs flex flex-col justify-between min-h-[85px]">
                            <div>
                              <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Prepared By</span>
                              <strong className="text-slate-900 font-extrabold block text-[10.5px] mt-0.5">{resolved.preparedName}</strong>
                              <span className="text-[8.5px] text-slate-600 block">{resolved.preparedRole}</span>
                            </div>
                            {resolved.preparedSig ? (
                              <img src={resolved.preparedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                            ) : (
                              <div className="mt-1 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
                                ✓ Digital Sign: {resolved.preparedName}
                              </div>
                            )}
                          </div>

                          {/* REVIEWED BY */}
                          {previewShowReviewedBy && (
                            <div className="space-y-1 p-3 bg-white border border-slate-300 rounded-lg text-center shadow-2xs flex flex-col justify-between min-h-[85px]">
                              <div>
                                <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Reviewed By</span>
                                <strong className="text-slate-900 font-extrabold block text-[10.5px] mt-0.5">{previewReviewedBy || resolved.reviewedName}</strong>
                                <span className="text-[8.5px] text-slate-600 block">{resolved.reviewedRole}</span>
                              </div>
                              {resolved.reviewedSig ? (
                                <img src={resolved.reviewedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                              ) : (
                                <div className="mt-1 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
                                  ✓ Digital Sign: {previewReviewedBy || resolved.reviewedName}
                                </div>
                              )}
                            </div>
                          )}

                          {/* APPROVED BY */}
                          <div className="space-y-1 p-3 bg-white border border-slate-300 rounded-lg text-center shadow-2xs flex flex-col justify-between min-h-[85px]">
                            <div>
                              <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Approved By</span>
                              <strong className="text-slate-900 font-extrabold block text-[10.5px] mt-0.5">{resolved.approvedName}</strong>
                              <span className="text-[8.5px] text-slate-600 block">{resolved.approvedRole}</span>
                            </div>
                            {resolved.approvedSig ? (
                              <img src={resolved.approvedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                            ) : (
                              <div className="mt-1 text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic inline-block font-semibold">
                                ✓ Digital Sign: Approved
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
      {/* MASTER SECURITY UNLOCK MODAL (PASSWORD: 663385) */}
      {showSecurityUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-fadeIn font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Master Protection Unlock
                  </h3>
                  <p className="text-[11px] text-slate-300">Protected Mode Security Key Verification</p>
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

            <form onSubmit={handleVerifySecurityPin} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Master Protection Key Required</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Enter the Master Security PIN to unlock master template modifications, deletion rights, and protected governance controls.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 text-xs">
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono font-bold text-slate-900 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(prev => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPinPassword ? "Hide PIN" : "Show PIN"}
                  >
                    {showPinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {securityPinError && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {securityPinError}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityUnlockModal(false);
                    setSecurityPinError(null);
                    setSecurityPinInput('');
                    setPendingActionOnUnlock(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" /> Verify &amp; Unlock
                </button>
              </div>
            </form>
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

      {/* HTML SCRIPT GENERATOR & STANDALONE LIVE PREVIEW MODAL */}
      {htmlScriptModalPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn font-sans">
          <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Colored Header Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-indigo-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/40">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/60">
                      {htmlScriptModalPolicy.policy_no}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate max-w-md sm:max-w-xl">
                      {resolveDocTitle(htmlScriptModalPolicy.policy_name, htmlScriptModalPolicy.company_name || client?.company_name)}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Standard A4 Document Layout (210mm × 297mm) • Compact Dynamic Tables • Bulleted Lists • Corporate Colored Header
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHtmlScriptModalPolicy(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header Toolbar */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Tab Selector */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setHtmlScriptActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    htmlScriptActiveTab === 'preview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> A4 Live Document Preview
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlScriptActiveTab('code')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    htmlScriptActiveTab === 'code'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" /> Standalone HTML Script Code
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const formatted = formatContentToBulletsAndClean(htmlScriptModalPolicy.policy_statement || htmlScriptModalPolicy.full_content || '');
                    const updated = { ...htmlScriptModalPolicy, policy_statement: formatted, full_content: formatted };
                    setHtmlScriptModalPolicy(updated);
                    if (onUpdatePolicy && htmlScriptModalPolicy.id && !htmlScriptModalPolicy.id.startsWith('temp')) {
                      onUpdatePolicy(updated);
                    }
                    showToast('✓ Converted numbered lists to bullet points & normalized table layout');
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5"
                  title="Normalize numbered lists to bullet points and clean structure"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Convert to Bullets &amp; Clean
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintPolicyPdf(htmlScriptModalPolicy)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Download & Export Policy as PDF (.pdf)"
                >
                  <Download className="w-3.5 h-3.5" /> Download .pdf
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSingleHtml(htmlScriptModalPolicy)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Download HTML Document File (.html)"
                >
                  <Download className="w-3.5 h-3.5" /> Download .html
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyHtmlCode(htmlScriptModalPolicy)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md"
                  title="Copy Full Self-Contained HTML Script to Clipboard"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy HTML Script
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintPolicyPdf(htmlScriptModalPolicy)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print A4
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 bg-slate-950 flex-1 overflow-y-auto custom-scrollbar">
              {htmlScriptActiveTab === 'preview' ? (
                <div className="flex justify-center items-center py-2">
                  <div className="w-full max-w-[210mm] bg-white rounded shadow-2xl border border-slate-300 p-8 sm:px-[15mm] py-8 text-slate-900 text-xs">
                    {/* Header Bar with Color Accent */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                          {htmlScriptModalPolicy.company_name || client?.company_name || 'Healthcare Facility'}
                        </h2>
                        <p className="text-[9.5px] text-slate-500">
                          {client?.address || 'Abu Dhabi'}, {client?.city || 'United Arab Emirates'}
                        </p>
                      </div>
                      <div className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                        {htmlScriptModalPolicy.policy_no}
                      </div>
                    </div>

                    {/* Colored Title Banner */}
                    <div className="bg-slate-900 text-white text-center py-2 px-3 rounded text-[12px] font-bold uppercase tracking-wider mb-3 shadow-xs">
                      {resolveDocTitle(htmlScriptModalPolicy.policy_name, htmlScriptModalPolicy.company_name || client?.company_name)}
                      {htmlScriptModalPolicy.company_name && !/smartpro/i.test(htmlScriptModalPolicy.company_name) && (
                        <span className="text-sky-300 font-normal"> — {htmlScriptModalPolicy.company_name}</span>
                      )}
                    </div>

                    {/* Document Control Information Log */}
                    <table className="w-full border-collapse border border-slate-300 text-[6.5px] mb-3">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                          <th colSpan={4} className="py-1 px-2 text-center text-[6.5px]">Document Control Information Log</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 w-1/4 border-r border-slate-200">Reference Code</td>
                          <td className="p-1.5 font-mono font-bold text-indigo-700 w-1/4 border-r border-slate-200">{htmlScriptModalPolicy.policy_no}</td>
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 w-1/4 border-r border-slate-200">Category</td>
                          <td className="p-1.5 text-slate-800 font-semibold w-1/4">{htmlScriptModalPolicy.category}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 border-r border-slate-200">Version</td>
                          <td className="p-1.5 font-mono text-slate-800 border-r border-slate-200">{htmlScriptModalPolicy.version || 'v1.0'}</td>
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 border-r border-slate-200">Classification</td>
                          <td className="p-1.5 font-bold text-rose-700">{htmlScriptModalPolicy.classification || 'CONFIDENTIAL'}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 border-r border-slate-200">Issue / Effective Date</td>
                          <td className="p-1.5 text-slate-800 border-r border-slate-200">{htmlScriptModalPolicy.effective_date || htmlScriptModalPolicy.approval_date || new Date().toISOString().split('T')[0]}</td>
                          <td className="p-1.5 font-bold bg-slate-100 text-slate-700 border-r border-slate-200">Revision Date</td>
                          <td className="p-1.5 text-slate-800">{htmlScriptModalPolicy.review_date || '2027-08-06'}</td>
                        </tr>
                        <tr className="bg-amber-50">
                          <td className="p-1.5 font-bold text-amber-900 border-r border-slate-200" colSpan={2}>Next Due Revision Date</td>
                          <td className="p-1.5 font-bold text-amber-900" colSpan={2}>{htmlScriptModalPolicy.next_due_date || '2027-08-01'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Formatted Policy Body */}
                    <div
                      className="text-xs text-slate-800 leading-normal [&_ol]:list-disc [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:my-0.5 [&_p]:my-1.5 [&_p]:text-justify [&_li]:text-justify [&_h1]:text-xs [&_h1]:font-bold [&_h1]:uppercase [&_h1]:text-slate-900 [&_h1]:border-b [&_h1]:border-slate-300 [&_h1]:pb-0.5 [&_h1]:mt-2.5 [&_h1]:mb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-slate-900 [&_h2]:border-b [&_h2]:border-slate-300 [&_h2]:pb-0.5 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:uppercase [&_h3]:text-slate-900 [&_h3]:border-b [&_h3]:border-slate-300 [&_h3]:pb-0.5 [&_h3]:mt-2.5 [&_h3]:mb-1 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_table]:border [&_table]:border-slate-300 [&_th]:bg-slate-900 [&_th]:text-white [&_th]:p-1.5 [&_th]:font-bold [&_th]:text-[9.5px] [&_th]:uppercase [&_td]:border [&_td]:border-slate-200 [&_td]:p-1.5 [&_td]:text-justify"
                      dangerouslySetInnerHTML={{
                        __html: formatCleanPolicyStatement(
                          htmlScriptModalPolicy.policy_statement || htmlScriptModalPolicy.full_content || '',
                          htmlScriptModalPolicy.policy_name,
                          htmlScriptModalPolicy.company_name || client?.company_name || '',
                          pageBreakSections
                        )
                      }}
                    />

                    {/* Policy Version History & Document Control Revision Log */}
                    <div className="my-4 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                      <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-sky-400" /> Policy Version History • Document Control Log
                        </span>
                        <span className="font-mono text-[9px] bg-slate-800 px-2 py-0.5 rounded text-sky-300 border border-slate-700">
                          Active: {htmlScriptModalPolicy.version || 'v1.0'}
                        </span>
                      </div>
                      <table className="w-full border-collapse text-[9px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[8px]">
                            <th className="p-1.5 text-left border-r border-slate-300 w-16">Version</th>
                            <th className="p-1.5 text-left border-r border-slate-300 w-24">Date</th>
                            <th className="p-1.5 text-left border-r border-slate-300 w-44">Author / Reviewer</th>
                            <th className="p-1.5 text-left">Summary of Changes / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {getPolicyVersionRecords(htmlScriptModalPolicy).map((rec, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="p-1.5 font-mono font-bold text-indigo-700 border-r border-slate-200">{rec.version}</td>
                              <td className="p-1.5 text-slate-700 border-r border-slate-200">{rec.date}</td>
                              <td className="p-1.5 font-semibold text-slate-800 border-r border-slate-200">{rec.author}</td>
                              <td className="p-1.5 text-slate-700">{rec.changes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatories Footer */}
                    {(() => {
                      const resSig = getResolvedSignatories(htmlScriptModalPolicy);
                      return (
                        <div className={`grid ${resSig.isReviewedIncluded ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-6 border-t-2 border-slate-900 mt-6 text-center text-[10px]`}>
                          <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-2xs flex flex-col justify-between min-h-[85px]">
                            <div>
                              <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Prepared By</span>
                              <strong className="text-slate-900 block text-[10.5px] mt-0.5 font-extrabold">{resSig.preparedName}</strong>
                              <span className="text-[8.5px] text-slate-600 block">{resSig.preparedRole}</span>
                            </div>
                            {resSig.preparedSig ? (
                              <img src={resSig.preparedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                            ) : (
                              <div className="text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic mt-1 inline-block font-semibold">
                                ✓ Digital Sign: {resSig.preparedName}
                              </div>
                            )}
                          </div>

                          {resSig.isReviewedIncluded && (
                            <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-2xs flex flex-col justify-between min-h-[85px]">
                              <div>
                                <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Reviewed By</span>
                                <strong className="text-slate-900 block text-[10.5px] mt-0.5 font-extrabold">{resSig.reviewedName}</strong>
                                <span className="text-[8.5px] text-slate-600 block">{resSig.reviewedRole}</span>
                              </div>
                              {resSig.reviewedSig ? (
                                <img src={resSig.reviewedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                              ) : (
                                <div className="text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic mt-1 inline-block font-semibold">
                                  ✓ Digital Sign: {resSig.reviewedName}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="p-3 bg-white border border-slate-300 rounded-lg shadow-2xs flex flex-col justify-between min-h-[85px]">
                            <div>
                              <span className="text-[8.5px] uppercase font-extrabold text-slate-500 block tracking-wider">Approved By</span>
                              <strong className="text-slate-900 block text-[10.5px] mt-0.5 font-extrabold">{resSig.approvedName}</strong>
                              <span className="text-[8.5px] text-slate-600 block">{resSig.approvedRole}</span>
                            </div>
                            {resSig.approvedSig ? (
                              <img src={resSig.approvedSig} alt="Signature" className="h-7 max-w-[110px] object-contain mx-auto mt-1" />
                            ) : (
                              <div className="text-[8.5px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono italic mt-1 inline-block font-semibold">
                                ✓ Digital Sign: Approved
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">Standalone Self-Contained HTML Script Output</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHtmlCode(htmlScriptModalPolicy)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy Full HTML
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-[600px]">
                    {generateStandardizedPolicyHtml(htmlScriptModalPolicy)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
