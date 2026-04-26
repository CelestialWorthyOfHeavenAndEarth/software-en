import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, MoreVertical, Users, Calendar, TrendingUp } from "lucide-react";
import { JobPosition, createPosition, fetchPositions } from "../api";

export function JobPositions() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [openings, setOpenings] = useState(1);
  const [priority, setPriority] = useState<JobPosition["priority"]>("medium");

  useEffect(() => {
    fetchPositions()
      .then(setPositions)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch positions", err));
  }, []);
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "low": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "paused": return "bg-amber-100 text-amber-700";
      case "closed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const refreshPositions = () => {
    fetchPositions()
      .then(setPositions)
      // eslint-disable-next-line no-console
      .catch((err) => console.error("Failed to fetch positions", err));
  };

  const handleCreatePosition = async () => {
    if (!title.trim()) return;
    await createPosition({
      title: title.trim(),
      department: department.trim() || "General",
      openings: Math.max(1, openings),
      status: "active",
      priority,
      candidatesApplied: 0,
    });
    setTitle("");
    setDepartment("");
    setOpenings(1);
    setPriority("medium");
    setShowCreate(false);
    refreshPositions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Job Positions</h1>
          <p className="text-sm text-gray-600 mt-1">{positions.length} active positions</p>
        </div>
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Position
        </button>
      </div>
      {showCreate && (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Position title"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value))}
              min={1}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPosition["priority"])}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <div className="mt-3">
            <button
              onClick={handleCreatePosition}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Create Position
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Openings</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {positions.reduce((acc, pos) => acc + pos.openings, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Applications</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {positions.reduce((acc, pos) => acc + pos.candidatesApplied, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">High Priority</p>
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {positions.filter(pos => pos.priority === 'high').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Applications</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {positions.length ? Math.round(positions.reduce((acc, pos) => acc + pos.candidatesApplied, 0) / positions.length) : 0}
          </p>
        </div>
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positions.map((position) => (
          <div key={position.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{position.title}</h3>
                  <p className="text-sm text-gray-600">{position.department}</p>
                </div>
                <button
                  onClick={() => window.alert(`${position.title} (${position.department}) is currently ${position.status}.`)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(position.status)}`}>
                  {position.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(position.priority)}`}>
                  {position.priority} priority
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Openings</p>
                  <p className="text-lg font-semibold text-gray-900">{position.openings}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Applications</p>
                  <p className="text-lg font-semibold text-gray-900">{position.candidatesApplied}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Per Opening</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round(position.candidatesApplied / position.openings)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {new Date(position.createdDate).toLocaleDateString()}
                </p>
                <Link
                  to={`/candidates?position=${encodeURIComponent(position.title)}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Candidates
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
