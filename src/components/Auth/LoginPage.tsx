import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Dumbbell, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { signIn, signUp, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('magic');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMagicLinkSent(true);
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'accesso');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Controlla la tua email!</h2>
          <p className="text-gray-400 mb-6">
            Abbiamo inviato un link magico a <span className="text-purple-400">{email}</span>
          </p>
          <p className="text-sm text-gray-500">
            Clicca sul link nell'email per accedere automaticamente.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="mt-6 text-purple-400 hover:text-purple-300 text-sm"
          >
            Usa un'altra email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LinkinFit</h1>
          <p className="text-gray-400 mt-2">Il tuo personal trainer digitale</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la.tua@email.com"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          {/* Password (solo per login/register) */}
          {mode !== 'magic' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Caricamento...
              </>
            ) : mode === 'magic' ? (
              'Invia Link Magico'
            ) : mode === 'login' ? (
              'Accedi'
            ) : (
              'Registrati'
            )}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="mt-6 text-center space-y-2">
          {mode === 'magic' ? (
            <button
              onClick={() => setMode('login')}
              className="text-gray-400 hover:text-white text-sm"
            >
              Preferisci usare email e password?
            </button>
          ) : (
            <>
              <button
                onClick={() => setMode('magic')}
                className="text-purple-400 hover:text-purple-300 text-sm block w-full"
              >
                Accedi con Link Magico (consigliato)
              </button>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-gray-400 hover:text-white text-sm"
              >
                {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai gia un account? Accedi'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
