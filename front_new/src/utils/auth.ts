import jwtDecode from 'jwt-decode';

export interface JWTPayload {
  sub: string;
  role: string;
  platform_id: number | null;
  user_id: number;
  exp: number;
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getUserRole = (token: string): string | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.role || null;
  } catch (error) {
    return null;
  }
};

export const getUserId = (token: string): number | null => {
  try {
    const decoded = decodeToken(token);
    return decoded?.user_id || null;
  } catch (error) {
    return null;
  }
};

export const hasRole = (token: string, requiredRole: string): boolean => {
  const userRole = getUserRole(token);
  if (!userRole) return false;
  
  const roleHierarchy = {
    'user': 1,
    'admin': 2,
    'superuser': 3
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
};

export const isAdmin = (token: string): boolean => {
  return hasRole(token, 'admin');
};

export const isSuperuser = (token: string): boolean => {
  return hasRole(token, 'superuser');
}; 