# Generated by Django 4.2.9 on 2024-04-11 23:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0004_post_favs'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]