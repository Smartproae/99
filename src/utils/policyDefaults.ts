/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PolicyDefaults {
  objective: string;
  scope: string;
  resp_it_manager: string;
  resp_md: string;
  resp_all_users: string;
  policy_statement: string;
  core_principles: string;
  compliance_disciplinary: string;
  compliance_clarifications: string;
  compliance_checks: string;
  compliance_exceptions: string;
}

export function getPolicyTemplateDefaults(policyNo: string, clientName: string = '[Entity Name]', policyTitle: string = ''): PolicyDefaults {
  const defaults: PolicyDefaults = {
    objective: '',
    scope: '',
    resp_it_manager: '',
    resp_md: '',
    resp_all_users: '',
    policy_statement: '',
    core_principles: '',
    compliance_disciplinary: '',
    compliance_clarifications: '',
    compliance_checks: '',
    compliance_exceptions: ''
  };

  const normNo = (policyNo || '').toUpperCase().trim();
  const normTitle = (policyTitle || '').toLowerCase().trim();
  const entity = clientName && clientName !== '[Entity Name]' ? clientName : 'SmartPro Public Relations Consultancy & Cyber Risk Management Services';

  if (normNo === 'POL-SEC-031' || normNo === 'POL-DOC-001' || normTitle.includes('control of documentation') || normTitle.includes('documentation control')) {
    defaults.objective = `The purpose of this procedure is to establish a systematic and controlled approach for the creation, review, approval, distribution, revision, retention, and disposal of internal and external documents within the facility. This ensures compliance with applicable regulatory requirements, accreditation standards, and quality management system (QMS) objectives.`;
    
    defaults.scope = `This procedure applies to all documents related to ${clientName} – Medical Center & Pharmacy, including administrative, clinical, non-clinical, electronic, and external regulatory documents.

Internal Documents:
• Policies and procedures
• Clinical and non-clinical forms
• Guidelines and manuals
• Patient medical records
• Quality records and reports
• Electronic documents and system-generated records

External Documents:
• DOH / MOH circulars and advisories
• Regulatory standards and guidelines
• Laws, decrees, and resolutions
• Public circulars and notices
• Vendor manuals and equipment documentation
• External audit and accreditation standards`;

    defaults.resp_it_manager = `• Department Heads: Maintain updated and accessible versions of department-specific documents.`;
    
    defaults.resp_md = `• Managing Director: Overall responsibility for document control and enforcement of the procedure.
• Manager: Ensures compliance with document control procedures and reports discrepancies.`;
    
    defaults.resp_all_users = `• All Employees: Use and refer only to the latest approved versions.`;
    
    defaults.policy_statement = `### DOCUMENT REFERENCE

Company Name: ${clientName}

### DOCUMENT CREATION AND APPROVAL
• Authorized personnel shall draft documents based on regulatory and operational needs.
• All documents must undergo review and approval by the Managing Director or assigned medical authority.
• Each document shall be assigned a unique identifier, including:
  o Document Code (e.g., HR-POL-003)
  o Version Number (e.g., V1.0, V2.0)
  o Effective Date

### VERSION CONTROL
o Version 1.0 – Initial Policy Release
o Version 1.1 – Policy Modification
o Version 1.1.1 – Minor Changes
o Version 2.0 – Full Revision

### DOCUMENT DISTRIBUTION AND ACCESSIBILITY
• Controlled copies shall be distributed to relevant departments in hard copy or electronically.
• Authorized personnel shall have centralized access via a Document Management System (DMS).
• Only latest versions shall be used for reference or operations.

#### Receipt and Distribution
External documents may be received via:
o Official email
o Regulatory portals
o Hard copy notifications

The Quality / Compliance Department shall:
o Register external documents
o Communicate applicable requirements to relevant departments
o Ensure implementation as per effective dates

#### Review and Applicability
• External documents shall be reviewed to determine applicability.
• Relevant actions, updates, or internal document revisions shall be initiated.

#### Control and Retention
• External documents shall be stored in a controlled folder or registry.
• Obsolete external documents shall be archived but clearly marked as Superseded.`;

    defaults.core_principles = `### DOCUMENT RETENTION AND DISPOSAL
• Documents shall be retained in accordance with UAE Federal Laws and DOH/MOH Guidelines.
• Disposal method:
  o Paper: Shredding
  o Digital: Secure deletion or degaussing

### TRAINING AND AWARENESS
• Training on this procedure will be part of:
  o New employee onboarding
  o Annual refresher training
• Training records shall be documented and auditable.

### CONTROL OF EXTERNAL DOCUMENTS
Identification of External Documents includes but is not limited to:
o DOH circulars (weekly)
o Regulatory standards and guidelines (monthly or as issued)
o Public circulars and announcements
o Laws, regulations, and official directives

### DOCUMENT CONTROL AUDITS
• Internal audits shall be conducted periodically to validate control effectiveness.
• Any non-conformance will be recorded and addressed through corrective actions.`;

    defaults.compliance_disciplinary = `To ensure proper handling, storage, and access control, all documents shall be classified according to their confidentiality level and identified by a color code on the document header or footer.

### Document Classification and Color Coding Table:

| Classification Level | Description |
|---|---|
| Secret | Highly sensitive information; access strictly limited to authorized management personnel only. Unauthorized disclosure could cause severe damage to the organization. |
| Confidential | Sensitive internal information; access restricted to relevant departments or authorized staff. |
| Restricted | Operational or departmental use only; not to be shared outside the organization. |
| Public | Approved for external distribution or public access; may be shared with third parties or posted on official channels. |`;

    defaults.compliance_clarifications = `• UAE Health Authority Document Retention Guidelines
• Federal Law No. 2 of 2019 – UAE Data Protection Law`;
    
    defaults.compliance_checks = `The Management reserves the right to audit document libraries and check document version compliance periodically.`;
    defaults.compliance_exceptions = `No exceptions are permitted to this procedure unless explicitly authorized in writing by the Managing Director.`;

  } else if (policyNo === 'POL-SEC-003' || policyNo === 'IT-POL-INFSEC-01') {
    // Information Asset Management and Classification Policy
    defaults.objective = `The objective of this policy is to establish a robust framework for the management, identification, and classification of all information assets within ${clientName}, defining appropriate levels of handling and protection to prevent unauthorized disclosure, alteration, or destruction in compliance with DOH standards and UAE Federal Laws.`;
    
    defaults.scope = `This policy applies to all information assets owned by, processed by, or leased to ${clientName}, including electronic data, hard-copy records, medical systems, software, and physical storage media. It applies to all employees, contractors, consultants, and third-party partners.`;
    
    defaults.resp_it_manager = `• Classify all identified corporate and health information assets in coordination with department heads.
• Maintain a comprehensive, up-to-date Information Asset Register.
• Implement technical and administrative security controls corresponding to designated classification levels.`;
    
    defaults.resp_md = `• Review and approve the Information Asset Register on an annual basis.
• Endorses classification levels and sanctions investigations into suspected asset leaks or classification breaches.`;
    
    defaults.resp_all_users = `• Handle all physical and digital information assets strictly in accordance with their designated classification levels.
• Seek prompt clarification from the IT Department or Information Security team if unsure about an asset's classification level.`;
    
    defaults.policy_statement = `### INFORMATION ASSETS HANDLING PROCEDURES

To ensure consistent safeguarding of all organizational data, ${clientName} classifies information assets into four distinct security levels, each requiring specific technical and administrative handling controls:

| Public | Restricted | Confidential | Secret |
|---|---|---|---|
| C100 M0 Y100 K0 | C100 M0 Y0 K0 | C0 M80 Y95 K0 | C0 M100 Y100 K0 |
| R0 G150 B64 | R0 G158 B227 | R232 G78 B27 | R227 G5 B19 |
| #009640 | #009EE3 | #E84E1B | #E30513 |
| GREEN | BLUE | ORANGE | RED |

### CLASSIFICATION AND COLOR CODING REFERENCE

| Classification Level | Representation | Color Hex |
|---|---|---|
| **Public** | Green | #009640 |
| **Restricted** | Blue | #009EE3 |
| **Confidential** | Orange | #E84E1B |
| **Secret** | Red | #E30513 |

#### DETAILED HANDLING REQUIREMENTS PER LEVEL

1. **PUBLIC (GREEN)**: Low-risk public-facing marketing material, public DOH directories, or approved informational brochures. No special confidentiality controls or encryption are required for this tier.
2. **RESTRICTED (BLUE)**: General internal business operational logs, non-sensitive communication, and standard operating procedures. Access is confined to verified personnel on an organizational or department-specific basis.
3. **CONFIDENTIAL (ORANGE)**: Sensitive clinical workflow details, vendor contracts, business operations, and financial transactions. Full encryption at rest (using AES-256 standards) and in transit (using TLS 1.3) is strictly mandated.
4. **SECRET (RED)**: Highest-risk proprietary clinical records, medical records under explicit investigation, patient health databases, and administrative keys. Requires continuous multi-factor authentication, strictly logged authorization chains, and deep telemetry auditing.`;
    
    defaults.core_principles = `• Unified Identification: All files, papers, databases, and physical components must be cataloged in the centralized Asset Register.
• Context-Based Access: Permissions to confidential or secret files are explicitly governed by job roles and need-to-know constraints.
• Safe Destruction: Physical and digital media containing restricted, confidential, or secret data must undergo shredded destruction or secure disk wiping.`;
    
    defaults.compliance_disciplinary = `Violations of asset classification protocols, including deliberate misclassification or leaking confidential/secret resources, will trigger immediate disciplinary action under the HR Code of Conduct and relevant federal statutes.`;
    defaults.compliance_clarifications = `For questions regarding file labels or asset declarations, contact the IT Department or the Quality Compliance Team.`;
    defaults.compliance_checks = `Regular compliance audits and asset inventory scans are performed semi-annually.`;
    defaults.compliance_exceptions = `Exclusions from the standard classification or labeling rules require formal authorization from the IT Manager and Managing Director.`;

  } else if (normNo === 'POL-SEC-001' || normTitle.includes('information security high level') || normTitle.includes('high level policy')) {
    // Information Security High Level Policy
    defaults.objective = `The objective of this policy is to outline the basic principles for protecting all information assets at ${entity}. It aims to make all users within the entity aware of potential security threats and associated business risks, ensuring compliance with DOH standards.`;
    
    defaults.scope = `This policy applies to all users of ${entity} including the Managing Director / Manager and IT Manager.`;
    
    defaults.resp_it_manager = `• Responsible for the development, maintenance, enforcement, and endorsement of this policy.
• Supports the relevant business units/sections in implementing defined controls and ensuring compliance with this policy.
• Conducts awareness sessions about the policy for all users.
• Reserves the right to check compliance with this policy on a periodic basis.`;
    
    defaults.resp_md = `• Responsible for compliance with this policy within their area(s) of concern.
• Endorses this policy to ensure its effective implementation across the facility.`;
    
    defaults.resp_all_users = `• Responsible for reading, understanding, and adhering to this policy in their daily activities.
• Expected to seek clarification or advice from the IT Manager if unsure about any aspect of this policy.`;
    
    defaults.policy_statement = `${entity} is committed to securing the confidentiality, integrity, and availability of information necessary for day-to-day business operations. The security of information and other assets is fundamental to the successful operation of the facility. This high-level data governance policy is a key component of the facility overall information security management framework and should be considered alongside specific and more detailed information security policies, procedures, standards, and guidelines.

Adherence to this policy will protect the data and information of ${entity} and its customers from security threats, whether internal or external, deliberate or accidental. The entity is committed to implementing detailed policies and procedures as needed.`;
    
    defaults.core_principles = `${entity} recognizes that secure operations depend on securing three core organizational elements: people, processes, and technology. All activities must adhere to the following general principles:

• Confidentiality, Integrity & Availability: Maintain the confidentiality, integrity, and availability of information and information assets.
• Compliance: Meet UAE regulatory, statutory, and legislative requirements.
• Incident Management: Report and investigate all suspected breaches of information security.
• Training & Awareness: Provide appropriate information security training and awareness to all employees, including permanent and contract employees.
• Controls & Procedures: Design and implement appropriate controls and procedures to support this information security policy.
• Stakeholder Responsibility: Ensure all stakeholders are responsible for implementing respective security policies and procedures within their area of operation and overseeing adherence by their team members.
• Continuous Improvement: Continually improve information security through the implementation of corrective and preventive actions.
• Business Continuity: Prepare, maintain, and test business continuity plans based on business needs.
• Policy Review: Annually review this policy for adequacy and appropriateness.`;
    
    defaults.compliance_disciplinary = `Any violation or breach of this policy may result in HR disciplinary procedures in accordance with UAE labor laws, the Code of Conduct for Employees, and other applicable UAE laws.`;
    
    defaults.compliance_clarifications = `Users should seek clarification or advice from the IT Manager if unsure about any part of this policy.`;
    
    defaults.compliance_checks = `The IT Manager reserves the right to periodically check compliance with this policy.`;
    
    defaults.compliance_exceptions = `Any exceptions to this policy with valid business justification require approval from the IT Manager on a case-by-case basis.`;

  } else if (normNo === 'M-POLICY-002' || normNo === 'POL-SEC-032' || normTitle.includes('statement of applicability')) {
    // Statement of Applicability
    defaults.objective = `The objective of this policy is to define the control objectives and security measures applicable to ${entity} under the Compliance Information Security Framework, mapping out control areas, specific objectives, and applicability status.`;
    
    defaults.scope = `This Statement of Applicability applies to all systems, physical infrastructure, networks, cloud environments, and personnel of ${entity}.`;
    
    defaults.resp_it_manager = `• Responsible for the development, maintenance, and periodic review of the Statement of Applicability.
• Ensures that applicable controls are integrated into the relevant standard operating procedures.`;
    
    defaults.resp_md = `• Responsible for reviewing and approving the applicability status and exclusions of specific controls.
• Backs the allocation of resources to implement the applicable control objectives.`;
    
    defaults.resp_all_users = `• Expected to adhere to the controls designated as applicable to their respective departments and roles.`;

  } else if (normNo === 'POL-SEC-002' || normNo === 'POL-HR-001' || normTitle.includes('human resource security') || normTitle.includes('hr security')) {
    // Human Resource Security Policy
    defaults.objective = `The objective of this Human Resource Security Policy is to ensure that employees, contractors, and third-party users understand their information security responsibilities, are suitable for their designated roles prior to employment, maintain security awareness during employment, and adhere to clean offboarding procedures upon termination or role modification at ${entity}.`;

    defaults.scope = `This policy applies to all job candidates, permanent staff, temporary employees, contractors, third-party consultants, and internship candidates across all operational units at ${entity}.`;

    defaults.resp_it_manager = `• Coordinates with HR to provision role-based access privileges strictly upon completion of security onboarding and NDA signing.
• Disables logical access credentials immediately upon receiving official termination notification from HR.
• Conducts annual security awareness workshops covering phishing, credential security, and data privacy.`;

    defaults.resp_md = `• Oversees HR security compliance and approves personnel security requirements for sensitive roles.
• Endorses disciplinary guidelines for policy non-compliance and security breaches.`;

    defaults.resp_all_users = `• Read, sign, and adhere to the Non-Disclosure Agreement (NDA) and Code of Conduct.
• Participate in mandatory annual information security awareness training sessions.
• Return all corporate assets, badges, access cards, and devices immediately upon offboarding.`;

    defaults.policy_statement = `### PRIOR TO EMPLOYMENT (SCREENING & CONTRACTS)
• Background Verification: All candidates undergo identity, qualification, reference, and legal background checks in compliance with UAE Labor Laws and regulatory frameworks.
• Terms & Conditions of Employment: Employment contracts explicitly define information security obligations, confidentiality rules, and compliance requirements.
• Non-Disclosure Agreements (NDAs): All new hires must sign an NDA prior to receiving system access.

### DURING EMPLOYMENT (AWARENESS & MANAGEMENT)
• Security Awareness & Training: Regular training programs cover data privacy, password safety, clean desk policies, and incident reporting.
• Management Responsibilities: Department leads ensure staff understand security policies applicable to their duties.
• Disciplinary Process: A formal, non-discriminatory disciplinary framework governs security violations or intentional policy breaches.

### TERMINATION AND CHANGE OF EMPLOYMENT
• Access Revocation: IT access accounts and physical security access badges are disabled or revoked on or before the last working day.
• Return of Assets: All physical equipment, keys, storage media, and hard-copy records must be handed over to HR and IT.
• Ongoing Confidentiality: Non-disclosure obligations remain in effect post-employment.`;

    defaults.core_principles = `1. Screening Controls: Systematic verification of credentials before granting system access.
2. Continuous Education: Regular security refresher courses and phishing simulations for all staff.
3. Prompt Account Offboarding: Instant revocation of network permissions upon employment termination.
4. Asset Accountability: Comprehensive exit checklists to ensure 100% asset recovery.`;

    defaults.compliance_disciplinary = `Violations of Human Resource Security protocols, including non-compliance with NDAs or failing to execute offboarding procedures, will trigger HR disciplinary action in accordance with UAE Labor Law.`;
    defaults.compliance_clarifications = `For questions regarding employee background checks, NDAs, or offboarding workflows, contact the HR Director or Compliance Team.`;
    defaults.compliance_checks = `HR and IT conduct bi-annual cross-audits between active employee lists and IT directory user accounts.`;
    defaults.compliance_exceptions = `Exceptions to standard screening protocols require formal endorsement by the HR Manager and Managing Director.`;

  } else if (normNo === 'POL-SEC-022' || normNo === 'POL-MEDIA-001' || normTitle.includes('removable media') || normTitle.includes('media management')) {
    // Removable Media Management Procedures
    defaults.objective = `The objective of this policy and procedure is to regulate the use of removable media devices (including USB flash drives, external hard drives, memory cards, and optical media) at ${entity} to prevent unauthorized data extraction, malware infection, and information leaks in accordance with DOH standards and UAE laws.`;

    defaults.scope = `This procedure applies to all endpoints, servers, medical devices, and laptops owned or managed by ${entity}, as well as all personnel, contractors, and third-party technicians.`;

    defaults.resp_it_manager = `• Enforces centralized USB Mass Storage disabling via Active Directory Group Policy or Endpoint Protection Agents.
• Maintains the Authorized Encrypted Media Inventory for approved operational exceptions.
• Conducts routine endpoint scans to detect unauthorized media insertion attempts.
• Oversees secure disposal and degaussing of retired media devices.`;

    defaults.resp_md = `• Evaluates and authorizes business cases for temporary removable media access.
• Endorses media protection investments and security enforcement measures.`;

    defaults.resp_all_users = `• Refrain from connecting personal or unverified USB storage devices to corporate computers.
• Scan any corporate-issued removable drive with updated antivirus software prior to accessing files.
• Report lost or misplaced removable media devices immediately to the IT Department.`;

    defaults.policy_statement = `### REMOVABLE MEDIA SECURITY CONTROLS

To safeguard corporate systems and health information from malware or data loss, ${entity} enforces strict controls over removable storage media:

| Media Type | Baseline Policy | Approved Usage Protocol | Security Controls |
|---|---|---|---|
| Personal USB Drives | STRICTLY PROHIBITED | No personal devices allowed on facility network | Blocked via Endpoint Security / Group Policy |
| Corporate Encrypted USB | RESTRICTED | Granted only with signed business justification | Hardware AES-256 Encryption & Antivirus Scan |
| External Hard Disks | RESTRICTED | Dedicated workstation backup / system images | BitLocker encryption & Physical Lockup |
| Memory Cards / SD Cards | RESTRICTED | Authorized digital imaging & diagnostic tools | Read-only permissions & Antivirus verification |

### MEDIA HANDLING & DISPOSAL PROCEDURES
• Storage Controls: Authorized removable media containing confidential or restricted data must be locked in secure cabinets when not in active use.
• Transport Safeguards: Media transferred off-site must be encrypted using FIPS 140-2 validated AES-256 encryption.
• Sanitization and Destruction: Defective or obsolete media must undergo degaussing or physical shredding before disposal.`;

    defaults.core_principles = `1. Default Port Blocking: USB storage ports are disabled by default across all company endpoints.
2. Mandatory Encryption: All authorized removable media must feature active AES-256 encryption.
3. Pre-Scan Protocol: Automatic antivirus scanning executes upon inserting any removable drive.
4. Secure Media Disposal: Physical destruction or degaussing for retired storage drives.`;

    defaults.compliance_disciplinary = `Connecting unauthorized removable media or attempting to bypass port protection controls will result in disciplinary procedures up to and including termination of employment.`;
    defaults.compliance_clarifications = `For temporary USB port unlock requests or media encryption support, contact the IT Department.`;
    defaults.compliance_checks = `The IT Department conducts automated weekly monitoring scans for unauthorized media events.`;
    defaults.compliance_exceptions = `USB port access exemptions require written approval from both the IT Manager and Managing Director.`;

  } else if (normNo === 'POL-SEC-010' || normNo === 'POL-SEC-004' || normTitle.includes('acceptable usage') || normTitle.includes('acceptable use')) {
    // Acceptable Usage Policy
    defaults.objective = `The objective of this Acceptable Usage Policy is to define acceptable and prohibited uses of ${entity}'s IT equipment, internet, email, mobile devices, and communications infrastructure, ensuring confidentiality, system integrity, and legal compliance.`;

    defaults.scope = `This policy applies to all personnel, contractors, vendors, and visitors utilizing computing equipment, networks, email systems, or internet resources provided by ${entity}.`;

    defaults.resp_it_manager = `• Administers firewall web filtering, email spam gateways, and system monitoring tools.
• Reviews access logs and investigates suspected unauthorized software installations or network abuse.
• Implements Multi-Factor Authentication (MFA) and lock screen policies across all devices.`;

    defaults.resp_md = `• Oversees organizational adherence to acceptable usage guidelines.
• Authorizes administrative reviews into suspected misuse of IT systems.`;

    defaults.resp_all_users = `• Use company IT assets strictly for legitimate business and clinical duties.
• Protect user credentials and lock workstations when leaving them unattended (Win + L).
• Refrain from downloading unapproved applications, visiting unsafe websites, or sending unsolicited mass email.`;

    defaults.policy_statement = `### ACCEPTABLE & PROHIBITED USE GUIDELINES

Corporate computing resources are provided to facilitate business operations. All users must comply with the following usage guidelines:

| Domain | Acceptable Practice | Prohibited Action |
|---|---|---|
| Workstations & Laptops | Lock screens when away; store data on designated network shares | Installing unauthorized third-party software or disabling antivirus |
| Internet & Web Access | Accessing business-related resources and educational reference | Visiting illegal, offensive, gaming, or high-risk streaming sites |
| Email & Messaging | Professional communication; verifying attachments before opening | Sending spam, chain letters, harassment, or unauthorized data exports |
| Password & Security | Using complex passwords; enforcing Multi-Factor Authentication | Sharing login credentials, writing passwords down, or using simple codes |

### CLEAN DESK AND CLEAN SCREEN POLICY
• Workstation screens must automatically lock after 5 minutes of inactivity.
• Documents containing sensitive or patient information must be locked away in drawers when leaving desks unattended.
• Printers must be cleared immediately after printing confidential documents.`;

    defaults.core_principles = `1. Business Purpose Primacy: Systems and bandwidth are prioritized for business and clinical operations.
2. Zero Password Sharing: Credentials belong exclusively to individual users; sharing accounts is strictly prohibited.
3. Clean Screen Standard: Automatic screen lock and clean desk enforcement to safeguard visual privacy.
4. Proactive Content Filtering: Web and email security gateways filter malicious links and content.`;

    defaults.compliance_disciplinary = `Abuse of internet access, password sharing, or accessing prohibited material will result in immediate HR disciplinary action under the Employee Code of Conduct and UAE Cybercrime Laws.`;
    defaults.compliance_clarifications = `For software installation requests or website access unblocking, contact the IT Department.`;
    defaults.compliance_checks = `The IT Department performs continuous automated log monitoring and periodic clean-desk checks.`;
    defaults.compliance_exceptions = `Software or network access exceptions require written justification approved by the IT Manager.`;
    
    defaults.policy_statement = `### CONTROL OBJECTIVES AND APPLICABILITY

The following control objectives are applicable to ${clientName || '[Entity Name]'}:

| Control Area | Control Objective | Applicability |
|---|---|---|
| Risk Management | Identify, assess, and mitigate risks to patient safety and operations | Applicable |
| Compliance | Adhere to UAE healthcare regulatory and legal requirements | Applicable |
| Human Resources Security | Ensure proper hiring, training, and management of personnel | Applicable |
| Asset Management | Maintain and protect information assets | Applicable |
| Physical and Environmental Security | Safeguard clinical infrastructure and sensitive areas | Applicable |
| Access Control | Restrict unauthorized access to sensitive systems and data | Applicable |
| Communications and Operations Management | Securely manage IT and operational processes | Applicable |
| Data Privacy and Protection | Ensure confidentiality and integrity of patient data | Applicable |
| Cloud Security | Secure cloud-based information systems and storage | Applicable |
| Third-Party Security | Ensure compliance of vendors and partners with security standards | Applicable |
| Information Systems Acquisition, Development, and Maintenance | Implement secure IT solutions and updates | Applicable |
| Information Security Incident Management | Establish processes for detecting and responding to security incidents | Applicable |
| Information Systems Continuity Management | Ensure continuity planning for IT services | Not applicable |`;
    
    defaults.core_principles = `1. Periodic Evaluation: The Statement of Applicability must be reviewed and re-verified at least annually or upon major structural or systems change.
2. Comprehensive Coverage: All control areas must be addressed and exceptions documented with valid justifications.
3. Integration with Risk Register: Applicability decisions must correlate with identified risk treatments and business objectives.`;
    
    defaults.compliance_disciplinary = `Failure to comply with applicable security controls may lead to security vulnerabilities, potential regulatory audits, and subsequent internal disciplinary actions.`;
    
    defaults.compliance_clarifications = `For questions regarding the applicability of any security controls, contact the IT Department or Compliance Officer.`;
    
    defaults.compliance_checks = `Regular compliance audits and automated system checks will be carried out to verify that all 'Applicable' controls are actively enforced.`;
    
    defaults.compliance_exceptions = `Any exclusion of controls marked 'Applicable' must be supported by a formally signed business justification and approved by the Managing Director.`;

  } else if (policyNo === 'POL-SEC-013') {
    defaults.objective = `The objective of this policy is to prevent unauthorized physical access, damage, or hazard to ${clientName}'s operational rooms, healthcare suites, and physical networks.`;
    defaults.scope = `Applies to all geographic enclosures, reception desks, diagnostic consultation rooms, file storage lockers, and technical closets located on our premises.`;
    defaults.resp_it_manager = `• Responsible for managing electronic security access control systems (such as keycards or biometric logs).
• Reviews physical access logs periodically and reports anomalies.
• Oversees environmental controls (e.g., HVAC temperature alerts, fire suppression) in IT and server rooms.`;
    defaults.resp_md = `• Approves security zone access permissions for personnel.
• Endorses facility layouts and physical perimeter reinforcement budgets.`;
    defaults.resp_all_users = `• Wear identification badges at all times on premises.
• Report any unescorted strangers or tailgating attempts in secure zones immediately.
• Ensure physical drawers, desks, and filing cabinets are locked when unattended.`;
    defaults.policy_statement = `### Secure Working Areas

To protect our premises, clinical spaces, and critical IT infrastructure, ${clientName} establishes secure working areas. Specific facility spaces are classified into designated physical zones, each governed by tailored security requirements, custody protocols, and monitoring standards:

🔒 **FACILITY PHYSICAL SECURITY ZONES & DESIGNATED SECURE AREAS:**

### Interactive Zoning Matrix Preview:

| Risk Area | Risk Location | Custodian |
|---|---|---|
| Public Access Areas | Reception / Waiting Area (including: Reception waiting Area, Lobby) | Customers / Staff |
| Work Areas, Restricted Areas | Consultation room, Treatment / Reception Counter (including: Doctor room, Consultation desk) | Nurse, Doctor, Pharmacist, Manager, Managing Director |
| High Secure Areas | Company Assets Area (Server Cabinet) (including: Server-cabinet, Pharmacy, IT room) | Managing Director, Authorized Staff* |
| *Escort with facility authorized person | | |

### Physical Access Control

Access to all restricted and high-security zones must be actively managed and monitored. Personnel must wear identification badges, and visitors must be escorted by authorized staff at all times. Doors to server closets, pharmacy cabinets, and confidential files must remain locked.`;
    defaults.core_principles = `1. Zoning Controls: Distinct administrative and clinical areas are strictly segregated.
2. Visual Monitoring: Critical doors, reception perimeters, and server racks are observed 24/7.
3. Access Authorization: Restricted area entries require badge authorizations or physical double-locks.
4. Environmental Protection: Server and pharmacy zones must maintain climate controls and fire prevention.`;
    defaults.compliance_disciplinary = `Unauthorized entry into high-security zones, sharing physical access cards, or tailgating is a severe policy violation and will lead to formal disciplinary action.`;
    defaults.compliance_clarifications = `For physical key access requests or security zone inquiries, contact the Facility Manager or IT Department.`;
    defaults.compliance_checks = `The Administration and IT team perform quarterly physical inspections, badge audits, and keyholder verification scans.`;
    defaults.compliance_exceptions = `Exceptions to zone restrictions require written, temporary authorization from both the IT Manager and the Managing Director.`;

  } else if (normNo === 'POL-SEC-024' || normNo === 'M-POLICY-004' || normTitle.includes('risk management')) {
    defaults.objective = `The purpose of this Risk Management Policy is to establish a structured and consistent approach to identifying, analyzing, evaluating, treating, and monitoring risks that may impact business operations, patient safety, regulatory compliance, and the Confidentiality, Integrity, and Availability (CIA) of information assets. This policy supports business continuity, regulatory compliance, and continual improvement, and is aligned with:
•	ISO 27001:2022 – Information Security Risk Management
•	ISO 31000 – Risk Management Principles and Framework
•	Applicable local regulatory requirements (e.g., DOH, ADHICS, FANR, where applicable)
All employees and relevant stakeholders are required to cooperate with risk assessments and support remediation activities.`;
    
    defaults.scope = `This policy applies to:
Managing Director / Manager / IT Manager / Risk Owners and Asset Owners / Employees, users, contractors, and third parties

The scope includes all organizational processes, IT systems, information assets, documentation, and services relevant to risk management within [Entity Name].`;
    
    defaults.resp_it_manager = `•	Develops, maintains, and enforces this Risk Management Policy.
•	Facilitates risk assessments and supports implementation of risk treatment plans.
•	Ensures alignment with ISO standards and regulatory requirements.
•	Conducts risk management and information security awareness programs.`;
    
    defaults.resp_md = `•	Provides leadership and oversight for risk management activities.
•	Ensures risks are managed within their areas of responsibility.
•	Approves risk acceptance decisions in line with defined risk appetite.
•	Ensures corrective actions are implemented and reviewed.

**Risk Owner**
•	Accountable for managing assigned risks.
•	Implements and monitors risk controls.
•	Documents residual risks and reports status based on risk level:
  - Low: Annual
  - Moderate: Annual
  - High: Quarterly
  - Critical: Monthly

**Asset Owner**
•	Ensures the confidentiality, integrity, and availability of assigned assets.
•	Maintains asset classification and valuation.
•	Identifies threats and vulnerabilities related to assets.
•	Enforces access controls, backup requirements, and security safeguards.`;
    
    defaults.resp_all_users = `•	Identify and report risks, incidents, and weaknesses.
•	Comply with organizational policies and procedures.
•	Participate in risk management and security awareness training.`;
    
    defaults.policy_statement = `### RISK MANAGEMENT OBJECTIVES
The objectives of this policy are to:
• Protect patient safety, quality of care, and service continuity.
• Reduce the likelihood and impact of risk-related incidents.
• Promote a non-punitive culture that encourages risk identification and reporting.
• Ensure compliance with accreditation, licensing, and legal requirements.
• Align risk management with organizational performance and quality improvement.
• Identify, assess, and manage IT and information security risks.
• Protect the Confidentiality, Integrity, and Availability (CIA) of information assets.

### RISK MANAGEMENT METHODOLOGY
The organization follows a risk management lifecycle consistent with ISO 27001 and ISO 31000.

#### Risk Identification:
Risks are identified across all operational and support functions, including but not limited to:
• Governance and compliance
• Financial and operational processes
• Human resources
• Clinical and support services
• Information technology and cybersecurity
• Business continuity and emergency preparedness
• Environmental, physical, and legal risks

Key elements considered:
• **Assets**: Information systems, patient records, applications, network infrastructure, medical devices, personnel, and physical facilities.
• **Threats**: Cyber-attacks, malware, ransomware, unauthorized access, insider threats, human error, system failure, and natural disasters.
• **Vulnerabilities**: Weak passwords, unpatched systems, misconfigurations, lack of encryption, inadequate access controls, and low security awareness.

### IDENTIFICATION OF EXISTING CONTROLS
As an integral part of the risk assessment process, the organization shall identify, document, and evaluate existing controls that are in place to manage identified risks. This step ensures accurate determination of inherent and residual risks and supports effective risk treatment planning in accordance with ISO 27001:2022 and ISO 31000.

#### Control Identification Requirements
During each risk assessment, the following requirements shall be applied:
• **Identification of Existing Controls**
For every identified risk, assessors shall identify all current controls implemented to protect the related assets and reduce the likelihood or impact of the risk. Controls may include, but are not limited to:
  - Administrative controls : (e.g., policies, procedures, SOPs, risk acceptance approvals, training programs)
  - Technical controls : (e.g., access controls, authentication mechanisms, firewalls, antivirus, encryption, backups, logging)
  - Physical controls : (e.g., restricted areas, locks, CCTV, environmental safeguards)
  - Operational controls: (e.g., change management, monitoring activities, incident response processes)
Controls may be preventive, detective, or corrective in nature.

• **Control Evidence and Sources**
Existing controls shall be identified and validated using documented evidence, including:
  - Approved policies and procedures,
  - System configurations and security settings,
  - Audit results, assessment reports, and vulnerability scans,
  - Logs, screenshots, and monitoring records,
  - Contracts and third-party agreements,
  - Incident reports and corrective action records

• **Documentation in the Risk Register**
All identified existing controls shall be recorded in the Risk Register, including:
  - Description of the control,
  - Control category (Administrative / Technical / Physical / Operational),
  - Control owner,
  - Associated asset and risk,
  - Reference to supporting evidence

• **Assessment of Control Effectiveness**
Each existing control shall be evaluated to determine its effectiveness in managing the identified risk, considering:
  - Adequacy of design,
  - Level of implementation,
  - Consistency of application,
  - Ongoing monitoring and review
Control effectiveness shall be classified as: Effective, Partially Effective, Ineffective, Not Implemented.

• **Inherent and Residual Risk Determination**
  - Inherent Risk is calculated without considering existing controls, using Asset Value, Likelihood, and Impact.
  - Residual Risk is determined after considering the effectiveness of existing controls. Where existing controls do not sufficiently reduce risk to an acceptable level, additional risk treatment actions shall be defined.

• **Identification of Control Gaps**
Any gaps identified due to missing, weak, outdated, or ineffective controls shall be:
  - Clearly documented in the Risk Register,
  - Assigned to a Risk Owner,
  - Addressed through the Risk Treatment Plan in line with defined risk levels and acceptance criteria.`;
    
    defaults.core_principles = `### RISK ANALYSIS AND ASSESSMENT

#### Likelihood Rating (1–5)
Assesses the probability of the risk occurring:

| Rating | Level | Description |
|---|---|---|
| 1 | Rare | Rare occurrence; risk is highly unlikely to happen. |
| 2 | Unlikely | Unlikely to occur; low probability but not impossible. |
| 3 | Possible | Could occur occasionally; moderate chance based on past data or conditions. |
| 4 | Likely | Likely to occur; occurs regularly or under foreseeable circumstances. |
| 5 | Almost Certain | Expected to occur frequently or has a history of occurrence. |

#### Impact Rating (1–5)
Assesses severity of consequences if the risk materializes:

| Rating | Level | Description |
|---|---|---|
| 1 | Negligible | Negligible impact; minimal disruption with no noticeable consequences. |
| 2 | Minor | Minor disruption; easily manageable without affecting key operations. |
| 3 | Moderate | Moderate impact; noticeable effect on operations or objectives. |
| 4 | Major | Major impact; significant disruption to operations, requiring recovery effort. |
| 5 | Critical | Severe impact; critical failure, legal, financial, or reputational damage. |

#### Asset Value Calculation (CIA Classification)
Assets are rated on a 1–5 scale for Confidentiality, Integrity, and Availability.

| Score | Measurable Impact Definition | Confidentiality – Unauthorized Disclosure | Integrity – Unauthorized Modification | Availability – System Unavailability |
|---|---|---|---|---|
| 1 – Negligible | No material impact | No sensitive data exposed; no compliance impact | No effect on decisions or operations | No operational impact |
| 2 – Minor | Limited, recoverable impact | Limited internal data exposed; no regulatory reporting required | Minor data correction required | Short disruption with workaround |
| 3 – Moderate | Noticeable operational impact | Restricted data exposed; internal investigation required | Data errors cause workflow disruption | Service disruption affects operations |
| 4 – Major | Significant business or compliance impact | Sensitive or personal data exposed; regulatory or contractual impact | Incorrect data leads to wrong decisions or compliance breach | Core services unavailable |
| 5 – Critical | Severe legal, financial, or safety impact | Regulated data exposed (PHI/PII); mandatory regulatory notification, legal action | Data corruption causes patient harm, financial loss, or audit failure | Prolonged outage of mission-critical systems |

Asset Value = (Confidentiality + Integrity + Availability) ÷ 3
Rounding Rules:
• 4.0 – 4.5 → Round down to 4
• 4.6 – 5.0 → Round up to 5

Inherent Risk Score = Asset Value × Impact (I) × Likelihood

#### Risk Rating and Acceptance Criteria

| Risk Score | Risk Level | Response & Acceptance Criteria |
|---|---|---|
| 1–20 | Low | Acceptable level of risk with no significant impact on patient safety, clinical services, or data security. Risk is tolerated and periodically monitored. |
| 21–50 | Moderate | Mitigation required and limited control actions.<br/>- Implement cost-effective mitigation strategies.<br/>- Monitor for any changes in frequency, scope, or potential escalation. |
| 51–75 | High | Immediate attention and control implementation.<br/>- Likely to affect clinical workflows, patient confidentiality, or regulatory compliance.<br/>- Deploy strong preventive and detective controls, increase monitoring frequency.<br/>- Notify department heads and assign ownership for remediation. |
| 76–125 | Critical | Unacceptable under any circumstance; urgent mitigation is required.<br/>- Must be addressed through immediate corrective actions, risk transfer or cessation of vulnerable services.<br/>- Involve executive leadership, legal, and compliance teams.<br/>- Document actions in the Risk Register and perform root cause analysis.<br/>- Example: Breach of patient medical records, system outages affecting emergency or surgery departments, ransomware attacks, or non-compliance with health regulations (e.g., ADHICS, DOH, FANR). |

Risk acceptance must align with the organization’s Risk Appetite and be formally approved and documented.

<div class="my-4 flex flex-col items-center justify-center w-full text-center">
  <img src="/risk_matrix_chart.jpg" alt="Healthcare Cybersecurity Risk Assessment Framework" class="max-w-full h-auto rounded-lg border border-slate-300 shadow-md object-contain max-h-[420px] mx-auto" />
  <p class="text-[10px] text-slate-500 font-bold italic mt-1.5 text-center">Figure 1: Healthcare Cybersecurity Risk Assessment Framework &amp; Criteria</p>
</div>

### RISK TREATMENT
Risk treatment options include:
• **Avoidance** – Eliminating the risk source or activity
• **Reduction (Mitigation)** – Implementing controls to reduce likelihood or impact
• **Sharing** – Transferring risk through insurance or third-party arrangements
• **Retention (Acceptance)** – Accepting residual risk with formal justification

All treatment decisions are documented in the Risk Register.`;
    
    defaults.compliance_disciplinary = `### INCIDENT, COMPLAINT, AND EVENT MANAGEMENT
• A formal incident and event reporting mechanism is maintained.
• Adverse events, near misses, complaints, and grievances are logged, tracked, and analyzed.
• Reporting complies with applicable regulatory and legal obligations.

### MONITORING, REVIEW, AND CONTINUAL IMPROVEMENT
• Risk management activities are monitored through audits, assessments, and incident trends.
• Periodic vulnerability assessments are conducted and documented.
• Temporary system changes to pass assessments are strictly prohibited.
• The Risk Management Policy and Risk Register are reviewed at least annually or following significant changes.`;
    
    defaults.compliance_clarifications = `### RESIDUAL RISK MANAGEMENT
• Residual risk is assessed after implementing controls.
• Residual risks are reviewed regularly and reported to senior management.
• Further treatment actions are initiated where residual risk exceeds acceptable levels.

### DOCUMENT CONTROL
• This policy is approved by top management.
• Controlled copies are maintained by the IT Manager.
• Changes follow the organization’s Document Control Procedure.

ISO CLAUSE ALIGNMENT (REFERENCE) : ISO 27001: 5.1, 6.1.2, 6.1.3, 8.2, | ISO 31000- Clauses 5–6.`;
    
    defaults.compliance_checks = `Periodic risk audits and register verification are performed by the IT Manager and Compliance team.`;
    defaults.compliance_exceptions = `Exceptions require formal business case endorsement and CMT/MD sign-off.`;
  } else if (policyNo === 'POL-SEC-009') {
    defaults.objective = `The objective of this policy is to outline protection controls against malicious codes (such as viruses, spyware, malware, Trojans, etc.) that may harm the computer devices and servers of at ${clientName} . This policy also establishes the requirements for addressing any problems arising from such infections.`;
    defaults.scope = `This policy applies to all users and physical assets (including information and computing resources such as desktops, laptops, servers, and tablets) within at ${clientName} .`;
    defaults.resp_it_manager = `• Responsible for the development, maintenance, enforcement, and endorsement of this policy.
• Support relevant business units in implementing defined controls and ensuring compliance.
• Conduct regular awareness training for users about the policy.
• Administer the antivirus system, centrally monitor, and analyze system logs.
• Coordinate with external security authorities to address virus outbreaks and ensure preventive actions.`;
    defaults.resp_md = `• Ensure policy compliance within their respective areas of concern.`;
    defaults.resp_all_users = `• Read, understand, and adhere to this policy in daily operations.
• Report any malicious content, configuration changes, or unusual behavior to the IT Manager.
• Immediately disconnect from the network if their system is believed to be infected.`;
    defaults.policy_statement = `### Antivirus Installation
• The IT Manager shall ensure that all desktops, laptops, and tablets are installed and with official antivirus software.
• The Technical Support Team shall ensure that all servers are installed and configured with official antivirus software (e.g., Kaspersky Antivirus Security).
• Antivirus software shall operate in real time on all servers, desktops, laptops, and tablets.
• Server machines running on operating systems with minimal virus risk may not require antivirus software.
• Full system scans must be configured to occur weekly, with real-time scanning of files from external storage media when accessed, copied, or moved.
• Antivirus software shall automatically clean malicious content, and if cleaning is unsuccessful, quarantine infected files.
• Email servers must scan all internal and external emails for malicious content.
• Users shall be trained in antivirus software usage, but they are not permitted to install, uninstall, or alter antivirus configurations.

### Antivirus Software and Signature File Maintenance
• The IT Manager administering the antivirus system shall ensure that virus definitions (signatures) are regularly updated.
• Automatic updates must be enabled across all network endpoints and systems.
• The IT Manager must maintain updated documentation for the installation, configuration, and administration of all antivirus components.
• In case of a worm/virus outbreak, the infected system must be disconnected from the ${clientName} network to prevent the spread of the infection.

### Antivirus Server Security
• Antivirus system servers shall be in a physically secure, controlled environment with access restricted to authorized personnel.
• Logical (electronic) access to antivirus servers shall be restricted to authorized personnel only.

### Third-Party Access
• Third-party personnel are not permitted to connect laptops, desktops, or tablets to the entity network unless their antivirus signatures are up to date.
• The IT Manager must verify that third-party devices are free of viruses and other vulnerabilities before they are connected to the local area network (LAN).

### Logging and Monitoring
• Logging must be enabled on all antivirus systems, and logs must be monitored weekly by administrators responsible for the antivirus system.
• All virus detection incidents must be logged, along with actions taken (e.g., quarantine, deletion, or successful cleaning).
• Antivirus logs must be stored for at least 30 days (or as required by regulatory guidelines) and reviewed by the IT Manager.
• The antivirus system must be configured to send alerts to the IT Manager in case of malicious content that cannot be cleaned or upon the detection of a new virus.

### Incident Reporting
• The IT Manager must review, and report identified malicious code/content in accordance with the Information Security Incident Management process.
• Users must report any detection of malicious content, configuration changes, or unusual system behavior to the IT Manager immediately.
• Systems suspected to be infected must be disconnected from the network without delay.

### CHANGE MANAGEMENT
All changes related to antivirus servers, applications, or configuration settings must adhere to ${clientName}’s Change Management Process.`;
    defaults.core_principles = `1. Antivirus Installation: Official software deployed across all desktops, laptops, tablets, and servers.
2. Routine Updates & Maintenance: Daily automated definition updates synchronized across all endpoints.
3. Logical & Physical Security: Restricting host and administrative credentials to authorized personnel only.
4. Continuous Log Auditing: Retaining detection logs for 30+ days and dispatching real-time notifications for uncleaned infections.`;
    defaults.compliance_disciplinary = `Any violations of this policy may result in HR disciplinary actions in line with UAE Labor Law, the Code of Conduct for Employees, and any applicable UAE regulations.`;
    defaults.compliance_clarifications = `Users unsure about any aspects of this policy must seek clarification from the IT Manager.`;
    defaults.compliance_checks = `The IT Manager reserves the right to conduct periodic compliance checks.`;
    defaults.compliance_exceptions = `Any exceptions to this policy must have valid business justifications and receive approval from the IT Manager on a case-by-case basis.`;
  } else if (policyNo === 'POL-SEC-006') {
    defaults.objective = `The objective of this policy is to specify access control protocols and protect patient registers, medical records, and digital platforms from unauthorized data breaches, complying with DOH regulations.`;
    defaults.scope = `Applies to all electronic logins, role-based security assignments, active directory credentials, and shared resource groups inside ${clientName}.`;
    defaults.resp_it_manager = `• Responsible for the development, maintenance, enforcement, and endorsement of the access control policy.
• Supports the relevant business unit/section in implementing the defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Conducts access reviews of user lists periodically.`;
    defaults.resp_md = `• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum access privilege requirements.`;
    defaults.resp_all_users = `• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.`;
    defaults.policy_statement = `### Access Control and Privilege Management
• Access to medical folders and server shares is restricted under a strict 'least privilege' paradigm. User authentication credentials must be formally requested and authorized.

### Review of Access
• The IT Manager regularly generates a user list from the information systems, either annually or whenever major changes occur. This list is reviewed by the Business Managing Director and/or Manager to identify redundant, dormant, or expired user accounts, as well as incorrect privileges.

User accounts inactive for more than 90 days must be disabled by the IT Manager.
Administrator/Standard user accounts are reviewed twice a year, with changes logged for periodic review.`;
    defaults.core_principles = `1. Least Privilege Authorization: Login access is granted strictly based on active clinical or business functions.
2. Routine Review Cycles: Credentials and permissions are formally audited and updated twice a year.
3. Strong Password Enforcement: All user profiles are bound by strong complexity requirements.
4. Stale Account Revocation: Automatic deactivation of user directories dormant for more than 90 days.`;
    defaults.compliance_disciplinary = `Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws.`;
    defaults.compliance_clarifications = `Users unsure about this policy should seek clarification from the IT Manager.`;
    defaults.compliance_checks = `The IT Manager reserves the right to check compliance with this policy.`;
    defaults.compliance_exceptions = `The IT Manager reserves the right to approve exceptions on a case-by-case basis.`;
  } else if (policyNo === 'POL-SEC-019') {
    defaults.objective = `The objective of this Change Management Plan and Procedure is to establish a systematic, standardized process for proposing, evaluating, approving, implementing, and verifying all changes to IT networks, software applications, clinical systems, and associated infrastructure at ${clientName}. This ensures operational stability, service continuity, and compliance with clinical quality frameworks and compliance rules.`;
    
    defaults.scope = `This procedure applies to all users, technical administrators, and physical or logical assets (including desktops, clinical workstations, servers, networks, databases, and third-party gateways) under the purview of ${clientName}. It covers all types of IT and service modifications.`;
    
    defaults.resp_it_manager = `• Responsible for managing, auditing, enforcing, and endorsing this Change Management procedure.
• Evaluates change requests for security implications and operational impact.
• Coordinates formal post-implementation reviews for Major and Emergency changes.
• Maintains the official central Change Request log and change history files.`;
    
    defaults.resp_md = `• Review and authorize change requests categorized as Major Changes with high business risk.
• Endorse policy revisions and support strategic compliance efforts within respective areas of concern.`;
    
    defaults.resp_all_users = `• Understand and comply with this change control procedure in daily operations.
• Refrain from unauthorized system configuration adjustments or software installations.
• Immediately report any post-implementation anomalies, unexpected performance issues, or security concerns to the IT Manager.`;
    
    defaults.policy_statement = `### Change Classification Framework

IT changes are classified into four types based on their risk, urgency, complexity, and required controls:

| Change Type | Definition & Criteria | Requirements | Supporting Documentation |
| :--- | :--- | :--- | :--- |
| **Emergency Change** | A change that must be implemented immediately to address a critical issue such as a major disruption, outage, or urgent service restoration. <br/><br/>*Examples:* <br/>• Restoring a critical IT service <br/>• Preventing an imminent outage | • Sufficient review and discussion with impacted/involved parties (incl. business users and IT Manager)<br/>• Testing may be minimal or post-implementation<br/>• Change Request to be submitted within 1 business day after resolution<br/>• Post-implementation review by the responsible manager | Change Request Form<br/>• Documentation (post-change) |
| **Major Change** | A high-risk and complex change with potential significant impact to production services. Recovery options may be limited if failure occurs. | • Formal review with all impacted/involved parties (incl. IT Manager and business users)<br/>• Testing prior to implementation (where possible)<br/>• User notification<br/>• Formal post-implementation review | Change Request<br/>• Risk Assessment<br/>• Implementation Plan |
| **Minor Change** | A low-risk, well-understood change with minimal impact on services. These changes are generally easy to back out and are tested prior to implementation. | • Approval from the team manager and system owner<br/>• Testing and validation before going live (where possible)<br/>• No formal review required unless specified | Change Request<br/>• Test Plan/Results (if applicable)<br/>• Approvals |
| **Standard Change** | A pre-approved, low-risk, and routine change that follows a documented and repeatable process or work instruction. <br/><br/>*Examples:* <br/>• Password reset <br/>• Deploying standard equipment | • Follows an authorized, predefined procedure<br/>• No additional approvals required at the time of implementation<br/>• Can be executed by trained personnel | Standard Change Procedure Document / Work Instruction <br/>• Execution Logs (e.g., system log) |

### Request and Approval Flow
• **Submission:** Every change (except pre-approved Standard Changes) must be initiated by submitting a Change Request form to the IT Department.
• **Assessment:** The IT Manager and relevant department heads evaluate the proposal's technical feasibility, potential business risks, testing results, and roll-back rollback recovery plan.
• **Authorization:** Authorization must be granted by the designated managers in accordance with the Change Classification table.
• **Deployment:** Changes are deployed during scheduled maintenance windows with minimal disruption.
• **Audit Log:** Every change is closed with post-change verification results logged in the change log.`;
    
    defaults.core_principles = `1. Structured Change Classification: All modifications are systematically categorized to ensure proportional oversight and safeguards.
2. Mandatory Rollback Protocols: Every change request must possess a documented, pre-tested rollback procedure to restore service quickly if an issue arises.
3. Segregation of Approval Duties: The personnel executing a change must not be the sole approving authority.
4. Continuous Audit Compliance: Detailed logs of change requests, approvals, deployment times, and testing reviews must be retained for audit trails.`;
    
    defaults.compliance_disciplinary = `Any violation of this Change Management procedure, including unauthorized changes or bypassing approval steps, may result in HR disciplinary action in line with UAE Labor Law, the Code of Conduct for Employees, and applicable regulations.`;
    defaults.compliance_clarifications = `Users requiring clarification or unsure of the classification of a change must seek guidance from the IT Manager.`;
    defaults.compliance_checks = `The IT Manager and Quality Compliance team reserve the right to conduct periodic checks and audits on change registries.`;
    defaults.compliance_exceptions = `Any exception to this procedure must be backed by a strong business case, have a documented risk-mitigation strategy, and receive joint approval from the IT Manager and Managing Director on a case-by-case basis.`;
  } else if (policyNo === 'POL-SEC-021') {
    defaults.objective = `The objective of this policy is to define adequate backup requirements for the critical information and data of the facility and ensure their availability in the event of a disruption.`;
    
    defaults.scope = `This policy covers all information/data stored and processed in production, development, test environments, file servers, as well as network and security devices owned by Smartpro Consultancy.`;
    
    defaults.resp_it_manager = `• Responsible for the development, maintenance, enforcement, and endorsement of the policy.
• Supports the relevant business unit/section in implementing the defined controls and ensuring compliance.
• Conducts awareness sessions about the policy for Users.
• Ensures that backups are taken as per operational requirements, in consultation with the Managing Director/Manager.
• Schedules and handles backup media.
• Oversees the implementation of this policy in day-to-day operations.`;
    
    defaults.resp_md = `• Ensures compliance with this policy within their area of concern.
• Collaborates with the IT Manager to determine minimum backup requirements and frequency.`;
    
    defaults.resp_all_users = `• Responsible for reading, understanding, and adhering to this policy in their day-to-day activities.`;
    
    defaults.policy_statement = `### Backup Requirements
• Backup requirements for all information systems within the facility must be identified and documented by the IT Manager.
• Locally stored data on Users’ computers will not be included in scheduled backups; Users must transfer data to network drive folders.
• The Managing Director/Manager or IT Manager shall decide on the minimum backup requirements and the frequency/type of backups for their respective systems.
• The IT Manager shall maintain a record of all backup requirements, including the type of information/data, backup frequency, storage media, retention, and disposal.

### Backup Schedule
• Backups shall be conducted regularly as defined by the IT Manager to ensure data availability in case of system failures.
• The Technical Support team must perform minimum backup levels for each server hosting production data, as agreed with the Managing Director/Manager.
• New production servers must be included in the backup schedule immediately.
• In case of a scheduled backup failure, the IT Manager must reschedule the backup and inform the Managing Director/Manager.
• The root cause of backup failures must be identified, documented, and shared with the Managing Director/Manager.
• Backups must be taken before and after any changes, such as upgrades or patching, to systems, applications, or network devices.
• A regular backup must be maintained for all systems software, applications, user data, databases, and associated documentation.

📦 **ACTIVE FACILITY BACKUP PLAN MATRIX:**

Daily – Incremental of EMR Backup to destination Workstation. Remarks: Automatic scheduled nightly delta snapshots
Daily – Incremental of Share Folder to destination Workstation. Remarks: Incremental backup of user shares and clinical logs
Weekly Full Backup of EMR Backup to destination Workstation. Remarks: Full encrypted binary backup with integrity checks
Monthly Full Backup of DB Folder to destination Workstation. Remarks: Long-term archival storage offsite cloud gateway

Restoration tests are conducted on a biannual schedule to guarantee the readiness of recovery systems.

### Performing Backups
• The backup operations will be logged and reviewed. Logs must include details such as start and end times, media used, and backup success/failure status.
• Unscheduled/one-time backups require specific authorization from the IT Manager and must be documented.

### Backup Storage
• Backup media will be stored onsite within the organization’s premises (workstation).
• Physical access to backup media and storage locations will be restricted to authorized personnel and secured with appropriate controls/encryption.
• A physical access log will be maintained and reviewed periodically by the IT Manager.
• Backup media will be stored in an environment protected from fire, dust, humidity, and magnetic interference.

### Backup Media Handling and Storage
• Backup (workstation) devices will be used for daily, weekly, monthly backups, and all backup media must be clearly identified.
• Access to backup media must be restricted and secured.
• Backup media will be securely disposed of at the end of their life, following degaussing, label/tag removal, and physical destruction if necessary.
• Handling of backup media must follow the manufacturer’s recommendations to prevent damage.

### Media and Restoration Management
• An up-to-date inventory of all backup media, including media identification, data contents, physical location, and usage history, will be maintained by the IT team.
• Media due for disposal will be identified and reported for approval by the respective system owners.`;
    
    defaults.core_principles = `### Testing and Restoring
• Full data restores will be performed according to an annual restore plan, reviewed by the IT Manager.
Data restoration will be necessary if:
• A system/device is compromised.
• Files are corrupted, deleted, or incorrectly modified.
• Archived data needs to be accessed.
• Restoration requests must be approved by the IT Manager, and Users should contact the IT Manager for restore requests.
• The IT team will verify the readability and restorability of backup media, with data restoration tests conducted at least once annually or during version changes.

### Audit and Review
• The Information Security Team will regularly review the policy to ensure compliance.`;
    
    defaults.compliance_disciplinary = `Violations of this policy may result in disciplinary action according to UAE Labor Law, the Code of Conduct for Employees, and other applicable UAE laws.`;
    defaults.compliance_clarifications = `Users unsure about this policy should seek clarification from the IT Manager.`;
    defaults.compliance_checks = `The IT Manager reserves the right to check compliance with this policy.`;
    defaults.compliance_exceptions = `The IT Manager reserves the right to approve exceptions on a case-by-case basis.`;
  } else {
    // General fallback
    defaults.objective = `The objective of this policy is to outline the basic principles for protecting all information assets at ${clientName}. It aims to make all users within the entity aware of potential security threats and associated business risks, ensuring compliance with standards.`;
    defaults.scope = `This policy applies to all users of ${clientName} including the Managing Director / Manager and IT Manager.`;
    defaults.resp_it_manager = `• Responsible for the development, maintenance, enforcement, and endorsement of this policy.
• Supports the relevant business units/sections in implementing defined controls and ensuring compliance with this policy.
• Conducts awareness sessions about the policy for all users.
• Reserves the right to check compliance with this policy on a periodic basis.`;
    defaults.resp_md = `• Responsible for compliance with this policy within their area(s) of concern.
• Endorses this policy to ensure its effective implementation across the facility`;
    defaults.resp_all_users = `• Responsible for reading, understanding, and adhering to this policy in their daily activities.
• Expected to seek clarification or advice from the IT Manager if unsure about any aspect of this policy.`;
    defaults.policy_statement = `${clientName} is committed to securing the confidentiality, integrity, and availability of information necessary for day-to-day business operations. The security of information and other assets is fundamental to the successful operation of the facility.`;
    defaults.core_principles = `• Confidentiality, Integrity & Availability: Maintain the confidentiality, integrity, and availability of information and information assets.
• Compliance: Meet UAE regulatory, statutory, and legislative requirements.
• Incident Management: Report and investigate all suspected breaches of information security.
• Training & Awareness: Provide appropriate information security training and awareness to all employees.`;
    defaults.compliance_disciplinary = `Any violation or breach of this policy may result in HR disciplinary procedures in accordance with UAE labor laws.`;
    defaults.compliance_clarifications = `Users should seek clarification or advice if unsure about any part of this policy.`;
    defaults.compliance_checks = `The compliance team reserves the right to periodically check compliance with this policy.`;
    defaults.compliance_exceptions = `Any exceptions to this policy with valid business justification require approval from the IT Manager on a case-by-case basis.`;
  }

  return defaults;
}

export interface ParsedPolicy {
  objective: string;
  scope: string;
  resp_it_manager: string;
  resp_md: string;
  resp_all_users: string;
  policy_statement: string;
  core_principles: string;
  compliance_disciplinary: string;
  compliance_clarifications: string;
  compliance_checks: string;
  compliance_exceptions: string;
}

export function parsePolicyText(text: string): ParsedPolicy {
  const lines = text.split('\n');
  
  const sections: { [key in keyof ParsedPolicy]: string[] } = {
    objective: [],
    scope: [],
    resp_it_manager: [],
    resp_md: [],
    resp_all_users: [],
    policy_statement: [],
    core_principles: [],
    compliance_disciplinary: [],
    compliance_clarifications: [],
    compliance_checks: [],
    compliance_exceptions: []
  };

  let currentSection: keyof ParsedPolicy | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSection) {
        sections[currentSection].push(line);
      }
      continue;
    }

    const lower = trimmed.toLowerCase();

    // Identify standard headers or key phrases to switch context
    if (
      lower.includes('objective') || 
      lower.includes('purpose') ||
      /^\s*(1\.\s*)?objective/i.test(trimmed) ||
      /^\s*(1\.\s*)?purpose/i.test(trimmed)
    ) {
      currentSection = 'objective';
      const cleanLine = trimmed.replace(/^(objective|purpose|1\.\s*objective|1\.\s*purpose|objectives|purposes)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('scope') || 
      lower.includes('applicability') ||
      /^\s*(1\.\s*)?scope/i.test(trimmed) ||
      /^\s*(1\.\s*)?applicability/i.test(trimmed)
    ) {
      currentSection = 'scope';
      const cleanLine = trimmed.replace(/^(scope|applicability|1\.\s*scope|1\.\s*applicability)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      (lower.includes('it manager') || lower.includes('department head') || lower.includes('department lead') || lower.includes('it lead')) &&
      (lower.includes('responsibilit') || lower.includes('role') || lower.includes('duty') || lower.includes('duties') || trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.length < 60)
    ) {
      currentSection = 'resp_it_manager';
      const cleanLine = trimmed.replace(/^(it manager|department head|department lead|it lead)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      (lower.includes('managing director') || lower.includes('md ') || lower.startsWith('md:') || lower.includes('risk owner') || lower.includes('asset owner')) &&
      (lower.includes('responsibilit') || lower.includes('role') || lower.includes('duty') || lower.includes('duties') || trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.length < 60)
    ) {
      currentSection = 'resp_md';
      const cleanLine = trimmed.replace(/^(managing director|md|manager|risk owner|asset owner)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      (lower.includes('all users') || lower.includes('employee') || lower.includes('staff') || lower.includes('user responsibilit')) &&
      (lower.includes('responsibilit') || lower.includes('role') || lower.includes('duty') || lower.includes('duties') || trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.length < 60)
    ) {
      currentSection = 'resp_all_users';
      const cleanLine = trimmed.replace(/^(all users|employee|employees|staff|user responsibilities)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('policy statement') || 
      lower.includes('document creation') || 
      lower.includes('version control') || 
      lower.includes('distribution and accessibility') ||
      /^\s*(3\.\s*)?policy statement/i.test(trimmed)
    ) {
      currentSection = 'policy_statement';
      const cleanLine = trimmed.replace(/^(policy statement|document creation and approval|version control|3\.\s*policy statement)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('core principles') || 
      lower.includes('general principles') || 
      lower.includes('principles') || 
      lower.includes('risk management methodology') ||
      /^\s*(3\.\s*)?core principles/i.test(trimmed)
    ) {
      currentSection = 'core_principles';
      const cleanLine = trimmed.replace(/^(core principles|general principles|principles|risk management methodology)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('disciplinary') || 
      lower.includes('penalty') || 
      lower.includes('penalties') || 
      lower.includes('violation') ||
      /^\s*(4\.\s*)?policy compliance/i.test(trimmed)
    ) {
      currentSection = 'compliance_disciplinary';
      const cleanLine = trimmed.replace(/^(disciplinary|disciplinary action|penalties|violation|violations|4\.\s*policy compliance)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('clarification') || 
      lower.includes('contact') || 
      lower.includes('questions')
    ) {
      currentSection = 'compliance_clarifications';
      const cleanLine = trimmed.replace(/^(clarifications|clarification|contact|questions)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('check') || 
      lower.includes('audit') || 
      lower.includes('verify') || 
      lower.includes('verification')
    ) {
      currentSection = 'compliance_checks';
      const cleanLine = trimmed.replace(/^(checks|compliance checks|audit|audits|verification)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else if (
      lower.includes('exception') || 
      lower.includes('exceptions')
    ) {
      currentSection = 'compliance_exceptions';
      const cleanLine = trimmed.replace(/^(exceptions|exception|exceptions criteria)[:\-\s]*/i, '');
      if (cleanLine.trim()) {
        sections[currentSection].push(cleanLine);
      }
    } else {
      // Append line to current active section, if any
      if (currentSection) {
        sections[currentSection].push(line);
      } else {
        // Fallback: If no section is active yet, treat as objective
        sections['objective'].push(line);
      }
    }
  }

  // Join lines and clean up whitespace
  const parsed: ParsedPolicy = {
    objective: '',
    scope: '',
    resp_it_manager: '',
    resp_md: '',
    resp_all_users: '',
    policy_statement: '',
    core_principles: '',
    compliance_disciplinary: '',
    compliance_clarifications: '',
    compliance_checks: '',
    compliance_exceptions: ''
  };

  for (const key of Object.keys(sections) as Array<keyof ParsedPolicy>) {
    parsed[key] = sections[key].join('\n').trim();
  }

  return parsed;
}

export function getPolicyFullContent(policy: any, clientCompanyName: string = 'the facility'): string {
  if (policy.full_content) {
    if (policy.policy_no === 'POL-SEC-019' && (!policy.full_content.includes('| Change Type |') || !policy.full_content.includes('Emergency Change'))) {
      // old stale content without the classification table, allow regeneration below
    } else {
      return policy.full_content;
    }
  }
  const defaults = getPolicyTemplateDefaults(policy.policy_no || '', clientCompanyName, policy.policy_name || policy.title || '');
  const objVal = policy.objective || defaults.objective;
  const scopeVal = policy.scope || defaults.scope;
  const respItVal = policy.resp_it_manager || defaults.resp_it_manager;
  const respMdVal = policy.resp_md || defaults.resp_md;
  const respUserVal = policy.resp_all_users || defaults.resp_all_users;
  
  let stmtVal = policy.policy_statement || defaults.policy_statement;
  if (policy.policy_no === 'POL-SEC-019') {
    if (!stmtVal || !stmtVal.includes('| Change Type |') || !stmtVal.includes('Emergency Change')) {
      stmtVal = defaults.policy_statement;
    }
  }

  const principlesVal = policy.core_principles || defaults.core_principles;
  const complianceDispVal = policy.compliance_disciplinary || defaults.compliance_disciplinary;
  const complianceClarVal = policy.compliance_clarifications || defaults.compliance_clarifications;
  const complianceCheckVal = policy.compliance_checks || defaults.compliance_checks;
  const complianceExceptionVal = policy.compliance_exceptions || defaults.compliance_exceptions;

  return `### 1. OBJECTIVE & SCOPE

#### OBJECTIVE
${objVal}

#### SCOPE
${scopeVal}

### 2. RESPONSIBILITIES

#### IT MANAGER / DEPARTMENT LEADS
${respItVal}

#### MANAGING DIRECTOR / MANAGER
${respMdVal}

#### ALL USERS / EMPLOYEES
${respUserVal}

### 3. POLICY STATEMENT & CORE PRINCIPLES

#### POLICY STATEMENT
${stmtVal}

#### CORE PRINCIPLES
${principlesVal}

### 4. POLICY COMPLIANCE, EXCEPTIONS & PENALTIES

#### DISCIPLINARY ACTION
${complianceDispVal}

#### CLARIFICATIONS CONTACT
${complianceClarVal}

#### COMPLIANCE CHECKS AUTHORITY
${complianceCheckVal}

#### EXCEPTIONS CRITERIA
${complianceExceptionVal}`;
}

export interface FullParsedPolicy extends ParsedPolicy {
  policy_no?: string;
  policy_name?: string;
  version?: string;
  category?: string;
  department?: string;
  classification?: string;
}

export function parsePolicyFullFallback(text: string): FullParsedPolicy {
  const parsedSectional = parsePolicyText(text);
  
  let policy_no = '';
  const noMatch = text.match(/(POL-SEC-[A-Z0-9\-_]+|POL-[A-Z0-9\-_]+|[A-Z0-9\-_]{4,15}-POL-[A-Z0-9\-_]+)/i);
  if (noMatch) {
    policy_no = noMatch[1].toUpperCase();
  } else {
    const numMatch = text.match(/POL[- ]?[A-Z]{3,5}[- ]?\d{2,4}/i);
    if (numMatch) {
      policy_no = numMatch[0].toUpperCase().replace(/\s/g, '-');
    } else {
      policy_no = 'POL-DRAFT-001';
    }
  }

  let policy_name = '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    let firstLine = lines[0].replace(/^(policy|title|name)[:\-\s]*/i, '').trim();
    if (firstLine.match(/^POL-SEC-\d+$/i) && lines.length > 1) {
      firstLine = lines[1].replace(/^(policy|title|name)[:\-\s]*/i, '').trim();
    }
    policy_name = firstLine;
  }
  if (!policy_name) policy_name = 'Drafted Security Policy';

  let version = '1.0';
  const verMatch = text.match(/v(?:ersion)?\s*(\d+\.\d+)/i);
  if (verMatch) {
    version = verMatch[1];
  }

  let category = 'Information Security';
  let department = 'IT Department';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('clinical') || lowerText.includes('patient') || lowerText.includes('nurse')) {
    category = 'Operations';
    department = 'Clinical / Medical';
  } else if (lowerText.includes('human resource') || lowerText.includes('employee') || lowerText.includes('hiring') || lowerText.includes('disciplinary')) {
    category = 'Human Resources';
    department = 'HR Department';
  } else if (lowerText.includes('physical') || lowerText.includes('facility') || lowerText.includes('environment')) {
    category = 'Physical Security';
    department = 'Facilities Management';
  }

  let classification = 'Confidential';
  if (lowerText.includes('secret')) {
    classification = 'Secret';
  } else if (lowerText.includes('restricted')) {
    classification = 'Restricted';
  }

  return {
    ...parsedSectional,
    policy_no,
    policy_name,
    version,
    category,
    department,
    classification
  };
}

export const MASTER_34_POLICY_TEMPLATES = [
  { policy_no: "POL-SEC-001", policy_name: "Information Security High Level Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-002", policy_name: "Human Resource Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-003", policy_name: "Information Asset Management and Classification Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-004", policy_name: "Communications and Operations Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-005", policy_name: "Clear Desk and Clear Screen Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-006", policy_name: "Access Control Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-007", policy_name: "Information Systems Acquisition Development and Maintenance", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-008", policy_name: "Health Information and Security Policy", category: "EHR Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-009", policy_name: "Antivirus Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-010", policy_name: "Acceptable Usage Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-011", policy_name: "Password Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-012", policy_name: "Third Party Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-013", policy_name: "Physical & Environmental Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-014", policy_name: "Data Retention and Disposal Policy", category: "Patient Data Privacy", doc_type: "Policy" },
  { policy_no: "POL-SEC-015", policy_name: "Information Assets Disposal Policy & Procedure", category: "Asset Management", doc_type: "Procedure" },
  { policy_no: "POL-SEC-016", policy_name: "Information Systems Continuity Policy", category: "Business Continuity", doc_type: "Policy" },
  { policy_no: "POL-SEC-017", policy_name: "Security Baseline Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-018", policy_name: "Vulnerability Management Policy Process", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-019", policy_name: "Change Management Plan and Procedure", category: "Clinical Quality Operations", doc_type: "Procedure" },
  { policy_no: "POL-SEC-020", policy_name: "Patch Management Policy and Procedure", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-021", policy_name: "Information Data Backup Restoration Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-022", policy_name: "Removable Media Management Policy and Procedures", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-023", policy_name: "Information Exchange Policies and Procedures", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-024", policy_name: "Risk Management Policy and Procedures", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-025", policy_name: "Information Security Incidents Management Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-026", policy_name: "Information Security Incident Management Procedure", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-027", policy_name: "BYOD (Bring Your Own Device) Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-028", policy_name: "Disciplinary Policy and Procedure", category: "Information Security", doc_type: "Procedure" },
  { policy_no: "POL-SEC-029", policy_name: "Cloud Security Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "POL-SEC-030", policy_name: "Data Privacy Policy", category: "Patient Data Privacy", doc_type: "Policy" },
  { policy_no: "POL-SEC-031", policy_name: "Procedure for Control of Documentation", category: "Clinical Quality Operations", doc_type: "Procedure" },
  { policy_no: "M-Policy-002", policy_name: "Statement of Applicability", category: "Information Security", doc_type: "Policy" },
  { policy_no: "M-Policy-008", policy_name: "Acceptable Usage Policy", category: "Information Security", doc_type: "Policy" },
  { policy_no: "M-Policy-019", policy_name: "Clear Desk & Clear Screen Policy", category: "Information Security", doc_type: "Policy" }
];


