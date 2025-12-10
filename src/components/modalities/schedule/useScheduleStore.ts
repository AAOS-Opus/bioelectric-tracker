'use client';

import { useState, useEffect } from 'react';
import { ModalitySession, ScheduleTemplate } from '../WeeklySchedule';
import { createUniqueId } from './utils';

// This is a simple custom hook for state management
// In a production app, you might use Zustand, Redux, or Context API
export default function useScheduleStore() {
  // Load saved data from localStorage on initial render
  const [sessions, setSessions] = useState<ModalitySession[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('modality-sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  });

  const [templates, setTemplates] = useState<ScheduleTemplate[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('modality-templates');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
      return [];
    }
  });

  // Sync to localStorage when data changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('modality-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('modality-templates', JSON.stringify(templates));
  }, [templates]);

  // Session operations
  const addSession = (session: Omit<ModalitySession, 'id'> & { id?: string }) => {
    const newSession: ModalitySession = {
      ...session,
      id: session.id || createUniqueId(),
    };
    setSessions(prev => [...prev, newSession]);
  };

  const updateSession = (updatedSession: ModalitySession) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const markSessionCompleted = (sessionId: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, completed: !session.completed } 
          : session
      )
    );
  };

  // Template operations
  const addTemplate = (name: string, description: string = '') => {
    const newTemplate: ScheduleTemplate = {
      id: createUniqueId(),
      name,
      description,
      sessions: [...sessions],
      createdAt: new Date()
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Apply template sessions but keep their IDs unique
    const newSessions = template.sessions.map(session => ({
      ...session,
      id: createUniqueId()
    }));
    
    setSessions(newSessions);
  };

  return {
    sessions,
    setSessions,
    addSession,
    updateSession,
    deleteSession,
    markSessionCompleted,
    templates,
    setTemplates,
    addTemplate,
    deleteTemplate,
    applyTemplate
  };
}
