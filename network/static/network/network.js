// global scope variables to handle pagination listeners/functions
let selected;
let currPage;
let total;


document.addEventListener('DOMContentLoaded', function() {
    // after loading DOM getting popular posts for index page and attaching main listeners
    load_posts('popular')
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

    // if new post is empty returning
    if (postValue === '') {
        console.log('empty post!')
        return;
    // posting the post on server and refreshing
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

// huge main function accepting posts selection and page number
function load_posts(selection, currentPage = 1) {
    // showing/hiding page components according to selection
    if (selection == "following") {
        document.querySelector('#user-info').style.display = 'none';
        document.querySelector('#new-post').style.display = 'none';
        document.querySelector('#popular').style.display = 'none';
    } else if (selection == "all") {
        document.querySelector('#user-info').style.display = 'none';
        document.querySelector('#new-post').style.display = 'block';
        document.querySelector('#popular').style.display = 'none';
    } else if (selection == "popular") {
        document.querySelector('#user-info').style.display = 'none';
        document.querySelector('#new-post').style.display = 'none';
        document.querySelector('#popular').style.display = 'block';
    } else {
        document.querySelector('#user-info').style.display = 'block';
        // if user is in his own profile page showing new post form
        if (selection == document.querySelector('#user').textContent) {
            document.querySelector('#new-post').style.display = 'block';
        } else {
            document.querySelector('#new-post').style.display = 'none';
        }
        document.querySelector('#popular').style.display = 'none';
    };

    // clearing posts and removing irrelevant pagination listeners
    document.querySelector('#posts').innerHTML = "";
    document.querySelector('#next-page').removeEventListener('click', nextPageButtonClick);
    document.querySelector('#prev-page').removeEventListener('click', prevPageButtonClick);

    // constructing url of interest
    let reqUrl = `/posts/${selection}?page=${currentPage}`;

    fetch(reqUrl)
        .then(response => response.json())
        .then(data => {
            let posts = data.posts;
            let total_pages = data.total_pages;
            document.querySelector('#posts').innerHTML = "";
            // for each post received from server - creating post and rendering on webpage
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
                posting.innerHTML = `<div class="user">${poster}</div> <div class="post-content">${content}</div> 
                <div class="timestamp">${timestamp}</div> `;
                const likesContent = document.createElement('div');
                likesContent.setAttribute('class', 'likes');
                likesContent.innerHTML = `<div class="like-count">${likes}</div>`;
                const likeButton = document.createElement('div');
                likeButton.setAttribute('class', 'like-btn');
                // setting heart (like) state
                if (liked) {
                    likeButton.innerHTML = `<i class="fa-solid fa-heart" style="font-size:20px;color:#cc241d;"></i>`;
                } else {
                    likeButton.innerHTML = `<i class="fa-regular fa-heart" style="font-size:20px;"></i>`;
                };
                // if clicked handling like in like function
                likeButton.addEventListener('click', () => {
                    like_handling(id);
                });
                likesContent.appendChild(likeButton);
                posting.appendChild(likesContent);
                // if logged-in user is the post author - adding editing feature
                if (owned) {
                    let editButton = document.createElement('div');
                    editButton.setAttribute('class', 'edit-btn');
                    editButton.textContent = 'Edit';
                    posting.appendChild(editButton);
                }
                // finally appending constructed post to webpage
                document.querySelector('#posts').appendChild(posting);
            })
            // attaching listeners to user nicknames and edit button clicks
            attachListeners();

            // showing/hiding pagination links based on received data
            const nextPage = document.querySelector('#next-page');
            const prevPage = document.querySelector('#prev-page');

            if (data.has_next) {
                nextPage.style.display = 'block';
            } else {
                nextPage.style.display = 'none';
            }
            if (data.has_previous) {
                prevPage.style.display = 'block';
            } else {
                prevPage.style.display = 'none';
            }

            // reassining global variables to relevant values and attaching listeners to pagination links
            currPage = currentPage;
            total = total_pages;
            selected = selection;
            nextPage.addEventListener('click', nextPageButtonClick);
            prevPage.addEventListener('click', prevPageButtonClick);
        });

};

// if next page is clicked checking current is not last and loading posts for next page
const nextPageButtonClick = () => {
    if (currPage == total) {
        return;
    } else {
        currPage++;
        load_posts(selected, currPage);
    };
};
// if previous page is clicked checking it's not the first page and loading posts for previous page
const prevPageButtonClick = () => {
    if (currPage > 1) {
        currPage--;
        load_posts(selected, currPage);
    };
};

// listeners for users and edit buttons
function attachListeners() {
    const userList = document.querySelectorAll(".user");
    for (let i = 0; i < userList.length; i++) {
        let nickname = userList[i].innerText;
        userList[i].addEventListener('click', () => load_profile(nickname));
        };

    const editBtns = document.querySelectorAll('.edit-btn');
    for (let i = 0; i < editBtns.length; i++) {
        let id = editBtns[i].parentElement.id;
        editBtns[i].addEventListener('click', () => edit_post(id));
        };
};

// if loading profile
function load_profile(username) {
    // receiving data from server and rendering on page
    let reqUrl = `${username}`;
    fetch(reqUrl)
    .then(response => response.json())
    .then (data => {
        const username = data.member;
        const following = data.following;
        const followers = data.followers;
        const connected = data.connected;
        document.querySelector('#user-info').innerHTML = `<div style="font-size: 24px;">${username}</div> <div> followers: ${followers.length} following: ${following.length} </div>`;
        
        // if profile loaded not of logged-in user attaching follow/unfollow button
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
    // loading posts selection where author is user which profile is loaded
    load_posts(username);
};


// if followed/unfollowed letting server know and changing follow button state, then reloading profile
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
        }, 50);
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
        }, 50);
        document.querySelector('#follow-btn').textContent = 'Follow';
    };
};

// if like/unlike post button clicked
function like_handling(id) {
    // getting post id, selecting relevant components in that post
    const post = document.getElementById(`${id}`);
    let likes = post.querySelector('.likes');
    let count = likes.querySelector('.like-count');
    const likeButton = likes.querySelector('.like-btn');
    let liked = Boolean;
    // change count and heart (like) button on page
    if (likeButton.querySelector('i').className == "fa-regular fa-heart") {
        liked = true
        likeButton.innerHTML = `<i class="fa-solid fa-heart" style="font-size:20px;color:#cc241d;"></i>`;
        count.textContent = parseInt(count.textContent) + 1;
    } else {
        liked = false
        likeButton.innerHTML = `<i class="fa-regular fa-heart" style="font-size:20px;"></i>`;
        count.textContent = parseInt(count.textContent) - 1;
    }
    // let server know about change
    let reqUrl = `posts/edit/${id}`;
    fetch(reqUrl, {
        method: 'PUT',
        body: JSON.stringify({
            like: liked
        })
    })
    .then(response => console.log(response));
};

// if edit post was clicked
function edit_post(id) {
    // selecting relevant post and its components
    const post = document.getElementById(`${id}`);
    const content = post.querySelector('.post-content');

    // creating textarea and save button, setting textarea value to current post content
    const textarea = document.createElement('textarea');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    textarea.value = content.innerHTML;

    // replacing post content with textarea with content
    content.replaceWith(textarea);
    //hiding edit button, appending save button
    post.querySelector('.edit-btn').style.display = 'none';
    post.appendChild(saveBtn);

    // when save is clicked letting server know of changes
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

        // setting post content to updated textarea value and replacing textarea with content back
        content.innerHTML = textarea.value;
        textarea.replaceWith(content);
        // showing edit button again, removing save button
        post.querySelector('.edit-btn').style.display = 'block';
        saveBtn.remove();
    });
};