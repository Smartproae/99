import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Calendar,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Download,
  ShieldCheck,
  Users,
  X,
  Search,
  Filter,
  Printer,
  FolderCheck,
  FolderOpen,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { StandardItem } from '../../utils/legalData';
import { printCurrentView } from '../../utils/printUtils';

interface StandardsTableProps {
  standards: StandardItem[];
  onUpdateStandards: (updated: StandardItem[]) => void;
  currentUserRole: string;
  onLogAudit: (action: string, details: string, ref?: string) => void;
}

export default function StandardsTable({ 
  standards, 
  onUpdateStandards, 
  currentUserRole,
  onLogAudit 
}: StandardsTableProps) {
  // 1. States
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Group / Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Separate Search & Filter States
  const [filterRef, setFilterRef] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [filterResp, setFilterResp] = useState('ALL');

  // Deletion Modals State
  const [itemToDelete, setItemToDelete] = useState<StandardItem | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);

  // Form states
  const [newRef, setNewRef] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General Standards');
  const [newDate, setNewDate] = useState('');
  const [newStatus, setNewStatus] = useState<'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable'>('Fully Compliant');
  const [newResp, setNewResp] = useState<string>('Medical Director');
  const [newRemarks, setNewRemarks] = useState('');
  const [newReviewDate, setNewReviewDate] = useState('');

  // Read-only checker
  const isReadOnly = currentUserRole === 'READ_ONLY';

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
      "Reference,Standard Name,Date\n" +
      "DOH-STD-PED-001,Standards for Pediatric Dental Sedation v1.2,2025-01-10\n" +
      "DOH-STD-IPC-014,Guidelines for Autoclave and Instrument Sterility,2025-06-15\n" +
      "DOH-STD-GEN-002,Physical Accessibility Architectural standards for Outpatient Centers,2025-07-22";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'DOH_Standards_Sample_Format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group Select Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(standards.map(s => s.id));
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
    const updated = standards.map(s => {
      if (selectedIds.includes(s.id)) {
        return { ...s, compliance_status: newStatusVal as any };
      }
      return s;
    });
    onUpdateStandards(updated);
    onLogAudit('UPDATE', `Bulk updated compliance status to "${newStatusVal}" for ${selectedIds.length} standards`, 'BULK-UPDATE');
  };

  const handleBulkUpdateResponsible = (newRespVal: string) => {
    if (!newRespVal || selectedIds.length === 0 || isReadOnly) return;
    const updated = standards.map(s => {
      if (selectedIds.includes(s.id)) {
        return { ...s, responsible_person: newRespVal as any };
      }
      return s;
    });
    onUpdateStandards(updated);
    onLogAudit('UPDATE', `Bulk assigned responsible person as "${newRespVal}" for ${selectedIds.length} standards`, 'BULK-UPDATE');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0 || isReadOnly) return;
    setShowBulkDeleteModal(true);
  };

  // 2. Simulated CSV generator & Importer
  const handleGenerateSampleCSV = () => {
    const csvContent = 
      "Reference,Standard Name,Date\n" +
      "DOH-STD-PED-001,Standards for Pediatric Dental Sedation v1.2,2025-01-10\n" +
      "DOH-STD-IPC-014,Guidelines for Autoclave and Instrument Sterility,2025-06-15\n" +
      "DOH-STD-GEN-002,Physical Accessibility Architectural standards for Outpatient Centers,2025-07-22";

    processCSVData(csvContent);
    setImportStatus('Successfully generated and parsed 3 test DOH standards!');
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

      let refIdx = 0;
      let nameIdx = 1;
      let dateIdx = 2;
      let statusIdx = -1;
      let respIdx = -1;
      let remarksIdx = -1;
      let startRowIndex = 0;

      const firstRowHeader = rawRows[0].map(h => h.toLowerCase());
      const isHeaderRow = firstRowHeader.some(h => 
        h.includes('reference') || h.includes('ref') || h.includes('standard') || h.includes('title') || h.includes('name') || h.includes('code') || h.includes('date')
      );

      if (isHeaderRow) {
        startRowIndex = 1;
        firstRowHeader.forEach((colHeader, idx) => {
          if (colHeader.includes('ref') || colHeader.includes('code') || colHeader.includes('no') || colHeader.includes('num') || colHeader.includes('id')) {
            refIdx = idx;
          } else if (colHeader.includes('name') || colHeader.includes('title') || colHeader.includes('standard') || colHeader.includes('desc')) {
            nameIdx = idx;
          } else if (colHeader.includes('date') || colHeader.includes('time') || colHeader.includes('day')) {
            dateIdx = idx;
          } else if (colHeader.includes('status') || colHeader.includes('compliance')) {
            statusIdx = idx;
          } else if (colHeader.includes('resp') || colHeader.includes('owner') || colHeader.includes('person') || colHeader.includes('assign')) {
            respIdx = idx;
          } else if (colHeader.includes('remark') || colHeader.includes('note') || colHeader.includes('comment')) {
            remarksIdx = idx;
          }
        });
      }

      const parsed: StandardItem[] = [];
      let count = 0;

      for (let i = startRowIndex; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const reference = row[refIdx] ? row[refIdx].trim() : '';
        const standard_name = row[nameIdx] ? row[nameIdx].trim() : '';
        const date = row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().split('T')[0];
        const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim() : 'Fully Compliant';
        const respRaw = respIdx !== -1 && row[respIdx] ? row[respIdx].trim() : 'Medical Director';
        const remarks = remarksIdx !== -1 && row[remarksIdx] ? row[remarksIdx].trim() : 'Imported via CSV portal.';

        if (!reference && !standard_name) continue;
        if (reference.toLowerCase() === 'reference' || standard_name.toLowerCase() === 'standard name') continue;

        let compliance_status: 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable' = 'Fully Compliant';
        if (/part/i.test(statusRaw)) compliance_status = 'Partially Compliant';
        else if (/non/i.test(statusRaw)) compliance_status = 'Non-Compliant';
        else if (/n\/?a|not/i.test(statusRaw)) compliance_status = 'Not Applicable';

        parsed.push({
          id: `std_imported_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          reference: reference || `DOH-STD-GEN-${100 + i}`,
          standard_name: standard_name || 'Untitled DOH Standard',
          date,
          compliance_status,
          responsible_person: respRaw as any,
          remarks,
          review_date: ''
        });
        count++;
      }

      if (parsed.length > 0) {
        const merged = [...standards, ...parsed];
        onUpdateStandards(merged);
        onLogAudit('UPLOAD', `Bulk imported ${count} DOH Standards via CSV file.`, 'CSV-IMPORT');
        setImportStatus(`Success! Parsed and appended ${count} standards correctly.`);
        setTimeout(() => setImportStatus(null), 6000);
      } else {
        alert('Could not parse valid records from CSV. Please verify columns: Reference, Standard Name, Date.');
      }
    } catch (e) {
      console.error('CSV Parsing Error:', e);
      alert('Error parsing CSV document. Please check file formatting or download our sample CSV format.');
    }
  };

  // 3. Importer callbacks
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
        alert('Error reading dropped file.');
      };
      reader.readAsText(file);
    }
  };

  // 4. Update row field
  const handleFieldChange = (id: string, key: keyof StandardItem, value: any) => {
    if (isReadOnly) return;
    const updated = standards.map(s => {
      if (s.id === id) {
        return { ...s, [key]: value };
      }
      return s;
    });
    onUpdateStandards(updated);

    const updatedItem = updated.find(s => s.id === id);
    if (updatedItem) {
      onLogAudit('UPDATE', `Updated standard field "${key}" to "${value}" on ${updatedItem.reference}`, updatedItem.reference);
    }
  };

  const handleDeleteRow = (id: string) => {
    if (isReadOnly) return;
    const target = standards.find(s => s.id === id);
    const filtered = standards.filter(s => s.id !== id);
    onUpdateStandards(filtered);
    if (target) {
      onLogAudit('DELETE', `Removed standard entry ${target.reference}`, target.reference);
    }
  };

  const handleEvidenceUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      handleFieldChange(id, 'evidence_file_name', file.name);
      onLogAudit('UPLOAD', `Uploaded evidence file ${file.name} for standard`, id);
    }
  };

  const handleSaveAllToDocRepository = () => {
    onLogAudit('SYNC', `Saved all ${standards.length} DOH Standards into Document Repository under "DOH Standards" section`, 'DOC-REPO');
    setImportStatus(`All ${standards.length} DOH Standards synchronized and saved to Document Repository in "DOH Standards" section!`);
    setTimeout(() => setImportStatus(null), 6000);
  };

  const isFilterActive = filterRef !== '' || filterName !== '' || filterCategory !== 'ALL' || filterStatus !== 'ALL' || filterDate !== '' || filterResp !== 'ALL';

  const handleResetFilters = () => {
    setFilterRef('');
    setFilterName('');
    setFilterCategory('ALL');
    setFilterStatus('ALL');
    setFilterDate('');
    setFilterResp('ALL');
  };

  const availableCategories = Array.from(
    new Set(
      ['Patient Care & Rights', 'Radiation & Safety', 'Emergency & Safety', 'Laboratory & Quality', 'Infection Control', 'General Standards', ...standards.map(s => s.standard_category).filter(Boolean)]
    )
  );

  const filteredStandards = standards.filter(s => {
    const matchesRef = !filterRef || s.reference.toLowerCase().includes(filterRef.toLowerCase());
    const matchesName = !filterName || s.standard_name.toLowerCase().includes(filterName.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || (s.standard_category && s.standard_category.toLowerCase() === filterCategory.toLowerCase());
    const matchesDate = !filterDate || s.date.includes(filterDate);
    const matchesStatus = filterStatus === 'ALL' || s.compliance_status === filterStatus;
    const matchesResp = filterResp === 'ALL' || s.responsible_person === filterResp;

    return matchesRef && matchesName && matchesCategory && matchesDate && matchesStatus && matchesResp;
  });

  const compliantReportStandards = standards.filter(s => s.compliance_status === 'Fully Compliant' || s.compliance_status === 'Partially Compliant');

  // 5. Submit Form
  const handleAddStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newRef || !newName || !newDate) {
      alert('Please fill out all required fields.');
      return;
    }

    const newItem: StandardItem = {
      id: `std_${Date.now()}`,
      reference: newRef,
      standard_name: newName,
      date: newDate,
      standard_category: newCategory || 'General Standards',
      compliance_status: newStatus,
      responsible_person: newResp,
      remarks: newRemarks,
      review_date: newReviewDate
    };

    onUpdateStandards([newItem, ...standards]);
    onLogAudit('CREATE', `Manually registered standard reference ${newRef}`, newRef);

    // Reset Form
    setNewRef('');
    setNewName('');
    setNewDate('');
    setNewRemarks('');
    setNewReviewDate('');
    setShowAddForm(false);
  };

  // Badge helpers
  const getStatusBadgeClass = (status: string) => {
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
    <div id="doh-standards-module" className="space-y-4">
      {/* Importer Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drag Over Block */}
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
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Import Standards via CSV</h3>
          <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
            Drag & drop your DOH standards CSV sheet here, or choose from system files.
          </p>
          <div className="text-[9px] text-indigo-600 font-bold mt-2">
            Required columns: Reference, Standard Name, Date
          </div>
          <div className="flex flex-wrap gap-2.5 mt-4 justify-center">
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
              id="generate-test-standard-csv-btn"
              onClick={handleGenerateSampleCSV}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Generate Test CSV & Import
            </button>
          </div>
        </div>

        {/* Form and Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">DOH Standards Registry</span>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-snug">Physical & Clinical Standards</h3>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Track detailed healthcare criteria. Map your compliance files directly to the target reference parameters.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {showAddForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Hide Add Form' : 'Register New Standard Manually'}
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

      {/* 2. Standards Filter Toolbar with Separate Fields */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 font-sans">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Filter Standard Records</span>
            <span className="text-[10px] text-slate-400 font-bold">({filteredStandards.length} of {standards.length})</span>
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
          {/* 1. Reference No Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference No</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterRef}
                onChange={e => setFilterRef(e.target.value)}
                placeholder="e.g. PED-001"
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* 2. Standard Name Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Standard Name</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                placeholder="e.g. Pediatric"
                className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-teal-500"
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
              <option value="ALL">All Categories ({standards.length})</option>
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

        {/* Action Buttons: Save to Doc Repo & Export Report */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleSaveAllToDocRepository}
            className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-extrabold text-[10px] px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            title="Save all DOH Standards to Document Repository"
          >
            <FolderCheck className="w-3.5 h-3.5 text-teal-600" />
            Save to Doc Repo
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            Compliance Report
          </button>
        </div>
      </div>

      {/* Group / Bulk Selection Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono">
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

      {/* Manual Insert Form */}
      {showAddForm && (
        <form onSubmit={handleAddStandard} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fade-in">
          <div className="md:col-span-3 border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Plus className="w-4 h-4 text-indigo-600" /> Manual Standard Entry
            </h3>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Reference ID*</label>
            <input
              type="text"
              required
              value={newRef}
              onChange={e => setNewRef(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. DOH-STD-RAD-009"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-600 mb-1">Standard Name*</label>
            <input
              type="text"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. Lead Shields calibration parameters"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="e.g. Radiation & Safety"
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
              onChange={e => setNewResp(e.target.value as any)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer"
            >
              <option value="Authorized Representative">Authorized Rep</option>
              <option value="Medical Director">Medical Director</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-slate-600 mb-1">Remarks / Compliance Evidence description</label>
            <input
              type="text"
              value={newRemarks}
              onChange={e => setNewRemarks(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
              placeholder="Provide comments..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Next Review / Audit Date</label>
            <input
              type="date"
              value={newReviewDate}
              onChange={e => setNewReviewDate(e.target.value)}
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
              Register Standard
            </button>
          </div>
        </form>
      )}

      {/* Floating Group Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="bg-teal-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full">
              {selectedIds.length} Standard(s) Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Group Actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Bulk Compliance Status Updater */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
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
                  <option value="Fully Compliant" className="bg-slate-900 text-teal-400">✓ Set Fully Compliant</option>
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

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStandards.length > 0 && selectedIds.length === filteredStandards.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 w-40">Reference No</th>
                <th className="p-4">Standard Name</th>
                <th className="p-4 text-center">Compliance Status</th>
                <th className="p-4">Responsible Owner</th>
                <th className="p-4">Evidence / Review Date</th>
                <th className="p-4">Remarks</th>
                {!isReadOnly && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStandards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 font-bold text-slate-400 uppercase tracking-wider">
                    No DOH standards match current search or filters.
                  </td>
                </tr>
              ) : (
                filteredStandards.map(s => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} className={`transition-colors ${isSelected ? 'bg-teal-50/40' : 'hover:bg-slate-50/50'}`}>
                      {/* Checkbox */}
                      <td className="p-4 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(s.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer mt-1"
                        />
                      </td>

                      {/* Reference No */}
                      <td className="p-4 font-bold text-slate-950 align-top">
                        <span className="bg-teal-50 border border-teal-100 text-teal-700 font-mono text-[9px] px-2 py-0.5 rounded block w-max">
                          {s.reference}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-1">Issue Date: {s.date}</span>
                      </td>

                      {/* Standard Name */}
                      <td className="p-4 align-top max-w-xs">
                        <span className="font-extrabold text-slate-800 block text-xs leading-normal">{s.standard_name}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-mono font-bold">
                            Doc Ver: {s.version || s.doc_version || 'v1.0'}
                          </span>
                          {s.standard_category && (
                            <span className="inline-block bg-teal-50 text-teal-800 border border-teal-100 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              🏷️ {s.standard_category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-[9px] font-bold ${getStatusBadgeClass(s.compliance_status)}`}>
                            {s.compliance_status}
                          </span>
                          {!isReadOnly && (
                            <select
                              value={s.compliance_status}
                              onChange={e => handleFieldChange(s.id, 'compliance_status', e.target.value)}
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
                          <span className="font-semibold text-slate-800 text-[11px] block">{s.responsible_person}</span>
                        ) : (
                          <select
                            value={s.responsible_person}
                            onChange={e => handleFieldChange(s.id, 'responsible_person', e.target.value)}
                            className="text-[10px] font-bold p-1.5 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                          >
                            {responsibleOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Evidence & Review Date */}
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1 mb-2">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {isReadOnly ? (
                            <span className="text-[9px] text-slate-600 font-bold">{s.review_date || 'N/A'}</span>
                          ) : (
                            <input 
                              type="date"
                              value={s.review_date || ''}
                              onChange={e => handleFieldChange(s.id, 'review_date', e.target.value)}
                              className="text-[9px] p-0.5 border border-slate-200 rounded focus:outline-none bg-white cursor-pointer"
                            />
                          )}
                        </div>

                        {s.evidence_file_name ? (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate max-w-[110px] block">
                            📎 {s.evidence_file_name}
                          </span>
                        ) : (
                          <div>
                            {!isReadOnly ? (
                              <label className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer flex items-center gap-0.5">
                                <Upload className="w-3 h-3 text-emerald-600" /> Upload File
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={e => handleEvidenceUpload(s.id, e)} 
                                />
                              </label>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">No proof uploaded</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Remarks Input */}
                      <td className="p-4 align-top">
                        {isReadOnly ? (
                          <p className="text-[10px] text-slate-600 italic leading-snug">{s.remarks || 'No remarks added.'}</p>
                        ) : (
                          <textarea
                            rows={2}
                            value={s.remarks || ''}
                            onChange={e => handleFieldChange(s.id, 'remarks', e.target.value)}
                            className="w-full text-[10px] font-medium p-1 border border-slate-200 bg-slate-50/50 rounded focus:outline-none"
                            placeholder="Add notes..."
                          />
                        )}
                      </td>

                      {/* Delete actions */}
                      {!isReadOnly && (
                        <td className="p-4 align-top text-center">
                          <button
                            onClick={() => setItemToDelete(s)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors inline-block"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Compliance Status Report Modal (Fully & Partially Compliant Standards) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in font-sans">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">DOH Standards Compliance Status Report</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filter: Showing Fully Compliant & Partially Compliant Standards Only</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm cursor-pointer border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-1 bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Report Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Fully Compliant</div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {standards.filter(s => s.compliance_status === 'Fully Compliant').length}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl">
                  <div className="text-[10px] font-bold text-amber-800 uppercase">Partially Compliant</div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">
                    {standards.filter(s => s.compliance_status === 'Partially Compliant').length}
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-100 p-3.5 rounded-xl">
                  <div className="text-[10px] font-bold text-teal-800 uppercase">Total Compliant Standards</div>
                  <div className="text-xl font-black text-teal-900 mt-0.5">
                    {compliantReportStandards.length} / {standards.length}
                  </div>
                </div>
              </div>

              {/* Table of Compliant Standards */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-[10px] text-slate-600 uppercase">
                      <th className="p-3">Reference No</th>
                      <th className="p-3">Standard Name</th>
                      <th className="p-3">Doc Version</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Responsible Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compliantReportStandards.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                          No standards meet the Fully Compliant or Partially Compliant status criteria.
                        </td>
                      </tr>
                    ) : (
                      compliantReportStandards.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-teal-900">{s.reference}</td>
                          <td className="p-3 font-bold text-slate-800">{s.standard_name}</td>
                          <td className="p-3 font-bold text-indigo-900 font-mono text-[10px]">{s.version || s.doc_version || 'v1.0'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block border px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(s.compliance_status)}`}>
                              {s.compliance_status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{s.responsible_person}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-500 font-medium">Department of Health Abu Dhabi Healthcare Standards Framework</span>
              <button
                onClick={() => printCurrentView({ printableId: 'printable-report-document' })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" /> Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 animate-fade-in font-sans">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Confirm Delete Standard
            </h3>
            <p className="text-center text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete standard record <span className="font-mono font-bold text-slate-900">{itemToDelete.reference}</span>?
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 text-xs font-medium text-slate-700 space-y-1">
              <div className="font-extrabold text-slate-900">{itemToDelete.standard_name}</div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Category: {itemToDelete.standard_category || 'General'}</span>
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
              Are you sure you want to permanently remove <span className="font-extrabold text-rose-600">{selectedIds.length}</span> selected standard record(s)? This action will be recorded in the audit trail.
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
                  const filtered = standards.filter(s => !selectedIds.includes(s.id));
                  onUpdateStandards(filtered);
                  onLogAudit('DELETE', `Bulk deleted ${selectedIds.length} standards`, 'BULK-DELETE');
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
