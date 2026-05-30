window.onload = function () {

    function renderHistory() {
        const popup = document.getElementById('historyPopup');
        const history = JSON.parse(localStorage.getItem('deletedProducts') || '[]');

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

    // Открытие попапа
    document.getElementById('history').addEventListener('click', function () {
        renderHistory();
        document.querySelector('.popup-overlay').style.display = 'block';
    });

    // Закрытие по оверлею
    document.querySelector('.popup-overlay').addEventListener('click', function (e) {
        if (e.target === this) this.style.display = 'none';
    });

    // Кнопка "Вернуть"
    document.getElementById('historyPopup').addEventListener('click', function (e) {
        const btn = e.target.closest('.deletedProduct');
        if (!btn) return;

        const index = parseInt(btn.dataset.index);
        const history = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
        const item = history[index];

        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.push(item.html);
        localStorage.setItem('products', JSON.stringify(products));

        history.splice(index, 1);
        localStorage.setItem('deletedProducts', JSON.stringify(history));

        renderHistory();
    });

    // Очистить историю
    document.getElementById('clearHistory').addEventListener('click', function () {
        localStorage.removeItem('deletedProducts');
        renderHistory();
    });

};