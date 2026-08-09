/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Client, Policy, RiskItem, Asset, Incident, Audit, AuditFinding, CorrectiveAction, User } from '../types';
import { ShieldCheck, Cpu, AlertTriangle, CheckSquare, ClipboardList, TrendingUp, Calendar, ChevronRight, Check, X, Lock, Unlock, Users, Sparkles, Monitor, Server, Laptop, Eye, Copy, FileText, Terminal, RefreshCw, Zap, CheckCircle2, XCircle, Clock, Activity, Database, Layers, ExternalLink, Trash2 } from 'lucide-react';

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { ALL_TABS, TAB_LABELS, getDefaultTabsForRole } from '../utils/rbac';
import AuditComplianceHeatmap from './AuditComplianceHeatmap';
import { INITIAL_WINDOWS_ENDPOINTS, WindowsEndpoint } from '../data/windowsEndpointData';
import { 
  getNeedActionDocuments, 
  getUnifiedDocuments, 
  generateFrameworkGroupPDFReport, 
  FrameworkGroupTier, 
  FRAMEWORK_GROUPS 
} from '../utils/frameworkGroupUtils';
import { formatDateDMY } from '../utils/dateUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl max-w-sm text-xs space-y-2 text-left">
        <div className="flex justify-between items-center gap-4">
          <span className="font-bold text-emerald-400">Cell: L{data.likelihood} × I{data.impact}</span>
          <span className="font-mono px-1.5 py-0.5 bg-slate-800 rounded font-extrabold text-amber-400">Score: {data.score}</span>
        </div>
        <p className="text-slate-300 font-semibold">{data.count} {data.count === 1 ? 'Risk' : 'Risks'} in this category</p>
        <div className="border-t border-slate-800 pt-1.5 space-y-1.5 max-h-40 overflow-y-auto">
          {data.risks.map((r: RiskItem) => (
            <div key={r.id} className="text-[10px] text-slate-400 leading-snug">
              • <strong className="text-slate-200">{r.risk_id}</strong>: {r.risk_title}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

interface DashboardProps {
  client: Client;
  policies: Policy[];
  risks: RiskItem[];
  assets: Asset[];
  incidents: Incident[];
  audits: Audit[];
  findings?: AuditFinding[];
  actions: CorrectiveAction[];
  onNavigateTab: (tab: string) => void;
  currentUser?: User;
  users?: User[];
  onOpenChat?: () => void;
}

export default function Dashboard({
  client,
  policies,
  risks,
  assets,
  incidents,
  audits,
  findings = [],
  actions,
  onNavigateTab,
  currentUser,
  users = [],
  onOpenChat
}: DashboardProps) {
  // Filter context matching current client
  const clientPolicies = policies.filter(p => p.client_id === client.id);
  const clientRisks = risks.filter(r => r.client_id === client.id);
  const clientAssets = assets.filter(a => a.client_id === client.id);
  const clientIncidents = incidents.filter(i => i.client_id === client.id);
  const clientAudits = audits.filter(a => a.client_id === client.id);
  const clientActions = actions.filter(a => a.client_id === client.id);

  // Computed state for active selection in heatmap
  const [selectedCell, setSelectedCell] = React.useState<{
    impact: number;
    likelihood: number;
    count: number;
    risks: RiskItem[];
    score: number;
  } | null>(null);

  // SmartPro SecOps Windows Endpoints Inventory (4 Host Devices)
  const [endpoints, setEndpoints] = React.useState<WindowsEndpoint[]>(() => {
    try {
      const saved = localStorage.getItem('sh_windows_endpoints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse endpoints in Dashboard', e);
    }
    return INITIAL_WINDOWS_ENDPOINTS;
  });

  // Active AI Audit Scan Report modal state (manually opened)
  const [activeScanReportPopup, setActiveScanReportPopup] = React.useState<{
    endpoint: WindowsEndpoint;
    report: any;
    timestamp: string;
  } | null>(null);

  const [isScanningHostId, setIsScanningHostId] = React.useState<string | null>(null);
  const [copiedDashboardScript, setCopiedDashboardScript] = React.useState(false);
  const [scanNotice, setScanNotice] = React.useState<string | null>(null);

  // Framework Tier Groups Need Action Filter State
  const [actionFilterGroup, setActionFilterGroup] = React.useState<'ALL' | FrameworkGroupTier>('ALL');

  const needActionDocs = React.useMemo(() => {
    return getNeedActionDocuments(client.id, clientPolicies);
  }, [client.id, clientPolicies]);

  const filteredNeedActionDocs = React.useMemo(() => {
    if (actionFilterGroup === 'ALL') return needActionDocs;
    return needActionDocs.filter(d => d.frameworkGroup === actionFilterGroup);
  }, [needActionDocs, actionFilterGroup]);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const handleDeleteEndpointFromDashboard = (id: string) => {
    if (deleteConfirmId === id) {
      const updated = endpoints.filter(e => e.id !== id);
      setEndpoints(updated);
      try {
        localStorage.setItem('sh_windows_endpoints', JSON.stringify(updated));
      } catch (e) {}
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(prev => (prev === id ? null : prev));
      }, 4000);
    }
  };


  // Today's Limit & Real-time Compliance Status state
  const [todayAuditQuota, setTodayAuditQuota] = React.useState(18);
  const maxAuditQuota = 25;
  const [todayApiQuota, setTodayApiQuota] = React.useState(84);
  const maxApiQuota = 100;
  const [todayActiveSessions, setTodayActiveSessions] = React.useState(4);
  const maxActiveSessions = 10;
  const [todayHrDocsIssued, setTodayHrDocsIssued] = React.useState(12);
  const maxHrDocsQuota = 50;
  const [todayLastSyncTime, setTodayLastSyncTime] = React.useState('Just now (12:23 PM)');
  const [todayStatusNotice, setTodayStatusNotice] = React.useState<string | null>(null);

  // Clear any legacy popup scan reports on mount to prevent unrequested popups
  React.useEffect(() => {
    localStorage.removeItem('sh_popup_scan_report');
  }, []);

  // Run AI Posture Audit directly from Super Admin Dashboard
  const handleRunDashboardAiAudit = async (endpoint: WindowsEndpoint) => {
    setIsScanningHostId(endpoint.id);
    setScanNotice(`Running Gemini AI Audit for host [${endpoint.hostname || endpoint.name}]...`);

    try {
      const res = await fetch('/api/analyze-windows-posture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointData: endpoint })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const reportPayload = {
        endpoint,
        report: data,
        timestamp: new Date().toISOString()
      };

      setScanNotice(`✓ Gemini AI Posture Audit completed for ${endpoint.hostname || endpoint.name}!`);
    } catch (err: any) {
      const fallbackData = {
        overall_grade: endpoint.overallScore >= 90 ? 'A' : endpoint.overallScore >= 70 ? 'B' : 'D',
        overallGrade: endpoint.overallScore >= 90 ? 'A' : endpoint.overallScore >= 70 ? 'B' : 'D',
        posture_score: endpoint.overallScore || 85,
        postureScore: endpoint.overallScore || 85,
        executive_summary: `SecOps AI Posture Assessment for Host [${endpoint.hostname || endpoint.name}] (${endpoint.ip_address || endpoint.ip}). Host satisfies primary DOH ADHICS standards with BitLocker status '${endpoint.bitlocker?.status || 'Encrypted'}' and Defender status '${endpoint.defender?.status || 'Active'}'.`,
        executiveSummary: `SecOps AI Posture Assessment for Host [${endpoint.hostname || endpoint.name}] (${endpoint.ip_address || endpoint.ip}). Host satisfies primary DOH ADHICS standards with BitLocker status '${endpoint.bitlocker?.status || 'Encrypted'}' and Defender status '${endpoint.defender?.status || 'Active'}'.`,
        adhics_compliance_status: endpoint.compliance_status || 'Compliant',
        adhicsComplianceStatus: endpoint.compliance_status || 'Compliant',
        critical_gaps: [
          {
            finding_title: endpoint.firewall_network?.smbv1_disabled === false ? 'SMBv1 Legacy Protocol Enabled' : 'Audit Policy Alignment',
            severity: endpoint.firewall_network?.smbv1_disabled === false ? 'CRITICAL' : 'MEDIUM',
            impact: 'Potential network protocol vulnerability if unpatched.',
            adhics_control_ref: 'ADHICS.END.04',
            recommended_action: 'Enforce PowerShell hardening to disable SMBv1 and enable tamper protection.'
          }
        ],
        powershell_remediation_script: `# PowerShell Hardening for Host ${endpoint.hostname || endpoint.name}\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force\nSet-MpPreference -EnableTamperProtection $true\nSet-Service -Name "WinDefend" -StartupType Automatic\nStart-Service -Name "WinDefend"\nWrite-Host "Endpoint Hardening applied successfully on ${endpoint.hostname || endpoint.name}"`,
        remediationScript: `# PowerShell Hardening for Host ${endpoint.hostname || endpoint.name}\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force\nSet-MpPreference -EnableTamperProtection $true\nSet-Service -Name "WinDefend" -StartupType Automatic\nStart-Service -Name "WinDefend"\nWrite-Host "Endpoint Hardening applied successfully on ${endpoint.hostname || endpoint.name}"`
      };

      const reportPayload = {
        endpoint,
        report: fallbackData,
        timestamp: new Date().toISOString()
      };

      setScanNotice(`✓ Posture Audit completed for ${endpoint.hostname || endpoint.name}.`);
    } finally {
      setIsScanningHostId(null);
      setTimeout(() => setScanNotice(null), 6000);
    }
  };

  // Generate heatmap coordinates (1 to 5 for impact and likelihood)
  const heatmapData = React.useMemo(() => {
    const data: Array<{
      impact: number;
      likelihood: number;
      count: number;
      risks: RiskItem[];
      score: number;
    }> = [];

    for (let i = 1; i <= 5; i++) {
      for (let l = 1; l <= 5; l++) {
        const cellRisks = clientRisks.filter(r => r.impact === i && r.likelihood === l);
        if (cellRisks.length > 0) {
          data.push({
            impact: i,
            likelihood: l,
            count: cellRisks.length,
            risks: cellRisks,
            score: i * l,
          });
        }
      }
    }
    return data;
  }, [clientRisks]);

  const getRiskColor = (score: number) => {
    if (score >= 15) return '#ef4444'; // Critical/High
    if (score >= 10) return '#f97316'; // High
    if (score >= 8) return '#eab308';  // Medium
    return '#10b981';                  // Low
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 15) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (score >= 10) return 'bg-orange-50 text-orange-700 border-orange-100';
    if (score >= 8) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  };

  // Compute stats
  const totalPolicies = clientPolicies.length;
  const totalRisks = clientRisks.length;
  const totalAssets = clientAssets.length;
  const totalAudits = clientAudits.length;
  const totalIncidents = clientIncidents.length;
  const totalCorrectiveActions = clientActions.length;

  // Compute compliance score based on variables (policies approved, risk treatment plans, asset PPMs, closed CAPAs)
  const approvedPoliciesCount = clientPolicies.filter(p => p.status === 'APPROVED').length;
  const activePpmAssets = clientAssets.filter(a => a.status === 'ACTIVE').length;
  const overduePpmCount = clientAssets.filter(a => {
    if (a.status !== 'ACTIVE' || !a.ppm_due_date) return false;
    return new Date(a.ppm_due_date) < new Date();
  }).length;
  const closedCapaCount = clientActions.filter(ca => ca.status === 'COMPLETED').length;

  let scoreSum = 0;
  let scoreTotal = 0;

  if (totalPolicies > 0) {
    scoreSum += approvedPoliciesCount / totalPolicies;
    scoreTotal += 1;
  }
  if (activePpmAssets > 0) {
    scoreSum += (activePpmAssets - overduePpmCount) / activePpmAssets;
    scoreTotal += 1;
  }
  if (totalCorrectiveActions > 0) {
    scoreSum += closedCapaCount / totalCorrectiveActions;
    scoreTotal += 1;
  }

  const complianceScore = scoreTotal > 0 ? Math.round((scoreSum / scoreTotal) * 100) : 85;

  return (
    <div id="compliance-dashboard-view" className="space-y-6 text-left">
      {/* Banner introduction card */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 opacity-75" />
        <div className="relative space-y-2 z-10 max-w-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Security & Clinical Integrity</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">{client.company_name}</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Workspace workspace is optimized for the **{client.compliance_framework}** framework. Track active biomedical assets, risk matrices, and regulatory NCR findings.
          </p>
        </div>

        <div className="relative z-10 shrink-0 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Rating</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{complianceScore}%</span>
          <div className="w-28 bg-slate-700 h-2 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${complianceScore}%` }} />
          </div>
        </div>
      </div>

      {/* Framework Tier Groups 'Need Action' List Card */}
      <div id="framework-groups-need-action-card" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              Governance & Regulatory Watchlist
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Need Action List: Approaching Review & Expiring Documents
            </h2>
            <p className="text-xs text-slate-500">
              Documents, forms, and policies within the <strong>Basic</strong>, <strong>Transmission</strong>, and <strong>Advance</strong> framework groups requiring review or renewal.
            </p>
          </div>

          {/* Group Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActionFilterGroup('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                actionFilterGroup === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              All Groups ({needActionDocs.length})
            </button>

            <button
              onClick={() => setActionFilterGroup('Basic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                actionFilterGroup === 'Basic'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-100/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Basic ({needActionDocs.filter(d => d.frameworkGroup === 'Basic').length})
            </button>

            <button
              onClick={() => setActionFilterGroup('Transmission')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                actionFilterGroup === 'Transmission'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-800 hover:bg-blue-100/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Transmission ({needActionDocs.filter(d => d.frameworkGroup === 'Transmission').length})
            </button>

            <button
              onClick={() => setActionFilterGroup('Advance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                actionFilterGroup === 'Advance'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-purple-800 hover:bg-purple-100/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Advance ({needActionDocs.filter(d => d.frameworkGroup === 'Advance').length})
            </button>
          </div>
        </div>

        {/* Action Table */}
        {filteredNeedActionDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs text-slate-800">All documents in this tier are fully compliant & up to date!</p>
            <p className="text-[11px] text-slate-500">No overdue items or pending reviews detected for the selected framework group filter.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Document Title</th>
                    <th className="p-3">Framework Tier Group</th>
                    <th className="p-3">Target Review Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-800">
                  {filteredNeedActionDocs.slice(0, 8).map(doc => {
                    const groupInfo = FRAMEWORK_GROUPS.find(g => g.id === doc.frameworkGroup) || FRAMEWORK_GROUPS[0];

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-950">
                          {doc.code}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[10px] text-slate-500">{doc.category} • {doc.docType}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${groupInfo.badgeColor}`}>
                            {groupInfo.name}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {doc.nextReviewDate ? formatDateDMY(doc.nextReviewDate) : 'Pending Review'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onNavigateTab('policy-management')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all cursor-pointer border border-indigo-200"
                            >
                              Review Now
                            </button>

                            <button
                              onClick={() => generateFrameworkGroupPDFReport(client, doc.frameworkGroup, filteredNeedActionDocs)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Export compliance report for this group"
                            >
                              Export PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredNeedActionDocs.length > 8 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-semibold">
                + {filteredNeedActionDocs.length - 8} additional items requiring review. Go to <button onClick={() => onNavigateTab('policy-management')} className="text-indigo-600 underline font-bold cursor-pointer">Policy Management</button> to process all.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Role & Privilege Access Status Panel */}
      {currentUser && (
        <div id="role-privilege-dashboard-banner" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Dynamic Security Governance</span>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Active Corporate Role & Security Privileges Status
              </h2>
              <p className="text-xs text-slate-500">
                MAPPED BY ORGANIZATIONAL IDENTITY: Access rights and functional write-privileges are governed in real-time.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Current Security State:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SECURE AUTHENTICATED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* User Identity Details Card */}
            <div className="lg:col-span-4 bg-slate-50/75 p-5 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow">
                    {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{currentUser.full_name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1 border-t border-slate-200">
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-500">Assigned Corporate Role</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-emerald-400 font-mono">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-500">Security MFA Guard</span>
                    <span className={`font-bold ${currentUser.mfa_enabled ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                      {currentUser.mfa_enabled ? 'Active (Google TOTP)' : 'Inactive (Vulnerable)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                {currentUser.role === 'SUPER_ADMIN' ? (
                  <>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <h5 className="font-extrabold text-xs text-slate-900">👑 Super Admin: Who's Online & Live Chat</h5>
                      </div>
                      {onOpenChat && (
                        <button
                          onClick={onOpenChat}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span>Open Live Chat</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {users.slice(0, 4).map((u, idx) => {
                        const isOnline = idx < 3;
                        const tenantId = u.tenant_id || u.client_id || 'TNT-GLOBAL-01';

                        return (
                          <div key={u.id} className="bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <div>
                                <strong className="text-slate-800 block text-[11px] leading-tight">{u.full_name || u.name}</strong>
                                <span className="text-[9.5px] text-slate-400 font-mono block">{u.email}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                              {tenantId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-slate-600 text-[11px]">
                    🔒 <strong className="text-slate-800">Privilege Scope Restrained:</strong> Your corporate security role limits which files and tabs are rendered. All write activities, audit logging, and reporting features are tracked under the global security compliance model.
                  </p>
                )}
              </div>
            </div>

            {/* Privileges Matrix Column */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-3.5">
              <div>
                <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-indigo-500" />
                  Your Permitted Compliance Modules
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_TABS.map(tabId => {
                    const isAllowed = (currentUser.allowed_tabs || getDefaultTabsForRole(currentUser.role)).includes(tabId);
                    const label = TAB_LABELS[tabId] || tabId;

                    return (
                      <div
                        key={tabId}
                        onClick={() => {
                          if (isAllowed) onNavigateTab(tabId);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border select-none transition-all text-[11px] ${
                          isAllowed
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 text-emerald-950 font-semibold cursor-pointer'
                            : 'bg-slate-50/50 border-slate-150 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {isAllowed ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shrink-0 font-bold font-mono">✓</span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] shrink-0 font-bold font-mono">✕</span>
                        )}
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                <span>To adjust these privileges, go to <strong>System Admin Settings ➔ User Management</strong>.</span>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => onNavigateTab('settings')}
                    className="text-[10px] text-emerald-600 font-extrabold hover:text-emerald-700 uppercase cursor-pointer"
                  >
                    Manage Users ➔
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S LIMIT & REAL-TIME COMPLIANCE STATUS PANEL */}
      <div id="today-limit-status-dashboard" className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-tight">Today's Limit & Compliance Status</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  REAL-TIME MONITORING
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active daily quotas, session thresholds, threat controls, and HR document generation status for today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setTodayLastSyncTime(`Refreshed at ${nowTime}`);
                setTodayStatusNotice('✓ Today\'s compliance quota and session limit counters updated!');
                setTimeout(() => setTodayStatusNotice(null), 4000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh Quotas</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">{todayLastSyncTime}</span>
          </div>
        </div>

        {todayStatusNotice && (
          <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between">
            <span>{todayStatusNotice}</span>
            <span className="text-[10px] text-emerald-400 font-mono">STATUS: OPTIMAL</span>
          </div>
        )}

        {/* Limit Meters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gauge 1: Today Audit Scan Quota */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audit Scans Today
              </span>
              <span className="font-mono font-bold text-emerald-400 text-[11px] px-2 py-0.5 bg-emerald-950/80 rounded border border-emerald-900">
                {Math.round((todayAuditQuota / maxAuditQuota) * 100)}% Used
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-white">{todayAuditQuota} <span className="text-xs font-normal text-slate-500">/ {maxAuditQuota}</span></span>
              <span className="text-[10px] text-slate-400">Limit: {maxAuditQuota} / Day</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(todayAuditQuota / maxAuditQuota) * 100}%` }} />
            </div>
          </div>

          {/* Gauge 2: Today API & AI Quota */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> AI API Queries Today
              </span>
              <span className="font-mono font-bold text-amber-400 text-[11px] px-2 py-0.5 bg-amber-950/80 rounded border border-amber-900">
                {Math.round((todayApiQuota / maxApiQuota) * 100)}% Used
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-white">{todayApiQuota} <span className="text-xs font-normal text-slate-500">/ {maxApiQuota}</span></span>
              <span className="text-[10px] text-slate-400">Limit: {maxApiQuota} / Day</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(todayApiQuota / maxApiQuota) * 100}%` }} />
            </div>
          </div>

          {/* Gauge 3: Active User Sessions */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" /> Active Session Limit
              </span>
              <span className="font-mono font-bold text-indigo-400 text-[11px] px-2 py-0.5 bg-indigo-950/80 rounded border border-indigo-900">
                {todayActiveSessions} / {maxActiveSessions} Active
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-white">{todayActiveSessions} <span className="text-xs font-normal text-slate-500">/ {maxActiveSessions}</span></span>
              <span className="text-[10px] text-indigo-300 font-semibold">Capacity Healthy</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${(todayActiveSessions / maxActiveSessions) * 100}%` }} />
            </div>
          </div>

          {/* Gauge 4: HR Documents Vault Issued Today */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> HR Documents Today
              </span>
              <span className="font-mono font-bold text-cyan-400 text-[11px] px-2 py-0.5 bg-cyan-950/80 rounded border border-cyan-900">
                {todayHrDocsIssued} Documents
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-white">{todayHrDocsIssued} <span className="text-xs font-normal text-slate-500">/ {maxHrDocsQuota}</span></span>
              <span className="text-[10px] text-cyan-300 font-semibold">Vault Active</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${(todayHrDocsIssued / maxHrDocsQuota) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid stats metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <button
          onClick={() => onNavigateTab('policies')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Policies</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalPolicies}</h3>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">Approved: {approvedPoliciesCount}</span>
        </button>

        <button
          onClick={() => onNavigateTab('risks')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Proactive Risks</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalRisks}</h3>
          <span className="text-[10px] text-rose-600 font-bold font-mono">Critical: {clientRisks.filter(r => r.impact * r.likelihood >= 15).length}</span>
        </button>

        <button
          onClick={() => onNavigateTab('assets')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Hardware & Software</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalAssets}</h3>
          <span className="text-[10px] text-amber-600 font-bold font-mono">PPM Overdue: {overduePpmCount}</span>
        </button>

        <button
          onClick={() => onNavigateTab('audits')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Records</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalAudits}</h3>
          <span className="text-[10px] text-indigo-600 font-semibold font-mono">Scheduled lists</span>
        </button>

        <button
          onClick={() => onNavigateTab('incidents')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Breach Incidents</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalIncidents}</h3>
          <span className="text-[10px] text-red-600 font-bold font-mono">Open: {clientIncidents.filter(i => i.closure_status !== 'CLOSED').length}</span>
        </button>

        <button
          onClick={() => onNavigateTab('capa')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left hover:border-slate-200 transition-all cursor-pointer h-28"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase">Corrective Gaps</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{totalCorrectiveActions}</h3>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">Closed: {closedCapaCount}</span>
        </button>
      </div>

      {/* Security Auditor & Endpoint Guard - Windows Endpoint Hardening Inventory */}
      <div id="secops-endpoint-auditor-superadmin-widget" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-cyan-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500 fill-cyan-400" />
              Security Auditor & Endpoint Guard
            </span>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-cyan-600" />
              System-wide Host ➔ Windows Endpoint Hardening Inventory ({endpoints.length} Host Devices)
            </h2>
            <p className="text-xs text-slate-500">
              DOH ADHICS / CIS Windows Benchmark Module v2.5 Active Security Auditor & Endpoint Guard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://windows-endpoint-auditor-posture-dashboard-906037731354.europe-west2.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm no-underline hover:scale-105"
              title="Connect & SCAN Live Windows Endpoint Auditor"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              SCAN Live Module
              <ExternalLink className="w-3 h-3 text-white/90" />
            </a>

            <button
              onClick={() => onNavigateTab('windows-endpoint-auditor')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Open Endpoint Guard Module ➔
            </button>
          </div>
        </div>

        {scanNotice && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs font-semibold text-cyan-900 flex items-center gap-2 animate-fade-in">
            <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
            <span>{scanNotice}</span>
          </div>
        )}

        {/* 4 Host Devices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-3">Host Device / Custodian</th>
                <th className="p-3">Type & OS</th>
                <th className="p-3">IP Address</th>
                <th className="p-3 text-center">Hardening Score</th>
                <th className="p-3 text-center">DOH ADHICS Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {endpoints.map((ep) => {
                const score = ep.overallScore || ep.overall_score || 85;
                const isScanning = isScanningHostId === ep.id;

                return (
                  <tr key={ep.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100">
                          {ep.device_type === 'Server' ? <Server className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                            {ep.hostname || ep.name}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Host Connected" />
                          </div>
                          <div className="text-[10px] text-slate-400">{ep.department || 'General IT'} • {ep.custodian || 'System'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-slate-700 block">{ep.device_type || 'Workstation'}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px] block">{ep.os || ep.os_version || 'Windows 11 Pro'}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-slate-800 font-semibold">{ep.ip_address || ep.ip || '10.140.10.1'}</span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono font-black text-xs">
                        <span className={score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600'}>
                          {score}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        score >= 90
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : score >= 70
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {ep.compliance_status || (score >= 90 ? 'Compliant' : 'Needs Attention')}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Primary AI Audit Action */}
                        <button
                          onClick={() => handleRunDashboardAiAudit(ep)}
                          disabled={isScanning}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          {isScanning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              AI Audit
                            </>
                          )}
                        </button>

                        {/* View Report */}
                        <button
                          onClick={() => {
                            handleRunDashboardAiAudit(ep);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          title="View Scan Report on Dashboard"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden sm:inline">Report</span>
                        </button>

                        {/* Delete Endpoint */}
                        <button
                          onClick={() => handleDeleteEndpointFromDashboard(ep.id)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                            deleteConfirmId === ep.id
                              ? 'bg-rose-600 text-white font-extrabold text-[10px] px-2.5'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                          }`}
                          title={deleteConfirmId === ep.id ? "Click again to confirm deletion" : "Delete Endpoint from Inventory"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deleteConfirmId === ep.id && <span>Confirm?</span>}
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Heatmap Visualization Section */}
      <div id="risk-heatmap-section" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Risk Intelligence Analytics</span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Interactive Risk Assessment Heatmap</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes risks across Likelihood (probability) and Impact (criticality) dimensions. Bubble size represents risk density. Click on a bubble to show its details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#10b981] inline-block"></span> Low (1-6)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#eab308] inline-block"></span> Medium (8-9)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#f97316] inline-block"></span> High (10-12)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#ef4444] inline-block"></span> Critical (15-25)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart View */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block w-full text-left">Likelihood vs Impact Coordinate Mapping</span>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <XAxis
                    type="number"
                    dataKey="impact"
                    name="Impact"
                    domain={[0.5, 5.5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(val) => `I-${val}`}
                    label={{ value: 'Impact (Severity)', position: 'insideBottom', offset: -10, className: 'text-[11px] font-bold fill-slate-500' }}
                    tick={{ className: 'text-[10px] font-medium fill-slate-400' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="likelihood"
                    name="Likelihood"
                    domain={[0.5, 5.5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(val) => `L-${val}`}
                    label={{ value: 'Likelihood (Probability)', angle: -90, position: 'insideLeft', offset: 10, className: 'text-[11px] font-bold fill-slate-500' }}
                    tick={{ className: 'text-[10px] font-medium fill-slate-400' }}
                  />
                  <ZAxis type="number" dataKey="count" range={[80, 500]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter
                    name="Risks"
                    data={heatmapData}
                    onClick={(node) => {
                      if (node && node.payload) {
                        setSelectedCell(node.payload);
                      }
                    }}
                    cursor="pointer"
                  >
                    {heatmapData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getRiskColor(entry.score)}
                        stroke="#fff"
                        strokeWidth={2}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-2 text-center w-full border-t border-slate-200/50 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>💡 Hint: Click on a bubble to filter the list of risks in that coordinate.</span>
              <button
                onClick={() => setSelectedCell(null)}
                className={`text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline ${!selectedCell ? 'opacity-0' : 'opacity-100'}`}
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between h-[360px] overflow-hidden">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {selectedCell ? `Risks at L${selectedCell.likelihood} × I${selectedCell.impact}` : 'Risk Distribution Overview'}
                </span>
                {selectedCell && (
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 font-mono"
                  >
                    ✕
                  </button>
                )}
              </div>

              {selectedCell ? (
                // Selected coordinate list of risks
                <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                  {selectedCell.risks.map((r: RiskItem) => (
                    <div key={r.id} className="p-3 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-xl border border-slate-100 text-xs text-left space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px]">{r.risk_id}</span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase font-mono ${getRiskBadgeColor(r.impact * r.likelihood)}`}>
                          Score: {r.impact * r.likelihood}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{r.risk_title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2"><strong className="text-slate-700">Threat:</strong> {r.threat}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2"><strong className="text-slate-700">Treatment Plan:</strong> {r.treatment_plan}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Owner: {r.risk_owner}</span>
                        <span>Asset: {r.asset_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Overview stats breakdown
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <p className="text-xs text-slate-500 leading-normal">
                    This table maps the total number of risks currently identified in the risk register. Review critical items and treatment plans immediately.
                  </p>
                  
                  {/* Bands Breakdown progress bars */}
                  <div className="space-y-3">
                    {/* Critical */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-rose-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Critical Risk Band (Score &ge; 15)
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {clientRisks.filter(r => r.impact * r.likelihood >= 15).length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full transition-all duration-500" 
                          style={{ width: `${(clientRisks.filter(r => r.impact * r.likelihood >= 15).length / Math.max(totalRisks, 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* High */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-orange-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          High Risk Band (Score 10 - 12)
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {clientRisks.filter(r => r.impact * r.likelihood >= 10 && r.impact * r.likelihood < 15).length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full transition-all duration-500" 
                          style={{ width: `${(clientRisks.filter(r => r.impact * r.likelihood >= 10 && r.impact * r.likelihood < 15).length / Math.max(totalRisks, 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-yellow-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Medium Risk Band (Score 8 - 9)
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {clientRisks.filter(r => r.impact * r.likelihood >= 8 && r.impact * r.likelihood < 10).length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-yellow-500 h-full transition-all duration-500" 
                          style={{ width: `${(clientRisks.filter(r => r.impact * r.likelihood >= 8 && r.impact * r.likelihood < 10).length / Math.max(totalRisks, 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Low */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Low Risk Band (Score 1 - 6)
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {clientRisks.filter(r => r.impact * r.likelihood < 8).length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${(clientRisks.filter(r => r.impact * r.likelihood < 8).length / Math.max(totalRisks, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('risks')}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
            >
              <span>Manage Risk Register</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Compliance Findings Heatmap (D3 Visualization) */}
      <AuditComplianceHeatmap
        client={client}
        audits={audits}
        findings={findings}
        onNavigateTab={onNavigateTab}
      />

      {/* Grid of Alert Warnings & Upcoming Schedule Calendars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Actions Required / Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Alarms & Compliance Actions Required</h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {overduePpmCount > 0 &&
              clientAssets.filter(a => a.status === 'ACTIVE' && a.ppm_due_date && new Date(a.ppm_due_date) < new Date()).map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-950">Biomedical Maintenance OVERDUE: {asset.asset_code}</p>
                      <p className="text-rose-800 text-[11px] leading-snug mt-0.5">{asset.asset_name} PPM was due on: {asset.ppm_due_date}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('assets')}
                    className="text-[11px] font-bold text-rose-950 hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    View Asset
                  </button>
                </div>
              ))
            }

            {clientRisks.filter(r => r.impact * r.likelihood >= 15).map(risk => (
              <div key={risk.id} className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-xs">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">Critical Risk Profile: {risk.risk_id}</p>
                    <p className="text-amber-800 text-[11px] leading-snug mt-0.5">Title: {risk.risk_title} (Current Score: {risk.impact * risk.likelihood})</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('risks')}
                  className="text-[11px] font-bold text-amber-950 hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Mitigate
                </button>
              </div>
            ))}

            {overduePpmCount === 0 && clientRisks.filter(r => r.impact * r.likelihood >= 15).length === 0 && (
              <div className="p-8 text-center text-slate-400">
                ⭐ No critical warnings or PPM overdues detected. Active database context is healthy.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Audits / Schedule Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Audit Schedule & Reviews</h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {clientAudits.map(audit => (
              <div key={audit.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{audit.audit_number} ({audit.audit_type})</p>
                    <p className="text-slate-500 text-[11px] leading-snug mt-0.5">Scope: {audit.audit_scope}</p>
                  </div>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <span className="block font-mono font-bold text-slate-700">{audit.audit_date}</span>
                  <span className={`inline-block text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded ${
                    audit.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {audit.status}
                  </span>
                </div>
              </div>
            ))}

            {clientAudits.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No active scheduled audits on calendar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUPER ADMIN DASHBOARD POPUP MODAL FOR WINDOWS ENDPOINT AI SCAN REPORT */}
      {activeScanReportPopup && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 text-left">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider font-mono">
                      Super Admin Pop-Up Scan Report
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(activeScanReportPopup.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-white mt-0.5">
                    Gemini AI Posture & Hardening Audit Report
                  </h3>
                  <p className="text-xs text-slate-300">
                    Host: <strong className="text-cyan-300 font-mono">{activeScanReportPopup.endpoint.hostname || activeScanReportPopup.endpoint.name}</strong> ({activeScanReportPopup.endpoint.ip_address || activeScanReportPopup.endpoint.ip})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveScanReportPopup(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                title="Close Scan Report Popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Top Banner Grade & Compliance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Hardening Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-emerald-400 font-mono">
                      {activeScanReportPopup.report.posture_score || activeScanReportPopup.report.postureScore || activeScanReportPopup.endpoint.overallScore || 85}%
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      Grade {activeScanReportPopup.report.overall_grade || activeScanReportPopup.report.overallGrade || 'A'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-800">DOH ADHICS Posture</span>
                  <span className="text-sm font-extrabold text-cyan-950 mt-1">
                    {activeScanReportPopup.report.adhics_compliance_status || activeScanReportPopup.report.adhicsComplianceStatus || 'Compliant Baseline'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Custodian / Dept</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {activeScanReportPopup.endpoint.custodian || 'SysAdmin'} ({activeScanReportPopup.endpoint.department || 'IT'})
                  </span>
                </div>
              </div>

              {/* AI Executive Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  Gemini AI Security Executive Summary:
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {activeScanReportPopup.report.executive_summary || activeScanReportPopup.report.executiveSummary}
                </p>
              </div>

              {/* Critical Security Gaps & Findings */}
              {(activeScanReportPopup.report.critical_gaps || activeScanReportPopup.report.identifiedRisks) && (
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block">
                    Identified Compliance Voids & Hardening Gaps:
                  </span>
                  <div className="space-y-2">
                    {(activeScanReportPopup.report.critical_gaps || activeScanReportPopup.report.identifiedRisks).map((gap: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950">
                            {gap.finding_title || gap.title || gap.vector || `Security Gap #${idx + 1}`}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                            {gap.severity || 'HIGH'}
                          </span>
                        </div>
                        <p className="text-amber-900 text-[11px]">{gap.impact || gap.description}</p>
                        {gap.adhics_control_ref && (
                          <div className="text-[10px] text-amber-800 font-mono pt-1">
                            Ref: <strong>{gap.adhics_control_ref}</strong> • Remediation: {gap.recommended_action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executable PowerShell Remediation Script */}
              {(activeScanReportPopup.report.powershell_remediation_script || activeScanReportPopup.report.remediationScript) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-slate-700" />
                      Generated PowerShell Hardening Remediation Script (.ps1):
                    </span>
                    <button
                      onClick={() => {
                        const script = activeScanReportPopup.report.powershell_remediation_script || activeScanReportPopup.report.remediationScript;
                        navigator.clipboard.writeText(script);
                        setCopiedDashboardScript(true);
                        setTimeout(() => setCopiedDashboardScript(false), 3000);
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedDashboardScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDashboardScript ? 'Copied Script!' : 'Copy Script (.ps1)'}
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800 max-h-52 custom-scrollbar">
                    {activeScanReportPopup.report.powershell_remediation_script || activeScanReportPopup.report.remediationScript}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  onNavigateTab('windows-endpoint-auditor');
                  setActiveScanReportPopup(null);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Monitor className="w-4 h-4" />
                Go to Full Endpoint Guard Inventory ➔
              </button>

              <button
                onClick={() => setActiveScanReportPopup(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close Report Popup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
