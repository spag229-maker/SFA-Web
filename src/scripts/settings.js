window.onload = function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userKey = currentUser ? currentUser.email : 'guest';

    if (currentUser) {
        document.querySelector('.userName').textContent = currentUser.name;
        document.querySelector('.userMail').textContent = currentUser.email;
        document.querySelector('.avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    }

    function renderHistory() {
        const popup = document.getElementById('historyPopup');
        const history = JSON.parse(localStorage.getItem(`deletedProducts_${userKey}`) || '[]');

        popup.querySelectorAll('.popupPlate, p').forEach(el => el.remove());

        if (history.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'История пуста';
            empty.style.color = '#868686';
            popup.appendChild(empty);
            return;
        }

        history.forEach((item, index) => {
            const article = document.createElement('article');
            article.className = 'popupPlate';
            article.innerHTML = `
                <div class="product">
                    <span class="products-name">${item.name}</span>
                    <div class="count">${item.count}</div>
                </div>
                <span class="deleteStatus">Удалён</span>
                <button class="deletedProduct" data-index="${index}">
                    <span>Вернуть</span>
                </button>
            `;
            popup.appendChild(article);
        });
    }

    document.getElementById('history').addEventListener('click', function () {
        renderHistory();
        document.querySelector('.popup-overlay').style.display = 'block';
    });

    document.querySelector('.popup-overlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('historyPopup').addEventListener('click', function (e) {
        const btn = e.target.closest('.deletedProduct');
        if (!btn) return;

        const index = parseInt(btn.dataset.index);
        const history = JSON.parse(localStorage.getItem(`deletedProducts_${userKey}`) || '[]');
        const item = history[index];

        const products = JSON.parse(localStorage.getItem(`products_${userKey}`) || '[]');
        products.push(item.html);
        localStorage.setItem(`products_${userKey}`, JSON.stringify(products));

        history.splice(index, 1);
        localStorage.setItem(`deletedProducts_${userKey}`, JSON.stringify(history));

        renderHistory();
    });

    document.getElementById('clearHistory').addEventListener('click', function () {
        localStorage.removeItem(`deletedProducts_${userKey}`);
        renderHistory();
    });


    // Открытие попапа имени
    document.getElementById('name').addEventListener('click', function () {
        document.getElementById('newNameInput').value = currentUser ? currentUser.name : '';
        document.getElementById('newNameInput').style.borderColor = '#E9E9E9';
        document.getElementById('nameChangeOverlay').style.display = 'block';
    });

// Закрытие попапа имени
    document.getElementById('cancelNameChange').addEventListener('click', function () {
        document.getElementById('nameChangeOverlay').style.display = 'none';
    });
    document.getElementById('nameChangeOverlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

// Сохранение имени
    document.getElementById('confirmNameChange').addEventListener('click', function () {
        const input = document.getElementById('newNameInput');
        const val = input.value.trim();

        if (!val || !/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(val)) {
            input.style.borderColor = '#C2171A';
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.email === currentUser.email);
        if (idx !== -1) {
            users[idx].name = val;
            localStorage.setItem('users', JSON.stringify(users));
            currentUser.name = val;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.querySelector('.userName').textContent = val;
            document.querySelector('.avatar').textContent = val.charAt(0).toUpperCase();
        }

        document.getElementById('nameChangeOverlay').style.display = 'none';
    });

// Сброс рамки при вводе имени
    document.getElementById('newNameInput').addEventListener('input', function () {
        this.style.borderColor = '#E9E9E9';
    });

// Открытие попапа пароля
    document.getElementById('passwordChange').addEventListener('click', function () {
        ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
            document.getElementById(id).value = '';
            document.getElementById(id).style.borderColor = '#E9E9E9';
        });
        document.getElementById('passwordChangeOverlay').style.display = 'block';
    });

// Закрытие попапа пароля
    document.getElementById('cancelPasswordChange').addEventListener('click', function () {
        document.getElementById('passwordChangeOverlay').style.display = 'none';
    });
    document.getElementById('passwordChangeOverlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

// Сохранение пароля
    document.getElementById('confirmPasswordChange').addEventListener('click', function () {
        const current = document.getElementById('currentPasswordInput');
        const newPass = document.getElementById('newPasswordInput');
        const confirm = document.getElementById('confirmPasswordInput');
        let valid = true;

        [current, newPass, confirm].forEach(el => el.style.borderColor = '#E9E9E9');

        if (current.value !== currentUser.password) {
            current.style.borderColor = '#C2171A';
            valid = false;
        }
        if (newPass.value.length < 8) {
            newPass.style.borderColor = '#C2171A';
            valid = false;
        }
        if (confirm.value !== newPass.value) {
            confirm.style.borderColor = '#C2171A';
            valid = false;
        }

        if (!valid) return;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.email === currentUser.email);
        if (idx !== -1) {
            users[idx].password = newPass.value;
            localStorage.setItem('users', JSON.stringify(users));
            currentUser.password = newPass.value;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        document.getElementById('passwordChangeOverlay').style.display = 'none';
    });

// Сброс рамок при вводе пароля
    ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
        document.getElementById(id).addEventListener('input', function () {
            this.style.borderColor = '#E9E9E9';
        });
    });
};