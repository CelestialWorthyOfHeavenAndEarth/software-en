import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  createCandidate,
  createPosition,
  getCandidateById,
  incrementPositionApplicationsSmart,
  listCandidates,
  listPositions,
  listRecentScreenings,
  saveScreening,
  updateCandidate,
  updatePosition,
} from "./db.js";
import { extractResumeText } from "./extractText.js";
import { analyzeResume } from "./nlpScore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;

const app = express();
const upload = multer({
  dest: path.join(__dirname, "uploads"),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

function inferPosition(jobDescription) {
  const jd = jobDescription.toLowerCase();
  if (jd.includes("designer") || jd.includes("ux") || jd.includes("ui")) return "UX/UI Designer";
  if (jd.includes("data scientist") || jd.includes("machine learning")) return "Data Scientist";
  if (jd.includes("devops") || jd.includes("sre")) return "DevOps Engineer";
  if (jd.includes("product manager") || jd.includes("product owner")) return "Product Manager";
  return "Software Engineer";
}

function resolveScreenOptions(raw) {
  let parsed = {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  } else if (raw && typeof raw === "object") {
    parsed = raw;
  }
  const thresholds = {
    rejectBelow: Number(parsed.thresholds?.rejectBelow) || 60,
    shortlistAbove: Number(parsed.thresholds?.shortlistAbove) || 85,
  };
  return {
    autoReject: Boolean(parsed.autoReject),
    autoShortlist: Boolean(parsed.autoShortlist),
    sendEmails: Boolean(parsed.sendEmails),
    detailedReports: Boolean(parsed.detailedReports),
    thresholds,
  };
}

function decideStatus(aiScore, options) {
  const { rejectBelow, shortlistAbove } = options.thresholds;
  if (options.autoReject && aiScore < rejectBelow) return "rejected";
  if (options.autoShortlist && aiScore >= shortlistAbove) return "shortlisted";
  if (aiScore >= 82) return "reviewing";
  if (aiScore >= 72) return "pending";
  return "pending";
}

// Auth endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@talentai.com" && password === "admin123") {
    // Generate a simple token (base64 encoded for demo)
    const token = Buffer.from(`admin_token_${Date.now()}`).toString("base64");
    const user = { id: "u_1", name: "Admin User", email: "admin@talentai.com", role: "admin" };
    return res.json({ token, user });
  }
  return res.status(401).json({ message: "Invalid credentials" });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // In a real app, verify the token here
  const user = { id: "u_1", name: "Admin User", email: "admin@talentai.com", role: "admin" };
  return res.json({ user });
});

// Candidates
app.get("/api/candidates", async (_req, res) => {
  const candidates = await listCandidates();
  res.json(candidates);
});

app.get("/api/candidates/:id/resume", async (req, res) => {
  const candidate = await getCandidateById(req.params.id);
  if (!candidate?.resumeUrl) {
    return res.status(404).json({ message: "No resume on file" });
  }
  const abs = path.isAbsolute(candidate.resumeUrl)
    ? candidate.resumeUrl
    : path.join(__dirname, candidate.resumeUrl);
  try {
    await fs.access(abs);
  } catch {
    return res.status(404).json({ message: "Resume file missing" });
  }
  const orig = candidate.resumeFileName || "resume";
  const ext = path.extname(orig).toLowerCase();
  const mime =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : ext === ".doc"
          ? "application/msword"
          : "application/octet-stream";
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(orig)}"`);
  res.type(mime);
  res.send(await fs.readFile(abs));
});

app.get("/api/candidates/:id", async (req, res) => {
  const candidate = await getCandidateById(req.params.id);
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }
  res.json(candidate);
});

app.post("/api/candidates", async (req, res) => {
  const newCandidate = await createCandidate(req.body ?? {});
  res.status(201).json(newCandidate);
});

app.patch("/api/candidates/:id", async (req, res) => {
  const updated = await updateCandidate(req.params.id, req.body ?? {});
  if (!updated) {
    return res.status(404).json({ message: "Candidate not found" });
  }
  res.json(updated);
});

// Job positions
app.get("/api/positions", async (_req, res) => {
  const positions = await listPositions();
  res.json(positions);
});

app.post("/api/positions", async (req, res) => {
  const newPosition = await createPosition(req.body ?? {});
  res.status(201).json(newPosition);
});

app.patch("/api/positions/:id", async (req, res) => {
  const updated = await updatePosition(req.params.id, req.body ?? {});
  if (!updated) {
    return res.status(404).json({ message: "Position not found" });
  }
  res.json(updated);
});

app.get("/api/screenings", async (_req, res) => {
  const rows = await listRecentScreenings(10);
  res.json(rows);
});

app.post("/api/screen", upload.array("resumes"), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const jobDescription = String(req.body?.jobDescription ?? "");
  const options = resolveScreenOptions(req.body?.screenOptions);

  if (!files.length) {
    return res.status(400).json({ message: "Please upload at least one resume file." });
  }

  const positionTitle = inferPosition(jobDescription);
  const today = new Date().toISOString().slice(0, 10);
  const createdCandidates = [];
  const scores = [];

  for (const file of files) {
    const extracted = await extractResumeText(file.path, file.originalname);
    const resumeText = extracted.text || "";
    const nlp = analyzeResume({
      jobDescription,
      resumeText,
      fileName: file.originalname,
    });

    const weaknesses = [...nlp.weaknesses];
    if (extracted.error) weaknesses.push(extracted.error);

    const status = decideStatus(nlp.aiScore, options);

    const email =
      nlp.email ||
      `${(nlp.displayName || "candidate").split(" ")[0].toLowerCase()}.${Date.now().toString().slice(-5)}@example.com`;

    const insights = options.detailedReports
      ? nlp.aiInsights
      : `${nlp.aiInsights.split(".")[0]}.`;

    const candidate = await createCandidate({
      name: nlp.displayName || "Candidate",
      email,
      phone: nlp.phone || "N/A",
      position: positionTitle,
      aiScore: nlp.aiScore,
      matchPercentage: nlp.matchPercentage,
      status,
      appliedDate: today,
      resumeUrl: file.path,
      resumeFileName: file.originalname,
      skills: nlp.skills,
      experience: nlp.experience,
      education: nlp.education,
      location: nlp.location,
      strengths: nlp.strengths,
      weaknesses,
      aiInsights: insights,
      notes: [],
    });

    await incrementPositionApplicationsSmart(jobDescription, positionTitle);
    createdCandidates.push(candidate);
    scores.push(nlp.aiScore);

    if (options.sendEmails && email && !email.endsWith("@example.com")) {
      // Hook for real email provider — omitted in local demo
    }
  }

  const processed = createdCandidates.length;
  const qualified = createdCandidates.filter((c) => c.aiScore >= 70).length;
  const avgScore = processed ? Math.round(scores.reduce((sum, val) => sum + val, 0) / processed) : 0;

  await saveScreening({
    jobDescription,
    processed,
    qualified,
    avgScore,
  });

  res.json({
    processed,
    qualified,
    avgScore,
    createdCandidates,
  });
});

async function start() {
  await fs.mkdir(path.join(__dirname, "uploads"), { recursive: true });
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
