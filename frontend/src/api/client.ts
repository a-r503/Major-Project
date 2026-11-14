import { 
  User, Order, Investigation, DashboardStats, 
  ModelStatusCard, LoginActivity, FeedbackRecord 
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('foodguard_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('foodguard_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('foodguard_token');
  localStorage.removeItem('foodguard_user');
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem('foodguard_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem('foodguard_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || 'An error occurred during API communication');
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
      const res = await request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      return res;
    },
    register: async (full_name: string, email: string, password: string, role: string = 'customer'): Promise<{ access_token: string; user: User }> => {
      const res = await request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password, role })
      });
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      return res;
    },
    forgotPassword: (email: string) => request<{ status: string; message: string }>('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }),
    getMe: () => request<User>('/auth/me'),
    getUsers: () => request<User[]>('/auth/users'),
    getActivity: () => request<LoginActivity[]>('/auth/activity')
  },

  // Orders
  orders: {
    list: (search?: string) => request<Order[]>(`/orders${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get: (orderNumber: string) => request<Order>(`/orders/${encodeURIComponent(orderNumber)}`),
    create: (customerId: number, restaurantId: number, itemName: string, amount: number) => 
      request<Order>(`/orders?customer_id=${customerId}&restaurant_id=${restaurantId}&item_name=${encodeURIComponent(itemName)}&amount=${amount}`, {
        method: 'POST'
      }),
    uploadDispatchPhoto: async (orderNumber: string, file: File): Promise<Order> => {
      const formData = new FormData();
      formData.append('dispatch_photo', file);
      const token = getAuthToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}/dispatch-photo`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Dispatch photo upload failed');
      }
      return res.json();
    },
    uploadHandoverPhoto: async (orderNumber: string, file: File): Promise<Order> => {
      const formData = new FormData();
      formData.append('handover_photo', file);
      const token = getAuthToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}/handover-photo`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Handover photo upload failed');
      }
      return res.json();
    }
  },

  // Investigations
  investigations: {
    submit: async (formData: FormData): Promise<Investigation> => {
      const token = getAuthToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch(`${API_BASE}/investigations`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || 'Dispute submission failed');
      }

      return res.json();
    },
    list: (params: { status?: string; verdict?: string; category?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.status) qs.append('status', params.status);
      if (params.verdict) qs.append('verdict', params.verdict);
      if (params.category) qs.append('category', params.category);
      if (params.limit) qs.append('limit', params.limit.toString());
      return request<Investigation[]>(`/investigations?${qs.toString()}`);
    },
    get: (id: number) => request<Investigation>(`/investigations/${id}`),
    updateVerdict: (id: number, verdictData: { final_verdict: string; responsible_party: string; status: string; resolution_notes?: string }) => 
      request<Investigation>(`/investigations/${id}/verdict`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verdictData)
      }),
    submitRestaurantResponse: (id: number, restaurant_response: string) =>
      request<Investigation>(`/investigations/${id}/restaurant-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_response })
      }),
    submitCourierStatement: (id: number, courier_statement: string) =>
      request<Investigation>(`/investigations/${id}/courier-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier_statement })
      })
  },

  // Models
  models: {
    getStatus: () => request<ModelStatusCard[]>('/models/status'),
    uploadWeights: async (modelId: string, file: File) => {
      const formData = new FormData();
      formData.append('model_id', modelId);
      formData.append('weights_file', file);
      
      const token = getAuthToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const res = await fetch(`${API_BASE}/models/weights/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) throw new Error('Weights upload failed');
      return res.json();
    }
  },

  // Dashboard
  dashboard: {
    getStats: () => request<DashboardStats>('/dashboard/stats'),
    getRoleStats: () => request<any>('/dashboard/role-stats'),
    getPartyProfile: (partyType: 'customer' | 'restaurant' | 'delivery_partner', partyId: number) =>
      request<any>(`/dashboard/party-profile?party_type=${partyType}&party_id=${partyId}`)
  },

  // Feedback & Retraining Pipeline
  feedback: {
    submit: (investigationId: number, data: {
      prediction_id?: number;
      is_prediction_correct: boolean;
      corrected_classes?: string[];
      suitable_for_training: boolean;
      dataset_split: string;
      reviewer_notes?: string;
    }) => request<FeedbackRecord>(`/feedback?investigation_id=${investigationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    exportDataset: (split?: string) => request<any>(`/feedback/export${split ? `?split=${split}` : ''}`)
  }
};
