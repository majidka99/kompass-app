// SidebarItem.tsx – modern, klickbar
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  label: string;
  icon: JSX.Element;
  active?: boolean;
}

export default function SidebarItem({ to, label, icon, active = false }: SidebarItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition text-sm font-medium ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      <span className="text-white text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
