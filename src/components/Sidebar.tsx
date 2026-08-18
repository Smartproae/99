/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Cpu,
  Flame,
  CheckSquare,
  FileSpreadsheet,
  FolderOpen,
  Settings as SettingsIcon,
  HelpCircle,
  FileText,
  AlertOctagon,
  Users,
  ShieldAlert,
  Signature,
  Printer,
  Lock,
  Scale,
  ChevronDown,
  ChevronRight,
  MonitorCheck,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { User } from '../types';
import { getDefaultTabsForRole } from '../utils/rbac';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  appName?: string;
  currentUser?: User;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
}

export default function Sidebar({ currentTab, onTabChange, appName = "SMARTHUB", currentUser, onLogout }: SidebarProps) {
  // Top level standalone items
  const standaloneTopItems: MenuItem[] = [
    { id: 'dashboard', label: 'Risk Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
    { id: 'clients', label: 'Client Management', icon: Building2, color: 'text-indigo-500' },
    { id: 'central-print-hub', label: 'Option Print Box', icon: Printer, color: 'text-blue-500 font-bold' }
  ];

  // Grouped parent menu sections requested
  const menuSections: MenuSection[] = [
    {
      id: 'compliance',
      title: 'Compliance',
      icon: Scale,
      items: [
        { id: 'legal-compliance', label: 'Legal & Compliance Register', icon: Scale, color: 'text-teal-500 font-bold' },
        { id: 'policies', label: 'Policy Frameworks setup', icon: BookOpen, color: 'text-blue-500' },
        { id: 'audits', label: 'Audit Findings (NCR)', icon: AlertOctagon, color: 'text-purple-500' },
        { id: 'capa', label: 'Corrective Actions (CAPA)', icon: CheckSquare, color: 'text-teal-500' }
      ]
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      icon: ShieldAlert,
      items: [
        { id: 'risks', label: 'Risk Register', icon: ShieldAlert, color: 'text-rose-500' },
        { id: 'reports', label: 'Risk Report View', icon: FileSpreadsheet, color: 'text-pink-500' }
      ]
    },
    {
      id: 'human-resource',
      title: 'Employee & Operator Management',
      icon: Users,
      items: [
        { id: 'employees', label: 'Employee HR Roster', icon: Users, color: 'text-indigo-400 font-bold' },
        { id: 'system-access-review', label: 'System Access Review Summary Report', icon: ShieldCheck, color: 'text-emerald-500 font-bold' }
      ]
    },
    {
      id: 'document-repository',
      title: 'Quick Master Setup',
      icon: FolderOpen,
      items: [
        { id: 'repository', label: 'Quick Master Setup', icon: FolderOpen, color: 'text-sky-500' },
        { id: 'hr-documents-hub', label: 'HR Documents Hub', icon: FileText, color: 'text-emerald-400 font-bold' },
        { id: 'policy-procedure-view', label: 'Policy & Master Index', icon: FileText, color: 'text-sky-400 font-bold' },
        { id: 'forms', label: 'Compliance Forms', icon: FileText, color: 'text-amber-500' }
      ]
    },
    {
      id: 'asset-management',
      title: 'Asset Management',
      icon: Cpu,
      items: [
        { id: 'assets', label: 'Assets Inventory', icon: Cpu, color: 'text-emerald-600' }
      ]
    },
    {
      id: 'physical-environmental',
      title: 'Physical and Environmental',
      icon: Lock,
      items: [
        { id: 'secure-area', label: 'Designated Secure Areas', icon: Lock, color: 'text-emerald-400 font-bold' }
      ]
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy and Protection',
      icon: Flame,
      items: [
        { id: 'incidents', label: 'Breach Incidents', icon: Flame, color: 'text-orange-500' }
      ]
    },
    {
      id: 'third-party-security',
      title: 'Third Party Security',
      icon: Signature,
      items: [
        { id: 'agreements', label: 'Agreements & Contracts', icon: Signature, color: 'text-amber-500 font-bold' }
      ]
    }
  ];

  // Standalone bottom items
  const standaloneBottomItems: MenuItem[] = [
    { id: 'windows-endpoint-auditor', label: 'Windows Endpoint Auditor', icon: MonitorCheck, color: 'text-cyan-400 font-bold' },
    { id: 'settings', label: 'System Admin Settings', icon: SettingsIcon, color: 'text-slate-500' },
    { id: 'docs', label: 'Specs & Architecture Docs', icon: HelpCircle, color: 'text-purple-600 font-bold' }
  ];

  // Get allowed tabs for the current user
  const allowedTabs = currentUser?.allowed_tabs || (currentUser ? getDefaultTabsForRole(currentUser.role) : []);

  // Filter helper for allowed tab IDs
  const isTabAllowed = (id: string) => {
    if (id === 'reports') {
      return allowedTabs.includes('risks') || allowedTabs.includes('reports');
    }
    return allowedTabs.includes(id);
  };

  // State to track section expansion
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'compliance': true,
    'risk-management': true,
    'human-resource': true,
    'document-repository': true,
    'asset-management': true,
    'physical-environmental': true,
    'data-privacy': true,
    'third-party-security': true
  });

  // Ensure active tab section is expanded automatically
  useEffect(() => {
    menuSections.forEach(section => {
      const hasActive = section.items.some(item => item.id === currentTab);
      if (hasActive) {
        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [currentTab]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const filteredTopStandalone = standaloneTopItems.filter(item => isTabAllowed(item.id));
  const filteredBottomStandalone = standaloneBottomItems.filter(item => isTabAllowed(item.id));

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 text-slate-300 h-screen flex flex-col justify-between shrink-0 font-sans select-none">
      {/* Upper Header Logo */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-md shadow-emerald-900/30">
            SH
          </div>
          <div className="text-left">
            <h1 className="font-bold text-sm text-white tracking-wider leading-none uppercase">{appName}</h1>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block mt-1">Health Protection</span>
          </div>
        </div>

        {/* Navigation List - Scrollable */}
        <nav className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {/* Top Standalone items */}
          {filteredTopStandalone.length > 0 && (
            <div className="space-y-1">
              {filteredTopStandalone.map(item => {
                const isActive = currentTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm font-bold border-l-4 border-emerald-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Categorized Parent Menu Sections */}
          <div className="space-y-2 pt-1">
            {menuSections.map(section => {
              const allowedChildren = section.items.filter(item => isTabAllowed(item.id));
              if (allowedChildren.length === 0) return null;

              const isExpanded = !!expandedSections[section.id];
              const SectionIcon = section.icon;
              const hasActiveChild = allowedChildren.some(item => item.id === currentTab);

              return (
                <div key={section.id} className="space-y-1">
                  {/* Parent Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all cursor-pointer text-left uppercase ${
                      hasActiveChild
                        ? 'text-emerald-400 bg-slate-800/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <SectionIcon className={`w-3.5 h-3.5 shrink-0 ${hasActiveChild ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="truncate">{section.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {hasActiveChild && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Child Menu Items */}
                  {isExpanded && (
                    <div className="ml-2 pl-2.5 border-l border-slate-800 space-y-0.5">
                      {allowedChildren.map(item => {
                        const isActive = currentTab === item.id;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs border-l-2 border-emerald-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <IconComponent className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Standalone items */}
          {filteredBottomStandalone.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              {filteredBottomStandalone.map(item => {
                const isActive = currentTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm font-bold border-l-4 border-emerald-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Footer Branding Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-400">SMARTHUB COMPLIANCE</p>
            <p className="text-[9px] text-emerald-500 font-bold mt-0.5">Production-Ready v1.2</p>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Logout / Exit Session"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Logout</span>
            </button>
          )}
        </div>
        <p className="leading-relaxed">Aligned with DOH Abu Dhabi, MALAFFI, and ISO/IEC 27001 Security Controls.</p>
      </div>
    </aside>
  );
}

