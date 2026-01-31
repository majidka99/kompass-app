import { Award, Medal, Shield, Star, Trophy } from 'lucide-react';
import type { Achievement } from '../types/index';
export const achievementList: Achievement[] = [
  {
    id: 'points-10',
    label: 'achievements.points10',
    icon: <Star size={20} />,
    date: '',
  },
  {
    id: 'points-25',
    label: 'achievements.points25',
    icon: <Medal size={20} />,
    date: '',
  },
  {
    id: 'points-50',
    label: 'achievements.points50',
    icon: <Shield size={20} />,
    date: '',
  },
  {
    id: 'points-100',
    label: 'achievements.points100',
    icon: <Trophy size={20} />,
    date: '',
  },
  {
    id: 'points-200',
    label: 'achievements.points200',
    icon: <Award size={20} />,
    date: '',
  },
];
