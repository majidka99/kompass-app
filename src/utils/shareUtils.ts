/**
 * Utility functions for sharing content
 */
import { showErrorToast, showInfoToast, showSuccessToast } from './toastUtils';

import type { Achievement } from '../types/index';

// Interface for shareable achievements
export interface ShareableAchievement {
  text: string;
  date: string;
}

// Function to adapt Achievement to ShareableAchievement
function adaptAchievement(achievement: Achievement): ShareableAchievement {
  // Handle both Achievement types
  let text = 'Achievement';

  if ('label' in achievement && achievement.label) {
    text = achievement.label;
  } else if ('title' in achievement && achievement.title) {
    text = achievement.title;
  } else if ('text' in achievement && achievement.text) {
    text = achievement.text;
  }

  return {
    text,
    date: achievement.date,
  };
}

/**
 * Share an achievement/success
 * @param achievement - The achievement to share
 */
export function shareAchievement(achievement: Achievement): void {
  // Adapt the achievement to a shareable format
  const adaptedAchievement = adaptAchievement(achievement);
  if (navigator.share) {
    navigator
      .share({
        title: 'Erfolg',
        text: `${adaptedAchievement.text} (${adaptedAchievement.date})`,
        url: window.location.href,
      })
      .then(() => {
        showSuccessToast('Erfolg erfolgreich geteilt! 🎉');
      })
      .catch((error: Error) => {
        console.error('Error sharing achievement:', error);
        if (error.name === 'AbortError') {
          // User cancelled sharing - don't show error
          console.log('Sharing cancelled by user');
          showInfoToast('Teilen abgebrochen');
        } else {
          showErrorToast('Fehler beim Teilen des Erfolgs');
        }
      });
  } else {
    showErrorToast('Teilen wird von diesem Browser nicht unterstützt');
  }
}

/**
 * Share a skill
 * @param skill - The skill to share
 */
export function shareSkill(skill: string): void {
  if (navigator.share) {
    navigator
      .share({
        title: 'Skill',
        text: skill,
        url: window.location.href,
      })
      .then(() => {
        showSuccessToast('Skill erfolgreich geteilt! ✨');
      })
      .catch((error: Error) => {
        console.error('Error sharing skill:', error);
        if (error.name === 'AbortError') {
          // User cancelled sharing
          showInfoToast('Teilen abgebrochen');
        } else {
          showErrorToast('Fehler beim Teilen des Skills');
        }
      });
  } else {
    showErrorToast('Teilen wird von diesem Browser nicht unterstützt');
  }
}

export default {
  shareAchievement,
  shareSkill,
};
