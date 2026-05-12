import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'roastmywork.settings')

app = Celery('roastmywork')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Alias retained for compatibility with Celery app auto-discovery.
celery = app


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
