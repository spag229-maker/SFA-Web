bash

cat > /mnt/user-data/outputs/settings.js << 'EOF'
const API = 'https://groundlessly-chummy-firebrat.cloudpub.ru';

// ─── Вспомогательные функции API ───────────────────────────────────────────

async function apiGetUser() {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/users?token=${encodeURIComponent(token)}`);
    return res.json();
}

async function apiChangeName(name) {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/users/name`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, name })
    });
    return res.json();
}

async function apiChangePassword(password) {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/users/password`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password })
    });
    return res.json();
}

// ─── Основной блок ─────────────────────────────────────────────────────────

window.onload = async function () {
    const token = localStorage.getItem('userToken');

    // Загружаем данные пользователя с бэка
    let currentUser = null;
    try {
        const data = await apiGetUser();
        if (data.message === 'ok') {
            currentUser = data.user;
            document.querySelector('.userName').textContent  = currentUser.name;
            document.querySelector('.userMail').textContent  = currentUser.email;
            document.querySelector('.avatar').textContent    = currentUser.name.charAt(0).toUpperCase();
        } else {
            // Токен не валиден — на страницу входа
            localStorage.removeItem('userToken');
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        console.error('Ошибка загрузки пользователя:', e);
    }

    // ── История удалённых продуктов ───────────────────────────
    // Ключ истории привязан к токену (как было к email)
    function getHistoryKey() { return `deletedProducts_${token}`; }

    function renderHistory() {
        const popup   = document.getElementById('historyPopup');
        const history = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');

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

    // Восстановление продукта из истории → отправляем на бэк
    document.getElementById('historyPopup').addEventListener('click', async function (e) {
        const btn = e.target.closest('.deletedProduct');
        if (!btn) return;

        const index   = parseInt(btn.dataset.index);
        const history = JSON.parse(localStorage.getItem(getHistoryKey()) || '[]');
        const item    = history[index];

        // Восстанавливаем через POST /items
        try {
            await fetch(`${API}/items`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    token,
                    items: [{
                        name:       item.name,
                        category:   'прочее',
                        expiration: null,
                        quantity:   1,
                        unit:       'шт'
                    }]
                })
            });
        } catch (e) {
            console.error('Ошибка восстановления продукта:', e);
        }

        history.splice(index, 1);
        localStorage.setItem(getHistoryKey(), JSON.stringify(history));
        renderHistory();
    });

    document.getElementById('clearHistory').addEventListener('click', function () {
        localStorage.removeItem(getHistoryKey());
        renderHistory();
    });

    // ── Смена имени ───────────────────────────────────────────
    document.getElementById('name').addEventListener('click', function () {
        document.getElementById('newNameInput').value            = currentUser ? currentUser.name : '';
        document.getElementById('newNameInput').style.borderColor = '#E9E9E9';
        document.getElementById('nameChangeOverlay').style.display = 'block';
    });

    document.getElementById('cancelNameChange').addEventListener('click', function () {
        document.getElementById('nameChangeOverlay').style.display = 'none';
    });

    document.getElementById('nameChangeOverlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('confirmNameChange').addEventListener('click', async function () {
        const input = document.getElementById('newNameInput');
        const val   = input.value.trim();

        if (!val || !/^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(val)) {
            input.style.borderColor = '#C2171A';
            return;
        }

        try {
            const data = await apiChangeName(val);
            if (data.message === 'ok') {
                currentUser.name = val;
                document.querySelector('.userName').textContent = val;
                document.querySelector('.avatar').textContent   = val.charAt(0).toUpperCase();
                document.getElementById('nameChangeOverlay').style.display = 'none';
            } else {
                alert('Ошибка смены имени: ' + data.message);
            }
        } catch (e) {
            console.error('Ошибка смены имени:', e);
        }
    });

    document.getElementById('newNameInput').addEventListener('input', function () {
        this.style.borderColor = '#E9E9E9';
    });

    // ── Смена пароля ──────────────────────────────────────────
    document.getElementById('passwordChange').addEventListener('click', function () {
        ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
            document.getElementById(id).value            = '';
            document.getElementById(id).style.borderColor = '#E9E9E9';
        });
        document.getElementById('passwordChangeOverlay').style.display = 'block';
    });

    document.getElementById('cancelPasswordChange').addEventListener('click', function () {
        document.getElementById('passwordChangeOverlay').style.display = 'none';
    });

    document.getElementById('passwordChangeOverlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('confirmPasswordChange').addEventListener('click', async function () {
        const current = document.getElementById('currentPasswordInput');
        const newPass = document.getElementById('newPasswordInput');
        const confirm = document.getElementById('confirmPasswordInput');
        let valid = true;

        [current, newPass, confirm].forEach(el => el.style.borderColor = '#E9E9E9');

        // Проверяем текущий пароль через POST /login
        try {
            const loginCheck = await fetch(`${API}/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: currentUser.email, password: current.value })
            });
            const loginData = await loginCheck.json();
            if (loginData.message !== 'ok') {
                current.style.borderColor = '#C2171A';
                valid = false;
            }
        } catch (e) {
            console.error('Ошибка проверки пароля:', e);
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

        try {
            const data = await apiChangePassword(newPass.value);
            if (data.message === 'ok') {
                document.getElementById('passwordChangeOverlay').style.display = 'none';
            } else {
                alert('Ошибка смены пароля: ' + data.message);
            }
        } catch (e) {
            console.error('Ошибка смены пароля:', e);
        }
    });

    ['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
        document.getElementById(id).addEventListener('input', function () {
            this.style.borderColor = '#E9E9E9';
        });
    });
};
EOF
Output

exit code 0
Done

You are out of free messages until 4:20 PM
Keep working
