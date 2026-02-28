import emailjs from '@emailjs/browser';
import { translateToKo } from './translate';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;

const TYPE_KO: Record<string, string> = {
  bug: '버그·에러 신고',
  feedback: '건의·피드백',
  general: '일반 문의',
};

let initialized = false;

export function initEmailJS() {
  if (!initialized) {
    emailjs.init(PUBLIC_KEY);
    initialized = true;
  }
}

interface EmailData {
  app: string;
  type: string;
  typeValue: string;
  email: string;
  message: string;
  source: string | null;
  language: string;
}

export async function sendEmail({ app, type, typeValue, email, message, source, language }: EmailData) {
  initEmailJS();

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
    timestamp: new Date().toISOString(),
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
}
