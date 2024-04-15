document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#all').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following').addEventListener('click', () => load_posts('following'));
    document.querySelector('#post-form').addEventListener('submit', new_post);
    document.querySelector('#user-info').style.display = 'none';
    let nick = document.querySelector('#user').textContent;
    document.querySelector('#user').addEventListener('click', () => load_profile(`${nick}`));
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
        let posting = document.createElement('div');
        posting.setAttribute('class', 'post');
        posting.setAttribute('id', id);
        posting.innerHTML = `<div class="user">${poster}</div> ${content} <br> <div class="timestamp">${timestamp}</div> Likes: ${likes}`;
        const likeButton = document.createElement('button');
        likeButton.setAttribute('class', 'like-btn');
        likeButton.textContent = 'Like';
        posting.appendChild(likeButton);
        document.querySelector('#posts').appendChild(posting);
    })});

    setTimeout(function() {
        const userList = document.querySelectorAll(".user");
        console.log(userList);
        for (let i = 0; i < userList.length; i++) {
            let nickname = userList[i].innerText;
            userList[i].addEventListener('click', () => load_profile(`${nickname}`));
        };
    }, 100);

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
    console.log(username);
};
