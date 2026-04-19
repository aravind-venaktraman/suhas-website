import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Settings, LogOut, BarChart3, MoreHorizontal, Pencil, Trash2, Home, Disc3 } from 'lucide-react';
import { useStudioAuth } from '../../lib/studio/auth';
import { listReleases, getCurrentProfile } from '../../lib/studio/queries';
import { updateRelease, deleteRelease } from '../../lib/studio/mutations';
import { useBackground } from '../../lib/studio/useBackground';
import BackgroundPicker from '../../components/studio/BackgroundPicker';
import '../../components/studio/BackgroundPicker.css';
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
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [collapsedAlbums, setCollapsedAlbums] = useState(() => {
    try {
      const raw = localStorage.getItem('studio.sidebar.collapsedAlbums');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch { return new Set(); }
  });
  const menuRef = useRef(null);
  const renameInputRef = useRef(null);
  const { css: backgroundCss } = useBackground();

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

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      // Close release ⋯ menu if click is outside
      if (!e.target.closest('.studio-release-more-wrap')) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const refreshReleases = useCallback(() => {
    listReleases().then(setReleases).catch(console.error);
  }, []);

  function startRename(r) {
    setMenuOpenId(null);
    setRenamingId(r.id);
    setRenameValue(r.title);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  }

  async function submitRename(r) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === r.title) { setRenamingId(null); return; }
    setReleases(prev => prev.map(x => x.id === r.id ? { ...x, title: trimmed } : x));
    setRenamingId(null);
    try {
      await updateRelease({ id: r.id, title: trimmed });
    } catch (err) {
      console.error('[studio] rename failed:', err);
      refreshReleases();
    }
  }

  async function handleDelete(r) {
    const currentReleaseId = location.pathname.match(/\/release\/([^/]+)/)?.[1];
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setMenuOpenId(null);
    setReleases(prev => prev.filter(x => x.id !== r.id));
    try {
      await deleteRelease(r.id);
    } catch (err) {
      console.error('[studio] delete failed:', err);
      refreshReleases();
      return;
    }
    if (currentReleaseId === r.id) navigate('/studio', { replace: true });
  }

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('studio.sidebar.collapsed', String(next));
  }

  function toggleAlbumCollapse(albumId) {
    setCollapsedAlbums((prev) => {
      const next = new Set(prev);
      if (next.has(albumId)) next.delete(albumId); else next.add(albumId);
      try { localStorage.setItem('studio.sidebar.collapsedAlbums', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  // Group releases for the sidebar tree:
  //   - Top-level: every release whose parent is null or whose parent isn't in our list.
  //   - Children: releases whose parent_release_id points at a real entry.
  // Child entries nest under their parent album; orphaned children still appear at top.
  const sidebarTree = useMemo(() => {
    const byId = new Map(releases.map((r) => [r.id, r]));
    const childrenOf = new Map();
    releases.forEach((r) => {
      if (r.parent_release_id && byId.has(r.parent_release_id)) {
        if (!childrenOf.has(r.parent_release_id)) childrenOf.set(r.parent_release_id, []);
        childrenOf.get(r.parent_release_id).push(r);
      }
    });
    // Keep a stable order: albums first within top-level, then singles.
    const topLevel = releases.filter(
      (r) => !r.parent_release_id || !byId.has(r.parent_release_id),
    );
    topLevel.sort((a, b) => {
      const aIsAlbum = a.type === 'album' ? 0 : 1;
      const bIsAlbum = b.type === 'album' ? 0 : 1;
      if (aIsAlbum !== bIsAlbum) return aIsAlbum - bIsAlbum;
      return 0;
    });
    return topLevel.map((r) => ({
      ...r,
      children: (childrenOf.get(r.id) ?? []).slice().sort(
        (a, b) => (a.target_date ?? '9999').localeCompare(b.target_date ?? '9999'),
      ),
    }));
  }, [releases]);

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
    <div
      className="studio-shell"
      style={{ background: backgroundCss, backgroundAttachment: 'fixed' }}
    >
      <StudioFontLoader />

      {/* ── Sidebar ── */}
      <aside className={`studio-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>

        {/* Header: home link + collapse toggle */}
        <div className="studio-sidebar-head">
          <NavLink
            to="/studio"
            end
            className={({ isActive }) => `studio-sidebar-home${isActive ? ' active' : ''}`}
            title={collapsed ? 'All releases' : undefined}
            onClick={() => setMenuOpenId(null)}
          >
            <Home size={13} style={{ flexShrink: 0 }} />
            <span className="studio-sidebar-home-label">All releases</span>
          </NavLink>
          <button
            className="studio-sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav: release list (grouped: albums contain their child singles) */}
        <nav className="studio-sidebar-body">
          {sidebarTree.map((r) => {
            const isAlbum = r.type === 'album';
            const hasChildren = r.children && r.children.length > 0;
            const isOpen = !collapsedAlbums.has(r.id);
            return (
              <React.Fragment key={r.id}>
                <div className={`studio-release-row${isAlbum ? ' is-album' : ''}`}>
                  {renamingId === r.id ? (
                    <form
                      className="studio-release-rename-form"
                      onSubmit={(e) => { e.preventDefault(); submitRename(r); }}
                    >
                      <input
                        ref={renameInputRef}
                        className="studio-release-rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => submitRename(r)}
                        onKeyDown={(e) => e.key === 'Escape' && setRenamingId(null)}
                      />
                    </form>
                  ) : (
                    <NavLink
                      to={`/studio/release/${r.id}`}
                      className={({ isActive }) => `studio-release-item${isActive ? ' active' : ''}${isAlbum ? ' album' : ''}`}
                      title={collapsed ? r.title : undefined}
                      onClick={() => setMenuOpenId(null)}
                    >
                      {isAlbum && hasChildren && !collapsed ? (
                        <button
                          type="button"
                          className={`studio-release-caret${isOpen ? ' is-open' : ''}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAlbumCollapse(r.id); }}
                          aria-label={isOpen ? 'Collapse album' : 'Expand album'}
                          title={isOpen ? 'Collapse' : 'Expand'}
                        >
                          <ChevronDown size={11} />
                        </button>
                      ) : isAlbum ? (
                        <span className="studio-release-caret-spacer" aria-hidden>
                          <Disc3 size={11} style={{ color: '#D8B4FE' }} />
                        </span>
                      ) : (
                        <span
                          className="studio-release-dot"
                          style={{ background: STATUS_COLOR[r.status] ?? '#22D3EE' }}
                        />
                      )}
                      <div className="studio-release-info">
                        <div className="studio-release-title">{r.title}</div>
                        <div className="studio-release-sub">
                          {isAlbum
                            ? `${r.children.length} ${r.children.length === 1 ? 'release' : 'releases'} · album`
                            : `${r.status} · ${r.type}`}
                        </div>
                      </div>
                    </NavLink>
                  )}

                  {!collapsed && renamingId !== r.id && (
                    <div className="studio-release-more-wrap">
                      <button
                        className="studio-release-more-btn"
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === r.id ? null : r.id); }}
                        title="Rename or delete"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {menuOpenId === r.id && (
                        <div className="studio-release-actions">
                          <button onClick={() => startRename(r)}>
                            <Pencil size={11} /> Rename
                          </button>
                          <button className="danger" onClick={() => handleDelete(r)}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isAlbum && hasChildren && isOpen && !collapsed && (
                  <div className="studio-release-children">
                    {r.children.map((c) => (
                      <div key={c.id} className="studio-release-row is-child">
                        {renamingId === c.id ? (
                          <form
                            className="studio-release-rename-form"
                            onSubmit={(e) => { e.preventDefault(); submitRename(c); }}
                          >
                            <input
                              ref={renameInputRef}
                              className="studio-release-rename-input"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => submitRename(c)}
                              onKeyDown={(e) => e.key === 'Escape' && setRenamingId(null)}
                            />
                          </form>
                        ) : (
                          <NavLink
                            to={`/studio/release/${c.id}`}
                            className={({ isActive }) => `studio-release-item child${isActive ? ' active' : ''}`}
                            onClick={() => setMenuOpenId(null)}
                          >
                            <span
                              className="studio-release-dot"
                              style={{ background: STATUS_COLOR[c.status] ?? '#22D3EE' }}
                            />
                            <div className="studio-release-info">
                              <div className="studio-release-title">{c.title}</div>
                              <div className="studio-release-sub">{c.status} · {c.type}</div>
                            </div>
                          </NavLink>
                        )}
                        {renamingId !== c.id && (
                          <div className="studio-release-more-wrap">
                            <button
                              className="studio-release-more-btn"
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id); }}
                              title="Rename or delete"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                            {menuOpenId === c.id && (
                              <div className="studio-release-actions">
                                <button onClick={() => startRename(c)}>
                                  <Pencil size={11} /> Rename
                                </button>
                                <button className="danger" onClick={() => handleDelete(c)}>
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}

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
        <Outlet context={{ user, profile, allProfiles: profile ? [profile] : [], refreshReleases }} />
      </main>

      {/* Floating background picker — anchored bottom-right over the main pane */}
      <BackgroundPicker variant="floating" />
    </div>
  );
}
