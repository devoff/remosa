import { jwtDecode } from 'jwt-decode';
export const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    }
    catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};
export const isTokenValid = (token) => {
    try {
        const decoded = decodeToken(token);
        if (!decoded)
            return false;
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    }
    catch (error) {
        return false;
    }
};
export const getUserRole = (token) => {
    try {
        const decoded = decodeToken(token);
        return decoded?.role || null;
    }
    catch (error) {
        return null;
    }
};
export const getUserId = (token) => {
    try {
        const decoded = decodeToken(token);
        return decoded?.user_id || null;
    }
    catch (error) {
        return null;
    }
};
export const hasRole = (token, requiredRole) => {
    const userRole = getUserRole(token);
    if (!userRole)
        return false;
    const roleHierarchy = {
        'user': 1,
        'admin': 2,
        'superadmin': 3
    };
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userLevel >= requiredLevel;
};
export const isSuperAdmin = (token) => {
    return hasRole(token, 'superadmin');
};
