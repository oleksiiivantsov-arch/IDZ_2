// ==========================================
// ВСТАВ СЮДИ СВІЙ КЛЮЧ З КАБІНЕТУ
// ==========================================
const API_KEY = ''; 

const API_URL = 'https://api.novaposhta.ua/v2.0/json/';

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchDepartments);
    }
});

// Функція для виконання запитів, яка не блокується системою безпеки file:///
function sendApiRequest(payload) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Не вдалося прочитати відповідь від сервера.'));
                }
            } else {
                reject(new Error('Помилка сервера Нової Пошти: ' + xhr.status));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Браузер заблокував запит. Відкрийте проєкт через VS Code (Live Server) або додайте прапорець безпеки.'));
        };
        
        xhr.send(JSON.stringify(payload));
    });
}

async function searchDepartments() {
    const cityName = document.getElementById('cityInput').value.trim();
    const list = document.getElementById('departmentsList');
    const info = document.getElementById('infoBlock');
    const errorBlock = document.getElementById('errorBlock');

    list.innerHTML = '';
    info.innerHTML = '';
    errorBlock.style.display = 'none';
    errorBlock.innerText = '';

    if (!API_KEY || API_KEY === '' || API_KEY === '') {
        showError('Помилка налаштування: Будь ласка, вкажіть ваш API_KEY у файлі script.js.');
        return;
    }

    if (!cityName) {
        showError('Будь ласка, введіть назву населеного пункту.');
        return;
    }

    try {
        info.innerText = 'Пошук міста...';

        // Крок 1: Шукаємо місто
        const cityData = await sendApiRequest({
            apiKey: API_KEY,
            modelName: 'Address',
            calledMethod: 'getCities',
            methodProperties: { FindByString: cityName }
        });

        if (!cityData.success || !cityData.data || cityData.data.length === 0) {
            throw new Error('Населений пункт не знайдено. Перевірте написання.');
        }

        const targetCity = cityData.data[0];
        const cityRef = targetCity.Ref;
        const cityDescription = targetCity.Description;

        info.innerText = `Завантаження відділень для: ${cityDescription}...`;

        // Крок 2: Шукаємо відділення
        const depData = await sendApiRequest({
            apiKey: API_KEY,
            modelName: 'Address',
            calledMethod: 'getWarehouses',
            methodProperties: { CityRef: cityRef }
        });

        if (!depData.success || !depData.data || depData.data.length === 0) {
            throw new Error(`У місті ${cityDescription} відділень не знайдено.`);
        }

        // Крок 3: Вивід на екран
        info.innerText = `Знайдено: ${cityDescription} (Всього: ${depData.data.length})`;

        depData.data.forEach(dep => {
            const li = document.createElement('li');
            const type = dep.TypeOfWarehouseRef === '9a68de85-7444-11e5-8d77-005056887b8d' ? '📦 Поштомат' : '🏢 Відділення';
            li.innerHTML = `
                <strong>${type} — ${dep.Description}</strong>
                <div class="address">${dep.ShortAddress}</div>
            `;
            list.appendChild(li);
        });

    } catch (error) {
        info.innerText = '';
        showError(error.message);
    }
}

function showError(message) {
    const errorBlock = document.getElementById('errorBlock');
    errorBlock.innerText = message;
    errorBlock.style.display = 'block';
}
// file:///D:/Web/idz2/index.html