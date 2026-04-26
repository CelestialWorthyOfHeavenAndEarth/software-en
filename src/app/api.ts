export type CandidateNote = {
  text: string;
  at: string;
};

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  aiScore: number;
  matchPercentage: number;
  status: "pending" | "reviewing" | "shortlisted" | "rejected" | "hired";
  appliedDate: string;
  resumeUrl?: string;
  resumeFileName?: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  strengths: string[];
  weaknesses: string[];
  aiInsights: string;
  notes?: CandidateNote[];
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  openings: number;
  candidatesApplied: number;
  status: "active" | "paused" | "closed";
  priority: "high" | "medium" | "low";
  createdDate: string;
}

const API_BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${API_BASE}/candidates`);
  return handleResponse<Candidate[]>(res);
}

export async function fetchCandidate(id: string): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidates/${id}`);
  return handleResponse<Candidate>(res);
}

export async function fetchPositions(): Promise<JobPosition[]> {
  const res = await fetch(`${API_BASE}/positions`);
  return handleResponse<JobPosition[]>(res);
}

export type ScreeningSummary = {
  id: string;
  jobDescription: string;
  processed: number;
  qualified: number;
  avgScore: number;
  createdAt: string;
};

export async function fetchRecentScreenings(): Promise<ScreeningSummary[]> {
  const res = await fetch(`${API_BASE}/screenings`);
  return handleResponse<ScreeningSummary[]>(res);
}

export async function updateCandidate(
  id: string,
  patch: Partial<Candidate>,
): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidates/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });
  return handleResponse<Candidate>(res);
}

export async function createPosition(
  payload: Omit<JobPosition, "id" | "createdDate" | "candidatesApplied"> & {
    createdDate?: string;
    candidatesApplied?: number;
  },
): Promise<JobPosition> {
  const res = await fetch(`${API_BASE}/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<JobPosition>(res);
}

export interface ScreenRequest {
  files: File[];
  jobDescription: string;
  screenOptions?: Record<string, unknown>;
}

export interface ScreenResponse {
  processed: number;
  qualified: number;
  avgScore: number;
  createdCandidates?: Candidate[];
}

export async function screenResumes(body: ScreenRequest): Promise<ScreenResponse> {
  const formData = new FormData();
  formData.append("jobDescription", body.jobDescription);
  if (body.screenOptions) {
    formData.append("screenOptions", JSON.stringify(body.screenOptions));
  }
  for (const file of body.files) {
    formData.append("resumes", file);
  }

  const res = await fetch(`${API_BASE}/screen`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<ScreenResponse>(res);
}

