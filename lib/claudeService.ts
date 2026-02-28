import { getClaudeApiKey } from './settingsService';

async function callClaude(prompt: string): Promise<string> {
  const apiKey = await getClaudeApiKey();
  if (!apiKey) {
    throw new Error('Claude API 키가 설정되지 않았습니다. 설정 페이지에서 입력해주세요.');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg =
      (errData as Record<string, Record<string, string>>)?.error?.message ||
      `Claude API 오류 (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

const LANG_MAP: Record<string, string> = {
  en: '영어',
  ja: '일본어',
  ko: '한국어',
};

export async function translateDoc(
  content: string,
  targetLang: string,
  docType: string,
): Promise<string> {
  const langName = LANG_MAP[targetLang] || targetLang;
  const docLabel = docType === 'privacy' ? '개인정보처리방침' : '이용약관';

  const prompt = `이 ${docLabel}을 ${langName}로 번역해줘. 법적 문서의 형식과 구조를 유지하고, 해당 국가의 법적 관행에 맞게 자연스럽게 번역해줘. 마크다운 형식을 그대로 유지해줘. 번역 결과만 출력하고, 설명이나 부연은 붙이지 마.

---

${content}`;

  return callClaude(prompt);
}

export async function reviewDoc(
  content: string,
  features: string[],
  docType: string,
): Promise<string> {
  const docLabel = docType === 'privacy' ? '개인정보처리방침' : '이용약관';
  const featureList = features.join(', ');

  const prompt = `이 법적 문서(${docLabel})와 앱 기능 목록을 비교해서 불일치하는 부분을 찾아줘.

앱에 등록된 기능: ${featureList}

예시:
- Firebase 사용하는데 데이터 수집 미언급
- Google 로그인 쓰는데 제3자 제공 미언급
- 위치 수집 기능이 있는데 위치정보 처리 미언급

문제점과 수정 제안을 한국어로 목록 형태로 출력해줘.

---

${content}`;

  return callClaude(prompt);
}
