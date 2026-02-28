'use client';

import { useI18n } from '@/hooks/useI18n';
import LanguageBar from '@/components/LanguageBar';
import ContactForm from '@/components/ContactForm';
import ToastContainer from '@/components/Toast';

export default function HomePage() {
  const { lang, t, switchLanguage, supportedLangs, langLabels } = useI18n();

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
