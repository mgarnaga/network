# Generated by Django 4.2.9 on 2024-04-21 16:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0007_remove_like_like'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='like',
            unique_together={('to_post', 'by_user')},
        ),
    ]
