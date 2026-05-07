import json
import re
from google import genai
from google.genai import types
from celery import shared_task
from django.conf import settings

from .models import JDMatch, InterviewSession, LinkedInDM, LinkedInOptimize, SalaryAnalysis
from .prompts import (
    get_jd_match_prompt, get_interview_questions_prompt, get_interview_evaluation_prompt,
    get_linkedin_dm_prompt, get_linkedin_optimize_prompt, get_salary_prompt,
)

MODEL = 'gemini-2.5-flash'


def _client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _extract_json(text):
    """Strip markdown fences if present, then parse JSON."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` wrappers
    fenced = re.match(r'^```(?:json)?\s*([\s\S]*?)\s*```$', text)
    if fenced:
        text = fenced.group(1).strip()
    return json.loads(text)


def _json_call(client, prompt, max_tokens=8192):
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            max_output_tokens=max_tokens,
        ),
    )
    return _extract_json(response.text)


def _retry_delay(retries):
    """Exponential backoff: 5s, 15s, 45s."""
    return min(60, 5 * (3 ** retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_jd_match(self, obj_id):
    try:
        obj = JDMatch.objects.get(id=obj_id)
    except JDMatch.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        result = _json_call(_client(), get_jd_match_prompt(obj.resume_text, obj.jd_text), max_tokens=4096)
        obj.result = result
        obj.status = 'completed'
        obj.save(update_fields=['result', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_interview_questions(self, obj_id):
    try:
        obj = InterviewSession.objects.get(id=obj_id)
    except InterviewSession.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        data = _json_call(
            _client(),
            get_interview_questions_prompt(obj.role, obj.company_type, obj.round_type),
            max_tokens=4096,
        )
        obj.questions = data.get('questions', [])
        obj.status = 'completed'
        obj.save(update_fields=['questions', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_interview_evaluation(self, obj_id):
    try:
        obj = InterviewSession.objects.get(id=obj_id)
    except InterviewSession.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        result = _json_call(
            _client(),
            get_interview_evaluation_prompt(obj.role, obj.company_type, obj.round_type, obj.questions, obj.answers),
            max_tokens=8192,
        )
        obj.result = result
        obj.status = 'completed'
        obj.save(update_fields=['result', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_linkedin_dm(self, obj_id):
    try:
        obj = LinkedInDM.objects.get(id=obj_id)
    except LinkedInDM.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        result = _json_call(_client(), get_linkedin_dm_prompt(obj.target_info, obj.purpose, obj.user_background), max_tokens=4096)
        obj.result = result
        obj.status = 'completed'
        obj.save(update_fields=['result', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_linkedin_optimize(self, obj_id):
    try:
        obj = LinkedInOptimize.objects.get(id=obj_id)
    except LinkedInOptimize.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        result = _json_call(_client(), get_linkedin_optimize_prompt(obj.current_profile, obj.target_role), max_tokens=8192)
        obj.result = result
        obj.status = 'completed'
        obj.save(update_fields=['result', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_salary_analysis(self, obj_id):
    try:
        obj = SalaryAnalysis.objects.get(id=obj_id)
    except SalaryAnalysis.DoesNotExist:
        return
    obj.status = 'processing'
    obj.save(update_fields=['status'])
    try:
        result = _json_call(_client(), get_salary_prompt(obj.offer_details, obj.experience_info, obj.situation), max_tokens=4096)
        obj.result = result
        obj.status = 'completed'
        obj.save(update_fields=['result', 'status'])
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            obj.status = 'failed'
            obj.save(update_fields=['status'])
            return
        raise self.retry(exc=exc, countdown=_retry_delay(self.request.retries))
