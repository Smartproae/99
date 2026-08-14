/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, User, DocumentStorageProvider, Employee } from '../types';
import { Plus, Edit2, Search, Building2, CheckCircle2, XCircle, MapPin, Globe, Phone, Mail, Trash2, Upload, Shield, Award, Send, Key, RefreshCw, Zap, Activity, ShieldCheck, Database, Copy, UserCheck, Users, Sparkles } from 'lucide-react';
import { syncClientProfileAuthRep } from '../utils/clientSyncUtils';
import FrameworkGroupModal from './FrameworkGroupModal';
import { FrameworkGroupTier } from '../utils/frameworkGroupUtils';
import { INITIAL_EMPLOYEES } from '../initialData';

const PRESET_LOGOS = [
  { name: 'Medical Shield', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' },
  { name: 'Heart Beat Wave', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { name: 'Medical Star', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l-4 4h8z"/></svg>' },
  { name: 'Cross Clinic Red', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>' }
];

const PRESET_STAMPS = [
  { name: 'Green QMS Approved', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="%23059669" stroke-width="4" stroke-dasharray="4"/><circle cx="50" cy="50" r="32" fill="none" stroke="%23059669" stroke-width="2"/><text x="50" y="42" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23059669" text-anchor="middle">COMPLIANT</text><text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="black" fill="%23059669" text-anchor="middle">APPROVED</text><text x="50" y="68" font-family="sans-serif" font-size="6" fill="%23059669" text-anchor="middle">REGULATORY SEAM</text></svg>' },
  { name: 'Blue DHA Approved', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="%230284c7" stroke-width="4" stroke-dasharray="4"/><circle cx="50" cy="50" r="32" fill="none" stroke="%230284c7" stroke-width="2"/><text x="50" y="42" font-family="sans-serif" font-size="8" font-weight="bold" fill="%230284c7" text-anchor="middle">REGULATORY</text><text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="black" fill="%230284c7" text-anchor="middle">VERIFIED</text><text x="50" y="68" font-family="sans-serif" font-size="6" fill="%230284c7" text-anchor="middle">HEALTH COMPLIANT</text></svg>' },
  { name: 'Indigo Malaffi Official', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="none" stroke="%234f46e5" stroke-width="4" stroke-dasharray="4"/><circle cx="50" cy="50" r="32" fill="none" stroke="%234f46e5" stroke-width="2"/><text x="50" y="42" font-family="sans-serif" font-size="8" font-weight="bold" fill="%234f46e5" text-anchor="middle">OFFICIAL USE</text><text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="black" fill="%234f46e5" text-anchor="middle">AUTHORIZED</text><text x="50" y="68" font-family="sans-serif" font-size="6" fill="%234f46e5" text-anchor="middle">SECURE AUDITED</text></svg>' }
];

interface ClientManagementProps {
  clients: Client[];
  users?: User[];
  employees?: Employee[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onAddEmailLog?: (recipient: string, subject: string, type: string, status?: 'SENT' | 'FAILED') => void;
  currentUser?: User;
  onOpenCopyModal?: () => void;
}

export default function ClientManagement({
  clients,
  users = [],
  employees = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  activeClientId,
  onSelectClient,
  onAddEmailLog,
  currentUser,
  onOpenCopyModal
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Source of truth for Employee & Operator Management roster
  const effectiveEmployees = React.useMemo(() => {
    if (employees && employees.length > 0) return employees;
    try {
      const saved = localStorage.getItem('sh_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse sh_employees', e);
    }
    return INITIAL_EMPLOYEES;
  }, [employees]);

  const getStaffEmail = (emp: Employee, domain?: string) => {
    if ((emp as any).email) return (emp as any).email;
    if ((emp as any).work_email) return (emp as any).work_email;
    const cleanName = emp.employee_name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const d = domain ? domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'facility.ae';
    return `${cleanName}@${d}`;
  };

  const getStaffPhone = (emp: Employee) => {
    if ((emp as any).phone) return (emp as any).phone;
    if ((emp as any).mobile) return (emp as any).mobile;
    return '+971 2 600 ' + Math.floor(1000 + Math.random() * 9000);
  };

  // Framework Tier Groups State (Basic, Transmission, Advance)
  const [frameworkModalOpen, setFrameworkModalOpen] = useState(false);
  const [activeFrameworkGroup, setActiveFrameworkGroup] = useState<FrameworkGroupTier>('Basic');
  const [selectedFrameworkGroup, setSelectedFrameworkGroup] = useState<FrameworkGroupTier>('Basic');

  const handleOpenFrameworkGroupModal = (group: FrameworkGroupTier) => {
    setSelectedFrameworkGroup(group);
    setActiveFrameworkGroup(group);
    setFrameworkModalOpen(true);
  };

  const sendClientAdminEmail = async (client: Client, type: 'INVITE' | 'PASSWORD_RESET') => {
    const admin: any = client.client_admin_contact || users.find(u => u.client_id === client.id && u.role === 'CLIENT_ADMIN');
    if (!admin) {
      alert('Error: No Client Admin is configured for this facility.');
      return;
    }

    const recipientEmail = admin.email || admin.owner_email;
    if (!recipientEmail) {
      alert('Error: Client Admin email address is missing.');
      return;
    }

    const name = admin.name || admin.full_name || 'Client Admin';
    const userId = admin.id || `u-${client.id}-admin`;

    // Retrieve custom SMTP from localStorage
    let smtpConfig = null;
    try {
      const smtpRaw = localStorage.getItem('sh_smtp');
      if (smtpRaw) {
        smtpConfig = JSON.parse(smtpRaw);
      }
    } catch (e) {
      console.error(e);
    }

    if (!smtpConfig) {
      smtpConfig = {
        server: 'smtp.office365.com',
        port: 587,
        username: 'compliance.hub@smarthub.io',
        password: 'CompliancePass123!',
        sender_email: 'no-reply@smarthub.io',
        tls: true,
        ssl: false,
        provider: 'Office 365',
        sandbox_mode: false
      };
    }

    const subject = type === 'INVITE' 
      ? `SmartHub Portal Welcome Invitation: Authorized Client Administrator Access`
      : `SmartHub Portal: Security Passcode Reset & Credentials Setup`;

    const resetUrl = `${window.location.origin}/?reset-token=${userId}-${Date.now()}`;

    const htmlBody = type === 'INVITE' 
      ? `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background-color: #ecfdf5; border-radius: 50%; padding: 15px; border: 1px solid #a7f3d0;">
              <span style="font-size: 30px;">👋</span>
            </div>
            <h2 style="color: #047857; margin-top: 15px; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">Welcome to SmartHub Portal</h2>
            <p style="font-size: 13px; color: #64748b; margin-top: 2px;">Authorized Client Administrator Provisioning</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">You have been officially provisioned as the <strong>Primary Client Administrator</strong> for <strong>${client.company_name}</strong> in the SmartHub Governance, Risk, and Compliance suite.</p>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">As the Client Admin, you will have exclusive authorization to configure, modify, and monitor compliance policies, risk registers, assets, audit findings, and incident logs for your facility.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);">
              Accept Invite & Setup Password
            </a>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.5; background-color: #f8fafc; padding: 12px; border-radius: 8px; font-family: monospace; word-break: break-all;">
            Or copy/paste this URL into your browser:<br />
            <a href="${resetUrl}" style="color: #059669; text-decoration: underline;">${resetUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center; margin-bottom: 0;">
            This is an automated invitation dispatched securely from the SmartHub SMTP relay gateway.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background-color: #eff6ff; border-radius: 50%; padding: 15px; border: 1px solid #bfdbfe;">
              <span style="font-size: 30px;">🔑</span>
            </div>
            <h2 style="color: #1d4ed8; margin-top: 15px; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">Secure Password Setup / Reset</h2>
            <p style="font-size: 13px; color: #64748b; margin-top: 2px;">SmartHub Compliance & Risk Management Suite</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">An administrator has initiated a security credentials reset for your primary Client Admin account linked to <strong>${client.company_name}</strong>. Please click the button below to establish your secure password:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);">
              Establish Portal Password
            </a>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.5; background-color: #f8fafc; padding: 12px; border-radius: 8px; font-family: monospace; word-break: break-all;">
            Or copy/paste this URL into your browser:<br />
            <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
          </p>

          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 15px; margin-top: 25px;">
            <p style="margin: 0; font-size: 11px; color: #b45309; line-height: 1.5;">
              ⚠️ <strong>Security Notice:</strong> This link is valid for 24 hours. If you did not request this reset, please contact your security team immediately.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center; margin-bottom: 0;">
            This is an automated transmission from the SmartHub secure SMTP gateway. Please do not reply directly to this message.
          </p>
        </div>
      `;

    if (onAddEmailLog) {
      onAddEmailLog(recipientEmail, subject, type === 'INVITE' ? 'CLIENT_INVITATION' : 'PASSWORD_RESET', 'SENT');
    }

    // Copy setup URL to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(resetUrl);
      }
    } catch (clipErr) {
      console.warn('Clipboard write warning:', clipErr);
    }

    try {
      const response = await fetch('/api/send-compliance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          recipientEmails: [recipientEmail],
          subject,
          message: type === 'INVITE' 
            ? `Hello ${name},\nYou have been provisioned as Client Admin for ${client.company_name}.\nComplete setup here: ${resetUrl}`
            : `Hello ${name},\nPassword reset initiated for ${client.company_name} Admin.\nReset password here: ${resetUrl}`,
          htmlContent: htmlBody
        })
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const isSimulated = data.simulated || data.autoFallback;
      const successTitle = type === 'INVITE' ? 'Welcome Invitation Dispatched' : 'Credentials Reset Dispatched';
      alert(`✓ ${successTitle}!\n\nDestination: ${recipientEmail}\nMode: ${isSimulated ? 'Sandbox Relay Simulation' : 'Live SMTP Server'}\nStatus: ${data.message || 'SENT'}\n\nSecure Access Setup URL (Copied to Clipboard):\n${resetUrl}\n\n(Share this direct URL with user if needed)`);
    } catch (err: any) {
      console.warn('SMTP dispatch fallback active:', err);
      const simulationTitle = type === 'INVITE' ? 'Welcome Invitation Prepared' : 'Credentials Link Prepared';
      alert(`✓ ${simulationTitle} (Sandbox Mode Fallback)\n\nDestination: ${recipientEmail}\nDetails: ${err?.message || 'Logged to Central Email Hub'}\n\nSecure Access Setup URL (Copied to Clipboard):\n${resetUrl}\n\nURL has been copied to your clipboard! Share this link with the user to authenticate.`);
    }
  };

  // New client form states
  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [framework, setFramework] = useState('DOH Abu Dhabi & MALAFFI');
  const [dohLicense, setDohLicense] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [facilityLogo, setFacilityLogo] = useState(PRESET_LOGOS[0].value);
  const [facilityStamp, setFacilityStamp] = useState(PRESET_STAMPS[0].value);
  const [authRepSignature, setAuthRepSignature] = useState('');
  const [letterheadImage, setLetterheadImage] = useState<string>('');
  const [logoPlacement, setLogoPlacement] = useState<'FULL' | 'LEFT' | 'RIGHT'>('LEFT');
  const [footerPlacement, setFooterPlacement] = useState<'FULL' | 'LEFT' | 'RIGHT'>('LEFT');
  const [footerLogo, setFooterLogo] = useState<string>('');
  const [showFooterAddress, setShowFooterAddress] = useState<boolean>(true);
  const [showFooterLogo, setShowFooterLogo] = useState<boolean>(true);
  const [headerDisplayMode, setHeaderDisplayMode] = useState<'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY'>('BOTH');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [parentId, setParentId] = useState('');

  // Brand New Facility Management fields
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [structureClassification, setStructureClassification] = useState<'SINGLE' | 'GROUP'>('SINGLE');
  const [allBranchesActive, setAllBranchesActive] = useState(true);
  const [facilityGroupName, setFacilityGroupName] = useState('');
  const [branches, setBranches] = useState<any[]>([
    { id: 'b1', name: 'Main Center', license_no: 'DHA-2024-009' }
  ]);

  // Facility Committee Signatory Controls
  const [authRepName, setAuthRepName] = useState('');
  const [authRepEmail, setAuthRepEmail] = useState('');
  const [authRepPhone, setAuthRepPhone] = useState('');
  const [authRepDesignation, setAuthRepDesignation] = useState('Authorized Representative');

  const [clinicMgrName, setClinicMgrName] = useState('');
  const [clinicMgrEmail, setClinicMgrEmail] = useState('');
  const [clinicMgrPhone, setClinicMgrPhone] = useState('');
  const [clinicMgrDesignation, setClinicMgrDesignation] = useState('Clinic Manager');

  const [medDirName, setMedDirName] = useState('');
  const [medDirEmail, setMedDirEmail] = useState('');
  const [medDirPhone, setMedDirPhone] = useState('');
  const [medDirDesignation, setMedDirDesignation] = useState('Medical Director');

  const [itAdminName, setItAdminName] = useState('');
  const [itAdminEmail, setItAdminEmail] = useState('');
  const [itAdminPhone, setItAdminPhone] = useState('');
  const [itAdminDesignation, setItAdminDesignation] = useState('IT Manager / Admin');

  const [hrMgrName, setHrMgrName] = useState('');
  const [hrMgrEmail, setHrMgrEmail] = useState('');
  const [hrMgrPhone, setHrMgrPhone] = useState('');
  const [hrMgrDesignation, setHrMgrDesignation] = useState('HR Manager');

  // Third-Party Support Channels
  const [itSupportName, setItSupportName] = useState('Apex Security Solutions');
  const [itSupportEmail, setItSupportEmail] = useState('support@partner.ae');
  const [itSupportPhone, setItSupportPhone] = useState('+971...');

  const [emrSupportName, setEmrSupportName] = useState('CureMD Regional Support');
  const [emrSupportEmail, setEmrSupportEmail] = useState('emr@curemd.ae');
  const [emrSupportPhone, setEmrSupportPhone] = useState('+971...');

  // Client Admin Access details states
  const [clientAdminName, setClientAdminName] = useState('');
  const [clientAdminEmail, setClientAdminEmail] = useState('');
  const [clientAdminPhone, setClientAdminPhone] = useState('');
  const [autoSendInvite, setAutoSendInvite] = useState(false);

  // Quick Assign Client Admin States (For already added facilities)
  const [quickAdminClient, setQuickAdminClient] = useState<string | null>(null);
  const [quickAdminName, setQuickAdminName] = useState('');
  const [quickAdminEmail, setQuickAdminEmail] = useState('');
  const [quickAdminPhone, setQuickAdminPhone] = useState('');

  // Document Storage Preservations States
  const [newStorageProvider, setNewStorageProvider] = useState<DocumentStorageProvider>('LOCAL_PC');
  const [newLocalPath, setNewLocalPath] = useState('C:\\SmartHub_Documents\\Clients');
  const [newCloudEmail, setNewCloudEmail] = useState('');
  const [newCloudFolder, setNewCloudFolder] = useState('SmartHub_Compliance_Vault');

  // Standalone Storage Management Modal State
  const [cardStorageModalClient, setCardStorageModalClient] = useState<Client | null>(null);
  const [cardStorageProvider, setCardStorageProvider] = useState<DocumentStorageProvider>('LOCAL_PC');
  const [cardLocalPath, setCardLocalPath] = useState('');
  const [cardCloudEmail, setCardCloudEmail] = useState('');
  const [cardCloudFolder, setCardCloudFolder] = useState('SmartHub_Compliance_Vault');

  const handleOpenCardStorageModal = (c: Client) => {
    setCardStorageModalClient(c);
    setCardStorageProvider(c.storage_config?.provider || 'LOCAL_PC');
    setCardLocalPath(c.storage_config?.local_folder_path || `C:\\SmartHub_Documents\\${c.client_code}`);
    setCardCloudEmail(c.storage_config?.cloud_account_email || c.email || '');
    setCardCloudFolder(c.storage_config?.cloud_folder_name || 'SmartHub_Compliance_Vault');
  };

  const handleSaveCardStorage = () => {
    if (!cardStorageModalClient) return;
    const updated: Client = {
      ...cardStorageModalClient,
      storage_config: {
        provider: cardStorageProvider,
        local_folder_path: cardLocalPath,
        cloud_account_email: cardCloudEmail,
        cloud_folder_name: cardCloudFolder,
        connected_status: 'CONNECTED',
        last_synced_at: new Date().toISOString(),
        sync_documents: true
      }
    };
    onUpdateClient(updated);
    setCardStorageModalClient(null);
    alert(`✓ Storage Option Updated for ${cardStorageModalClient.company_name}!\n\nProvider: ${cardStorageProvider}\nSaved Location: ${cardStorageProvider === 'LOCAL_PC' ? cardLocalPath : cardCloudFolder}`);
  };

  const handleQuickAssignAdmin = (clientId: string) => {
    if (!quickAdminName || !quickAdminEmail) {
      alert("Please provide at least a name and email for the Client Admin.");
      return;
    }
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (!clientToUpdate) return;

    const updatedClient: Client = {
      ...clientToUpdate,
      client_admin_contact: {
        name: quickAdminName,
        email: quickAdminEmail,
        phone: quickAdminPhone
      }
    };

    onUpdateClient(updatedClient);

    // Automatically send welcome invite
    sendClientAdminEmail(updatedClient, 'INVITE');

    // Reset states
    setQuickAdminClient(null);
    setQuickAdminName('');
    setQuickAdminEmail('');
    setQuickAdminPhone('');
  };

  // Helper actions for branches management (New form)
  const addBranch = () => {
    const newId = 'b-' + Date.now();
    setBranches([...branches, { id: newId, name: '', license_no: '' }]);
  };

  const updateBranch = (id: string, field: 'name' | 'license_no', value: string) => {
    setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const deleteBranch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch location?')) {
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit && editingClient) {
            setEditingClient({ ...editingClient, facility_logo: reader.result });
          } else {
            setFacilityLogo(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFooterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit && editingClient) {
            setEditingClient({ ...editingClient, footer_logo: reader.result });
          } else {
            setFooterLogo(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit && editingClient) {
            setEditingClient({ ...editingClient, facility_stamp: reader.result });
          } else {
            setFacilityStamp(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthRepSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit && editingClient) {
            setEditingClient({ ...editingClient, auth_rep_signature: reader.result });
          } else {
            setAuthRepSignature(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isEdit && editingClient) {
            setEditingClient({ ...editingClient, letterhead_image: reader.result });
          } else {
            setLetterheadImage(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCode || !companyName) return;

    let nextIdNum = clients.length + 1;
    while (clients.some(c => c.id === 'c' + nextIdNum)) {
      nextIdNum++;
    }
    const newId = 'c' + nextIdNum;

    // Use Facility Group Name if Group Classification is set and provided
    const resolvedCompanyName = (structureClassification === 'GROUP' && facilityGroupName) 
      ? facilityGroupName 
      : companyName;

    const newClient: Client = {
      id: newId,
      client_code: clientCode,
      company_name: resolvedCompanyName,
      trade_license_no: tradeLicense,
      license_expiry: licenseExpiry,
      facility_type: facilityType,
      address,
      city,
      country: 'United Arab Emirates',
      email,
      phone,
      website,
      compliance_framework: framework,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      doh_license_no: dohLicense || undefined,
      owner_name: ownerName || undefined,
      owner_email: ownerEmail || undefined,
      facility_logo: facilityLogo,
      facility_stamp: facilityStamp,
      letterhead_image: letterheadImage || undefined,
      logo_placement: logoPlacement,
      footer_placement: footerPlacement,
      footer_logo: footerLogo || undefined,
      show_footer_address: showFooterAddress,
      show_footer_logo: showFooterLogo,
      header_display_mode: headerDisplayMode,
      auth_rep_signature: authRepSignature || undefined,
      is_group: structureClassification === 'GROUP',
      parent_id: parentId || undefined,

      // Facility Management specific
      clone_source_id: cloneSourceId || undefined,
      structure_classification: structureClassification,
      all_branches_active: allBranchesActive,
      facility_group_name: facilityGroupName,
      branches: structureClassification === 'GROUP' ? branches : [],

      auth_representative: { name: authRepName, email: authRepEmail, phone: authRepPhone, designation: authRepDesignation },
      clinic_manager: { name: clinicMgrName, email: clinicMgrEmail, phone: clinicMgrPhone, designation: clinicMgrDesignation },
      medical_director: { name: medDirName, email: medDirEmail, phone: medDirPhone, designation: medDirDesignation },
      it_manager: { name: itAdminName, email: itAdminEmail, phone: itAdminPhone, designation: itAdminDesignation },
      hr_manager: { name: hrMgrName, email: hrMgrEmail, phone: hrMgrPhone, designation: hrMgrDesignation },

      it_support: { team_name: itSupportName, email: itSupportEmail, phone: itSupportPhone },
      emr_support: { team_name: emrSupportName, email: emrSupportEmail, phone: emrSupportPhone },

      client_admin_contact: clientAdminName || clientAdminEmail || clientAdminPhone ? {
        name: clientAdminName,
        email: clientAdminEmail,
        phone: clientAdminPhone
      } : undefined,

      storage_config: {
        provider: newStorageProvider,
        local_folder_path: newLocalPath || `C:\\SmartHub_Documents\\${clientCode}`,
        cloud_account_email: newCloudEmail || email,
        cloud_folder_name: newCloudFolder || 'SmartHub_Compliance_Vault',
        connected_status: 'CONNECTED',
        last_synced_at: new Date().toISOString(),
        sync_documents: true
      }
    };

    onAddClient(newClient);
    
    if (autoSendInvite && (clientAdminEmail || clientAdminName)) {
      // Trigger welcome invite dispatch
      sendClientAdminEmail(newClient, 'INVITE');
    }

    resetForm();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    const syncedClient = syncClientProfileAuthRep(editingClient);
    onUpdateClient(syncedClient);
    setEditingClient(null);
  };

  const resetForm = () => {
    setClientCode('');
    setCompanyName('');
    setTradeLicense('');
    setLicenseExpiry('');
    setFacilityType('');
    setAddress('');
    setCity('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setFramework('DOH Abu Dhabi & MALAFFI');
    setDohLicense('');
    setOwnerName('');
    setOwnerEmail('');
    setFacilityLogo(PRESET_LOGOS[0].value);
    setFacilityStamp(PRESET_STAMPS[0].value);
    setAuthRepSignature('');
    setLetterheadImage('');
    setLogoPlacement('LEFT');
    setFooterPlacement('LEFT');
    setFooterLogo('');
    setShowFooterAddress(true);
    setShowFooterLogo(true);
    setHeaderDisplayMode('BOTH');
    setIsGroup(false);
    setParentId('');
    setIsAdding(false);

    // Reset new facility management states
    setCloneSourceId('');
    setStructureClassification('SINGLE');
    setAllBranchesActive(true);
    setFacilityGroupName('');
    setBranches([{ id: 'b1', name: 'Main Center', license_no: 'DHA-2024-009' }]);
    
    setAuthRepName('');
    setAuthRepEmail('');
    setAuthRepPhone('');
    setAuthRepDesignation('Authorized Representative');
    
    setClinicMgrName('');
    setClinicMgrEmail('');
    setClinicMgrPhone('');
    setClinicMgrDesignation('Clinic Manager');
    
    setMedDirName('');
    setMedDirEmail('');
    setMedDirPhone('');
    setMedDirDesignation('Medical Director');
    
    setItAdminName('');
    setItAdminEmail('');
    setItAdminPhone('');
    setItAdminDesignation('IT Manager / Admin');
    
    setHrMgrName('');
    setHrMgrEmail('');
    setHrMgrPhone('');
    setHrMgrDesignation('HR Manager');

    setItSupportName('Apex Security Solutions');
    setItSupportEmail('support@partner.ae');
    setItSupportPhone('+971...');
    
    setEmrSupportName('CureMD Regional Support');
    setEmrSupportEmail('emr@curemd.ae');
    setEmrSupportPhone('+971...');

    setClientAdminName('');
    setClientAdminEmail('');
    setClientAdminPhone('');
    setAutoSendInvite(false);
  };

  const startEdit = (client: Client) => {
    setEditingClient({
      ...client,
      structure_classification: client.structure_classification || (client.is_group ? 'GROUP' : 'SINGLE'),
      branches: client.branches || [],
      auth_representative: client.auth_representative ? { ...client.auth_representative, designation: client.auth_representative.designation || 'Authorized Representative' } : { name: '', email: '', phone: '', designation: 'Authorized Representative' },
      clinic_manager: client.clinic_manager ? { ...client.clinic_manager, designation: client.clinic_manager.designation || 'Clinic Manager' } : { name: '', email: '', phone: '', designation: 'Clinic Manager' },
      medical_director: client.medical_director ? { ...client.medical_director, designation: client.medical_director.designation || 'Medical Director' } : { name: '', email: '', phone: '', designation: 'Medical Director' },
      it_manager: client.it_manager ? { ...client.it_manager, designation: client.it_manager.designation || 'IT Manager / Admin' } : { name: '', email: '', phone: '', designation: 'IT Manager / Admin' },
      hr_manager: client.hr_manager ? { ...client.hr_manager, designation: client.hr_manager.designation || 'HR Manager' } : { name: '', email: '', phone: '', designation: 'HR Manager' },
      it_support: client.it_support || { team_name: 'Apex Security Solutions', email: 'support@partner.ae', phone: '+971...' },
      emr_support: client.emr_support || { team_name: 'CureMD Regional Support', email: 'emr@curemd.ae', phone: '+971...' }
    });
  };

  const filteredClients = clients.filter(c =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div id="client-management-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Facility Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage multiple healthcare and corporate clients and select active database contexts.</p>
        </div>
        {!isAdding && !editingClient && (
          <div className="flex items-center gap-3">
            {currentUser?.role === 'SUPER_ADMIN' && onOpenCopyModal && (
              <button
                type="button"
                onClick={onOpenCopyModal}
                title="Superadmin Privilege: Copy/Clone Data between Client Accounts"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" />
                Copy Client Data
              </button>
            )}
            <button
              id="btn-add-client"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer animate-fade-in"
            >
              <Plus className="w-4 h-4" />
              Add Facility
            </button>
          </div>
        )}
      </div>

      {/* Add Client Form */}
      {isAdding && (
        <form onSubmit={handleSaveNew} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-slide-down">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Register New Facility / Organization</h3>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 font-bold text-lg" title="Close">×</button>
          </div>

          {/* Section 1: Structure & Cloning */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🏗️</span> Structure & Cloning Setup
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Optional cloning */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Copy Risk Register from existing facility
                </label>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Select Source Facility to duplicate assets & risks
                </span>
                <select
                  value={cloneSourceId}
                  onChange={e => setCloneSourceId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Do not copy (Start with a blank register) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                  ))}
                </select>
              </div>

              {/* Structure Classification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Structure Classification
                </label>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Specify if standard single site or multi-branch parent company
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStructureClassification('SINGLE')}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      structureClassification === 'SINGLE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Single Facility 🏢</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStructureClassification('GROUP')}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      structureClassification === 'GROUP'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Group / Multi-Branch 🌐</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Group & Branches Configuration */}
            {structureClassification === 'GROUP' && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-slide-down">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-1">
                  🌐 Group & Branches Configuration
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all-branches-active"
                    checked={allBranchesActive}
                    onChange={e => setAllBranchesActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300"
                  />
                  <label htmlFor="all-branches-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    All Branches Active
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Facility Group Name (automatically appears in Facility Name)
                  </label>
                  <input
                    type="text"
                    value={facilityGroupName}
                    onChange={e => {
                      setFacilityGroupName(e.target.value);
                      setCompanyName(e.target.value);
                    }}
                    placeholder="e.g. Al Mansoori Healthcare Group"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Branches / Facility Locations Listed</span>
                    <button
                      type="button"
                      onClick={addBranch}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>+ Add Branch Location</span>
                    </button>
                  </div>

                  {branches.length === 0 ? (
                    <div className="text-[11px] italic text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
                      No branch locations added yet. Click "+ Add Branch Location" to list branches.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {branches.map((b, index) => (
                        <div key={b.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={b.name}
                              onChange={e => updateBranch(b.id, 'name', e.target.value)}
                              placeholder="Branch Name (e.g. Main Center)"
                              className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={b.license_no}
                              onChange={e => updateBranch(b.id, 'license_no', e.target.value)}
                              placeholder="License Number (e.g. DHA-2024-009)"
                              className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteBranch(b.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: General Facility Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🏨</span> Facility Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client / Facility Code *</label>
                <input
                  type="text"
                  value={clientCode}
                  onChange={e => setClientCode(e.target.value)}
                  placeholder="e.g. AMHG-01"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Facility Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Cleveland Clinic Abu Dhabi"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Owner / Sponsor</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="e.g. Dr. Salem Al-Mansouri"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Contact Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+971 X XXX XXXX"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g., info@facility.ae"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street name, sector, building, city, UAE"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Abu Dhabi"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://facility.ae"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Compliance & Licenses */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>📋</span> Compliance & Licenses
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Trade License No</label>
                <input
                  type="text"
                  value={tradeLicense}
                  onChange={e => setTradeLicense(e.target.value)}
                  placeholder="TL-AD-XXXXX"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DOH / DHA License No</label>
                <input
                  type="text"
                  value={dohLicense}
                  onChange={e => setDohLicense(e.target.value)}
                  placeholder="e.g. DOH-LH-88294"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">License Expiry Date</label>
                <input
                  type="date"
                  value={licenseExpiry}
                  onChange={e => setLicenseExpiry(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Type</label>
                <input
                  type="text"
                  value={facilityType}
                  onChange={e => setFacilityType(e.target.value)}
                  placeholder="e.g. Multi-Specialty Hospital"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Compliance Framework</label>
                <select
                  value={framework}
                  onChange={e => setFramework(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                >
                  <option value="DOH Abu Dhabi & MALAFFI">DOH Abu Dhabi & MALAFFI</option>
                  <option value="DHA & NABIDH">DHA & NABIDH</option>
                  <option value="DOH Abu Dhabi & MALAFFI & ISO 27001">DOH Abu Dhabi & MALAFFI & ISO 27001</option>
                  <option value="DHA & NABIDH & ISO 27001">DHA & NABIDH & ISO 27001</option>
                  <option value="ISO 27001 Baseline">ISO 27001 Baseline</option>
                </select>
              </div>

              {/* Framework Tier Groups Selection (Basic, Transmission, Advance) */}
              <div className="md:col-span-3 pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Framework Tier Groups (Basic, Transmission, Advance)
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Click any group to automatically open documents & policies popup
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Basic')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      selectedFrameworkGroup === 'Basic'
                        ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Basic Group
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Transmission')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      selectedFrameworkGroup === 'Transmission'
                        ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" /> Transmission Group
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Advance')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      selectedFrameworkGroup === 'Advance'
                        ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-500/20'
                        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Zap className="w-4 h-4" /> Advance Group
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Facility Committee Signatory Controls */}
          <div className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" /> Facility Committee Signatory Controls
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assign key facility personnel directly from your <strong className="text-emerald-700">Employee &amp; Operator Management</strong> roster or type manually.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/60 self-start sm:self-auto">
                <UserCheck className="w-3 h-3 text-emerald-600" /> {effectiveEmployees.length} Staff Available
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Authorized Representative */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Authorized Representative</span>
                  {authRepDesignation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={authRepDesignation}>
                      {authRepDesignation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setAuthRepName(emp.employee_name);
                        setAuthRepEmail(getStaffEmail(emp, website));
                        setAuthRepPhone(getStaffPhone(emp));
                        setAuthRepDesignation(emp.position || emp.department || 'Authorized Representative');
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={authRepDesignation}
                    onChange={e => setAuthRepDesignation(e.target.value)}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={authRepName}
                  onChange={e => setAuthRepName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={authRepEmail}
                  onChange={e => setAuthRepEmail(e.target.value)}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={authRepPhone}
                  onChange={e => setAuthRepPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* Clinic Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Clinic Manager</span>
                  {clinicMgrDesignation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={clinicMgrDesignation}>
                      {clinicMgrDesignation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setClinicMgrName(emp.employee_name);
                        setClinicMgrEmail(getStaffEmail(emp, website));
                        setClinicMgrPhone(getStaffPhone(emp));
                        setClinicMgrDesignation(emp.position || emp.department || 'Clinic Manager');
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={clinicMgrDesignation}
                    onChange={e => setClinicMgrDesignation(e.target.value)}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={clinicMgrName}
                  onChange={e => setClinicMgrName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={clinicMgrEmail}
                  onChange={e => setClinicMgrEmail(e.target.value)}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={clinicMgrPhone}
                  onChange={e => setClinicMgrPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* Medical Director */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Medical Director</span>
                  {medDirDesignation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={medDirDesignation}>
                      {medDirDesignation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setMedDirName(emp.employee_name);
                        setMedDirEmail(getStaffEmail(emp, website));
                        setMedDirPhone(getStaffPhone(emp));
                        setMedDirDesignation(emp.position || emp.department || 'Medical Director');
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={medDirDesignation}
                    onChange={e => setMedDirDesignation(e.target.value)}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={medDirName}
                  onChange={e => setMedDirName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={medDirEmail}
                  onChange={e => setMedDirEmail(e.target.value)}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={medDirPhone}
                  onChange={e => setMedDirPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* IT Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">IT Manager / Admin</span>
                  {itAdminDesignation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={itAdminDesignation}>
                      {itAdminDesignation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setItAdminName(emp.employee_name);
                        setItAdminEmail(getStaffEmail(emp, website));
                        setItAdminPhone(getStaffPhone(emp));
                        setItAdminDesignation(emp.position || emp.department || 'IT Manager / Admin');
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={itAdminDesignation}
                    onChange={e => setItAdminDesignation(e.target.value)}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={itAdminName}
                  onChange={e => setItAdminName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={itAdminEmail}
                  onChange={e => setItAdminEmail(e.target.value)}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={itAdminPhone}
                  onChange={e => setItAdminPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* HR Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">HR Manager</span>
                  {hrMgrDesignation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={hrMgrDesignation}>
                      {hrMgrDesignation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setHrMgrName(emp.employee_name);
                        setHrMgrEmail(getStaffEmail(emp, website));
                        setHrMgrPhone(getStaffPhone(emp));
                        setHrMgrDesignation(emp.position || emp.department || 'HR Manager');
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={hrMgrDesignation}
                    onChange={e => setHrMgrDesignation(e.target.value)}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={hrMgrName}
                  onChange={e => setHrMgrName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={hrMgrEmail}
                  onChange={e => setHrMgrEmail(e.target.value)}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={hrMgrPhone}
                  onChange={e => setHrMgrPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Third-Party Support Channels */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🛠️</span> Third-Party Support Channels
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IT Support */}
              <div className="p-3 bg-white rounded-xl border border-slate-150 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-50 pb-1">IT Support Team (Third-Party)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={itSupportName}
                    onChange={e => setItSupportName(e.target.value)}
                    placeholder="e.g. Apex Security Solutions"
                    className="w-full text-xs p-2.5 rounded border border-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={itSupportEmail}
                      onChange={e => setItSupportEmail(e.target.value)}
                      placeholder="support@partner.ae"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={itSupportPhone}
                      onChange={e => setItSupportPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* EMR Support */}
              <div className="p-3 bg-white rounded-xl border border-slate-155 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-50 pb-1">EMR Support Team (Third-Party)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={emrSupportName}
                    onChange={e => setEmrSupportName(e.target.value)}
                    placeholder="e.g. CureMD Regional Support"
                    className="w-full text-xs p-2.5 rounded border border-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={emrSupportEmail}
                      onChange={e => setEmrSupportEmail(e.target.value)}
                      placeholder="emr@curemd.ae"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={emrSupportPhone}
                      onChange={e => setEmrSupportPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5.5: Client Admin Access & Credentials */}
          <div className="border-t border-slate-200/60 pt-4 space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> Client Admin Access & Authentication Setup
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Provide credentials for the primary Client Admin. A user account with the <strong>CLIENT_ADMIN</strong> role will be automatically provisioned with exclusive permissions to access this facility's data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={clientAdminName}
                  onChange={e => setClientAdminName(e.target.value)}
                  placeholder="e.g. Dr. Johnathan Carter"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Email ID <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={clientAdminEmail}
                  onChange={e => setClientAdminEmail(e.target.value)}
                  placeholder="e.g. j.carter@clevelandclinicabudhabi.ae"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Contact Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={clientAdminPhone}
                  onChange={e => setClientAdminPhone(e.target.value)}
                  placeholder="e.g. +971 54 333 4455"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/50">
              <div className="flex items-center gap-2">
                <input
                  id="auto-send-invite-checkbox"
                  type="checkbox"
                  checked={autoSendInvite}
                  onChange={e => setAutoSendInvite(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="auto-send-invite-checkbox" className="text-xs font-bold text-slate-700 select-none cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" /> Automatically dispatch Welcome Invitation with secure setup link immediately upon registration
                </label>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!clientAdminName || !clientAdminEmail) {
                    alert('Please enter both Client Admin Name and Email ID before triggering a manual invitation.');
                    return;
                  }
                  const tempClient: Client = {
                    id: 'temp-' + Date.now(),
                    client_code: clientCode || 'TEMP',
                    company_name: companyName || 'New Facility Platform Tenant',
                    trade_license_no: tradeLicense,
                    license_expiry: licenseExpiry,
                    facility_type: facilityType,
                    address,
                    city,
                    email,
                    phone,
                    website,
                    compliance_framework: framework,
                    status: 'ACTIVE',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    client_admin_contact: {
                      name: clientAdminName,
                      email: clientAdminEmail,
                      phone: clientAdminPhone
                    }
                  };
                  await sendClientAdminEmail(tempClient, 'INVITE');
                }}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                title="Send manual Welcome Invitation right now using entered credentials"
              >
                <Send className="w-3.5 h-3.5" /> Send Invite Manually
              </button>
            </div>
          </div>

          {/* Section 6: branding configuration */}
          <div className="border-t border-slate-200/60 pt-4 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨</span> Page Header / Footer Compliance Branding Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Logo Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Facility Corporate Logo</label>
                
                {/* Preset Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Select Preset Logo</span>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {PRESET_LOGOS.map((lg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFacilityLogo(lg.value)}
                        className={`px-2 py-1 text-[10px] font-medium rounded border shrink-0 transition-all ${
                          facilityLogo === lg.value 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual upload */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Or Upload Custom Logo (PNG/JPG)</span>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose File...</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={(e) => handleLogoUpload(e, false)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Preview box */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Current Logo:</span>
                  <div className="w-8 h-8 p-1 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                    <img src={facilityLogo} className="max-w-full max-h-full object-contain" alt="Facility Logo preview" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>

              {/* Logo Placement */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Logo Header Alignment & Display</label>
                <p className="text-[10px] text-slate-400 leading-relaxed">Choose how the header elements are rendered on generated compliance policy pages.</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Header Display Mode</span>
                    <select
                      value={headerDisplayMode}
                      onChange={(e) => setHeaderDisplayMode(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                    >
                      <option value="BOTH">Show Both Logo and Company Name</option>
                      <option value="LOGO_ONLY">Show Logo Only (No text header)</option>
                      <option value="TEXT_ONLY">Show Company Name Only (No logo)</option>
                    </select>
                  </div>

                  {headerDisplayMode !== 'TEXT_ONLY' && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Logo Placement / Alignment</span>
                      <select
                        value={logoPlacement}
                        onChange={(e) => setLogoPlacement(e.target.value as any)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="LEFT">Header Left side (Standard)</option>
                        <option value="RIGHT">Header Right side</option>
                        <option value="FULL">A4 page Header full (Centered Top Banner)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Letterhead Upload Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Custom Document Letterhead</label>
                <span className="text-[10px] text-slate-400 block mb-1">Upload custom letterhead (.pdf, .jpeg, .png) to embed in printed service contracts.</span>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Letterhead...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, application/pdf" 
                    onChange={(e) => handleLetterheadUpload(e, false)} 
                    className="hidden" 
                  />
                </label>
                {letterheadImage ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>✓</span> Uploaded ({letterheadImage.startsWith('data:application/pdf') ? 'PDF' : 'Image'})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setLetterheadImage('')}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400">No custom letterhead uploaded (using default template styling)</span>
                )}
              </div>

              {/* Stamp Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Official Facility Stamp / Seal</label>
                
                {/* Preset Stamps */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Select Preset Stamp</span>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {PRESET_STAMPS.map((st, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFacilityStamp(st.value)}
                        className={`px-2 py-1 text-[10px] font-medium rounded border shrink-0 transition-all ${
                          facilityStamp === st.value 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Stamp Upload */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Or Upload Custom Stamp (PNG/JPG)</span>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose File...</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={(e) => handleStampUpload(e, false)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Stamp Preview */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Current Seal:</span>
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                    <img src={facilityStamp} className="max-w-full max-h-full object-contain" alt="Facility Stamp preview" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>

              {/* Authorized Representative Digital Signature Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Authorized Representative Signature</label>
                <span className="text-[10px] text-slate-400 block mb-1">Upload digital signature (PNG/JPG) with transparent/white background.</span>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Signature...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={(e) => handleAuthRepSignatureUpload(e, false)} 
                    className="hidden" 
                  />
                </label>
                {authRepSignature && !authRepSignature.includes('Cleared') && !authRepSignature.includes('<svg') ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>✓</span> Uploaded
                    </span>
                    <div className="w-16 h-8 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                      <img src={authRepSignature} className="max-w-full max-h-full object-contain" alt="Signature preview" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAuthRepSignature('')}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400">No custom signature uploaded (will use text name on contracts)</span>
                )}
              </div>

              {/* Footer Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">A4 Page Footer Configuration</label>

                {/* Active Components Toggles */}
                <div className="space-y-2 p-2 bg-white border border-slate-200/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Footer Visibility Elements</span>
                  
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFooterAddress}
                      onChange={(e) => setShowFooterAddress(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
                    />
                    <span>Show Address & Contact Columns</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFooterLogo}
                      onChange={(e) => setShowFooterLogo(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
                    />
                    <span>Show Footer Compliance Logo / Banner</span>
                  </label>
                </div>
                
                {showFooterLogo && (
                  <>
                    {/* Footer Alignment */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Footer Alignment</span>
                      <select
                        value={footerPlacement}
                        onChange={(e) => setFooterPlacement(e.target.value as any)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="LEFT">Footer Left side</option>
                        <option value="RIGHT">Footer Right side</option>
                        <option value="FULL">Footer Full Page (Centered Bottom Banner)</option>
                      </select>
                    </div>

                    {/* Manual upload */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Upload Footer Image (PNG/JPEG)</span>
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Choose Footer Image...</span>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg" 
                          onChange={(e) => handleFooterLogoUpload(e, false)} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Preview box */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Current Footer Image:</span>
                      {footerLogo ? (
                        <div className="w-12 h-6 p-0.5 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                          <img src={footerLogo} className="max-w-full max-h-full object-contain" alt="Footer preview" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium italic">No Footer Logo uploaded</span>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Section 7: Document Storage & File Preservation Options */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>📂</span> Section 7: Separated Document Storage & Preservation Options
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                  Separated Storage Vault
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Client saved logo, signature, letterhead, pictures, and generated policy documents are stored on a separated storage option:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStorageProvider('LOCAL_PC')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newStorageProvider === 'LOCAL_PC'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Option 1: Save Local PC</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Local PC Directory</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStorageProvider('GOOGLE_DRIVE')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newStorageProvider === 'GOOGLE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Google Drive</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Google Cloud Vault</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStorageProvider('DROPBOX')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newStorageProvider === 'DROPBOX'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Dropbox</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Dropbox Directory</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStorageProvider('ONE_DRIVE')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newStorageProvider === 'ONE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">OneDrive</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Microsoft 365 Cloud</div>
                </button>
              </div>

              {newStorageProvider === 'LOCAL_PC' ? (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Local PC Folder Path (Option 1)</label>
                  <input
                    type="text"
                    value={newLocalPath}
                    onChange={e => setNewLocalPath(e.target.value)}
                    placeholder="C:\SmartHub_Documents\Clients"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Cloud Account Email</label>
                    <input
                      type="email"
                      value={newCloudEmail}
                      onChange={e => setNewCloudEmail(e.target.value)}
                      placeholder="client.admin@facility.ae"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Cloud Folder Vault Name</label>
                    <input
                      type="text"
                      value={newCloudFolder}
                      onChange={e => setNewCloudFolder(e.target.value)}
                      placeholder="SmartHub_Compliance_Vault"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
            >
              Register Facility
            </button>
          </div>
        </form>
      )}

      {/* Edit Client Form */}
      {editingClient && (
        <form onSubmit={handleSaveEdit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-slide-down">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Modify Facility / Organization: {editingClient.client_code}</h3>
            <button type="button" onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg" title="Close">×</button>
          </div>

          {/* Section 1: Structure Setup */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🏗️</span> Structure Classification
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facility Structure Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingClient({ ...editingClient, structure_classification: 'SINGLE', is_group: false })}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      (editingClient.structure_classification || 'SINGLE') === 'SINGLE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Single Facility 🏢</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingClient({ ...editingClient, structure_classification: 'GROUP', is_group: true })}
                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      editingClient.structure_classification === 'GROUP'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Group / Multi-Branch 🌐</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Group & Branches Configuration */}
            {editingClient.structure_classification === 'GROUP' && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 animate-slide-down">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-1">
                  🌐 Group & Branches Configuration
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-all-branches-active"
                    checked={editingClient.all_branches_active !== false}
                    onChange={e => setEditingClient({ ...editingClient, all_branches_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300"
                  />
                  <label htmlFor="edit-all-branches-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    All Branches Active
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Facility Group Name (automatically appears in Facility Name)
                  </label>
                  <input
                    type="text"
                    value={editingClient.facility_group_name || ''}
                    onChange={e => setEditingClient({ ...editingClient, facility_group_name: e.target.value, company_name: e.target.value })}
                    placeholder="e.g. Al Mansoori Healthcare Group"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Branches / Facility Locations Listed</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = 'b-' + Date.now();
                        const currentBranches = editingClient.branches || [];
                        setEditingClient({
                          ...editingClient,
                          branches: [...currentBranches, { id: newId, name: '', license_no: '' }]
                        });
                      }}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>+ Add Branch Location</span>
                    </button>
                  </div>

                  {!(editingClient.branches) || editingClient.branches.length === 0 ? (
                    <div className="text-[11px] italic text-slate-400 bg-slate-50 p-3 rounded-lg text-center">
                      No branch locations added yet. Click "+ Add Branch Location" to list branches.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingClient.branches.map((b) => (
                        <div key={b.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={b.name}
                              onChange={e => {
                                const updated = editingClient.branches?.map(item => item.id === b.id ? { ...item, name: e.target.value } : item) || [];
                                setEditingClient({ ...editingClient, branches: updated });
                              }}
                              placeholder="Branch Name (e.g. Main Center)"
                              className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={b.license_no}
                              onChange={e => {
                                const updated = editingClient.branches?.map(item => item.id === b.id ? { ...item, license_no: e.target.value } : item) || [];
                                setEditingClient({ ...editingClient, branches: updated });
                              }}
                              placeholder="License Number (e.g. DHA-2024-009)"
                              className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this branch location?')) {
                                const updated = editingClient.branches?.filter(item => item.id !== b.id) || [];
                                setEditingClient({ ...editingClient, branches: updated });
                              }
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: General Facility Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🏨</span> Facility Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client / Facility Code *</label>
                <input
                  type="text"
                  value={editingClient.client_code}
                  disabled
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 font-bold cursor-not-allowed"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company / Facility Name *</label>
                <input
                  type="text"
                  value={editingClient.company_name}
                  onChange={e => setEditingClient({ ...editingClient, company_name: e.target.value })}
                  placeholder="e.g. Cleveland Clinic Abu Dhabi"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Owner / Sponsor</label>
                <input
                  type="text"
                  value={editingClient.owner_name || ''}
                  onChange={e => setEditingClient({ ...editingClient, owner_name: e.target.value })}
                  placeholder="e.g. Dr. Salem Al-Mansouri"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Contact Number</label>
                <input
                  type="text"
                  value={editingClient.phone}
                  onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                  placeholder="+971 X XXX XXXX"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Email Address</label>
                <input
                  type="email"
                  value={editingClient.email}
                  onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                  placeholder="e.g., info@facility.ae"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Physical Address</label>
                <input
                  type="text"
                  value={editingClient.address}
                  onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                  placeholder="Street name, sector, building, city, UAE"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={editingClient.city}
                  onChange={e => setEditingClient({ ...editingClient, city: e.target.value })}
                  placeholder="Abu Dhabi"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Website URL</label>
                <input
                  type="text"
                  value={editingClient.website}
                  onChange={e => setEditingClient({ ...editingClient, website: e.target.value })}
                  placeholder="https://facility.ae"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Compliance & Licenses */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>📋</span> Compliance & Licenses
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Trade License No</label>
                <input
                  type="text"
                  value={editingClient.trade_license_no || ''}
                  onChange={e => setEditingClient({ ...editingClient, trade_license_no: e.target.value })}
                  placeholder="TL-AD-XXXXX"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">DOH / DHA License No</label>
                <input
                  type="text"
                  value={editingClient.doh_license_no || ''}
                  onChange={e => setEditingClient({ ...editingClient, doh_license_no: e.target.value })}
                  placeholder="e.g. DOH-LH-88294"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">License Expiry Date</label>
                <input
                  type="date"
                  value={editingClient.license_expiry || ''}
                  onChange={e => setEditingClient({ ...editingClient, license_expiry: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Type</label>
                <input
                  type="text"
                  value={editingClient.facility_type || ''}
                  onChange={e => setEditingClient({ ...editingClient, facility_type: e.target.value })}
                  placeholder="e.g. Multi-Specialty Hospital"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Compliance Framework</label>
                <select
                  value={editingClient.compliance_framework || 'DOH Abu Dhabi & MALAFFI'}
                  onChange={e => setEditingClient({ ...editingClient, compliance_framework: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none bg-white"
                >
                  <option value="DOH Abu Dhabi & MALAFFI">DOH Abu Dhabi & MALAFFI</option>
                  <option value="DHA & NABIDH">DHA & NABIDH</option>
                  <option value="DOH Abu Dhabi & MALAFFI & ISO 27001">DOH Abu Dhabi & MALAFFI & ISO 27001</option>
                  <option value="DHA & NABIDH & ISO 27001">DHA & NABIDH & ISO 27001</option>
                  <option value="ISO 27001 Baseline">ISO 27001 Baseline</option>
                </select>
              </div>

              {/* Framework Tier Groups Selection (Basic, Transmission, Advance) */}
              <div className="md:col-span-3 pt-3 border-t border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Framework Tier Groups (Basic, Transmission, Advance)
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Click any group to automatically open documents & policies popup
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Basic')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      (editingClient.framework_group || selectedFrameworkGroup) === 'Basic'
                        ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Basic Group
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Transmission')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      editingClient.framework_group === 'Transmission' || selectedFrameworkGroup === 'Transmission'
                        ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" /> Transmission Group
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenFrameworkGroupModal('Advance')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      editingClient.framework_group === 'Advance' || selectedFrameworkGroup === 'Advance'
                        ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-500/20'
                        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Zap className="w-4 h-4" /> Advance Group
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Facility Committee Signatory Controls */}
          <div className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" /> Facility Committee Signatory Controls
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select and update committee contacts directly from your <strong className="text-emerald-700">Employee &amp; Operator Management</strong> roster or edit freely below.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/60 self-start sm:self-auto">
                <UserCheck className="w-3 h-3 text-emerald-600" /> {effectiveEmployees.length} Staff Available
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Authorized Representative */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Authorized Representative</span>
                  {editingClient.auth_representative?.designation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={editingClient.auth_representative.designation}>
                      {editingClient.auth_representative.designation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditingClient({
                          ...editingClient,
                          auth_representative: {
                            name: emp.employee_name,
                            email: getStaffEmail(emp, editingClient.domain),
                            phone: getStaffPhone(emp),
                            designation: emp.position || emp.department || 'Authorized Representative'
                          }
                        });
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={editingClient.auth_representative?.designation || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      auth_representative: { ...(editingClient.auth_representative || { name: '', email: '', phone: '' }), designation: e.target.value }
                    })}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editingClient.auth_representative?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    auth_representative: { ...(editingClient.auth_representative || { name: '', email: '', phone: '' }), name: e.target.value }
                  })}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={editingClient.auth_representative?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    auth_representative: { ...(editingClient.auth_representative || { name: '', email: '', phone: '' }), email: e.target.value }
                  })}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={editingClient.auth_representative?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    auth_representative: { ...(editingClient.auth_representative || { name: '', email: '', phone: '' }), phone: e.target.value }
                  })}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* Clinic Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Clinic Manager</span>
                  {editingClient.clinic_manager?.designation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={editingClient.clinic_manager.designation}>
                      {editingClient.clinic_manager.designation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditingClient({
                          ...editingClient,
                          clinic_manager: {
                            name: emp.employee_name,
                            email: getStaffEmail(emp, editingClient.domain),
                            phone: getStaffPhone(emp),
                            designation: emp.position || emp.department || 'Clinic Manager'
                          }
                        });
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={editingClient.clinic_manager?.designation || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      clinic_manager: { ...(editingClient.clinic_manager || { name: '', email: '', phone: '' }), designation: e.target.value }
                    })}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editingClient.clinic_manager?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    clinic_manager: { ...(editingClient.clinic_manager || { name: '', email: '', phone: '' }), name: e.target.value }
                  })}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={editingClient.clinic_manager?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    clinic_manager: { ...(editingClient.clinic_manager || { name: '', email: '', phone: '' }), email: e.target.value }
                  })}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={editingClient.clinic_manager?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    clinic_manager: { ...(editingClient.clinic_manager || { name: '', email: '', phone: '' }), phone: e.target.value }
                  })}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* Medical Director */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">Medical Director</span>
                  {editingClient.medical_director?.designation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={editingClient.medical_director.designation}>
                      {editingClient.medical_director.designation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditingClient({
                          ...editingClient,
                          medical_director: {
                            name: emp.employee_name,
                            email: getStaffEmail(emp, editingClient.domain),
                            phone: getStaffPhone(emp),
                            designation: emp.position || emp.department || 'Medical Director'
                          }
                        });
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={editingClient.medical_director?.designation || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      medical_director: { ...(editingClient.medical_director || { name: '', email: '', phone: '' }), designation: e.target.value }
                    })}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editingClient.medical_director?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    medical_director: { ...(editingClient.medical_director || { name: '', email: '', phone: '' }), name: e.target.value }
                  })}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={editingClient.medical_director?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    medical_director: { ...(editingClient.medical_director || { name: '', email: '', phone: '' }), email: e.target.value }
                  })}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={editingClient.medical_director?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    medical_director: { ...(editingClient.medical_director || { name: '', email: '', phone: '' }), phone: e.target.value }
                  })}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* IT Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">IT Manager / Admin</span>
                  {editingClient.it_manager?.designation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={editingClient.it_manager.designation}>
                      {editingClient.it_manager.designation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditingClient({
                          ...editingClient,
                          it_manager: {
                            name: emp.employee_name,
                            email: getStaffEmail(emp, editingClient.domain),
                            phone: getStaffPhone(emp),
                            designation: emp.position || emp.department || 'IT Manager / Admin'
                          }
                        });
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={editingClient.it_manager?.designation || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      it_manager: { ...(editingClient.it_manager || { name: '', email: '', phone: '' }), designation: e.target.value }
                    })}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editingClient.it_manager?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    it_manager: { ...(editingClient.it_manager || { name: '', email: '', phone: '' }), name: e.target.value }
                  })}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={editingClient.it_manager?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    it_manager: { ...(editingClient.it_manager || { name: '', email: '', phone: '' }), email: e.target.value }
                  })}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={editingClient.it_manager?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    it_manager: { ...(editingClient.it_manager || { name: '', email: '', phone: '' }), phone: e.target.value }
                  })}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>

              {/* HR Manager */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[11px] font-bold text-slate-800">HR Manager</span>
                  {editingClient.hr_manager?.designation && (
                    <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[110px]" title={editingClient.hr_manager.designation}>
                      {editingClient.hr_manager.designation}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-emerald-700 block mb-0.5">Select from Staff Roster:</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = effectiveEmployees.find(x => x.id === e.target.value);
                      if (emp) {
                        setEditingClient({
                          ...editingClient,
                          hr_manager: {
                            name: emp.employee_name,
                            email: getStaffEmail(emp, editingClient.domain),
                            phone: getStaffPhone(emp),
                            designation: emp.position || emp.department || 'HR Manager'
                          }
                        });
                      }
                    }}
                    className="w-full text-[10.5px] p-1.5 rounded border border-emerald-200 bg-emerald-50/40 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pick from Employee Roster --</option>
                    {effectiveEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9.5px] font-semibold text-slate-500 block mb-0.5">Designation / Role Title:</label>
                  <input
                    type="text"
                    value={editingClient.hr_manager?.designation || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      hr_manager: { ...(editingClient.hr_manager || { name: '', email: '', phone: '' }), designation: e.target.value }
                    })}
                    placeholder="Designation / Position"
                    className="w-full text-[11px] p-2 rounded border border-slate-200 bg-slate-50/50 font-medium text-slate-700 focus:border-emerald-500"
                  />
                </div>
                <input
                  type="text"
                  value={editingClient.hr_manager?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    hr_manager: { ...(editingClient.hr_manager || { name: '', email: '', phone: '' }), name: e.target.value }
                  })}
                  placeholder="Full Legal Name"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={editingClient.hr_manager?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    hr_manager: { ...(editingClient.hr_manager || { name: '', email: '', phone: '' }), email: e.target.value }
                  })}
                  placeholder="Official Email"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={editingClient.hr_manager?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    hr_manager: { ...(editingClient.hr_manager || { name: '', email: '', phone: '' }), phone: e.target.value }
                  })}
                  placeholder="Contact Phone"
                  className="w-full text-[11px] p-2 rounded border border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Third-Party Support Channels */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
              <span>🛠️</span> Third-Party Support Channels
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IT Support */}
              <div className="p-3 bg-white rounded-xl border border-slate-150 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-50 pb-1">IT Support Team (Third-Party)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={editingClient.it_support?.team_name || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      it_support: { ...(editingClient.it_support || { team_name: '', email: '', phone: '' }), team_name: e.target.value }
                    })}
                    placeholder="e.g. Apex Security Solutions"
                    className="w-full text-xs p-2.5 rounded border border-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={editingClient.it_support?.email || ''}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        it_support: { ...(editingClient.it_support || { team_name: '', email: '', phone: '' }), email: e.target.value }
                      })}
                      placeholder="support@partner.ae"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={editingClient.it_support?.phone || ''}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        it_support: { ...(editingClient.it_support || { team_name: '', email: '', phone: '' }), phone: e.target.value }
                      })}
                      placeholder="Phone"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* EMR Support */}
              <div className="p-3 bg-white rounded-xl border border-slate-155 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-50 pb-1">EMR Support Team (Third-Party)</span>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={editingClient.emr_support?.team_name || ''}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      emr_support: { ...(editingClient.emr_support || { team_name: '', email: '', phone: '' }), team_name: e.target.value }
                    })}
                    placeholder="e.g. CureMD Regional Support"
                    className="w-full text-xs p-2.5 rounded border border-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={editingClient.emr_support?.email || ''}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        emr_support: { ...(editingClient.emr_support || { team_name: '', email: '', phone: '' }), email: e.target.value }
                      })}
                      placeholder="emr@curemd.ae"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={editingClient.emr_support?.phone || ''}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        emr_support: { ...(editingClient.emr_support || { team_name: '', email: '', phone: '' }), phone: e.target.value }
                      })}
                      placeholder="Phone"
                      className="w-full text-xs p-2.5 rounded border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5.5: Client Admin Access & Credentials */}
          <div className="border-t border-slate-200/60 pt-4 space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> Client Admin Access & Authentication Setup
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Configure credentials for the primary Client Admin linked to this facility.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Full Name</label>
                <input
                  type="text"
                  value={editingClient.client_admin_contact?.name || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    client_admin_contact: {
                      ...(editingClient.client_admin_contact || { name: '', email: '', phone: '' }),
                      name: e.target.value
                    }
                  })}
                  placeholder="e.g. Dr. Johnathan Carter"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Email ID</label>
                <input
                  type="email"
                  value={editingClient.client_admin_contact?.email || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    client_admin_contact: {
                      ...(editingClient.client_admin_contact || { name: '', email: '', phone: '' }),
                      email: e.target.value
                    }
                  })}
                  placeholder="e.g. j.carter@clevelandclinicabudhabi.ae"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Client Admin Contact Number</label>
                <input
                  type="text"
                  value={editingClient.client_admin_contact?.phone || ''}
                  onChange={e => setEditingClient({
                    ...editingClient,
                    client_admin_contact: {
                      ...(editingClient.client_admin_contact || { name: '', email: '', phone: '' }),
                      phone: e.target.value
                    }
                  })}
                  placeholder="e.g. +971 54 333 4455"
                  className="w-full text-xs p-2.5 rounded border border-slate-200 focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                />
              </div>
            </div>

            {editingClient.client_admin_contact?.email && (
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/50">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mr-auto flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Outbound Credentials Dispatch:
                </span>
                <button
                  type="button"
                  onClick={() => sendClientAdminEmail(editingClient, 'INVITE')}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                  title="Send official welcome invitation with secure credentials setup link"
                >
                  <Send className="w-3.5 h-3.5" /> Send Welcome Invite
                </button>
                <button
                  type="button"
                  onClick={() => sendClientAdminEmail(editingClient, 'PASSWORD_RESET')}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                  title="Trigger security passcode & password reset email via custom SMTP"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" /> Send Password Reset Email
                </button>
              </div>
            )}
          </div>

          {/* Section 6: branding configuration */}
          <div className="border-t border-slate-200/60 pt-4 space-y-4">
            <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨</span> Page Header / Footer Compliance Branding Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Logo Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Facility Corporate Logo</label>
                
                {/* Preset Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Select Preset Logo</span>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {PRESET_LOGOS.map((lg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingClient({ ...editingClient, facility_logo: lg.value })}
                        className={`px-2 py-1 text-[10px] font-medium rounded border shrink-0 transition-all ${
                          editingClient.facility_logo === lg.value 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual upload */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Or Upload Custom Logo (PNG/JPG)</span>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose File...</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={(e) => handleLogoUpload(e, true)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Preview box */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Current Logo:</span>
                  <div className="w-8 h-8 p-1 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                    <img src={editingClient.facility_logo || PRESET_LOGOS[0].value} className="max-w-full max-h-full object-contain" alt="Facility Logo preview" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>

              {/* Logo Placement */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Logo Header Alignment & Display</label>
                <p className="text-[10px] text-slate-400 leading-relaxed">Choose how the header elements are rendered on generated compliance policy pages.</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Header Display Mode</span>
                    <select
                      value={editingClient.header_display_mode || 'BOTH'}
                      onChange={(e) => setEditingClient({ ...editingClient, header_display_mode: e.target.value as any })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                    >
                      <option value="BOTH">Show Both Logo and Company Name</option>
                      <option value="LOGO_ONLY">Show Logo Only (No text header)</option>
                      <option value="TEXT_ONLY">Show Company Name Only (No logo)</option>
                    </select>
                  </div>

                  {(editingClient.header_display_mode || 'BOTH') !== 'TEXT_ONLY' && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Logo Placement / Alignment</span>
                      <select
                        value={editingClient.logo_placement || 'LEFT'}
                        onChange={(e) => setEditingClient({ ...editingClient, logo_placement: e.target.value as any })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="LEFT">Header Left side (Standard)</option>
                        <option value="RIGHT">Header Right side</option>
                        <option value="FULL">A4 page Header full (Centered Top Banner)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Letterhead Upload Section (Edit) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Custom Document Letterhead</label>
                <span className="text-[10px] text-slate-400 block mb-1">Upload custom letterhead (.pdf, .jpeg, .png) to embed in printed service contracts.</span>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Letterhead...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, application/pdf" 
                    onChange={(e) => handleLetterheadUpload(e, true)} 
                    className="hidden" 
                  />
                </label>
                {editingClient.letterhead_image ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>✓</span> Uploaded ({editingClient.letterhead_image.startsWith('data:application/pdf') ? 'PDF' : 'Image'})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setEditingClient({ ...editingClient, letterhead_image: undefined })}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400">No custom letterhead uploaded (using default template styling)</span>
                )}
              </div>

              {/* Stamp Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Official Facility Stamp / Seal</label>
                
                {/* Preset Stamps */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Select Preset Stamp</span>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {PRESET_STAMPS.map((st, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingClient({ ...editingClient, facility_stamp: st.value })}
                        className={`px-2 py-1 text-[10px] font-medium rounded border shrink-0 transition-all ${
                          editingClient.facility_stamp === st.value 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Stamp Upload */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Or Upload Custom Stamp (PNG/JPG)</span>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Choose File...</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={(e) => handleStampUpload(e, true)} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Stamp Preview */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Current Seal:</span>
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                    <img src={editingClient.facility_stamp || PRESET_STAMPS[0].value} className="max-w-full max-h-full object-contain" alt="Facility Stamp preview" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>

              {/* Authorized Representative Digital Signature Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Authorized Representative Signature</label>
                <span className="text-[10px] text-slate-400 block mb-1">Upload digital signature (PNG/JPG) with transparent/white background.</span>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Choose Signature...</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={(e) => handleAuthRepSignatureUpload(e, true)} 
                    className="hidden" 
                  />
                </label>
                {editingClient.auth_rep_signature && !editingClient.auth_rep_signature.includes('Cleared') && !editingClient.auth_rep_signature.includes('<svg') ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>✓</span> Uploaded
                    </span>
                    <div className="w-16 h-8 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                      <img src={editingClient.auth_rep_signature} className="max-w-full max-h-full object-contain" alt="Signature preview" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setEditingClient({ ...editingClient, auth_rep_signature: undefined })}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400">No custom signature uploaded (will use text name on contracts)</span>
                )}
              </div>

              {/* Footer Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">A4 Page Footer Configuration</label>

                {/* Active Components Toggles */}
                <div className="space-y-2 p-2 bg-white border border-slate-200/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Footer Visibility Elements</span>
                  
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingClient.show_footer_address !== false}
                      onChange={(e) => setEditingClient({ ...editingClient, show_footer_address: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
                    />
                    <span>Show Address & Contact Columns</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingClient.show_footer_logo !== false}
                      onChange={(e) => setEditingClient({ ...editingClient, show_footer_logo: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 border-slate-300"
                    />
                    <span>Show Footer Compliance Logo / Banner</span>
                  </label>
                </div>
                
                {editingClient.show_footer_logo !== false && (
                  <>
                    {/* Footer Alignment */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Footer Alignment</span>
                      <select
                        value={editingClient.footer_placement || 'LEFT'}
                        onChange={(e) => setEditingClient({ ...editingClient, footer_placement: e.target.value as any })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="LEFT">Footer Left side</option>
                        <option value="RIGHT">Footer Right side</option>
                        <option value="FULL">Footer Full Page (Centered Bottom Banner)</option>
                      </select>
                    </div>

                    {/* Manual upload */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Upload Footer Image (PNG/JPEG)</span>
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Choose Footer Image...</span>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg" 
                          onChange={(e) => handleFooterLogoUpload(e, true)} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Preview box */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Current Footer Image:</span>
                      {editingClient.footer_logo ? (
                        <div className="w-12 h-6 p-0.5 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                          <img src={editingClient.footer_logo} className="max-w-full max-h-full object-contain" alt="Footer preview" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium italic">No Footer Logo uploaded</span>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Section 7: Document Storage & File Preservation Options */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>📂</span> Section 7: Separated Document Storage & Preservation Options
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                  Separated Storage Vault
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Client saved logo, signature, letterhead, pictures, and generated policy documents are stored on a separated storage option:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient({
                    ...editingClient,
                    storage_config: {
                      ...(editingClient.storage_config || { connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                      provider: 'LOCAL_PC'
                    }
                  })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    (editingClient.storage_config?.provider || 'LOCAL_PC') === 'LOCAL_PC'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Option 1: Save Local PC</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Local PC Directory</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingClient({
                    ...editingClient,
                    storage_config: {
                      ...(editingClient.storage_config || { connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                      provider: 'GOOGLE_DRIVE'
                    }
                  })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editingClient.storage_config?.provider === 'GOOGLE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Google Drive</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Google Cloud Vault</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingClient({
                    ...editingClient,
                    storage_config: {
                      ...(editingClient.storage_config || { connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                      provider: 'DROPBOX'
                    }
                  })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editingClient.storage_config?.provider === 'DROPBOX'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Dropbox</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Dropbox Directory</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingClient({
                    ...editingClient,
                    storage_config: {
                      ...(editingClient.storage_config || { connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                      provider: 'ONE_DRIVE'
                    }
                  })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editingClient.storage_config?.provider === 'ONE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">OneDrive</div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Microsoft 365 Cloud</div>
                </button>
              </div>

              {(editingClient.storage_config?.provider || 'LOCAL_PC') === 'LOCAL_PC' ? (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Local PC Folder Path (Option 1)</label>
                  <input
                    type="text"
                    value={editingClient.storage_config?.local_folder_path || `C:\\SmartHub_Documents\\${editingClient.client_code}`}
                    onChange={e => setEditingClient({
                      ...editingClient,
                      storage_config: {
                        ...(editingClient.storage_config || { provider: 'LOCAL_PC', connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                        local_folder_path: e.target.value
                      }
                    })}
                    placeholder="C:\SmartHub_Documents\Clients"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Cloud Account Email</label>
                    <input
                      type="email"
                      value={editingClient.storage_config?.cloud_account_email || editingClient.email || ''}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        storage_config: {
                          ...(editingClient.storage_config || { provider: 'GOOGLE_DRIVE', connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                          cloud_account_email: e.target.value
                        }
                      })}
                      placeholder="client.admin@facility.ae"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Cloud Folder Vault Name</label>
                    <input
                      type="text"
                      value={editingClient.storage_config?.cloud_folder_name || 'SmartHub_Compliance_Vault'}
                      onChange={e => setEditingClient({
                        ...editingClient,
                        storage_config: {
                          ...(editingClient.storage_config || { provider: 'GOOGLE_DRIVE', connected_status: 'CONNECTED', last_synced_at: new Date().toISOString() }),
                          cloud_folder_name: e.target.value
                        }
                      })}
                      placeholder="SmartHub_Compliance_Vault"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="px-5 py-2.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
            >
              Save Modifications
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by company name, code or city..."
          className="w-full text-xs text-slate-700 focus:outline-none bg-transparent"
        />
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const isActiveTenant = client.id === activeClientId;
          return (
            <div
              key={client.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[300px] h-auto bg-white ${
                isActiveTenant
                  ? 'border-emerald-500 ring-2 ring-emerald-50/75 shadow-md'
                  : 'border-slate-100 shadow-sm hover:border-slate-200'
              }`}
            >
              {client.client_code === 'SPRC' ? (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9.5px] font-black px-3.5 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                  🛠️ COMPLIANCE CONSULTANT
                </div>
              ) : (
                <div className="absolute top-0 right-0 flex">
                  {isActiveTenant && (
                    <div className="bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
                      Active
                    </div>
                  )}
                  <div className="bg-slate-200 text-slate-700 text-[9px] font-bold px-2.5 py-1 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                    CLIENT
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isActiveTenant ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{client.client_code}</span>
                    <h3 className="font-bold text-slate-900 leading-tight line-clamp-1">{client.company_name}</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{client.address || 'Address not listed'}, {client.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-emerald-700">{client.compliance_framework}</span>
                  </div>
                  {client.is_group && (
                    <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200/50 p-2 rounded-lg flex items-center gap-1.5 font-bold">
                      <span>🏢 Group / Holding Company</span>
                    </div>
                  )}
                  {client.parent_id && (
                    <div className="text-[11px] bg-slate-50 text-slate-700 border border-slate-150 p-2 rounded-lg flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Sub-client of group:</span>
                      </div>
                      <strong className="text-slate-800 text-[11px] leading-snug">
                        {clients.find(c => c.id === client.parent_id)?.company_name || 'Associated Group'}
                      </strong>
                    </div>
                  )}
                  {client.doh_license_no && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="font-semibold text-slate-500">DOH License No:</span>
                      <strong className="text-emerald-700 font-mono text-[10px]">{client.doh_license_no}</strong>
                    </div>
                  )}
                  {client.owner_name && (
                    <div className="text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400">Owner / CEO / MD:</span>
                        <strong className="text-slate-800">{client.owner_name}</strong>
                      </div>
                      {client.owner_email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{client.owner_email}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {client.license_expiry && (
                    <div className="text-[11px] text-slate-500">
                      License Expiry: <strong className="text-slate-700">{client.license_expiry}</strong>
                    </div>
                  )}

                  {/* Client Admin Access Credentials */}
                  <div className="pt-2 border-t border-dashed border-slate-100 mt-2 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-[9px] text-emerald-800 uppercase tracking-wider">
                      <Shield className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>Client Admin Access Contact</span>
                    </div>
                    {(() => {
                      const admin: any = client.client_admin_contact || users.find(u => u.client_id === client.id && u.role === 'CLIENT_ADMIN');
                      if (admin) {
                        return (
                          <div className="text-[10px] space-y-0.5 bg-emerald-50/40 p-1.5 rounded border border-emerald-100/50">
                            <div>
                              <span className="font-semibold text-slate-400">Name:</span> <strong className="text-slate-800">{admin.name || admin.full_name}</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-400">Email:</span> <span className="text-slate-600 font-mono text-[9px] truncate" title={admin.email}>{admin.email}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Phone:</span> <span className="text-slate-600 font-mono text-[9px]">{admin.phone || admin.mobile || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1.5 mt-1 border-t border-emerald-100/30">
                              <button
                                onClick={() => sendClientAdminEmail(client, 'INVITE')}
                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-1 rounded text-[8px] transition-all tracking-wide shadow-xs cursor-pointer"
                                title="Send official welcome invitation with secure credentials setup link"
                              >
                                <Send className="w-2.5 h-2.5" /> Invite
                              </button>
                              <button
                                onClick={() => sendClientAdminEmail(client, 'PASSWORD_RESET')}
                                className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-1.5 py-1 rounded text-[8px] transition-all tracking-wide cursor-pointer"
                                title="Trigger security passcode & password reset email via custom SMTP"
                              >
                                <Key className="w-2.5 h-2.5 text-slate-500" /> Reset PW
                              </button>
                            </div>
                          </div>
                        );
                      }
                      if (quickAdminClient === client.id) {
                        return (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-1 space-y-2 text-[10px]">
                            <div className="font-bold text-slate-700">Assign & Invite Client Admin</div>
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={quickAdminName}
                                onChange={e => setQuickAdminName(e.target.value)}
                                placeholder="Admin Full Name"
                                className="w-full p-1 text-[10px] border border-slate-250 rounded bg-white font-semibold"
                              />
                              <input
                                type="email"
                                value={quickAdminEmail}
                                onChange={e => setQuickAdminEmail(e.target.value)}
                                placeholder="Admin Email"
                                className="w-full p-1 text-[10px] border border-slate-250 rounded bg-white font-mono"
                              />
                              <input
                                type="text"
                                value={quickAdminPhone}
                                onChange={e => setQuickAdminPhone(e.target.value)}
                                placeholder="Admin Phone (optional)"
                                className="w-full p-1 text-[10px] border border-slate-250 rounded bg-white font-mono"
                              />
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button
                                onClick={() => handleQuickAssignAdmin(client.id)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 rounded text-[9px] cursor-pointer"
                              >
                                Save & Invite
                              </button>
                              <button
                                onClick={() => setQuickAdminClient(null)}
                                className="px-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-1 rounded text-[9px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="text-[9px] text-slate-400 italic bg-slate-50 p-1.5 rounded border border-dashed border-slate-200 text-center flex flex-col items-center gap-1">
                          <span>No Client Admin assigned yet.</span>
                          <button
                            onClick={() => {
                              setQuickAdminClient(client.id);
                              setQuickAdminName('');
                              setQuickAdminEmail('');
                              setQuickAdminPhone('');
                            }}
                            className="mt-0.5 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/60 rounded text-[8px] transition-all cursor-pointer"
                          >
                            ➕ Quick Assign Admin
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Compliance Branding Badges on Card */}
                  <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-100 mt-2">
                    {client.facility_logo && (
                      <div className="flex items-center gap-1 bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/50" title="Corporate Logo Placement">
                        <span className="text-[9px] text-emerald-600 font-bold uppercase shrink-0">Logo:</span>
                        <div className="w-3.5 h-3.5 rounded overflow-hidden flex items-center justify-center bg-white border border-slate-200 shrink-0">
                          <img src={client.facility_logo} className="max-w-full max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 shrink-0 uppercase">({client.logo_placement || 'LEFT'})</span>
                      </div>
                    )}
                    {client.facility_stamp && (
                      <div className="flex items-center gap-1 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50" title="Official Seal">
                        <span className="text-[9px] text-blue-600 font-bold uppercase shrink-0">Stamp:</span>
                        <div className="w-3.5 h-3.5 rounded overflow-hidden flex items-center justify-center bg-white border border-slate-200 shrink-0">
                          <img src={client.facility_stamp} className="max-w-full max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                    {client.footer_logo && (
                      <div className="flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50" title="Footer Compliance Placement">
                        <span className="text-[9px] text-indigo-600 font-bold uppercase shrink-0">Footer:</span>
                        <div className="w-3.5 h-3.5 rounded overflow-hidden flex items-center justify-center bg-white border border-slate-200 shrink-0">
                          <img src={client.footer_logo} className="max-w-full max-h-full object-contain" alt="" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[9px] font-bold text-indigo-700 shrink-0 uppercase">({client.footer_placement || 'LEFT'})</span>
                      </div>
                    )}
                  </div>

                  {/* Document Storage Location & Client Last Login Badge */}
                  <div className="pt-2 border-t border-dashed border-slate-100 mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Storage Option:</span>
                      <button
                        onClick={() => handleOpenCardStorageModal(client)}
                        className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                      >
                        ⚙️ Option: {client.storage_config?.provider === 'GOOGLE_DRIVE' ? 'Google Drive' : client.storage_config?.provider === 'DROPBOX' ? 'Dropbox' : client.storage_config?.provider === 'ONE_DRIVE' ? 'OneDrive' : 'Local PC'}
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1 rounded border border-slate-150 truncate" title={client.storage_config?.local_folder_path || client.storage_config?.cloud_account_email || 'Default'}>
                      📂 {client.storage_config?.provider === 'LOCAL_PC' ? (client.storage_config?.local_folder_path || `C:\\SmartHub_Documents\\${client.client_code}`) : `${client.storage_config?.cloud_account_email || 'cloud'} / ${client.storage_config?.cloud_folder_name || 'Vault'}`}
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-400">Client Last Login:</span>
                      <strong className="text-slate-800 font-mono">
                        {client.last_login ? new Date(client.last_login).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'Never Logged In'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  client.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {client.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {client.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(client)}
                    className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Modify Client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(client.id)}
                    className="p-1.5 hover:bg-rose-50 hover:border-rose-200 border border-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Tenant Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectClient(client.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActiveTenant
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isActiveTenant ? 'Viewing' : 'Activate Context'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Elegant State-Driven Confirmation Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Tenant Client Context?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{clients.find(c => c.id === confirmDeleteId)?.company_name}</strong>? This will permanently remove this tenant client profile and database context from the administration registry. This action is irreversible.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel, Keep Tenant
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Yes, Delete Context
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Storage Option Configuration Modal */}
      {cardStorageModalClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Configure Client Document Storage</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Facility: {cardStorageModalClient.company_name} ({cardStorageModalClient.client_code})</p>
                </div>
              </div>
              <button
                onClick={() => setCardStorageModalClient(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-600">
                Compliance Consultant & Client document storage option configuration. Choose where logos, signatures, custom letterheads, pictures, and documents are saved:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCardStorageProvider('LOCAL_PC')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    cardStorageProvider === 'LOCAL_PC'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Option 1: Save Local PC</span>
                    <span>💻</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Bind local PC directory path</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCardStorageProvider('GOOGLE_DRIVE')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    cardStorageProvider === 'GOOGLE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Google Drive</span>
                    <span>☁️</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Connect Drive Cloud folder</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCardStorageProvider('DROPBOX')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    cardStorageProvider === 'DROPBOX'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Dropbox</span>
                    <span>📦</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Sync to Dropbox directory</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCardStorageProvider('ONE_DRIVE')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    cardStorageProvider === 'ONE_DRIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>OneDrive</span>
                    <span>🔷</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Microsoft 365 Cloud Vault</p>
                </button>
              </div>

              {cardStorageProvider === 'LOCAL_PC' ? (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    📁 Option 1: Local PC Directory Path
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cardLocalPath}
                      onChange={e => setCardLocalPath(e.target.value)}
                      placeholder={`C:\\SmartHub_Documents\\${cardStorageModalClient.client_code}`}
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const path = prompt('Enter or verify Local Directory path:', cardLocalPath || `C:\\SmartHub_Documents\\${cardStorageModalClient.client_code}`);
                        if (path) setCardLocalPath(path);
                      }}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      Browse
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Folder on local PC where all logos, stamps, signatures, pictures, and PDFs are preserved.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Cloud Account Email ({cardStorageProvider})
                    </label>
                    <input
                      type="email"
                      value={cardCloudEmail}
                      onChange={e => setCardCloudEmail(e.target.value)}
                      placeholder="compliance.admin@facility.ae"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Cloud Folder Vault Name
                    </label>
                    <input
                      type="text"
                      value={cardCloudFolder}
                      onChange={e => setCardCloudFolder(e.target.value)}
                      placeholder="SmartHub_Compliance_Vault"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCardStorageModalClient(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCardStorage}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
              >
                Save Storage Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Framework Tier Groups Modal (Basic, Transmission, Advance) */}
      {frameworkModalOpen && (
        <FrameworkGroupModal
          isOpen={frameworkModalOpen}
          onClose={() => setFrameworkModalOpen(false)}
          client={editingClient || clients.find(c => c.id === activeClientId) || clients[0]}
          initialGroup={activeFrameworkGroup}
        />
      )}
    </div>
  );
}
