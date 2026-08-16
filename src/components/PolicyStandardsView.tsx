import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Target, 
  Activity, 
  Calculator, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function PolicyStandardsView() {
  const [activeTab, setActiveTab] = useState<'governance' | 'objectives' | 'methodology' | 'calculations' | 'thresholds' | 'improvement'>('governance');

  const menuItems = [
    { id: 'governance', label: 'Governance & Roles', icon: Users, desc: 'Key administrative owners & reporting schedules' },
    { id: 'objectives', label: 'Policy Objectives', icon: Target, desc: 'Clinical & information security compliance goals' },
    { id: 'methodology', label: 'Risk Methodology', icon: Activity, desc: 'ISO 27001 & 31000 lifecycle controls' },
    { id: 'calculations', label: 'Asset CIA Formula', icon: Calculator, desc: '3-Variable unmitigated risk matrix mapping' },
    { id: 'thresholds', label: 'Appetite & Thresholds', icon: AlertTriangle, desc: 'Escalation response, SLA & risk tolerance rules' },
    { id: 'improvement', label: 'Review & Improvements', icon: Award, desc: 'Continuous audit cycle and document control' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="space-y-2 lg:col-span-1">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-2 pb-3 mb-3 border-b border-slate-100">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Standards Navigator</span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-250 group cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 font-bold' 
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
                >
                  <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <div>
                    <div className="text-xs font-bold leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md text-white space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            ISO 27001 Compliance
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            This digital standards reference manual enforces governance rules mapped from ISO 27001 clauses 5.1, 6.1.2, 6.1.3, and 8.2 alongside UAE Department of Health (DOH) ADHICS v2 protocols.
          </p>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>DOC-ID: CMP-RM-POL-2026</span>
            <span>v2.1</span>
          </div>
        </div>
      </div>

      {/* Detail Content Panel */}
      <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        
        {/* Governance & Responsibilities Section */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 1.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Governance & Responsibilities</h2>
              <p className="text-xs text-slate-500 mt-1">Definition of regulatory compliance roles, accountability structure, and mandated compliance reporting schedules.</p>
            </div>

            <div className="space-y-4">
              {/* IT Manager */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
                    IT Manager (ITM)
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">Enforcement Owner</span>
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 font-medium">
                  <li>Develops, maintains, and enforces this Risk Management Policy.</li>
                  <li>Ensures alignment with ISO standards and regulatory requirements.</li>
                  <li>Conducts risk management and information security awareness programs.</li>
                </ul>
              </div>

              {/* Managing Director / Manager */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
                    Managing Director / Manager
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">Executive Oversight</span>
                </div>
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 font-medium">
                  <li>Provides leadership and oversight for risk management activities.</li>
                  <li>Ensures risks are managed within their areas of responsibility.</li>
                  <li>Approves risk acceptance decisions in line with defined risk appetite.</li>
                  <li>Ensures corrective actions are implemented and reviewed.</li>
                </ul>
              </div>

              {/* Risk Owner */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
                    Risk Owner
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">SLA Review Mandated</span>
                </div>
                <p className="text-xs text-slate-600 font-medium pl-4">
                  Accountable for managing assigned risks, implementing controls, and documenting residual risks. Reports status based strictly on risk levels:
                </p>
                <div className="grid grid-cols-4 gap-2 pl-4 text-center">
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-800">
                    <div className="opacity-75">Low</div>
                    <div className="text-xs mt-0.5">Annual</div>
                  </div>
                  <div className="p-2 rounded bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-800">
                    <div className="opacity-75">Moderate</div>
                    <div className="text-xs mt-0.5">Annual</div>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-800">
                    <div className="opacity-75">High</div>
                    <div className="text-xs mt-0.5">Quarterly</div>
                  </div>
                  <div className="p-2 rounded bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-800">
                    <div className="opacity-75">Critical</div>
                    <div className="text-xs mt-0.5">Monthly</div>
                  </div>
                </div>
              </div>

              {/* Asset Owner */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
                  Asset Owner
                </h3>
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 font-medium">
                  <li>Ensures confidentiality, integrity, and availability (CIA) of assigned assets.</li>
                  <li>Maintains asset classification and valuation standard properties.</li>
                  <li>Identifies threats and vulnerabilities related to physical/digital assets.</li>
                  <li>Enforces access controls, backup requirements, and security safeguards.</li>
                </ul>
              </div>

              {/* Employees / Users */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-full" />
                  Employees / Users
                </h3>
                <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1 font-medium">
                  <li>Identify and report risks, security incidents, and vulnerabilities immediately.</li>
                  <li>Comply fully with organizational policies and security standards.</li>
                  <li>Participate in periodic risk management and security awareness training.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Policy Objectives Section */}
        {activeTab === 'objectives' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 2.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Risk Management Objectives</h2>
              <p className="text-xs text-slate-500 mt-1">Foundational objectives establishing clinical continuity, information protection, and a proactive safety culture.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-emerald-50/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Patient Safety & Quality</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Protect patient safety, quality of clinical care, and medical device service continuity. Minimize risk-related incidents causing care delivery downtime.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-indigo-50/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Culture of Reporting</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Promote a constructive, non-punitive organizational culture that actively encourages risk and near-miss identification, logging, and mitigation.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-amber-50/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Accreditation Compliance</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Ensure 100% compliance with licensing, legal, and regulatory requirements, including ADHICS v2, UAE DOH standards, and FANR radiation controls.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-rose-50/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">CIA Asset Safeguards</h4>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Secure the Confidentiality, Integrity, and Availability (CIA) of clinical information assets, including electronic health records and physical network layers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Methodology & Controls Section */}
        {activeTab === 'methodology' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 3.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Risk Management Methodology</h2>
              <p className="text-xs text-slate-500 mt-1">Lifecycle consistent with ISO 31000 and ISO 27001, focusing on documentation of existing controls & gap tracking.</p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 font-medium leading-relaxed">
              <p>
                As an integral part of the risk assessment process, the organization identifies, documents, and evaluates existing controls that are in place to manage risks. This ensures accurate determination of inherent and residual risks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Control Categorization
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Existing controls in the risk register must fall under:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                    <li><strong>Administrative:</strong> SOPs, policies, training</li>
                    <li><strong>Technical:</strong> Firewalls, encryption, backups</li>
                    <li><strong>Physical:</strong> Restricted access locks, CCTV cameras</li>
                    <li><strong>Operational:</strong> Change logs, monitoring systems</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-150 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Control Effectiveness Rating
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Every control must be validated with objective evidence:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                    <li><strong>Effective:</strong> Adequate design, fully implemented</li>
                    <li><strong>Partially Effective:</strong> Implemented but has some gaps</li>
                    <li><strong>Ineffective:</strong> Gaps render control useless</li>
                    <li><strong>Not Implemented:</strong> Missing or absent</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Control Gaps & Treatment Action
                </h4>
                <p className="text-[11px] text-amber-800 leading-normal font-medium">
                  Any gaps identified due to missing, weak, outdated, or ineffective controls must be clearly documented, assigned to a Risk Owner, and addressed through a dedicated Risk Treatment Plan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Asset CIA Formula & Calculations Section */}
        {activeTab === 'calculations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 4.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Asset CIA Value Formula</h2>
              <p className="text-xs text-slate-500 mt-1">Dynamic 3-variable calculation engine combining Confidentiality, Integrity, and Availability averages to form risk ratings.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-center space-y-2">
                <div className="text-[10px] uppercase text-emerald-400 tracking-wider">Mandated Calculation Formula</div>
                <div className="text-sm md:text-base font-bold">
                  Inherent Risk Score = Asset Value × Impact (I) × Likelihood
                </div>
                <div className="text-[11px] text-slate-400">
                  Where: Asset Value = (Confidentiality + Integrity + Availability) ÷ 3
                </div>
              </div>

              {/* Rounding rules card */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Average Asset Value Rounding Rules
                </h4>
                <p className="text-slate-600 leading-normal font-medium pl-6">
                  To align with integer compliance values, the following exact decimal rounding rules must be applied:
                </p>
                <div className="grid grid-cols-2 gap-4 pl-6 font-mono text-[11px]">
                  <div className="p-2 bg-white border border-slate-200 rounded text-center">
                    <span className="text-slate-500">Average 4.0 to 4.5</span>
                    <span className="block text-xs font-bold text-slate-800 mt-0.5">Round DOWN to 4</span>
                  </div>
                  <div className="p-2 bg-white border border-slate-200 rounded text-center">
                    <span className="text-slate-500">Average 4.6 to 5.0</span>
                    <span className="block text-xs font-bold text-slate-800 mt-0.5">Round UP to 5</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">1. Likelihood & Impact Rating Scale (1 to 5)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Likelihood table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-50 p-2.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Likelihood Ratings</div>
                    <table className="w-full text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-100">
                          <th className="p-2 text-center w-8">Rating</th>
                          <th className="p-2">Level</th>
                          <th className="p-2">Descriptor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">1</td><td className="p-2 font-bold">Rare</td><td className="p-2 text-slate-500">Highly unlikely to occur</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">2</td><td className="p-2 font-bold">Unlikely</td><td className="p-2 text-slate-500">Low probability but possible</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">3</td><td className="p-2 font-bold">Possible</td><td className="p-2 text-slate-500">Could occur occasionally</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">4</td><td className="p-2 font-bold">Likely</td><td className="p-2 text-slate-500">Occurs regularly, expected</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">5</td><td className="p-2 font-bold">Almost Certain</td><td className="p-2 text-slate-500">Frequent history of occurrence</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Impact table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-50 p-2.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">Impact Ratings</div>
                    <table className="w-full text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-100">
                          <th className="p-2 text-center w-8">Rating</th>
                          <th className="p-2">Level</th>
                          <th className="p-2">Descriptor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">1</td><td className="p-2 font-bold text-emerald-800 bg-emerald-50/20">Negligible</td><td className="p-2 text-slate-500">Minimal disruption, no impact</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">2</td><td className="p-2 font-bold text-blue-800 bg-blue-50/20">Minor</td><td className="p-2 text-slate-500">Easily manageable internally</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">3</td><td className="p-2 font-bold text-amber-800 bg-amber-50/20">Moderate</td><td className="p-2 text-slate-500">Noticeable effect on operations</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">4</td><td className="p-2 font-bold text-orange-800 bg-orange-50/20">Major</td><td className="p-2 text-slate-500">Significant outage/regulatory breach</td></tr>
                        <tr><td className="p-2 font-bold text-center font-mono bg-slate-50">5</td><td className="p-2 font-bold text-red-800 bg-red-50/20">Critical</td><td className="p-2 text-slate-500">Severe failure, loss, compliance suit</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appetite & Thresholds Section */}
        {activeTab === 'thresholds' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 5.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Risk Rating & Acceptance Criteria</h2>
              <p className="text-xs text-slate-500 mt-1">Appetite parameters, escalation thresholds, response protocols, and remediation SLAs.</p>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                      <th className="p-3 w-28 text-center">Score Range</th>
                      <th className="p-3 w-28">Risk Level</th>
                      <th className="p-3">Response & Acceptance Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-center text-emerald-800 bg-emerald-50/20">1 – 20</td>
                      <td className="p-3 font-extrabold text-emerald-700">Low</td>
                      <td className="p-3 text-slate-600 leading-normal font-medium text-[11px]">
                        Acceptable level of risk with no significant impact on patient safety, clinical services, or data security. Risk is tolerated and periodically monitored.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-center text-blue-800 bg-blue-50/20">21 – 50</td>
                      <td className="p-3 font-extrabold text-blue-700">Moderate</td>
                      <td className="p-3 text-slate-600 leading-normal font-medium text-[11px]">
                        Mitigation required and limited control actions. Implement cost-effective mitigation strategies. Monitor for any changes in frequency, scope, or potential escalation.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-center text-amber-800 bg-amber-50/20">51 – 75</td>
                      <td className="p-3 font-extrabold text-amber-700">High</td>
                      <td className="p-3 text-slate-600 leading-normal font-medium text-[11px]">
                        Immediate attention and control implementation. Deploy strong preventive and detective controls, increase monitoring frequency. Notify department heads and assign ownership for remediation.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-center text-rose-800 bg-rose-50/20">76 – 125</td>
                      <td className="p-3 font-extrabold text-rose-700">Critical</td>
                      <td className="p-3 text-slate-600 leading-normal font-medium text-[11px]">
                        Unacceptable under any circumstance; urgent mitigation is required. Involve executive leadership, legal, and compliance teams. Perform root cause analysis. (e.g. ransomware, medical record breach).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-600 space-y-2">
                <h4 className="font-bold text-slate-900">Treatment Actions Definitions</h4>
                <p>All treatment decisions are documented in the Risk Register under one of these strategies:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong>Avoidance:</strong> Eliminating the risk source or stopping the vulnerable activity entirely.</li>
                  <li><strong>Reduction (Mitigation):</strong> Implementing technical or physical controls to reduce likelihood or impact.</li>
                  <li><strong>Sharing:</strong> Transferring risk exposure through insurance or third-party SLA arrangements.</li>
                  <li><strong>Retention (Acceptance):</strong> Formally accepting residual risk with senior management sign-off and formal justification.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Audit, Incidents & Document Control Section */}
        {activeTab === 'improvement' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full">Section 6.0</span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Monitoring, Review & Improvement</h2>
              <p className="text-xs text-slate-500 mt-1">Ongoing incident reporting loops, audit standards, and policy control procedures.</p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 font-medium leading-relaxed">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Incident & Complaint Integration
                </h3>
                <p className="leading-normal text-slate-600">
                  A formal reporting mechanism is maintained to log and track security events, complaints, near-misses, and grievances. Real-time logging complies with applicable healthcare regulatory obligations.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Audit Cycle & Vulnerability Auditing
                </h3>
                <p className="leading-normal text-slate-600">
                  Assessments are validated via independent internal audits. Periodic digital vulnerability scans must be scheduled. <strong>The use of temporary systems or configuration changes solely to pass assessments is strictly prohibited.</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  Controlled Document Details
                </h3>
                <p className="leading-normal text-slate-600">
                  This policy is approved by top management. Controlled copies are maintained by the IT Manager. Any modifications must follow the organization's Document Control Procedure and be approved by the Managing Director.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
