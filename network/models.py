from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    pass


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    date = models.DateTimeField(auto_now=False, auto_now_add=True)
    favs = models.PositiveIntegerField(default=0)

    def serialize(self):
        return {
            "id": self.id,
            "poster": self.author.username,
            "content": self.content,
            "timestamp": self.date.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.favs
        }


class Member(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    following = models.ManyToManyField("self", symmetrical=False, related_name="followers")

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Member.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.member.save()


class Like(models.Model):
    like = models.BooleanField(default=False)
    to_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    by_user = models.ForeignKey(User, on_delete=models.CASCADE)