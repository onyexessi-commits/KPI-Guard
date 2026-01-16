import { createClient } from '@supabase/supabase-js';

// Helper to safely get the Supabase client instance
let supabaseInstance: any = null;

const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  // Accessing via process.env as per platform guidelines
  // In a standard Vite app, this would be import.meta.env.VITE_SUPABASE_URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'KPI Guard Analytics: Supabase URL or Anon Key is missing in process.env. ' +
      'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. ' +
      'Tracking is currently disabled.'
    );
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (err) {
    console.error('KPI Guard Analytics: Failed to initialize Supabase client:', err);
    return null;
  }
};

const SESSION_KEY = 'kg_session_id';
const VISITOR_KEY = 'kg_visitor_id';

export const getVisitorId = (): string => {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

export const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const track = async (eventName: string, payload: object = {}) => {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.from('events').insert({
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      event_name: eventName,
      path: window.location.pathname,
      referrer: document.referrer || 'direct',
      ...payload
    });

    if (error) {
      // Log error but don't crash the app
      console.error(`KPI Guard Analytics: Error tracking event "${eventName}":`, error.message);
    }
  } catch (err) {
    console.error(`KPI Guard Analytics: Tracking failed unexpectedly for "${eventName}":`, err);
  }
};

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Initial page view
  track('page_view');

  // Simple path change tracking for SPAs using MutationObserver on the body/title
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      track('page_view');
    }
  });

  observer.observe(document.documentElement, { subtree: true, childList: true });
};
