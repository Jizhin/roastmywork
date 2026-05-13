import threading
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import F

from users.models import UserProfile
from .models import JDMatch, InterviewSession, LinkedInDM, LinkedInOptimize, SalaryAnalysis
from .tasks import (
    run_jd_match, run_interview_questions, run_interview_evaluation,
    run_linkedin_dm, run_linkedin_optimize, run_salary_analysis,
    _client, _json_call,
)
from .prompts import get_cold_email_prompt, get_outreach_workspace_prompt


def _dispatch(fn, obj_id):
    threading.Thread(target=fn, args=(str(obj_id),), daemon=True).start()


def _check_and_deduct(user, amount=1):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile.is_pro:
        return True, profile
    if profile.roast_credits < amount:
        return False, profile
    UserProfile.objects.filter(user=user).update(roast_credits=F('roast_credits') - amount)
    return True, profile


# ── JD Match ──────────────────────────────────────────────────────────────────

class JDMatchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        resume_text = request.data.get('resume_text', '').strip()
        jd_text     = request.data.get('jd_text', '').strip()
        if not resume_text or not jd_text:
            return Response({'detail': 'Both resume and job description are required.'}, status=400)
        ok, profile = _check_and_deduct(request.user)
        if not ok:
            return Response({'detail': 'No credits left.', 'code': 'no_credits'}, status=402)
        obj = JDMatch.objects.create(user=request.user, resume_text=resume_text, jd_text=jd_text)
        _dispatch(run_jd_match, obj.id)
        return Response({'id': str(obj.id), 'status': obj.status}, status=202)


class JDMatchDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(JDMatch, pk=pk, user=request.user)
        return Response({'id': str(obj.id), 'status': obj.status, 'result': obj.result})


# ── Interview ─────────────────────────────────────────────────────────────────

class InterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        role         = request.data.get('role', '').strip()
        company_type = request.data.get('company_type', 'Tech').strip()
        round_type   = request.data.get('round_type', 'Behavioral').strip()
        if not role:
            return Response({'detail': 'Role is required.'}, status=400)
        ok, profile = _check_and_deduct(request.user, 2)
        if not ok:
            return Response({'detail': 'No credits left.', 'code': 'no_credits'}, status=402)
        obj = InterviewSession.objects.create(
            user=request.user, role=role, company_type=company_type, round_type=round_type,
        )
        _dispatch(run_interview_questions, obj.id)
        return Response({'id': str(obj.id), 'status': obj.status}, status=202)


class InterviewDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        return Response({
            'id': str(obj.id), 'status': obj.status,
            'questions': obj.questions, 'result': obj.result,
        })

    def post(self, request, pk):
        obj = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        answers = request.data.get('answers', [])
        if not answers or len(answers) != len(obj.questions or []):
            return Response({'detail': 'Answer count must match question count.'}, status=400)
        obj.answers = answers
        obj.status  = 'pending'
        obj.result  = None
        obj.save(update_fields=['answers', 'status', 'result'])
        _dispatch(run_interview_evaluation, obj.id)
        return Response({'id': str(obj.id), 'status': 'pending'})


# ── LinkedIn DM ───────────────────────────────────────────────────────────────

class LinkedInDMView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_info     = request.data.get('target_info', '').strip()
        purpose         = request.data.get('purpose', '').strip()
        user_background = request.data.get('user_background', '').strip()
        if not all([target_info, purpose, user_background]):
            return Response({'detail': 'All fields are required.'}, status=400)
        ok, profile = _check_and_deduct(request.user)
        if not ok:
            return Response({'detail': 'No credits left.', 'code': 'no_credits'}, status=402)
        obj = LinkedInDM.objects.create(
            user=request.user, target_info=target_info,
            purpose=purpose, user_background=user_background,
        )
        _dispatch(run_linkedin_dm, obj.id)
        return Response({'id': str(obj.id), 'status': obj.status}, status=202)


class LinkedInDMDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(LinkedInDM, pk=pk, user=request.user)
        return Response({'id': str(obj.id), 'status': obj.status, 'result': obj.result})


# ── LinkedIn Optimize ─────────────────────────────────────────────────────────

class LinkedInOptimizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_profile = request.data.get('current_profile', '').strip()
        target_role     = request.data.get('target_role', '').strip()
        if not current_profile:
            return Response({'detail': 'Profile content is required.'}, status=400)
        ok, profile = _check_and_deduct(request.user, 2)
        if not ok:
            return Response({'detail': 'No credits left.', 'code': 'no_credits'}, status=402)
        obj = LinkedInOptimize.objects.create(
            user=request.user, current_profile=current_profile, target_role=target_role,
        )
        _dispatch(run_linkedin_optimize, obj.id)
        return Response({'id': str(obj.id), 'status': obj.status}, status=202)


class LinkedInOptimizeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(LinkedInOptimize, pk=pk, user=request.user)
        return Response({'id': str(obj.id), 'status': obj.status, 'result': obj.result})


# ── Salary ────────────────────────────────────────────────────────────────────

class SalaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        offer_details   = request.data.get('offer_details', '').strip()
        experience_info = request.data.get('experience_info', '').strip()
        situation       = request.data.get('situation', '').strip()
        if not offer_details:
            return Response({'detail': 'Offer details are required.'}, status=400)
        ok, profile = _check_and_deduct(request.user)
        if not ok:
            return Response({'detail': 'No credits left.', 'code': 'no_credits'}, status=402)
        obj = SalaryAnalysis.objects.create(
            user=request.user, offer_details=offer_details,
            experience_info=experience_info, situation=situation,
        )
        _dispatch(run_salary_analysis, obj.id)
        return Response({'id': str(obj.id), 'status': obj.status}, status=202)


class SalaryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(SalaryAnalysis, pk=pk, user=request.user)
        return Response({'id': str(obj.id), 'status': obj.status, 'result': obj.result})


# ── Cold Email ────────────────────────────────────────────────────────────────

class GenerateColdEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_name     = request.data.get('target_name', '').strip()
        target_role     = request.data.get('target_role', '').strip()
        target_company  = request.data.get('target_company', '').strip()
        purpose         = request.data.get('purpose', 'job_application')
        tone            = request.data.get('tone', 'professional')
        user_background = request.data.get('user_background', '').strip()

        if not all([target_name, target_role, target_company, user_background]):
            return Response({'detail': 'Name, role, company, and your background are required.'}, status=400)

        prompt = get_cold_email_prompt(target_name, target_role, target_company, purpose, tone, user_background)
        try:
            result = _json_call(_client(), prompt)
        except Exception:
            return Response({'detail': 'Generation failed. Please try again.'}, status=500)

        return Response(result)


class ColdEmailDeductView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ok, _ = _check_and_deduct(request.user)
        if not ok:
            return Response({'detail': 'No credits remaining.', 'code': 'no_credits'}, status=402)
        return Response({'ok': True})


# ── General Chat ─────────────────────────────────────────────────────────────

class GeneralChatView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])[:6]
        if not message:
            return Response({'detail': 'Message required.'}, status=400)

        history_text = ''
        for h in history:
            role = h.get('role', '')
            content = str(h.get('content', ''))[:500]
            if role in ('user', 'assistant') and content:
                history_text += f'\n{role.upper()}: {content}'

        prompt = f"""You are a friendly, concise career assistant for RoastMyWork, an AI career tools platform.
Help job seekers with resumes, job applications, interview prep, LinkedIn, salary negotiation, and career advice.
Be conversational and give specific actionable advice in 2-4 sentences.

Available tools to suggest (only when clearly relevant):
- build_resume: Build a professional resume from scratch
- fix_resume: Improve an existing resume
- roast: Honest scored critique of resume, code, or LinkedIn
- jd_match: Score resume against a job description
- interview: Practice interview questions with scoring
- outreach: Create job application messages and strategy
- linkedin_dm: Write personalized LinkedIn outreach messages
- linkedin_opt: Optimize LinkedIn headline and About section
- salary: Salary negotiation with market benchmarks
{f'Prior conversation:{history_text}' if history_text else ''}
User: {message[:2000]}

Respond ONLY in valid JSON:
{{
  "reply": "<your helpful response, 2-4 sentences>",
  "suggestions": [
    {{"key": "<tool_key>", "label": "<action label, 3-5 words>"}}
  ]
}}
Include 0-3 suggestions only when a specific tool is genuinely useful. Empty array for general conversation."""

        try:
            result = _json_call(_client(), prompt, max_tokens=512)
            return Response({
                'reply': str(result.get('reply', 'How can I help with your career?'))[:1000],
                'suggestions': [
                    {'key': s['key'], 'label': s['label']}
                    for s in (result.get('suggestions') or [])[:3]
                    if isinstance(s, dict) and s.get('key') and s.get('label')
                ],
            })
        except Exception:
            return Response({
                'reply': "I'm here to help with your career. What are you working on?",
                'suggestions': [],
            })


# ── Outreach Workspace ────────────────────────────────────────────────────────

class OutreachWorkspaceGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        company          = request.data.get('company', '').strip()
        target_role      = request.data.get('target_role', '').strip()
        job_description  = request.data.get('job_description', '').strip()
        contact_name     = request.data.get('contact_name', '').strip()
        contact_role     = request.data.get('contact_role', '').strip()
        contact_channel  = request.data.get('contact_channel', '').strip()
        user_background  = request.data.get('user_background', '').strip()
        resume_highlights = request.data.get('resume_highlights', '').strip()
        raw_context      = request.data.get('raw_context', '').strip()

        if not raw_context and not all([company, target_role, user_background]):
            return Response({'detail': 'Paste context, or fill company, target role, and your background.'}, status=400)
        if raw_context and len(''.join(ch for ch in raw_context if ch.isalnum())) < 30 and not all([company, target_role, user_background]):
            return Response({'detail': 'Please paste a job post, company/contact details, or your background first.'}, status=400)

        ok, _ = _check_and_deduct(request.user)
        if not ok:
            return Response({'detail': 'No credits remaining.', 'code': 'no_credits'}, status=402)

        prompt = get_outreach_workspace_prompt(
            company or 'Infer from raw paste',
            target_role or 'Infer from raw paste',
            job_description,
            contact_name,
            contact_role,
            contact_channel,
            user_background or raw_context,
            resume_highlights,
            raw_context,
        )
        try:
            result = _json_call(_client(), prompt)
        except Exception:
            return Response({'detail': 'Generation failed. Please try again.'}, status=500)

        return Response(result)
