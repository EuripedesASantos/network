
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("unfollow", views.unfollow, name="unfollow"),
    path("follows", views.follows, name="follows"),
    path("following", views.following, name="following"),
    path("posts", views.posts, name="posts"),
    path("post", views.post, name="post"),
    path("like", views.like, name="like"),
    path("profile", views.profile, name="profile")
]
