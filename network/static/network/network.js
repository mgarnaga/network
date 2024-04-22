document.addEventListener('DOMContentLoaded', function() {
    load_posts('all')
    document.querySelector('#all').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following').addEventListener('click', () => load_posts('following'));
    document.querySelector('#post-form').addEventListener('submit', new_post);
    document.querySelector('#user-info').style.display = 'none';
    let nick = document.querySelector('#user').textContent;
    document.querySelector('#user').addEventListener('click', () => load_profile(nick));
});

function new_post(event) {
    event.preventDefault();
    let postValue = document.querySelector('textarea').value;
    if (postValue === '') {
        console.log('empty post!')
        return;
    } else {
        fetch('/', {
            method: 'POST',
            body: JSON.stringify({
                post: postValue
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
        });
        setTimeout(function() {
            location.reload();
        }, 100);
    };
};

function load_posts(selection) {
    if (selection == "following") {
        document.querySelector('#user-info').style.display = 'none';
        document.querySelector('#new-post').style.display = 'none';
    } else if (selection == "all") {
        document.querySelector('#user-info').style.display = 'none';
        document.querySelector('#new-post').style.display = 'block';
    } else {
        document.querySelector('#user-info').style.display = 'block';
        document.querySelector('#new-post').style.display = 'none';
    };
    document.querySelector('#posts').innerHTML = "";
    let reqUrl = `/posts/${selection}`;
    fetch(reqUrl)
    .then(response => response.json())
    .then(data => {
        let posts = data;
        console.log(posts);
        posts.forEach(post => {
        const id = post.id;
        const poster = post.poster;
        const content = post.content;
        const timestamp = post.timestamp;
        let likes = post.likes;
        const owned = post.owned;
        const liked = post.liked;
        let posting = document.createElement('div');
        posting.setAttribute('class', 'post');
        posting.setAttribute('id', id);
        posting.innerHTML = `<div class="user">${poster}</div> <div class="post-content"> ${content} </div> 
        <div class="timestamp">${timestamp}</div> `;
        const likesContent = document.createElement('div');
        likesContent.setAttribute('class', 'likes');
        likesContent.innerHTML = `<div class="like-count">${likes}</div>`;
        const likeButton = document.createElement('div');
        likeButton.setAttribute('class', 'like-btn');
        if (liked) {
            likeButton.innerHTML = `<i class="fa-solid fa-heart" style="font-size:20px;color:#cc241d;"></i>`;
        } else {
            likeButton.innerHTML = `<i class="fa-regular fa-heart" style="font-size:20px;"></i>`;
        };
        likeButton.addEventListener('click', () => {
            like_handling(id);
        });
        likesContent.appendChild(likeButton);
        posting.appendChild(likesContent);
        if (owned) {
            let editButton = document.createElement('div');
            editButton.setAttribute('class', 'edit-btn');
            editButton.textContent = 'Edit';
            posting.appendChild(editButton);
        }
        document.querySelector('#posts').appendChild(posting);
    })});

    setTimeout(function() {
        const userList = document.querySelectorAll(".user");
        for (let i = 0; i < userList.length; i++) {
            let nickname = userList[i].innerText;
            userList[i].addEventListener('click', () => load_profile(nickname));
        };
        const editBtns = document.querySelectorAll('.edit-btn');
        for (let i = 0; i < editBtns.length; i++) {
            let id = editBtns[i].parentElement.id;
            editBtns[i].addEventListener('click', () => edit_post(id));
        }
    }, 50);

};

function load_profile(username) {
    document.querySelector('#new-post').style.display = 'none';
    document.querySelector('#user-info').style.display = 'block';
    let reqUrl = `${username}/`;
    fetch(reqUrl)
    .then(response => response.json())
    .then (data => {
        console.log(data)
        const username = data.member;
        const following = data.following;
        const followers = data.followers;
        const connected = data.connected;
        document.querySelector('#user-info').innerHTML = `<div style="font-size: 24px;">${username}</div> <div> followers: ${followers.length} following: ${following.length} </div>`;
        if (username !== document.querySelector('#user').textContent) {
            const followButton = document.createElement('button');
            followButton.setAttribute('id', 'follow-btn');
            if (connected == true) {
                followButton.textContent = 'Unfollow';
            } else {
                followButton.textContent = 'Follow';
            }
            followButton.addEventListener('click', () => follow_handling(username));
            document.querySelector('#user-info').appendChild(followButton);
        };
    });
    load_posts(username);
};

function follow_handling(username) {
    if (document.querySelector('#follow-btn').textContent == 'Follow') {
        let reqUrl = `${username}/`;
        fetch(reqUrl, {
            method: 'POST',
            body: JSON.stringify({
                followed: true
            })
        });
        setTimeout(function() {
            load_profile(username);
        }, 100);
        document.querySelector('#follow-btn').textContent = 'Unfollow';
    } else {
        let reqUrl = `${username}/`;
        fetch(reqUrl, {
            method: 'POST',
            body: JSON.stringify({
                followed: false
            })
        });
        setTimeout(function() {
            load_profile(username);
        }, 100);
        document.querySelector('#follow-btn').textContent = 'Follow';
    };
};

function like_handling(id) {
    const post = document.getElementById(`${id}`);
    let likes = post.querySelector('.likes');
    let count = likes.querySelector('.like-count');
    const likeButton = likes.querySelector('.like-btn');
    let liked = Boolean;
    if (likeButton.querySelector('i').className == "fa-regular fa-heart") {
        liked = true
        likeButton.innerHTML = `<i class="fa-solid fa-heart" style="font-size:20px;color:#cc241d;"></i>`;
        count.textContent = parseInt(count.textContent) + 1;
    } else {
        liked = false
        likeButton.innerHTML = `<i class="fa-regular fa-heart" style="font-size:20px;"></i>`;
        count.textContent = parseInt(count.textContent) - 1;
    }
    let reqUrl = `posts/edit/${id}`;
    fetch(reqUrl, {
        method: 'PUT',
        body: JSON.stringify({
            like: liked
        })
    })
    .then(response => console.log(response));
};


function edit_post(id) {
    const post = document.getElementById(`${id}`);
    const content = post.querySelector('.post-content');
    const textarea = document.createElement('textarea');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    textarea.value = content.innerHTML;
    content.replaceWith(textarea);
    post.querySelector('.edit-btn').style.display = 'none';
    saveBtn.addEventListener('click', () => {
        updatedContent = textarea.value;
        let reqUrl = `posts/edit/${id}`;
        fetch(reqUrl, {
            method: 'PUT',
            body: JSON.stringify({
                content: updatedContent
            })
        })
        .then(response => console.log(response));
        content.innerHTML = textarea.value;
        textarea.replaceWith(content);
        post.querySelector('.edit-btn').style.display = 'block';
        saveBtn.remove();
    });
    post.appendChild(saveBtn);
};