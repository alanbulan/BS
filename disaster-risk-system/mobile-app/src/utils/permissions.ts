import { useAuthStore } from '../store/auth';

export type Role = 'guest' | 'user' | 'expert' | 'admin';

export function useAuthPerms() {
  const role = useAuthStore((s) => s.user?.role as Role | undefined);
  const perms = (useAuthStore((s) => s.user?.permissions) as unknown as string[]) || [];

  const inRole = (r: Role) => {
    const order: Role[] = ['guest', 'user', 'expert', 'admin'];
    const cur = role ?? 'guest';
    return order.indexOf(cur) >= order.indexOf(r);
  };

  const hasPerm = (p: string) => (Array.isArray(perms) && perms.includes(p)) || role === 'admin';

  return { role: role ?? 'guest', hasPerm, inRole };
}