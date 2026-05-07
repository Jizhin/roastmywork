from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('roast', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='roastsubmission',
            name='fixed_resume_data',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='roastsubmission',
            name='fixed_code',
            field=models.TextField(blank=True, null=True),
        ),
    ]
