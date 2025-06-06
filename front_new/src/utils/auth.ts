import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string; // username
    role: string;
    exp: number; // expiration timestamp
}

export const decodeToken = (token: string | null): DecodedToken | null => {
    if (!token) {
        return null;
    }
    try {
        const decoded: DecodedToken = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('access_token');
            return null;
        }
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!decodeToken(token);
};

export const getUserRole = (): string | null => {
    const token = localStorage.getItem('access_token');
    const decoded = decodeToken(token);
    return decoded ? decoded.role : null;
};

export const hasRole = (requiredRole: string | string[]): boolean => {
    const userRole = getUserRole();
    if (!userRole) {
        return false;
    }
    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
}; 