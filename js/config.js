// Config is populated from window.__ENV__ (see env.sample.js). Do not commit secrets.
const ENV = window.__ENV__ || {};

// --- Supabase ---
export const SUPABASE_URL = ENV.SUPABASE_URL ?? '';
export const SUPABASE_KEY = ENV.SUPABASE_KEY ?? '';
export const HW_BUCKET    = ENV.HW_BUCKET    ?? 'homework';
export const VIDEO_BUCKET = ENV.VIDEO_BUCKET ?? 'videos';

// --- Google ---
export const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_API_KEY   = ENV.GOOGLE_API_KEY   ?? '';
export const DISCOVERY_DOCS   = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
export const GCAL_SCOPES      = 'https://www.googleapis.com/auth/calendar.events.readonly';

// --- Jitsi ---
export const JITSI_DOMAIN = ENV.JITSI_DOMAIN ?? 'meet.jit.si';
export const JITSI_ROOM   = ENV.JITSI_ROOM   ?? 'MentoriumRoom123';
