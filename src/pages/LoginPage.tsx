import { motion } from 'framer-motion';
import { Compass, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        if (password !== confirmPassword) {
          showMessage('Passwörter stimmen nicht überein', 'error');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          showMessage('Passwort muss mindestens 6 Zeichen lang sein', 'error');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          showMessage(`Registrierung fehlgeschlagen: ${error.message}`, 'error');
        } else if (data.user && !data.user.email_confirmed_at) {
          showMessage(
            'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse. Überprüfe deinen Posteingang.',
            'success'
          );
          // In local development, show Inbucket link
          if (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
          ) {
            setTimeout(() => {
              showMessage(
                'Lokale Entwicklung: E-Mails findest du unter http://127.0.0.1:54324',
                'info'
              );
            }, 3000);
          }
        } else {
          showMessage('Registrierung erfolgreich! Du wirst automatisch angemeldet.', 'success');
          navigate('/');
        }
      } else {
        // Sign in flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            showMessage(
              'Bitte bestätige zuerst deine E-Mail-Adresse. Überprüfe deinen Posteingang.',
              'error'
            );
          } else if (error.message.includes('Invalid login credentials')) {
            showMessage('Ungültige Anmeldedaten. Überprüfe E-Mail und Passwort.', 'error');
          } else {
            showMessage(`Anmeldung fehlgeschlagen: ${error.message}`, 'error');
          }
        } else {
          showMessage('Anmeldung erfolgreich!', 'success');
          navigate('/');
        }
      }
    } catch (err) {
      showMessage('Ein unerwarteter Fehler ist aufgetreten.', 'error');
      console.error('Auth error:', err);
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#2f4f4f] to-[#00b3b3] text-white px-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Compass size={48} color="#5dade2" style={{ filter: 'drop-shadow(0 0 2px #5dade2)' }} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">{isSignUp ? 'Registrierung' : 'Anmeldung'}</h1>
          <p className="text-white/80">
            {isSignUp ? 'Erstelle dein Kompass-Konto' : 'Willkommen zurück bei Kompass'}
          </p>
        </div>

        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          {/* Email Field */}
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60"
            />
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <Lock
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password Field (only for sign up) */}
          {isSignUp && (
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort bestätigen"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#2f4f4f] font-semibold py-3 rounded-xl shadow hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#2f4f4f]/30 border-t-[#2f4f4f] rounded-full animate-spin"></div>
                {isSignUp ? 'Registriere...' : 'Melde an...'}
              </span>
            ) : isSignUp ? (
              'Registrieren'
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm ${
              messageType === 'success'
                ? 'bg-green-500/20 text-green-100'
                : messageType === 'error'
                  ? 'bg-red-500/20 text-red-100'
                  : 'bg-blue-500/20 text-blue-100'
            }`}
          >
            {message}
          </div>
        )}

        {/* Toggle between sign in/sign up */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-white/80 hover:text-white underline"
          >
            {isSignUp ? 'Bereits registriert? Hier anmelden' : 'Noch kein Konto? Hier registrieren'}
          </button>
        </div>

        {/* Back to Landing */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-white/60 hover:text-white/80 text-sm underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>

      {/* Development Hint */}
      {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>🧪 Lokale Entwicklung</p>
          <p>
            E-Mails:{' '}
            <a
              href="http://127.0.0.1:54324"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inbucket
            </a>
          </p>
          <p>
            Database:{' '}
            <a
              href="http://127.0.0.1:54323"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase Studio
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
