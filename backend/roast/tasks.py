import re
import json
import logging
from google import genai
from google.genai import types
from django.conf import settings

from .models import RoastSubmission
from .prompts import get_roast_prompt, get_fix_prompt

MODEL = 'gemini-2.5-flash'
logger = logging.getLogger(__name__)


def _client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def process_roast(submission_id: str):
    try:
        submission = RoastSubmission.objects.get(id=submission_id)
    except RoastSubmission.DoesNotExist:
        return

    submission.status = 'processing'
    submission.save(update_fields=['status'])

    try:
        content = _get_content(submission)
        client  = _client()

        roast_prompt = get_roast_prompt(submission.work_type, submission.intensity, content)
        roast_resp   = client.models.generate_content(
            model=MODEL,
            contents=roast_prompt,
            config=types.GenerateContentConfig(max_output_tokens=2048),
        )
        roast_text = roast_resp.text
        score      = _extract_score(roast_text)

        fix_prompt = get_fix_prompt(submission.work_type, content, roast_text)
        fix_resp   = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Content(role='user',  parts=[types.Part(text=roast_prompt)]),
                types.Content(role='model', parts=[types.Part(text=roast_text)]),
                types.Content(role='user',  parts=[types.Part(text=fix_prompt)]),
            ],
            config=types.GenerateContentConfig(max_output_tokens=2048),
        )
        fix_text = fix_resp.text

        fixed_resume_data = None
        fixed_code        = None

        if submission.work_type == 'resume':
            from resume.prompt import get_resume_fix_prompt
            resume_resp = client.models.generate_content(
                model=MODEL,
                contents=get_resume_fix_prompt(content, fix_text),
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    max_output_tokens=8192,
                ),
            )
            try:
                fixed_resume_data = json.loads(resume_resp.text)
            except Exception:
                fixed_resume_data = None

        elif submission.work_type == 'code':
            from resume.prompt import get_code_fix_prompt
            code_resp = client.models.generate_content(
                model=MODEL,
                contents=get_code_fix_prompt(content, fix_text),
                config=types.GenerateContentConfig(max_output_tokens=4096),
            )
            fixed_code = code_resp.text

        submission.roast_output      = roast_text
        submission.fix_output        = fix_text
        submission.score             = score
        submission.fixed_resume_data = fixed_resume_data
        submission.fixed_code        = fixed_code
        submission.status            = 'completed'
        submission.save(update_fields=[
            'roast_output', 'fix_output', 'score',
            'fixed_resume_data', 'fixed_code',
            'status', 'updated_at',
        ])

    except Exception as exc:
        logger.error('process_roast failed: %r', exc)
        try:
            submission.status = 'failed'
            submission.save(update_fields=['status', 'updated_at'])
        except Exception:
            pass


def _get_content(submission: RoastSubmission) -> str:
    if submission.input_text:
        return submission.input_text
    if submission.file:
        path = submission.file.path
        try:
            if path.lower().endswith('.pdf'):
                from pypdf import PdfReader
                reader = PdfReader(path)
                return '\n'.join(page.extract_text() or '' for page in reader.pages)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return ''
    return ''


def _extract_score(roast_text: str) -> int | None:
    patterns = [
        r'SCORE:\s*(\d+)/100',
        r'(\d+)\s*/\s*100',
        r'(\d+)\s+out\s+of\s+100',
        r'score[:\s]+(\d+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, roast_text, re.IGNORECASE)
        if match:
            val = int(match.group(1))
            if 0 <= val <= 100:
                return val
    return None
