import { useEffect, useState } from "react";
import { Users, FileCheck, TrendingUp, Clock, Star, AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { Candidate, JobPosition, ScreeningSummary, fetchCandidates, fetchPositions, fetchRecentScreenings } from "../api";

export function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);

  useEffect(() => {
    fetchCandidates()
      .then(setCandidates)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch candidates", err));
    fetchPositions()
      .then(setPositions)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch positions", err));
    fetchRecentScreenings()
      .then(setScreenings)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch screenings", err));
  }, []);

  const totalCandidates = candidates.length;
  const shortlisted = candidates.filter(c => c.status === "shortlisted").length;
  const reviewing = candidates.filter(c => c.status === "reviewing").length;
  const avgScore = totalCandidates
    ? Math.round(candidates.reduce((acc, c) => acc + c.aiScore, 0) / totalCandidates)
    : 0;

  const topCandidates = [...candidates]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5);

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of your recruitment pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{totalCandidates}</p>
              <p className="text-sm text-green-600 mt-1">+12 this week</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shortlisted</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{shortlisted}</p>
              <p className="text-sm text-green-600 mt-1">High quality matches</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{reviewing}</p>
              <p className="text-sm text-amber-600 mt-1">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg AI Score</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{avgScore}</p>
              <p className="text-sm text-blue-600 mt-1">Quality indicator</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Candidates */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Top Ranked Candidates</h2>
              </div>
              <Link to="/candidates" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {topCandidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/candidates/${candidate.id}`}
                className="p-4 hover:bg-gray-50 transition-colors block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        <p className="text-sm text-gray-600">{candidate.position}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-semibold text-gray-900">{candidate.aiScore}</div>
                      <div className="text-sm text-gray-500">/ 100</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{candidate.matchPercentage}% match</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              </div>
              <Link to="/candidates" className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCandidates.map((candidate) => {
              const daysAgo = Math.floor((new Date().getTime() - new Date(candidate.appliedDate).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Link
                  key={candidate.id}
                  to={`/candidates/${candidate.id}`}
                  className="p-4 hover:bg-gray-50 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{candidate.name}</p>
                          <p className="text-sm text-gray-600">{candidate.position}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">{daysAgo}d ago</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        candidate.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                        candidate.status === 'reviewing' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {candidate.status}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {screenings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent screening runs</h2>
            <Link to="/screen" className="text-sm text-blue-600 hover:text-blue-700">
              New screening
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {screenings.slice(0, 5).map((s) => (
              <li key={s.id} className="py-3 first:pt-0">
                <p className="text-sm text-gray-900 line-clamp-2">{s.jobDescription || "(no job description)"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(s.createdAt).toLocaleString()} · Processed {s.processed} · Qualified {s.qualified} · Avg{" "}
                  {s.avgScore}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Positions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Active Job Positions</h2>
            </div>
            <Link to="/positions" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Openings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{position.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{position.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{position.openings}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{position.candidatesApplied}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      position.priority === 'high' ? 'bg-red-100 text-red-700' :
                      position.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {position.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
