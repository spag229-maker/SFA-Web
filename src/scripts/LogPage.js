window.onload = function () {
    // --- Очистка полей при загрузке ---
    document.querySelectorAll('.register-form input').forEach(i => i.value = '');

    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signBtn       = document.getElementById('sign-button');
    const signHref      = document.getElementById('sign-button-href');
    const logInBtn      = document.getElementById('logInBtn');
    const logInLink     = document.getElementById('logIn');
    const pageTitle     = document.querySelector('.register-page h1');

    let isLoginMode = false;

    const nameGroup    = document.querySelector('.input-group:has(#name)');
    const confirmGroup = document.querySelector('.input-group:has(#confirm-password)');
    const nameInput    = document.getElementById('name');
    const confirmInput = document.getElementById('confirm-password');

    // Только буквы в поле имени
    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
    });

    // --- Валидация ---
    function validateName()     { const v = nameInput.value.trim(); return v.length > 0 && /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(v); }
    function validateEmail()    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()); }
    function validatePassword() { return passwordInput.value.length >= 8; }
    function validateConfirm()  { return confirmInput.value === passwordInput.value && confirmInput.value.length > 0; }

    function setError(input, errorId, isError) {
        const el = document.getElementById(errorId);
        if (!input || !el) return;
        input.style.borderColor = isError ? '#B90003' : '#E9E9E9';
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
        // Сбрасываем все поля пароля обратно в тип password (скрыть текст)
        [passwordInput, confirmInput].forEach(input => {
            input.type = 'password';
        });
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.querySelector('.eye-icon').style.display    = '';
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

    // Сброс ошибок при вводе
    nameInput.addEventListener('input',     () => setError(nameInput,     'err-name',     false));
    emailInput.addEventListener('input',    () => setError(emailInput,    'err-email',    false));
    passwordInput.addEventListener('input', () => setError(passwordInput, 'err-password', false));
    confirmInput.addEventListener('input',  () => setError(confirmInput,  'err-rpassword',false));

    // --- Переключение в режим входа ---
    function switchToLogin() {
        isLoginMode = true;
        nameGroup.style.display    = 'none';
        confirmGroup.style.display = 'none';
        pageTitle.textContent      = 'Авторизация';
        signBtn.textContent        = 'Войти в аккаунт';
        signHref.removeAttribute('href');
        logInLink.textContent      = 'Зарегистрировать новый аккаунт';
        clearFields();
    }

    // --- Переключение обратно в режим регистрации ---
    function switchToRegister() {
        isLoginMode = false;
        nameGroup.style.display    = '';
        confirmGroup.style.display = '';
        pageTitle.textContent      = 'Регистрация';
        signBtn.textContent        = 'Создать аккаунт';
        signHref.setAttribute('href', '#');
        logInLink.textContent      = 'Войти в существующий аккаунт';
        clearFields();
    }

    // --- Клик по ссылке входа/регистрации ---
    logInBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isLoginMode) {
            switchToRegister();
        } else {
            switchToLogin();
        }
    });

    // --- Основная кнопка ---
    signBtn.addEventListener('click', function (e) {
        e.preventDefault();

        if (isLoginMode) {
            const emailOk    = validateEmail();
            const passwordOk = passwordInput.value.length > 0;

            setError(emailInput,    'err-email',    !emailOk);
            setError(passwordInput, 'err-password', !passwordOk);
            if (!emailOk || !passwordOk) return;

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user  = users.find(u => u.email === emailInput.value.trim() && u.password === passwordInput.value);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'view.html';
            } else {
                alert('Логин или пароль не совпадают');
            }

        } else {
            const nameOk    = validateName();
            const emailOk   = validateEmail();
            const passOk    = validatePassword();
            const confirmOk = validateConfirm();

            setError(nameInput,     'err-name',     !nameOk);
            setError(emailInput,    'err-email',    !emailOk);
            setError(passwordInput, 'err-password', !passOk);
            setError(confirmInput,  'err-rpassword',!confirmOk);
            if (!nameOk || !emailOk || !passOk || !confirmOk) return;

            const users  = JSON.parse(localStorage.getItem('users') || '[]');
            const exists = users.find(u => u.email === emailInput.value.trim());
            if (exists) {
                alert('Пользователь с такой почтой уже зарегистрирован');
                return;
            }

            users.push({
                name:     nameInput.value.trim(),
                email:    emailInput.value.trim(),
                password: passwordInput.value
            });
            localStorage.setItem('users', JSON.stringify(users));
            switchToLogin();
        }
    });
};