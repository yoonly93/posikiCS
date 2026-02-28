'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebaseAuth';
import { translateDoc, reviewDoc } from '@/lib/claudeService';
import {
  getApps,
  getLegalDoc,
  saveLegalDraft,
  publishLegalDoc,
  DOC_TYPES,
  DOC_LANGS,
  type AppData,
} from '@/lib/legalService';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function LegalAdminPage() {
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
          <Link href="/admin/legal" className="active">약관 관리</Link>
          <Link href="/admin/settings">설정</Link>
        </nav>

        <DocEditor />
      </div>
    </>
  );
}

// ═══════════════════════════════════
// 문서 편집 섹션 (+ Claude AI 연동)
// ═══════════════════════════════════

function DocEditor() {
  const [apps, setApps] = useState<(AppData & { id: string })[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('privacy');
  const [selectedLang, setSelectedLang] = useState('ko');
  const [content, setContent] = useState('');
  const [docState, setDocState] = useState<{ isDraft: boolean; publishedAt: unknown } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [message, setMessage] = useState('');

  // Claude AI 상태
  const [translating, setTranslating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState('');

  useEffect(() => {
    getApps().then(setApps);
  }, []);

  const loadDoc = useCallback(async () => {
    if (!selectedApp) return;
    setLoadingDoc(true);
    setMessage('');
    setReviewResult('');
    const doc = await getLegalDoc(selectedApp, selectedDoc, selectedLang);
    if (doc) {
      setContent(doc.content);
      setDocState({ isDraft: doc.isDraft, publishedAt: doc.publishedAt });
    } else {
      setContent('');
      setDocState(null);
    }
    setLoadingDoc(false);
  }, [selectedApp, selectedDoc, selectedLang]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

  async function handleSave() {
    if (!selectedApp) return;
    setSaving(true);
    await saveLegalDraft(selectedApp, selectedDoc, selectedLang, content);
    setDocState({ isDraft: true, publishedAt: null });
    setMessage('임시저장 완료');
    setSaving(false);
    setTimeout(() => setMessage(''), 2000);
  }

  async function handlePublish() {
    if (!selectedApp) return;
    if (!confirm('이 문서를 발행하시겠습니까?')) return;
    setPublishing(true);
    await publishLegalDoc(selectedApp, selectedDoc, selectedLang, content);
    setDocState({ isDraft: false, publishedAt: new Date() });
    setMessage('발행 완료!');
    setPublishing(false);
    setTimeout(() => setMessage(''), 2000);
  }

  async function handleTranslate() {
    if (!content.trim()) {
      alert('번역할 내용이 없습니다.');
      return;
    }
    if (selectedLang === 'ko') {
      alert('한국어 → 한국어 번역은 불필요합니다. 다른 언어를 선택해주세요.');
      return;
    }

    const koDoc = await getLegalDoc(selectedApp, selectedDoc, 'ko');
    const sourceContent = koDoc?.content;
    if (!sourceContent) {
      alert('한국어 원본 문서가 없습니다. 먼저 한국어로 문서를 작성해주세요.');
      return;
    }

    if (!confirm(`한국어 원본을 ${DOC_LANGS.find(l => l.value === selectedLang)?.label}로 번역합니다. 현재 내용이 교체됩니다.`)) return;

    setTranslating(true);
    setMessage('AI 번역 중...');
    try {
      const result = await translateDoc(sourceContent, selectedLang, selectedDoc);
      setContent(result);
      setMessage('번역 완료! 검토 후 저장해주세요.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(`번역 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      setMessage('');
    } finally {
      setTranslating(false);
    }
  }

  async function handleReview() {
    if (!content.trim()) {
      alert('검토할 내용이 없습니다.');
      return;
    }
    const app = apps.find((a) => a.id === selectedApp);
    if (!app || app.features.length === 0) {
      alert('앱에 등록된 기능이 없습니다. 설정에서 기능을 먼저 설정해주세요.');
      return;
    }

    setReviewing(true);
    setReviewResult('');
    setMessage('AI 검토 중...');
    try {
      const result = await reviewDoc(content, app.features, selectedDoc);
      setReviewResult(result);
      setMessage('');
    } catch (err) {
      alert(`검토 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      setMessage('');
    } finally {
      setReviewing(false);
    }
  }

  const publicUrl = selectedApp
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/legal/${selectedApp}/${selectedDoc}/${selectedLang}/`
    : '';

  const isBusy = saving || publishing || translating || reviewing;

  return (
    <div className="legal-section">
      {/* 선택 바 */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="doc-selector-row">
          <div className="doc-selector-group">
            <label>앱</label>
            <select className="legal-select" value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
              <option value="">선택</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="doc-selector-group">
            <label>문서 유형</label>
            <select className="legal-select" value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="doc-selector-group">
            <label>언어</label>
            <select className="legal-select" value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
              {DOC_LANGS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedApp ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          앱을 선택해주세요.
        </div>
      ) : loadingDoc ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>
      ) : (
        <>
          {/* 상태 바 */}
          <div className="doc-status-bar">
            <div className="doc-status-left">
              {docState === null ? (
                <span className="doc-badge new">새 문서</span>
              ) : docState.isDraft ? (
                <span className="doc-badge draft">임시저장</span>
              ) : (
                <span className="doc-badge published">발행됨</span>
              )}
              {message && <span className="doc-save-msg">{message}</span>}
            </div>
            <div className="doc-status-right">
              <button className="legal-btn ai" onClick={handleReview} disabled={isBusy}>
                {reviewing ? '검토 중...' : 'AI 검토'}
              </button>
              <button className="legal-btn ai" onClick={handleTranslate} disabled={isBusy}>
                {translating ? '번역 중...' : 'AI 번역'}
              </button>
              <button className="legal-btn secondary" onClick={handleSave} disabled={isBusy}>
                {saving ? '저장 중...' : '임시저장'}
              </button>
              <button className="legal-btn primary" onClick={handlePublish} disabled={isBusy}>
                {publishing ? '발행 중...' : '발행'}
              </button>
            </div>
          </div>

          {/* 검토 결과 패널 */}
          {reviewResult && (
            <div className="review-panel">
              <div className="review-panel-header">
                <h4>AI 검토 결과</h4>
                <button className="review-panel-close" onClick={() => setReviewResult('')}>&times;</button>
              </div>
              <div className="review-panel-content">
                {reviewResult.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          )}

          {/* 에디터 */}
          <div className="editor-wrapper" data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(v) => setContent(v || '')}
              height={500}
              preview="live"
            />
          </div>

          {/* 퍼블릭 URL */}
          {docState && !docState.isDraft && (
            <div className="admin-card" style={{ marginTop: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                퍼블릭 URL
              </label>
              <div className="public-url-row">
                <code className="public-url">{publicUrl}</code>
                <button
                  className="legal-btn secondary"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                >
                  복사
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
