import datetime

from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required

from .models import User, Post, Follow, Like

import json

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s")


def make_and_log_errors(message: str, status = 404):

    logging.error(message)
    return JsonResponse({"error": message}, status=status)



def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_protect
@login_required
def follows(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        if data.get("user_id") is None:
            return make_and_log_errors(f"Request to follow user has no id of user.")

        user_id = data["user_id"]
        if user_id == '':
            return make_and_log_errors(f"Request to follow user has empty id of user.")

        # Confirm if user is followed
        try:
            logging.info('request.user.follower.get(follow_id=user_id)' + str(user_id))
            followed = request.user.follower.get(follow_id=user_id)
            logging.info('followed')
            logging.info(followed)
        except Exception as e:
            logging.error(f"Error getting user id={user_id} followed by {request.user.username}: {e}")
            # Attempt to create new follow
            try:
                followed = User.objects.get(id=user_id)
            except Exception as e:
                return make_and_log_errors(
                    f"Error getting info from user id={user_id} for be followed by {request.user.username} ({e})")

            logging.info(f"Creating User {request.user.username} with follower {followed.username}")
            try:
                follow = Follow(user=request.user, follow=followed)
                follow.save()
            except Exception as e:
                return make_and_log_errors(
                    f"Error creatting user {request.user.username} following {followed.username} ({e})")
            else:
                return JsonResponse(
                    follow.serialize(),
                    safe=False,
                    status=200)
        else:
            return make_and_log_errors(f"User {request.user} has follows on user id = {user_id}.", 403)

    # Get list of followed users
    try:
        follows = request.user.follower.all()
    except follows.DoesNotExist:
        return make_and_log_errors(f"No followed by user {request.user.username} found.")

    # Return list of followed users
    return JsonResponse([follow.serialize() for follow in follows], safe=False, status=200)


def posts(request):
    # Get all posts or only posts from followed users

    if request.method == "GET":
        posts = Post.objects.all().order_by('-create_date')

        if request.user.is_authenticated:
            response = []
            for post in posts:
                serial = post.serialize()
                try:
                    post.user.followed.get(user=request.user)
                except:
                    if post.user != request.user:
                        serial['subscription'] = False
                response.append(serial)
            return JsonResponse(response, safe=False)
        else:
            return JsonResponse([post.serialize() for post in posts], safe=False)
    # posts must be by GET or PUT
    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


@csrf_protect
@login_required
def following(request):
    # Get all posts or only posts from followed users

    if request.method == "GET":
        following = list(follow_.follow for follow_ in request.user.follower.all())
        logging.info(f"User {request.user} following: {following}")
        posts = Post.objects.filter(user__in=following).order_by('-create_date')
        return JsonResponse([post.serialize() for post in posts], safe=False)
    # posts must be by GET
    else:
        return JsonResponse({"error": "GET or PUT request required."}, status=400)


@csrf_protect
@login_required
def unfollow(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        if data.get("followed_id") is not None:
            followed_id = data["followed_id"]

            # Confirm if user is follower
            try:
                follow = Follow.objects.get(id=followed_id)
            except Exception as e:
                return make_and_log_errors(f"No subscription with follow id = {followed_id} found ({e}).")

            # Unfollow user
            try:
                follow.delete()
            except Exception as e:
                return make_and_log_errors(f"Error deleting follow id = {followed_id} found ({e}).")

            # Operation successful but returns no content
            return JsonResponse(data={"followed_id": followed_id}, status=204)
        else:
            return make_and_log_errors('PUT request without id of user to be followed!')
    # Unfollow must be via PUT
    else:
        logging.error("Try unfollow without PUT request")
        return JsonResponse({"error": "For unfollow PUT request is required."}, status=400)


@csrf_protect
@login_required
def like(request):
    if (request.method != 'PUT'):
        # like must be via PUT
        logging.error("Try like without PUT request")
        return JsonResponse({"error": "For like PUT request is required."}, status=400)

    data = json.loads(request.body)
    if data.get("post_id") is None:
        return make_and_log_errors(f"Like PUT request has no post id!")

    post_id = data["post_id"]
    if post_id == '':
        return make_and_log_errors(f"Like PUT request post id is empty!")

    # Confirm if post exists
    try:
        post_target = Post.objects.get(id=post_id)
    except Exception as e:
        return make_and_log_errors(f"Error new like for user {request.user.username} to post id={post_id}: {e}")

    # Confirm if user has like on post
    # then remove your like
    try:
        old_like = Like.objects.get(user=request.user, post=post_target)
    except:
        pass
    else:
        try:
            old_like.delete()
        except Exception as e:
            return make_and_log_errors(f"Erro try dislike post id={post_id} of user {request.user.username}: {e}")
        else:
            return JsonResponse(
                {"message": "Like successfully.",
                 "post": post_target.serialize()},
                safe=False, status=201)

    try:
        new_like = Like(user=request.user, post=post_target)
        new_like.save()
    except Exception as e:
        return make_and_log_errors(f"Error new like for user {request.user.username} to post id={post_id}: {e}")

    return JsonResponse(
        {"message": "Like successfully.",
         "post": new_like.post.serialize()},
        safe=False, status=201)


@csrf_protect
@login_required
def post(request):
    # Insert a new post must be via POST
    if (request.method != 'POST'):
        logging.error("Try post without POST request")
        return JsonResponse({"error": "For post POST request is required."}, status=400)

    # Get text of post
    data = json.loads(request.body)
    if data.get("post_text") is None:
        return make_and_log_errors(f"Post POST request has no text!")

    post_text = data["post_text"]

    if post_text == '':
        return make_and_log_errors(f"Post POST request has no text!")

    if data.get("post_id") is not None:
        post_id = data["post_id"]
        if post_id == '':
            return make_and_log_errors(f"Post POST request post id is empty!")
        try:
            old_post = Post.objects.get(id=post_id)
        except Exception as e:
            return make_and_log_errors(f"Error update post id = {post_id}: {e}.")
        else:
            try:
                old_post.text = post_text
                old_post.create_date = datetime.datetime.now()
                old_post.save()
            except Exception as e:
                return make_and_log_errors(f"Error update post id = {post_id}: {e}.")
            else:
                return JsonResponse(
                    {"message": "Update post successfully.",
                     "post": old_post.serialize()},
                    safe=False, status=201)

    try:
        new_post = Post(user=request.user, text=post_text)
        new_post.save()
    except Exception as e:
        return make_and_log_errors(f"Error insert new post for user {request.user.username}: {e}")

    return JsonResponse(
        {"message": "Post successfully."},
        safe=False, status=201)


@csrf_protect
@login_required
def profile(request):
    # Only request POST is accept
    if request.method != 'POST':
        logging.error("Try get profile without POST request")
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    if data.get("user_id") is None:
        return make_and_log_errors(f"Profile POST request has no user id!")

    user_id = data["user_id"]
    if user_id == '':
        return make_and_log_errors(f"Profile POST request post user is empty!")

    # Confirm if user exists
    try:
        user_target = User.objects.get(id=user_id)
    except Exception as e:
        return make_and_log_errors(f"Error getting user id={user_id}: {e}")

    return JsonResponse(
        {"message": "Get profile successfully.",
         "profile": user_target.serialize()},
        safe=False, status=201)
