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


def get_cold_email_prompt(target_name, target_role, target_company, purpose, tone, user_background):
    purpose_map = {
        'job_application': 'applying for a position at their company',
        'networking': 'building a genuine professional connection',
        'referral': 'asking them to refer you for an open role',
        'informational': 'requesting a short informational chat about their work',
    }
    tone_map = {
        'professional': 'polished and professional',
        'casual': 'warm, conversational, and approachable',
        'direct': 'extremely short, confident, and to the point',
    }
    return f"""You are an expert at writing cold emails that actually get responses from busy professionals.

TARGET:
Name: {target_name}
Role: {target_role}
Company: {target_company}

PURPOSE: {purpose_map.get(purpose, purpose)}

ABOUT THE SENDER:
{user_background[:800]}

TONE: {tone_map.get(tone, tone)}

STRICT RULES:
- Each email MUST be under 120 words — recruiters delete long emails instantly
- Sound like a real human wrote it, not an AI. No hollow phrases.
- Banned phrases: "I hope this finds you well", "I came across your profile", "I am reaching out", "I am writing to", "touch base", "synergy", "passionate about"
- Be specific about the company or their role — show you did your homework
- End with ONE clear, low-friction ask (15-min call, a quick reply, a referral)
- Each of the 3 variants must take a completely DIFFERENT angle

VARIANTS:
1. "Direct" — state exactly what you want in the first sentence, no warm-up
2. "Value-first" — open with something specific you bring that helps their team, then the ask
3. "Personal hook" — open with something specific about them, their company, or their work that shows genuine interest

Return ONLY valid JSON:
{{
  "variants": [
    {{"style": "Direct", "subject": "<subject under 60 chars>", "body": "<email body with natural line breaks>"}},
    {{"style": "Value-first", "subject": "<subject under 60 chars>", "body": "<email body with natural line breaks>"}},
    {{"style": "Personal hook", "subject": "<subject under 60 chars>", "body": "<email body with natural line breaks>"}}
  ],
  "tips": ["<one specific tip for sending this email>", "<one follow-up timing tip>"]
}}"""


def get_outreach_workspace_prompt(company, target_role, job_description, contact_name, contact_role, contact_channel, user_background, resume_highlights):
    contact = contact_name or "the best-fit recruiter, hiring manager, or employee"
    contact_title = contact_role or "relevant contact"
    channel = contact_channel or "email and LinkedIn"
    jd = job_description[:2500] if job_description else "No job description provided."
    highlights = resume_highlights[:1500] if resume_highlights else "No resume highlights provided."

    return f"""You are a senior career strategist helping a job seeker turn one target company into a practical outreach plan.

TARGET OPPORTUNITY:
Company: {company}
Target role: {target_role}
Job description:
{jd}

CONTACT:
Name: {contact}
Role: {contact_title}
Preferred channel: {channel}

CANDIDATE:
Background:
{user_background[:1800]}

Resume highlights or proof points:
{highlights}

Create a complete outreach workspace, not just one generic message.

STRICT RULES:
- Make every message specific to the company, role, and candidate background.
- Do not invent fake achievements, metrics, or relationships.
- Keep LinkedIn connection messages under 280 characters.
- Keep cold emails under 130 words.
- No hollow phrases like "I hope this finds you well", "I came across your profile", "touch base", or "synergy".
- Give practical next actions the user can track.
- If details are missing, use careful placeholders the user can edit.

Return ONLY valid JSON:
{{
  "positioning": {{
    "angle": "<one sentence positioning angle for this opportunity>",
    "proof_points": ["<proof point to mention>", "<proof point to mention>", "<proof point to mention>"],
    "gaps_to_fix": ["<gap or missing detail the user should improve before outreach>"]
  }},
  "messages": [
    {{"type": "Cold email", "label": "Direct recruiter email", "subject": "<subject under 60 chars>", "body": "<email body with natural line breaks>", "best_for": "<when to use this>"}},
    {{"type": "LinkedIn", "label": "Connection request", "subject": "", "body": "<under 280 chars>", "best_for": "<when to use this>"}},
    {{"type": "Referral", "label": "Employee referral ask", "subject": "<subject under 60 chars>", "body": "<message body>", "best_for": "<when to use this>"}},
    {{"type": "Follow-up", "label": "Follow-up after no reply", "subject": "<subject under 60 chars>", "body": "<message body>", "best_for": "<when to use this>"}},
    {{"type": "Thank-you", "label": "After a reply or call", "subject": "<subject under 60 chars>", "body": "<message body>", "best_for": "<when to use this>"}}
  ],
  "follow_up_plan": [
    {{"day": "Day 0", "action": "<what to do>", "channel": "<Email|LinkedIn|Both>"}},
    {{"day": "Day 3", "action": "<what to do>", "channel": "<Email|LinkedIn|Both>"}},
    {{"day": "Day 7", "action": "<what to do>", "channel": "<Email|LinkedIn|Both>"}}
  ],
  "tracker": {{
    "initial_status": "Drafted",
    "next_action": "<single next action>",
    "success_signal": "<what progress looks like>"
  }}
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
