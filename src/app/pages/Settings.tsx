import { useMemo, useState } from "react";
import { loadTalentAiSettings, saveTalentAiSettings, type TalentAiSettings } from "../settingsStorage";

export function Settings() {
  const initial = useMemo(() => loadTalentAiSettings(), []);
  const [settings, setSettings] = useState<TalentAiSettings>(initial);

  const update = (next: TalentAiSettings) => {
    setSettings(next);
    saveTalentAiSettings(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage recruitment workflow preferences (saved in this browser)</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">Auto-reject below threshold</span>
            <input
              type="checkbox"
              checked={settings.autoReject}
              onChange={(e) => update({ ...settings, autoReject: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
          <div className="flex items-center gap-3 pl-1">
            <span className="text-xs text-gray-500">Reject below AI score</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              value={settings.thresholds.rejectBelow}
              onChange={(e) =>
                update({
                  ...settings,
                  thresholds: { ...settings.thresholds, rejectBelow: Number(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">Auto-shortlist top candidates</span>
            <input
              type="checkbox"
              checked={settings.autoShortlist}
              onChange={(e) => update({ ...settings, autoShortlist: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
          <div className="flex items-center gap-3 pl-1">
            <span className="text-xs text-gray-500">Shortlist at or above</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              value={settings.thresholds.shortlistAbove}
              onChange={(e) =>
                update({
                  ...settings,
                  thresholds: { ...settings.thresholds, shortlistAbove: Number(e.target.value) || 0 },
                })
              }
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-700">Send confirmation emails</span>
          <input
            type="checkbox"
            checked={settings.sendEmails}
            onChange={(e) => update({ ...settings, sendEmails: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-700">Generate detailed reports</span>
          <input
            type="checkbox"
            checked={settings.detailedReports}
            onChange={(e) => update({ ...settings, detailedReports: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
        </label>
      </div>
    </div>
  );
}
