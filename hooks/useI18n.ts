'use client';

import { useState, useCallback, useEffect } from 'react';

const SUPPORTED_LANGS = ['ko', 'en', 'ja', 'zh', 'fr', 'es', 'ru'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

const DEFAULT_LANG: Lang = 'en';
const STORAGE_KEY = 'posikiCS-lang';

const ALL_TRANSLATIONS: Record<Lang, Record<string, unknown>> = {
  ko: {
    header: { title: '문의하기', subtitle: '소중한 의견을 보내주세요' },
    form: {
      app: { label: '서비스 선택', placeholder: '선택해주세요' },
      type: { label: '문의 유형', placeholder: '선택해주세요', bug: '버그 / 에러 신고', feedback: '건의 / 피드백', general: '일반 문의' },
      email: { label: '이메일 주소', placeholder: 'your@email.com' },
      message: { label: '내용', placeholder: '자세한 내용을 작성해주세요...' },
      submit: '보내기',
      sending: '전송 중...',
    },
    toast: { success: '의견이 성공적으로 전송되었습니다!', error: '전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' },
    validation: { appRequired: '서비스를 선택해주세요.', typeRequired: '문의 유형을 선택해주세요.', emailRequired: '이메일을 입력해주세요.', emailInvalid: '올바른 이메일 형식이 아닙니다.', messageRequired: '내용을 입력해주세요.' },
  },
  en: {
    header: { title: 'Contact Us', subtitle: "We'd love to hear from you" },
    form: {
      app: { label: 'Service', placeholder: 'Please select' },
      type: { label: 'Inquiry Type', placeholder: 'Please select', bug: 'Bug / Error Report', feedback: 'Suggestion / Feedback', general: 'General Inquiry' },
      email: { label: 'Email Address', placeholder: 'your@email.com' },
      message: { label: 'Message', placeholder: 'Please describe in detail...' },
      submit: 'Submit',
      sending: 'Sending...',
    },
    toast: { success: 'Your message has been sent successfully!', error: 'Something went wrong while sending. Please try again in a moment.' },
    validation: { appRequired: 'Please select a service.', typeRequired: 'Please select an inquiry type.', emailRequired: 'Please enter your email.', emailInvalid: 'Please enter a valid email address.', messageRequired: 'Please enter your message.' },
  },
  ja: {
    header: { title: 'お問い合わせ', subtitle: 'ご意見をお聞かせください' },
    form: {
      app: { label: 'サービス選択', placeholder: '選択してください' },
      type: { label: 'お問い合わせ種類', placeholder: '選択してください', bug: 'バグ / エラー報告', feedback: 'ご提案 / フィードバック', general: '一般的なお問い合わせ' },
      email: { label: 'メールアドレス', placeholder: 'your@email.com' },
      message: { label: '内容', placeholder: '詳しい内容をご記入ください...' },
      submit: '送信する',
      sending: '送信中...',
    },
    toast: { success: 'お問い合わせが正常に送信されました！', error: '送信中にエラーが発生しました。しばらくしてからもう一度お試しください。' },
    validation: { appRequired: 'サービスを選択してください。', typeRequired: 'お問い合わせ種類を選択してください。', emailRequired: 'メールアドレスを入力してください。', emailInvalid: '正しいメールアドレスを入力してください。', messageRequired: '内容を入力してください。' },
  },
  zh: {
    header: { title: '联系我们', subtitle: '期待您的宝贵意见' },
    form: {
      app: { label: '服务选择', placeholder: '请选择' },
      type: { label: '咨询类型', placeholder: '请选择', bug: 'Bug / 错误报告', feedback: '建议 / 反馈', general: '一般咨询' },
      email: { label: '电子邮箱', placeholder: 'your@email.com' },
      message: { label: '内容', placeholder: '请详细描述...' },
      submit: '提交',
      sending: '发送中...',
    },
    toast: { success: '您的消息已成功发送！', error: '发送过程中出现问题，请稍后重试。' },
    validation: { appRequired: '请选择服务。', typeRequired: '请选择咨询类型。', emailRequired: '请输入电子邮箱。', emailInvalid: '请输入有效的电子邮箱地址。', messageRequired: '请输入内容。' },
  },
  fr: {
    header: { title: 'Contactez-nous', subtitle: 'Nous aimerions avoir votre avis' },
    form: {
      app: { label: 'Service', placeholder: 'Veuillez sélectionner' },
      type: { label: 'Type de demande', placeholder: 'Veuillez sélectionner', bug: "Bug / Signalement d'erreur", feedback: 'Suggestion / Retour', general: 'Demande générale' },
      email: { label: 'Adresse e-mail', placeholder: 'your@email.com' },
      message: { label: 'Message', placeholder: 'Veuillez décrire en détail...' },
      submit: 'Envoyer',
      sending: 'Envoi en cours...',
    },
    toast: { success: 'Votre message a été envoyé avec succès !', error: "Un problème est survenu lors de l'envoi. Veuillez réessayer dans un instant." },
    validation: { appRequired: 'Veuillez sélectionner un service.', typeRequired: 'Veuillez sélectionner un type de demande.', emailRequired: 'Veuillez entrer votre e-mail.', emailInvalid: 'Veuillez entrer une adresse e-mail valide.', messageRequired: 'Veuillez entrer votre message.' },
  },
  es: {
    header: { title: 'Contáctenos', subtitle: 'Nos encantaría saber su opinión' },
    form: {
      app: { label: 'Servicio', placeholder: 'Por favor seleccione' },
      type: { label: 'Tipo de consulta', placeholder: 'Por favor seleccione', bug: 'Bug / Reporte de error', feedback: 'Sugerencia / Comentario', general: 'Consulta general' },
      email: { label: 'Correo electrónico', placeholder: 'your@email.com' },
      message: { label: 'Mensaje', placeholder: 'Por favor describa en detalle...' },
      submit: 'Enviar',
      sending: 'Enviando...',
    },
    toast: { success: '¡Su mensaje se ha enviado correctamente!', error: 'Ocurrió un problema al enviar. Por favor intente de nuevo en un momento.' },
    validation: { appRequired: 'Por favor seleccione un servicio.', typeRequired: 'Por favor seleccione un tipo de consulta.', emailRequired: 'Por favor ingrese su correo electrónico.', emailInvalid: 'Por favor ingrese un correo electrónico válido.', messageRequired: 'Por favor ingrese su mensaje.' },
  },
  ru: {
    header: { title: 'Связаться с нами', subtitle: 'Мы будем рады вашему мнению' },
    form: {
      app: { label: 'Сервис', placeholder: 'Пожалуйста, выберите' },
      type: { label: 'Тип обращения', placeholder: 'Пожалуйста, выберите', bug: 'Баг / Сообщение об ошибке', feedback: 'Предложение / Отзыв', general: 'Общий вопрос' },
      email: { label: 'Электронная почта', placeholder: 'your@email.com' },
      message: { label: 'Сообщение', placeholder: 'Пожалуйста, опишите подробно...' },
      submit: 'Отправить',
      sending: 'Отправка...',
    },
    toast: { success: 'Ваше сообщение успешно отправлено!', error: 'При отправке произошла ошибка. Пожалуйста, попробуйте снова через некоторое время.' },
    validation: { appRequired: 'Пожалуйста, выберите сервис.', typeRequired: 'Пожалуйста, выберите тип обращения.', emailRequired: 'Пожалуйста, введите электронную почту.', emailInvalid: 'Пожалуйста, введите корректный адрес электронной почты.', messageRequired: 'Пожалуйста, введите сообщение.' },
  },
};

const LANG_LABELS: Record<Lang, string> = {
  ko: '한국어', en: 'English', ja: '日本語', zh: '中文', fr: 'Français', es: 'Español', ru: 'Русский',
};

function getNestedValue(obj: Record<string, unknown>, path: string): string | null {
  const result = path.split('.').reduce<unknown>((o, key) => {
    if (o && typeof o === 'object' && key in (o as Record<string, unknown>)) {
      return (o as Record<string, unknown>)[key];
    }
    return null;
  }, obj);
  return typeof result === 'string' ? result : null;
}

function detectLanguage(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (SUPPORTED_LANGS as readonly string[]).includes(saved)) {
    return saved as Lang;
  }

  const browserLangs = navigator.languages || [navigator.language || ''];
  for (const lang of browserLangs) {
    const code = lang.split('-')[0].toLowerCase();
    if ((SUPPORTED_LANGS as readonly string[]).includes(code)) {
      return code as Lang;
    }
  }

  return DEFAULT_LANG;
}

export function useI18n() {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangState(detectLanguage());
    setHydrated(true);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(ALL_TRANSLATIONS[lang], key) || key;
    },
    [lang],
  );

  const switchLanguage = useCallback((newLang: string) => {
    if (!(SUPPORTED_LANGS as readonly string[]).includes(newLang)) return;
    const l = newLang as Lang;
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  return { lang, t, switchLanguage, supportedLangs: SUPPORTED_LANGS, langLabels: LANG_LABELS, hydrated };
}
