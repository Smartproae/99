/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RiskItem, Asset, Client } from '../types';
import { 
  Plus, Search, ShieldAlert, Sparkles, Filter, Trash2, Edit3, Pencil,
  Check, X, RefreshCw, Activity, HelpCircle, Archive, ArchiveRestore,
  FileDown, ChevronDown, ChevronUp, ShieldCheck, Info, HardDrive, Cpu, History
} from 'lucide-react';
import { DENTAL_ASSETS_TEMPLATE, DENTAL_RISKS_TEMPLATE } from '../utils/dentalSuite';
import { formatDateDMY } from '../utils/dateUtils';
import PolicyStandardsView from './PolicyStandardsView';
import Reports from './Reports';

interface RiskRegisterProps {
  risks: RiskItem[];
  assets?: Asset[];
  onAddRisk: (risk: RiskItem) => void;
  onUpdateRisk?: (risk: RiskItem) => void;
  onDeleteRisk?: (id: string) => void;
  onBulkAddRisks?: (risks: RiskItem[]) => void;
  onBulkAddAssets?: (assets: Asset[]) => void;
  activeClientId: string;
  onNavigateTab?: (tab: string) => void;
  client?: Client;
  clients?: Client[];
  policies?: any[];
  incidents?: any[];
  findings?: any[];
  actions?: any[];
  initialSubTab?: 'register' | 'policy' | 'report';
  onSubTabChange?: (tab: 'register' | 'policy' | 'report') => void;
  onOpenQuickSetup?: () => void;
  onUpdateClient?: (client: Client) => void;
}

type FilterTab = 'Active' | 'Deactivated' | 'All' | 'Open' | 'Closed' | 'Mit: Open' | 'Mit: In Progress' | 'Mit: Treated' | 'Mit: Closed';

export interface ThreatPreset {
  label: string;
  examples: string;
  description: string;
  vulnerability: string;
  controls: string;
  plan: string;
  domain?: string;
  likelihood?: number;
  impact?: number;
  residualLikelihood?: number;
  residualImpact?: number;
}

export const THREAT_PRESETS: ThreatPreset[] = [
  {
    label: "Cyber Attack",
    examples: "Malware, ransomware, phishing, hacking",
    description: "Potential cyber attack compromising systems via malware, ransomware, phishing, or hacking.",
    vulnerability: "Lack of advanced threat protection, missing security updates, or insufficient user training.",
    controls: "Basic firewall, corporate antivirus, periodic security alerts.",
    plan: "Deploy endpoint detection and response (EDR), enforce multi-factor authentication (MFA), and run monthly phishing simulations.",
    domain: "Communications and Operations Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Unauthorized Access",
    examples: "Weak passwords, privilege misuse, unauthorized login",
    description: "Unauthorized system access due to weak passwords, privilege misuse, or unauthorized logins.",
    vulnerability: "Inadequate password complexity rules, lack of privilege audits, or unmonitored login attempts.",
    controls: "Standard Windows domain password requirements, basic user groups.",
    plan: "Implement a centralized Identity and Access Management (IAM) system, enforce strong password policies, and perform quarterly privilege reviews.",
    domain: "Access Control",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Data Breach",
    examples: "Exposure or theft of sensitive or personal information",
    description: "Exposure, disclosure, or theft of sensitive patient data, EMR records, or personal information.",
    vulnerability: "Unencrypted data storage, unauthorized copy/download permissions, or unencrypted data in transit.",
    controls: "Role-based access controls on EMR system, signed confidentiality agreements.",
    plan: "Enable full-disk encryption (AES-256), configure Data Loss Prevention (DLP) rules, and establish secure encrypted file-sharing channels.",
    domain: "Data Privacy and Protection",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Data Loss",
    examples: "Accidental deletion, corruption, or missing backups",
    description: "Permanent loss of records or system databases due to corruption, accidental deletion, or backup failures.",
    vulnerability: "Single point of failure, unmonitored backup logs, or lack of off-site disaster recovery storage.",
    controls: "Nightly local backups stored on a network shared drive.",
    plan: "Transition to automated, immutable cloud-based backups, set up real-time alerting for backup jobs, and conduct quarterly restore drills.",
    domain: "Information Systems Continuity Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Insider Threat",
    examples: "Malicious or negligent employee actions",
    description: "Malicious or negligent actions by internal employees exposing corporate assets or databases.",
    vulnerability: "Over-privileged user roles, lack of employee exit checklist checklist enforcement, or missing audit logs.",
    controls: "Signed code of conduct, periodic HR policy reminders.",
    plan: "Apply the principle of least privilege, enable continuous user activity monitoring for sensitive actions, and implement strict offboarding procedures.",
    domain: "Human Resources Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Human Error",
    examples: "Incorrect data entry, accidental file deletion, misconfiguration",
    description: "Operational errors including incorrect data entry, accidental deletion, or misconfigurations by staff.",
    vulnerability: "Complex, non-standard user interfaces, lack of double-authorization for critical tasks, or poor training.",
    controls: "Basic training, read-only profiles for junior staff.",
    plan: "Introduce change control procedures, require dual-approval for destructive actions, and host interactive compliance workshops.",
    domain: "Human Resources Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "System Failure",
    examples: "Server crash, application failure, hardware malfunction",
    description: "Server crashes, application crashes, database failures, or hardware malfunctions disrupting services.",
    vulnerability: "Lack of high-availability clustering, aging server hardware, or unsupported operating system versions.",
    controls: "Routine preventative maintenance, supplier support agreement.",
    plan: "Migrate critical clinical databases to high-availability virtual clusters, set up real-time hardware status probes, and lifecycle old servers.",
    domain: "Information Systems Continuity Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Network Failure",
    examples: "Internet outage, switch/router failure, VPN disruption",
    description: "Network outages, ISP failures, or router/switch issues disrupting secure remote access.",
    vulnerability: "Single ISP uplink, lack of redundant failover routers, or legacy network switches.",
    controls: "Standard corporate broadband, primary router with warranty.",
    plan: "Install a secondary cellular/fiber ISP failover line, implement dual-homed routers, and swap out aging switches.",
    domain: "Communications and Operations Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Power Failure",
    examples: "Power outage affecting IT systems and medical devices",
    description: "Sudden power outages or voltage fluctuations damaging servers and patient care equipment.",
    vulnerability: "Missing or unmaintained Uninterruptible Power Supplies (UPS), lack of emergency generator.",
    controls: "Local server room UPS (15-min battery capacity).",
    plan: "Install central automated diesel generators, replace legacy UPS batteries annually, and test the power transfer mechanism semi-annually.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Physical Security",
    examples: "Theft, vandalism, unauthorized physical access",
    description: "Theft, physical vandalism, or unauthorized access to corporate server rooms and clinics.",
    vulnerability: "Unsecured server doors, blind spots in CCTV coverage, or missing visitor logs.",
    controls: "Standard locked door with key access, basic CCTV in main corridor.",
    plan: "Install biometric card scanners on all server rooms, expand CCTV coverage to cover all egress points, and mandate visitor badges.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Fire",
    examples: "Fire damaging servers, network equipment, or records",
    description: "Severe fire outbreak damaging servers, critical infrastructure, or paper records.",
    vulnerability: "No fire suppression system, lack of fire-rated doors, or flammable materials stored nearby.",
    controls: "Handheld fire extinguishers, building smoke alarms.",
    plan: "Install clean-agent gas fire suppression (FM-200) in server rooms, purchase fire-rated media safes, and schedule annual fire drills.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Flood / Water Damage",
    examples: "Water leakage affecting IT infrastructure",
    description: "Water leakage or flooding affecting server racks, clinical machines, or wiring closets.",
    vulnerability: "Server room located on basement level or directly beneath water pipes/HVAC lines.",
    controls: "Elevated equipment racks (10cm from floor).",
    plan: "Install water sensor alarms on the server room floor, reroute overhead water lines, and relocate server equipment to upper floors.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Natural Disaster",
    examples: "Earthquake, storm, sandstorm, or other environmental events",
    description: "Sandstorms, storms, or severe environmental events damaging local facilities or operations.",
    vulnerability: "No off-site backup, lack of disaster recovery business continuity plan (BCP).",
    controls: "Standard building structure and maintenance.",
    plan: "Develop and test a comprehensive Business Continuity and Disaster Recovery (BCDR) plan, and replicate all virtual systems to the cloud.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Third-Party Risk",
    examples: "Vendor failure, cloud service outage, supplier breach",
    description: "Outages or security breaches at external vendors or cloud service providers affecting local operations.",
    vulnerability: "Lack of vendor SLA reviews, missing business associate agreements (BAA), or zero redundancy.",
    controls: "Standard terms of service, local client copies.",
    plan: "Enforce rigorous Vendor Risk Assessments, mandate clear SLA agreements with financial penalties, and build local offline backup fallback modes.",
    domain: "Third-Party Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Compliance Risk",
    examples: "Failure to meet regulatory requirements (e.g., DOH, HIPAA, GDPR, ISO 27001)",
    description: "Failure to comply with regulatory standards such as DOH, ADHICS v2, or ISO 27001.",
    vulnerability: "No internal audit program, outdated compliance documentation, or missing policy frameworks.",
    controls: "Annual compliance reviews, basic checklists.",
    plan: "Establish a continuous GRC monitoring portal, conduct bi-annual internal compliance audits, and employ external auditors.",
    domain: "Compliance",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Privacy Risk",
    examples: "Unauthorized disclosure of patient or employee personal data",
    description: "Unauthorized exposure or misuse of patient health records (PHI) or personal details.",
    vulnerability: "Staff sharing logins, unmasked patient database views, or lack of secure printing.",
    controls: "Basic privacy training upon hire, standard access controls.",
    plan: "Enforce dynamic data masking on database fields, deploy secure pull-printing solutions, and conduct mandatory bi-annual privacy refresher courses.",
    domain: "Data Privacy and Protection",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Software Vulnerability",
    examples: "Unpatched operating systems or applications",
    description: "Exploitation of unpatched software vulnerabilities or legacy operating system flaws.",
    vulnerability: "No centralized patch management system, obsolete third-party libraries.",
    controls: "Manual software updates conducted periodically by IT.",
    plan: "Implement an automated central patch management system (e.g., WSUS), mandate vulnerability scanning, and sunset legacy systems.",
    domain: "Information Systems Acquisition, Development, and Maintenance",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Hardware Failure",
    examples: "Hard disk failure, motherboard failure, storage device failure",
    description: "Server hard disk, motherboard, or power supply failure causing downtime.",
    vulnerability: "Non-redundant server components, lack of spare parts on site.",
    controls: "Standard warranty support, basic RAID storage.",
    plan: "Upgrade to dual hot-swappable power supplies, set up RAID-10 disk configurations, and keep critical spares in stock.",
    domain: "Asset Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Malware Infection",
    examples: "Virus, worm, spyware, or trojan infection",
    description: "System infections via viruses, spyware, or trojans disrupting operations.",
    vulnerability: "Missing web filters, lack of local administrative privilege restriction.",
    controls: "Standard anti-virus tools.",
    plan: "Deploy Next-Generation Antivirus (NGAV), configure central DNS-based web content filtering, and restrict local admin rights.",
    domain: "Communications and Operations Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Ransomware",
    examples: "Encryption of systems and demand for payment",
    description: "Ransomware encryption of critical files and systems holding medical data hostage.",
    vulnerability: "Weak network segmentation, missing offline/immutable backups.",
    controls: "Basic backups, local antivirus.",
    plan: "Configure robust network segmentation, implement daily immutable air-gapped backups, and deploy ransomware behavioral blocking tools.",
    domain: "Information Security Incident Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Social Engineering",
    examples: "Phishing emails, vishing, impersonation attacks",
    description: "Phishing emails or impersonation attacks tricking staff into disclosing credentials.",
    vulnerability: "Lack of email security gateways, zero staff training on social engineering tactics.",
    controls: "Basic spam filter on mail server.",
    plan: "Deploy advanced AI-driven email security gateways, implement SPF/DKIM/DMARC protocols, and run continuous phishing simulation drills.",
    domain: "Human Resources Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Denial of Service (DoS/DDoS)",
    examples: "Service disruption caused by network flooding",
    description: "Network flooding rendering patient portals or clinical EMR services inaccessible.",
    vulnerability: "Direct exposure to public internet without rate limiting or cloud web-protection proxy.",
    controls: "Standard ISP firewall settings.",
    plan: "Deploy cloud-based DDoS mitigation protection (e.g., Cloudflare), configure strict ingress rate limiting, and use reverse proxies.",
    domain: "Communications and Operations Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Configuration Error",
    examples: "Incorrect firewall, server, or application settings",
    description: "Incorrect firewall rules, server settings, or cloud bucket permissions exposing assets.",
    vulnerability: "No change management workflow, manual server setups without checklist audits.",
    controls: "Direct configuration by experienced senior staff.",
    plan: "Enforce a formal peer-reviewed change management protocol, implement infrastructure-as-code linting, and run weekly configuration drift scans.",
    domain: "Communications and Operations Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Loss of Portable Devices",
    examples: "Lost laptop, USB drive, or mobile device containing sensitive data",
    description: "Lost or stolen corporate laptops, USB drives, or phones containing patient records.",
    vulnerability: "No mobile device management (MDM) software, unencrypted storage on laptops.",
    controls: "Reminders to staff not to copy patient records.",
    plan: "Enforce BitLocker full-disk encryption, deploy a central Mobile Device Management (MDM) agent, and block USB mass storage via group policy.",
    domain: "Asset Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Backup Failure",
    examples: "Backup job failure or inability to restore data",
    description: "Inability to restore systems due to corrupt backups or silent job failures.",
    vulnerability: "No automated restore testing, unmonitored backup failure notifications.",
    controls: "Manual check of backup logs periodically.",
    plan: "Configure automated daily backup success reporting, implement non-destructive sandbox restoration testing, and verify backup media integrity.",
    domain: "Information Systems Continuity Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Environmental Risk",
    examples: "Excessive heat, humidity, dust, or air-conditioning failure",
    description: "Excessive heat, humidity, or dust inside the server closet causing system shutdowns.",
    vulnerability: "No secondary redundant AC unit in server room, lack of environmental monitors.",
    controls: "Standard building air conditioning, visual check.",
    plan: "Install a dedicated secondary ductless mini-split AC unit, deploy remote temperature and humidity sensor alerts, and replace dust filters monthly.",
    domain: "Physical and Environmental Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Medical Device Failure",
    examples: "Failure of connected medical equipment affecting patient care",
    description: "Failure or cyber-compromise of connected clinical or biomedical devices.",
    vulnerability: "No network segmentation for medical devices, legacy firmware, unmonitored status.",
    controls: "Annual biomedical maintenance checks, vendor support.",
    plan: "Enforce strict network segmentation (VLAN) for all connected clinical devices, restrict device access, and configure continuous network telemetry.",
    domain: "Asset Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 3
  },
  {
    label: "Phishing & Email Threat",
    examples: "Credential harvesting, spear-phishing, spoofed emails",
    description: "Phishing & Email Threat targeting clinical or administrative staff to extract credentials.",
    vulnerability: "Lack of advanced email gateway protection, missing SPF/DKIM/DMARC compliance.",
    controls: "Basic built-in email client filters.",
    plan: "Deploy automated anti-phishing gateways, configure strict external mail banners, and conduct periodic employee phishing simulations.",
    domain: "Human Resources Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "API & Integration Threat",
    examples: "Exposed API tokens, broken authorization, insecure integrations",
    description: "Vulnerabilities inside cloud API endpoints exposing internal databases or patient records.",
    vulnerability: "Hardcoded access tokens, missing rate limit configurations, or untrusted integration endpoints.",
    controls: "Standard developer token restrictions.",
    plan: "Rotate API keys automatically, implement strict rate limiting, and use trusted OAuth2 authentication protocols.",
    domain: "Information Systems Acquisition, Development, and Maintenance",
    likelihood: 3,
    impact: 4,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Cloud Configuration Drift",
    examples: "Exposed storage buckets, misconfigured cloud access keys",
    description: "Security gaps resulting from misconfigured AWS, GCP, or Azure services exposing health IT infrastructure.",
    vulnerability: "No automated continuous compliance checks, loose administrative user roles.",
    controls: "Periodic manual cloud console reviews.",
    plan: "Deploy cloud security posture management (CSPM) tools, verify bucket encryption, and enforce multi-factor authentication (MFA) for cloud admins.",
    domain: "Cloud Security",
    likelihood: 3,
    impact: 4,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Supplier Access Misuse",
    examples: "Vendor using stale logins, excessive permissions, or unvetted tools",
    description: "External contractors or software developers retaining operational access beyond active projects.",
    vulnerability: "Lack of central directory synchronization, missing automated vendor offboarding.",
    controls: "Manual removal of developer accounts on request.",
    plan: "Implement single-sign-on (SSO) with time-bound vendor logins, conduct monthly directory audits, and enforce contractor BAAs.",
    domain: "Third-Party Security",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  },
  {
    label: "Poor Incident Handling",
    examples: "Delayed breach response, corrupted server logs, lack of preparation",
    description: "Failure to contain malware spreads or communicate data leaks in a timely manner.",
    vulnerability: "No incident response plan (IRP) documentation, missing security operation center (SOC) alerts.",
    controls: "Ad-hoc responses by internal IT engineers.",
    plan: "Establish a formal Incident Response Plan, run dry-run ransomware simulation exercises, and outsource to a managed SOC service.",
    domain: "Information Security Incident Management",
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2
  }
];

export default function RiskRegister({
  risks,
  assets = [],
  onAddRisk,
  onUpdateRisk,
  onDeleteRisk,
  onBulkAddRisks,
  onBulkAddAssets,
  activeClientId,
  onNavigateTab,
  client,
  clients = [],
  policies = [],
  incidents = [],
  findings = [],
  actions = [],
  initialSubTab = 'register',
  onSubTabChange,
  onOpenQuickSetup,
  onUpdateClient
}: RiskRegisterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  
  // Version History Modal state
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showAddVersionInline, setShowAddVersionInline] = useState(false);
  const [newVersionNo, setNewVersionNo] = useState('');
  const [newVersionDate, setNewVersionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newVersionAuthor, setNewVersionAuthor] = useState('');
  const [newVersionChanges, setNewVersionChanges] = useState('');

  // Editing existing version in Risk Register
  const [editingVersionIdx, setEditingVersionIdx] = useState<number | null>(null);
  const [editVersionNo, setEditVersionNo] = useState('');
  const [editVersionDate, setEditVersionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editVersionAuthor, setEditVersionAuthor] = useState('');
  const [editVersionChanges, setEditVersionChanges] = useState('');

  const defaultVersionHistory = [
    { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
  ];

  const displayVersionHistory = (client?.version_history && client.version_history.length > 0)
    ? client.version_history
    : defaultVersionHistory;

  const handleStartEditVersion = (idx: number) => {
    const vh = displayVersionHistory[idx];
    if (!vh) return;
    setEditingVersionIdx(idx);
    setEditVersionNo(vh.version || (vh as any).version_number || '1.0');
    setEditVersionDate(vh.date || (vh as any).revision_date || new Date().toISOString().split('T')[0]);
    setEditVersionAuthor(vh.author || (vh as any).changed_by || 'IT Manager');
    setEditVersionChanges(vh.changes || (vh as any).change_description || (vh as any).remarks || '');
    setShowAddVersionInline(false);
  };

  const handleSaveEditVersion = () => {
    if (editingVersionIdx === null) return;
    if (!editVersionNo.trim()) return;
    const updatedHistory = displayVersionHistory.map((item, i) => {
      if (i === editingVersionIdx) {
        return {
          version: editVersionNo.trim(),
          date: editVersionDate || new Date().toISOString().split('T')[0],
          author: editVersionAuthor.trim() || 'IT Manager',
          changes: editVersionChanges.trim() || 'Updated Risk Register'
        };
      }
      return item;
    });

    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        doc_version: editingVersionIdx === 0 ? editVersionNo.trim() : client.doc_version,
        version_history: updatedHistory
      });
    }
    setEditingVersionIdx(null);
  };

  const handleDeleteVersionRecord = (idxToDelete: number) => {
    if (displayVersionHistory.length <= 1) return;
    const updatedHistory = displayVersionHistory.filter((_, i) => i !== idxToDelete);
    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        doc_version: updatedHistory[0]?.version || client.doc_version,
        version_history: updatedHistory
      });
    }
  };

  const handleAddVersionRecord = () => {
    if (!newVersionNo.trim()) return;
    const newEntry = {
      version: newVersionNo.trim(),
      date: newVersionDate || new Date().toISOString().split('T')[0],
      author: newVersionAuthor.trim() || 'IT Manager',
      changes: newVersionChanges.trim() || 'Updated Risk Register'
    };
    const updatedHistory = [newEntry, ...displayVersionHistory];
    if (client && onUpdateClient) {
      onUpdateClient({
        ...client,
        doc_version: newVersionNo.trim(),
        version_history: updatedHistory
      });
    }
    setNewVersionNo('');
    setNewVersionAuthor('');
    setNewVersionChanges('');
    setShowAddVersionInline(false);
  };
  
  // Top-level tabs: GRC Register view, Policy Reference Standards, or embedded Report view
  const [subTab, setSubTab] = useState<'register' | 'policy' | 'report'>(initialSubTab);
  const [autoOpenPdf, setAutoOpenPdf] = useState(false);

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChangeLocal = (newTab: 'register' | 'policy' | 'report') => {
    setSubTab(newTab);
    onSubTabChange?.(newTab);
  };

  // CIA Classification states for selected risk asset
  const [confidentiality, setConfidentiality] = useState<number>(3);
  const [integrity, setIntegrity] = useState<number>(3);
  const [availability, setAvailability] = useState<number>(3);
  
  // Grid selections: 'inherent' or 'residual'
  const [selectedInherentCell, setSelectedInherentCell] = useState<{ impact: number; likelihood: number } | null>(null);
  const [selectedResidualCell, setSelectedResidualCell] = useState<{ impact: number; likelihood: number } | null>(null);
  
  // Status filter tab
  const [statusFilter, setStatusFilter] = useState<FilterTab>('Active');
  
  // Expanded risk state for detailed CIA & Formula breakdown
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Form states for creating/editing
  const [riskId, setRiskId] = useState('');
  const [riskTitle, setRiskTitle] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<'Physical Assets' | 'Digital Assets Risks'>('Physical Assets');
  const [assetCode, setAssetCode] = useState<string>('');
  const [domain, setDomain] = useState('Access Control');
  const [threat, setThreat] = useState('');
  const [vulnerability, setVulnerability] = useState('');
  const [impact, setImpact] = useState<number>(3);
  const [likelihood, setLikelihood] = useState<number>(3);
  const [controls, setControls] = useState('');
  const [plan, setPlan] = useState('');
  const [owner, setOwner] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'TREATMENT_PLAN' | 'ACCEPTED' | 'CLOSED'>('OPEN');
  
  // Extra high-fidelity state fields
  const [threatType, setThreatType] = useState<string>('');
  const [isAutoCalculate, setIsAutoCalculate] = useState<boolean>(true);
  const [mitigationStatus, setMitigationStatus] = useState<'Open' | 'In progress' | 'Treated' | 'Closed'>('Open');
  const [recordStatus, setRecordStatus] = useState<'Active' | 'Deactivated'>('Active');
  const [treatmentOption, setTreatmentOption] = useState<'Reduction' | 'Avoidance' | 'Transfer' | 'Retention'>('Reduction');
  const [identificationDate, setIdentificationDate] = useState(new Date().toISOString().substring(0, 10));
  const [targetClosingDate, setTargetClosingDate] = useState('');
  const [residualLikelihood, setResidualLikelihood] = useState<number>(2);
  const [residualImpact, setResidualImpact] = useState<number>(2);

  const selectAssetByName = (selectedName: string) => {
    setAssetName(selectedName);
    
    let matchedCode = '';
    let matchedCategory: 'Physical Assets' | 'Digital Assets Risks' = 'Physical Assets';

    const matched = assets.find(
      a => a.client_id === activeClientId && a.asset_name === selectedName
    );
    if (matched) {
      setConfidentiality(matched.c_val !== undefined ? matched.c_val : 3);
      setIntegrity(matched.i_val !== undefined ? matched.i_val : 3);
      setAvailability(matched.a_val !== undefined ? matched.a_val : 3);
      matchedCode = matched.asset_code || '';
      matchedCategory = matched.asset_type === 'Software Asset' ? 'Digital Assets Risks' : 'Physical Assets';
      setAssetCategory(matchedCategory);
      setAssetCode(matchedCode);
    } else {
      // HIPAA, ADHICS, ISO standards fallback values
      const lower = selectedName.toLowerCase();
      if (lower.includes('firewall') || lower.includes('server') || lower.includes('database')) {
        setConfidentiality(5); setIntegrity(5); setAvailability(5);
        if (lower.includes('firewall')) matchedCode = 'PHY-FW';
        else if (lower.includes('server')) matchedCode = 'PHY-SRV';
        else if (lower.includes('database')) matchedCode = 'DIG-DB';
      } else if (lower.includes('emr') || lower.includes('software') || lower.includes('record') || lower.includes('malaffi') || lower.includes('suite') || lower.includes('windows') || lower.includes('antivirus')) {
        setConfidentiality(5); setIntegrity(5); setAvailability(4);
        if (lower.includes('emr')) matchedCode = 'DIG-EMR';
        else if (lower.includes('windows')) matchedCode = 'DIG-WIN';
        else if (lower.includes('antivirus')) matchedCode = 'DIG-AV';
      } else if (lower.includes('ventilator') || lower.includes('medical') || lower.includes('clinical') || lower.includes('device') || lower.includes('x-ray') || lower.includes('imaging') || lower.includes('ultrasound')) {
        setConfidentiality(3); setIntegrity(5); setAvailability(5);
        matchedCode = 'PHY-MED';
      } else if (lower.includes('desktop') || lower.includes('computer') || lower.includes('laptop')) {
        setConfidentiality(3); setIntegrity(4); setAvailability(4);
        matchedCode = 'PHY-PC';
      } else {
        setConfidentiality(3); setIntegrity(3); setAvailability(3);
      }

      if (lower.includes('emr') || lower.includes('software') || lower.includes('record') || lower.includes('malaffi') || lower.includes('windows') || lower.includes('antivirus') || lower.includes('database')) {
        matchedCategory = 'Digital Assets Risks';
      } else {
        matchedCategory = 'Physical Assets';
      }
      setAssetCategory(matchedCategory);
      setAssetCode(matchedCode);
    }

    // Auto-fill Threat title, Risk Description (threat) and vulnerability
    const lowerName = selectedName.toLowerCase();
    let computedTitle = `Logical integrity threat or hardware breakdown affecting ${selectedName}`;
    let computedThreat = `Power surges, lack of planned preventive maintenance, or unauthorized local hardware tampering.`;
    let computedVulnerability = `Absent PPM scheduling and failure to monitor hardware health alerts on a daily basis.`;

    if (lowerName.includes('server') || lowerName.includes('database')) {
      computedTitle = `Ransomware compromise & server outage of ${selectedName}`;
      computedThreat = `Malicious system exploitation or phishing leading to deployment of server-encrypting ransomware.`;
      computedVulnerability = `Absence of air-gapped backups, unpatched enterprise OS levels, or weak administrative credentials.`;
    } else if (lowerName.includes('emr') || lowerName.includes('software') || lowerName.includes('record') || lowerName.includes('malaffi')) {
      computedTitle = `Patient database confidentiality breach via ${selectedName}`;
      computedThreat = `SQL injection attack or brute forcing of medical professional credentials by external threat actors.`;
      computedVulnerability = `Absence of mandatory Multi-Factor Authentication (MFA) and lack of database field encryption.`;
    } else if (lowerName.includes('firewall')) {
      computedTitle = `Unauthorized network ingress due to firewall rules compromise on ${selectedName}`;
      computedThreat = `Perimeter network scanning, unauthorized rule changes, or direct exploit of firmware vulnerabilities.`;
      computedVulnerability = `Outdated firmware patches and lack of quarterly firewall policy audit reviews.`;
    } else if (lowerName.includes('medical') || lowerName.includes('clinical') || lowerName.includes('device') || lowerName.includes('ventilator') || lowerName.includes('x-ray') || lowerName.includes('ultrasound')) {
      computedTitle = `Biomedical calibration failure or operating system exploit on ${selectedName}`;
      computedThreat = `Malware infection from USB drives or lack of physical tamper controls on medical device nodes.`;
      computedVulnerability = `Unpatched legacy operating systems (e.g., Windows 7/XP Embedded) with open clinical ports.`;
    } else if (lowerName.includes('laptop') || lowerName.includes('desktop') || lowerName.includes('computer')) {
      computedTitle = `Loss of protected patient data due to physical theft of ${selectedName}`;
      computedThreat = `Physical theft of mobile hardware from clinics, employee vehicles, or offsite conferences.`;
      computedVulnerability = `Lack of local bitlocker full-disk encryption and absence of remote wipe software configuration.`;
    } else if (lowerName.includes('antivirus')) {
      computedTitle = `Endpoint protection bypass or outdated signatures on ${selectedName}`;
      computedThreat = `Zero-day exploit or delayed software updates allowing malware to bypass local detection engines.`;
      computedVulnerability = `Inconsistent central policy orchestration and system offline states delaying updates.`;
    } else if (lowerName.includes('windows')) {
      computedTitle = `OS-level privilege escalation or critical patch bypass on ${selectedName}`;
      computedThreat = `Exploitation of unpatched legacy CVE vulnerabilities or active directory misconfigurations.`;
      computedVulnerability = `Lack of automated WSUS deployment schedules and missing critical security patches.`;
    }

    setRiskTitle(computedTitle);
    setThreat(computedThreat);
    setVulnerability(computedVulnerability);
  };

  // Auto-calculate residual parameters when enabled
  React.useEffect(() => {
    if (isAutoCalculate) {
      if (treatmentOption === 'Reduction') {
        setResidualLikelihood(Math.min(likelihood, 2));
        setResidualImpact(Math.min(impact, 2));
      } else if (treatmentOption === 'Avoidance' || treatmentOption === 'Transfer') {
        setResidualLikelihood(1);
        setResidualImpact(1);
      } else if (treatmentOption === 'Retention') {
        setResidualLikelihood(likelihood);
        setResidualImpact(impact);
      }
    }
  }, [isAutoCalculate, likelihood, impact, treatmentOption]);

  // Active client context filter
  const clientRisks = risks.filter(r => r.client_id === activeClientId);

  // Auto-load Dental Suite Check
  const hasDentalSuite = clientRisks.some(r => r.risk_id.startsWith('RSK-RR-'));

  // Multi-tab Filtering Logic
  const getFilteredByStatus = (items: RiskItem[]) => {
    switch (statusFilter) {
      case 'Active':
        return items.filter(r => (r.record_status || 'Active') !== 'Deactivated');
      case 'Deactivated':
        return items.filter(r => r.record_status === 'Deactivated');
      case 'Open':
        return items.filter(r => r.status === 'OPEN');
      case 'Closed':
        return items.filter(r => r.status === 'CLOSED');
      case 'Mit: Open':
        return items.filter(r => r.mitigation_status === 'Open');
      case 'Mit: In Progress':
        return items.filter(r => r.mitigation_status === 'In progress');
      case 'Mit: Treated':
        return items.filter(r => r.mitigation_status === 'Treated');
      case 'Mit: Closed':
        return items.filter(r => r.mitigation_status === 'Closed');
      case 'All':
      default:
        return items;
    }
  };

  const statusFilteredRisks = getFilteredByStatus(clientRisks);

  // Apply Heatmap Grid filters if active
  let gridFilteredRisks = statusFilteredRisks;
  if (selectedInherentCell) {
    gridFilteredRisks = gridFilteredRisks.filter(
      r => r.impact === selectedInherentCell.impact && r.likelihood === selectedInherentCell.likelihood
    );
  }
  if (selectedResidualCell) {
    gridFilteredRisks = gridFilteredRisks.filter(
      r => (r.residual_impact || r.impact) === selectedResidualCell.impact && 
           (r.residual_likelihood || r.likelihood) === selectedResidualCell.likelihood
    );
  }

  // Final search text filter
  const finalFilteredRisks = gridFilteredRisks.filter(r =>
    r.risk_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.risk_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.domain && r.domain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddForm = () => {
    // Reset Form to initial clean state with custom risk naming format
    const prefix = client?.risk_id_prefix || 'RSK';
    const startIndex = client?.risk_id_start_index !== undefined ? client.risk_id_start_index : 1;
    const padding = client?.risk_id_padding !== undefined ? client.risk_id_padding : 3;

    let nextIndex = startIndex;
    const clientRisks = risks.filter(r => r.client_id === activeClientId);
    nextIndex = startIndex + clientRisks.length;

    while (risks.some(r => r.client_id === activeClientId && r.risk_id === `${prefix}-${String(nextIndex).padStart(padding, '0')}`)) {
      nextIndex++;
    }

    const suggestedId = `${prefix}-${String(nextIndex).padStart(padding, '0')}`;
    setRiskId(suggestedId);
    setRiskTitle('');
    setAssetName('');
    setAssetCategory('Physical Assets');
    setAssetCode('');
    setDomain('Access Control');
    setThreat('');
    setVulnerability('');
    setImpact(3);
    setLikelihood(3);
    setControls('');
    setPlan('');
    setOwner('IT Manager');
    setReviewDate('2026-12-31');
    setStatus('OPEN');
    setMitigationStatus('Open');
    setRecordStatus('Active');
    setTreatmentOption('Reduction');
    setIdentificationDate(new Date().toISOString().substring(0, 10));
    setTargetClosingDate('2026-12-31');
    setResidualLikelihood(2);
    setResidualImpact(3);
    setConfidentiality(3);
    setIntegrity(3);
    setAvailability(3);
    setIsAdding(true);
    setEditingRisk(null);
  };

  const handleOpenEditModal = (risk: RiskItem) => {
    setEditingRisk(risk);
    setRiskId(risk.risk_id);
    setRiskTitle(risk.risk_title);
    setAssetName(risk.asset_name);
    
    // Determine category and code
    const catAndCode = getAssetCategoryAndCode(risk);
    setAssetCategory(catAndCode.category);
    setAssetCode(catAndCode.code);

    setDomain(risk.domain || 'Access Control');
    setThreat(risk.threat);
    setVulnerability(risk.vulnerability);
    setImpact(risk.impact);
    setLikelihood(risk.likelihood);
    setControls(risk.existing_controls);
    setPlan(risk.treatment_plan);
    setOwner(risk.risk_owner);
    setReviewDate(risk.review_date);
    setStatus(risk.status);
    
    // High-fidelity extensions
    setMitigationStatus(risk.mitigation_status || 'Open');
    setRecordStatus(risk.record_status || 'Active');
    setTreatmentOption(risk.treatment_option || 'Reduction');
    setIdentificationDate(risk.identification_date || risk.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10));
    setTargetClosingDate(risk.target_closing_date || '2026-12-31');
    setResidualLikelihood(risk.residual_likelihood || Math.max(1, risk.likelihood - 1));
    setResidualImpact(risk.residual_impact || risk.impact);

    const { c, i, a } = getAssetCIAAndValue(risk);
    setConfidentiality(risk.c_val !== undefined ? risk.c_val : c);
    setIntegrity(risk.i_val !== undefined ? risk.i_val : i);
    setAvailability(risk.a_val !== undefined ? risk.a_val : a);

    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskId || !riskTitle) return;

    // Calculate Asset Value using specified rounding rules
    const avg = (confidentiality + integrity + availability) / 3;
    let assetVal = Math.round(avg);
    if (avg >= 4.0 && avg <= 4.5) assetVal = 4;
    else if (avg >= 4.51 && avg <= 5.0) assetVal = 5;

    const calculatedInherentRating = assetVal * likelihood * impact;
    const calculatedResidualRating = assetVal * residualLikelihood * residualImpact;

    if (editingRisk) {
      if (onUpdateRisk) {
        onUpdateRisk({
          ...editingRisk,
          risk_id: riskId,
          risk_title: riskTitle,
          asset_name: assetName,
          asset_category: assetCategory,
          asset_code: assetCode,
          domain,
          threat,
          vulnerability,
          impact,
          likelihood,
          risk_rating: calculatedInherentRating,
          existing_controls: controls,
          treatment_plan: plan,
          risk_owner: owner,
          review_date: reviewDate,
          status,
          mitigation_status: mitigationStatus,
          record_status: recordStatus,
          treatment_option: treatmentOption,
          identification_date: identificationDate,
          target_closing_date: targetClosingDate,
          residual_likelihood: residualLikelihood,
          residual_impact: residualImpact,
          residual_risk_rating: calculatedResidualRating,
          c_val: confidentiality,
          i_val: integrity,
          a_val: availability,
          asset_value: assetVal
        });
      }
      setEditingRisk(null);
    } else {
      let nextIdNum = risks.length + 1;
      while (risks.some(r => r.id === 'r' + nextIdNum)) {
        nextIdNum++;
      }
      const newId = 'r' + nextIdNum;

      const newRisk: RiskItem = {
        id: newId,
        client_id: activeClientId,
        risk_id: riskId,
        risk_title: riskTitle,
        asset_name: assetName,
        asset_category: assetCategory,
        asset_code: assetCode,
        domain,
        threat,
        vulnerability,
        impact,
        likelihood,
        risk_rating: calculatedInherentRating,
        existing_controls: controls,
        treatment_plan: plan,
        risk_owner: owner || 'Compliance Officer',
        review_date: reviewDate || '2026-12-31',
        status,
        created_at: new Date().toISOString(),
        mitigation_status: mitigationStatus,
        record_status: recordStatus,
        treatment_option: treatmentOption,
        identification_date: identificationDate,
        target_closing_date: targetClosingDate,
        residual_likelihood: residualLikelihood,
        residual_impact: residualImpact,
        residual_risk_rating: calculatedResidualRating,
        c_val: confidentiality,
        i_val: integrity,
        a_val: availability,
        asset_value: assetVal
      };

      onAddRisk(newRisk);
      setIsAdding(false);
    }
  };

  const handleDeactivateToggle = (risk: RiskItem) => {
    if (onUpdateRisk) {
      const nextStatus = (risk.record_status || 'Active') === 'Deactivated' ? 'Active' : 'Deactivated';
      onUpdateRisk({
        ...risk,
        record_status: nextStatus as any
      });
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteRisk && confirm('Are you sure you want to delete this risk assessment permanently?')) {
      onDeleteRisk(id);
    }
  };

  const getAssetCIAAndValue = (risk: RiskItem) => {
    const matchedAsset = assets.find(
      a => a.client_id === activeClientId &&
           (a.asset_name.toLowerCase() === risk.asset_name.toLowerCase() ||
            risk.asset_name.toLowerCase().includes(a.asset_name.toLowerCase()) ||
            a.asset_name.toLowerCase().includes(risk.asset_name.toLowerCase()))
    );

    let c = matchedAsset ? matchedAsset.c_val : (risk.c_val !== undefined ? risk.c_val : undefined);
    let i = matchedAsset ? matchedAsset.i_val : (risk.i_val !== undefined ? risk.i_val : undefined);
    let a = matchedAsset ? matchedAsset.a_val : (risk.a_val !== undefined ? risk.a_val : undefined);

    if (c === undefined || i === undefined || a === undefined) {
      const name = risk.asset_name.toLowerCase();
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
    const val = (avg >= 4.0 && avg <= 4.5) ? 4 : (avg >= 4.51 && avg <= 5.0) ? 5 : Math.round(avg);
    return { c, i, a, assetValue: val };
  };

  const getAssetCategoryAndCode = (risk: RiskItem) => {
    if (risk.asset_category && risk.asset_code) {
      return { category: risk.asset_category, code: risk.asset_code };
    }

    const matchedAsset = assets.find(
      a => a.client_id === activeClientId &&
           (a.asset_name.toLowerCase() === risk.asset_name.toLowerCase() ||
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

  const handleLoadDentalPreset = () => {
    if (onBulkAddRisks && onBulkAddAssets) {
      if (confirm('This will load a complete high-fidelity orthodontic & dental suite model (28 Bespoke Risks & 8 Asset Nodes) into this facility context. Continue?')) {
        const dentalRisks = DENTAL_RISKS_TEMPLATE(activeClientId);
        const dentalAssets = DENTAL_ASSETS_TEMPLATE(activeClientId);
        onBulkAddRisks(dentalRisks);
        onBulkAddAssets(dentalAssets);
      }
    }
  };

  const handleAutoFillMissingFields = () => {
    if (!onUpdateRisk) return;
    let count = 0;
    clientRisks.forEach(r => {
      const { c, i, a, assetValue } = getAssetCIAAndValue(r);
      const needsUpdate = !r.domain || !r.mitigation_status || !r.record_status || !r.treatment_option || r.residual_likelihood === undefined || r.c_val === undefined;
      if (needsUpdate) {
        count++;
        const res_lik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);
        const res_imp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
        onUpdateRisk({
          ...r,
          c_val: c,
          i_val: i,
          a_val: a,
          asset_value: assetValue,
          domain: r.domain || (r.risk_id.includes('BIO') ? 'Clinical Asset Safety' : 'Communications and Operations Management'),
          record_status: r.record_status || 'Active',
          mitigation_status: r.mitigation_status || (r.status === 'CLOSED' ? 'Closed' : r.status === 'TREATMENT_PLAN' ? 'In progress' : 'Open'),
          treatment_option: r.treatment_option || 'Reduction',
          identification_date: r.identification_date || r.created_at?.substring(0, 10) || '2023-12-23',
          target_closing_date: r.target_closing_date || r.review_date || '2026-12-31',
          residual_likelihood: res_lik,
          residual_impact: res_imp,
          risk_rating: assetValue * r.likelihood * r.impact,
          residual_risk_rating: assetValue * res_lik * res_imp
        });
      }
    });
    alert(`Successfully analyzed current client risk register. Auto-filled & upgraded standard GRC CIA metadata fields for ${count} items.`);
  };

  // Helper to count risks in a 5x5 grid cell
  const getCellRiskCount = (imp: number, lik: number, matrixType: 'inherent' | 'residual') => {
    return clientRisks.filter(r => {
      if ((r.record_status || 'Active') === 'Deactivated') return false;
      if (matrixType === 'inherent') {
        return r.impact === imp && r.likelihood === lik;
      } else {
        const r_imp = r.residual_impact !== undefined ? r.residual_impact : r.impact;
        const r_lik = r.residual_likelihood !== undefined ? r.residual_likelihood : Math.max(1, r.likelihood - 1);
        return r_imp === imp && r_lik === lik;
      }
    }).length;
  };

  // Helper to get severity color for cells
  const getCellBg = (imp: number, lik: number, matrixType: 'inherent' | 'residual') => {
    const score = imp * lik;
    const isSelected = matrixType === 'inherent'
      ? selectedInherentCell?.impact === imp && selectedInherentCell?.likelihood === lik
      : selectedResidualCell?.impact === imp && selectedResidualCell?.likelihood === lik;

    let baseBg = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80';
    if (score >= 15) {
      baseBg = 'bg-rose-100 text-rose-900 hover:bg-rose-200/80';
    } else if (score >= 8) {
      baseBg = 'bg-amber-100 text-amber-900 hover:bg-amber-200/80';
    }

    if (isSelected) {
      return `${baseBg} ring-2 ring-indigo-600 font-extrabold scale-102 shadow-sm z-10`;
    }
    return baseBg;
  };

  return (
    <div id="risk-register-view" className="space-y-6">
      {/* View Title & Quick Setup Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          {onNavigateTab && (
            <button
              id="back-to-dashboard-link"
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-bold mb-1.5 cursor-pointer transition-colors"
            >
              ← Back to SmartDataHub
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900">Risk Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ISO 27001 & ADHICS v2 Compliance
          </p>
          <div id="risk-register-metadata-badges" className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 text-[10px] font-mono font-bold">
              Ref: {client?.doc_ref || 'ZZP-IT-PE-05/2021'}
            </span>
            <button
              type="button"
              onClick={() => setShowVersionHistoryModal(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
              title="Click to view full Version History"
            >
              <History className="w-3 h-3 text-emerald-600" />
              <span>Ver: {client?.doc_version || '1.0'}</span>
            </button>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-mono font-bold">
              {client?.doc_classification || 'RESTRICTED'}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono">
              Issue: {formatDateDMY(client?.doc_issue_date || '01/03/2022')}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono">
              Approved: {formatDateDMY(client?.doc_approved_date || '30/06/2026')}
            </span>
            <button
              type="button"
              onClick={() => setShowVersionHistoryModal(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs ml-1"
            >
              <History className="w-3 h-3 text-indigo-600" />
              <span>Version History</span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasDentalSuite && onBulkAddRisks && (
            <button
              type="button"
              onClick={handleLoadDentalPreset}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-100"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ Load Dental Suite (28 Risks)
            </button>
          )}
          <button
            type="button"
            onClick={handleAutoFillMissingFields}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            🛠️ Auto-Fill GRC Fields
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoOpenPdf(true);
              handleSubTabChangeLocal('report');
            }}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-100"
            title="Export the currently filtered risk register view to high-fidelity PDF report"
          >
            <FileDown className="w-3.5 h-3.5" />
            📄 Export PDF Report
          </button>
          {onOpenQuickSetup && (
            <button
              type="button"
              onClick={onOpenQuickSetup}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3.5 py-2 rounded-lg text-xs font-bold border border-indigo-200/60 shadow-xs cursor-pointer transition-all"
              title="Connect & sync metadata loop across all facility registers"
            >
              <span className="text-indigo-600 font-extrabold">🔗</span> Loop Sync
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assess New Risk
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleSubTabChangeLocal('register')}
          className={`px-6 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'register' ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/10' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          📊 Active Risk Register & Heatmaps
        </button>
        <button
          onClick={() => handleSubTabChangeLocal('policy')}
          className={`px-6 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'policy' ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/10' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          📖 Policy Standards & Governance (ISO/ADHICS)
        </button>
        <button
          onClick={() => handleSubTabChangeLocal('report')}
          className={`px-6 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${subTab === 'report' ? 'border-emerald-600 text-emerald-600 font-extrabold bg-emerald-50/10' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          📋 DOH / ISO 27001 / ADHICS Compliance Report View
        </button>
      </div>

      {subTab === 'register' && (
        <>
          {/* Row of Inherent vs Residual Heatmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inherent Heatmap Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Inherent Risk Matrix</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Raw risk ratings ignoring active security control plans.</p>
            </div>
            {selectedInherentCell && (
              <button
                onClick={() => setSelectedInherentCell(null)}
                className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex">
            {/* Y-axis Label */}
            <div className="flex items-center justify-center -rotate-90 w-10 text-slate-400 text-[9px] font-bold uppercase whitespace-nowrap">
              Severity (Impact) →
            </div>

            {/* Grid */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map(imp => (
                <div key={imp} className="flex gap-1 items-center">
                  <span className="w-6 text-right text-[10px] font-bold text-slate-400 pr-1">{imp}</span>
                  <div className="grid grid-cols-5 gap-1.5 w-full">
                    {[1, 2, 3, 4, 5].map(lik => {
                      const count = getCellRiskCount(imp, lik, 'inherent');
                      return (
                        <button
                          key={lik}
                          type="button"
                          onClick={() => {
                            setSelectedResidualCell(null); // exclusive grid filter
                            if (selectedInherentCell?.impact === imp && selectedInherentCell?.likelihood === lik) {
                              setSelectedInherentCell(null);
                            } else {
                              setSelectedInherentCell({ impact: imp, likelihood: lik });
                            }
                          }}
                          className={`h-11 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${getCellBg(imp, lik, 'inherent')}`}
                        >
                          <span className="text-[9px] opacity-75 font-normal">S-{imp * lik}</span>
                          <span className="text-sm font-bold">{count || '-'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* X-axis labels */}
              <div className="flex items-center mt-2 pl-6">
                <div className="grid grid-cols-5 gap-1.5 w-full text-center text-[9px] font-bold text-slate-400">
                  <span>1 (Rare)</span>
                  <span>2 (Unlikely)</span>
                  <span>3 (Possible)</span>
                  <span>4 (Likely)</span>
                  <span>5 (Certain)</span>
                </div>
              </div>
              <div className="text-center text-[10px] font-bold uppercase text-slate-400 mt-1">
                Likelihood (Probability) →
              </div>
            </div>
          </div>
        </div>

        {/* Residual Heatmap Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Residual Risk Matrix</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Adjusted risk ratings after applying mitigation plans.</p>
            </div>
            {selectedResidualCell && (
              <button
                onClick={() => setSelectedResidualCell(null)}
                className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex">
            {/* Y-axis Label */}
            <div className="flex items-center justify-center -rotate-90 w-10 text-slate-400 text-[9px] font-bold uppercase whitespace-nowrap">
              Severity (Impact) →
            </div>

            {/* Grid */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map(imp => (
                <div key={imp} className="flex gap-1 items-center">
                  <span className="w-6 text-right text-[10px] font-bold text-slate-400 pr-1">{imp}</span>
                  <div className="grid grid-cols-5 gap-1.5 w-full">
                    {[1, 2, 3, 4, 5].map(lik => {
                      const count = getCellRiskCount(imp, lik, 'residual');
                      return (
                        <button
                          key={lik}
                          type="button"
                          onClick={() => {
                            setSelectedInherentCell(null); // exclusive grid filter
                            if (selectedResidualCell?.impact === imp && selectedResidualCell?.likelihood === lik) {
                              setSelectedResidualCell(null);
                            } else {
                              setSelectedResidualCell({ impact: imp, likelihood: lik });
                            }
                          }}
                          className={`h-11 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${getCellBg(imp, lik, 'residual')}`}
                        >
                          <span className="text-[9px] opacity-75 font-normal">S-{imp * lik}</span>
                          <span className="text-sm font-bold">{count || '-'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* X-axis labels */}
              <div className="flex items-center mt-2 pl-6">
                <div className="grid grid-cols-5 gap-1.5 w-full text-center text-[9px] font-bold text-slate-400">
                  <span>1 (Rare)</span>
                  <span>2 (Unlikely)</span>
                  <span>3 (Possible)</span>
                  <span>4 (Likely)</span>
                  <span>5 (Certain)</span>
                </div>
              </div>
              <div className="text-center text-[10px] font-bold uppercase text-slate-400 mt-1">
                Likelihood (Probability) →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Document: Risk Rating & Acceptance Criteria */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Reference Document: Risk Rating & Acceptance Criteria
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Risks are evaluated using a comprehensive GRC risk calculation formula that factors in the target <strong>Asset Value</strong> (1-5), the <strong>Impact Level</strong> (1-5), and the <strong>Likelihood</strong> (1-5).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100 space-y-1">
            <span className="inline-flex bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
              Critical Severity (Score 15 - 25)
            </span>
            <p className="text-xs font-semibold text-rose-900 mt-1">Unacceptable risk level</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Demands immediate treatment actions and deployment of formal mitigations within 30 days. Must escalate to clinical medical directors.
            </p>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 space-y-1">
            <span className="inline-flex bg-amber-500 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
              Medium/High Severity (Score 8 - 14)
            </span>
            <p className="text-xs font-semibold text-amber-900 mt-1">Requires structured policy reviews</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Requires structured policy reviews and routine preventive maintenance checks (PPM). Corrective Actions must be verified on a quarterly basis.
            </p>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 space-y-1">
            <span className="inline-flex bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
              Low Severity (Score 1 - 7)
            </span>
            <p className="text-xs font-semibold text-emerald-900 mt-1">Acceptable operational risk</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              No mandatory escalations. Tracked via standard GRC checklists and analyzed during annual facility compliance audits.
            </p>
          </div>
        </div>

        {/* Dynamic Risk Formula Visualizer */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 mt-4 text-xs">
          <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">GRC Risk Formula & Impact Mapping</h4>
          <div className="flex flex-col md:flex-row items-center gap-6 text-center justify-around py-2">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs min-w-[120px]">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Asset Value</span>
              <span className="text-lg font-black text-indigo-600">1 - 5</span>
              <span className="text-[9px] block text-slate-500 mt-1">(CIA average)</span>
            </div>
            <span className="text-lg font-bold text-slate-400">×</span>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs min-w-[120px]">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Impact Level</span>
              <span className="text-lg font-black text-rose-500">1 - 5</span>
              <span className="text-[9px] block text-slate-500 mt-1">(Severity level)</span>
            </div>
            <span className="text-lg font-bold text-slate-400">×</span>
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs min-w-[120px]">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Likelihood</span>
              <span className="text-lg font-black text-amber-500">1 - 5</span>
              <span className="text-[9px] block text-slate-500 mt-1">(Probability level)</span>
            </div>
            <span className="text-lg font-bold text-slate-400">=</span>
            <div className="p-3 bg-emerald-600 text-white rounded-lg shadow-xs min-w-[150px]">
              <span className="text-[9px] text-emerald-100 block font-bold uppercase">GRC Risk Rating</span>
              <span className="text-xl font-black">1 - 125</span>
              <span className="text-[9px] block text-emerald-200 mt-1">(Multiplied Score)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form or Editing Modal */}
      {(isAdding || editingRisk) && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg space-y-6 animate-in fade-in zoom-in duration-200">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600 animate-pulse" />
              {editingRisk ? `Risk Management - Edit Risk Parameters [${editingRisk.risk_id}]` : 'Risk Management - Register Risk'}
            </h3>
            <button 
              type="button" 
              onClick={() => {
                setIsAdding(false);
                setEditingRisk(null);
              }} 
              className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary identifiers */}
            <div className="space-y-4 md:col-span-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Risk ID *</label>
                <input
                  type="text"
                  value={riskId}
                  onChange={e => setRiskId(e.target.value)}
                  placeholder="e.g. RSK-RR-001"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1">Asset Category *</label>
                <select
                  value={assetCategory}
                  onChange={e => {
                    const val = e.target.value as 'Physical Assets' | 'Digital Assets Risks';
                    setAssetCategory(val);
                    setAssetName('');
                    setAssetCode('');
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-indigo-150 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-indigo-50/20 font-bold text-indigo-950"
                  required
                >
                  <option value="Physical Assets">Physical Assets</option>
                  <option value="Digital Assets Risks">Digital Assets Risks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={e => selectAssetByName(e.target.value)}
                  placeholder="Select from classification table below or type custom..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Risk Owner</label>
                <input
                  type="text"
                  value={owner}
                  onChange={e => setOwner(e.target.value)}
                  placeholder="e.g. IT Manager / Authorized representative"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Domain *</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Risk Management">Risk Management</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Human Resources Security">Human Resources Security</option>
                  <option value="Asset Management">Asset Management</option>
                  <option value="Physical and Environmental Security">Physical and Environmental Security</option>
                  <option value="Access Control">Access Control</option>
                  <option value="Communications and Operations Management">Communications and Operations Management</option>
                  <option value="Data Privacy and Protection">Data Privacy and Protection</option>
                  <option value="Cloud Security">Cloud Security</option>
                  <option value="Third-Party Security">Third-Party Security</option>
                  <option value="Information Systems Acquisition, Development, and Maintenance">Information Systems Acquisition, Development, and Maintenance</option>
                  <option value="Information Security Incident Management">Information Security Incident Management</option>
                  <option value="Information Systems Continuity Management">Information Systems Continuity Management</option>
                </select>
              </div>
            </div>

            {/* Core Risk definitions */}
            <div className="space-y-4 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Threat / Risk Type *</label>
                <select
                  value={threatType}
                  onChange={e => {
                    const val = e.target.value;
                    setThreatType(val);
                    const preset = THREAT_PRESETS.find(p => p.label === val);
                    if (preset) {
                      setThreat(preset.description);
                      setVulnerability(preset.vulnerability);
                      setControls(preset.controls);
                      setPlan(preset.plan);
                      setRiskTitle(preset.label + " incident affecting " + (assetName || "systems"));
                      
                      // Auto-update domain and risk metrics based on ISO/HIPAA/user standard levels
                      if (preset.domain) setDomain(preset.domain);
                      if (preset.likelihood !== undefined) setLikelihood(preset.likelihood);
                      if (preset.impact !== undefined) setImpact(preset.impact);
                      if (preset.residualLikelihood !== undefined) setResidualLikelihood(preset.residualLikelihood);
                      if (preset.residualImpact !== undefined) setResidualImpact(preset.residualImpact);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-emerald-800"
                >
                  <option value="">-- Choose Threat / Risk Type (Auto-Fills Description & Vulnerability) --</option>
                  {THREAT_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label}>
                      {preset.label} ({preset.examples})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Risk / Threat Title *</label>
                  <input
                    type="text"
                    value={riskTitle}
                    onChange={e => setRiskTitle(e.target.value)}
                    placeholder="e.g. Weak password policy vulnerability"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Identification Date</label>
                    <input
                      type="date"
                      value={identificationDate}
                      onChange={e => setIdentificationDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Closing Date</label>
                    <input
                      type="date"
                      value={targetClosingDate}
                      onChange={e => setTargetClosingDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Risk Description (Threat Details) *</label>
                <textarea
                  value={threat}
                  onChange={e => setThreat(e.target.value)}
                  placeholder="Auto-filled from asset choice, or type your own custom description..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none h-20 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vulnerability Details</label>
                <textarea
                  value={vulnerability}
                  onChange={e => setVulnerability(e.target.value)}
                  placeholder="Auto-filled from asset choice, or type your own custom details..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none h-20 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            {/* Mitigation and Controls Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Existing Controls</label>
                <textarea
                  value={controls}
                  onChange={e => setControls(e.target.value)}
                  placeholder="Auto-filled based on threat..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none h-14 resize-none bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Risk Treatment Plan (Mitigation Strategy)</label>
                <textarea
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  placeholder="Auto-filled based on threat..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none h-14 resize-none bg-slate-50 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Treatment Option</label>
                  <select
                    value={treatmentOption}
                    onChange={e => setTreatmentOption(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="Reduction">Reduction (Mitigation)</option>
                    <option value="Avoidance">Avoidance</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Retention">Retention (Acceptance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mitigation Status</label>
                  <select
                    value={mitigationStatus}
                    onChange={e => setMitigationStatus(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="Open">Open</option>
                    <option value="In progress">In progress</option>
                    <option value="Treated">Treated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Record Status</label>
                  <select
                    value={recordStatus}
                    onChange={e => setRecordStatus(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Deactivated">🔴 Deactivated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overall Compliance Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="OPEN">OPEN (Active Gaps)</option>
                    <option value="TREATMENT_PLAN">TREATMENT PLAN ENFORCED</option>
                    <option value="ACCEPTED">ACCEPTED (Compliance approved)</option>
                    <option value="CLOSED">CLOSED (Resolved)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Asset Classification & Target Node Selection */}
            <div className="md:col-span-3 mt-2 bg-indigo-50/30 p-4.5 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                  Asset Classification & Target Node Selection ({assetCategory})
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Category Mode: {assetCategory === 'Physical Assets' ? 'Physical IT / BioMed' : 'Digital / Cyber Software'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal mb-3">
                Select a target node from the filtered list below to link the risk. Selecting a node automatically configures its GRC compliance rating and auto-populates smart risk/threat descriptions which you can customize above.
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {assetCategory === 'Physical Assets' ? (
                  /* Physical Assets Box */
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3 justify-between">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          Physical IT & Infrastructure Assets (Predefined Options)
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded font-mono">PHY</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                      {[
                        { name: "Firewall", desc: "Network security appliance", code: "PHY-FW" },
                        { name: "Desktop Computer", desc: "Clinical workstation node", code: "PHY-PC" },
                        { name: "Printer", desc: "Label & report printer", code: "PHY-PR" },
                        { name: "CCTV Security Camera", desc: "Facility surveillance", code: "PHY-CCTV" },
                        { name: "WiFI Access Point", desc: "Wireless clinic access", code: "PHY-WIFI" },
                        { name: "Medical Device", desc: "Clinical biomedical node", code: "PHY-MED" }
                      ].map((item) => {
                        const isSelected = assetName === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => selectAssetByName(item.name)}
                            className={`p-2 rounded-lg border text-left transition-all hover:bg-slate-50 cursor-pointer ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-2xs font-bold'
                                : 'border-slate-150 bg-white'
                            }`}
                          >
                            <p className="text-[11px] font-black text-slate-800">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{item.code} • {item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Digital Assets Box */
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-indigo-600" />
                        <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
                          Digital Software & Cyber Assets (Predefined Options)
                        </span>
                      </div>
                      <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded font-mono">DIG</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {[
                        { name: "Antivirus", desc: "Endpoint detection & response", code: "DIG-AV" },
                        { name: "Windows", desc: "Workstation Operating System", code: "DIG-WIN" },
                        { name: "EMR application", desc: "Electronic Medical Records", code: "DIG-EMR" },
                        { name: "other third party application", desc: "External SaaS & GRC API nodes", code: "DIG-3RD" }
                      ].map((item) => {
                        const isSelected = assetName === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => selectAssetByName(item.name)}
                            className={`p-2 rounded-lg border text-left transition-all hover:bg-indigo-50 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-2xs font-bold'
                                : 'border-slate-150 bg-white'
                            }`}
                          >
                            <p className="text-[11px] font-black text-slate-800">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{item.code} • {item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Client Assets Box: Filtered by Selected Category */}
              {assets && assets.filter(a => {
                const isMatchingClient = a.client_id === activeClientId;
                if (!isMatchingClient) return false;
                if (assetCategory === 'Physical Assets') {
                  return a.asset_type !== 'Software Asset';
                } else {
                  return a.asset_type === 'Software Asset';
                }
              }).length > 0 && (
                <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                    Registered Facility Inventory Nodes: {assetCategory === 'Physical Assets' ? 'Physical' : 'Software'} ({
                      assets.filter(a => {
                        const isMatchingClient = a.client_id === activeClientId;
                        if (!isMatchingClient) return false;
                        return assetCategory === 'Physical Assets' ? a.asset_type !== 'Software Asset' : a.asset_type === 'Software Asset';
                      }).length
                    } Nodes)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {assets.filter(a => {
                      const isMatchingClient = a.client_id === activeClientId;
                      if (!isMatchingClient) return false;
                      return assetCategory === 'Physical Assets' ? a.asset_type !== 'Software Asset' : a.asset_type === 'Software Asset';
                    }).map(a => {
                      const isSelected = assetName === a.asset_name;
                      const isSoftware = a.asset_type === 'Software Asset';
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => selectAssetByName(a.asset_name)}
                          className={`text-[10px] px-3 py-2 rounded-lg border font-black transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                              : isSoftware
                              ? 'bg-indigo-50/40 text-indigo-700 border-indigo-100 hover:bg-indigo-100/60'
                              : 'bg-emerald-50/40 text-emerald-800 border-emerald-100 hover:bg-emerald-100/60'
                          }`}
                        >
                          {a.asset_name} ({a.asset_code || 'N/A'})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Matrix & Score Assessment */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-4">
              {/* Asset CIA Value Scaling Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Asset Value Classification (CIA Standards)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">Confidentiality</label>
                    <select
                      value={confidentiality}
                      onChange={e => setConfidentiality(Number(e.target.value))}
                      className="w-full text-xs p-1 rounded border border-slate-200 bg-slate-50 font-bold"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">Integrity</label>
                    <select
                      value={integrity}
                      onChange={e => setIntegrity(Number(e.target.value))}
                      className="w-full text-xs p-1 rounded border border-slate-200 bg-slate-50 font-bold"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-semibold mb-0.5">Availability</label>
                    <select
                      value={availability}
                      onChange={e => setAvailability(Number(e.target.value))}
                      className="w-full text-xs p-1 rounded border border-slate-200 bg-slate-50 font-bold"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Calculated Asset Value badge */}
                {(() => {
                  const avg = (confidentiality + integrity + availability) / 3;
                  let assetVal = Math.round(avg);
                  if (avg >= 4.0 && avg <= 4.5) assetVal = 4;
                  else if (avg >= 4.51 && avg <= 5.0) assetVal = 5;
                  return (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                      <span>Calculated Asset Value:</span>
                      <span className="font-mono text-emerald-800">
                        {assetVal} <span className="text-[10px] text-slate-400 font-sans ml-1">(avg: {avg.toFixed(2)})</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const avg = (confidentiality + integrity + availability) / 3;
                let assetVal = Math.round(avg);
                if (avg >= 4.0 && avg <= 4.5) assetVal = 4;
                else if (avg >= 4.51 && avg <= 5.0) assetVal = 5;

                const formInherentScore = assetVal * likelihood * impact;
                const formResidualScore = assetVal * residualLikelihood * residualImpact;

                const getBadgeColors = (score: number) => {
                  if (score >= 76) return 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
                  if (score >= 51) return 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold';
                  if (score >= 21) return 'bg-blue-100 text-blue-800 border border-blue-200';
                  return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                };

                const getLevelLabel = (score: number) => {
                  if (score >= 76) return 'Critical';
                  if (score >= 51) return 'High';
                  if (score >= 21) return 'Moderate';
                  return 'Low';
                };

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Inherent Metrics */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inherent Risk (Unmitigated)</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Likelihood</label>
                            <select
                              value={likelihood}
                              onChange={e => setLikelihood(Number(e.target.value))}
                              className="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50 font-bold"
                            >
                              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Impact</label>
                            <select
                              value={impact}
                              onChange={e => setImpact(Number(e.target.value))}
                              className="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50 font-bold"
                            >
                              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-700 flex flex-col pt-1 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span>Inherent Score:</span>
                            <span className={`px-1.5 py-0.2 rounded font-mono ${getBadgeColors(formInherentScore)}`}>
                              {formInherentScore}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 text-right font-medium">({assetVal} AV × {impact} I × {likelihood} L)</span>
                        </div>
                      </div>

                      {/* Residual Settings */}
                      <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">Residual Risk Rating</span>
                          <p className="text-[9px] text-slate-500 leading-normal mt-1">Expected risk remaining after implementing active control mitigations.</p>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-900 pt-1 border-t border-emerald-100/60 flex flex-col">
                          <div className="flex justify-between">
                            <span>Residual Level:</span>
                            <span className="text-emerald-800 font-extrabold">{getLevelLabel(formResidualScore)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toggle for Auto-calc */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Calculation Method</span>
                      <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-xs border border-slate-250">
                        <button
                          type="button"
                          onClick={() => setIsAutoCalculate(true)}
                          className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            isAutoCalculate
                              ? 'bg-white text-emerald-700 shadow-sm border border-slate-150'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Auto Calculate
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAutoCalculate(false)}
                          className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            !isAutoCalculate
                              ? 'bg-white text-emerald-700 shadow-sm border border-slate-150'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Manual Entry
                        </button>
                      </div>
                    </div>

                    {/* Residual parameters */}
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-150">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">Residual Likelihood (1-5)</label>
                        <select
                          value={residualLikelihood}
                          disabled={isAutoCalculate}
                          onChange={e => setResidualLikelihood(Number(e.target.value))}
                          className={`w-full text-xs p-1.5 rounded border border-slate-200 font-bold ${isAutoCalculate ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800'}`}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        {isAutoCalculate && (
                          <p className="text-[10px] leading-tight text-emerald-700 font-medium">
                            {treatmentOption === 'Reduction' && "Auto-reduced to 2 based on 'Reduction' option."}
                            {treatmentOption === 'Avoidance' && "Auto-reduced to 1 based on 'Avoidance' option."}
                            {treatmentOption === 'Transfer' && "Auto-reduced to 1 based on 'Transfer' option."}
                            {treatmentOption === 'Retention' && "Auto-retained to inherent likelihood value."}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">Residual Impact (1-5)</label>
                        <select
                          value={residualImpact}
                          disabled={isAutoCalculate}
                          onChange={e => setResidualImpact(Number(e.target.value))}
                          className={`w-full text-xs p-1.5 rounded border border-slate-200 font-bold ${isAutoCalculate ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800'}`}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        {isAutoCalculate && (
                          <p className="text-[10px] leading-tight text-emerald-700 font-medium">
                            {treatmentOption === 'Reduction' && "Auto-reduced to 2 based on 'Reduction' option."}
                            {treatmentOption === 'Avoidance' && "Auto-reduced to 1 based on 'Avoidance' option."}
                            {treatmentOption === 'Transfer' && "Auto-reduced to 1 based on 'Transfer' option."}
                            {treatmentOption === 'Retention' && "Auto-retained to inherent impact value."}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-800 flex flex-col bg-emerald-100/50 p-2.5 rounded-xl border border-emerald-200/50">
                      <div className="flex justify-between items-center">
                        <span>Calculated Residual Score:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-extrabold ${getBadgeColors(formResidualScore)}`}>
                          {formResidualScore} ({getLevelLabel(formResidualScore)})
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 text-right font-medium">({assetVal} AV × {residualImpact} RI × {residualLikelihood} RL)</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingRisk(null);
              }}
              className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              {editingRisk ? 'Save Changes' : 'Commit Risk Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs, Search controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
        {/* Row 1: Search and Grid filter clear */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-150 max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Risk ID, asset, domain or threat..."
              className="w-full text-xs focus:outline-none bg-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedInherentCell && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Filter className="w-3 h-3 text-amber-600" />
                Inherent Grid: {selectedInherentCell.impact}×{selectedInherentCell.likelihood}
                <button onClick={() => setSelectedInherentCell(null)} className="text-rose-600 hover:text-rose-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedResidualCell && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <Filter className="w-3 h-3 text-emerald-600" />
                Residual Grid: {selectedResidualCell.impact}×{selectedResidualCell.likelihood}
                <button onClick={() => setSelectedResidualCell(null)} className="text-rose-600 hover:text-rose-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Tabs */}
        <div className="flex overflow-x-auto gap-1 border-b border-slate-100 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(['Active', 'Deactivated', 'All', 'Open', 'Closed', 'Mit: Open', 'Mit: In Progress', 'Mit: Treated', 'Mit: Closed'] as FilterTab[]).map(tab => {
            let count = 0;
            if (tab === 'All') count = clientRisks.length;
            else if (tab === 'Active') count = clientRisks.filter(r => (r.record_status || 'Active') !== 'Deactivated').length;
            else if (tab === 'Deactivated') count = clientRisks.filter(r => r.record_status === 'Deactivated').length;
            else if (tab === 'Open') count = clientRisks.filter(r => r.status === 'OPEN').length;
            else if (tab === 'Closed') count = clientRisks.filter(r => r.status === 'CLOSED').length;
            else if (tab === 'Mit: Open') count = clientRisks.filter(r => r.mitigation_status === 'Open').length;
            else if (tab === 'Mit: In Progress') count = clientRisks.filter(r => r.mitigation_status === 'In progress').length;
            else if (tab === 'Mit: Treated') count = clientRisks.filter(r => r.mitigation_status === 'Treated').length;
            else if (tab === 'Mit: Closed') count = clientRisks.filter(r => r.mitigation_status === 'Closed').length;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab} <span className={`text-[10px] font-mono ml-1 ${statusFilter === tab ? 'text-indigo-200' : 'text-slate-400'}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Risks Table List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-3.5 font-semibold text-slate-600 w-24">Risk ID</th>
                <th className="p-3.5 font-semibold text-slate-600">Domain</th>
                <th className="p-3.5 font-semibold text-slate-600">Risk Ident- Date</th>
                <th className="p-3.5 font-semibold text-slate-600">Asset Name *</th>
                <th className="p-3.5 font-semibold text-slate-600">Threat / Risk Type</th>
                <th className="p-3.5 font-semibold text-slate-600 text-center">Inherent (AV×I×L)</th>
                <th className="p-3.5 font-semibold text-slate-600 text-center">Residual (AV×RI×RL)</th>
                <th className="p-3.5 font-semibold text-slate-600">Mitigation Status</th>
                <th className="p-3.5 font-semibold text-slate-600">Record Status</th>
                <th className="p-3.5 font-semibold text-slate-600 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredRisks.length > 0 ? (
                finalFilteredRisks.map(risk => {
                  const { c, i, a, assetValue } = getAssetCIAAndValue(risk);
                  const { category, code } = getAssetCategoryAndCode(risk);
                  const rating = assetValue * risk.impact * risk.likelihood;
                  const resImp = risk.residual_impact !== undefined ? risk.residual_impact : risk.impact;
                  const resLik = risk.residual_likelihood !== undefined ? risk.residual_likelihood : Math.max(1, risk.likelihood - 1);
                  const residualRating = assetValue * resImp * resLik;

                  let inherentBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
                  if (rating >= 76) {
                    inherentBadge = 'bg-rose-100 text-rose-950 border border-rose-200 font-bold';
                  } else if (rating >= 51) {
                    inherentBadge = 'bg-amber-100 text-amber-950 border border-amber-200 font-semibold';
                  } else if (rating >= 21) {
                    inherentBadge = 'bg-blue-100 text-blue-950 border border-blue-200';
                  }

                  let residualBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
                  if (residualRating >= 76) {
                    residualBadge = 'bg-rose-100 text-rose-950 border border-rose-200 font-bold';
                  } else if (residualRating >= 51) {
                    residualBadge = 'bg-amber-100 text-amber-950 border border-amber-200 font-semibold';
                  } else if (residualRating >= 21) {
                    residualBadge = 'bg-blue-100 text-blue-950 border border-blue-200';
                  }

                  const isActive = (risk.record_status || 'Active') !== 'Deactivated';

                  return (
                    <React.Fragment key={risk.id}>
                      <tr className={`border-b border-slate-100 hover:bg-slate-50/50 ${!isActive ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="p-3.5 font-mono text-slate-900 font-bold">
                          <button
                            type="button"
                            onClick={() => setExpandedRiskId(expandedRiskId === risk.id ? null : risk.id)}
                            className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer text-left focus:outline-none"
                            title="View Calculation Formula & Compliance Standards Breakdown"
                          >
                            {expandedRiskId === risk.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span>{risk.risk_id}</span>
                          </button>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-500">{risk.domain || 'Access Control'}</td>
                        <td className="p-3.5 font-mono text-slate-600 font-bold whitespace-nowrap">
                          {risk.identification_date || risk.created_at?.substring(0, 10) || '2023-05-18'}
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          <div className="font-bold text-slate-900">{risk.asset_name || 'General Facility'}</div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {code && (
                              <span className="text-[10px] bg-slate-100 text-slate-800 font-mono font-extrabold px-1.5 py-0.5 rounded border border-slate-200">
                                Code: {code}
                              </span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              category === 'Physical Assets'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {category === 'Physical Assets' ? 'Physical' : 'Digital'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">CIA:</span>
                            <span className="text-[9px] bg-slate-50 text-slate-600 px-1 py-0.5 rounded font-mono font-bold" title="Confidentiality / Integrity / Availability rating">
                              {c}/{i}/{a}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">AV:</span>
                            <span className="text-[9px] bg-indigo-50/50 text-indigo-800 px-1 py-0.5 rounded font-mono font-bold" title="Calculated Asset Value (AV)">
                              {assetValue}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">{risk.risk_title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{risk.threat}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] ${inherentBadge}`}>
                            {rating} <span className="text-[9px] opacity-75 font-sans ml-1">({assetValue}×{risk.impact}×{risk.likelihood})</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] ${residualBadge}`}>
                            {residualRating} <span className="text-[9px] opacity-75 font-sans ml-1">({assetValue}×{resImp}×{resLik})</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            risk.mitigation_status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : risk.mitigation_status === 'Treated'
                              ? 'bg-blue-100 text-blue-800'
                              : risk.mitigation_status === 'In progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {risk.mitigation_status || 'Open'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(risk)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors inline-flex"
                            title="Edit Assessment Properties"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeactivateToggle(risk)}
                            className={`p-1.5 rounded-lg text-slate-600 cursor-pointer transition-colors inline-flex ${isActive ? 'bg-slate-50 hover:bg-slate-150 hover:text-amber-700' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                            title={isActive ? 'Deactivate Risk' : 'Activate Risk'}
                          >
                            {isActive ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                          </button>
                          {onDeleteRisk && (
                            <button
                              onClick={() => handleDelete(risk.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-900 cursor-pointer transition-colors inline-flex"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>

                      {expandedRiskId === risk.id && (
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <td colSpan={9} className="p-4 bg-slate-100/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Left Panel: HIPAA, ADHICS & ISO 27001 Compliance Alignment */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                                <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-emerald-800">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Regulatory Standards Alignment
                                </h5>
                                <p className="text-slate-600 leading-relaxed text-[11px]">
                                  This asset's compliance classifications and risk scores are continuously aligned with <strong>HIPAA Security Rule §164.308</strong> (Risk Assessment & Management), UAE <strong>ADHICS Standards</strong> (Asset Classification & Control), and <strong>ISO 27001 Annex A.12</strong>.
                                </p>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase">HIPAA Designation</span>
                                    <span className="font-bold text-slate-700 text-[11px]">
                                      {assetValue >= 4 ? 'ePHI Critical Node' : 'Standard Health IT'}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-[9px] text-slate-400 font-bold block uppercase">ADHICS Level</span>
                                    <span className="font-bold text-slate-700 text-[11px]">
                                      {assetValue === 5 ? 'High Criticality (L5)' : assetValue >= 4 ? 'Medium Criticality (L4)' : 'Standard Severity (L3)'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel: Risk Calculation Formulas */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-2">
                                <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-indigo-800">
                                  <Info className="w-3.5 h-3.5" />
                                  Mathematical Risk Evaluation Sheet
                                </h5>
                                
                                <div className="space-y-2">
                                  {/* Inherent Row */}
                                  <div className="border-b border-slate-100 pb-2">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-slate-800 text-[11px]">Inherent Risk Calculation</span>
                                      <span className="font-mono font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">{rating} / 125</span>
                                    </div>
                                    <div className="text-[10.5px] text-slate-500 font-mono space-y-0.5">
                                      <div>• Asset Value (AV) = avg(C:{c}, I:{i}, A:{a}) = {assetValue}</div>
                                      <div>• Impact (I) = {risk.impact} | Likelihood (L) = {risk.likelihood}</div>
                                      <div className="text-slate-600 font-bold">• Equation: {assetValue} (AV) × {risk.impact} (I) × {risk.likelihood} (L) = {rating}</div>
                                    </div>
                                  </div>

                                  {/* Residual Row */}
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-slate-800 text-[11px]">Residual Risk Calculation</span>
                                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{residualRating} / 125</span>
                                    </div>
                                    <div className="text-[10.5px] text-slate-500 font-mono space-y-0.5">
                                      <div>• Asset Value (AV) = {assetValue}</div>
                                      <div>• Residual Impact (RI) = {resImp} | Residual Likelihood (RL) = {resLik}</div>
                                      <div className="text-slate-600 font-bold">• Equation: {assetValue} (AV) × {resImp} (RI) × {resLik} (RL) = {residualRating}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No risk parameters matched criteria in this facility view. Try switching status tabs or clear grid selectors.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {subTab === 'policy' && (
        <PolicyStandardsView />
      )}

      {subTab === 'report' && (
        <Reports
          clients={clients}
          policies={policies}
          risks={risks}
          assets={assets}
          incidents={incidents}
          findings={findings}
          actions={actions}
          activeClientId={activeClientId}
          filteredRisks={finalFilteredRisks}
          autoOpenPdf={autoOpenPdf}
          onClosePdfStream={() => setAutoOpenPdf(false)}
          onNavigateTab={onNavigateTab}
          onOpenQuickSetup={onOpenQuickSetup}
          onUpdateClient={onUpdateClient}
        />
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Risk Register Version History</h3>
                  <p className="text-[11px] text-slate-400">Document Control & Audit Revision Log</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Current Active Version: {client?.doc_version || '1.0'}</span>
                  <span className="text-[11px] text-slate-500 font-mono">Ref: {client?.doc_ref || 'ZZP-IT-PE-05/2021'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVersionIdx(null);
                    setShowAddVersionInline(!showAddVersionInline);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Version Record</span>
                </button>
              </div>

              {/* Edit Version Record Form */}
              {editingVersionIdx !== null && (
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      Edit Version Record Entry (Row #{editingVersionIdx + 1})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingVersionIdx(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Version Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.0, 2.1"
                        value={editVersionNo}
                        onChange={(e) => setEditVersionNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Date *</label>
                      <input
                        type="date"
                        value={editVersionDate}
                        onChange={(e) => setEditVersionDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Author / Reviewer *</label>
                      <input
                        type="text"
                        placeholder="e.g. IT Manager / Risk Officer"
                        value={editVersionAuthor}
                        onChange={(e) => setEditVersionAuthor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">Summary of Changes / Remarks *</label>
                      <input
                        type="text"
                        placeholder="e.g. Updated Register as per ADHICS v2 standards"
                        value={editVersionChanges}
                        onChange={(e) => setEditVersionChanges(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingVersionIdx(null)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditVersion}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {showAddVersionInline && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    New Version Record Entry
                  </h4>
                  <div className="grid grid-cols-12 gap-2 text-xs">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1">Version Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 2.1 [Live]"
                        value={newVersionNo}
                        onChange={(e) => setNewVersionNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1">Date</label>
                      <input
                        type="date"
                        value={newVersionDate}
                        onChange={(e) => setNewVersionDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1">Author / Reviewer</label>
                      <input
                        type="text"
                        placeholder="e.g. IT Manager / Risk Officer"
                        value={newVersionAuthor}
                        onChange={(e) => setNewVersionAuthor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-12">
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1">Summary of Changes / Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Updated Register as per ADHCIS v2 standards / Live Online Version"
                        value={newVersionChanges}
                        onChange={(e) => setNewVersionChanges(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddVersionInline(false)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVersionRecord}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Version
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-[15%]">Version</th>
                      <th className="py-2.5 px-3 w-[15%]">Date</th>
                      <th className="py-2.5 px-3 w-[22%]">Author / Reviewer</th>
                      <th className="py-2.5 px-3 w-[36%]">Summary of Changes / Remarks</th>
                      <th className="py-2.5 px-3 w-[12%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayVersionHistory.map((vh, idx) => {
                      const isEditing = editingVersionIdx === idx;
                      return (
                        <tr
                          key={idx}
                          className={
                            isEditing
                              ? 'bg-amber-50/80 border-y-2 border-amber-400 font-medium'
                              : 'hover:bg-slate-50/80 transition-colors'
                          }
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap align-top">
                            <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px] inline-block">
                              {vh.version || (vh as any).version_number || 'V1.0'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap align-top">
                            {vh.date || (vh as any).revision_date || '2026-05-29'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 align-top">
                            {vh.author || (vh as any).changed_by || 'IT Manager'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-normal leading-relaxed break-words whitespace-pre-wrap align-top">
                            {vh.changes || (vh as any).change_description || (vh as any).remarks || 'Risk Register revision'}
                          </td>
                          <td className="py-2.5 px-3 text-center align-top">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditVersion(idx)}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded cursor-pointer transition-colors"
                                title="Edit version record"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {displayVersionHistory.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVersionRecord(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer transition-colors"
                                  title="Delete version record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Total Versions Logged: {displayVersionHistory.length}</span>
              <button
                type="button"
                onClick={() => setShowVersionHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
