import { Link } from 'react-router-dom';

/**
 * ForbiddenPage - 403 page when user does not have access rights.
 */
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-ink">403 - Forbidden</h1>
        <p className="text-muted mt-2">You do not have access to this page.</p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-6 font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
