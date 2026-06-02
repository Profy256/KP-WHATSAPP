import type { Metadata } from 'next';
import { getDeveloperProfile, SITE_URL } from '@/lib/developer';
import ContactClient from './ContactClient';

// Server-rendered metadata so the developer's name is in the HTML <head> and
// indexable. Generated from the live profile with safe defaults.
export async function generateMetadata(): Promise<Metadata> {
  const p = await getDeveloperProfile();
  const title = `${p.name} — ${p.title}`;
  const description = `${p.name} — ${p.bio} Available for custom WhatsApp automation, AI integration and full-stack SaaS development. Based in ${p.location}.`;

  return {
    title,
    description,
    keywords: [
      p.name,
      'Kafeero Proferious',
      'Kafeero',
      'Proferious',
      'Profy',
      p.title,
      'software engineer',
      'software developer',
      'full-stack developer',
      'WhatsApp automation developer',
      'AI integration developer',
      'SaaS developer',
      `developer ${p.location}`,
      `software engineer ${p.location}`,
      ...p.skills,
    ],
    authors: [{ name: p.name }],
    creator: p.name,
    alternates: { canonical: '/contact' },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: `${SITE_URL}/contact`,
      siteName: 'KP WhatsApp Automation',
      ...(p.avatarUrl ? { images: [{ url: p.avatarUrl, alt: p.name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(p.avatarUrl ? { images: [p.avatarUrl] } : {}),
    },
  };
}

export default async function ContactPage() {
  const profile = await getDeveloperProfile();

  // schema.org Person — lets search engines understand this page is about a
  // specific person and surface it for name / occupation searches.
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    alternateName: ['Profy', 'Kafeero', 'Proferious'],
    jobTitle: profile.title,
    description: profile.bio,
    email: `mailto:${profile.email}`,
    telephone: profile.phone,
    url: `${SITE_URL}/contact`,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    address: { '@type': 'PostalAddress', addressCountry: profile.location },
    knowsAbout: [
      'Software Engineering',
      'Full-Stack Development',
      'WhatsApp Automation',
      'AI Integration',
      'SaaS Platforms',
      ...profile.skills,
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: profile.title,
      occupationLocation: { '@type': 'Country', name: profile.location },
    },
    worksFor: {
      '@type': 'Organization',
      name: 'KP WhatsApp Automation',
      url: SITE_URL,
    },
    sameAs: [`mailto:${profile.email}`, `https://wa.me/${profile.whatsapp}`],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <ContactClient profile={profile} />
    </>
  );
}
