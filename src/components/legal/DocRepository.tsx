import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  FolderOpen,
  Sparkles,
  Check,
  CheckCircle,
  FileCheck,
  BookmarkCheck,
  Tag,
  X,
  List,
  LayoutGrid,
  FolderCheck,
  Layers,
  ShieldCheck,
  PieChart,
  AlertTriangle,
  Info
} from 'lucide-react';
import { RepoFile, CircularItem, LegalRequirement, StandardItem, ComplianceDoc } from '../../utils/legalData';

interface DocRepositoryProps {
  files: RepoFile[];
  circulars?: CircularItem[];
  requirements?: LegalRequirement[];
  standards?: StandardItem[];
  docs?: ComplianceDoc[];
  onUpdateCirculars?: (updated: CircularItem[]) => void;
  onUpdateStandards?: (updated: StandardItem[]) => void;
  onUpdateRequirements?: (updated: LegalRequirement[]) => void;
  onDeleteFile: (id: string) => void;
  currentUserRole: string;
  onLogAudit: (action: string, details: string, ref?: string) => void;
}

export default function DocRepository({ 
  files, 
  circulars = [],
  requirements = [],
  standards = [],
  docs = [],
  onUpdateCirculars,
  onUpdateStandards,
  onUpdateRequirements,
  onDeleteFile, 
  currentUserRole,
  onLogAudit 
}: DocRepositoryProps) {
  // 1. States
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [previewFile, setPreviewFile] = useState<RepoFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Bulk Selection & Confirmation States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const isReadOnly = currentUserRole === 'READ_ONLY';

  // Helper: Get document compliance status
  const getFileComplianceStatus = (file: RepoFile): 'Fully Compliant' | 'Partially Compliant' | 'Non-Compliant' => {
    const ref = file.associatedRef.toLowerCase();

    // 1. Check in circulars
    const matchedCirc = circulars.find(c => c.circular_no.toLowerCase() === ref || file.id.includes(c.id));
    if (matchedCirc) {
      if (matchedCirc.compliance_status === 'Partially Compliant') return 'Partially Compliant';
      if (matchedCirc.compliance_status === 'Non-Compliant') return 'Non-Compliant';
      return 'Fully Compliant';
    }

    // 2. Check in standards
    const matchedStd = standards.find(s => s.reference.toLowerCase() === ref || file.id.includes(s.id));
    if (matchedStd) {
      if (matchedStd.compliance_status === 'Partially Compliant') return 'Partially Compliant';
      if (matchedStd.compliance_status === 'Non-Compliant') return 'Non-Compliant';
      return 'Fully Compliant';
    }

    // 3. Check in legal requirements
    const matchedReq = requirements.find(r => r.ref_no.toLowerCase() === ref || file.id.includes(r.id));
    if (matchedReq) {
      if (matchedReq.compliance_status === 'Partially Compliant') return 'Partially Compliant';
      if (matchedReq.compliance_status === 'Non-Compliant') return 'Non-Compliant';
      return 'Fully Compliant';
    }

    // 4. Check in mandatory licenses/docs
    const matchedDoc = docs.find(d => d.ref_no.toLowerCase() === ref || file.id.includes(d.id));
    if (matchedDoc) {
      if (matchedDoc.status === 'Valid') return 'Fully Compliant';
      return 'Partially Compliant';
    }

    // Default fallback check
    if (ref.includes('partially') || ref.includes('p-')) return 'Partially Compliant';
    return 'Fully Compliant';
  };

  // Calculate Summary Metrics for Donut Chart
  const complianceCounts = files.reduce(
    (acc, file) => {
      const status = getFileComplianceStatus(file);
      if (status === 'Fully Compliant') acc.fullyCompliant++;
      else if (status === 'Partially Compliant') acc.partiallyCompliant++;
      else acc.nonCompliant++;
      return acc;
    },
    { fullyCompliant: 0, partiallyCompliant: 0, nonCompliant: 0 }
  );

  const totalRepoFiles = files.length;
  const fullyPercent = totalRepoFiles > 0 ? Math.round((complianceCounts.fullyCompliant / totalRepoFiles) * 100) : 0;
  const partiallyPercent = totalRepoFiles > 0 ? Math.round((complianceCounts.partiallyCompliant / totalRepoFiles) * 100) : 0;
  const nonCompPercent = totalRepoFiles > 0 ? Math.max(0, 100 - fullyPercent - partiallyPercent) : 0;

  // SVG Donut Chart Geometry Math
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~ 238.76
  const fullyStroke = (fullyPercent / 100) * circumference;
  const partiallyStroke = (partiallyPercent / 100) * circumference;
  const nonCompStroke = (nonCompPercent / 100) * circumference;
  const partiallyOffset = -fullyStroke;
  const nonCompOffset = -(fullyStroke + partiallyStroke);

  // Standard DOH Circular Categories
  const circularCategories = [
    'Clinical Practice',
    'Fire & Life Safety',
    'Biomedical Engineering',
    'Infection Control',
    'HR',
    'IT',
    'General Compliance'
  ];

  // 2. Filter Logic
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.associatedRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || f.sourceModule === moduleFilter;
    
    // Match Category if filtered
    let matchesCategory = true;
    if (categoryFilter !== 'ALL') {
      // Find matching circular if file comes from circular register
      if (f.sourceModule === 'DOH Circular Register') {
        const circ = circulars.find(c => c.circular_no.toLowerCase() === f.associatedRef.toLowerCase() || f.id.includes(c.id));
        if (circ) {
          matchesCategory = circ.circular_category.toLowerCase() === categoryFilter.toLowerCase();
        } else {
          matchesCategory = false;
        }
      }
    }

    return matchesSearch && matchesModule && matchesCategory;
  });

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map(f => f.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Action: Add to Confirmation List
  const handleBulkAddToConfirmation = () => {
    if (selectedIds.length === 0 || isReadOnly) return;

    const now = new Date().toISOString().substring(0, 10);
    const selectedFiles = files.filter(f => selectedIds.includes(f.id));
    const selectedRefs = selectedFiles.map(f => f.associatedRef.toLowerCase());

    // Update circulars in state if available
    let updatedCount = 0;
    if (circulars && onUpdateCirculars) {
      const updatedCircs = circulars.map(c => {
        const isSelectedByRef = selectedRefs.includes(c.circular_no.toLowerCase());
        const isSelectedById = selectedIds.some(id => id.includes(c.id));
        if (isSelectedByRef || isSelectedById) {
          updatedCount++;
          return {
            ...c,
            isConfirmed: true,
            confirmedAt: now,
            confirmedBy: 'Medical Director'
          };
        }
        return c;
      });
      onUpdateCirculars(updatedCircs);
    }

    const message = `Added ${selectedIds.length} document(s) (${updatedCount} associated circulars) to Confirmation List!`;
    onLogAudit('UPDATE', message, 'CONFIRMATION-LIST');
    setStatusNotification(message);
    setTimeout(() => setStatusNotification(null), 5000);
    setSelectedIds([]);
  };

  // Bulk Action: Update Compliance Status
  const handleBulkUpdateComplianceStatus = (newStatusVal: string) => {
    if (!newStatusVal || selectedIds.length === 0 || isReadOnly) return;

    const selectedFiles = files.filter(f => selectedIds.includes(f.id));
    const selectedRefs = selectedFiles.map(f => f.associatedRef.toLowerCase());

    let updatedCircsCount = 0;
    let updatedStdsCount = 0;
    let updatedReqsCount = 0;

    // 1. Update matching circulars
    if (circulars && onUpdateCirculars) {
      const updatedCircs = circulars.map(c => {
        const isMatch = selectedRefs.includes(c.circular_no.toLowerCase()) || selectedIds.some(id => id.includes(c.id));
        if (isMatch) {
          updatedCircsCount++;
          return { ...c, compliance_status: newStatusVal as any };
        }
        return c;
      });
      onUpdateCirculars(updatedCircs);
    }

    // 2. Update matching standards
    if (standards && onUpdateStandards) {
      const updatedStds = standards.map(s => {
        const isMatch = selectedRefs.includes(s.reference.toLowerCase()) || selectedIds.some(id => id.includes(s.id));
        if (isMatch) {
          updatedStdsCount++;
          return { ...s, compliance_status: newStatusVal as any };
        }
        return s;
      });
      onUpdateStandards(updatedStds);
    }

    // 3. Update matching legal requirements
    if (requirements && onUpdateRequirements) {
      const updatedReqs = requirements.map(r => {
        const isMatch = selectedRefs.includes(r.ref_no.toLowerCase()) || selectedIds.some(id => id.includes(r.id));
        if (isMatch) {
          updatedReqsCount++;
          return { ...r, compliance_status: newStatusVal as any };
        }
        return r;
      });
      onUpdateRequirements(updatedReqs);
    }

    const totalUpdated = updatedCircsCount + updatedStdsCount + updatedReqsCount;
    const msg = `Bulk updated compliance status to "${newStatusVal}" for ${selectedIds.length} document(s) (${totalUpdated} linked register item(s) updated)!`;
    onLogAudit('UPDATE', msg, 'BULK-STATUS-UPDATE');
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 5000);
    setSelectedIds([]);
  };

  // Bulk Action: Download Selected Files
  const handleBulkDownload = () => {
    const selectedFiles = files.filter(f => selectedIds.includes(f.id));
    selectedFiles.forEach(file => triggerDownload(file));
    setStatusNotification(`Downloaded ${selectedFiles.length} file(s) successfully!`);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // 3. Simulated Download Trigger
  const triggerDownload = (file: RepoFile) => {
    onLogAudit('EXPORT', `Simulated download file: ${file.name} from ${file.sourceModule}`, file.associatedRef);
    
    // Create a mock text file download in browser
    const blob = new Blob([`Mock contents of ${file.name} for standard ref ${file.associatedRef}. size: ${file.size}.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="document-repository-module" className="space-y-4 font-sans">
      {/* Feedback Banner */}
      {statusNotification && (
        <div className="bg-emerald-500 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-emerald-100 hover:text-white font-extrabold cursor-pointer">✕</button>
        </div>
      )}

      {/* Header Banner & Primary Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Module 5</span>
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-600" />
            Legal Compliance Document Repository
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">
            Browse, preview, and manage active license files, regulatory evidence templates, and DOH circular attachments.
          </p>
        </div>
        
        {/* Buttons: Circular Category Button & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Circular Category Button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            title="Filter or view Circular Categories"
          >
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            Circular Category
            {categoryFilter !== 'ALL' && (
              <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded-full text-[9px] font-black">
                {categoryFilter}
              </span>
            )}
          </button>

          {/* Grid / Table View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card with Donut Chart Visualizing Fully vs Partially Compliant Documents */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Metric Breakdown */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
              Document Compliance Status Summary
            </h3>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              {totalRepoFiles} Total Evidence Documents
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Real-time visual compliance evaluation of uploaded regulatory attachments, circular evidence, policies, and facility license documents.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {/* Fully Compliant Metric Tile */}
            <div className="bg-emerald-50/80 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Fully Compliant</span>
                <span className="text-xl font-black text-emerald-950 mt-0.5 block">{complianceCounts.fullyCompliant}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                  {fullyPercent}%
                </span>
              </div>
            </div>

            {/* Partially Compliant Metric Tile */}
            <div className="bg-amber-50/80 border border-amber-100 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Partially Compliant</span>
                <span className="text-xl font-black text-amber-950 mt-0.5 block">{complianceCounts.partiallyCompliant}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
                  {partiallyPercent}%
                </span>
              </div>
            </div>

            {/* Overall Rate Metric Tile */}
            <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-800 uppercase block">Overall Rate</span>
                <span className="text-xl font-black text-indigo-950 mt-0.5 block">
                  {totalRepoFiles > 0 ? Math.round(((complianceCounts.fullyCompliant + complianceCounts.partiallyCompliant) / totalRepoFiles) * 100) : 100}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-100 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Donut Chart Graphic */}
        <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 shrink-0 w-full md:w-auto justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Base Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="11"
                fill="none"
              />
              {/* Fully Compliant Donut Slice (Emerald) */}
              {fullyPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="11"
                  fill="none"
                  strokeDasharray={`${fullyStroke} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
              {/* Partially Compliant Donut Slice (Amber) */}
              {partiallyPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="11"
                  fill="none"
                  strokeDasharray={`${partiallyStroke} ${circumference}`}
                  strokeDashoffset={partiallyOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
              {/* Non-Compliant Donut Slice (Rose) */}
              {nonCompPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f43f5e"
                  strokeWidth="11"
                  fill="none"
                  strokeDasharray={`${nonCompStroke} ${circumference}`}
                  strokeDashoffset={nonCompOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )}
            </svg>

            {/* Inner Center Statistics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 leading-none">{totalRepoFiles}</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Docs</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2 text-xs font-bold pr-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-slate-700">Fully Compliant</span>
              <span className="text-slate-400 font-extrabold ml-2">{complianceCounts.fullyCompliant}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
              <span className="text-slate-700">Partially Compliant</span>
              <span className="text-slate-400 font-extrabold ml-2">{complianceCounts.partiallyCompliant}</span>
            </div>
            {complianceCounts.nonCompliant > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-slate-700">Non-Compliant</span>
                <span className="text-slate-400 font-extrabold ml-2">{complianceCounts.nonCompliant}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-indigo-500"
              placeholder="Search by file name or ref..."
            />
          </div>

          {/* Module Source Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Module:</span>
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sources ({files.length})</option>
              <option value="UAE Legal Register">UAE Legal Register</option>
              <option value="DOH Circular Register">DOH Circulars</option>
              <option value="DOH Standards Register">DOH Standards</option>
              <option value="Compliance Document Register">Mandatory Licenses</option>
            </select>
          </div>

          {/* Active Category Tag Indicator */}
          {categoryFilter !== 'ALL' && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-xl font-bold text-[10px]">
              <span>Category: {categoryFilter}</span>
              <button onClick={() => setCategoryFilter('ALL')} className="hover:text-indigo-950 font-black cursor-pointer">✕</button>
            </div>
          )}
        </div>

        {/* Selection Stats */}
        <div className="flex items-center gap-2 shrink-0 text-slate-500 font-bold text-[11px]">
          <button
            onClick={handleSelectAll}
            className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer font-extrabold"
          >
            {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? 'Deselect All' : 'Select All Files'}
          </button>
          <span>•</span>
          <span>{filteredFiles.length} File(s)</span>
        </div>
      </div>

      {/* Bulk Checkbox Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Bulk document actions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Change Compliance Status Selector */}
            {!isReadOnly && (
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-extrabold text-slate-300 uppercase">Status:</span>
                <select
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkUpdateComplianceStatus(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">Change Compliance Status...</option>
                  <option value="Fully Compliant" className="bg-slate-900 text-emerald-400">✓ Set Fully Compliant</option>
                  <option value="Partially Compliant" className="bg-slate-900 text-amber-400">⚡ Set Partially Compliant</option>
                  <option value="Non-Compliant" className="bg-slate-900 text-rose-400">✕ Set Non-Compliant</option>
                </select>
              </div>
            )}

            {/* Add to Confirmation Button */}
            {!isReadOnly && (
              <button
                onClick={handleBulkAddToConfirmation}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              >
                <BookmarkCheck className="w-4 h-4" /> Add to Confirmation
              </button>
            )}

            {/* Bulk Download Button */}
            <button
              onClick={handleBulkDownload}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download Selected
            </button>

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

      {/* Main Files Display View */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mb-2.5" />
          <h3 className="font-extrabold text-slate-500 uppercase tracking-wider text-xs">No documents available</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
            Attach PDF files or Excel sheets inside individual compliance registers or adjust your search filter!
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map(file => {
            const isSelected = selectedIds.includes(file.id);
            return (
              <div 
                key={file.id} 
                className={`bg-white p-4.5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 shadow-md' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Selection Checkbox & Header Icon */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(file.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                      />
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>

                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {file.associatedRef}
                    </span>
                  </div>

                  {/* File Title and Details */}
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs leading-snug truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-bold">
                      <span>{file.size}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        getFileComplianceStatus(file) === 'Fully Compliant'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {getFileComplianceStatus(file)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[9px] text-slate-500 truncate max-w-[100px]">
                    {file.uploadedBy.split(' ')[0]}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 rounded-lg cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => triggerDownload(file)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => {
                          onDeleteFile(file.id);
                          onLogAudit('DELETE', `Deleted file ${file.name} from archive repository.`, file.associatedRef);
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredFiles.length > 0 && selectedIds.length === filteredFiles.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Document Name</th>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Compliance Status</th>
                  <th className="p-3.5">Source Module</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Uploaded By</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map(file => {
                  const isSelected = selectedIds.includes(file.id);
                  const status = getFileComplianceStatus(file);
                  return (
                    <tr key={file.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(file.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-600 text-[11px]">
                        {file.associatedRef}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${
                          status === 'Fully Compliant'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {status === 'Fully Compliant' ? '✓ Fully Compliant' : '⚡ Partially Compliant'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {file.sourceModule}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium text-[11px]">{file.size}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{file.uploadedBy}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDownload(file)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                onDeleteFile(file.id);
                                onLogAudit('DELETE', `Deleted file ${file.name}`, file.associatedRef);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete"
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
      )}

      {/* Circular Category Selection & Filter Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in font-sans">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">Select Circular Category</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filter Document Repository by DOH Circular Domains</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm cursor-pointer border border-slate-700 hover:border-slate-500 rounded-lg px-2.5 py-1 bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Category Options List */}
            <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh] text-xs">
              <button
                onClick={() => {
                  setCategoryFilter('ALL');
                  setShowCategoryModal(false);
                }}
                className={`w-full p-3.5 rounded-xl border text-left font-extrabold cursor-pointer transition-all flex items-center justify-between ${
                  categoryFilter === 'ALL' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>All Circular Categories</span>
                {categoryFilter === 'ALL' && <Check className="w-4 h-4 text-indigo-600" />}
              </button>

              {circularCategories.map(cat => {
                const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
                // Count matching circulars
                const catCircsCount = circulars.filter(c => c.circular_category.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryModal(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left font-bold cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                        {catCircsCount} Circulars
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">Department of Health Abu Dhabi Standard Classification</span>
              <button
                onClick={() => {
                  setCategoryFilter('ALL');
                  setShowCategoryModal(false);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal Panel */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-fade-in font-sans">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Document Preview Viewer</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-300 hover:text-white font-extrabold text-sm cursor-pointer border border-slate-700 hover:border-slate-500 rounded-lg px-2 py-1 bg-slate-800"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="p-6 text-xs space-y-4 flex-1">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold border-b border-slate-100 pb-2">
                  <div>FILE NAME: <span className="text-slate-800">{previewFile.name}</span></div>
                  <div>REFERENCE: <span className="text-slate-800">{previewFile.associatedRef}</span></div>
                  <div>SOURCE MODULE: <span className="text-slate-800">{previewFile.sourceModule}</span></div>
                  <div>SIZE: <span className="text-slate-800">{previewFile.size}</span></div>
                </div>
                <div className="pt-2 text-[9px] text-slate-400 font-semibold">
                  Uploaded at: {previewFile.uploadedAt} • Uploaded by: {previewFile.uploadedBy}
                </div>
              </div>

              {/* Simulated PDF container layout */}
              <div className="border border-slate-200 bg-slate-100 h-64 rounded-xl flex flex-col items-center justify-center text-center p-6 select-none relative overflow-hidden">
                <div className="absolute top-2 left-2 bg-emerald-600 text-white font-mono text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow">
                  Secure PDF Vault
                </div>
                <FileText className="w-12 h-12 text-slate-400 mb-2 animate-bounce" />
                <h4 className="font-bold text-slate-700 text-xs">Simulated Evidence Document Preview</h4>
                <p className="text-[10px] text-slate-500 max-w-sm mt-1">
                  Secure sandbox preview: Digital file certificates, DOH stamps, and corporate checklists are locked in compliance storage.
                </p>
                <button
                  onClick={() => triggerDownload(previewFile)}
                  className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1 shadow"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

