/**
 * RBAC generico: i ruoli e i permessi di dominio si aggiungono qui,
 * la matrice è l'unico punto di verità e i controlli sono tipizzati.
 */
export const ROLES = ["guest", "user", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "content.read",
  "content.write",
  "settings.manage",
  "tenant.admin",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  guest: ["content.read"],
  user: ["content.read", "content.write"],
  manager: ["content.read", "content.write", "settings.manage"],
  admin: ["content.read", "content.write", "settings.manage", "tenant.admin"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
