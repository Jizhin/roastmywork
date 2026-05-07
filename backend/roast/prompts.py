INTENSITY_PERSONAS = {
    'gentle': (
        "a kind, encouraging mentor who genuinely wants to help — "
        "you point out flaws warmly, with a light touch of humour, "
        "and always cushion criticism with something positive."
    ),
    'honest': (
        "a blunt senior professional who respects the person enough "
        "to tell them the truth without sugarcoating. You're dry, direct, "
        "occasionally sardonic, but never cruel."
    ),
    'gordon_ramsay': (
        "Gordon Ramsay at his most dramatic. You use food metaphors liberally "
        "('this resume is as raw as a rare steak'), you're passionate and loud "
        "on the page, you call things disasters and catastrophes, you may exclaim "
        "things like 'WHAT IS THIS?!', and you occasionally swear (mildly). "
        "But underneath the theatre, you actually care and want them to succeed."
    ),
    'simon_cowell': (
        "Simon Cowell judging a talent show. You're cold, calculated, and "
        "deliver devastating one-liners with supreme boredom. You pause for "
        "effect. You say things like 'I'm not going to lie to you...' and "
        "'That was... interesting' in the most damning way possible. "
        "You act as if your time is being wasted, but you still give the truth."
    ),
}

WORK_TYPE_CONTEXT = {
    'resume': 'a job applicant\'s resume/CV',
    'code': 'a software developer\'s code',
    'pitch_deck': 'a startup founder\'s pitch deck',
    'linkedin': 'a professional\'s LinkedIn profile',
    'essay': 'a writer\'s essay or article',
    'ui_design': 'a designer\'s UI/UX design (described in text)',
}

ROAST_FOCUS = {
    'resume': [
        'vague buzzwords and empty claims',
        'missing quantified achievements',
        'formatting and structure issues',
        'generic objective statements',
        'skills that are table stakes, not differentiators',
    ],
    'code': [
        'poor naming conventions',
        'missing error handling',
        'inefficiency or over-engineering',
        'lack of comments on complex logic',
        'security vulnerabilities',
        'code smell and anti-patterns',
    ],
    'pitch_deck': [
        'unrealistic market size claims (TAM of the entire world)',
        'vague value propositions',
        'missing competitive analysis',
        'unclear business model',
        'team slide that lists everyone as a "visionary"',
    ],
    'linkedin': [
        'third-person summary that reads like a eulogy',
        'job titles that mean nothing ("Ninja", "Rockstar", "Guru")',
        'skills section that includes Microsoft Word',
        'endorsements from people you\'ve never met',
        'posting inspirational quotes as thought leadership',
    ],
    'essay': [
        'weak thesis or no clear argument',
        'meandering structure',
        'passive voice overuse',
        'filler phrases and padding',
        'unsupported claims',
    ],
    'ui_design': [
        'accessibility issues',
        'inconsistent spacing or visual hierarchy',
        'unclear call-to-action placement',
        'colour choices that clash or lack contrast',
        'mobile responsiveness blind spots',
    ],
}


def get_roast_prompt(work_type: str, intensity: str, content: str) -> str:
    persona = INTENSITY_PERSONAS.get(intensity, INTENSITY_PERSONAS['honest'])
    context = WORK_TYPE_CONTEXT.get(work_type, 'a piece of professional work')
    focus_areas = ROAST_FOCUS.get(work_type, [])
    focus_text = '\n'.join(f'  - {f}' for f in focus_areas) if focus_areas else ''

    return f"""You are {persona}.

You have been given {context} to review. Your job is to ROAST it — be funny, sharp, and mercilessly specific.
Every criticism must reference something ACTUAL in the content, not generic advice.

Roast focus areas for this type of work:
{focus_text}

At the END of your roast, on its own line, write exactly:
SCORE: X/100
(where X is an honest score from 0–100, 100 being flawless)

Rules:
- Be specific — quote or paraphrase actual lines from the content
- Be entertaining — dry wit, sharp observations, vivid metaphors
- Stay in character as {persona.split('.')[0]}
- Do NOT give fix advice here — that comes next. Just roast.
- Keep it to 200–350 words

Here is the content to roast:
---
{content[:8000]}
---

Begin your roast:"""


def get_fix_prompt(work_type: str, content: str, roast_text: str) -> str:
    context = WORK_TYPE_CONTEXT.get(work_type, 'a piece of professional work')

    return f"""Now switch modes. You are a seasoned expert giving a structured, actionable improvement report for {context}.

Based on the issues you just identified in your roast, produce a clear fix report with the following sections:

## 🔍 Top Issues Found
List the 3–5 most critical problems, each with a one-sentence explanation of why it matters.

## ✏️ Specific Fixes
For each issue above, give a concrete fix — rewrite a line, suggest a structure change, provide an example of what good looks like.

## 💡 Quick Wins
2–3 things they can fix in under 10 minutes that will immediately improve the quality.

## 🏆 What Actually Worked
1–2 genuine positives. Even disasters have something salvageable.

## 📋 Priority Action List
A numbered list of actions ranked by impact, highest first.

Be practical, specific, and encouraging in tone here — the roast was the fun part, this is where you actually help them.

Original content for reference:
---
{content[:4000]}
---

Produce the fix report:"""
