'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { sendEmail } from '@/lib/emailService';
import { saveContact } from '@/lib/firestore';
import { getAppList, type AppInfo } from '@/lib/appService';
import { showToast } from './Toast';

interface ContactFormProps {
  t: (key: string) => string;
  lang: string;
}

export default function ContactForm({ t, lang }: ContactFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAppList()
      .then(setApps)
      .finally(() => setAppsLoading(false));
  }, []);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(form: HTMLFormElement): boolean {
    const newErrors: Record<string, string> = {};

    const app = (form.elements.namedItem('app') as HTMLSelectElement).value;
    const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim();

    if (!app) newErrors.app = t('validation.appRequired');
    if (!type) newErrors.type = t('validation.typeRequired');
    if (!email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
    }
    if (!message) newErrors.message = t('validation.messageRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function getURLParam(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get(key);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const form = formRef.current!;

    if (honeypotRef.current && honeypotRef.current.value.length > 0) return;
    if (!validate(form)) return;

    setLoading(true);

    const appSelect = form.elements.namedItem('app') as HTMLSelectElement;
    const typeSelect = form.elements.namedItem('type') as HTMLSelectElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const messageInput = form.elements.namedItem('message') as HTMLTextAreaElement;

    const selectedOption = typeSelect.options[typeSelect.selectedIndex];

    const formData = {
      app: appSelect.value,
      type: selectedOption.textContent || '',
      typeValue: typeSelect.value,
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      source: getURLParam('source'),
      language: lang,
    };

    try {
      await Promise.all([
        sendEmail(formData),
        saveContact({
          service: formData.app,
          type: formData.typeValue,
          email: formData.email,
          message: formData.message,
          language: formData.language,
        }),
      ]);

      showToast('success', t('toast.success'));
      form.reset();
      setErrors({});
    } catch (err) {
      console.error('Submit failed:', err);
      showToast('error', t('toast.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="contactForm" ref={formRef} noValidate onSubmit={handleSubmit}>
      {/* Service/App */}
      <div className={`form-group${errors.app ? ' has-error' : ''}`}>
        <label htmlFor="appName">{t('form.app.label')}</label>
        <select id="appName" name="app" required onChange={() => clearError('app')} disabled={appsLoading}>
          <option value="">{appsLoading ? '...' : t('form.app.placeholder')}</option>
          {apps.map((app) => (
            <option key={app.id} value={app.name}>{app.name}</option>
          ))}
        </select>
        <span className="error-msg">{errors.app || ''}</span>
      </div>

      {/* Inquiry Type */}
      <div className={`form-group${errors.type ? ' has-error' : ''}`}>
        <label htmlFor="inquiryType">{t('form.type.label')}</label>
        <select id="inquiryType" name="type" required onChange={() => clearError('type')}>
          <option value="">{t('form.type.placeholder')}</option>
          <option value="bug">{t('form.type.bug')}</option>
          <option value="feedback">{t('form.type.feedback')}</option>
          <option value="general">{t('form.type.general')}</option>
        </select>
        <span className="error-msg">{errors.type || ''}</span>
      </div>

      {/* Email */}
      <div className={`form-group${errors.email ? ' has-error' : ''}`}>
        <label htmlFor="userEmail">{t('form.email.label')}</label>
        <input
          type="email"
          id="userEmail"
          name="email"
          required
          placeholder={t('form.email.placeholder')}
          onInput={() => clearError('email')}
        />
        <span className="error-msg">{errors.email || ''}</span>
      </div>

      {/* Message */}
      <div className={`form-group${errors.message ? ' has-error' : ''}`}>
        <label htmlFor="userMessage">{t('form.message.label')}</label>
        <textarea
          id="userMessage"
          name="message"
          rows={6}
          required
          placeholder={t('form.message.placeholder')}
          onInput={() => clearError('message')}
        />
        <span className="error-msg">{errors.message || ''}</span>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="_honeypot"
        ref={honeypotRef}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Submit */}
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? t('form.sending') : t('form.submit')}
      </button>
    </form>
  );
}
