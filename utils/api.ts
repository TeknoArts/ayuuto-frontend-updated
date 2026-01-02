import { Platform } from 'react-native';
import { getAuthToken } from './auth';

// Backend API Configuration
// Set to true if testing on a physical device, false for simulator/emulator
const IS_PHYSICAL_DEVICE = true;
const PHYSICAL_DEVICE_IP = '192.168.18.122'; // Update this to your computer's IP address
const BACKEND_PORT = 5001;

const getApiBaseUrl = () => {
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

const API_BASE_URL = getApiBaseUrl();

// Log API URL for debugging
if (__DEV__) {
  console.log(`[API] Using base URL: ${API_BASE_URL} (Platform: ${Platform.OS}, Physical Device: ${IS_PHYSICAL_DEVICE})`);
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

// Group types
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
  createdAt?: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface Participant {
  id?: string;
  name: string;
  order?: number | null;
  isPaid?: boolean;
  paidAt?: string | null;
  hasReceivedPayment?: boolean;
  receivedPaymentAt?: string | null;
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
  participants: string[]
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
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/groups`,
      {
        method: 'GET',
        headers,
      },
      30000 // 30 second timeout
    );

    const json: ApiResponse<{ groups: Group[] }> = await response.json();

    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Failed to get groups');
    }

    return json.data.groups;
  } catch (error: any) {
    // Improve error messages for common issues
    if (error.message.includes('timed out')) {
      throw new Error(`Connection timeout. Make sure the backend server is running at ${API_BASE_URL}. If using a physical device, ensure your device and computer are on the same network and update PHYSICAL_DEVICE_IP in utils/api.ts`);
    }
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Check your network connection and ensure the backend server is running.`);
    }
    throw error;
  }
}

// Delete Group
export async function deleteGroup(groupId: string): Promise<void> {
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

