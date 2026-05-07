import json
from google import genai
from google.genai import types
from celery import shared_task
from django.conf import settings

from .models import ResumeSubmission, ResumeUpdate
from .prompt import get_resume_prompt, get_resume_fix_prompt

MODEL = 'gemini-2.5-flash'


def _client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _retry_delay(retries):
    return min(60, 5 * (3 ** retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def generate_resume(self, submission_id: str):
    try:
        submission = ResumeSubmission.objects.get(id=submission_id)
    except ResumeSubmission.DoesNotExist:
        return

    submission.status = 'processing'
    submission.save(update_fields=['status'])

    try:
        client = _client()
        prompt = get_resume_prompt(submission.raw_input, submission.target_role)

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                max_output_tokens=8192,
            ),
        )

        resume_data = json.loads(response.text)

        submission.resume_data = resume_data
        submission.status      = 'completed'
        submission.save(update_fields=['resume_data', 'status'])

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            submission.status = 'failed'
            submission.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def update_resume(self, update_id: str):
    try:
        update = ResumeUpdate.objects.get(id=update_id)
    except ResumeUpdate.DoesNotExist:
        return

    update.status = 'processing'
    update.save(update_fields=['status'])

    try:
        content = _extract_update_content(update)
        if not content.strip():
            update.status = 'failed'
            update.save(update_fields=['status'])
            return

        update.original_text = content[:10000]
        update.save(update_fields=['original_text'])

        client = _client()

        # Step 1 — identify issues (short plain-text analysis)
        issues_prompt = (
            "You are an expert resume reviewer. Analyze the resume below and identify "
            "the 3-5 most critical issues affecting ATS optimization and professional impact. "
            "Be specific. Write 2-3 concise sentences.\n\n"
            f"RESUME:\n{content[:5000]}"
        )
        issues_resp = client.models.generate_content(
            model=MODEL,
            contents=issues_prompt,
            config=types.GenerateContentConfig(max_output_tokens=400),
        )
        issues_text = issues_resp.text.strip()

        # Step 2 — generate improved JSON using the proven fix prompt
        fix_prompt = get_resume_fix_prompt(content, issues_text)
        resume_resp = client.models.generate_content(
            model=MODEL,
            contents=fix_prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                max_output_tokens=8192,
            ),
        )
        resume_data = json.loads(resume_resp.text)

        update.resume_data = resume_data
        update.issues      = issues_text
        update.status      = 'completed'
        update.save(update_fields=['resume_data', 'issues', 'status'])

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            update.status = 'failed'
            update.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


def _extract_update_content(update: ResumeUpdate) -> str:
    if update.file:
        path = update.file.path
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
