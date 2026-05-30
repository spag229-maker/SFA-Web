window.onload = function () {

    function saveProducts() {
        const cards = document.querySelectorAll('.products-card');
        localStorage.setItem('products', JSON.stringify([...cards].map(c => c.outerHTML)));
    }

    function loadProducts() {
        const saved = localStorage.getItem('products');
        if (!saved) { saveProducts(); return; }
        const section = document.querySelector('.products-section');
        section.innerHTML = '';
        JSON.parse(saved).forEach(html => {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            section.appendChild(temp.firstElementChild);
        });
    }

    function filterCards() {
        const query = document.querySelector('.SearchInt').value.toLowerCase().trim();
        const isCategoryMode = document.querySelector('.category-list').style.display !== 'none';
        const activeCategory = document.querySelector('.category-item-active')?.dataset.category || 'все';
        const activeStatus = document.querySelector('.date-item-active')?.dataset.status || null;

        document.querySelectorAll('.products-card').forEach(card => {
            const name = card.querySelector('.products-name').textContent.toLowerCase();
            const matchesSearch = name.includes(query);
            let matchesFilter = true;
            if (isCategoryMode) {
                matchesFilter = activeCategory === 'все' || card.dataset.category === activeCategory;
            } else {
                const statusEl = card.querySelector('.product-status');
                matchesFilter = !activeStatus || (statusEl && statusEl.classList.contains(activeStatus));
            }
            card.style.display = matchesSearch && matchesFilter ? 'flex' : 'none';
        });
    }

    // Удаление
    document.querySelector('.products-section').addEventListener('click', function (e) {
        const btn = e.target.closest('.deleteProduct');
        if (!btn) return;

        const card = btn.closest('.products-card');
        const name = card.querySelector('.products-name').textContent.trim();
        const count = card.querySelector('.count').textContent.trim();
        const statusEl = card.querySelector('.product-status');

        const history = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
        history.push({
            name,
            count,
            html: card.outerHTML
        });
        localStorage.setItem('deletedProducts', JSON.stringify(history));

        card.remove();
        saveProducts();
    });

    // Поиск
    document.querySelector('.SearchInt').addEventListener('input', filterCards);

    // Переключение вкладок
    document.getElementById('categoryTitle').addEventListener('click', function () {
        document.querySelector('.category-list').style.display = 'flex';
        document.querySelector('.date-list').style.display = 'none';
        this.classList.add('titleActive');
        document.getElementById('dateTitle').classList.remove('titleActive');
        filterCards();
    });

    document.getElementById('dateTitle').addEventListener('click', function () {
        document.querySelector('.date-list').style.display = 'flex';
        document.querySelector('.category-list').style.display = 'none';
        this.classList.add('titleActive');
        document.getElementById('categoryTitle').classList.remove('titleActive');
        filterCards();
    });

    // Фильтр категории
    document.querySelector('.category-list').addEventListener('click', function (e) {
        const item = e.target.closest('[class^="category-item"]');
        if (!item) return;
        document.querySelectorAll('[class^="category-item"]').forEach(el => el.className = 'category-item');
        item.className = 'category-item-active';
        filterCards();
    });

    // Фильтр срока годности
    document.querySelector('.date-list').addEventListener('click', function (e) {
        const item = e.target.closest('[class^="date-item"]');
        if (!item) return;
        document.querySelectorAll('[class^="date-item"]').forEach(el => el.className = 'date-item');
        item.className = 'date-item-active';
        filterCards();
    });

    loadProducts();
};