import { Platform } from 'react-native';
import { getAuthToken } from './auth';

// Helper function to validate MongoDB ObjectId format
// ObjectIds are 24-character hexadecimal strings
function isValidObjectId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  // MongoDB ObjectId is exactly 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Backend API Configuration
// ============================================
// PRODUCTION MODE: Set to true to use Railway server
// ============================================
const USE_PRODUCTION = true; // Set to true to use Railway, false for local development
const PRODUCTION_API_URL = 'https://web-production-40b9d.up.railway.app/api'; // TODO: Replace with your Railway URL

// Local Development Configuration
const IS_PHYSICAL_DEVICE = true;
const PHYSICAL_DEVICE_IP = '192.168.18.126'; // Update this to your computer's IP address
const BACKEND_PORT = 5001;

const getApiBaseUrl = () => {
  // Use production URL if enabled
  if (USE_PRODUCTION) {
    return PRODUCTION_API_URL;
  }
  
  // Local development URLs
  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}/api`;
  } else if (Platform.OS === 'ios') {
    return IS_PHYSICAL_DEVICE
      ? `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api`
      : `http://localhost:${BACKEND_PORT}/api`;
  } else if (Platform.OS === 'android') {
    return IS_PHYSICAL_DEVICE
      ? `http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api`
      : `http://10.0.2.2:${BACKEND_PORT}/api`;
  }
  return `http://localhost:${BACKEND_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

// Log API URL for debugging - ALWAYS log in production to verify URL
console.log(`[API] 🔍 Configuration Check:`);
console.log(`[API] USE_PRODUCTION: ${USE_PRODUCTION}`);
console.log(`[API] Using base URL: ${API_BASE_URL}`);
console.log(`[API] Platform: ${Platform.OS}, Physical Device: ${IS_PHYSICAL_DEVICE}`);
if (!USE_PRODUCTION) {
  console.warn(`[API] ⚠️  WARNING: Using LOCAL development mode! App will only work on same WiFi!`);
  console.warn(`[API] ⚠️  Set USE_PRODUCTION = true to use Railway (works from anywhere)`);
} else {
  console.log(`[API] ✅ Using PRODUCTION mode (Railway) - should work from any WiFi`);
}

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 30000
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(
        () => reject(new Error('Network request timed out. Please check if the backend server is running and accessible.')),
        timeout
      )
    ),
  ]);
}

// Get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// API Response type
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Group / Round types
export interface RoundSummary {
  id: string;
  roundNumber: number;
  recipientParticipantId: string;
  status: string; // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  participants?: Participant[];
  amountPerPerson?: number;
  frequency?: 'MONTHLY' | 'WEEKLY';
  collectionDate?: number;
  totalSavings?: number;
  isOrderSet?: boolean;
  currentRecipient?: string;
  currentRecipientIndex?: number;
  status?: string;
   // New round-based fields from backend
  rounds?: RoundSummary[];
  currentRound?: RoundSummary | null;
  createdAt?: string;
  createdBy?: {
    id: string | null;
    name: string;
  } | null;
}

export interface Participant {
  id?: string;
  name: string;
  order?: number | null;
  isPaid?: boolean;
  paidAt?: string | null;
  hasReceivedPayment?: boolean;
  receivedPaymentAt?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

export interface GroupLogEntry {
  id: string;
  type: 'payment';
  groupId: string;
  participantId?: string | null;
  participantName?: string | null;
  amount?: number;
  roundNumber?: number | null;
  paidBy?: {
    id: string;
    name: string;
  } | null;
  paidAt?: string;
  createdAt?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

// Create Group
export async function createGroup(name: string, memberCount: number): Promise<Group> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, memberCount }),
  });

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to create group');
  }

  return json.data.group;
}

// Add Participants
export async function addParticipants(
  groupId: string,
  participants: (string | { userId?: string; user?: string; name?: string; email?: string })[]
): Promise<Group> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/participants`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ participants }),
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to add participants');
  }

  return json.data.group;
}

// Remove Participant
export async function removeParticipant(groupId: string, participantId: string): Promise<Group> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/participants/${participantId}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to remove participant');
  }

  return json.data.group;
}

// Set Collection Details
export async function setCollectionDetails(
  groupId: string,
  amountPerPerson: number,
  frequency: 'MONTHLY' | 'WEEKLY',
  collectionDate: number
): Promise<Group> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/collection`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        amountPerPerson,
        frequency,
        collectionDate,
      }),
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to set collection details');
  }

  return json.data.group;
}

// Get Group Details
export async function getGroupDetails(groupId: string): Promise<Group> {
  // Validate groupId format before making API call
  if (!isValidObjectId(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}`,
    {
      method: 'GET',
      headers,
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to get group details');
  }

  return json.data.group;
}

// Spin for Order
export async function spinForOrder(groupId: string): Promise<Group> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/spin`,
    {
      method: 'POST',
      headers,
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to spin for order');
  }

  return json.data.group;
}

// Update Payment Status
export async function updatePaymentStatus(
  groupId: string,
  participantId: string,
  isPaid: boolean
): Promise<Participant> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/participants/${participantId}/payment`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ isPaid }),
    }
  );

  const json: ApiResponse<{ participant: Participant }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update payment status');
  }

  return json.data.participant;
}

// Get User Groups
export async function getUserGroups(): Promise<Group[]> {
  try {
    const headers = await getAuthHeaders();
    const token = await getAuthToken();
    
    if (__DEV__) {
      console.log('[API] Getting user groups');
      console.log('[API] Token present:', token ? 'Yes' : 'No');
      if (token) {
        console.log('[API] Token length:', token.length);
        console.log('[API] Token preview:', token.substring(0, 20) + '...');
      }
    }
    
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/groups`,
      {
        method: 'GET',
        headers,
      },
      30000 // 30 second timeout
    );

    // Check if response is JSON before parsing
    let json: ApiResponse<{ groups: Group[] }>;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      json = await response.json();
    } else {
      // If not JSON, get text response for debugging
      const text = await response.text();
      console.error('[API] Non-JSON response:', text);
      console.error('[API] Response status:', response.status);
      console.error('[API] Response URL:', response.url);
      
      if (response.status === 404 || text.includes('not found') || text.includes('Application not found')) {
        throw new Error(`Railway service not found or not running. Please check:\n1. Railway dashboard - is service online?\n2. Service URL: ${API_BASE_URL}\n3. Check Railway deployment logs`);
      }
      
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }

    if (!response.ok || !json.success || !json.data) {
      // Log full response for debugging
      console.error('[API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        message: json.message,
        success: json.success,
        data: json.data
      });
      
      // Handle Railway-specific errors
      if (json.message && (json.message.includes('not found') || json.message.includes('Application not found'))) {
        const errorMsg = `Railway service error: ${json.message}\n\n` +
          `Troubleshooting:\n` +
          `1. Check Railway dashboard: https://railway.app\n` +
          `2. Verify service is online (green dot)\n` +
          `3. Service URL: ${API_BASE_URL}\n` +
          `4. Check Railway deployment logs for errors\n` +
          `5. Try redeploying the service in Railway`;
        throw new Error(errorMsg);
      }
      
      // If unauthorized, clear token and provide helpful error message
      if (response.status === 401) {
        const errorMsg = json.message || 'Not authorized';
        console.error('[API] Authentication error:', errorMsg);
        console.error('[API] Token may be expired or invalid. Clearing stored token...');
        
        // Clear invalid token
        try {
          const { clearAuth } = await import('./auth');
          await clearAuth();
          console.log('[API] Cleared invalid auth token');
        } catch (clearError) {
          console.error('[API] Error clearing auth:', clearError);
        }
        
        throw new Error(`${errorMsg}. Please log in again.`);
      }
      
      throw new Error(json.message || 'Failed to get groups');
    }

    return json.data.groups;
  } catch (error: any) {
    // Improve error messages for common issues
    if (error.message.includes('timed out')) {
      const errorMsg = `Connection timeout!\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Make sure backend is running: cd ayuuto-backend && npm start\n2. Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1\n3. Update IP in utils/api.ts line 7 (current: ${PHYSICAL_DEVICE_IP})\n4. Ensure phone and computer are on the SAME Wi-Fi network\n5. Check firewall allows port ${BACKEND_PORT}`;
      throw new Error(errorMsg);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      const errorMsg = `Cannot connect to server!\n\nTrying to connect to: ${API_BASE_URL}\n\nTroubleshooting:\n1. Backend running? Check: http://${PHYSICAL_DEVICE_IP}:${BACKEND_PORT}/api/groups\n2. IP correct? Current: ${PHYSICAL_DEVICE_IP}\n3. Same Wi-Fi? Phone and computer must be on same network\n4. Firewall? Allow port ${BACKEND_PORT} or disable temporarily`;
      throw new Error(errorMsg);
    }
    throw error;
  }
}

// Register Push Token
export async function registerPushToken(pushToken: string, platform: string, deviceId?: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${API_BASE_URL}/users/push-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ pushToken, platform, deviceId }),
  });

  const json: ApiResponse<void> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to register push token');
  }
}

// Send Test Notification
export async function sendTestNotification(title?: string, body?: string, data?: Record<string, any>): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${API_BASE_URL}/users/test-notification`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: title || 'Test Notification',
      body: body || 'This is a test notification from the app!',
      data: data || {},
    }),
  });

  const json: ApiResponse<any> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to send test notification');
  }
}

// Delete Group
export async function deleteGroup(groupId: string): Promise<void> {
  // Validate groupId format before making API call
  if (!isValidObjectId(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(`${API_BASE_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers,
  });

  const json: ApiResponse<void> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to delete group');
  }
}

// Next Round - Move to next recipient
export async function nextRound(groupId: string): Promise<Group> {
  // Validate groupId format before making API call
  if (!isValidObjectId(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/next-round`,
    {
      method: 'POST',
      headers,
    }
  );

  const json: ApiResponse<{ group: Group }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to start next round');
  }

  return json.data.group;
}

// Get Group Logs (payment history per group)
export async function getGroupLogs(groupId: string): Promise<GroupLogEntry[]> {
  // Validate groupId format before making API call
  if (!isValidObjectId(groupId)) {
    throw new Error('Invalid group ID format');
  }

  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/logs`,
    {
      method: 'GET',
      headers,
    }
  );

  const json: ApiResponse<{ logs: GroupLogEntry[] }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to get group logs');
  }

  return json.data.logs;
}

// Get Users (for participant selection in group creation)
export async function getUsers(query?: string): Promise<UserSummary[]> {
  const headers = await getAuthHeaders();
  const url =
    `${API_BASE_URL}/users` +
    (query && query.trim().length > 0 ? `?q=${encodeURIComponent(query.trim())}` : '');

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers,
  });

  const json: ApiResponse<{ users: UserSummary[] }> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to load users');
  }

  return json.data.users;
}

// Share Group Link Functions
export interface ShareLinkData {
  shareLink: string;
  shareToken: string;
  expiresAt: string;
  shareSettings: {
    showParticipants: boolean;
    showPaymentStatus: boolean;
    showActivityLog: boolean;
    showAmounts: boolean;
  };
}

// Enable sharing and generate share link
export async function enableGroupSharing(
  groupId: string,
  expiresInDays?: number,
  shareSettings?: {
    showParticipants?: boolean;
    showPaymentStatus?: boolean;
    showActivityLog?: boolean;
    showAmounts?: boolean;
  }
): Promise<ShareLinkData> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/share/enable`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        expiresInDays: expiresInDays || 90,
        shareSettings: shareSettings || {
          showParticipants: true,
          showPaymentStatus: true,
          showActivityLog: true,
          showAmounts: true,
        },
      }),
    }
  );

  const json: ApiResponse<ShareLinkData> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to enable sharing');
  }

  return json.data;
}

// Get existing share link
export async function getGroupShareLink(groupId: string): Promise<ShareLinkData> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/share`,
    {
      method: 'GET',
      headers,
    }
  );

  const json: ApiResponse<ShareLinkData> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to get share link');
  }

  return json.data;
}

// Disable sharing
export async function disableGroupSharing(groupId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/share/disable`,
    {
      method: 'POST',
      headers,
    }
  );

  const json: ApiResponse<void> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Failed to disable sharing');
  }
}

// Regenerate share token
export async function regenerateShareToken(
  groupId: string,
  expiresInDays?: number
): Promise<ShareLinkData> {
  const headers = await getAuthHeaders();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/groups/${groupId}/share/regenerate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        expiresInDays: expiresInDays || 90,
      }),
    }
  );

  const json: ApiResponse<ShareLinkData> = await response.json();

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to regenerate share token');
  }

  return json.data;
}
