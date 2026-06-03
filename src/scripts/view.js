bash

cat > /mnt/user-data/outputs/view.js << 'EOF'
const API = 'https://groundlessly-chummy-firebrat.cloudpub.ru';

// ─── Вспомогательные функции API ───────────────────────────────────────────

async function apiGetItems() {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/items?token=${encodeURIComponent(token)}`);
    return res.json();
}

async function apiAddItems(items) {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/items`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, items })
    });
    return res.json();
}

async function apiDeleteItems(ids) {
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/items/delete`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, item_ids: ids })
    });
    return res.json();
}

async function apiUpdateItems(updates) {
    // updates: [[id, {field: value}], ...]
    const token = localStorage.getItem('userToken');
    const res   = await fetch(`${API}/items`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, items_upd: updates })
    });
    return res.json();
}

// ─── Построение карточки из объекта бэка ───────────────────────────────────

function buildCard(item) {
    const expDate = item.expiration ? new Date(item.expiration) : null;
    const diff    = expDate
        ? Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    let statusClass = 'fresh';
    if (diff === null)   statusClass = 'fresh';
    else if (diff <= 0)  statusClass = 'bad';
    else if (diff <= 3)  statusClass = 'medium';

    const article = document.createElement('article');
    article.className        = 'products-card';
    article.dataset.category = (item.category || '').toLowerCase();
    article.dataset.id       = item.id;

    article.innerHTML = `
        <div class="icon"></div>
        <div class="product">
            <span class="products-name">${item.name}</span>
            <div class="counter">
                <button class="BtnMinus">-</button>
                <span class="count">${item.quantity} <span>${item.unit}</span></span>
                <button class="BtnPlus">+</button>
            </div>
        </div>
        <div class="product-status ${statusClass}">
            <span class="days">${diff !== null ? diff : '—'} <span>дн.</span></span>
        </div>
        <button class="deleteProduct">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
                     xmlns:xlink="http://www.w3.org/1999/xlink">
                    <rect width="15" height="15" fill="url(#pattern0_47_233)"/>
                    <defs>
                        <pattern id="pattern0_47_233" patternContentUnits="objectBoundingBox" width="1" height="1">
                            <use xlink:href="#image0_47_233" transform="scale(0.00195312)"/>
                        </pattern>
                        <image id="image0_47_233" width="512" height="512" preserveAspectRatio="none"
                               xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAANRwAADUcBLg8HIQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7d15+G5VXffx995dBJhEUExDBcOhyZiYHAFnFBSlsCJRo2zAQ41SM/8es+ihpLQszdo8K8xyAEM0ARVKQSCUCkggmAQQQSmseNQoG3BxkdMRHn6cs9de677nvt8fDcq3dd73e+3fffb+u69r7YiIC4DIBAdgRuBBYBOQCYBuQSQCuBxwDNgFvALcAuwAnA88C1gHfAvcCewEUBAAA=="/>
                    </defs>
                </svg>
        </button>
    `;
    return article;
}

// ─── Фильтрация ────────────────────────────────────────────────────────────

function filterCards() {
    const query           = document.querySelector('.SearchInt').value.toLowerCase().trim();
    const isCategoryMode  = document.querySelector('.category-list').style.display !== 'none';
    const activeCategoryEl = document.querySelector('.category-item-active');
    const activeCategory  = activeCategoryEl ? activeCategoryEl.textContent.trim().toLowerCase() : 'все';
    const activeStatus    = document.querySelector('.date-item-active')?.dataset.status || null;

    document.querySelectorAll('.products-card').forEach(card => {
        const name          = card.querySelector('.products-name').textContent.toLowerCase();
        const matchesSearch = name.includes(query);
        let   matchesFilter = true;
        if (isCategoryMode) {
            matchesFilter = activeCategory === 'все' || card.dataset.category === activeCategory;
        } else {
            const statusEl = card.querySelector('.product-status');
            matchesFilter  = !activeStatus || (statusEl && statusEl.classList.contains(activeStatus));
        }
        card.style.display = matchesSearch && matchesFilter ? 'flex' : 'none';
    });
}

// ─── Основной блок ─────────────────────────────────────────────────────────

window.onload = async function () {

    // Загружаем продукты с бэка
    const section = document.querySelector('.products-section');

    try {
        const data = await apiGetItems();
        if (data.message === 'ok') {
            // Показываем только не удалённые
            data.items
                .filter(item => !item.deleted)
                .forEach(item => section.appendChild(buildCard(item)));
        } else if (data.message === 'bad token') {
            localStorage.removeItem('userToken');
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        console.error('Ошибка загрузки продуктов:', e);
    }

    // ── Удаление ─────────────────────────────────────────────
    section.addEventListener('click', async function (e) {
        const btn = e.target.closest('.deleteProduct');
        if (!btn) return;
        const card = btn.closest('.products-card');
        const id   = parseInt(card.dataset.id);

        try {
            await apiDeleteItems([id]);
        } catch (e) {
            console.error('Ошибка удаления:', e);
        }

        // Сохраняем в историю для settings.js
        const token   = localStorage.getItem('userToken');
        const history = JSON.parse(localStorage.getItem(`deletedProducts_${token}`) || '[]');
        history.push({
            id,
            name:  card.querySelector('.products-name').textContent.trim(),
            count: card.querySelector('.count').textContent.trim(),
            html:  card.outerHTML
        });
        localStorage.setItem(`deletedProducts_${token}`, JSON.stringify(history));

        card.remove();
    });

    // ── Поиск ────────────────────────────────────────────────
    document.querySelector('.SearchInt').addEventListener('input', filterCards);

    // ── Переключение вкладок ─────────────────────────────────
    document.getElementById('categoryTitle').addEventListener('click', function () {
        document.querySelector('.category-list').style.display = 'flex';
        document.querySelector('.date-list').style.display     = 'none';
        this.classList.add('titleActive');
        document.getElementById('dateTitle').classList.remove('titleActive');
        filterCards();
    });

    document.getElementById('dateTitle').addEventListener('click', function () {
        document.querySelector('.date-list').style.display     = 'flex';
        document.querySelector('.category-list').style.display = 'none';
        this.classList.add('titleActive');
        document.getElementById('categoryTitle').classList.remove('titleActive');
        filterCards();
    });

    // ── Фильтр категории ─────────────────────────────────────
    document.querySelector('.category-list').addEventListener('click', function (e) {
        const item = e.target.closest('[class^="category-item"]');
        if (!item) return;
        document.querySelectorAll('[class^="category-item"]').forEach(el => el.className = 'category-item');
        item.className = 'category-item-active';
        filterCards();
    });

    // ── Фильтр срока годности ────────────────────────────────
    document.querySelector('.date-list').addEventListener('click', function (e) {
        const item = e.target.closest('[class^="date-item"]');
        if (!item) return;
        document.querySelectorAll('[class^="date-item"]').forEach(el => el.className = 'date-item');
        item.className = 'date-item-active';
        filterCards();
    });

    // ── Открытие попапа добавления ───────────────────────────
    document.getElementById('addProduct').addEventListener('click', function () {
        document.getElementById('addProductOverlay').style.display = 'block';
    });

    document.getElementById('addProductOverlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('cancelProduct').addEventListener('click', function () {
        document.getElementById('addProductOverlay').style.display = 'none';
    });

    // ── Переключение единиц / категории в попапе ─────────────
    document.querySelector('.units-list').addEventListener('click', function (e) {
        const btn = e.target.closest('.unit-btn');
        if (!btn) return;
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('unit-btn-active'));
        btn.classList.add('unit-btn-active');
    });

    document.querySelector('.addPopup-category-list').addEventListener('click', function (e) {
        const btn = e.target.closest('.category-btn');
        if (!btn) return;
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn-active'));
        btn.classList.add('category-btn-active');
    });

    document.getElementById('productName').addEventListener('input', function () {
        this.style.borderColor = '#E9E9E9';
    });

    document.getElementById('productExpiry').addEventListener('change', function () {
        this.closest('.addPopup-date-wrapper').style.borderColor = '#E9E9E9';
    });

    // ── Добавление продукта ───────────────────────────────────
    document.getElementById('confirmProduct').addEventListener('click', async function () {
        const nameEl   = document.getElementById('productName');
        const expiryEl = document.getElementById('productExpiry');
        let valid = true;

        nameEl.style.borderColor = '#E9E9E9';
        expiryEl.closest('.addPopup-date-wrapper').style.borderColor = '#E9E9E9';

        if (!nameEl.value.trim()) {
            nameEl.style.borderColor = '#C2171A';
            valid = false;
        }
        if (!expiryEl.value) {
            expiryEl.closest('.addPopup-date-wrapper').style.borderColor = '#C2171A';
            valid = false;
        }
        if (!valid) return;

        const quantity = parseFloat(document.querySelector('.addPopup-count input').value) || 1;
        const unit     = document.querySelector('.unit-btn-active').textContent.trim();
        const category = document.querySelector('.category-btn-active').textContent.trim();

        const newItem = {
            name:       nameEl.value.trim(),
            category:   category.toLowerCase(),
            expiration: expiryEl.value,
            quantity,
            unit
        };

        try {
            const data = await apiAddItems([newItem]);
            if (data.message === 'ok') {
                // Перезагружаем весь список чтобы получить id с бэка
                section.innerHTML = '';
                const fresh = await apiGetItems();
                if (fresh.message === 'ok') {
                    fresh.items
                        .filter(item => !item.deleted)
                        .forEach(item => section.appendChild(buildCard(item)));
                }
            }
        } catch (e) {
            console.error('Ошибка добавления:', e);
        }

        // Закрываем и сбрасываем форму
        document.getElementById('addProductOverlay').style.display = 'none';
        nameEl.value   = '';
        expiryEl.value = '';
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('unit-btn-active'));
        document.querySelector('.unit-btn').classList.add('unit-btn-active');
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn-active'));
        document.querySelector('.category-btn').classList.add('category-btn-active');
    });

    // ── Попап изменения количества ────────────────────────────
    let currentCountCard = null;

    section.addEventListener('click', function (e) {
        const counter = e.target.closest('.counter');
        if (!counter) return;

        currentCountCard = counter.closest('.products-card');
        const name     = currentCountCard.querySelector('.products-name').textContent.trim();
        const countEl  = currentCountCard.querySelector('.count');
        const countText = countEl.childNodes[0].textContent.trim();
        const unit     = countEl.querySelector('span').textContent.trim();

        document.getElementById('changeCountTitle').textContent  = name;
        document.getElementById('changeCountInput').value        = countText;

        document.querySelectorAll('#changeCountUnits .unit-btn').forEach(btn => {
            btn.classList.toggle('unit-btn-active', btn.textContent.trim() === unit);
        });

        document.getElementById('productCounter').style.display = 'block';
    });

    document.getElementById('changeCountUnits').addEventListener('click', function (e) {
        const btn = e.target.closest('.unit-btn');
        if (!btn) return;
        document.querySelectorAll('#changeCountUnits .unit-btn').forEach(b => b.classList.remove('unit-btn-active'));
        btn.classList.add('unit-btn-active');
    });

    document.getElementById('productCounter').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('cancelCount').addEventListener('click', function () {
        document.getElementById('productCounter').style.display = 'none';
    });

    document.getElementById('confirmCount').addEventListener('click', async function () {
        if (!currentCountCard) return;

        const newCount = document.getElementById('changeCountInput').value || '1';
        const newUnit  = document.querySelector('#changeCountUnits .unit-btn-active').textContent.trim();
        const id       = parseInt(currentCountCard.dataset.id);

        try {
            await apiUpdateItems([[id, { quantity: parseFloat(newCount), unit: newUnit }]]);
        } catch (e) {
            console.error('Ошибка обновления:', e);
        }

        const countEl = currentCountCard.querySelector('.count');
        countEl.childNodes[0].textContent = newCount + ' ';
        countEl.querySelector('span').textContent = newUnit;

        document.getElementById('productCounter').style.display = 'none';
    });
};
EOF
Output

exit code 0
