/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, Server, Layers, ShieldAlert, KeyRound, Database, Workflow, 
  Shield, CheckCircle2, Lock, Users, FileText, AlertTriangle, Activity, 
  HardDrive, Mail, Settings, Cpu, ChevronRight, Fingerprint, Eye, Printer, Ban, Zap
} from 'lucide-react';

export default function ArchitectureDocs() {
  const [activeTab, setActiveTab] = useState<'brd' | 'srs' | 'arch'>('brd');

  return (
    <div id="architecture-docs-view" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
        <button
          id="tab-brd"
          onClick={() => setActiveTab('brd')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'brd'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Detailed Business Requirements (BRD)
        </button>
        <button
          id="tab-srs"
          onClick={() => setActiveTab('srs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'srs'
              ? 'bg-white text-blue-800 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          System Specifications (SRS)
        </button>
        <button
          id="tab-arch"
          onClick={() => setActiveTab('arch')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'arch'
              ? 'bg-white text-purple-800 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Server className="w-4 h-4 text-purple-600" />
          High-Level SaaS Architecture Diagrams
        </button>
      </div>

      <div className="p-6 md:p-8 max-h-[78vh] overflow-y-auto font-sans text-slate-800 leading-relaxed">
        {/* ========================================================================= */}
        {/* TAB 1: BUSINESS REQUIREMENTS DOCUMENT (BRD)                               */}
        {/* ========================================================================= */}
        {activeTab === 'brd' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  BRD v2.5 Specification
                </span>
                <span className="text-[10px] font-bold text-slate-400">Enterprise Release Document</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                Detailed Business Requirements Document (BRD)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                SmartHub HealthProtection Compliance Manager — Multi-Tenant Compliance, Asset Lifecycle, Granular RBAC, and Audit Platform.
              </p>
            </div>

            {/* 1. Executive Summary */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                1. Executive Summary & Core Objectives
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The <strong>SmartHub HealthProtection Compliance Manager</strong> is an enterprise multi-tenant SaaS application designed specifically for healthcare organizations, compliance consultants, clinical engineers, and technical auditors in the UAE (Abu Dhabi DOH, Dubai DHA, Malaffi, Nabidh) and global healthcare sectors. The application unifies regulatory compliance tracking (ISO/IEC 27001, NIST, DOH Standards), biomedical and IT asset maintenance lifecycles, risk management, non-compliance audit reports (NCR/CAPA), and granular multi-tenant access control into a single glass panel.
              </p>
            </section>

            {/* 2. Core Functional Requirements */}
            <section className="space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                2. Functional Module Requirements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    Multi-Tenant Client Segregation
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Consultants & Super Admins can switch context across distinct tenant organizations with strict data isolation for assets, risk registers, audit findings, and user profiles.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <Fingerprint className="w-4 h-4 text-indigo-600 shrink-0" />
                    Granular Per-Module RBAC
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Administrators can override global role permissions on a per-module basis, assigning specific operational bounds (<code className="text-emerald-700 bg-emerald-50 font-mono px-1 rounded">Edit</code>, <code className="text-sky-700 bg-sky-50 font-mono px-1 rounded">View Only</code>, <code className="text-purple-700 bg-purple-50 font-mono px-1 rounded">Print</code>, or <code className="text-rose-700 bg-rose-50 font-mono px-1 rounded">Off</code>) to individual users per tab.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                    Biomedical & IT Asset Lifecycle
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Comprehensive asset tracking covering IT infrastructure and clinical Biomedical hardware. Enforces Planned Preventive Maintenance (PPM), End of Life (EOL), and End of Support (EOS) timelines.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Compliance Governance & Risk Assessment
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Interactive 5x5 Likelihood × Impact rating grid aligning risk treat plans with ISO 27001 Annex A controls and DOH Information Security Regulations (ISR).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    Audit NCR & CAPA Workflow
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    End-to-end management of audit observations, Non-Compliance Reports (NCR), Corrective Action Plans (CAPA), due-date tracking, evidence upload, and verified closure.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900">
                    <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
                    MFA & Security Access Reset Tokens
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Supports Google/Microsoft Authenticator app TOTP verification codes, 2FA setup, and single-use security reset token links for user password setup and instant portal launch.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Granular User Roles & Privilege Bounds Matrix */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                3. Role-Based & Per-Module Access Matrix
              </h2>
              <p className="text-xs text-slate-600">
                The platform enforces a hybrid permission system combining standard baseline roles with granular per-module overrides (`module_access` configuration):
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold text-[11px]">
                      <th className="p-2.5">User Role</th>
                      <th className="p-2.5">Global Baseline Bound</th>
                      <th className="p-2.5">Module Overrides Supported</th>
                      <th className="p-2.5">Tenant Administration</th>
                      <th className="p-2.5">Risks & Policies</th>
                      <th className="p-2.5">Asset Maintenance</th>
                      <th className="p-2.5">Audit Findings (NCR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-purple-700">SUPER_ADMIN</td>
                      <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">EDIT (Full)</span></td>
                      <td className="p-2.5 text-slate-600">Yes (All modules)</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-blue-700">CONSULTANT</td>
                      <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">EDIT (Assigned)</span></td>
                      <td className="p-2.5 text-slate-600">Yes (Custom per client)</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Clients Only</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-emerald-700">CLIENT_ADMIN</td>
                      <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">EDIT (Tenant)</span></td>
                      <td className="p-2.5 text-slate-600">Yes (Internal Users)</td>
                      <td className="p-2.5 text-rose-600 font-bold">No Access</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Full Create/Edit</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Findings Only</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-orange-700">AUDITOR</td>
                      <td className="p-2.5"><span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">PRINT_ONLY / VIEW</span></td>
                      <td className="p-2.5 text-slate-600">Yes (Module level)</td>
                      <td className="p-2.5 text-rose-600 font-bold">No Access</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Only</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Only</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Create/Submit Findings</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-slate-600">READ_ONLY</td>
                      <td className="p-2.5"><span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">VIEW_ONLY</span></td>
                      <td className="p-2.5 text-slate-600">Yes (View/Print only)</td>
                      <td className="p-2.5 text-rose-600 font-bold">No Access</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Only</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Only</td>
                      <td className="p-2.5 text-sky-700 font-medium">View Only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Regulatory Framework Alignment */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                4. Regulatory Framework & Standards Alignment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-950 block">🇦🇪 DOH Abu Dhabi Healthcare Regulations</span>
                  <p className="text-[11px]">
                    Strict compliance mapping with DOH Information Security Regulations (ISR). Enforces annual PPM logs and asset serialization for life-critical medical equipment.
                  </p>
                </div>
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-extrabold text-blue-950 block">🌐 MALAFFI & NABIDH HIE Interoperability</span>
                  <p className="text-[11px]">
                    Requires audit logging for sensitive data access, API encryption in transit, and client credentials verification for Health Information Exchanges.
                  </p>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 space-y-1">
                  <span className="font-extrabold text-purple-950 block">🔒 ISO/IEC 27001:2022 & NIST Cyber Framework</span>
                  <p className="text-[11px]">
                    Pre-loaded Annex A controls (A.5 Organizational, A.8 Technological, A.12 Operational Security) with risk assessment linkage and evidence logs.
                  </p>
                </div>
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 space-y-1">
                  <span className="font-extrabold text-amber-950 block">📋 Endpoint & Network Infrastructure Rules</span>
                  <p className="text-[11px]">
                    Built-in Windows Endpoint Auditor mapping local firewall states, EDR/Antivirus status, and OS patch compliance against regulatory baselines.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SYSTEM REQUIREMENTS SPECIFICATION (SRS)                             */}
        {/* ========================================================================= */}
        {activeTab === 'srs' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  SRS Technical Spec v2.5
                </span>
                <span className="text-[10px] font-bold text-slate-400">Engineering & Security Reference</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                System Requirements Specification (SRS)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Software parameters, RBAC evaluation algorithms, security link tokens, and performance benchmarks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Specs */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-rose-700">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  1. Security & Authentication Protocols
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Transport Layer Security</strong>: TLS 1.3 enforced across all web applet and server API routes (Port 3000).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>MFA TOTP Authenticator Engine</strong>: Standard 6-digit TOTP verification algorithm (RFC 6238) compatible with Google Authenticator and Microsoft Authenticator.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Security Access Link Tokens</strong>: Cryptographically random URL parameters (<code className="text-indigo-700 font-mono bg-indigo-50 px-1 rounded">?reset-token=...&email=...</code>) with one-click direct launcher and user state activation.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Immutable Audit Logging</strong>: Pre/post snapshot serialization on user privilege changes, risk assessments, and authentication events stored in central audit trails.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Authorization Engine Specs */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-700">
                  <Fingerprint className="w-4 h-4 text-indigo-600" />
                  2. Granular Module RBAC Evaluation Spec
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Evaluation Function</strong>: Evaluated via <code className="text-slate-900 font-mono bg-slate-200/80 px-1 rounded">getModuleAccessLevel(user, tabId)</code>.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Resolution Hierarchy</strong>: Checks <code className="text-slate-900 font-mono bg-slate-200/80 px-1 rounded">user.module_access[tabId]</code> first; if omitted, falls back to <code className="text-slate-900 font-mono bg-slate-200/80 px-1 rounded">user.allowed_tabs</code> and <code className="text-slate-900 font-mono bg-slate-200/80 px-1 rounded">user.access_level</code>.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>UI Rendering Enforcement</strong>:
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                        <li><code className="text-emerald-700 font-bold">EDIT</code>: Displays all interactive forms, save buttons, and delete actions.</li>
                        <li><code className="text-sky-700 font-bold">VIEW_ONLY</code>: Renders read-only fields and tables; disables write controls.</li>
                        <li><code className="text-purple-700 font-bold">PRINT_ONLY</code>: Isolates export/print triggers while restricting record modification.</li>
                        <li><code className="text-rose-700 font-bold">NO_ACCESS</code>: Completely hides the module from navigation and blocks direct view rendering.</li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Performance & Quality Metrics */}
            <section className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 border-l-4 border-blue-500 pl-3">
                3. Non-Functional Performance & Reliability Standards
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <span className="font-extrabold text-blue-950 block">⚡ Client UI Responsiveness</span>
                  <p className="text-slate-600 mt-1 text-[11px]">
                    Sub-100ms tab switching and instant local cache updates via React 18 state management and Tailwind v4 CSS rendering.
                  </p>
                </div>
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <span className="font-extrabold text-blue-950 block">🔒 Data Isolation Reliability</span>
                  <p className="text-slate-600 mt-1 text-[11px]">
                    100% tenant key validation on every query payload preventing cross-tenant data leaks in Firestore / local persistence.
                  </p>
                </div>
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <span className="font-extrabold text-blue-950 block">🌐 Offline Resiliency</span>
                  <p className="text-slate-600 mt-1 text-[11px]">
                    Graceful fallback to local storage state with sync on re-connection to ensure uninterrupted auditing in clinical environments.
                  </p>
                </div>
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                  <span className="font-extrabold text-blue-950 block">📊 System Audit Capacity</span>
                  <p className="text-slate-600 mt-1 text-[11px]">
                    Capable of logging over 100,000 security and asset operational events without UI slowdown or table pagination lag.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: HIGH-LEVEL SAAS ARCHITECTURE DIAGRAMS                              */}
        {/* ========================================================================= */}
        {activeTab === 'arch' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Phase 2 Architecture Delivery
                </span>
                <span className="text-[10px] font-bold text-slate-400">Full Topology & Security Flows</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                High-Level SaaS Architecture Diagrams
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Full-stack system architecture, granular module authorization flow, and security reset token authentication pipelines.
              </p>
            </div>

            {/* Diagram 1: Multi-Tenant Architecture */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-purple-800">
                <Database className="w-4 h-4 text-purple-600" />
                1. Multi-Tenant Full-Stack SaaS Architecture Topography
              </h3>
              <pre className="p-5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto shadow-xl leading-relaxed border border-slate-800">
{`+-------------------------------------------------------------------------------------------------------------------+
|                                       REACT 18 + VITE FRONTEND APPLICATION (CLIENT TIER)                           |
|                                                                                                                   |
|  +---------------------------+   +----------------------------+   +----------------------------+  +-----------------+ |
|  | Multi-Tenant Client Switch|   |  Biomedical & IT Assets    |   | Compliance Risk Matrix    |  | Windows Auditor | |
|  +---------------------------+   +----------------------------+   +----------------------------+  +-----------------+ |
|  | Per-Module RBAC Guard     |   | Policy Lifecycle & Acknowl|   | Audit NCR & CAPA Workflows |  | Security Reset  | |
|  +---------------------------+   +----------------------------+   +----------------------------+  +-----------------+ |
+---------------------------------------------------------+---------------------------------------------------------+
                                                          | HTTPS (Port 3000 / Reverse Proxy Nginx)
                                                          v
+-------------------------------------------------------------------------------------------------------------------+
|                                      EXPRESS NODE.JS RUNTIME SERVICE (PORT 3000)                                  |
|                                                                                                                   |
|  +-----------------------------+     +-------------------------------+     +-----------------------------------+  |
|  | Session & Auth Middleware   |---->| Granular RBAC Evaluation Engine|---->| Client Context Isolator Middleware |  |
|  +-----------------------------+     +-------------------------------+     +-----------------------------------+  |
|  | Audit Log Recorder          |---->| Reset Token Link Generator    |---->| Email Log & SMTP Dispatcher       |  |
|  +-----------------------------+     +-------------------------------+     +-----------------------------------+  |
+---------------------------------------------------------+---------------------------------------------------------+
                                                          | Google Firebase Admin SDK / Firestore
                                                          v
+-------------------------------------------------------------------------------------------------------------------+
|                                    FIREBASE FIRESTORE MULTI-TENANT CLOUD PERSISTENCE                              |
|                                                                                                                   |
|  +-------------------------------------------------------------------------------------------------------------+  |
|  | Firestore Security Rules enforce tenant boundary: (request.auth.uid & resource.data.client_id == client.id) |  |
|  |                                                                                                             |  |
|  |  [clients]    [users]    [assets]    [risks]    [policies]    [audit_findings]    [audit_logs]    [email_logs]  |  |
|  +-------------------------------------------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------------------------+`}
              </pre>
            </div>

            {/* Diagram 2: Granular Per-Module RBAC Flow */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-800">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                2. Granular Per-Module Access Level Authorization Pipeline
              </h3>
              <pre className="p-5 bg-slate-950 text-sky-300 font-mono text-[11px] rounded-2xl overflow-x-auto shadow-xl leading-relaxed border border-slate-800">
{` [ User Clicks Navigation Tab (e.g. 'risks' or 'assets') ]
                           |
                           v
          [ Call getModuleAccessLevel(user, tabId) ]
                           |
            +--------------+--------------+
            | Has Custom module_access?   |
            +--------------+--------------+
                   |              |
                (Yes)            (No)
                   |              |
                   v              v
        [ Read module_access[tabId] ]   [ Read allowed_tabs & access_level ]
                   \              /
                    \            /
                     v          v
              +----------------------------+
              | Evaluated Privilege State  |
              +----------------------------+
                           |
        +------------------+------------------+------------------+------------------+
        |                  |                  |                  |                  |
     (EDIT)           (VIEW_ONLY)        (PRINT_ONLY)       (NO_ACCESS)         (UNAUTHORIZED)
        |                  |                  |                  |                  |
        v                  v                  v                  v                  v
 [ Enable Full Forms  [ Read-Only Table    [ Isolate Print/Export  [ Hide Tab Nav &  [ Render Access
  & Write Controls ]   & Hide Edit Btns ]   Triggers Only ]         Block View ]      Denied Banner ]`}
              </pre>
            </div>

            {/* Diagram 3: MFA & Security Reset Token Authentication Pipeline */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800">
                <KeyRound className="w-4 h-4 text-amber-600" />
                3. Security Reset Token & TOTP Authenticator Flow
              </h3>
              <pre className="p-5 bg-slate-950 text-amber-300 font-mono text-[11px] rounded-2xl overflow-x-auto shadow-xl leading-relaxed border border-slate-800">
{` Admin Panel                  Express Server / Log                User Email / Direct URL
     |                                 |                                    |
     |-- 1. Click 'Resend Security' -->|                                    |
     |                                 |-- 2. Generate Random Token ------->| (Link: ?reset-token=XYZ&email=...)
     |                                 |-- 3. Log in Audit & Email Logs --->|
     |                                                                      |
     |<------------------- 4. User Clicks 'Launch & Test Link' -------------|
     |
     v
 [ App Detects URL Parameters ?reset-token & ?email ]
     |
     v
 [ Match Target User Profile & Render Security Setup Modal ]
     |
     +-----------------------------------+-----------------------------------+
     | Option A: Enter New Password      | Option B: One-Click Authenticate  |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
 [ Validate Password Match ]     [ Auto-Login Session ]             [ Record AUTH Log ]
     |                                   |                                   |
     +-----------------------------------+-----------------------------------+
                                         |
                                         v
                      [ Activate User Workspace Session ]`}
              </pre>
            </div>

            {/* Stack Justification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Frontend Layer
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  React 18 SPA powered by Vite bundler and Tailwind CSS v4. Delivers instantaneous, reactive single-screen workflows with no page reloads for asset registers, risk grids, and compliance documentation.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Server className="w-4 h-4 text-purple-600" />
                  Backend Service Runtime
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Node.js Express application listening on Port 3000. Handles authentication proxying, token generation, SMTP email logs, audit trail snapshots, and CORS isolation.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Persistence & Tenant Isolation
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Firebase Firestore Cloud database with declarative security rules and client-side offline storage state, enforcing isolated data partitions per client context.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
