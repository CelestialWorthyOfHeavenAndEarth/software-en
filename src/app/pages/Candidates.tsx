import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Search, Filter, Download, Mail, Calendar } from "lucide-react";
import { Candidate, fetchCandidates } from "../api";

export function Candidates() {
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all");
  const [positionFilter] = useState(searchParams.get("position") ?? "");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");

  useEffect(() => {
    fetchCandidates()
      .then(setCandidates)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch candidates", err));
  }, []);

  const filteredCandidates = candidates
    .filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
      const matchesPosition = !positionFilter || candidate.position === positionFilter;
      return matchesSearch && matchesStatus && matchesPosition;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return b.aiScore - a.aiScore;
      } else {
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
    });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-amber-600 bg-amber-100";
    return "text-gray-600 bg-gray-100";
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

  const recipientList = useMemo(
    () => filteredCandidates.map((candidate) => candidate.email).filter(Boolean),
    [filteredCandidates],
  );

  const handleExport = () => {
    if (!filteredCandidates.length) return;
    const header = ["Name", "Email", "Position", "AI Score", "Match %", "Status", "Applied Date"];
    const rows = filteredCandidates.map((c) => [
      c.name,
      c.email,
      c.position,
      String(c.aiScore),
      String(c.matchPercentage),
      c.status,
      c.appliedDate,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidates-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleBulkEmail = () => {
    if (!recipientList.length) return;
    window.location.href = `mailto:${recipientList.join(",")}?subject=${encodeURIComponent("Regarding your application")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidates</h1>
          <p className="text-sm text-gray-600 mt-1">{filteredCandidates.length} candidates found</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={!filteredCandidates.length}
            className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleBulkEmail}
            disabled={!recipientList.length}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            Bulk Email
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, position, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="reviewing">Reviewing</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "date")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="score">Sort by AI Score</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-semibold shrink-0">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link to={`/candidates/${candidate.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                          {candidate.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">{candidate.position}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {candidate.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Applied {new Date(candidate.appliedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`px-3 py-1 rounded-lg font-semibold text-lg ${getScoreColor(candidate.aiScore)}`}>
                          {candidate.aiScore}
                        </div>
                        <div className="text-xs text-gray-500">AI Score</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 6).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{candidate.skills.length - 6} more
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Experience:</span>
                          <span className="ml-1 text-gray-900 font-medium">{candidate.experience} years</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Match:</span>
                          <span className="ml-1 text-gray-900 font-medium">{candidate.matchPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-1 text-gray-900">{candidate.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                        <Link
                          to={`/candidates/${candidate.id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No candidates found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
