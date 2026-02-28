'use client';

interface LanguageBarProps {
  lang: string;
  supportedLangs: readonly string[];
  langLabels: Record<string, string>;
  switchLanguage: (lang: string) => void;
}

export default function LanguageBar({ lang, supportedLangs, langLabels, switchLanguage }: LanguageBarProps) {
  return (
    <nav className="lang-bar">
      <div className="lang-bar-inner">
        {supportedLangs.map((l) => (
          <button
            key={l}
            className={`lang-btn${l === lang ? ' active' : ''}`}
            onClick={() => switchLanguage(l)}
          >
            {langLabels[l]}
          </button>
        ))}
      </div>
      <div className="lang-dropdown-wrapper">
        <svg
          className="lang-dropdown-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </svg>
        <select
          className="lang-dropdown"
          value={lang}
          onChange={(e) => switchLanguage(e.target.value)}
        >
          {supportedLangs.map((l) => (
            <option key={l} value={l}>
              {langLabels[l]}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
