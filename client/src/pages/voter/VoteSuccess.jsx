import { Link } from 'react-router-dom';
import { CheckCircle2, Vote, Home } from 'lucide-react';

export default function VoteSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Vote Cast Successfully!</h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            Thank you for participating in the election. Your vote has been securely recorded.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-green-800">
              🔒 Your vote is anonymous and encrypted. No one can trace your ballot back to you.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/" className="btn-primary flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
