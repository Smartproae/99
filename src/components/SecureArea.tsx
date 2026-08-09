/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Employee, Client, MasterKeyRegisterItem } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Lock, Unlock, Search, Filter, Users, Save, CheckCircle, HelpCircle, ArrowRight, Building, BookOpen, AlertCircle, AlertTriangle, Printer, Download, FileText, Trash2, Plus, Key, KeyRound, QrCode, Edit3, Check, X, RotateCcw, FileSpreadsheet, Mail, Send, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDateDMY } from '../utils/dateUtils';
import { getSyncedAuthorizedRepresentative } from '../utils/clientSyncUtils';
import { DocRefLoopSelector } from './DocRefLoopSelector';

const PRESET_LOGOS = [
  { name: 'Medical Shield', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' },
  { name: 'Heart Beat Wave', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { name: 'Medical Star', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l-4 4h8z"/></svg>' },
  { name: 'Cross Clinic Red', value: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>' }
];

interface SecureAreaProps {
  employees: Employee[];
  activeClientId: string;
  client: Client | undefined;
  onUpdateClient?: (updatedClient: Client) => void;
}

interface SecureAreaPermission {
  employeeId: string;
  allowedZones: string[];
}

const DEFAULT_KEY_REGISTER: MasterKeyRegisterItem[] = [
  { id: 'mk-1', slNo: 1, locationName: '1 Main Door', keyTagNo: '001', issueDate: '2026-01-10', receiverName: 'Dr. Titty Mathew', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-MD-001', digitalBioAccess: 'Yes' },
  { id: 'mk-2', slNo: 2, locationName: '2. Main Door', keyTagNo: '002', issueDate: '2026-01-10', receiverName: 'Facility Security Admin', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-MD-002', digitalBioAccess: 'Yes' },
  { id: 'mk-3', slNo: 3, locationName: '2 HR / IT Room', keyTagNo: '003', issueDate: '2026-01-12', receiverName: 'Sajid Khan (IT Lead)', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-HR-003', digitalBioAccess: 'Yes' },
  { id: 'mk-4', slNo: 4, locationName: '3-Server Room', keyTagNo: '009', issueDate: '2026-01-12', receiverName: 'Sajid Khan (IT Lead)', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-SR-009', digitalBioAccess: 'Yes' },
  { id: 'mk-5', slNo: 5, locationName: '4- Medical Record room', keyTagNo: '008', issueDate: '2026-01-15', receiverName: 'Medical Records Supervisor', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-MR-008', digitalBioAccess: 'Yes' },
  { id: 'mk-6', slNo: 6, locationName: '5- Medical Record Cabinet', keyTagNo: '004', issueDate: '2026-01-15', receiverName: 'Senior HIM Officer', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-MC-004', digitalBioAccess: 'No' },
  { id: 'mk-7', slNo: 7, locationName: '6.- Cash Box receptions', keyTagNo: '006', issueDate: '2026-01-18', receiverName: 'Head Receptionist', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-CB-006', digitalBioAccess: 'No' },
  { id: 'mk-8', slNo: 8, locationName: '7.Cash Box', keyTagNo: '007', issueDate: '2026-01-18', receiverName: 'Finance Executive', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-CB-007', digitalBioAccess: 'No' },
  { id: 'mk-9', slNo: 9, locationName: '8 Utility Room', keyTagNo: '010', issueDate: '2026-01-20', receiverName: 'Facility Maintenance Officer', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-UT-010', digitalBioAccess: 'No' },
  { id: 'mk-10', slNo: 10, locationName: '9. X-ray Room', keyTagNo: '011', issueDate: '2026-01-22', receiverName: 'Senior Radiographer', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-XR-011', digitalBioAccess: 'Yes' },
  { id: 'mk-11', slNo: 11, locationName: '10. Consultation Room1', keyTagNo: '012', issueDate: '2026-01-25', receiverName: 'Consultant Physician 1', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-CR-012', digitalBioAccess: 'No' },
  { id: 'mk-12', slNo: 12, locationName: '11. Consultation Room2', keyTagNo: '013', issueDate: '2026-01-25', receiverName: 'Consultant Physician 2', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-CR-013', digitalBioAccess: 'No' },
  { id: 'mk-13', slNo: 13, locationName: '12. Consultation Room3', keyTagNo: '014', issueDate: '2026-01-25', receiverName: 'Consultant Physician 3', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-CR-014', digitalBioAccess: 'No' },
  { id: 'mk-14', slNo: 14, locationName: '13.Sterilization Room', keyTagNo: '015', issueDate: '2026-01-28', receiverName: 'CSSD In-Charge Nurse', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-ST-015', digitalBioAccess: 'No' },
  { id: 'mk-15', slNo: 15, locationName: '14.Phlebotomy room', keyTagNo: '016', issueDate: '2026-01-28', receiverName: 'Lab Technician / Phlebotomist', receiverSign: 'Signed (Electronic)', returnDate: 'N/A (Active)', physicalKeyTagId: 'TAG-PB-016', digitalBioAccess: 'No' }
];

export default function SecureArea({ employees, activeClientId, client, onUpdateClient }: SecureAreaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  
  // Default secure zones based on POL-SEC-013 standard
  const DEFAULT_ZONES = [
    { id: 'zone_4', name: 'Zone 4: Public Access Areas', desc: 'Main reception lobby, waiting areas, public corridors, and restrooms' },
    { id: 'zone_3', name: 'Zone 3: Work Areas', desc: 'General office desks, medical consultation desks, nurse stations, and corridors' },
    { id: 'zone_2', name: 'Zone 2: Restricted Areas', desc: 'Medical record archive, server backup rooms, and administrative storage' },
    { id: 'zone_1', name: 'Zone 1: High Secure Areas', desc: 'Core server room, network cabinets, and main communications switch' }
  ];

  // Helper to parse POL-SEC-013 policy statement and auto-capture location boundaries
  const getPolicyBoundaries = () => {
    try {
      const savedPolicies = localStorage.getItem('sh_policies');
      if (savedPolicies) {
        const parsed = JSON.parse(savedPolicies);
        const pol = parsed.find((p: any) => p.policy_no === 'POL-SEC-013' && p.client_id === activeClientId);
        if (pol && pol.policy_statement) {
          const statement = pol.policy_statement;
          
          // Capture from "Public Access Areas | ... (including: <val>)"
          const match4 = statement.match(/Public Access Areas\s*\|\s*[^|]*\(including:\s*([^)]+)\)/i);
          const match3_2 = statement.match(/Work Areas,\s*Restricted Areas\s*\|\s*[^|]*\(including:\s*([^)]+)\)/i);
          const match1 = statement.match(/High Secure Areas\s*\|\s*[^|]*\(including:\s*([^)]+)\)/i);
          
          const zone4 = match4 ? match4[1].trim() : 'Reception Area';
          
          let zone3 = 'Behind reception desk';
          let zone2 = 'CCTV Cabinet';
          if (match3_2) {
            const parts = match3_2[1].split(',').map((p: string) => p.trim());
            if (parts.length >= 2) {
              zone3 = parts[0];
              zone2 = parts[1];
            } else if (parts.length === 1 && parts[0]) {
              zone3 = parts[0];
              zone2 = parts[0];
            }
          }
          
          const zone1 = match1 ? match1[1].trim() : 'CCTV Cabinet access';
          
          return { zone4, zone3, zone2, zone1 };
        }
      }
    } catch (e) {
      console.error('Error auto-capturing POL-SEC-013 policy boundaries:', e);
    }
    return null;
  };

  const [zones, setZones] = useState<any[]>(() => {
    const saved = localStorage.getItem(`sh_secure_zones_list_${activeClientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_ZONES;
  });

  const [docRef, setDocRef] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_doc_ref_${activeClientId}`);
    return saved || `SH-PSA-2026-${client?.client_code || 'COMPLIANCE'}`;
  });

  const [classification, setClassification] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_classification_${activeClientId}`);
    if (saved) {
      if (saved === 'INTERNAL STRICT SECURE') return 'CONFIDENTIAL';
      if (saved === 'RESTRICTED COMPLIANCE') return 'RESTRICTED';
      return saved;
    }
    return 'CONFIDENTIAL';
  });

  const [issueDate, setIssueDate] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_issue_date_${activeClientId}`);
    return saved || new Date().toISOString().split('T')[0];
  });

  const [approvedDate, setApprovedDate] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_approved_date_${activeClientId}`);
    return saved || new Date().toISOString().split('T')[0];
  });

  const [versionHistory, setVersionHistory] = useState<{ version: string; date: string; author: string; changes: string; }[]>(() => {
    const saved = localStorage.getItem(`sh_secure_version_history_${activeClientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return client?.version_history && client.version_history.length > 0 
      ? client.version_history 
      : [
          { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
        ];
  });

  const [newVersionNo, setNewVersionNo] = useState('');
  const [newVersionDate, setNewVersionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newVersionAuthor, setNewVersionAuthor] = useState('');
  const [newVersionChanges, setNewVersionChanges] = useState('');

  // Outsource locations
  const [outsourceZone4, setOutsourceZone4] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_outsource_zone_4_${activeClientId}`);
    if (saved) return saved;
    const policyBoundaries = getPolicyBoundaries();
    return policyBoundaries?.zone4 || 'Reception waiting Area, Lobby';
  });

  const [outsourceZone3, setOutsourceZone3] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_outsource_zone_3_${activeClientId}`);
    if (saved) return saved;
    const policyBoundaries = getPolicyBoundaries();
    return policyBoundaries?.zone3 || 'Consultation Room, Treatment room';
  });

  const [outsourceZone2, setOutsourceZone2] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_outsource_zone_2_${activeClientId}`);
    if (saved) return saved;
    const policyBoundaries = getPolicyBoundaries();
    return policyBoundaries?.zone2 || 'Admin Room, OPG Room';
  });

  const [outsourceZone1, setOutsourceZone1] = useState(() => {
    const saved = localStorage.getItem(`sh_secure_outsource_zone_1_${activeClientId}`);
    if (saved) return saved;
    const policyBoundaries = getPolicyBoundaries();
    return policyBoundaries?.zone1 || 'Server-cabinet, IT Server Room';
  });

  // Page Header / Footer Compliance Branding Configuration States
  const [headerDisplayMode, setHeaderDisplayMode] = useState<'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY'>(() => {
    const saved = localStorage.getItem(`sh_secure_header_mode_${activeClientId}`);
    if (saved === 'BOTH' || saved === 'LOGO_ONLY' || saved === 'TEXT_ONLY') return saved;
    return client?.header_display_mode || 'BOTH';
  });

  const [logoPlacement, setLogoPlacement] = useState<'LEFT' | 'RIGHT' | 'FULL'>(() => {
    const saved = localStorage.getItem(`sh_secure_logo_placement_${activeClientId}`);
    if (saved === 'LEFT' || saved === 'RIGHT' || saved === 'FULL') return saved;
    return client?.logo_placement || 'LEFT';
  });

  const [facilityLogoUrl, setFacilityLogoUrl] = useState<string>(() => {
    const saved = localStorage.getItem(`sh_secure_facility_logo_${activeClientId}`);
    if (saved) return saved;
    return client?.facility_logo || PRESET_LOGOS[0].value;
  });

  const [showFooterLogo, setShowFooterLogo] = useState<boolean>(() => {
    const saved = localStorage.getItem(`sh_secure_show_footer_logo_${activeClientId}`);
    if (saved !== null) return saved === 'true';
    return client?.show_footer_logo !== false;
  });

  const [footerLogoUrl, setFooterLogoUrl] = useState<string>(() => {
    const saved = localStorage.getItem(`sh_secure_footer_logo_${activeClientId}`);
    if (saved) return saved;
    return client?.footer_logo || client?.facility_logo || PRESET_LOGOS[0].value;
  });

  const [footerPlacement, setFooterPlacement] = useState<'LEFT' | 'RIGHT' | 'FULL'>(() => {
    const saved = localStorage.getItem(`sh_secure_footer_placement_${activeClientId}`);
    if (saved === 'LEFT' || saved === 'RIGHT' || saved === 'FULL') return saved;
    return client?.footer_placement || 'LEFT';
  });

  const [showFooterAddress, setShowFooterAddress] = useState<boolean>(() => {
    const saved = localStorage.getItem(`sh_secure_show_footer_address_${activeClientId}`);
    if (saved !== null) return saved === 'true';
    return client?.show_footer_address !== false;
  });

  const [isBrandingOpen, setIsBrandingOpen] = useState<boolean>(false);

  const handleUpdateHeaderMode = (mode: 'BOTH' | 'LOGO_ONLY' | 'TEXT_ONLY') => {
    setHeaderDisplayMode(mode);
    localStorage.setItem(`sh_secure_header_mode_${activeClientId}`, mode);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, header_display_mode: mode });
    }
  };

  const handleUpdateLogoPlacement = (placement: 'LEFT' | 'RIGHT' | 'FULL') => {
    setLogoPlacement(placement);
    localStorage.setItem(`sh_secure_logo_placement_${activeClientId}`, placement);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, logo_placement: placement });
    }
  };

  const handleUpdateFacilityLogo = (logo: string) => {
    setFacilityLogoUrl(logo);
    localStorage.setItem(`sh_secure_facility_logo_${activeClientId}`, logo);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, facility_logo: logo });
    }
  };

  const handleUpdateShowFooterLogo = (show: boolean) => {
    setShowFooterLogo(show);
    localStorage.setItem(`sh_secure_show_footer_logo_${activeClientId}`, String(show));
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, show_footer_logo: show });
    }
  };

  const handleUpdateFooterLogo = (logo: string) => {
    setFooterLogoUrl(logo);
    localStorage.setItem(`sh_secure_footer_logo_${activeClientId}`, logo);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, footer_logo: logo });
    }
  };

  const handleUpdateFooterPlacement = (placement: 'LEFT' | 'RIGHT' | 'FULL') => {
    setFooterPlacement(placement);
    localStorage.setItem(`sh_secure_footer_placement_${activeClientId}`, placement);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, footer_placement: placement });
    }
  };

  const handleUpdateShowFooterAddress = (show: boolean) => {
    setShowFooterAddress(show);
    localStorage.setItem(`sh_secure_show_footer_address_${activeClientId}`, String(show));
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, show_footer_address: show });
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFooter = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isFooter) {
            handleUpdateFooterLogo(reader.result);
          } else {
            handleUpdateFacilityLogo(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedRef = localStorage.getItem(`sh_secure_doc_ref_${activeClientId}`);
    setDocRef(savedRef || `SH-PSA-2026-${client?.client_code || 'COMPLIANCE'}`);

    const savedClass = localStorage.getItem(`sh_secure_classification_${activeClientId}`);
    if (savedClass) {
      if (savedClass === 'INTERNAL STRICT SECURE') setClassification('CONFIDENTIAL');
      else if (savedClass === 'RESTRICTED COMPLIANCE') setClassification('RESTRICTED');
      else setClassification(savedClass);
    } else {
      setClassification('CONFIDENTIAL');
    }

    const savedIssue = localStorage.getItem(`sh_secure_issue_date_${activeClientId}`);
    setIssueDate(savedIssue || new Date().toISOString().split('T')[0]);

    const savedAppr = localStorage.getItem(`sh_secure_approved_date_${activeClientId}`);
    setApprovedDate(savedAppr || new Date().toISOString().split('T')[0]);

    // Load zones list for this client
    const savedZones = localStorage.getItem(`sh_secure_zones_list_${activeClientId}`);
    if (savedZones) {
      try {
        setZones(JSON.parse(savedZones));
      } catch (e) {
        console.error(e);
        setZones(DEFAULT_ZONES);
      }
    } else {
      setZones(DEFAULT_ZONES);
    }

    // Load custom outsource locations
    const saved4 = localStorage.getItem(`sh_secure_outsource_zone_4_${activeClientId}`);
    const saved3 = localStorage.getItem(`sh_secure_outsource_zone_3_${activeClientId}`);
    const saved2 = localStorage.getItem(`sh_secure_outsource_zone_2_${activeClientId}`);
    const saved1 = localStorage.getItem(`sh_secure_outsource_zone_1_${activeClientId}`);
    
    const policyBoundaries = getPolicyBoundaries();
    
    setOutsourceZone4(saved4 || policyBoundaries?.zone4 || 'Reception waiting Area, Lobby');
    setOutsourceZone3(saved3 || policyBoundaries?.zone3 || 'Consultation Room, Treatment room');
    setOutsourceZone2(saved2 || policyBoundaries?.zone2 || 'Admin Room, OPG Room');
    setOutsourceZone1(saved1 || policyBoundaries?.zone1 || 'Server-cabinet, IT Server Room');

    // Load version history for this client
    const savedVerHist = localStorage.getItem(`sh_secure_version_history_${activeClientId}`);
    if (savedVerHist) {
      try {
        setVersionHistory(JSON.parse(savedVerHist));
      } catch (e) {
        console.error(e);
        const fallback = client?.version_history && client.version_history.length > 0 
          ? client.version_history 
          : [
              { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
            ];
        setVersionHistory(fallback);
      }
    } else {
      const fallback = client?.version_history && client.version_history.length > 0 
        ? client.version_history 
        : [
            { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
          ];
      setVersionHistory(fallback);
    }

    // Sync Branding Configuration for this client
    const savedHeaderMode = localStorage.getItem(`sh_secure_header_mode_${activeClientId}`);
    setHeaderDisplayMode((savedHeaderMode as any) || client?.header_display_mode || 'BOTH');

    const savedPlacement = localStorage.getItem(`sh_secure_logo_placement_${activeClientId}`);
    setLogoPlacement((savedPlacement as any) || client?.logo_placement || 'LEFT');

    const savedLogo = localStorage.getItem(`sh_secure_facility_logo_${activeClientId}`);
    setFacilityLogoUrl(savedLogo || client?.facility_logo || PRESET_LOGOS[0].value);

    const savedShowFootLogo = localStorage.getItem(`sh_secure_show_footer_logo_${activeClientId}`);
    setShowFooterLogo(savedShowFootLogo !== null ? savedShowFootLogo === 'true' : (client?.show_footer_logo !== false));

    const savedFooterLogo = localStorage.getItem(`sh_secure_footer_logo_${activeClientId}`);
    setFooterLogoUrl(savedFooterLogo || client?.footer_logo || client?.facility_logo || PRESET_LOGOS[0].value);

    const savedFooterPlacement = localStorage.getItem(`sh_secure_footer_placement_${activeClientId}`);
    setFooterPlacement((savedFooterPlacement as any) || client?.footer_placement || 'LEFT');

    const savedShowAddr = localStorage.getItem(`sh_secure_show_footer_address_${activeClientId}`);
    setShowFooterAddress(savedShowAddr !== null ? savedShowAddr === 'true' : (client?.show_footer_address !== false));

    // Pre-populate dynamic email settings
    const savedEmail = client?.owner_email || client?.email || '';
    setRecipientEmail(savedEmail);
    setEmailSubject(`[COMPLIANCE REPORT] Physical Security Zones & Designated Secure Areas`);
    setEmailMessage(`Dear Administrator,\n\nPlease find attached the official high-fidelity Compliance Registry Report for Physical & Environmental Security Boundaries for your facility, compiled and signed off. Any inquiries regarding active access privileges can be directed to the Facility Compliance Security Administrator.`);
  }, [activeClientId, client]);

  const handleSaveDocRef = (val: string) => {
    setDocRef(val);
    localStorage.setItem(`sh_secure_doc_ref_${activeClientId}`, val);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, doc_ref: val });
    }
  };
  const handleSaveClassification = (val: string) => {
    setClassification(val);
    localStorage.setItem(`sh_secure_classification_${activeClientId}`, val);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, doc_classification: val });
    }
  };
  const handleSaveIssueDate = (val: string) => {
    setIssueDate(val);
    localStorage.setItem(`sh_secure_issue_date_${activeClientId}`, val);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, doc_issue_date: val });
    }
  };
  const handleSaveApprovedDate = (val: string) => {
    setApprovedDate(val);
    localStorage.setItem(`sh_secure_approved_date_${activeClientId}`, val);
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, doc_approved_date: val });
    }
  };

  const handleAddVersion = (newVer: { version: string; date: string; author: string; changes: string; }) => {
    const nextVerHistory = [...versionHistory, newVer];
    setVersionHistory(nextVerHistory);
    localStorage.setItem(`sh_secure_version_history_${activeClientId}`, JSON.stringify(nextVerHistory));
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, version_history: nextVerHistory, doc_version: newVer.version });
    }
  };

  const handleDeleteVersion = (index: number) => {
    const nextVerHistory = versionHistory.filter((_, i) => i !== index);
    setVersionHistory(nextVerHistory);
    localStorage.setItem(`sh_secure_version_history_${activeClientId}`, JSON.stringify(nextVerHistory));
    if (client && onUpdateClient) {
      onUpdateClient({ ...client, version_history: nextVerHistory });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return formatDateDMY(dateStr);
  };

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const lastActiveClientId = useRef(activeClientId);

  // Load permissions state from localStorage or default to all empty/all allowed
  const [permissions, setPermissions] = useState<SecureAreaPermission[]>(() => {
    const saved = localStorage.getItem(`sh_secure_permissions_${activeClientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Debounced auto-save to localStorage on change, correctly handling client switching
  useEffect(() => {
    // If the activeClientId prop changed, load the new client's permissions and do not trigger a save
    if (lastActiveClientId.current !== activeClientId) {
      lastActiveClientId.current = activeClientId;
      const saved = localStorage.getItem(`sh_secure_permissions_${activeClientId}`);
      if (saved) {
        try {
          setPermissions(JSON.parse(saved));
        } catch (e) {
          console.error(e);
          setPermissions([]);
        }
      } else {
        setPermissions([]);
      }
      setSaveStatus('saved');
      return;
    }

    // Compare with the exact localStorage value to prevent saving on initial mount or when identical
    const savedStr = localStorage.getItem(`sh_secure_permissions_${activeClientId}`) || '[]';
    const currentStr = JSON.stringify(permissions);

    if (savedStr === currentStr) {
      setSaveStatus('saved');
      return;
    }

    // Trigger debounced saving sequence
    setSaveStatus('saving');

    const timer = setTimeout(() => {
      localStorage.setItem(`sh_secure_permissions_${activeClientId}`, currentStr);
      setSaveStatus('saved');
    }, 800); // 800ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [permissions, activeClientId]);

  const [activeTab, setActiveTab] = useState<'matrix' | 'keys' | 'zone_report' | 'key_report' | 'report'>('matrix');
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingZones, setIsEditingZones] = useState(false);

  // Master Key Register States
  const [keyRegister, setKeyRegister] = useState<MasterKeyRegisterItem[]>(() => {
    const saved = localStorage.getItem(`sh_master_key_register_${activeClientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved master key register', e);
      }
    }
    return DEFAULT_KEY_REGISTER;
  });

  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [keyDigitalFilter, setKeyDigitalFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [editingKeyItem, setEditingKeyItem] = useState<MasterKeyRegisterItem | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<MasterKeyRegisterItem | null>(null);
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [isGroupDeleteModalOpen, setIsGroupDeleteModalOpen] = useState(false);

  const [newKeyForm, setNewKeyForm] = useState<Partial<MasterKeyRegisterItem>>({
    locationName: '',
    keyTagNo: '',
    issueDate: new Date().toISOString().split('T')[0],
    receiverName: '',
    receiverSign: 'Signed (Electronic)',
    returnDate: 'N/A (Active)',
    physicalKeyTagId: '',
    digitalBioAccess: 'No'
  });

  // Sync Master Key Register when active client changes
  useEffect(() => {
    setSelectedKeyIds([]);
    const savedKeys = localStorage.getItem(`sh_master_key_register_${activeClientId}`);
    if (savedKeys) {
      try {
        setKeyRegister(JSON.parse(savedKeys));
      } catch (e) {
        setKeyRegister(DEFAULT_KEY_REGISTER);
      }
    } else {
      setKeyRegister(DEFAULT_KEY_REGISTER);
    }
  }, [activeClientId]);

  const saveKeyRegister = (items: MasterKeyRegisterItem[]) => {
    setKeyRegister(items);
    localStorage.setItem(`sh_master_key_register_${activeClientId}`, JSON.stringify(items));
  };

  const handleSelectKey = (id: string) => {
    setSelectedKeyIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllKeys = () => {
    if (selectedKeyIds.length === filteredKeyRegister.length && filteredKeyRegister.length > 0) {
      setSelectedKeyIds([]);
    } else {
      setSelectedKeyIds(filteredKeyRegister.map(k => k.id));
    }
  };

  const confirmGroupDeleteKeys = () => {
    if (selectedKeyIds.length === 0) return;
    const updated = keyRegister.filter(k => !selectedKeyIds.includes(k.id));
    saveKeyRegister(updated);
    setSelectedKeyIds([]);
    setIsGroupDeleteModalOpen(false);
  };

  const handleToggleDigitalBioAccess = (id: string) => {
    const updated = keyRegister.map(item => {
      if (item.id === id) {
        return {
          ...item,
          digitalBioAccess: (item.digitalBioAccess === 'Yes' ? 'No' : 'Yes') as ('Yes' | 'No')
        };
      }
      return item;
    });
    saveKeyRegister(updated);
  };

  const handleResetKeysToDefault = () => {
    if (confirm('Are you sure you want to reset the Master Key Register to the default 15 records?')) {
      saveKeyRegister(DEFAULT_KEY_REGISTER);
    }
  };

  const handleDeleteKey = (item: MasterKeyRegisterItem) => {
    setKeyToDelete(item);
  };

  const confirmDeleteKey = () => {
    if (!keyToDelete) return;
    const updated = keyRegister.filter(k => k.id !== keyToDelete.id);
    saveKeyRegister(updated);
    setKeyToDelete(null);
  };

  const SAMPLE_LOCATIONS = [
    'Server room',
    'CCTV cabinet',
    'Main Entrance',
    'Consultation Room',
    'Treatment room',
    'Reception desk',
    'Cash Box',
    'Back office',
    'Medical File room'
  ];

  const [customSampleLocations, setCustomSampleLocations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_key_sample_locations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newCustomLocInput, setNewCustomLocInput] = useState('');
  const [showAddLocInput, setShowAddLocInput] = useState(false);

  const handleAddCustomLocation = (locName: string) => {
    const trimmed = locName.trim();
    if (!trimmed) return;
    const allLocs = [...SAMPLE_LOCATIONS, ...customSampleLocations];
    if (!allLocs.includes(trimmed)) {
      const updated = [...customSampleLocations, trimmed];
      setCustomSampleLocations(updated);
      try {
        localStorage.setItem('custom_key_sample_locations', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveEditedKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyItem) return;
    const updated = keyRegister.map(k => k.id === editingKeyItem.id ? editingKeyItem : k);
    saveKeyRegister(updated);
    setEditingKeyItem(null);
  };

  const handleCreateNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.locationName || !newKeyForm.keyTagNo) {
      alert('Please fill in at least Location/Serial No and Key Tag No.');
      return;
    }
    const nextSl = keyRegister.length > 0 ? Math.max(...keyRegister.map(k => k.slNo)) + 1 : 1;
    const createdItem: MasterKeyRegisterItem = {
      id: `mk-${Date.now()}`,
      slNo: nextSl,
      locationName: newKeyForm.locationName || '',
      keyTagNo: newKeyForm.keyTagNo || '',
      issueDate: newKeyForm.issueDate || new Date().toISOString().split('T')[0],
      receiverName: newKeyForm.receiverName || 'Unassigned',
      receiverSign: newKeyForm.receiverSign || 'Signed (Electronic)',
      returnDate: newKeyForm.returnDate || 'N/A (Active)',
      physicalKeyTagId: newKeyForm.physicalKeyTagId || `TAG-${newKeyForm.keyTagNo}`,
      digitalBioAccess: (newKeyForm.digitalBioAccess === 'Yes' ? 'Yes' : 'No')
    };
    saveKeyRegister([...keyRegister, createdItem]);
    setIsAddKeyModalOpen(false);
    setNewKeyForm({
      locationName: '',
      keyTagNo: '',
      issueDate: new Date().toISOString().split('T')[0],
      receiverName: '',
      receiverSign: 'Signed (Electronic)',
      returnDate: 'N/A (Active)',
      physicalKeyTagId: '',
      digitalBioAccess: 'No'
    });
  };

  const handleExportKeysCSV = () => {
    const headers = ['Sl No', 'Location / Key Serial No', 'Key Tag No', 'Issue Date', 'Receiver Name', 'Receiver Sign', 'Return Date', 'Physical Key Tag ID', 'Digital / Bio Access'];
    const rows = keyRegister.map(k => [
      k.slNo,
      `"${k.locationName.replace(/"/g, '""')}"`,
      `"${k.keyTagNo}"`,
      k.issueDate,
      `"${k.receiverName.replace(/"/g, '""')}"`,
      `"${k.receiverSign.replace(/"/g, '""')}"`,
      `"${k.returnDate.replace(/"/g, '""')}"`,
      `"${k.physicalKeyTagId}"`,
      k.digitalBioAccess
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Key_Register_${client?.client_code || 'FACILITY'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Master Key items based on search term & digital filter
  const filteredKeyRegister = keyRegister.filter(item => {
    const matchesSearch = 
      item.locationName.toLowerCase().includes(keySearchTerm.toLowerCase()) ||
      item.keyTagNo.toLowerCase().includes(keySearchTerm.toLowerCase()) ||
      item.receiverName.toLowerCase().includes(keySearchTerm.toLowerCase()) ||
      item.physicalKeyTagId.toLowerCase().includes(keySearchTerm.toLowerCase());

    const matchesFilter = 
      keyDigitalFilter === 'ALL' ||
      (keyDigitalFilter === 'YES' && item.digitalBioAccess === 'Yes') ||
      (keyDigitalFilter === 'NO' && item.digitalBioAccess === 'No');

    return matchesSearch && matchesFilter;
  });

  // Email States
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (client) {
      setRecipientEmail(client.email || client.owner_email || '');
      if (activeTab === 'key_report') {
        setEmailSubject(`Master Key Register - ${client.company_name}`);
        setEmailMessage(`Dear Team,

Please find attached the official Master Key Register & Physical Control Tag Inventory report for designated secure areas under standard physical security guidelines for your facility compliance records.

Best regards,
GRC Compliance Portal`);
      } else {
        setEmailSubject(`Physical Security Zones Report - ${client.company_name}`);
        setEmailMessage(`Dear Team,

Please find attached the official Physical Security Zones & Designated Secure Areas Access Registry report under standard physical security guidelines for your facility compliance records.

Best regards,
GRC Compliance Portal`);
      }
    }
  }, [client, activeClientId, activeTab]);

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
          return '#1e293b'; // Default text color fallback
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

    const resolveClonedStyles = (origEl: HTMLElement, clonedEl: HTMLElement) => {
      try {
        const originalElements = [origEl, ...Array.from(origEl.querySelectorAll('*'))] as HTMLElement[];
        const clonedElements = [clonedEl, ...Array.from(clonedEl.querySelectorAll('*'))] as HTMLElement[];
        
        for (let i = 0; i < originalElements.length; i++) {
          const orig = originalElements[i];
          const clone = clonedElements[i];
          if (!orig || !clone) continue;
          
          const computed = window.getComputedStyle(orig);
          const colorProps = [
            'backgroundColor',
            'color',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'fill',
            'stroke'
          ];
          
          colorProps.forEach(prop => {
            const val = computed[prop as any];
            if (typeof val === 'string' && (
              val.includes('oklch') || 
              val.includes('oklab') || 
              val.includes('color-mix') || 
              val.includes('light-dark')
            )) {
              const resolved = resolveModernColorsInString(val);
              clone.style[prop as any] = resolved;
            }
          });
        }
      } catch (e) {
        console.warn('Error during cloned style resolution:', e);
      }
    };

    try {
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
          const reportCardCloned = clonedDoc.getElementById('print-secure-report-card');
          if (reportCardCloned) {
            resolveClonedStyles(element, reportCardCloned);
          }
        }
      });

      return canvas;
    } catch (err) {
      console.error('Error inside captureHighQualityCanvas:', err);
      return null;
    }
  };

  const handlePrint = async () => {
    const previousTab = activeTab;
    if (previousTab !== 'report') {
      setActiveTab('report');
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    window.print();
    if (previousTab !== 'report') {
      setActiveTab(previousTab);
    }
  };

  const generateHighFidelityPDF = (pdf: jsPDF) => {
    const compName = client?.company_name || 'AL Khaja Medical Center L.L.C';
    const compAddress = client?.address || '0-Floor, Al Seeri Bldg, Al Durri St - Hamdan Bin Mohammed St - next to ADIB Bldg';
    const compLicense = client?.trade_license_no || 'CN-1030053';

    const drawWrappedCentered = (textVal: string, xCenter: number, yTop: number, cellHeight: number = 13, width: number = 21.5) => {
      const lines = pdf.splitTextToSize(textVal, width);
      const totalLinesHeight = lines.length * 2.5;
      const startY = yTop + (cellHeight - (lines.length - 1) * 2.5) / 2 + 0.8;
      lines.forEach((line: string, i: number) => {
        pdf.text(line, xCenter, startY + (i * 2.5), { align: 'center' });
      });
    };

    // Top Brand Logo Icon Vector
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.roundedRect(14, 14, 10, 10, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('G', 17.5, 21); // G for GRC compliance

    // Facility Details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(compName, 28, 18);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(`${compAddress} • TL: ${compLicense}`, 28, 22);

    // Top separator line
    pdf.setLineWidth(0.4);
    pdf.setDrawColor(15, 23, 42); // slate-900
    pdf.line(14, 27, 196, 27);

    // Report Document Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Facility Physical Security Zones & Designated Secure Areas', 105, 34, { align: 'center' });

    // Metadata box
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(14, 39, 182, 13, 'F');
    pdf.setLineWidth(0.15);
    pdf.setDrawColor(203, 213, 225); // slate-200
    pdf.rect(14, 39, 182, 13, 'D');

    // Dividers
    pdf.line(59.5, 39, 59.5, 52);
    pdf.line(105, 39, 105, 52);
    pdf.line(150.5, 39, 150.5, 52);

    // Labels & Values
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text('DOCUMENT REFERENCE', 18, 43);
    pdf.text('ISSUE DATE', 63.5, 43);
    pdf.text('APPROVED DATE', 109, 43);
    pdf.text('CLASSIFICATION LEVEL', 154.5, 43);

    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85); // slate-700
    pdf.text(docRef || 'AKMC-HR-SA-005', 18, 48.5);
    pdf.text(formatDate(issueDate), 63.5, 48.5);
    pdf.text(formatDate(approvedDate), 109, 48.5);
    pdf.text((classification || 'RESTRICTED').toUpperCase(), 154.5, 48.5);

    // Main Table Geometry
    let yPos = 57;
    const colWidths = {
      sl: 10,
      name: 44,
      desig: 36,
      z4: 23,
      z3: 23,
      z2: 23,
      z1: 23
    };

    // Table Header Row
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(14, yPos, 182, 8, 'F');

    // Header column labels
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Sl No', 14 + colWidths.sl / 2, yPos + 5, { align: 'center' });
    pdf.text('Name', 14 + colWidths.sl + 2, yPos + 5);
    pdf.text('DESIGNATION', 14 + colWidths.sl + colWidths.name + 2, yPos + 5);
    pdf.text('Zone 4: Public', 106 + 11.5, yPos + 5, { align: 'center' });
    pdf.text('Zone 3: Work', 129 + 11.5, yPos + 5, { align: 'center' });
    pdf.text('Zone 2: Restricted', 152 + 11.5, yPos + 5, { align: 'center' });
    pdf.text('Zone 1: High Secure', 175 + 11.5, yPos + 5, { align: 'center' });

    yPos += 8;

    // Iterate through active employees
    activeEmployees.forEach((emp, index) => {
      // Dynamic page break
      if (yPos > 238) {
        drawFooter(pdf);
        pdf.addPage();
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`PHYSICAL SECURITY ACCESS REGISTRY LOG (CONTINUED) - ${compName}`, 14, 14);
        pdf.setLineWidth(0.15);
        pdf.setDrawColor(203, 213, 225);
        pdf.line(14, 16.5, 196, 16.5);

        yPos = 20;
        pdf.setFillColor(15, 23, 42);
        pdf.rect(14, yPos, 182, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Sl No', 14 + colWidths.sl / 2, yPos + 5, { align: 'center' });
        pdf.text('Name', 14 + colWidths.sl + 2, yPos + 5);
        pdf.text('DESIGNATION', 14 + colWidths.sl + colWidths.name + 2, yPos + 5);
        pdf.text('Zone 4: Public', 106 + 11.5, yPos + 5, { align: 'center' });
        pdf.text('Zone 3: Work', 129 + 11.5, yPos + 5, { align: 'center' });
        pdf.text('Zone 2: Restricted', 152 + 11.5, yPos + 5, { align: 'center' });
        pdf.text('Zone 1: High Secure', 175 + 11.5, yPos + 5, { align: 'center' });
        
        yPos += 8;
      }

      // Zebra striping
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, yPos, 182, 7.5, 'F');
      }

      // Cell Borders
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(14, yPos, 182, 7.5, 'D');
      
      pdf.line(24, yPos, 24, yPos + 7.5);
      pdf.line(68, yPos, 68, yPos + 7.5);
      pdf.line(104, yPos, 104, yPos + 7.5);
      pdf.line(127, yPos, 127, yPos + 7.5);
      pdf.line(150, yPos, 150, yPos + 7.5);
      pdf.line(173, yPos, 173, yPos + 7.5);

      // Sl No
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`${index + 1}`, 14 + colWidths.sl / 2, yPos + 4.8, { align: 'center' });

      // Name
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(emp.employee_name || 'N/A', 14 + colWidths.sl + 2, yPos + 4.8);

      // Designation
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text((emp.position || 'Employee').toUpperCase(), 14 + colWidths.sl + colWidths.name + 2, yPos + 4.8);

      const currentPermissions = permissions.find(p => p.employeeId === emp.id)?.allowedZones || [];
      const z4Val = currentPermissions.includes('zone_4') ? 'YES' : 'No';
      const z3Val = currentPermissions.includes('zone_3') ? 'YES' : 'No';
      const z2Val = currentPermissions.includes('zone_2') ? 'YES' : 'No';
      const z1Val = currentPermissions.includes('zone_1') ? 'YES' : 'No';

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);

      // Zone 4
      if (z4Val === 'YES') {
        pdf.setTextColor(4, 120, 87);
        pdf.text('YES', 106 + 11.5, yPos + 4.8, { align: 'center' });
      } else {
        pdf.setTextColor(148, 163, 184);
        pdf.text('No', 106 + 11.5, yPos + 4.8, { align: 'center' });
      }

      // Zone 3
      if (z3Val === 'YES') {
        pdf.setTextColor(4, 120, 87);
        pdf.text('YES', 129 + 11.5, yPos + 4.8, { align: 'center' });
      } else {
        pdf.setTextColor(148, 163, 184);
        pdf.text('No', 129 + 11.5, yPos + 4.8, { align: 'center' });
      }

      // Zone 2
      if (z2Val === 'YES') {
        pdf.setTextColor(4, 120, 87);
        pdf.text('YES', 152 + 11.5, yPos + 4.8, { align: 'center' });
      } else {
        pdf.setTextColor(148, 163, 184);
        pdf.text('No', 152 + 11.5, yPos + 4.8, { align: 'center' });
      }

      // Zone 1
      if (z1Val === 'YES') {
        pdf.setTextColor(55, 48, 163);
        pdf.text('YES', 175 + 11.5, yPos + 4.8, { align: 'center' });
      } else {
        pdf.setTextColor(225, 29, 72);
        pdf.text('No', 175 + 11.5, yPos + 4.8, { align: 'center' });
      }

      yPos += 7.5;
    });

    // Special Outsource IT support row
    if (yPos > 234) {
      drawFooter(pdf);
      pdf.addPage();
      yPos = 20;
    }

    const outsourceRowHeight = 13;
    pdf.setFillColor(254, 243, 199);
    pdf.rect(14, yPos, 182, outsourceRowHeight, 'F');
    pdf.setLineWidth(0.15);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(14, yPos, 182, outsourceRowHeight, 'D');

    pdf.setLineWidth(0.1);
    pdf.setDrawColor(217, 119, 6);
    pdf.line(24, yPos, 24, yPos + outsourceRowHeight);
    pdf.line(68, yPos, 68, yPos + outsourceRowHeight);
    pdf.line(104, yPos, 104, yPos + outsourceRowHeight);
    pdf.line(127, yPos, 127, yPos + outsourceRowHeight);
    pdf.line(150, yPos, 150, yPos + outsourceRowHeight);
    pdf.line(173, yPos, 173, yPos + outsourceRowHeight);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('-', 14 + colWidths.sl / 2, yPos + 7.5, { align: 'center' });
    pdf.text('-', 24 + colWidths.name / 2, yPos + 7.5, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('IT SUPPORT (OUT SOURCE COMPS)', 68 + 2, yPos + 5.2);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(55, 48, 163);
    pdf.text('* WITH ESCORT REQUIRED', 68 + 2, yPos + 8.8);

    pdf.setTextColor(15, 23, 42);
    drawWrappedCentered(outsourceZone4 || 'Reception Area', 106 + 11.5, yPos, outsourceRowHeight, 21.5);
    drawWrappedCentered(outsourceZone3 || 'Behind reception desk', 129 + 11.5, yPos, outsourceRowHeight, 21.5);
    drawWrappedCentered(outsourceZone2 || 'CCTV Cabinet', 152 + 11.5, yPos, outsourceRowHeight, 21.5);

    pdf.setTextColor(225, 29, 72);
    drawWrappedCentered(outsourceZone1 || 'CCTV Cabinet access', 175 + 11.5, yPos, outsourceRowHeight, 21.5);

    yPos += outsourceRowHeight + 6;

    // Document Revision History Section for PDF
    if (yPos > 195) {
      drawFooter(pdf);
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Document Revision / Version History', 14, yPos);
    yPos += 3.5;

    // Header of Version table
    pdf.setFillColor(241, 245, 249);
    pdf.rect(14, yPos, 182, 5.5, 'F');
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(14, yPos, 182, 5.5, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('VERSION', 17, yPos + 3.8);
    pdf.text('RELEASE DATE', 38, yPos + 3.8);
    pdf.text('AUTHOR / REVIEWER', 74, yPos + 3.8);
    pdf.text('SUMMARY OF CHANGES / AMENDMENTS', 115, yPos + 3.8);

    yPos += 5.5;

    versionHistory.forEach((v, vIdx) => {
      // Row background
      if (vIdx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, yPos, 182, 6.5, 'F');
      }
      
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(14, yPos, 182, 6.5, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(v.version || '1.0', 17, yPos + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(formatDate(v.date), 38, yPos + 4.5);
      pdf.text((v.author || 'GRC Officer').toUpperCase(), 74, yPos + 4.5);

      pdf.setFontSize(6);
      const changesText = v.changes || 'N/A';
      const splitChanges = pdf.splitTextToSize(changesText, 78);
      pdf.text(splitChanges, 115, yPos + 4.5);

      yPos += 6.5;
    });

    yPos += 6;

    // Signatures and Compliance Paragraph block
    if (yPos > 230) {
      drawFooter(pdf);
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Compliance Verifications', 14, yPos);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    const complianceText = 'Under the jurisdiction of DOH Abu Dhabi and standard guidelines, physical access limits registered in this database log function as formal site security credentials. Audit logs are logged dynamically for security auditing purposes.';
    const splitText = pdf.splitTextToSize(complianceText, 84);
    pdf.text(splitText, 14, yPos + 4.5);

    pdf.setFillColor(248, 250, 252);
    pdf.rect(110, yPos - 3, 86, 23, 'F');
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(110, yPos - 3, 86, 23, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('KEY CUSTODIAN / SECURITY APPROVAL', 114, yPos + 1.5);

    let drewSig = false;
    if (client?.auth_rep_signature) {
      try {
        if (client.auth_rep_signature.startsWith('data:image')) {
          pdf.addImage(client.auth_rep_signature, 'PNG', 114, yPos + 2.5, 45, 8);
          drewSig = true;
        }
      } catch (e) {
        console.warn('Signature graphic rendering failed programmatic fallback, drawing text:', e);
      }
    }
    const authRep = getSyncedAuthorizedRepresentative(client);

    if (!drewSig) {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(authRep.name, 114, yPos + 7.5);
      pdf.setLineWidth(0.15);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(114, yPos + 9.2, 160, yPos + 9.2);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(15, 23, 42);
    pdf.text(authRep.name.toUpperCase(), 114, yPos + 13);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(67, 56, 202);
    pdf.text(`DESIGNATION: ${(authRep.title || 'AUTHORIZED REPRESENTATIVE & COMPLIANCE LEAD').toUpperCase()}`, 114, yPos + 15.8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('FACILITY SECURITY DIRECTOR & KEY CUSTODIAN', 114, yPos + 18.5);

    drawFooter(pdf);
  };

  const drawFooter = (pdf: jsPDF) => {
    const compAddress = client?.address || '0-Floor, Al Seeri Bldg, Al Durri St - Hamdan Bin Mohammed St - next to ADIB Bldg';
    const compPhone = client?.phone || '+971 2 672 0048';
    const compEmail = client?.owner_email || client?.email || 'info@alkhajamedicalcenter.ae';

    pdf.setLineWidth(0.15);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(14, 280, 196, 280);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`TEL: ${compPhone}  •  EMAIL: ${compEmail}  •  ADDR: ${compAddress}, UAE`, 14, 284.5);

    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(183, 281.5, 13, 4, 1, 1, 'F');
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('1/1', 186.5, 284.5);
  };

  const generateMasterKeyPDF = (pdf: jsPDF) => {
    const compName = client?.company_name || 'AL Khaja Medical Center L.L.C';
    const compAddress = client?.address || '0-Floor, Al Seeri Bldg, Al Durri St - Hamdan Bin Mohammed St - next to ADIB Bldg';
    const compLicense = client?.trade_license_no || 'CN-1030053';
    const compPhone = client?.phone || '+971 2 666 4444';
    const compEmail = client?.owner_email || client?.email || 'compliance@facility.ae';

    const drawFooter = (doc: jsPDF) => {
      doc.setLineWidth(0.15);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 280, 196, 280);

      let textX = 14;
      if (showFooterLogo && footerLogoUrl && footerPlacement === 'LEFT') {
        try {
          if (footerLogoUrl.startsWith('data:image/png') || footerLogoUrl.startsWith('data:image/jpeg') || footerLogoUrl.startsWith('data:image/jpg')) {
            const fmt = footerLogoUrl.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(footerLogoUrl, fmt, 14, 281, 12, 6);
            textX = 28;
          }
        } catch (e) {
          console.warn('Footer logo error:', e);
        }
      }

      if (showFooterAddress) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`TEL: ${compPhone}  •  EMAIL: ${compEmail}  •  ADDR: ${compAddress}, UAE`, textX, 284.5);
      }

      if (showFooterLogo && footerLogoUrl && footerPlacement === 'RIGHT') {
        try {
          if (footerLogoUrl.startsWith('data:image/png') || footerLogoUrl.startsWith('data:image/jpeg') || footerLogoUrl.startsWith('data:image/jpg')) {
            const fmt = footerLogoUrl.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(footerLogoUrl, fmt, 168, 281, 12, 6);
          }
        } catch (e) {
          console.warn('Footer logo error:', e);
        }
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(183, 281.5, 13, 4, 1, 1, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text('1/1', 186.5, 284.5);
    };

    // Render Dynamic Page Header & Branding Configuration
    const displayMode = headerDisplayMode;
    const placement = logoPlacement;
    const showLogo = displayMode !== 'TEXT_ONLY';
    const showText = displayMode !== 'LOGO_ONLY';

    const drawLogoOnPdf = (url: string | undefined, x: number, y: number, w: number, h: number) => {
      if (!url) return false;
      try {
        if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
          const fmt = url.includes('image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(url, fmt, x, y, w, h);
          return true;
        }
      } catch (e) {
        console.warn('PDF logo image error:', e);
      }
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('G', x + w / 2 - 1.5, y + h / 2 + 1.5);
      return true;
    };

    if (placement === 'LEFT') {
      let textX = 14;
      if (showLogo && facilityLogoUrl) {
        drawLogoOnPdf(facilityLogoUrl, 14, 13, 12, 12);
        textX = 29;
      }
      if (showText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(compName, textX, 18);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${compAddress} • TL: ${compLicense}`, textX, 22);
      }
    } else if (placement === 'RIGHT') {
      if (showText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(compName, 14, 18);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${compAddress} • TL: ${compLicense}`, 14, 22);
      }
      if (showLogo && facilityLogoUrl) {
        drawLogoOnPdf(facilityLogoUrl, 184, 13, 12, 12);
      }
    } else { // FULL (Centered)
      let yOffset = 14;
      if (showLogo && facilityLogoUrl) {
        drawLogoOnPdf(facilityLogoUrl, 96, 10, 18, 9);
        yOffset = 22;
      }
      if (showText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(compName, 105, yOffset, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${compAddress} • TL: ${compLicense}`, 105, yOffset + 3.5, { align: 'center' });
      }
    }

    pdf.setLineWidth(0.4);
    pdf.setDrawColor(15, 23, 42);
    pdf.line(14, 28, 196, 28);

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Master Key Register — Physical Security Zones & Designated Secure Areas', 105, 34, { align: 'center' });

    // Metadata box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(14, 39, 182, 13, 'F');
    pdf.setLineWidth(0.15);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(14, 39, 182, 13, 'D');

    pdf.line(59.5, 39, 59.5, 52);
    pdf.line(105, 39, 105, 52);
    pdf.line(150.5, 39, 150.5, 52);

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(148, 163, 184);
    pdf.text('DOCUMENT REFERENCE', 18, 43);
    pdf.text('ISSUE DATE', 63.5, 43);
    pdf.text('APPROVED DATE', 109, 43);
    pdf.text('CLASSIFICATION LEVEL', 154.5, 43);

    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(docRef || 'AKMC-MKR-2026', 18, 48.5);
    pdf.text(formatDate(issueDate), 63.5, 48.5);
    pdf.text(formatDate(approvedDate), 109, 48.5);
    pdf.text((classification || 'RESTRICTED').toUpperCase(), 154.5, 48.5);

    let yPos = 57;

    // Policy Banner Box
    pdf.setFillColor(241, 245, 249);
    pdf.rect(14, yPos, 182, 10, 'F');
    pdf.setLineWidth(0.15);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(14, yPos, 182, 10, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Physical Control Tag Inventory & Key Authorization Log', 18, yPos + 4.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Total Registered Keys: ${keyRegister.length}  |  Dual-Auth Bio Locks: ${keyRegister.filter(k => k.digitalBioAccess === 'Yes').length}  |  Physical Locks: ${keyRegister.filter(k => k.digitalBioAccess === 'No').length}`, 18, yPos + 8);

    yPos += 14;

    // Table Header for Key Register
    pdf.setFillColor(15, 23, 42);
    pdf.rect(14, yPos, 182, 6.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text('SL', 16, yPos + 4.5);
    pdf.text('LOCATION / KEY SERIAL NO', 24, yPos + 4.5);
    pdf.text('KEY TAG NO', 78, yPos + 4.5);
    pdf.text('ISSUE DATE', 98, yPos + 4.5);
    pdf.text('RECEIVER NAME & SIGN', 118, yPos + 4.5);
    pdf.text('RETURN', 152, yPos + 4.5);
    pdf.text('TAG ID', 166, yPos + 4.5);
    pdf.text('BIO ACCESS', 182, yPos + 4.5);

    yPos += 6.5;

    keyRegister.forEach((k, kIdx) => {
      if (yPos > 255) {
        drawFooter(pdf);
        pdf.addPage();
        yPos = 20;

        pdf.setFillColor(15, 23, 42);
        pdf.rect(14, yPos, 182, 6.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(255, 255, 255);
        pdf.text('SL', 16, yPos + 4.5);
        pdf.text('LOCATION / KEY SERIAL NO', 24, yPos + 4.5);
        pdf.text('KEY TAG NO', 78, yPos + 4.5);
        pdf.text('ISSUE DATE', 98, yPos + 4.5);
        pdf.text('RECEIVER NAME & SIGN', 118, yPos + 4.5);
        pdf.text('RETURN', 152, yPos + 4.5);
        pdf.text('TAG ID', 166, yPos + 4.5);
        pdf.text('BIO ACCESS', 182, yPos + 4.5);
        yPos += 6.5;
      }

      if (kIdx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, yPos, 182, 6, 'F');
      }
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(14, yPos, 182, 6, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${k.slNo}`, 16, yPos + 4.2);

      pdf.setFont('helvetica', 'normal');
      pdf.text(k.locationName.length > 28 ? k.locationName.substring(0, 26) + '..' : k.locationName, 24, yPos + 4.2);
      pdf.setFont('courier', 'bold');
      pdf.text(k.keyTagNo, 78, yPos + 4.2);
      pdf.setFont('helvetica', 'normal');
      pdf.text(k.issueDate, 98, yPos + 4.2);
      pdf.text(`${k.receiverName} (${k.receiverSign})`.length > 22 ? `${k.receiverName}`.substring(0, 20) + '..' : `${k.receiverName} (${k.receiverSign})`, 118, yPos + 4.2);
      pdf.text(k.returnDate || '-', 152, yPos + 4.2);
      pdf.setFont('courier', 'normal');
      pdf.text(k.physicalKeyTagId, 166, yPos + 4.2);

      pdf.setFont('helvetica', 'bold');
      if (k.digitalBioAccess === 'Yes') {
        pdf.setTextColor(4, 120, 87);
        pdf.text('Yes', 182, yPos + 4.2);
      } else {
        pdf.setTextColor(100, 116, 139);
        pdf.text('No', 182, yPos + 4.2);
      }

      yPos += 6;
    });

    yPos += 6;

    // Document Revision History Section for Key Register PDF
    if (yPos > 195) {
      drawFooter(pdf);
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Document Revision / Version History', 14, yPos);
    yPos += 3.5;

    pdf.setFillColor(241, 245, 249);
    pdf.rect(14, yPos, 182, 5.5, 'F');
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(14, yPos, 182, 5.5, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('VERSION', 17, yPos + 3.8);
    pdf.text('RELEASE DATE', 38, yPos + 3.8);
    pdf.text('AUTHOR / REVIEWER', 74, yPos + 3.8);
    pdf.text('SUMMARY OF CHANGES / AMENDMENTS', 115, yPos + 3.8);

    yPos += 5.5;

    versionHistory.forEach((v, vIdx) => {
      if (vIdx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, yPos, 182, 6.5, 'F');
      }
      
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(14, yPos, 182, 6.5, 'D');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(v.version || '1.0', 17, yPos + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(formatDate(v.date), 38, yPos + 4.5);
      pdf.text((v.author || 'GRC Officer').toUpperCase(), 74, yPos + 4.5);

      pdf.setFontSize(6);
      const changesText = v.changes || 'N/A';
      const splitChanges = pdf.splitTextToSize(changesText, 78);
      pdf.text(splitChanges, 115, yPos + 4.5);

      yPos += 6.5;
    });

    yPos += 6;

    // Signatures
    if (yPos > 230) {
      drawFooter(pdf);
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Compliance Verifications & Key Custody Certification', 14, yPos);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    const complianceText = 'Under the jurisdiction of DOH Abu Dhabi and standard guidelines, physical keys and biometric control tags listed in this Master Key Register function as certified facility security controls. Audit logs are recorded dynamically.';
    const splitText = pdf.splitTextToSize(complianceText, 84);
    pdf.text(splitText, 14, yPos + 4.5);

    pdf.setFillColor(248, 250, 252);
    pdf.rect(110, yPos - 3, 86, 23, 'F');
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(110, yPos - 3, 86, 23, 'D');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('KEY CUSTODIAN / SECURITY APPROVAL', 114, yPos + 1.5);

    let drewSig = false;
    if (client?.auth_rep_signature) {
      try {
        if (client.auth_rep_signature.startsWith('data:image')) {
          pdf.addImage(client.auth_rep_signature, 'PNG', 114, yPos + 2.5, 45, 8);
          drewSig = true;
        }
      } catch (e) {
        console.warn('Signature graphic rendering failed:', e);
      }
    }
    const authRep = getSyncedAuthorizedRepresentative(client);

    if (!drewSig) {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(10.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(authRep.name, 114, yPos + 7.5);
      pdf.setLineWidth(0.15);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(114, yPos + 9.2, 160, yPos + 9.2);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(15, 23, 42);
    pdf.text(authRep.name.toUpperCase(), 114, yPos + 13);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(67, 56, 202);
    pdf.text(`DESIGNATION: ${(authRep.title || 'AUTHORIZED REPRESENTATIVE & COMPLIANCE LEAD').toUpperCase()}`, 114, yPos + 15.8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('FACILITY SECURITY DIRECTOR & KEY CUSTODIAN', 114, yPos + 18.5);

    drawFooter(pdf);
  };

  const generatePDFBase64 = async (): Promise<string | null> => {
    const isKeyReport = activeTab === 'key_report';
    const targetTab = isKeyReport ? 'key_report' : 'zone_report';
    const previousTab = activeTab;

    if (previousTab !== targetTab && previousTab !== 'report') {
      setActiveTab(targetTab);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      if (isKeyReport) {
        generateMasterKeyPDF(pdf);
      } else {
        generateHighFidelityPDF(pdf);
      }

      const b64 = pdf.output('datauristring').split(',')[1];
      
      if (previousTab !== targetTab && previousTab !== 'report') {
        setActiveTab(previousTab);
      }
      return b64;
    } catch (e) {
      console.error('Error generating PDF Base64:', e);
      if (previousTab !== targetTab && previousTab !== 'report') {
        setActiveTab(previousTab);
      }
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    const isKeyReport = activeTab === 'key_report';
    const targetTab = isKeyReport ? 'key_report' : 'zone_report';
    const previousTab = activeTab;

    if (previousTab !== targetTab && previousTab !== 'report') {
      setActiveTab(targetTab);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      if (isKeyReport) {
        generateMasterKeyPDF(pdf);
        pdf.save(`Master_Key_Register_${client?.client_code || 'COMPLIANCE'}.pdf`);
      } else {
        generateHighFidelityPDF(pdf);
        pdf.save(`Secure_Areas_Report_${client?.client_code || 'COMPLIANCE'}.pdf`);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
      if (previousTab !== targetTab && previousTab !== 'report') {
        setActiveTab(previousTab);
      }
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) return;
    setIsEmailing(true);
    setEmailStatus('idle');
    setEmailError(null);

    try {
      // 1. Fetch SMTP configuration
      const smtpRaw = localStorage.getItem('sh_smtp');
      let smtpConfig = null;
      if (smtpRaw) {
        try {
          smtpConfig = JSON.parse(smtpRaw);
        } catch (e) {
          console.error('Failed to parse SMTP configuration', e);
        }
      }

      // Safe fallback simulation configuration
      if (!smtpConfig) {
        smtpConfig = {
          server: 'smtp.gmail.com',
          port: 587,
          username: '',
          password: '',
          ssl: false,
          tls: true,
          sender_email: 'support@grcportal.ae',
          sandbox_mode: false
        };
      }

      // 2. Generate PDF Base64
      const pdfBase64 = await generatePDFBase64();
      if (!pdfBase64) {
        throw new Error('Could not capture report element to generate PDF file.');
      }

      // 3. Compose HTML body
      const formattedClientName = client?.company_name || 'SmartPro';
      const htmlBody = `
        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; text-align: left;">
            <span style="font-size: 10px; font-weight: 800; color: #ffffff; background-color: #0f172a; padding: 4px 8px; text-transform: uppercase; border-radius: 4px; letter-spacing: 0.05em;">Physical Security Registry</span>
            <h2 style="color: #0f172a; margin-top: 10px; margin-bottom: 2px; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">Secure Areas Physical Access Registry</h2>
            <p style="font-size: 11px; color: #4f46e5; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Official Regulatory Compliance Report</p>
          </div>
          
          <div style="font-size: 14px; line-height: 1.6; color: #334155;">
            <p style="margin-top: 0;">Dear Administrator / Security Director,</p>
            <p>${emailMessage.replace(/\n/g, '<br />')}</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">Document Information</span>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; width: 140px; color: #64748b;">Facility Name:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${formattedClientName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Document Ref:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #4f46e5; font-weight: 700;">${docRef}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Classification:</td>
                  <td style="padding: 4px 0; color: #be123c; font-weight: 700; text-transform: uppercase;">${classification}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Approved Date:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-family: monospace;">${formatDate(approvedDate)}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 25px;">
              The signed physical access log is attached directly to this email as a high-fidelity, print-ready PDF file conforming to DOH Abu Dhabi and ISO 27001 physical security guidelines.
            </p>
            
            <p style="font-size: 14px; margin-bottom: 0;">Sincerely,<br /><strong>Governance, Risk & Compliance Support Team</strong></p>
          </div>
          
          <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; font-size: 10px; color: #94a3b8; text-align: center;">
            This is an automated transmission dispatched from your secure custom GRC SMTP relay gateway.
          </div>
        </div>
      `;

      // 4. Send API request
      const res = await fetch('/api/send-compliance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          recipientEmails: recipientEmail.split(',').map(e => e.trim()).filter(Boolean),
          subject: emailSubject,
          message: `The high-fidelity PDF report of the Secure Areas access registry was compiled and successfully dispatched. Ref: ${docRef}`,
          htmlContent: htmlBody,
          pdfAttachment: pdfBase64
        })
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned non-JSON response (status ${res.status}): ${responseText.substring(0, 150)}`);
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to dispatch email over SMTP relay gateway.');
      }

      setEmailStatus('success');
    } catch (err: any) {
      console.error('Email sending failed:', err);
      setEmailStatus('error');
      setEmailError(err.message || 'Failed to send compliance email.');
    } finally {
      setIsEmailing(false);
    }
  };

  // Filter only active employees for the active client
  const activeEmployees = employees.filter(
    emp => emp.client_id === activeClientId && emp.current_status === 'Active'
  );

  // Get departments list for filtering
  const departments = Array.from(new Set(activeEmployees.map(e => e.department).filter(Boolean)));

  // Filter list based on search and department selection
  const filteredEmployees = activeEmployees.filter(emp => {
    const matchesSearch = 
      emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });

  // Toggle single permission check
  const handleTogglePermission = (employeeId: string, zoneId: string) => {
    setPermissions(prev => {
      const existingIdx = prev.findIndex(p => p.employeeId === employeeId);
      if (existingIdx > -1) {
        return prev.map((p, idx) => {
          if (idx === existingIdx) {
            const allowed = p.allowedZones;
            const updatedAllowed = allowed.includes(zoneId)
              ? allowed.filter(z => z !== zoneId)
              : [...allowed, zoneId];
            return { ...p, allowedZones: updatedAllowed };
          }
          return p;
        });
      } else {
        // Create new entry
        return [...prev, { employeeId, allowedZones: [zoneId] }];
      }
    });
  };

  // Check if an employee is allowed in a zone
  const isAllowed = (employeeId: string, zoneId: string) => {
    const perm = permissions.find(p => p.employeeId === employeeId);
    return perm ? perm.allowedZones.includes(zoneId) : false;
  };

  // Toggle All zones for a single employee
  const handleToggleAllForEmployee = (employeeId: string, checkAll: boolean) => {
    setPermissions(prev => {
      const filtered = prev.filter(p => p.employeeId !== employeeId);
      if (checkAll) {
        const allZoneIds = zones.map((z: any) => z.id);
        return [...filtered, { employeeId, allowedZones: allZoneIds }];
      } else {
        return [...filtered, { employeeId, allowedZones: [] }];
      }
    });
  };

  // Check if all filtered employees are allowed in a zone
  const isAllSelectedForZone = (zoneId: string) => {
    if (filteredEmployees.length === 0) return false;
    return filteredEmployees.every(emp => isAllowed(emp.id, zoneId));
  };

  // Check if no filtered employees are allowed in a zone
  const isNoneSelectedForZone = (zoneId: string) => {
    if (filteredEmployees.length === 0) return false;
    return filteredEmployees.every(emp => !isAllowed(emp.id, zoneId));
  };

  // Bulk toggle for a specific zone column across all filtered employees
  const handleBulkZonePermissions = (zoneId: string, allowAll: boolean) => {
    setPermissions(prev => {
      const updated = [...prev];
      filteredEmployees.forEach(emp => {
        const existingIdx = updated.findIndex(p => p.employeeId === emp.id);
        if (existingIdx > -1) {
          const allowed = updated[existingIdx].allowedZones;
          const hasZone = allowed.includes(zoneId);
          if (allowAll && !hasZone) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              allowedZones: [...allowed, zoneId]
                };
          } else if (!allowAll && hasZone) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              allowedZones: allowed.filter(z => z !== zoneId)
            };
          }
        } else {
          if (allowAll) {
            updated.push({
              employeeId: emp.id,
              allowedZones: [zoneId]
            });
          }
        }
      });
      return updated;
    });
  };

  return (
    <div className="space-y-6" id="secure-area-module">
      {/* Title Header with Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center pointer-events-none pr-8">
          <Shield className="w-64 h-64 text-emerald-500" />
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase rounded-full tracking-wider">
            Physical Security Standard
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Physical &amp; Environmental Security
          </span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight uppercase">
          Facility Physical Security Zones &amp; Designated Secure Areas
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Manage, audit, and authorize physical site access permissions for active personnel within designated secure facility zones. 
          This access control grid is synchronized directly with your <strong className="text-emerald-400">Employee &amp; Operator HR Roster</strong>, maintaining strict compliance with DOH Abu Dhabi and ISO 27001 requirements.
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-500" />
            <span>Facility Scope: <strong className="text-white">{client?.company_name || 'Active Client'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Active Personnel: <strong className="text-white">{activeEmployees.length} registered</strong></span>
          </div>
          <div id="secure-area-metadata-badges" className="flex flex-wrap items-center gap-1.5 ml-auto">
            <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 text-[10px] font-mono font-bold">
              Ref: {docRef}
            </span>
            <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono font-bold">
              Ver: {versionHistory[versionHistory.length - 1]?.version || client?.doc_version || 'v1.0'}
            </span>
            <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 text-[10px] font-mono font-bold">
              {classification}
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">
              Issue: {issueDate}
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono">
              Approved: {approvedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-600" />
          Interactive Access Matrix
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'keys'
              ? 'border-amber-600 text-amber-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-600" />
          Master Key Register
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black">
            {keyRegister.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('zone_report')}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'zone_report' || activeTab === 'report'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          📄 Designated Secure Areas Report
        </button>
        <button
          onClick={() => setActiveTab('key_report')}
          className={`flex items-center gap-2 py-3 px-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'key_report'
              ? 'border-amber-600 text-amber-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-600" />
          📄 Master Key Register Report
        </button>
      </div>


      {activeTab === 'matrix' ? (
        <>
          {/* POL-SEC-013 Interactive Summary Sheet Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">Physical Security Policy</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    1. Objective &amp; Authorization
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    To prevent unauthorized physical access, damage, and interference to organization information processing facilities. Access to designated areas is restricted solely to authorized personnel based on operational requirements.
                  </p>
                </div>

                <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    2. Audit &amp; Control Logs
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    Every physical entry and exit into a high-security zone (such as Server Rooms and Archive Rooms) must be recorded, verified against this active authorization registry, and reviewed monthly by the Facility Security Officer.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Zone Definitions List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Zone Definitions (Physical Security)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingZones(!isEditingZones)}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase cursor-pointer"
                >
                  {isEditingZones ? 'Cancel' : 'Edit Zones'}
                </button>
              </div>

              {isEditingZones ? (
                <div className="space-y-3 text-left">
                  {zones.map((z: any) => {
                    let locValue = outsourceZone4;
                    let setLoc = setOutsourceZone4;
                    let locKey = `sh_secure_outsource_zone_4_${activeClientId}`;
                    if (z.id === 'zone_3') { locValue = outsourceZone3; setLoc = setOutsourceZone3; locKey = `sh_secure_outsource_zone_3_${activeClientId}`; }
                    if (z.id === 'zone_2') { locValue = outsourceZone2; setLoc = setOutsourceZone2; locKey = `sh_secure_outsource_zone_2_${activeClientId}`; }
                    if (z.id === 'zone_1') { locValue = outsourceZone1; setLoc = setOutsourceZone1; locKey = `sh_secure_outsource_zone_1_${activeClientId}`; }

                    return (
                      <div key={z.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                        <span className="font-bold text-[10px] text-indigo-600 uppercase">{z.id.replace('_', ' ')} Settings</span>
                        <input
                          type="text"
                          value={z.name}
                          onChange={(e) => {
                            const updated = zones.map(item => item.id === z.id ? { ...item, name: e.target.value } : item);
                            setZones(updated);
                            localStorage.setItem(`sh_secure_zones_list_${activeClientId}`, JSON.stringify(updated));
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                          placeholder="Zone Name"
                        />
                        <input
                          type="text"
                          value={z.desc}
                          onChange={(e) => {
                            const updated = zones.map(item => item.id === z.id ? { ...item, desc: e.target.value } : item);
                            setZones(updated);
                            localStorage.setItem(`sh_secure_zones_list_${activeClientId}`, JSON.stringify(updated));
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-500 focus:border-indigo-500 focus:outline-none"
                          placeholder="Zone Description"
                        />
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Outsource Escort Location</label>
                          <input
                            type="text"
                            value={locValue}
                            onChange={(e) => {
                              setLoc(e.target.value);
                              localStorage.setItem(locKey, e.target.value);
                            }}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] italic text-slate-700 font-medium focus:border-indigo-500 focus:outline-none"
                            placeholder="Escort location"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsEditingZones(false)}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                  >
                    Save &amp; Close Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {zones.map((z: any) => {
                    let locValue = outsourceZone4;
                    if (z.id === 'zone_3') locValue = outsourceZone3;
                    if (z.id === 'zone_2') locValue = outsourceZone2;
                    if (z.id === 'zone_1') locValue = outsourceZone1;

                    return (
                      <div key={z.id} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors text-left space-y-0.5">
                        <p className="font-bold text-[11px] text-slate-800 leading-tight">{z.name}</p>
                        <p className="text-[10px] text-slate-400 leading-snug">{z.desc}</p>
                        <p className="text-[9px] text-slate-500 italic bg-amber-50/50 border border-amber-100 px-1.5 py-0.5 rounded mt-1.5">
                          Outsource Area: <strong className="text-slate-700">{locValue}</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Control Filters Area */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 w-full sm:w-64 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search Name, Designation or ID..."
                  className="text-xs text-slate-700 bg-transparent focus:outline-none w-full"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select 
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Counter Info & Auto-save status */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/40 px-2.5 py-0.5 rounded-md animate-pulse">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                  <span>Saving changes...</span>
                </div>
              ) : saveStatus === 'saved' ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-200/30 px-2.5 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                  <span>All changes auto-saved</span>
                </div>
              ) : null}
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Showing <span className="text-slate-800">{filteredEmployees.length}</span> of {activeEmployees.length} Active Employees
              </div>
            </div>
          </div>

          {/* Permissions Grid Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[240px]">Employee details</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[140px]">Department</th>
                      {zones.map((z: any) => {
                        const allSelected = isAllSelectedForZone(z.id);
                        const noneSelected = isNoneSelectedForZone(z.id);
                        return (
                          <th key={z.id} className="p-4 text-[10.5px] font-bold text-slate-700 text-center uppercase tracking-wider select-none bg-slate-50/20 border-r border-slate-100 last:border-r-0" title={z.desc}>
                            <div className="flex flex-col items-center">
                              <span className="text-indigo-600 block mb-0.5">{z.name.split(':')[0]}</span>
                              <span className="text-[9px] text-slate-400 font-medium normal-case block max-w-[100px] truncate" title={z.name.split(': ')[1] || z.name}>
                                {z.name.split(': ')[1] || z.name}
                              </span>
                              
                              {/* Bulk Permission Checkboxes */}
                              <div className="flex items-center gap-2.5 mt-2.5 pt-1.5 border-t border-slate-200/50 w-full justify-center">
                                <label className="inline-flex items-center gap-1 cursor-pointer select-none group" title="Select All for this Zone">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) => handleBulkZonePermissions(z.id, e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3 cursor-pointer accent-emerald-600"
                                  />
                                  <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-tight transition-colors">All</span>
                                </label>
                                
                                <label className="inline-flex items-center gap-1 cursor-pointer select-none group" title="Deselect All for this Zone">
                                  <input
                                    type="checkbox"
                                    checked={noneSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleBulkZonePermissions(z.id, false);
                                      } else {
                                        handleBulkZonePermissions(z.id, true);
                                      }
                                    }}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3 w-3 cursor-pointer accent-rose-600"
                                  />
                                  <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-tight transition-colors">None</span>
                                </label>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Batch actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredEmployees.map(emp => {
                      const currentPermissions = permissions.find(p => p.employeeId === emp.id)?.allowedZones || [];
                      const allTicked = zones.every((z: any) => currentPermissions.includes(z.id));
                      const anyTicked = zones.some((z: any) => currentPermissions.includes(z.id));
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Name & Title */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                anyTicked ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-150 text-slate-500'
                              }`}>
                                {emp.employee_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{emp.employee_name}</span>
                                  {anyTicked ? (
                                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Active secure permissions" />
                                  ) : (
                                    <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full" title="No secure permissions" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1.5">
                                  <span>{emp.position}</span>
                                  <span className="text-slate-350">•</span>
                                  <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.2 rounded text-slate-500">{emp.employee_id}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="p-4">
                            <span className="px-2 py-0.8 bg-slate-100 text-slate-600 font-bold rounded-md uppercase text-[9.5px]">
                              {emp.department || 'N/A'}
                            </span>
                          </td>

                          {/* Secure Zones Tick Options */}
                          {zones.map((z: any) => {
                            const checked = isAllowed(emp.id, z.id);
                            return (
                              <td key={z.id} className="p-4 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-slate-100/65 group transition-all">
                                  <input 
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePermission(emp.id, z.id)}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    checked 
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                      : 'border-slate-300 bg-white group-hover:border-indigo-500 text-transparent'
                                  }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </div>
                                </label>
                              </td>
                            );
                          })}

                          {/* Toggle All For This Employee */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleAllForEmployee(emp.id, !allTicked)}
                                className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer border ${
                                  allTicked 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {allTicked ? 'Clear All' : 'Allow All'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No active employees found matching the filter criteria.</p>
                <p className="text-[10px] text-slate-400">
                  Please register employees in the <strong className="text-indigo-600">Employee HR Roster</strong> first.
                </p>
              </div>
            )}
          </div>

          {/* Compliance Note Info Banner */}
          <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-amber-900 uppercase tracking-wide">DOH Abu Dhabi &amp; ISO 27001 Compliance Integration Guide</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                This digital log functions as your legally binding <strong className="text-amber-900">Physical Site Authorization Log</strong> under standard physical security guidelines. 
                Auditors can verify individual credentials by checking this registry against real-time card access scanner database logs. Any modifications made here are recorded securely inside the system audits log.
              </p>
            </div>
          </div>
        </>
      ) : activeTab === 'keys' ? (
        /* Master Key Register Tab View */
        <div className="space-y-6 text-left">
          {/* Key Register KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Key Tags Issued</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{keyRegister.length}</p>
                <p className="text-[10px] text-slate-400 font-medium">Physical Key Inventory</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Digital / Bio Access</p>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">
                  {keyRegister.filter(k => k.digitalBioAccess === 'Yes').length}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">Dual Authentication Enabled</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Lock className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Physical Key Only</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">
                  {keyRegister.filter(k => k.digitalBioAccess === 'No').length}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Standard Lock &amp; Key</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Register Compliance</p>
                <p className="text-2xl font-black text-indigo-900 mt-0.5">100%</p>
                <p className="text-[10px] text-indigo-600 font-medium">Physical Security Verified</p>
              </div>
            </div>
          </div>

          {/* Action Bar & Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-72 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={keySearchTerm}
                  onChange={e => setKeySearchTerm(e.target.value)}
                  placeholder="Search Location, Key Tag No, Receiver..."
                  className="text-xs text-slate-800 bg-transparent focus:outline-none w-full font-medium"
                />
                {keySearchTerm && (
                  <button onClick={() => setKeySearchTerm('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>

              {/* Digital/Bio Access Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={keyDigitalFilter}
                  onChange={e => setKeyDigitalFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer w-full sm:w-auto font-sans"
                >
                  <option value="ALL">All Key Types</option>
                  <option value="YES">Digital / Bio Access Enabled (Yes)</option>
                  <option value="NO">Physical Key Only (No)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleResetKeysToDefault}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
                title="Reset register to initial 15 key records"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={handleExportKeysCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => setIsAddKeyModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-emerald-500"
              >
                <Plus className="w-4 h-4" />
                Add Key Register Entry
              </button>
            </div>
          </div>

          {/* Master Key Register Data Table Card */}
          {selectedKeyIds.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
                <span className="text-xs font-bold text-amber-900">
                  {selectedKeyIds.length} Key Record{selectedKeyIds.length > 1 ? 's' : ''} Selected for Group Action
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedKeyIds([])}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroupDeleteModalOpen(true)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Group Delete Selected ({selectedKeyIds.length})
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">
                  Master Key Register — Physical Security Zones &amp; Designated Secure Areas
                </h4>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Physical Control Log
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedKeyIds.length === filteredKeyRegister.length && filteredKeyRegister.length > 0}
                        onChange={handleSelectAllKeys}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer accent-amber-600"
                        title="Select All / Deselect All Keys"
                      />
                    </th>
                    <th className="p-3.5 w-12 text-center">Sl</th>
                    <th className="p-3.5 min-w-[180px]">Location / Key Serial No</th>
                    <th className="p-3.5 w-28 font-mono text-indigo-900">Key Tag No.</th>
                    <th className="p-3.5 w-28">Issue Date</th>
                    <th className="p-3.5 min-w-[160px]">Receiver Name</th>
                    <th className="p-3.5 min-w-[130px]">Receiver Sign</th>
                    <th className="p-3.5 w-28">Return Date</th>
                    <th className="p-3.5 w-32 font-mono">Key Tags ID</th>
                    <th className="p-3.5 w-36 text-center">Digital / Bio Access</th>
                    <th className="p-3.5 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredKeyRegister.length > 0 ? (
                    filteredKeyRegister.map((item) => (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${selectedKeyIds.includes(item.id) ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedKeyIds.includes(item.id)}
                            onChange={() => handleSelectKey(item.id)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer accent-amber-600"
                          />
                        </td>
                        <td className="p-3.5 text-center font-black text-slate-400 text-[11px]">{item.slNo}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{item.locationName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Tag Ref: #{item.keyTagNo}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {item.keyTagNo}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium font-mono text-[11px]">
                          {item.issueDate}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {item.receiverName}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {item.receiverSign}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium text-[11px]">
                          {item.returnDate}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.physicalKeyTagId}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDigitalBioAccess(item.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold cursor-pointer transition-all border ${
                              item.digitalBioAccess === 'Yes'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs hover:bg-emerald-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle Digital Access / Bio Access state"
                          >
                            {item.digitalBioAccess === 'Yes' ? (
                              <>
                                <Check className="w-3 h-3" /> •Yes
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" /> •No
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingKeyItem({ ...item })}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Key Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKey(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Key Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-bold text-xs">
                        No key records match the search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'key_report' ? (
        /* Master Key Register Standalone Report View */
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm text-left">
            <div>
              <h3 className="font-extrabold text-sm text-amber-900 uppercase tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Master Key Register Report (Physical Security Compliance)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Print, download PDF, or dispatch email of the Master Key Register &amp; Lock Access Control Log.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                <Printer className="w-4 h-4" />
                Print Master Key Report
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-amber-500 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating...' : 'Download PDF Report'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-slate-800"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                {showEmailForm ? 'Close Email' : 'Email Report'}
              </button>
            </div>
          </div>

          {/* Inline Email Dispatch Control Panel */}
          {showEmailForm && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-white">
                    Dispatch Master Key Register PDF
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. auditor@doh.gov.ae or security@facility.ae"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Email Subject Header
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Cover Email Message Body
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-sans text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] font-medium">
                  {emailStatus === 'success' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Master Key Register emailed successfully!
                    </span>
                  )}
                  {emailStatus === 'error' && (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> {emailError || 'Failed to dispatch email'}
                    </span>
                  )}
                  {emailStatus === 'idle' && (
                    <span className="text-slate-400 text-[10px]">
                      The Master Key Register PDF report will be automatically attached to this email dispatch.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isEmailing || !recipientEmail}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-amber-500 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isEmailing ? 'Transmitting...' : 'Send Master Key Email'}
                </button>
              </div>
            </div>
          )}

          {/* Page Header / Footer Compliance Branding Configuration Panel */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                  🎨
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Page Header / Footer Compliance Branding Configuration
                    <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500">
                    Customize corporate facility logo, logo header alignment, footer logos, and document control metadata for Master Key Register report.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandingOpen(!isBrandingOpen)}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                {isBrandingOpen ? 'Hide Branding Controls' : 'Configure Header & Footer Branding'}
              </button>
            </div>

            {isBrandingOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 animate-fade-in">
                {/* Facility Corporate Logo Section */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">Facility Corporate Logo</label>
                  
                  {/* Preset Selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Preset Facility Logo</span>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {PRESET_LOGOS.map((lg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUpdateFacilityLogo(lg.value)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border shrink-0 transition-all ${
                            facilityLogoUrl === lg.value 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Custom */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Upload Custom Logo (PNG / JPG)</span>
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-amber-500 rounded-xl text-xs text-slate-700 font-bold cursor-pointer transition-all shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Custom File...</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={(e) => handleLogoFileUpload(e, false)} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Current Preview */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Active Header Logo:</span>
                    <div className="w-12 h-12 p-1 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {facilityLogoUrl ? (
                        <img src={facilityLogoUrl} className="max-w-full max-h-full object-contain" alt="Facility Logo" referrerPolicy="no-referrer" />
                      ) : (
                        <Key className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo Header Alignment & Display */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">Header Display & Alignment</label>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Header Display Mode</span>
                      <select
                        value={headerDisplayMode}
                        onChange={(e) => handleUpdateHeaderMode(e.target.value as any)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-250 focus:outline-none focus:border-amber-500 bg-white font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="BOTH">Show Both Logo and Company Name</option>
                        <option value="LOGO_ONLY">Show Logo Only (No text header)</option>
                        <option value="TEXT_ONLY">Show Company Name Only (No logo)</option>
                      </select>
                    </div>

                    {headerDisplayMode !== 'TEXT_ONLY' && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Logo Header Placement</span>
                        <select
                          value={logoPlacement}
                          onChange={(e) => handleUpdateLogoPlacement(e.target.value as any)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-250 focus:outline-none focus:border-amber-500 bg-white font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="LEFT">Left Aligned (Standard)</option>
                          <option value="RIGHT">Right Aligned</option>
                          <option value="FULL">Center / Full Width Banner</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Compliance Branding Settings */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">Footer Compliance Branding</label>

                  <div className="space-y-2 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showFooterLogo}
                        onChange={(e) => handleUpdateShowFooterLogo(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Show Footer Logo in Report</span>
                    </label>

                    {showFooterLogo && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Footer Logo Placement</span>
                        <select
                          value={footerPlacement}
                          onChange={(e) => handleUpdateFooterPlacement(e.target.value as any)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-250 focus:outline-none focus:border-amber-500 bg-white font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="LEFT">Left Aligned</option>
                          <option value="RIGHT">Right Aligned</option>
                          <option value="FULL">Center / Full Width</option>
                        </select>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={showFooterAddress}
                        onChange={(e) => handleUpdateShowFooterAddress(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Show Contact Details &amp; Address Bar</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GRC Document Metadata & Classification Controls Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Master Key Register Document Control Metadata
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                Physical Security Standard
              </span>
            </div>

            <DocRefLoopSelector
              currentRefCode={docRef || 'REF-KEY-REG-101'}
              onApplyLoop={(data) => {
                handleSaveDocRef(data.ref_code);
                if (data.classification) handleSaveClassification(data.classification);
                if (data.issue_date) handleSaveIssueDate(data.issue_date);
                if (data.approval_date || data.review_date) handleSaveApprovedDate(data.approval_date || data.review_date);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Document Reference No.</label>
                <input
                  type="text"
                  value={docRef}
                  onChange={(e) => {
                    setDocRef(e.target.value);
                    localStorage.setItem(`sh_secure_doc_ref_${activeClientId}`, e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Classification Level</label>
                <select
                  value={classification}
                  onChange={(e) => {
                    setClassification(e.target.value);
                    localStorage.setItem(`sh_secure_classification_${activeClientId}`, e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Restricted">Restricted</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Internal Use Only">Internal Use Only</option>
                  <option value="Public">Public</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    localStorage.setItem(`sh_secure_issue_date_${activeClientId}`, e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Approved Date</label>
                <input
                  type="date"
                  value={approvedDate}
                  onChange={(e) => {
                    setApprovedDate(e.target.value);
                    localStorage.setItem(`sh_secure_approved_date_${activeClientId}`, e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Printable Report Document Card for Master Key Register */}
          <div className="bg-slate-50 py-4 px-2 sm:p-6 rounded-2xl border border-slate-100">
            <div 
              id="print-secure-report-card" 
              className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200 max-w-4xl mx-auto space-y-6 text-slate-800 font-sans relative overflow-hidden text-left"
            >
              {/* Security Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                <Key className="w-128 h-128 text-slate-950" />
              </div>

              {/* Page Header / Footer Compliance Branding Configuration Header */}
              {(() => {
                const displayMode = headerDisplayMode;
                const placement = logoPlacement;
                const showLogo = displayMode !== 'TEXT_ONLY';
                const showText = displayMode !== 'LOGO_ONLY';

                const docRefBlock = (
                  <div className="text-right shrink-0">
                    <span className="bg-amber-950 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-amber-800 uppercase block">
                      {classification || 'RESTRICTED'}
                    </span>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 font-semibold">Ref: {docRef || 'AKMC-MKR-2026'}</p>
                  </div>
                );

                if (placement === 'LEFT') {
                  return (
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 text-left relative z-10 gap-3">
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
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {docRefBlock}
                    </div>
                  );
                } else if (placement === 'RIGHT') {
                  return (
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 relative z-10 gap-3">
                      {docRefBlock}
                      <div className="flex items-center gap-3.5 text-right justify-end">
                        <div>
                          {showText && (
                            <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                              {client?.company_name || 'Active Clinical Facility'}
                            </h2>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                          </p>
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
                    <div className="border-b-2 border-slate-900 pb-4 mb-6 relative z-10">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 text-center space-y-1">
                          {showLogo && facilityLogoUrl && (
                            <div className="w-full h-12 p-1 flex items-center justify-center bg-white mb-1">
                              <img src={facilityLogoUrl} className="max-h-full object-contain w-auto max-w-[280px]" alt="Facility Logo Centered" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          {showText && (
                            <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                              {client?.company_name || 'Active Clinical Facility'}
                            </h2>
                          )}
                          <p className="text-[10px] text-slate-400">
                            {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                          </p>
                        </div>
                        {docRefBlock}
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Document Control Information Log Box - Matching Employee & Operator Directory sample .pdf header view */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg text-[9px] relative z-10 mb-4 shadow-2xs">
                <div className="bg-slate-100 border-b border-slate-300 p-1.5 font-bold text-slate-800 text-center uppercase tracking-wider text-[9.5px]">
                  Document Control Information Log
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Document Title:</span>
                    <span className="font-bold text-slate-900">Master Key Register — Physical Security Zones &amp; Designated Secure Areas</span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Document Reference:</span>
                    <span className="font-mono font-bold text-amber-700">{docRef || 'AKMC-MKR-2026'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Classification:</span>
                    <span className="font-bold text-rose-700 tracking-wider text-[8px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                      {classification || 'RESTRICTED'}
                    </span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Issue Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(issueDate)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Review Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(approvedDate)}</span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Approved Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(approvedDate)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-1.5 border-r border-slate-300">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Prepared By</span>
                    <span className="font-bold text-slate-800">Aseef Sulaiman</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-300">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Reviewed By</span>
                    <span className="font-bold text-slate-800">Physical Security Officer</span>
                  </div>
                  <div className="p-1.5">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Approved By</span>
                    <span className="font-bold text-slate-800">Medical Director / CEO</span>
                  </div>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="bg-amber-950 text-white p-4 rounded-xl flex items-center justify-between flex-wrap gap-2 shadow-xs relative z-10">
                <div className="flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                      Master Key Register — Physical Security Zones &amp; Designated Secure Areas
                    </h3>
                    <p className="text-[10px] text-amber-200/80 font-medium mt-0.5">
                      Physical Control Tag Inventory &amp; Lock Access Control Log
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold bg-amber-900 text-amber-200 px-2 py-0.5 rounded border border-amber-700">
                    AUDIT COMPLIANT
                  </span>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Total Physical Key Tags</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">{keyRegister.length} Active Tags</span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                  <span className="text-[8.5px] font-bold text-emerald-700 uppercase block">Digital / Bio Access</span>
                  <span className="text-sm font-extrabold text-emerald-900 font-mono">
                    {keyRegister.filter(k => k.digitalBioAccess === 'Yes').length} Dual-Auth
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Physical Lock Only</span>
                  <span className="text-sm font-extrabold text-slate-700 font-mono">
                    {keyRegister.filter(k => k.digitalBioAccess === 'No').length} Standard Locks
                  </span>
                </div>
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                  <span className="text-[8.5px] font-bold text-indigo-700 uppercase block">Reconciliation Status</span>
                  <span className="text-xs font-extrabold text-indigo-950 font-mono">100% Verified</span>
                </div>
              </div>

              {/* Master Key Register Table */}
              {selectedKeyIds.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 animate-fade-in text-left print:hidden relative z-10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                    <span className="text-xs font-bold text-amber-900">
                      {selectedKeyIds.length} Key Record{selectedKeyIds.length > 1 ? 's' : ''} Selected in Report View
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedKeyIds([])}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGroupDeleteModalOpen(true)}
                      className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Group Delete Selected ({selectedKeyIds.length})
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border-2 border-slate-300 rounded-xl bg-white shadow-xs relative z-10">
                <table className="w-full text-left border-collapse font-sans text-[9.5px] leading-tight text-slate-800">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black border-b-2 border-slate-900 divide-x divide-slate-800 uppercase tracking-wider text-[9px]">
                      <th className="p-2.5 w-8 text-center bg-slate-950 print:hidden">
                        <input
                          type="checkbox"
                          checked={selectedKeyIds.length === keyRegister.length && keyRegister.length > 0}
                          onChange={handleSelectAllKeys}
                          className="rounded border-slate-600 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer accent-amber-500"
                          title="Select All Keys"
                        />
                      </th>
                      <th className="p-2.5 w-10 text-center bg-slate-950">SL</th>
                      <th className="p-2.5 min-w-[170px]">LOCATION / KEY SERIAL NO</th>
                      <th className="p-2.5 w-24 font-mono text-amber-300">KEY TAG NO.</th>
                      <th className="p-2.5 w-22">ISSUE DATE</th>
                      <th className="p-2.5 min-w-[130px]">RECEIVER NAME</th>
                      <th className="p-2.5 min-w-[110px]">RECEIVER SIGN</th>
                      <th className="p-2.5 w-20">RETURN DATE</th>
                      <th className="p-2.5 w-24 font-mono">TAG ID</th>
                      <th className="p-2.5 w-24 text-center">DIGITAL / BIO</th>
                      <th className="p-2.5 w-20 text-center print:hidden">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {keyRegister.length > 0 ? (
                      keyRegister.map((k) => (
                        <tr key={k.id} className={`divide-x divide-slate-200 hover:bg-slate-50/60 transition-colors ${selectedKeyIds.includes(k.id) ? 'bg-amber-50/40' : ''}`}>
                          <td className="p-2.5 text-center print:hidden">
                            <input
                              type="checkbox"
                              checked={selectedKeyIds.includes(k.id)}
                              onChange={() => handleSelectKey(k.id)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer accent-amber-600"
                            />
                          </td>
                          <td className="p-2.5 text-center font-black text-slate-400 bg-slate-50/40 text-[10px]">{k.slNo}</td>
                          <td className="p-2.5 font-bold text-slate-900">{k.locationName}</td>
                          <td className="p-2.5 font-mono font-black text-amber-900 bg-amber-50/50">{k.keyTagNo}</td>
                          <td className="p-2.5 font-mono text-slate-600">{k.issueDate}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{k.receiverName}</td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              {k.receiverSign}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 font-medium">{k.returnDate || '-'}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-slate-50/50">{k.physicalKeyTagId}</td>
                          <td className="p-2.5 text-center font-bold">
                            {k.digitalBioAccess === 'Yes' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                •Yes
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                •No
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingKeyItem({ ...k })}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Edit Key Entry"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKey(k)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete Key Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No Master Key Records Found in Register.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Version History inside Master Key Report */}
              <div className="relative z-10 space-y-2 mt-4 pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Document Revision / Version History</p>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/20">
                  <table className="w-full text-left border-collapse font-sans text-[10px] leading-tight text-slate-700">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 divide-x divide-slate-200">
                        <th className="p-2 w-[15%] font-bold">VERSION</th>
                        <th className="p-2 w-[20%] font-bold">RELEASE DATE</th>
                        <th className="p-2 w-[25%] font-bold">AUTHOR / REVIEWER</th>
                        <th className="p-2 w-[40%] font-bold">SUMMARY OF CHANGES / AMENDMENTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {versionHistory.map((v, vIdx) => (
                        <tr key={vIdx} className="divide-x divide-slate-200 hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900 font-mono">{v.version}</td>
                          <td className="p-2 text-slate-600">{v.date}</td>
                          <td className="p-2 text-slate-800 font-semibold">{v.author}</td>
                          <td className="p-2 text-slate-600 font-medium">{v.changes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures & Custody Certification */}
              <div className="relative z-10 pt-6 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Compliance Verifications &amp; Key Custody Certification
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Under the jurisdiction of DOH Abu Dhabi and standard physical security guidelines, physical keys and biometric control tags listed in this Master Key Register function as certified facility security controls.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    KEY CUSTODIAN / SECURITY APPROVAL
                  </span>
                  {(() => {
                    const authRep = getSyncedAuthorizedRepresentative(client);
                    return (
                      <>
                        <div className="h-10 flex items-center">
                          {client?.auth_rep_signature && client.auth_rep_signature.startsWith('data:image') ? (
                            <img src={client.auth_rep_signature} className="max-h-10 object-contain" alt="Signature" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="font-serif italic text-slate-700 text-sm font-semibold border-b border-slate-300 pb-0.5">
                              {authRep.name}
                            </span>
                          )}
                        </div>
                        <div className="pt-1 border-t border-slate-200 space-y-0.5">
                          <p className="font-black text-xs text-slate-900 uppercase leading-tight">
                            {authRep.name}
                          </p>
                          <p className="font-extrabold text-[10px] text-indigo-950 uppercase">
                            DESIGNATION: {(authRep.title || 'AUTHORIZED REPRESENTATIVE & COMPLIANCE LEAD').toUpperCase()}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            FACILITY SECURITY DIRECTOR &amp; KEY CUSTODIAN
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Compliance Page Footer */}
              <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-400 font-semibold flex flex-col gap-1.5 mt-6 relative z-10">
                {showFooterLogo && footerLogoUrl && footerPlacement === 'FULL' && (
                  <div className="w-full h-10 flex items-center justify-center bg-white border border-slate-100 rounded-md p-1">
                    <img src={footerLogoUrl} className="max-h-full object-contain w-auto max-w-[400px]" alt="Facility Footer Banner" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2">
                    {showFooterLogo && footerLogoUrl && footerPlacement === 'LEFT' && (
                      <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                        <img src={footerLogoUrl} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-0.5 text-left">
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

                  <div className="flex items-center gap-2 font-sans shrink-0">
                    {showFooterLogo && footerLogoUrl && footerPlacement === 'RIGHT' && (
                      <div className="w-16 h-8 bg-white border border-slate-100 rounded flex items-center justify-center overflow-hidden p-0.5">
                        <img src={footerLogoUrl} className="max-w-full max-h-full object-contain" alt="Footer Logo" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="font-mono text-[9px] text-slate-800 font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Page 1/1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Designated Secure Areas Report View */
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm text-left">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Physical Security Compliance Output</h3>
              <p className="text-xs text-slate-500 mt-1">
                Print, download PDF, or dispatch email of the legally binding physical site access registry with security watermarks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                <Printer className="w-4 h-4" />
                Print Document
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                {isExporting ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-indigo-500"
              >
                <FileText className="w-4 h-4" />
                Send Email to Client
              </button>
            </div>
          </div>

          {/* Email Dispatch Form Card */}
          {showEmailForm && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-left space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Email Registry Report over GRC SMTP Gateway
                </h4>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {emailStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                  ✓ Compliance email dispatched successfully! {recipientEmail ? `Sent to: ${recipientEmail}` : ''}
                </div>
              )}

              {emailStatus === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  ✕ Error: {emailError || 'Failed to dispatch email.'}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Recipient Email(s)</label>
                  <input
                    type="text"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. client@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                  />
                  <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Separate multiple emails with commas. Defaults to client or owner emails.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email Subject"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Message Body</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-sans"
                  placeholder="Enter email message body..."
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isEmailing || !recipientEmail}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isEmailing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <span>Send Registry Report</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Metadata & Classification Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm text-left">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600 animate-pulse" />
              Document Metadata &amp; Compliance Classification Editor
            </h4>

            <div className="mb-4">
              <DocRefLoopSelector
                currentRefCode={docRef || 'REF-PHY-SEC-2026'}
                onApplyLoop={(data) => {
                  handleSaveDocRef(data.ref_code);
                  if (data.classification) handleSaveClassification(data.classification);
                  if (data.issue_date) handleSaveIssueDate(data.issue_date);
                  if (data.approval_date || data.review_date) handleSaveApprovedDate(data.approval_date || data.review_date);
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Document Reference</label>
                <input 
                  type="text"
                  value={docRef}
                  onChange={(e) => handleSaveDocRef(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Classification Level</label>
                <select 
                  value={classification}
                  onChange={(e) => handleSaveClassification(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer text-slate-700 font-sans"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="SECRET">SECRET</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issue Date</label>
                <input 
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleSaveIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Approved Date</label>
                <input 
                  type="date"
                  value={approvedDate}
                  onChange={(e) => handleSaveApprovedDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Version History Management Panel */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Document Version Control & Revision Logs</h5>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-bold">
                  {versionHistory.length} Revision{versionHistory.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Version History Rows list */}
              {versionHistory.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-2 w-20">Version</th>
                        <th className="p-2 w-32">Release Date</th>
                        <th className="p-2 w-40">Reviewer/Author</th>
                        <th className="p-2">Changes Summary</th>
                        <th className="p-2 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-250">
                      {versionHistory.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/30">
                          <td className="p-2 font-black text-slate-800">{v.version}</td>
                          <td className="p-2 font-medium text-slate-600">{formatDate(v.date)}</td>
                          <td className="p-2 font-semibold text-slate-600 uppercase text-[10px]">{v.author}</td>
                          <td className="p-2 text-slate-500 leading-relaxed">{v.changes}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteVersion(idx)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete Revision Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 font-bold text-xs bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No Document Revisions Added. Default system templates will be displayed in the live document.
                </div>
              )}

              {/* Add New Revision Row Form */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Add New Revision Record
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Version No</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.2, 2.1"
                      value={newVersionNo}
                      onChange={(e) => setNewVersionNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Release Date</label>
                    <input
                      type="date"
                      value={newVersionDate}
                      onChange={(e) => setNewVersionDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Author / Reviewer</label>
                    <input
                      type="text"
                      placeholder="e.g. GRC Lead"
                      value={newVersionAuthor}
                      onChange={(e) => setNewVersionAuthor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Summary of Changes / Amendments</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Updated CCTV locations and aligned with physical security requirements"
                      value={newVersionChanges}
                      onChange={(e) => setNewVersionChanges(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newVersionNo.trim() || !newVersionChanges.trim()) {
                          alert('Please enter at least the Version Number and Changes summary.');
                          return;
                        }
                        handleAddVersion({
                          version: newVersionNo.trim(),
                          date: newVersionDate,
                          author: newVersionAuthor.trim() || 'GRC Officer',
                          changes: newVersionChanges.trim()
                        });
                        setNewVersionNo('');
                        setNewVersionAuthor('');
                        setNewVersionChanges('');
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Printable Report Document Card (Framed exactly like an official corporate artifact) */}
          <div className="bg-slate-50 py-4 px-2 sm:p-6 rounded-2xl border border-slate-100">
            <div 
              id="print-secure-report-card" 
              className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200 max-w-4xl mx-auto space-y-6 text-slate-800 font-sans relative overflow-hidden"
            >
              {/* Subtle background security graphic watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none">
                <Shield className="w-128 h-128 text-slate-950" />
              </div>

              {/* Page Header / Footer Compliance Branding Configuration Header */}
              {(() => {
                const displayMode = headerDisplayMode;
                const placement = logoPlacement;
                const showLogo = displayMode !== 'TEXT_ONLY';
                const showText = displayMode !== 'LOGO_ONLY';

                const docRefBlock = null;

                if (placement === 'LEFT') {
                  return (
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 text-left relative z-10">
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
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {docRefBlock}
                    </div>
                  );
                } else if (placement === 'RIGHT') {
                  return (
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6 relative z-10">
                      {docRefBlock}
                      <div className="flex items-center gap-3.5 text-right justify-end">
                        <div>
                          {showText && (
                            <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">
                              {client?.company_name || 'Active Clinical Facility'}
                            </h2>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                          </p>
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
                    <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-2 relative z-10">
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
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {client?.address && <span>{client.address} &bull; </span>}TL: {client?.trade_license_no || 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Document Control Information Log Box - Matching Employee & Operator Directory sample .pdf header view */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg text-[9px] relative z-10 my-4 shadow-2xs">
                <div className="bg-slate-100 border-b border-slate-300 p-1.5 font-bold text-slate-800 text-center uppercase tracking-wider text-[9.5px]">
                  Document Control Information Log
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Document Title:</span>
                    <span className="font-bold text-slate-900">Facility Physical Security Zones &amp; Designated Secure Areas</span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Document Reference:</span>
                    <span className="font-mono font-bold text-indigo-700">{docRef || 'AKMC-SEC-2026'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Classification:</span>
                    <span className="font-bold text-rose-700 tracking-wider text-[8px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                      {classification || 'RESTRICTED'}
                    </span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Issue Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(issueDate)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-300">
                  <div className="p-1.5 border-r border-slate-300 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Review Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(approvedDate)}</span>
                  </div>
                  <div className="p-1.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Approved Date:</span>
                    <span className="font-mono font-bold text-slate-800">{formatDate(approvedDate)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-1.5 border-r border-slate-300">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Prepared By</span>
                    <span className="font-bold text-slate-800">Aseef Sulaiman</span>
                  </div>
                  <div className="p-1.5 border-r border-slate-300">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Reviewed By</span>
                    <span className="font-bold text-slate-800">Physical Security Officer</span>
                  </div>
                  <div className="p-1.5">
                    <span className="font-semibold text-slate-500 block text-[8px] uppercase">Approved By</span>
                    <span className="font-bold text-slate-800">Medical Director / CEO</span>
                  </div>
                </div>
              </div>

              {/* The Compliance Access Registry Table (Formatted to perfectly match user requested sample) */}
              <div className="relative z-10 overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left border-collapse font-sans text-[11.5px] leading-tight">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider divide-x divide-slate-800">
                      <th className="p-3 text-center w-12 bg-slate-950">Sl No</th>
                      <th className="p-3 w-44">Name</th>
                      <th className="p-3 w-36">DESIGNATION</th>
                      <th className="p-3 text-center text-[10px] uppercase tracking-wider">{zones.find(z => z.id === 'zone_4')?.name || 'PUBLIC ACCESS AREAS (ZONE 4)'}</th>
                      <th className="p-3 text-center text-[10px] uppercase tracking-wider">{zones.find(z => z.id === 'zone_3')?.name || 'WORK AREAS (ZONE 3)'}</th>
                      <th className="p-3 text-center text-[10px] uppercase tracking-wider">{zones.find(z => z.id === 'zone_2')?.name || 'RESTRICTED AREAS (ZONE 2)'}</th>
                      <th className="p-3 text-center text-[10px] uppercase tracking-wider">{zones.find(z => z.id === 'zone_1')?.name || 'HIGH SECURE AREAS (ZONE 1)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-800 font-medium">
                    {activeEmployees.length > 0 ? (
                      activeEmployees.map((emp, index) => {
                        const currentPermissions = permissions.find(p => p.employeeId === emp.id)?.allowedZones || [];
                        
                        // PUBLIC ACCESS maps to Zone 4
                        const publicAccess = currentPermissions.includes('zone_4') ? 'YES' : 'No';
                        
                        // WORK AREA ACCESS maps to Zone 3
                        const workAccess = currentPermissions.includes('zone_3') ? 'YES' : 'No';
                        
                        // RESTRICTED ACCESS maps to Zone 2
                        const restrictedAccess = currentPermissions.includes('zone_2') ? 'YES' : 'No';
                        
                        // HIGHLY SECURED AREA ACCESS maps to Zone 1
                        const highlySecuredAccess = currentPermissions.includes('zone_1') ? 'YES' : 'No';

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-200">
                            <td className="p-3 text-center font-bold text-slate-400 bg-slate-50/40">{index + 1}</td>
                            <td className="p-3 font-bold text-slate-900 text-left">{emp.employee_name}</td>
                            <td className="p-3 text-left uppercase text-[9px] text-slate-600 font-bold tracking-wide">{emp.position || 'Employee'}</td>
                            <td className={`p-3 text-center font-bold ${publicAccess === 'YES' ? 'text-emerald-700 bg-emerald-50/20' : 'text-slate-400'}`}>{publicAccess}</td>
                            <td className={`p-3 text-center font-bold ${workAccess === 'YES' ? 'text-emerald-700 bg-emerald-50/20' : 'text-slate-400'}`}>{workAccess}</td>
                            <td className={`p-3 text-center font-bold ${restrictedAccess === 'YES' ? 'text-emerald-700 bg-emerald-50/20' : 'text-slate-400'}`}>{restrictedAccess}</td>
                            <td className={`p-3 text-center font-bold ${highlySecuredAccess === 'YES' ? 'text-indigo-800 bg-indigo-50/10' : 'text-rose-600 bg-rose-50/10'}`}>{highlySecuredAccess}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No Active Employees Registered. Please Configure HR Roster.
                        </td>
                      </tr>
                    )}

                    {/* SPECIAL UAE EXCLUSION / OUTSOURCE ESCORT CLAUSE ROW (Surgical matching of requested template) */}
                    <tr className="bg-amber-50/40 text-slate-700 divide-x divide-slate-200 border-t-2 border-slate-300">
                      <td className="p-3 text-center font-bold text-slate-400 bg-slate-100/30">-</td>
                      <td className="p-3 font-bold text-slate-400 text-left">-</td>
                      <td className="p-3 font-black text-slate-900 text-left text-[9px] uppercase leading-relaxed tracking-tight max-w-[200px]">
                        IT SUPPORT (OUT SOURCE COMPS) <br />
                        <span className="text-indigo-600 font-extrabold text-[8px] block mt-0.5">* WITH ESCORT REQUIRED</span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800 italic text-[10px] max-w-[120px] whitespace-normal break-words">{outsourceZone4}</td>
                      <td className="p-3 text-center font-bold text-slate-800 italic text-[10px] max-w-[120px] whitespace-normal break-words">{outsourceZone3}</td>
                      <td className="p-3 text-center font-bold text-slate-800 italic text-[10px] max-w-[120px] whitespace-normal break-words">{outsourceZone2}</td>
                      <td className="p-3 text-center font-black text-rose-700 bg-rose-50/20 uppercase text-[9.5px] max-w-[120px] whitespace-normal break-words">{outsourceZone1}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Document Revision / Version History Section */}
              <div className="relative z-10 space-y-2 mt-4 pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Document Revision / Version History</p>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/20">
                  <table className="w-full text-left border-collapse font-sans text-[10px] leading-tight text-slate-700">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 divide-x divide-slate-200">
                        <th className="p-2 w-[15%] font-bold">VERSION</th>
                        <th className="p-2 w-[20%] font-bold">RELEASE DATE</th>
                        <th className="p-2 w-[25%] font-bold">AUTHOR / REVIEWER</th>
                        <th className="p-2 w-[40%] font-bold">SUMMARY OF CHANGES / AMENDMENTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {versionHistory.map((v, idx) => (
                        <tr key={idx} className="divide-x divide-slate-200 hover:bg-slate-50/30">
                          <td className="p-2 font-black text-slate-900">{v.version}</td>
                          <td className="p-2 font-medium">{formatDate(v.date)}</td>
                          <td className="p-2 uppercase font-semibold text-slate-600 text-[9px] tracking-wide">{v.author}</td>
                          <td className="p-2 text-slate-500">{v.changes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Signatures & Seal Authorization Section */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-xs relative z-10">
                <div className="space-y-3 pr-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Compliance Verifications</p>
                  <p className="text-slate-500 leading-relaxed text-[11px] font-medium">
                    Under the jurisdiction of DOH Abu Dhabi and standard guidelines, physical access limits registered in this database log function as formal site security credentials. Audit logs are logged dynamically for security auditing purposes.
                  </p>
                </div>

                {/* Corporate Signature Card containing actual uploaded elements */}
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/70">
                  {(() => {
                    const authRep = getSyncedAuthorizedRepresentative(client);
                    return (
                      <div className="space-y-3 text-left">
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">KEY CUSTODIAN / SECURITY APPROVAL</p>
                        <div className="h-10 flex items-center">
                          {client?.auth_rep_signature ? (
                            <img 
                              src={client.auth_rep_signature} 
                              className="max-h-full max-w-[140px] object-contain" 
                              alt="Authorized Signature" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-serif italic text-base text-slate-700 font-bold tracking-wide border-b border-dashed border-slate-300 pb-0.5">
                              {authRep.name}
                            </span>
                          )}
                        </div>
                        <div className="pt-1 border-t border-slate-200 space-y-0.5">
                          <p className="font-black text-slate-900 uppercase text-[10px] leading-tight">
                            {authRep.name}
                          </p>
                          <p className="font-extrabold text-[9.5px] text-indigo-950 uppercase">
                            DESIGNATION: {(authRep.title || 'AUTHORIZED REPRESENTATIVE & COMPLIANCE LEAD').toUpperCase()}
                          </p>
                          <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">FACILITY SECURITY DIRECTOR &amp; KEY CUSTODIAN</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Compliance Page Footer */}
              <div className="pt-3 border-t border-slate-300 text-[8.5px] text-slate-400 font-semibold flex flex-col gap-1.5 mt-6 relative z-10">
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
                    
                    <div className="flex flex-col gap-0.5 text-left">
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
          </div>

          {/* Custom style injection for page-printing accuracy */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-secure-report-card, #print-secure-report-card * {
                visibility: visible !important;
              }
              #print-secure-report-card {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>
        </div>
      )}

      {/* Global Edit Key Modal Dialog */}
      {editingKeyItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Edit Master Key Register Entry #{editingKeyItem.slNo}
              </h4>
              <button onClick={() => setEditingKeyItem(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditedKey} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Serial No / Location *</label>
                <input
                  type="text"
                  list="sample-locations-datalist"
                  value={editingKeyItem.locationName}
                  onChange={e => setEditingKeyItem({ ...editingKeyItem, locationName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-slate-400">Quick Sample Locations:</span>
                    <button
                      type="button"
                      onClick={() => setShowAddLocInput(!showAddLocInput)}
                      className="text-[9.5px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Option
                    </button>
                  </div>

                  {showAddLocInput && (
                    <div className="flex items-center gap-1.5 py-1">
                      <input
                        type="text"
                        placeholder="e.g. Pharmacy Store, X-Ray Room..."
                        value={newCustomLocInput}
                        onChange={(e) => setNewCustomLocInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCustomLocInput.trim()) {
                              const val = newCustomLocInput.trim();
                              handleAddCustomLocation(val);
                              setEditingKeyItem(prev => prev ? { ...prev, locationName: val } : null);
                              setNewCustomLocInput('');
                              setShowAddLocInput(false);
                            }
                          }
                        }}
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCustomLocInput.trim()) {
                            const val = newCustomLocInput.trim();
                            handleAddCustomLocation(val);
                            setEditingKeyItem(prev => prev ? { ...prev, locationName: val } : null);
                            setNewCustomLocInput('');
                            setShowAddLocInput(false);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {[...SAMPLE_LOCATIONS, ...customSampleLocations].map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => setEditingKeyItem(prev => prev ? { ...prev, locationName: loc } : null)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-[10px] font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Tag No. *</label>
                  <input
                    type="text"
                    value={editingKeyItem.keyTagNo}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, keyTagNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issue Date</label>
                  <input
                    type="date"
                    value={editingKeyItem.issueDate}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receiver Name</label>
                    {activeEmployees.length > 0 && (
                      <span className="text-[9.5px] text-emerald-600 font-bold">
                        {activeEmployees.length} Active Staff
                      </span>
                    )}
                  </div>
                  {activeEmployees.length > 0 && (
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          setEditingKeyItem(prev => prev ? { ...prev, receiverName: e.target.value } : null);
                        }
                      }}
                      value={activeEmployees.some(e => e.employee_name === editingKeyItem.receiverName) ? editingKeyItem.receiverName : ''}
                      className="w-full px-2 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500 mb-1 cursor-pointer"
                    >
                      <option value="">-- Choose Active Employee --</option>
                      {activeEmployees.map(emp => (
                        <option key={emp.id} value={emp.employee_name}>
                          👤 {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    list="active-employees-receiver-datalist"
                    placeholder="Type name or select active employee"
                    value={editingKeyItem.receiverName}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, receiverName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receiver Sign / Acknowledgment</label>
                  <input
                    type="text"
                    value={editingKeyItem.receiverSign}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, receiverSign: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Return Date</label>
                  <input
                    type="text"
                    value={editingKeyItem.returnDate}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, returnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Physical Key Tags ID</label>
                  <input
                    type="text"
                    value={editingKeyItem.physicalKeyTagId}
                    onChange={e => setEditingKeyItem({ ...editingKeyItem, physicalKeyTagId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Digital Access / Bio Access</label>
                <select
                  value={editingKeyItem.digitalBioAccess}
                  onChange={e => setEditingKeyItem({ ...editingKeyItem, digitalBioAccess: e.target.value as 'Yes' | 'No' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                >
                  <option value="Yes">•Yes (Digital Access / Bio Access Enabled)</option>
                  <option value="No">•No (Physical Key Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingKeyItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Add Key Modal Dialog */}
      {isAddKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Register New Master Key Tag
              </h4>
              <button onClick={() => setIsAddKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateNewKey} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Serial No / Location *</label>
                <input
                  type="text"
                  list="sample-locations-datalist"
                  placeholder="e.g. Server room, CCTV cabinet, Main Entrance..."
                  value={newKeyForm.locationName}
                  onChange={e => setNewKeyForm({ ...newKeyForm, locationName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-slate-400">Quick Sample Locations:</span>
                    <button
                      type="button"
                      onClick={() => setShowAddLocInput(!showAddLocInput)}
                      className="text-[9.5px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Option
                    </button>
                  </div>

                  {showAddLocInput && (
                    <div className="flex items-center gap-1.5 py-1">
                      <input
                        type="text"
                        placeholder="e.g. Pharmacy Store, X-Ray Room..."
                        value={newCustomLocInput}
                        onChange={(e) => setNewCustomLocInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCustomLocInput.trim()) {
                              const val = newCustomLocInput.trim();
                              handleAddCustomLocation(val);
                              setNewKeyForm(prev => ({ ...prev, locationName: val }));
                              setNewCustomLocInput('');
                              setShowAddLocInput(false);
                            }
                          }
                        }}
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCustomLocInput.trim()) {
                            const val = newCustomLocInput.trim();
                            handleAddCustomLocation(val);
                            setNewKeyForm(prev => ({ ...prev, locationName: val }));
                            setNewCustomLocInput('');
                            setShowAddLocInput(false);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {[...SAMPLE_LOCATIONS, ...customSampleLocations].map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => setNewKeyForm(prev => ({ ...prev, locationName: loc }))}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-[10px] font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <datalist id="sample-locations-datalist">
                {[...SAMPLE_LOCATIONS, ...customSampleLocations].map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>

              <datalist id="active-employees-receiver-datalist">
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.employee_name} label={emp.position || emp.department} />
                ))}
              </datalist>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Key Tag No. *</label>
                  <input
                    type="text"
                    placeholder="e.g. 017"
                    value={newKeyForm.keyTagNo}
                    onChange={e => setNewKeyForm({ ...newKeyForm, keyTagNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Issue Date</label>
                  <input
                    type="date"
                    value={newKeyForm.issueDate}
                    onChange={e => setNewKeyForm({ ...newKeyForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receiver Name</label>
                    {activeEmployees.length > 0 && (
                      <span className="text-[9.5px] text-emerald-600 font-bold">
                        {activeEmployees.length} Active Staff
                      </span>
                    )}
                  </div>
                  {activeEmployees.length > 0 && (
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          setNewKeyForm(prev => ({ ...prev, receiverName: e.target.value }));
                        }
                      }}
                      value={activeEmployees.some(e => e.employee_name === newKeyForm.receiverName) ? newKeyForm.receiverName : ''}
                      className="w-full px-2 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500 mb-1 cursor-pointer"
                    >
                      <option value="">-- Choose Active Employee --</option>
                      {activeEmployees.map(emp => (
                        <option key={emp.id} value={emp.employee_name}>
                          👤 {emp.employee_name} ({emp.position || emp.department || 'Staff'})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    list="active-employees-receiver-datalist"
                    placeholder="Type name or select active employee"
                    value={newKeyForm.receiverName}
                    onChange={e => setNewKeyForm({ ...newKeyForm, receiverName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Physical Key Tag ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TAG-PS-017"
                    value={newKeyForm.physicalKeyTagId}
                    onChange={e => setNewKeyForm({ ...newKeyForm, physicalKeyTagId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Digital Access / Bio Access</label>
                <select
                  value={newKeyForm.digitalBioAccess}
                  onChange={e => setNewKeyForm({ ...newKeyForm, digitalBioAccess: e.target.value as 'Yes' | 'No' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                >
                  <option value="Yes">•Yes (Digital Access / Bio Access Enabled)</option>
                  <option value="No">•No (Physical Key Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddKeyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Add Key Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Delete Key Confirmation Modal Dialog */}
      {keyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Confirm Key Entry Deletion
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Master Key Register Audit Log</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">SL No:</span>
                <span className="font-mono font-bold text-slate-900">#{keyToDelete.slNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Location / Serial:</span>
                <span className="font-bold text-slate-900">{keyToDelete.locationName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Key Tag No:</span>
                <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {keyToDelete.keyTagNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Receiver Name:</span>
                <span className="font-semibold text-slate-800">{keyToDelete.receiverName}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 font-medium leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Are you sure you want to delete this key record? This action cannot be undone and will permanently update the Master Key Register in all compliance reports.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setKeyToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteKey}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-rose-500 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Group / Bulk Delete Keys Confirmation Modal Dialog */}
      {isGroupDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Confirm Group Key Deletion ({selectedKeyIds.length} Selected)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">Bulk Master Key Register Audit Log</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              You are about to delete <strong className="text-rose-700">{selectedKeyIds.length} key record(s)</strong> from the Master Key Register.
            </p>

            {/* Selected Items List Preview */}
            <div className="max-h-48 overflow-y-auto bg-slate-50 border border-slate-200/80 rounded-xl divide-y divide-slate-100 p-2">
              {keyRegister.filter(k => selectedKeyIds.includes(k.id)).map(k => (
                <div key={k.id} className="py-2 px-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{k.locationName}</span>
                    <span className="text-[10px] text-slate-500">Receiver: {k.receiverName}</span>
                  </div>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px]">
                    Tag #{k.keyTagNo}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 font-medium leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Deleting these key entries will permanently remove them from the Master Key Register and all generated compliance PDF reports.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsGroupDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmGroupDeleteKeys}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border border-rose-500 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete {selectedKeyIds.length} Key Entry(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
