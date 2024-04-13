document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#post-form').addEventListener('submit', new_post);
    load_posts();
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

function load_posts() {
    let reqUrl = `/posts`;
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
        posting.innerHTML = `${poster} on ${timestamp} wrote: <br> ${content} <br> Likes: ${likes}`;
        const likeButton = document.createElement('button');
        likeButton.setAttribute('class', 'like-btn');
        likeButton.textContent = 'Like';
        posting.appendChild(likeButton);
        document.querySelector('#posts').appendChild(posting);
    })});
};