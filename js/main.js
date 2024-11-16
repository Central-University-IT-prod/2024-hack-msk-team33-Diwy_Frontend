const domen="http://127.0.0.1:8011";
const storage = navigator.storage;
storage.setItem('currentGroupId', 1); 

function changePage(page){
    if (page == 1){
        document.querySelector('.scrolling-content').scrollTo(-1000, 0);
        document.querySelector(".button-choice-page#groups").classList.add('active');
        document.querySelector(".button-choice-page#archeve").classList.remove('active');
    }
    else if (page == 2) {
        document.querySelector('.scrolling-content').scrollTo(1000, 0);
        document.querySelector(".button-choice-page#groups").classList.remove('active');
        document.querySelector(".button-choice-page#archeve").classList.add('active');
    }
    else if (page == 3) {
        document.querySelector('.scrolling-content').scrollTo(-1000, 0);
        document.querySelector(".button-choice-page#transactions").classList.add('active');
        document.querySelector(".button-choice-page#calc").classList.remove('active');
    }
    else if (page == 4) {
        document.querySelector('.scrolling-content').scrollTo(1000, 0);
        document.querySelector(".button-choice-page#transactions").classList.remove('active');
        document.querySelector(".button-choice-page#calc").classList.add('active');
    }
}

$(document).ready(function () {
    $.ajaxSetup({
        headers:{
           "Authorization": `Bearer ${storage.getItem('authToken')}`, "tg_id": "{{sensitive_data}}"
        }
     });

    $.get(`${domen}/api/groups`, function (data) {
        $.each(data, function (index, item) {
            var groupDiv = $(`<div class="group" groupid=${item['group_id']}></div>`);
            var groupTitle = $('<h1 class="group-heading"></h1>').text(item['group_name']);
            groupDiv.prepend(groupTitle);

            if (item.status == 'active') {
                groupDiv.attr('onclick', "storage.setItem('currentGroupId', $(this).attr('groupid')); location.href='/group.html'");
                $('.active-groups').prepend(groupDiv);
            } else if (item.status == 'archived') {
                $('.archived-groups').prepend(groupDiv);
            }
        });
    });
    
});


function closeForm(form){
    $(`.${form}`).css({"bottom": -$(`.${form}`).height() - 50 + 'px'});
}

function openForm(form){
    $(`.${form}`).css({"bottom":  '0px'});
}

function createGroup(name){
    tgdata = window.Telegram.WebApp.initDataUnsafe['user'];
    fetch(`${domen}/api/groups`, {
        method: 'POST',
        headers: {'Content-Type': "application/json", "Authorization": `Bearer ${storage.getItem('authToken')}`},
        body: JSON.stringify({
            "group_name": name,
            
            
        })
    }).then(function(response) {
        if (!response.ok) {
            return Promise.reject(new Error(
                'Response failed: ' + response.status + ' (' + response.statusText + ')'
            ));
        }
    
        return response.json();
    }).then(function(data) {
        var groupid = data['group_id'];
        $.ajaxSetup({
            headers:{
               "Authorization": `Bearer ${storage.getItem('authToken')}`
            }
         });
        $.get(`${domen}/api/groups/${groupid}`, function (data) {
            var groupDiv = $(`<div class="group" groupid=${data['group_id']}></div>`);
            var groupTitle = $('<h1 class="group-heading"></h1>').text(data['group_name']);
            groupDiv.prepend(groupTitle);

            if (data['status'] == 'active') {
                groupDiv.attr('onclick', "storage.setItem('currentGroupId', $(this).attr('groupid')); location.href='/group.html'");
                $('.active-groups').prepend(groupDiv);
            } else if (item.status == 'archived') {
                $('.archived-groups').prepend(groupDiv);
            }
            
        })
    });
};

window.addEventListener('resize', () => {
    const viewportHeight = window.innerHeight;

    document.body.style.height = `${viewportHeight}px`;
});


function renderGroupPage(){
    $.ajaxSetup({
        headers:{
           "Authorization": `Bearer ${storage.getItem('authToken')}`
        }
     });

    $.get(`${domen}/api/expense/${storage.getItem("currentGroupId")}`, function (data) {
        $.each(data, function(expense_id, expenses){
            if (!expenses) return;
            var transactionDiv = $(`<div class="transaction"></div>`);
            var toggleButton = $(`<button class="toggle-btn">${expenses[0]['name']}<span class="arrow">▼</span></button>`);
            var transactionContent = $('<div class="transaction-content"></div>')
            transactionDiv.append(toggleButton);
            $.each(expenses, function(index, expense){
                var transactionMemberDiv = $(`<div class="transaction-member"><h1 style="margin: 0 !important">${expense['from_user_id']}</h1><p class='summ'>${expense['amount']}</p></div>`);
                transactionContent.append(transactionMemberDiv);
            });
            transactionDiv.append(transactionContent);
        });
    });

    var names = [];
    $.get(`${domen}/groups/${storage.getItem("currentGroupId")}/members")`, function(data){
        $.then(data, function(index, member){
            names.append([member["name"], member["tg_id"]]);
        })
    });

    $.each(names, function(index, nameful) {
        var name = nameful[0];
        var tg_id = nameful[1];
        $('#members-list').append(`
            <label for="${name}-checkbox">
                <input type="checkbox" id="${name}-checkbox" data-name="${name}" tg_id="${tg_id}" />
                ${name}
            </label>
        `);
    });

    $('#select-all').on('change', function() {
        const isChecked = $(this).prop('checked');
        $('input[type="checkbox"]').not(this).prop('checked', isChecked).toggleClass('checked', isChecked);
    });

    $('input[type="checkbox"]').not('#select-all').on('change', function() {
        $(this).toggleClass('checked', $(this).is(':checked'));
    });

    
};

// Функция обновления списка выбранных членов
function updateSelectedMembers() {
    $('.transaction-members-inputs').empty();
    $('input[type="checkbox"][data-name]:checked').each(function() {
        const memberName = $(this).attr('data-name');
        $('.transaction-members-inputs').append(`
            <div class="transaction-member">
                <span>${memberName}</span>
                <input type="number" class="transaction-input" data-name="${memberName}" value="0" />
            </div>
        `);
    });
}

// Функция сохранения транзакций
function makeTransaction() {
    $('.transaction-input').each(function() {
        const memberName = $(this).attr('data-name');
        const memberTgId = $(this).attr('tg_id');
        const amount = parseFloat($(this).val()) || 0;

        fetch(`${domen}/api/groups`, {
            method: 'POST',
            headers: {'Content-Type': "application/json", "Authorization": `Bearer ${storage.getItem('authToken')}`},
            body: JSON.stringify({
                "name": $("#transactionName").val(),
                "amount": $("#summ").val(),
                "payer_user_id": storage.getItem('tg_id'),
                "shares": [
                    {
                    "user_id": memberTgId,
                    "amount": amount
                    }
                ]
            })
        })
    
    });
    
    
}