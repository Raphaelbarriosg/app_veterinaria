import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasToken =
    cookieStore.has('access_token') || cookieStore.has('refresh_token');

  if (!hasToken) {
    redirect('/login');
  }

  // Si hay token, redirigir al dashboard general (el middleware/layout
  // determinará el rol y mostrará la vista correcta)
  redirect('/dashboard');
}
