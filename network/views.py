from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.decorators import login_required
from django.db.models import F
from django.core.paginator import Paginator
from datetime import timedelta
from django.utils import timezone

from .models import User, Post, Member, Like


@csrf_exempt
def index(request):
    # handling new posts
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
    
    if not request.user.is_authenticated:
        return redirect(to="login")
    return render(request, "network/index.html")


@csrf_exempt
def profile(request, username):
    # getting requested profile from db
    try:
        profile = Member.objects.get(user__username=username)
    except (Member.DoesNotExist):
       return JsonResponse({"error": "Member doesn't exist."}, status=400)
    
    # getting logged in user member creds
    user_profile = Member.objects.get(user=request.user)

    # if follow/unfollow data received from client
    if request.method == "POST":

        # can't follow/unfollow yourself
        if profile == user_profile:
            return HttpResponse(status=400)
        
        data = json.loads(request.body)

        # handling following
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

    # in GET, returns profile info and state of followed(connected) by logged user
    connected = bool
    if profile in user_profile.following.all():
        connected = True
    else:
        connected = False
    serialized_profile = profile.serialize()
    serialized_profile["connected"] = connected

    return JsonResponse(serialized_profile, safe=False)


# loading posts
def posts(request, selection):

    serialized_list = []
    liked = bool
    # if all posts selected getting all
    if selection == "all":
        post_objects = Post.objects.filter()

    # followed users posts selection
    elif selection == "following":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required."}, status=400)
        authors = User.objects.filter(member__in=request.user.member.following.all())
        post_objects = Post.objects.filter(author__in=authors)

    # popular posts selection (displayed by default in index.html)
    elif selection == "popular":
        # getting 5 posts in the last two weeks ordered by favs (likes) in descending order
        one_month_ago = timezone.now() - timedelta(days=14)
        recent_posts = Post.objects.filter(date__gte=one_month_ago)
        top_recent_posts = recent_posts.order_by('-favs')[:5]

        # preparing posts and returning them in json
        for post in top_recent_posts:
            serialized = post.serialize()
            try:
                Like.objects.get(to_post=post, by_user=request.user)
                liked = True
            except Like.DoesNotExist:
                liked = False
            serialized["liked"] = liked
            if post.author == request.user:
                serialized["owned"] = True
            else:
                serialized["owned"] = False
            serialized_list += [serialized]
        return JsonResponse({'posts': serialized_list,
                             'total_pages': 1}, safe=False)
    
    # posts selection by specific user
    else:
        try:
            post_objects = Post.objects.filter(author__username=selection)
        except (KeyError, Post.DoesNotExist):
            return JsonResponse({"error": "Selection doesn't exist."}, status=400)
    
    # pagination
    paginator = Paginator(post_objects.order_by("-date").all(), 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # preparing posts for json transfer (serializing, like by logged user state, author=logged user state)
    for post in page_obj:
        serialized = post.serialize()
        try:
            Like.objects.get(to_post=post, by_user=request.user)
            liked = True
        except Like.DoesNotExist:
            liked = False
        serialized["liked"] = liked
        if post.author == request.user:
            serialized["owned"] = True
        else:
            serialized["owned"] = False
        serialized_list += [serialized]

    # responding with list of posts, pagination states
    return JsonResponse({
        'posts': serialized_list,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'total_pages': paginator.num_pages
    }, safe=False)


@csrf_exempt
@login_required
# handling posts editing and likes
def edit_post(request, id):
    if request.method == 'PUT':
        # getting post from db
        try:
            post = Post.objects.get(pk=id)
        except (Post.DoesNotExist):
            return JsonResponse({"error": "Post doesn't exist."}, status=400)
    
        data = json.loads(request.body)

        # if editing attempt checking for ownership and setting edited content as post content
        if data.get("content") is not None:
            if post.author == request.user:
                post.content = data["content"]
            else:
                return JsonResponse({"error": "Invalid credentials to edit this post."}, status=400)
        
        # if post is liked/unliked
        if data.get("like") is not None:
            # if liked creating Like instance and updating post's like count
            if data.get("like") is True:
                try:
                    Like.objects.create(to_post=post, by_user=request.user)
                    post.favs = F('favs') + 1
                except IntegrityError:
                    return JsonResponse({"error": "Post already liked."}, status=400)
            # if unliked deleting Like instance updating post's like count
            else:
                try:
                    Like.objects.get(to_post=post, by_user=request.user).delete()
                    post.favs = F('favs') - 1
                except (Like.DoesNotExist):
                    return JsonResponse({"error": "Post already unliked."}, status=400)
        
        # saving post changes
        post.save()

        return HttpResponse(status=204)
    
    # only PUT method allowed for editing and likes
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
