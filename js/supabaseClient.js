import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://lwmervaxwrllgykcjfpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3bWVydmF4d3JsbGd5a2NqZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDk3NjksImV4cCI6MjA2NjAyNTc2OX0.x8Ri1xtidyNqJDl4QgeSzTP2d0FaHLFPV7vBIIytLp4'
);