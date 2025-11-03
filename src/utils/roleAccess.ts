import { ROLE_MODULES } from '../constants/rolePermissions';

export function canAccessModule(roleInternalName: string, module: string): boolean {
  return ROLE_MODULES[roleInternalName]?.includes(module) ?? false;
}
