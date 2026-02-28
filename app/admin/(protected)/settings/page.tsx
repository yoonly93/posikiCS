'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebaseAuth';
import { getClaudeApiKey, setClaudeApiKey } from '@/lib/settingsService';
import {
  getApps,
  addApp,
  deleteApp,
  updateAppFeatures,
  updateAppName,
  updateAppOrder,
  changeAppId,
  ALL_FEATURES,
  type AppData,
} from '@/lib/legalService';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <>
      <header className="admin-header">
        <h2>nanokit</h2>
        <div className="admin-header-actions">
          <span>{user?.email}</span>
          <button className="admin-signout-btn" onClick={() => signOut()}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="admin-content">
        <nav className="admin-nav">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin/contacts">문의 관리</Link>
          <Link href="/admin/legal">약관 관리</Link>
          <Link href="/admin/settings" className="active">설정</Link>
        </nav>

        <AppManager />
        <div style={{ marginTop: 24 }} />
        <ClaudeApiSettings />
      </div>
    </>
  );
}

// ═══════════════════════════════════
// 앱 관리 섹션
// ═══════════════════════════════════

// 한국어 → 로마자 변환 (Revised Romanization)
const INITIALS = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const MEDIALS = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const FINALS = ['','k','k','k','n','n','n','t','l','l','l','l','l','l','l','l','m','p','p','t','t','ng','t','t','k','t','p','t'];

function romanizeKorean(text: string): string {
  let result = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const ini = Math.floor(offset / (21 * 28));
      const med = Math.floor((offset % (21 * 28)) / 28);
      const fin = offset % 28;
      result += INITIALS[ini] + MEDIALS[med] + FINALS[fin];
    } else {
      result += ch;
    }
  }
  return result;
}

function slugify(name: string): string {
  const romanized = romanizeKorean(name);
  return romanized
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function AppManager() {
  const [apps, setApps] = useState<(AppData & { id: string })[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editAppId, setEditAppId] = useState('');

  const generatedId = slugify(newName);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getApps();
    setApps(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name || !generatedId) return;
    if (apps.some((a) => a.id === generatedId)) {
      alert('이미 같은 ID의 앱이 존재합니다.');
      return;
    }
    const maxOrder = apps.reduce((max, a) => Math.max(max, a.order ?? 0), 0);
    await addApp(generatedId, name, maxOrder + 1);
    setNewName('');
    load();
  }

  async function handleDelete(appId: string) {
    if (!confirm(`"${appId}" 앱을 삭제하시겠습니까?`)) return;
    await deleteApp(appId);
    load();
  }

  async function handleFeatureToggle(appId: string, feature: string, current: string[]) {
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    await updateAppFeatures(appId, next);
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, features: next } : a)),
    );
  }

  function startEditing(app: AppData & { id: string }) {
    setEditingId(app.id);
    setEditName(app.name);
  }

  async function handleSaveName(appId: string) {
    const name = editName.trim();
    if (!name) return;
    await updateAppName(appId, name);
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, name } : a)),
    );
    setEditingId(null);
  }

  function startEditingAppId(app: AppData & { id: string }) {
    setEditingAppId(app.id);
    setEditAppId(app.id);
  }

  async function handleSaveAppId(oldId: string) {
    const newId = editAppId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!newId || newId === oldId) {
      setEditingAppId(null);
      return;
    }
    if (apps.some((a) => a.id === newId)) {
      alert('이미 같은 ID의 앱이 존재합니다.');
      return;
    }
    await changeAppId(oldId, newId);
    setEditingAppId(null);
    load();
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= apps.length) return;

    const a = apps[index];
    const b = apps[swapIndex];
    const orderA = a.order ?? index;
    const orderB = b.order ?? swapIndex;

    await Promise.all([
      updateAppOrder(a.id, orderB),
      updateAppOrder(b.id, orderA),
    ]);

    setApps((prev) => {
      const next = [...prev];
      next[index] = { ...a, order: orderB };
      next[swapIndex] = { ...b, order: orderA };
      next.sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
      return next;
    });
  }

  return (
    <div className="admin-card">
      <h3 className="legal-section-title">앱 관리</h3>

      <div className="app-add-row" style={{ marginBottom: 20 }}>
        <input
          className="legal-input"
          placeholder="앱 이름 (예: Eyeday)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="legal-btn primary" onClick={handleAdd} disabled={!generatedId}>추가</button>
      </div>
      {newName.trim() && (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: -12, marginBottom: 16 }}>
          앱 ID: <code style={{ background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4 }}>{generatedId || '(영문 이름을 입력해주세요)'}</code>
        </p>
      )}

      <h4 className="app-list-title">등록된 앱</h4>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)' }}>로딩 중...</p>
      ) : apps.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)' }}>
          등록된 앱이 없습니다.
        </p>
      ) : (
        <div className="app-list">
          {apps.map((app, idx) => (
            <div key={app.id} className="app-list-item">
              <div className="app-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div className="app-order-btns">
                    <button
                      className="app-order-btn"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      title="위로 이동"
                    >
                      &#9650;
                    </button>
                    <button
                      className="app-order-btn"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === apps.length - 1}
                      title="아래로 이동"
                    >
                      &#9660;
                    </button>
                  </div>
                  {editingId === app.id ? (
                    <div className="app-edit-name-row">
                      <input
                        className="legal-input app-edit-name-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(app.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button className="legal-btn primary-sm" onClick={() => handleSaveName(app.id)}>저장</button>
                      <button className="legal-btn secondary-sm" onClick={() => setEditingId(null)}>취소</button>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0 }}>
                      <div style={{ cursor: 'pointer', display: 'inline' }} onClick={() => startEditing(app)}>
                        <span className="app-card-name">{app.name}</span>
                        <span className="app-edit-hint">클릭하여 수정</span>
                      </div>
                      <div style={{ marginTop: 2 }}>
                        {editingAppId === app.id ? (
                          <span className="app-edit-id-row">
                            <input
                              className="app-edit-id-input"
                              value={editAppId}
                              onChange={(e) => setEditAppId(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAppId(app.id);
                                if (e.key === 'Escape') setEditingAppId(null);
                              }}
                              autoFocus
                            />
                            <button className="legal-btn primary-sm" onClick={() => handleSaveAppId(app.id)}>저장</button>
                            <button className="legal-btn secondary-sm" onClick={() => setEditingAppId(null)}>취소</button>
                          </span>
                        ) : (
                          <span className="app-card-id" style={{ cursor: 'pointer' }} onClick={() => startEditingAppId(app)} title="클릭하여 ID 수정">
                            {app.id}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button className="legal-btn danger-sm" onClick={() => handleDelete(app.id)}>삭제</button>
              </div>
              <p className="feature-label">각 앱에서 사용하는 기능 및 권한을 체크해주세요</p>
              <p className="feature-sublabel">약관 자동 생성과 검토에 활용됩니다</p>
              <div className="feature-grid">
                {ALL_FEATURES.map((f) => (
                  <label key={f} className="feature-checkbox">
                    <input
                      type="checkbox"
                      checked={app.features.includes(f)}
                      onChange={() => handleFeatureToggle(app.id, f, app.features)}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// Claude API 설정 섹션
// ═══════════════════════════════════

function ClaudeApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClaudeApiKey().then((k) => {
      setApiKey(k);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await setClaudeApiKey(apiKey.trim());
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="admin-card">
      <h3 className="legal-section-title">Claude API 설정</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        약관 관리의 번역/검토 기능에 사용됩니다.
      </p>

      {loading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="settings-key-row">
          <input
            className="legal-input settings-key-input"
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className="legal-btn primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          {saved && <span className="doc-save-msg">저장 완료</span>}
        </div>
      )}
    </div>
  );
}
