import { Award, GraduationCap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useUserData } from '../../hooks/useUserData';
import type { SidebarItem } from '../../types/index';
import { supabase } from '../../utils/supabase';

interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  favorites?: string[];
}

export default function Sidebar({
  items,
  isOpen,
  setIsOpen,
  favorites = [],
}: SidebarProps): React.ReactElement {
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth > 700);
  const location = useLocation();
  const { points } = useUserData();

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredItems = items.filter(
    item => favorites.includes(item.key) || ['home', 'quickedit', 'nova'].includes(item.key)
  );

  const toggleSidebar = (): void => setIsOpen(!isOpen);
  const handleClick = (): void => {
    if (!isDesktop) {
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const getPath = (key: string): string => (key === 'home' ? '/' : `/${key}`);

  return (
    <>
      {!isDesktop && (
        <button
          className="sidebar-toggle-mobile"
          onClick={toggleSidebar}
          aria-label={t('sidebar.openMenu')}
        >
          ☰
        </button>
      )}

      <aside className={`sidebar ${isOpen || isDesktop ? 'open' : ''}`}>
        <div className="sidebar-content">
          {/* Punktestand anzeigen */}
          <div className="sidebar-points">{t('sidebar.points', { points })}</div>

          {filteredItems.map(item => (
            <Link
              key={item.key}
              to={getPath(item.key)}
              className={`sidebar-item ${location.pathname === getPath(item.key) ? 'active' : ''}`}
              onClick={handleClick}
            >
              <span className="icon">{item.icon as React.ReactNode}</span>
              <span className="label">{t(item.label)}</span>
            </Link>
          ))}

          {/* Klinikschule */}
          <Link
            to="/school"
            className={`sidebar-item ${location.pathname === '/school' ? 'active' : ''}`}
            onClick={handleClick}
          >
            <span className="icon">
              <GraduationCap size={18} />
            </span>
            <span className="label">{t('navigation.schoolSupport')}</span>
          </Link>

          {/* Erfolge */}
          <Link
            to="/achievements"
            className={`sidebar-item ${location.pathname === '/achievements' ? 'active' : ''}`}
            onClick={handleClick}
          >
            <span className="icon">
              <Award size={18} />
            </span>
            <span className="label">{t('navigation.achievements')}</span>
          </Link>
        </div>

        {/* Sprachumschaltung */}
        <div
          className="sidebar-language-toggle"
          style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}
        >
          {[
            { code: 'de', emoji: '🇩🇪' },
            { code: 'en', emoji: '🇬🇧' },
            { code: 'tr', emoji: '🇹🇷' },
          ].map(({ code, emoji }) => (
            <button
              key={code}
              aria-label={t(`sidebar.languages.${code}`, code.toUpperCase())}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                opacity: i18n.language === code ? 1 : 0.5,
                cursor: 'pointer',
              }}
              onClick={() => void i18n.changeLanguage(code)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          className="sidebar-item logout-button"
          onClick={() =>
            void (async () => {
              try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Logout error:', error.message);
                  // Still close sidebar even if logout has issues
                }
                if (!isDesktop) setIsOpen(false);
                // Clear any local storage if needed
                localStorage.removeItem('lastAchievementShown');
              } catch (err) {
                console.error('Unexpected logout error:', err);
                if (!isDesktop) setIsOpen(false);
              }
            })()
          }
        >
          <span className="icon">🚪</span>
          <span className="label">{t('sidebar.logout')}</span>
        </button>
      </aside>
    </>
  );
}
