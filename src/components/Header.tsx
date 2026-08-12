/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Notification, User, UserRole } from '../types';
import { Bell, Shield, LogOut, ChevronDown, Check, AlertTriangle, HelpCircle, Calendar, Clock, MessageSquare, Users, Copy } from 'lucide-react';
import { formatDateDMY } from '../utils/dateUtils';

interface HeaderProps {
  clients: Client[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  currentUser: User;
  onSimulateRole: (role: UserRole) => void;
  onNavigateDocs: () => void;
  onLogout?: () => void;
  inactivityRemainingSeconds?: number;
  onOpenChat?: () => void;
  usersCount?: number;
  onOpenCopyModal?: () => void;
}

export default function Header({
  clients,
  activeClientId,
  onSelectClient,
  notifications,
  onMarkRead,
  currentUser,
  onSimulateRole,
  onNavigateDocs,
  onLogout,
  inactivityRemainingSeconds = 600,
  onOpenChat,
  usersCount = 5,
  onOpenCopyModal
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const activeClient = clients.find(c => c.id === activeClientId);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const allowedClients = (currentUser.role === 'CLIENT_ADMIN' || currentUser.role === 'AUDITOR' || currentUser.role === 'READ_ONLY') && currentUser.client_id
    ? clients.filter(c => c.id === currentUser.client_id)
    : clients;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSimulateRole(e.target.value as UserRole);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimerLow = inactivityRemainingSeconds <= 60;

  return (
    <header className="h-16 border-b border-slate-100 bg-white sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
      {/* Workspace Context Switching Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:block">Active Tenant:</span>
        <select
          id="workspace-tenant-selector"
          value={activeClientId}
          onChange={e => onSelectClient(e.target.value)}
          className="bg-slate-50 border border-slate-100 text-slate-800 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[280px]"
        >
          {allowedClients.map(c => (
            <option key={c.id} value={c.id}>
              {c.company_name} ({c.client_code})
            </option>
          ))}
        </select>
        {activeClient?.compliance_framework && (
          <span className="hidden lg:inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded font-mono uppercase">
            {activeClient.compliance_framework.split(' & ')[0]} Framework
          </span>
        )}
        {currentUser?.role === 'SUPER_ADMIN' && onOpenCopyModal && (
          <button
            type="button"
            onClick={onOpenCopyModal}
            title="Superadmin Privilege: Copy / Clone Data between Client Accounts"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Copy Client Data</span>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs" title="Current Device Local Date">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>{formatDateDMY(new Date())}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* INACTIVITY TIMEOUT TIMER BADGE (600s / 10m auto-logout) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all ${
            isTimerLow
              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
          title="Automatic logout occurs after 600 seconds (10 minutes) of inactivity."
        >
          <Clock className={`w-3.5 h-3.5 ${isTimerLow ? 'text-rose-600' : 'text-amber-600'}`} />
          <span className="hidden md:inline font-sans text-[10px] uppercase font-extrabold text-amber-800">Auto-Logout:</span>
          <span>{formatTimer(inactivityRemainingSeconds)}</span>
        </div>

        {/* LIVE CHAT & WHO'S ONLINE BUTTON */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Open Live Security Communicator and Active Online Users"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Who's Online & Chat</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        )}

        {/* HELP & SYSTEM DOCS LINK */}
        <button
          onClick={onNavigateDocs}
          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          title="View BRD, SRS, and System Design Diagrams"
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span className="hidden xl:inline">Specs & Docs</span>
        </button>

        {/* ROLE SIMULATOR FOR TESTING */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Role:</span>
          <select
            value={currentUser.role}
            onChange={handleRoleChange}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-bold rounded px-2 py-1 focus:outline-none cursor-pointer"
            title="Simulate user roles to test portal permission restriction gates"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="CONSULTANT">CONSULTANT</option>
            <option value="CLIENT_ADMIN">CLIENT_ADMIN</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="READ_ONLY">READ_ONLY</option>
          </select>
        </div>

        {/* ALERTS NOTIFICATION BELL */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-50 rounded-xl relative transition-all cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
              <div className="flex justify-between items-center px-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Compliance Notifications</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{unreadCount} Unread Alerts</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      className={`p-3 text-left transition-colors cursor-pointer ${n.is_read ? 'bg-white opacity-60' : 'bg-slate-50 hover:bg-slate-100/50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <span className="text-[8px] text-slate-400 block mt-1 font-mono">{n.created_at.split('T')[0]}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-slate-400 text-xs">No notifications on file.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE CHIP & LOGOUT */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-inner">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800">{currentUser.full_name}</span>
              <span className="text-[10px] font-bold text-slate-400">{currentUser.role}</span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200/80 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs"
              title="Logout / End Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
