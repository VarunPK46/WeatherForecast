let currentWeatherData = null;
let currentUnit = 'metric';

document.getElementById('toggleUnit').addEventListener('click', () => {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.getElementById('toggleUnit').textContent = currentUnit === 'metric' ? 'Show °F' : 'Show °C';
    if (currentWeatherData) {
        displayWeather(currentWeatherData);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('city').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
    document.getElementById('city').addEventListener('focus', () => {
        const recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
        const dropdown = document.getElementById('recentCitiesDropdown');
        if (recent.length > 0) dropdown.classList.remove('hidden');
    });
    document.getElementById('city').addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('recentCitiesDropdown').classList.add('hidden');
        }, 200);
    });
});


function displayWeather(data) {
    if (!data || !data.main) return;
    let tempC = data.main.temp;
    let temp = tempC;
    let unitSymbol = '°C';
    if (currentUnit === 'imperial') {
        temp = Math.round((tempC * 9/5) + 32);
        unitSymbol = '°F';
    } else {
        temp = Math.round(tempC);
    }

     const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // Change background based on weather
    const weatherMain = data.weather[0].main.toLowerCase();
    const body = document.body;
    body.classList.remove('bg-blue-50', 'bg-gray-400', 'bg-yellow-100', 'bg-blue-900', 'bg-gray-800', 'bg-blue-200');
    if (weatherMain.includes('rain')) {
        body.classList.add('bg-blue-900');
    } else if (weatherMain.includes('cloud')) {
        body.classList.add('bg-gray-400');
    } else if (weatherMain.includes('clear')) {
        body.classList.add('bg-yellow-100');
    } else if (weatherMain.includes('snow')) {
        body.classList.add('bg-blue-200');
    } else {
        body.classList.add('bg-blue-50');
    }

     document.getElementById('weatherResult').innerHTML =
        `<div class="flex flex-col items-center">
            <img src="${iconUrl}" alt="${data.weather[0].description}" class="w-24 h-24 mb-2 drop-shadow-lg">
            <p class="text-3xl font-bold text-blue-700 mb-1">${temp}${unitSymbol}</p>
            <p class="capitalize text-lg mb-2">${data.weather[0].description}</p>
            <div class="flex flex-wrap justify-center gap-4 mb-2">
                <div class="flex items-center gap-1 text-blue-600"><span class="material-icons">water_drop</span> ${data.main.humidity}%</div>
                <div class="flex items-center gap-1 text-green-600"><span class="material-icons">air</span> ${data.wind.speed} m/s</div>
            </div>
            <p class="text-sm text-gray-500">${data.name}, ${data.sys.country}</p>
        </div>`;
}



async function getWeather() {
    const apiKey = '20dd8cb5d228c9db295686c60a5128f3'; 
    const city = document.getElementById('city').value.trim();
    if (!city) {
        showError('Please enter a city name.');
        return;
    }
    document.getElementById('weatherResult').innerHTML = `<p>Fetching weather...</p>`;
    document.getElementById('forecastContainer').innerHTML = '';
     try {
        let recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
        recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
        recent.unshift(city);
        if (recent.length > 5) recent = recent.slice(0, 5);
        localStorage.setItem('recentCities', JSON.stringify(recent));
        updateRecentCitiesDropdown();

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        currentWeatherData = data;

        if (data.cod === 200) {
            displayWeather(data);
            getForecast(city);
        } else {
            showError('Please enter a valid city name (e.g., Mumbai or Mumbai,IN).');
        }
    } catch (error) {
        showError('Unable to fetch weather data. Please try again later.');
    }
}

async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }
    document.getElementById('weatherResult').innerHTML = `<p>Fetching your location...</p>`;
    document.getElementById('forecastContainer').innerHTML = '';
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const apiKey = '20dd8cb5d228c9db295686c60a5128f3';
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            currentWeatherData = data;

            if (data.cod === 200) {
                displayWeather(data);
                getForecast(data.name);
            } else {
                showError('Could not fetch weather for your location.');
            }
        } catch (error) {
            showError('Unable to fetch weather data. Please try again later.');
        }
    }, () => {
        showError('Unable to retrieve your location.');
    });
}

function updateRecentCitiesDropdown() {
    const dropdown = document.getElementById('recentCitiesDropdown');
    dropdown.innerHTML = '';
    const recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
    if (recent.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    dropdown.classList.remove('hidden');
    recent.forEach(city => {
        const option = document.createElement('div');
        option.className = 'px-4 py-2 hover:bg-blue-100 cursor-pointer';
        option.textContent = city;
        option.onclick = () => {
            document.getElementById('city').value = city;
            getWeather();
        };
        dropdown.appendChild(option);
    });
}
async function getForecast(city) {
    const apiKey = '20dd8cb5d228c9db295686c60a5128f3';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod !== "200") {
        document.getElementById('forecastContainer').innerHTML = '';
        return;
    }

    // Group by date, pick the forecast at 12:00 each day
    const daily = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        const hour = item.dt_txt.split(' ')[1];
        if (hour === "12:00:00") {
            daily[date] = item;
        }
    });

    // If less than 5 days at 12:00, fill with next available time
    let count = Object.keys(daily).length;
    if (count < 5) {
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = item;
        });
    }

    // Prepare cards
    let html = '';
    Object.keys(daily).slice(0, 5).forEach(date => {
        const item = daily[date];
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
        html += `
        <div class="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <div class="font-semibold mb-1">${new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <img src="${iconUrl}" alt="${item.weather[0].description}" class="w-12 h-12 mb-2">
            <div class="flex items-center mb-1">
                <span class="material-icons text-blue-500 mr-1">thermostat</span>
                <span>${Math.round(item.main.temp)}°C</span>
            </div>
            <div class="flex items-center mb-1">
                <span class="material-icons text-green-500 mr-1">air</span>
                <span>${item.wind.speed} m/s</span>
            </div>
            <div class="flex items-center">
                <span class="material-icons text-yellow-500 mr-1">water_drop</span>
                <span>${item.main.humidity}%</span>
            </div>
        </div>
        `;
    });
    document.getElementById('forecastContainer').innerHTML = html;
}
function showError(message) {
    document.getElementById('weatherResult').innerHTML =
        `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">${message}</span>
        </div>`;
    document.getElementById('forecastContainer').innerHTML = '';
}
window.onload = updateRecentCitiesDropdown;