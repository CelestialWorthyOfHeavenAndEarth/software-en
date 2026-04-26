import { useEffect, useState } from "react";
import { Upload, FileText, X, Sparkles, Check } from "lucide-react";
import { screenResumes } from "../api";
import { Link } from "react-router";
import { loadTalentAiSettings, saveTalentAiSettings, type TalentAiSettings } from "../settingsStorage";

export function ScreenResumes() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [screening, setScreening] = useState(false);
  const [screened, setScreened] = useState(false);
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  const [qualifiedCount, setQualifiedCount] = useState<number | null>(null);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [screenSettings, setScreenSettings] = useState<TalentAiSettings>(() => loadTalentAiSettings());

  useEffect(() => {
    setScreenSettings(loadTalentAiSettings());
  }, []);

  const persistScreenSettings = (next: TalentAiSettings) => {
    setScreenSettings(next);
    saveTalentAiSettings(next);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleScreen = () => {
    setScreening(true);
    setScreened(false);
    screenResumes({
      files,
      jobDescription,
      screenOptions: {
        autoReject: screenSettings.autoReject,
        autoShortlist: screenSettings.autoShortlist,
        sendEmails: screenSettings.sendEmails,
        detailedReports: screenSettings.detailedReports,
        thresholds: screenSettings.thresholds,
      },
    })
      .then((result) => {
        setErrorMessage("");
        setProcessedCount(result.processed);
        setQualifiedCount(result.qualified);
        setAvgScore(result.avgScore);
        setScreened(true);
      })
      .catch((err) => {
        setErrorMessage("Screening failed. Please try again.");
        // eslint-disable-next-line no-console
        console.error("Failed to screen resumes", err);
      })
      .finally(() => {
        setScreening(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Screen Resumes</h1>
        <p className="text-sm text-gray-600 mt-1">Upload resumes and let AI analyze candidate qualifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Resumes</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="resume-upload"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX (Max 10MB each)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">{files.length} file{files.length !== 1 && 's'} selected</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to help AI match candidates more accurately..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="mt-4">
              <button
                onClick={handleScreen}
                disabled={files.length === 0 || screening}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {screening ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing Resumes...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start AI Screening
                  </>
                )}
              </button>
              {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">AI Screening Features</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Skills Extraction</p>
                  <p className="text-xs text-gray-600 mt-1">Automatically identify and categorize technical and soft skills</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Experience Analysis</p>
                  <p className="text-xs text-gray-600 mt-1">Calculate relevant work experience and career progression</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Education Verification</p>
                  <p className="text-xs text-gray-600 mt-1">Extract and verify educational qualifications and certifications</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Job Match Scoring</p>
                  <p className="text-xs text-gray-600 mt-1">Compare candidates against job requirements with percentage match</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Strength & Weakness Detection</p>
                  <p className="text-xs text-gray-600 mt-1">Identify key strengths and potential areas for development</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">AI-Powered Insights</p>
                  <p className="text-xs text-gray-600 mt-1">Generate detailed analysis and hiring recommendations</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Bias Reduction</p>
                  <p className="text-xs text-gray-600 mt-1">Fair evaluation based on qualifications, not demographics</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Automated Ranking</p>
                  <p className="text-xs text-gray-600 mt-1">Sort candidates by overall fit and qualification level</p>
                </div>
              </div>
            </div>
          </div>

              {screened && (
            <div className="bg-white rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Screening Complete!</h3>
                  <p className="text-sm text-gray-600">AI analysis finished successfully</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900">{processedCount ?? files.length}</div>
                    <div className="text-xs text-gray-600">Processed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-green-600">
                      {qualifiedCount ?? Math.ceil(files.length * 0.4)}
                    </div>
                    <div className="text-xs text-gray-600">Qualified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-blue-600">{avgScore ?? 88}</div>
                    <div className="text-xs text-gray-600">Avg Score</div>
                  </div>
                </div>
              </div>

              <Link
                to="/candidates"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center block"
              >
                View Results
              </Link>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Screening Settings</h2>
            <p className="text-xs text-gray-500 mb-4">Synced with Settings page (stored in this browser).</p>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenSettings.autoReject}
                    onChange={(e) => persistScreenSettings({ ...screenSettings, autoReject: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-reject below threshold</span>
                </label>
                <div className="ml-6 mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Reject below AI score</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={screenSettings.thresholds.rejectBelow}
                    onChange={(e) =>
                      persistScreenSettings({
                        ...screenSettings,
                        thresholds: { ...screenSettings.thresholds, rejectBelow: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenSettings.autoShortlist}
                    onChange={(e) => persistScreenSettings({ ...screenSettings, autoShortlist: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-shortlist top candidates</span>
                </label>
                <div className="ml-6 mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Shortlist at or above</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={screenSettings.thresholds.shortlistAbove}
                    onChange={(e) =>
                      persistScreenSettings({
                        ...screenSettings,
                        thresholds: { ...screenSettings.thresholds, shortlistAbove: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenSettings.sendEmails}
                    onChange={(e) => persistScreenSettings({ ...screenSettings, sendEmails: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Send confirmation emails</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">Requires mail integration in production</p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screenSettings.detailedReports}
                    onChange={(e) => persistScreenSettings({ ...screenSettings, detailedReports: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Generate detailed reports</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">Longer AI insight text per candidate when enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
