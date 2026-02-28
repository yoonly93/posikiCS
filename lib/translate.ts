export async function translateToKo(text: string, fromLang: string): Promise<string> {
  if (fromLang === 'ko' || !text) return text || '';
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text) +
      '&langpair=' +
      fromLang +
      '|ko';
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && translated !== text) return translated;
    return '(자동 번역 실패 - 원문 확인)';
  } catch {
    return '(자동 번역 실패 - 원문 확인)';
  }
}
