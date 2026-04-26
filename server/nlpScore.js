const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "shall", "can", "this", "that", "these", "those",
  "i", "you", "he", "she", "it", "we", "they", "them", "their", "our", "your", "my", "me", "us",
  "not", "no", "yes", "all", "any", "some", "such", "than", "then", "there", "here", "when", "where", "what",
  "who", "which", "how", "about", "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "once", "both", "each", "few", "more", "most", "other", "such",
  "only", "own", "same", "so", "than", "too", "very", "just", "also", "using", "including",
]);

const SKILL_LEXICON = [
  "react", "node", "nodejs", "typescript", "javascript", "python", "django", "flask", "fastapi",
  "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "ci/cd", "cicd",
  "sql", "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
  "figma", "sketch", "adobe", "ux", "ui", "design", "prototyping",
  "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "keras", "scikit", "pandas", "numpy",
  "java", "spring", "kotlin", "go", "golang", "rust", "c++", "csharp", ".net", "dotnet",
  "angular", "vue", "next.js", "nextjs", "express", "graphql", "rest", "api",
  "devops", "linux", "bash", "shell", "git", "github", "gitlab",
  "agile", "scrum", "kanban", "jira", "product", "roadmap", "stakeholder",
  "data science", "statistics", "spark", "hadoop", "etl", "tableau", "power bi",
];

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\d{10,})/g;
const EDU_RE = /(b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?|ph\.?d\.?|bachelor|master|associate|diploma)[^.]{0,120}/gi;

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function uniqueTokens(tokens) {
  return [...new Set(tokens)];
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function findSkills(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const skill of SKILL_LEXICON) {
    if (lower.includes(skill)) {
      const label = skill === "aws" ? "AWS" : titleCaseWords(skill);
      if (!found.includes(label)) found.push(label);
    }
  }
  return found.slice(0, 12);
}

function titleCaseWords(s) {
  return s
    .split(/[\s/.]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractYearsExperience(text) {
  let maxY = 0;
  const m = text.matchAll(/\b(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/gi);
  for (const match of m) {
    const n = Number(match[1]);
    if (n >= 0 && n <= 60) maxY = Math.max(maxY, n);
  }
  const m2 = text.matchAll(/(\d{1,2})\+?\s*(years?|yrs?)\s+(of\s+)?(experience|exp)/gi);
  for (const match of m2) {
    const n = Number(match[1]);
    if (n >= 0 && n <= 60) maxY = Math.max(maxY, n);
  }
  return maxY;
}

function extractEmails(text) {
  const set = new Set((text.match(EMAIL_RE) || []).map((e) => e.trim()));
  return [...set];
}

function extractPhones(text) {
  const matches = text.match(PHONE_RE) || [];
  return [...new Set(matches.map((p) => p.trim()))].slice(0, 2);
}

function extractEducationSnippets(text) {
  const snippets = [];
  const m = text.match(EDU_RE);
  if (m) {
    for (const s of m.slice(0, 3)) {
      const cleaned = s.replace(/\s+/g, " ").trim();
      if (cleaned.length > 8) snippets.push(cleaned.slice(0, 120));
    }
  }
  return snippets;
}

function inferLocation(text) {
  const m = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/);
  if (m) return `${m[1]}, ${m[2]}`;
  return "";
}

export function inferDisplayName(resumeText, fileName) {
  const lines = (resumeText || "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 15)) {
    if (line.length > 80) continue;
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) {
      return line;
    }
  }
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

/**
 * NLP-style scoring: lexical overlap + skill alignment + experience signal.
 */
export function analyzeResume({ jobDescription, resumeText, fileName }) {
  const jd = jobDescription || "";
  const resume = resumeText || "";
  const combined = `${jd}\n${resume}`;

  const jdTokens = uniqueTokens(tokenize(jd));
  const resumeTokens = uniqueTokens(tokenize(resume));
  const overlap = jaccard(jdTokens, resumeTokens);

  const jdSkills = findSkills(jd);
  const resumeSkills = findSkills(resume);
  const skillUnion = new Set([...jdSkills, ...resumeSkills]);
  let skillHits = 0;
  for (const s of jdSkills) {
    if (resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase())) skillHits += 1;
  }
  const skillRatio = jdSkills.length ? Math.min(1, skillHits / jdSkills.length) : resumeSkills.length ? 0.35 : 0.15;

  const years = extractYearsExperience(resume);
  const jdYears = extractYearsExperience(jd);
  let expFit = 0.5;
  if (years > 0) {
    if (jdYears > 0) {
      expFit = 1 - Math.min(1, Math.abs(years - jdYears) / Math.max(jdYears, 1));
    } else {
      expFit = Math.min(1, years / 10);
    }
  }

  const coverage = Math.min(1, resume.length / 3500);
  const lexicalScore = overlap * 40 + skillRatio * 35 + expFit * 15 + coverage * 10;

  const aiScore = Math.round(Math.min(98, Math.max(45, 48 + lexicalScore * 0.52)));

  const matchBase = overlap * 55 + skillRatio * 35 + expFit * 10;
  const matchPercentage = Math.round(Math.min(99, Math.max(40, matchBase)));

  const emails = extractEmails(resume);
  const phones = extractPhones(resume);
  const educationBits = extractEducationSnippets(resume);
  const location = inferLocation(resume);

  const strengths = [];
  const weaknesses = [];

  if (overlap > 0.12) strengths.push("Strong keyword overlap between resume and job description");
  else weaknesses.push("Limited lexical overlap with the job description");

  if (skillHits > 0) strengths.push(`Matches ${skillHits} prioritized skills from the role`);
  else if (jdSkills.length) weaknesses.push("Few explicit matches to listed role skills");

  if (years > 0) strengths.push(`Detected ~${years} years of experience signals in resume`);
  else weaknesses.push("Could not confidently infer years of experience from text");

  if (resume.length > 800) strengths.push("Resume text extracted with sufficient detail for screening");
  else weaknesses.push("Resume text is short or lightly extractable; scores may be conservative");

  const displayName = inferDisplayName(resume, fileName);

  const insights = [
    `Match score ${matchPercentage}% based on JD overlap, skill alignment, and experience signals.`,
    jdSkills.length ? `Role emphasizes: ${jdSkills.slice(0, 6).join(", ")}.` : "",
    resumeSkills.length ? `Resume highlights: ${resumeSkills.slice(0, 8).join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    displayName,
    aiScore,
    matchPercentage,
    skills: resumeSkills.length ? resumeSkills : findSkills(`${fileName} ${jd}`),
    experience: years || Math.max(1, Math.round(aiScore / 18)),
    education: educationBits[0] || "Not clearly extracted",
    location: location || "Unknown",
    email: emails[0] || "",
    phone: phones[0] || "N/A",
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    aiInsights: insights,
  };
}
