import recipes from './recipesData.js';

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const userKey = currentUser ? currentUser.email : 'guest';
const userProducts = JSON.parse(localStorage.getItem(`products_${userKey}`) || '[]');

const userProductNames = userProducts.map(html => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.querySelector('.products-name')?.textContent.trim().toLowerCase() || '';
});

const section = document.querySelector('.recipesSection');

// Активный nav
document.querySelectorAll('#nav-list a').forEach(link => {
    link.classList.remove('active');
    const line = link.querySelector('.rounded-line-active');
    if (line) line.className = 'rounded-line';
});
const recipesLink = document.querySelector('#nav-list a[href="index.html"]');
if (recipesLink) {
    recipesLink.classList.add('active');
    const line = recipesLink.querySelector('.rounded-line');
    if (line) line.classList.add('rounded-line-active');
}

function hasIngredient(ingredientName) {
    return userProductNames.some(p => p.includes(ingredientName.toLowerCase()));
}

function renderRecipes(list) {
    section.innerHTML = '';
    list.forEach((recipe) => {
        const article = document.createElement('article');
        article.className = 'recipe-card';
        article.innerHTML = `
            <div class="recipe-card-main">
                <div class="recipe-icon">${recipe.icon}</div>
                <div class="recipe-info">
                    <span class="recipe-name">${recipe.name}</span>
                    <span class="recipe-desc">${recipe.description}</span>
                </div>
                <div class="recipe-time">⏱ ${recipe.cook_time_minutes} мин</div>
            </div>
            <div class="recipe-details" style="display: none;">
                <div class="recipe-ingredients">
                    <h3>Ингредиенты (${recipe.servings} порц.)</h3>
                    <ul>
                        ${recipe.ingredients.map(i => {
            const available = hasIngredient(i.name);
            return `
                            <li class="ingredient-item ${available ? 'ingredient-available' : 'ingredient-missing'}">
                                <span class="ingredient-status-icon">${available
                ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" fill="#e6f7ee" stroke="#2ecc71" stroke-width="1.5"/><path d="M4.5 8.2L6.8 10.5L11.5 5.5" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" fill="#fdecea" stroke="#e74c3c" stroke-width="1.5"/><path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/></svg>`
            }</span>
                                <span class="ingredient-name">${i.name} — ${i.quantity}${i.optional ? ' <span class="optional">(по желанию)</span>' : ''}</span>
                            </li>`;
        }).join('')}
                    </ul>
                </div>
                <div class="recipe-instructions">
                    <h3>Приготовление</h3>
                    <p>${recipe.instructions}</p>
                </div>
            </div>
        `;
        section.appendChild(article);
    });
}

renderRecipes(recipes);

// Открытие/закрытие
section.addEventListener('click', function (e) {
    const card = e.target.closest('.recipe-card');
    if (!card) return;

    const details = card.querySelector('.recipe-details');
    const isOpen = details.style.display !== 'none';

    document.querySelectorAll('.recipe-details').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('recipe-card-open'));

    if (!isOpen) {
        details.style.display = 'block';
        card.classList.add('recipe-card-open');
    }
});

// Фильтры
function hasEnoughIngredients(recipe) {
    return recipe.ingredients
        .filter(i => !i.optional)
        .every(i => userProductNames.some(p => p.includes(i.name.toLowerCase())));
}

function hasSomeIngredients(recipe) {
    return recipe.ingredients.some(i =>
        userProductNames.some(p => p.includes(i.name.toLowerCase()))
    ) && !hasEnoughIngredients(recipe);
}

function setActiveFilter(el) {
    document.querySelectorAll('.recipeFilter').forEach(f => {
        f.classList.remove('recipeFilter-active');
        const line = f.querySelector('[class*="rounded-line-active"]');
        if (line) line.className = 'rounded-line';
    });
    el.classList.add('recipeFilter-active');
    const line = el.querySelector('.rounded-line');
    if (line) line.classList.add('rounded-line-active');
}

let currentFilter = 'all';

function getFilteredByCategory() {
    if (currentFilter === 'all') return recipes;
    if (currentFilter === 'access') return recipes.filter(hasEnoughIngredients);
    if (currentFilter === 'half') return recipes.filter(hasSomeIngredients);
    return recipes;
}

function applySearch() {
    const query = document.querySelector('.recipeSearchInt')?.value.toLowerCase().trim() || '';
    const filtered = getFilteredByCategory();
    if (!query) return filtered;
    return filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
    );
}

function update() {
    renderRecipes(applySearch());
}

document.getElementById('allRecipes').addEventListener('click', function () {
    setActiveFilter(this);
    currentFilter = 'all';
    update();
});

document.getElementById('accessRecipes').addEventListener('click', function () {
    setActiveFilter(this);
    currentFilter = 'access';
    update();
});

document.getElementById('halfRecipes').addEventListener('click', function () {
    setActiveFilter(this);
    currentFilter = 'half';
    update();
});

// Поиск рецептов
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.recipeSearchInt');
    if (searchInput) {
        searchInput.addEventListener('input', update);
    }
});

// Также вешаем на случай если DOMContentLoaded уже прошёл
setTimeout(() => {
    const searchInput = document.querySelector('.recipeSearchInt');
    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('input', update);
    }
}, 0);