import React, { useState } from 'react';
import { Client, User } from '../types';
import { Copy, Shield, ArrowRight, CheckSquare, Square, AlertCircle, Sparkles, X, CheckCircle2 } from 'lucide-react';

export interface CopyClientDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClientId: string;
  currentUser: User;
  onCopyClientData: (sourceClientId: string, targetClientId: string, categories: string[]) => void;
}

const DATA_CATEGORIES = [
  {
    id: 'documents',
    title: 'Master Documents & Saved References',
    description: 'Document repository files, Quick Master Setup records, SoA mappings, and custom references'
  },
  {
    id: 'policies',
    title: 'Policies & Procedure Frameworks',
    description: 'All 34 master policy statements, custom facility guidelines, and procedure manuals'
  },
  {
    id: 'risks',
    title: 'Risk Register & Threat Assessments',
    description: 'Identified risk items, likelihood/impact matrices, and risk treatment strategies'
  },
  {
    id: 'assets',
    title: 'Asset Register & IT Infrastructure',
    description: 'Facility assets, hardware inventory, classification levels, and custodian assignments'
  },
  {
    id: 'forms',
    title: 'Compliance Forms & Checklists',
    description: 'Digital compliance form templates, audit checklists, and electronic records'
  },
  {
    id: 'agreements',
    title: 'Service Agreements & Contracts',
    description: 'Third-party SLA agreements, executed contracts, and vendor terms'
  },
  {
    id: 'hr_documents',
    title: 'HR Documents & Employee Roster',
    description: 'Employee profiles, policy acknowledgment sheets, and UAE Pass signed records'
  },
  {
    id: 'legal_register',
    title: 'Legal & Regulatory Register',
    description: 'DOH/DHA statutory requirements, circulars, compliance standards, and licenses'
  },
  {
    id: 'secure_area',
    title: 'Secure Area & Master Key Register',
    description: 'Physical security zone controls, key assignments, and outsourced area permissions'
  }
];

export default function CopyClientDataModal({
  isOpen,
  onClose,
  clients,
  activeClientId,
  currentUser,
  onCopyClientData
}: CopyClientDataModalProps) {
  if (!isOpen) return null;

  // Verify superadmin privilege
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const defaultSource = activeClientId || clients[0]?.id || '';
  const defaultTarget = clients.find(c => c.id !== defaultSource)?.id || '';

  const [sourceClientId, setSourceClientId] = useState<string>(defaultSource);
  const [targetClientId, setTargetClientId] = useState<string>(defaultTarget);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DATA_CATEGORIES.map(c => c.id)
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-rose-100">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-600">
            Copying client account data is a privileged operation restricted exclusively to <span className="font-bold text-rose-600">SUPER_ADMIN</span> users.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(prev => prev.filter(c => c !== catId));
    } else {
      setSelectedCategories(prev => [...prev, catId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCategories.length === DATA_CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(DATA_CATEGORIES.map(c => c.id));
    }
  };

  const handleExecuteCopy = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sourceClientId || !targetClientId) {
      setErrorMessage('Please select both a Source Client and a Target Client.');
      return;
    }

    if (sourceClientId === targetClientId) {
      setErrorMessage('Source Client and Target Client cannot be the same account.');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one data category to copy.');
      return;
    }

    const sourceObj = clients.find(c => c.id === sourceClientId);
    const targetObj = clients.find(c => c.id === targetClientId);

    const confirmMsg = `Are you sure you want to copy ${selectedCategories.length} data categories from "${sourceObj?.company_name}" to "${targetObj?.company_name}"?\n\nTarget Client will receive independent duplicated records.`;
    
    if (!window.confirm(confirmMsg)) return;

    setIsExecuting(true);

    try {
      await onCopyClientData(sourceClientId, targetClientId, selectedCategories);
      setSuccessMessage(`Data successfully copied from ${sourceObj?.company_name} to ${targetObj?.company_name}!`);
      setTimeout(() => {
        setIsExecuting(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Error copying client data:', e);
      setErrorMessage(e?.message || 'An unexpected error occurred while copying client data.');
      setIsExecuting(false);
    }
  };

  const sourceClient = clients.find(c => c.id === sourceClientId);
  const targetClient = clients.find(c => c.id === targetClientId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 relative my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">Copy Client Account Data</h2>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Superadmin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Duplicate documents, references, and frameworks safely from Client A to Client B
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Notices */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Source and Target Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          
          {/* Source Client */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Source Client (Copy FROM):
            </label>
            <select
              value={sourceClientId}
              onChange={e => setSourceClientId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Source Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.client_code})
                </option>
              ))}
            </select>
            {sourceClient && (
              <p className="text-[10px] text-slate-500">
                Data will be read from <span className="font-bold text-slate-700">{sourceClient.company_name}</span>.
              </p>
            )}
          </div>

          {/* Target Client */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Target Client (Copy TO):
            </label>
            <select
              value={targetClientId}
              onChange={e => setTargetClientId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Select Target Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} disabled={c.id === sourceClientId}>
                  {c.company_name} ({c.client_code}) {c.id === sourceClientId ? '(Source)' : ''}
                </option>
              ))}
            </select>
            {targetClient && (
              <p className="text-[10px] text-slate-500">
                Data will be saved into <span className="font-bold text-slate-700">{targetClient.company_name}</span> account.
              </p>
            )}
          </div>
        </div>

        {/* Categories Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Data Categories to Copy ({selectedCategories.length}/{DATA_CATEGORIES.length}):
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {selectedCategories.length === DATA_CATEGORIES.length ? 'Deselect All' : 'Select All Categories'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
            {DATA_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5 text-indigo-600">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{cat.title}</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{cat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational Footer Note */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Isolated Account Guarantee:</strong> Copied records will receive brand new internal IDs scoped exclusively to Target Client. Source Client's data will remain completely intact and unaffected.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteCopy}
            disabled={isExecuting || !sourceClientId || !targetClientId || selectedCategories.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Copying Client Data...</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Execute Copy to Target Client</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
