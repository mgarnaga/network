from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.decorators import login_required

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


@csrf_exempt
def profile(request, username):
    try:
        profile = Member.objects.get(user__username=username)
    except (KeyError, Member.DoesNotExist):
       return JsonResponse({"error": "Member doesn't exist."}, status=400)
    
    user_profile = Member.objects.get(user=request.user)

    if request.method == "POST":
        if profile == user_profile:
            return HttpResponse(status=400)
        data = json.loads(request.body)
        if data.get("followed") is True:
            if user_profile not in profile.followers.all():
                profile.followers.add(user_profile)
                user_profile.following.add(profile)
        elif data.get("followed") is False:
            if user_profile in profile.followers.all():
                profile.followers.remove(user_profile)
                user_profile.following.remove(profile)
        profile.save()
        user_profile.save()
        return HttpResponse(status=204)

    
    connected = bool
    if profile in user_profile.following.all():
        connected = True
    else:
        connected = False
    serialized_profile = profile.serialize()
    serialized_profile["connected"] = connected

    return JsonResponse(serialized_profile, safe=False)


def posts(request, selection):
    if selection == "all":
        post_objects = Post.objects.filter()
    elif selection == "following":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required."}, status=400)
        authors = User.objects.filter(member__in=request.user.member.following.all())
        post_objects = Post.objects.filter(author__in=authors)
    else:
        try:
            post_objects = Post.objects.filter(author__username=selection)
        except (KeyError, Post.DoesNotExist):
            return JsonResponse({"error": "Selection doesn't exist."}, status=400)
    
    posts = post_objects.order_by("-date").all()
    serialized_list = []
    for post in posts:
        serialized = post.serialize()
        if post.author == request.user:
            serialized["owned"] = True
        else:
            serialized["owned"] = False
        serialized_list += [serialized]

    return JsonResponse(serialized_list, safe=False)


@csrf_exempt
@login_required
def edit_post(request, id):
    if request.method == 'PUT':
        try:
            post = Post.objects.get(pk=id)
        except (KeyError, Post.DoesNotExist):
            return JsonResponse({"error": "Post doesn't exist."}, status=400)
    
        if post.author == request.user:
            data = json.loads(request.body)
            if data.get("content") is not None:
                post.content = data["content"]
                post.save()
            return HttpResponse(status=204)
        else:
            return JsonResponse({"error": "Invalid credentials to edit this post."}, status=400)
        
    else:
        return JsonResponse({"error": "PUT request required."}, status=400)


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
