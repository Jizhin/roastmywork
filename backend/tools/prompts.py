def get_jd_match_prompt(resume, jd):
    return f"""You are an ATS system and senior recruiter. Analyze how well this resume matches the job description.

RESUME:
{resume[:4000]}

JOB DESCRIPTION:
{jd[:3000]}

Return ONLY valid JSON:
{{
  "score": <integer 0-100>,
  "verdict": "<one of: strong_match|good_match|partial_match|weak_match>",
  "summary": "<2-3 sentence honest assessment>",
  "matching_keywords": ["<keyword>"],
  "missing_keywords": ["<keyword>"],
  "skill_gaps": ["<specific gap>"],
  "improvements": [
    {{"section": "<section name>", "suggestion": "<concrete actionable change>"}}
  ]
}}"""


def get_interview_questions_prompt(role, company_type, round_type):
    return f"""You are a senior interviewer at a {company_type} company hiring for {role}. Generate exactly 5 realistic, specific interview questions for a {round_type} round. Questions should be challenging and role-specific, not generic.

Return ONLY valid JSON:
{{
  "questions": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"]
}}"""


def get_interview_evaluation_prompt(role, company_type, round_type, questions, answers):
    qa = "\n\n".join(
        f"Q{i+1}: {q}\nAnswer: {a or '(no answer provided)'}"
        for i, (q, a) in enumerate(zip(questions, answers))
    )
    return f"""You are evaluating a {role} candidate in a {round_type} interview at a {company_type} company.

{qa}

Score each answer honestly. Be specific about what was good and what was missing.

Return ONLY valid JSON:
{{
  "overall_score": <integer 0-100>,
  "hiring_recommendation": "<one of: Strong Hire|Hire|Maybe|No Hire>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength>"],
  "areas_to_improve": ["<area>"],
  "per_question": [
    {{
      "score": <integer 0-10>,
      "what_was_good": "<specific praise>",
      "what_was_missing": "<specific gap>",
      "ideal_answer_points": ["<key point>"]
    }}
  ]
}}"""


def get_linkedin_dm_prompt(target_info, purpose, background):
    return f"""You are a career coach expert at LinkedIn networking. Write 3 distinct, personalized LinkedIn DMs.

Target: {target_info}
Purpose: {purpose}
Sender: {background}

Rules:
- Each under 300 characters (connection request limit)
- Personalized to the target, not generic
- Professional but conversational
- No "I hope this message finds you well" or similar clichés
- Each variant has a distinctly different angle

Return ONLY valid JSON:
{{
  "variants": [
    {{"style": "Direct ask", "message": "<message>"}},
    {{"style": "Value lead", "message": "<message>"}},
    {{"style": "Curiosity hook", "message": "<message>"}}
  ],
  "subject_line": "<subject line for InMail version>",
  "tips": ["<tip>", "<tip>"]
}}"""


def get_linkedin_optimize_prompt(profile, target_role):
    target = f"targeting: {target_role}" if target_role.strip() else "keeping current career direction"
    return f"""You are a LinkedIn optimization expert. Rewrite this profile for maximum recruiter visibility, {target}.

CURRENT PROFILE:
{profile[:4000]}

Return ONLY valid JSON:
{{
  "headline": "<optimized headline under 220 chars>",
  "about": "<optimized About section, 250-350 words, first person, starts with a hook, ends with CTA>",
  "top_keywords": ["<keyword>"],
  "score_before": <integer 0-100>,
  "score_after": <integer 0-100>,
  "improvements": [
    {{"section": "<LinkedIn section>", "tip": "<specific actionable improvement>"}}
  ]
}}"""


def get_salary_prompt(offer, experience, situation):
    return f"""You are a compensation expert and negotiation coach.

Offer: {offer}
Candidate: {experience}
Situation: {situation}

Provide data-driven advice. Give specific numbers. Be honest if the offer is above market.

Return ONLY valid JSON:
{{
  "offer_amount": <number extracted from offer, null if unclear>,
  "currency": "<USD|INR|GBP|EUR|etc>",
  "market_range": {{"low": <number>, "mid": <number>, "high": <number>}},
  "verdict": "<one of: Below Market|At Market|Above Market>",
  "recommended_counter": <number>,
  "negotiation_script": "<exact words to say on the call, 3-4 sentences>",
  "talking_points": ["<point>"],
  "benefits_to_negotiate": ["<benefit if salary is firm>"],
  "red_flags": ["<flag>"],
  "advice": "<2-3 sentences of honest strategic advice>"
}}"""
