/**
 * Проверяет, является ли пользователь супер админом
 */
export const isSuperAdmin = (user) => {
    return user?.role === 'superadmin';
};
/**
 * Получает роль пользователя на конкретной платформе
 */
export const getUserPlatformRole = (user, platformUsers) => {
    if (!user)
        return null;
    const platformUser = platformUsers.find(pu => pu.email === user.email);
    return platformUser?.platform_role || null;
};
/**
 * Проверяет, имеет ли пользователь роль на платформе
 */
export const hasPlatformRole = (user, platformUsers, allowedRoles) => {
    const role = getUserPlatformRole(user, platformUsers);
    return role ? allowedRoles.includes(role) : false;
};
/**
 * Проверяет, может ли пользователь редактировать платформу
 */
export const canEditPlatform = (user, platformUsers) => {
    return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};
/**
 * Проверяет, может ли пользователь управлять пользователями платформы
 */
export const canManagePlatformUsers = (user, platformUsers) => {
    return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};
/**
 * Проверяет, может ли пользователь добавлять устройства на платформу
 */
export const canAddPlatformDevices = (user, platformUsers) => {
    return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};
/**
 * Проверяет, может ли пользователь просматривать платформу
 */
export const canViewPlatform = (user, platformUsers) => {
    return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager', 'user', 'viewer']);
};
/**
 * Получает человекочитаемое название роли
 */
export const getRoleLabel = (role) => {
    const roleLabels = {
        'admin': 'Администратор платформы',
        'manager': 'Менеджер',
        'user': 'Пользователь платформы',
        'viewer': 'Наблюдатель',
        'superadmin': 'Супер-админ'
    };
    return roleLabels[role] || role;
};
/**
 * Получает цвет для роли (для Material-UI)
 */
export const getRoleColor = (role) => {
    const roleColors = {
        'admin': 'error',
        'manager': 'warning',
        'user': 'primary',
        'viewer': 'default'
    };
    return roleColors[role] || 'default';
};
export function getPlatformRole(user, platform) {
    if (!user || !platform || !user.platform_roles)
        return null;
    const pr = user.platform_roles.find(r => r.platform_id === platform.id);
    return pr ? pr.role : null;
}
export function canAddDevice(user, platform) {
    if (!user)
        return false;
    if (user.role === 'superadmin')
        return true; // super-admin
    const role = getPlatformRole(user, platform);
    return role === 'admin' || role === 'manager';
}
export function canEditDevice(user, platform) {
    return canAddDevice(user, platform);
}
export function canManageUsers(user, platform) {
    if (!user)
        return false;
    if (user.role === 'superadmin')
        return true;
    const role = getPlatformRole(user, platform);
    return role === 'admin';
}
