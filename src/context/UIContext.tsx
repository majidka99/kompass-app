import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState } from 'react';
import * as storageService from '../services/storageService';

export interface UIContextType {
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  showDS: boolean;
  setShowDS: (show: boolean) => void;
  onboarding: boolean;
  setOnboarding: (show: boolean) => void;
  toast: string;
  showToast: (msg: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps): React.ReactElement {
  // Use lazy initialization for all state to avoid unnecessary localStorage access on re-renders
  const [showWelcome, setShowWelcomeState] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(false);

  const [showDS, setShowDSState] = useState<boolean>(() => {
    const accepted = storageService.get<boolean>('dsAccepted');
    return accepted === null ? true : !accepted;
  });

  const [onboarding, setOnboardingState] = useState<boolean>(() => {
    const completed = storageService.get<boolean>('onboardingCompleted');
    return completed === null ? true : !completed;
  });

  const [toast, setToast] = useState<string>('');

  // Use useCallback for all setter functions to ensure stable references
  const setShowWelcome = React.useCallback((show: boolean): void => {
    setShowWelcomeState(show);
  }, []);

  const setIsSidebarOpen = React.useCallback((open: boolean): void => {
    setIsSidebarOpenState(open);
  }, []);

  const setShowDS = React.useCallback((show: boolean): void => {
    setShowDSState(show);
  }, []);

  const setOnboarding = React.useCallback((show: boolean): void => {
    setOnboardingState(show);
  }, []);

  const showToast = React.useCallback((msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(''), 1200);
  }, []);

  // Speicherung bei Änderung
  useEffect(() => {
    if (!showDS) storageService.set('dsAccepted', true);
  }, [showDS]);

  useEffect(() => {
    if (!onboarding) storageService.set('onboardingCompleted', true);
  }, [onboarding]);

  useEffect(() => {
    const hintShown = storageService.get<boolean>('sidebarHintShown');
    if (!hintShown) {
      alert('Tipp: Über ☰ oben rechts erreichst du das Menü.');
      storageService.set('sidebarHintShown', true);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo<UIContextType>(
    () => ({
      showWelcome,
      setShowWelcome,
      isSidebarOpen,
      setIsSidebarOpen,
      showDS,
      setShowDS,
      onboarding,
      setOnboarding,
      toast,
      showToast,
    }),
    [
      showWelcome,
      setShowWelcome,
      isSidebarOpen,
      setIsSidebarOpen,
      showDS,
      setShowDS,
      onboarding,
      setOnboarding,
      toast,
      showToast,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export default UIContext;
