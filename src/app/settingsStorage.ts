export const SETTINGS_KEY = "talentai-settings";

export type TalentAiSettings = {
  autoReject: boolean;
  autoShortlist: boolean;
  sendEmails: boolean;
  detailedReports: boolean;
  thresholds: {
    rejectBelow: number;
    shortlistAbove: number;
  };
};

const DEFAULTS: TalentAiSettings = {
  autoReject: true,
  autoShortlist: true,
  sendEmails: false,
  detailedReports: true,
  thresholds: {
    rejectBelow: 60,
    shortlistAbove: 85,
  },
};

export function loadTalentAiSettings(): TalentAiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<TalentAiSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      thresholds: {
        ...DEFAULTS.thresholds,
        ...(parsed.thresholds ?? {}),
      },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveTalentAiSettings(next: TalentAiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
