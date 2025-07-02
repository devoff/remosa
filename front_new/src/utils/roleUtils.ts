import { User, Platform } from '../types';

export interface PlatformUser {
  id: number;
  email: string;
  platform_role: string;
  is_active: boolean;
}

/**
 * Проверяет, является ли пользователь супер админом
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Получает роль пользователя на конкретной платформе
 */
export const getUserPlatformRole = (
  user: User | null, 
  platformUsers: PlatformUser[]
): string | null => {
  if (!user) return null;
  const platformUser = platformUsers.find(pu => pu.email === user.email);
  return platformUser?.platform_role || null;
};

/**
 * Проверяет, имеет ли пользователь роль на платформе
 */
export const hasPlatformRole = (
  user: User | null,
  platformUsers: PlatformUser[],
  allowedRoles: string[]
): boolean => {
  const role = getUserPlatformRole(user, platformUsers);
  return role ? allowedRoles.includes(role) : false;
};

/**
 * Проверяет, может ли пользователь редактировать платформу
 */
export const canEditPlatform = (
  user: User | null,
  platformUsers: PlatformUser[]
): boolean => {
  return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};

/**
 * Проверяет, может ли пользователь управлять пользователями платформы
 */
export const canManagePlatformUsers = (
  user: User | null,
  platformUsers: PlatformUser[]
): boolean => {
  return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};

/**
 * Проверяет, может ли пользователь добавлять устройства на платформу
 */
export const canAddPlatformDevices = (
  user: User | null,
  platformUsers: PlatformUser[]
): boolean => {
  return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager']);
};

/**
 * Проверяет, может ли пользователь просматривать платформу
 */
export const canViewPlatform = (
  user: User | null,
  platformUsers: PlatformUser[]
): boolean => {
  return isSuperAdmin(user) || hasPlatformRole(user, platformUsers, ['admin', 'manager', 'user', 'viewer']);
};

/**
 * Получает человекочитаемое название роли
 */
export const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    'admin': 'Администратор платформы',
    'manager': 'Менеджер', 
    'user': 'Пользователь платформы',
    'viewer': 'Наблюдатель',
    'super_admin': 'Супер-админ'
  };
  return roleLabels[role] || role;
};

/**
 * Получает цвет для роли (для Material-UI)
 */
export const getRoleColor = (role: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  const roleColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    'admin': 'error',
    'manager': 'warning',
    'user': 'primary', 
    'viewer': 'default'
  };
  return roleColors[role] || 'default';
};

export function getPlatformRole(user: User | null, platform: Platform | null): string | null {
  if (!user || !platform || !user.platform_roles) return null;
  const pr = user.platform_roles.find(r => r.platform_id === platform.id);
  return pr ? pr.role : null;
}

export function canAddDevice(user: User | null, platform: Platform | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true; // super-admin
  const role = getPlatformRole(user, platform);
  return role === 'admin' || role === 'manager';
}

export function canEditDevice(user: User | null, platform: Platform | null): boolean {
  return canAddDevice(user, platform);
}

export function canManageUsers(user: User | null, platform: Platform | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const role = getPlatformRole(user, platform);
  return role === 'admin';
} 