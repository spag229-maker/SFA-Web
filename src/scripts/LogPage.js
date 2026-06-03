const API = 'https://groundlessly-chummy-firebrat.cloudpub.ru/';

window.onload = function () {
    document.querySelectorAll('.register-form input').forEach(i => i.value = '');

    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signBtn       = document.getElementById('sign-button');
    const signHref      = document.getElementById('sign-button-href');
    const logInBtn      = document.getElementById('logInBtn');
    const logInLink     = document.getElementById('logIn');
    const pageTitle     = document.querySelector('.register-page h1');

    const nameGroup    = document.querySelector('.input-group:has(#name)');
    const confirmGroup = document.querySelector('.input-group:has(#confirm-password)');
    const nameInput    = document.getElementById('name');
    const confirmInput = document.getElementById('confirm-password');

    // Состояние
    let isLoginMode  = false;
    let isForgotMode = false;  // шаг 1: ввод почты
    let isForgotVerify = false; // шаг 2: ввод кода
    let isForgotNewPass = false; // шаг 3: ввод нового пароля
    let isVerifyMode = false;   // верификация при регистрации
    let pendingRegUser = null;  // { name, email, password }
    let emailToken = null;      // почтовый JWT-токен после подтверждения кода

    // Только буквы в поле имени
    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
    });

    // --- Валидация ---
    function validateName()     { const v = nameInput.value.trim(); return v.length > 0 && /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(v); }
    function validateEmail()    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()); }
    function validatePassword() { return passwordInput.value.length >= 8; }
    function validateConfirm()  { return confirmInput.value === passwordInput.value && confirmInput.value.length > 0; }

    function setError(input, errorId, isError, msg) {
        const el = document.getElementById(errorId);
        if (!input || !el) return;
        input.style.borderColor = isError ? '#B90003' : '#E9E9E9';
        if (msg) el.textContent = msg;
        el.style.opacity = isError ? '1' : '0';
    }

    function clearErrors() {
        setError(nameInput,     'err-name',     false);
        setError(emailInput,    'err-email',    false);
        setError(passwordInput, 'err-password', false);
        setError(confirmInput,  'err-rpassword',false);
    }

    function clearFields() {
        document.querySelectorAll('.register-form input').forEach(i => i.value = '');
        [passwordInput, confirmInput].forEach(inp => { inp.type = 'password'; });
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.querySelector('.eye-icon').style.display     = '';
            btn.querySelector('.eye-off-icon').style.display = 'none';
        });
        clearErrors();
    }

    // --- Переключение видимости пароля ---
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input  = document.getElementById(this.dataset.target);
            const isText = input.type === 'text';
            input.type   = isText ? 'password' : 'text';
            this.querySelector('.eye-icon').style.display     = isText ? '' : 'none';
            this.querySelector('.eye-off-icon').style.display = isText ? 'none' : '';
        });
    });

    nameInput.addEventListener('input',     () => setError(nameInput,     'err-name',     false));
    emailInput.addEventListener('input',    () => setError(emailInput,    'err-email',    false));
    passwordInput.addEventListener('input', () => setError(passwordInput, 'err-password', false));
    confirmInput.addEventListener('input',  () => setError(confirmInput,  'err-rpassword',false));

    // ============================================================
    //  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ДИНАМИЧЕСКИХ ПОЛЕЙ
    // ============================================================

    function showGroup(selector, show) {
        const el = document.querySelector(selector);
        if (el) el.style.display = show ? '' : 'none';
    }

    function createTempGroup(id, placeholder, errorId, errorText, type = 'text') {
        if (document.getElementById(id)) return;
        const form  = document.querySelector('.register-form');
        const group = document.createElement('div');
        group.className = 'input-group temp-group';
        group.innerHTML = `
            <label for="${id}"></label>
            <input id="${id}" type="${type}" placeholder="${placeholder}" autocomplete="off">
            <span class="error-message" id="${errorId}">${errorText}</span>
        `;
        form.insertBefore(group, document.getElementById('sign-button-href'));
        // Сброс ошибки при вводе
        document.getElementById(id).addEventListener('input', () => {
            const err = document.getElementById(errorId);
            const inp = document.getElementById(id);
            if (err) err.style.opacity = '0';
            if (inp) inp.style.borderColor = '#E9E9E9';
        });
    }

    function removeTempGroups() {
        document.querySelectorAll('.temp-group').forEach(el => el.remove());
    }

    function showAllRegisterFields() {
        showGroup('.input-group:has(#name)',             true);
        showGroup('.input-group:has(#email)',            true);
        showGroup('.input-group:has(#password)',         true);
        showGroup('.input-group:has(#confirm-password)', true);
    }

    function hideAllFields() {
        showGroup('.input-group:has(#name)',             false);
        showGroup('.input-group:has(#email)',            false);
        showGroup('.input-group:has(#password)',         false);
        showGroup('.input-group:has(#confirm-password)', false);
    }

    // ============================================================
    //  КНОПКА «ЗАБЫЛ ПАРОЛЬ»
    // ============================================================

    function getForgotBtn() { return document.getElementById('forgotBtn'); }

    function toggleForgotBtn(show) {
        let btn = getForgotBtn();
        if (show && !btn) {
            btn = document.createElement('button');
            btn.id          = 'forgotBtn';
            btn.type        = 'button';
            btn.className   = 'forgot-btn';
            btn.textContent = 'Забыл пароль';
            logInBtn.parentNode.insertBefore(btn, logInBtn.nextSibling);
            btn.addEventListener('click', enterForgotStep1);
        }
        if (btn) btn.style.display = show ? '' : 'none';
    }

    // ============================================================
    //  ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ
    // ============================================================

    function resetAllFlags() {
        isLoginMode    = false;
        isForgotMode   = false;
        isForgotVerify = false;
        isForgotNewPass = false;
        isVerifyMode   = false;
        pendingRegUser = null;
        emailToken     = null;
    }

    function switchToLogin() {
        resetAllFlags();
        isLoginMode = true;
        removeTempGroups();
        hideAllFields();
        showGroup('.input-group:has(#email)',    true);
        showGroup('.input-group:has(#password)', true);
        pageTitle.textContent  = 'Вход';
        signBtn.textContent    = 'Войти в аккаунт';
        signHref.removeAttribute('href');
        logInLink.textContent  = 'Зарегистрировать новый аккаунт';
        logInBtn.style.display = '';
        toggleForgotBtn(true);
        clearFields();
    }

    function switchToRegister() {
        resetAllFlags();
        removeTempGroups();
        showAllRegisterFields();
        pageTitle.textContent  = 'Регистрация';
        signBtn.textContent    = 'Создать аккаунт';
        signHref.setAttribute('href', '#');
        logInLink.textContent  = 'Войти в существующий аккаунт';
        logInBtn.style.display = '';
        toggleForgotBtn(false);
        clearFields();
    }

    // ── Восстановление пароля: шаг 1 — ввод почты ────────────
    function enterForgotStep1() {
        resetAllFlags();
        isForgotMode = true;
        removeTempGroups();
        hideAllFields();
        pageTitle.textContent  = 'Восстановление пароля';
        signBtn.textContent    = 'Отправить код';
        logInBtn.style.display = 'none';
        toggleForgotBtn(false);
        createTempGroup('forgot-email', 'Введите вашу почту', 'err-forgot-email', 'Введите корректный E-mail');
    }

    // ── Восстановление пароля: шаг 2 — ввод кода ─────────────
    function enterForgotStep2() {
        isForgotMode   = false;
        isForgotVerify = true;
        removeTempGroups();
        pageTitle.textContent = 'Введите код из письма';
        signBtn.textContent   = 'Подтвердить код';
        createTempGroup('forgot-code', 'Код из письма', 'err-forgot-code', 'Неверный код');
    }

    // ── Восстановление пароля: шаг 3 — новый пароль ──────────
    function enterForgotStep3() {
        isForgotVerify  = false;
        isForgotNewPass = true;
        removeTempGroups();
        pageTitle.textContent = 'Новый пароль';
        signBtn.textContent   = 'Сохранить пароль';
        createTempGroup('new-password',  'Новый пароль',        'err-new-pass',     'Минимум 8 символов', 'password');
        createTempGroup('new-password2', 'Повторите пароль',    'err-new-pass2',    'Пароли не совпадают', 'password');
    }

    // ── Верификация почты при регистрации ─────────────────────
    function enterRegVerifyMode(user) {
        pendingRegUser = user;
        isVerifyMode   = true;
        removeTempGroups();
        hideAllFields();
        pageTitle.textContent  = 'Подтверждение почты';
        signBtn.textContent    = 'Подтвердить';
        logInBtn.style.display = 'none';
        toggleForgotBtn(false);
        createTempGroup('verify-code', 'Код из письма', 'err-verify-code', 'Неверный код');
    }

    // ============================================================
    //  КНОПКА «НАЗАД / СМЕНИТЬ РЕЖИМ»
    // ============================================================

    logInBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isLoginMode) {
            switchToRegister();
        } else {
            switchToLogin();
        }
    });

    // ============================================================
    //  ВСПОМОГАТЕЛЬНЫЕ ЗАПРОСЫ
    // ============================================================

    function setBtnLoading(text) {
        signBtn.disabled    = true;
        signBtn.textContent = text;
    }

    function resetBtn(text) {
        signBtn.disabled    = false;
        signBtn.textContent = text;
    }

    async function sendVerificationCode(email) {
        const res  = await fetch(`${API}/verification-code?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        return data.message === 'ok';
    }

    async function confirmVerificationCode(email, code) {
        const res  = await fetch(`${API}/verification-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        // message: "ok" | "invalid"
        return data.message === 'ok' ? data.token : null;
    }

    // ============================================================
    //  ОСНОВНАЯ КНОПКА
    // ============================================================

    signBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        // ── Регистрация: шаг верификации ──────────────────────
        if (isVerifyMode) {
            const codeInput = document.getElementById('verify-code');
            const code = codeInput ? codeInput.value.trim() : '';
            if (!code) {
                setError(codeInput, 'err-verify-code', true, 'Введите код');
                return;
            }
            setBtnLoading('Проверка...');
            const token = await confirmVerificationCode(pendingRegUser.email, code);
            if (!token) {
                resetBtn('Подтвердить');
                setError(codeInput, 'err-verify-code', true, 'Неверный код');
                return;
            }
            // Код верный — создаём аккаунт: POST /users
            const res  = await fetch(`${API}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:     pendingRegUser.name,
                    password: pendingRegUser.password,
                    token:    token
                })
            });
            const data = await res.json();
            resetBtn('Подтвердить');
            if (data.message === 'ok') {
                switchToLogin();
            } else if (data.message === 'email exists') {
                alert('Пользователь с такой почтой уже существует');
                switchToLogin();
            } else {
                alert('Ошибка создания аккаунта: ' + data.message);
            }
            return;
        }

        // ── Восстановление: шаг 1 — отправить код ────────────
        if (isForgotMode) {
            const emailEl = document.getElementById('forgot-email');
            const email   = emailEl ? emailEl.value.trim() : '';
            const ok      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            setError(emailEl, 'err-forgot-email', !ok, 'Введите корректный E-mail');
            if (!ok) return;

            setBtnLoading('Отправка...');
            const sent = await sendVerificationCode(email);
            resetBtn('Отправить код');
            if (sent) {
                // Сохраняем почту для следующих шагов
                signBtn._forgotEmail = email;
                enterForgotStep2();
            } else {
                setError(emailEl, 'err-forgot-email', true, 'Не удалось отправить код. Проверьте почту.');
            }
            return;
        }

        // ── Восстановление: шаг 2 — подтвердить код ──────────
        if (isForgotVerify) {
            const codeEl = document.getElementById('forgot-code');
            const code   = codeEl ? codeEl.value.trim() : '';
            if (!code) {
                setError(codeEl, 'err-forgot-code', true, 'Введите код');
                return;
            }
            setBtnLoading('Проверка...');
            const token = await confirmVerificationCode(signBtn._forgotEmail, code);
            resetBtn('Подтвердить код');
            if (!token) {
                setError(codeEl, 'err-forgot-code', true, 'Неверный код');
                return;
            }
            emailToken = token;
            enterForgotStep3();
            return;
        }

        // ── Восстановление: шаг 3 — сохранить новый пароль ───
        if (isForgotNewPass) {
            const newPassEl  = document.getElementById('new-password');
            const newPass2El = document.getElementById('new-password2');
            const pass  = newPassEl  ? newPassEl.value  : '';
            const pass2 = newPass2El ? newPass2El.value : '';
            const passOk    = pass.length >= 8;
            const confirmOk = pass === pass2 && pass2.length > 0;
            setError(newPassEl,  'err-new-pass',  !passOk,    'Минимум 8 символов');
            setError(newPass2El, 'err-new-pass2', !confirmOk, 'Пароли не совпадают');
            if (!passOk || !confirmOk) return;

            setBtnLoading('Сохранение...');
            // PUT /users/password с почтовым токеном
            const res  = await fetch(`${API}/users/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pass, token: emailToken })
            });
            const data = await res.json();
            resetBtn('Сохранить пароль');
            if (data.message === 'ok') {
                alert('Пароль успешно изменён');
                switchToLogin();
            } else if (data.message === 'no user with this email') {
                alert('Пользователь с такой почтой не найден');
                switchToLogin();
            } else {
                alert('Ошибка: ' + data.message);
            }
            return;
        }

        // ── Вход ──────────────────────────────────────────────
        if (isLoginMode) {
            const emailOk    = validateEmail();
            const passwordOk = passwordInput.value.length > 0;
            setError(emailInput,    'err-email',    !emailOk,    'Введите корректный E-mail');
            setError(passwordInput, 'err-password', !passwordOk, 'Введите пароль');
            if (!emailOk || !passwordOk) return;

            setBtnLoading('Вход...');
            const res  = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email:    emailInput.value.trim(),
                    password: passwordInput.value
                })
            });
            const data = await res.json();
            resetBtn('Войти в аккаунт');
            if (data.message === 'ok') {
                localStorage.setItem('userToken', data.token);
                window.location.href = 'view.html';
            } else {
                alert('Логин или пароль не совпадают');
            }
            return;
        }

        // ── Регистрация ───────────────────────────────────────
        const nameOk    = validateName();
        const emailOk   = validateEmail();
        const passOk    = validatePassword();
        const confirmOk = validateConfirm();
        setError(nameInput,     'err-name',     !nameOk);
        setError(emailInput,    'err-email',    !emailOk);
        setError(passwordInput, 'err-password', !passOk);
        setError(confirmInput,  'err-rpassword',!confirmOk);
        if (!nameOk || !emailOk || !passOk || !confirmOk) return;

        setBtnLoading('Отправка...');
        const sent = await sendVerificationCode(emailInput.value.trim());
        resetBtn('Создать аккаунт');
        if (!sent) {
            setError(emailInput, 'err-email', true, 'Не удалось отправить код. Проверьте почту.');
            return;
        }
        enterRegVerifyMode({
            name:     nameInput.value.trim(),
            email:    emailInput.value.trim(),
            password: passwordInput.value
        });
    });
};