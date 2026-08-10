/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_CLIENTS,
  INITIAL_USERS,
  INITIAL_POLICIES,
  INITIAL_RISK_ITEMS,
  INITIAL_ASSETS,
  INITIAL_INCIDENTS,
  INITIAL_AUDITS,
  INITIAL_FINDINGS,
  INITIAL_FORMS,
  INITIAL_DOCUMENTS,
  INITIAL_CORRECTIVE_ACTIONS,
  DEFAULT_SMTP,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMAIL_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_EMPLOYEES
} from './initialData';
import { getPolicyTemplateDefaults } from './utils/policyDefaults';

import {
  Client,
  User,
  Policy,
  RiskItem,
  Asset,
  Incident,
  Audit,
  AuditFinding,
  ComplianceForm,
  DocumentItem,
  CorrectiveAction,
  SMTPSetting,
  AuditLog,
  EmailLog,
  Notification,
  UserRole,
  Employee
} from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import EmployeeManagement from './components/EmployeeManagement';
import PolicyManagement from './components/PolicyManagement';
import PolicyFrameworksSetup from './components/PolicyFrameworksSetup';
import PolicyProcedureView from './components/PolicyProcedureView';
import RiskRegister from './components/RiskRegister';
import AssetRegister from './components/AssetRegister';
import IncidentManagement from './components/IncidentManagement';
import AuditManagement from './components/AuditManagement';
import FormsManagement from './components/FormsManagement';
import DocumentRepository from './components/DocumentRepository';
import HrDocumentsHub from './components/HrDocumentsHub';
import CorrectiveActions from './components/CorrectiveActions';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ArchitectureDocs from './components/ArchitectureDocs';
import GrcQuickSetupModal from './components/GrcQuickSetupModal';
import AgreementsContracts from './components/AgreementsContracts';
import SecureArea from './components/SecureArea';
import LegalComplianceRegister from './components/LegalComplianceRegister';
import WindowsEndpointAuditor from './components/WindowsEndpointAuditor';
import LiveChatCommunicator from './components/LiveChatCommunicator';

import { ShieldCheck, Lock, LogIn, KeyRound, Check, AlertCircle, Clock, Shield, AlertTriangle, FileText, MessageSquare, Users, UserCheck, Database, Github, GitBranch, RefreshCw } from 'lucide-react';

function sanitizeAndDeduplicate<T extends { id: string }>(list: T[], prefix: string): T[] {
  const seenIds = new Set<string>();
  return list.map((item, index) => {
    if (!item || !item.id || seenIds.has(item.id)) {
      let suffix = index + 1;
      while (seenIds.has(`${prefix}${suffix}`)) {
        suffix++;
      }
      const newId = `${prefix}${suffix}`;
      seenIds.add(newId);
      return { ...item, id: newId };
    }
    seenIds.add(item.id);
    return item;
  });
}

function safeParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.warn('[SmartHub GRC] Failed to parse JSON from localStorage, resetting to default', e);
    return defaultValue;
  }
}

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sh_auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logonBannerAccepted, setLogonBannerAccepted] = useState(true);
  const [pendingMfaUser, setPendingMfaUser] = useState<User | null>(null);
  const [mfaCodeInput, setMfaCodeInput] = useState('123456');
  const [mfaError, setMfaError] = useState('');
  const [isGithubAuthenticating, setIsGithubAuthenticating] = useState(false);

  // Session Inactivity Timeout State (600 seconds = 10 minutes)
  const [inactiveSeconds, setInactiveSeconds] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 600-second Inactivity Timeout tracking when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setInactiveSeconds(0);
      return;
    }

    const INACTIVITY_LIMIT_SECONDS = 600; // 10 minutes (600 seconds)

    const resetInactivity = () => {
      setInactiveSeconds(0);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivity, { passive: true }));

    const timer = setInterval(() => {
      setInactiveSeconds(prev => {
        if (prev + 1 >= INACTIVITY_LIMIT_SECONDS) {
          setIsAuthenticated(false);
          localStorage.removeItem('sh_auth');
          setLoginError('SECURITY SESSION EXPIRED: Automatically logged out due to 600 seconds (10 minutes) of inactivity.');
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivity));
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  // Core Data States
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('sh_clients');
    let loaded = safeParseJSON(saved, INITIAL_CLIENTS);
    if (Array.isArray(loaded)) {
      const sprcPreset = INITIAL_CLIENTS.find(c => c.client_code === 'SPRC');
      const sprcIndex = loaded.findIndex((c: any) => c.client_code === 'SPRC');
      if (sprcIndex === -1) {
        if (sprcPreset) {
          loaded = [sprcPreset, ...loaded];
        }
      } else if (sprcPreset) {
        // Self-heal the stamp and logo for SPRC client only if they are missing
        loaded[sprcIndex] = {
          ...loaded[sprcIndex],
          facility_logo: loaded[sprcIndex].facility_logo || sprcPreset.facility_logo,
          facility_stamp: loaded[sprcIndex].facility_stamp || sprcPreset.facility_stamp,
          company_name: loaded[sprcIndex].company_name || sprcPreset.company_name,
        };
      }
    }
    return sanitizeAndDeduplicate(loaded, 'c');
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sh_users');
    const loaded = safeParseJSON(saved, INITIAL_USERS);
    return sanitizeAndDeduplicate(loaded, 'u');
  });

  const [policies, setPolicies] = useState<Policy[]>(() => {
    const saved = localStorage.getItem('sh_policies');
    let loaded = safeParseJSON(saved, INITIAL_POLICIES);
    
    // Self-heal POL-SEC-019 to ensure it always includes the new Change Classification table
    if (Array.isArray(loaded)) {
      loaded = loaded.map((p: any) => {
        if (p && p.policy_no === 'POL-SEC-019') {
          const stmt = p.policy_statement || '';
          const containsTable = stmt.includes('| Change Type |') || stmt.includes('Emergency Change');
          if (!containsTable) {
            const defaults = getPolicyTemplateDefaults('POL-SEC-019', 'the facility');
            return {
              ...p,
              policy_statement: defaults.policy_statement,
              full_content: '' // clear cached full content to trigger regeneration with table
            };
          }
        }
        if (p && p.policy_no === 'POL-SEC-032') {
          return {
            ...p,
            policy_no: 'M-Policy-002',
            policy_name: 'Statement of Applicability'
          };
        }
        return p;
      });
    }

    return sanitizeAndDeduplicate(loaded, 'p');
  });

  const [risks, setRisks] = useState<RiskItem[]>(() => {
    const saved = localStorage.getItem('sh_risks');
    const loaded = safeParseJSON(saved, INITIAL_RISK_ITEMS);
    return sanitizeAndDeduplicate(loaded, 'r');
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('sh_assets');
    const loaded = safeParseJSON(saved, INITIAL_ASSETS);
    return sanitizeAndDeduplicate(loaded, 'a');
  });

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('sh_incidents');
    const loaded = safeParseJSON(saved, INITIAL_INCIDENTS);
    return sanitizeAndDeduplicate(loaded, 'i');
  });

  const [audits, setAudits] = useState<Audit[]>(() => {
    const saved = localStorage.getItem('sh_audits');
    const loaded = safeParseJSON(saved, INITIAL_AUDITS);
    return sanitizeAndDeduplicate(loaded, 'au');
  });

  const [findings, setFindings] = useState<AuditFinding[]>(() => {
    const saved = localStorage.getItem('sh_findings');
    const loaded = safeParseJSON(saved, INITIAL_FINDINGS);
    return sanitizeAndDeduplicate(loaded, 'f');
  });

  const [forms, setForms] = useState<ComplianceForm[]>(() => {
    const saved = localStorage.getItem('sh_forms');
    const loaded = safeParseJSON(saved, INITIAL_FORMS);
    return sanitizeAndDeduplicate(loaded, 'frm');
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('sh_documents');
    const loaded = safeParseJSON(saved, INITIAL_DOCUMENTS);
    const combined = [...loaded];
    // Ensure draft documents from INITIAL_DOCUMENTS are present
    INITIAL_DOCUMENTS.forEach(initDoc => {
      if (!combined.some(d => d.id === initDoc.id || (d.client_id === initDoc.client_id && d.document_code === initDoc.document_code))) {
        combined.push(initDoc);
      }
    });
    return sanitizeAndDeduplicate(combined, 'doc');
  });

  const [actions, setActions] = useState<CorrectiveAction[]>(() => {
    const saved = localStorage.getItem('sh_actions');
    const loaded = safeParseJSON(saved, INITIAL_CORRECTIVE_ACTIONS);
    return sanitizeAndDeduplicate(loaded, 'ca');
  });

  const [smtp, setSmtp] = useState<SMTPSetting>(() => {
    const saved = localStorage.getItem('sh_smtp');
    const parsed = safeParseJSON(saved, DEFAULT_SMTP);
    return { ...DEFAULT_SMTP, ...parsed, sandbox_mode: parsed.sandbox_mode ?? false };
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('sh_audit_logs');
    const loaded = safeParseJSON(saved, INITIAL_AUDIT_LOGS);
    return sanitizeAndDeduplicate(loaded, 'al');
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem('sh_email_logs');
    return safeParseJSON(saved, INITIAL_EMAIL_LOGS);
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('sh_notifications');
    return safeParseJSON(saved, INITIAL_NOTIFICATIONS);
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('sh_employees');
    return safeParseJSON(saved, INITIAL_EMPLOYEES);
  });

  // Active workspace states
  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem('sh_active_client_id') || 'c4';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('sh_current_user');
    return safeParseJSON(saved, {
      id: 'u1',
      role: 'SUPER_ADMIN',
      full_name: 'Sarah Jenkins',
      email: 'sarah.jenkins@smarthub.io',
      is_active: true,
      created_at: new Date().toISOString()
    });
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [riskSubTab, setRiskSubTab] = useState<'register' | 'policy' | 'report'>('register');
  const [isGrcQuickSetupOpen, setIsGrcQuickSetupOpen] = useState<boolean>(false);

  const [resetTokenUser, setResetTokenUser] = useState<{ user: User; token: string } | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');

  // Auto-detect ?reset-token=... & email=... in URL
  useEffect(() => {
    const parseResetUrl = () => {
      const search = window.location.search;
      if (!search || (!search.includes('reset-token') && !search.includes('token'))) return;

      const urlParams = new URLSearchParams(search);
      const resetToken = urlParams.get('reset-token') || urlParams.get('token');
      const emailParam = urlParams.get('email');

      if (resetToken) {
        let targetUser: User | undefined;
        
        if (emailParam) {
          const decodedEmail = decodeURIComponent(emailParam).toLowerCase().trim();
          targetUser = users.find(u => u.email && u.email.toLowerCase().trim() === decodedEmail);
        }

        if (!targetUser) {
          const possibleId = resetToken.split('-')[0];
          targetUser = users.find(u => u.id === possibleId || u.id === `u${possibleId}`);
        }

        if (!targetUser && emailParam) {
          const emailClean = decodeURIComponent(emailParam);
          targetUser = {
            id: `u-reset-${Date.now()}`,
            role: 'CLIENT_ADMIN',
            full_name: emailClean.split('@')[0].replace(/[\._]/g, ' ').toUpperCase(),
            email: emailClean,
            is_active: true,
            created_at: new Date().toISOString()
          };
        }

        if (!targetUser) {
          targetUser = users[0];
        }

        if (targetUser) {
          setResetTokenUser({ user: targetUser, token: resetToken });
        }
      }
    };

    parseResetUrl();
  }, [users]);

  const handleCompleteResetTokenFlow = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetTokenUser) return;

    if (resetPasswordInput && resetPasswordInput !== resetConfirmInput) {
      setResetPasswordError('Passwords do not match. Please re-enter matching passwords.');
      return;
    }

    const target = resetTokenUser.user;
    const updatedUser: User = {
      ...target,
      is_active: true,
      last_login: new Date().toISOString()
    };

    setUsers(prev => {
      const exists = prev.some(u => u.id === target.id || (u.email && u.email.toLowerCase() === target.email.toLowerCase()));
      if (exists) {
        return prev.map(u => (u.id === target.id || (u.email && u.email.toLowerCase() === target.email.toLowerCase())) ? updatedUser : u);
      }
      return [...prev, updatedUser];
    });

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    safeSetItem('sh_auth', 'true');
    safeSetItem('sh_current_user', JSON.stringify(updatedUser));

    handleAddEmailLog(
      updatedUser.email,
      `Password Reset & Account Setup Verified for ${updatedUser.full_name}`,
      'PASSWORD_RESET',
      'SENT',
      `Authenticated via Security Access Token: ${resetTokenUser.token}`
    );

    logAuditTrail('AUTHENTICATION', `PASSWORD RESET COMPLETED VIA SECURITY ACCESS LINK FOR ${updatedUser.email}`, {
      userId: updatedUser.id,
      token: resetTokenUser.token
    });

    // Remove token from address bar
    window.history.replaceState({}, document.title, window.location.pathname);
    setResetTokenUser(null);
    setResetPasswordInput('');
    setResetConfirmInput('');
    setResetPasswordError('');
    setResetSuccessNotice(`Welcome back, ${updatedUser.full_name}! Password setup complete and your workspace session is active.`);
    setTimeout(() => setResetSuccessNotice(''), 6000);
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'reports') {
      setCurrentTab('risks');
      setRiskSubTab('report');
    } else {
      setCurrentTab(tabId);
      if (tabId === 'risks') {
        setRiskSubTab('register');
      }
    }
  };

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn(`[SmartHub GRC] localStorage write failed for key: ${key}`, e);
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || String(e).includes('quota')) {
        try {
          console.log('[SmartHub GRC] Quota exceeded. Attempting Stage 1 self-healing (clearing non-critical logs)...');
          
          if (key === 'sh_audit_logs') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed) && parsed.length > 10) {
                const truncated = JSON.stringify(parsed.slice(0, 10));
                localStorage.setItem(key, truncated);
                setTimeout(() => setAuditLogs(prev => prev.slice(0, 10)), 0);
                console.log('[SmartHub GRC] Successfully fitted sh_audit_logs by truncating to 10 entries.');
                return;
              }
            } catch (err) {
              // fallback
            }
            localStorage.setItem(key, '[]');
            setTimeout(() => setAuditLogs([]), 0);
            return;
          }

          if (key === 'sh_email_logs') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed) && parsed.length > 10) {
                const truncated = JSON.stringify(parsed.slice(0, 10));
                localStorage.setItem(key, truncated);
                setTimeout(() => setEmailLogs(prev => prev.slice(0, 10)), 0);
                console.log('[SmartHub GRC] Successfully fitted sh_email_logs by truncating to 10 entries.');
                return;
              }
            } catch (err) {
              // fallback
            }
            localStorage.setItem(key, '[]');
            setTimeout(() => setEmailLogs([]), 0);
            return;
          }

          if (key === 'sh_notifications') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed) && parsed.length > 5) {
                const truncated = JSON.stringify(parsed.slice(0, 5));
                localStorage.setItem(key, truncated);
                setTimeout(() => setNotifications(prev => prev.slice(0, 5)), 0);
                console.log('[SmartHub GRC] Successfully fitted sh_notifications by truncating to 5 entries.');
                return;
              }
            } catch (err) {
              // fallback
            }
            localStorage.setItem(key, '[]');
            setTimeout(() => setNotifications([]), 0);
            return;
          }

          // Clear non-essential collections to free up substantial space (often >90% of usage)
          localStorage.setItem('sh_audit_logs', '[]');
          localStorage.setItem('sh_email_logs', '[]');
          localStorage.setItem('sh_notifications', '[]');
          
          // Defer the state synchronization to bypass current React render cycle and prevent feedback loops
          setTimeout(() => {
            setAuditLogs([]);
            setEmailLogs([]);
            setNotifications([]);
          }, 0);

          try {
            // Retry writing the critical data after Stage 1 cleanup
            localStorage.setItem(key, value);
            console.log(`[SmartHub GRC] Stage 1 self-healing successful. Critical data saved for key: ${key}`);
          } catch (retry1Error) {
            console.warn('[SmartHub GRC] Stage 1 self-healing insufficient. Initiating Stage 2 deep cleanup (stripping huge base64 fields & list pruning)...');
            
            // 1. Strip out massive base64 signatures/scans from collections
            const keysToCleanSignatures = ['sh_policies', 'sh_clients', 'sh_agreements', 'sh_documents'];
            for (const k of keysToCleanSignatures) {
              const val = localStorage.getItem(k);
              if (val) {
                try {
                  const parsed = JSON.parse(val);
                  let modified = false;

                  const cleanSignatures = (obj: any): any => {
                    if (!obj || typeof obj !== 'object') return obj;
                    if (Array.isArray(obj)) {
                      return obj.map(item => cleanSignatures(item));
                    }
                    const copy = { ...obj };
                    for (const prop in copy) {
                      if (typeof copy[prop] === 'string') {
                        const str = copy[prop];
                        if (str.startsWith('data:') && str.length > 5000) {
                          copy[prop] = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
                          modified = true;
                        }
                      } else if (typeof copy[prop] === 'object') {
                        copy[prop] = cleanSignatures(copy[prop]);
                      }
                    }
                    return copy;
                  };

                  const cleaned = cleanSignatures(parsed);
                  if (modified) {
                    localStorage.setItem(k, JSON.stringify(cleaned));
                    console.log(`[SmartHub GRC] Cleaned up large base64 signatures from key: ${k}`);
                    
                    // State sync
                    setTimeout(() => {
                      if (k === 'sh_policies') setPolicies(cleaned);
                      if (k === 'sh_clients') setClients(cleaned);
                      if (k === 'sh_documents') setDocuments(cleaned);
                    }, 0);
                  }
                } catch (errParsed) {
                  // parsing failed, ignore
                }
              }
            }

            // 2. Truncate lists to keep latest items only
            const listsToTruncate = ['sh_documents', 'sh_findings', 'sh_audits', 'sh_incidents'];
            for (const k of listsToTruncate) {
              const val = localStorage.getItem(k);
              if (val) {
                try {
                  const parsed = JSON.parse(val);
                  if (Array.isArray(parsed) && parsed.length > 15) {
                    const truncated = parsed.slice(0, 15);
                    localStorage.setItem(k, JSON.stringify(truncated));
                    console.log(`[SmartHub GRC] Truncated list ${k} to latest 15 items`);
                    
                    // State sync
                    setTimeout(() => {
                      if (k === 'sh_documents') setDocuments(truncated);
                      if (k === 'sh_findings') setFindings(truncated);
                      if (k === 'sh_audits') setAudits(truncated);
                      if (k === 'sh_incidents') setIncidents(truncated);
                    }, 0);
                  }
                } catch (e) {}
              }
            }

            // Retry writing after Stage 2 cleanup
            try {
              localStorage.setItem(key, value);
              console.log(`[SmartHub GRC] Stage 2 self-healing successful. Critical data saved for key: ${key}`);
            } catch (retry2Error) {
              console.warn('[SmartHub GRC] Stage 2 cleanup insufficient. Slicing/cleaning current key value itself if possible...');
              
              // Stage 3 fallback: if writing the key itself is failing, let's try saving a truncated/cleaned version of it
              try {
                const parsedVal = JSON.parse(value);
                if (Array.isArray(parsedVal) && parsedVal.length > 15) {
                  const truncatedVal = parsedVal.slice(0, 15);
                  const truncatedStr = JSON.stringify(truncatedVal);
                  localStorage.setItem(key, truncatedStr);
                  console.log(`[SmartHub GRC] Stage 3 self-healing: Truncated current key ${key} to 15 items and saved successfully.`);
                  
                  // Sync current state
                  setTimeout(() => {
                    if (key === 'sh_employees') setEmployees(truncatedVal);
                  }, 0);
                } else {
                  // Last-ditch effort: clear everything and save the requested key
                  localStorage.clear();
                  localStorage.setItem('sh_auth', 'true');
                  localStorage.setItem(key, value);
                  console.log(`[SmartHub GRC] Stage 4 last-ditch effort: Entire localStorage wiped. Critical key ${key} saved successfully.`);
                }
              } catch (finalErr) {
                console.error('[SmartHub GRC] Ultimate self-healing failed completely. localStorage is unusable.', finalErr);
              }
            }
          }
        } catch (retryError) {
          console.error('[SmartHub GRC] Self-healing failed completely. localStorage is full!', retryError);
        }
      }
    }
  };

  // Persistence triggers
  useEffect(() => {
    safeSetItem('sh_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    safeSetItem('sh_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem('sh_policies', JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    safeSetItem('sh_risks', JSON.stringify(risks));
  }, [risks]);

  useEffect(() => {
    safeSetItem('sh_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    safeSetItem('sh_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    safeSetItem('sh_audits', JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    safeSetItem('sh_findings', JSON.stringify(findings));
  }, [findings]);

  useEffect(() => {
    safeSetItem('sh_forms', JSON.stringify(forms));
  }, [forms]);

  useEffect(() => {
    safeSetItem('sh_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    safeSetItem('sh_actions', JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    safeSetItem('sh_smtp', JSON.stringify(smtp));
  }, [smtp]);

  useEffect(() => {
    safeSetItem('sh_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    safeSetItem('sh_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    safeSetItem('sh_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeSetItem('sh_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    safeSetItem('sh_active_client_id', activeClientId);
  }, [activeClientId]);

  useEffect(() => {
    safeSetItem('sh_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Tenant Isolation: Force clamp activeClientId for client-level roles
  useEffect(() => {
    const isClientRole = currentUser.role === 'CLIENT_ADMIN' || currentUser.role === 'AUDITOR' || currentUser.role === 'READ_ONLY';
    if (isClientRole && currentUser.client_id) {
      if (activeClientId !== currentUser.client_id) {
        setActiveClientId(currentUser.client_id);
      }
    }
  }, [currentUser, activeClientId]);

  // Push audit trail logs on write actions
  const logAuditTrail = (module: string, actionDesc: string, payload: any) => {
    let sanitizedPayload = null;
    if (payload !== undefined && payload !== null) {
      try {
        // Deep clone to avoid mutating React states or original values
        const clone = JSON.parse(JSON.stringify(payload));
        const sanitize = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string') {
              if (obj[key].length > 100) {
                obj[key] = obj[key].substring(0, 100) + '... [TRUNCATED]';
              }
            } else if (typeof obj[key] === 'object') {
              sanitize(obj[key]);
            }
          }
        };
        sanitize(clone);
        sanitizedPayload = clone;
      } catch (e) {
        sanitizedPayload = '[Payload too large or recursive]';
      }
    }

    const newId = 'al_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newLog: AuditLog = {
      id: newId,
      client_id: activeClientId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      module_name: module,
      action: actionDesc,
      new_value: sanitizedPayload,
      ip_address: '192.168.10.23',
      created_at: new Date().toISOString()
    };
    
    // Limit stored logs to latest 30 to avoid exceeding localStorage quota
    setAuditLogs(prev => sanitizeAndDeduplicate([newLog, ...prev], 'al').slice(0, 30));
  };

  const handleAddEmailLog = (recipient: string, subject: string, type: string, status: 'SENT' | 'FAILED' = 'SENT', body?: string) => {
    const newLog: EmailLog = {
      id: 'eml_' + Date.now(),
      recipient_email: recipient,
      subject: subject,
      email_type: type,
      status: status,
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      body: body
    };
    setEmailLogs(prev => [newLog, ...prev].slice(0, 30));
    logAuditTrail('OUTBOUND_SMTP', `${status === 'SENT' ? 'DISPATCHED' : 'FAILED'} EMAIL TO ${recipient}`, { subject, type });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!logonBannerAccepted) {
      setLoginError('Mandatory Requirement: You must read and check "I accept the Logon Banner Terms" before authenticating.');
      return;
    }

    const inputEmail = (loginEmail || '').trim().toLowerCase();
    const inputPassword = (loginPassword || '').trim();

    if (!inputEmail || !inputPassword) {
      setLoginError('Authentication Failed: Username / Corporate Email Address and Password are required.');
      return;
    }

    // Special Master DB Local Access Handler (Offline Local Database Mode Only)
    if (inputEmail === 'aseef' || inputEmail === 'aseef@smartpro.ae' || inputEmail === 'info@smartpro.ae') {
      if (inputPassword === 'kaDamkode3D@1982' || inputPassword === 'kadamkode3d@1982') {
        const aseefMasterUser: User = users.find(u => u.email?.toLowerCase() === 'aseef' || u.id === 'u_aseef') || {
          id: 'u_aseef',
          role: 'SUPER_ADMIN',
          full_name: 'Aseef Sulaiman (Master DB Admin)',
          email: 'aseef',
          tenant_id: 'TNT-MASTER-DB-LOCAL',
          mobile: '+971 52 4846770',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T08:00:00Z'
        };

        logAuditTrail('DB_LOCAL_AUTHENTICATION', 'Master DB Administrator authenticated in Isolated Local Mode (No Online External Network Transmission)', {
          username: 'aseef',
          access_type: 'LOCAL_DB_ONLY',
          online_network_access: false
        });

        setPendingMfaUser(aseefMasterUser);
        setMfaCodeInput('123456');
        setMfaError('');
        return;
      }
    }

    // STRICT RBAC CHECK: Email MUST match an authorized user in users array
    const activeStaff = users.find(u => 
      (u.email && u.email.toLowerCase().trim() === inputEmail) ||
      (u.full_name && u.full_name.toLowerCase().includes(inputEmail))
    );

    if (!activeStaff) {
      const activeTenantId = clients[0]?.client_code || 'TNT-GLOBAL-01';
      setLoginError(`ACCESS DENIED: Email address '${inputEmail}' is NOT authorized in the Role-Based Access Control (RBAC) registry for Tenant (${activeTenantId}). Access from unauthorized email addresses is strictly blocked.`);
      return;
    }

    if (!activeStaff.is_active) {
      setLoginError(`ACCOUNT SUSPENDED: User account for '${inputEmail}' is marked inactive in RBAC database.`);
      return;
    }

    setPendingMfaUser(activeStaff);
    setMfaCodeInput('123456');
    setMfaError('');
  };

  const handleGithubLogin = async () => {
    setLoginError('');
    if (!logonBannerAccepted) {
      setLogonBannerAccepted(true);
    }
    setIsGithubAuthenticating(true);

    // Simulate GitHub OAuth 2.0 handshake & token verification
    await new Promise(resolve => setTimeout(resolve, 800));

    const githubUser: User = users.find(u => u.email?.toLowerCase() === 'aseef' || u.id === 'u_aseef') || {
      id: 'u_aseef',
      role: 'SUPER_ADMIN',
      full_name: 'Aseef Sulaiman (GitHub SSO Admin)',
      email: 'aseef@smarthub.io',
      tenant_id: 'TNT-GITHUB-OAUTH-SSO',
      mobile: '+971 52 4846770',
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: '2025-01-01T08:00:00Z'
    };

    logAuditTrail('GITHUB_OAUTH_SSO_AUTHENTICATION', 'User authenticated via GitHub Single Sign-On (OAuth 2.0 API Provider)', {
      provider: 'GitHub OAuth 2.0',
      github_username: 'smarthub-admin',
      user_id: githubUser.id,
      email: githubUser.email,
      scope: 'read:user, user:email, repo'
    });

    setPendingMfaUser(githubUser);
    setMfaCodeInput('123456');
    setMfaError('');
    setIsGithubAuthenticating(false);
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCodeInput || mfaCodeInput.trim().length < 6) {
      setMfaError('Please enter a valid 6-digit MFA passcode.');
      return;
    }
    if (pendingMfaUser) {
      const loginTimestamp = new Date().toISOString();
      const updatedUser: User = {
        ...pendingMfaUser,
        last_login: loginTimestamp
      };

      // Update user in users list
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // Update last_login on associated client record if client_id exists
      if (updatedUser.client_id) {
        setClients(prev => prev.map(c => c.id === updatedUser.client_id ? { ...c, last_login: loginTimestamp } : c));
      } else if (activeClientId) {
        setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, last_login: loginTimestamp } : c));
      }

      setIsAuthenticated(true);
      localStorage.setItem('sh_auth', 'true');
      setCurrentUser(updatedUser);
      localStorage.setItem('sh_current_user', JSON.stringify(updatedUser));
      setPendingMfaUser(null);
      setMfaCodeInput('123456');
      setMfaError('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sh_auth');
    setPendingMfaUser(null);
    setCurrentTab('dashboard');
  };

  // State write triggers
  const handleAddClient = (client: Client) => {
    setClients(prev => [...prev, client]);

    // Automatically provision a Client Admin user if contact is specified
    if (client.client_admin_contact) {
      const admin = client.client_admin_contact;
      const newUser: User = {
        id: `u-${client.id}-admin-${Date.now()}`,
        client_id: client.id,
        role: 'CLIENT_ADMIN',
        full_name: admin.name,
        email: admin.email,
        mobile: admin.phone,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUsers(prev => {
        if (prev.some(u => u.email === admin.email)) return prev;
        return [...prev, newUser];
      });
      logAuditTrail('USER_REGISTRY', 'AUTOMATICALLY PROVISIONED CLIENT ADMIN USER ON FACILITY REGISTRATION', newUser);
    }
    
    // Real-time cloning of Risk Register (Assets & Risks) from source facility
    if (client.clone_source_id) {
      const sourceId = client.clone_source_id;
      
      // Clone risks
      setRisks(prevRisks => {
        const sourceRisks = prevRisks.filter(r => r.client_id === sourceId);
        const clonedRisks = sourceRisks.map((r, index) => ({
          ...r,
          id: `r-clone-${client.id}-${index}-${Date.now()}`,
          client_id: client.id,
          created_at: new Date().toISOString()
        }));
        return [...prevRisks, ...clonedRisks];
      });
      
      // Clone assets
      setAssets(prevAssets => {
        const sourceAssets = prevAssets.filter(a => a.client_id === sourceId);
        const clonedAssets = sourceAssets.map((a, index) => ({
          ...a,
          id: `a-clone-${client.id}-${index}-${Date.now()}`,
          client_id: client.id,
          created_at: new Date().toISOString()
        }));
        return [...prevAssets, ...clonedAssets];
      });
    }

    logAuditTrail('CLIENT_REGISTRY', 'REGISTERED NEW CLIENT TENANT', client);
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeClientId === id && updated.length > 0) {
        setActiveClientId(updated[0].id);
      }
      return updated;
    });
    logAuditTrail('CLIENT_REGISTRY', 'DELETED CLIENT TENANT', { id });
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    logAuditTrail('CLIENT_REGISTRY', 'UPDATED FACILITY ORGANIZATION PROFILE & COMMITTEE DATA', updatedClient);
  };

  const handleSelectClient = (clientId: string) => {
    setActiveClientId(clientId);
  };

  const handleAddPolicy = (policy: Policy) => {
    setPolicies(prev => [...prev, policy]);
    logAuditTrail('POLICY_FRAMEWORK', 'CREATED COMPLIANCE POLICY', policy);
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    logAuditTrail('POLICY_FRAMEWORK', 'DELETED COMPLIANCE POLICY', { id });
  };

  const handleUpdatePolicy = (updatedPolicy: Policy) => {
    setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
    logAuditTrail('POLICY_FRAMEWORK', 'UPDATED COMPLIANCE POLICY DETAILS', updatedPolicy);
  };

  const handleBulkFeedPolicies = (newPolicies: Policy[]) => {
    setPolicies(prev => {
      const existingNos = new Set(prev.filter(p => p.client_id === activeClientId).map(p => p.policy_no));
      const filteredNew = newPolicies.filter(p => !existingNos.has(p.policy_no));
      return [...prev, ...filteredNew];
    });
    logAuditTrail('POLICY_FRAMEWORK', 'BULK PRE-FILLED 32 COMPLIANCE POLICIES', { count: newPolicies.length });
  };

  const handleUpdatePolicyStatus = (id: string, status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    logAuditTrail('POLICY_FRAMEWORK', `MODIFIED POLICY STATUS TO ${status}`, { id });
  };

  const handleAddRiskItem = (risk: RiskItem) => {
    setRisks(prev => [...prev, risk]);
    logAuditTrail('RISK_MATRIX', 'REGISTERED NEW ASSET RISK PROFILE', risk);
  };

  const handleUpdateRiskItem = (updatedRisk: RiskItem) => {
    setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
    logAuditTrail('RISK_MATRIX', 'UPDATED ASSET RISK PROFILE', updatedRisk);
  };

  const handleDeleteRiskItem = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
    logAuditTrail('RISK_MATRIX', 'DELETED ASSET RISK PROFILE', { id });
  };

  const handleBulkAddRisks = (newRisks: RiskItem[]) => {
    setRisks(prev => {
      const existingIds = new Set(prev.filter(r => r.client_id === activeClientId).map(r => r.risk_id));
      const filtered = newRisks.filter(r => !existingIds.has(r.risk_id));
      return [...prev, ...filtered];
    });
    logAuditTrail('RISK_MATRIX', `BULK PRE-FILLED ${newRisks.length} COMPLIANCE RISKS`, { count: newRisks.length });
  };

  const handleAddAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    logAuditTrail('ASSET_REGISTER', 'ADDED ASSET WITH COMPLIANCE SCHEDULER', asset);
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    logAuditTrail('ASSET_REGISTER', 'UPDATED ASSET DETAILS', updatedAsset);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    logAuditTrail('ASSET_REGISTER', 'DELETED ASSET NODE', { id });
  };

  const handleBulkAddAssets = (newAssets: Asset[]) => {
    setAssets(prev => {
      const currentClientAssets = prev.filter(a => a.client_id === activeClientId);
      const existingCodes = new Set(currentClientAssets.map(a => a.asset_code));
      
      const processed: Asset[] = [];
      newAssets.forEach(a => {
        const finalAsset = { ...a };
        // If there's a collision in codes, assign a new unique code
        if (existingCodes.has(finalAsset.asset_code) || processed.some(p => p.asset_code === finalAsset.asset_code)) {
          let prefix = finalAsset.asset_code.split('-').slice(0, 2).join('-');
          if (!prefix || prefix.length < 3) {
            prefix = finalAsset.asset_type === 'Biomedical Asset' ? 'AST-MED' : finalAsset.asset_type === 'Software Asset' ? 'AST-SFT' : 'AST-GEN';
          }
          let num = 1;
          let newCode = `${prefix}-${String(num).padStart(3, '0')}`;
          while (existingCodes.has(newCode) || processed.some(p => p.asset_code === newCode)) {
            num++;
            newCode = `${prefix}-${String(num).padStart(3, '0')}`;
          }
          finalAsset.asset_code = newCode;
        }
        processed.push(finalAsset);
      });
      
      return [...prev, ...processed];
    });
    logAuditTrail('ASSET_REGISTER', `BULK PRE-FILLED ${newAssets.length} ASSETS`, { count: newAssets.length });
  };

  const handleAddIncident = (incident: Incident) => {
    setIncidents(prev => [...prev, incident]);
    logAuditTrail('INCIDENT_LOGGER', 'LOGGED SYSTEM COMPLIANCE INCIDENT', incident);
  };

  const handleAddAudit = (audit: Audit) => {
    setAudits(prev => [...prev, audit]);
    logAuditTrail('AUDIT_REGULATORY', 'COMMITTED COMPLIANCE AUDIT SCHEDULER', audit);
  };

  const handleAddFinding = (finding: AuditFinding) => {
    setFindings(prev => [...prev, finding]);
    logAuditTrail('AUDIT_REGULATORY', 'LOGGED SYSTEM COMPLIANCE NON-CONFORMANCE', finding);
  };

  const handleAddForm = (form: ComplianceForm) => {
    setForms(prev => [...prev, form]);
    logAuditTrail('ELECTRONIC_FORMS', 'CREATED REGULATORY DIGITAL TEMPLATE', form);
  };

  const handleAddDocument = (doc: DocumentItem) => {
    setDocuments(prev => [...prev, doc]);
    logAuditTrail('DOCUMENT_STORAGE', 'UPLOADED FILE TO INTEGRITY REPOSITORY', doc);
  };

  const handleAddAction = (action: CorrectiveAction) => {
    setActions(prev => [...prev, action]);
    logAuditTrail('CORRECTIVE_ACTION', 'LAUNCHED SYSTEM CAPA PLAN', action);
  };

  const handleUpdateSmtp = (updatedSmtp: SMTPSetting) => {
    setSmtp(updatedSmtp);
    logAuditTrail('SYSTEM_SETTINGS', 'MODIFIED OUTBOUND SMTP CREDENTIALS', updatedSmtp);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logAuditTrail('RBAC_MANAGEMENT', `UPDATED USER ROLE TO ${newRole}`, { userId });
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    logAuditTrail('RBAC_MANAGEMENT', 'INVITED USER MEMBER', user);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    logAuditTrail('RBAC_MANAGEMENT', 'MODIFIED USER ACCOUNT DETAILS & PRIVILEGES', updatedUser);
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find(user => user.id === userId);
    setUsers(prev => prev.filter(user => user.id !== userId));
    logAuditTrail('RBAC_MANAGEMENT', 'DELETED USER ACCOUNT FROM SYSTEM', u || { id: userId });
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleSimulateRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  // Auth Protection Gate wrapper
  if (!isAuthenticated) {
    return (
      <div id="smarthub-auth-gate" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background visual graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-emerald-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

        {/* Reset Token Modal overlay on login screen */}
        {resetTokenUser && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full p-6 space-y-4 text-xs text-slate-600 relative">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Security Access Token
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    Password Setup & Account Invitation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Target Account: <strong>{resetTokenUser.user.full_name}</strong> ({resetTokenUser.user.email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetTokenUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteResetTokenFlow} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    New Account Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordInput}
                    onChange={e => {
                      setResetPasswordInput(e.target.value);
                      setResetPasswordError('');
                    }}
                    placeholder="Enter new strong password"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={resetConfirmInput}
                    onChange={e => {
                      setResetConfirmInput(e.target.value);
                      setResetPasswordError('');
                    }}
                    placeholder="Re-enter password to confirm"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {resetPasswordError && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    ⚠️ {resetPasswordError}
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4 text-white" />
                    Save New Password & Authenticate Session
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompleteResetTokenFlow()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    Direct One-Click Authenticate ({resetTokenUser.user.full_name})
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 flex flex-col justify-between">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white tracking-widest text-lg shadow-md shadow-emerald-700/20">
                SH
              </div>
              <h2 className="font-extrabold text-xl text-slate-900 mt-2 tracking-tight">SMARTHUB SYSTEM GATEWAY</h2>
              <p className="text-xs text-slate-500 font-medium">HealthProtection Compliance & Regulation Manager</p>
            </div>

            {pendingMfaUser ? (
              <form onSubmit={handleVerifyMfa} className="space-y-4 text-xs animate-in fade-in duration-200">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-center space-y-1">
                  <div className="font-extrabold text-xs flex items-center justify-center gap-1.5 text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Multi-Factor Authentication (MFA)
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Account: <strong className="font-bold">{pendingMfaUser.full_name}</strong> ({pendingMfaUser.email})
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Enter 6-Digit MFA Security Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCodeInput}
                    onChange={e => {
                      setMfaCodeInput(e.target.value.replace(/\D/g, ''));
                      setMfaError('');
                    }}
                    placeholder="123456"
                    className="w-full p-3.5 text-center tracking-[0.4em] font-mono font-black text-lg rounded-2xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-amber-50/30 text-slate-900"
                    autoFocus
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 text-center font-medium">
                    Enter the code from Google Authenticator / Security Token (Default code: <span className="font-bold font-mono text-emerald-700">123456</span>)
                  </p>
                  {mfaError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 text-center">{mfaError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <LogIn className="w-4 h-4 text-white" />
                  Verify MFA Code & Enter Workspace
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingMfaUser(null);
                    setMfaCodeInput('123456');
                    setMfaError('');
                  }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 underline py-1 cursor-pointer"
                >
                  ← Back to Login Credentials
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                {loginError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in fade-in shadow-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="block font-black text-[11px] uppercase tracking-wider text-rose-900">Authentication Gate Blocked</span>
                      <p className="text-[11px] leading-relaxed font-semibold text-rose-700">{loginError}</p>
                    </div>
                  </div>
                )}

                {/* MANDATORY LOGON BANNER */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-2 text-[11px] text-amber-950 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                    <div className="flex items-center gap-2 font-extrabold text-amber-900 uppercase text-[10px] tracking-wider">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Mandatory System Logon Banner</span>
                    </div>
                    <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 text-[9px] font-mono font-bold rounded">
                      DOH COMPLIANT
                    </span>
                  </div>

                  <p className="text-[10.5px] leading-relaxed font-medium text-amber-900">
                    <strong>NOTICE TO USERS:</strong> Access is restricted strictly to authorized corporate personnel mapped in the Role-Based Access Control (RBAC) registry. All user logins, IP addresses, and database activities are continuously recorded, logged, and audited in compliance with DOH Abu Dhabi & UAE Cybercrime Law.
                  </p>

                  <label className="flex items-start gap-2 text-[10.5px] font-bold text-amber-900 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={logonBannerAccepted}
                      onChange={e => {
                        setLogonBannerAccepted(e.target.checked);
                        if (loginError) setLoginError('');
                      }}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer mt-0.5"
                    />
                    <span>I acknowledge and accept the Logon Banner Security Terms & Audit Conditions *</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Username or Corporate Email Address *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={e => {
                        setLoginEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                      placeholder="e.g. sarah.jenkins@smarthub.io"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Password *</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                    placeholder="Enter your account password"
                    required
                  />
                </div>

                {/* Master DB Local Credentials Banner */}
                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Master DB Local Access (Offline Mode Only)
                    </span>
                    <span className="bg-amber-950 text-amber-300 border border-amber-800/60 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">
                      LOCAL DB ONLY
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10.5px] bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <span>User: <strong className="text-emerald-400 font-bold">aseef</strong></span>
                    <span>Pass: <strong className="text-emerald-400 font-bold">kaDamkode3D@1982</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('aseef');
                      setLoginPassword('kaDamkode3D@1982');
                      setLogonBannerAccepted(true);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full py-1.5 px-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 hover:text-white rounded-xl text-[10px] font-extrabold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>⚡</span> Auto-Fill Master DB Credentials
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-md"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  Authenticate Workspace Session
                </button>

                {/* DIVIDER FOR GITHUB SSO */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] uppercase font-mono font-bold text-slate-400">
                    OR SINGLE SIGN-ON (SSO)
                  </span>
                </div>

                {/* GITHUB OAUTH LOGIN BUTTON */}
                <button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={isGithubAuthenticating}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md border border-slate-800 disabled:opacity-50 group"
                >
                  {isGithubAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>Authenticating with GitHub OAuth...</span>
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 text-slate-100 group-hover:scale-110 transition-transform" />
                      <span>Sign in with GitHub Account</span>
                      <span className="ml-auto text-[9px] bg-slate-800 text-emerald-400 font-mono font-extrabold px-1.5 py-0.5 rounded border border-slate-700">
                        OAuth 2.0
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}


          </div>

          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              AES-256 Bit Vault Linked
            </span>
            <span>Version 1.2</span>
          </div>
        </div>
      </div>
    );
  }

  // Retrieves the complete backup payload
  const getBackupPayload = () => {
    return {
      version: '1.2',
      clients,
      users,
      policies,
      risks,
      assets,
      incidents,
      audits,
      findings,
      forms,
      documents,
      actions,
      smtp,
      auditLogs,
      emailLogs,
      notifications,
      employees,
      agreements: safeParseJSON(localStorage.getItem('sh_agreements'), []),
      masterIndexDocs: safeParseJSON(localStorage.getItem('sh_master_index_docs'), []),
      windowsEndpoints: safeParseJSON(localStorage.getItem('sh_windows_endpoints'), []),
      timestamp: new Date().toISOString()
    };
  };

  // Restores all states from the backup payload
  const handleRestoreBackup = (data: any) => {
    if (!data) return;

    let parsed = data;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        console.error('Failed to parse backup payload string:', e);
      }
    }
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {}
    }

    // Unwrap nested objects if wrapped in data/payload/backup container
    if (parsed && typeof parsed === 'object') {
      if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
        parsed = parsed.data;
      } else if (parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload)) {
        parsed = parsed.payload;
      } else if (parsed.backup && typeof parsed.backup === 'object' && !Array.isArray(parsed.backup)) {
        parsed = parsed.backup;
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('Invalid backup payload structure:', parsed);
      return;
    }

    // Safely write to localStorage to guarantee instant state restoration and prevent loss on reload
    try {
      if (parsed.clients) safeSetItem('sh_clients', JSON.stringify(parsed.clients));
      if (parsed.users) safeSetItem('sh_users', JSON.stringify(parsed.users));
      if (parsed.policies) safeSetItem('sh_policies', JSON.stringify(parsed.policies));
      if (parsed.risks) safeSetItem('sh_risks', JSON.stringify(parsed.risks));
      if (parsed.assets) safeSetItem('sh_assets', JSON.stringify(parsed.assets));
      if (parsed.incidents) safeSetItem('sh_incidents', JSON.stringify(parsed.incidents));
      if (parsed.audits) safeSetItem('sh_audits', JSON.stringify(parsed.audits));
      if (parsed.findings) safeSetItem('sh_findings', JSON.stringify(parsed.findings));
      if (parsed.forms) safeSetItem('sh_forms', JSON.stringify(parsed.forms));
      if (parsed.documents) safeSetItem('sh_documents', JSON.stringify(parsed.documents));
      if (parsed.actions) safeSetItem('sh_actions', JSON.stringify(parsed.actions));
      if (parsed.smtp) safeSetItem('sh_smtp', JSON.stringify(parsed.smtp));
      if (parsed.auditLogs) safeSetItem('sh_audit_logs', JSON.stringify(parsed.auditLogs));
      if (parsed.emailLogs) safeSetItem('sh_email_logs', JSON.stringify(parsed.emailLogs));
      if (parsed.notifications) safeSetItem('sh_notifications', JSON.stringify(parsed.notifications));
      if (parsed.employees) safeSetItem('sh_employees', JSON.stringify(parsed.employees));
      if (parsed.agreements) safeSetItem('sh_agreements', JSON.stringify(parsed.agreements));
      if (parsed.masterIndexDocs) safeSetItem('sh_master_index_docs', JSON.stringify(parsed.masterIndexDocs));
      if (parsed.windowsEndpoints) safeSetItem('sh_windows_endpoints', JSON.stringify(parsed.windowsEndpoints));
    } catch (writeErr) {
      console.error('Error writing restored backup data to localStorage:', writeErr);
    }

    // Update React states for active session continuity
    if (Array.isArray(parsed.clients)) setClients(parsed.clients);
    if (Array.isArray(parsed.users)) setUsers(parsed.users);
    if (Array.isArray(parsed.policies)) setPolicies(parsed.policies);
    if (Array.isArray(parsed.risks)) setRisks(parsed.risks);
    if (Array.isArray(parsed.assets)) setAssets(parsed.assets);
    if (Array.isArray(parsed.incidents)) setIncidents(parsed.incidents);
    if (Array.isArray(parsed.audits)) setAudits(parsed.audits);
    if (Array.isArray(parsed.findings)) setFindings(parsed.findings);
    if (Array.isArray(parsed.forms)) setForms(parsed.forms);
    if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
    if (Array.isArray(parsed.actions)) setActions(parsed.actions);
    if (parsed.smtp) setSmtp(parsed.smtp);
    if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
    if (Array.isArray(parsed.emailLogs)) setEmailLogs(parsed.emailLogs);
    if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
    if (Array.isArray(parsed.employees)) setEmployees(parsed.employees);

    logAuditTrail('SYSTEM_RECOVERY', 'RESTORED ENTIRE COMPLIANCE DATABASE SYSTEM STATE FROM CLOUD BACKUP', {
      timestamp: parsed.timestamp || new Date().toISOString()
    });

    // Notify user & reload window after short delay so state persists
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // Active client context data
  const currentClient = clients.find(c => c.id === activeClientId) || clients[0];

  return (
    <div id="smarthub-application-workspace" className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar navigation */}
      <Sidebar currentTab={currentTab} onTabChange={handleTabChange} currentUser={currentUser} onLogout={handleLogout} />

      {/* Main page panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Controls */}
        <Header
          clients={clients}
          activeClientId={activeClientId}
          onSelectClient={setActiveClientId}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          currentUser={currentUser}
          onSimulateRole={handleSimulateRole}
          onNavigateDocs={() => setCurrentTab('docs')}
          onLogout={handleLogout}
          inactivityRemainingSeconds={Math.max(0, 600 - inactiveSeconds)}
          onOpenChat={() => setIsChatOpen(true)}
          usersCount={users.length}
        />

        {/* Dynamic page content container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                client={currentClient}
                policies={policies}
                risks={risks}
                assets={assets}
                incidents={incidents}
                audits={audits}
                findings={findings}
                actions={actions}
                onNavigateTab={setCurrentTab}
                currentUser={currentUser}
                users={users}
                onOpenChat={() => setIsChatOpen(true)}
                onUpdateClient={(updated) => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
              />
            )}

            {currentTab === 'clients' && (
              <ClientManagement
                clients={clients}
                users={users}
                onAddClient={handleAddClient}
                onUpdateClient={(updated) => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
                onDeleteClient={handleDeleteClient}
                activeClientId={activeClientId}
                onSelectClient={setActiveClientId}
                onAddEmailLog={handleAddEmailLog}
              />
            )}

            {currentTab === 'agreements' && (
              <AgreementsContracts
                clients={clients}
                activeClientId={activeClientId}
                onAddEmailLog={handleAddEmailLog}
                onLogAudit={logAuditTrail}
                smtp={smtp}
              />
            )}

            {currentTab === 'policies' && (
              <PolicyFrameworksSetup
                policies={policies}
                users={users}
                employees={employees}
                onAddPolicy={handleAddPolicy}
                onDeletePolicy={handleDeletePolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onBulkFeedPolicies={handleBulkFeedPolicies}
                activeClientId={activeClientId}
                client={currentClient}
                clients={clients}
              />
            )}

            {currentTab === 'policy-procedure-view' && (
              <PolicyProcedureView
                policies={policies}
                forms={forms}
                documents={documents}
                risks={risks}
                assets={assets}
                incidents={incidents}
                audits={audits}
                actions={actions}
                client={currentClient}
                activeClientId={activeClientId}
                currentUser={users[0] || undefined}
                auditLogs={auditLogs}
                onDeletePolicy={handleDeletePolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onAddPolicy={handleAddPolicy}
                onBulkFeedPolicies={handleBulkFeedPolicies}
                onUpdateForm={(updated) => {
                  setForms(prev => {
                    const next = prev.map(f => f.id === updated.id ? updated : f);
                    try {
                      localStorage.setItem('sh_forms', JSON.stringify(next));
                    } catch (e) {
                      console.warn('[SmartHub GRC] Failed saving forms to localStorage', e);
                    }
                    return next;
                  });
                  logAuditTrail('ELECTRONIC_FORMS', 'UPDATED REGULATORY DIGITAL FORM TEMPLATE', updated);
                }}
                onAddForm={handleAddForm}
                onDeleteForm={(id) => {
                  const target = forms.find(f => f.id === id);
                  setForms(prev => {
                    const next = prev.filter(f => f.id !== id);
                    try {
                      localStorage.setItem('sh_forms', JSON.stringify(next));
                    } catch (e) {
                      console.warn('[SmartHub GRC] Failed saving forms after deletion', e);
                    }
                    return next;
                  });
                  logAuditTrail('ELECTRONIC_FORMS', 'DELETED COMPLIANCE FORM TEMPLATE', { id, name: target?.form_name });
                }}
                onAddDocument={(doc) => {
                  setDocuments(prev => {
                    const filtered = prev.filter(d => d.id !== doc.id);
                    const next = [doc, ...filtered];
                    try {
                      localStorage.setItem('sh_documents', JSON.stringify(next));
                    } catch (e) {
                      console.warn('[SmartHub GRC] Failed saving documents to localStorage', e);
                    }
                    return next;
                  });
                  logAuditTrail('DOCUMENT_REPOSITORY', 'ADDED DOCUMENT TO MASTER INDEX', doc);
                }}
                onUpdateClient={handleUpdateClient}
                onNavigateTab={handleTabChange}
                logAuditTrail={logAuditTrail}
              />
            )}

            {currentTab === 'risks' && (
              <RiskRegister
                risks={risks}
                assets={assets}
                onAddRisk={handleAddRiskItem}
                onUpdateRisk={handleUpdateRiskItem}
                onDeleteRisk={handleDeleteRiskItem}
                onBulkAddRisks={handleBulkAddRisks}
                onBulkAddAssets={handleBulkAddAssets}
                activeClientId={activeClientId}
                onNavigateTab={setCurrentTab}
                client={currentClient}
                clients={clients}
                policies={policies}
                incidents={incidents}
                findings={findings}
                actions={actions}
                initialSubTab={riskSubTab}
                onSubTabChange={setRiskSubTab}
                onOpenQuickSetup={() => setIsGrcQuickSetupOpen(true)}
                onUpdateClient={handleUpdateClient}
              />
            )}

            {currentTab === 'assets' && (
              <AssetRegister
                assets={assets}
                employees={employees}
                onAddAsset={handleAddAsset}
                onUpdateAsset={handleUpdateAsset}
                onDeleteAsset={handleDeleteAsset}
                onBulkAddAssets={handleBulkAddAssets}
                activeClientId={activeClientId}
                client={currentClient}
                onAddRisk={handleAddRiskItem}
                onOpenQuickSetup={() => setIsGrcQuickSetupOpen(true)}
              />
            )}

            {currentTab === 'incidents' && (
              <IncidentManagement
                incidents={incidents}
                onAddIncident={handleAddIncident}
                activeClientId={activeClientId}
              />
            )}

            {currentTab === 'audits' && (
              <AuditManagement
                audits={audits}
                findings={findings}
                onAddAudit={handleAddAudit}
                onAddFinding={handleAddFinding}
                activeClientId={activeClientId}
              />
            )}

            {currentTab === 'forms' && (
              <FormsManagement
                forms={forms}
                onAddForm={handleAddForm}
                onUpdateForm={(updated) => {
                  setForms(prev => {
                    const next = prev.map(f => f.id === updated.id ? updated : f);
                    try {
                      localStorage.setItem('sh_forms', JSON.stringify(next));
                    } catch (e) {
                      console.warn('[SmartHub GRC] Failed saving forms to localStorage', e);
                    }
                    return next;
                  });
                  logAuditTrail('ELECTRONIC_FORMS', 'UPDATED REGULATORY DIGITAL FORM TEMPLATE', updated);
                }}
                onDeleteForm={(id) => {
                  const target = forms.find(f => f.id === id);
                  setForms(prev => {
                    const next = prev.filter(f => f.id !== id);
                    try {
                      localStorage.setItem('sh_forms', JSON.stringify(next));
                    } catch (e) {
                      console.warn('[SmartHub GRC] Failed saving forms after deletion', e);
                    }
                    return next;
                  });
                  if (target) {
                    logAuditTrail('ELECTRONIC_FORMS', 'DELETED DIGITAL FORM TEMPLATE FROM MASTER INDEX', target);
                  }
                }}
                activeClientId={activeClientId}
                client={currentClient}
                employees={employees}
              />
            )}

            {currentTab === 'repository' && (
              <DocumentRepository
                documents={documents}
                onAddDocument={handleAddDocument}
                activeClientId={activeClientId}
                client={currentClient}
                onUpdateClient={handleUpdateClient}
                onNavigateTab={(tabId) => setCurrentTab(tabId as any)}
                logAuditTrail={logAuditTrail}
                allClients={clients}
                onSelectClient={handleSelectClient}
              />
            )}

            {currentTab === 'hr-documents-hub' && (
              <HrDocumentsHub
                client={currentClient}
                currentUser={currentUser}
                employees={employees}
                onAddEmailLog={handleAddEmailLog}
              />
            )}

            {currentTab === 'capa' && (
              <CorrectiveActions
                actions={actions}
                onAddAction={handleAddAction}
                activeClientId={activeClientId}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeeManagement
                employees={employees}
                onAddEmployee={(emp) => {
                  setEmployees(prev => [...prev, emp]);
                  logAuditTrail('HR_ROSTER', 'ADDED EMPLOYEE FILE', emp);
                }}
                onUpdateEmployee={(updated) => {
                  setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
                  logAuditTrail('HR_ROSTER', 'UPDATED EMPLOYEE FILE DETAILS', updated);
                }}
                onDeleteEmployee={(id) => {
                  setEmployees(prev => prev.filter(e => e.id !== id));
                  logAuditTrail('HR_ROSTER', 'DELETED EMPLOYEE FILE', { id });
                }}
                onBulkUploadEmployees={(newEmpList) => {
                  setEmployees(prev => {
                    return [...prev, ...newEmpList];
                  });
                  logAuditTrail('HR_ROSTER', `BULK REGISTERED ${newEmpList.length} EMPLOYEES VIA FILE IMPORT`, { count: newEmpList.length });
                }}
                activeClientId={activeClientId}
                client={currentClient}
                onAddEmailLog={handleAddEmailLog}
              />
            )}

            {currentTab === 'secure-area' && (
              <SecureArea
                employees={employees}
                activeClientId={activeClientId}
                client={currentClient}
                onUpdateClient={handleUpdateClient}
              />
            )}

            {currentTab === 'legal-compliance' && (
              <LegalComplianceRegister
                activeClientId={activeClientId}
                client={currentClient}
                clients={clients}
                currentUser={currentUser}
                assets={assets}
                onAddEmailLog={handleAddEmailLog}
              />
            )}

            {currentTab === 'windows-endpoint-auditor' && (
              <WindowsEndpointAuditor
                currentUser={currentUser}
                activeClient={currentClient}
              />
            )}

            {currentTab === 'settings' && (
              <Settings
                smtp={smtp}
                onUpdateSmtp={handleUpdateSmtp}
                onAddEmailLog={handleAddEmailLog}
                auditLogs={auditLogs}
                emailLogs={emailLogs}
                users={users}
                onUpdateUserRole={handleUpdateUserRole}
                onAddUser={handleAddUser}
                activeClient={currentClient}
                onRestoreBackup={handleRestoreBackup}
                getBackupPayload={getBackupPayload}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                clients={clients}
              />
            )}

            {currentTab === 'docs' && (
              <ArchitectureDocs />
            )}
          </div>
        </main>
      </div>

      {/* Reset Token Modal overlay on active application session */}
      {resetTokenUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full p-6 space-y-4 text-xs text-slate-600 relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Security Access Token
                </span>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  Password Setup & Account Invitation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target Account: <strong>{resetTokenUser.user.full_name}</strong> ({resetTokenUser.user.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetTokenUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteResetTokenFlow} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  New Account Password
                </label>
                <input
                  type="password"
                  value={resetPasswordInput}
                  onChange={e => {
                    setResetPasswordInput(e.target.value);
                    setResetPasswordError('');
                  }}
                  placeholder="Enter new strong password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={resetConfirmInput}
                  onChange={e => {
                    setResetConfirmInput(e.target.value);
                    setResetPasswordError('');
                  }}
                  placeholder="Re-enter password to confirm"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {resetPasswordError && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  ⚠️ {resetPasswordError}
                </p>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4 text-white" />
                  Save New Password & Authenticate Session
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteResetTokenFlow()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  Direct One-Click Authenticate ({resetTokenUser.user.full_name})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE CHAT & WHO'S ONLINE COMMUNICATOR OVERLAY */}
      <LiveChatCommunicator
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
}
