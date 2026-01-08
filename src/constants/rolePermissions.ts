// Módulos permitidos por cada rol
export const ROLE_MODULES: Record<string, string[]> = {
  admin: ['accessControl', 'statistics', 'chats'],
  supervisor: ['statistics', 'chats'],
  supervisorl4: ['statistics', 'chats'],
  supervisorl1: ['statistics', 'chats'],
  user: ['chats'],
};
