import { Client } from '../types';

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
