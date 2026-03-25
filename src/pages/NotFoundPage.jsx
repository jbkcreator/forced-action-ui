import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="gradient-bg min-h-screen text-white flex items-center justify-center">
      <div className="relative z-[1] text-center px-6">
        <h1 className="text-8xl font-black text-slate-700 mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <Link
          to="/"
          className="btn-primary inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-xl"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
