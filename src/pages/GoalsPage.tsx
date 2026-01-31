import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MoodCompass from '../components/shared/MoodCompass';
import BackButton from '../components/ui/BackButton';
import DeleteButton from '../components/ui/DeleteButton';
import ShareButton from '../components/ui/ShareButton';
import type { Emoji } from '../data/emojis';
import type { Achievement, CalendarNotes, Goal, Symptoms } from '../types/index';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';

interface DeinWegProps {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  calendarNotes: CalendarNotes;
  setCalendarNotes: (notes: CalendarNotes) => void;
  symptoms: Symptoms;
  setSymptoms: (symptoms: Symptoms) => void;
  shareAchievement: (achievement: Achievement) => void;
  showReminder?: boolean;
  emojiList: Emoji[];
  templates?: string[];
}

export default function DeinWeg({
  goals = [],
  setGoals,
  achievements = [],
  setAchievements,
  calendarNotes = {},
  setCalendarNotes,
  symptoms = {},
  setSymptoms,
  shareAchievement,
  showReminder,
  emojiList = [],
  templates = [],
}: DeinWegProps): React.ReactElement {
  const { t } = useTranslation();
  const [goalInput, setGoalInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [emoji, setEmoji] = useState('');
  const [noteText, setNoteText] = useState('');
  const [symptomScore, setSymptomScore] = useState(() => {
    const dateSymptoms = symptoms[selectedDate];
    return dateSymptoms && dateSymptoms.length > 0 ? dateSymptoms[0].intensity : 0;
  });
  const [justSelectedEmoji, setJustSelectedEmoji] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const addGoal = () => {
    if (goalInput.trim())
      setGoals([
        ...goals,
        {
          id: Date.now().toString(),
          text: goalInput,
          completed: false,
          title: '',
        },
      ]);
    setGoalInput('');
  };

  const toggleGoal = (i: number): void =>
    setGoals(goals.map((g, idx) => (idx === i ? { ...g, completed: !g.completed } : g)));

  const addAchievement = () => {
    if (achievementInput.trim())
      setAchievements([
        {
          type: 'achievement',
          id: Date.now().toString(),
          text: achievementInput,
          date: new Date().toISOString().split('T')[0],
          title: '',
        },
        ...achievements,
      ]);
    setAchievementInput('');
  };

  useEffect(() => {
    const note = calendarNotes[selectedDate] || {
      text: '',
      date: selectedDate,
    };
    setNoteText(note.text);

    const dateSymptoms = symptoms[selectedDate];
    setSymptomScore(dateSymptoms && dateSymptoms.length > 0 ? dateSymptoms[0].intensity : 0);
    setSelectedMood(dateSymptoms && dateSymptoms.length > 0 ? dateSymptoms[0].title : null);
  }, [selectedDate, calendarNotes, symptoms]);

  const saveNote = () => {
    if (!noteText.trim() && symptomScore === 0) {
      showErrorToast(t('errors.addNoteOrSymptom'));
      return;
    }

    const updatedCalendarNotes = {
      ...calendarNotes,
      [selectedDate]: { text: noteText, title: '' },
    };
    setCalendarNotes(updatedCalendarNotes);

    const updatedSymptoms = {
      ...symptoms,
      [selectedDate]: [
        {
          title: selectedMood ?? t('journal.categories.general'),
          intensity: symptomScore,
        },
      ],
    };
    setSymptoms(updatedSymptoms);

    showSuccessToast(t('success.journalSaved'));
  };

  const formatDateGerman = (dateString: string): string => {
    if (!dateString || typeof dateString !== 'string') {
      return new Date().toLocaleDateString('de-DE'); // Return today's date as fallback
    }
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) {
        return new Date().toLocaleDateString('de-DE'); // Return today's date as fallback
      }
      const [year, month, day] = parts;
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return new Date().toLocaleDateString('de-DE'); // Return today's date as fallback
    }
  };

  const currentNote = calendarNotes[selectedDate];
  const hasCurrentNote = currentNote?.text;

  return (
    <div className="card">
      <BackButton />
      <h2>{t('deinweg.title')}</h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '2rem 0',
          transform: 'scale(0.95)',
        }}
      >
        <MoodCompass onSelectMood={setSelectedMood} selected={selectedMood} />
      </div>
      {showReminder && <div className="reminder">{t('journal.goalReminder')}</div>}

      <div className="stat-banner">
        {t('journal.weeklyProgress')
          .replace('{count}', goals.filter(g => g && g.completed).length.toString())
          .replace('{plural}', goals.filter(g => g && g.completed).length !== 1 ? 'e' : '')}
      </div>

      <div className="section">
        <h3>{t('journal.title')}</h3>
        <label>
          {t('journal.dateLabel')}
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </label>
        {hasCurrentNote && (
          <div
            style={{
              background: '#f0f8ff',
              padding: '10px',
              borderRadius: '8px',
              margin: '10px 0',
              border: '1px solid #d0e7ff',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#2c5aa0' }}>
              {t('journal.savedEntry').replace('{date}', formatDateGerman(selectedDate))}
            </h4>
            {emoji && <div style={{ fontSize: '24px', marginBottom: '5px' }}>{emoji}</div>}
            {currentNote.text && (
              <div style={{ fontStyle: 'italic', color: '#555' }}>
                &ldquo;{currentNote.text}&rdquo;
              </div>
            )}
            {symptoms[selectedDate] && symptoms[selectedDate].length > 0 && (
              <div style={{ marginTop: '5px', color: '#666' }}>
                {t('journal.symptomScore').replace(
                  '{score}',
                  symptoms[selectedDate][0].intensity.toString()
                )}
              </div>
            )}
          </div>
        )}
        <label>{t('journal.symptomQuestion')}</label>
        <br />
        <input
          type="range"
          min={0}
          max={10}
          value={symptomScore}
          onChange={e => setSymptomScore(Number(e.target.value))}
          style={{ width: '90%' }}
        />{' '}
        <span style={{ minWidth: 30, display: 'inline-block' }}>{symptomScore}</span>
      </div>

      {emojiList && Array.isArray(emojiList) && (
        <div className="emoji-row">
          {emojiList
            .filter(em => em && em.emoji && em.label)
            .map(em => (
              <span
                key={em.emoji}
                className={`emoji-selector ${emoji === em.emoji ? 'active' : ''} ${justSelectedEmoji === em.emoji ? 'just-selected' : ''}`}
                onClick={() => {
                  setEmoji(em.emoji);
                  setJustSelectedEmoji(em.emoji);
                  setTimeout(() => setJustSelectedEmoji(''), 300);
                }}
                title={em.label}
                aria-label={em.label}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setEmoji(em.emoji);
                    setJustSelectedEmoji(em.emoji);
                    setTimeout(() => setJustSelectedEmoji(''), 300);
                  }
                }}
              >
                {em.emoji}
              </span>
            ))}
        </div>
      )}

      <textarea
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder={t('deinweg.note.placeholder')}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={saveNote}>{t('common.buttons.save')}</button>
      </div>

      <div className="section">
        <h3>{t('journal.sections.goals')}</h3>
        <div className="form-row">
          <input
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder={t('deinweg.goals.placeholder')}
          />
          <button aria-label={t('ariaLabels.addGoal')} onClick={addGoal}>
            +
          </button>
        </div>
        <ul>
          {goals
            .filter(g => g && g.text)
            .map((g, i) => (
              <li key={i} className={g.completed ? 'done' : ''}>
                <input
                  type="checkbox"
                  checked={g.completed || false}
                  onChange={() => toggleGoal(i)}
                />
                <span className="text-content">{g.text}</span>
                <div className="actions">
                  <DeleteButton
                    onDelete={() => setGoals(goals.filter((_, idx) => idx !== i))}
                    ariaLabel={t('ariaLabels.removeGoal')}
                  />
                </div>
              </li>
            ))}
        </ul>
      </div>

      <div className="section">
        <h3>{t('journal.sections.achievements')}</h3>
        {templates && Array.isArray(templates) && (
          <div className="templates">
            {templates
              .filter(value => value && typeof value === 'string')
              .map((value, i) => (
                <button
                  key={i}
                  className="template-btn"
                  onClick={() => setAchievementInput(t(value))}
                >
                  {t(value)}
                </button>
              ))}
          </div>
        )}
        <div className="form-row">
          <input
            value={achievementInput}
            onChange={e => setAchievementInput(e.target.value)}
            placeholder={t('deinweg.achievement.placeholder')}
          />
          <button onClick={addAchievement}>+</button>
        </div>
        <ul>
          {achievements
            .filter(achievement => achievement && achievement.date && achievement.text)
            .map((achievement, i) => (
              <li key={i}>
                <span className="text-content">
                  {formatDateGerman(achievement.date)}: {achievement.text}
                </span>
                <div className="actions">
                  <ShareButton
                    onClick={() => shareAchievement(achievement)}
                    ariaLabel={t('ariaLabels.shareAchievement')}
                  />
                  <DeleteButton
                    onDelete={() => setAchievements(achievements.filter((_, idx) => idx !== i))}
                    ariaLabel={t('ariaLabels.removeAchievement')}
                  />
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
