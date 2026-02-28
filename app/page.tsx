'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import LanguageBar from '@/components/LanguageBar';
import ContactForm from '@/components/ContactForm';
import ToastContainer from '@/components/Toast';

function hasAppSource(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('source');
}

export default function HomePage() {
  const { lang, t, switchLanguage, supportedLangs, langLabels } = useI18n();
  const [fromApp, setFromApp] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setFromApp(hasAppSource());
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!fromApp) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          이 서비스는 앱에서만 이용 가능합니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <LanguageBar
        lang={lang}
        supportedLangs={supportedLangs}
        langLabels={langLabels}
        switchLanguage={switchLanguage}
      />

      <main className="container">
        <header className="form-header">
          <h1>{t('header.title')}</h1>
          <p>{t('header.subtitle')}</p>
        </header>

        <ContactForm t={t} lang={lang} />
      </main>

      <ToastContainer />
    </>
  );
}
