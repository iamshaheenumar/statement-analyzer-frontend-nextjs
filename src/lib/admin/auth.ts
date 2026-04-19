import { cookies } from 'next/headers';

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const token = store.get('admin_session')?.value;
  return token === secret;
}
