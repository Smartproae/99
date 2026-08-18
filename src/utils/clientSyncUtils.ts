import { Client, ThirdPartySupport } from '../types';

export interface SyncedAuthRep {
  name: string;
  email: string;
  phone: string;
  title: string;
  designation: string;
  keyCustodianTitle: string;
  signature?: string;
}

/**
 * Dynamically retrieves all configured EMR Support Vendors for a client.
 * Falls back gracefully to client.emr_support if emr_vendors array is not set.
 */
export function getClientEmrVendors(client?: Client | null): ThirdPartySupport[] {
  if (!client) return [];
  if (client.emr_vendors && client.emr_vendors.length > 0) {
    const valid = client.emr_vendors.filter(v => v && (v.team_name || v.email || v.phone));
    if (valid.length > 0) return valid;
  }
  if (client.emr_support && (client.emr_support.team_name || client.emr_support.email || client.emr_support.phone)) {
    return [{
      id: client.emr_support.id || 'emr-1',
      team_name: client.emr_support.team_name,
      email: client.emr_support.email,
      phone: client.emr_support.phone,
      service_type: client.emr_support.service_type || 'Primary EMR / EHR'
    }];
  }
  return [];
}

/**
 * Dynamically retrieves all configured IT Support Vendors for a client.
 */
export function getClientItVendors(client?: Client | null): ThirdPartySupport[] {
  if (!client) return [];
  if (client.it_vendors && client.it_vendors.length > 0) {
    const valid = client.it_vendors.filter(v => v && (v.team_name || v.email || v.phone));
    if (valid.length > 0) return valid;
  }
  if (client.it_support && (client.it_support.team_name || client.it_support.email || client.it_support.phone)) {
    return [{
      id: client.it_support.id || 'it-1',
      team_name: client.it_support.team_name,
      email: client.it_support.email,
      phone: client.it_support.phone,
      service_type: client.it_support.service_type || 'Managed IT Support'
    }];
  }
  return [];
}

/**
 * Dynamically resolves Authorized Representative details from the Client Organization Profile.
 * Automatically syncs Across Key Custodian, CISO / Compliance Lead, and Security Templates.
 */
export function getSyncedAuthorizedRepresentative(client?: Client): SyncedAuthRep {
  const name = client?.auth_representative?.name || client?.owner_name || 'Authorized Representative';
  const email = client?.auth_representative?.email || client?.owner_email || '';
  const phone = client?.auth_representative?.phone || client?.phone || '';
  const designation = client?.auth_representative?.designation || (email ? `Authorized Person • ${email}` : 'Authorized Person • Facility Security Director');
  const signature = client?.auth_representative?.signature_image || client?.auth_rep_signature || client?.facility_stamp;

  return {
    name,
    email,
    phone,
    title: client?.auth_representative?.designation || 'Authorized Representative & Compliance Lead',
    designation,
    keyCustodianTitle: client?.auth_representative?.designation ? `${client.auth_representative.designation} & Key Custodian` : 'Authorized Person • Facility Security Director & Key Custodian',
    signature,
  };
}

/**
 * Ensures that whenever client organization profile is modified,
 * the Authorized Representative fields (owner_name, auth_representative, doc_owner, etc.)
 * stay synced across all security & compliance document templates.
 */
export function syncClientProfileAuthRep(client: Client): Client {
  const authRepName = client.auth_representative?.name || client.owner_name || '';
  const authRepEmail = client.auth_representative?.email || client.owner_email || '';
  const authRepPhone = client.auth_representative?.phone || client.phone || '';
  const authRepDesignation = client.auth_representative?.designation || 'Authorized Representative';
  const authRepSignature = client.auth_representative?.signature_image || client.auth_rep_signature || '';

  return {
    ...client,
    owner_name: authRepName || client.owner_name,
    owner_email: authRepEmail || client.owner_email,
    doc_owner: authRepName || client.doc_owner,
    doc_approved_by: authRepName || client.doc_approved_by,
    auth_rep_signature: authRepSignature || client.auth_rep_signature,
    auth_representative: {
      name: authRepName,
      email: authRepEmail,
      phone: authRepPhone,
      designation: authRepDesignation,
      signature_image: authRepSignature,
    },
    updated_at: new Date().toISOString(),
  };
}
