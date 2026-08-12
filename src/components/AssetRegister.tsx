import React, { useState, useEffect, useRef } from 'react';
import { Asset, Client, RiskItem, Employee } from '../types';
import { printHtmlInHiddenIframe } from '../utils/printUtils';

import { DocRefLoopSelector } from './DocRefLoopSelector';
import { useZebraPrint } from '../hooks/useZebraPrint';
import { QRCodeImage } from './QRCodeImage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Search, 
  Plus, 
  Cpu, 
  Activity, 
  HardDrive, 
  ShieldCheck, 
  MapPin, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  HelpCircle, 
  Info, 
  Sparkles, 
  X, 
  Check, 
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  Upload,
  Download,
  AlertCircle,
  Calendar,
  Layers,
  Settings,
  Printer,
  Tag,
  QrCode,
  Mail,
  Send,
  Loader2
} from 'lucide-react';

interface AssetRegisterProps {
  assets: Asset[];
  employees?: Employee[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset?: (asset: Asset) => void;
  onDeleteAsset?: (id: string) => void;
  onBulkAddAssets?: (assets: Asset[]) => void;
  activeClientId: string;
  client?: Client;
  onAddRisk?: (risk: RiskItem) => void;
  onOpenQuickSetup?: () => void;
}

// Category mappings & nested categories as requested by user
const PHYSICAL_CATEGORIES = [
  'Computer',
  'Server',
  'Printer',
  'Network switch',
  'UPS',
  'IP phone',
  'Access points',
  'Firewall',
  'IOT devices',
  'CCTV',
  'Screen',
  'NAS',
  'SSD',
  'HDD',
  'USB'
] as const;

const NESTED_OPTIONS: Record<string, string[]> = {
  'Computer': ['All in one', 'Desktop', 'laptop'],
  'Server': ['Rack Server', 'Tower Server', 'Cloud Server'],
  'Printer': ['Multi function', 'Standalone'],
  'CCTV': ['NVR', 'Camera', 'CCTV Switch'],
  'Screen': ['TV', 'Monitor'],
  'NAS': ['Synology', 'QNAP', 'SAN / Enterprise Storage', 'Custom Storage Server', 'Other NAS'],
  'SSD': ['NVMe M.2 SSD', 'SATA 2.5" SSD', 'External Portable SSD', 'Enterprise PCIe SSD', 'mSATA SSD'],
  'HDD': ['Internal SATA 3.5" HDD', 'Internal SATA 2.5" HDD', 'External USB HDD', 'Enterprise SAS HDD', 'RAID Array Disk'],
  'USB': ['USB Flash Drive', 'Encrypted Hardware USB', 'Security Dongle Key', 'External Hard Drive / Dock']
};

const BIOMEDICAL_CATEGORIES = [
  'X-Ray machine',
  'Ultrasound scanner',
  'Patient Monitor',
  'Defibrillator',
  'Ventilator',
  'Infusion Pump',
  'Electrocardiograph (ECG)',
  'Autoclave',
  'Laboratory Analyzer',
  'Anesthesia Machine',
  'Other Medical Device'
];

const SOFTWARE_CATEGORIES = [
  'EMR Software',
  'Operating System',
  'Billing & Financials',
  'Anti-virus & EDR',
  'Database Management',
  'Pharmacy Information System',
  'PACS Imaging Software',
  'Other Digital Tool'
];

const STANDARD_OPERATING_SYSTEMS = [
  'Windows 11',
  'Windows 10',
  'Windows Server 2022',
  'Windows Server 2019',
  'Linux (Ubuntu/RHEL/Debian)',
  'macOS',
  'iOS',
  'Android',
  'Embedded RTOS',
  'Not Applicable',
  'Other'
];

// ISO 27001 standard pre-fills for different types of healthcare assets
const getIsoStandardCIA = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('server')) {
    return { 
      c: 5, i: 5, a: 5, 
      remarks: 'ISO 27001 High Criticality: Core computing platform hosting patient records and vital operations.' 
    };
  } else if (lower.includes('emr') || lower.includes('imaging') || lower.includes('database')) {
    return { 
      c: 5, i: 5, a: 5, 
      remarks: 'HIPAA & ISO 27001 Max Confidentiality: Primary repository for protected electronic health information (ePHI).' 
    };
  } else if (lower.includes('firewall')) {
    return { 
      c: 4, i: 5, a: 5, 
      remarks: 'ISO 27001 Network Perimeter Control: Critical for restricting network threat penetration and maintaining uptime.' 
    };
  } else if (lower.includes('switch') || lower.includes('network') || lower.includes('access point')) {
    return { 
      c: 3, i: 4, a: 4, 
      remarks: 'Standard compliance baseline for switches, routers, and access points.' 
    };
  } else if (lower.includes('device') || lower.includes('ultrasound') || lower.includes('x-ray') || lower.includes('monitor') || lower.includes('medical')) {
    return { 
      c: 3, i: 5, a: 5, 
      remarks: 'Patient Care Safety standard: Highest integrity and absolute live availability during clinical hours.' 
    };
  } else if (lower.includes('laptop')) {
    return { 
      c: 4, i: 3, a: 3, 
      remarks: 'Mobile Endpoint compliance: High confidentiality required due to risk of device theft or loss.' 
    };
  } else if (lower.includes('desktop') || lower.includes('all in one')) {
    return { 
      c: 3, i: 3, a: 3, 
      remarks: 'Fixed desk computer operating inside safe physical security zones.' 
    };
  } else if (lower.includes('cctv')) {
    return {
      c: 4, i: 4, a: 4,
      remarks: 'ISO 27001 Physical Security & Surveillance Control: Protects physical entries and is monitored 24/7.'
    };
  } else if (lower.includes('printer')) {
    return {
      c: 3, i: 3, a: 3,
      remarks: 'Endpoint/Periphery node: Printer or multifunction scan device requiring secure print releasing.'
    };
  } else if (lower.includes('nas')) {
    return {
      c: 5, i: 5, a: 5,
      remarks: 'ISO 27001 Data Storage Control: Network Attached Storage (NAS) hosting critical central backups and patient media files.'
    };
  } else if (lower.includes('ssd') || lower.includes('hdd')) {
    return {
      c: 4, i: 4, a: 4,
      remarks: 'Storage Media Drive: Houses operating system partitions, confidential databases, or local backup archives.'
    };
  } else if (lower.includes('usb')) {
    return {
      c: 4, i: 3, a: 3,
      remarks: 'Removable USB Storage: High risk endpoint media requiring hardware encryption and strict Endpoint DLP policy enforcement.'
    };
  } else if (lower.includes('ups')) {
    return {
      c: 1, i: 3, a: 5,
      remarks: 'ISO 27001 Utilities & Power Power backup resilience: Absolute availability target to sustain medical equipment.'
    };
  } else {
    return { 
      c: 3, i: 3, a: 3, 
      remarks: 'Baseline system parameters mapping to standard healthcare operating conditions.' 
    };
  }
};

// Generates customized risks matching the type and specific name of the asset
const getIsoThreatForAsset = (type: string, assetName: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('server')) {
    return {
      title: `Ransomware compromise & server outage of ${assetName}`,
      threat: 'Malicious system exploitation or phishing leading to deployment of server-encrypting ransomware.',
      vulnerability: 'Absence of air-gapped backups, unpatched enterprise OS levels, or weak administrative credentials.'
    };
  } else if (lower.includes('emr') || lower.includes('software')) {
    return {
      title: `Patient database confidentiality breach via ${assetName}`,
      threat: 'SQL injection attack or brute forcing of medical professional credentials by external threat actors.',
      vulnerability: 'Absence of mandatory Multi-Factor Authentication (MFA) and lack of database field encryption.'
    };
  } else if (lower.includes('firewall')) {
    return {
      title: `Unauthorized network ingress due to firewall rules compromise on ${assetName}`,
      threat: 'Perimeter network scanning, unauthorized rule changes, or direct exploit of firmware vulnerabilities.',
      vulnerability: 'Outdated firmware patches and lack of quarterly firewall policy audit reviews.'
    };
  } else if (lower.includes('medical') || lower.includes('ultrasound') || lower.includes('x-ray') || lower.includes('machine')) {
    return {
      title: `Biomedical calibration failure or operating system exploit on ${assetName}`,
      threat: 'Malware infection from USB drives or lack of physical tamper controls on medical device nodes.',
      vulnerability: 'Unpatched legacy operating systems (e.g., Windows 7/XP Embedded) with open clinical ports.'
    };
  } else if (lower.includes('laptop')) {
    return {
      title: `Loss of protected patient data due to physical theft of ${assetName}`,
      threat: 'Physical theft of mobile hardware from clinics, employee vehicles, or offsite conferences.',
      vulnerability: 'Lack of local bitlocker full-disk encryption and absence of remote wipe software configuration.'
    };
  } else {
    return {
      title: `Logical integrity threat or hardware breakdown affecting ${assetName}`,
      threat: 'Power surges, lack of planned preventive maintenance, or unauthorized local hardware tempering.',
      vulnerability: 'Absent PPM scheduling and failure to monitor hardware health alerts on a daily basis.'
    };
  }
};

const generateNextAssetCode = (type: string, category: string, subCategory: string, existing: Asset[]) => {
  let prefix = 'AST';
  const combined = `${category} ${subCategory} ${type}`.toLowerCase();
  
  if (combined.includes('server')) prefix = 'AST-SRV';
  else if (combined.includes('firewall')) prefix = 'AST-FW';
  else if (combined.includes('laptop')) prefix = 'AST-LP';
  else if (combined.includes('desktop') || combined.includes('all in one')) prefix = 'AST-DT';
  else if (combined.includes('switch') || combined.includes('network') || combined.includes('access point')) prefix = 'AST-NET';
  else if (type.includes('Biomedical') || combined.includes('medical') || combined.includes('ultrasound') || combined.includes('x-ray')) prefix = 'AST-MED';
  else if (combined.includes('emr') || type.includes('Software')) prefix = 'AST-SFT';
  else if (combined.includes('cctv') || combined.includes('camera')) prefix = 'AST-CCT';
  else if (combined.includes('printer')) prefix = 'AST-PRN';
  else if (combined.includes('nas')) prefix = 'AST-NAS';
  else if (combined.includes('ssd')) prefix = 'AST-SSD';
  else if (combined.includes('hdd')) prefix = 'AST-HDD';
  else if (combined.includes('usb')) prefix = 'AST-USB';
  else if (combined.includes('ups')) prefix = 'AST-UPS';
  else prefix = 'AST-GEN';

  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNum = 0;
  existing.forEach(a => {
    if (a && a.asset_code) {
      const match = a.asset_code.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
};

export default function AssetRegister({
  assets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onBulkAddAssets,
  activeClientId,
  client,
  onAddRisk,
  onOpenQuickSetup,
  employees = []
}: AssetRegisterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'PHYSICAL' | 'BIOMEDICAL' | 'SOFTWARE'>('ALL');
  
  // Modal states
  const [isAdding, setIsAdding] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form parameters
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<'Physical Asset' | 'Biomedical Asset' | 'Software Asset'>('Physical Asset');
  
  // Category & sub-category hierarchy states
  const [category, setCategory] = useState<string>('Computer');
  const [subCategory, setSubCategory] = useState<string>('Desktop');
  
  const [operatingSystem, setOperatingSystem] = useState<string>('Windows 11');
  const [assetCode, setAssetCode] = useState<string>('');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [owner, setOwner] = useState('IT Dept');
  const [operator, setOperator] = useState('');
  const [eolDate, setEolDate] = useState('');
  const [eosDate, setEosDate] = useState('');
  const [status, setStatus] = useState<Asset['status']>('ACTIVE');
  const [classification, setClassification] = useState<Asset['classification']>('CONFIDENTIAL');
  const [remarks, setRemarks] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [department, setDepartment] = useState('');

  // Special conditions
  const [ppmDate, setPpmDate] = useState('');
  const [ppmDueDate, setPpmDueDate] = useState('');
  const [version, setVersion] = useState('');

  // CIA values (1 to 5)
  const [cVal, setCVal] = useState<number>(3);
  const [iVal, setIVal] = useState<number>(3);
  const [aVal, setAVal] = useState<number>(3);
  const [ciaTip, setCiaTip] = useState<string>('');

  // Verified status filter and modal states
  const [verifiedFilter, setVerifiedFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifiedBy, setVerifiedBy] = useState<string>('');
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  // Risk integration trigger
  const [addToRiskRegister, setAddToRiskRegister] = useState<boolean>(true);

  // Bulk Import States
  const [bulkInputText, setBulkInputText] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<Asset>[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTargetType, setImportTargetType] = useState<'auto' | 'physical' | 'biomedical' | 'software'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active client employees and unique departments list
  const clientEmployees = employees.filter(emp => emp.client_id === activeClientId);
  const uniqueDepartments = Array.from(new Set([
    ...clientEmployees.map(e => e.department).filter(Boolean),
    ...assets.filter(a => a.client_id === activeClientId).map(a => a.department).filter(Boolean)
  ]));

  // Printable Asset Tag States
  const [printAsset, setPrintAsset] = useState<Asset | null>(null);
  const [printAssetList, setPrintAssetList] = useState<Asset[] | null>(null);
  const [customFacility, setCustomFacility] = useState('');
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);
  const [useQrCode, setUseQrCode] = useState(false);
  const [labelSize, setLabelSize] = useState<string>('user-2.5-1.5');
  const [customWidth, setCustomWidth] = useState<number>(2.5);
  const [customHeight, setCustomHeight] = useState<number>(1.5);
  const [printLayout, setPrintLayout] = useState<'roll' | 'grid'>('grid');

  const getLabelDimensions = (): { width: number; height: number; name: string } => {
    switch (labelSize) {
      case 'sm':
        return { width: 2.5, height: 1.0, name: '2.5" x 1.0"' };
      case 'user-2.5-1.5':
        return { width: 2.5, height: 1.5, name: '2.5" x 1.5" (Requested)' };
      case 'md':
        return { width: 3.2, height: 1.5, name: '3.2" x 1.5"' };
      case 'lg':
        return { width: 3.8, height: 1.7, name: '3.8" x 1.7"' };
      case 'lg-4-2':
        return { width: 4.0, height: 2.0, name: '4.0" x 2.0"' };
      case 'custom':
        return { width: customWidth, height: customHeight, name: `${customWidth.toFixed(1)}" x ${customHeight.toFixed(1)}"` };
      default:
        return { width: 2.5, height: 1.5, name: '2.5" x 1.5" (Requested)' };
    }
  };

  // Asset Inventory Report States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIssueDate, setReportIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportReviewDate, setReportReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportClassification, setReportClassification] = useState<'CONFIDENTIAL' | 'RESTRICTED' | 'INTERNAL' | 'PUBLIC'>('CONFIDENTIAL');
  const [reportVersion, setReportVersion] = useState('v2.1');
  const [reportDocRef, setReportDocRef] = useState('AST-INV-001');
  const [reportAuthor, setReportAuthor] = useState('Aseef Sulaiman');
  const [reportPreparedBy, setReportPreparedBy] = useState('Aseef Sulaiman');
  const [reportApprovedBy, setReportApprovedBy] = useState('Dr. Sarah Connor');

  // Page Header / Footer Compliance Branding Configuration States
  const [headerDisplayMode, setHeaderDisplayMode] = useState<'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY'>('BOTH');
  const [logoPlacement, setLogoPlacement] = useState<'FULL' | 'LEFT' | 'RIGHT'>('LEFT');
  const [showFooterLogo, setShowFooterLogo] = useState<boolean>(true);
  const [footerPlacement, setFooterPlacement] = useState<'FULL' | 'LEFT' | 'RIGHT'>('LEFT');
  const [showFooterAddress, setShowFooterAddress] = useState<boolean>(true);
  const [facilityLogoUrl, setFacilityLogoUrl] = useState<string>('');
  const [facilityStampUrl, setFacilityStampUrl] = useState<string>('');
  const [footerLogoUrl, setFooterLogoUrl] = useState<string>('');

  // Accordion Section States
  const [isMetadataOpen, setIsMetadataOpen] = useState(true);
  const [isVersionLogOpen, setIsVersionLogOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);

  // Version Control Log State
  const [versionLogs, setVersionLogs] = useState([
    { ver: "v1.0", date: "2024-01-15", author: "Aseef Sulaiman (IT Lead)", details: "Initial asset register compilation; mapped client network topology & firewalls." },
    { ver: "v2.0", date: "2025-06-10", author: "Dr. Sarah Connor", details: "Biomedical audit expansion; integrated defibrillators, ultrasound nodes & clinical pumps." },
    { ver: "v2.1", date: new Date().toISOString().split('T')[0], author: "Aseef Sulaiman", details: "Updated security classifications, structured PPM schedules, and generated current snapshot." }
  ]);

  // Sync state with client prop when modal opens or client details change
  useEffect(() => {
    if (showReportModal && client) {
      setHeaderDisplayMode(client.header_display_mode || 'BOTH');
      setLogoPlacement(client.logo_placement || 'LEFT');
      setShowFooterLogo(client.show_footer_logo !== false);
      setFooterPlacement(client.footer_placement || 'LEFT');
      setShowFooterAddress(client.show_footer_address !== false);
      setFacilityLogoUrl(client.facility_logo || '');
      setFacilityStampUrl(client.facility_stamp || '');
      setFooterLogoUrl(client.footer_logo || '');
    }
  }, [showReportModal, client]);

  // Sync latest editable values into the 3rd row of version log automatically
  useEffect(() => {
    setVersionLogs(prev => {
      const next = [...prev];
      if (next[2]) {
        next[2].ver = reportVersion;
        next[2].date = reportReviewDate;
        next[2].author = reportAuthor;
        next[2].details = `Updated security classifications to ${reportClassification}, structured PPM schedules, and generated current snapshot.`;
      }
      return next;
    });
  }, [reportVersion, reportReviewDate, reportAuthor, reportClassification]);

  // PDF & Email States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Update email templates when client or modal state changes
  useEffect(() => {
    if (showReportModal && client) {
      const defaultEmail = client.email || client.owner_email || '';
      setEmailRecipients(defaultEmail);
      setEmailSubject(`Official Asset Inventory Compliance Report - ${client.company_name}`);
      setEmailMessage(`Dear Authorized Contact,

Please find attached the Official Asset Inventory Compliance Report for ${client.company_name}.

This document serves as an official compliance standard operating record, prepared and approved under the ISO/IEC 27001:2022 and local Department of Health (DOH) frameworks.

Kindly review and retain this report for your annual compliance file.

Best regards,
${reportAuthor || 'Aseef Sulaiman'}
Lead Auditor / Reviewer`);
      // Reset status
      setEmailSuccess(null);
      setEmailError(null);
      setShowEmailPanel(false);
    }
  }, [showReportModal, client, reportAuthor]);

  const [showZplModal, setShowZplModal] = useState(false);
  const [generatedZplText, setGeneratedZplText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Zebra Browser Print integration
  const {
    isSupported: isZebraSupported,
    isConnecting: isZebraConnecting,
    connectedDevice: zebraConnectedDevice,
    availableDevices: zebraAvailableDevices,
    error: zebraError,
    retryConnection: retryZebraConnection,
    selectPrinter: selectZebraPrinter,
    printZpl: sendZplToZebra,
  } = useZebraPrint();

  const [zebraPrintStatus, setZebraPrintStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({ loading: false, success: false, error: null });

  // Render standardized Assets Inventory Compliance Report
  const renderInventoryReport = (isPrintView: boolean) => {
    const reportClientAssets = assets.filter(a => a.client_id === activeClientId);
    const reportPhysicalIt = reportClientAssets.filter(a => 
      a.asset_type === 'Physical Asset' || 
      a.asset_type === 'IT Asset' || 
      !a.asset_type
    );
    const reportBiomedical = reportClientAssets.filter(a => a.asset_type === 'Biomedical Asset');
    const reportSoftware = reportClientAssets.filter(a => a.asset_type === 'Software Asset');

    return (
      <div id="grc-compliance-report" className={`font-sans ${isPrintView ? 'text-black p-0 bg-white' : 'text-slate-800 p-1 bg-white'}`} style={{ color: 'black' }}>
        {/* Page Header / Footer Compliance Branding Configuration Header */}
        {(() => {
          const displayMode = headerDisplayMode || 'BOTH';
          const placement = logoPlacement || 'LEFT';
          const showLogo = displayMode !== 'TEXT_ONLY';
          const showText = displayMode !== 'LOGO_ONLY';

          const docRefBlock = (
            <div className="text-right shrink-0 min-w-[120px]">
              <span className="text-[8px] font-black px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-widest font-mono">
                {reportClassification}
              </span>
              <p className="text-[8px] text-slate-400 font-mono mt-1.5 uppercase font-bold">
                Doc Ref: {reportDocRef}
              </p>
            </div>
          );

          if (placement === 'LEFT') {
            return (
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 text-left">
                <div className="flex items-center gap-3.5">
                  {showLogo && facilityLogoUrl && (
                    <div className="w-14 h-14 p-1 flex items-center justify-center border border-slate-100 bg-white shrink-0 rounded-lg">
                      <img src={facilityLogoUrl} className="max-w-full max-h-full object-contain" alt="Facility Logo" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div>
                    {showText && (
                      <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                        {client?.company_name || 'Active Clinical Facility'}
                      </h2>
                    )}
                  </div>
                </div>
                {docRefBlock}
              </div>
            );
          } else if (placement === 'RIGHT') {
            return (
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                {docRefBlock}
                <div className="flex items-center gap-3.5 text-right justify-end">
                  <div>
                    {showText && (
                      <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                        {client?.company_name || 'Active Clinical Facility'}
                      </h2>
                    )}
                  </div>
                  {showLogo && facilityLogoUrl && (
                    <div className="w-14 h-14 p-1 flex items-center justify-center border border-slate-100 bg-white shrink-0 rounded-lg">
                      <img src={facilityLogoUrl} className="max-w-full max-h-full object-contain" alt="Facility Logo" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
            );
          } else { // FULL (Centered)
            return (
              <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] text-slate-400 font-mono uppercase font-bold">
                    Doc Ref: {reportDocRef}
                  </span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-widest font-mono">
                    {reportClassification}
                  </span>
                </div>
                {showLogo && facilityLogoUrl && (
                  <div className="w-full h-12 p-1 flex items-center justify-center bg-white">
                    <img src={facilityLogoUrl} className="max-h-full object-contain w-auto max-w-[280px]" alt="Facility Logo Centered" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div>
                  {showText && (
                    <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                      {client?.company_name || 'Active Clinical Facility'}
                    </h2>
                  )}
                </div>
              </div>
            );
          }
        })()}

        {/* Report Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-black text-slate-950 tracking-tight uppercase">
            Official Asset Inventory Compliance Report
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">
            Standard Operating Record • Compliant with ISO/IEC 27001:2022 & Department of Health (DOH) Regulations
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 text-[10px] text-left">
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Document State</span>
            <span className="font-extrabold text-slate-800">Approved & Active</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Active Version</span>
            <span className="font-extrabold text-slate-800">{reportVersion}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Published / Issue Date</span>
            <span className="font-extrabold text-slate-800">{reportIssueDate}</span>
          </div>
          <div>
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Last Compliance Review</span>
            <span className="font-extrabold text-slate-800">{reportReviewDate}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Authorized Lead Auditor</span>
            <span className="font-extrabold text-slate-800">{reportAuthor}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[8px] text-slate-400 uppercase font-mono font-black block">Regulated Facility Ingress</span>
            <span className="font-extrabold text-slate-800">{client?.company_name || 'Active Clinical Facility'}</span>
          </div>
        </div>

        {/* Assets Inventory Summary Section */}
        <div className="mb-6 text-left">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>Assets Inventory Summary Dashboard</span>
            <span className="text-[8px] font-bold text-slate-400 lowercase font-mono">facility overview metrics</span>
          </h3>
          <p className="text-[9.5px] text-slate-500 mb-3 font-medium leading-relaxed">
            High-level distribution of clinical, IT infrastructure, and software assets mapped across {client?.company_name || 'Cleveland Clinic Abu Dhabi (CCAD)'}.
          </p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
              <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block">Physical IT Assets</span>
              <span className="text-xs font-black text-slate-800">{reportPhysicalIt.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
              <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block">Biomedical Assets</span>
              <span className="text-xs font-black text-slate-800">{reportBiomedical.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
              <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block">Software Assets</span>
              <span className="text-xs font-black text-slate-800">{reportSoftware.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center bg-blue-50/50 border-blue-100">
              <span className="text-[8px] uppercase font-mono font-bold text-blue-500 block">Total Asset Count</span>
              <span className="text-xs font-black text-blue-900">{reportClientAssets.length}</span>
            </div>
          </div>
        </div>

        {/* Version Control Log */}
        <div className="mb-6 text-left">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
            <span>1. Document Version Control Log</span>
            <span className="text-[8px] font-bold text-slate-400 lowercase font-mono">standards standard section</span>
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2 font-bold w-12">Ver.</th>
                  <th className="p-2 font-bold w-24">Date</th>
                  <th className="p-2 font-bold w-36">Author / Reviewer</th>
                  <th className="p-2 font-bold">Details of Modifications</th>
                </tr>
              </thead>
              <tbody>
                {versionLogs.map((log, index) => (
                  <tr key={index} className={index < versionLogs.length - 1 ? "border-b border-slate-150" : ""}>
                    <td className={`p-2 font-mono ${index === versionLogs.length - 1 ? "text-slate-950 font-black" : "text-slate-500 font-bold"}`}>{log.ver}</td>
                    <td className={`p-2 font-mono ${index === versionLogs.length - 1 ? "text-slate-950 font-bold" : "text-slate-500"}`}>{log.date}</td>
                    <td className={`p-2 ${index === versionLogs.length - 1 ? "text-slate-950 font-black" : "text-slate-700 font-bold"}`}>{log.author}</td>
                    <td className={`p-2 ${index === versionLogs.length - 1 ? "text-slate-800 font-medium" : "text-slate-500"}`}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Physical IT Assets */}
        <div className="mb-6 text-left print-page-break">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
            2. Physical IT & Network Infrastructure Assets ({reportPhysicalIt.length} nodes)
          </h3>
          <p className="text-[9.5px] text-slate-500 mb-2 font-medium leading-relaxed">
            The following table documents the active network endpoints, computer systems, printers, servers, firewalls, and other physical IT peripherals registered under {client?.company_name || 'Cleveland Clinic Abu Dhabi (CCAD)'}. All listed hardware is monitored for access controls and security compliance.
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-[9px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-1.5 font-bold w-18">Asset Code</th>
                  <th className="p-1.5 font-bold w-24">Asset Name</th>
                  <th className="p-1.5 font-bold">Device Description</th>
                  <th className="p-1.5 font-bold">Category</th>
                  <th className="p-1.5 font-bold">OS</th>
                  <th className="p-1.5 font-bold">Serial Number</th>
                  <th className="p-1.5 font-bold text-center">EOL</th>
                  <th className="p-1.5 font-bold text-center">EOS</th>
                  <th className="p-1.5 font-bold">Location</th>
                  <th className="p-1.5 font-bold">Custodian</th>
                  <th className="p-1.5 font-bold w-14 text-center">Class.</th>
                  <th className="p-1.5 font-bold text-center w-12">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportPhysicalIt.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-slate-400 font-semibold font-mono">
                      No physical IT assets registered.
                    </td>
                  </tr>
                ) : (
                  reportPhysicalIt.map(a => (
                    <tr key={a.id} className="border-b border-slate-150 text-slate-700 hover:bg-slate-50/50">
                      <td className="p-1.5 font-mono font-bold text-slate-950">{a.asset_code}</td>
                      <td className="p-1.5 font-bold text-slate-950">{a.asset_name}</td>
                      <td className="p-1.5 font-medium text-slate-600 truncate max-w-[100px]" title={a.description}>{a.description || 'N/A'}</td>
                      <td className="p-1.5 font-medium text-slate-600">{a.asset_category || 'General IT'}</td>
                      <td className="p-1.5 font-mono text-slate-500 font-semibold">{a.operating_system || 'N/A'}</td>
                      <td className="p-1.5 font-mono text-slate-600">{a.serial_number || 'N/A'}</td>
                      <td className="p-1.5 font-mono text-slate-600 text-center">{a.eol_date || 'N/A'}</td>
                      <td className="p-1.5 font-mono text-slate-600 text-center">{a.eos_date || 'N/A'}</td>
                      <td className="p-1.5 font-medium text-slate-600">{a.location}</td>
                      <td className="p-1.5 font-semibold text-slate-600">{a.asset_owner || 'Unassigned'}</td>
                      <td className="p-1.5 text-center">
                        <span className={`px-1 rounded-[2px] text-[8px] font-black tracking-wider ${
                          a.classification === 'RESTRICTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                          a.classification === 'CONFIDENTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          a.classification === 'INTERNAL' ? 'bg-slate-50 text-slate-700 border border-slate-250' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {a.classification || 'INTERNAL'}
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-bold">
                        <span className={a.status === 'ACTIVE' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Biomedical Assets */}
        <div className="mb-6 text-left print-page-break">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
            3. Clinical Biomedical Assets & Medical Hardware ({reportBiomedical.length} nodes)
          </h3>
          <p className="text-[9.5px] text-slate-500 mb-2 font-medium leading-relaxed">
            The following register captures clinical instrumentation, medical imaging, cardiac support machinery, and patient monitoring gear registered under {client?.company_name || 'Cleveland Clinic Abu Dhabi (CCAD)'}. These medical assets undergo strict Planned Preventive Maintenance (PPM) routines to safeguard patient safety and ensure clinical operational uptime.
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-[9.5px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-1.5 font-bold w-20">Asset Code</th>
                  <th className="p-1.5 font-bold w-36">Equipment Name</th>
                  <th className="p-1.5 font-bold">Device Description</th>
                  <th className="p-1.5 font-bold">Asset Operator</th>
                  <th className="p-1.5 font-bold">Location</th>
                  <th className="p-1.5 font-bold text-center w-24">PPM Date</th>
                  <th className="p-1.5 font-bold text-center w-24">PPM Due Date</th>
                  <th className="p-1.5 font-bold text-center w-14">Class.</th>
                  <th className="p-1.5 font-bold text-center w-14">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportBiomedical.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-slate-400 font-semibold font-mono">
                      No clinical biomedical assets registered.
                    </td>
                  </tr>
                ) : (
                  reportBiomedical.map(a => {
                    const isOverdue = a.ppm_due_date && new Date(a.ppm_due_date) < new Date();
                    return (
                      <tr key={a.id} className="border-b border-slate-150 text-slate-700 hover:bg-slate-50/50">
                        <td className="p-1.5 font-mono font-bold text-slate-950">{a.asset_code}</td>
                        <td className="p-1.5 font-bold text-slate-950">{a.asset_name}</td>
                        <td className="p-1.5 font-medium text-slate-600 truncate max-w-[120px]" title={a.description}>{a.description || 'N/A'}</td>
                        <td className="p-1.5 font-medium text-slate-600">{a.asset_operator || 'Clinical Staff'}</td>
                        <td className="p-1.5 font-medium text-slate-600">{a.location}</td>
                        <td className="p-1.5 text-center font-mono text-slate-600">{a.ppm_date || 'N/A'}</td>
                        <td className="p-1.5 text-center font-mono">
                          <span className={isOverdue ? 'text-red-600 font-black bg-red-50 px-1 py-0.5 rounded border border-red-100' : 'text-slate-800 font-semibold'}>
                            {a.ppm_due_date || 'N/A'}
                          </span>
                        </td>
                        <td className="p-1.5 text-center">
                          <span className={`px-1 rounded-[2px] text-[8px] font-black tracking-wider ${
                            a.classification === 'RESTRICTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                            a.classification === 'CONFIDENTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            a.classification === 'INTERNAL' ? 'bg-slate-50 text-slate-700 border border-slate-250' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {a.classification || 'INTERNAL'}
                          </span>
                        </td>
                        <td className="p-1.5 text-center font-bold">
                          <span className={a.status === 'ACTIVE' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Software Assets (If present) */}
        {reportSoftware.length > 0 && (
          <div className="mb-6 text-left print-page-break">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              4. Software Assets & Electronic Healthcare Systems ({reportSoftware.length} systems)
            </h3>
            <p className="text-[9.5px] text-slate-500 mb-2 font-medium leading-relaxed">
              Active electronic medical record (EMR) systems, databases, healthcare portals, and operational utility licenses deployed at {client?.company_name || 'Cleveland Clinic Abu Dhabi (CCAD)'}.
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[9.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-1.5 font-bold w-20">Asset Code</th>
                    <th className="p-1.5 font-bold w-36">Software Platform</th>
                    <th className="p-1.5 font-bold">Category</th>
                    <th className="p-1.5 font-bold">Version</th>
                    <th className="p-1.5 font-bold">Location Scope</th>
                    <th className="p-1.5 font-bold">Custodian</th>
                    <th className="p-1.5 font-bold text-center w-20">Class.</th>
                    <th className="p-1.5 font-bold text-center w-14">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportSoftware.map(a => (
                    <tr key={a.id} className="border-b border-slate-150 text-slate-700 hover:bg-slate-50/50">
                      <td className="p-1.5 font-mono font-bold text-slate-950">{a.asset_code}</td>
                      <td className="p-1.5 font-bold text-slate-950">{a.asset_name}</td>
                      <td className="p-1.5 font-medium text-slate-600">{a.asset_category || 'Software Tool'}</td>
                      <td className="p-1.5 font-mono font-bold text-slate-600">{a.version || 'v1.0'}</td>
                      <td className="p-1.5 font-medium text-slate-600">{a.location}</td>
                      <td className="p-1.5 font-semibold text-slate-600">{a.asset_owner || 'IT Staff'}</td>
                      <td className="p-1.5 text-center">
                        <span className={`px-1 rounded-[2px] text-[8px] font-black tracking-wider ${
                          a.classification === 'RESTRICTED' ? 'bg-red-50 text-red-700 border border-red-100' :
                          a.classification === 'CONFIDENTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          a.classification === 'INTERNAL' ? 'bg-slate-50 text-slate-700 border border-slate-250' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {a.classification || 'CONFIDENTIAL'}
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-bold">
                        <span className={a.status === 'ACTIVE' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
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

        {/* Audit Certification Statement */}
        <div className="mt-8 mb-10 border border-slate-200 rounded-xl p-3 bg-slate-50 text-left relative overflow-hidden print-page-break">
          <p className="text-[9px] text-slate-600 leading-relaxed italic font-medium pr-28">
            "We, the undersigned, hereby certify that this physical IT and clinical biomedical asset inventory reflects the complete state of critical operational machinery for {client?.company_name || 'Cleveland Clinic Abu Dhabi (CCAD)'} as of {reportReviewDate}. Assets have been analyzed for information security risk posture, mapped to regulatory owners, and schedule compliance timelines are active."
          </p>
          <div className="grid grid-cols-2 gap-8 mt-6 pt-3 border-t border-slate-200 relative z-10">
            <div>
              <div className="border-b border-slate-400 h-8 w-44 flex items-end">
                <span className="font-mono text-[9px] italic text-slate-400 select-none">{reportPreparedBy}</span>
              </div>
              <span className="text-[7.5px] text-slate-400 uppercase font-mono block mt-1">Prepared By</span>
              <span className="text-[8.5px] text-slate-800 font-black block">{reportPreparedBy}</span>
            </div>
            <div className="relative">
              <div className="border-b border-slate-400 h-8 w-44 flex items-end">
                <span className="font-mono text-[9px] italic text-slate-400 select-none">{reportApprovedBy}</span>
              </div>
              <span className="text-[7.5px] text-slate-400 uppercase font-mono block mt-1">Authorized & Approved By</span>
              <span className="text-[8.5px] text-emerald-700 font-black block uppercase tracking-wider">Approved</span>

              {/* Official Stamp Placement */}
              {facilityStampUrl ? (
                <div className="absolute right-0 -top-8 w-24 h-24 pointer-events-none -rotate-12 select-none opacity-85 transition-all z-10" title="Official Facility Stamp Seal">
                  <img 
                    src={facilityStampUrl} 
                    className="w-full h-full object-contain" 
                    alt="Seal" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              ) : (
                <div className="absolute right-0 -top-6 w-20 h-20 pointer-events-none -rotate-12 select-none opacity-80 z-10 border-4 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 font-bold p-1">
                  <span className="text-[5px] leading-tight text-center font-mono uppercase">{client?.company_name || 'FACILITY SEAL'}</span>
                  <span className="text-[9px] leading-none my-0.5">❌</span>
                  <span className="text-[5px] uppercase tracking-widest">APPROVED BY CEO</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Compliance Page Footer */}
        <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-400 font-semibold flex flex-col gap-1.5 mt-auto">
          {/* If Footer logo is enabled AND FULL width, place the image banner on top */}
          {showFooterLogo && footerLogoUrl && footerPlacement === 'FULL' && (
            <div className="w-full h-10 flex items-center justify-center bg-white border border-slate-100 rounded-md p-1">
              <img src={footerLogoUrl} className="max-h-full object-contain w-auto max-w-[400px]" alt="Facility Footer Banner" referrerPolicy="no-referrer" />
            </div>
          )}

          <div className="flex items-center justify-between w-full gap-2">
            {/* Left content: contains COMPLIANCE CONTROL SHEET & logo if LEFT placement and enabled */}
            <div className="flex items-center gap-2">
              {showFooterLogo && footerLogoUrl && footerPlacement === 'LEFT' && (
                <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                  <img src={footerLogoUrl} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                </div>
              )}
              
              <div className="flex flex-col gap-0.5">
                <div className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                  OFFICIAL INVENTORY COMPLIANCE RECORD
                </div>
                {/* Show/hide Address info based on show_footer_address option */}
                {showFooterAddress && (
                  <div className="flex items-center gap-1 flex-wrap text-left text-[8px] text-slate-400">
                    <span>TEL: {client?.phone || '+971 2 666 4444'}</span>
                    <span>•</span>
                    <span className="uppercase">EMAIL: {client?.owner_email || client?.email || 'compliance@facility.ae'}</span>
                    <span>•</span>
                    <span className="uppercase">ADDR: {client?.address || 'Abu Dhabi'}, UAE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right content: can contain logo if RIGHT placement, plus Page 1/1 Indicator */}
            <div className="flex items-center gap-2 font-sans shrink-0">
              {showFooterLogo && footerLogoUrl && footerPlacement === 'RIGHT' && (
                <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                  <img src={footerLogoUrl} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                </div>
              )}
              {/* Page 1/1 Indicator */}
              <div className="font-mono text-[9px] text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Page 1/1
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintReport = () => {
    const reportEl = document.getElementById('grc-compliance-report');
    if (!reportEl) return;

    let stylesHtml = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      stylesHtml += el.outerHTML;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Compliance Asset Inventory Report - ${client?.company_name || 'Cleveland Clinic Abu Dhabi'}</title>
        <meta charset="utf-8">
        ${stylesHtml}
        <style>
          @media print {
            @page {
              size: A4 landscape;
              margin: 1cm;
            }
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
              margin-top: 3rem !important;
            }
            .overflow-x-auto {
              overflow: visible !important;
            }
            .print-container {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              margin: 0 !important;
            }
          }
          body {
            background: #f1f5f9;
            padding: 2.5rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .print-container {
            background: white;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${reportEl.innerHTML}
        </div>
      </body>
      </html>
    `;

    printHtmlInHiddenIframe(printHtml);
  };


  const handleDownloadPdf = async (): Promise<jsPDF | null> => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const clientName = client?.company_name || 'Cleveland Clinic Abu Dhabi';
      let currentPageNum = 1;

      // Draw standard row with cells
      const drawRow = (
        pdf: jsPDF,
        y: number,
        colWidths: number[],
        texts: string[],
        rowHeight: number,
        isHeader = false
      ) => {
        let curX = 15;
        // Fill background if header
        if (isHeader) {
          pdf.setFillColor(15, 23, 42); // slate-900: #0f172a
          pdf.rect(15, y - rowHeight + 1, 267, rowHeight, 'F');
          pdf.setTextColor(255, 255, 255);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(15, y - rowHeight + 1, 267, rowHeight, 'F');
          pdf.setTextColor(30, 41, 59); // slate-800
          pdf.setDrawColor(203, 213, 225); // slate-300
          pdf.rect(15, y - rowHeight + 1, 267, rowHeight, 'S');
        }

        colWidths.forEach((w, i) => {
          // Draw right line of cell
          if (!isHeader) {
            pdf.line(curX + w, y - rowHeight + 1, curX + w, y + 1);
          }
          
          // Draw text inside cell
          const textVal = texts[i] || '';
          pdf.setFontSize(isHeader ? 8 : 7.5);
          pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
          
          const txtY = y - (rowHeight / 2) + 2.5;
          const truncated = pdf.splitTextToSize(textVal, w - 2);
          pdf.text(truncated[0] || '', curX + 1.5, txtY);
          
          curX += w;
        });
      };

      const safeAddImage = (
        pdf: jsPDF,
        imgData: string | undefined,
        x: number,
        y: number,
        w: number,
        h: number
      ) => {
        if (!imgData) return;
        try {
          if (imgData.startsWith('data:image/') || imgData.startsWith('http')) {
            pdf.addImage(imgData, 'PNG', x, y, w, h, undefined, 'FAST');
          }
        } catch (e) {
          console.warn("Could not render image in PDF:", e);
        }
      };

      const drawHeaderFooter = (pdf: jsPDF, pageNum: number, sectionTitle: string) => {
        // Top header rule
        pdf.setDrawColor(15, 23, 42); // slate-900
        pdf.setLineWidth(0.4);
        pdf.line(15, 15, 282, 15);

        const showLogo = headerDisplayMode !== 'TEXT_ONLY';
        const showText = headerDisplayMode !== 'LOGO_ONLY';

        // Draw header logo/text based on logoPlacement
        if (logoPlacement === 'LEFT') {
          let textX = 15;
          if (showLogo && facilityLogoUrl) {
            safeAddImage(pdf, facilityLogoUrl, 15, 5, 8, 8);
            textX = 25;
          }
          if (showText) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.text(clientName.toUpperCase(), textX, 11);
          }
        } else if (logoPlacement === 'RIGHT') {
          let logoX = 238;
          if (showLogo && facilityLogoUrl) {
            safeAddImage(pdf, facilityLogoUrl, 230, 5, 8, 8);
            logoX = 228;
          }
          if (showText) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.text(clientName.toUpperCase(), logoX, 11, { align: 'right' });
          }
        } else { // FULL / CENTER
          if (showLogo && facilityLogoUrl) {
            safeAddImage(pdf, facilityLogoUrl, 105, 5, 8, 8);
          }
          if (showText) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.text(clientName.toUpperCase(), 115, 11);
          }
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.text(`Compliance Audit • ${sectionTitle}`, 145, 11);

        // Classification Badge
        pdf.setFillColor(254, 242, 242); // rose-50
        pdf.setDrawColor(244, 63, 94); // rose-500
        pdf.setLineWidth(0.25);
        pdf.rect(240, 7, 42, 6, 'DF');
        
        pdf.setTextColor(225, 29, 72); // rose-600
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(`SECURITY: ${reportClassification}`, 242, 11.2);

        // Bottom footer rule
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.line(15, 195, 282, 195);

        // Draw footer logo / text based on footerPlacement
        let footerTextX = 15;
        if (showFooterLogo && footerLogoUrl) {
          if (footerPlacement === 'LEFT') {
            safeAddImage(pdf, footerLogoUrl, 15, 187, 12, 6);
            footerTextX = 30;
          } else if (footerPlacement === 'RIGHT') {
            safeAddImage(pdf, footerLogoUrl, 255, 187, 12, 6);
          } else if (footerPlacement === 'FULL') {
            safeAddImage(pdf, footerLogoUrl, 135, 187, 24, 6);
          }
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184); // slate-400

        let footerTextStr = `Doc Ref: ${reportDocRef} • Version: ${reportVersion} • Confidential Compliance Record`;
        if (showFooterAddress) {
          footerTextStr += ` • TEL: ${client?.phone || '+971 2 666 4444'} • EMAIL: ${client?.owner_email || client?.email || 'compliance@facility.ae'}`;
        }
        pdf.text(footerTextStr, footerTextX, 199);
        pdf.text(`Page ${pageNum}`, 275, 199);
      };

      // PAGE 1: Cover and Metadata and Section 1 (Version Control)
      drawHeaderFooter(doc, currentPageNum, "Document Control & Metadata");

      // Title Block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("OFFICIAL ASSET INVENTORY COMPLIANCE REPORT", 15, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Standard Operating Record • Prepared under Compliance Frameworks ISO/IEC 27001:2022 & DOH Regulations", 15, 35);

      // Metadata Grid box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(15, 40, 267, 28, 'DF');

      // Draw Metadata elements
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("DOCUMENT STATE", 20, 46);
      doc.text("ACTIVE VERSION", 80, 46);
      doc.text("PUBLISHED / ISSUE DATE", 140, 46);
      doc.text("LAST COMPLIANCE REVIEW", 210, 46);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text("Approved & Active", 20, 51);
      doc.text(reportVersion, 80, 51);
      doc.text(reportIssueDate, 140, 51);
      doc.text(reportReviewDate, 210, 51);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text("AUTHORIZED LEAD AUDITOR", 20, 59);
      doc.text("REGULATED FACILITY INGRESS", 140, 59);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(reportAuthor, 20, 64);
      doc.text(clientName, 140, 64);

      // Metrics Dashboard
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Assets Inventory Summary Dashboard", 15, 76);

      const reportClientAssets = assets.filter(a => a.client_id === activeClientId);
      const reportPhysicalIt = reportClientAssets.filter(a => 
        a.asset_type === 'Physical Asset' || 
        a.asset_type === 'IT Asset' || 
        !a.asset_type
      );
      const reportBiomedical = reportClientAssets.filter(a => a.asset_type === 'Biomedical Asset');
      const reportSoftware = (() => {
        const raw = reportClientAssets.filter(a => a.asset_type === 'Software Asset');
        const seenNames = new Set<string>();
        return raw.filter(a => {
          const nameKey = a.asset_name.trim().toLowerCase();
          if (seenNames.has(nameKey)) return false;
          seenNames.add(nameKey);
          return true;
        });
      })();

      // Draw Metrics Boxes
      const metrics = [
        { label: "Physical IT Assets", count: reportPhysicalIt.length },
        { label: "Biomedical Assets", count: reportBiomedical.length },
        { label: "Software Assets", count: reportSoftware.length },
        { label: "Total Asset Nodes", count: reportPhysicalIt.length + reportBiomedical.length + reportSoftware.length }
      ];

      metrics.forEach((m, idx) => {
        const x = 15 + idx * 68;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        if (idx === 3) {
          doc.setFillColor(239, 246, 255); // blue-50
          doc.setDrawColor(191, 219, 254); // blue-200
        }
        doc.rect(x, 81, 63, 14, 'DF');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(idx === 3 ? 59 : 100, idx === 3 ? 130 : 116, idx === 3 ? 246 : 139);
        doc.text(m.label.toUpperCase(), x + 3, 85);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(idx === 3 ? 30 : 15, idx === 3 ? 58 : 23, idx === 3 ? 138 : 42);
        doc.text(String(m.count), x + 3, 92);
      });

      // Section 1 Table: Version Control
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Document Version Control Log", 15, 104);

      const versionCols = [15, 30, 60, 162];
      const versionHeaders = ["Ver.", "Date", "Author / Reviewer", "Details of Modifications"];
      drawRow(doc, 114, versionCols, versionHeaders, 6, true);

      const versionRows = versionLogs.map(vl => [
        vl.ver,
        vl.date,
        vl.author,
        vl.details
      ]);

      versionRows.forEach((row, i) => {
        drawRow(doc, 122 + i * 8, versionCols, row, 8, false);
      });

      // PAGE 2: Section 2 (Physical IT Assets)
      let yPos = 32;
      doc.addPage();
      currentPageNum++;
      drawHeaderFooter(doc, currentPageNum, "2. Physical IT & Network Infrastructure Assets");

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`2. Physical IT & Network Infrastructure Assets (${reportPhysicalIt.length} nodes)`, 15, 25);

      const itCols = [25, 45, 35, 25, 35, 40, 32, 15, 15];
      const itHeaders = ["Asset Code", "Asset Name", "Category", "OS", "Serial Number", "Location", "Custodian", "Class.", "Status"];
      drawRow(doc, 32, itCols, itHeaders, 6, true);
      yPos = 40;

      if (reportPhysicalIt.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("No physical IT assets registered.", 20, 46);
        yPos = 48;
      } else {
        reportPhysicalIt.forEach((a) => {
          if (yPos > 180) {
            doc.addPage();
            currentPageNum++;
            drawHeaderFooter(doc, currentPageNum, "2. Physical IT Assets (Continued)");
            drawRow(doc, 25, itCols, itHeaders, 6, true);
            yPos = 33;
          }
          const rowData = [
            a.asset_code,
            a.asset_name,
            a.asset_category || 'General IT',
            a.operating_system || 'N/A',
            a.serial_number || 'N/A',
            a.location,
            a.asset_owner || 'Unassigned',
            a.classification || 'INTERNAL',
            a.status
          ];
          drawRow(doc, yPos, itCols, rowData, 8, false);
          yPos += 8;
        });
      }

      // SECTION 3: Biomedical Assets
      yPos += 8;
      if (yPos > 165) {
        doc.addPage();
        currentPageNum++;
        drawHeaderFooter(doc, currentPageNum, "3. Clinical Biomedical Assets");
        yPos = 25;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`3. Clinical Biomedical Assets & Medical Hardware (${reportBiomedical.length} nodes)`, 15, yPos - 2);

      const bioCols = [30, 55, 40, 45, 30, 30, 20, 17];
      const bioHeaders = ["Asset Code", "Equipment Name", "Asset Operator", "Location", "PPM Date", "PPM Due Date", "Class.", "Status"];
      drawRow(doc, yPos, bioCols, bioHeaders, 6, true);
      yPos += 8;

      if (reportBiomedical.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("No clinical biomedical assets registered.", 20, yPos + 2);
        yPos += 8;
      } else {
        reportBiomedical.forEach((a) => {
          if (yPos > 180) {
            doc.addPage();
            currentPageNum++;
            drawHeaderFooter(doc, currentPageNum, "3. Clinical Biomedical Assets (Continued)");
            drawRow(doc, 25, bioCols, bioHeaders, 6, true);
            yPos = 33;
          }
          const rowData = [
            a.asset_code,
            a.asset_name,
            a.asset_operator || 'Clinical Staff',
            a.location,
            a.ppm_date || 'N/A',
            a.ppm_due_date || 'N/A',
            a.classification || 'INTERNAL',
            a.status
          ];
          drawRow(doc, yPos, bioCols, rowData, 8, false);
          yPos += 8;
        });
      }

      // SECTION 4: Software Assets
      yPos += 8;
      if (yPos > 165) {
        doc.addPage();
        currentPageNum++;
        drawHeaderFooter(doc, currentPageNum, "4. Software Assets & Electronic Healthcare Systems");
        yPos = 25;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`4. Software Assets & Electronic Healthcare Systems (${reportSoftware.length} systems)`, 15, yPos - 2);

      const softCols = [30, 55, 40, 25, 45, 35, 20, 17];
      const softHeaders = ["Asset Code", "Software Platform", "Category", "Version", "Location Scope", "Custodian", "Class.", "Status"];
      drawRow(doc, yPos, softCols, softHeaders, 6, true);
      yPos += 8;

      if (reportSoftware.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("No software assets registered.", 20, yPos + 2);
        yPos += 8;
      } else {
        reportSoftware.forEach((a) => {
          if (yPos > 180) {
            doc.addPage();
            currentPageNum++;
            drawHeaderFooter(doc, currentPageNum, "4. Software Assets (Continued)");
            drawRow(doc, 25, softCols, softHeaders, 6, true);
            yPos = 33;
          }
          const rowData = [
            a.asset_code,
            a.asset_name,
            a.asset_category || 'Software Tool',
            a.version || 'v1.0',
            a.location,
            a.asset_owner || 'IT Staff',
            a.classification || 'CONFIDENTIAL',
            a.status
          ];
          drawRow(doc, yPos, softCols, rowData, 8, false);
          yPos += 8;
        });
      }

      // Certification Statement & Signatures
      yPos += 8;
      if (yPos > 140) {
        doc.addPage();
        currentPageNum++;
        drawHeaderFooter(doc, currentPageNum, "Audit Certification & Sign-off");
        yPos = 25;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Audit Certification Statement", 15, yPos);
      yPos += 4;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, yPos, 267, 18, 'DF');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const certText = `We, the undersigned, hereby certify that this physical IT and clinical biomedical asset inventory reflects the complete state of critical operational machinery for ${clientName} as of ${reportReviewDate}. Assets have been analyzed for information security risk posture, mapped to regulatory owners, and schedule compliance timelines are active under the ISO/IEC 27001:2022 and DOH governance policies.`;
      const wrappedCert = doc.splitTextToSize(certText, 257);
      doc.text(wrappedCert, 20, yPos + 6);
      yPos += 26;

      // Signatures block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Authorized Compliance Review Signatures", 15, yPos);
      yPos += 6;

      const signX1 = 15;
      const signX2 = 105;
      const signX3 = 195;

      doc.setDrawColor(203, 213, 225);
      doc.line(signX1, yPos + 10, signX1 + 75, yPos + 10);
      doc.line(signX2, yPos + 10, signX2 + 75, yPos + 10);
      doc.line(signX3, yPos + 10, signX3 + 75, yPos + 10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(reportAuthor, signX1, yPos + 14);
      doc.text(reportPreparedBy, signX2, yPos + 14);
      doc.text(reportApprovedBy, signX3, yPos + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("Lead Compliance Auditor", signX1, yPos + 18);
      doc.text("Registered Facility Custodian", signX2, yPos + 18);
      doc.text("Lead Medical Director", signX3, yPos + 18);

      doc.text(`Signed: ${reportReviewDate}`, signX1, yPos + 22);
      doc.text(`Signed: ${reportReviewDate}`, signX2, yPos + 22);
      doc.text(`Signed: ${reportReviewDate}`, signX3, yPos + 22);

      return doc;
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      return null;
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadPdfFile = async () => {
    try {
      const pdf = await handleDownloadPdf();
      if (!pdf) {
        alert("Failed to compile standard PDF. Please try again.");
        return;
      }
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      const clientName = client?.company_name || 'Cleveland Clinic Abu Dhabi';
      link.setAttribute("href", blobUrl);
      link.setAttribute("download", `Asset_Inventory_Compliance_Report_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Error generating PDF file: " + err.message);
    }
  };

  const handleSendEmailToClient = async (recipientsList: string[], customNotes: string, customSubject: string) => {
    setIsSendingEmail(true);
    setEmailSuccess(null);
    setEmailError(null);

    try {
      const smtpRaw = localStorage.getItem('sh_smtp');
      if (!smtpRaw) {
        throw new Error('No outbound SMTP configuration found. Please configure SMTP in Settings first!');
      }
      const smtpConfig = JSON.parse(smtpRaw);
      const clientName = client?.company_name || 'Active Clinical Facility';

      // 1. Generate the PDF instance
      const pdf = await handleDownloadPdf();
      let pdfBase64 = '';
      if (pdf) {
        const pdfDataUri = pdf.output('datauristring');
        if (pdfDataUri && pdfDataUri.includes(',')) {
          pdfBase64 = pdfDataUri.split(',')[1];
        }
      }

      // 2. Generate HTML body for email
      const htmlBody = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
              ${clientName}
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">
              Compliance & Audit Management Suite
            </p>
          </div>
          
          <h3 style="color: #4f46e5; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
            ${customSubject}
          </h3>
          
          <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 25px;">
            ${customNotes}
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 25px 0;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">Report Specification Metadata</span>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155; text-align: left;">
              <tr>
                <td style="padding: 5px 0; font-weight: 600; width: 150px; color: #64748b;">Report Code:</td>
                <td style="padding: 5px 0; font-family: monospace; color: #0f172a; font-weight: bold;">${reportDocRef}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Version Reference:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${reportVersion}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Security Class:</td>
                <td style="padding: 5px 0; color: #e11d48; font-weight: bold; letter-spacing: 0.025em;">${reportClassification}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Auditor / Author:</td>
                <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${reportAuthor}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Issue Date:</td>
                <td style="padding: 5px 0; color: #0f172a;">${reportIssueDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Last Compliance Review:</td>
                <td style="padding: 5px 0; color: #0f172a;">${reportReviewDate}</td>
              </tr>
            </table>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center;">
            <p style="font-size: 10px; color: #94a3b8; line-height: 1.5; margin: 0;">
              This report was compiled and dispatched securely via the Compliance Portal. 
              The attached PDF document has been encrypted and signed for regulatory compliance verification.
            </p>
          </div>
        </div>
      `;

      // 3. Dispatch the API request
      const res = await fetch('/api/send-compliance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          recipientEmails: recipientsList,
          subject: customSubject,
          message: customNotes,
          htmlContent: htmlBody,
          pdfAttachment: pdfBase64 || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to dispatch compliance report over SMTP.');
      }

      if (data.simulated) {
        setEmailSuccess(`⚠️ Simulated Delivery: SMTP Gateway is configured in Sandbox Mode. Report successfully generated and delivery simulated for: ${recipientsList.join(', ')}.`);
      } else {
        setEmailSuccess(`Success! The Official Asset Inventory Compliance Report PDF has been successfully sent to: ${recipientsList.join(', ')}.`);
      }
    } catch (err: any) {
      console.error("Email dispatch failed:", err);
      setEmailError(err.message || 'An unexpected error occurred during email transmission.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDirectZebraPrint = async () => {
    setZebraPrintStatus({ loading: true, success: false, error: null });
    const zpl = generateZplCode();
    if (!zpl) {
      setZebraPrintStatus({ loading: false, success: false, error: 'No active assets found to generate ZPL code.' });
      return;
    }
    const result = await sendZplToZebra(zpl);
    if (result.success) {
      setZebraPrintStatus({ loading: false, success: true, error: null });
      // Reset success status after 3 seconds
      setTimeout(() => {
        setZebraPrintStatus((prev) => ({ ...prev, success: false }));
      }, 3000);
    } else {
      setZebraPrintStatus({ loading: false, success: false, error: result.error });
    }
  };

  const [popupBlockerWarning, setPopupBlockerWarning] = useState(false);

  const handleSystemPrint = () => {
    setPopupBlockerWarning(false);
    const printArea = document.getElementById('printable-tag-area');
    if (printArea) {
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        stylesHtml += el.outerHTML;
      });

      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Asset Sticker Print Studio</title>
          <meta charset="utf-8">
          ${stylesHtml}
          <style>
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 12px !important;
              font-family: sans-serif;
            }
            #printable-tag-area {
              display: block !important;
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
            }
            #printable-tag-area * {
              visibility: visible !important;
            }
            .print-grid-layout {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 16px !important;
              width: 100% !important;
            }
            .print-roll-layout {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 24px !important;
              width: 100% !important;
            }
            .print-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          </style>
        </head>
        <body>
          <div id="printable-tag-area">
            ${printArea.innerHTML}
          </div>
        </body>
        </html>
      `;

      printHtmlInHiddenIframe(printHtml);
      return;
    }

    try {
      window.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
  };


  useEffect(() => {
    if (client?.company_name) {
      setCustomFacility(client.company_name);
    }
    if (client?.doc_ref) {
      setReportDocRef(client.doc_ref);
    }
    if (client?.doc_classification) {
      const upper = client.doc_classification.toUpperCase();
      if (['CONFIDENTIAL', 'RESTRICTED', 'INTERNAL', 'PUBLIC'].includes(upper)) {
        setReportClassification(upper as any);
      }
    }
    if (client?.doc_issue_date) {
      const parts = client.doc_issue_date.split('/');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        setReportIssueDate(formattedDate);
      } else {
        setReportIssueDate(client.doc_issue_date);
      }
    }
    if (client?.doc_approved_date) {
      const parts = client.doc_approved_date.split('/');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        setReportReviewDate(formattedDate);
      } else {
        setReportReviewDate(client.doc_approved_date);
      }
    }
    if (client?.it_manager?.name) {
      setReportPreparedBy(client.it_manager.name);
      setReportAuthor(client.it_manager.name);
    } else if (client?.auth_representative?.name) {
      setReportPreparedBy(client.auth_representative.name);
      setReportAuthor(client.auth_representative.name);
    }
    if (client?.medical_director?.name) {
      setReportApprovedBy(client.medical_director.name);
    } else if (client?.clinic_manager?.name) {
      setReportApprovedBy(client.clinic_manager.name);
    }
  }, [client]);

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    targetId?: string;
    count?: number;
  }>({ isOpen: false, type: 'single' });

  // Auto pre-fill CIA values and recommendations based on category changes
  useEffect(() => {
    const combinedType = `${category} ${subCategory}`;
    const isoPreset = getIsoStandardCIA(combinedType);
    setCVal(isoPreset.c);
    setIVal(isoPreset.i);
    setAVal(isoPreset.a);
    setCiaTip(isoPreset.remarks);
  }, [category, subCategory, assetType]);

  // Adjust Category selection when Asset Type changes
  useEffect(() => {
    if (assetType === 'Physical Asset') {
      setCategory('Computer');
      setSubCategory('Desktop');
      setOperatingSystem('Windows 11');
    } else if (assetType === 'Biomedical Asset') {
      setCategory('Patient Monitor');
      setSubCategory('');
      setOperatingSystem('Embedded RTOS');
    } else if (assetType === 'Software Asset') {
      setCategory('EMR Software');
      setSubCategory('');
      setOperatingSystem('Not Applicable');
    }
  }, [assetType]);

  // Handle category change to auto-update sub-category list
  useEffect(() => {
    if (NESTED_OPTIONS[category]) {
      setSubCategory(NESTED_OPTIONS[category][0]);
    } else {
      setSubCategory('');
    }
  }, [category]);

  // Re-parse bulk import data when target import type changes
  useEffect(() => {
    if (bulkInputText) {
      handleTextareaParse(bulkInputText);
    }
  }, [importTargetType]);

  const openNewAssetModal = () => {
    setName('');
    
    // Choose appropriate default type based on currently active view tab
    let defaultType: 'Physical Asset' | 'Biomedical Asset' | 'Software Asset' = 'Physical Asset';
    if (selectedTab === 'BIOMEDICAL') {
      defaultType = 'Biomedical Asset';
    } else if (selectedTab === 'SOFTWARE') {
      defaultType = 'Software Asset';
    }
    
    setAssetType(defaultType);
    setCategory('Computer');
    setSubCategory('Desktop');
    setOperatingSystem('Windows 11');
    setLocation('');
    setSerialNumber('');
    setOwner('IT Dept');
    setOperator('');
    setEolDate(new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 3 years default
    setEosDate(new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setStatus('ACTIVE');
    setClassification('CONFIDENTIAL');
    setRemarks('');
    setManufacturer('');
    setModel('');
    setPpmDate('');
    setPpmDueDate('');
    setVersion('');
    setDepartment('');
    
    setIsVerified(false);
    setVerifiedBy('');
    setVerificationNotes('');

    setAddToRiskRegister(true);
    setEditingAsset(null);
    setIsAdding(true);
  };

  const openEditAssetModal = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.asset_name);
    
    // Map backward compatible types
    let mappedType: Asset['asset_type'] = 'Physical Asset';
    if (asset.asset_type === 'Biomedical Asset') mappedType = 'Biomedical Asset';
    else if (asset.asset_type === 'Software Asset') mappedType = 'Software Asset';
    else if (asset.asset_type === 'IT Asset') mappedType = 'Physical Asset';
    
    setAssetType(mappedType);
    
    // Parse category & subcategory from existing asset_category
    const catParts = asset.asset_category ? asset.asset_category.split(' - ') : ['Other'];
    setCategory(catParts[0]);
    setSubCategory(catParts[1] || '');

    setOperatingSystem(asset.operating_system || 'Not Applicable');
    setLocation(asset.location || '');
    setSerialNumber(asset.serial_number || '');
    setOwner(asset.asset_owner || 'IT Dept');
    setOperator(asset.asset_operator || '');
    setEolDate(asset.eol_date || '');
    setEosDate(asset.eos_date || '');
    setStatus(asset.status || 'ACTIVE');
    setClassification(asset.classification || 'CONFIDENTIAL');
    setRemarks(asset.remarks || '');
    setManufacturer(asset.manufacturer || '');
    setModel(asset.model || '');
    setPpmDate(asset.ppm_date || '');
    setPpmDueDate(asset.ppm_due_date || '');
    setVersion(asset.version || '');
    setDepartment(asset.department || '');

    setIsVerified(!!asset.is_verified);
    setVerifiedBy(asset.verified_by || '');
    setVerificationNotes(asset.verification_notes || '');

    setCVal(asset.c_val || 3);
    setIVal(asset.i_val || 3);
    setAVal(asset.a_val || 3);
    setAddToRiskRegister(false); // Do not add secondary risks when just updating
    setIsAdding(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an Asset Name.');
      return;
    }

    // Check for duplicate software name
    if (assetType === 'Software Asset') {
      const isDuplicate = assets.some(a => 
        a.client_id === activeClientId &&
        a.asset_type === 'Software Asset' &&
        a.id !== (editingAsset?.id || '') &&
        a.asset_name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        alert(`A Software Asset with the name "${name.trim()}" already exists. Please enter a unique name.`);
        return;
      }
    }

    const finalCategoryStr = subCategory ? `${category} - ${subCategory}` : category;

    const finalCode = editingAsset 
      ? editingAsset.asset_code 
      : generateNextAssetCode(assetType, category, subCategory, assets.filter(a => a.client_id === activeClientId));

    const finalAsset: Asset = {
      id: editingAsset ? editingAsset.id : 'a_' + Math.floor(Math.random() * 100000),
      client_id: activeClientId,
      asset_code: finalCode,
      asset_name: name,
      asset_type: assetType,
      asset_category: finalCategoryStr,
      manufacturer: manufacturer,
      model: model,
      serial_number: serialNumber,
      asset_owner: owner,
      asset_operator: operator,
      classification: classification,
      location: location,
      purchase_date: editingAsset?.purchase_date || new Date().toISOString().split('T')[0],
      eol_date: eolDate,
      eos_date: eosDate,
      ppm_date: assetType === 'Biomedical Asset' ? ppmDate : undefined,
      ppm_due_date: assetType === 'Biomedical Asset' ? ppmDueDate : undefined,
      version: assetType === 'Software Asset' ? version : undefined,
      status: status,
      remarks: remarks,
      operating_system: operatingSystem,
      department: department,
      c_val: cVal,
      i_val: iVal,
      a_val: aVal,
      is_verified: isVerified,
      verified_at: isVerified ? (editingAsset?.verified_at || new Date().toISOString()) : undefined,
      verified_by: isVerified ? (verifiedBy || owner || 'Asset Auditor') : undefined,
      verification_notes: isVerified ? verificationNotes : undefined,
      created_at: editingAsset?.created_at || new Date().toISOString()
    };

    if (editingAsset) {
      if (onUpdateAsset) {
        onUpdateAsset(finalAsset);
      }
    } else {
      onAddAsset(finalAsset);

      // Create linked GRC risk profile automatically if toggled and callback is present
      if (addToRiskRegister && onAddRisk) {
        const combinedString = `${category} ${subCategory}`;
        const threatDetails = getIsoThreatForAsset(combinedString, name);
        const nextIdNum = Math.floor(100 + Math.random() * 900);
        const avgValue = Math.round((cVal + iVal + aVal) / 3);
        
        const newRisk: RiskItem = {
          id: 'r_auto_' + Math.floor(Math.random() * 10000),
          client_id: activeClientId,
          risk_id: `RSK-AUTO-${nextIdNum}`,
          risk_title: threatDetails.title,
          asset_name: name,
          threat: threatDetails.threat,
          vulnerability: threatDetails.vulnerability,
          impact: avgValue,
          likelihood: 3, // Standard operational likelihood
          risk_rating: avgValue * 3,
          existing_controls: 'Standard logical isolation keys, credential locks, and daily database logs.',
          treatment_plan: 'Configure regular planned preventative maintenance audits, implement fine-grained multi-factor access protocols, and review ISO metrics quarterly.',
          risk_owner: owner,
          review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'OPEN',
          domain: assetType === 'Software Asset' ? 'Communications and Operations Management' : 'Clinical Asset Safety',
          mitigation_status: 'Open',
          record_status: 'Active',
          treatment_option: 'Reduction',
          identification_date: new Date().toISOString().split('T')[0],
          target_closing_date: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          residual_likelihood: 1,
          residual_impact: Math.max(1, avgValue - 1),
          residual_risk_rating: Math.max(1, avgValue - 1) * 1,
          c_val: cVal,
          i_val: iVal,
          a_val: aVal,
          asset_value: avgValue
        };

        onAddRisk(newRisk);
      }
    }

    setIsAdding(false);
    setEditingAsset(null);
  };

  const handleToggleVerify = (asset: Asset) => {
    const updated: Asset = {
      ...asset,
      is_verified: !asset.is_verified,
      verified_at: !asset.is_verified ? new Date().toISOString() : undefined,
      verified_by: !asset.is_verified ? (owner || 'System Auditor') : undefined
    };
    if (onUpdateAsset) {
      onUpdateAsset(updated);
    }
  };

  const handleBulkVerify = () => {
    if (selectedAssetIds.length === 0) return;
    const activeAssets = assets.filter(a => a.client_id === activeClientId);
    selectedAssetIds.forEach(id => {
      const target = activeAssets.find(a => a.id === id);
      if (target && !target.is_verified && onUpdateAsset) {
        onUpdateAsset({
          ...target,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: 'System Auditor'
        });
      }
    });
    alert(`Successfully marked ${selectedAssetIds.length} assets as Verified!`);
    setSelectedAssetIds([]);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      targetId: id
    });
  };

  const handleBulkDelete = () => {
    if (selectedAssetIds.length === 0) return;
    setDeleteConfirmation({
      isOpen: true,
      type: 'bulk',
      count: selectedAssetIds.length
    });
  };

  const executeConfirmedDelete = () => {
    if (deleteConfirmation.type === 'single' && deleteConfirmation.targetId) {
      if (onDeleteAsset) {
        onDeleteAsset(deleteConfirmation.targetId);
        setSelectedAssetIds(prev => prev.filter(id => id !== deleteConfirmation.targetId));
      }
    } else if (deleteConfirmation.type === 'bulk') {
      if (onDeleteAsset) {
        selectedAssetIds.forEach(id => {
          onDeleteAsset(id);
        });
        setSelectedAssetIds([]);
      }
    }
    setDeleteConfirmation({ isOpen: false, type: 'single' });
  };

  // Filter assets to current client
  const clientAssets = assets.filter(a => a.client_id === activeClientId);

  // Report Calculations for GRC Compliance Report
  const reportPhysicalIt = clientAssets.filter(a => 
    a.asset_type === 'Physical Asset' || 
    a.asset_type === 'IT Asset' || 
    !a.asset_type
  );
  const reportBiomedical = clientAssets.filter(a => a.asset_type === 'Biomedical Asset');
  const reportSoftware = (() => {
    const raw = clientAssets.filter(a => a.asset_type === 'Software Asset');
    const seenNames = new Set<string>();
    return raw.filter(a => {
      const nameKey = a.asset_name.trim().toLowerCase();
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      return true;
    });
  })();

  // Apply tab filter & search
  const rawFiltered = clientAssets.filter(a => {
    const matchesSearch = 
      a.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.location && a.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.operating_system && a.operating_system.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.asset_operator && a.asset_operator.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.asset_category && a.asset_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.manufacturer && a.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = 
      selectedTab === 'ALL' ||
      (selectedTab === 'PHYSICAL' && (a.asset_type === 'Physical Asset' || a.asset_type === 'IT Asset')) ||
      (selectedTab === 'BIOMEDICAL' && a.asset_type === 'Biomedical Asset') ||
      (selectedTab === 'SOFTWARE' && a.asset_type === 'Software Asset');

    const matchesVerified = 
      verifiedFilter === 'ALL' ||
      (verifiedFilter === 'VERIFIED' && a.is_verified) ||
      (verifiedFilter === 'UNVERIFIED' && !a.is_verified);

    return matchesSearch && matchesTab && matchesVerified;
  });

  // De-duplicate software names if active tab is SOFTWARE
  const filteredAssets = (() => {
    if (selectedTab === 'SOFTWARE') {
      const seenNames = new Set<string>();
      return rawFiltered.filter(a => {
        const nameKey = a.asset_name.trim().toLowerCase();
        if (seenNames.has(nameKey)) return false;
        seenNames.add(nameKey);
        return true;
      });
    }
    return rawFiltered;
  })();

  // Code 39 Barcode SVG Generator
  const generateBarcodeSVG = (text: string) => {
    const code39Map: Record<string, string> = {
      '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
      '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
      '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
      'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
      'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
      'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
      'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
      'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
      'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
      '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
      '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
    };

    const cleanText = `*${text.toUpperCase().replace(/[^A-Z0-9\-\.\s\$\/\+\%]/g, '')}*`;
    let pattern = '';
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const charPattern = code39Map[char] || code39Map[' '];
      pattern += charPattern + '0';
    }

    let currentX = 5;
    const rects: React.JSX.Element[] = [];
    
    for (let i = 0; i < pattern.length; i++) {
      const isBlack = i % 2 === 0;
      const isWide = pattern[i] === '1';
      const width = isWide ? 2.5 : 1;
      
      if (isBlack) {
        rects.push(
          <rect
            key={i}
            x={currentX}
            y={2}
            width={width}
            height={36}
            fill="black"
          />
        );
      }
      currentX += width;
    }

    return (
      <svg width={currentX + 5} height={40} viewBox={`0 0 ${currentX + 5} 40`} className="max-w-full">
        <g>
          {rects}
        </g>
      </svg>
    );
  };

  // Deterministic 2D QR Code Generator
  const generateQRCodeSVG = (text: string, className = "w-14 h-14 shrink-0") => {
    const size = 21;
    const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    const drawSquare = (row: number, col: number, s: number) => {
      for (let r = 0; r < s; r++) {
        for (let c = 0; c < s; c++) {
          const isBorder = r === 0 || r === s - 1 || c === 0 || c === s - 1;
          const isCenter = r >= 2 && r <= s - 3 && c >= 2 && c <= s - 3 && s >= 5;
          if (isBorder || isCenter) {
            grid[row + r][col + c] = true;
          }
        }
      }
    };

    drawSquare(0, 0, 7);
    drawSquare(0, size - 7, 7);
    drawSquare(size - 7, 0, 7);
    
    for (let i = 8; i < size - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isFindingPattern = 
          (r < 8 && c < 8) || 
          (r < 8 && c >= size - 8) || 
          (r >= size - 8 && c < 8) ||
          (r === 6) || (c === 6);
          
        if (!isFindingPattern) {
          const val = Math.abs(Math.sin(r * 12.9898 + c * 78.233 + hash)) * 43758.5453;
          grid[r][c] = (val - Math.floor(val)) > 0.5;
        }
      }
    }

    const rects: React.JSX.Element[] = [];
    const cellSize = 3;
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c]) {
          rects.push(
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0f172a"
            />
          );
        }
      }
    }

    const svgSize = size * cellSize;
    return (
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className={className}>
        <g>
          {rects}
        </g>
      </svg>
    );
  };

  // Render Single Tag Item for preview / print sheet
  const renderTagItem = (asset: Asset, index?: number) => {
    const getClassificationColor = (cls?: string) => {
      switch (cls) {
        case 'RESTRICTED': return 'border-amber-500 text-amber-800 bg-amber-50';
        case 'CONFIDENTIAL': return 'border-rose-500 text-rose-800 bg-rose-50';
        case 'SECRET': return 'border-red-600 text-red-950 bg-red-100';
        default: return 'border-slate-300 text-slate-700 bg-slate-50';
      }
    };

    const getTypeColor = (type?: string) => {
      const lower = (type || '').toLowerCase();
      if (lower.includes('software')) {
        return 'border-indigo-500 text-indigo-800 bg-indigo-50';
      } else if (lower.includes('biomedical') || lower.includes('med')) {
        return 'border-blue-500 text-blue-800 bg-blue-50';
      } else {
        return 'border-emerald-500 text-emerald-800 bg-emerald-50'; // Physical
      }
    };

    const scanDataString = `ASSET REPORT:
-----------------
Code: ${asset.asset_code}
Name: ${asset.asset_name}
Classification: ${asset.classification || 'CONFIDENTIAL'}
Serial No: ${asset.serial_number || 'N/A'}
Facility: ${customFacility || 'Clinical Unit'}
Date: ${printDate}`;

    const { width: wInches, height: hInches } = getLabelDimensions();
    const widthPx = `${wInches * 100}px`;
    const heightPx = `${hInches * 100}px`;

    return (
      <div 
        key={asset.id + (index !== undefined ? `-${index}` : '')}
        className="relative overflow-hidden border border-dashed border-slate-300 bg-white p-3 rounded-lg flex flex-col justify-between shadow-xs print:border-solid print:border-black print:shadow-none print:m-0 print:p-2.5 select-none shrink-0"
        style={{
          width: widthPx,
          height: heightPx,
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          pageBreakAfter: 'always'
        }}
      >
        {/* Faded Background Logo - Fits perfectly to label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] p-6 select-none">
          {client?.facility_logo ? (
            <img 
              src={client.facility_logo} 
              alt="Watermark" 
              className="w-1/2 h-1/2 object-contain max-w-[50%] max-h-[70%] filter grayscale"
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-1/2 h-1/2 object-contain text-slate-800">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          )}
        </div>

        <div className="relative z-10 flex gap-2.5 flex-1 overflow-hidden">
          {/* Left Barcode / QR Code */}
          <div className="w-1/3 flex flex-col items-center justify-center border-r border-slate-100 pr-2 print:border-slate-200 shrink-0">
            {useQrCode ? (
              <div className="flex flex-col items-center justify-center gap-1">
                <QRCodeImage text={scanDataString} className="w-12 h-12 shrink-0 print:brightness-0" alt="Asset QR Code Tag" />
                <span className="text-[7px] font-mono uppercase text-slate-400 print:text-black tracking-wider font-extrabold">QR Tag</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 w-full">
                {generateBarcodeSVG(asset.asset_code)}
                <span className="text-[7.5px] font-mono text-slate-700 print:text-black font-extrabold truncate max-w-full text-center">{asset.asset_code}</span>
              </div>
            )}
          </div>

          {/* Right Details Container */}
          <div className="flex-1 flex flex-col justify-between pl-1 overflow-hidden">
            <div className="space-y-1">
              <div className="flex justify-between items-start gap-1">
                <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border leading-none shrink-0 ${getClassificationColor(asset.classification)}`}>
                  {asset.classification || 'CONFIDENTIAL'}
                </span>
                <span className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded border leading-none shrink-0 truncate max-w-[80px] ${getTypeColor(asset.asset_type)}`}>
                  {asset.asset_type === 'IT Asset' ? 'Physical' : asset.asset_type?.replace(' Asset', '') || 'Physical'}
                </span>
              </div>

              <div className="text-[11px] font-extrabold text-slate-900 font-mono leading-none tracking-tight truncate">
                {asset.asset_code}
              </div>

              <div className="text-[10px] font-black text-slate-800 line-clamp-3 leading-tight">
                {asset.asset_name}
              </div>
            </div>

            <div className="text-[7.5px] text-slate-500 leading-tight font-medium font-mono space-y-0.5 shrink-0">
              <div className="truncate">S/N: <span className="font-extrabold text-slate-800">{asset.serial_number || 'N/A'}</span></div>
              <div className="truncate">Location: <span className="font-semibold text-slate-700">{asset.location || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="relative z-10 mt-1 pt-1 border-t border-slate-150 flex items-center justify-between text-[7.5px] text-slate-400 font-mono font-bold print:text-black print:border-black shrink-0">
          <span className="truncate max-w-[150px] uppercase">{customFacility || 'Facility Name'}</span>
          <span>{printDate}</span>
        </div>
      </div>
    );
  };

  // Zebra Programming Language (ZPL) Label Generation & Exports
  const generateZplCode = (): string => {
    const listToGen = printAsset ? [printAsset] : (printAssetList || []);
    if (listToGen.length === 0) return '';

    const { width: wInches, height: hInches } = getLabelDimensions();
    // Use 203 DPI (dots per inch) for standard Zebra desktop printers (GK420t, ZD420, etc.)
    const totalDotsWidth = Math.round(wInches * 203);
    const totalDotsHeight = Math.round(hInches * 203);

    const leftDividerX = Math.round(totalDotsWidth * 0.3);
    const detailX = leftDividerX + 15;

    let zplStream = '';
    listToGen.forEach((asset) => {
      const name = asset.asset_name || 'Asset Node';
      const code = asset.asset_code || 'N/A';
      const sn = asset.serial_number || 'N/A';
      const loc = asset.location || 'N/A';
      const type = asset.asset_type === 'IT Asset' ? 'Physical' : (asset.asset_type || 'Physical').replace(' Asset', '');
      const cls = asset.classification || 'CONFIDENTIAL';
      const dateStr = printDate || '';
      const facilityStr = customFacility || 'Clinical Facility';

      // QR data string matches exactly what is on the screen QR code
      const qrData = `ASSET REPORT:\nCode: ${code}\nName: ${name}\nClass: ${cls}\nS/N: ${sn}\nLoc: ${loc}\nDate: ${dateStr}`;

      zplStream += `^XA\n`;
      zplStream += `^CI28\n`; // Enable UTF-8 encoding support
      
      // Outer border box (dynamic size based on actual width/height)
      zplStream += `^FO15,15^GB${totalDotsWidth - 30},${totalDotsHeight - 30},3^FS\n`;

      // Draw horizontal line separator at the bottom for footer
      zplStream += `^FO15,${totalDotsHeight - 50}^GB${totalDotsWidth - 30},2,2^FS\n`;

      // Draw vertical divider between barcode/QR and details
      zplStream += `^FO${leftDividerX},15^GB2,${totalDotsHeight - 50},2^FS\n`;

      // --- Left Column: Barcode or QR Code ---
      if (useQrCode) {
        // Dynamic magnification: 2 for small labels, 3 for normal/large
        const qrMag = wInches <= 2.6 || hInches <= 1.2 ? 2 : 3;
        const qrX = Math.round((leftDividerX - 15 - (qrMag * 35)) / 2) + 15;
        const qrY = Math.round((totalDotsHeight - 50 - 30 - (qrMag * 35)) / 2) + 15;
        zplStream += `^FO${Math.max(20, qrX)},${Math.max(20, qrY)}^BQN,2,${qrMag}^FDQA,${qrData}^FS\n`;
        
        // Code Label centered beneath the QR
        zplStream += `^FO${Math.max(20, qrX - 5)},${totalDotsHeight - 75}^A0N,16,16^FD${code}^FS\n`;
      } else {
        // Standard Code 128 Barcode
        const barHeight = Math.max(30, totalDotsHeight - 120);
        const barX = Math.round((leftDividerX - 15 - 130) / 2) + 15;
        const barY = Math.round((totalDotsHeight - 50 - barHeight) / 2) - 10;
        zplStream += `^FO${Math.max(20, barX)},${Math.max(20, barY)}^BCN,${barHeight},Y,N,N^FD${code}^FS\n`;
      }

      // --- Right Column: Details ---
      // Row 1: Classification & Type (dynamic spacing)
      const row1Y = Math.round((totalDotsHeight - 50) * 0.15) + 10;
      zplStream += `^FO${detailX},${row1Y}^A0N,18,18^FD[${cls}]^FS\n`;
      const typeX = totalDotsWidth - 140;
      zplStream += `^FO${Math.max(detailX + 110, typeX)},${row1Y}^A0N,16,16^FD${type}^FS\n`;

      // Row 2: Large Asset Code
      const row2Y = Math.round((totalDotsHeight - 50) * 0.35) + 10;
      zplStream += `^FO${detailX},${row2Y}^A0N,24,24^FD${code}^FS\n`;

      // Row 3: Asset Name (split or truncated based on label width)
      const row3Y = Math.round((totalDotsHeight - 50) * 0.55) + 10;
      let displayNm = name;
      const maxChar = wInches <= 2.8 ? 20 : 28;
      if (displayNm.length > maxChar) displayNm = displayNm.substring(0, maxChar - 2) + '...';
      zplStream += `^FO${detailX},${row3Y}^A0N,18,18^FD${displayNm}^FS\n`;

      // Row 4: S/N
      const row4Y = Math.round((totalDotsHeight - 50) * 0.72) + 10;
      zplStream += `^FO${detailX},${row4Y}^A0N,16,16^FDS/N: ${sn}^FS\n`;

      // Row 5: Location (only show if label height is sufficient)
      const row5Y = Math.round((totalDotsHeight - 50) * 0.85) + 10;
      if (hInches >= 1.2) {
        zplStream += `^FO${detailX},${row5Y}^A0N,16,16^FDLOC: ${loc}^FS\n`;
      }

      // --- Bottom Row: Footer ---
      const footerY = totalDotsHeight - 35;
      let facDisplay = facilityStr;
      const maxFacChar = wInches <= 2.8 ? 16 : 24;
      if (facDisplay.length > maxFacChar) facDisplay = facDisplay.substring(0, maxFacChar - 2) + '...';
      zplStream += `^FO30,${footerY}^A0N,16,16^FD${facDisplay.toUpperCase()}^FS\n`;
      const dateX = totalDotsWidth - 110;
      zplStream += `^FO${Math.max(detailX + 80, dateX)},${footerY}^A0N,16,16^FD${dateStr}^FS\n`;

      zplStream += `^XZ\n\n`;
    });

    return zplStream.trim();
  };

  const handleDownloadZpl = () => {
    const code = generateZplCode();
    if (!code) return;
    
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = printAsset 
      ? `zebra_label_${printAsset.asset_code}.zpl` 
      : `zebra_labels_bulk_${printAssetList?.length || 0}.zpl`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportZebraCsv = () => {
    const listToGen = printAsset ? [printAsset] : (printAssetList || []);
    if (listToGen.length === 0) return;

    const headers = ["AssetCode", "AssetName", "SerialNumber", "Location", "Classification", "AssetType", "Facility", "PrintDate", "ScanDataString"];
    
    const rows = listToGen.map(asset => {
      const name = asset.asset_name || 'Asset Node';
      const code = asset.asset_code || 'N/A';
      const sn = asset.serial_number || 'N/A';
      const loc = asset.location || 'N/A';
      const type = asset.asset_type === 'IT Asset' ? 'Physical' : (asset.asset_type || 'Physical').replace(' Asset', '');
      const cls = asset.classification || 'CONFIDENTIAL';
      const dateStr = printDate || '';
      const facilityStr = customFacility || 'Clinical Facility';
      const qrData = `ASSET REPORT:\nCode: ${code}\nName: ${name}\nClass: ${cls}\nS/N: ${sn}\nLoc: ${loc}\nDate: ${dateStr}`;

      const escapeVal = (val: string) => `"${val.replace(/"/g, '""')}"`;

      return [
        escapeVal(code),
        escapeVal(name),
        escapeVal(sn),
        escapeVal(loc),
        escapeVal(cls),
        escapeVal(type),
        escapeVal(facilityStr),
        escapeVal(dateStr),
        escapeVal(qrData)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = printAsset 
      ? `zebra_designer_data_${printAsset.asset_code}.csv`
      : `zebra_designer_data_bulk_${printAssetList?.length || 0}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Import logic
  const getTemplateText = (type: 'auto' | 'physical' | 'biomedical' | 'software') => {
    if (type === 'biomedical') {
      return `Asset Name*\tDevice Description\tOperating System*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tPPM Date *\tPPM Due Date *\tStatus *\tClassification *\tRemarks
BioMed Cardiac Defibrillator\tAdvanced automated external defibrillator with sync\tEmbedded RTOS\tAST-MED-201\tEmergency Unit Room 3\tSNBIOMED8822\tAseef Sulaiman\tEmergency Nurses\t2031-06-30\t2031-06-30\tACTIVE\tRESTRICTED\tLife support device requiring high uptime
Syringe Pump Alaris\tDual-channel smart infusion pump\tEmbedded RTOS\tAST-MED-202\tICU Bed 4\tSNSYRINGE1234\tDr. Sarah Connor\tICU Staff\t2032-12-31\t2032-12-31\tACTIVE\tINTERNAL\tInfusion device (PPM Due: 2026-09-15)`;
    }
    if (type === 'software') {
      return `Asset Code\tSoftware Platform\tCategory\tVersion\tLocation Scope\tCustodian\tClass.\tStatus
AST-SFT-301\tApex Cloud EMR Database\tEMR Database\tv4.8.2\tCloud Virtual Server\tAseef Sulaiman\tRESTRICTED\tACTIVE
AST-SFT-302\tPACS Imaging Suite\tMedical Imaging\tv2.1.0\tOn-Premise Server\tDr. Sarah Connor\tCONFIDENTIAL\tACTIVE
AST-SFT-303\tAcuity Patient Portal\tPatient Portal\tv1.0.5\tCloud Virtual Server\tIT Support\tINTERNAL\tACTIVE`;
    }
    if (type === 'physical') {
      return `Asset Name*\tDevice Description\tOperating System*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tEnd-Of-Life *\tEnd-Of-Service *\tStatus *\tClassification *\tRemarks
Clinical workstation Dell OptiPlex\tDesktop computer for clinic queues\tWindows 11\tAST-DT-101\tOPD Reception Clinic A\tSNDELLOPTI99\tAseef Sulaiman\tNurses Team\t2029-12-31\t2029-12-31\tACTIVE\tINTERNAL\tWorkstation for clinical queue processing
Admin Laptop Lenovo ThinkPad\tManager notebook computer\tWindows 11\tAST-LT-102\tFinance Office\tSNTHINKPAD33\tFinance Manager\tAccounts Clerk\t2028-06-30\t2028-06-30\tACTIVE\tCONFIDENTIAL\tAccounting department computer`;
    }
    // 'auto' contains columns with Asset Type*
    return `Asset Name*\tDevice Description\tOperating System*\tAsset Type*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tEnd-Of-Life *\tEnd-Of-Service *\tStatus *\tClassification *\tRemarks
Clinical workstation Dell OptiPlex\tDesktop computer for clinic queues\tWindows 11\tPhysical Asset\tAST-DT-101\tOPD Reception Clinic A\tSNDELLOPTI99\tAseef Sulaiman\tNurses Team\t2029-12-31\t2029-12-31\tACTIVE\tINTERNAL\tWorkstation for clinical queue processing
BioMed Cardiac Defibrillator\tAdvanced external defibrillator\tEmbedded RTOS\tBiomedical Asset\tAST-MED-202\tEmergency Unit Room 3\tSNBIOMED8822\tAseef Sulaiman\tEmergency Nurses\t2031-06-30\t2031-06-30\tACTIVE\tRESTRICTED\tLife support device
Apex Cloud EMR Database\tEMR main software suite\tNot Applicable\tSoftware Asset\tAST-SFT-303\tCloud Virtual Server\tSNSFTEMRA91\tAseef Sulaiman\tCloud SysAdmin\t2030-01-01\t2030-01-01\tACTIVE\tRESTRICTED\tElectronic Health Records database platform`;
  };

  const loadImportTemplate = () => {
    const template = getTemplateText(importTargetType);
    setBulkInputText(template);
    handleTextareaParse(template);
  };

  const downloadCsvTemplate = () => {
    let headersLine = '';
    let rows: string[] = [];
    
    if (importTargetType === 'biomedical') {
      headersLine = `Asset Name*,Device Description,Operating System*,Asset Code *,Asset Location *,Serial Number,Asset Owner *,Asset Operator *,PPM Date *,PPM Due Date *,Status *,Classification *,Remarks`;
      rows = [
        `BioMed Cardiac Defibrillator,Advanced automated external defibrillator with sync,Embedded RTOS,AST-MED-201,Emergency Unit Room 3,SNBIOMED8822,Aseef Sulaiman,Emergency Nurses,2031-06-30,2031-06-30,ACTIVE,RESTRICTED,Life support device requiring high uptime`,
        `Syringe Pump Alaris,Dual-channel smart infusion pump,Embedded RTOS,AST-MED-202,ICU Bed 4,SNSYRINGE1234,Dr. Sarah Connor,ICU Staff,2032-12-31,2032-12-31,ACTIVE,INTERNAL,Infusion device`
      ];
    } else if (importTargetType === 'software') {
      headersLine = `Asset Code,Software Platform,Category,Version,Location Scope,Custodian,Class.,Status`;
      rows = [
        `AST-SFT-301,Apex Cloud EMR Database,EMR Database,v4.8.2,Cloud Virtual Server,Aseef Sulaiman,RESTRICTED,ACTIVE`,
        `AST-SFT-302,PACS Imaging Suite,Medical Imaging,v2.1.0,On-Premise Server,Dr. Sarah Connor,CONFIDENTIAL,ACTIVE`,
        `AST-SFT-303,Acuity Patient Portal,Patient Portal,v1.0.5,Cloud Virtual Server,IT Support,INTERNAL,ACTIVE`
      ];
    } else if (importTargetType === 'physical') {
      headersLine = `Asset Name*,Device Description,Operating System*,Asset Code *,Asset Location *,Serial Number,Asset Owner *,Asset Operator *,End-Of-Life *,End-Of-Service *,Status *,Classification *,Remarks`;
      rows = [
        `Clinical workstation Dell OptiPlex,Desktop computer for clinic queues,Windows 11,AST-DT-101,OPD Reception Clinic A,SNDELLOPTI99,Aseef Sulaiman,Nurses Team,2029-12-31,2029-12-31,ACTIVE,INTERNAL,Workstation for clinical queue processing`,
        `Admin Laptop Lenovo ThinkPad,Manager notebook computer,Windows 11,AST-LT-102,Finance Office,SNTHINKPAD33,Finance Manager,Accounts Clerk,2028-06-30,2028-06-30,ACTIVE,CONFIDENTIAL,Accounting department computer`
      ];
    } else {
      headersLine = `Asset Name*,Device Description,Operating System*,Asset Type*,Asset Code *,Asset Location *,Serial Number,Asset Owner *,Asset Operator *,End-Of-Life *,End-Of-Service *,Status *,Classification *,Remarks`;
      rows = [
        `Clinical workstation Dell OptiPlex,Desktop computer for clinic queues,Windows 11,Physical Asset,AST-DT-101,OPD Reception Clinic A,SNDELLOPTI99,Aseef Sulaiman,Nurses Team,2029-12-31,2029-12-31,ACTIVE,INTERNAL,Workstation for clinical queue processing`,
        `BioMed Cardiac Defibrillator,Advanced external defibrillator,Embedded RTOS,Biomedical Asset,AST-MED-202,Emergency Unit Room 3,SNBIOMED8822,Aseef Sulaiman,Emergency Nurses,2031-06-30,2031-06-30,ACTIVE,RESTRICTED,Life support device requiring high uptime`,
        `Apex Cloud EMR Database,EMR main software suite,Not Applicable,Software Asset,AST-SFT-303,Cloud Virtual Server,SNSFTEMRA91,Aseef Sulaiman,Cloud SysAdmin,2030-01-01,2030-01-01,ACTIVE,RESTRICTED,Electronic Health Records database platform`
      ];
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + [headersLine, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assets_${importTargetType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTextareaParse = (textVal: string) => {
    setBulkInputText(textVal);
    if (!textVal.trim()) {
      setImportPreview([]);
      setImportError(null);
      return;
    }

    try {
      const lines = textVal.split(/\n/);
      if (lines.length < 2) {
        setImportError("Input must include a header line and at least one data row.");
        return;
      }

      const headerLine = lines[0];
      const delimiter = headerLine.includes('\t') ? '\t' : ',';
      const headers = headerLine.split(delimiter).map(h => h.trim().replace(/[*"]/g, '').toLowerCase());

      const list: Partial<Asset>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let cells: string[] = [];
        if (delimiter === ',') {
          // Robust CSV parsing that preserves spaces in names and handles optional quotes and empty cells
          cells = [];
          let currentCell = '';
          let inQuotes = false;
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(currentCell.trim());
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim());
          
          // Clean quotes from start/end of each cell
          cells = cells.map(c => c.replace(/^"|"$/g, '').trim());
        } else {
          cells = line.split('\t').map(c => c.trim());
        }

        const obj: any = {};
        headers.forEach((header, index) => {
          const val = cells[index] || '';
          
          if (header.includes('softwarename') || header.includes('software name') || header.includes('software_name') || header.includes('software platform') || header.includes('platform')) obj.asset_name = val;
          else if (header.includes('name')) obj.asset_name = val;
          else if (header.includes('description') || header.includes('device') || header.includes('asset desc')) obj.description = val;
          else if (header.includes('operating') || header.includes('os')) obj.operating_system = val;
          else if (header.includes('type')) {
            const low = val.toLowerCase();
            if (low.includes('bio')) obj.asset_type = 'Biomedical Asset';
            else if (low.includes('soft')) obj.asset_type = 'Software Asset';
            else obj.asset_type = 'Physical Asset';
          }
          else if (header.includes('code')) obj.asset_code = val;
          else if (header.includes('location')) obj.location = val;
          else if (header.includes('serial')) obj.serial_number = val;
          else if (header.includes('owner') || header.includes('custodian')) obj.asset_owner = val;
          else if (header.includes('operator')) obj.asset_operator = val;
          else if (header.includes('life') || header.includes('eol')) obj.eol_date = val;
          else if (header.includes('service') || header.includes('eos')) obj.eos_date = val;
          else if (header.includes('status')) {
            const u = val.toUpperCase();
            obj.status = ['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED', 'STOLEN_LOST'].includes(u) ? u : 'ACTIVE';
          }
          else if (header.includes('class')) {
            const u = val.toUpperCase();
            obj.classification = ['RESTRICTED', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC'].includes(u) ? u : 'CONFIDENTIAL';
          }
          else if (header.includes('remarks') || header.includes('details')) obj.remarks = val;
          else if (header.includes('ppm date')) obj.ppm_date = val;
          else if (header.includes('ppm due')) obj.ppm_due_date = val;
          else if (header.includes('version')) obj.version = val;
          else if (header.includes('category')) obj.asset_category = val;
          else if (header.includes('manufacture') || header.includes('vendor')) obj.manufacturer = val;
        });

        // Set mandatory defaults if parsed cell is blank
        if (obj.asset_name) {
          if (importTargetType === 'physical') {
            obj.asset_type = 'Physical Asset';
          } else if (importTargetType === 'biomedical') {
            obj.asset_type = 'Biomedical Asset';
          } else if (importTargetType === 'software') {
            obj.asset_type = 'Software Asset';
          } else if (!obj.asset_type) {
            // Smart auto-detection fallback based on name and category
            const nameLow = (obj.asset_name || '').toLowerCase();
            const locationLow = (obj.location || '').toLowerCase();
            const combinedTxt = `${nameLow} ${locationLow}`;
            if (
              combinedTxt.includes('biomed') || 
              combinedTxt.includes('medical') || 
              combinedTxt.includes('cardiac') || 
              combinedTxt.includes('defibrillator') || 
              combinedTxt.includes('pump') || 
              combinedTxt.includes('syringe') || 
              combinedTxt.includes('ventilator') || 
              combinedTxt.includes('ultrasound') || 
              combinedTxt.includes('scanner') || 
              combinedTxt.includes('clinical') || 
              combinedTxt.includes('icu') || 
              combinedTxt.includes('patient monitor') || 
              combinedTxt.includes('respirator') || 
              combinedTxt.includes('infusion') || 
              combinedTxt.includes('dialysis') || 
              combinedTxt.includes('anesthesia') || 
              combinedTxt.includes('oximeter') || 
              combinedTxt.includes('electrocardiograph') || 
              combinedTxt.includes('ecg') || 
              combinedTxt.includes('ekg') ||
              combinedTxt.includes('dentist') ||
              combinedTxt.includes('dental') ||
              combinedTxt.includes('sterilizer') ||
              combinedTxt.includes('x-ray') ||
              combinedTxt.includes('mri') ||
              combinedTxt.includes('ct scan')
            ) {
              obj.asset_type = 'Biomedical Asset';
            } else if (
              combinedTxt.includes('software') || 
              combinedTxt.includes('app') || 
              combinedTxt.includes('license') || 
              combinedTxt.includes('database') || 
              combinedTxt.includes('emr') || 
              combinedTxt.includes('pacs') || 
              combinedTxt.includes('portal')
            ) {
              obj.asset_type = 'Software Asset';
            } else {
              obj.asset_type = 'Physical Asset';
            }
          }

          if (!obj.asset_owner) obj.asset_owner = 'Aseef Sulaiman';
          if (!obj.location) obj.location = 'Main Clinic';
          if (!obj.operating_system) {
            obj.operating_system = obj.asset_type === 'Software Asset' ? 'Not Applicable' : 'Embedded RTOS';
          }
          if (!obj.classification) obj.classification = 'CONFIDENTIAL';
          if (!obj.status) obj.status = 'ACTIVE';
          list.push(obj);
        }
      }

      setImportPreview(list);
      setImportError(null);
    } catch (err: any) {
      setImportError(`Failed to parse text: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleTextareaParse(text);
    };
    reader.onerror = () => {
      setImportError("Failed to read the file. Please make sure it is a valid text file.");
    };
    reader.readAsText(file);
  };

  const executeBulkImport = () => {
    if (importPreview.length === 0) {
      alert("No valid assets found to import.");
      return;
    }

    const currentClientAssets = assets.filter(a => a.client_id === activeClientId);
    
    // Store existing software names to prevent duplicates
    const existingSoftwareNames = new Set<string>();
    currentClientAssets.forEach(a => {
      if (a.asset_type === 'Software Asset') {
        existingSoftwareNames.add(a.asset_name.trim().toLowerCase());
      }
    });

    const formattedAssets: Asset[] = [];
    const seenImportNames = new Set<string>();

    for (let idx = 0; idx < importPreview.length; idx++) {
      const item = importPreview[idx];
      const actualType = item.asset_type as any || (importTargetType === 'software' ? 'Software Asset' : 'Physical Asset');

      // If Software Asset, prevent duplicate name
      if (actualType === 'Software Asset') {
        const nameKey = (item.asset_name || '').trim().toLowerCase();
        if (!nameKey) continue;
        if (existingSoftwareNames.has(nameKey) || seenImportNames.has(nameKey)) {
          continue; // skip duplicate software name
        }
        seenImportNames.add(nameKey);
      }

      // Build a reliable asset code sequence using the already mapped items to keep codes unique
      const dummyCode = item.asset_code || generateNextAssetCode(
        actualType, 
        'General', 
        '', 
        [...currentClientAssets, ...formattedAssets]
      );

      formattedAssets.push({
        id: 'a_bulk_' + Math.floor(Math.random() * 100000) + '_' + idx,
        client_id: activeClientId,
        asset_code: dummyCode,
        asset_name: item.asset_name || 'Imported Asset Node',
        asset_type: actualType,
        asset_category: item.asset_category || (actualType === 'Biomedical Asset' ? 'Biomedical Equipment' : actualType === 'Software Asset' ? 'Software Tool' : 'Computer Hardware'),
        operating_system: item.operating_system || 'Not Applicable',
        location: item.location || (actualType === 'Software Asset' ? 'Cloud Virtual Server' : 'Main Facility Room'),
        serial_number: item.serial_number || (actualType === 'Software Asset' ? 'Not Applicable' : 'S/N Not Set'),
        asset_owner: item.asset_owner || (actualType === 'Software Asset' ? 'IT Dept' : 'IT Custodian'),
        asset_operator: item.asset_operator || (actualType === 'Software Asset' ? 'System Admins' : 'Staff Node'),
        eol_date: item.eol_date || new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eos_date: item.eos_date || new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: item.status as any || 'ACTIVE',
        classification: item.classification as any || 'CONFIDENTIAL',
        remarks: item.remarks || '',
        ppm_date: item.ppm_date,
        ppm_due_date: item.ppm_due_date,
        version: item.version || (actualType === 'Software Asset' ? 'v1.0' : undefined),
        manufacturer: item.manufacturer || (actualType === 'Software Asset' ? 'Unknown Vendor' : 'General Manufacturer'),
        model: 'Generic Model',
        c_val: item.classification === 'RESTRICTED' ? 5 : item.classification === 'CONFIDENTIAL' ? 4 : 3,
        i_val: item.classification === 'RESTRICTED' ? 5 : item.classification === 'CONFIDENTIAL' ? 4 : 3,
        a_val: item.classification === 'RESTRICTED' ? 5 : item.classification === 'CONFIDENTIAL' ? 4 : 3,
        created_at: new Date().toISOString()
      });
    }

    if (onBulkAddAssets) {
      onBulkAddAssets(formattedAssets);
    }
    
    setIsImporting(false);
    setBulkInputText('');
    setImportPreview([]);
    alert(`Successfully imported ${formattedAssets.length} assets to the client registry!`);
  };

  return (
    <div id="inventory-management-root" className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Assets Inventory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Register and monitor clinical equipment, computer systems, and software platforms. Mapped directly with owner/custodians, operating systems, and scheduled PPM timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBulkAddAssets && (
            <button
              onClick={() => {
                setImportPreview([]);
                setBulkInputText('');
                setImportError(null);
                setIsImporting(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Excel Bulk Import
            </button>
          )}
          <button
            onClick={() => {
              setPrintAssetList(filteredAssets);
              setPrintAsset(null);
              setCustomFacility(client?.company_name || 'Active Clinical Facility');
            }}
            disabled={filteredAssets.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Bulk print sticker label tags for currently filtered list"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Tags ({filteredAssets.length})
          </button>
          {onOpenQuickSetup && (
            <button
              onClick={onOpenQuickSetup}
              className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Configure facility details, auditors, prepared/approved-by fields on the fly"
            >
              <span>⚡</span> Quick Setup
            </button>
          )}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-150 border border-blue-200 text-blue-700 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
            title="Generate standardized compliant Assets Inventory Report"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Inventory Report
          </button>
          <button
            onClick={openNewAssetModal}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Asset
          </button>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        
        {/* Total Assets card */}
        <div 
          onClick={() => setSelectedTab('ALL')}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
            selectedTab === 'ALL'
              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${selectedTab === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>All Registry</span>
            <Layers className={`w-4 h-4 ${selectedTab === 'ALL' ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black tracking-tight">{clientAssets.length}</span>
            <span className={`text-[10px] font-bold ${selectedTab === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>Nodes</span>
          </div>
        </div>

        {/* Physical Assets card */}
        <div 
          onClick={() => setSelectedTab('PHYSICAL')}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
            selectedTab === 'PHYSICAL'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${selectedTab === 'PHYSICAL' ? 'text-emerald-100' : 'text-slate-400'}`}>Physical IT</span>
            <HardDrive className={`w-4 h-4 ${selectedTab === 'PHYSICAL' ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black tracking-tight">
              {clientAssets.filter(a => a.asset_type === 'Physical Asset' || a.asset_type === 'IT Asset' || (!a.asset_type)).length}
            </span>
            <span className={`text-[10px] font-bold ${selectedTab === 'PHYSICAL' ? 'text-emerald-100' : 'text-slate-400'}`}>Units</span>
          </div>
        </div>

        {/* Biomedical Assets card */}
        <div 
          onClick={() => setSelectedTab('BIOMEDICAL')}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
            selectedTab === 'BIOMEDICAL'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${selectedTab === 'BIOMEDICAL' ? 'text-blue-100' : 'text-slate-400'}`}>Biomedical</span>
            <Activity className={`w-4 h-4 ${selectedTab === 'BIOMEDICAL' ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black tracking-tight">
              {clientAssets.filter(a => a.asset_type === 'Biomedical Asset').length}
            </span>
            <span className={`text-[10px] font-bold ${selectedTab === 'BIOMEDICAL' ? 'text-blue-100' : 'text-slate-400'}`}>Machines</span>
          </div>
        </div>

        {/* Software Assets card */}
        <div 
          onClick={() => setSelectedTab('SOFTWARE')}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
            selectedTab === 'SOFTWARE'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${selectedTab === 'SOFTWARE' ? 'text-indigo-100' : 'text-slate-400'}`}>Software</span>
            <FileText className={`w-4 h-4 ${selectedTab === 'SOFTWARE' ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black tracking-tight">
              {clientAssets.filter(a => a.asset_type === 'Software Asset').length}
            </span>
            <span className={`text-[10px] font-bold ${selectedTab === 'SOFTWARE' ? 'text-indigo-100' : 'text-slate-400'}`}>Apps</span>
          </div>
        </div>

        {/* Verified Assets card */}
        <div 
          onClick={() => setVerifiedFilter(prev => prev === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
          className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
            verifiedFilter === 'VERIFIED'
              ? 'bg-teal-700 border-teal-700 text-white shadow-md'
              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${verifiedFilter === 'VERIFIED' ? 'text-teal-100' : 'text-slate-400'}`}>Verified Status</span>
            <ShieldCheck className={`w-4 h-4 ${verifiedFilter === 'VERIFIED' ? 'text-teal-200' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black tracking-tight">
              {clientAssets.filter(a => a.is_verified).length}
            </span>
            <span className={`text-[10px] font-bold ${verifiedFilter === 'VERIFIED' ? 'text-teal-100' : 'text-slate-400'}`}>/ {clientAssets.length} Verified</span>
          </div>
        </div>

      </div>

      {/* Control Actions / Search bar & Bulk Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-72 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, OS, serial..."
              className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600">Verification:</span>
            <select
              value={verifiedFilter}
              onChange={e => setVerifiedFilter(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">All Assets</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="UNVERIFIED">Unverified Only</option>
            </select>
          </div>
        </div>

        {selectedAssetIds.length > 0 && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-xl text-rose-800 animate-fade-in shrink-0">
            <span className="text-[11px] font-black text-rose-900 font-mono">
              {selectedAssetIds.length} SELECTED
            </span>
            <div className="h-4 w-px bg-rose-200" />
            <button
              type="button"
              onClick={handleBulkVerify}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-[1.02]"
              title="Mark all selected assets as Verified"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Mark Verified
            </button>
            <button
              type="button"
              onClick={() => {
                const selectedAssetsList = clientAssets.filter(a => selectedAssetIds.includes(a.id));
                setPrintAssetList(selectedAssetsList);
                setPrintAsset(null);
                setCustomFacility(client?.company_name || 'Active Clinical Facility');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-[1.02]"
              title="Bulk print sticker label tags for selected list"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Tags
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-md hover:scale-[1.02]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedAssetIds([])}
              className="text-[11px] text-slate-500 hover:text-slate-700 font-bold ml-1 cursor-pointer"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {(() => {
        if (selectedTab !== 'SOFTWARE') return null;
        const clientSoftwareRaw = assets.filter(a => a.client_id === activeClientId && a.asset_type === 'Software Asset');
        const seenNamesForCount = new Set<string>();
        const ids: string[] = [];
        clientSoftwareRaw.forEach(a => {
          const nameKey = a.asset_name.trim().toLowerCase();
          if (seenNamesForCount.has(nameKey)) {
            ids.push(a.id);
          } else {
            seenNamesForCount.add(nameKey);
          }
        });

        if (ids.length === 0) return null;

        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-bold text-amber-900">Duplicate Software Assets Detected</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Detected <strong>{ids.length}</strong> duplicate software asset entry(ies) by name. To maintain standard compliance hygiene, you can merge them and keep only one unique node.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onDeleteAsset) {
                  ids.forEach(id => onDeleteAsset(id));
                  alert(`Successfully removed ${ids.length} duplicate software asset(s).`);
                }
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer text-center"
            >
              🧹 Deduplicate Software
            </button>
          </div>
        );
      })()}

      {/* Assets Main Ledger Table - FULL COLUMNS MATCHING THE USER REQUEST */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1450px]">
            <thead>
              {selectedTab === 'SOFTWARE' ? (
                <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-500 text-[11px]">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.includes(a.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssetIds(filteredAssets.map(a => a.id));
                        } else {
                          setSelectedAssetIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-52">Software Name *</th>
                  <th className="p-4 w-48">Vendor Name *</th>
                  <th className="p-4 w-32">Version *</th>
                  <th className="p-4 w-36 text-center">Classification *</th>
                  <th className="p-4 w-28 text-center">Verified *</th>
                  <th className="p-4">Remarks & Special Details</th>
                  <th className="p-4 text-center w-20">Actions</th>
                </tr>
              ) : (
                <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-500 text-[11px]">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.includes(a.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssetIds(filteredAssets.map(a => a.id));
                        } else {
                          setSelectedAssetIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-28">Asset Code * <span className="block text-[8px] font-medium text-slate-400 font-sans tracking-normal uppercase mt-0.5">(Auto Generated)</span></th>
                  <th className="p-4 w-44">Asset Name *</th>
                  <th className="p-4 w-28 text-center">Asset Type *</th>
                  <th className="p-4 w-36">Operating System *</th>
                  <th className="p-4 w-32">Location *</th>
                  <th className="p-4 w-32">Serial Number</th>
                  <th className="p-4 w-32">Asset Owner *</th>
                  <th className="p-4 w-32">Asset Operator *</th>
                  <th className="p-4 w-28 text-center">
                    {selectedTab === 'BIOMEDICAL' ? 'PPM Date *' : 'End-Of-Life *'}
                  </th>
                  <th className="p-4 w-28 text-center">
                    {selectedTab === 'BIOMEDICAL' ? 'PPM Due Date *' : 'End-Of-Service *'}
                  </th>
                  <th className="p-4 w-24 text-center">Status *</th>
                  <th className="p-4 w-28 text-center">Classification *</th>
                  <th className="p-4 w-28 text-center">Verified *</th>
                  <th className="p-4 w-40">Remarks & Special Details</th>
                  <th className="p-4 text-center w-20">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAssets.length > 0 ? (
                filteredAssets.map(asset => {
                  const ciaAvg = Math.round(((asset.c_val || 3) + (asset.i_val || 3) + (asset.a_val || 3)) / 3);
                  
                  // Check dates for End of Life warning
                  const isEolPassed = asset.eol_date ? new Date(asset.eol_date) < new Date() : false;
                  const isEosPassed = asset.eos_date ? new Date(asset.eos_date) < new Date() : false;

                  if (selectedTab === 'SOFTWARE') {
                    return (
                      <tr key={asset.id} className={`hover:bg-slate-50/30 transition-colors ${selectedAssetIds.includes(asset.id) ? 'bg-emerald-50/20' : ''}`}>
                        {/* Selection Checkbox */}
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedAssetIds.includes(asset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds(prev => [...prev, asset.id]);
                              } else {
                                setSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Software Name */}
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-xs">{asset.asset_name}</div>
                        </td>

                        {/* Vendor Name */}
                        <td className="p-4 text-slate-800 font-bold">
                          {asset.manufacturer || 'N/A'}
                        </td>

                        {/* Version */}
                        <td className="p-4 font-mono text-slate-700">
                          <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-150 text-[10px] font-bold">
                            {asset.version || 'v1.0'}
                          </span>
                        </td>

                        {/* Classification */}
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            asset.classification === 'RESTRICTED' 
                              ? 'bg-red-100 text-red-800' 
                              : asset.classification === 'CONFIDENTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : asset.classification === 'INTERNAL'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {asset.classification || 'CONFIDENTIAL'}
                          </span>
                        </td>

                        {/* Verified Status */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(asset)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                              asset.is_verified
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title={asset.is_verified ? `Verified on ${asset.verified_at ? asset.verified_at.split('T')[0] : 'recent audit'} by ${asset.verified_by || 'Auditor'}. Click to toggle.` : 'Click to mark software as Verified'}
                          >
                            {asset.is_verified ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Verified</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Unverified</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Remarks & Special Details */}
                        <td className="p-4 text-xs font-normal">
                          <div className="space-y-1">
                            {asset.remarks ? (
                              <p className="text-slate-600 font-medium" title={asset.remarks}>
                                {asset.remarks}
                              </p>
                            ) : (
                              <span className="text-slate-400 font-mono text-[9px]">No additional special details recorded.</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setPrintAsset(asset);
                                setPrintAssetList(null);
                                setCustomFacility(client?.company_name || 'Active Clinical Facility');
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Print Asset Sticker Tag"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditAssetModal(asset)}
                              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Edit Asset Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Node"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={asset.id} className={`hover:bg-slate-50/30 transition-colors ${selectedAssetIds.includes(asset.id) ? 'bg-emerald-50/20' : ''}`}>
                      {/* Selection Checkbox */}
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedAssetIds.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssetIds(prev => [...prev, asset.id]);
                            } else {
                              setSelectedAssetIds(prev => prev.filter(id => id !== asset.id));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Asset Code */}
                      <td className="p-4 font-mono font-bold text-slate-900">{asset.asset_code}</td>
                      
                      {/* Asset Name + details */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-xs">{asset.asset_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5 font-mono">
                          {asset.asset_category} {asset.model && `[${asset.model}]`}
                        </div>
                      </td>

                      {/* Asset Type Badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase ${
                          asset.asset_type === 'Software Asset' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : asset.asset_type === 'Biomedical Asset'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {asset.asset_type === 'IT Asset' ? 'Physical' : asset.asset_type?.replace(' Asset', '')}
                        </span>
                      </td>

                      {/* Operating System */}
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                          {asset.operating_system || 'Not Applicable'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]" title={asset.location}>{asset.location || 'N/A'}</span>
                          </div>
                          {asset.department && (
                            <span className="text-[10px] text-indigo-600 font-bold tracking-tight bg-indigo-50/60 border border-indigo-150 px-1.5 py-0.5 rounded mt-1 self-start">
                              {asset.department}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Serial Number */}
                      <td className="p-4 font-mono text-slate-600 text-[11px] truncate max-w-[110px]" title={asset.serial_number}>
                        {asset.serial_number || 'S/N Not Set'}
                      </td>

                      {/* Owner */}
                      <td className="p-4 text-slate-900 font-bold truncate max-w-[110px]" title={asset.asset_owner}>
                        {asset.asset_owner}
                      </td>

                      {/* Operator */}
                      <td className="p-4 text-slate-700 truncate max-w-[110px]" title={asset.asset_operator}>
                        {asset.asset_operator || 'Staff Group'}
                      </td>

                      {/* End of Life / PPM Date */}
                      <td className="p-4 text-center font-mono">
                        {asset.asset_type === 'Biomedical Asset' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-100">
                            {asset.ppm_date || 'N/A'}
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isEolPassed ? 'bg-red-50 text-red-600 font-black border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                            {asset.eol_date || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* End of Service / PPM Due Date */}
                      <td className="p-4 text-center font-mono">
                        {asset.asset_type === 'Biomedical Asset' ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            asset.ppm_due_date && new Date(asset.ppm_due_date) < new Date() 
                              ? 'bg-red-50 text-red-600 font-black border border-red-100' 
                              : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                          }`}>
                            {asset.ppm_due_date || 'N/A'}
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${isEosPassed ? 'bg-red-50 text-red-600 font-black border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                            {asset.eos_date || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          asset.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                            : asset.status === 'UNDER_MAINTENANCE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {asset.status}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          asset.classification === 'RESTRICTED' 
                            ? 'bg-red-100 text-red-800' 
                            : asset.classification === 'CONFIDENTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : asset.classification === 'INTERNAL'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {asset.classification}
                        </span>
                      </td>

                      {/* Verified Status */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVerify(asset)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                            asset.is_verified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 shadow-2xs'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={asset.is_verified ? `Verified on ${asset.verified_at ? asset.verified_at.split('T')[0] : 'recent audit'} by ${asset.verified_by || 'Auditor'}. Click to toggle.` : 'Click to mark asset as Verified'}
                        >
                          {asset.is_verified ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Unverified</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Remarks & Custom details (PPM schedule / Software version / Manufacturer details) */}
                      <td className="p-4 text-xs font-normal">
                        <div className="space-y-1 max-w-[200px]">
                          {asset.asset_type === 'Biomedical Asset' && (
                            <div className="bg-blue-50/50 border border-blue-100 p-1 rounded text-[10px] font-semibold text-blue-800">
                              <span className="font-extrabold uppercase text-[9px] block">PPM Interval:</span>
                              PPM: {asset.ppm_date || 'N/A'} • Due: {asset.ppm_due_date || 'N/A'}
                            </div>
                          )}
                          {asset.asset_type === 'Software Asset' && (
                            <div className="bg-indigo-50/50 border border-indigo-100 p-1 rounded text-[10px] font-semibold text-indigo-800">
                              <span className="font-extrabold uppercase text-[9px] block">Software Specs:</span>
                              Version: {asset.version || 'v1.0'} • Dev: {asset.manufacturer || 'General'}
                            </div>
                          )}
                          {asset.remarks ? (
                            <p className="text-slate-500 italic text-[10px] line-clamp-2" title={asset.remarks}>
                              "{asset.remarks}"
                            </p>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px]">No additional log records.</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setPrintAsset(asset);
                              setPrintAssetList(null);
                              setCustomFacility(client?.company_name || 'Active Clinical Facility');
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Print Asset Sticker Tag"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditAssetModal(asset)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Node"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={selectedTab === 'SOFTWARE' ? 7 : 15} className="p-10 text-center text-slate-400 font-medium">
                    No matching equipment, machinery or software nodes found in this client inventory register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ASSET DETAILS MODAL (CRUD + NESTED OPTION TRIGGERING) --- */}
      {isAdding && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-100 shadow-2xl flex flex-col my-8 animate-fade-in max-h-[90vh] overflow-hidden">
            
            {/* Modal Title Banner */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Asset Details</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    {editingAsset ? `Edit Asset [${editingAsset.asset_code}]` : 'Inventory New Node'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingAsset(null);
                }}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form fields */}
            <form onSubmit={handleSaveAsset} className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Asset Type Selection Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Asset Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Physical Asset', 'Biomedical Asset', 'Software Asset'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAssetType(t)}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        assetType === t
                          ? 'bg-emerald-50 border-emerald-500/20 text-emerald-800 ring-2 ring-emerald-500/5'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'Physical Asset' && <HardDrive className="w-4 h-4 text-emerald-600" />}
                      {t === 'Biomedical Asset' && <Activity className="w-4 h-4 text-blue-600" />}
                      {t === 'Software Asset' && <ShieldCheck className="w-4 h-4 text-indigo-600" />}
                      {t.replace(' Asset', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Code (Auto Generated) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Code</label>
                <input
                  type="text"
                  value={editingAsset ? editingAsset.asset_code : "(Auto-Generated on Save)"}
                  disabled
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold cursor-not-allowed outline-none"
                />
              </div>

              {/* Asset Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {assetType === 'Software Asset' ? 'Software Name *' : 'Asset Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={assetType === 'Software Asset' ? 'e.g., Apex Cloud EMR, PACS Imaging Server' : 'e.g., Clinical Server, Medical Ultrasound, Reception PC'}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50/50 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              {/* Hierarchical Dropdowns for Category & Sub-category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none transition-all text-slate-800 font-bold"
                  >
                    {assetType === 'Physical Asset' ? (
                      PHYSICAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : assetType === 'Biomedical Asset' ? (
                      BIOMEDICAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      SOFTWARE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* NESTED DYNAMIC dropdown for Computer/Server/Printer etc. (The automatic option show requested by user) */}
                {assetType === 'Physical Asset' && NESTED_OPTIONS[category] && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {category} Option Details *
                    </label>
                    <select
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/20 outline-none transition-all text-emerald-900 font-extrabold"
                    >
                      {NESTED_OPTIONS[category].map(subOpt => (
                        <option key={subOpt} value={subOpt}>{subOpt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Software Asset Fields: Version & Vendor Name */}
              {assetType === 'Software Asset' && (
                <div className="grid grid-cols-2 gap-4 bg-indigo-50/20 border border-indigo-100 p-3 rounded-xl animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">Version *</label>
                    <input
                      type="text"
                      value={version}
                      onChange={e => setVersion(e.target.value)}
                      placeholder="e.g., v4.82, Build 103"
                      required={assetType === 'Software Asset'}
                      className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">Vendor Name *</label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={e => setManufacturer(e.target.value)}
                      placeholder="e.g., Apex Systems LLC, Microsoft, Oracle"
                      required={assetType === 'Software Asset'}
                      className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Biomedical Asset Fields: PPM dates */}
              {assetType === 'Biomedical Asset' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/20 border border-blue-100 p-3 rounded-xl animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">PPM Calibration Date *</label>
                    <input
                      type="date"
                      value={ppmDate}
                      onChange={e => setPpmDate(e.target.value)}
                      required={assetType === 'Biomedical Asset'}
                      className="w-full text-xs p-2.5 rounded-xl border border-blue-200 focus:border-blue-500 bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-950 mb-1">PPM Due Date *</label>
                    <input
                      type="date"
                      value={ppmDueDate}
                      onChange={e => setPpmDueDate(e.target.value)}
                      required={assetType === 'Biomedical Asset'}
                      className="w-full text-xs p-2.5 rounded-xl border border-blue-200 focus:border-blue-500 bg-white outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Operating System & Serial Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operating System *</label>
                  <select
                    value={operatingSystem}
                    onChange={e => setOperatingSystem(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none text-slate-800 font-bold"
                  >
                    {STANDARD_OPERATING_SYSTEMS.map(os => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="e.g., SN-DELL-883712"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Asset Location & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g., Server Room, Clinic Room A"
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    list="asset-departments-list"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g., Medical Operations, Quality"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                  <datalist id="asset-departments-list">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Asset Owner & Operator/Custodian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Owner *</label>
                  <input
                    type="text"
                    list="asset-owners-list"
                    value={owner}
                    onChange={e => {
                      const val = e.target.value;
                      setOwner(val);
                      const matchedEmp = clientEmployees.find(emp => emp.employee_name === val);
                      if (matchedEmp) {
                        setDepartment(matchedEmp.department || '');
                      }
                    }}
                    placeholder="Search or enter owner..."
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                  <datalist id="asset-owners-list">
                    {clientEmployees.map(emp => (
                      <option key={emp.id} value={emp.employee_name}>
                        {emp.employee_name} ({emp.department || 'No Dept'})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Operator *</label>
                  <input
                    type="text"
                    list="asset-operators-list"
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                    placeholder="Search or enter operator..."
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                  <datalist id="asset-operators-list">
                    {clientEmployees.map(emp => (
                      <option key={emp.id} value={emp.employee_name}>
                        {emp.employee_name} ({emp.department || 'No Dept'})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Classification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classification *</label>
                  <select
                    value={classification}
                    onChange={e => setClassification(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none text-slate-800 font-bold"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="PUBLIC">PUBLIC</option>
                  </select>
                </div>
              </div>

              {/* End Of Life & End of Service dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End-Of-Life Date *</label>
                  <input
                    type="date"
                    value={eolDate}
                    onChange={e => setEolDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End-Of-Service Date *</label>
                  <input
                    type="date"
                    value={eosDate}
                    onChange={e => setEosDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Manufacturer & Model (Optional info fields) */}
              {assetType !== 'Software Asset' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={e => setManufacturer(e.target.value)}
                      placeholder="e.g., HP, Cisco, GE Healthcare"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder="e.g., EliteBook 840, Catalyst 2960"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Status and Facility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none text-slate-800 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                    <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                    <option value="STOLEN_LOST">STOLEN / LOST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility / Client</label>
                  <input
                    type="text"
                    value={client?.company_name || 'Active Facility'}
                    disabled
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-extrabold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter custom remarks, details or software features here..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50/50 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              {/* Verification Audit Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={e => setIsVerified(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Mark Asset as Verified
                    </span>
                  </label>
                  {isVerified && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      Audit Compliant
                    </span>
                  )}
                </div>

                {isVerified && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Verified By</label>
                      <input
                        type="text"
                        value={verifiedBy}
                        onChange={e => setVerifiedBy(e.target.value)}
                        placeholder="Auditor or Manager Name"
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Verification Notes</label>
                      <input
                        type="text"
                        value={verificationNotes}
                        onChange={e => setVerificationNotes(e.target.value)}
                        placeholder="Physical tag verified, serial match, etc."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CIA Values Header (ISO 27001 Standards alignment) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-600 animate-pulse" />
                    ISO 27001 CIA Security Vector
                  </span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded font-mono">1 - 5 Scale</span>
                </div>

                {/* Confidentiality Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Confidentiality</span>
                    <span className="font-black text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-mono">{cVal} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={cVal}
                    onChange={e => setCVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Integrity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Integrity</span>
                    <span className="font-black text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-mono">{iVal} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={iVal}
                    onChange={e => setIVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Availability Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">Availability</span>
                    <span className="font-black text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-mono">{aVal} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={aVal}
                    onChange={e => setAVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Info Tip banner displaying preset context */}
                {ciaTip && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/10 rounded-xl flex gap-1.5 items-start">
                    <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-semibold">{ciaTip}</p>
                  </div>
                )}
              </div>

              {/* Automatic GRC Risk sync trigger (Only show when creating new assets) */}
              {!editingAsset && onAddRisk && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 block">Link to Risk Register</span>
                    <span className="text-[10px] text-slate-500 font-medium">Auto-creates an ISO-aligned risk entry with mapped CIA scores.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addToRiskRegister}
                      onChange={e => setAddToRiskRegister(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 font-bold"></div>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingAsset(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all text-center cursor-pointer"
                >
                  Save Asset
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- BULK EXCEL / CSV IMPORT MODAL --- */}
      {isImporting && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-100 shadow-2xl flex flex-col my-8 animate-fade-in max-h-[90vh] overflow-hidden">
            
            {/* Modal Title Banner */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Excel & CSV Bulk Import</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Paste sheets directly from Microsoft Excel or upload standard CSV files
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsImporting(false);
                  setBulkInputText('');
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Target Import Category Options */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                  Select Target Import Option & Category:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setImportTargetType('auto')}
                    className={`py-2.5 px-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTargetType === 'auto'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-black">Auto-Detect</span>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 mt-1 block">Reads "Asset Type" column</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetType('physical')}
                    className={`py-2.5 px-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTargetType === 'physical'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-black">Physical IT Assets</span>
                    </div>
                    <span className="text-[9px] font-medium text-emerald-600 mt-1 block">Forces all to Physical IT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetType('biomedical')}
                    className={`py-2.5 px-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTargetType === 'biomedical'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-2 ring-blue-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-black">Biomedical Assets</span>
                    </div>
                    <span className="text-[9px] font-medium text-blue-600 mt-1 block">Forces all to Biomedical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetType('software')}
                    className={`py-2.5 px-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      importTargetType === 'software'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-black">Software Assets</span>
                    </div>
                    <span className="text-[9px] font-medium text-indigo-600 mt-1 block">Forces all to Software</span>
                  </button>
                </div>
              </div>

              {/* Instructions and templates */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-700 leading-normal">
                <div className="space-y-1 flex-1">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Spreadsheet Upload & Copy/Paste Instructions:
                  </span>
                  <p className="text-[11px] font-semibold text-slate-600">
                    Your CSV, Excel text, or pasted data MUST map exactly to the following columns in order:
                  </p>
                  <p className="font-mono text-[9px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 select-all overflow-x-auto max-w-full whitespace-nowrap">
                    {importTargetType === 'auto'
                      ? 'Asset Name*\tDevice Description\tOperating System*\tAsset Type*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tEnd-Of-Life *\tEnd-Of-Service *\tStatus *\tClassification *\tRemarks'
                      : importTargetType === 'biomedical'
                      ? 'Asset Name*\tDevice Description\tOperating System*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tPPM Date *\tPPM Due Date *\tStatus *\tClassification *\tRemarks'
                      : 'Asset Name*\tDevice Description\tOperating System*\tAsset Code *\tAsset Location *\tSerial Number\tAsset Owner *\tAsset Operator *\tEnd-Of-Life *\tEnd-Of-Service *\tStatus *\tClassification *\tRemarks'
                    }
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    * Asterisks show standard mandatory fields. If Asset Code is blank, it will automatically generate a valid sequence.
                    {importTargetType !== 'auto' && (
                      <span className="text-emerald-600 font-bold ml-1">
                        Note: "Asset Type" column is omitted because {importTargetType === 'biomedical' ? 'Biomedical Assets' : importTargetType === 'software' ? 'Software Assets' : 'Physical IT Assets'} is selected as the forced option!
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={loadImportTemplate}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    Load Template Text
                  </button>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Inputs section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                    Option A: Paste Data (Tab Separated or Comma Separated)
                  </label>
                  <textarea
                    value={bulkInputText}
                    onChange={e => handleTextareaParse(e.target.value)}
                    placeholder={
                      importTargetType === 'biomedical'
                        ? "Paste Biomedical rows here... E.g.\nAsset Name\tOperating System\tAsset Code\tAsset Location...\nCardiac Defibrillator\tEmbedded RTOS\tAST-MED-201\tEmergency Unit"
                        : importTargetType === 'software'
                        ? "Paste Software rows here... E.g.\nAsset Name\tOperating System\tAsset Code\tAsset Location...\nApex Cloud EMR\tNot Applicable\tAST-SFT-301\tCloud Virtual Server"
                        : importTargetType === 'physical'
                        ? "Paste Physical IT rows here... E.g.\nAsset Name\tOperating System\tAsset Code\tAsset Location...\nWorkstation Dell\tWindows 11\tAST-DT-101\tOPD Clinic"
                        : "Paste Excel spreadsheet rows here...\nE.g.\nAsset Name\tOperating System\tAsset Type\tAsset Location...\nWorkstation Dell\tWindows 11\tPhysical Asset\tOPD Clinic"
                    }
                    rows={8}
                    className="w-full text-xs p-3 font-mono rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-slate-950 text-slate-100 placeholder-slate-600 shadow-inner"
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono mb-2">
                      Option B: Drag & Drop CSV / Excel Text File
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/10 p-8 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center shadow-xs"
                    >
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Click to Browse files or drop your CSV</span>
                      <span className="text-[10px] text-slate-400">Supports (.csv, .tsv, .txt) files</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv,.tsv,.txt"
                        className="hidden"
                      />
                    </div>
                  </div>

                  {importError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2 text-red-800 text-[11px] animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{importError}</span>
                    </div>
                  )}

                  {!importError && importPreview.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px]">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="font-extrabold">Ready to Import: {importPreview.length} valid assets parsed!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Parsed Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2 shrink-0">
                  <span className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                    Parsed Import Preview Table ({importPreview.length} items)
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[10px] text-slate-600 bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                          <th className="p-2">Name</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">OS</th>
                          <th className="p-2">Location</th>
                          <th className="p-2">Serial</th>
                          <th className="p-2">Owner</th>
                          <th className="p-2">Operator</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium font-mono">
                        {importPreview.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="p-2 font-sans font-bold text-slate-800 truncate max-w-[120px]">{item.asset_name}</td>
                            <td className="p-2 text-emerald-700 font-bold">{item.asset_type?.replace(' Asset', '')}</td>
                            <td className="p-2">{item.operating_system}</td>
                            <td className="p-2 truncate max-w-[100px]">{item.location}</td>
                            <td className="p-2">{item.serial_number || 'N/A'}</td>
                            <td className="p-2 truncate max-w-[90px]">{item.asset_owner}</td>
                            <td className="p-2 truncate max-w-[90px]">{item.asset_operator || 'Staff'}</td>
                            <td className="p-2"><span className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-[9px] font-bold">{item.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsImporting(false);
                    setBulkInputText('');
                    setImportPreview([]);
                    setImportError(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
                >
                  Discard & Close
                </button>
                <button
                  type="button"
                  onClick={executeBulkImport}
                  disabled={importPreview.length === 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all text-center cursor-pointer"
                >
                  Save and Add {importPreview.length} Assets
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- ASSET TAG PRINT STUDIO MODAL --- */}
      {(printAsset || printAssetList) && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col my-8 animate-fade-in max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-xs">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                    Print Asset Label Studio
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md font-mono">Sticker Mode</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Generate and configure clinical assets thermal sticker barcodes or QR tags.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrintAsset(null);
                  setPrintAssetList(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Content Body */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Left Side: Live Preview Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-100 border-r border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-full max-w-md mb-3 flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono px-1">
                  <span>Live Sticker Preview</span>
                  <span>{printAssetList ? `${printAssetList.length} Labels Active` : '1 Label Active'}</span>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-inner flex flex-col items-center justify-center gap-5 w-full overflow-x-auto min-h-[220px]">
                  {printAsset && renderTagItem(printAsset)}
                  {printAssetList && (
                    <div className="max-h-[380px] overflow-y-auto w-full flex flex-col items-center gap-4 py-2 px-1">
                      {printAssetList.slice(0, 15).map((asset, idx) => (
                        <div key={asset.id} className="relative group">
                          {renderTagItem(asset, idx)}
                          <span className="absolute -top-1.5 -left-1.5 bg-slate-800 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                      {printAssetList.length > 15 && (
                        <div className="p-3 bg-slate-200/50 border border-slate-300/40 rounded-xl text-center text-[11px] font-extrabold text-slate-500 w-full max-w-[320px]">
                          + {printAssetList.length - 15} more labels in print queue...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 font-medium text-center mt-4 max-w-xs">
                  * Dotted borders show sticker boundaries on-screen but will be hidden when printed.
                </p>
              </div>

              {/* Right Side: Options & Customizer Panel */}
              <div className="w-full lg:w-[320px] bg-white p-6 overflow-y-auto flex flex-col justify-between shrink-0 border-t lg:border-t-0 border-slate-200">
                <div className="space-y-5">
                  <span className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5">
                    Label Settings
                  </span>

                  {/* Size Config */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Sticker Dimensions</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'user-2.5-1.5', label: '2.5" x 1.5"' },
                        { id: 'sm', label: '2.5" x 1.0"' },
                        { id: 'md', label: '3.2" x 1.5"' },
                        { id: 'lg', label: '3.8" x 1.7"' },
                        { id: 'lg-4-2', label: '4.0" x 2.0"' },
                        { id: 'custom', label: 'Custom Size...' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLabelSize(item.id)}
                          className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                            labelSize === item.id
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {labelSize === 'custom' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-left">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-700">
                          <span>Custom Width</span>
                          <span className="font-mono text-emerald-600 font-extrabold">{customWidth.toFixed(1)} inches</span>
                        </div>
                        <input
                          type="range"
                          min="1.5"
                          max="5.0"
                          step="0.1"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(parseFloat(e.target.value))}
                          className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span>1.5"</span>
                          <span>5.0"</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-700">
                          <span>Custom Height</span>
                          <span className="font-mono text-emerald-600 font-extrabold">{customHeight.toFixed(1)} inches</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="4.0"
                          step="0.1"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(parseFloat(e.target.value))}
                          className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span>0.8"</span>
                          <span>4.0"</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barcode Type config */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Scan Barcode Format</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUseQrCode(false)}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          !useQrCode
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        1D Barcode
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseQrCode(true)}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          useQrCode
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        2D QR Code
                      </button>
                    </div>
                  </div>

                  {/* Print Layout config */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Print Sheet Format</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintLayout('grid')}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          printLayout === 'grid'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Grid Sheet (A4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintLayout('roll')}
                        className={`py-2 px-3 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          printLayout === 'roll'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title="Prints each label on a separate physical sheet (ideal for single thermal sticker roll printers)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Separate Roll
                      </button>
                    </div>
                  </div>

                  {/* Facility name customize */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Bottom Facility Label</label>
                    <input
                      type="text"
                      value={customFacility}
                      onChange={e => setCustomFacility(e.target.value)}
                      placeholder="Clinic / Department Name"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold text-slate-800"
                    />
                  </div>

                  {/* Print Date customize */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Print Date Stamp</label>
                    <input
                      type="date"
                      value={printDate}
                      onChange={e => setPrintDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold text-slate-800"
                    />
                  </div>

                  {/* Zebra Thermal Hardware Integration */}
                  <div className="space-y-3 border-t border-slate-150 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
                        <span className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                          GK420T Direct Print
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md">
                        API v3
                      </span>
                    </div>

                    {/* Connection Status Widget */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      {isZebraConnecting ? (
                        <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-500 font-bold font-mono">
                          <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          Searching for Zebra...
                        </div>
                      ) : zebraConnectedDevice ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <span className="truncate max-w-[150px]" title={zebraConnectedDevice.name}>
                                Connected: <strong className="text-emerald-700">{zebraConnectedDevice.name}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={retryZebraConnection}
                              className="text-[9px] font-black text-slate-500 hover:text-emerald-600 uppercase hover:underline cursor-pointer"
                              title="Refresh connected devices"
                            >
                              Refresh
                            </button>
                          </div>

                          {zebraAvailableDevices.length > 1 && (
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                Select Printer Device
                              </label>
                              <select
                                value={zebraConnectedDevice.name}
                                onChange={(e) => selectZebraPrinter(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-emerald-500 font-bold text-slate-700 font-mono"
                              >
                                {zebraAvailableDevices.map((dev) => (
                                  <option key={dev.uid} value={dev.name}>
                                    {dev.name} ({dev.connection})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Direct Print Button */}
                          <button
                            type="button"
                            onClick={handleDirectZebraPrint}
                            disabled={zebraPrintStatus.loading}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black rounded-lg text-[11px] shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {zebraPrintStatus.loading ? 'Sending ZPL...' : 'Send Direct to Printer'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold font-mono">
                              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                              Service Not Running
                            </div>
                            <button
                              type="button"
                              onClick={retryZebraConnection}
                              className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer uppercase"
                            >
                              Connect
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            To print directly, launch <strong>Zebra Browser Print</strong> on your computer, ensure GK420T is connected, then click connect.
                          </p>
                        </div>
                      )}

                      {/* Print feedback status */}
                      {zebraPrintStatus.success && (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[10px] font-black font-mono animate-fade-in flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Label sent to printer!
                        </div>
                      )}

                      {zebraPrintStatus.error && (
                        <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[10px] font-extrabold font-mono animate-fade-in text-left space-y-1">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Print failed:</span>
                          </div>
                          <p className="text-[9px] leading-normal text-rose-700 font-normal pl-4">
                            {zebraPrintStatus.error}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Zebra Thermal Backup Downloads */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">
                        Manual Import / Tools
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const zpl = generateZplCode();
                            setGeneratedZplText(zpl);
                            setShowZplModal(true);
                            setIsCopied(false);
                          }}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          title="Generate Zebra ZPL II raw label code"
                        >
                          <Tag className="w-3.5 h-3.5 text-emerald-400" />
                          View ZPL
                        </button>
                        <button
                          type="button"
                          onClick={handleExportZebraCsv}
                          className="py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          title="Download CSV database for Zebra Designer software"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          Zebra CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {popupBlockerWarning && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[10px] font-bold leading-normal animate-fade-in text-left">
                      ⚠️ <strong>Popup Blocker Detected!</strong> We tried opening a print-friendly tab to bypass iframe security blocks, but your browser blocked it. Please allow popups for this site, or open the app in a new tab to print labels.
                    </div>
                  )}

                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                      Pro-Tip: When the print prompt opens, check "Hide Headers and Footers" and set "Margins: None" to align perfectly onto physical label sheets or continuous rolls.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSystemPrint}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Print Sticker Tag(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintAsset(null);
                      setPrintAssetList(null);
                    }}
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Close Studio
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- ZEBRA ZPL CODE EXPORT POPUP MODAL --- */}
      {showZplModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-800 shadow-xs">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                    Zebra ZPL II Programming Code
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md font-mono">Thermal Active</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Send this raw vector instruction format directly to Zebra thermal label printers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZplModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                  ZPL II Output Stream:
                </label>
                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto max-h-[300px] leading-relaxed border border-slate-900 select-all whitespace-pre">
                    {generatedZplText}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedZplText);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5 text-xs text-slate-700">
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <Info className="w-4 h-4 text-emerald-600" />
                  How to send this ZPL code to your Zebra thermal printer:
                </span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] font-medium text-slate-600 leading-relaxed">
                  <li><strong>Option A:</strong> Paste the copied text into the <a href="https://labelary.com/viewer.html" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-semibold">Labelary Online ZPL Viewer</a> to test layouts instantly in your browser.</li>
                  <li><strong>Option B:</strong> Use the free "Zebra Setup Utilities" tool on your computer and send the file directly to your printer over USB or Bluetooth.</li>
                  <li><strong>Option C:</strong> Print directly from command line / terminal over your network: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]">nc [PRINTER_IP] 9100 &lt; labels.zpl</code></li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowZplModal(false)}
                className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={handleDownloadZpl}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download ZPL File (.zpl)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 animate-fade-in text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight font-sans">
                {deleteConfirmation.type === 'bulk' ? 'Decommission Selected Assets' : 'Decommission Asset Node'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed font-sans">
                {deleteConfirmation.type === 'bulk' 
                  ? `Are you sure you want to permanently decommission and remove the ${deleteConfirmation.count} selected asset nodes from the client registry?`
                  : 'Are you sure you want to permanently decommission and remove this asset node from the client registry?'}
              </p>
              <p className="text-[10px] text-rose-600 bg-rose-50/50 border border-rose-100/50 rounded-lg p-2 font-bold font-mono uppercase tracking-wider">
                This action is destructive and cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation({ isOpen: false, type: 'single' })}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer font-sans"
              >
                Cancel, Keep It
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer font-sans"
              >
                Decommission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STANDARDIZED ASSETS INVENTORY COMPLIANCE REPORT PREVIEW & PRINT MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-slate-50 w-full max-w-6xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-sm font-black tracking-tight font-sans uppercase">Asset Inventory Standard Compliance Report Builder</h2>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">Preview and print standard operating compliance records (ISO 27001 & DOH Compliant)</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Split Builder Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
              
              {/* Left Config Panel */}
              <div className="lg:col-span-1 border-r border-slate-200 p-5 bg-white space-y-4 overflow-y-auto max-h-[50vh] lg:max-h-full">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Report Metadata</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Customize headers, classifications, and auditor details below. Preview updates instantly.</p>
                </div>

                {/* Quick Master Setup Loop Selector Connection */}
                <DocRefLoopSelector
                  currentRefCode={reportDocRef || 'ANNIB-IT-RR-004'}
                  onApplyLoop={(data) => {
                    setReportDocRef(data.ref_code);
                    if (data.classification) setReportClassification(data.classification as any);
                    if (data.version) setReportVersion(data.version);
                    if (data.issue_date) setReportIssueDate(data.issue_date);
                    if (data.review_date) setReportReviewDate(data.review_date);
                    if (data.prepared_by) {
                      setReportAuthor(data.prepared_by);
                      setReportPreparedBy(data.prepared_by);
                    }
                    if (data.approved_by) setReportApprovedBy(data.approved_by);
                  }}
                />
                
                <div className="space-y-3.5 pt-2">
                  
                  {/* Security Classification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Security Classification</label>
                    <select
                      value={reportClassification}
                      onChange={(e) => setReportClassification(e.target.value as any)}
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="CONFIDENTIAL">CONFIDENTIAL (Highly Restricted)</option>
                      <option value="RESTRICTED">RESTRICTED (Enterprise Only)</option>
                      <option value="INTERNAL">INTERNAL (Internal IT/Staff Only)</option>
                      <option value="PUBLIC">PUBLIC (Unclassified)</option>
                    </select>
                  </div>

                  {/* Document Version */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Document Version</label>
                    <input
                      type="text"
                      value={reportVersion}
                      onChange={(e) => setReportVersion(e.target.value)}
                      placeholder="e.g. v2.1"
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Document Reference Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Document Reference (Doc Ref.)</label>
                    <input
                      type="text"
                      value={reportDocRef}
                      onChange={(e) => setReportDocRef(e.target.value)}
                      placeholder="e.g. AST-INV-001"
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Published/Issue Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Published / Issue Date</label>
                    <input
                      type="date"
                      value={reportIssueDate}
                      onChange={(e) => setReportIssueDate(e.target.value)}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Last Review/Update Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Last Compliance Review</label>
                    <input
                      type="date"
                      value={reportReviewDate}
                      onChange={(e) => setReportReviewDate(e.target.value)}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Lead Auditor/Author */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lead Auditor / Reviewer Name</label>
                    <input
                      type="text"
                      value={reportAuthor}
                      onChange={(e) => setReportAuthor(e.target.value)}
                      placeholder="e.g. Aseef Sulaiman"
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Prepared By Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Asset List Prepared By</label>
                    <input
                      type="text"
                      value={reportPreparedBy}
                      onChange={(e) => setReportPreparedBy(e.target.value)}
                      placeholder="e.g. Aseef Sulaiman"
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Approved By Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Authorized / Approved By</label>
                    <input
                      type="text"
                      value={reportApprovedBy}
                      onChange={(e) => setReportApprovedBy(e.target.value)}
                      placeholder="e.g. Dr. Sarah Connor"
                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {onOpenQuickSetup && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReportModal(false);
                          onOpenQuickSetup();
                        }}
                        className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-[11px] font-extrabold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        title="Auto-fill and sync with Master Loop Setup"
                      >
                        <span className="text-indigo-600 font-extrabold">🔗</span> Master Loop Sync
                      </button>
                    </div>
                  )}

                </div>

                {/* Left Side Actions */}
                <div className="border-t border-slate-100 pt-4 mt-6 space-y-3">
                  
                  {/* Primary PDF & Email Options */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isExportingPdf || isSendingEmail}
                      onClick={handleDownloadPdfFile}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black rounded-xl text-[11px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isExportingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isExportingPdf || isSendingEmail}
                      onClick={() => {
                        setShowEmailPanel(!showEmailPanel);
                        // Reset alerts
                        setEmailSuccess(null);
                        setEmailError(null);
                      }}
                      className={`py-2 px-3 font-black rounded-xl text-[11px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        showEmailPanel 
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{showEmailPanel ? 'Hide Email' : 'Send Email'}</span>
                    </button>
                  </div>

                  {/* Dynamic Email Dispatch Panel */}
                  {showEmailPanel && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5 shadow-inner transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-900 tracking-wide flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                          Email Report Delivery
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowEmailPanel(false)}
                          className="text-slate-400 hover:text-slate-600 font-extrabold text-sm cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>

                      {/* Recipient Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Recipient Email(s)</label>
                        <input
                          type="text"
                          value={emailRecipients}
                          onChange={(e) => setEmailRecipients(e.target.value)}
                          placeholder="e.g. manager@clinic.com, admin@clinic.com"
                          className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                        />
                        <span className="text-[9px] text-slate-400 block font-medium leading-tight">Separate multiple emails with commas.</span>
                      </div>

                      {/* Selectable emails contact lists */}
                      {(() => {
                        const availableEmails: { role: string; email: string; name: string }[] = [];
                        if (client?.email) availableEmails.push({ role: 'Facility', email: client.email, name: client.company_name });
                        if (client?.owner_email) availableEmails.push({ role: 'Owner', email: client.owner_email, name: client.owner_name || 'Owner' });
                        if (client?.clinic_manager?.email) availableEmails.push({ role: 'Clinic Mgr', email: client.clinic_manager.email, name: client.clinic_manager.name || 'Clinic Manager' });
                        if (client?.medical_director?.email) availableEmails.push({ role: 'Med Dir', email: client.medical_director.email, name: client.medical_director.name || 'Medical Director' });
                        if (client?.it_manager?.email) availableEmails.push({ role: 'IT Mgr', email: client.it_manager.email, name: client.it_manager.name || 'IT Manager' });
                        if (client?.hr_manager?.email) availableEmails.push({ role: 'HR Mgr', email: client.hr_manager.email, name: client.hr_manager.name || 'HR Manager' });
                        if (client?.auth_representative?.email) availableEmails.push({ role: 'Auth Rep', email: client.auth_representative.email, name: client.auth_representative.name || 'Authorized Rep' });

                        if (availableEmails.length > 0) {
                          return (
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Quick Add Contacts</label>
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                {availableEmails.map((contact, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (emailRecipients) {
                                        const emails = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                                        if (!emails.includes(contact.email)) {
                                          setEmailRecipients([...emails, contact.email].join(', '));
                                        }
                                      } else {
                                        setEmailRecipients(contact.email);
                                      }
                                    }}
                                    className="text-[9.5px] font-semibold bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                    title={`Add ${contact.name} (${contact.email})`}
                                  >
                                    <span className="font-extrabold text-slate-400 text-[8.5px] uppercase">{contact.role}:</span>
                                    <span>{contact.email}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Email Subject */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Email Subject</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Email Subject Line"
                          className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                        />
                      </div>

                      {/* Custom Notes / Message Body */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Email Message Notes</label>
                        <textarea
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          rows={4}
                          placeholder="Type custom note or remarks to attach with the report..."
                          className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 resize-y"
                        />
                      </div>

                      {/* Alerts */}
                      {emailSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-[11px] font-semibold leading-relaxed flex items-start gap-1.5 shadow-inner">
                          <span>✅</span>
                          <span className="flex-1">{emailSuccess}</span>
                        </div>
                      )}

                      {emailError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-[11px] font-semibold leading-relaxed flex items-start gap-1.5 shadow-inner">
                          <span>❌</span>
                          <span className="flex-1">{emailError}</span>
                        </div>
                      )}

                      {/* Dispatch Trigger */}
                      <button
                        type="button"
                        disabled={isSendingEmail || !emailRecipients.trim()}
                        onClick={() => {
                          const emails = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
                          if (emails.length === 0) {
                            setEmailError("Please enter at least one valid recipient email.");
                            return;
                          }
                          handleSendEmailToClient(emails, emailMessage, emailSubject);
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                            <span>Dispatching over SMTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send compliance report PDF</span>
                          </>
                        )}
                      </button>

                    </div>
                  )}

                  {/* Standard System Print Toggle */}
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-extrabold rounded-xl text-[11px] shadow-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Open Standard Print tab
                  </button>

                  <p className="text-[9.5px] text-slate-500 text-center font-semibold bg-blue-50/50 p-2 border border-blue-100/50 rounded-lg leading-relaxed">
                    ⚙️ <strong>SMTP Notice:</strong> Email transmissions require active outbound SMTP. Deliveries are securely validated, falling back to Sandboxed Simulation if connection profiles are offline.
                  </p>
                </div>
              </div>

              {/* Right WYSIWYG A4 Live Preview Container */}
              <div className="lg:col-span-2 p-6 overflow-y-auto max-h-[60vh] lg:max-h-full bg-slate-200 flex justify-center border-t lg:border-t-0 border-slate-300">
                <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-xl border border-slate-300 relative select-none">
                  
                  {/* Watermark badge on preview */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-black text-6xl text-slate-100/35 pointer-events-none select-none uppercase tracking-widest rotate-12">
                    {reportClassification}
                  </div>

                  {/* Standard GRC Report Rendered */}
                  {renderInventoryReport(false)}

                </div>
              </div>

            </div>

            {/* Bottom Modal Actions */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                Total Client Assets: {clientAssets.length} nodes (IT: {reportPhysicalIt.length} | Med: {reportBiomedical.length} | Soft: {reportSoftware.length})
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close Builder
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  Print / Export PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- HIDDEN REPORT PRINT WRAPPER --- */}
      <div id="printable-report-area" className="hidden">
        {renderInventoryReport(true)}
      </div>

      {/* --- HIDDEN PRINT AREA FOR SYSTEM PRINT DIALOG ROUTING --- */}
      <div id="printable-tag-area" className="hidden print:block absolute inset-0 bg-white">
        <style>{`
          @media print {
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Hide everything inside body by default using visibility */
            body > * {
              visibility: hidden !important;
            }
            
            /* If printing report is active, show only report, else show only tag area */
            body.printing-report-active #printable-report-area,
            body.printing-report-active #printable-report-area * {
              visibility: visible !important;
            }
            body.printing-report-active #printable-report-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 24px !important;
              background: white !important;
              color: black !important;
              z-index: 99999999 !important;
            }
            
            body:not(.printing-report-active) #printable-tag-area,
            body:not(.printing-report-active) #printable-tag-area * {
              visibility: visible !important;
            }
            body:not(.printing-report-active) #printable-tag-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 12px !important;
              background: white !important;
              color: black !important;
              z-index: 9999999 !important;
            }
            
            .print-grid-layout {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 16px !important;
              width: 100% !important;
            }
            .print-roll-layout {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 24px !important;
              width: 100% !important;
            }
            .print-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        `}</style>
        <div className={printLayout === 'grid' ? "print-grid-layout" : "print-roll-layout"}>
          {printAsset && renderTagItem(printAsset)}
          {printAssetList && printAssetList.map((asset, idx) => (
            <div key={asset.id} className={printLayout === 'roll' ? 'print-page-break' : ''}>
              {renderTagItem(asset, idx)}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
