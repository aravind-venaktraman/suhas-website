import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useStudioAuth } from '../../lib/studio/auth';
import { listReleases, getCurrentProfile } from '../../lib/studio/queries';
import './StudioApp.css';

// Load Inter font for Studio (Michroma is already loaded by the main site's FontLoader)
function StudioFontLoader() {
  useEffect(() => {
    if (document.querySelector('link[data-studio-inter]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    link.dataset.studioInter = 'true';
    document.head.appendChild(link);
  }, []);
  return null;
}

const STATUS_COLOR = {
  planning:    '#71717A',
  in_progress: '#22D3EE',
  released:    '#4ADE80',
  archived:    '#3F3F46',
};

export default function StudioApp() {
  const { user, loading, logout } = useStudioAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('studio.sidebar.collapsed') === 'true'
  );
  const [releases, setReleases] = useState([]);
  const [profile, setProfile] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) navigate('/studio/login', { replace: true });
  }, [user, loading, navigate]);

  // Load releases + current profile on mount, and refetch releases when route changes
  useEffect(() => {
    if (!user) return;
    listReleases().then(setReleases).catch(console.error);
    getCurrentProfile().then(setProfile).catch(console.error);
  }, [user, location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('studio.sidebar.collapsed', String(next));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Michroma', sans-serif", fontSize: 10, letterSpacing: '0.3em', color: '#71717A', textTransform: 'uppercase' }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="studio-shell">
      <StudioFontLoader />

      {/* ── Sidebar ── */}
      <aside className={`studio-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>

        {/* Header: label + collapse toggle */}
        <div className="studio-sidebar-head">
          <span className="studio-sidebar-label">Releases</span>
          <button
            className="studio-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav: release list */}
        <nav className="studio-sidebar-body">
          {releases.map((r) => (
            <NavLink
              key={r.id}
              to={`/studio/release/${r.id}`}
              className={({ isActive }) => `studio-release-item${isActive ? ' active' : ''}`}
              title={collapsed ? r.title : undefined}
            >
              <span
                className="studio-release-dot"
                style={{ background: STATUS_COLOR[r.status] ?? '#22D3EE' }}
              />
              <div className="studio-release-info">
                <div className="studio-release-title">{r.title}</div>
                <div className="studio-release-sub">{r.status} · {r.type}</div>
              </div>
            </NavLink>
          ))}

          <button
            className="studio-sidebar-new"
            onClick={() => navigate('/studio/templates')}
            title={collapsed ? 'New release' : undefined}
          >
            <Plus size={14} style={{ flexShrink: 0 }} />
            <span className="studio-sidebar-new-label">New release</span>
          </button>
        </nav>

        {/* Footer: user tile + dropdown */}
        <div className="studio-sidebar-foot" ref={menuRef}>
          {userMenuOpen && !collapsed && (
            <div className="studio-user-menu">
              <button onClick={() => { navigate('/studio/settings'); setUserMenuOpen(false); }}>
                <Settings size={13} /> Settings
              </button>
              <button onClick={() => { navigate('/studio/templates'); setUserMenuOpen(false); }}>
                <BarChart3 size={13} /> Templates
              </button>
              <button onClick={() => { logout(); setUserMenuOpen(false); }} className="danger">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}

          <button
            className="studio-user-tile"
            onClick={() => setUserMenuOpen((v) => !v)}
            title={collapsed ? (profile?.display_name ?? user.email) : undefined}
          >
            <div
              className="studio-user-av"
              style={{
                background: profile
                  ? `linear-gradient(135deg, ${profile.avatar_color_from}, ${profile.avatar_color_to})`
                  : 'linear-gradient(135deg, #6366F1, #22D3EE)',
              }}
            >
              {profile?.initials ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="studio-user-info">
              <div className="studio-user-name">{profile?.display_name ?? 'Loading...'}</div>
              <div className="studio-user-email">{user.email}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="studio-main">
        <Outlet context={{ user, profile, allProfiles: profile ? [profile] : [] }} />
      </main>
    </div>
  );
}
