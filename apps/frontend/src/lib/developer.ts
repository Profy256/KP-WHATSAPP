// Shared developer-profile data + server-side fetch.
// Used by the /contact page so the developer's name and details are present in
// the server-rendered HTML (critical for SEO — client-only fetches are invisible
// to most search-engine crawlers).

export interface DeveloperProfile {
  id?: string;
  name: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  avatarUrl?: string;
  skills: string[];
  services: { icon: string; title: string; desc: string }[];
  projects: { name: string; desc: string; tech: string[]; link: string }[];
}

// Public site URL — used to build absolute canonical / Open Graph URLs.
// Normalize a missing scheme (e.g. "example.com") so new URL() never throws.
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kp-whatsapp.vercel.app').trim();
export const SITE_URL = (
  /^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
).replace(/\/$/, '');

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Defaults mirror the backend Prisma schema. They guarantee the developer's
// name is in the HTML even if the backend is unreachable at build/request time.
export const DEFAULT_PROFILE: DeveloperProfile = {
  name: 'Kafeero Proferious',
  title: 'Developer & Creator',
  bio: 'Full-stack developer specialising in WhatsApp automation, AI integrations, and SaaS platforms.',
  email: 'profy256@gmail.com',
  phone: '+256740686937',
  whatsapp: '256740686937',
  location: 'Uganda, East Africa',
  skills: [],
  services: [],
  projects: [],
};

// Server-side fetch with graceful fallback to DEFAULT_PROFILE.
export async function getDeveloperProfile(): Promise<DeveloperProfile> {
  try {
    const res = await fetch(`${API}/public/developer-profile`, {
      // Re-fetch at most hourly so the static page stays fresh without a rebuild.
      next: { revalidate: 3600 },
      // Fail fast so a slow/cold backend never stalls the static build — we fall
      // back to DEFAULT_PROFILE, which already contains the developer's name.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return DEFAULT_PROFILE;
    const data = await res.json();
    return { ...DEFAULT_PROFILE, ...data };
  } catch {
    return DEFAULT_PROFILE;
  }
}
