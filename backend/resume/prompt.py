RESUME_SCHEMA = """{
  "personal": {
    "name": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "",
  "experience": [
    {
      "role": "",
      "company": "",
      "location": "",
      "start": "",
      "end": "",
      "bullets": ["", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "year": "",
      "gpa": "",
      "honors": ""
    }
  ],
  "skills": {
    "technical": [],
    "tools": [],
    "soft": []
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "tech": [],
      "link": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "year": ""
    }
  ]
}"""


def get_resume_fix_prompt(original_content: str, fix_report: str) -> str:
    """Used by the roast task to generate an improved resume from the uploaded file + AI fix report."""
    return f"""You are an expert resume writer. Your job is to extract every piece of information from the resume below and output it as structured JSON — with only the language and phrasing improved. You are NOT rewriting the resume from scratch.

CRITICAL — DATA PRESERVATION RULES (violating these is a failure):
1. Copy every company name, job title, start/end date, school, degree, GPA, and certification EXACTLY as written — do not paraphrase, reorder, or drop any of them
2. Include EVERY job role in the experience array — if the resume has 5 jobs, the JSON must have 5 jobs
3. Include EVERY education entry — do not drop any school or degree
4. Include EVERY certification — do not drop any
5. Include EVERY project — do not drop any
6. Copy contact info (name, email, phone, location, linkedin, github) exactly as written — leave fields empty string only if truly absent
7. Skills: copy only skills explicitly listed — do NOT add skills not in the original

ONLY these improvements are allowed:
- Rewrite weak bullet points to start with a strong action verb (Led, Built, Drove, Reduced, etc.) — but keep the same underlying achievement and numbers
- If a bullet says "Responsible for X", rewrite as "Managed/Led/Delivered X"
- If metrics exist (%, $, numbers), keep them — do not drop or change them
- Write a 2–3 sentence professional summary if one is missing or weak
- Separate skills into technical / tools / soft categories

The identified issues to fix (use as guidance for bullet rewrites only):
---
{fix_report[:2000]}
---

Return ONLY a valid JSON object matching this schema. No markdown fences, no explanation, just raw JSON:
{RESUME_SCHEMA}

FULL resume content to extract and improve:
---
{original_content[:10000]}
---"""


def get_code_fix_prompt(original_code: str, fix_report: str) -> str:
    """Used by the roast task to generate fixed code from the uploaded file + AI fix report."""
    return f"""You are a senior software engineer performing a code review.

The following code was reviewed and these issues were identified:
---
{fix_report[:2000]}
---

Your task: Rewrite the code applying ALL the suggested fixes. Improve naming, error handling, structure, and any other issues mentioned.

Rules:
- Keep the same programming language and file structure
- Apply every fix mentioned in the report
- Do NOT add features that weren't requested
- Add brief inline comments only where the fix is non-obvious
- Return ONLY the fixed code — no explanation, no markdown fences, just the raw code

Original code:
---
{original_code[:6000]}
---

Fixed code:"""


def get_resume_update_prompt(content: str) -> str:
    """Used by the ResumeUpdater task to analyze and improve an uploaded resume."""
    return f"""You are an expert resume writer and ATS specialist with 20 years of experience.

Your task: Analyze the resume below, identify every weakness, and produce an improved version as JSON.

CRITICAL — DATA PRESERVATION RULES (violating any of these is a failure):
1. Copy every company name, job title, start/end date, school, degree, GPA, and certification EXACTLY as written
2. Include EVERY job role in the experience array — if the resume has 5 jobs, the JSON must have 5 jobs
3. Include EVERY education entry — do not drop any school or degree
4. Include EVERY project — do not drop any
5. Copy contact info (name, email, phone, location, linkedin, github) exactly as written
6. Skills: copy only skills explicitly listed — do NOT add skills not in the original

IMPROVEMENTS you must apply:
- Rewrite weak bullet points to start with a strong action verb (Led, Built, Drove, Reduced, Launched, Managed, etc.)
- Replace "Responsible for X" → "Managed/Led/Delivered X"
- Keep all metrics (%, $, numbers) — do not drop or change them
- Write a compelling 2–3 sentence professional summary if one is missing or weak
- Separate skills into: technical (languages/frameworks), tools (software/platforms/cloud), soft (leadership/communication)
- Make all language crisp, specific, and ATS-friendly

Also produce a short "issues" summary (2–4 sentences) describing what problems you found and what you fixed.
Put this summary in a field called "issues_summary" at the TOP LEVEL of the JSON (outside the resume schema).

Return ONLY a valid JSON object with TWO top-level keys:
1. "issues_summary": a short string describing what was improved
2. "resume": the full improved resume matching this schema exactly:
{RESUME_SCHEMA}

No markdown fences, no explanation — just raw JSON.

RESUME TO IMPROVE:
---
{content[:10000]}
---"""


def get_resume_prompt(raw_input: str, target_role: str) -> str:
    role_text = target_role or "the user's professional field"
    return f"""You are an expert resume writer and career coach with 20 years of experience placing candidates at top companies.

Your task: Transform the raw information below into a polished, ATS-optimized professional resume as a JSON object.

Rules:
1. Write a compelling 2-3 sentence professional summary targeting: {role_text}
2. Convert informal descriptions into strong bullet points — always start with a power action verb (Led, Built, Designed, Increased, Reduced, Launched, Managed, etc.)
3. Quantify achievements wherever possible — even approximate figures help ("improved load time by ~40%", "managed team of 5")
4. If bullets per role are sparse, intelligently expand to 3-5 strong bullets based on the role and company context
5. Only include skills the user explicitly mentioned — do NOT invent or infer skills they did not state
6. Separate the user's stated skills into: technical (languages, frameworks), tools (software, platforms, cloud), soft skills (leadership, communication, etc.)
7. For current roles with no end date, use "Present"
8. If contact info is partially missing, leave those fields as empty string — do not invent emails or phones
9. Omit sections entirely if no data exists for them (use empty array [])
10. Optimize language and keywords for: {role_text}

Return ONLY a valid JSON object matching this exact schema. No markdown fences, no explanation, just the raw JSON:
{RESUME_SCHEMA}

User Information:
---
{raw_input[:6000]}
---"""
