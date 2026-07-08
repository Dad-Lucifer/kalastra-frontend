export const API_BASE_URL = 'https://orchid-quail-987185.hostingersite.com/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getTokens = () => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    idToken: localStorage.getItem('idToken'),
  };
};

export const setTokens = (accessToken: string, idToken: string, refreshToken?: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('idToken', idToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('idToken');
};

/**
 * Custom fetch wrapper to handle auth headers and automatic token refresh
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { accessToken } = getTokens();
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    let response = await fetch(url, { ...options, headers });
    
    // Auto-refresh token if we get a 401 and have a refresh token
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh-token') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry the request with the new access token
        const newAccessToken = localStorage.getItem('accessToken');
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        // If refresh fails, sign out
        clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors,
      };
    }

    return data;
  } catch (error: any) {
    console.error('API request error:', error);
    return {
      success: false,
      message: error.message || 'Network error, please check if backend is running.',
    };
  }
}

function decodeJwtForRefresh(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

async function attemptTokenRefresh(): Promise<boolean> {
  const { refreshToken, accessToken, idToken } = getTokens();
  if (!refreshToken) return false;

  const payload = idToken ? decodeJwtForRefresh(idToken) : (accessToken ? decodeJwtForRefresh(accessToken) : null);
  const username = payload ? (payload['cognito:username'] || payload.email) : null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, username }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.idToken, data.data.refreshToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return false;
  }
}
