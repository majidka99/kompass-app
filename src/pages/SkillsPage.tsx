import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/ui/BackButton';
import DeleteButton from '../components/ui/DeleteButton';
import Loading from '../components/ui/Loading';
import ShareButton from '../components/ui/ShareButton';
import WordFilePreview from '../components/WordFilePreview';
import type { Skill, WordFile } from '../types/index';
import { showSuccessToast } from '../utils/toastUtils';
import { parseWordDocument } from '../utils/wordParser';

interface SkillsProps {
  shareSkill: (skill: string) => void;
  wordFiles: WordFile[];
  setWordFiles: (files: WordFile[]) => void;
  skillsList: Skill[];
  setSkillsList: (skills: Skill[]) => void;
  skillsCompleted: Record<string, boolean>;
  setSkillsCompleted: (completed: Record<string, boolean>) => void;
}

export default function Skills({
  shareSkill,
  wordFiles,
  setWordFiles,
  skillsList,
  setSkillsList,
  skillsCompleted,
  setSkillsCompleted,
}: SkillsProps): React.ReactElement {
  const { t } = useTranslation();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [parsedLines, setParsedLines] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    if (!file.name.match(/\.(doc|docx)$/)) {
      showSuccessToast(t('errors.wordFileRequired'));
      setIsUploading(false);
      return;
    }

    try {
      const lines = await parseWordDocument(file);
      setParsedLines(lines);
    } catch (error) {
      console.error('Error parsing document:', error);
      showSuccessToast(t('errors.documentParsingError'));
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddSkills(newSkills: Skill[]): void {
    const updatedSkills = [...skillsList, ...newSkills];
    setSkillsList(updatedSkills);
    setParsedLines([]);

    showSuccessToast(t('success.skillsAdded'));
  }

  function handleAddSingleSkill(): void {
    if (newSkill.trim()) {
      setSkillsList([...skillsList, newSkill.trim()]);
      setNewSkill('');
      showSuccessToast(t('success.skillAdded').replace('{skill}', newSkill.trim()));
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  if (isUploading) {
    return <Loading message={t('loading.fileUploading')} />;
  }

  if (parsedLines.length > 0) {
    return (
      <WordFilePreview
        parsedLines={parsedLines}
        onAddSkills={handleAddSkills}
        onCancel={() => setParsedLines([])}
      />
    );
  }

  return (
    <div className="card">
      <BackButton />
      <h2>{t('skills.title')}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {skillsList.map((skill, i) => {
          const skillKey = skill.startsWith('skills.defaultSkills.') ? t(skill) : skill;
          // Use the original skill (translation key) as the key in skillsCompleted, not the translated text
          const isCompleted = skillsCompleted[skill] || false;

          return (
            <li
              key={i}
              className={isCompleted ? 'done' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0 8px 12px',
                borderBottom: '1px solid #eee',
              }}
            >
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => {
                  const newCompleted = { ...skillsCompleted };
                  if (isCompleted) {
                    delete newCompleted[skill];
                  } else {
                    newCompleted[skill] = true;
                  }
                  setSkillsCompleted(newCompleted);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  marginRight: '12px',
                }}
              />
              <span
                className="text-content"
                style={{
                  flex: 1,
                  fontSize: '14px',
                  lineHeight: '1.5',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? '#888' : 'inherit',
                }}
              >
                {skillKey}
              </span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DeleteButton
                  onDelete={() => {
                    // Remove skill from skillsList
                    setSkillsList(skillsList.filter((_, idx) => idx !== i));

                    // Remove the completed status for this skill
                    const newCompleted = { ...skillsCompleted };
                    delete newCompleted[skill];
                    setSkillsCompleted(newCompleted);
                  }}
                  ariaLabel={t('ariaLabels.deleteSkill')}
                />
                <div className="actions" style={{ marginRight: '8px', marginLeft: '8px' }}>
                  <ShareButton
                    onClick={() => shareSkill(skill)}
                    ariaLabel={t('ariaLabels.shareSkill')}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 14 }}>
        <label>
          {t('skills.addNewSkill')}
          <div
            style={{
              position: 'relative',
              marginTop: 7,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={t('skills.new.placeholder')}
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddSingleSkill();
                }
              }}
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#5dade2';
                e.target.style.boxShadow = '0 0 0 2px rgba(93, 173, 226, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#ccc';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleAddSingleSkill}
              style={{
                position: 'absolute',
                right: '6px',
                top: '40%',
                transform: 'translateY(-50%)',
                height: '32px',
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '4px',
                backgroundColor: '#5dade2',
                border: 'none',
                transition: 'background-color 0.2s ease',
                zIndex: 2,
                padding: 0,
              }}
              aria-label={t('ariaLabels.addSkill')}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#4a9fd1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#5dade2';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAddSingleSkill();
                }
              }}
            >
              {/* Render the arrow icon directly with inline SVG for reliability */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </label>
      </div>
      {/* File upload section */}
      <h3>{t('skills.personalSkills')}</h3>
      <div style={{ marginTop: 14 }}>
        <label>
          {t('skills.uploadPersonalSkills')}
          <input
            type="file"
            accept=".doc,.docx,application/msword"
            onChange={e => void handleFile(e)}
            style={{ display: 'block', marginTop: 7 }}
          />
        </label>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {wordFiles.map((f, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0 8px 12px',
                borderBottom: '1px solid #eee',
              }}
            >
              <span
                className="text-content"
                style={{
                  flex: 1,
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}
              >
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#5dade2', textDecoration: 'none' }}
                >
                  📄 {f.name}
                </a>
              </span>
              <div className="actions" style={{ marginRight: '8px' }}>
                <DeleteButton
                  onDelete={() => setWordFiles(wordFiles.filter((_, idx) => idx !== i))}
                  ariaLabel={t('ariaLabels.deleteFile')}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
