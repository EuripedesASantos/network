from django.contrib.auth.models import AbstractUser
from django.db import models

from django.db.models import Count

from django.utils import timezone


class User(AbstractUser):
    pass

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "follower_num": self.follower.count(),
            "followed_num": self.followed.count(),
            "followed": [follow.user.username for follow in self.followed.all()],
            "followed_id": {follow.user.username: follow.id for follow in self.followed.all()},
            "posts": [post.serialize() for post in Post.objects.filter(user=self).order_by('-create_date')]
        }

class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="publisher")
    text = models.TextField(blank=True)
    create_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.text

    def serialize(self):
        try:
            likes = Like.objects.values('post').annotate(total=Count('post')).get(post=self.id)['total']
        except:
            likes = 0
        try:
            user_likes = list(x.user.username for x in Like.objects.filter(post=self))
        except:
            user_likes = []
        return {
            "user": self.user.username,
            "text": self.text,
            "create_date": self.create_date,
            "id": self.id,
            "subscription": True,
            "user_id": self.user.id,
            "likes": likes,
            "user_likes": user_likes
        }
class Like(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="liker")
    post = models.ForeignKey("Post", on_delete=models.PROTECT, related_name="liked")

class Follow(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="follower")
    follow = models.ForeignKey("User", on_delete=models.PROTECT, related_name="followed")

    def serialize(self):
        return {
            "name": self.follow.username,
            "mail": self.follow.email,
            "id": self.id
        }