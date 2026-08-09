/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { MessageSquare, Users, Send, Shield, CheckCircle2, UserCheck, Lock, AlertCircle, X, Circle, Sparkles, Building2, Mail } from 'lucide-react';

interface LiveChatCommunicatorProps {
  users: User[];
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  activeTenantId?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender_name: 'Sarah Jenkins',
    sender_email: 'sarah.jenkins@smarthub.io',
    sender_role: 'SUPER_ADMIN',
    recipient_email: 'ALL',
    content: 'Welcome to SmartHub Live Security Communicator! All conversations are encrypted and logged under Tenant ID TNT-GLOBAL-01.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    is_admin: true
  },
  {
    id: 'msg-2',
    sender_name: 'Tareq Al Mansoori',
    sender_email: 'tareq.m@smarthub.io',
    sender_role: 'CONSULTANT',
    recipient_email: 'sarah.jenkins@smarthub.io',
    content: 'Dr. Johnathan Carter completed the ADHICS Risk Review for Cleveland Clinic. All evidence files attached to Tenant TNT-CCAD-8821.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    is_admin: false
  },
  {
    id: 'msg-3',
    sender_name: 'Dr. Johnathan Carter',
    sender_email: 'j.carter@clevelandclinicabudhabi.ae',
    sender_role: 'CLIENT_ADMIN',
    recipient_email: 'ALL',
    content: 'Thank you Sarah & Tareq. Confirming Windows Endpoint GPO audit is passed for our 4 workstations.',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    is_admin: false
  }
];

export default function LiveChatCommunicator({
  users,
  currentUser,
  isOpen,
  onClose,
  activeTenantId = 'TNT-GLOBAL-01'
}: LiveChatCommunicatorProps) {
  // Pre-chat registration state (Require Name & Email ID before joining chat)
  const [chatProfile, setChatProfile] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sh_chat_identity');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse chat identity', e);
    }
    // If currentUser is logged in, default to their details but still let them confirm/register
    if (currentUser && currentUser.email) {
      return { name: currentUser.full_name || currentUser.name || 'Sarah Jenkins', email: currentUser.email };
    }
    return null;
  });

  const [inputName, setInputName] = useState(currentUser?.full_name || currentUser?.name || '');
  const [inputEmail, setInputEmail] = useState(currentUser?.email || '');
  const [profileError, setProfileError] = useState('');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sh_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse chat messages', e);
    }
    return INITIAL_MESSAGES;
  });

  const [messageText, setMessageText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'WHOS_ONLINE' | 'RBAC_DIRECTORY'>('WHOS_ONLINE');

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sh_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat messages', e);
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleRegisterProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    const email = inputEmail.trim().toLowerCase();

    if (!name || !email) {
      setProfileError('Please provide both your Full Name and Corporate Email Address.');
      return;
    }

    if (!email.includes('@')) {
      setProfileError('Please enter a valid corporate email address (e.g. user@smarthub.io).');
      return;
    }

    const newProfile = { name, email };
    setChatProfile(newProfile);
    localStorage.setItem('sh_chat_identity', JSON.stringify(newProfile));
    setProfileError('');
    setActiveTab('CHAT');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !chatProfile) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_name: chatProfile.name,
      sender_email: chatProfile.email,
      sender_role: currentUser.role || 'SUPER_ADMIN',
      recipient_email: selectedRecipient,
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      is_admin: currentUser.role === 'SUPER_ADMIN'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const formattedTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[720px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">SmartHub Live Communicator</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30">
                  SUPER_ADMIN ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Active Tenant ID: <strong className="text-emerald-400 font-mono">{activeTenantId}</strong></span>
                <span>•</span>
                <span>Role-Based Access Guard Enforced</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('WHOS_ONLINE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'WHOS_ONLINE'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Who's Online</span>
              <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-mono font-extrabold text-[10px] rounded-full">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'CHAT'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Chat Messages</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 font-mono font-bold text-[10px] rounded-full">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('RBAC_DIRECTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'RBAC_DIRECTORY'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>RBAC Tenant Directory</span>
            </button>
          </div>

          {chatProfile ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800">{chatProfile.name}</span>
              <span className="text-slate-400 text-[11px]">({chatProfile.email})</span>
              <button
                onClick={() => setChatProfile(null)}
                className="text-[10px] font-bold text-emerald-600 hover:underline ml-1 cursor-pointer"
              >
                Edit Identity
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Identity Verification Required Before Chatting
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">

          {/* TAB 1: WHO'S ONLINE */}
          {activeTab === 'WHOS_ONLINE' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Active Online Users & RBAC Session Monitor
                  </h4>
                  <p className="text-xs text-slate-500">
                    Real-time status of authorized corporate personnel on active Tenant IDs.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('CHAT')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Live Broadcast Chat
                </button>
              </div>

              {/* Online Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u, idx) => {
                  const isUserCurrent = u.email?.toLowerCase() === currentUser?.email?.toLowerCase();
                  const tenantId = u.tenant_id || u.client_id || 'TNT-GLOBAL-01';
                  const isOnline = idx < 3 || isUserCurrent; // First 3 and current user online
                  const isAway = idx === 3;

                  return (
                    <div
                      key={u.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                              {u.full_name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isOnline ? 'bg-emerald-500' : isAway ? 'bg-amber-500' : 'bg-slate-300'
                            }`} />
                          </div>
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-900 leading-tight">
                              {u.full_name || u.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded-full ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'CONSULTANT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] space-y-1 font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400 font-sans font-bold">Active Tenant ID:</span>
                          <span className="font-extrabold text-slate-800">{tenantId}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400 font-sans font-bold">Status:</span>
                          <span className={`font-bold ${isOnline ? 'text-emerald-600' : isAway ? 'text-amber-600' : 'text-slate-400'}`}>
                            {isOnline ? '🟢 Online & Active' : isAway ? '🟡 Away (5m)' : '⚪ Offline'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRecipient(u.email);
                          setActiveTab('CHAT');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Direct Chat with {u.full_name?.split(' ')[0]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CHAT */}
          {activeTab === 'CHAT' && (
            <div className="h-full flex flex-col space-y-4">
              
              {/* If Profile Not Set, Show Prompt First */}
              {!chatProfile ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg mx-auto my-auto space-y-5 text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <UserCheck className="w-7 h-7" />
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Identity Verification Before Chat</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Under Compliance audit policies, users must confirm their <strong>Full Name</strong> and <strong>Corporate Email Address</strong> before communicating in live chat.
                    </p>
                  </div>

                  {profileError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterProfile} className="space-y-4 text-left text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={inputName}
                        onChange={e => setInputName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Corporate Email Address *</label>
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={e => setInputEmail(e.target.value)}
                        placeholder="e.g. sarah.jenkins@smarthub.io"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Identity & Start Chat
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Chat Controls & Recipient Selector */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-600">Chat Channel / Recipient:</span>
                      <select
                        value={selectedRecipient}
                        onChange={e => setSelectedRecipient(e.target.value)}
                        className="bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="ALL">📢 Broadcast to All Online Users</option>
                        {users.map(u => (
                          <option key={u.id} value={u.email}>
                            👤 Direct: {u.full_name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Sender Identity: <strong className="text-slate-800">{chatProfile.name}</strong></span>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 overflow-y-auto space-y-3 min-h-[280px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No chat messages sent yet. Send a message below!
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isSelf = msg.sender_email?.toLowerCase() === chatProfile.email.toLowerCase();

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1 text-[10px]">
                              <span className="font-extrabold text-slate-800">{msg.sender_name}</span>
                              <span className="text-slate-400">({msg.sender_email})</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono font-bold rounded uppercase">
                                {msg.sender_role}
                              </span>
                              <span className="text-slate-400 font-mono">{formattedTime(msg.timestamp)}</span>
                            </div>

                            <div
                              className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-2xs ${
                                isSelf
                                  ? 'bg-slate-900 text-white rounded-tr-xs'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                              }`}
                            >
                              {msg.recipient_email !== 'ALL' && (
                                <div className="text-[10px] font-bold text-emerald-400 mb-1 border-b border-slate-700/50 pb-1">
                                  🔒 Direct Message to: {msg.recipient_email}
                                </div>
                              )}
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] shrink-0">
                    <span className="text-slate-400 font-bold shrink-0 self-center">Quick Templates:</span>
                    {[
                      'ADHICS Audit evidence uploaded & ready',
                      'Requesting RBAC email approval for new user',
                      'Please verify Windows Endpoint scan logs',
                      'System maintenance scheduled'
                    ].map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMessageText(template)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 font-medium rounded-lg border border-slate-200 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Bar */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder={`Type message to ${selectedRecipient === 'ALL' ? 'All Active Users' : selectedRecipient}...`}
                      className="flex-1 p-3 rounded-2xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md text-xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* TAB 3: RBAC DIRECTORY */}
          {activeTab === 'RBAC_DIRECTORY' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Role-Based Access Control (RBAC) Authorized Directory
                </h4>
                <p className="text-xs text-slate-500">
                  Strict authorization policy: Only users with verified corporate email addresses listed in this table are permitted to authenticate.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                        <th className="p-3.5">Full Name</th>
                        <th className="p-3.5">Email Address</th>
                        <th className="p-3.5">Active Tenant ID</th>
                        <th className="p-3.5">Assigned Role</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {users.map(u => {
                        const tenantId = u.tenant_id || u.client_id || 'TNT-GLOBAL-01';

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center">
                                {u.full_name?.charAt(0) || 'U'}
                              </div>
                              <span>{u.full_name || u.name}</span>
                            </td>
                            <td className="p-3.5 text-slate-700 font-mono">{u.email}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-extrabold rounded-md text-[10.5px]">
                                {tenantId}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-slate-800">{u.role}</td>
                            <td className="p-3.5 text-center">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Authorized
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Blocked
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
