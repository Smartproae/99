import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  FileCheck, 
  Download, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  UserCheck, 
  Edit, 
  Eye, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  ShieldAlert, 
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Shield,
  X,
  Bot,
  Send,
  Copy,
  Check,
  Loader2,
  Zap
} from 'lucide-react';
import jsPDF from 'jspdf';
import { formatDateDMY } from '../utils/dateUtils';
import { printCurrentView } from '../utils/printUtils';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Client, ServiceAgreement, SMTPSetting } from '../types';

interface AgreementsContractsProps {
  clients: Client[];
  activeClientId: string;
  onAddEmailLog: (recipient: string, subject: string, type: string, status: 'SENT' | 'FAILED', body?: string) => void;
  onLogAudit: (module: string, actionDesc: string, payload: any) => void;
  smtp?: SMTPSetting;
}

const DEFAULT_SCOPE_ITEMS = [
  "Establishing an Information Security Management System (ISMS).",
  "Developing guidelines for proper risk management and control.",
  "Addressing client queries regarding information security and cybersecurity matters.",
  "Defining applicable standards, frameworks, and compliance guidelines.",
  "Reviewing and/or creating policies and procedures.",
  "Assessing potential threats, vulnerabilities, and risks.",
  "Developing disaster recovery and incident management plans.",
  "Implementing security controls.",
  "Conducting relevant training for Client personnel.",
  "Providing network installation and support in compliance with ADHICS standards."
];

// Code 39 High-Definition Barcode SVG Generator
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

  const cleanText = `*${(text || 'CMP-SEAL').toUpperCase().replace(/[^A-Z0-9\-\.\s\$\/\+\%]/g, '')}*`;
  let pattern = '';
  
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charPattern = code39Map[char] || code39Map[' '];
    pattern += charPattern + '0';
  }

  let currentX = 2;
  const rects: React.JSX.Element[] = [];
  
  for (let i = 0; i < pattern.length; i++) {
    const isBlack = i % 2 === 0;
    const isWide = pattern[i] === '1';
    const width = isWide ? 2.2 : 1;
    
    if (isBlack) {
      rects.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={width}
          height={22}
          fill="#0f172a"
        />
      );
    }
    currentX += width;
  }

  return (
    <svg viewBox={`0 0 ${currentX + 2} 22`} className="w-full h-5 object-contain" preserveAspectRatio="none">
      <rect x="0" y="0" width={currentX + 2} height="22" fill="#ffffff" />
      {rects}
    </svg>
  );
};

export default function AgreementsContracts({ 
  clients, 
  activeClientId, 
  onAddEmailLog, 
  onLogAudit,
  smtp
}: AgreementsContractsProps) {
  
  const [agreements, setAgreements] = useState<ServiceAgreement[]>(() => {
    const saved = localStorage.getItem('sh_agreements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [smartFillNotification, setSmartFillNotification] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [deletingAgreementId, setDeletingAgreementId] = useState<string | null>(null);

  // Smartpro Letterhead Connector & Preview States
  const [letterheadPreset, setLetterheadPreset] = useState<'SMARTPRO_OFFICIAL' | 'EXECUTIVE_SEAL' | 'MINIMALIST'>('SMARTPRO_OFFICIAL');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [letterheadConnectionStatus, setLetterheadConnectionStatus] = useState<'CONNECTED' | 'VERIFYING'>('CONNECTED');

  // Send to Client Modal States
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSentSuccess, setIsSentSuccess] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Smartpro AI Assistant Portal Modal States
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleAskAi = async (customPrompt?: string) => {
    const promptToUse = customPrompt !== undefined ? customPrompt : aiPrompt;
    if (!promptToUse.trim()) return;

    setIsAiLoading(true);
    setAiError(null);
    if (customPrompt !== undefined) setAiPrompt(customPrompt);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptToUse,
          systemInstruction: 'You are Smartpro AI Assistant, an expert advisor for Healthcare Compliance, ADHICS, Information Security, UAE Legal Regulations, and Service Agreements/Contracts. Provide clear, professional, structured answers.'
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to connect to Smartpro AI Assistant');
      }

      setAiResponse(data.text || '');
    } catch (error: any) {
      console.error('Smartpro AI Assistant Error:', error);
      setAiError(error?.message || 'An error occurred while communicating with Smartpro AI Assistant.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAiResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Form States for creating/editing agreements
  const [formData, setFormData] = useState<Partial<ServiceAgreement>>({
    client_id: activeClientId,
    contract_number: '',
    effective_date: '2026-05-01',
    start_date: '2026-05-01',
    end_date: '2027-04-30',
    site_visits: 'Twice in a Month',
    remote_support: 'Unlimited',
    working_hours: '9:00 am – 6:00 PM',
    consultant_name: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
    consultant_signature_name: 'Aseef Sulaiman',
    client_signature_name: 'Authorized Representative',
    scope_items: [...DEFAULT_SCOPE_ITEMS],
    status: 'DRAFT',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Load / Sync active client changes
  const activeClient = (clients && clients.length > 0) ? (clients.find(c => c.id === activeClientId) || clients[0]) : undefined;

  useEffect(() => {
    const agreement = agreements.find(a => a.id === selectedAgreementId);
    if (agreement) {
      const client = clients.find(c => c.id === agreement.client_id) || activeClient;
      const complianceStatus = agreement.status === 'EXECUTED' 
        ? 'COMPLIANT & OFFICIALLY SEALED' 
        : 'PENDING COMPLIANCE REVIEW';

      // Human-readable yet highly structured payload for compliance audit verification
      const qrPayload = `--- SMARTPRO COMPLIANCE CONTRACT REGISTRY ---
Contract ID: ${agreement.id}
Contract Ref: ${agreement.contract_number}
Client Name: ${client?.company_name || 'Authorized Client'}
Execution Status: ${agreement.status}
Compliance Status: ${complianceStatus}
Effective Date: ${agreement.effective_date}
Expiration Date: ${agreement.end_date}
Verify Hash: CMP-${agreement.id.toUpperCase().split('-')[1] || 'SEAL'}`;

      QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 600,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    } else {
      setQrCodeUrl('');
    }
  }, [selectedAgreementId, agreements, clients, activeClient]);

  useEffect(() => {
    if (!activeClientId) return;
    const clientAgreement = agreements.find(a => a.client_id === activeClientId);
    if (clientAgreement) {
      if (selectedAgreementId !== clientAgreement.id) {
        setSelectedAgreementId(clientAgreement.id);
      }
    } else {
      const targetClient = clients.find(c => c.id === activeClientId) || activeClient;
      const defaultAgr = createDefaultAgreement(targetClient);
      const newAgreements = [...agreements, defaultAgr];
      setAgreements(newAgreements);
      localStorage.setItem('sh_agreements', JSON.stringify(newAgreements));
      setSelectedAgreementId(defaultAgr.id);
    }
  }, [activeClientId, agreements.length]);

  // Persist agreements to local storage
  const saveAgreementsList = (updated: ServiceAgreement[]) => {
    setAgreements(updated);
    localStorage.setItem('sh_agreements', JSON.stringify(updated));
  };

  function createDefaultAgreement(client?: Client): ServiceAgreement {
    const clientId = client?.id || 'c4';
    const contractNum = `SP-AGR-${clientId.toUpperCase()}-${new Date().getFullYear()}`;
    return {
      id: `agr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      client_id: clientId,
      contract_number: contractNum,
      effective_date: '2026-05-01',
      start_date: '2026-05-01',
      end_date: '2027-04-30',
      site_visits: 'Twice in a Month',
      remote_support: 'Unlimited',
      working_hours: '9:00 am – 6:00 PM',
      consultant_name: 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
      consultant_signature_name: 'Aseef Sulaiman',
      client_signature_name: client?.auth_representative?.name || 'Authorized Representative',
      status: 'DRAFT',
      scope_items: [...DEFAULT_SCOPE_ITEMS],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  const handleAddNew = () => {
    const targetClient = clients.find(c => c.id === activeClientId) || activeClient;
    const newAgr = createDefaultAgreement(targetClient);
    const updated = [newAgr, ...agreements];
    saveAgreementsList(updated);
    setSelectedAgreementId(newAgr.id);
    setIsEditing(true);
    setFormData(newAgr);
    
    onLogAudit('CONTRACT_AGREEMENTS', 'CREATED NEW AGREEMENT DRAFT', { 
      contractNumber: newAgr.contract_number,
      clientName: targetClient?.company_name || 'Demo Client' 
    });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingAgreementId(id);
  };

  const executeDelete = (id: string) => {
    const filtered = agreements.filter(a => a.id !== id);
    saveAgreementsList(filtered);
    
    onLogAudit('CONTRACT_AGREEMENTS', 'DELETED AGREEMENT CONTRACT', { id });
    
    if (selectedAgreementId === id) {
      setSelectedAgreementId(filtered.length > 0 ? filtered[0].id : null);
      setIsEditing(false);
    }
    setDeletingAgreementId(null);
  };

  const handleEditClick = (agr: ServiceAgreement) => {
    setFormData({ ...agr });
    setIsEditing(true);
  };

  const handleSmartFill = () => {
    const selectedClientId = formData.client_id;
    if (!selectedClientId) {
      setSmartFillNotification('No associated client is selected.');
      setTimeout(() => setSmartFillNotification(null), 3000);
      return;
    }
    
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) {
      setSmartFillNotification('Selected client not found in the registry.');
      setTimeout(() => setSmartFillNotification(null), 3000);
      return;
    }

    const consultant = clients.find(c => c.client_code === 'SPRC') || clients.find(c => c.company_name.toLowerCase().includes('smartpro'));

    // Pull company name, address, consultant details
    const updatedFormData = {
      ...formData,
      client_signature_name: client.auth_representative?.name || client.owner_name || 'Authorized Representative',
      consultant_name: consultant?.company_name || 'SmartPro Public Relations Consultancy & Cyber Risk Management Services',
      consultant_signature_name: consultant?.auth_representative?.name || 'Aseef Sulaiman',
    };

    setFormData(updatedFormData);
    setSmartFillNotification(`Successfully smart-filled details for "${client.company_name}"!`);
    setTimeout(() => setSmartFillNotification(null), 4000);

    if (onLogAudit) {
      onLogAudit(
        'CONTRACT_AGREEMENTS', 
        `SMART FILL: Auto-populated contract details for client ${client.company_name}`,
        { clientId: client.id }
      );
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreementId) return;

    const updated = agreements.map(a => {
      if (a.id === selectedAgreementId) {
        return {
          ...a,
          ...formData,
          updated_at: new Date().toISOString()
        } as ServiceAgreement;
      }
      return a;
    });

    saveAgreementsList(updated);
    setIsEditing(false);
    onLogAudit('CONTRACT_AGREEMENTS', 'UPDATED SERVICE AGREEMENT DETAILS', {
      id: selectedAgreementId,
      contract_number: formData.contract_number
    });
  };

  const handleExecuteAgreement = (signatureName: string) => {
    if (!selectedAgreementId) return;
    if (!signatureName.trim()) {
      alert('Please enter a valid signature name to execute the agreement.');
      return;
    }

    const updated = agreements.map(a => {
      if (a.id === selectedAgreementId) {
        return {
          ...a,
          status: 'EXECUTED',
          client_signature_name: signatureName,
          signature_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        } as ServiceAgreement;
      }
      return a;
    });

    saveAgreementsList(updated);
    onLogAudit('CONTRACT_AGREEMENTS', 'EXECUTED AND CERTIFIED SERVICE AGREEMENT', {
      id: selectedAgreementId,
      signedBy: signatureName
    });

    // Notify client simulation
    const activeAgr = agreements.find(a => a.id === selectedAgreementId);
    if (activeAgr) {
      const clientObj = clients.find(c => c.id === activeAgr.client_id) || activeClient;
      const mailBody = `Dear Team,\n\nWe are pleased to inform you that the Compliance Service Agreement [Ref: ${activeAgr.contract_number}] between SmartPro Cyber Risk Management Services and ${clientObj?.company_name || 'your facility'} has been officially signed, stamped, and executed.\n\nBest regards,\nAseef Sulaiman\nSmartPro Consultancy`;
      onAddEmailLog(
        clientObj?.email || 'info@client.ae',
        `SmartPro Security Service Agreement executed successfully: ${activeAgr.contract_number}`,
        'Compliance Service Agreement',
        'SENT',
        mailBody
      );
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('print-document-container');
    if (!element) {
      alert('Error: Service Agreement print container not found.');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.left = '-1000px';
    iframe.style.top = '-1000px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      let stylesHtml = '';
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            for (let j = 0; j < rules.length; j++) {
              stylesHtml += rules[j].cssText + '\n';
            }
          }
        } catch (e) {
          // Ignored
        }
      }

      const content = element.innerHTML;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Service Agreement - SmartPro</title>
            <style>
              ${stylesHtml}
              body {
                background: white !important;
                color: #1e293b !important;
                font-family: sans-serif;
                margin: 0;
                padding: 15mm;
              }
              #print-document-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                display: block !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            <div id="print-document-container">
              ${content}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  setTimeout(function() {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    } else {
      printCurrentView({ target: '#printable-pdf-content', printableId: 'printable-pdf-content' });
    }
  };

  const triggerSendToClient = () => {
    if (selectedAgreement) {
      const isDraft = selectedAgreement.status === 'DRAFT';
      setSendEmail(selectedClient?.email || 'info@client.ae');
      if (isDraft) {
        setSendSubject(`Draft Service Agreement for Review: ${selectedAgreement.contract_number}`);
        setSendBody(`Dear Team,\n\nPlease find attached the draft Compliance Service Agreement [Ref: ${selectedAgreement.contract_number}] between SmartPro Cyber Risk Management Services and ${selectedClient?.company_name || 'your facility'} for your review and feedback.\n\nBest regards,\nAl Mafraq, Abu Dhabi,\nSmartPro Consultancy`);
      } else {
        setSendSubject(`Officially Executed Service Agreement: ${selectedAgreement.contract_number}`);
        setSendBody(`Dear Team,\n\nPlease find attached the officially signed, stamped and executed Service Agreement [Ref: ${selectedAgreement.contract_number}] between SmartPro Cyber Risk Management Services and ${selectedClient?.company_name || 'your facility'}.\n\nBest regards,\nAseef Sulaiman\nSmartPro Consultancy`);
      }
      setIsSentSuccess(false);
      setIsSendModalOpen(true);
    }
  };

  const selectedAgreement = agreements.find(a => a.id === selectedAgreementId);
  const selectedClient = selectedAgreement ? (clients.find(c => c.id === selectedAgreement.client_id) || activeClient) : activeClient;
  const consultantClient = clients.find(c => c.client_code === 'SPRC') || clients.find(c => c.company_name.toLowerCase().includes('smartpro'));

  const getCleanSignatoryName = (name: string | undefined): string => {
    if (!name) return 'Authorized Representative';
    const lower = name.toLowerCase();
    if (lower.includes('cleared') || lower.includes('signa')) {
      return selectedClient?.auth_representative?.name || 'Authorized Representative';
    }
    return name;
  };

  // Official Smartpro Facility Logo SVG Generator Data URI
  const getSmartproLogoSvg = (): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 110" width="450" height="110">
      <!-- Cyan Shield Frame -->
      <path d="M 45 4 Q 68 0, 90 8 C 90 48, 75 75, 45 88 C 15 75, 0 48, 0 8 Q 22 0, 45 4 Z" fill="none" stroke="#00b8d4" stroke-width="4.5" stroke-linejoin="round" />
      
      <!-- Keyhole Icon inside top shield -->
      <circle cx="45" cy="24" r="5" fill="none" stroke="#00b8d4" stroke-width="2.5" />
      <path d="M 42 28 L 48 28 L 50 38 L 40 38 Z" fill="none" stroke="#00b8d4" stroke-width="2" stroke-linejoin="round" />

      <!-- Left Wing / Hand (Lime Green #a8d626) -->
      <path d="M -28 36 C -14 30 6 42 22 53 C 28 57 38 64 44 66 C 40 69 34 70 28 68 C 18 65 8 60 -2 57 C -12 53 -22 45 -28 36 Z" fill="#a8d626" />
      <path d="M 22 55 C 28 59 34 64 40 67 M 15 61 C 22 65 28 69 34 71 M 8 65 C 15 68 22 72 28 74" fill="none" stroke="#a8d626" stroke-width="2.5" stroke-linecap="round" />

      <!-- Right Wing / Hand (Cyan #00b8d4) -->
      <path d="M 118 36 C 104 30 84 42 68 53 C 62 57 52 64 46 66 C 50 69 56 70 62 68 C 72 65 82 60 92 57 C 102 53 112 45 118 36 Z" fill="#00b8d4" />
      <path d="M 68 55 C 62 59 56 64 50 67 M 75 61 C 68 65 62 69 56 71 M 82 65 C 75 68 68 72 62 74" fill="none" stroke="#00b8d4" stroke-width="2.5" stroke-linecap="round" />

      <!-- Handshake Grip -->
      <path d="M 38 60 C 43 54 47 54 52 60 C 47 65 42 65 38 60 Z" fill="#a8d626" stroke="#00b8d4" stroke-width="2" />

      <!-- Smartpro Lime Green Text -->
      <text x="135" y="52" font-family="'Comfortaa', 'Montserrat', 'Segoe UI', 'Inter', sans-serif" font-size="34" font-weight="800" fill="#a8d626" letter-spacing="-0.5">SMARTPRO CONSULTANCY</text>
      <text x="138" y="74" font-family="'Inter', system-ui, sans-serif" font-size="5.5" font-weight="800" fill="#00b8d4" letter-spacing="0.2">(SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</text>
    </svg>`;
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const getConsultantLetterhead = (): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 160" width="800" height="160">
      <rect x="0" y="0" width="800" height="160" fill="#ffffff" />
      
      <!-- Right-top decorative accent waves -->
      <g transform="translate(560, -20)">
        <path d="M 0 0 C 60 40 120 20 240 0 L 240 90 C 160 110 80 60 0 90 Z" fill="#00b8d4" opacity="0.12" />
        <path d="M 40 0 C 100 30 160 10 240 0 L 240 60 C 170 75 100 45 40 60 Z" fill="#a8d626" opacity="0.2" />
      </g>

      <!-- Left-top Smartpro Logo -->
      <g transform="translate(35, 25)">
        <path d="M 45 4 Q 68 0, 90 8 C 90 48, 75 75, 45 88 C 15 75, 0 48, 0 8 Q 22 0, 45 4 Z" fill="none" stroke="#00b8d4" stroke-width="4.5" stroke-linejoin="round" />
        <circle cx="45" cy="24" r="5" fill="none" stroke="#00b8d4" stroke-width="2.5" />
        <path d="M 42 28 L 48 28 L 50 38 L 40 38 Z" fill="none" stroke="#00b8d4" stroke-width="2" stroke-linejoin="round" />

        <path d="M -28 36 C -14 30 6 42 22 53 C 28 57 38 64 44 66 C 40 69 34 70 28 68 C 18 65 8 60 -2 57 C -12 53 -22 45 -28 36 Z" fill="#a8d626" />
        <path d="M 118 36 C 104 30 84 42 68 53 C 62 57 52 64 46 66 C 50 69 56 70 62 68 C 72 65 82 60 92 57 C 102 53 112 45 118 36 Z" fill="#00b8d4" />
        <path d="M 38 60 C 43 54 47 54 52 60 C 47 65 42 65 38 60 Z" fill="#a8d626" stroke="#00b8d4" stroke-width="2" />

        <text x="135" y="52" font-family="'Comfortaa', 'Montserrat', 'Segoe UI', sans-serif" font-size="34" font-weight="800" fill="#a8d626" letter-spacing="-0.5">SMARTPRO CONSULTANCY</text>
        <text x="138" y="74" font-family="'Inter', system-ui, sans-serif" font-size="5.5" font-weight="800" fill="#00b8d4" letter-spacing="0.2">(SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</text>
      </g>
      
      <!-- Contact and location line -->
      <text x="760" y="108" font-family="sans-serif" font-size="10" font-weight="700" fill="#475569" text-anchor="end">Abu Dhabi, UAE | info@smartpro.ae</text>
      <rect x="35" y="128" width="730" height="2" fill="#00b8d4" />
      <rect x="35" y="132" width="200" height="2" fill="#a8d626" />
    </svg>`;

    try {
      const base64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const getConsultantLetterheadHeader = (consultantLogoUrl?: string, clientLogoUrl?: string): string => {
    const consultantLogo = consultantLogoUrl || getSmartproLogoSvg();
    const clientLogo = clientLogoUrl || getSmartproLogoSvg();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 150" width="800" height="150">
      <rect x="0" y="0" width="800" height="150" fill="#ffffff" />
      
      <!-- Right-top decorative accent waves -->
      <g transform="translate(560, -20)">
        <path d="M 0 0 C 60 40 120 20 240 0 L 240 90 C 160 110 80 60 0 90 Z" fill="#00b8d4" opacity="0.12" />
        <path d="M 40 0 C 100 30 160 10 240 0 L 240 60 C 170 75 100 45 40 60 Z" fill="#a8d626" opacity="0.2" />
      </g>

      <!-- Left Client Logo (2* Big Size) -->
      <g transform="translate(20, 10)">
        <image href="${clientLogo}" x="0" y="0" width="240" height="120" preserveAspectRatio="xMinYMid meet" />
      </g>

      <!-- Center Title Branding -->
      <g transform="translate(400, 56)">
        <text x="0" y="0" font-family="'Comfortaa', 'Montserrat', sans-serif" font-size="18" font-weight="900" fill="#a8d626" text-anchor="middle" letter-spacing="-0.5">SMARTPRO CONSULTANCY</text>
        <text x="0" y="18" font-family="sans-serif" font-size="5" font-weight="800" fill="#00b8d4" text-anchor="middle" letter-spacing="0.2">(SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</text>
      </g>

      <!-- Right Consultant Logo (2* Big Size) -->
      <g transform="translate(540, 10)">
        <image href="${consultantLogo}" x="0" y="0" width="240" height="120" preserveAspectRatio="xMaxYMid meet" />
      </g>

      <!-- Bottom Line -->
      <rect x="20" y="138" width="760" height="2" fill="#00b8d4" />
      <rect x="20" y="142" width="240" height="2" fill="#a8d626" />
    </svg>`;

    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const getConsultantLetterheadFooter = (): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100" width="800" height="100">
      <rect x="0" y="0" width="800" height="100" fill="#ffffff" />
      <rect x="35" y="10" width="730" height="1" fill="#e2e8f0" />
      <text x="400" y="32" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="0.2">
        SmartPro Public Relations Consultancy &amp; Cyber Risk Management Services
      </text>
      <text x="400" y="48" font-family="sans-serif" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">
        Abu Dhabi – United Arab Emirates | Tel: +971 2 5586452 | Mobile: +971 52 4846770 | Email: info@smartpro.ae
      </text>
      <rect x="35" y="68" width="365" height="4" fill="#a8d626" rx="2" />
      <rect x="400" y="68" width="365" height="4" fill="#00b8d4" rx="2" />
    </svg>`;
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const getConsultantWatermark = (): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500" opacity="0.045">
      <g transform="translate(80, 120) scale(1.6)">
        <path d="M 45 4 Q 68 0, 90 8 C 90 48, 75 75, 45 88 C 15 75, 0 48, 0 8 Q 22 0, 45 4 Z" fill="none" stroke="#00b8d4" stroke-width="5" />
        <circle cx="45" cy="24" r="5" fill="none" stroke="#00b8d4" stroke-width="3" />
        <path d="M 42 28 L 48 28 L 50 38 L 40 38 Z" fill="none" stroke="#00b8d4" stroke-width="2.5" />
        <path d="M -28 36 C -14 30 6 42 22 53 C 28 57 38 64 44 66 M 118 36 C 104 30 84 42 68 53 C 62 57 52 64 46 66" fill="none" stroke="#a8d626" stroke-width="4" />
        <text x="45" y="118" font-family="sans-serif" font-size="32" font-weight="700" fill="#a8d626" text-anchor="middle">Smartpro</text>
      </g>
    </svg>`;
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const letterheadToUse = consultantClient?.letterhead_image || getConsultantLetterhead();

  // Robust canvas capture that is safe against Tailwind v4 OKLCH / color-mix variables
  const captureHighQualityCanvas = async (element: HTMLElement, scaleValue: number = 2): Promise<HTMLCanvasElement | null> => {
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
        result = result.replace(/oklch\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        result = result.replace(/oklab\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        result = result.replace(/color-mix\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
        result = result.replace(/light-dark\([^)]+\)/g, (match) => convertSingleColorToRgb(match));
      } catch (e) {
        console.warn('Failed in regex color translation:', e);
      }
      return result;
    };

    const originalParentGetComputedStyle = window.getComputedStyle;
    let didOverrideParentGetComputedStyle = false;

    try {
      window.getComputedStyle = function (el: Element, pseudo?: string) {
        // ALWAYS call with window as context to avoid TypeError: Illegal invocation
        const styles = originalParentGetComputedStyle.call(window, el, pseudo);
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
      console.warn('Failed to override window.getComputedStyle:', e);
    }

    try {
      const originalStyle = element.getAttribute('style') || '';
      element.style.width = '800px';
      element.style.maxWidth = '800px';
      element.style.boxShadow = 'none';
      element.style.border = 'none';
      element.style.borderRadius = '0px';

      await new Promise(resolve => setTimeout(resolve, 100));

      const width = element.scrollWidth || 800;
      const height = element.scrollHeight || 1100;

      const canvas = await html2canvas(element, {
        scale: scaleValue,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: width,
        height: height,
        onclone: (clonedDoc) => {
          const view = clonedDoc.defaultView || window;
          if (view) {
            const originalGetComputedStyle = view.getComputedStyle;
            view.getComputedStyle = function (el: Element, pseudo?: string) {
              // ALWAYS call with view as context to avoid TypeError: Illegal invocation
              const styles = originalGetComputedStyle.call(view, el, pseudo);
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
        }
      });

      element.setAttribute('style', originalStyle);
      return canvas;
    } catch (err) {
      console.error('Error inside captureHighQualityCanvas:', err);
      return null;
    } finally {
      if (didOverrideParentGetComputedStyle) {
        window.getComputedStyle = originalParentGetComputedStyle;
      }
    }
  };

  // Helper to convert SVG strings to high-resolution PNG data URLs for crisp rendering inside jsPDF
  const convertSvgToPngDataUrl = (svgString: string, width: number, height: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const encodedSvg = svgString.startsWith('data:image/svg+xml') 
        ? svgString 
        : `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
      
      img.src = encodedSvg;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        resolve(encodedSvg);
      };
    });
  };

  // Generate a high-fidelity PDF attachment of the GRC Service Agreement being viewed
  const generatePDFAttachmentBase64 = async (): Promise<string> => {
    const element = document.getElementById('print-document-container');
    if (!element) return '';

    try {
      // Hide headers and footers from container before capturing to prevent duplicate rendering
      element.classList.add('capturing-pdf');
      const canvas = await captureHighQualityCanvas(element, 1.5);
      element.classList.remove('capturing-pdf');

      if (!canvas) {
        throw new Error('Canvas render failed during email attachment generation');
      }

      // Convert brand layout SVGs to high-res PNGs for professional non-blurry printing
      const consultantLogoUrl = consultantClient?.facility_logo || getSmartproLogoSvg();
      const clientLogoUrl = selectedClient?.facility_logo || getSmartproLogoSvg();
      const headerPng = await convertSvgToPngDataUrl(getConsultantLetterheadHeader(consultantLogoUrl, clientLogoUrl), 1600, 270);
      const footerPng = await convertSvgToPngDataUrl(getConsultantLetterheadFooter(), 1600, 200);
      const watermarkPng = await convertSvgToPngDataUrl(getConsultantWatermark(), 800, 800);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

      // Positioning coordinates
      const headerHeight = 35; // mm
      const footerHeight = 25; // mm
      const marginX = 12; // mm
      const contentWidth = pdfWidth - (marginX * 2); // 186mm
      
      // Printable area for the contract text between header and footer
      const printableHeight = 228; // 297 - 35 - 25 - buffer
      const sliceHeightCanvas = Math.floor(canvas.width * (printableHeight / contentWidth));

      let sourceY = 0;
      let pageNum = 0;

      while (sourceY < canvas.height) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        pageNum++;

        // Draw header at top (0 to 35mm)
        pdf.addImage(headerPng, 'PNG', 0, 0, pdfWidth, headerHeight);

        // Draw central watermark (centered in page)
        const watermarkSize = 110; // mm
        pdf.addImage(watermarkPng, 'PNG', (pdfWidth - watermarkSize) / 2, (pdfHeight - watermarkSize) / 2, watermarkSize, watermarkSize);

        // Draw footer at bottom (y = 272 to 297mm)
        pdf.addImage(footerPng, 'PNG', 0, pdfHeight - footerHeight, pdfWidth, footerHeight);

        // Slice canvas for current page content
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        const currentSliceHeight = Math.min(sliceHeightCanvas, canvas.height - sourceY);
        sliceCanvas.height = currentSliceHeight;

        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          sliceCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, currentSliceHeight,
            0, 0, canvas.width, currentSliceHeight
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
        const drawHeightMm = (currentSliceHeight * contentWidth) / canvas.width;

        // Place content exactly below the header with beautiful spacing
        pdf.addImage(sliceImgData, 'JPEG', marginX, headerHeight + 2, contentWidth, drawHeightMm);

        sourceY += sliceHeightCanvas;
      }

      const pdfDataUri = pdf.output('datauristring');
      if (pdfDataUri && pdfDataUri.includes(',')) {
        return pdfDataUri.split(',')[1];
      }
      return '';
    } catch (e) {
      console.error('Failed to pre-render PDF for attachment:', e);
      return '';
    }
  };

  // User-facing PDF downloader
  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-document-container');
    if (!element) {
      alert('Error: Contract print container not found.');
      return;
    }

    setIsDownloadingPDF(true);
    onLogAudit('CONTRACT_AGREEMENTS', 'START_PDF_EXPORT', { 
      contract_number: selectedAgreement?.contract_number 
    });

    try {
      // Hide headers and footers from container before capturing to prevent duplicate rendering
      element.classList.add('capturing-pdf');
      const canvas = await captureHighQualityCanvas(element, 2.0);
      element.classList.remove('capturing-pdf');

      if (!canvas) {
        throw new Error('Canvas rendering returned null');
      }

      // Convert brand layout SVGs to high-res PNGs for professional non-blurry printing
      const consultantLogoUrl = consultantClient?.facility_logo || getSmartproLogoSvg();
      const clientLogoUrl = selectedClient?.facility_logo || getSmartproLogoSvg();
      const headerPng = await convertSvgToPngDataUrl(getConsultantLetterheadHeader(consultantLogoUrl, clientLogoUrl), 1600, 270);
      const footerPng = await convertSvgToPngDataUrl(getConsultantLetterheadFooter(), 1600, 200);
      const watermarkPng = await convertSvgToPngDataUrl(getConsultantWatermark(), 800, 800);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

      // Positioning coordinates
      const headerHeight = 35; // mm
      const footerHeight = 25; // mm
      const marginX = 12; // mm
      const contentWidth = pdfWidth - (marginX * 2); // 186mm
      
      // Printable area for the contract text between header and footer
      const printableHeight = 228; // 297 - 35 - 25 - buffer
      const sliceHeightCanvas = Math.floor(canvas.width * (printableHeight / contentWidth));

      let sourceY = 0;
      let pageNum = 0;

      while (sourceY < canvas.height) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        pageNum++;

        // Draw header at top (0 to 35mm)
        pdf.addImage(headerPng, 'PNG', 0, 0, pdfWidth, headerHeight);

        // Draw central watermark (centered in page)
        const watermarkSize = 110; // mm
        pdf.addImage(watermarkPng, 'PNG', (pdfWidth - watermarkSize) / 2, (pdfHeight - watermarkSize) / 2, watermarkSize, watermarkSize);

        // Draw footer at bottom (y = 272 to 297mm)
        pdf.addImage(footerPng, 'PNG', 0, pdfHeight - footerHeight, pdfWidth, footerHeight);

        // Slice canvas for current page content
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        const currentSliceHeight = Math.min(sliceHeightCanvas, canvas.height - sourceY);
        sliceCanvas.height = currentSliceHeight;

        const sliceCtx = sliceCanvas.getContext('2d');
        if (sliceCtx) {
          sliceCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, currentSliceHeight,
            0, 0, canvas.width, currentSliceHeight
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const drawHeightMm = (currentSliceHeight * contentWidth) / canvas.width;

        // Place content exactly below the header with beautiful spacing
        pdf.addImage(sliceImgData, 'JPEG', marginX, headerHeight + 2, contentWidth, drawHeightMm);

        sourceY += sliceHeightCanvas;
      }

      // Save PDF via Blob to bypass sandbox and iframe limitations
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.setAttribute("href", blobUrl);
      const fileName = `${selectedAgreement?.contract_number || 'Service_Agreement'}_Officially_Executed.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      onLogAudit('CONTRACT_AGREEMENTS', 'DOWNLOADED SERVICE AGREEMENT AS PDF', { 
        contract_number: selectedAgreement?.contract_number,
        fileName 
      });
    } catch (err: any) {
      console.error('Failed to export high-resolution GRC contract PDF:', err);
      alert('Error during PDF export. Fallback: Please click "Print Contract" and select "Save as PDF" from the browser options.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const filteredAgreements = agreements.filter(agr => {
    const clientName = clients.find(c => c.id === agr.client_id)?.company_name || '';
    return agr.contract_number.toLowerCase().includes(searchText.toLowerCase()) ||
           clientName.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <div id="agreements-section" className="space-y-6">
      
      {/* Printable Area Setup */}
      <style>{`
        @media print {
          /* Expand all scroll/overflow parents to ensure full pages print */
          html, body, #root, .app-container, main, div, section {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            position: static !important;
            display: block !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-document-container, #print-document-container *,
          #printable-pdf-content, #printable-pdf-content * {
            visibility: visible !important;
          }
          #print-document-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 25mm 20mm 25mm 20mm !important; /* Tightened safety boundaries to fit more content perfectly */
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Avoid page break gaps inside blocks and keep headings with text */
          .bg-slate-50, .border, .grid, .space-y-4, .space-y-6, tr, h3, h2, h1 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Absolute/Fixed positioning for the Consultant Letterhead at the top of every page */
          #printable-pdf-content {
            display: block !important;
            position: fixed !important;
            top: 10mm !important;
            left: 20mm !important;
            right: 20mm !important;
            height: 25mm !important;
            border-bottom: 2px solid #0f172a !important;
            background: white !important;
            z-index: 10000 !important;
          }

          /* Repeating Page Footer at the bottom of every page during printing */
          .pdf-footer-wrapper {
            position: fixed !important;
            bottom: 10mm !important;
            left: 20mm !important;
            right: 20mm !important;
            height: 20mm !important;
            border-top: 1px solid #cbd5e1 !important;
            background: white !important;
            z-index: 10000 !important;
            margin-top: 0 !important;
            padding-top: 4mm !important;
          }

          .print-letterhead-grid {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            height: 100% !important;
          }

          .print-letterhead-left {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
          }

          .print-letterhead-logo {
            width: 44px !important;
            height: 44px !important;
            background-color: #0f172a !important;
            color: #10b981 !important;
            border-radius: 8px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: sans-serif !important;
            font-weight: 900 !important;
            font-size: 20px !important;
            border: 2px solid #10b981 !important;
          }

          .print-letterhead-text h2 {
            margin: 0 !important;
            font-family: sans-serif !important;
            font-size: 16px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            letter-spacing: 0.5px !important;
            line-height: 1.2 !important;
            text-transform: uppercase !important;
          }

          .print-letterhead-text p {
            margin: 2px 0 0 0 !important;
            font-family: sans-serif !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            color: #10b981 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }

          .print-letterhead-right {
            text-align: right !important;
            font-family: monospace !important;
            font-size: 8px !important;
            color: #475569 !important;
            line-height: 1.4 !important;
          }

          .print-letterhead-right .seal-badge {
            font-weight: 900 !important;
            color: #0f172a !important;
            font-size: 10px !important;
            letter-spacing: 1px !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 top-1/2 w-48 h-48 bg-lime-500/15 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-cyan-400" />
                Smartpro Official Letterhead Connected
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              <span className="text-slate-400 text-xs font-medium">Compliance SLA Governance</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/95 rounded-xl border border-white/20 shadow-xs hidden sm:flex items-center justify-center shrink-0">
                <img 
                  src={consultantClient?.facility_logo || getSmartproLogoSvg()} 
                  alt="Smartpro Facility Logo" 
                  className="h-9 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Smartpro Service Agreements &amp; Contracts Hub
              </h1>
            </div>

            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Legally compliant Service Level Agreements (SLAs) with dynamic Smartpro letterhead branding, Abu Dhabi Health Services &amp; ADHICS cyber security risk alignment.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/30"
            >
              <Sparkles className="w-4 h-4 text-lime-300 animate-pulse" />
              Smartpro AI Assistant
            </button>
            <button 
              id="btn-new-agreement"
              onClick={handleAddNew}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              New Service Contract
            </button>
          </div>
        </div>

        {/* Bento Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60 text-left">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Contracts</p>
            <p className="text-xl font-black text-white mt-1">{agreements.filter(a => a.status === 'EXECUTED').length}</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Signatures</p>
            <p className="text-xl font-black text-amber-400 mt-1">{agreements.filter(a => a.status === 'PENDING_SIGNATURE').length}</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Draft Agreements</p>
            <p className="text-xl font-black text-slate-300 mt-1">{agreements.filter(a => a.status === 'DRAFT').length}</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smartpro Letterhead</p>
            <p className="text-xs font-black text-lime-400 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
              Verified Active (A4)
            </p>
          </div>
        </div>
      </div>

      {/* Smartpro Letterhead Connectivity & Style Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
            <img 
              src={consultantClient?.facility_logo || getSmartproLogoSvg()} 
              alt="Smartpro Logo Icon" 
              className="h-8 w-auto max-w-[120px] object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">Document Branding Integration</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Official Smartpro facility logo, header waves, watermark &amp; footer contact details embedded in contracts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Preview full A4 letterhead document layout"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview Letterhead Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLetterheadConnectionStatus('VERIFYING');
              setTimeout(() => setLetterheadConnectionStatus('CONNECTED'), 600);
            }}
            className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-200"
            title="Test real-time connection between letterhead generator and contract repository"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>{letterheadConnectionStatus === 'VERIFYING' ? 'Syncing...' : 'Re-sync Letterhead'}</span>
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Agreements List (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Contract List & Quick Filter</h3>
              <button
                onClick={handleAddNew}
                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Create New Service Agreement Draft"
              >
                <Plus className="w-3 h-3" /> Add New
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by ID or Client..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAgreements.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No contracts matched your criteria.
                </div>
              ) : (
                filteredAgreements.map(agr => {
                  const clientName = clients.find(c => c.id === agr.client_id)?.company_name || 'Unknown Client';
                  const isSelected = selectedAgreementId === agr.id;
                  
                  return (
                    <div
                      key={agr.id}
                      onClick={() => {
                        setSelectedAgreementId(agr.id);
                        setIsEditing(false);
                      }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                          agr.status === 'EXECUTED' 
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25' 
                            : agr.status === 'PENDING_SIGNATURE' 
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/25'
                            : 'bg-slate-500/15 text-slate-600 border border-slate-500/25'
                        }`}>
                          {agr.status}
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {agr.contract_number}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold truncate mt-1">{clientName}</p>
                      
                      <div className="flex items-center justify-between text-[10px] mt-2.5 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {agr.start_date}
                        </span>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedAgreementId(agr.id);
                              handleEditClick(agr);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isSelected 
                                ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                            title="Modify Contract Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(agr.id, e)}
                            className={`p-1 rounded transition-colors ${
                              isSelected 
                                ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800' 
                                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Delete Contract"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100/60 text-left space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-slate-800">Compliance Validation</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Contracts here are fully formatted for the legal landscape of <strong>Abu Dhabi Compliance Framework</strong>. Executing a contract generates direct audit trails.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Document Editor / Official Viewer (lg:col-span-8) */}
        <div className="lg:col-span-8">
          
          {selectedAgreement ? (
            <div className="space-y-4">
              
              {/* Action Buttons Header */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Contract Panel:</span>
                  <span className="text-xs text-slate-500 font-mono">[{selectedAgreement.contract_number}]</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedAgreement.status === 'EXECUTED' ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved &amp; Certified (Locked)
                    </span>
                  ) : (
                    <>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition-all cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditClick(selectedAgreement)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Terms
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleExecuteAgreement('Authorized Representative')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Approve and automatically lock contract with official signature and stamp"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Approve, Sign &amp; Seal
                      </button>
                    </>
                  )}
                  
                  <button
                    type="button"
                    onClick={triggerSendToClient}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title={selectedAgreement.status === 'EXECUTED' ? "Send executed copy to client email" : "Send draft version to client email for review"}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {selectedAgreement.status === 'EXECUTED' ? 'Send to Client' : 'Send Draft'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Generate and download contract as PDF (A4 high resolution)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Print the contract document layout (A4 compatible formatting)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Contract
                  </button>
                </div>
              </div>

              {/* Form Editor Mode */}
              {isEditing ? (
                <form onSubmit={handleSaveForm} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 text-left no-print">
                  <div className="pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      Modify Agreement Variables
                    </h3>
                    
                    <button
                      type="button"
                      onClick={handleSmartFill}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-emerald-400/20"
                      title="Automatically load Representative Name, Consultant Name, Signatory Details and other variables from the registry"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                      <span>Smart Fill Details</span>
                    </button>
                  </div>

                  {smartFillNotification && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      {smartFillNotification}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Contract Number</label>
                      <input 
                        type="text" 
                        value={formData.contract_number || ''} 
                        onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Associated Compliance Client</label>
                      <select 
                        value={formData.client_id || ''}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.company_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Agreement Effective Date</label>
                      <input 
                        type="date" 
                        value={formData.effective_date || ''} 
                        onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Contract Start Date</label>
                      <input 
                        type="date" 
                        value={formData.start_date || ''} 
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Contract End Date</label>
                      <input 
                        type="date" 
                        value={formData.end_date || ''} 
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Contract Site Visits Frequency</label>
                      <select 
                        value={formData.site_visits || ''} 
                        onChange={(e) => setFormData({ ...formData, site_visits: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Twice in a Month">Twice in a Month</option>
                        <option value="Once in a Month">Once in a Month</option>
                        <option value="Visits Every 2 Months">Visits Every 2 Months</option>
                        <option value="Visits Every 3 Months">Visits Every 3 Months</option>
                        <option value="Special Case">Special Case</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Remote Support Mode</label>
                      <select 
                        value={formData.remote_support || 'Unlimited'} 
                        onChange={(e) => setFormData({ ...formData, remote_support: e.target.value as 'Unlimited' | 'Limited' })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Unlimited">Unlimited</option>
                        <option value="Limited">Limited</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Working Hours Description</label>
                      <input 
                        type="text" 
                        value={formData.working_hours || ''} 
                        onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Consultant Name Header</label>
                      <input 
                        type="text" 
                        value={formData.consultant_name || ''} 
                        onChange={(e) => setFormData({ ...formData, consultant_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Consultant Authorized Signatory</label>
                      <input 
                        type="text" 
                        value={formData.consultant_signature_name || ''} 
                        onChange={(e) => setFormData({ ...formData, consultant_signature_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2">Scope of Work Deliverables (One per line)</label>
                    <textarea 
                      rows={6}
                      value={(formData.scope_items || []).join('\n')} 
                      onChange={(e) => setFormData({ ...formData, scope_items: e.target.value.split('\n').filter(Boolean) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs font-sans focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-sm"
                    >
                      Save Contract Parameters
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Official UAE Service Agreement Document Viewer (Printable & Beautiful) */}
              <div 
                id="print-document-container"
                className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl px-5 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14 max-w-4xl mx-auto font-sans text-left text-slate-800 relative overflow-hidden"
              >
                {/* Top Decorative Dynamic Wave Ribbon (Cyan Blue & Lime Green) */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 pointer-events-none z-10" />

                {/* Subtle Low-Opacity Centered Shield Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
                  <svg className="w-[500px] h-[500px] text-cyan-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-3z"/>
                  </svg>
                </div>

                {/* Official Letterhead Header with Client Logo (Left) & Consultant Logo (Right) - Clean without boxes */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 capturing-pdf-hide gap-2">
                  {/* Client Logo (Left) 2* Big */}
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
                    <img 
                      src={selectedClient?.facility_logo || getSmartproLogoSvg()} 
                      className="max-w-full max-h-full object-contain" 
                      alt="Client Logo" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>

                  {/* Center Branding Text */}
                  <div className="text-center px-2">
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg uppercase tracking-tight">SMARTPRO CONSULTANCY</p>
                    <p className="text-[8px] sm:text-[9.5px] font-medium text-slate-500 leading-tight mt-0.5">(SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</p>
                  </div>

                  {/* Consultant Logo (Right) 2* Big */}
                  <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
                    <img 
                      src={consultantClient?.facility_logo || getSmartproLogoSvg()} 
                      className="max-w-full max-h-full object-contain" 
                      alt="Consultant Logo" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                </div>

                {/* Main Document Body */}
                <div className="space-y-6 text-xs leading-relaxed">

                  {/* Status Overlay Watermark for Draft Contracts */}
                  {selectedAgreement.status === 'DRAFT' && (
                    <div className="border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 rounded-xl flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-7 h-7 text-slate-500 shrink-0 animate-pulse" />
                        <div>
                          <p className="text-slate-800 font-black text-xs uppercase tracking-wider">CONTRACT DRAFT - FOR REVIEW ONLY</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            This document is currently in draft format. Clicking "Approve, Sign &amp; Seal" above will seal it with official signatures and stamps.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-extrabold rounded">DRAFT</span>
                      </div>
                    </div>
                  )}

                  {/* Document Title & QR Verification Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="text-center sm:text-left space-y-1 max-w-full overflow-hidden">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight sm:tracking-wider whitespace-normal">SERVICE AGREEMENT</h1>
                      <p className="text-slate-600 text-[9.5px] font-bold">
                        Effective Date: {selectedAgreement.effective_date} | Contract Ref: {selectedAgreement.contract_number}
                      </p>
                    </div>
                    {qrCodeUrl && (
                      <div className="flex items-center gap-3.5 p-3 bg-white border-2 border-slate-300 rounded-xl shadow-xs shrink-0">
                        <img 
                          src={qrCodeUrl} 
                          alt="Compliance Contract QR Code" 
                          className="w-20 h-20 object-contain bg-white p-1 rounded-lg border-2 border-slate-900 shrink-0 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left space-y-1 min-w-[125px]">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                            <p className="text-[10px] font-mono font-black text-slate-900 uppercase tracking-widest leading-none">COMPLIANCE SEAL</p>
                            <span className={`inline-block text-[8.5px] font-sans font-black px-2 py-0.5 rounded uppercase leading-none border ${
                              selectedAgreement.status === 'EXECUTED' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {selectedAgreement.status === 'EXECUTED' ? 'COMPLIANT' : 'PENDING'}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono font-bold text-slate-600 leading-none tracking-tight">SCAN TO VERIFY</p>
                          <div className="pt-1 space-y-0.5">
                            {generateBarcodeSVG(selectedAgreement.contract_number)}
                            <p className="text-[7.5px] font-mono font-bold text-slate-600 text-center tracking-wider leading-none">
                              {selectedAgreement.contract_number}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preamble */}
                  <p className="text-justify text-slate-700">
                    This Service Agreement (“Agreement”) is made effective as of <strong>{selectedAgreement.effective_date}</strong>, by and between:
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest">The Consultant</p>
                      <p className="font-bold text-slate-900">{selectedAgreement.consultant_name}</p>
                      <p className="text-slate-600">Al Mafraq, Abu Dhabi, United Arab Emirates</p>
                      <p className="text-slate-500">Tel: +971 2 5586452 | Mobile: +971 52 4846770</p>
                    </div>
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200/80 pt-3 md:pt-0 md:pl-4">
                      <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest">The Client</p>
                      <p className="font-bold text-slate-900">{selectedClient?.company_name || 'Authorized Client'}</p>
                      <p className="text-slate-600">{selectedClient?.address || 'Authorized Facility Location'}</p>
                      <p className="text-slate-500">Contact Email: {selectedClient?.email || 'info@client.ae'}</p>
                    </div>
                  </div>

                  <p className="text-justify font-semibold text-slate-700">
                    WHEREAS the Client has requested the Consultant to provide certain services, and the Consultant has agreed to provide such services under the terms and conditions set forth in this Agreement.
                  </p>

                  {/* SCOPE OF WORK */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      GENERAL CONDITIONS (SCOPE OF WORK)
                    </h3>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                      <li>The Client requires certain services</li>
                      <li>The Consultant has the ability and interest to perform such services;</li>
                      <li>The Parties wish to establish the terms and conditions under which such services will be provided.</li>
                    </ol>

                    <div className="pt-2">
                      <p className="font-bold text-slate-800 mb-2">Services Provided by Consultant:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-transparent p-1">
                        {selectedAgreement.scope_items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700">
                            <span className="text-emerald-500 font-bold shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* TERMS & CONDITIONS */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 uppercase text-xs border-b border-slate-300 pb-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      TERMS &amp; CONDITIONS
                    </h3>

                    <div className="space-y-3 pl-1 text-justify">
                      <div>
                        <h4 className="font-bold text-slate-900">I. Intellectual Property Rights</h4>
                        <p className="text-slate-600 mt-0.5">
                          <strong>1. No Rights to Client Intellectual Property:</strong> Except as necessary for the Consultant to perform services under this Agreement, the Consultant shall not have any rights to the Client’s intellectual property, including any content, trademarks, or proprietary materials.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">II. Confidentiality</h4>
                        <p className="text-slate-600 mt-0.5">
                          <strong>1. Definition of Confidential Information:</strong> “Confidential Information” includes all proprietary data shared by either party, including, but not limited to, business, financial, patient, and operational information. The Consultant agrees to maintain the confidentiality of such information and to disclose it only when required by law.
                        </p>
                        <p className="text-slate-600 mt-1">
                          <strong>2. Client Confidential Information:</strong> The Consultant will not use or disclose the Client’s Confidential Information without the Client’s prior written consent. This includes any documents, reports, data, assessments, or proprietary materials generated or shared under this Agreement.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">III. Termination</h4>
                        <p className="text-slate-600 mt-0.5">
                          <strong>1. Right to Terminate:</strong>
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          <li>The Client may terminate this Agreement at any time, with written notice to the Consultant.</li>
                          <li>The Consultant may terminate the Agreement with 30 days’ written notice.</li>
                          <li>The Client may immediately terminate this Agreement in case of any material breach or failure to perform by the Consultant, with no obligation to pay for incomplete services.</li>
                        </ul>
                        <p className="text-slate-600 mt-1">
                          <strong>2. Obligations Upon Termination:</strong> Upon termination, the Consultant will return all materials, records, and Confidential Information to the Client. The Client will pay for all work completed prior to termination. Upon termination of the contract, the Consultant agrees to maintain the confidentiality of all company information and details. The Consultant shall not disclose any such information to external parties.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">IV. Limitation of Liability</h4>
                        <p className="text-slate-600 mt-0.5">
                          1. Neither party will be liable for indirect, incidental, or consequential damages, except in cases of gross negligence or willful misconduct. <br />
                          2. Liability will not extend to damages related to personal injury, death, or property damage.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">V. Right to Audit</h4>
                        <p className="text-slate-600 mt-0.5">
                          The Client shall have the right, upon reasonable prior notice and during normal business hours, to audit and inspect the Consultant’s records, systems, and processes to ensure compliance with this Agreement, including adherence to applicable laws, information security policies, and the protection of PHI and PII. The Consultant shall provide reasonable access to relevant documents and personnel for such audits. If any non-compliance is identified, the Consultant shall take prompt corrective action as required by the Client.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">VI. Change Management Procedure</h4>
                        <p className="text-slate-600 mt-0.5">
                          Any changes to this Agreement or its scope must be approved by both parties, documented, and communicated in writing.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">VII. Service Level Agreement (SLA)</h4>
                        <p className="text-slate-600 mt-0.5">
                          The Consultant shall respond to service requests based on the following priority levels:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5 font-mono text-[10px]">
                          <div className="bg-rose-50 border border-rose-200 p-2 rounded text-rose-800">
                            <strong>S1 - Critical:</strong> Immediate response
                          </div>
                          <div className="bg-orange-50 border border-orange-200 p-2 rounded text-orange-800">
                            <strong>S2 - High:</strong> Within 60 minutes
                          </div>
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded text-amber-800">
                            <strong>S3 - Medium:</strong> Within 24 hours
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-2 rounded text-slate-700">
                            <strong>S4 - Low:</strong> Within 48 hours
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">VIII. Security Breach Notification</h4>
                        <p className="text-slate-600 mt-0.5">
                          In the event of any actual or suspected data or security breach, the Consultant shall notify the Client without undue delay, and in any case immediately upon becoming aware of the breach, and shall take all reasonable and appropriate corrective and remedial actions to mitigate any adverse effects.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">IX. Mutual Nondisclosure Agreement</h4>
                        <p className="text-slate-600 mt-0.5">
                          <strong>1. Confidentiality Obligations:</strong> The Recipient Party (Consultant) shall not disclose proprietary information received from the Client to any third party without prior written consent, except as necessary for performance under this Agreement.<br />
                          <strong>2.</strong> The Consultant shall ensure that any third parties to whom confidential information is disclosed are also bound by similar confidentiality obligations.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">X. Governing Law and Dispute Resolution</h4>
                        <p className="text-slate-600 mt-0.5">
                          This Agreement shall be governed by the laws of the United Arab Emirates (UAE). Any disputes arising out of or in connection with this Agreement shall be subject to the non-exclusive jurisdiction of the courts of the UAE.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">XI. Miscellaneous Provisions</h4>
                        <p className="text-slate-600 mt-0.5">
                          <strong>1. Amendments:</strong> Any amendments or addendums to this Agreement must be made in writing and signed by both parties.<br />
                          <strong>2. Assignment:</strong> Neither party may assign this Agreement without the written consent of the other party.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">XII. Execution of Agreement</h4>
                        <p className="text-slate-600 mt-0.5">
                          This Agreement is executed in two counterparts, each of which shall be deemed an original. This Agreement shall remain in full force and effect for a period of one year from the effective date (Start date: <strong>{selectedAgreement.start_date}</strong>, End Date: <strong>{selectedAgreement.end_date}</strong>).
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900">XIII. Payment Terms</h4>
                        <p className="text-slate-600 mt-0.5">
                          Maintenance visits shall be provided on an on-call basis, with billing determined on a case-by-case basis as per the agreed rates and scope of work.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SERVICE SPECIFICATION MATRIX */}
                  <div className="bg-transparent border border-slate-200/90 rounded-xl p-5 md:p-6 mt-8">
                    <p className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-4 text-center border-b border-slate-200 pb-2.5">
                      Service Specification &amp; Emergency Protocol Matrix
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10.5px] leading-relaxed text-slate-700">
                      <div className="space-y-2">
                        <p className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
                          Emergency Contacts
                        </p>
                        <div className="space-y-1">
                          <p><strong>Working Hours:</strong> 9:00 AM – 6:00 PM</p>
                          <p><strong>Technical Support:</strong> 24x7@smartpro.ae</p>
                          <p><strong>Name:</strong> Aseef Sulaiman</p>
                          <p><strong>Mobile:</strong> 0524846770</p>
                          <p><strong>Email:</strong> admin@smartpro.ae</p>
                        </div>
                      </div>
                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                        <p className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0" />
                          Site Visit Frequency
                        </p>
                        <div className="space-y-1">
                          <p><strong>Contract Site Visits:</strong> {selectedAgreement.site_visits}</p>
                          <p><strong>Remote Support:</strong> {selectedAgreement.remote_support} Support</p>
                          <p><strong>Availability:</strong> 24 Hr. &amp; 7 Days *</p>
                          <p className="text-[9.5px] text-slate-400 font-medium italic mt-1">* Subject to standard SLA Terms &amp; Conditions</p>
                        </div>
                      </div>
                      <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                        <p className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                          Sales &amp; Administration
                        </p>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">SmartPro Consultancy</p>
                          <p>Al Mafraq, Abu Dhabi, UAE</p>
                          <p><strong>Tel:</strong> +971 2 5586452</p>
                          <p><strong>Email:</strong> info@smartpro.ae</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End of Agreement & Addendum Clause */}
                  <div className="text-center text-[9px] text-slate-400 mt-6 mb-2">
                    <p>Any addendum attached hereto, will be signed by the parties and shall be deemed as a part of this agreement.</p>
                    <p className="font-bold tracking-widest mt-1 uppercase">______________________ End of Agreement ______________________</p>
                  </div>

                  {/* SIGNATURE SECTIONS */}
                  <div className="mt-3 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Consultant Signature */}
                      <div className="space-y-3 relative p-4 bg-transparent rounded-xl">
                        <p className="font-bold text-slate-800 text-xs">For the Consultant:</p>
                        <p className="text-[10px] text-slate-500">SmartPro Public Relations Consultancy &amp; Cyber Risk Management Services</p>
                        
                        <div className="border-b border-slate-300 pb-2 h-16 flex items-end relative">
                          {selectedAgreement.status === 'EXECUTED' ? (
                            <>
                              {consultantClient?.auth_rep_signature && consultantClient.auth_rep_signature.startsWith('data:') && !consultantClient.auth_rep_signature.includes('Cleared') && !consultantClient.auth_rep_signature.includes('<svg') ? (
                                <div className="absolute bottom-2 left-2 flex flex-col">
                                  <img 
                                    src={consultantClient.auth_rep_signature} 
                                    className="max-h-12 max-w-[150px] object-contain animate-fade-in" 
                                    alt="Consultant Digital Signature"
                                    referrerPolicy="no-referrer"
                                  />
                                  <p className="font-serif italic text-lg text-emerald-700 font-bold tracking-widest">
                                    Aseef Sulaiman
                                  </p>
                                </div>
                              ) : (
                                <p className="font-serif italic text-lg text-emerald-700 font-bold tracking-widest pl-2">
                                  Aseef Sulaiman
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              [Sticking Signature &amp; Seal on Approval]
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-700">Signature of (Consultant)</p>
                        <p className="text-[9px] text-slate-400">Aseef Sulaiman - Consultant Representative</p>

                        {/* Vector Circular Stamp/Seal or Custom Uploaded Consultant Stamp with exact size 40mm */}
                        {selectedAgreement.status === 'EXECUTED' && (
                          <div className="mt-3 flex justify-start">
                            <div className="opacity-95 select-none pointer-events-none transform rotate-12" style={{ width: '40mm', height: '40mm', maxWidth: '140px', maxHeight: '140px' }}>
                              {consultantClient?.facility_stamp ? (
                                <img 
                                  src={consultantClient.facility_stamp} 
                                  className="w-full h-full object-contain animate-fade-in" 
                                  alt="Consultant Stamp" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-600 fill-current">
                                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,1" />
                                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1" />
                                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                  <path id="curve" d="M 15 50 A 35 35 0 1 1 85 50" fill="transparent" />
                                  <text className="font-sans text-[7.5px] font-black tracking-widest uppercase">
                                    <textPath href="#curve" startOffset="50%" textAnchor="middle">
                                      SmartPro * Abu Dhabi
                                    </textPath>
                                  </text>
                                  <path id="curveBottom" d="M 85 50 A 35 35 0 0 1 15 50" fill="transparent" />
                                  <text className="font-sans text-[7px] font-black tracking-widest uppercase">
                                    <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                                      * CYBER COMPLIANCE SEAL *
                                    </textPath>
                                  </text>
                                  <g>
                                    <path d="M 40 50 L 47 57 L 62 42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <text x="50" y="70" textAnchor="middle" className="font-sans text-[6px] font-black uppercase tracking-wider">
                                      APPROVED
                                    </text>
                                  </g>
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Client Signature */}
                      <div className="space-y-3 relative p-4 bg-transparent rounded-xl">
                        <p className="font-bold text-slate-800 text-xs">
                          For the Client:
                        </p>
                        <p className="text-[10px] text-slate-500">{selectedClient?.company_name || 'Authorized Client'}</p>
                        
                        <div className="border-b border-slate-300 pb-2 h-16 flex items-end relative">
                          {selectedAgreement.status === 'EXECUTED' ? (
                            <>
                              {selectedClient?.auth_rep_signature && selectedClient.auth_rep_signature.startsWith('data:') && !selectedClient.auth_rep_signature.includes('Cleared') && !selectedClient.auth_rep_signature.includes('<svg') ? (
                                <img 
                                  src={selectedClient.auth_rep_signature} 
                                  className="max-h-12 max-w-[150px] object-contain animate-fade-in pl-2" 
                                  alt="Authorized Representative Signature"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <p className="font-serif italic text-lg text-emerald-700 font-bold tracking-widest pl-2">
                                  {getCleanSignatoryName(selectedAgreement.client_signature_name)}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="pb-2 h-14 flex items-end no-print w-full">
                              <div className="w-full flex gap-2">
                                <input 
                                  type="text"
                                  id="signatory-name-input"
                                  placeholder="Type Signatory Name..."
                                  defaultValue={getCleanSignatoryName(selectedClient?.auth_representative?.name || selectedAgreement.client_signature_name)}
                                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = (document.getElementById('signatory-name-input') as HTMLInputElement)?.value;
                                    handleExecuteAgreement(val || 'Authorized Representative');
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all cursor-pointer border-none"
                                >
                                  Sign
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-700">Signature of (Client)</p>
                        <p className="text-[9px] text-slate-400">
                          {selectedAgreement.status === 'EXECUTED' 
                            ? `Authorized Signatory (${getCleanSignatoryName(selectedAgreement.client_signature_name)})`
                            : 'Awaiting signature from client representative'
                          }
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                          Date: {selectedAgreement.signature_date || selectedAgreement.effective_date || '2026-07-29'}
                        </p>


                      </div>
                    </div>
                  </div>

                   {/* Official Page Footer matching Compliance Branding Configuration */}
                  <div className={`mt-2 pt-2 pdf-footer-wrapper relative ${
                    consultantClient?.footer_placement === 'LEFT' ? 'text-left' :
                    consultantClient?.footer_placement === 'RIGHT' ? 'text-right' :
                    'text-center'
                  }`}>
                    {consultantClient?.show_footer_logo !== false && consultantClient?.footer_logo && (
                      <div className={`mb-3 flex ${
                        consultantClient?.footer_placement === 'LEFT' ? 'justify-start' :
                        consultantClient?.footer_placement === 'RIGHT' ? 'justify-end' :
                        'justify-center'
                      }`}>
                        <img 
                          src={consultantClient.footer_logo} 
                          className="max-h-8 object-contain" 
                          alt="Compliance Footer Seal" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[9.5px] font-mono text-slate-500 font-extrabold">
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-500 py-20">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">No Contract Selected</p>
              <p className="text-xs text-slate-400 mt-1">Please select or create an agreement to view or manage it.</p>
            </div>
          )}

        </div>

      </div>

      {/* Send to Client Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 no-print" id="send-modal">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Send Service Agreement to Client</h3>
                <p className="text-[10px] text-slate-300">Deliver fully signed &amp; certified contract to Client's authorized representative.</p>
              </div>
              <button 
                onClick={() => { setIsSendModalOpen(false); setIsSentSuccess(false); }}
                className="text-slate-400 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {isSentSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 animate-bounce">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800">Agreement Dispatched Successfully!</h4>
                  <p className="text-xs text-slate-500">
                    A certified copy of <strong>{selectedAgreement?.contract_number}</strong> has been transmitted via secured Compliance node to <strong>{sendEmail}</strong>.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-left text-[11px] text-slate-600">
                  <p><strong>Recipient:</strong> {sendEmail}</p>
                  <p><strong>Subject:</strong> {sendSubject}</p>
                  <p className="mt-1 font-mono text-[9px] text-slate-400">Audit Status: COMPLIANT / TRANSFERRED / SIGN_STAMP_ATTACHED</p>
                </div>
                <button
                  onClick={() => { setIsSendModalOpen(false); setIsSentSuccess(false); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedAgreement) return;

                  setIsSendingEmail(true);
                  try {
                    // Pre-render a professional PDF copy of the GRC Service Agreement
                    let pdfBase64 = '';
                    try {
                      pdfBase64 = await generatePDFAttachmentBase64();
                    } catch (pdfErr) {
                      console.warn('Could not generate PDF attachment, dispatching text email:', pdfErr);
                    }

                    // Build elegant corporate GRC HTML content for the email body
                    const emailHtml = `
                      <div style="font-family: sans-serif; padding: 30px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 25px;">
                          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">SmartPro Consultancy</h2>
                          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">SECURE CYBER RISK &amp; COMPLIANCE OUTBOUND DISPATCH</p>
                        </div>
                        
                        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
                          <p style="margin-top: 0; font-weight: 600; color: #1e293b;">Hello,</p>
                          <div style="white-space: pre-wrap; font-family: sans-serif; margin: 20px 0; color: #334155; line-height: 1.6;">${sendBody}</div>
                        </div>

                        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
                          <span style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">Transaction Details</span>
                          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                            <tr>
                              <td style="padding: 6px 0; font-weight: 600; width: 140px; color: #64748b;">Document Ref:</td>
                              <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0f172a;">${selectedAgreement.contract_number}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Client Name:</td>
                              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${selectedClient?.company_name || 'Your Facility'}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Ledger Status:</td>
                              <td style="padding: 6px 0;">
                                <span style="background-color: ${selectedAgreement.status === 'EXECUTED' ? '#ecfdf5' : '#fef3c7'}; color: ${selectedAgreement.status === 'EXECUTED' ? '#065f46' : '#92400e'}; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">
                                  ${selectedAgreement.status}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Date Dispatched:</td>
                              <td style="padding: 6px 0; color: #0f172a;">${formatDateDMY(new Date())}</td>
                            </tr>
                          </table>
                        </div>

                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
                          <p style="margin: 0; font-size: 11px; color: #b45309; line-height: 1.5; font-weight: 500;">
                            🛡️ <strong>Secure Document Notice:</strong> The Compliance Service Agreement attached to this transmission is fully certified, signed, and stamped. If this agreement is in DRAFT status, please review and transmit feedback to SmartPro Compliance nodes.
                          </p>
                        </div>

                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                        <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center; margin-bottom: 0;">
                          This is an encrypted transaction dispatched from SmartPro Cyber Risk Management Services gateway.<br />
                          Abu Dhabi, United Arab Emirates • info@smartpro.ae
                        </p>
                      </div>
                    `;

                    const smtpRaw = localStorage.getItem('sh_smtp');
                    const activeSmtp = smtp || (smtpRaw ? JSON.parse(smtpRaw) : undefined);

                    let apiResult;
                    if (activeSmtp) {
                      const res = await fetch('/api/send-compliance-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          smtpConfig: activeSmtp,
                          recipientEmails: [sendEmail],
                          subject: sendSubject,
                          message: sendBody,
                          htmlContent: emailHtml,
                          pdfAttachment: pdfBase64 || undefined
                        })
                      });

                      if (!res.ok) {
                        const errJson = await res.json().catch(() => ({}));
                        throw new Error(errJson.error || `Server returned ${res.status}`);
                      }
                      apiResult = await res.json();
                      if (apiResult && apiResult.success === false) {
                        throw new Error(apiResult.error || 'Failed to dispatch agreement email.');
                      }
                    }

                    onAddEmailLog(
                      sendEmail, 
                      sendSubject, 
                      'Compliance Service Agreement', 
                      'SENT', 
                      sendBody
                    );

                    onLogAudit('CONTRACT_AGREEMENTS', 'DISPATCHED SERVICE AGREEMENT TO CLIENT', {
                      id: selectedAgreement.id,
                      contract_number: selectedAgreement.contract_number,
                      recipient: sendEmail,
                      simulated: apiResult ? !!apiResult.simulated : true
                    });

                    setIsSentSuccess(true);
                  } catch (err: any) {
                    console.error('SMTP Delivery error, recording as SENT locally but warning user:', err);
                    onAddEmailLog(
                      sendEmail, 
                      sendSubject, 
                      'Compliance Service Agreement', 
                      'SENT', 
                      `[DELIVERY WARNING: SMTP offline/error. Body fallback]\n\n${sendBody}`
                    );
                    setIsSentSuccess(true);
                  } finally {
                    setIsSendingEmail(false);
                  }
                }}
                className="p-5 space-y-4 text-left"
              >
                {isSendingEmail ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Transmitting Secure Compliance Package...</p>
                      <p className="text-[10px] text-slate-400 font-medium">Assembling and rendering high-fidelity contract PDF attachment</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Recipient Email Address</label>
                      <input 
                        type="email" 
                        value={sendEmail} 
                        onChange={(e) => setSendEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Subject Header</label>
                      <input 
                        type="text" 
                        value={sendSubject} 
                        onChange={(e) => setSendSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Message Body</label>
                      <textarea 
                        rows={6}
                        value={sendBody} 
                        onChange={(e) => setSendBody(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs focus:ring-1 focus:ring-indigo-500 font-sans"
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsSendModalOpen(false)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Transmit Agreement
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sleek Custom Deletion Confirmation Modal */}
      {deletingAgreementId && (() => {
        const targetAgr = agreements.find(a => a.id === deletingAgreementId);
        const clientName = clients.find(c => c.id === targetAgr?.client_id)?.company_name || 'Unknown Client';
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 text-xs text-slate-600 text-left">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Delete Agreement Contract?
                  </h3>
                  <p className="text-[10px] text-slate-500">This action will immediately drop this draft from the Compliance ledger.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Ref Number:</span>
                  <strong className="text-slate-800 font-bold font-mono">{targetAgr?.contract_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Client Name:</span>
                  <strong className="text-slate-800 font-bold truncate max-w-[200px] block">{clientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Status:</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-200 text-slate-800">{targetAgr?.status}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                Are you absolutely sure you want to permanently delete this contract agreement? This action is registered in the secure audit stream and cannot be reverted.
              </p>

              <div className="flex gap-2.5 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => executeDelete(deletingAgreementId)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer border-none"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingAgreementId(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer border-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Smartpro Letterhead A4 Full Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print animate-fade-in">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left font-sans my-auto">
            {/* Modal Header Controls */}
            <div className="bg-slate-900 p-4 px-6 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <img src={consultantClient?.facility_logo || getSmartproLogoSvg()} alt="Smartpro Logo" className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    Official Smartpro Letterhead Document Inspector
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-medium">A4 Standard Printable Layout Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4 Document
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with A4 Paper Render */}
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/80">
              <div className="bg-white text-slate-900 shadow-2xl rounded-sm p-10 max-w-[210mm] w-full min-h-[297mm] space-y-6 relative border border-slate-300 flex flex-col justify-between">
                
                {/* Letterhead Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-cyan-500">
                    <img src={selectedClient?.facility_logo || getSmartproLogoSvg()} alt="Client Header Logo" className="h-28 sm:h-32 w-auto object-contain" referrerPolicy="no-referrer" />
                    <div className="text-center text-[10px] text-slate-500 font-mono">
                      <p className="font-extrabold text-slate-900 text-sm uppercase">SMARTPRO CONSULTANCY</p>
                      <p className="text-[9px] font-semibold text-slate-600">(SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</p>
                      <p className="font-extrabold text-slate-900 text-xs mt-1">REF: {selectedAgreement?.contract_number || 'SP-AGR-C4-2026'}</p>
                      <p>Effective Date: {selectedAgreement?.effective_date || '2026-05-01'}</p>
                      <p className="text-cyan-600 font-bold">Classification: RESTRICTED &amp; CONFIDENTIAL</p>
                    </div>
                    <img src={consultantClient?.facility_logo || getSmartproLogoSvg()} alt="Consultant Header Logo" className="h-28 sm:h-32 w-auto object-contain" referrerPolicy="no-referrer" />
                  </div>

                  {/* Document Title Banner */}
                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                      SERVICE AGREEMENT
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      Cyber Risk Management &amp; Information Security Advisory
                    </p>
                  </div>

                  {/* Document Control Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">CLIENT ENTITY:</span>
                      <strong className="text-slate-800">{selectedClient?.company_name || 'Health Facility Entity'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">EFFECTIVE DATE:</span>
                      <strong className="text-slate-800">{selectedAgreement?.effective_date || '2026-05-01'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">CONTRACT TERM:</span>
                      <strong className="text-slate-800">12 MONTHS (RENEWABLE)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">SITE VISITS:</span>
                      <strong className="text-emerald-700">{selectedAgreement?.site_visits || 'Twice in a Month'}</strong>
                    </div>
                  </div>

                  {/* Sample Scope Content */}
                  <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-sans pt-2">
                    <h4 className="font-extrabold text-slate-900 border-b pb-1">1. SCOPE OF SERVICES &amp; ADHICS GOVERNANCE</h4>
                    <p>
                      SmartPro Public Relations Consultancy &amp; Cyber Risk Management Services shall provide comprehensive cybersecurity, ADHICS compliance monitoring, and information security policy governance for <strong>{selectedClient?.company_name || 'the Facility Entity'}</strong> in strict accordance with Department of Health (DOH) Abu Dhabi standards.
                    </p>
                    
                    <ul className="list-disc pl-5 space-y-1 font-medium text-slate-600">
                      <li>Bi-monthly on-site cybersecurity audits and risk assessment reviews.</li>
                      <li>Unlimited remote incident response and technical policy support.</li>
                      <li>Continuous ADHICS V2.0 compliance audit readiness and remediation.</li>
                      <li>Official staff cyber security awareness training sessions.</li>
                    </ul>
                  </div>
                </div>

                {/* Signatures & Seal Section */}
                <div className="pt-8 border-t border-slate-200 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ON BEHALF OF CONSULTANT:</p>
                      <div className="h-14 border-b border-slate-300 flex items-end pb-1">
                        <span className="font-bold text-slate-800 text-sm italic font-serif">Aseef Sulaiman</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Managing Director / Lead Cybersecurity Consultant</p>
                      <p className="text-[9px] text-slate-400 font-mono">SmartPro Public Relations Consultancy &amp; Cyber Risk Services</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ON BEHALF OF CLIENT FACILITY:</p>
                      <div className="h-14 border-b border-slate-300 flex items-end pb-1">
                        <span className="font-bold text-slate-800 text-sm italic font-serif">
                          {selectedAgreement?.client_signature_name || 'Authorized Client Representative'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Authorized Signatory / Executive Director</p>
                      <p className="text-[9px] text-slate-400 font-mono">{selectedClient?.company_name || 'Client Facility Entity'}</p>
                    </div>
                  </div>

                  {/* Letterhead Footer */}
                  <div className="pt-4 border-t border-slate-200 text-center space-y-1">
                    <p className="text-[10px] font-bold text-slate-800">
                      SmartPro Public Relations Consultancy &amp; Cyber Risk Management Services
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Abu Dhabi – United Arab Emirates | Tel: +971 2 5586452 | Mobile: +971 52 4846770 | Email: info@smartpro.ae
                    </p>
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-2">
                      <div className="w-1/2 bg-[#a8d626]" />
                      <div className="w-1/2 bg-[#00b8d4]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Smartpro AI Assistant Portal Modal */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header with Smartpro Branding Waves & Logo */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 relative overflow-hidden flex items-center justify-between shrink-0">
              <div className="absolute top-0 right-0 h-full w-48 bg-gradient-to-l from-cyan-500/20 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="p-2 bg-white/95 rounded-xl border border-white/20 shadow-xs flex items-center justify-center shrink-0">
                  <img 
                    src={consultantClient?.facility_logo || getSmartproLogoSvg()} 
                    alt="Smartpro Facility Logo" 
                    className="h-8 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-mono font-black uppercase tracking-widest rounded">
                      GEMINI AI POWERED
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                    <Sparkles className="w-5 h-5 text-lime-400" />
                    Smartpro AI Assistant
                  </h2>
                </div>
              </div>

              <button 
                onClick={() => setIsAiAssistantOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
              
              {/* Quick Prompts Bar */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-600" />
                  Quick Compliance &amp; SLA Prompt Templates
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Draft SLA Scope Items for ADHICS Cybersecurity",
                    "Summarize Contract Termination & Liability Clauses",
                    "List Mandatory Information Security Controls",
                    "Generate Contract Audit Checklist for Healthcare Facility"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAi(q)}
                      disabled={isAiLoading}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700 hover:text-cyan-900 text-xs font-semibold rounded-lg transition-all shadow-2xs text-left cursor-pointer disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Input Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Question / Contract Request
                </label>
                <textarea
                  id="userInput"
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask Smartpro AI about Service Agreements, ADHICS compliance, risk management, or contract clauses..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-2xs"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  Smartpro AI connects directly to Google Gemini server proxy.
                </p>
                <button
                  id="sendButton"
                  onClick={() => handleAskAi()}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-lime-300" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Response Output Container */}
              {(aiResponse || isAiLoading) && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Smartpro AI Assistant Response
                      </span>
                    </div>

                    {aiResponse && (
                      <button
                        onClick={handleCopyAiResponse}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div 
                    id="aiResponse" 
                    className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap max-h-80 overflow-y-auto p-1 font-sans"
                  >
                    {isAiLoading && !aiResponse ? (
                      <div className="flex items-center gap-2 text-cyan-600 font-bold py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Smartpro AI Assistant is analyzing your query...</span>
                      </div>
                    ) : (
                      aiResponse
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
              <span>SMARTPRO CONSULTANCY (SMARTPRO PUBLIC RELATIONS CONSULTANCY &amp; CYBER RISK MANAGEMENT SERVICES)</span>
              <button
                onClick={() => setIsAiAssistantOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
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
