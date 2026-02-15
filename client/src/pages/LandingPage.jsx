import { Link } from 'react-router-dom';
import { Vote, Shield, BarChart3, Users, CheckCircle2, Zap, Monitor, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      {/* Nav */}
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Vote className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">LASUMSA Elections</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="text-primary-200 hover:text-white transition font-medium hidden sm:block">
            Admin Login
          </Link>
          <Link to="/vote" className="btn-primary !bg-white !text-primary-900 hover:!bg-primary-50">
            Vote Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 md:py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-800/50 border border-primary-600/30 text-primary-200 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Secure Cloud-based Elections
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Your Elections.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Any Device. Any Location.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create secure elections for your organization in seconds. Voters can vote from any device with real-time result monitoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/vote" className="w-full sm:w-auto btn-primary !py-4 !px-10 !text-lg !bg-white !text-primary-900 hover:!bg-primary-50 flex items-center justify-center gap-2">
              <Vote className="w-5 h-5" />
              Cast Your Vote
            </Link>
            <Link to="/admin/login" className="w-full sm:w-auto btn-secondary !py-4 !px-10 !text-lg !border-primary-500 !text-white !bg-transparent hover:!bg-primary-800 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Built with security, transparency, and ease of use in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Lock, title: 'Secure Voting', desc: 'Each voter has a unique matric number and voting code. One vote per person guaranteed.' },
              { icon: Monitor, title: 'Mobile Ready', desc: 'Optimized for all devices. Vote from your phone, tablet, or computer.' },
              { icon: BarChart3, title: 'Live Results', desc: 'Real-time vote counting with beautiful charts and analytics.' },
              { icon: Users, title: 'Easy Management', desc: 'Import voters, create ballots, and launch elections in minutes.' }
            ].map((f, i) => (
              <div key={i} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Building an election is easy</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Create Ballot', desc: 'Add positions and candidates with photos and bios.' },
              { step: '02', title: 'Add Voters', desc: 'Import eligible voters with their matric numbers.' },
              { step: '03', title: 'Launch Election', desc: 'Set dates and launch when ready.' },
              { step: '04', title: 'Monitor Results', desc: 'Watch live results with real-time analytics.' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-extrabold text-primary-200 mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Vote className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold">LASUMSA Elections</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} LASUMSA Election Runner. Secure online voting platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
