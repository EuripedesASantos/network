document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-submit').addEventListener('click', compose_submit);
  document.querySelector('#compose-form').addEventListener('submit', function(e) {e.preventDefault();});

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function compose_submit() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body:  document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === undefined) {
            window.alert(result.error);
            return;
        } else {
            load_mailbox('sent');
        };
    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  switch (mailbox) {
    case 'inbox':
    case 'sent':
    case 'archive':
        render_mailbox(mailbox)
        .then( mailbox_div => {
            if (mailbox_div === undefined) {
                document.querySelector('#emails-view').innerHTML = document.querySelector('#emails-view').innerHTML + "<p>No message!</p>"
            } else {
                if (mailbox === 'inbox' || mailbox === 'sent') {
                    let p = document.createElement('p');
                        p.innerText = "Click on message to view!";
                    document.querySelector('#emails-view').append(p);
                }
                document.querySelector('#emails-view').append(mailbox_div);
            };
        });
        break;
  }
}

async function get_mailbox(mailbox) {
    const response = await fetch('/emails/' + mailbox);
    const emails = await response.json();
    return emails;
}

function render_sent_item(email) {
  const new_div = document.createElement('div');

  const p=document.createElement('p');
    p.addEventListener('click', () => show_mail(email,'sent'));
    p.innerHTML = "<b>From:</b> " + email.sender + "<br>"
    p.innerHTML = p.innerHTML + "<b>To:</b> " + email.recipients + "<br>"
    p.innerHTML = p.innerHTML + "<b>Suject:</b> " + email.subject + "<br>"
    p.innerHTML = p.innerHTML + "<b>Timestamp:</b> " + email.timestamp + "<br>"
  new_div.append(p)

  new_div.append(document.createElement('hr'));
  return new_div;
}

function render_sent(emails){
    new_div = document.createElement('div');
    emails.forEach(email => {
        new_div.append(render_sent_item(email));
    });
    return new_div;
};

function render_inbox_item(email) {
    const new_tr = document.createElement('tr');

    if (email.read) {
        new_tr.className = "hover-overlay";
    } else {
        new_tr.className = "hover-overlay font-weight-bold";
    };
    new_tr.addEventListener('click', () => show_mail(email, 'inbox'));
//    new_tr.addEventListener('mouseover', function (elem) {elem.style.backgroundColor = "lightgray";};);
    new_tr.scope = "row";

    datas = [email.sender, email.subject, email.timestamp];
    classNames = ["text-left", "text-left", "text-right"];
    for (r=0; r<3; r++) {
        let td = document.createElement('td');
        td.className = classNames[r];
        td.innerText = datas[r];
        td.scope = "col";
        new_tr.append(td);
    }

  return new_tr;
}

function render_inbox_head(){
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    heads = ["Sender", "Subject", "Timestamp"];
    classNames = ["th-sm text-left", "th-lg text-left", "th-sm text-right"];
    for (r=0; r<3; r++) {
        let th = document.createElement('th');
        th.innerText = heads[r];
        th.scope = "col";
        th.className = classNames[r];
        tr.append(th);
    }

    thead.append(tr);

    return thead;
}
function render_inbox(emails){
    const new_table = document.createElement('table');
    new_table.className = "table table-striped table-hover";
    const tbody = document.createElement('tbody');
    new_table.append(render_inbox_head());
    emails.forEach(email => {
        tbody.append(render_inbox_item(email));
    });
    new_table.append(tbody);
    return new_table;
};

function render_archive_item(email) {
  const new_div = document.createElement('div');

  const p=document.createElement('p');
    p.innerHTML = "<b>From:</b> " + email.sender + "<br>"
    p.innerHTML = p.innerHTML + "<b>To:</b> " + email.recipients + "<br>"
    p.innerHTML = p.innerHTML + "<b>Suject:</b> " + email.subject + "<br>"
    p.innerHTML = p.innerHTML + "<b>Timestamp:</b> " + email.timestamp + "<br>"
  new_div.append(p)

    const archive_button = document.createElement('button');
      archive_button.class = "btn btn-sm btn-outline-primary";
      archive_button.id = "Unarchive";
      archive_button.dataset.id = email.id;
      archive_button.innerText = "Unarchive";
      archive_button.className = "btn btn-sm btn-outline-primary";
      archive_button.onclick = function() { set_mail_archive(email.id, false);};
    new_div.append(archive_button);

  new_div.append(document.createElement('hr'));
  return new_div;
}

function render_archive(emails){
    new_div = document.createElement('div');
    emails.forEach(email => {
        new_div.append(render_archive_item(email));
    });
    return new_div;
};

async function render_mailbox(mailbox) {
  const emails = await get_mailbox(mailbox);
  if (emails.length === 0) {
    return;
  }
      switch (mailbox) {
        case "sent":
            return render_sent(emails);
        case "archive":
            return render_archive(emails);
        case "inbox":
            return render_inbox(emails);
      };
}

function reply_email(email) {
  compose_email();

  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
  document.querySelector('#compose-body').value = '\n\n\n\n\nOn ' + email.timestamp + ' ' + email.sender + ' wrote:\n' + email.body;
}

async function get_mail(mail_id) {
    const response = await fetch('/emails/' + mail_id);
    const email = await response.json();
    return email;
}

async function set_mail_archive(mail_id, archive_status) {
    fetch('/emails/' + mail_id, {
      method: 'PUT',
      body: JSON.stringify({ archived: archive_status})
    })
    .then(response  => { if (archive_status) { load_mailbox('inbox');} else { load_mailbox('archive');};});
}

async function set_mail_read(mail_id, read_status) {
    fetch('/emails/' + mail_id, {
      method: 'PUT',
      body: JSON.stringify({ read: read_status})
    })
    .then(response  => { if (!read_status) { load_mailbox('inbox');};});
}

async function show_mail(email, mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = "";

    await set_mail_read(email.id, true);
    const new_div = document.createElement('div');

      let p=document.createElement('p');
        p.innerHTML = "<b>From:</b> " + email.sender + "<br>"
        p.innerHTML = p.innerHTML + "<b>To:</b> " + email.recipients + "<br>"
        p.innerHTML = p.innerHTML + "<b>Suject:</b> " + email.subject + "<br>"
        p.innerHTML = p.innerHTML + "<b>Timestamp:</b> " + email.timestamp + "<br>"
    new_div.append(p)


    if (mailbox == 'inbox') {
        const reply_button = document.createElement('button');
          reply_button.class = "btn btn-sm btn-outline-primary";
          reply_button.id = "reply";
          reply_button.dataset.id = email.id;
          reply_button.innerText = "Reply";
          reply_button.className = "btn btn-sm btn-outline-primary";
          reply_button.onclick = function() {reply_email(email);};
        new_div.append(reply_button);

        const archive_button = document.createElement('button');
          archive_button.class = "btn btn-sm btn-outline-primary";
          archive_button.id = "reply";
          archive_button.dataset.id = email.id;
          archive_button.innerText = "Archive";
          archive_button.className = "btn btn-sm btn-outline-primary";
          archive_button.onclick = function() { set_mail_archive(email.id, true);};
        new_div.append(archive_button);

        const unread_button = document.createElement('button');
          unread_button.class = "btn btn-sm btn-outline-primary";
          unread_button.id = "reply";
          unread_button.dataset.id = email.id;
          unread_button.innerText = "Unread";
          unread_button.className = "btn btn-sm btn-outline-primary";
          unread_button.onclick = function() { set_mail_read(email.id, false)};
        new_div.append(unread_button);
    };

    new_div.append(document.createElement('hr'));

    div_p=document.createElement('div');
    div_p.className = "multiline";
    div_p.innerText = email.body;

    new_div.append(div_p);

    document.querySelector('#emails-view').append(new_div);
}

async function archive_email(email) {
    await set_mail_archive(email.id, true);
    load_mailbox('inbox');
}