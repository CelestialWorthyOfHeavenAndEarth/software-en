import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Award, AlertCircle, ThumbsUp, ThumbsDown, FileText, Download } from "lucide-react";
import { Candidate, fetchCandidate, updateCandidate } from "../api";

export function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate(id)
      .then((data) => {
        setCandidate(data);
        setNotFound(false);
      })
      .catch((err) => {
        if ((err as Error).message.toLowerCase().includes("not found")) {
          setNotFound(true);
        }
        // eslint-disable-next-line no-console
        console.error("Failed to fetch candidate", err);
      });
  }, [id]);

  if (notFound) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Candidate not found</p>
        <Link to="/candidates" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Candidates
        </Link>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">Loading candidate...</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-amber-500 to-orange-600";
    return "from-gray-500 to-slate-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "shortlisted": return "bg-green-100 text-green-700";
      case "reviewing": return "bg-amber-100 text-amber-700";
      case "pending": return "bg-gray-100 text-gray-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "hired": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const changeStatus = async (status: Candidate["status"]) => {
    if (!candidate) return;
    setActionLoading(true);
    try {
      const updated = await updateCandidate(candidate.id, { status });
      setCandidate(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNotes = async () => {
    if (!candidate) return;
    const text = window.prompt("Add a note for this candidate:");
    if (!text?.trim()) return;
    setActionLoading(true);
    try {
      const entry = { text: text.trim(), at: new Date().toISOString() };
      const updated = await updateCandidate(candidate.id, {
        notes: [...(candidate.notes ?? []), entry],
      });
      setCandidate(updated);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/candidates" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`h-32 bg-gradient-to-r ${getScoreColor(candidate.aiScore)}`}></div>
        <div className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 -mt-20 bg-white border-4 border-white rounded-xl shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-semibold">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900">{candidate.name}</h1>
                  <p className="text-lg text-gray-600 mt-1">{candidate.position}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-lg ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                  <button
                    onClick={() => changeStatus("reviewing")}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Schedule Interview
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{candidate.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">{candidate.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Applied</p>
                    <p className="text-sm text-gray-900">{new Date(candidate.appliedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Score & Match */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Analysis</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                <div className="text-5xl font-bold text-gray-900 mb-2">{candidate.aiScore}</div>
                <div className="text-sm text-gray-600">AI Score</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(candidate.aiScore)}`} style={{ width: `${candidate.aiScore}%` }}></div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-5xl font-bold text-gray-900 mb-2">{candidate.matchPercentage}%</div>
                <div className="text-sm text-gray-600">Match Score</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${candidate.matchPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">AI Insights</p>
                  <p className="text-sm text-blue-800">{candidate.aiInsights}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Strengths & Areas for Development</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {candidate.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="w-5 h-5 text-amber-600" />
                  <h3 className="font-medium text-gray-900">Areas for Development</h3>
                </div>
                <ul className="space-y-3">
                  {candidate.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Skills</h2>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span key={skill} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Resume</h2>
              <button
                onClick={() => {
                  window.open(`/api/candidates/${candidate.id}/resume`, "_blank", "noopener,noreferrer");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                disabled={!candidate.resumeUrl}
              >
                <Download className="w-4 h-4" />
                Download file
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Resume preview not available</p>
                <p className="text-sm text-gray-500 mt-1">
                  {candidate.resumeFileName ? candidate.resumeFileName : "Use Download to open the original file."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          {(candidate.notes?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <div className="space-y-3">
                {candidate.notes!.map((n, i) => (
                  <div key={i} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-gray-800">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Info</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="text-sm text-gray-900 font-medium">{candidate.experience} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Education</p>
                  <p className="text-sm text-gray-900 font-medium">{candidate.education}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Status</p>
                  <p className="text-sm text-gray-900 font-medium capitalize">{candidate.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-2">
              <button
                onClick={() => changeStatus("shortlisted")}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Shortlist Candidate
              </button>
              <button
                onClick={() => changeStatus("reviewing")}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Interview
              </button>
              <button
                onClick={() => {
                  window.location.href = `mailto:${candidate.email}?subject=${encodeURIComponent("Regarding your application")}`;
                }}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Send Email
              </button>
              <button
                onClick={handleAddNotes}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Notes
              </button>
              <button
                onClick={() => changeStatus("rejected")}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Candidate
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Application Received</p>
                  <p className="text-xs text-gray-500">{new Date(candidate.appliedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Screening Completed</p>
                  <p className="text-xs text-gray-500">{new Date(candidate.appliedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Under Review</p>
                  <p className="text-xs text-gray-500">In progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
