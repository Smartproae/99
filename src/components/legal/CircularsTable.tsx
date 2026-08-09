import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Trash2, 
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
  Users,
  ShieldCheck,
  X,
  Search,
  Filter,
  RotateCcw,
  Tag,
  FilterX
} from 'lucide-react';
import { CircularItem } from '../../utils/legalData';

interface CircularsTableProps {
  circulars: CircularItem[];
  onUpdateCirculars: (updated: CircularItem[]) => void;
  currentUserRole: string;
  onLogAudit: (action: string, details: string, ref?: string) => void;
}

export default function CircularsTable({ 
  circulars, 
  onUpdateCirculars, 
  currentUserRole,
  onLogAudit 
}: CircularsTableProps) {
  // 1. States
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Group / Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Separate Filter States
  const [filterNo, setFilterNo] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [filterResp, setFilterResp] = useState('ALL');

  // Confirmation Delete States
  const [itemToDelete, setItemToDelete] = useState<CircularItem | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // New circular form state
  const [newNo, setNewNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newStatus, setNewStatus] = useState<'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable'>('Fully Compliant');
  const [newResp, setNewResp] = useState<string>('Medical Director');
  const [newRemarks, setNewRemarks] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');

  // Read-only guard
  const isReadOnly = currentUserRole === 'READ_ONLY';

  // Available responsible person options
  const responsibleOptions = [
    'Authorized Representative',
    'Medical Director',
    'Clinic Manager',
    'IT Manager',
    'HR Manager',
    'Infection Control Officer',
    'Biomedical Engineer'
  ];

  // Download Sample CSV Format File
  const handleDownloadSampleCSV = () => {
    const csvContent = 
      "Circular No,Circular Name,Date,Circular Category\n" +
      "DOH/CIRC/2026/112,Mandatory Fire Extinguisher pressure gauges audit logs,2026-07-20,Fire & Life Safety\n" +
      "DOH/CIRC/2026/115,Informed Consent audits for Pediatric Sedation protocols,2026-07-21,Clinical Practice\n" +
      "DOH/CIRC/2026/118,Annual verification parameters for dental autoclaves,2026-07-22,Biomedical Engineering";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'DOH_Circulars_Sample_Format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Simulated CSV Generator & Importer for Seamless Testing
  const handleGenerateSampleCSV = () => {
    const csvContent = 
      "Circular No,Circular Name,Date,Circular Category\n" +
      "DOH/CIRC/2026/112,Mandatory Fire Extinguisher pressure gauges audit logs,2026-07-20,Fire & Life Safety\n" +
      "DOH/CIRC/2026/115,Informed Consent audits for Pediatric Sedation protocols,2026-07-21,Clinical Practice\n" +
      "DOH/CIRC/2026/118,Annual verification parameters for dental autoclaves,2026-07-22,Biomedical Engineering";

    processCSVData(csvContent);
    setImportStatus('Successfully generated and parsed 3 test DOH circulars!');
    setTimeout(() => setImportStatus(null), 5000);
  };

  // Helper to parse CSV text into rows & cells handling quotes and multiline
  const parseCSVText = (csvText: string): string[][] => {
    const cleanText = csvText.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let curVal = '';
    let curRow: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const c = cleanText[i];
      const next = cleanText[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        curRow.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        curRow.push(curVal.trim().replace(/^"|"$/g, ''));
        if (curRow.some(cell => cell.length > 0)) {
          rows.push(curRow);
        }
        curRow = [];
        curVal = '';
      } else {
        curVal += c;
      }
    }

    if (curVal || curRow.length > 0) {
      curRow.push(curVal.trim().replace(/^"|"$/g, ''));
      if (curRow.some(cell => cell.length > 0)) {
        rows.push(curRow);
      }
    }

    return rows;
  };

  const processCSVData = (text: string) => {
    try {
      const rawRows = parseCSVText(text);
      if (rawRows.length === 0) {
        alert('The uploaded CSV file is empty.');
        return;
      }

      let noIdx = 0;
      let nameIdx = 1;
      let dateIdx = 2;
      let catIdx = 3;
      let statusIdx = -1;
      let respIdx = -1;
      let remarksIdx = -1;
      let startRowIndex = 0;

      const firstRowHeader = rawRows[0].map(h => h.toLowerCase());
      const isHeaderRow = firstRowHeader.some(h => 
        h.includes('circular') || h.includes('number') || h.includes('no') || h.includes('title') || h.includes('name') || h.includes('ref') || h.includes('category') || h.includes('date')
      );

      if (isHeaderRow) {
        startRowIndex = 1;
        firstRowHeader.forEach((colHeader, idx) => {
          if (colHeader.includes('no') || colHeader.includes('num') || colHeader.includes('code') || colHeader.includes('ref') || colHeader.includes('id')) {
            noIdx = idx;
          } else if (colHeader.includes('name') || colHeader.includes('title') || colHeader.includes('subject') || colHeader.includes('desc')) {
            nameIdx = idx;
          } else if (colHeader.includes('date') || colHeader.includes('time') || colHeader.includes('day')) {
            dateIdx = idx;
          } else if (colHeader.includes('cat') || colHeader.includes('dept') || colHeader.includes('type') || colHeader.includes('domain')) {
            catIdx = idx;
          } else if (colHeader.includes('status') || colHeader.includes('compliance')) {
            statusIdx = idx;
          } else if (colHeader.includes('resp') || colHeader.includes('owner') || colHeader.includes('person') || colHeader.includes('assign')) {
            respIdx = idx;
          } else if (colHeader.includes('remark') || colHeader.includes('note') || colHeader.includes('comment')) {
            remarksIdx = idx;
          }
        });
      }

      const parsed: CircularItem[] = [];
      let successCount = 0;

      for (let i = startRowIndex; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const circular_no = row[noIdx] ? row[noIdx].trim() : '';
        const circular_name = row[nameIdx] ? row[nameIdx].trim() : '';
        const date = row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().split('T')[0];
        const circular_category = row[catIdx] ? row[catIdx].trim() : 'General Compliance';
        const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim() : 'Fully Compliant';
        const respRaw = respIdx !== -1 && row[respIdx] ? row[respIdx].trim() : 'Medical Director';
        const remarks = remarksIdx !== -1 && row[remarksIdx] ? row[remarksIdx].trim() : 'Imported via CSV upload portal.';

        if (!circular_no && !circular_name) continue;
        if (circular_no.toLowerCase().startsWith('circular no') || circular_name.toLowerCase() === 'circular name') continue;

        let compliance_status: 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable' = 'Fully Compliant';
        if (/part/i.test(statusRaw)) compliance_status = 'Partially Compliant';
        else if (/non/i.test(statusRaw)) compliance_status = 'Non-Compliant';
        else if (/n\/?a|not/i.test(statusRaw)) compliance_status = 'Not Applicable';

        parsed.push({
          id: `circ_imported_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          circular_no: circular_no || `DOH/CIRC/${new Date().getFullYear()}/${100 + i}`,
          circular_name: circular_name || 'Untitled Circular Entry',
          date,
          circular_category: circular_category || 'General DOH Mandate',
          compliance_status,
          responsible_person: respRaw as any,
          remarks,
          target_date: ''
        });
        successCount++;
      }

      if (parsed.length > 0) {
        const merged = [...circulars, ...parsed];
        onUpdateCirculars(merged);
        onLogAudit('UPLOAD', `Bulk imported ${successCount} DOH circulars via CSV file.`, 'CSV-IMPORT');
        setImportStatus(`Success! Imported ${successCount} circulars successfully into table.`);
        setTimeout(() => setImportStatus(null), 6000);
      } else {
        alert('Could not parse valid records from CSV. Please ensure your CSV file contains columns for Circular No, Circular Name, Date, and Circular Category.');
      }
    } catch (e) {
      console.error('CSV Parsing Error:', e);
      alert('Error parsing CSV document. Ensure correct CSV formatting or try downloading our sample CSV template.');
    }
  };

  // 3. File upload and drag drop handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCSVData(text);
        }
      };
      reader.onerror = () => {
        alert('Error reading the selected CSV file.');
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadOnly) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCSVData(text);
        }
      };
      reader.onerror = () => {
        alert('Error reading the dropped file.');
      };
      reader.readAsText(file);
    }
  };

  // Unique categories list
  const availableCategories = Array.from(
    new Set([
      'Clinical Practice',
      'Fire & Life Safety',
      'Biomedical Engineering',
      'Infection Control',
      'HR',
      'IT',
      'General Compliance',
      ...circulars.map(c => c.circular_category).filter(Boolean)
    ])
  );

  // Filtered Circulars
  const filteredCirculars = circulars.filter(c => {
    const matchesNo = !filterNo || c.circular_no.toLowerCase().includes(filterNo.toLowerCase());
    const matchesName = !filterName || c.circular_name.toLowerCase().includes(filterName.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || (c.circular_category && c.circular_category.toLowerCase() === filterCategory.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.compliance_status === filterStatus;
    const matchesDate = !filterDate || c.date.includes(filterDate);
    const matchesResp = filterResp === 'ALL' || c.responsible_person === filterResp;

    return matchesNo && matchesName && matchesCategory && matchesStatus && matchesDate && matchesResp;
  });

  const isFilterActive = Boolean(filterNo || filterName || filterCategory !== 'ALL' || filterStatus !== 'ALL' || filterDate || filterResp !== 'ALL');

  const handleResetFilters = () => {
    setFilterNo('');
    setFilterName('');
    setFilterCategory('ALL');
    setFilterStatus('ALL');
    setFilterDate('');
    setFilterResp('ALL');
  };

  // Group Select Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCirculars.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = (newStatusVal: string) => {
    if (!newStatusVal || selectedIds.length === 0 || isReadOnly) return;
    const updated = circulars.map(c => {
      if (selectedIds.includes(c.id)) {
        return { ...c, compliance_status: newStatusVal as any };
      }
      return c;
    });
    onUpdateCirculars(updated);
    onLogAudit('UPDATE', `Bulk updated compliance status to "${newStatusVal}" for ${selectedIds.length} circulars`, 'BULK-UPDATE');
  };

  const handleBulkUpdateResponsible = (newRespVal: string) => {
    if (!newRespVal || selectedIds.length === 0 || isReadOnly) return;
    const updated = circulars.map(c => {
      if (selectedIds.includes(c.id)) {
        return { ...c, responsible_person: newRespVal as any };
      }
      return c;
    });
    onUpdateCirculars(updated);
    onLogAudit('UPDATE', `Bulk assigned responsible person as "${newRespVal}" for ${selectedIds.length} circulars`, 'BULK-UPDATE');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0 || isReadOnly) return;
    setShowBulkDeleteModal(true);
  };

  // 4. Edit row controls
  const handleFieldChange = (id: string, key: keyof CircularItem, value: any) => {
    if (isReadOnly) return;
    const updated = circulars.map(c => {
      if (c.id === id) {
        return { ...c, [key]: value };
      }
      return c;
    });
    onUpdateCirculars(updated);

    const updatedItem = updated.find(c => c.id === id);
    if (updatedItem) {
      onLogAudit('UPDATE', `Updated circular field "${key}" to "${value}" on ${updatedItem.circular_no}`, updatedItem.circular_no);
    }
  };

  const handleDeleteRow = (id: string) => {
    if (isReadOnly) return;
    const target = circulars.find(c => c.id === id);
    const filtered = circulars.filter(c => c.id !== id);
    onUpdateCirculars(filtered);
    if (target) {
      onLogAudit('DELETE', `Removed circular entry ${target.circular_no}`, target.circular_no);
    }
  };

  // 5. Evidence file upload simulation on rows
  const handleEvidenceUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      handleFieldChange(id, 'evidence_file_name', file.name);
      onLogAudit('UPLOAD', `Uploaded evidence file ${file.name} for circular`, id);
    }
  };

  // 6. Manual additions
  const handleAddCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newNo || !newName || !newDate || !newCat) {
      alert('Please fill out all mandatory circular fields.');
      return;
    }

    const newItem: CircularItem = {
      id: `circ_${Date.now()}`,
      circular_no: newNo,
      circular_name: newName,
      date: newDate,
      circular_category: newCat,
      compliance_status: newStatus,
      responsible_person: newResp as any,
      remarks: newRemarks,
      target_date: newTargetDate
    };

    onUpdateCirculars([newItem, ...circulars]);
    onLogAudit('CREATE', `Manually registered circular ${newNo}`, newNo);

    // Reset Form
    setNewNo('');
    setNewName('');
    setNewDate('');
    setNewCat('');
    setNewRemarks('');
    setNewTargetDate('');
    setShowAddForm(false);
  };

  // Helpers for badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fully Compliant':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Compliant':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Non-Compliant':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div id="doh-circulars-module" className="space-y-4">
      {/* 1. Drag and Drop CSV Importer Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drag and Drop Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
            isDragOver 
              ? 'border-emerald-500 bg-emerald-50/20' 
              : 'border-slate-200 bg-white'
          }`}
        >
          <Upload className={`w-8 h-8 mb-2.5 ${isDragOver ? 'text-emerald-600' : 'text-slate-400'}`} />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Import Circulars via CSV</h3>
          <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
            Drag & drop your official DOH circular CSV sheet here, or click to choose from system files.
          </p>
          <div className="text-[9px] text-indigo-600 font-bold mt-2">
            Required columns: Circular No, Circular Name, Date, Circular Category
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
              Choose CSV File
              <input 
                type="file" 
                className="hidden" 
                accept=".csv, text/csv, application/vnd.ms-excel, text/plain, .txt" 
                onChange={handleFileChange} 
                disabled={isReadOnly}
              />
            </label>
            <button
              onClick={handleDownloadSampleCSV}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Download Sample Format
            </button>
            <button
              id="generate-test-circular-csv-btn"
              onClick={handleGenerateSampleCSV}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Generate Test CSV & Import
            </button>
          </div>
        </div>

        {/* Info & Manual actions panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">DOH Circular Registry</span>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug">Circular compliance monitoring</h3>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Upload spreadsheets received directly from DOH or health information networks (Malaffi) to cross-reference audit records.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {showAddForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Hide Add Form' : 'Register New Circular Manually'}
            </button>
          </div>
        </div>
      </div>

      {importStatus && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-bold animate-fade-in">
          <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
          {importStatus}
        </div>
      )}

      {/* Group / Bulk Selection Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs font-bold text-slate-200">Bulk Group Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Group Select: Compliance Status */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase">Set Status:</span>
              <select
                onChange={e => {
                  if (e.target.value) {
                    handleBulkUpdateStatus(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={isReadOnly}
                className="bg-slate-900 text-white text-[10px] font-bold p-1 rounded border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Choose Status...</option>
                <option value="Fully Compliant">Fully Compliant</option>
                <option value="Partially Compliant">Partially Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            {/* Group Select: Responsible Person */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase">Assign Owner:</span>
              <select
                onChange={e => {
                  if (e.target.value) {
                    handleBulkUpdateResponsible(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={isReadOnly}
                className="bg-slate-900 text-white text-[10px] font-bold p-1 rounded border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Choose Owner...</option>
                {responsibleOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleBulkDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Manual Form Block */}
      {showAddForm && (
        <form onSubmit={handleAddCircular} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fade-in">
          <div className="md:col-span-3 border-b border-slate-100 pb-2 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Plus className="w-4 h-4 text-indigo-600" /> Manual Circular Entry
            </h3>
          </div>
          
          <div>
            <label className="block font-bold text-slate-600 mb-1">Circular No*</label>
            <input
              type="text"
              required
              value={newNo}
              onChange={e => setNewNo(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. DOH/CIRC/2026/109"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Circular Name*</label>
            <input
              type="text"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. Updated Autoclave standards"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Date*</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Category*</label>
            <input
              type="text"
              required
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. Infection Control"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Compliance Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer"
            >
              <option value="Fully Compliant">Fully Compliant</option>
              <option value="Partially Compliant">Partially Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Responsible Owner</label>
            <select
              value={newResp}
              onChange={e => setNewResp(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer"
            >
              {responsibleOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-600 mb-1">Compliance Remarks / Progress details</label>
            <input
              type="text"
              value={newRemarks}
              onChange={e => setNewRemarks(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="Provide tracking updates here..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Target Completion Date</label>
            <input
              type="date"
              value={newTargetDate}
              onChange={e => setNewTargetDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
            />
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Register Circular
            </button>
          </div>
        </form>
      )}

      {/* 3. Filter Toolbar with Separate Fields */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 font-sans">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Filter Circular Records</span>
            <span className="text-[10px] text-slate-400 font-bold">({filteredCirculars.length} of {circulars.length})</span>
          </div>
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl cursor-pointer transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* 1. Circular No Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Circular No</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterNo}
                onChange={e => setFilterNo(e.target.value)}
                placeholder="e.g. 112"
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 2. Circular Name Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Circular Name</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="e.g. Fire safety"
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 3. Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories ({circulars.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 4. Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none cursor-pointer"
            />
          </div>

          {/* 5. Compliance Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compliance Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Fully Compliant">Fully Compliant</option>
              <option value="Partially Compliant">Partially Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>

          {/* 6. Responsible Owner Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsible Owner</label>
            <select
              value={filterResp}
              onChange={e => setFilterResp(e.target.value)}
              className="w-full p-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Owners</option>
              {responsibleOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar for Group Selection */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full">
              {selectedIds.length} Circular(s) Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Group Actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Bulk Compliance Status Updater */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-extrabold text-slate-300 uppercase">Change Status:</span>
                <select
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkUpdateStatus(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">Select Compliance Status...</option>
                  <option value="Fully Compliant" className="bg-slate-900 text-emerald-400">✓ Set Fully Compliant</option>
                  <option value="Partially Compliant" className="bg-slate-900 text-amber-400">⚡ Set Partially Compliant</option>
                  <option value="Non-Compliant" className="bg-slate-900 text-rose-400">✕ Set Non-Compliant</option>
                  <option value="Not Applicable" className="bg-slate-900 text-slate-400">-- Set Not Applicable</option>
                </select>
              </div>
            )}

            {/* Bulk Owner Updater */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-extrabold text-slate-300 uppercase">Owner:</span>
                <select
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkUpdateResponsible(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">Assign Owner...</option>
                  {responsibleOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-slate-900 text-slate-200">{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bulk Delete Button */}
            {!isReadOnly && (
              <button
                onClick={handleBulkDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            )}

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 4. Circulars Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700 font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCirculars.length > 0 && selectedIds.length === filteredCirculars.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 w-36">Circular No</th>
                <th className="p-4">Circular Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Compliance Status</th>
                <th className="p-4">Responsible Person</th>
                <th className="p-4">Evidence / Target Date</th>
                <th className="p-4">Remarks</th>
                {!isReadOnly && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCirculars.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 font-bold text-slate-400 uppercase tracking-wider">
                    {isFilterActive ? 'No DOH circulars match the current filter criteria.' : 'No DOH circular records. Upload a CSV list to populate.'}
                  </td>
                </tr>
              ) : (
                filteredCirculars.map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr key={c.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'}`}>
                      {/* Checkbox */}
                      <td className="p-4 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(c.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-1"
                        />
                      </td>

                      {/* Circular No */}
                      <td className="p-4 font-bold text-slate-950 align-top">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] px-2 py-0.5 rounded block w-max">
                          {c.circular_no}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">Date: {c.date}</span>
                      </td>

                      {/* Circular Name */}
                      <td className="p-4 align-top max-w-xs font-extrabold text-slate-800 text-xs leading-normal">
                        {c.circular_name}
                      </td>

                      {/* Category */}
                      <td className="p-4 align-top">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold block w-max">
                          🏷️ {c.circular_category}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[9px] font-bold ${getStatusBadge(c.compliance_status)}`}>
                            {c.compliance_status}
                          </span>
                          {!isReadOnly && (
                            <select
                              value={c.compliance_status}
                              onChange={e => handleFieldChange(c.id, 'compliance_status', e.target.value)}
                              className="text-[9px] font-bold p-1 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                            >
                              <option value="Fully Compliant">Fully Compliant</option>
                              <option value="Partially Compliant">Partially Compliant</option>
                              <option value="Non-Compliant">Non-Compliant</option>
                              <option value="Not Applicable">Not Applicable</option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Responsible dropdown */}
                      <td className="p-4 align-top">
                        {isReadOnly ? (
                          <span className="font-semibold text-slate-800 text-[11px] block">{c.responsible_person}</span>
                        ) : (
                          <select
                            value={c.responsible_person}
                            onChange={e => handleFieldChange(c.id, 'responsible_person', e.target.value)}
                            className="text-[10px] font-bold p-1 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                          >
                            {responsibleOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Evidence and Target Date */}
                      <td className="p-4 align-top">
                        {/* Target completion date */}
                        <div className="flex items-center gap-1 mb-2">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {isReadOnly ? (
                            <span className="text-[9px] text-slate-600 font-bold">{c.target_date || 'N/A'}</span>
                          ) : (
                            <input 
                              type="date"
                              value={c.target_date || ''}
                              onChange={e => handleFieldChange(c.id, 'target_date', e.target.value)}
                              className="text-[9px] p-0.5 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                            />
                          )}
                        </div>

                        {/* Evidence upload */}
                        {c.evidence_file_name ? (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate max-w-[110px] block">
                            📎 {c.evidence_file_name}
                          </span>
                        ) : (
                          <div>
                            {!isReadOnly ? (
                              <label className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer flex items-center gap-0.5">
                                <Upload className="w-3 h-3 text-emerald-600" /> Upload File
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={e => handleEvidenceUpload(c.id, e)} 
                                />
                              </label>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">No proof uploaded</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Remarks Text Input */}
                      <td className="p-4 align-top">
                        {isReadOnly ? (
                          <p className="text-[10px] text-slate-600 italic leading-snug">{c.remarks || 'No remarks added.'}</p>
                        ) : (
                          <textarea
                            rows={2}
                            value={c.remarks || ''}
                            onChange={e => handleFieldChange(c.id, 'remarks', e.target.value)}
                            className="w-full text-[10px] font-medium p-1 border border-slate-200 bg-slate-50/50 rounded focus:outline-none"
                            placeholder="Add tracking notes..."
                          />
                        )}
                      </td>

                      {/* Actions with Delete Confirmation Trigger */}
                      {!isReadOnly && (
                        <td className="p-4 align-top text-center">
                          <button
                            onClick={() => setItemToDelete(c)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1.5 rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center justify-center gap-1 font-bold text-[10px]"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal for Single Circular */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 animate-fade-in font-sans">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Confirm Delete Circular
            </h3>
            <p className="text-center text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete circular record <span className="font-mono font-bold text-slate-900">{itemToDelete.circular_no}</span>?
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 text-xs font-medium text-slate-700 space-y-1">
              <div className="font-extrabold text-slate-900">{itemToDelete.circular_name}</div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Category: {itemToDelete.circular_category}</span>
                <span>Date: {itemToDelete.date}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteRow(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Bulk Delete */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 animate-fade-in font-sans">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Confirm Bulk Deletion
            </h3>
            <p className="text-center text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently remove <span className="font-extrabold text-rose-600">{selectedIds.length}</span> selected circular record(s)? This action will be recorded in the audit trail.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const filtered = circulars.filter(c => !selectedIds.includes(c.id));
                  onUpdateCirculars(filtered);
                  onLogAudit('DELETE', `Bulk deleted ${selectedIds.length} circulars`, 'BULK-DELETE');
                  setSelectedIds([]);
                  setShowBulkDeleteModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Confirm Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

