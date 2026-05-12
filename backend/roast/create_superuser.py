import os
from django.contrib.auth import get_user_model

User = get_user_model()

USERNAME = os.getenv("DJANGO_SUPERUSER_USERNAME")
EMAIL = os.getenv("DJANGO_SUPERUSER_EMAIL")
PASSWORD = os.getenv("DJANGO_SUPERUSER_PASSWORD")

try:
    if USERNAME and PASSWORD:
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username=USERNAME,
                email=EMAIL,
                password=PASSWORD
            )
            print("Superuser created")
except Exception as e:
    print(f"Skipped superuser creation: {e}")