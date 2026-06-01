window.onload = function() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const signBtn = document.getElementById('sign-button');
    const signHref = document.getElementById('sign-button-href');
    const logInBtn = document.getElementById('logInBtn');

    let nameGroup = document.querySelector('.input-group:has(#name)');
    let confirmGroup = document.querySelector('.input-group:has(#confirm-password)');
    let isLoginMode = false;

    // Только буквы в поле имени
    nameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
    });

    function validateName() {
        const val = nameInput.value.trim();
        return val.length > 0 && /^[a-zA-Zа-яА-ЯёЁ\s]+$/.test(val);
    }

    function validateEmail() {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    }

    function validatePassword() {
        return passwordInput.value.length >= 8;
    }

    function validateConfirm() {
        return confirmInput.value === passwordInput.value && confirmInput.value.length > 0;
    }

    function setError(input, errorId, isError) {
        const errorEl = document.getElementById(errorId);
        if (!input || !errorEl) return;
        if (isError) {
            input.style.borderColor = '#B90003';
            errorEl.style.opacity = '1';
        } else {
            input.style.borderColor = '#E9E9E9';
            errorEl.style.opacity = '0';
        }
    }

    // Сброс ошибок при вводе
    nameInput.addEventListener('input', () => setError(nameInput, 'err-name', false));
    emailInput.addEventListener('input', () => setError(emailInput, 'err-email', false));
    passwordInput.addEventListener('input', () => setError(passwordInput, 'err-password', false));
    confirmInput.addEventListener('input', () => setError(confirmInput, 'err-rpassword', false));

    function switchToLogin() {
        isLoginMode = true;
        document.querySelector('.input-group:has(#name)')?.remove();
        document.querySelector('.input-group:has(#confirm-password)')?.remove();
        logInBtn?.remove();
        document.getElementById('logIn')?.remove();
        signBtn.textContent = 'Войти в аккаунт';
        signHref.removeAttribute('href');
    }

    logInBtn.addEventListener('click', function (e) {
        e.preventDefault();
        switchToLogin();
    });

    signBtn.addEventListener('click', function (e) {
        e.preventDefault();

        if (isLoginMode) {
            // Режим входа
            const emailOk = validateEmail();
            const passwordOk = passwordInput.value.length > 0;

            setError(emailInput, 'err-email', !emailOk);
            setError(passwordInput, 'err-password', !passwordOk);

            if (!emailOk || !passwordOk) return;

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === emailInput.value.trim() && u.password === passwordInput.value);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'index.html';
            } else {
                alert('Логин или пароль не совпадают');
            }

        } else {
            // Режим регистрации
            const nameOk = validateName();
            const emailOk = validateEmail();
            const passwordOk = validatePassword();
            const confirmOk = validateConfirm();

            setError(nameInput, 'err-name', !nameOk);
            setError(emailInput, 'err-email', !emailOk);
            setError(passwordInput, 'err-password', !passwordOk);
            setError(confirmInput, 'err-rpassword', !confirmOk);

            if (!nameOk || !emailOk || !passwordOk || !confirmOk) return;

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const exists = users.find(u => u.email === emailInput.value.trim());
            if (exists) {
                alert('Пользователь с такой почтой уже зарегистрирован');
                return;
            }
            users.push({
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value
            });
            localStorage.setItem('users', JSON.stringify(users));

            switchToLogin();
        }
    });
};