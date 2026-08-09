/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'consent'
});

let isSigningIn = false;
let cachedAccessToken: string | null = sessionStorage.getItem('sh_gdrive_access_token');

// Auth state listener initializer
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    const token = cachedAccessToken || sessionStorage.getItem('sh_gdrive_access_token');
    if (user && token) {
      cachedAccessToken = token;
      if (onAuthSuccess) onAuthSuccess(user, token);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with popup to get both User and fresh Access Token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to extract Google Access Token from Firebase auth credential.');
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('sh_gdrive_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error during Google Sign-In popup:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log out of Firebase and clear token
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('sh_gdrive_access_token');
};

// Clear cached access token
export const clearAccessToken = () => {
  cachedAccessToken = null;
  sessionStorage.removeItem('sh_gdrive_access_token');
};

// Check if we currently have an access token
export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem('sh_gdrive_access_token');
  }
  return cachedAccessToken;
};

// DRIVE API OPERATIONS

export interface BackupDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

/**
 * Uploads compliance backup data as a JSON file to the user's Google Drive.
 */
export const backupToGoogleDrive = async (
  backupData: any,
  companyName: string
): Promise<BackupDriveFile> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No active Google session found. Please click "Connect Google Account" to authorize.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `smarthub_compliance_backup_${companyName.replace(/\s+/g, '_')}_${timestamp}.json`;

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    description: `Auto-generated backup file for SMARTHUB Compliance Roster and registers for ${companyName}.`
  };

  const boundary = 'smarthub_backup_upload_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData) +
    close_delim;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403 || errorText.includes('UNAUTHENTICATED') || errorText.includes('Invalid Credentials')) {
      clearAccessToken();
      throw new Error('Google Drive session expired or unauthenticated. Please click "Connect Google Account" to sign in again.');
    }
    throw new Error(`Google Drive upload failed: ${response.statusText}. Details: ${errorText}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name,
    createdTime: new Date().toISOString()
  };
};

/**
 * Lists all existing smarthub compliance backups inside the user's Google Drive.
 */
export const listBackupsFromGoogleDrive = async (): Promise<BackupDriveFile[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No active Google session found. Please click "Connect Google Account" to authorize.');
  }

  const query = encodeURIComponent("name contains 'smarthub_compliance_backup' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403 || errorText.includes('UNAUTHENTICATED') || errorText.includes('Invalid Credentials')) {
      clearAccessToken();
      throw new Error('Google Drive session expired or unauthenticated. Please click "Connect Google Account" to sign in again.');
    }
    throw new Error(`Failed to retrieve backups from Google Drive: ${response.statusText}. Details: ${errorText}`);
  }

  const result = await response.json();
  return result.files || [];
};

/**
 * Downloads a backup file's parsed JSON contents from Google Drive.
 */
export const downloadBackupFromGoogleDrive = async (fileId: string): Promise<any> => {
  let token = getAccessToken();
  if (!token) {
    throw new Error('No active Google session found. Please sign in with Google first.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  let response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401 || response.status === 403) {
    try {
      const authRes = await googleSignIn();
      if (authRes && authRes.accessToken) {
        token = authRes.accessToken;
        response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (reAuthErr) {
      console.warn('Re-authentication during download failed:', reAuthErr);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download backup file (${response.status} ${response.statusText}): ${errorText}`);
  }

  const rawText = await response.text();
  try {
    let parsed = JSON.parse(rawText);
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        // Keep single-parsed value if second parse fails
      }
    }
    return parsed;
  } catch (parseError) {
    console.error('Error parsing downloaded backup payload:', parseError);
    throw new Error('Downloaded backup file has invalid JSON content.');
  }
};

/**
 * Moves a backup file to Trash in Google Drive (Manual removal option)
 */
export const deleteBackupFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  let token = getAccessToken();
  if (!token) {
    throw new Error('No active Google session found. Please sign in with Google first.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  let response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trashed: true })
  });

  if (response.status === 401 || response.status === 403) {
    try {
      const authRes = await googleSignIn();
      if (authRes && authRes.accessToken) {
        token = authRes.accessToken;
        response = await fetch(url, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trashed: true })
        });
      }
    } catch (reAuthErr) {
      console.warn('Re-authentication during delete failed:', reAuthErr);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete backup (${response.status} ${response.statusText}): ${errorText}`);
  }

  return true;
};
