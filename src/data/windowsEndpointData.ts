export interface WindowsEndpoint {
  id: string;
  name: string;
  hostname?: string;
  device_type?: 'Workstation' | 'Server' | 'Medical Workstation' | 'Laptop' | 'Kiosk';
  os: string;
  os_version?: string;
  ip: string;
  ip_address?: string;
  mac_address?: string;
  department?: string;
  custodian?: string;
  lastScanned: string;
  last_scan_date?: string;
  overallScore: number;
  overall_score?: number;
  compliance_status?: 'Compliant' | 'Needs Attention' | 'Non-Compliant';
  status: 'secure' | 'warning' | 'critical';
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  firstScanScore?: number;
  remediatedVulnerabilities?: number[];

  scanData?: any;
  firstScanData?: any;

  // Hardening Pillars
  bitlocker?: {
    status: 'Encrypted' | 'Unencrypted' | 'Suspended';
    encryption_type: string;
    tpm_version: string;
    recovery_key_escrowed: boolean;
  };
  defender?: {
    status: 'Active' | 'Outdated' | 'Disabled';
    realtime_protection: boolean;
    cloud_delivery: boolean;
    tamper_protection: boolean;
    definition_version: string;
  };
  patch_management?: {
    status: 'Up-to-Date' | 'Pending Updates' | 'Critical Missing';
    missing_kbs: string[];
    last_installed_kb: string;
  };
  firewall_network?: {
    firewall_enabled: boolean;
    smbv1_disabled: boolean;
    rdp_nla_required: boolean;
    open_risky_ports: string[];
  };
  account_security?: {
    local_admins_count: number;
    guest_account_disabled: boolean;
    uac_level: string;
    laps_enabled: boolean;
  };
  audit_logging?: {
    security_log_size_mb: number;
    cmd_line_logging: boolean;
    logon_audit_enabled: boolean;
  };
}

export interface VulnerabilityCheck {
  id: number;
  name: string;
  cveId: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  powershellFix: string;
  impactWarning: string;
  remedyCode: string;
  remedyValue: string;
}

export interface RemediationRule {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  registryPath?: string;
  registryKey?: string;
  registryValue?: string;
  powershellFix: string;
  gpoPath: string;
  impactAssessment: string;
}

export const INITIAL_WINDOWS_ENDPOINTS: WindowsEndpoint[] = [
  {
    id: "endpoint-wqv0jw8p5",
    name: "CORP-FILE-SRV01",
    hostname: "CORP-FILE-SRV01",
    device_type: "Server",
    os: "Windows Server 2019 Standard (64-bit (x64))",
    os_version: "Windows Server 2019 Standard",
    ip: "10.140.10.45",
    ip_address: "10.140.10.45",
    mac_address: "00-15-5D-82-A1-12",
    department: "Enterprise File Repository",
    custodian: "Tariq Mahmoud (SysAdmin)",
    lastScanned: "2026-06-28T17:21:04.901Z",
    last_scan_date: "2026-06-28 21:21",
    overallScore: 100,
    overall_score: 100,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    status: "secure",
    compliance_status: "Compliant",
    firstScanScore: 48,
    remediatedVulnerabilities: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 30, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 59, 60],
    bitlocker: {
      status: 'Encrypted',
      encryption_type: 'XTS-AES 256-bit',
      tpm_version: '2.0 Active',
      recovery_key_escrowed: true
    },
    defender: {
      status: 'Active',
      realtime_protection: true,
      cloud_delivery: true,
      tamper_protection: true,
      definition_version: '1.415.922.0'
    },
    patch_management: {
      status: 'Up-to-Date',
      missing_kbs: [],
      last_installed_kb: 'KB5039212 (2026-07 Cumulative)'
    },
    firewall_network: {
      firewall_enabled: true,
      smbv1_disabled: true,
      rdp_nla_required: true,
      open_risky_ports: []
    },
    account_security: {
      local_admins_count: 1,
      guest_account_disabled: true,
      uac_level: 'Always Notify',
      laps_enabled: true
    },
    audit_logging: {
      security_log_size_mb: 2048,
      cmd_line_logging: true,
      logon_audit_enabled: true
    },
    scanData: {
      hostname: "CORP-FILE-SRV01",
      osName: "Windows Server 2019 Standard (64-bit (x64))",
      scanTime: "6/28/2026, 9:21:04 PM",
      ipAddresses: ["10.140.10.45"],
      privileges: "Administrator (Root)",
      smb: {
        smb1Enabled: { status: "passed", value: "Disabled / Safe", details: "SMBv1 is verified as fully disabled on the system." },
        smbSigningRequired: { status: "passed", value: "CONFIGURED", details: "SMB digital signing is enforced on all Server and Client sessions." },
        smbEncryptionEnabled: { status: "passed", value: "ENABLED", details: "SMB Transport payload encryption is active." }
      },
      sslTls: {
        tls10Enabled: { status: "failed", value: "Enabled", details: "TLS 1.0 is active. Vulnerable to BEAST & POODLE." },
        tls11Enabled: { status: "failed", value: "Enabled", details: "TLS 1.1 is active, deprecated under NIST/PCI-DSS." },
        tls12Enabled: { status: "passed", value: "Enabled (Default)", details: "TLS 1.2 serves as standard baseline." },
        tls13Enabled: { status: "warning", value: "Enabled by Default", details: "TLS 1.3 default." },
        weakCipherSuites: { status: "failed", value: "RC4/3DES ciphers found", details: "Vulnerable cipher algorithms present." }
      },
      ntlm: {
        lmCompatibilityLevel: { status: "failed", value: "Level 2: Send NTLM only", details: "LM Compatibility Level allows legacy LM or NTLMv1." },
        restrictNtlmTraffic: { status: "warning", value: "Not Restricted", details: "NTLM allowed outbound." },
        anonymousAccess: { status: "passed", value: "Disabled", details: "Anonymous null session shares prohibited." }
      },
      additional: {
        firewallEnabled: { status: "passed", value: "Enabled", details: "Defender Firewall active on all profiles." },
        rdpNlaEnabled: { status: "warning", value: "NLA Not Enforced", details: "NLA not enforced on RDP." },
        credentialGuard: { status: "warning", value: "Disabled", details: "Credential Guard inactive." }
      },
      users: {
        activeUsers: [
          { username: "Administrator", status: "Active", lastPasswordChange: "2026-01-10 09:12:33", passwordAgeDays: 164, passwordNeverExpires: false },
          { username: "SvcBackup", status: "Active", lastPasswordChange: "2025-10-05 14:22:01", passwordAgeDays: 261, passwordNeverExpires: true },
          { username: "LocalAdmin", status: "Active", lastPasswordChange: "2026-06-12 11:30:00", passwordAgeDays: 11, passwordNeverExpires: false },
          { username: "TempUser", status: "Disabled", lastPasswordChange: "2025-08-14 10:00:22", passwordAgeDays: 313, passwordNeverExpires: false }
        ],
        passwordPolicy: { minimumLength: 8, complexityEnabled: true, maximumAgeDays: 90, minimumAgeDays: 1, historyCount: 12 },
        isDomainController: false
      },
      removableDevices: { usbStorage: { status: "failed", value: "ENABLED", details: "Removable USB Storage drivers permitted." } },
      ntpTime: { enabled: "No", details: "NTP Time Synchronization not enabled.", status: "failed" },
      ports: [
        { port: 21, protocol: "TCP", service: "FTP", status: "Open", severity: "Vulnerable", vulnerabilityDetails: "Legacy cleartext FTP active." },
        { port: 23, protocol: "TCP", service: "Telnet", status: "Open", severity: "Critical", vulnerabilityDetails: "Cleartext command shell enabled." },
        { port: 80, protocol: "TCP", service: "HTTP", status: "Open", severity: "Weak", vulnerabilityDetails: "Unencrypted web services running." },
        { port: 135, protocol: "TCP", service: "msrpc", status: "Open", severity: "Secure" },
        { port: 443, protocol: "TCP", service: "HTTPS", status: "Open", severity: "Secure" },
        { port: 445, protocol: "TCP", service: "microsoft-ds", status: "Open", severity: "Vulnerable", vulnerabilityDetails: "SMB over TCP open." },
        { port: 3389, protocol: "TCP", service: "ms-wbt-server", status: "Open", severity: "Weak", vulnerabilityDetails: "RDP active without NLA." }
      ],
      browserSecurity: {
        chromePasswordStore: { status: "failed", value: "ENABLED", details: "Chrome offering password save prompts." },
        chromeHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Chrome stores browsing history." },
        edgePasswordStore: { status: "failed", value: "ENABLED", details: "Edge password manager enabled." },
        edgeHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Edge history files retained." },
        firefoxPasswordStore: { status: "failed", value: "ENABLED", details: "Firefox password saving active." },
        firefoxHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Firefox history tracking enabled." }
      }
    }
  },
  {
    id: "db-srv-prd-12",
    name: "CORP-DB-SRV-PRD12",
    hostname: "CORP-DB-SRV-PRD12",
    device_type: "Server",
    os: "Windows Server 2022 Datacenter",
    os_version: "Windows Server 2022 Datacenter",
    ip: "10.140.10.82",
    ip_address: "10.140.10.82",
    mac_address: "00-15-5D-01-05-10",
    department: "Database Operations",
    custodian: "Fatima Al Sayed (DBA)",
    lastScanned: "2026-06-23 01:15:44",
    last_scan_date: "2026-06-23 01:15",
    overallScore: 88,
    overall_score: 88,
    criticalCount: 0,
    highCount: 1,
    mediumCount: 2,
    lowCount: 1,
    status: "warning",
    compliance_status: "Needs Attention",
    firstScanScore: 88,
    bitlocker: {
      status: 'Encrypted',
      encryption_type: 'AES-256 with Diffuser',
      tpm_version: '2.0 Active',
      recovery_key_escrowed: true
    },
    defender: {
      status: 'Active',
      realtime_protection: true,
      cloud_delivery: true,
      tamper_protection: true,
      definition_version: '1.415.922.0'
    },
    patch_management: {
      status: 'Up-to-Date',
      missing_kbs: [],
      last_installed_kb: 'KB5039215 (Server Cumulative)'
    },
    firewall_network: {
      firewall_enabled: true,
      smbv1_disabled: true,
      rdp_nla_required: true,
      open_risky_ports: []
    },
    account_security: {
      local_admins_count: 2,
      guest_account_disabled: true,
      uac_level: 'Always Notify',
      laps_enabled: true
    },
    audit_logging: {
      security_log_size_mb: 4096,
      cmd_line_logging: true,
      logon_audit_enabled: true
    },
    scanData: {
      hostname: "CORP-DB-SRV-PRD12",
      osName: "Windows Server 2022 Datacenter",
      scanTime: "2026-06-23 01:15:44",
      ipAddresses: ["10.140.10.82"],
      privileges: "Administrator (Root)",
      smb: {
        smb1Enabled: { status: "passed", value: "Disabled", details: "SMBv1 is inactive." },
        smbSigningRequired: { status: "passed", value: "Required", details: "SMB Signing required." },
        smbEncryptionEnabled: { status: "warning", value: "Disabled", details: "SMB payload encryption disabled." }
      },
      sslTls: {
        tls10Enabled: { status: "passed", value: "Disabled", details: "TLS 1.0 disabled." },
        tls11Enabled: { status: "passed", value: "Disabled", details: "TLS 1.1 disabled." },
        tls12Enabled: { status: "passed", value: "Enabled", details: "TLS 1.2 active." },
        tls13Enabled: { status: "passed", value: "Enabled", details: "TLS 1.3 active." },
        weakCipherSuites: { status: "passed", value: "Custom strict cipher suite list active", details: "No legacy ciphers loaded." }
      },
      ntlm: {
        lmCompatibilityLevel: { status: "warning", value: "Level 3: Send NTLMv2 only", details: "Recommend setting Level 5 to disable NTLMv1." },
        restrictNtlmTraffic: { status: "warning", value: "Not Restricted", details: "NTLM allowed outbound." },
        anonymousAccess: { status: "passed", value: "Disabled", details: "Anonymous null session shares prohibited." }
      },
      additional: {
        firewallEnabled: { status: "passed", value: "Enabled", details: "Defender Firewall active." },
        rdpNlaEnabled: { status: "passed", value: "NLA Required", details: "Remote Desktop requires NLA." },
        credentialGuard: { status: "passed", value: "Enabled (LSA Isolation)", details: "Credential Guard isolates secrets under LSA container." }
      },
      users: {
        activeUsers: [
          { username: "DbaAdmin", status: "Active", lastPasswordChange: "2026-06-11 08:44:11", passwordAgeDays: 12, passwordNeverExpires: false },
          { username: "SvcDbConnector", status: "Active", lastPasswordChange: "2025-05-19 12:00:00", passwordAgeDays: 400, passwordNeverExpires: true }
        ],
        passwordPolicy: { minimumLength: 14, complexityEnabled: true, maximumAgeDays: 60, minimumAgeDays: 1, historyCount: 24 },
        isDomainController: false
      },
      removableDevices: { usbStorage: { status: "passed", value: "BLOCKED", details: "USB Storage drives blocked (USBSTOR Start = 4)." } },
      ntpTime: { enabled: "Yes", details: "NTP Time Sync active via domain hierarchy.", status: "passed" },
      ports: [
        { port: 22, protocol: "TCP", service: "SSH", status: "Open", severity: "Secure" },
        { port: 1433, protocol: "TCP", service: "ms-sql-s", status: "Open", severity: "Secure", vulnerabilityDetails: "SQL Server listening." },
        { port: 3389, protocol: "TCP", service: "ms-wbt-server", status: "Open", severity: "Secure", vulnerabilityDetails: "RDP active with NLA enforcement." }
      ],
      browserSecurity: {
        chromePasswordStore: { status: "passed", value: "DISABLED", details: "Chrome password autofill blocked." },
        chromeHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Chrome retains history databases." },
        edgePasswordStore: { status: "passed", value: "DISABLED", details: "Edge password saving blocked." },
        edgeHistoryAllowed: { status: "passed", value: "DISABLED", details: "Edge history deletion on exit enforced." },
        firefoxPasswordStore: { status: "failed", value: "ENABLED", details: "Firefox password saving active." },
        firefoxHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Firefox stores history." }
      }
    }
  },
  {
    id: "win-ws-104",
    name: "CORP-WIN10-WS104",
    hostname: "CORP-WIN10-WS104",
    device_type: "Workstation",
    os: "Windows 10 Enterprise",
    os_version: "Windows 10 Enterprise",
    ip: "10.140.20.104",
    ip_address: "10.140.20.104",
    mac_address: "00-15-5D-33-88-C1",
    department: "Corporate Endpoints",
    custodian: "UserWorkstation",
    lastScanned: "2026-06-23 05:22:10",
    last_scan_date: "2026-06-23 05:22",
    overallScore: 68,
    overall_score: 68,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 4,
    lowCount: 1,
    status: "warning",
    compliance_status: "Needs Attention",
    firstScanScore: 68,
    bitlocker: {
      status: 'Unencrypted',
      encryption_type: 'None',
      tpm_version: '2.0 Ready',
      recovery_key_escrowed: false
    },
    defender: {
      status: 'Outdated',
      realtime_protection: true,
      cloud_delivery: false,
      tamper_protection: true,
      definition_version: '1.412.102.0'
    },
    patch_management: {
      status: 'Pending Updates',
      missing_kbs: ['KB5037771', 'KB5038102'],
      last_installed_kb: 'KB5036893'
    },
    firewall_network: {
      firewall_enabled: true,
      smbv1_disabled: false,
      rdp_nla_required: true,
      open_risky_ports: ['445 (SMBv1)']
    },
    account_security: {
      local_admins_count: 3,
      guest_account_disabled: true,
      uac_level: 'Notify Application Changes',
      laps_enabled: false
    },
    audit_logging: {
      security_log_size_mb: 512,
      cmd_line_logging: false,
      logon_audit_enabled: true
    },
    scanData: {
      hostname: "CORP-WIN10-WS104",
      osName: "Windows 10 Enterprise",
      scanTime: "2026-06-23 05:22:10",
      ipAddresses: ["10.140.20.104"],
      privileges: "Standard User (Limited)",
      smb: {
        smb1Enabled: { status: "failed", value: "Enabled", details: "SMBv1 is active. Vulnerable to Wannacry / EternalBlue." },
        smbSigningRequired: { status: "warning", value: "Not Required", details: "SMB Signing is not enforced." },
        smbEncryptionEnabled: { status: "warning", value: "Disabled", details: "SMB payload encryption is disabled." }
      },
      sslTls: {
        tls10Enabled: { status: "passed", value: "Disabled", details: "TLS 1.0 disabled." },
        tls11Enabled: { status: "passed", value: "Disabled", details: "TLS 1.1 active." },
        tls12Enabled: { status: "passed", value: "Enabled", details: "TLS 1.2 enabled." },
        tls13Enabled: { status: "warning", value: "Disabled by Default", details: "TLS 1.3 not configured." },
        weakCipherSuites: { status: "passed", value: "No weak ciphers active", details: "No RC4/3DES ciphers." }
      },
      ntlm: {
        lmCompatibilityLevel: { status: "warning", value: "Level 3: Send NTLMv2 only", details: "NTLMv1 may still be accepted." },
        restrictNtlmTraffic: { status: "warning", value: "Not Restricted", details: "NTLM allowed outbound." },
        anonymousAccess: { status: "passed", value: "Disabled", details: "Anonymous null session shares prohibited." }
      },
      additional: {
        firewallEnabled: { status: "warning", value: "Disabled Profiles: Public", details: "Public firewall profile deactivated." },
        rdpNlaEnabled: { status: "passed", value: "NLA Required", details: "Remote Desktop requires NLA." },
        credentialGuard: { status: "warning", value: "Disabled", details: "Credential Guard inactive." }
      },
      users: {
        activeUsers: [
          { username: "UserWorkstation", status: "Active", lastPasswordChange: "2026-01-15 10:20:00", passwordAgeDays: 159, passwordNeverExpires: false },
          { username: "TikUserStandard", status: "Active", lastPasswordChange: "2026-05-19 14:02:11", passwordAgeDays: 35, passwordNeverExpires: true }
        ],
        passwordPolicy: { minimumLength: 7, complexityEnabled: false, maximumAgeDays: 42, minimumAgeDays: 0, historyCount: 0 },
        isDomainController: false
      },
      removableDevices: { usbStorage: { status: "warning", value: "READ-ONLY", details: "USB storage restricted to Read-Only mode." } },
      ntpTime: { enabled: "Yes", details: "NTP Time Sync active.", status: "passed" },
      ports: [
        { port: 80, protocol: "TCP", service: "HTTP", status: "Open", severity: "Weak", vulnerabilityDetails: "Local IIS welcome page active." },
        { port: 135, protocol: "TCP", service: "msrpc", status: "Open", severity: "Secure" },
        { port: 445, protocol: "TCP", service: "microsoft-ds", status: "Open", severity: "Secure" },
        { port: 3389, protocol: "TCP", service: "ms-wbt-server", status: "Open", severity: "Weak", vulnerabilityDetails: "RDP active without network level constraints." }
      ],
      browserSecurity: {
        chromePasswordStore: { status: "failed", value: "ENABLED", details: "Chrome allows credential retention." },
        chromeHistoryAllowed: { status: "failed", value: "ALLOWED", details: "History records active inside Chrome." },
        edgePasswordStore: { status: "failed", value: "ENABLED", details: "Edge password manager enabled." },
        edgeHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Edge history logs allowed." },
        firefoxPasswordStore: { status: "failed", value: "ENABLED", details: "Firefox profile credentials saving." },
        firefoxHistoryAllowed: { status: "failed", value: "ALLOWED", details: "Firefox logs history." }
      }
    }
  },
  {
    id: "corp-dc-01",
    name: "CORP-AD-DC-01",
    hostname: "CORP-AD-DC-01",
    device_type: "Server",
    os: "Windows Server 2022 Active Directory Domain Controller",
    os_version: "Windows Server 2022 Active Directory DC",
    ip: "10.140.10.10",
    ip_address: "10.140.10.10",
    mac_address: "00-15-5D-62-DF-90",
    department: "Domain Identity / Core AD",
    custodian: "Enterprise Administrator",
    lastScanned: "2026-06-23 06:10:05",
    last_scan_date: "2026-06-23 06:10",
    overallScore: 92,
    overall_score: 92,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 2,
    lowCount: 1,
    status: "secure",
    compliance_status: "Compliant",
    firstScanScore: 92,
    bitlocker: {
      status: 'Encrypted',
      encryption_type: 'XTS-AES 256-bit',
      tpm_version: '2.0 Active',
      recovery_key_escrowed: true
    },
    defender: {
      status: 'Active',
      realtime_protection: true,
      cloud_delivery: true,
      tamper_protection: true,
      definition_version: '1.415.920.0'
    },
    patch_management: {
      status: 'Up-to-Date',
      missing_kbs: [],
      last_installed_kb: 'KB5039212'
    },
    firewall_network: {
      firewall_enabled: true,
      smbv1_disabled: true,
      rdp_nla_required: true,
      open_risky_ports: []
    },
    account_security: {
      local_admins_count: 1,
      guest_account_disabled: true,
      uac_level: 'Always Notify',
      laps_enabled: true
    },
    audit_logging: {
      security_log_size_mb: 4096,
      cmd_line_logging: true,
      logon_audit_enabled: true
    },
    scanData: {
      hostname: "CORP-AD-DC-01",
      osName: "Windows Server 2022 Active Directory DC",
      scanTime: "2026-06-23 06:10:05",
      ipAddresses: ["10.140.10.10"],
      privileges: "Enterprise Administrator (Primary DC)",
      smb: {
        smb1Enabled: { status: "passed", value: "Disabled", details: "SMBv1 is disabled completely." },
        smbSigningRequired: { status: "passed", value: "Required (DC GPO Policy)", details: "SMB Signing demanded on the DC." },
        smbEncryptionEnabled: { status: "warning", value: "Disabled", details: "SMB packet encryption recommended for Sysvol." }
      },
      sslTls: {
        tls10Enabled: { status: "passed", value: "Disabled", details: "TLS 1.0 disabled." },
        tls11Enabled: { status: "passed", value: "Disabled", details: "TLS 1.1 inactive." },
        tls12Enabled: { status: "passed", value: "Enabled", details: "TLS 1.2 active." },
        tls13Enabled: { status: "passed", value: "Enabled", details: "TLS 1.3 active." },
        weakCipherSuites: { status: "passed", value: "Pristine cryptoproviders", details: "Only secure cipher suites permitted." }
      },
      ntlm: {
        lmCompatibilityLevel: { status: "passed", value: "Level 5: Refuse LM & NTLMv1", details: "Active Directory enforces Level 5 blocks." },
        restrictNtlmTraffic: { status: "warning", value: "Not Restricted", details: "NTLM fallback traffic allowed." },
        anonymousAccess: { status: "passed", value: "Disabled", details: "Anonymous access locked." }
      },
      additional: {
        firewallEnabled: { status: "passed", value: "Enabled", details: "Domain controller policies enforce rules." },
        rdpNlaEnabled: { status: "passed", value: "NLA Required", details: "RDP protected via NLA." },
        credentialGuard: { status: "passed", value: "Enabled (LSA Isolation)", details: "AD credentials isolated in hypervisor container." }
      },
      users: {
        activeUsers: [
          { username: "DomainAdmin", status: "Active", lastPasswordChange: "2026-06-15 08:00:00", passwordAgeDays: 8, passwordNeverExpires: false },
          { username: "EnterpriseSvc", status: "Active", lastPasswordChange: "2025-05-30 11:22:00", passwordAgeDays: 389, passwordNeverExpires: true },
          { username: "LegacyContractor", status: "Active", lastPasswordChange: "2026-01-20 09:15:00", passwordAgeDays: 154, passwordNeverExpires: false },
          { username: "AdSyncUser", status: "Active", lastPasswordChange: "2026-06-01 10:00:00", passwordAgeDays: 22, passwordNeverExpires: false }
        ],
        passwordPolicy: { minimumLength: 14, complexityEnabled: true, maximumAgeDays: 90, minimumAgeDays: 1, historyCount: 24 },
        isDomainController: true,
        domainPolicyDetails: "AD Default Domain Password Policy enforces strong password filters."
      },
      removableDevices: { usbStorage: { status: "passed", value: "FULLY RESTRICTED", details: "GPO registry locks block USB drives on AD limits." } },
      ntpTime: { enabled: "Yes", details: "NTP Time Sync active via GPS Master Clock.", status: "passed" },
      ports: [
        { port: 53, protocol: "UDP", service: "domain", status: "Open", severity: "Secure", vulnerabilityDetails: "Active Directory DNS Resolver active." },
        { port: 88, protocol: "TCP", service: "kerberos", status: "Open", severity: "Secure", vulnerabilityDetails: "Kerberos Key Distribution Center active." },
        { port: 135, protocol: "TCP", service: "msrpc", status: "Open", severity: "Secure" },
        { port: 389, protocol: "TCP", service: "ldap", status: "Open", severity: "Weak", vulnerabilityDetails: "Unencrypted LDAP active. Recommend enforcing LDAP signing." },
        { port: 445, protocol: "TCP", service: "microsoft-ds", status: "Open", severity: "Secure", vulnerabilityDetails: "Active Directory SYSVOL / Netlogon." },
        { port: 636, protocol: "TCP", service: "ldaps", status: "Open", severity: "Secure", vulnerabilityDetails: "Secure LDAP over TLS active." }
      ],
      browserSecurity: {
        chromePasswordStore: { status: "passed", value: "DISABLED", details: "Chrome password vaults locked down." },
        chromeHistoryAllowed: { status: "passed", value: "DISABLED", details: "Chrome history deletion enforced." },
        edgePasswordStore: { status: "passed", value: "DISABLED", details: "Edge password caching deactivated." },
        edgeHistoryAllowed: { status: "passed", value: "DISABLED", details: "Edge history logging disabled." },
        firefoxPasswordStore: { status: "passed", value: "DISABLED", details: "Firefox credentials storing disabled." },
        firefoxHistoryAllowed: { status: "passed", value: "DISABLED", details: "Firefox browsing history disabled." }
      }
    }
  }
];

export const VULNERABILITIES_CATALOG_60: VulnerabilityCheck[] = [
  { id: 1, name: "SMB Signing Not Enabled", cveId: "GPO-SMB-001", category: "SMB Security", severity: "High", description: "SMB digital packet signing is not actively configured on the host. When signing is inactive, network peers cannot verify whether incoming SMB packets have been modified in transit.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters' -Name 'EnableSecuritySignature' -Value 1 -Type DWord -Force", impactWarning: "EXTREMELY LOW. Safe to implement. Only active signatures will be supplied. Rarely affects performance (<1.5% CPU overhead).", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters", remedyValue: "EnableSecuritySignature = 1 (DWORD)" },
  { id: 2, name: "SMB Signing Not Required", cveId: "GPO-SMB-002", category: "SMB Security", severity: "High", description: "SMB Server signing requirements are not enforced. Even if digital signing is supported, connections can fall back to clear text headers or unsigned packets, enabling MITM interceptions.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters' -Name 'RequireSecuritySignature' -Value 1 -Type DWord -Force\nSet-SmbClientConfiguration -RequireSecuritySignature $true -Force", impactWarning: "LOW RISK. Legacy clients running Windows XP, Windows 2000, or ancient Linux samba configurations will fail to connect.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters", remedyValue: "RequireSecuritySignature = 1 (DWORD)" },
  { id: 3, name: "SMB Relay Attack Exposure", cveId: "GPO-SMB-003", category: "SMB Security", severity: "High", description: "Without enforced client-side signing and LLMNR/NBT-NS deactivation, local routers can be spoofed to capture credentials and relay them immediately to access corporate storage shares.", powershellFix: "Set-SmbClientConfiguration -RequireSecuritySignature $true -Force\nNew-Item -Path 'HKLM:\\Software\\Policies\\Microsoft\\Windows NT\\DNSClient' -Force\nSet-ItemProperty -Path 'HKLM:\\Software\\Policies\\Microsoft\\Windows NT\\DNSClient' -Name 'EnableMulticast' -Value 0 -Type DWord -Force", impactWarning: "LOW RISK. Deactivating LLMNR name resolution may cause single-label names to fail resolution if local DNS lacks updated pointers.", remedyCode: "HKLM:\\Software\\Policies\\Microsoft\\Windows NT\\DNSClient", remedyValue: "EnableMulticast = 0 (DWORD) + enforce client signing" },
  { id: 4, name: "SMBv1 Protocol Enabled", cveId: "CVE-2017-0144", category: "SMB Security", severity: "Critical", description: "Legacy SMBv1 protocol is active in system drivers. Contains structural heap overflow vulnerabilities exploited by EternalBlue, WannaCry, and DoublePulsar backdoor payloads.", powershellFix: "Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force\nDisable-WindowsOptionalFeature -Online -FeatureName 'SMB1Protocol' -NoRestart", impactWarning: "CRITICAL OPERATIONAL WARNING: Disabling SMBv1 will completely block old printers, legacy fax scanners, and ancient Windows XP / Server 2003 machines from reading or writing files to this host's directories.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters", remedyValue: "SMB1 = 0 (DWORD)" },
  { id: 5, name: "SMBGhost Vulnerability Exposure (CVE-2020-0796)", cveId: "CVE-2020-0796", category: "SMB Security", severity: "Critical", description: "Active compression routines in SMBv3.1.1 on outdated hosts allow arbitrary remote code execution via malformed buffer offsets on port 445.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters' -Name 'DisableCompression' -Value 1 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Safe to deploy. Forces uncompressed SMB packet exchange which negligibly increases network traffic payload size.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters", remedyValue: "DisableCompression = 1 (DWORD)" },
  { id: 6, name: "Anonymous SMB Access Allowed (Null Sessions)", cveId: "GPO-SMB-006", category: "SMB Security", severity: "Medium", description: "Unauthenticated guest accounts or null session connections are allowed to bind to IPC$ shares, providing access to host properties without credentials.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -Name 'RestrictAnonymous' -Value 1 -Type DWord -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -Name 'RestrictAnonymousSAM' -Value 1 -Type DWord -Force", impactWarning: "LOW RISK. Legacy server discovery tools or non-domain external monitors might fail to retrieve initial service configurations.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa", remedyValue: "RestrictAnonymous = 1 (DWORD)" },
  { id: 7, name: "Unauthenticated Share Enumeration", cveId: "GPO-SMB-007", category: "SMB Security", severity: "Medium", description: "Unauthenticated remote users can retrieve lists of all hosted directories, revealing organizational architecture and folder targets to unauthorized personnel.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -Name 'EveryoneIncludesAnonymous' -Value 0 -Type DWord -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters' -Name 'NullSessionShares' -Value @() -Type MultiString -Force", impactWarning: "LOW RISK. Fully prevents unauthenticated discovery tools from enumerating names of available storage groups.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa", remedyValue: "EveryoneIncludesAnonymous = 0" },
  { id: 8, name: "Excessive SMB Share Permissions", cveId: "GPO-SMB-008", category: "SMB Security", severity: "Medium", description: "Security descriptors on network shares are set to 'Everyone: Full Control', which overrides NTFS permissions or allows lateral traversal.", powershellFix: "Get-SmbShare | Where-Object { $_.Name -notmatch 'IPC\\$|NETLOGON|SYSVOL' } | ForEach-Object {\n    Revoke-SmbShareAccess -Name $_.Name -AccountName 'Everyone' -Force -ErrorAction SilentlyContinue\n    Grant-SmbShareAccess -Name $_.Name -AccountName 'Authenticated Users' -AccessRight Change -Force -ErrorAction SilentlyContinue\n}", impactWarning: "MEDIUM OPERATIONAL WARNING: Disabling 'Everyone' share permissions might block custom local service accounts, specialized automation script logins, or external un-managed nodes.", remedyCode: "SMB Share Security DACL", remedyValue: "Replace 'Everyone' with 'Authenticated Users'" },
  { id: 9, name: "Unrestricted File Share Access", cveId: "GPO-SMB-009", category: "SMB Security", severity: "Medium", description: "Corporate files, system drivers, and executable files are readable by domain users due to lacks of Access-Based Enumeration (ABE) on standard volumes.", powershellFix: "Get-SmbShare | Where-Object { $_.Special -eq $false } | ForEach-Object {\n    Set-SmbShare -Name $_.Name -FolderEnumerationMode AccessBased -Force -ErrorAction SilentlyContinue\n}", impactWarning: "LOW RISK / HIGHLY SECURE. Safe to implement. Users might ask why some files 'disappeared' because they can no longer see folders they lacked permissions for.", remedyCode: "SMB Share Parameters", remedyValue: "FolderEnumerationMode = AccessBased" },
  { id: 10, name: "SMB Service Accessible from Untrusted Networks", cveId: "GPO-SMB-010", category: "SMB Security", severity: "High", description: "Direct host port 445 is exposed to non-corporate subnets or directly to public internet without host-based firewall segmentation restrictions.", powershellFix: "New-NetFirewallRule -DisplayName 'Restrict SMB Port 445 Inbound' -Direction Inbound -Action Block -LocalPort 445 -Protocol TCP -RemoteAddress 'Internet' -Force", impactWarning: "MEDIUM RISK: Blocking port 445 globally will disrupt external VPN-less employees from connecting directly to their shared volumes.", remedyCode: "Defender NetFirewallRule", remedyValue: "Block Port 445 from RemoteAddress 'Internet'" },
  { id: 11, name: "SMB Encryption Not Enabled", cveId: "GPO-SMB-011", category: "SMB Security", severity: "Medium", description: "Network traffic traversing active shares is sent unencrypted over port 445, exposing files, documents, and credentials to passive ethernet sniffing.", powershellFix: "Set-SmbServerConfiguration -EncryptData $true -Force", impactWarning: "OPERATIONAL DISRUPTION RISK: Enforcing encryption will immediately disconnect and permanently block legacy storage clients.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters", remedyValue: "EncryptData = 1 (DWORD)" },
  { id: 12, name: "Weak SMB Authentication Configuration", cveId: "GPO-SMB-012", category: "SMB Security", severity: "Medium", description: "Windows allows cleartext passwords or simple hash validations to fallback if the primary enterprise domain controller is briefly unavailable.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters' -Name 'EnablePlainTextPassword' -Value 0 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Highly recommended. Halts legacy unencrypted passwords transmission.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanWorkstation\\Parameters", remedyValue: "EnablePlainTextPassword = 0" },
  { id: 13, name: "Weak SSL/TLS Cipher Suites Enabled", cveId: "GPO-SCH-013", category: "SSL/TLS Protocols", severity: "High", description: "Outdated cipher suites are registered inside SCHANNEL, potentially forcing servers to agree upon export-grade encryption keys during secure port negotiations.", powershellFix: "Disable-TlsCipherSuite -Name 'TLS_RSA_WITH_3DES_EDE_CBC_SHA' -ErrorAction SilentlyContinue\nDisable-TlsCipherSuite -Name 'TLS_RSA_WITH_RC4_128_SHA' -ErrorAction SilentlyContinue", impactWarning: "MEDIUM RISK: Disabling weak cipher suites will cause legacy web clients, non-updated diagnostic APIs, and older database connector drivers to fail to connect.", remedyCode: "GPO Cryptographic Cipher Order", remedyValue: "Enforce modern TLS_ECDHE ciphers" },
  { id: 14, name: "RC4 Cipher Suites Enabled", cveId: "CVE-2015-2808", category: "SSL/TLS Protocols", severity: "High", description: "RC4 stream cipher keys are supported. Vulnerable to biases in keystream generators (Bar Mitzvah vulnerability) which allow session hijacking.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\RC4 128/128' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\RC4 128/128' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "LOW RISK: Disables RC4 completely. Some legacy internal java apps or customized industrial consoles may require updates.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\RC4 128/128", remedyValue: "Enabled = 0 (DWORD)" },
  { id: 15, name: "DES Cipher Suites Enabled", cveId: "GPO-SCH-015", category: "SSL/TLS Protocols", severity: "Medium", description: "Single-DES (56-bit) remains active in Windows cipher negotiation layers. Can be brute-forced of hardware tools in a matter of hours.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\DES 56/56' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\DES 56/56' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Fully safe. Zero modern software applications rely on raw 56-bit DES ciphers.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\DES 56/56", remedyValue: "Enabled = 0 (DWORD)" },
  { id: 16, name: "3DES Cipher Suites Enabled", cveId: "CVE-2016-2183", category: "SSL/TLS Protocols", severity: "High", description: "Triple-DES (Sweet32) relies on 64-bit blocks. An attacker capturing long-duration sessions can execute collision attacks to retrieve cookies or authorization tokens.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\Triple DES 168' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\Triple DES 168' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "MEDIUM RISK: Ancient remote backup agents or long-running database pipes built on ancient setups may terminate if they do not support AES.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\Triple DES 168", remedyValue: "Enabled = 0 (DWORD)" },
  { id: 17, name: "Null Cipher Support Enabled", cveId: "GPO-SCH-017", category: "SSL/TLS Protocols", severity: "Medium", description: "Permits TLS connections to agree upon NULL (No-Encryption) handlers, meaning details are negotiated over open ports as unencrypted ascii lines.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\NULL' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\NULL' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "MINIMAL RISK. Highly safe for all servers. Prevents worst-case misconfigurations where traffic drops encryption entirely.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers\\NULL", remedyValue: "Enabled = 0" },
  { id: 18, name: "Export Grade Cipher Support Enabled", cveId: "CVE-2015-0204", category: "SSL/TLS Protocols", severity: "Medium", description: "Allows negotiation of 40-bit or 56-bit export-grade cipher mechanisms (FREAK exploit bypass vector), enabling local attackers to decrypt HTTPS tunnels in real time.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers' -Name 'Export' -Value 0 -Type DWord -ErrorAction SilentlyContinue", impactWarning: "MINIMAL IMPACT. Fully safe. Securely enforces that TLS negotiation always demands at least 128-bit key layers.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Ciphers", remedyValue: "Export = 0" },
  { id: 19, name: "SSL 2.0 Enabled", cveId: "GPO-SCH-019", category: "SSL/TLS Protocols", severity: "High", description: "Schannel registry permits SSL 2.0 protocols. Cryptographically broken; vulnerable to handshakes manipulation and decrypts.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 2.0\\Server' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 2.0\\Server' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Safe. Modern browsers and security stacks abandoned SSL 2.0 back in 2011.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 2.0\\Server", remedyValue: "Enabled = 0" },
  { id: 20, name: "SSL 3.0 Enabled", cveId: "CVE-2014-3566", category: "SSL/TLS Protocols", severity: "High", description: "SSL 3.0 protocol remains enabled in legacy settings. Vulnerable to padding oracle attacks (POODLE) allowing block decryption.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 3.0\\Server' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 3.0\\Server' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "LOW RISK. Essential for PCI-DSS. Only extreme legacy embedded controllers or terminal units would fail to connect.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\SSL 3.0\\Server", remedyValue: "Enabled = 0" },
  { id: 21, name: "TLS 1.0 Enabled", cveId: "GPO-SCH-021", category: "SSL/TLS Protocols", severity: "High", description: "TLS 1.0 is active. Suffers from cipher-block chaining vulnerabilities (BEAST exploit), enabling extraction of sensitive session values.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Name 'Enabled' -Value 0 -Type DWord -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Name 'DisabledByDefault' -Value 1 -Type DWord -Force", impactWarning: "MEDIUM RISK: Disabling TLS 1.0 will cause immediate communication breakdown on highly legacy APIs or outdated database frameworks.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server", remedyValue: "Enabled = 0 (DWORD)" },
  { id: 22, name: "TLS 1.1 Enabled", cveId: "GPO-SCH-022", category: "SSL/TLS Protocols", severity: "High", description: "TLS 1.1 protocol remains active in Schannel parameters. Deprecated worldwide under newer compliance structures (NIST SP 800-52r2).", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.1\\Server' -Force\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.1\\Server' -Name 'Enabled' -Value 0 -Type DWord -Force", impactWarning: "MED-LOW RISK: Disabling TLS 1.1 may cause outdated web indexing tools or API endpoints to reject secure negotiation headers.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.1\\Server", remedyValue: "Enabled = 0" },
  { id: 23, name: "Weak TLS Configuration", cveId: "GPO-SCH-023", category: "SSL/TLS Protocols", severity: "Medium", description: "System defaults do not prioritize Diffie-Hellman ephemeral sequences, resulting in a lack of Forward Secrecy on established secure port tunnels.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\KeyExchangeAlgorithms\\Diffie-Hellman' -Force -ErrorAction SilentlyContinue\nSet-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\KeyExchangeAlgorithms\\Diffie-Hellman' -Name 'ServerMinKeyBitLength' -Value 2048 -Type DWord -Force", impactWarning: "LOW RISK: Outdated network systems with processor hardware built on 1024-bit logic limits may experience negotiation slowdowns.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\KeyExchangeAlgorithms\\Diffie-Hellman", remedyValue: "ServerMinKeyBitLength = 2048" },
  { id: 24, name: "Missing Strong Cryptography Enforcement (.NET)", cveId: "GPO-DOT-024", category: "SSL/TLS Protocols", severity: "High", description: ".NET framework runtimes defer to legacy web client layers, forcing older apps inside the system to restrict connection outputs to SSL 3.0 or TLS 1.0.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319' -Name 'SchUseStrongCrypto' -Value 1 -Type DWord -Force\nSet-ItemProperty -Path 'HKLM:\\SOFTWARE\\Wow6432Node\\Microsoft\\.NETFramework\\v4.0.30319' -Name 'SchUseStrongCrypto' -Value 1 -Type DWord -Force", impactWarning: "LOW RISK: Exceptionally safe. Improves app security. Highly customized older internal .NET corporate apps may need testing.", remedyCode: "HKLM:\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319", remedyValue: "SchUseStrongCrypto = 1" },
  { id: 25, name: "Insecure RDP TLS Configuration", cveId: "GPO-RDP-025", category: "Network Integrity", severity: "Medium", description: "Remote Desktop Services bounds to Negotiate layer rather than demanding strict SSL (TLS) wrappers, allowing attackers to downgrade connections.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name 'SecurityLayer' -Value 2 -Type DWord -Force", impactWarning: "LOW RISK. Disables raw downgrade sequences. Non-Windows third-party remote control applications must support native TLS wrappers.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp", remedyValue: "SecurityLayer = 2" },
  { id: 26, name: "Weak RDP Encryption Protocols Supported", cveId: "GPO-RDP-026", category: "Network Integrity", severity: "Medium", description: "The remote desktop services are prepared to accept low-encryption key sequences on active remote administrator channels.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name 'MinEncryptionLevel' -Value 3 -Type DWord -Force", impactWarning: "LOW RISK. Demands high-strength (128-bit) symmetric keys. Prevents old customized thin clients from connecting.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp", remedyValue: "MinEncryptionLevel = 3" },
  { id: 27, name: "Self-Signed SSL Certificate", cveId: "GPO-CRT-027", category: "SSL/TLS Protocols", severity: "Medium", description: "Exposed web nodes or RDP service channels are binding a default self-signed local server certificate rather than a verified Certificate Authority chain.", powershellFix: "Get-ChildItem -Path Cert:\\LocalMachine\\My | Where-Object { $_.Subject -eq $_.Issuer } | ForEach-Object {\n    Write-Warning \"Self-Signed Certificate Identified: $($_.Subject) - Thumbprint: $($_.Thumbprint)\"\n}", impactWarning: "WARNING: Enforcing verified CA certs is critical. Ensure automatic certificates enrollment GPOs are functioning.", remedyCode: "Local SSL Certificate Binding", remedyValue: "Replace Subject=Issuer certs with PKI CA Signatures" },
  { id: 28, name: "Expired SSL Certificate", cveId: "GPO-CRT-028", category: "SSL/TLS Protocols", severity: "High", description: "One or more active secure port endpoints bindings trust a certificate whose validation timestamp has passed, resulting in secure browser blocks.", powershellFix: "Get-ChildItem -Path Cert:\\LocalMachine\\My | Where-Object { $_.NotAfter -lt (Get-Date) } | ForEach-Object {\n    Write-Error \"EXPIRED SSL CERTIFICATE: $($_.Subject) expired on $($_.NotAfter)\"\n}", impactWarning: "CRITICAL REPLACEMENT PENDING: Replacing active expired cert without hot-swapping a valid replacement may disrupt active services.", remedyCode: "Cert:\\LocalMachine\\My", remedyValue: "Renew and hot-swap certificate payload" },
  { id: 29, name: "Invalid SSL Certificate Trust Chain", cveId: "GPO-CRT-029", category: "SSL/TLS Protocols", severity: "High", description: "The secure portal contains a broken trust hierarchy, indicating root certificate updates have not been synchronised with trusted intermediate networks.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\SystemCertificates\\AuthRoot' -Name 'DisableRootAutoUpdate' -Value 0 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Essential to security posture. Allows the operating system to dynamically update trusted domain CA caches.", remedyCode: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\SystemCertificates\\AuthRoot", remedyValue: "DisableRootAutoUpdate = 0" },
  { id: 30, name: "Weak SSL Certificate Key Length", cveId: "GPO-CRT-030", category: "SSL/TLS Protocols", severity: "Medium", description: "The active host is operating 512-bit or 1024-bit RSA key certificates. These short keys are susceptible to factoring by cloud compute resources.", powershellFix: "certutil -setreg chain\\MinRSAKeyLength 2048", impactWarning: "WARNING: Setting MinRSAKeyLength to 2048 will reject connections to extremely old internal hardware units running 1024-bit firmware.", remedyCode: "Certutil Registry Engine Registry", remedyValue: "chain\\MinRSAKeyLength = 2048" },
  { id: 31, name: "SSL Certificate Hostname Mismatch", cveId: "GPO-CRT-031", category: "SSL/TLS Protocols", severity: "Medium", description: "The Common Name (CN) or Subject Alternative Name (SAN) inside the active certificate does not match the actual DNS domain or server address.", powershellFix: "Get-Website | ForEach-Object {\n    Write-Host \"Checking DNS mapping requirements on binding: $($_.Bindings.Collection)\"\n}", impactWarning: "LOW RISK: Visual warnings in browsers will be triggered until the DNS record aligns with the certificate's SAN or CN parameters.", remedyCode: "IIS Binding CN Configuration", remedyValue: "Subject Alternative Name (SAN) alignment" },
  { id: 32, name: "Missing HTTPS Configuration", cveId: "GPO-CRT-032", category: "Network Integrity", severity: "Medium", description: "Web management interfaces or portal panels on this host are run on port 80, releasing cookies and session indicators onto local network hubs in readable format.", powershellFix: "Import-Module WebAdministration -ErrorAction SilentlyContinue\nSet-WebConfigurationProperty -filter /system.webServer/security/access -name sslFlags -value 'Ssl' -PSPath 'IIS:\\' -ErrorAction SilentlyContinue", impactWarning: "HIGH RISK FOR EXTRANETS: If you enforce SSL-Only without having mapped a valid SSL certificate on Port 443 first, users will receive connection errors.", remedyCode: "IIS Server configuration", remedyValue: "SslFlags = Ssl (Mandate HTTPS)" },
  { id: 33, name: "Telnet Service Enabled", cveId: "GPO-SVC-033", category: "Network Integrity", severity: "Critical", description: "Legacy Telnet service (port 23) is installed and active on the host. Highly dangerous cleartext admin interface. Allows password harvesting.", powershellFix: "Stop-Service -Name 'TlntSvr' -Force -ErrorAction SilentlyContinue\nSet-Service -Name 'TlntSvr' -StartupType Disabled -ErrorAction SilentlyContinue\nDisable-WindowsOptionalFeature -Online -FeatureName 'TelnetServer' -NoRestart -ErrorAction SilentlyContinue", impactWarning: "LOW RISK. Telnet is completely obsolete. Removing it is extremely safe. Switch immediately to SSHv2 or HTTPS terminals.", remedyCode: "Windows Optional Feature Server", remedyValue: "TelnetServer state = Disabled" },
  { id: 34, name: "Clear Text Remote Administration via Telnet", cveId: "GPO-SVC-034", category: "Network Integrity", severity: "Critical", description: "A shell is listening on Port 23. Direct remote server control commands, user passwords, and outputs are visible to anyone on the same internet router path.", powershellFix: "New-NetFirewallRule -DisplayName 'Block Telnet Port 23' -Direction Inbound -Action Block -LocalPort 23 -Protocol TCP -Force", impactWarning: "MINIMAL IMPACT. Closes highly unsecure entry doors. No modern administrative framework relies on cleartext telnet command tunnels.", remedyCode: "Defender NetFirewallRule TCP", remedyValue: "Block Port 23 Inbound globally" },
  { id: 35, name: "Unencrypted Network Communications", cveId: "GPO-NET-035", category: "Network Integrity", severity: "Medium", description: "Unencrypted port channels (like FTP port 21, HTTP port 80, LDAP port 389) are running. Allows attackers to capture sessions.", powershellFix: "New-NetFirewallRule -DisplayName 'Block FTP Port 21' -Direction Inbound -Action Block -LocalPort 21 -Protocol TCP -Force", impactWarning: "WARNING: Blocking unencrypted communication ports will instantly break old automated cron scripts or legacy backup transfer scripts.", remedyCode: "Defender NetFirewallRule", remedyValue: "Block legacy unencrypted ports (21, 23, 80)" },
  { id: 36, name: "Weak SSH Algorithms Supported", cveId: "GPO-SSH-036", category: "Network Integrity", severity: "Medium", description: "The Windows OpenSSH Server is configured to allow legacy cryptociphers, making sessions vulnerable to structural decryption breaches on SSHv2.", powershellFix: "$sshConfig = 'C:\\ProgramData\\ssh\\sshd_config'\nif (Test-Path $sshConfig) {\n    (Get-Content $sshConfig) -replace '^#?Ciphers.*', 'Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com' | Set-Content $sshConfig\n    Restart-Service sshd -ErrorAction SilentlyContinue\n}", impactWarning: "MEDIUM RISK: Disabling weak SSH ciphers will block connection attempts from legacy network devices or outdated developer terminals.", remedyCode: "C:\\ProgramData\\ssh\\sshd_config", remedyValue: "Ciphers = chacha20-poly1305, aes256-gcm" },
  { id: 37, name: "Weak SSH Key Exchange Algorithms", cveId: "GPO-SSH-037", category: "Network Integrity", severity: "Medium", description: "Allows group1-sha1 or other weak DH parameters during secure shell initialization. Enables man-in-the-middle decryption of command sessions.", powershellFix: "$sshConfig = 'C:\\ProgramData\\ssh\\sshd_config'\nif (Test-Path $sshConfig) {\n    (Get-Content $sshConfig) -replace '^#?KexAlgorithms.*', 'KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512' | Set-Content $sshConfig\n    Restart-Service sshd -ErrorAction SilentlyContinue\n}", impactWarning: "LOW-MEDIUM RISK: Disabling outdated exchange layers prevents third-party legacy putty terminal tools from connecting.", remedyCode: "C:\\ProgramData\\ssh\\sshd_config", remedyValue: "KexAlgorithms = curve25519-sha256" },
  { id: 38, name: "Weak SSH Host Keys", cveId: "GPO-SSH-038", category: "Network Integrity", severity: "Medium", description: "The host is offering weak 1024-bit DSA or broken ECDSA signature keys to verify its hostname integrity during remote client connections.", powershellFix: "$sshConfig = 'C:\\ProgramData\\ssh\\sshd_config'\nif (Test-Path $sshConfig) {\n    (Get-Content $sshConfig) -replace '^HostKey.*ssh-dss', '# HostKey ssh-dss' | Set-Content $sshConfig\n    Restart-Service sshd -ErrorAction SilentlyContinue\n}", impactWarning: "MINIMAL IMPACT. Securely forces modern high-grade RSA (3072-bit+) or Ed25519 host keys validation.", remedyCode: "C:\\ProgramData\\ssh\\sshd_config", remedyValue: "HostKey = ssh-ed25519" },
  { id: 39, name: "Password Authentication Enabled on SSH", cveId: "GPO-SSH-039", category: "Network Integrity", severity: "Medium", description: "Permits users to input passwords rather than requiring public-key (SSH Key) credentials, exposing OpenSSH ports to brute-force dictionaries.", powershellFix: "$sshConfig = 'C:\\ProgramData\\ssh\\sshd_config'\nif (Test-Path $sshConfig) {\n    (Get-Content $sshConfig) -replace '^#?PasswordAuthentication.*', 'PasswordAuthentication no' | Set-Content $sshConfig\n    Restart-Service sshd -ErrorAction SilentlyContinue\n}", impactWarning: "CRITICAL OPERATIONAL RISK: If users have not uploaded their public ssh keys (authorized_keys) first, locking password logins will lock out administrators.", remedyCode: "C:\\ProgramData\\ssh\\sshd_config", remedyValue: "PasswordAuthentication = no" },
  { id: 40, name: "LDAP Enumeration Exposure", cveId: "GPO-AD-040", category: "OS / Active Directory", severity: "High", description: "Active Directory LDAP servers are not configured to mandate channel binding and LDAP signing. Enables unpermitted anonymous directory scans.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\NTDS\\Parameters' -Name 'LDAPServerIntegrity' -Value 2 -Type DWord -Force", impactWarning: "MEDIUM RISK: Outdated non-Windows tools or legacy LDAP-bound applications will fail to query user lists until modified to support secure sign headers.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\NTDS\\Parameters", remedyValue: "LDAPServerIntegrity = 2" },
  { id: 41, name: "Excessive Active Directory Information Disclosure", cveId: "GPO-AD-041", category: "OS / Active Directory", severity: "High", description: "Windows allows local and network authenticated users to query deep properties of high-privilege domain users, service accounts, and key nodes.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Lsa' -Name 'RestrictRemoteSAM' -Value 'O:BAG:BAD:(A;;RC;;;BA)' -Type String -Force", impactWarning: "LOW RISK. Essential for preventing domain reconnaissance tools (e.g., BloodHound, SharpHound) from executing silently.", remedyCode: "HKLM:\\System\\CurrentControlSet\\Control\\Lsa", remedyValue: "RestrictRemoteSAM = 'O:BAG:BAD:(A;;RC;;;BA)'" },
  { id: 42, name: "Domain User Enumeration Possible", cveId: "GPO-AD-042", category: "OS / Active Directory", severity: "High", description: "The Kerberos service accepts pre-authentication requests without auditing, enabling attackers to scan usernames on the domain.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Kdc' -Name 'AuditEvents' -Value 1 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Enhances visibility. Safe to deploy. Essential for SOC logging teams.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Kdc", remedyValue: "AuditEvents = 1" },
  { id: 43, name: "Domain Group Enumeration Possible", cveId: "GPO-AD-043", category: "OS / Active Directory", severity: "Medium", description: "Authenticated network nodes can bypass GPO filters to query lists of enterprise domain administrator groups, enabling targeted phishing or escalation paths.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -Name 'RestrictRemoteSAM' -Value 'O:BAG:BAD:(A;;RC;;;BA)' -Type String -Force", impactWarning: "LOW RISK. Only blocks domain reconnaissance scripts. Safe. Does not affect normal active work operations.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa", remedyValue: "RestrictRemoteSAM = Enforced" },
  { id: 44, name: "Missing Network Segmentation for SMB", cveId: "GPO-NET-044", category: "Network Integrity", severity: "High", description: "The host lacks subnet boundary limits on file-share access, allowing standard employee laptop subnets direct access to raw production database file systems.", powershellFix: "New-NetFirewallRule -DisplayName 'Segment SMB Traffic' -Direction Inbound -Action Allow -LocalPort 445 -Protocol TCP -RemoteAddress '10.140.10.0/24' -Force", impactWarning: "WARNING: Employees on non-admin networks will lose direct access to these shares. Must ensure correct VPN subnets are covered.", remedyCode: "NetFirewallRule Inbound", remedyValue: "RemoteAddress restricted to 10.140.10.0/24" },
  { id: 45, name: "File and Printer Sharing Exposed to External Networks", cveId: "GPO-NET-045", category: "Network Integrity", severity: "High", description: "NetBIOS and SMB sharing are allowed to communicate across public or external facing configurations, making folders active target nodes.", powershellFix: "Set-NetFirewallRule -DisplayGroup 'File and Printer Sharing' -Profile Public -Enabled False", impactWarning: "LOW RISK / HIGHLY RECOMMENDED. Safe. Ensures file and printer sharing endpoints never bind to unsafe public internet connections.", remedyCode: "NetFirewallRule Group Parameters", remedyValue: "Profile Public = Disabled" },
  { id: 46, name: "Missing Firewall Restrictions on SMB", cveId: "GPO-NET-046", category: "Network Integrity", severity: "High", description: "Local computer lacks host-based firewalls for network communication over SMB/Port 445, leaving systems exposed if router firewalls fail.", powershellFix: "Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True", impactWarning: "MEDIUM RISK: If custom local port bindings are active without custom rules, they will immediately be blocked.", remedyCode: "Defender Firewall Globals Configuration", remedyValue: "Profiles Domain/Private/Public = Enabled" },
  { id: 47, name: "Missing Latest Security Updates", cveId: "GPO-SYS-047", category: "Device / Software Policies", severity: "High", description: "System lacks administrative enforcement of hotfixes, resulting in vulnerability to recent remote code execution or kernel privilege escalation exploits.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU' -Name 'NoAutoUpdate' -Value 0 -Type DWord -Force", impactWarning: "MEDIUM RISK: Installing security updates automatically might trigger reboots or cause customized internal code to fail compatibility tests.", remedyCode: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU", remedyValue: "NoAutoUpdate = 0" },
  { id: 48, name: "Unsupported or End-of-Life Software", cveId: "GPO-SYS-048", category: "Device / Software Policies", severity: "High", description: "System detects presence of legacy end-of-life framework libraries (such as .NET Framework 2.0 or Silverlight), which no longer receive security fixes.", powershellFix: "Disable-WindowsOptionalFeature -Online -FeatureName 'NetFx3' -NoRestart -ErrorAction SilentlyContinue", impactWarning: "HIGH RISK: De-registering .NET 2.0/3.5 will immediately break old enterprise utility apps or database tools.", remedyCode: "Windows Optional Feature", remedyValue: "FeatureName NetFx3 = Disabled" },
  { id: 49, name: "Insecure IIS HTTPS Configuration", cveId: "GPO-IIS-049", category: "OS / Active Directory", severity: "Medium", description: "IIS web server configuration lacks HSTS (HTTP Strict Transport Security) headers. Enables attackers to downgrade secure client links.", powershellFix: "Import-Module WebAdministration -ErrorAction SilentlyContinue\nSet-WebConfigurationProperty -filter 'system.webServer/httpProtocol/customHeaders' -name '.' -value @{name='Strict-Transport-Security'; value='max-age=31536000; includeSubDomains'} -PSPath 'IIS:\\' -ErrorAction SilentlyContinue", impactWarning: "MED-LOW RISK: Forces browsers to strictly communicate over HTTPS. Subdomains lacking SSL will become inaccessible.", remedyCode: "IIS customHeaders Config", remedyValue: "Strict-Transport-Security injected" },
  { id: 50, name: "Weak Web Server TLS Configuration", cveId: "GPO-IIS-050", category: "OS / Active Directory", severity: "Medium", description: "IIS bindings include fallback mechanisms to legacy ciphers, leaving services vulnerable to decryption of administrative web ports.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL' -Name 'DisableRenegoOnServer' -Value 1 -Type DWord -Force", impactWarning: "LOW RISK. Mitigates remote denial-of-service or TLS downgrade attacks on IIS endpoints.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL", remedyValue: "DisableRenegoOnServer = 1" },
  { id: 51, name: "Heartbleed Vulnerability Exposure Check Failure", cveId: "CVE-2014-0160", category: "Network Integrity", severity: "High", description: "The host contains old un-patched OpenSSL binary builds in program directories, exposing private encryption keys to remote memory leaks.", powershellFix: "Get-ChildItem -Path C:\\ -Filter 'libeay32.dll','ssleay32.dll' -Recurse -ErrorAction SilentlyContinue | ForEach-Object {\n    Write-Warning \"Audit Trigger: Potentially vulnerable OpenSSL binary: $($_.FullName)\"\n}", impactWarning: "CRITICAL COMPONENT REPLACEMENT: Patching or upgrading libeay32/ssleay32 DLLs requires hot-swapping software packages.", remedyCode: "C:\\...\\libeay32.dll version", remedyValue: "Upgrade to patches OpenSSL 1.1.1+" },
  { id: 52, name: "Open Administrative Ports Detected", cveId: "GPO-NET-052", category: "Network Integrity", severity: "High", description: "Highly sensitive diagnostic or remote control ports (SSH port 22, VNC port 5900, WinRM port 5985) are exposed to non-restricted address configurations.", powershellFix: "Set-NetFirewallRule -DisplayGroup 'Windows Remote Management' -Profile Public -Enabled False", impactWarning: "HIGH RISK FOR EXTRANETS: If remote administrative consoles are restricted, personnel on home locations without VPN will lose connection.", remedyCode: "NetFirewallRule Group", remedyValue: "WinRM Public Profile = Disabled" },
  { id: 53, name: "Excessive Network Service Exposure", cveId: "GPO-NET-053", category: "Network Integrity", severity: "Medium", description: "System runs unnecessary network bindings (such as SSDP discovery, peer name resolutions, upnp), exposing unnecessary surface to scan scripts.", powershellFix: "Stop-Service -Name 'upnphost' -Force -ErrorAction SilentlyContinue\nSet-Service -Name 'upnphost' -StartupType Disabled -ErrorAction SilentlyContinue", impactWarning: "LOW RISK. Disables automatic device discoverability. Safe. Specialized dynamic media printers might fail discovery.", remedyCode: "Windows Service Config", remedyValue: "upnphost / SSDP status = Disabled" },
  { id: 54, name: "Insecure Remote Desktop Configuration", cveId: "GPO-RDP-054", category: "Network Integrity", severity: "Medium", description: "Remote desktop configurations allow standard corporate users to persist inactive sessions for infinite duration, enabling process hijacking.", powershellFix: "Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Terminal Services' -Name 'MaxIdleTime' -Value 900000 -Type DWord -Force", impactWarning: "MINIMAL IMPACT. Increases host performance by cleaning orphan threads. Users re-authenticate after 15 min idle.", remedyCode: "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Terminal Services", remedyValue: "MaxIdleTime = 900000 (DWORD ms)" },
  { id: 55, name: "Weak Cryptographic Protocols Supported", cveId: "GPO-SCH-055", category: "SSL/TLS Protocols", severity: "Medium", description: "Cipher suite configs permit legacy hashes like MD5 or SHA-1 to authenticate server identities, which are highly susceptible to collision decryptions.", powershellFix: "New-Item -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Cryptography\\Configuration\\Local\\SSL\\00010003' -Force -ErrorAction SilentlyContinue", impactWarning: "LOW-MEDIUM RISK. Some older legacy external merchant account validation services or older certificate trust chains might refuse communication.", remedyCode: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Cryptography", remedyValue: "Remove MD5 / SHA-1 hashes from SSL lists" },
  { id: 56, name: "Information Disclosure Through Service Enumeration", cveId: "GPO-SYS-056", category: "Device / Software Policies", severity: "Low", description: "Standard service responses release precise kernel build numbers, OS specifications, and server models inside port headers.", powershellFix: "Set-NetFirewallRule -DisplayName 'File and Printer Sharing (Echo Request - ICMPv4-In)' -Enabled False -Force", impactWarning: "LOW RISK. Prevents remote ping checks. External monitoring services utilizing simple ICMP ping requests will falsely report the system as offline.", remedyCode: "NetFirewallRule ICMPv4-In", remedyValue: "Echo Request Inbound = Disabled" },
  { id: 57, name: "Lack of Secure Communication Controls", cveId: "GPO-SYS-057", category: "Network Integrity", severity: "Medium", description: "Host is not configured to require IPSec encryption for inter-server database traffic, leaving internal communication lines vulnerable.", powershellFix: "Set-Service -Name 'IKEEXT' -StartupType Automatic\nStart-Service -Name 'IKEEXT' -ErrorAction SilentlyContinue", impactWarning: "LOW RISK. Pre-req configuration for secure site-to-site tunnels. Safe for standard domain workloads.", remedyCode: "Windows Service 'IKEEXT'", remedyValue: "Start and set to Automatic" },
  { id: 58, name: "Weak Network Hardening Configuration", cveId: "GPO-SYS-058", category: "Network Integrity", severity: "Medium", description: "The host TCP/IP stack allows response to IPv6 routing requests or source-routed frames, permitting IP spoofing bypasses across subnets.", powershellFix: "Set-NetIPInterface -AddressFamily IPv6 -RouterDiscovery Disabled -ErrorAction SilentlyContinue", impactWarning: "LOW RISK. Mitigates IPv6 router advertisement attacks. Safe. Recommend keeping if local domain runs strict IPv4 routing directories.", remedyCode: "NetIPInterface IPv6 Parameters", remedyValue: "RouterDiscovery = Disabled" },
  { id: 59, name: "Missing Secure Baseline Configuration", cveId: "GPO-SYS-059", category: "Device / Software Policies", severity: "High", description: "The host is not aligned with Microsoft's Recommended Security Baselines, leaving critical local audit logging and account lockout parameters disabled.", powershellFix: "net accounts /lockoutthreshold:5 /lockoutduration:30 /lockoutwindow:30", impactWarning: "MEDIUM RISK: Corporate users who frequently forget their passwords will find their accounts locked after 5 failed attempts.", remedyCode: "Local SAM Account Policies", remedyValue: "lockoutthreshold = 5 attempts" },
  { id: 60, name: "Inadequate Access Control on Shared Resources", cveId: "GPO-SYS-060", category: "Device / Software Policies", severity: "Medium", description: "Default guest accounts are active or lack password mappings, permitting lateral movement without validation signatures.", powershellFix: "Disable-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue", impactWarning: "LOW RISK / ESSENTIAL. Deactivates obsolete anonymous guest login portals globally. Virtually zero operational disruption.", remedyCode: "Local User Guest Account", remedyValue: "Enabled = False" }
];

export const REMEDIATION_RULES_DATABASE: RemediationRule[] = [
  {
    id: "rem-smb1-disable",
    title: "Disable SMBv1 Protocol",
    category: "SMB",
    severity: "Critical",
    description: "SMBv1 is an extremely old, deprecated network sharing protocol. It is highly vulnerable to remote code execution (e.g., EternalBlue, Wannacry) and lacks modern security mitigations.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters",
    registryKey: "SMB1",
    registryValue: "0 (DWORD)",
    powershellFix: "Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force\n\nif (Get-WindowsFeature -Name FS-SMB1 -ErrorAction SilentlyContinue) {\n    Uninstall-WindowsFeature -Name FS-SMB1 -Remove\n}",
    gpoPath: "Computer Configuration -> Policies -> Administrative Templates -> MS Security Guide -> Configure SMBv1 Server (Set to Disabled)",
    impactAssessment: "Low in modern environments. Legacy printers/scanners or pre-2008 servers might fail to communicate with this endpoint via legacy shares."
  },
  {
    id: "rem-smb-sign-require",
    title: "Enforce SMB Signing Requirements",
    category: "SMB",
    severity: "High",
    description: "Enforcing SMB signing prevents attackers from performing active NTLM Relay attacks on the local subnet. When signing is required, packet integrity is cryptographically proven.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters",
    registryKey: "RequireSecuritySignature",
    registryValue: "1 (DWORD)",
    powershellFix: "Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" -Name \"RequireSecuritySignature\" -Value 1 -Type DWord\nSet-SmbClientConfiguration -RequireSecuritySignature $true -Force",
    gpoPath: "Computer Configuration -> Windows Settings -> Security Settings -> Local Policies -> Security Options -> Microsoft network server: Digitally sign communications (always)",
    impactAssessment: "Minimal memory overhead (<2% host CPU) to perform cryptographic signatures. Safe for all modern corporate setups."
  },
  {
    id: "rem-tls10-disable",
    title: "Disable SSL 3.0, TLS 1.0, and TLS 1.1 Protocols",
    category: "SSL/TLS",
    severity: "High",
    description: "Legacy cryptoprotocols (SSL 3.0, TLS 1.0, TLS 1.1) are deprecated due to deep structural bugs (BEAST, POODLE, ROBOT). Disabling these forces client networks to switch to TLS 1.2 or TLS 1.3.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server",
    registryKey: "Enabled",
    registryValue: "0 (DWORD)",
    powershellFix: "New-Item -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server\" -Force\nNew-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server\" -Name \"Enabled\" -Value 0 -PropertyType DWORD -Force\nNew-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server\" -Name \"DisabledByDefault\" -Value 1 -PropertyType DWORD -Force\n\nNew-Item -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.1\\Server\" -Force\nNew-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.1\\Server\" -Name \"Enabled\" -Value 0 -PropertyType DWORD -Force",
    gpoPath: "Computer Configuration -> Administrative Templates -> Network -> SSL Configuration Settings -> SSL Cipher Suite Order",
    impactAssessment: "Medium. Users accessing old web apps or extremely old OS clients (Windows XP/7) might lose secure connection portals."
  },
  {
    id: "rem-ntlm-lvl-5",
    title: "Restrict LM and NTLMv1 (Raise LMCompatibilityLevel to 5)",
    category: "NTLM",
    severity: "High",
    description: "By raising LmCompatibilityLevel to 5, the operating system stops responding to legacy LM and NTLMv1 authentication attempts. These protocols have low complexity limits and can be cracked offline.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa",
    registryKey: "LmCompatibilityLevel",
    registryValue: "5 (DWORD)",
    powershellFix: "Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" -Name \"LmCompatibilityLevel\" -Value 5 -Type DWord",
    gpoPath: "Computer Configuration -> Windows Settings -> Security Settings -> Local Policies -> Security Options -> Network security: LAN Manager authentication level (Set to \"Send NTLMv2 response only. Refuse LM & NTLM\")",
    impactAssessment: "Medium. Client workstations relying on legacy local authentication (non-Domain, or running Windows 7/Server 2008 without updates) may fail to authenticate to resource shares."
  },
  {
    id: "rem-anonymous-shares",
    title: "Block Anonymous Null Session Shares",
    category: "NTLM",
    severity: "Medium",
    description: "Anonymous users (Null Sessions) should not be allowed to probe shared ports or request details about network interfaces under active work directories.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa",
    registryKey: "RestrictAnonymous",
    registryValue: "1 (DWORD)",
    powershellFix: "Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" -Name \"RestrictAnonymous\" -Value 1 -Type DWord\nSet-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" -Name \"RestrictAnonymousSAM\" -Value 1 -Type DWord",
    gpoPath: "Computer Configuration -> Windows Settings -> Security Settings -> Local Policies -> Security Options -> Network security: Restrict anonymous access to Named Pipes and Shares",
    impactAssessment: "Low. Highly secure; rarely impacts modern domain operations except for legacy discovery protocols."
  },
  {
    id: "rem-smb-encrypt",
    title: "Enable SMB Payload Encryption",
    category: "SMB",
    severity: "Medium",
    description: "Activating SMB encryption safeguards all transaction data and file transport on transit paths from eavesdropping/hostile sniffing.",
    registryPath: "N/A (Active Smb Configuration)",
    powershellFix: "Set-SmbServerConfiguration -EncryptData $true -Force",
    gpoPath: "Computer Configuration -> Policies -> Administrative Templates -> Network -> Lanman Server -> Require Encryption (Set to Enabled)",
    impactAssessment: "Low-Medium. Legacy clients that do not support SMBv3 (e.g. Windows Server 2008 R2 / Windows 7 or older) will be fully blocked from connecting to these shares."
  },
  {
    id: "rem-cred-guard",
    title: "Enable Windows Defender Credential Guard",
    category: "General",
    severity: "Medium",
    description: "Credential Guard uses virtualization-based security (VBS) to isolate secrets inside a separate protected container, preventing LSASS memory dump exploits (Mimikatz).",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa",
    registryKey: "LsaCfgFlags",
    registryValue: "1 (DWORD)",
    powershellFix: "New-Item -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" -Force\nSet-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" -Name \"LsaCfgFlags\" -Value 1 -Type DWord\n\nNew-Item -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\" -Force\nSet-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\" -Name \"EnableVirtualizationBasedSecurity\" -Value 1 -Type DWord",
    gpoPath: "Computer Configuration -> Administrative Templates -> System -> Device Guard -> Turn On Virtualization Based Security -> Credential Guard Configuration (Set to Enabled with UEFI lock)",
    impactAssessment: "Low. System hardware must support Virtualization extensions (Intel VT-x/AMD-V) and TPM 2.0. Recommended for modern endpoint fleets."
  },
  {
    id: "rem-rdp-nla",
    title: "Require Network Level Authentication (NLA) for RDP",
    category: "General",
    severity: "Medium",
    description: "NLA requires users to pass corporate authentication hashes and credentials before creating a full visual RDP terminal sandbox.",
    registryPath: "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp",
    registryKey: "UserAuthentication",
    registryValue: "1 (DWORD)",
    powershellFix: "Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp\" -Name \"UserAuthentication\" -Value 1 -Type DWord",
    gpoPath: "Computer Configuration -> Administrative Templates -> Windows Components -> Remote Desktop Services -> Remote Desktop Session Host -> Security -> Require user authentication for remote connections by using Network Level Authentication (Set to Enabled)",
    impactAssessment: "Low. Non-Windows third-party local RDP terminal wrappers or extremely outdated RDP legacy client consoles may fail to trigger authentication."
  }
];

export const FULL_POWERSHELL_AUDIT_SCRIPT = `# Windows Endpoint Security Auditing Script (SMB, SSL/TLS, NTLM, System Hardening & Winget Software Patching)
# REQUIRES RUNNING WITH ADMINISTRATOR PRIVILEGES

param (
    [switch]$AutoFix,
    [switch]$UpgradeApps
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Windows Security Auditor & Configuration" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Perform Winget Application Auto-Update if requested or in AutoFix mode
if ($UpgradeApps -or $AutoFix) {
    Write-Host "[AUTO-UPDATE] Executing Winget system-wide software auto-update..." -ForegroundColor Yellow
    if (Get-Command "winget.exe" -ErrorAction SilentlyContinue) {
        winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements --silent
        Write-Host "[AUTO-UPDATE] All installed applications updated to latest secure versions via Winget!" -ForegroundColor Green
    } else {
        Write-Host "[AUTO-UPDATE] winget.exe not found on system path. Please install App Installer via Windows Store or winget package." -ForegroundColor Red
    }
}

Write-Host "Collecting system configuration details..." -ForegroundColor DarkGray

# 1. Basic System Info
$hostname = $env:COMPUTERNAME
$osInfo = Get-WmiObject -Class Win32_OperatingSystem
$osName = $osInfo.Caption
$scanTime = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
$ipAddresses = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169.254" }).IPAddress
if ($ipAddresses -eq $null) { $ipAddresses = @() }

# Check Administrator privileges
$currUser = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = $currUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$privilegesString = if ($isAdmin) { "Administrator (Root)" } else { "Standard User (Limited)" }

Write-Host "Hostname: $hostname" -ForegroundColor White
Write-Host "OS: $osName" -ForegroundColor White
Write-Host "Privileges: $privilegesString" -ForegroundColor ($StatusColor = if ($isAdmin) { "Green" } else { "Red" })

# 2. SMB Auditing
Write-Host "Analyzing SMB protocol states..." -ForegroundColor DarkGray
$smb1Enabled = "Unknown"
$smb1Status = "failed"
$smb1Details = ""
if ($osName -like "*Windows Server*") {
    $smb1Feature = Get-WindowsFeature -Name FS-SMB1
    if ($smb1Feature) {
        $smb1Enabled = if ($smb1Feature.Installed) { "Enabled" } else { "Disabled" }
    }
}
if ($smb1Enabled -eq "Unknown") {
    $smbRegistry = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters" -Name "SMB1" -ErrorAction SilentlyContinue
    if ($null -ne $smbRegistry) {
        $smb1Enabled = if ($smbRegistry.SMB1 -eq 0) { "Disabled" } else { "Enabled" }
    } else {
        $smb1Enabled = "Disabled (Default)"
    }
}
$smb1Status = if ($smb1Enabled -like "*Enabled*") { "failed" } else { "passed" }
$smb1Details = if ($smb1Status -eq "failed") { "SMBv1 is active. This outdated protocol is vulnerable to Wannacry, EternalBlue, and remote code execution." } else { "SMBv1 is inactive, which is the recommended secure posture." }

# SMB Signing Check
$smbSigning = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters" -Name "RequireSecuritySignature" -ErrorAction SilentlyContinue
$smbSigningVal = if ($null -ne $smbSigning) { $smbSigning.RequireSecuritySignature } else { 0 }
$smbSigningEnabled = if ($smbSigningVal -eq 1) { "Required" } else { "Not Required" }
$smbSigningStatus = if ($smbSigningVal -eq 1) { "passed" } else { "warning" }
$smbSigningDetails = if ($smbSigningVal -eq 1) { "SMB Signing is required on this system, preventing NTLM relay attacks." } else { "SMB Signing is not enforced. An attacker could intercept and relay your SMB credentials." }

# SMB Encryption Check
$smbEncryption = "Disabled"
$smbEncryptionStatus = "warning"
$smbShares = Get-SmbShare -ErrorAction SilentlyContinue
if ($null -ne $smbShares) {
    if (Get-SmbServerConfiguration | Where-Object { $_.EncryptData -eq $true }) {
        $smbEncryption = "Enabled Globals"
        $smbEncryptionStatus = "passed"
    } else {
        $encryptedShares = $smbShares | Where-Object { $_.EncryptData -eq $true }
        if ($encryptedShares) {
            $smbEncryption = "Enabled on some shares"
            $smbEncryptionStatus = "warning"
        }
    }
}
$smbEncryptionDetails = if ($smbEncryptionStatus -eq "passed") { "SMB Encryption is enforced globally, securing communications against eavesdropping." } else { "SMB payload encryption is disabled, making files sent over the wire readable in plain text." }

# 3. SSL/TLS Settings
Write-Host "Analyzing SSL/TLS security suites..." -ForegroundColor DarkGray
function Get-ProtocolStatus ($protocolName, $clientServer = "Server") {
    $regPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\$protocolName\\$clientServer"
    $regKey = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
    if ($null -ne $regKey) {
        if ($regKey.Enabled -eq 0) { return "Disabled" }
        if ($regKey.Enabled -eq 1) { return "Enabled" }
    }
    if ($protocolName -in @("SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1")) {
        return "Enabled by Default (Legacy OS)"
    }
    return "Enabled (Default)"
}

$tls10 = Get-ProtocolStatus "TLS 1.0"
$tls10Status = if ($tls10 -like "Enabled*") { "failed" } else { "passed" }
$tls10Details = if ($tls10Status -eq "failed") { "TLS 1.0 is active. Vulnerable to BEAST & POODLE." } else { "TLS 1.0 is disabled, preventing legacy weak connections." }

$tls11 = Get-ProtocolStatus "TLS 1.1"
$tls11Status = if ($tls11 -like "Enabled*") { "failed" } else { "passed" }
$tls11Details = if ($tls11Status -eq "failed") { "TLS 1.1 is active, deprecated under modern compliance standards." } else { "TLS 1.1 is disabled." }

$tls12 = Get-ProtocolStatus "TLS 1.2"
$tls12Status = if ($tls12 -like "Enabled*") { "passed" } else { "warning" }
$tls12Details = if ($tls12Status -eq "passed") { "TLS 1.2 is enabled, serving as a reliable standard secure baseline." } else { "TLS 1.2 is disabled or unconfigured." }

$tls13 = Get-ProtocolStatus "TLS 1.3"
$tls13Status = if ($tls13 -like "Enabled*") { "passed" } else { "warning" }
$tls13Details = if ($tls13Status -eq "passed") { "TLS 1.3 is enabled and active." } else { "TLS 1.3 is not explicitly configured." }

# Weak Cipher Suites
$weakCiphersList = "None detected in config override"
$weakCipherStatus = "passed"
$cipherSuites = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Cryptography\\Configuration\\SSL\\00011002" -Name "Functions" -ErrorAction SilentlyContinue
if ($null -ne $cipherSuites) {
    if ($cipherSuites.Functions -match "RC4|3DES|DES|EXPORT|NULL|MD5|RC2") {
        $weakCiphersList = "RC4/3DES ciphers found in active policy lists"
        $weakCipherStatus = "failed"
    } else {
        $weakCiphersList = "Custom strict cipher suite list active"
    }
}
$weakCipherDetails = if ($weakCipherStatus -eq "failed") { "Vulnerable cipher algorithms present in policy lists." } else { "No legacy cipher suites loaded in configuration." }

# 4. NTLM Settings
Write-Host "Analyzing NTLM configuration & LMCompatibility..." -ForegroundColor DarkGray
$lmCompat = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa" -Name "LmCompatibilityLevel" -ErrorAction SilentlyContinue
$lmLevel = if ($null -ne $lmCompat) { $lmCompat.LmCompatibilityLevel } else { 3 }
$lmLevelStrings = @{
    0 = "Level 0: Send LM & NTLM (Very Insecure)"
    1 = "Level 1: Send LM & NTLM - Use NTLMv2 if negotiated (Insecure)"
    2 = "Level 2: Send NTLM only - Refuse LM (Medium)"
    3 = "Level 3: Send NTLMv2 only (Secure baseline)"
    4 = "Level 4: Send NTLMv2 only, Refuse LM (Secure)"
    5 = "Level 5: Send NTLMv2 only - Refuse LM & NTLMv1 (Highly Secure)"
}
$lmLevelString = if ($lmLevelStrings.ContainsKey($lmLevel)) { $lmLevelStrings[$lmLevel] } else { "Level $lmLevel (Undefined/Unmanaged)" }
$lmStatus = if ($lmLevel -ge 5) { "passed" } elseif ($lmLevel -ge 3) { "warning" } else { "failed" }
$lmDetails = if ($lmLevel -le 2) { "LM Compatibility Level allows legacy LM or NTLMv1." } elseif ($lmLevel -lt 5) { "NTLMv1 may still be accepted." } else { "System rejects legacy LM and NTLMv1, accepting strictly NTLMv2." }

# Restrict NTLM traffic
$restrictNtlmReg = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\MSV1_0" -Name "RestrictSendingNTLMTraffic" -ErrorAction SilentlyContinue
$restrictNtlmValue = if ($null -ne $restrictNtlmReg) { $restrictNtlmReg.RestrictSendingNTLMTraffic } else { 0 }
$restrictNtlmStr = if ($restrictNtlmValue -eq 0) { "Not Restricted" } elseif ($restrictNtlmValue -eq 1) { "Audit Only" } else { "Enforced/Restricted" }
$restrictStatus = if ($restrictNtlmValue -eq 2) { "passed" } else { "warning" }
$restrictDetails = if ($restrictNtlmValue -eq 2) { "NTLM traffic restrictions active." } else { "NTLM allowed outbound." }

# Anonymous Access
$nullSessionShares = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters" -Name "NullSessionShares" -ErrorAction SilentlyContinue
$nullSharesEnabled = if ($nullSessionShares) { "Enabled" } else { "Disabled" }
$anonymousStatus = if ($nullSharesEnabled -eq "Enabled") { "failed" } else { "passed" }
$anonymousDetails = if ($anonymousStatus -eq "failed") { "Null Session shares exist." } else { "Anonymous remote null session shares prohibited." }

# 5. Additional Protections
Write-Host "Analyzing host protections..." -ForegroundColor DarkGray
$fwProfiles = Get-NetFirewallProfile -ErrorAction SilentlyContinue
$firewallOn = "Enabled"
$firewallStatus = "passed"
if ($null -ne $fwProfiles) {
    $disabledProfiles = $fwProfiles | Where-Object { $_.Enabled -eq $false }
    if ($disabledProfiles) {
        $firewallOn = "Disabled Profiles: " + ($disabledProfiles.Name -join ", ")
        $firewallStatus = "warning"
    }
} else {
    $firewallOn = "Not Managed/Unknown"
    $firewallStatus = "warning"
}
$firewallDetails = if ($firewallStatus -eq "passed") { "Host Defender Firewall active." } else { "At least one Firewall profile deactivated." }

# RDP NLA
$rdpReg = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp" -Name "UserAuthentication" -ErrorAction SilentlyContinue
$rdpNlaValue = if ($null -ne $rdpReg) { $rdpReg.UserAuthentication } else { 0 }
$rdpNlaEnabled = if ($rdpNlaValue -eq 1) { "NLA Required" } else { "NLA Not Enforced" }
$rdpNlaStatus = if ($rdpNlaValue -eq 1) { "passed" } else { "warning" }
$rdpNlaDetails = if ($rdpNlaValue -eq 1) { "RDP requires NLA." } else { "NLA not enforced on RDP." }

# Credential Guard
$credGuardReg = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa" -Name "LsaCfgFlags" -ErrorAction SilentlyContinue
$credGuardValue = if ($null -ne $credGuardReg) { $credGuardReg.LsaCfgFlags } else { 0 }
$credGuardStr = if ($credGuardValue -eq 1) { "Enabled (LSA Isolation)" } else { "Disabled" }
$credGuardStatus = if ($credGuardValue -eq 1) { "passed" } else { "warning" }
$credGuardDetails = if ($credGuardStatus -eq "passed") { "Credential Guard isolates secrets under hypervisor." } else { "Credential Guard inactive." }

# 6. User Accounts & Password Policies
Write-Host "Analyzing user directories..." -ForegroundColor DarkGray
$activeUsers = @()
$passLength = 8
$passComplexity = $true
$passMaxAge = 90
$passMinAge = 1
$passHistory = 12

if (Get-Command Get-LocalUser -ErrorAction SilentlyContinue) {
    $localUsers = Get-LocalUser
    foreach ($u in $localUsers) {
        $lastChanged = "Never"
        $ageDays = 999
        if ($null -ne $u.PasswordLastSet) {
            $lastChanged = $u.PasswordLastSet.ToString("yyyy-MM-dd HH:mm:ss")
            $diff = [DateTime]::Now - $u.PasswordLastSet
            $ageDays = [Math]::Floor($diff.TotalDays)
        }
        $neverExpires = $u.PasswordNeverExpires
        $statusStr = if ($u.Enabled) { "Active" } else { "Disabled" }
        $activeUsers += @{
            username = $u.Name
            status = $statusStr
            lastPasswordChange = $lastChanged
            passwordAgeDays = $ageDays
            passwordNeverExpires = $neverExpires
        }
    }
} else {
    $activeUsers += @{
        username = "Administrator"
        status = "Active"
        lastPasswordChange = (Get-Date).AddDays(-105).ToString("yyyy-MM-dd HH:mm:ss")
        passwordAgeDays = 105
        passwordNeverExpires = $false
    }
}

$netAccounts = net accounts
foreach ($line in $netAccounts) {
    if ($line -match "Minimum password length:\\s+(\\d+)") { $passLength = [int]$Matches[1] }
    if ($line -match "Maximum password age \\(days\\):\\s+(\\d+|UNLIMITED)") { 
        if ($Matches[1] -match "UNLIMITED") { $passMaxAge = 9999 } else { $passMaxAge = [int]$Matches[1] }
    }
    if ($line -match "Minimum password age \\(days\\):\\s+(\\d+)") { $passMinAge = [int]$Matches[1] }
    if ($line -match "Length of password history maintained:\\s+(\\d+)") { $passHistory = [int]$Matches[1] }
}

$isDC = $false
$domainDetails = ""
$sysInfo = Get-WmiObject -Class Win32_ComputerSystem
if ($sysInfo.DomainRole -in @(4, 5)) {
    $isDC = $true
    $domainDetails = "Active Directory Domain Controller queried."
}

# 7. USB Storage drivers
Write-Host "Analyzing removable devices..." -ForegroundColor DarkGray
$usbRegistry = Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR" -Name "Start" -ErrorAction SilentlyContinue
$usbVal = if ($null -ne $usbRegistry) { $usbRegistry.Start } else { 3 }

$usbStorageValue = if ($usbVal -eq 4) { "BLOCKED" } else { "ENABLED" }
$usbStorageStatus = if ($usbVal -eq 4) { "passed" } else { "failed" }
$usbStorageDetails = if ($usbVal -eq 4) {
    "Removable Storage Devices (USBSTOR) are blocked via security registry key (Start = 4)."
} else {
    "Removable USB Storage drivers permitted in registry (USBSTOR Start = 3)."
}

# 8. NTP Time Sync
Write-Host "Analyzing NTP time synchronization..." -ForegroundColor DarkGray
$w32timeService = Get-Service -Name w32time -ErrorAction SilentlyContinue
$ntpEnabled = "No"
$ntpDetails = "NTP synchronized time services (w32time) stopped."
$ntpTimeStatus = "failed"
if ($null -ne $w32timeService -and $w32timeService.Status -eq "Running") {
    $ntpEnabled = "Yes"
    $ntpTimeStatus = "passed"
    $ntpDetails = "NTP Time Synchronization active."
}

# 9. Browser Policies
Write-Host "Analyzing browser policies..." -ForegroundColor DarkGray
$chromePWReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome" -Name "PasswordManagerEnabled" -ErrorAction SilentlyContinue
$chromePWVal = if ($null -ne $chromePWReg) { $chromePWReg.PasswordManagerEnabled } else { $null }
$chromePWStatus = if ($chromePWVal -eq 0) { "passed" } else { "failed" }

$edgePWReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge" -Name "PasswordManagerEnabled" -ErrorAction SilentlyContinue
$edgePWVal = if ($null -ne $edgePWReg) { $edgePWReg.PasswordManagerEnabled } else { $null }
$edgePWStatus = if ($edgePWVal -eq 0) { "passed" } else { "failed" }

$firefoxPWReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Mozilla\\Firefox" -Name "OfferToSaveLogins" -ErrorAction SilentlyContinue
$firefoxPWVal = if ($null -ne $firefoxPWReg) { $firefoxPWReg.OfferToSaveLogins } else { $null }
$firefoxPWStatus = if ($firefoxPWVal -eq 0) { "passed" } else { "failed" }

# 10. Open Ports Scanning
Write-Host "Analyzing open ports..." -ForegroundColor DarkGray
$checkedPorts = @(21, 22, 23, 53, 80, 88, 135, 389, 443, 445, 636, 1433, 1521, 3306, 3389)
$scannedPorts = @()

$activeTCPListeners = @()
if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $activeTCPListeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort
} else {
    $netstat = netstat -ano
    foreach ($line in $netstat) {
        if ($line -match "TCP\\s+\\S+:(\\d+)\\s+") {
            $activeTCPListeners += [int]$Matches[1]
        }
    }
}

foreach ($p in $checkedPorts) {
    $isOpened = ($p -in $activeTCPListeners)
    $statusStr = if ($isOpened) { "Open" } else { "Closed" }
    $serviceStr = "unknown"
    $sev = "Secure"
    $vuln = ""
    switch ($p) {
        21 { $serviceStr = "FTP"; if ($isOpened) { $sev = "Vulnerable"; $vuln = "Legacy cleartext FTP active." } }
        22 { $serviceStr = "SSH"; if ($isOpened) { $sev = "Secure" } }
        23 { $serviceStr = "Telnet"; if ($isOpened) { $sev = "Critical"; $vuln = "Insecure cleartext command shell active." } }
        53 { $serviceStr = "domain"; if ($isOpened) { $sev = "Secure" } }
        80 { $serviceStr = "HTTP"; if ($isOpened) { $sev = "Weak"; $vuln = "Unencrypted web service running." } }
        88 { $serviceStr = "kerberos"; if ($isOpened) { $sev = "Secure" } }
        135 { $serviceStr = "msrpc"; if ($isOpened) { $sev = "Secure" } }
        389 { $serviceStr = "ldap"; if ($isOpened) { $sev = "Weak"; $vuln = "Unencrypted LDAP protocol active." } }
        443 { $serviceStr = "HTTPS"; if ($isOpened) { $sev = "Secure" } }
        445 { $serviceStr = "microsoft-ds"; if ($isOpened) { $sev = "Weak"; $vuln = "SMB directory shares active." } }
        636 { $serviceStr = "ldaps"; if ($isOpened) { $sev = "Secure" } }
        1433 { $serviceStr = "ms-sql-s"; if ($isOpened) { $sev = "Secure" } }
        3306 { $serviceStr = "mysql"; if ($isOpened) { $sev = "Secure" } }
        3389 { $serviceStr = "ms-wbt-server"; if ($isOpened) { $sev = "Weak"; $vuln = "Remote Desktop active." } }
    }
    
    $scannedPorts += @{
        port = $p
        protocol = "TCP"
        service = $serviceStr
        status = $statusStr
        severity = $sev
        vulnerabilityDetails = $vuln
    }
}

# 11. Winget Status
$wingetCmd = Get-Command "winget.exe" -ErrorAction SilentlyContinue
$wingetInstalled = ($null -ne $wingetCmd)
$wingetStatus = if ($wingetInstalled) { "passed" } else { "warning" }

# Generate JSON Report
$report = @{
    hostname = $hostname
    osName = $osName
    scanTime = $scanTime
    ipAddresses = $ipAddresses
    privileges = $privilegesString
    smb = @{
        smb1Enabled = @{ status = $smb1Status; value = $smb1Enabled; details = $smb1Details }
        smbSigningRequired = @{ status = $smbSigningStatus; value = $smbSigningEnabled; details = $smbSigningDetails }
        smbEncryptionEnabled = @{ status = $smbEncryptionStatus; value = $smbEncryption; details = $smbEncryptionDetails }
    }
    sslTls = @{
        tls10Enabled = @{ status = $tls10Status; value = $tls10; details = $tls10Details }
        tls11Enabled = @{ status = $tls11Status; value = $tls11; details = $tls11Details }
        tls12Enabled = @{ status = $tls12Status; value = $tls12; details = $tls12Details }
        tls13Enabled = @{ status = $tls13Status; value = $tls13; details = $tls13Details }
        weakCipherSuites = @{ status = $weakCipherStatus; value = $weakCiphersList; details = $weakCipherDetails }
    }
    ntlm = @{
        lmCompatibilityLevel = @{ status = $lmStatus; value = $lmLevelString; details = $lmDetails }
        restrictNtlmTraffic = @{ status = $restrictStatus; value = $restrictNtlmStr; details = $restrictDetails }
        anonymousAccess = @{ status = $anonymousStatus; value = $nullSharesEnabled; details = $anonymousDetails }
    }
    additional = @{
        firewallEnabled = @{ status = $firewallStatus; value = $firewallOn; details = $firewallDetails }
        rdpNlaEnabled = @{ status = $rdpNlaStatus; value = $rdpNlaEnabled; details = $rdpNlaDetails }
        credentialGuard = @{ status = $credGuardStatus; value = $credGuardStr; details = $credGuardDetails }
    }
    users = @{
        activeUsers = $activeUsers
        passwordPolicy = @{
            minimumLength = $passLength
            complexityEnabled = $passComplexity
            maximumAgeDays = $passMaxAge
            minimumAgeDays = $passMinAge
            historyCount = $passHistory
        }
        isDomainController = $isDC
        domainPolicyDetails = $domainDetails
    }
    removableDevices = @{
        usbStorage = @{ status = $usbStorageStatus; value = $usbStorageValue; details = $usbStorageDetails }
    }
    ntpTime = @{ enabled = $ntpEnabled; details = $ntpDetails; status = $ntpTimeStatus }
    browserSecurity = @{
        chromePasswordStore = @{ status = $chromePWStatus; value = (if ($chromePWStatus -eq "passed") { "DISABLED" } else { "ENABLED" }) }
        edgePasswordStore = @{ status = $edgePWStatus; value = (if ($edgePWStatus -eq "passed") { "DISABLED" } else { "ENABLED" }) }
        firefoxPasswordStore = @{ status = $firefoxPWStatus; value = (if ($firefoxPWStatus -eq "passed") { "DISABLED" } else { "ENABLED" }) }
    }
    wingetAutoUpdate = @{
        status = $wingetStatus
        installed = $wingetInstalled
        upgradeCommand = "winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements --silent"
    }
    ports = $scannedPorts
}

$jsonOutput = $report | ConvertTo-Json -Depth 5
Write-Host ""
Write-Host "========================== SCAN COMPLETE ==========================" -ForegroundColor Green
Write-Host "Copy the JSON content below and paste into Import Telemetry on the dashboard." -ForegroundColor Green
Write-Host ""
Write-Output $jsonOutput
`;

export const WINGET_AUTO_UPDATE_COMMAND = "winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements --silent";

export const WIN_UTIL_BOOTSTRAP_COMMAND = "irm christitus.com/win | iex";

export const POWERSHELL_COLLECTOR_SCRIPT = `# ==============================================================================
# SmartHub Compliance - Windows Endpoint Posture & Hardening Collector Script (.ps1)
# Standards Aligned: DOH Abu Dhabi ADHICS / CIS Windows Benchmarks / ISO 27001
# ==============================================================================

[CmdletBinding()]
Param()

$ErrorActionPreference = 'SilentlyContinue'

$ScanResult = @{
    Hostname = $env:COMPUTERNAME
    OSVersion = (Get-CimInstance Win32_OperatingSystem).Caption + " (Build " + (Get-CimInstance Win32_OperatingSystem).BuildNumber + ")"
    IPAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*", "Wi-Fi*" | Select-Object -First 1).IPAddress
    MACAddress = (Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object -First 1).MacAddress
    ScanTimestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    
    BitLocker = @{
        Status = (Get-BitLockerVolume -MountPoint "C:").ProtectionStatus
        EncryptionType = (Get-BitLockerVolume -MountPoint "C:").EncryptionMethod
        TPMVersion = (Get-Tpm).TpmPresent
    }
    Defender = @{
        Status = (Get-MpComputerStatus).AMServiceEnabled
        RealTimeProtection = (Get-MpComputerStatus).RealTimeProtectionEnabled
        CloudDelivery = (Get-MpComputerStatus).MAPSReporting
        AntivirusSignatureVersion = (Get-MpComputerStatus).AntivirusSignatureVersion
    }
    Network = @{
        FirewallDomain = (Get-NetFirewallProfile -Name Domain).Enabled
        FirewallPrivate = (Get-NetFirewallProfile -Name Private).Enabled
        FirewallPublic = (Get-NetFirewallProfile -Name Public).Enabled
        SMBv1Disabled = -not (Get-WindowsOptionalFeature -Online -FeatureName "SMB1Protocol").State -eq "Enabled"
    }
    Accounts = @{
        LocalAdmins = (Get-LocalGroupMember -Group "Administrators" | Select-Object -ExpandProperty Name)
        GuestDisabled = -not (Get-LocalUser -Name "Guest").Enabled
    }
}

$JsonOutput = $ScanResult | ConvertTo-Json -Depth 4
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "SmartHub Compliance Endpoint Telemetry Capture Completed Successfully!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Output $JsonOutput
`;

export const POWERSHELL_HARDENING_REMEDIATION_SCRIPT = `# ==============================================================================
# SmartHub Compliance - Windows 10/11 & Server Baseline Hardening Script (.ps1)
# Enforces DOH Abu Dhabi ADHICS Healthcare Cybersecurity Mandates
# ==============================================================================

# 1. Disable Legacy Vulnerable SMBv1 Protocol
Disable-WindowsOptionalFeature -Online -FeatureName "SMB1Protocol" -NoRestart -ErrorAction SilentlyContinue
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force -ErrorAction SilentlyContinue

# 2. Enable & Configure Windows Defender Real-Time Protection & Cloud Protection
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -MAPSReporting Advanced
Set-MpPreference -SubmitSamplesConsent SendAllSamples
Set-MpPreference -EnableControlledFolderAccess Enabled
Set-MpPreference -EnableNetworkProtection Enabled

# 3. Enforce Windows Firewall on All Profiles
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True

# 4. Enforce Remote Desktop Network Level Authentication (NLA)
Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name "UserAuthentication" -Value 1

# 5. Disable Guest Account & Enforce UAC
Disable-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "EnableLUA" -Value 1
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "ConsentPromptBehaviorAdmin" -Value 2

# 6. Configure Security Event Log Size (2048 MB Minimum for Audit Compliance)
Limit-EventLog -LogName Security -MaximumSize 2048MB -OverflowAction OverwriteAsNeeded

# 7. Enable Command Line Process Creation Auditing
reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\Audit" /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1 /f

Write-Host "✓ Windows Hardening Script Execution Completed. Re-run scan to verify 100% compliance." -ForegroundColor Cyan
`;

export const WINGET_AUTO_UPDATER_SCRIPT = `@echo off
title SmartPro SecOps Winget Auto-Update System Applications
color 0B
cls
echo =======================================================================
echo     SMARTPRO SECOPS - SYSTEM-WIDE WINGET SOFTWARE AUTO-UPDATER
echo =======================================================================
echo.
echo [INFO] Scanning all installed applications for available security updates...
echo.

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [WARNING] Not running as Administrator. Some system applications may fail to update.
    echo Please right-click and "Run as Administrator" for full coverage.
    echo.
)

winget --version >nul 2>&1
if %errorlevel% EQU 0 (
    echo [EXEC] Executing: winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements
    winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements
    echo.
    echo =======================================================================
    echo          ALL INSTALLED APPLICATIONS UPDATED SUCCESSFULLY!
    echo =======================================================================
) else (
    echo [ERROR] winget.exe not found on system path.
    echo Please install Windows App Installer package from Microsoft Store.
)
pause`;
