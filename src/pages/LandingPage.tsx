import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function LandingPage() {
  const { deferredPrompt, promptInstall } = useInstallPrompt();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#2f4f4f] to-[#00b3b3] text-white px-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        className="mb-6"
      >
        <Compass size={64} color="#5dade2" style={{ filter: 'drop-shadow(0 0 2px #5dade2)' }} />
      </motion.div>
      <h1 className="text-4xl font-bold mb-4">🧭 Kompass-App</h1>
      <p className="text-lg max-w-md mb-6">
        Dein digitaler Begleiter nach dem Klinikaufenthalt – für Stimmung, Skills und Orientierung
        im Alltag.
      </p>
      <ul className="mb-6 space-y-1">
        <li>✅ Mood-Tracking mit Kompass</li>
        <li>✅ Skills & Notfallpläne</li>
        <li>✅ Ratgeber für den Schul- & Lebensalltag</li>
      </ul>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-white text-[#2f4f4f] font-semibold px-4 py-2 rounded-xl shadow hover:bg-gray-100 transition"
        >
          App starten
        </Link>
        {deferredPrompt && (
          <button
            onClick={() => void promptInstall()}
            className="bg-transparent border border-white font-semibold px-4 py-2 rounded-xl hover:bg-white hover:text-[#2f4f4f] transition"
          >
            Jetzt installieren
          </button>
        )}
      </div>
    </div>
  );
}
