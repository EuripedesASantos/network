// Initiate principal page and actions for each link
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  if (document.querySelector('#following') !== null) {
    document.querySelector('#following').addEventListener('click', () => show_following());
  }

  if (document.querySelector('#new_post') !== null) {
    document.querySelector('#new_post').addEventListener('click', () => show_new_post());
  }

  if (document.querySelector('#follows') !== null) {
    document.querySelector('#follows').addEventListener('click', () => show_follows());
  }

  // By default, show all posts
  show_posts();
});

// Hide all views before shows one
function hide_all_views() {
    // Hide and clear all views
    document.querySelector('#page_title').innerText = '';
    const body_nodes = document.body.querySelector('div[class="body"]').childNodes;
        body_nodes.forEach( node => {
            if (node.tagName === 'DIV') {
                node.style.display = 'none';
                if (!["new_post-view", "user_profile"].includes(node.id)) {
                    node.innerHTML = '';
                }
            }
        })
}

// Show form to make new post
function show_new_post() {
  window.scrollTo(0,{behavior: 'smooth'});

  temp_title = document.querySelector('#page_title').innerText;
  document.querySelector('#page_title').innerText = 'New Post';
  document.querySelector('#new_post-view').style.display = 'block';
  document.querySelector('#new_post-view').animationPlayState = 'paused';

  document.querySelector('#post_text').value = '';

  document.querySelector('#new_post-submit').innerText = 'Submit';
  document.querySelector('#new_post-submit').addEventListener('click', () => post_submit());

  document.querySelector('#new_post-form').addEventListener('submit', function(e) {e.preventDefault();});
}

// Use temp var to indicate correct 'Edit' button to update
function set_temp(edit_button) {
    temp_var = edit_button.parentElement.parentElement.childNodes[1];
}

// Make operations to shows edit form with information to be updated
function edit_post(edit_button, post_num) {

    set_temp(edit_button);
    post = posts[post_num];
    window.scrollTo(0,{behavior: 'smooth'});

    // Show form to edit old post
    temp_title = document.querySelector('#page_title').innerText;
    document.querySelector('#page_title').innerText = 'Edit Post';
    document.querySelector('#new_post-view').style.display = 'block';
  document.querySelector('#new_post-view').animationPlayState = 'paused';
    document.querySelector('#post_text').value = post.text;

    document.querySelector('#new_post-submit').innerText = 'Save';
    document.querySelector('#new_post-submit').addEventListener('click', () => post_submit());

    document.querySelector('#new_post-form').addEventListener('submit', function(e) {e.preventDefault();});

    let hide_input = document.createElement('input');
        hide_input.id = 'post_id';
        hide_input.type = 'hidden';
        hide_input.value = posts[post_num].id;
    document.querySelector('#new_post-form').append(hide_input);
}

// Render the head of follows information
function render_follows_head(){
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    heads = ["Name", "E-mail"];
    classNames = ["th-sm text-center", "th-lg text-center"];
    for (r=0; r<2; r++) {
        let th = document.createElement('th');
        th.innerText = heads[r];
        th.scope = "col";
        th.className = classNames[r];
        tr.append(th);
    }
    thead.append(tr);

    return thead;
}

// Make element animated before remove
function hide(element) {
    // Hide and exclude indicated element
    if (element.className === 'hide') {
        element.style.animationPlayState = 'running';
        element.addEventListener('animationend', () => {
            element.remove();
        });
    }
}

// The following function are copying from
// https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to unfollow by clicking button on post's user
// After hide the element if it is given
function unfollow(unfollow_tr, follow_id) {
    const csrf = getCookie('csrftoken');

    fetch('/unfollow', {
        method: 'PUT',
        body: JSON.stringify ({
            followed_id: follow_id
        }),
        headers: { "X-CSRFToken": csrf }
    })
    .then(response => {
        if (response.status === 204) {
            if (unfollow_tr !== undefined) { hide(unfollow_tr);}
        } else {
            response.json().then(data => {
                window.alert(data.error);
                return;
            });
        }
    })
}

// Render each lines of the follows page
function render_follows_item(follow) {
    const new_tr = document.createElement('tr');

    new_tr.scope = "row";
    new_tr.className = "hide";

    datas = [follow.name, follow.mail];
    classNames = ["th-sm text-center", "th-lg text-center", "th-sm text-left"];
    for (r = 0; r < classNames.length; r++) {
        let td = document.createElement('td');
        td.className = classNames[r];
        if (r == 0) {
            td.innerHTML = person_icon + datas[r];
        } else {
            if (r == (classNames.length - 1)) {
                 const new_button = document.createElement('button');
                    new_button.className = "btn btn-outline-danger";
                    new_button.innerHTML = person_icon;
                    new_button.innerText = ' Unfollow'
                    new_button.onclick = function() { unfollow(new_tr, follow.id);};
                td.append(new_button);
            } else {
                td.innerText = datas[r];
            };
        };
        td.scope = "col";
        new_tr.append(td);
    }


  return new_tr;
}

// Render users's information of follows page
function render_follows(follow) {
    const followers_view = document.querySelector('#follow-view');

    document.querySelector('#page_title').innerText = "Follows's list"

    const new_table = document.createElement('table');
        new_table.className = "table table-striped table-hover";
        const tbody = document.createElement('tbody');
            new_table.append(render_follows_head());
            follow.forEach(follow => {
                tbody.append(render_follows_item(follow));
            });
        new_table.append(tbody);

    followers_view.append(new_table);

    followers_view.style.display = 'block';
}

// Show follows page
function show_follows() {
    hide_all_views();

    fetch('/follows')
    .then(response => response.json())
    .then(result => {
        render_follows(result)
    });
}

// Make like of the user and update information in
// especific like's button
function like(button, post_num) {
    const csrf = getCookie('csrftoken');
    fetch('/like', {
        method: 'PUT',
        body: JSON.stringify ({
            post_id: posts[post_num].id
        }),
        headers: { "X-CSRFToken": csrf }
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === undefined) {
            window.alert(result.error);
            return;
        } else {
            if (result.post.likes > 0) {
                button.innerHTML = chat_heart + ` ${result.post.likes} likes`;
            } else {
                button.innerHTML = chat_heart + ' Like';
            }
            posts[post_num] = result.post;
            return;
        };
    });
}

// Make follows for provided user
// After remove clicked button if it is given
async function follows(button, user_id) {
    const csrf = getCookie('csrftoken');

    return fetch('/follows', {
        method: 'PUT',
        body: JSON.stringify ({user_id: user_id}),
        headers: { "X-CSRFToken": csrf }
    })
    .then(response => {
        switch (response.status) {
            case 403:
            case 404:
                return response.json().then(data => {
                    window.alert(data.error);
                    return;
                });
            case 200:
                if (button !== undefined) {
                    button.remove();
                }
                return response.json().then(data => {
                    return data;
                });
            default:
                window.alert(`Unknown status ${response.status} from fetch to make follow.`);
                return;
            }
    });
}

// Create an unfollow button with the action of replacing it with the follow button
function make_unfollow_button(follow_button, user_name, user_id, follow_id) {
    follow_button.style.display = 'block';
    follow_button.className = "btn btn-outline-danger";
    follow_button.innerHTML = person_icon + ' Unfollow';
    follow_button.title = `Unfollow ${user_name}`
    follow_button.onclick = function() {
        unfollow(undefined, follow_id);
        make_follow_button(follow_button, user_name, user_id, follow_id);
    };
}

// Create an follow button with the action of replacing it with the unfollow button
function make_follow_button(follow_button, user_name, user_id, follow_id) {
    follow_button.style.display = 'block';
    follow_button.className = "btn btn-outline-primary";
    follow_button.innerHTML = person_icon + ' Follow';
    follow_button.title = `Follow ${user_name}`
    follow_button.onclick = function() {
        follows(undefined, user_id).then(follow => {
            make_unfollow_button(follow_button, user_name, user_id, follow.id);
        })
    };
}

// Get user's profile and show all user's informations
function show_profile(user_id) {
    const csrf = getCookie('csrftoken');
    fetch('/profile', {
        method: 'POST',
        body: JSON.stringify ({
            user_id: user_id
        }),
        headers: { "X-CSRFToken": csrf }
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === undefined) {
            window.alert(result.error);
            return;
        } else {
            if (result.profile === undefined)  {
                window.alert('Request GET profile return with empty response!');
                return;
        } else {
            document.querySelector('#user_profile').style.display = 'block';
            document.querySelector('#profile_title').innerText = result.profile.username + ' profile';
            document.querySelector('#profile_username').innerHTML = `<b>Name: </b>${result.profile.username}</p>`;
            document.querySelector('#profile_email').innerHTML = `<b>Email: </b>${result.profile.email}</p>`;
            document.querySelector('#profile_followers').innerHTML = `<b>Number of followers: </b>${result.profile.follower_num}</p>`;
            document.querySelector('#profile_followeds').innerHTML = `<b>Number of follows: </b>${result.profile.followed_num}</p>`;
            document.querySelector('#profile_feet').innerText = `${result.profile.username}'s posts:`;
            let follow_button = document.querySelector('#profile_follow');
            if (user_name === '') {
                profile_follow_button.style.display = 'none';
            } else {
                if (result.profile.followed.includes(user_name)) {
                    make_unfollow_button(follow_button, result.profile.username, result.profile.id, result.profile.followed_id[user_name]);
                } else {
                    make_follow_button(follow_button, result.profile.username, result.profile.id, result.profile.followed_id[user_name]);
                }
            }
            posts = result.profile.posts;
            render_posts(0);
            return;
        }
        };
    });
}

// Render each post
function render_post_item(post_num) {
    const new_tr = document.createElement('tr');
        new_tr.className = "hover-overlay";
        new_tr.scope = "row";

    let post = posts[post_num];
    datas = [post.user, post.text];
    classNames = ["th-sm text-left", "th-lg text-left", "th-sm text-center d-flex flex-column"];
    for (r=0; r<classNames.length; r++) {
        let td = document.createElement('td');
            td.className = classNames[r];
            if (r == 0) {
                if (user_name === post.user) {
                     const new_button_edit = document.createElement('button');
                        new_button_edit.className = "btn btn-outline-danger btn-sm";
                        new_button_edit.innerHTML = check2_circle + ' Edit';
                        new_button_edit.title = `Edit this post`;
                        new_button_edit.onclick = function() { edit_post(new_button_edit, post_num);};
                    td.append(new_button_edit);

                } else {if (user_name === '') {
                    const new_p = new_button_profile = document.createElement('p');
                        new_p.innerHTML = person_icon + datas[r];
                    td.append(new_p);
                } else {
                     const new_button_profile = document.createElement('button');
                        new_button_profile.className = "btn btn-outline-primary btn-sm";
                        new_button_profile.innerHTML = person_icon + datas[r];
                        new_button_profile.title = `Show ${datas[r]} profile`;
                        new_button_profile.onclick = function() { show_profile(post.user_id);};
                    td.append(new_button_profile);
                }}
            } else {
                if (r == (classNames.length - 1)) {
                    const new_p = document.createElement('p');
                        new_p.innerHTML =  new Date(post.create_date).toLocaleString('en-US', {month: 'long', day: '2-digit', year: 'numeric'}) + ' ' + new Date(post.create_date).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'});
                        new_p.style.textAlign = 'left';
                   td.append(new_p);
                    if (!post.subscription) {
                         let new_button_follows = document.createElement('button');
                            new_button_follows.className = "btn btn-outline-info btn-sm";
                            new_button_follows.innerHTML = person_icon +  ' Follow';
                            new_button_follows.title = `Follow ${post.user}`;
                            new_button_follows.onclick = function() { follows(new_button_follows, post.user_id);};
                            new_button_follows.style.width = '100px';
                        td.append(new_button_follows);
                    }
                    if (user_name === '' | user_name === post.user) {
                        var new_button_like = document.createElement('p');
                            new_button_like.style.color = '#dc3545';
                            new_button_like.style.textAlign = 'left';
                    } else {
                         var new_button_like = document.createElement('button');
                            new_button_like.className = "btn btn-outline-danger btn-sm";
                            new_button_like.title = 'Like the post';
                            new_button_like.style.width = '100px';
                            new_button_like.onclick = function() { like(new_button_like, post_num);};
                    }
                    if (post.likes > 0) {
                        new_button_like.innerHTML = chat_heart + ` ${post.likes} likes`;
                    } else {
                        if (user_name !== post.user & user_name !== '') { new_button_like.innerHTML = chat_heart + ' Like';}
                    }
                    td.append(new_button_like);
                } else {
                    td.innerText = datas[r];
                };
            };
            td.scope = "col";
        new_tr.append(td);
    }

  return new_tr;
}

// Creates a paginator based on the first post displayed
function make_paginator(start) {
    const new_ul = document.createElement('ul');
        new_ul.className = "pagination justify-content-center pagination-sm";
        var num_pages = Math.floor(posts.length / 10) + 1;
        var actual_page = Math.floor(start / 10) + 1;

        if (actual_page > 1 & num_pages > 1) {
            const new_li = document.createElement('li');
                new_li.onclick = function() { render_posts((actual_page - 2) * 10);};
                const new_a = document.createElement('a');
                    new_a.className = "page-link";
                    new_a.href = "#";
                    new_a.innerText = '<< Previous';
                new_li.append(new_a);
                new_li.className = "page-item";
            new_ul.append(new_li);
        }

        if (actual_page < num_pages) {
            const new_li = document.createElement('li');
                new_li.onclick = function() { render_posts(actual_page * 10);};
                const new_a = document.createElement('a');
                    new_a.className = "page-link";
                    new_a.href = "#";
                    new_a.innerText = 'Next >>';
                new_li.append(new_a);
                new_li.className = "page-item";
            new_ul.append(new_li);
        }
        return new_ul;
}

// Render all users's posts
function render_posts(start) {
  // Show all posts
  const posts_view = document.querySelector('#posts-view')
    posts_view.style.display = 'block';
    posts_view.innerHTML = '';

    const new_table = document.createElement('table');
        new_table.className = "table table-striped table-hover";
        const tbody = document.createElement('tbody');
        if ((start + 10) > posts.length) {
            var last = posts.length;
        } else {
            var last=start+10;
        }
        for (let r = start; r < last; r++) {
            tbody.append(render_post_item(r));
        };
        new_table.append(tbody);
    posts_view.append(new_table);
    if (posts.length > 10) {posts_view.append(make_paginator(start));}
}

// Shows user's posts
function show_posts() {
    hide_all_views();
    document.querySelector('#page_title').innerText = 'All Posts';

    fetch('/posts')
    .then(response => response.json())
    .then(result => {
        posts = result;
        render_posts(0)
    });
}

// Show following page
function show_following() {
    hide_all_views();
    document.querySelector('#page_title').innerText = "Follows's Posts";

    fetch('/following')
    .then(response => response.json())
    .then(result => {
    posts = result;
        render_posts( 0)
    });
}

// Submit new or update user's post
// After, hide the form used
function post_submit() {
    const csrf = getCookie('csrftoken');

    if (document.querySelector('#post_text').value === '') {
        window.alert("Text to post is empty!!!");
        return;
    }

    let form_data = null;
    if (document.querySelector('#post_id') === null) {
        form_data = {
            post_text: document.querySelector('#post_text').value
        };
    } else {
        form_data = {
            post_text: document.querySelector('#post_text').value,
            post_id: document.querySelector('#post_id').value
        };
    }


    fetch('/post', {
      method: 'POST',
      body: JSON.stringify(form_data),
      headers: { "X-CSRFToken": csrf }
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === undefined) {
            window.alert(result.error);
            return;
        } else {
            const element = document.querySelector('#new_post-view')
                element.className = "hide";
                element.style.animationPlayState = 'running';
                element.addEventListener('animationend', () => {
                    document.querySelector('#page_title').innerText = temp_title;
                    temp_title = null;
                    element.className = "";
                    element.style.display = 'none';
                    show_posts();
                });
            if (document.querySelector('#post_id') !== null) {
                temp_var.innerText = result.post.text;
                for (r=0; r < posts.length; r++) {
                    if (posts[r].id === result.post.id) {
                        posts[r] = result.post;
                        return;
                    }
                }
            }
        };
    });
}