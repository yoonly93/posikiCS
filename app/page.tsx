'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import LanguageBar from '@/components/LanguageBar';
import ContactForm from '@/components/ContactForm';
import ToastContainer from '@/components/Toast';
import { getFormConfig, type FormConfig } from '@/lib/formConfigService';

function getParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

type FormStatus = 'loading' | 'active' | 'paused' | 'notfound' | 'legacy';

export default function HomePage() {
  const { lang, t, switchLanguage, supportedLangs, langLabels } = useI18n();
  const [lockedApp, setLockedApp] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formStatus, setFormStatus] = useState<FormStatus>('loading');

  useEffect(() => {
    const formParam = getParam('form');
    const appParam = getParam('app');
    const langParam = getParam('lang');

    if (formParam) {
      getFormConfig(formParam).then((config) => {
        if (!config) {
          setFormStatus('notfound');
        } else if (config.status === 'paused') {
          const langs = config.languages || [];
          switchLanguage(langs[0] || 'en');
          setFormStatus('paused');
        } else {
          setFormConfig(config);
          const langs = config.languages || [];
          switchLanguage(langs[0] || 'en');
          setFormStatus('active');
        }
        setReady(true);
      });
    } else {
      if (langParam && (supportedLangs as readonly string[]).includes(langParam)) {
        switchLanguage(langParam);
      }
      if (appParam) {
        setLockedApp(appParam);
      }
      setFormStatus('legacy');
      setReady(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  // Paused form
  if (formStatus === 'paused') {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('status.paused')}</h1>
          <p style={{ color: '#8E8E93', fontSize: 15 }}>{t('status.pausedSub')}</p>
        </div>
      </main>
    );
  }

  // Form not found
  if (formStatus === 'notfound') {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('status.notfound')}</h1>
          <p style={{ color: '#8E8E93', fontSize: 15 }}>{t('status.notfoundSub')}</p>
        </div>
      </main>
    );
  }

  // Form config mode: show LanguageBar with allowed languages
  if (formStatus === 'active' && formConfig) {
    const allowedLangs = formConfig.languages || [];
    return (
      <>
        {allowedLangs.length > 1 ? (
          <LanguageBar
            lang={lang}
            supportedLangs={allowedLangs}
            langLabels={langLabels}
            switchLanguage={switchLanguage}
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 16px' }}>
            <span className="lang-btn active" style={{ cursor: 'default' }}>
              {langLabels[lang as keyof typeof langLabels] || lang}
            </span>
          </div>
        )}

        <main className="container">
          <header className="form-header">
            <h1>{t('header.title')}</h1>
            <p>{t('header.subtitle')}</p>
          </header>

          <ContactForm
            t={t}
            lang={lang}
            allowedAppIds={formConfig.apps}
            allowedTypes={formConfig.types}
          />
        </main>

        <ToastContainer />
      </>
    );
  }

  // Legacy mode: existing ?app=&lang= behavior
  return (
    <>
      {!lockedApp && (
        <LanguageBar
          lang={lang}
          supportedLangs={supportedLangs}
          langLabels={langLabels}
          switchLanguage={switchLanguage}
        />
      )}

      <main className="container">
        <header className="form-header">
          <h1>{t('header.title')}</h1>
          <p>{t('header.subtitle')}</p>
        </header>

        <ContactForm t={t} lang={lang} lockedApp={lockedApp} />
      </main>

      <ToastContainer />
    </>
  );
}
