import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertTriangle, Construction } from 'lucide-react';
import { useAuthStore } from '@/store/appStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border-4 border-yellow-500 rotate-45" />
        <div className="absolute bottom-32 right-32 w-24 h-24 border-4 border-blue-500 rotate-12" />
        <div className="absolute top-40 right-40 w-16 h-16 border-4 border-red-500 -rotate-12" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-800 border-4 border-yellow-500 mb-4">
            <Construction size={40} className="text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-white font-display tracking-wider">
            工程管理系统
          </h1>
          <p className="text-slate-400 mt-2 text-sm tracking-widest">
            CONSTRUCTION MANAGEMENT SYSTEM
          </p>
        </div>

        <div className="bg-white/95 border-4 border-slate-300 p-8 shadow-2xl">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500 -translate-x-2 -translate-y-2" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-500 translate-x-2 translate-y-2" />

          <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display">
            用户登录
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-10"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg font-display tracking-wide"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-500 tracking-wider">
              © 2024 CONSTRUCTION MANAGEMENT SYSTEM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
