import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  User, 
  Building, 
  Calendar, 
  Hash, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  X, 
  FileClock, 
  ShieldAlert,
  Save,
  HelpCircle,
  MapPin,
  Lock,
  KeyRound
} from 'lucide-react';
import { Client, ContactPerson, ThirdPartySupport } from '../types';
import { syncClientProfileAuthRep } from '../utils/clientSyncUtils';
import { formatDateDMY } from '../utils/dateUtils';

interface GrcQuickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSaveClient: (updated: Client) => void;
}

interface VersionHistoryItem {
  version: string;
  date: string;
  author: string;
  changes: string;
}

export default function GrcQuickSetupModal({ isOpen, onClose, client, onSaveClient }: GrcQuickSetupModalProps) {
  // --- Form State ---
  
  // Authorized Personnel
  const [authRepName, setAuthRepName] = useState('');
  const [authRepEmail, setAuthRepEmail] = useState('');
  const [authRepPhone, setAuthRepPhone] = useState('');

  const [clinicMgrName, setClinicMgrName] = useState('');
  const [clinicMgrEmail, setClinicMgrEmail] = useState('');
  const [clinicMgrPhone, setClinicMgrPhone] = useState('');

  const [medDirName, setMedDirName] = useState('');
  const [medDirEmail, setMedDirEmail] = useState('');
  const [medDirPhone, setMedDirPhone] = useState('');

  const [itMgrName, setItMgrName] = useState('');
  const [itMgrEmail, setItMgrEmail] = useState('');
  const [itMgrPhone, setItMgrPhone] = useState('');

  const [hrMgrName, setHrMgrName] = useState('');
  const [hrMgrEmail, setHrMgrEmail] = useState('');
  const [hrMgrPhone, setHrMgrPhone] = useState('');

  // Third-Party Support Channels
  const [itSupportName, setItSupportName] = useState('');
  const [itSupportEmail, setItSupportEmail] = useState('');
  const [itSupportPhone, setItSupportPhone] = useState('');

  const [emrSupportName, setEmrSupportName] = useState('');
  const [emrSupportEmail, setEmrSupportEmail] = useState('');
  const [emrSupportPhone, setEmrSupportPhone] = useState('');

  // Facility Physical & IT Infrastructure Layout Configuration
  const [escortRequired, setEscortRequired] = useState(true);
  const [outsourcedItNotes, setOutsourcedItNotes] = useState('IT SUPPORT (OUT SOURCE COMPS) * WITH ESCORT REQUIRED');
  const [facilityRooms, setFacilityRooms] = useState([
    { name: 'Reception Waiting Area', zone: 'Public / Semi-Public', escort: false },
    { name: 'Lobby Consultation Room', zone: 'Clinical Access', escort: false },
    { name: 'Treatment Room', zone: 'Restricted Clinical', escort: false },
    { name: 'Admin Room', zone: 'Administrative / Staff', escort: false },
    { name: 'OPG Room', zone: 'Diagnostic Imaging / Radiation Area', escort: true },
    { name: 'Server Cabinet', zone: 'High Security IT Infra', escort: true },
    { name: 'IT Server Room', zone: 'Critical ADHICS Level-3 Secure Zone', escort: true }
  ]);

  // Document Metadata
  const [docRef, setDocRef] = useState('');
  const [docClassification, setDocClassification] = useState('Confidential');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docApprovedDate, setDocApprovedDate] = useState('');

  // Risk ID Naming Options
  const [riskIdPrefix, setRiskIdPrefix] = useState('RSK');
  const [riskIdStartIndex, setRiskIdStartIndex] = useState(1);
  const [riskIdPadding, setRiskIdPadding] = useState(3);

  // Version History list
  const [versionHistory, setVersionHistory] = useState<VersionHistoryItem[]>([]);

  // Add Version inline sub-form states
  const [newVersionNo, setNewVersionNo] = useState('');
  const [newVersionDate, setNewVersionDate] = useState('');
  const [newVersionAuthor, setNewVersionAuthor] = useState('');
  const [newVersionChanges, setNewVersionChanges] = useState('');
  const [showAddVersionForm, setShowAddVersionForm] = useState(false);

  // Initialize form when client prop changes
  useEffect(() => {
    if (client) {
      setAuthRepName(client.auth_representative?.name || '');
      setAuthRepEmail(client.auth_representative?.email || '');
      setAuthRepPhone(client.auth_representative?.phone || '');

      setClinicMgrName(client.clinic_manager?.name || '');
      setClinicMgrEmail(client.clinic_manager?.email || '');
      setClinicMgrPhone(client.clinic_manager?.phone || '');

      setMedDirName(client.medical_director?.name || '');
      setMedDirEmail(client.medical_director?.email || '');
      setMedDirPhone(client.medical_director?.phone || '');

      setItMgrName(client.it_manager?.name || '');
      setItMgrEmail(client.it_manager?.email || '');
      setItMgrPhone(client.it_manager?.phone || '');

      setHrMgrName(client.hr_manager?.name || '');
      setHrMgrEmail(client.hr_manager?.email || '');
      setHrMgrPhone(client.hr_manager?.phone || '');

      setItSupportName(client.it_support?.team_name || '');
      setItSupportEmail(client.it_support?.email || '');
      setItSupportPhone(client.it_support?.phone || '');

      setEmrSupportName(client.emr_support?.team_name || '');
      setEmrSupportEmail(client.emr_support?.email || '');
      setEmrSupportPhone(client.emr_support?.phone || '');

      setDocRef(client.doc_ref || 'ZZP-IT-PE-05/2021');
      setDocClassification(client.doc_classification || 'RESTRICTED');
      setDocIssueDate(client.doc_issue_date || '01/03/2022');
      setDocApprovedDate(client.doc_approved_date || '30/06/2026');

      setRiskIdPrefix(client.risk_id_prefix || 'RSK');
      setRiskIdStartIndex(client.risk_id_start_index !== undefined ? client.risk_id_start_index : 1);
      setRiskIdPadding(client.risk_id_padding !== undefined ? client.risk_id_padding : 3);

      // Default version history if empty
      const defaultVersions: VersionHistoryItem[] = [
        { version: '1.0', date: '01/03/2022', author: 'Managing Director / IT Lead', changes: 'Initial document issue & approval under ISO 27001 & ADHICS v2 Framework' }
      ];
      setVersionHistory(client.version_history && client.version_history.length > 0 ? client.version_history : defaultVersions);
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  // --- Calculations / Helpers ---
  const getRiskIdLivePreview = () => {
    try {
      const idxStr = String(riskIdStartIndex).padStart(Number(riskIdPadding), '0');
      return `${riskIdPrefix}-${idxStr}`;
    } catch (e) {
      return `${riskIdPrefix}-001`;
    }
  };

  const handleAddVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNo || !newVersionChanges) {
      alert('Please fill out the version number and description of changes.');
      return;
    }

    const nextItem: VersionHistoryItem = {
      version: newVersionNo,
      date: formatDateDMY(newVersionDate) || formatDateDMY(new Date()), // dd/mm/yyyy
      author: newVersionAuthor || 'Authorized Personnel',
      changes: newVersionChanges
    };

    setVersionHistory(prev => [...prev, nextItem]);
    setNewVersionNo('');
    setNewVersionDate('');
    setNewVersionAuthor('');
    setNewVersionChanges('');
    setShowAddVersionForm(false);
  };

  const handleRemoveVersion = (index: number) => {
    setVersionHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    const updatedClient: Client = {
      ...client,
      auth_representative: { name: authRepName, email: authRepEmail, phone: authRepPhone },
      clinic_manager: { name: clinicMgrName, email: clinicMgrEmail, phone: clinicMgrPhone },
      medical_director: { name: medDirName, email: medDirEmail, phone: medDirPhone },
      it_manager: { name: itMgrName, email: itMgrEmail, phone: itMgrPhone },
      hr_manager: { name: hrMgrName, email: hrMgrEmail, phone: hrMgrPhone },

      it_support: { team_name: itSupportName, email: itSupportEmail, phone: itSupportPhone },
      emr_support: { team_name: emrSupportName, email: emrSupportEmail, phone: emrSupportPhone },

      doc_ref: docRef,
      doc_classification: docClassification,
      doc_issue_date: docIssueDate,
      doc_approved_date: docApprovedDate,

      risk_id_prefix: riskIdPrefix,
      risk_id_start_index: Number(riskIdStartIndex),
      risk_id_padding: Number(riskIdPadding),

      version_history: versionHistory,
      updated_at: new Date().toISOString()
    };

    onSaveClient(syncClientProfileAuthRep(updatedClient));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] my-8 animate-fade-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Facility Quick Setup Portal</h2>
              <p className="text-[11px] text-slate-500 font-medium">Configure authorized personnel contacts, metadata compliance settings, and Compliance sequence formatting.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Facility Context Badge */}
          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-800">Target Context: <span className="text-emerald-700 font-extrabold">{client.company_name}</span></span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-100">ID: {client.id}</span>
          </div>

          {/* Special Section: Facility Physical & IT Infrastructure Layout Configuration */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold tracking-wide uppercase text-slate-100">
                  Facility Layout & IT Support Escort Requirements
                </h3>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                ADHICS Physical Security Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Outsourced IT Support Policy
                </label>
                <textarea
                  rows={2}
                  value={outsourcedItNotes}
                  onChange={e => setOutsourcedItNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-emerald-300 font-mono font-bold"
                  placeholder="IT SUPPORT (OUT SOURCE COMPS) * WITH ESCORT REQUIRED"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="escort-req-chk"
                    checked={escortRequired}
                    onChange={e => setEscortRequired(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="escort-req-chk" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Strict Escort Required for All Outsourced Vendors
                  </label>
                </div>
              </div>

              {/* Schematic Facility Overlay */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Facility Zone Layout Overlay:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                  {facilityRooms.map((room, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg border flex flex-col justify-between ${
                        room.escort 
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' 
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{room.name}</span>
                        {room.escort && <KeyRound className="w-3 h-3 text-rose-400 shrink-0" />}
                      </div>
                      <span className="text-[8px] font-mono opacity-60 block mt-1">{room.zone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Facility Committee Signatory Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Facility Committee Signatory Controls</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Authorized Representative */}
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Authorized Representative</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={authRepName}
                    onChange={e => setAuthRepName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={authRepEmail}
                    onChange={e => setAuthRepEmail(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={authRepPhone}
                    onChange={e => setAuthRepPhone(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Clinic Manager */}
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clinic Manager</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={clinicMgrName}
                    onChange={e => setClinicMgrName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={clinicMgrEmail}
                    onChange={e => setClinicMgrEmail(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={clinicMgrPhone}
                    onChange={e => setClinicMgrPhone(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Medical Director */}
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Medical Director</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={medDirName}
                    onChange={e => setMedDirName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={medDirEmail}
                    onChange={e => setMedDirEmail(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={medDirPhone}
                    onChange={e => setMedDirPhone(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* IT Manager / Administrator */}
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">IT Manager / Administrator</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={itMgrName}
                    onChange={e => setItMgrName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={itMgrEmail}
                    onChange={e => setItMgrEmail(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={itMgrPhone}
                    onChange={e => setItMgrPhone(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* HR Manager */}
              <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">HR Manager</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={hrMgrName}
                    onChange={e => setHrMgrName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={hrMgrEmail}
                    onChange={e => setHrMgrEmail(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={hrMgrPhone}
                    onChange={e => setHrMgrPhone(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Third-Party Support Channels */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Third-Party Support Channels</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* IT Support Team */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">IT Support Team (Third-Party)</span>
                  <span className="text-[9px] text-slate-400 font-medium">e.g. Apex Security Solutions</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Support Provider / Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Security Solutions"
                      value={itSupportName}
                      onChange={e => setItSupportName(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Support Email</label>
                      <input
                        type="email"
                        placeholder="support@partner.ae"
                        value={itSupportEmail}
                        onChange={e => setItSupportEmail(e.target.value)}
                        className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Support Phone</label>
                      <input
                        type="text"
                        placeholder="+971..."
                        value={itSupportPhone}
                        onChange={e => setItSupportPhone(e.target.value)}
                        className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* EMR Support Team */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">EMR Support Team (Third-Party)</span>
                  <span className="text-[9px] text-slate-400 font-medium">e.g. CureMD Regional Support</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-0.5">EMR Provider Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CureMD Regional Support"
                      value={emrSupportName}
                      onChange={e => setEmrSupportName(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Support Email</label>
                      <input
                        type="email"
                        placeholder="emr@curemd.ae"
                        value={emrSupportEmail}
                        onChange={e => setEmrSupportEmail(e.target.value)}
                        className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Support Phone</label>
                      <input
                        type="text"
                        placeholder="+971..."
                        value={emrSupportPhone}
                        onChange={e => setEmrSupportPhone(e.target.value)}
                        className="w-full text-[11px] p-1.5 rounded border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Document Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Document Metadata</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Document Reference Code (Doc Ref.)</label>
                <input
                  type="text"
                  placeholder="e.g., REC-2026-CHD-001"
                  value={docRef}
                  onChange={e => setDocRef(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Classification</label>
                <select
                  value={docClassification}
                  onChange={e => setDocClassification(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-bold text-slate-800"
                >
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Secret">Secret</option>
                  <option value="Internal Use Only">Internal Use Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Doc. Issue Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={docIssueDate}
                  onChange={e => setDocIssueDate(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Approved Date</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={docApprovedDate}
                  onChange={e => setDocApprovedDate(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                />
              </div>

            </div>
          </div>

          {/* Section 4: Risk ID Naming Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Hash className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Risk ID Naming Options</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Risk ID Prefix / Format Prefix</label>
                <input
                  type="text"
                  placeholder="RSK"
                  value={riskIdPrefix}
                  onChange={e => setRiskIdPrefix(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Risk ID Start Index Number</label>
                <input
                  type="number"
                  min="1"
                  value={riskIdStartIndex}
                  onChange={e => setRiskIdStartIndex(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Sequence Padding Digits</label>
                <select
                  value={riskIdPadding}
                  onChange={e => setRiskIdPadding(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded border border-slate-200 bg-white font-bold"
                >
                  <option value={1}>1 digit (e.g. 1)</option>
                  <option value={2}>2 digits (e.g. 01)</option>
                  <option value={3}>3 digits (e.g. 001)</option>
                  <option value={4}>4 digits (e.g. 0001)</option>
                </select>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white font-mono flex flex-col justify-between h-14">
                <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-sans font-bold">Risk ID Live Preview Format:</span>
                <span className="text-xs font-extrabold text-emerald-300">{getRiskIdLivePreview()}</span>
              </div>

            </div>
          </div>

          {/* Section 5: Version History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <FileClock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">Version History</h3>
              </div>
              {!showAddVersionForm && (
                <button
                  type="button"
                  onClick={() => setShowAddVersionForm(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer border border-emerald-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Version
                </button>
              )}
            </div>

            {/* Version List Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 w-20 text-center">Version</th>
                    <th className="p-3 w-24">Date</th>
                    <th className="p-3 w-36">Author</th>
                    <th className="p-3">Summary of Changes / Remarks</th>
                    <th className="p-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {versionHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-medium text-[11px]">
                        No version control records logged. Click 'Add Version' to record manual history.
                      </td>
                    </tr>
                  ) : (
                    versionHistory.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 text-[11px] font-medium text-slate-700">
                        <td className="p-3 text-center font-bold font-mono text-emerald-700 bg-emerald-50/20">{v.version}</td>
                        <td className="p-3 font-mono text-slate-500">{v.date}</td>
                        <td className="p-3 font-bold text-slate-800">{v.author}</td>
                        <td className="p-3 text-slate-600 leading-relaxed">{v.changes}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVersion(i)}
                            className="w-7 h-7 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete version record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline Add Version Sub-Form */}
            {showAddVersionForm && (
              <form onSubmit={handleAddVersionSubmit} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-100/50">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">Record New Document Version</span>
                  <button 
                    type="button"
                    onClick={() => setShowAddVersionForm(false)}
                    className="text-slate-400 hover:text-slate-600 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] text-emerald-800 font-bold mb-0.5">Version No. (e.g. 2.1)</label>
                    <input
                      type="text"
                      placeholder="e.g. v2.1"
                      required
                      value={newVersionNo}
                      onChange={e => setNewVersionNo(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-emerald-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-emerald-800 font-bold mb-0.5">Issue Date (Defaults to Today)</label>
                    <input
                      type="text"
                      placeholder="e.g. 03/07/2026"
                      value={newVersionDate}
                      onChange={e => setNewVersionDate(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-emerald-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-emerald-800 font-bold mb-0.5">Author / Modifier Role</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Administrator"
                      value={newVersionAuthor}
                      onChange={e => setNewVersionAuthor(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-emerald-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-emerald-800 font-bold mb-0.5">Description of Changes Made</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the regulatory or architectural updates included in this revision..."
                    required
                    value={newVersionChanges}
                    onChange={e => setNewVersionChanges(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-emerald-200 bg-white leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddVersionForm(false)}
                    className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Add Version
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold">Changes will take effect instantly in the live workspace.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Facility
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
