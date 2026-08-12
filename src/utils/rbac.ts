import { UserRole } from '../types';

export const ALL_TABS = [
  'dashboard',
  'clients',
  'agreements',
  'central-print-hub',
  'employees',
  'secure-area',
  'legal-compliance',
  'policies',
  'policy-procedure-view',
  'risks',
  'assets',
  'incidents',
  'audits',
  'forms',
  'repository',
  'hr-documents-hub',
  'capa',
  'reports',
  'windows-endpoint-auditor',
  'settings',
  'docs'
];

export const TAB_LABELS: Record<string, string> = {
  dashboard: 'Risk Dashboard',
  clients: 'Client Management',
  agreements: 'Agreements & Contracts',
  'central-print-hub': 'Option Print Box (Central Print Hub)',
  employees: 'Employee HR Roster',
  'secure-area': 'Designated Secure Areas',
  'legal-compliance': 'Legal & Compliance Register',
  policies: 'Policy Frameworks setup',
  'policy-procedure-view': 'Policy and Procedure',
  risks: 'Risk Register',
  assets: 'Asset Invesntory',
  incidents: 'Breach Incidents',
  audits: 'Audit Findings (NCR)',
  forms: 'Compliance Forms',
  repository: 'Quick Master Setup',
  'hr-documents-hub': 'HR Documents Hub',
  capa: 'Corrective Actions (CAPA)',
  reports: 'Risk Report View',
  'windows-endpoint-auditor': 'Windows Endpoint Auditor',
  settings: 'System Admin Settings',
  docs: 'Specs & Architecture Docs'
};

export function getDefaultTabsForRole(role: UserRole): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [...ALL_TABS];
    case 'CONSULTANT':
      return [
        'dashboard',
        'agreements',
        'central-print-hub',
        'employees',
        'secure-area',
        'legal-compliance',
        'policies',
        'policy-procedure-view',
        'risks',
        'assets',
        'incidents',
        'audits',
        'forms',
        'repository',
        'capa',
        'reports',
        'windows-endpoint-auditor',
        'settings',
        'docs'
      ];
    case 'CLIENT_ADMIN':
      return [
        'dashboard',
        'agreements',
        'central-print-hub',
        'employees',
        'secure-area',
        'legal-compliance',
        'policies',
        'policy-procedure-view',
        'risks',
        'assets',
        'incidents',
        'audits',
        'forms',
        'repository',
        'capa',
        'reports',
        'windows-endpoint-auditor'
      ];
    case 'AUDITOR':
      return [
        'dashboard',
        'agreements',
        'central-print-hub',
        'secure-area',
        'legal-compliance',
        'policy-procedure-view',
        'risks',
        'assets',
        'audits',
        'repository',
        'capa',
        'reports',
        'windows-endpoint-auditor'
      ];
    case 'READ_ONLY':
    default:
      return [
        'dashboard',
        'agreements',
        'central-print-hub',
        'secure-area',
        'legal-compliance',
        'policy-procedure-view',
        'risks',
        'assets',
        'repository',
        'reports',
        'windows-endpoint-auditor'
      ];
  }
}

export function getDefaultAccessLevelForRole(role: UserRole): 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY' {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'CONSULTANT':
    case 'CLIENT_ADMIN':
      return 'EDIT';
    case 'AUDITOR':
      return 'PRINT_ONLY';
    case 'READ_ONLY':
    default:
      return 'VIEW_ONLY';
  }
}

export function getDefaultPermissionsForRole(role: UserRole) {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'CONSULTANT':
    case 'CLIENT_ADMIN':
      return { can_edit: true, can_view: true, can_print: true };
    case 'AUDITOR':
      return { can_edit: false, can_view: true, can_print: true };
    case 'READ_ONLY':
    default:
      return { can_edit: false, can_view: true, can_print: false };
  }
}

export function getDefaultModuleAccessForRole(role: UserRole): Record<string, 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY' | 'NO_ACCESS'> {
  const defaultTabs = getDefaultTabsForRole(role);
  const defaultLevel = getDefaultAccessLevelForRole(role);
  const result: Record<string, 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY' | 'NO_ACCESS'> = {};

  ALL_TABS.forEach(tabId => {
    if (defaultTabs.includes(tabId)) {
      result[tabId] = defaultLevel;
    } else {
      result[tabId] = 'NO_ACCESS';
    }
  });
  return result;
}

export function getModuleAccessLevel(user: { role: UserRole; allowed_tabs?: string[]; access_level?: string; module_access?: Record<string, any> } | null | undefined, tabId: string): 'EDIT' | 'VIEW_ONLY' | 'PRINT_ONLY' | 'NO_ACCESS' {
  if (!user) return 'NO_ACCESS';
  
  if (user.module_access && user.module_access[tabId]) {
    return user.module_access[tabId];
  }

  const allowed = user.allowed_tabs || getDefaultTabsForRole(user.role);
  if (!allowed.includes(tabId)) return 'NO_ACCESS';

  return (user.access_level as any) || getDefaultAccessLevelForRole(user.role);
}
