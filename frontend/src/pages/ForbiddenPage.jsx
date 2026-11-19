import { Link } from 'react-router-dom';

/**
 * ForbiddenPage - 403 page when user does not have access rights.
 */
export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">403 - Forbidden</h1>
        <p className="text-muted mt-2">You do not have access to this page.</p>
        <Link
          to="/"
          className="mt-4 inline-block px-6 py-2 border border-[#84cc16] text-[#84cc16] rounded-xl font-medium hover:bg-[#84cc16] hover:text-white transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
