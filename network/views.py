from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import User, Post, Member, Like


@csrf_exempt
def index(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required."}, status=400)
        
        data = json.loads(request.body)
        body = data.get("post", "")
        new_post = Post(
            author=request.user,
            content=body
        )
        new_post.save()
        return JsonResponse({"message": "Post successful."}, status=201)
    
    
    return render(request, "network/index.html")


def profile(request, username):
    try:
        profile = Member.objects.get(user__username=username)
    except (KeyError, Member.DoesNotExist):
       return HttpResponseRedirect(reverse("index"))
    
    post_objects = Post.objects.filter(author__username=username)
    posts = post_objects.order_by("-date").all()
    post_list = []
    for post in posts:
        post = post.serialize()
        post_list += [post]
    following = profile.following.all()
    followers = profile.followers.all()
    return render(request, "network/profile.html", {
        "posts": post_list,
        "username": username,
        "following": following,
        "followers": followers
    })


def posts(request):
    post_objects = Post.objects.filter()
    posts = post_objects.order_by("-date").all()
    return JsonResponse([post.serialize() for post in posts], safe=False)


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
