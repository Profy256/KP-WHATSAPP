"use client";

import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/adminApi';

interface Service { icon: string; title: string; desc: string }
interface Project { name: string; desc: string; tech: string[]; link: string }

export default function DeveloperProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi.getDeveloperProfile().then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await adminApi.updateDeveloperProfile(profile.id, {
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        email: profile.email,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        location: profile.location,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills,
        services: profile.services,
        projects: profile.projects,
      });
      setProfile(res.data);
      setMsg('Saved!');
    } catch { setMsg('Error saving.'); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ ...profile, avatarUrl: reader.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setProfile({ ...profile, skills: [...(profile.skills || []), newSkill.trim()] });
    setNewSkill('');
  };
  const removeSkill = (i: number) => {
    const s = [...profile.skills]; s.splice(i, 1);
    setProfile({ ...profile, skills: s });
  };

  const updateService = (i: number, key: keyof Service, val: string) => {
    const s = [...profile.services]; s[i] = { ...s[i], [key]: val };
    setProfile({ ...profile, services: s });
  };
  const addService = () => setProfile({ ...profile, services: [...(profile.services || []), { icon: '⚡', title: '', desc: '' }] });
  const removeService = (i: number) => { const s = [...profile.services]; s.splice(i, 1); setProfile({ ...profile, services: s }); };

  const updateProject = (i: number, key: keyof Project, val: any) => {
    const p = [...profile.projects]; p[i] = { ...p[i], [key]: val };
    setProfile({ ...profile, projects: p });
  };
  const addProject = () => setProfile({ ...profile, projects: [...(profile.projects || []), { name: '', desc: '', tech: [], link: '' }] });
  const removeProject = (i: number) => { const p = [...profile.projects]; p.splice(i, 1); setProfile({ ...profile, projects: p }); };

  if (!profile) return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>;

  const inp = (style?: object) => ({
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
    ...style,
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Developer Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Edits show instantly on the public /contact page.</p>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontWeight: '600', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', marginBottom: '16px', fontSize: '13px' }}>{msg}</div>}

      {/* Avatar */}
      <Section title="Profile Picture">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700' }}>
              {profile.name.charAt(0)}
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginRight: '8px' }}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            {profile.avatarUrl && (
              <button onClick={() => setProfile({ ...profile, avatarUrl: null })}
                style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                Remove
              </button>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>JPG, PNG, WebP. Stored as base64.</p>
          </div>
        </div>
      </Section>

      {/* Basic Info */}
      <Section title="Basic Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Full Name', key: 'name' },
            { label: 'Title / Role', key: 'title' },
            { label: 'Email', key: 'email' },
            { label: 'Phone', key: 'phone' },
            { label: 'WhatsApp Number (no +)', key: 'whatsapp' },
            { label: 'Location', key: 'location' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{f.label}</label>
              <input value={profile[f.key] || ''} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} style={inp()} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Bio / Description</label>
          <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4}
            style={{ ...inp(), resize: 'vertical' }} />
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills & Technologies">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {(profile.skills || []).map((s: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(82,84,248,0.1)', border: '1px solid rgba(82,84,248,0.2)', borderRadius: '100px', fontSize: '13px', color: 'var(--accent-primary)' }}>
              {s}
              <button onClick={() => removeSkill(i)} style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill..."
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            style={{ ...inp({ flex: 1 }) }} />
          <button onClick={addSkill} style={{ padding: '9px 16px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600' }}>Add</button>
        </div>
      </Section>

      {/* Services */}
      <Section title="Custom Services">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {(profile.services || []).map((s: Service, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input value={s.icon} onChange={e => updateService(i, 'icon', e.target.value)} style={{ ...inp({ width: '60px', textAlign: 'center', fontSize: '18px' }) }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={s.title} onChange={e => updateService(i, 'title', e.target.value)} placeholder="Service title" style={inp()} />
                <input value={s.desc} onChange={e => updateService(i, 'desc', e.target.value)} placeholder="Description" style={inp()} />
              </div>
              <button onClick={() => removeService(i)} style={{ padding: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start' }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addService} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
          + Add Service
        </button>
      </Section>

      {/* Projects */}
      <Section title="Featured Projects">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '12px' }}>
          {(profile.projects || []).map((p: Project, i: number) => (
            <div key={i} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Project {i + 1}</span>
                <button onClick={() => removeProject(i)} style={{ fontSize: '12px', color: 'var(--error)', padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input value={p.name} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="Project name" style={inp()} />
                <input value={p.link} onChange={e => updateProject(i, 'link', e.target.value)} placeholder="Link (e.g. /)" style={inp()} />
              </div>
              <textarea value={p.desc} onChange={e => updateProject(i, 'desc', e.target.value)} placeholder="Description" rows={2}
                style={{ ...inp({ resize: 'vertical', marginBottom: '8px' }) }} />
              <input value={(p.tech || []).join(', ')} onChange={e => updateProject(i, 'tech', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Tech stack (comma-separated)" style={inp()} />
            </div>
          ))}
        </div>
        <button onClick={addProject} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
          + Add Project
        </button>
      </Section>
    </div>
  );
}
