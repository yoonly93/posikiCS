'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  getLegalDoc,
  getPublishedLangs,
  getAppName,
  DOC_TYPES,
  DOC_LANGS,
} from '@/lib/legalService';

const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface ParsedRoute {
  appId: string;
  docType: string;
  lang: string;
}

function parseRoute(): ParsedRoute | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/\/+$/, '');
  // /legal/appId/docType/lang
  const match = path.match(/^\/legal\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const [, appId, docType, lang] = match;
  const validDoc = DOC_TYPES.some((d) => d.value === docType);
  const validLang = DOC_LANGS.some((l) => l.value === lang);
  if (!validDoc || !validLang) return null;
  return { appId, docType, lang };
}

export default function LegalPage() {
  const [route, setRoute] = useState<ParsedRoute | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('');
  const [publishedLangs, setPublishedLangs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Parse route on mount
  useEffect(() => {
    const parsed = parseRoute();
    if (!parsed) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setRoute(parsed);
  }, []);

  // Fetch document + published langs + app name
  useEffect(() => {
    if (!route) return;

    (async () => {
      setLoading(true);
      setNotFound(false);

      const [doc, langs, name] = await Promise.all([
        getLegalDoc(route.appId, route.docType, route.lang),
        getPublishedLangs(route.appId, route.docType),
        getAppName(route.appId),
      ]);

      if (doc && !doc.isDraft) {
        setContent(doc.content);
        setPublishedLangs(langs);
        setAppName(name || route.appId);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [route]);

  // SEO: update document title
  const docLabel = useMemo(() => {
    if (!route) return '';
    return DOC_TYPES.find((d) => d.value === route.docType)?.label || route.docType;
  }, [route]);

  useEffect(() => {
    if (!route || notFound) return;
    const title = `${docLabel} - ${appName}`;
    document.title = title;

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `${appName} ${docLabel}`);

    // Set OG tags
    setOgMeta('og:title', title);
    setOgMeta('og:description', `${appName} ${docLabel}`);
    setOgMeta('og:type', 'article');
  }, [route, appName, docLabel, notFound]);

  if (loading) {
    return (
      <div className="legal-viewer">
        <p style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
          로딩 중...
        </p>
      </div>
    );
  }

  if (notFound || !content || !route) {
    return (
      <div className="legal-viewer">
        <div className="legal-viewer-404">
          <h1>404</h1>
          <p>요청하신 법적 문서가 존재하지 않거나 아직 발행되지 않았습니다.</p>
        </div>
      </div>
    );
  }

  const langOptions = DOC_LANGS.filter((l) => publishedLangs.includes(l.value));

  function handleLangSwitch(newLang: string) {
    if (!route || newLang === route.lang) return;
    window.location.href = `/legal/${route.appId}/${route.docType}/${newLang}/`;
  }

  return (
    <>
      {/* Language Switcher */}
      {langOptions.length > 1 && (
        <div className="legal-lang-bar">
          <div className="legal-lang-bar-inner">
            {langOptions.map((l) => (
              <button
                key={l.value}
                className={`legal-lang-btn${l.value === route.lang ? ' active' : ''}`}
                onClick={() => handleLangSwitch(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="legal-viewer">
        <div className="legal-viewer-header">
          <span className="legal-viewer-badge">{docLabel}</span>
          <h1 className="legal-viewer-title">{appName}</h1>
        </div>
        <div className="legal-viewer-content" data-color-mode="light">
          <MDPreview source={content} />
        </div>
      </div>
    </>
  );
}

function setOgMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
