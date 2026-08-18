/** Next.js startup hook — see src/lib/bootstrap.ts. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.AUTO_BOOTSTRAP === 'false') return;
  if (!process.env.DATABASE_URL) return;
  const { bootstrap } = await import('@/lib/bootstrap');
  try {
    await bootstrap();
  } catch (e) {
    // Don't take the process down: the admin should still get a page that
    // explains the problem rather than a dead container.
    console.error('[bootstrap] failed:', e);
  }
}
