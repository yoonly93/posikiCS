const EmailService = (() => {
  // ============================================================
  // EmailJS 설정
  // ============================================================
  const PUBLIC_KEY  = 'Owic5VYekyFbJJzHA';
  const SERVICE_ID  = 'service_obgq8nh';
  const TEMPLATE_ID = 'template_ut0prbw';
  // ============================================================

  const TYPE_KO = {
    bug: '버그·에러 신고',
    feedback: '건의·피드백',
    general: '일반 문의'
  };

  function init() {
    if (typeof emailjs !== 'undefined') {
      emailjs.init(PUBLIC_KEY);
    } else {
      console.error('EmailJS SDK not loaded');
    }
  }

  async function translateToKo(text, fromLang) {
    if (fromLang === 'ko' || !text) return text || '';
    try {
      const url = 'https://api.mymemory.translated.net/get?q='
        + encodeURIComponent(text)
        + '&langpair=' + fromLang + '|ko';
      const res = await fetch(url);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && translated !== text) {
        return translated;
      }
      return '(자동 번역 실패 - 원문 확인)';
    } catch (e) {
      console.error('Translation error:', e);
      return '(자동 번역 실패 - 원문 확인)';
    }
  }

  async function send({ app, type, typeValue, email, message, source, language }) {
    const typeKo = TYPE_KO[typeValue] || type;
    const messageKo = await translateToKo(message, language);

    const params = {
      app_name: app,
      inquiry_type: type,
      inquiry_type_ko: typeKo,
      user_email: email,
      message: message,
      message_ko: messageKo,
      source: source || 'direct',
      language: language,
      timestamp: new Date().toISOString()
    };

    return emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
  }

  return { init, send };
})();

document.addEventListener('DOMContentLoaded', () => EmailService.init());
